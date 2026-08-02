import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

/**
 * Supabase client for use inside Server Components, Route Handlers, and
 * Server Actions. Reads/writes the auth cookie via Next's cookies() API.
 *
 * IMPORTANT: this still runs under RLS as the current user — it is not a
 * privilege escalation. Never pass the service role key here.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() {
          return undefined;
        },
        set() {
          /* no-op: service role client is not tied to a browser session */
        },
        remove() {
          /* no-op */
        },
      },
    }
  );
}
