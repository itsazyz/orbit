import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseEnv } from '@/lib/env';

const LANGUAGE_COOKIE = 'orbit-lang';

const PROTECTED_PREFIXES = ['/dashboard', '/settings', '/create', '/orbit-control'];

/** App routes — lowercase only; redirect /ORBIT-CONTROL → /orbit-control */
const CANONICAL_ROUTES = [
  '/dashboard',
  '/settings',
  '/create',
  '/orbit-control',
  '/auth',
] as const;

function redirectToCanonicalPath(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const lower = pathname.toLowerCase();

  for (const route of CANONICAL_ROUTES) {
    if (lower === route || lower.startsWith(`${route}/`)) {
      if (pathname !== lower) {
        const url = request.nextUrl.clone();
        url.pathname = lower;
        return NextResponse.redirect(url);
      }
      return null;
    }
  }

  return null;
}

/**
 * Called from middleware.ts on every request.
 * - Refreshes the Supabase auth session cookie (required by @supabase/ssr).
 * - Redirects unauthenticated users away from protected routes.
 */
/**
 * First visit: pick Arabic for Arabic browsers, English otherwise. The value
 * is written onto the request (so this render already uses it) and onto the
 * response (so it sticks). The language toggle overrides it afterwards.
 */
function detectLanguage(request: NextRequest): 'ar' | 'en' | null {
  if (request.cookies.get(LANGUAGE_COOKIE)) return null;
  const header = request.headers.get('accept-language') ?? '';
  const lang = /^\s*ar\b/i.test(header) ? 'ar' : 'en';
  request.cookies.set(LANGUAGE_COOKIE, lang);
  return lang;
}

function persistLanguage(response: NextResponse, lang: 'ar' | 'en' | null) {
  if (lang) {
    response.cookies.set(LANGUAGE_COOKIE, lang, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  }
  return response;
}

export async function updateSession(request: NextRequest) {
  const canonicalRedirect = redirectToCanonicalPath(request);
  if (canonicalRedirect) return canonicalRedirect;

  const detectedLang = detectLanguage(request);
  const response = await refreshSession(request);
  return persistLanguage(response, detectedLang);
}

async function refreshSession(request: NextRequest) {
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
