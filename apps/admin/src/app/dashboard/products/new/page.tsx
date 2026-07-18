import PageContainer from '@/components/layout/page-container';
import { ProductForm } from '@/features/products/product-form';

export default function NewProductPage() {
  return (
    <PageContainer pageTitle='New product' pageDescription='Add a product to your catalog.'>
      <ProductForm />
    </PageContainer>
  );
}
