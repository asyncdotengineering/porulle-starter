import PageContainer from '@/components/layout/page-container';
import { CustomersTable } from '@/features/customers/customers-table';
import { listCustomers } from '@/lib/porulle/customers';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const customers = await listCustomers();
  return (
    <PageContainer pageTitle='Customers' pageDescription='Everyone who has shopped your store.'>
      <CustomersTable data={customers} />
    </PageContainer>
  );
}
