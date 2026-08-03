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

/** Decode Supabase JWT payload (no verify) to inspect the role claim */
export function getSupabaseKeyRole(key: string | null | undefined): string | null {
  if (!key) return null;
  try {
    const segment = key.split('.')[1];
    if (!segment) return null;
    const json = Buffer.from(
      segment.replace(/-/g, '+').replace(/_/g, '/'),
      'base64'
    ).toString('utf8');
    const payload = JSON.parse(json) as { role?: string };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export function isServiceRoleConfigured(): boolean {
  const key = getServiceRoleKey();
  if (!getSupabaseEnv() || !key) return false;
  const role = getSupabaseKeyRole(key);
  // If we cannot decode, still allow (non-JWT local stubs); prefer real service_role
  if (role && role !== 'service_role') return false;
  return true;
}
