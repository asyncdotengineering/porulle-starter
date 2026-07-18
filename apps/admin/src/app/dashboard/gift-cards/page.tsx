import PageContainer from '@/components/layout/page-container';
import { GiftCardManager } from '@/features/gift-cards/gift-card-manager';
import { listGiftCards } from '@/lib/porulle/gift-cards';

export const dynamic = 'force-dynamic';

export default async function GiftCardsPage() {
  const cards = await listGiftCards();
  return (
    <PageContainer pageTitle='Gift cards' pageDescription='Gift card management.'>
      <GiftCardManager cards={cards} />
    </PageContainer>
  );
}
