'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { useLanguage } from '@/lib/i18n/context';

export default function SignInPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
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
          <h1 className="mt-4 text-2xl font-light text-star">{t('auth.signInTitle')}</h1>
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
            autoComplete="current-password"
          />

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <Button type="submit" className="w-full" loading={loading}>
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
