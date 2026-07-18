"use server";

import {
  clearAppliedDiscountsCookie,
  clearCartIdCookie,
  getAppliedDiscountsFromCookie,
  invalidateCartCache,
} from "@/lib/cart/server";
import { createCheckout, type ShippingAddress } from "@/lib/commerce/operations/checkout";

export interface CheckoutActionResult {
  clientSecret?: string | null;
  error?: string;
  orderId?: string;
  orderNumber?: string;
  success: boolean;
}

export async function createCheckoutAction(input: {
  email?: string;
  shippingAddress: ShippingAddress;
}): Promise<CheckoutActionResult> {
  try {
    // Carry the applied discount codes so porulle applies them at order creation
    // (the authoritative discount — matching what the cart previewed).
    const applied = await getAppliedDiscountsFromCookie();
    const result = await createCheckout({
      ...input,
      ...(applied.length ? { promotionCodes: applied.map((d) => d.code) } : {}),
    });
    // The cart was consumed by checkout; start fresh.
    await clearCartIdCookie();
    await clearAppliedDiscountsCookie();
    invalidateCartCache();
    return {
      success: true,
      clientSecret: result.clientSecret,
      orderId: result.orderId,
      orderNumber: result.orderNumber,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Checkout failed. Please try again.",
    };
  }
}
