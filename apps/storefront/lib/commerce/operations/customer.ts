"use server";

import { cookies } from "next/headers";

import type { CustomerOrder, CustomerOrderSummary, CustomerProfile } from "@/lib/types";

import { porulle, porulleApiUrl } from "../client";
import type { paths } from "../generated/api-types";

const COOKIE = "customer_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface CustomerSession {
  token: string;
  email: string;
  name: string | null;
  userId: string;
}

function encode(session: CustomerSession): string {
  return Buffer.from(JSON.stringify(session)).toString("base64url");
}

function decode(token: string | undefined): CustomerSession | null {
  if (!token) return null;
  try {
    const session = JSON.parse(Buffer.from(token, "base64url").toString()) as CustomerSession;
    return session;
  } catch {
    return null;
  }
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const cookieStore = await cookies();
  return decode(cookieStore.get(COOKIE)?.value);
}

export async function signInCustomer(email: string, password: string): Promise<{ error?: string; ok: boolean }> {
  const normalized = email.trim().toLowerCase();
  let res: Response;
  try {
    res = await fetch(`${porulleApiUrl}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: porulleApiUrl },
      body: JSON.stringify({ email: normalized, password }),
    });
  } catch {
    return { ok: false, error: "Cannot reach the commerce backend." };
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body.message ?? "Invalid email or password." };
  }
  const body = (await res.json()) as { token: string; user: { id: string; email: string; name: string | null } };
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, encode({
    token: body.token,
    email: body.user.email,
    name: body.user.name,
    userId: body.user.id,
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  // Carry any anonymous guest cart onto the now-signed-in shopper. Dynamic import
  // avoids a static import cycle (cart.ts reads getCustomerSession from here).
  const { migrateGuestCartToShopper } = await import("./cart");
  await migrateGuestCartToShopper(body.token);
  return { ok: true };
}

export async function signUpCustomer(
  email: string,
  password: string,
  name: string,
): Promise<{ error?: string; ok: boolean }> {
  const normalized = email.trim().toLowerCase();
  let res: Response;
  try {
    res = await fetch(`${porulleApiUrl}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: porulleApiUrl },
      body: JSON.stringify({ email: normalized, password, name }),
    });
  } catch {
    return { ok: false, error: "Cannot reach the commerce backend." };
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body.message ?? "Could not create account." };
  }
  const body = (await res.json()) as { token: string; user: { id: string; email: string; name: string | null } };
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, encode({
    token: body.token,
    email: body.user.email,
    name: body.user.name,
    userId: body.user.id,
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  const { migrateGuestCartToShopper } = await import("./cart");
  await migrateGuestCartToShopper(body.token);
  return { ok: true };
}

export async function signOutCustomer(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

function centsToMoney(amount: number, currency = "USD"): { amount: string; currencyCode: string } {
  return { amount: (amount / 100).toFixed(2), currencyCode: currency };
}

export async function getCustomerProfile(): Promise<CustomerProfile | undefined> {
  const session = await getCustomerSession();
  if (!session) return undefined;

  const res = await porulle.GET("/api/me/profile", {
    params: { header: { Authorization: `Bearer ${session.token}` } },
  } as never);
  if ((res as { error?: unknown }).error) {
    throw new Error("Failed to load your profile.");
  }

  const data = (res as { data?: { data?: { email?: string | null; firstName?: string | null; lastName?: string | null } } }).data?.data;
  if (!data) return undefined;

  return {
    email: data.email ?? session.email,
    firstName: data.firstName ?? session.name,
    lastName: data.lastName ?? null,
  };
}

export async function getCustomerOrders(): Promise<CustomerOrderSummary[]> {
  const session = await getCustomerSession();
  if (!session) return [];

  const res = await porulle.GET("/api/me/orders", {
    params: { header: { Authorization: `Bearer ${session.token}` } },
  } as never);
  if ((res as { error?: unknown }).error) {
    throw new Error("Failed to load your orders.");
  }

  const orders = (res as { data?: { data?: Array<{
    id: string;
    orderNumber: string;
    status: string;
    currency: string;
    grandTotal: number;
    placedAt: string;
    fulfilledAt: string | null;
    amountCaptured: number | null;
  }> } }).data?.data ?? [];

  return orders.map((o) => ({
    id: o.id,
    name: o.orderNumber,
    number: Number(o.orderNumber.replace(/\D/g, "")) || 0,
    financialStatus: o.amountCaptured != null && o.amountCaptured > 0 ? "PAID" : "PENDING",
    fulfillmentStatus: o.fulfilledAt ? "FULFILLED" : o.status === "cancelled" ? "CANCELLED" : "UNFULFILLED",
    processedAt: o.placedAt,
    totalPrice: centsToMoney(o.grandTotal, o.currency),
  }));
}

export async function getCustomerOrder(idOrNumber: string): Promise<CustomerOrder | undefined> {
  const session = await getCustomerSession();
  if (!session) return undefined;

  const res = await porulle.GET("/api/me/orders/{idOrNumber}", {
    params: { path: { idOrNumber }, header: { Authorization: `Bearer ${session.token}` } },
  } as never);
  if ((res as { error?: unknown }).error) {
    throw new Error("Failed to load order details.");
  }

  const o = (res as { data?: { data?: {
    id: string;
    orderNumber: string;
    status: string;
    currency: string;
    subtotal: number;
    taxTotal: number;
    shippingTotal: number;
    discountTotal: number;
    grandTotal: number;
    amountCaptured: number | null;
    placedAt: string;
    fulfilledAt: string | null;
    lineItems?: Array<{
      id: string;
      title?: string;
      sku?: string | null;
      quantity?: number;
      unitPrice?: number;
      totalPrice?: number;
      fulfillmentStatus?: string;
    }>;
    metadata?: { shippingAddress?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    } };
  } } }).data?.data;
  if (!o) return undefined;

  const addr = o.metadata?.shippingAddress;

  return {
    id: o.id,
    name: o.orderNumber,
    number: Number(o.orderNumber.replace(/\D/g, "")) || 0,
    financialStatus: o.amountCaptured != null && o.amountCaptured > 0 ? "PAID" : "PENDING",
    fulfillmentStatus: o.fulfilledAt ? "FULFILLED" : o.status === "cancelled" ? "CANCELLED" : "UNFULFILLED",
    processedAt: o.placedAt,
    totalPrice: centsToMoney(o.grandTotal, o.currency),
    lineItems: (o.lineItems ?? []).map((li) => ({
      id: li.id,
      title: li.title ?? "—",
      image: null,
      quantity: li.quantity ?? 0,
      totalPrice: centsToMoney(li.totalPrice ?? 0, o.currency),
      variantTitle: null,
    })) as CustomerOrder["lineItems"],
    shippingAddress: addr
      ? ({
          address1: addr.line1 ?? null,
          address2: addr.line2 ?? null,
          city: addr.city ?? null,
          territoryCode: addr.state ?? null,
          zip: addr.postalCode ?? null,
          id: "",
          formatted: [],
          isDefault: false,
          firstName: null,
          lastName: null,
          company: null,
          phoneNumber: null,
          zoneCode: null,
        } as CustomerOrder["shippingAddress"])
      : null,
    statusPageUrl: `/account/orders/${o.orderNumber}`,
    subtotal: centsToMoney(o.subtotal, o.currency),
    totalShipping: centsToMoney(o.shippingTotal, o.currency),
    totalTax: centsToMoney(o.taxTotal, o.currency),
  };
}
