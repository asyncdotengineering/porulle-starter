import PageContainer from '@/components/layout/page-container';
import { CategoriesManager } from '@/features/categories/categories-manager';
import { listCategories } from '@/lib/porulle/categories';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const categories = await listCategories();
  return (
    <PageContainer pageTitle='Categories' pageDescription='Organize your catalog.'>
      <CategoriesManager categories={categories} />
    </PageContainer>
  );
}
