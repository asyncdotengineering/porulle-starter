import "server-only";

import { porulleWrite } from "../client";
import type { PorulleCart } from "../types/porulle";

/**
 * The result of validating a promotion code against a cart. `totalDiscount` is
 * the AUTHORITATIVE amount porulle computed (minor units) — the same value
 * checkout will apply — so the cart shows exactly what the order will be charged.
 */
export interface PromotionValidation {
  applicable: boolean;
  totalDiscount: number;
  freeShipping: boolean;
  reason?: string;
}

// The starter sells `product` entities; cart lines don't carry an entity type.
const CART_ENTITY_TYPE = "product";

export async function validatePromotionForCart(
  code: string,
  cart: PorulleCart,
): Promise<PromotionValidation> {
  const lineItems = cart.lineItems.map((li) => ({
    entityId: li.entityId,
    entityType: CART_ENTITY_TYPE,
    quantity: li.quantity,
    unitPrice: li.unitPriceSnapshot,
    totalPrice: li.unitPriceSnapshot * li.quantity,
  }));
  const subtotal = lineItems.reduce((sum, li) => sum + li.totalPrice, 0);

  const res = await porulleWrite.POST("/api/promotions/validate", {
    body: { code, currency: cart.currency, subtotal, lineItems },
  } as never);

  // An invalid or inapplicable code comes back as an error (404 / 400 / 422).
  const error = (res as { error?: { error?: { message?: string } } }).error;
  if (error) {
    return {
      applicable: false,
      totalDiscount: 0,
      freeShipping: false,
      reason: error.error?.message ?? "That discount code can't be applied to this cart.",
    };
  }

  const data = (
    res as { data?: { data?: { totalDiscount?: number; freeShipping?: boolean } } }
  ).data?.data;
  return {
    applicable: true,
    totalDiscount: data?.totalDiscount ?? 0,
    freeShipping: data?.freeShipping ?? false,
  };
}
