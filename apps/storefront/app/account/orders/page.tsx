import { getCustomerOrders } from "@/lib/commerce/operations/customer";

export default async function OrdersPage() {
  const orders = await getCustomerOrders();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Order history</h2>
      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">You haven&apos;t placed any orders yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {orders.map((order) => (
            <li key={order.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">
                  <a href={`/account/orders/${order.name}`} className="hover:underline">
                    {order.name}
                  </a>
                </p>
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
