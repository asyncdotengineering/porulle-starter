import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { listLowStock } from '@/lib/porulle/inventory';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const low = await listLowStock();
  return (
    <PageContainer pageTitle='Low stock' pageDescription='Products at or below their reorder point.'>
      <Card className='max-w-2xl'>
        <CardContent className='divide-border divide-y p-0'>
          {low.length === 0 ? (
            <p className='text-muted-foreground p-4 text-sm'>Everything is well stocked. 🎉</p>
          ) : (
            low.map((item) => (
              <div key={item.entityId} className='flex items-center justify-between px-4 py-3'>
                <Link
                  href={`/dashboard/products/${item.entityId}`}
                  className='font-medium underline-offset-4 hover:underline'
                >
                  {item.title}
                </Link>
                <div className='flex items-center gap-3'>
                  <span className='text-muted-foreground text-sm'>reorder at {item.threshold}</span>
                  <Badge
                    variant='outline'
                    className='border-transparent bg-amber-500/15 text-amber-700 tabular-nums dark:text-amber-400'
                  >
                    {item.onHand} left
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
