import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { InfoSidebar } from '@/components/layout/info-sidebar';
import { InfobarProvider } from '@/components/ui/infobar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { requireAdmin } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Porulle Admin',
  description: 'Manage your porulle store.',
  robots: {
    index: false,
    follow: false
  }
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  // Persisting the sidebar state in the cookie.
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar email={session.email} />
      <SidebarInset>
        <Header />
        <InfobarProvider defaultOpen={false}>
          {children}
          <InfoSidebar side='right' />
        </InfobarProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
