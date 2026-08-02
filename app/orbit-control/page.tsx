import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail, getAdminEmail } from '@/lib/admin';
import { getAdminStats, getVisualPresets } from '@/lib/actions/admin';
import { AdminPanel } from '@/components/admin/AdminPanel';

export const dynamic = 'force-dynamic';

export default async function OrbitControlPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in?redirectTo=/orbit-control');
  }

  if (!isAdminEmail(user.email)) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-[#05060a] px-6 text-center text-white">
        <div>
          <h1 className="text-2xl font-semibold">Access denied</h1>
          <p className="mt-3 max-w-md text-slate-400">
            This page is private. Set{' '}
            <code className="text-violet-400">ORBIT_ADMIN_EMAIL</code> in Vercel to your
            account email ({getAdminEmail() ? 'configured' : 'not configured yet'}).
          </p>
        </div>
      </main>
    );
  }

  const [stats, presets] = await Promise.all([getAdminStats(), getVisualPresets()]);

  return (
    <main className="min-h-svh bg-gradient-to-b from-[#0a0d16] to-[#05060a]">
      <AdminPanel
        stats={stats}
        initialPresets={{
          starTypes: presets.starTypes,
          planetSurfaces: presets.planetSurfaces,
        }}
      />
    </main>
  );
}
