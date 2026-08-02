'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/context';

export default function CheckEmailPage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5 text-3xl">
        ✉
      </div>

      <h1 className="text-2xl font-light text-star">{t('auth.checkEmailTitle')}</h1>

      <p className="mt-4 max-w-md text-star-dim">{t('auth.checkEmailSubtitle')}</p>

      {email ? (
        <p className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-accent">
          {email}
        </p>
      ) : null}

      <ul className="mt-6 max-w-md space-y-2 text-start text-sm text-star-dim">
        <li>• {t('auth.checkEmailStep1')}</li>
        <li>• {t('auth.checkEmailStep2')}</li>
        <li>• {t('auth.checkEmailStep3')}</li>
      </ul>

      <Link href="/auth/sign-in" className="mt-8 text-accent hover:underline">
        {t('auth.backToSignIn')}
      </Link>
    </div>
  );
}
