'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/context';
import type { SiteSettingsConfig } from '@/lib/site-config/types';

export function MaintenancePage({ settings }: { settings: SiteSettingsConfig }) {
  const { lang, dir } = useLanguage();

  return (
    <main
      dir={dir}
      className="relative flex min-h-svh flex-col items-center justify-center bg-[#05060a] px-6 text-center text-white"
    >
      <p className="text-sm tracking-[0.3em] text-violet-400">ORBIT</p>
      <h1 className="mt-4 text-3xl font-light">
        {lang === 'ar' ? 'صيانة' : 'Maintenance'}
      </h1>
      <p className="mt-4 max-w-md text-slate-400">
        {lang === 'ar' ? settings.maintenanceMessageAr : settings.maintenanceMessageEn}
      </p>
      <Link href="/auth/sign-in" className="mt-8 text-sm text-violet-300 hover:text-white">
        {lang === 'ar' ? 'تسجيل دخول الأدمن' : 'Admin sign in'}
      </Link>
    </main>
  );
}
