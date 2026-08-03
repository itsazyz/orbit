import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail, getAdminEmail } from '@/lib/admin';
import { loadAdminDashboard } from '@/lib/admin/dashboard-data';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { isServiceRoleConfigured, isSupabaseConfigured } from '@/lib/env';

export const dynamic = 'force-dynamic';

function AdminErrorScreen({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#05060a] px-6 text-center text-white">
      <div className="max-w-lg">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-3 text-slate-400">{message}</p>
        <ul className="mt-6 space-y-2 text-left text-sm text-slate-500">
          <li>
            <code className="text-violet-400">NEXT_PUBLIC_SUPABASE_URL</code>
          </li>
          <li>
            <code className="text-violet-400">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
          </li>
          <li>
            <code className="text-violet-400">SUPABASE_SERVICE_ROLE_KEY</code> — Supabase →
            Settings → API → service_role
          </li>
          <li>
            <code className="text-violet-400">ORBIT_ADMIN_EMAIL</code> — your login email
          </li>
        </ul>
        <p className="mt-6 text-xs text-slate-600">
          After changing variables in Vercel, click Redeploy.
        </p>
      </div>
    </main>
  );
}

export default async function OrbitControlPage() {
  if (!isSupabaseConfigured()) {
    return (
      <AdminErrorScreen
        title="Supabase not configured"
        message="Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel, then redeploy."
      />
    );
  }

  if (!isServiceRoleConfigured()) {
    return (
      <AdminErrorScreen
        title="Admin key missing"
        message="Add SUPABASE_SERVICE_ROLE_KEY in Vercel (Supabase → Settings → API → service_role secret), then redeploy."
      />
    );
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
      error instanceof Error ? error.message : 'Could not verify your session.';
    return <AdminErrorScreen title="Session error" message={message} />;
  }

  if (!userEmail) {
    redirect('/auth/sign-in?redirectTo=/orbit-control');
  }

  if (!isAdminEmail(userEmail)) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-[#05060a] px-6 text-center text-white">
        <div>
          <h1 className="text-2xl font-semibold">Access denied</h1>
          <p className="mt-3 max-w-md text-slate-400">
            This page is private. Set{' '}
            <code className="text-violet-400">ORBIT_ADMIN_EMAIL</code> in Vercel to your
            account email ({getAdminEmail() ? 'configured' : 'not configured yet'}).
          </p>
          {userEmail ? (
            <p className="mt-4 text-sm text-slate-500">
              Signed in as: <span className="text-slate-300">{userEmail}</span>
            </p>
          ) : null}
        </div>
      </main>
    );
  }

  try {
    const { stats, presets } = await loadAdminDashboard(userEmail);

    return (
      <main className="min-h-svh bg-gradient-to-b from-[#0a0d16] to-[#05060a]">
        <AdminPanel stats={stats} initialPresets={presets} />
      </main>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not load admin dashboard.';

    return (
      <AdminErrorScreen
        title="Admin setup incomplete"
        message={`${message} Also run migration 0006 in Supabase SQL Editor if you have not already.`}
      />
    );
  }
}
