import "server-only";

import {
  getAppliedDiscountsFromCookie,
  getCartIdFromCookie,
  invalidateCartCache,
  setAppliedDiscountsCookie,
  setCartIdCookie,
  type AppliedDiscount,
} from "@/lib/cart/server";
import type { Cart, CartWarning, DiscountAllocation, ProductDetails } from "@/lib/types";

import { porulleWrite } from "../client";
import { decodeMerchandiseId, toMoney, transformCart } from "../transforms";
import type { PorulleCart } from "../types/porulle";
import { getProductById } from "./products";
import { validatePromotionForCart } from "./promotions";

interface CartResult {
  cart: Cart;
  warnings: CartWarning[];
}

function cartFrom(data: unknown): PorulleCart {
  const cart = (data as { data: PorulleCart }).data;
  // A freshly created cart's response omits lineItems; normalize to an array.
  return { ...cart, lineItems: cart.lineItems ?? [] };
}

// Surface porulle API errors with their actual message. Without this a 403
// (e.g. the storefront key lacks cart:create) or 500 unwraps to a bare
// `Cannot read properties of undefined (reading 'data')`, hiding the real cause.
function assertOk(res: { error?: unknown }, action: string): void {
  const error = res.error as { code?: string; message?: string } | undefined;
  if (error) {
    const detail = error.message ?? error.code ?? "unknown error";
    throw new Error(`porulle: ${action} failed — ${detail}`);
  }
}

async function hydrate(cart: PorulleCart): Promise<Cart> {
  const entityIds = [...new Set(cart.lineItems.map((li) => li.entityId))];
  const products = await Promise.all(entityIds.map((id) => getProductById({ id })));
  const byEntity = new Map<string, ProductDetails>();
  for (const product of products) {
    if (product) byEntity.set(product.id, product);
  }
  return transformCart(cart, byEntity);
}

async function fetchPorulleCart(id: string): Promise<PorulleCart | undefined> {
  const res = await porulleWrite.GET("/api/carts/{id}", { params: { path: { id } } } as never);
  if ((res as { error?: unknown }).error) return undefined;
  return cartFrom((res as { data: unknown }).data);
}

// Reflect the applied codes onto the cart using the AUTHORITATIVE discount porulle
// already computed (stored in the cookie) — never a locally re-derived number.
// The chip is applicable; the discount row and total come from porulle's figure.
function reflectDiscounts(cart: Cart, applied: AppliedDiscount[]): Cart {
  if (applied.length === 0) return cart;
  const currency = cart.cost.subtotalAmount.currencyCode;
  const subtotalCents = Math.round(parseFloat(cart.cost.subtotalAmount.amount) * 100);
  const allocations: DiscountAllocation[] = [];
  let totalDiscountCents = 0;
  for (const d of applied) {
    if (d.totalDiscount > 0) {
      allocations.push({ kind: "code", code: d.code, discountedAmount: toMoney(d.totalDiscount, currency) });
      totalDiscountCents += d.totalDiscount;
    }
  }
  return {
    ...cart,
    discountCodes: applied.map((d) => ({ code: d.code, applicable: true })),
    discountAllocations: [...cart.discountAllocations, ...allocations],
    cost: { ...cart.cost, totalAmount: toMoney(Math.max(0, subtotalCents - totalDiscountCents), currency) },
  };
}

// Re-validate the currently-applied codes against a (possibly mutated) cart so
// the stored discount stays authoritative as the cart changes. Codes that no
// longer apply (e.g. cart fell below a minimum) are dropped. No-op — and no API
// call — when nothing is applied, so plain carts pay no cost here.
async function refreshAppliedDiscounts(porulleCart: PorulleCart): Promise<AppliedDiscount[]> {
  const applied = await getAppliedDiscountsFromCookie();
  if (applied.length === 0) return [];
  const refreshed: AppliedDiscount[] = [];
  for (const d of applied) {
    const result = await validatePromotionForCart(d.code, porulleCart);
    if (result.applicable) {
      refreshed.push({ code: d.code, totalDiscount: result.totalDiscount, freeShipping: result.freeShipping });
    }
  }
  await setAppliedDiscountsCookie(refreshed);
  return refreshed;
}

// cartId overrides the cookie — the AI agent (streaming route) passes it
// explicitly; server actions omit it and use the cart-id cookie.
export async function getCart(cartId?: string): Promise<Cart | undefined> {
  const id = cartId ?? (await getCartIdFromCookie());
  if (!id) return undefined;
  const porulleCart = await fetchPorulleCart(id);
  if (!porulleCart) return undefined;
  // Render path: reflect the stored authoritative discount without re-validating
  // (the /validate endpoint is rate-limited; re-validation happens on mutation).
  return reflectDiscounts(await hydrate(porulleCart), await getAppliedDiscountsFromCookie());
}

async function createPorulleCart(): Promise<PorulleCart> {
  const res = await porulleWrite.POST("/api/carts", { body: { currency: "USD" } } as never);
  assertOk(res as { error?: unknown }, "create cart");
  return cartFrom((res as { data: unknown }).data);
}

export async function createCart(): Promise<Cart> {
  const cart = await createPorulleCart();
  await setCartIdCookie(cart.id);
  return hydrate(cart);
}

export async function createCartWithoutCookie(_locale?: string): Promise<{ cart: Cart; cartId: string }> {
  const cart = await createPorulleCart();
  return { cart: await hydrate(cart), cartId: cart.id };
}

async function ensureCartId(): Promise<string> {
  const existing = await getCartIdFromCookie();
  if (existing) {
    const cart = await fetchPorulleCart(existing);
    if (cart && cart.status === "active") return existing;
  }
  const created = await createPorulleCart();
  await setCartIdCookie(created.id);
  return created.id;
}

export async function addToCart(
  lines: Array<{ merchandiseId: string; quantity: number }>,
  explicitCartId?: string,
  _locale?: string,
): Promise<CartResult> {
  const cartId = explicitCartId ?? (await ensureCartId());
  for (const line of lines) {
    const { entityId, variantId } = decodeMerchandiseId(line.merchandiseId);
    const res = await porulleWrite.POST("/api/carts/{id}/items", {
      params: { path: { id: cartId } },
      body: { entityId, ...(variantId ? { variantId } : {}), quantity: line.quantity },
    } as never);
    assertOk(res as { error?: unknown }, "add cart item");
  }
  invalidateCartCache();
  const porulleCart = await fetchPorulleCart(cartId);
  if (!porulleCart) return { cart: emptyCart(cartId), warnings: [] };
  // Cart contents changed → re-validate applied codes so the discount stays authoritative.
  const applied = await refreshAppliedDiscounts(porulleCart);
  return { cart: reflectDiscounts(await hydrate(porulleCart), applied), warnings: [] };
}

export async function updateCart(
  lines: Array<{ id: string; quantity: number }>,
  explicitCartId?: string,
): Promise<CartResult> {
  const cartId = explicitCartId ?? (await getCartIdFromCookie());
  if (!cartId) return { cart: emptyCart(), warnings: [] };
  for (const line of lines) {
    await porulleWrite.PATCH("/api/carts/{id}/items/{itemId}", {
      params: { path: { id: cartId, itemId: line.id } },
      body: { quantity: line.quantity },
    } as never);
  }
  invalidateCartCache();
  const porulleCart = await fetchPorulleCart(cartId);
  if (!porulleCart) return { cart: emptyCart(cartId), warnings: [] };
  // Cart contents changed → re-validate applied codes so the discount stays authoritative.
  const applied = await refreshAppliedDiscounts(porulleCart);
  return { cart: reflectDiscounts(await hydrate(porulleCart), applied), warnings: [] };
}

export async function removeFromCart(itemIds: string[], explicitCartId?: string): Promise<CartResult> {
  const cartId = explicitCartId ?? (await getCartIdFromCookie());
  if (!cartId) return { cart: emptyCart(), warnings: [] };
  for (const itemId of itemIds) {
    await porulleWrite.DELETE("/api/carts/{id}/items/{itemId}", {
      params: { path: { id: cartId, itemId } },
    } as never);
  }
  invalidateCartCache();
  const porulleCart = await fetchPorulleCart(cartId);
  if (!porulleCart) return { cart: emptyCart(cartId), warnings: [] };
  // Cart contents changed → re-validate applied codes so the discount stays authoritative.
  const applied = await refreshAppliedDiscounts(porulleCart);
  return { cart: reflectDiscounts(await hydrate(porulleCart), applied), warnings: [] };
}

// porulle has no cart-level buyer identity / note surface — these keep the
// storefront's action signatures working as no-ops over the current cart.
export async function updateCartBuyerIdentity(_locale: string): Promise<CartResult | null> {
  const cart = await getCart();
  return cart ? { cart, warnings: [] } : null;
}

export async function updateCartNote(_note: string, cartId?: string): Promise<CartResult | null> {
  const cart = await getCart(cartId);
  return cart ? { cart, warnings: [] } : null;
}

// Sets the cart's applied discount codes to exactly `codes`. Each is validated
// against the current cart via porulle's /api/promotions/validate, which returns
// the AUTHORITATIVE discount (the same figure checkout applies). Applicable codes
// are persisted with that figure; codes that don't apply come back with
// `applicable: false` (and a warning) so the caller can reject them.
export async function updateCartDiscountCodes(codes: string[]): Promise<CartResult | null> {
  const cartId = await getCartIdFromCookie();
  if (!cartId) return null;
  const porulleCart = await fetchPorulleCart(cartId);
  if (!porulleCart) return null;

  const wanted = [...new Set(codes.map((c) => c.trim().toUpperCase()).filter(Boolean))];
  const applied: AppliedDiscount[] = [];
  const rejected: string[] = [];
  let reason: string | undefined;

  for (const code of wanted) {
    const result = await validatePromotionForCart(code, porulleCart);
    if (result.applicable) {
      applied.push({ code, totalDiscount: result.totalDiscount, freeShipping: result.freeShipping });
    } else {
      rejected.push(code);
      reason = result.reason;
    }
  }

  await setAppliedDiscountsCookie(applied);
  invalidateCartCache();

  const cart = reflectDiscounts(await hydrate(porulleCart), applied);
  // Surface rejected codes as non-applicable chips so the action layer detects
  // and reverts them (it inspects `applicable`).
  const withRejected: Cart = {
    ...cart,
    discountCodes: [...cart.discountCodes, ...rejected.map((code) => ({ code, applicable: false }))],
  };
  const warnings: CartWarning[] = rejected.length
    ? [{ code: "DISCOUNT_NOT_APPLICABLE", message: reason ?? "That discount code can't be applied to this cart.", target: "discountCode" }]
    : [];
  return { cart: withRejected, warnings };
}

function emptyCart(id?: string): Cart {
  return {
    appliedGiftCards: [],
    checkoutUrl: "/checkout",
    cost: { subtotalAmount: { amount: "0.00", currencyCode: "USD" }, totalAmount: { amount: "0.00", currencyCode: "USD" } },
    discountAllocations: [],
    discountCodes: [],
    id,
    lines: [],
    note: null,
    shippingCost: null,
    totalQuantity: 0,
  };
}
