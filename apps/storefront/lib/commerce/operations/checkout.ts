import "server-only";

import { getCartIdFromCookie } from "@/lib/cart/server";

import { porulleWrite } from "../client";

export interface ShippingAddress {
  city: string;
  country: string;
  line1: string;
  line2?: string;
  postalCode: string;
  state?: string;
}

export interface CheckoutResult {
  clientSecret: string | null;
  currency: string;
  grandTotal: number;
  orderId: string;
  orderNumber: string;
}

interface PorulleOrder {
  currency: string;
  grandTotal: number;
  id: string;
  orderNumber: string;
  paymentClientSecret?: string | null;
  status: string;
}

// Runs porulle's checkout pipeline: validates the cart, resolves prices, reserves
// inventory, creates a Stripe PaymentIntent via @porulle/adapter-stripe, and
// creates the order. Returns the Stripe client secret for the Payment Element.
export async function createCheckout(input: {
  email?: string;
  promotionCodes?: string[];
  shippingAddress: ShippingAddress;
}): Promise<CheckoutResult> {
  const cartId = await getCartIdFromCookie();
  if (!cartId) throw new Error("Your cart is empty.");

  const res = await porulleWrite.POST("/api/checkout", {
    body: {
      cartId,
      paymentMethodId: "stripe",
      currency: "USD",
      shippingAddress: input.shippingAddress,
      ...(input.promotionCodes?.length ? { promotionCodes: input.promotionCodes } : {}),
    },
  } as never);

  const error = (res as { error?: { error?: { message?: string } } }).error;
  const order = (res as { data?: { data?: PorulleOrder } }).data?.data;
  if (error || !order) {
    throw new Error(error?.error?.message ?? "Checkout failed. Please try again.");
  }

  return {
    clientSecret: order.paymentClientSecret ?? null,
    currency: order.currency,
    grandTotal: order.grandTotal,
    orderId: order.id,
    orderNumber: order.orderNumber,
  };
}
