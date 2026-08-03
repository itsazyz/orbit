'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getPostAuthPath } from '@/lib/profile/client';
import { isSupabaseConfigured } from '@/lib/env';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/lib/i18n/context';

function safeRedirectPath(path: string | null): string {
  if (path && path.startsWith('/') && !path.startsWith('//')) {
    return path;
  }
  return '/dashboard';
}

export function SignInForm() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get('redirectTo'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const supabaseReady = isSupabaseConfigured();

  useEffect(() => {
    if (!supabaseReady) {
      setCheckingSession(false);
      return;
    }

    async function checkExistingSession() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const path =
            redirectTo !== '/dashboard'
              ? redirectTo
              : await getPostAuthPath(supabase);
          window.location.assign(path);
          return;
        }
      } catch {
        // Stay on sign-in form
      }

      setCheckingSession(false);
    }

    checkExistingSession();
  }, [redirectTo, supabaseReady]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!supabaseReady) {
      setError(
        'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.'
      );
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      const path =
        redirectTo !== '/dashboard'
          ? redirectTo
          : await getPostAuthPath(supabase);

      // Full page load so auth cookies reach the server before /orbit-control renders
      window.location.assign(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-star-dim">
        {t('auth.verifying')}
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="text-sm tracking-widest text-star-dim hover:text-star">
            ORBIT
          </Link>
          <h1 className="mt-4 text-2xl font-light text-star">{t('auth.signInTitle')}</h1>
        </div>

        {!supabaseReady ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            Supabase environment variables are missing on this deployment. Add them in Vercel
            → Settings → Environment Variables, then redeploy.
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label={t('auth.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <Button type="submit" className="w-full" loading={loading} disabled={!supabaseReady}>
            {t('auth.signIn')}
          </Button>
        </form>

        <div className="space-y-2 text-center text-sm text-star-dim">
          <Link href="/auth/reset" className="hover:text-accent">
            {t('auth.forgotPassword')}
          </Link>
          <p>
            {t('auth.noAccount')}{' '}
            <Link href="/auth/sign-up" className="text-accent hover:underline">
              {t('auth.signUp')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
