import "server-only";
import { revalidateTag, updateTag } from "next/cache";
import { cookies } from "next/headers";

const CART_ID_COOKIE = "porulle_cartId";
const CART_ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function getCartIdFromCookie(): Promise<string | undefined> {
  return (await cookies()).get(CART_ID_COOKIE)?.value;
}

export async function setCartIdCookie(id: string): Promise<void> {
  (await cookies()).set(CART_ID_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: CART_ID_COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearCartIdCookie(): Promise<void> {
  (await cookies()).delete(CART_ID_COOKIE);
}

// Porulle applies promotions at checkout, not on the cart, so the cart never
// persists discount codes. The storefront tracks applied codes here — together
// with the AUTHORITATIVE discount porulle computed for them (never a locally
// re-derived number, which would drift from what checkout charges).
const DISCOUNT_CODES_COOKIE = "porulle_discountCodes";

/** An applied code plus the discount porulle computed for the current cart (minor units). */
export interface AppliedDiscount {
  code: string;
  totalDiscount: number;
  freeShipping: boolean;
}

export async function getAppliedDiscountsFromCookie(): Promise<AppliedDiscount[]> {
  const raw = (await cookies()).get(DISCOUNT_CODES_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (d): d is AppliedDiscount =>
        typeof d?.code === "string" &&
        typeof d?.totalDiscount === "number" &&
        typeof d?.freeShipping === "boolean",
    );
  } catch {
    return [];
  }
}

export async function setAppliedDiscountsCookie(discounts: AppliedDiscount[]): Promise<void> {
  const jar = await cookies();
  if (discounts.length === 0) {
    jar.delete(DISCOUNT_CODES_COOKIE);
    return;
  }
  jar.set(DISCOUNT_CODES_COOKIE, JSON.stringify(discounts), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: CART_ID_COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearAppliedDiscountsCookie(): Promise<void> {
  (await cookies()).delete(DISCOUNT_CODES_COOKIE);
}

/** Streaming contexts can't call cookies().set(); they must emit Set-Cookie via response headers. */
export function buildCartIdSetCookieHeader(id: string): string {
  const secure = process.env.NODE_ENV === "production";
  return `${CART_ID_COOKIE}=${id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${CART_ID_COOKIE_MAX_AGE}${secure ? "; Secure" : ""}`;
}

export function invalidateCartCache(): void {
  try {
    updateTag("cart");
  } catch {
    // Fallback when used outside of server actions where updateTag is not available
    revalidateTag("cart", { expire: 0 });
  }
}
