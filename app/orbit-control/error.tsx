'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/lib/i18n/context';

export default function OrbitControlError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { dir, lang } = useLanguage();

  useEffect(() => {
    console.error('[orbit-control]', error);
  }, [error]);

  const isOpaqueProductionMessage =
    error.message.includes('omitted in production') ||
    error.message.includes('Server Components render');

  return (
    <main
      dir={dir}
      className="relative flex min-h-svh items-center justify-center bg-[#05060a] px-6 text-center text-white"
    >
      <div className="max-w-lg">
        <h1 className="text-2xl font-semibold">
          {lang === 'ar' ? 'تعذّر فتح لوحة التحكم' : 'Could not open admin'}
        </h1>
        <p className="mt-3 text-slate-400">
          {lang === 'ar'
            ? 'حدّث الصفحة بعد اكتمال النشر. إن استمر الخطأ، شغّل ملف 0009_ensure_site_settings.sql في Supabase SQL Editor.'
            : 'Refresh after the latest deploy finishes. If it persists, run 0009_ensure_site_settings.sql in the Supabase SQL Editor.'}
        </p>
        {!isOpaqueProductionMessage && error.message ? (
          <p className="mt-3 break-words rounded-lg border border-white/10 bg-black/30 p-3 text-start text-xs text-slate-400">
            {error.message}
          </p>
        ) : null}
        {error.digest ? (
          <p className="mt-2 text-xs text-slate-600">Digest: {error.digest}</p>
        ) : null}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={() => reset()}>
            {lang === 'ar' ? 'إعادة المحاولة' : 'Try again'}
          </Button>
          <Link href="/auth/sign-in?redirectTo=/orbit-control">
            <Button variant="secondary">
              {lang === 'ar' ? 'تسجيل الدخول مجدداً' : 'Sign in again'}
            </Button>
          </Link>
          <Link href="/">
            <Button variant="secondary">
              {lang === 'ar' ? 'الرئيسية' : 'Home'}
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
