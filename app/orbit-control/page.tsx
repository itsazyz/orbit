import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminGate } from '@/components/admin/AdminGate';
import {
  AdminAccessDeniedClient,
  AdminErrorScreenClient,
} from '@/components/admin/AdminStatusScreens';
import { isSupabaseConfigured } from '@/lib/env';

export const dynamic = 'force-dynamic';

/**
 * Auth gate only. Admin rights live in Postgres (private.admins via
 * public.is_admin()); the panel itself loads client-side through AdminGate.
 */
export default async function OrbitControlPage() {
  if (!isSupabaseConfigured()) {
    return <AdminErrorScreenClient variant="supabase" />;
  }

  let userEmail: string | null = null;
  let isAdmin = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userEmail = user?.email ?? null;

    if (user) {
      const { data } = await supabase.rpc('is_admin');
      isAdmin = data === true;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : undefined;
    return <AdminErrorScreenClient variant="session" detail={message} />;
  }

  if (!userEmail) {
    redirect('/auth/sign-in?redirectTo=/orbit-control');
  }

  if (!isAdmin) {
    return <AdminAccessDeniedClient userEmail={userEmail} adminConfigured />;
  }

  return <AdminGate />;
}
