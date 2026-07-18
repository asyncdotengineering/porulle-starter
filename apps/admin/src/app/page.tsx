import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';

export default async function Page() {
  const session = await getAdminSession();
  redirect(session ? '/dashboard/overview' : '/auth/sign-in');
}
