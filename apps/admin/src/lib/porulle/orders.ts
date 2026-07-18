import 'server-only';
import { porulle } from './client';

export interface AdminOrder {
  currency: string;
  id: string;
  orderNumber: string;
  placedAt: string;
  status: string;
  total: number;
  totalLabel: string;
}

interface PorulleOrder {
  createdAt?: string;
  currency?: string;
  grandTotal?: number;
  id: string;
  orderNumber?: string;
  placedAt?: string;
  status?: string;
}

function money(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

export async function listOrders(): Promise<AdminOrder[]> {
  const res = (await porulle.GET('/api/orders', {
    params: { query: { limit: 100, sort: 'createdAt:desc' } }
  } as never)) as { data?: unknown; error?: unknown };
  const orders = ((res.data as { data?: PorulleOrder[] })?.data ?? []) as PorulleOrder[];
  return orders.map(toSummary);
}

// Fuzzy, receipt-less lookup for support ("customer called, no order #").
export async function lookupOrders(q: string): Promise<AdminOrder[]> {
  if (!q.trim()) return [];
  const res = (await porulle.GET('/api/orders/lookup', {
    params: { query: { q } }
  } as never)) as { data?: unknown; error?: unknown };
  const items = ((res.data as { data?: { items?: PorulleOrder[] } })?.data?.items ?? []) as PorulleOrder[];
  return items.map(toSummary);
}

function toSummary(o: PorulleOrder): AdminOrder {
  const currency = o.currency ?? 'USD';
  const total = o.grandTotal ?? 0;
  return {
    id: o.id,
    orderNumber: o.orderNumber ?? o.id.slice(0, 8),
    status: o.status ?? 'pending',
    currency,
    total,
    totalLabel: money(total, currency),
    placedAt: o.placedAt ?? o.createdAt ?? ''
  };
}

// porulle's default order state machine (kernel/state-machine/machine.ts). The
// starter uses the default, so these are the transitions the PATCH status route
// will accept — we render exactly the allowed next states as actions.
export const ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['partially_fulfilled', 'fulfilled', 'cancelled'],
  partially_fulfilled: ['fulfilled', 'cancelled'],
  fulfilled: ['refunded'],
  cancelled: [],
  refunded: []
};

export interface AdminOrderLine {
  fulfillmentStatus: string;
  id: string;
  quantity: number;
  sku: string | null;
  title: string;
  totalLabel: string;
  unitPriceLabel: string;
}

export interface AdminAddress {
  city: string;
  country: string;
  line1: string;
  line2: string;
  postalCode: string;
  state: string;
}

export interface AdminOrderDetail extends AdminOrder {
  allowedTransitions: string[];
  amountCaptured: number;
  customerId: string | null;
  discountLabel: string;
  grandTotalLabel: string;
  lineItems: AdminOrderLine[];
  paymentMethod: string | null;
  shippingAddress: AdminAddress | null;
  shippingLabel: string;
  subtotalLabel: string;
  taxLabel: string;
}

interface PorulleOrderDetail extends PorulleOrder {
  customerId?: string | null;
  discountTotal?: number;
  grandTotal?: number;
  lineItems?: Array<{
    fulfillmentStatus?: string;
    id: string;
    quantity?: number;
    sku?: string | null;
    title?: string;
    totalPrice?: number;
    unitPrice?: number;
  }>;
  amountCaptured?: number | null;
  metadata?: { shippingAddress?: Partial<AdminAddress> };
  paymentMethodId?: string | null;
  shippingTotal?: number;
  subtotal?: number;
  taxTotal?: number;
}

export async function getOrder(idOrNumber: string): Promise<AdminOrderDetail | null> {
  const res = (await porulle.GET('/api/orders/{idOrNumber}', {
    params: { path: { idOrNumber } }
  } as never)) as { data?: unknown; error?: unknown };
  if (res.error) return null;
  const o = (res.data as { data?: PorulleOrderDetail })?.data;
  if (!o) return null;
  const currency = o.currency ?? 'USD';
  const addr = o.metadata?.shippingAddress;
  return {
    ...toSummary(o),
    customerId: o.customerId ?? null,
    paymentMethod: o.paymentMethodId ?? null,
    amountCaptured: o.amountCaptured ?? 0,
    subtotalLabel: money(o.subtotal ?? 0, currency),
    shippingLabel: money(o.shippingTotal ?? 0, currency),
    taxLabel: money(o.taxTotal ?? 0, currency),
    discountLabel: money(o.discountTotal ?? 0, currency),
    grandTotalLabel: money(o.grandTotal ?? 0, currency),
    allowedTransitions: ORDER_TRANSITIONS[o.status ?? 'pending'] ?? [],
    shippingAddress: addr
      ? {
          line1: addr.line1 ?? '',
          line2: addr.line2 ?? '',
          city: addr.city ?? '',
          state: addr.state ?? '',
          postalCode: addr.postalCode ?? '',
          country: addr.country ?? ''
        }
      : null,
    lineItems: (o.lineItems ?? []).map((li) => ({
      id: li.id,
      title: li.title ?? '—',
      sku: li.sku ?? null,
      quantity: li.quantity ?? 0,
      unitPriceLabel: money(li.unitPrice ?? 0, currency),
      totalLabel: money(li.totalPrice ?? 0, currency),
      fulfillmentStatus: li.fulfillmentStatus ?? 'unfulfilled'
    }))
  };
}

export interface AdminFulfillmentLine {
  id: string;
  quantity: number;
  title: string;
}

export interface AdminFulfillment {
  id: string;
  carrier: string | null;
  itemCount: number;
  lineItems: AdminFulfillmentLine[];
  status: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  type: string;
}

// 0.10.2: GET /api/orders/{id}/fulfillments returns creations from the POST
// endpoint below (carrier, tracking, per-line quantities). The starter
// surfaces everything including tracking links on the detail card.
export async function getFulfillments(orderId: string): Promise<AdminFulfillment[]> {
  const res = (await porulle.GET('/api/orders/{id}/fulfillments', {
    params: { path: { id: orderId } }
  } as never)) as { data?: unknown; error?: unknown };
  const rows = ((res.data as { data?: Array<Record<string, unknown>> })?.data ?? []) as Array<
    Record<string, unknown>
  >;
  return rows.map((f) => {
    const lis = (Array.isArray(f.lineItems) ? (f.lineItems as Array<Record<string, unknown>>) : []).map(
      (li) => ({
        id: String(li.id),
        quantity: Number(li.quantity ?? 0),
        title: String(li.title ?? '')
      })
    );
    return {
      id: String(f.id),
      type: String(f.type ?? 'physical'),
      status: String(f.status ?? 'pending'),
      itemCount: lis.length,
      carrier: typeof f.carrier === 'string' ? (f.carrier as string) : null,
      trackingNumber: typeof f.trackingNumber === 'string' ? (f.trackingNumber as string) : null,
      trackingUrl: typeof f.trackingUrl === 'string' ? (f.trackingUrl as string) : null,
      lineItems: lis
    };
  });
}

export interface CreateFulfillmentInput {
  lineItems: { orderLineItemId: string; quantity: number }[];
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  type?: string;
}

// POST /api/orders/{id}/fulfillments — supports partial fulfillment (select
// which line items and how many of each) plus optional carrier/tracking.
export async function createFulfillment(
  orderId: string,
  input: CreateFulfillmentInput
): Promise<{ error?: string }> {
  const res = (await porulle.POST('/api/orders/{id}/fulfillments', {
    params: { path: { id: orderId } },
    body: input
  } as never)) as { error?: { error?: { message?: string } } };
  return res.error ? { error: errMsg(res, 'Failed to create fulfillment.') } : {};
}

export async function setOrderStatus(
  id: string,
  status: string,
  reason?: string
): Promise<{ error?: string }> {
  const res = (await porulle.PATCH('/api/orders/{id}/status', {
    params: { path: { id } },
    body: reason ? { status, reason } : { status }
  } as never)) as { error?: { error?: { message?: string } } };
  if (res.error) return { error: res.error.error?.message ?? 'Failed to update order status.' };
  return {};
}

function errMsg(res: { error?: { error?: { message?: string } } }, fallback: string): string {
  return res.error?.error?.message ?? fallback;
}

// Capture the authorized payment via porulle's payment adapter (0.7.0+).
export async function captureOrder(id: string): Promise<{ error?: string }> {
  const res = (await porulle.POST('/api/orders/{id}/capture', {
    params: { path: { id } },
    body: {}
  } as never)) as { error?: { error?: { message?: string } } };
  return res.error ? { error: errMsg(res, 'Failed to capture payment.') } : {};
}

// Line-item edits (0.10.0+)
export async function addOrderLineItem(
  orderId: string,
  line: { entityId: string; quantity: number; title: string; unitPrice: number }
): Promise<{ error?: string }> {
  const res = (await porulle.POST('/api/orders/{id}/line-items', {
    params: { path: { id: orderId } },
    body: {
      entityId: line.entityId,
      entityType: 'product',
      title: line.title,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      totalPrice: line.unitPrice * line.quantity,
    }
  } as never)) as { error?: { error?: { message?: string } } };
  return res.error ? { error: errMsg(res, 'Failed to add line item.') } : {};
}

export async function updateOrderLineItem(
  orderId: string,
  lineItemId: string,
  quantity: number
): Promise<{ error?: string }> {
  const res = (await porulle.PATCH('/api/orders/{id}/line-items/{lineItemId}', {
    params: { path: { id: orderId, lineItemId } },
    body: { quantity }
  } as never)) as { error?: { error?: { message?: string } } };
  return res.error ? { error: errMsg(res, 'Failed to update line item.') } : {};
}

export async function removeOrderLineItem(
  orderId: string,
  lineItemId: string
): Promise<{ error?: string }> {
  const res = (await porulle.DELETE('/api/orders/{id}/line-items/{lineItemId}', {
    params: { path: { id: orderId, lineItemId } }
  } as never)) as { error?: { error?: { message?: string } } };
  return res.error ? { error: errMsg(res, 'Failed to remove line item.') } : {};
}

// Refund the captured payment and transition the order to `refunded` (0.7.0+).
export async function refundOrder(id: string, reason: string): Promise<{ error?: string }> {
  const res = (await porulle.POST('/api/orders/{id}/refund', {
    params: { path: { id } },
    body: reason ? { reason } : {}
  } as never)) as { error?: { error?: { message?: string } } };
  return res.error ? { error: errMsg(res, 'Failed to refund order.') } : {};
}

export interface DraftOrderLine {
  entityId: string;
  quantity: number;
  title: string;
  unitPrice: number; // minor units
}

export interface DraftOrderAddress {
  line1: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface DraftOrderInput {
  lines: DraftOrderLine[];
  shippingAddress?: DraftOrderAddress;
  promotionCodes?: string[];
  customerId?: string;
}

export interface OrderQuote {
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  grandTotal: number;
}

// Quote a draft order's charges via porulle's /api/orders/quote (0.10.3+). Tax,
// shipping and discount come from the SAME pipeline checkout runs, so the preview
// equals what the order is actually charged — never client-computed.
export async function quoteDraftOrder(
  input: DraftOrderInput
): Promise<{ quote?: OrderQuote; error?: string }> {
  const res = (await porulle.POST('/api/orders/quote', {
    body: {
      currency: 'USD',
      lineItems: input.lines.map((l) => ({
        entityId: l.entityId,
        entityType: 'product',
        quantity: l.quantity,
        title: l.title,
      })),
      ...(input.customerId ? { customerId: input.customerId } : {}),
      ...(input.promotionCodes?.length ? { promotionCodes: input.promotionCodes } : {}),
      ...(input.shippingAddress ? { shippingAddress: input.shippingAddress } : {}),
    },
  } as never)) as { data?: { data?: OrderQuote }; error?: { error?: { message?: string } } };
  if (res.error) return { error: errMsg(res, 'Failed to quote order.') };
  const q = res.data?.data;
  return q
    ? { quote: { subtotal: q.subtotal, discountTotal: q.discountTotal, shippingTotal: q.shippingTotal, taxTotal: q.taxTotal, grandTotal: q.grandTotal } }
    : { error: 'No quote returned.' };
}

// Create a manual / draft order (0.10.3+). Charges are re-quoted server-side via
// /api/orders/quote (authoritative — same math as checkout), never trusting a
// client-supplied total.
export async function createDraftOrder(
  input: DraftOrderInput
): Promise<{ error?: string; id?: string }> {
  const { lines } = input;
  const quoted = await quoteDraftOrder(input);
  if (quoted.error || !quoted.quote) return { error: quoted.error ?? 'Failed to price order.' };
  const q = quoted.quote;
  const res = (await porulle.POST('/api/orders', {
    body: {
      currency: 'USD',
      subtotal: q.subtotal,
      taxTotal: q.taxTotal,
      shippingTotal: q.shippingTotal,
      discountTotal: q.discountTotal,
      grandTotal: q.grandTotal,
      paymentMethodId: 'stripe',
      ...(input.customerId ? { customerId: input.customerId } : {}),
      lineItems: lines.map((l) => ({
        entityId: l.entityId,
        entityType: 'product',
        title: l.title,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        totalPrice: l.unitPrice * l.quantity
      }))
    }
  } as never)) as { data?: { data?: { id: string } }; error?: { error?: { message?: string } } };
  if (res.error) return { error: errMsg(res, 'Failed to create order.') };
  return { id: res.data?.data?.id };
}
