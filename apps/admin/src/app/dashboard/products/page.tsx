import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { ProductsTable } from '@/features/products/products-table';
import { listProducts } from '@/lib/porulle/products';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const products = await listProducts();
  return (
    <PageContainer
      pageTitle='Products'
      pageDescription='Manage your catalog.'
      pageHeaderAction={
        <Button asChild>
          <Link href='/dashboard/products/new'>
            <Icons.add className='mr-2 size-4' />
            New product
          </Link>
        </Button>
      }
    >
      <ProductsTable data={products} />
    </PageContainer>
  );
}
