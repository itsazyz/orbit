'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/context';
import { Button } from '@/components/ui/Button';

export default function AuthErrorPage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const message =
    searchParams.get('message') ?? t('auth.errorDefault');

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 text-3xl text-red-400">
        !
      </div>

      <h1 className="text-2xl font-light text-star">{t('auth.errorTitle')}</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-star-dim">{message}</p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/auth/sign-in">
          <Button>{t('auth.backToSignIn')}</Button>
        </Link>
        <Link href="/auth/sign-up">
          <Button variant="ghost">{t('auth.signUp')}</Button>
        </Link>
      </div>
    </div>
  );
}
