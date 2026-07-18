import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { getCustomer, getCustomerOrders, getCustomerInteractions } from '@/lib/porulle/customers';
import { NotesPanel } from '@/features/customers/notes-panel';
import { ORDER_STATUS_STYLE } from '@/features/orders/orders-columns';

export const dynamic = 'force-dynamic';

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { dateStyle: 'medium' });
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [customer, orders, interactions] = await Promise.all([
    getCustomer(id),
    getCustomerOrders(id),
    getCustomerInteractions(id)
  ]);
  if (!customer) notFound();

  return (
    <PageContainer pageTitle={customer.name} pageDescription='Customer profile and order history.'>
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
        <div className='flex flex-col gap-4 lg:col-span-1'>
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Contact</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Email</span>
                <span>{customer.email}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Phone</span>
                <span>{customer.phone}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Joined</span>
                <span>{formatDate(customer.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
          <NotesPanel customerId={customer.id} interactions={interactions} />
        </div>

        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle className='text-base'>Orders ({orders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className='text-muted-foreground text-sm'>No orders yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Total</TableHead>
                    <TableHead>Placed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/orders/${o.id}`}
                          className='font-medium underline-offset-4 hover:underline'
                        >
                          {o.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline' className={cn('capitalize', ORDER_STATUS_STYLE[o.status])}>
                          {o.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>{o.totalLabel}</TableCell>
                      <TableCell className='text-muted-foreground'>{formatDate(o.placedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
