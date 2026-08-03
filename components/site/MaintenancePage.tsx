'use client';

import Link from 'next/link';
import type { SiteSettingsConfig } from '@/lib/site-config/types';

export function MaintenancePage({ settings }: { settings: SiteSettingsConfig }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#05060a] px-6 text-center text-white">
      <p className="text-sm tracking-[0.3em] text-violet-400">ORBIT</p>
      <h1 className="mt-4 text-3xl font-light">Maintenance</h1>
      <p className="mt-4 max-w-md text-slate-400">{settings.maintenanceMessageEn}</p>
      <p className="mt-2 max-w-md text-slate-500" dir="rtl">
        {settings.maintenanceMessageAr}
      </p>
      <Link href="/auth/sign-in" className="mt-8 text-sm text-violet-300 hover:text-white">
        Admin sign in
      </Link>
    </main>
  );
}
