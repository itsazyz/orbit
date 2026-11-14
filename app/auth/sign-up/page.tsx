'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getPostAuthPath } from '@/lib/profile/client';
import { normalizeSiteSettings } from '@/lib/site-config/defaults';
import { SITE_CONFIG_KEYS } from '@/lib/site-config/keys';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/lib/i18n/context';
import { getAuthErrorKey } from '@/lib/auth/errors';

export default function SignUpPage() {
  const { t, lang } = useLanguage();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [allowSignups, setAllowSignups] = useState(true);
  const [checkingSettings, setCheckingSettings] = useState(true);

  // Remember a username picked from a "claim this orbit" link for the wizard.
  useEffect(() => {
    try {
      const claim = new URLSearchParams(window.location.search).get('claim');
      if (claim && /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(claim)) {
        window.localStorage.setItem('orbit:claim', claim);
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    async function loadSettings() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('site_config')
          .select('value')
          .eq('key', SITE_CONFIG_KEYS.siteSettings)
          .maybeSingle();
        setAllowSignups(normalizeSiteSettings(data?.value).allowSignups);
      } catch {
        setAllowSignups(true);
      } finally {
        setCheckingSettings(false);
      }
    }
    loadSettings();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!allowSignups) {
      setError(t('auth.signupsClosed'));
      return;
    }

    if (password.length < 8) {
      setError(t('auth.passwordShort'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/create')}`,
        data: {
          display_name: displayName.trim().slice(0, 60) || undefined,
          language: lang,
        },
      },
    });

    if (authError) {
      const disabled = /database error saving new user|sign-ups are currently disabled/i.test(
        authError.message
      );
      setError(disabled ? t('auth.signupsClosed') : t(getAuthErrorKey(authError.message)));
      setLoading(false);
      return;
    }

    setLoading(false);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      const path = await getPostAuthPath(supabase);
      router.push(path);
      router.refresh();
      return;
    }

    router.push(`/auth/check-email?email=${encodeURIComponent(email)}`);
  }

  if (checkingSettings) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-star-dim">
        {t('common.loading')}
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
          <h1 className="mt-4 text-2xl font-light text-star">{t('auth.signUpTitle')}</h1>
        </div>

        {!allowSignups ? (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {t('auth.signupsClosed')}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('auth.nameLabel')}
            placeholder={t('auth.namePlaceholder')}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={60}
            autoComplete="name"
          />
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
            minLength={8}
            autoComplete="new-password"
          />
          <Input
            label={t('auth.confirmPassword')}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <Button type="submit" className="w-full" loading={loading} disabled={!allowSignups}>
            {t('auth.signUp')}
          </Button>
        </form>

        <p className="text-center text-sm text-star-dim">
          {t('auth.hasAccount')}{' '}
          <Link href="/auth/sign-in" className="text-accent hover:underline">
            {t('auth.signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
