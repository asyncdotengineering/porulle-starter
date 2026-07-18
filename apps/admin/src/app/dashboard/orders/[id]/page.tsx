import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { getOrder, getFulfillments } from '@/lib/porulle/orders';
import { OrderStatusActions } from '@/features/orders/order-status-actions';
import { PaymentActions } from '@/features/orders/payment-actions';
import { FulfillmentCreate } from '@/features/orders/fulfillment-create';
import { LineItemEditor } from '@/features/orders/line-item-editor';
import { ORDER_STATUS_STYLE } from '@/features/orders/orders-columns';

export const dynamic = 'force-dynamic';

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className='flex items-center justify-between text-sm'>
      <span className='text-muted-foreground'>{label}</span>
      <span className={cn('tabular-nums', strong && 'font-semibold')}>{value}</span>
    </div>
  );
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();
  const fulfillments = await getFulfillments(order.id);

  const addr = order.shippingAddress;

  return (
    <PageContainer pageTitle={`Order ${order.orderNumber}`} pageDescription='Review and fulfill this order.'>
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
        <div className='flex flex-col gap-4 lg:col-span-2'>
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <LineItemEditor orderId={order.id} lineItems={order.lineItems} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Summary</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              <Row label='Subtotal' value={order.subtotalLabel} />
              <Row label='Shipping' value={order.shippingLabel} />
              <Row label='Tax' value={order.taxLabel} />
              <Row label='Discount' value={order.discountLabel} />
              <Separator className='my-2' />
              <Row label='Total' value={order.grandTotalLabel} strong />
            </CardContent>
          </Card>
        </div>

        <div className='flex flex-col gap-4'>
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Status</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <Badge
                variant='outline'
                className={cn('capitalize', ORDER_STATUS_STYLE[order.status])}
              >
                {order.status.replace(/_/g, ' ')}
              </Badge>
              <OrderStatusActions id={order.id} allowed={order.allowedTransitions} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Shipping</CardTitle>
            </CardHeader>
            <CardContent className='text-sm'>
              {addr ? (
                <address className='not-italic leading-6'>
                  {addr.line1}
                  {addr.line2 ? <>, {addr.line2}</> : null}
                  <br />
                  {addr.city}, {addr.state} {addr.postalCode}
                  <br />
                  {addr.country}
                </address>
              ) : (
                <span className='text-muted-foreground'>No shipping address.</span>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Fulfillment</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 text-sm'>
              {fulfillments.length === 0 ? (
                <span className='text-muted-foreground'>Nothing fulfilled yet.</span>
              ) : (
                fulfillments.map((f) => (
                  <div key={f.id} className='space-y-1 rounded-md border p-3'>
                    <div className='flex items-center justify-between'>
                      <span className='capitalize font-medium'>
                        {f.type} · {f.itemCount} item{f.itemCount === 1 ? '' : 's'}
                      </span>
                      <Badge variant='outline' className='capitalize'>
                        {f.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    {f.carrier ? (
                      <div className='text-muted-foreground text-xs'>
                        {f.carrier}
                        {f.trackingNumber ? <span className='ml-1 font-mono'>{f.trackingNumber}</span> : null}
                      </div>
                    ) : null}
                    {f.trackingUrl ? (
                      <a
                        href={f.trackingUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-primary text-xs underline-offset-4 hover:underline'
                      >
                        Track shipment
                      </a>
                    ) : null}
                    {f.lineItems.length > 0 ? (
                      <div className='text-muted-foreground text-xs space-y-0.5'>
                        {f.lineItems.map((li) => (
                          <div key={li.id} className='flex justify-between'>
                            <span>{li.title}</span>
                            <span className='tabular-nums'>×{li.quantity}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
              <FulfillmentCreate orderId={order.id} lineItems={order.lineItems} fulfillments={fulfillments} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Details</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Row label='Payment' value={order.paymentMethod ?? '—'} />
              <Row label='Captured' value={order.amountCaptured > 0 ? 'Yes' : 'No'} />
              <Row
                label='Customer'
                value={order.customerId ? order.customerId.slice(0, 8) : 'Guest'}
              />
              {order.customerId ? (
                <Link
                  href={`/dashboard/customers/${order.customerId}`}
                  className='text-primary text-sm underline-offset-4 hover:underline'
                >
                  View customer
                </Link>
              ) : null}
              <PaymentActions
                id={order.id}
                status={order.status}
                amountCaptured={order.amountCaptured}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
