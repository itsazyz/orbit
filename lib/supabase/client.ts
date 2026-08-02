import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import { getSupabaseEnv } from '@/lib/env';

/**
 * Supabase client for use inside Client Components ('use client').
 * Reads the public URL/anon key only — never the service role key.
 */
export function createClient() {
  const env = getSupabaseEnv();

  if (!env) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel → Settings → Environment Variables.'
    );
  }

  return createBrowserClient<Database>(env.url, env.anonKey);
}
