import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseEnv } from '@/lib/env';

const PROTECTED_PREFIXES = ['/dashboard', '/settings', '/create', '/orbit-control'];

/**
 * Called from middleware.ts on every request.
 * - Refreshes the Supabase auth session cookie (required by @supabase/ssr).
 * - Redirects unauthenticated users away from protected routes.
 */
export async function updateSession(request: NextRequest) {
  const supabaseEnv = getSupabaseEnv();

  // Allow public pages to load even when Supabase env vars are missing
  // (common during first Vercel deploy before env vars are configured).
  if (!supabaseEnv) {
    const path = request.nextUrl.pathname;
    const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));

    if (isProtected) {
      const redirectUrl = new URL('/auth/sign-in', request.url);
      redirectUrl.searchParams.set('redirectTo', path);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next({ request: { headers: request.headers } });
  }

  let response = NextResponse.next({ request: { headers: request.headers } });

  try {
    const supabase = createServerClient(
      supabaseEnv.url,
      supabaseEnv.anonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options });
            response = NextResponse.next({ request: { headers: request.headers } });
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options });
            response = NextResponse.next({ request: { headers: request.headers } });
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;
    const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));

    if (isProtected && !user) {
      const redirectUrl = new URL('/auth/sign-in', request.url);
      redirectUrl.searchParams.set('redirectTo', path);
      return NextResponse.redirect(redirectUrl);
    }
  } catch (error) {
    console.error('[middleware] Supabase session refresh failed:', error);

    const path = request.nextUrl.pathname;
    const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));

    if (isProtected) {
      const redirectUrl = new URL('/auth/sign-in', request.url);
      redirectUrl.searchParams.set('redirectTo', path);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}
