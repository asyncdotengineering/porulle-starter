import PageContainer from '@/components/layout/page-container';
import { StaffManager } from '@/features/staff/staff-manager';
import { listStaff, listStaffInvitations, listStaffRoles } from '@/lib/porulle/staff';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  const [members, roles, invitations] = await Promise.all([
    listStaff(),
    listStaffRoles(),
    listStaffInvitations()
  ]);
  return (
    <PageContainer pageTitle='Staff' pageDescription='Staff members, roles, and pending invitations.'>
      <StaffManager members={members} roles={roles} invitations={invitations} />
    </PageContainer>
  );
}
