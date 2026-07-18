import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { ProductForm } from '@/features/products/product-form';
import { StockPanel } from '@/features/products/stock-panel';
import { ImagePanel } from '@/features/products/image-panel';
import { OrganizationPanel } from '@/features/products/organization-panel';
import { VariantsPanel } from '@/features/products/variants-panel';
import { getProduct, getProductOrganization } from '@/lib/porulle/products';
import { getStock } from '@/lib/porulle/inventory';
import { listBrands } from '@/lib/porulle/brands';
import { listCategories } from '@/lib/porulle/categories';
import { getVariants } from '@/lib/porulle/variants';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  const [stock, org, brands, categories, variants] = await Promise.all([
    getStock(product.id),
    getProductOrganization(product.id),
    listBrands(),
    listCategories(),
    getVariants(product.id)
  ]);

  return (
    <PageContainer pageTitle='Edit product' pageDescription={product.title}>
      <div className='flex max-w-2xl flex-col gap-6'>
        <ProductForm product={product} />
        <OrganizationPanel
          entityId={product.id}
          brands={brands}
          categories={categories.filter((c) => c.status !== 'archived')}
          currentBrandId={org.brandId}
          currentCategoryIds={org.categoryIds}
        />
        <VariantsPanel entityId={product.id} data={variants} />
        <ImagePanel entityId={product.id} image={product.image} />
        <StockPanel entityId={product.id} onHand={stock.onHand} reserved={stock.reserved} />
      </div>
    </PageContainer>
  );
}
