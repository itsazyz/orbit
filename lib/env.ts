/**
 * Deployment environment helpers.
 * Only the public Supabase URL + anon key are required. Admin features run
 * through RLS + SECURITY DEFINER functions, so no service-role key is used.
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
