'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getPostAuthPath } from '@/lib/profile/client';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/lib/i18n/context';

export default function VerifiedPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/auth/sign-in?redirectTo=/create');
        return;
      }

      const path = await getPostAuthPath(supabase);
      if (path === '/dashboard') {
        router.replace('/dashboard');
        return;
      }

      setChecking(false);
    }

    checkSession();
  }, [router, supabase]);

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6 text-star-dim">
        {t('auth.verifying')}
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/20 text-3xl text-accent">
        ✦
      </div>

      <h1 className="text-2xl font-light text-star">{t('auth.verifiedTitle')}</h1>
      <p className="mt-4 max-w-md text-star-dim">{t('auth.verifiedSubtitle')}</p>

      <Link href="/create" className="mt-8">
        <Button size="lg">{t('auth.continueToCreate')}</Button>
      </Link>

      <Link href="/" className="mt-6 text-sm text-star-dim hover:text-accent">
        {t('auth.backToHome')}
      </Link>
    </div>
  );
}
