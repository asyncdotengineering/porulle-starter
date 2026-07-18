import PageContainer from '@/components/layout/page-container';
import { TaxManager } from '@/features/tax/tax-manager';
import { listTaxClasses, listTaxRates } from '@/lib/porulle/tax';

export const dynamic = 'force-dynamic';

export default async function TaxPage() {
  const [classes, rates] = await Promise.all([listTaxClasses(), listTaxRates()]);
  return (
    <PageContainer pageTitle='Tax' pageDescription='Tax classes and rates.'>
      <TaxManager classes={classes} rates={rates} />
    </PageContainer>
  );
}
