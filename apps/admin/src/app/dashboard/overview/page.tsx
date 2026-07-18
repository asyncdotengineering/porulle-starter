import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { listOrders } from '@/lib/porulle/orders';
import { listProducts } from '@/lib/porulle/products';

export const dynamic = 'force-dynamic';

function money(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

const EXCLUDED_STATUSES = new Set(['cancelled', 'refunded']);

export default async function OverviewPage() {
  const [products, orders] = await Promise.all([listProducts(), listOrders()]);
  const activeProducts = products.filter((p) => p.status === 'active').length;
  const countableOrders = orders.filter((o) => !EXCLUDED_STATUSES.has(o.status));
  const revenue = countableOrders.reduce((sum, o) => sum + o.total, 0);

  const stats = [
    { label: 'Products', value: String(products.length), hint: `${activeProducts} active` },
    { label: 'Orders', value: String(orders.length), hint: 'all time' },
    { label: 'Revenue', value: money(revenue), hint: 'excludes cancelled & refunded' },
    {
      label: 'Avg. order',
      value: money(countableOrders.length ? Math.round(revenue / countableOrders.length) : 0),
      hint: 'per countable order'
    }
  ];

  return (
    <PageContainer pageTitle='Dashboard' pageDescription='Your store at a glance.'>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-muted-foreground text-sm font-medium'>{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-semibold'>{s.value}</div>
              <p className='text-muted-foreground text-xs'>{s.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
