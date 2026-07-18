import PageContainer from '@/components/layout/page-container';
import { PromotionsManager } from '@/features/promotions/promotions-manager';
import { SaleForm } from '@/features/promotions/sale-form';
import { listPromotions } from '@/lib/porulle/promotions';

export const dynamic = 'force-dynamic';

export default async function PromotionsPage() {
  const promotions = await listPromotions();
  return (
    <PageContainer pageTitle='Promotions' pageDescription='Discount codes and scheduled sales.'>
      <div className='flex max-w-3xl flex-col gap-6'>
        <PromotionsManager promotions={promotions} />
        <SaleForm />
      </div>
    </PageContainer>
  );
}
