import PageContainer from '@/components/layout/page-container';
import { OpsView } from '@/features/ops/ops-view';
import { listCompensationFailures, listFailedJobs } from '@/lib/porulle/ops';

export const dynamic = 'force-dynamic';

export default async function HealthPage() {
  const [jobs, compensations] = await Promise.all([listFailedJobs(), listCompensationFailures()]);
  return (
    <PageContainer
      pageTitle='Health'
      pageDescription='Background jobs and checkout compensations that need attention.'
    >
      <OpsView jobs={jobs} compensations={compensations} />
    </PageContainer>
  );
}
