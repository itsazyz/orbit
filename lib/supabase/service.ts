import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import {
  getSupabaseEnv,
  getServiceRoleKey,
  getSupabaseKeyRole,
} from '@/lib/env';

/**
 * Privileged Supabase client (bypasses RLS).
 * Server-only — never import from Client Components.
 */
export function createServiceRoleClient() {
  if (typeof window !== 'undefined') {
    throw new Error('createServiceRoleClient must never run in the browser.');
  }

  const env = getSupabaseEnv();
  const serviceRoleKey = getServiceRoleKey();

  if (!env) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured. Add it in Vercel → Settings → Environment Variables.'
    );
  }

  const role = getSupabaseKeyRole(serviceRoleKey);
  if (role && role !== 'service_role') {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY has role "${role}", not "service_role". In Vercel, paste the service_role secret from Supabase → Settings → API (not the anon key).`
    );
  }

  return createClient<Database>(env.url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
