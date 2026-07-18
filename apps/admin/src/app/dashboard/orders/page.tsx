import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { OrdersTable } from '@/features/orders/orders-table';
import { OrderLookup } from '@/features/orders/order-lookup';
import { listOrders, lookupOrders } from '@/lib/porulle/orders';

export const dynamic = 'force-dynamic';

export default async function OrdersPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const orders = q ? await lookupOrders(q) : await listOrders();
  return (
    <PageContainer
      pageTitle='Orders'
      pageDescription={q ? `Lookup results for “${q}”.` : 'Every order placed in your store.'}
      pageHeaderAction={
        <Button asChild>
          <Link href='/dashboard/orders/new'>
            <Icons.add className='mr-2 size-4' />
            New order
          </Link>
        </Button>
      }
    >
      <div className='flex flex-col gap-4'>
        <OrderLookup />
        <OrdersTable data={orders} />
      </div>
    </PageContainer>
  );
}
