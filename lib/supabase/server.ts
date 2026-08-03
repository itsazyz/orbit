import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
import { getSupabaseEnv, getServiceRoleKey } from '@/lib/env';

function requireSupabaseEnv() {
  const env = getSupabaseEnv();

  if (!env) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel → Settings → Environment Variables.'
    );
  }

  return env;
}

/**
 * Supabase client for use inside Server Components, Route Handlers, and
 * Server Actions. Reads/writes the auth cookie via Next's cookies() API.
 *
 * IMPORTANT: this still runs under RLS as the current user — it is not a
 * privilege escalation. Never pass the service role key here.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const env = requireSupabaseEnv();

  return createServerClient<Database>(
    env.url,
    env.anonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component — safe to ignore because the
            // middleware refreshes the session on every request.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Same as above.
          }
        },
      },
    }
  );
}

/**
 * Privileged client using the service role key. This BYPASSES Row Level
 * Security entirely. Only ever import this inside server-only code paths
 * that need to act outside a specific user's permissions — e.g. permanently
 * deleting a user's auth.users row on account deletion.
 *
 * Never import this file from a Client Component. Never send its result
 * to the browser.
 */
export function createServiceRoleClient() {
  if (typeof window !== 'undefined') {
    throw new Error('createServiceRoleClient must never run in the browser.');
  }

  const env = requireSupabaseEnv();
  const serviceRoleKey = getServiceRoleKey();

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured. Add it in Vercel → Settings → Environment Variables (required for admin stats and site config).'
    );
  }

  // Use the plain JS client (not SSR cookie client) so admin writes
  // reliably authenticate with the service role key.
  return createSupabaseClient<Database>(env.url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
