import PageContainer from '@/components/layout/page-container';
import { BrandsManager } from '@/features/brands/brands-manager';
import { listBrands } from '@/lib/porulle/brands';

export const dynamic = 'force-dynamic';

export default async function BrandsPage() {
  const brands = await listBrands();
  return (
    <PageContainer pageTitle='Brands' pageDescription='Label products by maker.'>
      <BrandsManager brands={brands} />
    </PageContainer>
  );
}
