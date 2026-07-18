import { notFound } from "next/navigation";
import { getCustomerOrder } from "@/lib/commerce/operations/customer";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getCustomerOrder(id);
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">{order.name}</h2>
          <p className="text-xs text-muted-foreground">
            {new Date(order.processedAt).toLocaleDateString()} · {order.fulfillmentStatus}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">
            {order.totalPrice.amount} {order.totalPrice.currencyCode}
          </p>
          <p className="text-xs text-muted-foreground">{order.financialStatus}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border p-4">
        <h3 className="text-sm font-medium">Summary</h3>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{order.subtotal ? `${order.subtotal.amount} ${order.subtotal.currencyCode}` : "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd>{order.totalShipping ? `${order.totalShipping.amount} ${order.totalShipping.currencyCode}` : "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Tax</dt>
            <dd>{order.totalTax ? `${order.totalTax.amount} ${order.totalTax.currencyCode}` : "—"}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-1 font-medium">
            <dt>Total</dt>
            <dd>{order.totalPrice.amount} {order.totalPrice.currencyCode}</dd>
          </div>
        </dl>
      </div>

      <a href="/account/orders" className="text-sm font-medium underline">← Back to orders</a>
    </div>
  );
}
