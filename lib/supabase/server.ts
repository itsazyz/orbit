import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
import { getSupabaseEnv } from '@/lib/env';

export { createServiceRoleClient } from '@/lib/supabase/service';

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

