import PageContainer from '@/components/layout/page-container';
import { DraftOrderForm } from '@/features/orders/draft-order-form';

export const dynamic = 'force-dynamic';

export default function NewOrderPage() {
  return (
    <PageContainer pageTitle='New order' pageDescription='Create a manual / phone order.'>
      <DraftOrderForm />
    </PageContainer>
  );
}
