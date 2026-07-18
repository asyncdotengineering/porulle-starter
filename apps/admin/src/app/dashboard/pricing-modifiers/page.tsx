import PageContainer from '@/components/layout/page-container';
import { PricingModifiersManager } from '@/features/pricing-modifiers/pricing-modifiers-manager';
import { listPricingModifiers } from '@/lib/porulle/pricing-modifiers';

export const dynamic = 'force-dynamic';

export default async function PricingModifiersPage() {
  const modifiers = await listPricingModifiers();
  return (
    <PageContainer pageTitle='Pricing modifiers' pageDescription='Scheduled sales and price adjustments.'>
      <PricingModifiersManager modifiers={modifiers} />
    </PageContainer>
  );
}
