import PageContainer from '@/components/layout/page-container';
import { ShippingManager } from '@/features/shipping/shipping-manager';
import { listShippingZones, listShippingRates } from '@/lib/porulle/shipping';

export const dynamic = 'force-dynamic';

export default async function ShippingPage() {
  const [zones, rates] = await Promise.all([listShippingZones(), listShippingRates()]);
  return (
    <PageContainer pageTitle='Shipping' pageDescription='Shipping zones and rates.'>
      <ShippingManager zones={zones} rates={rates} />
    </PageContainer>
  );
}
