'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import {
  addOrderLineItem,
  captureOrder,
  createDraftOrder,
  createFulfillment,
  quoteDraftOrder,
  refundOrder,
  removeOrderLineItem,
  setOrderStatus,
  updateOrderLineItem,
  type CreateFulfillmentInput,
  type DraftOrderInput,
  type DraftOrderLine,
  type OrderQuote
} from '@/lib/porulle/orders';
import { searchCatalog } from '@/lib/porulle/search';
import { getProductPrice } from '@/lib/porulle/products';

export interface OrderableProduct {
  entityId: string;
  priceLabel: string;
  title: string;
  unitPrice: number;
}

export async function searchOrderableAction(q: string): Promise<OrderableProduct[]> {
  await requireAdmin();
  const hits = (await searchCatalog(q)).filter((h) => h.type === 'product');
  return Promise.all(
    hits.map(async (h) => {
      const unitPrice = await getProductPrice(h.id);
      return {
        entityId: h.id,
        title: h.title,
        unitPrice,
        priceLabel: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
          unitPrice / 100
        )
      };
    })
  );
}

export async function changeOrderStatusAction(
  id: string,
  status: string
): Promise<{ error?: string }> {
  await requireAdmin();
  const result = await setOrderStatus(id, status);
  if (!result.error) {
    revalidatePath(`/dashboard/orders/${id}`);
    revalidatePath('/dashboard/orders');
  }
  return result;
}

export async function captureOrderAction(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const result = await captureOrder(id);
  if (!result.error) revalidatePath(`/dashboard/orders/${id}`);
  return result;
}

export async function refundOrderAction(id: string, reason = 'Refunded from admin'): Promise<{ error?: string }> {
  await requireAdmin();
  const result = await refundOrder(id, reason);
  if (!result.error) {
    revalidatePath(`/dashboard/orders/${id}`);
    revalidatePath('/dashboard/orders');
  }
  return result;
}

export async function quoteDraftOrderAction(
  input: DraftOrderInput
): Promise<{ quote?: OrderQuote; error?: string }> {
  await requireAdmin();
  if (input.lines.length === 0) return {};
  return quoteDraftOrder(input);
}

export async function createDraftOrderAction(
  input: DraftOrderInput
): Promise<{ error?: string }> {
  await requireAdmin();
  if (input.lines.length === 0) return { error: 'Add at least one item.' };
  const result = await createDraftOrder(input);
  if (result.error) return { error: result.error };
  revalidatePath('/dashboard/orders');
  redirect(result.id ? `/dashboard/orders/${result.id}` : '/dashboard/orders');
}

export async function createFulfillmentAction(
  orderId: string,
  input: CreateFulfillmentInput
): Promise<{ error?: string }> {
  await requireAdmin();
  if (input.lineItems.length === 0) return { error: 'Select at least one line item.' };
  const result = await createFulfillment(orderId, input);
  if (!result.error) revalidatePath(`/dashboard/orders/${orderId}`);
  return result;
}

export async function addOrderLineItemAction(
  orderId: string,
  line: { entityId: string; quantity: number; title: string; unitPrice: number }
): Promise<{ error?: string }> {
  await requireAdmin();
  const result = await addOrderLineItem(orderId, line);
  if (!result.error) revalidatePath(`/dashboard/orders/${orderId}`);
  return result;
}

export async function updateOrderLineItemAction(
  orderId: string,
  lineItemId: string,
  quantity: number
): Promise<{ error?: string }> {
  await requireAdmin();
  const result = await updateOrderLineItem(orderId, lineItemId, quantity);
  if (!result.error) revalidatePath(`/dashboard/orders/${orderId}`);
  return result;
}

export async function removeOrderLineItemAction(
  orderId: string,
  lineItemId: string
): Promise<{ error?: string }> {
  await requireAdmin();
  const result = await removeOrderLineItem(orderId, lineItemId);
  if (!result.error) revalidatePath(`/dashboard/orders/${orderId}`);
  return result;
}
