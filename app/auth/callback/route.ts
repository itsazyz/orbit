import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPostAuthPath } from '@/lib/profile/client';

function safeRedirectPath(value: string | null, fallback: string): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }
  return value;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null;
  const next = safeRedirectPath(requestUrl.searchParams.get('next'), '/auth/verified');
  const authError =
    requestUrl.searchParams.get('error_description') ??
    requestUrl.searchParams.get('error');

  if (authError) {
    const errorUrl = new URL('/auth/error', origin);
    errorUrl.searchParams.set('message', authError);
    return NextResponse.redirect(errorUrl);
  }

  const supabase = await createClient();
  let exchangeError: Error | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) exchangeError = error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (error) exchangeError = error;
  } else {
    const errorUrl = new URL('/auth/error', origin);
    errorUrl.searchParams.set(
      'message',
      'Missing verification code. Please open the latest link from your email.'
    );
    return NextResponse.redirect(errorUrl);
  }

  if (exchangeError) {
    console.error('[auth/callback]', exchangeError.message);
    const errorUrl = new URL('/auth/error', origin);
    errorUrl.searchParams.set('message', exchangeError.message);
    return NextResponse.redirect(errorUrl);
  }

  let destination = next;

  if (
    next === '/dashboard' ||
    next === '/create' ||
    next === '/auth/verified'
  ) {
    try {
      destination = await getPostAuthPath(supabase);
    } catch (err) {
      console.error('[auth/callback] getPostAuthPath failed:', err);
      destination = '/auth/verified';
    }
  }

  return NextResponse.redirect(`${origin}${destination}`);
}
