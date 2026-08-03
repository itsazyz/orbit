/**
 * Shared helpers for reading deployment environment variables.
 * Vercel injects VERCEL_URL automatically; Supabase keys must be set
 * in the Vercel project dashboard (Settings → Environment Variables).
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}

export function getServiceRoleKey(): string | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return key || null;
}

export function isServiceRoleConfigured(): boolean {
  return getSupabaseEnv() !== null && getServiceRoleKey() !== null;
}
