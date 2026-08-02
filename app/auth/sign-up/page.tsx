'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getPostAuthPath } from '@/lib/profile/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { useLanguage } from '@/lib/i18n/context';

export default function SignUpPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const redirectBase =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
      window.location.origin;

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${redirectBase}/auth/callback?next=${encodeURIComponent('/auth/verified')}`,
      },
    });

    if (authError) {
      setError(authError.message);
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

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="absolute end-6 top-6">
        <LanguageSelector variant="minimal" />
      </div>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="text-sm tracking-widest text-star-dim hover:text-star">
            ORBIT
          </Link>
          <h1 className="mt-4 text-2xl font-light text-star">{t('auth.signUpTitle')}</h1>
        </div>

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

          <Button type="submit" className="w-full" loading={loading}>
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
