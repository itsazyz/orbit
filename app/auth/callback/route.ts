import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPostAuthPath } from '@/lib/profile/client';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const destination =
        next === '/dashboard' || next === '/create'
          ? await getPostAuthPath(supabase)
          : next;
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/sign-in`);
}
