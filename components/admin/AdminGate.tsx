'use client';

import { useEffect, useState } from 'react';
import { getAdminDashboardAction } from '@/lib/actions/admin';
import type { AdminDashboardPayload } from '@/lib/admin/dashboard-data';
import { AdminPanel } from './AdminPanel';
import { useLanguage } from '@/lib/i18n/context';

/**
 * Loads admin data in the browser after mount so Server Component SSR
 * never renders AdminPanel (avoids opaque production RSC digests).
 */
export function AdminGate() {
  const { lang, dir } = useLanguage();
  const [data, setData] = useState<AdminDashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await getAdminDashboardAction();
        if (cancelled) return;

        if (!result.ok) {
          setError(result.error);
          return;
        }

        setData(result.data);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load admin');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <main
        dir={dir}
        className="flex min-h-svh items-center justify-center bg-[#05060a] px-6 text-center text-white"
      >
        <div className="max-w-lg">
          <h1 className="text-2xl font-semibold">
            {lang === 'ar' ? 'تعذّر تحميل لوحة التحكم' : 'Could not load admin'}
          </h1>
          <p className="mt-3 break-words text-sm text-rose-300/90">{error}</p>
          <p className="mt-4 text-xs text-slate-500">
            {lang === 'ar'
              ? 'شغّل 0009_ensure_site_settings.sql في Supabase إن لزم، وتأكد من SUPABASE_SERVICE_ROLE_KEY.'
              : 'Run 0009_ensure_site_settings.sql in Supabase if needed, and check SUPABASE_SERVICE_ROLE_KEY.'}
          </p>
          <button
            type="button"
            className="mt-6 rounded-lg bg-violet-600 px-4 py-2 text-sm"
            onClick={() => window.location.reload()}
          >
            {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main
        dir={dir}
        className="flex min-h-svh items-center justify-center bg-[#05060a] text-slate-400"
      >
        {lang === 'ar' ? 'جاري تحميل لوحة التحكم…' : 'Loading admin…'}
      </main>
    );
  }

  return (
    <main className="min-h-svh bg-gradient-to-b from-[#0a0d16] to-[#05060a]">
      <AdminPanel data={data} />
    </main>
  );
}
