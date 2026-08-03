import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail, getAdminEmail } from '@/lib/admin';
import { loadAdminDashboard } from '@/lib/admin/dashboard-data';
import { AdminPanel } from '@/components/admin/AdminPanel';
import {
  AdminAccessDeniedClient,
  AdminErrorScreenClient,
} from '@/components/admin/AdminStatusScreens';
import { isServiceRoleConfigured, isSupabaseConfigured } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function OrbitControlPage() {
  if (!isSupabaseConfigured()) {
    return <AdminErrorScreenClient variant="supabase" />;
  }

  if (!isServiceRoleConfigured()) {
    return <AdminErrorScreenClient variant="service_role" />;
  }

  let userEmail: string | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    userEmail = user?.email ?? null;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : undefined;
    return <AdminErrorScreenClient variant="session" detail={message} />;
  }

  if (!userEmail) {
    redirect('/auth/sign-in?redirectTo=/orbit-control');
  }

  if (!isAdminEmail(userEmail)) {
    return (
      <AdminAccessDeniedClient
        userEmail={userEmail}
        adminConfigured={Boolean(getAdminEmail())}
      />
    );
  }

  try {
    const data = await loadAdminDashboard(userEmail);

    return (
      <main className="min-h-svh bg-gradient-to-b from-[#0a0d16] to-[#05060a]">
        <AdminPanel data={data} />
      </main>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : undefined;
    return <AdminErrorScreenClient variant="setup" detail={message} />;
  }
}
