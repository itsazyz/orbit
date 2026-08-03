'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/i18n/context';

interface AnnouncementPayload {
  show: boolean;
  en: string;
  ar: string;
}

interface SiteAnnouncementBarProps {
  show?: boolean;
  announcementEn?: string;
  announcementAr?: string;
}

/**
 * Fetches announcement from /api/announcement so it never depends on
 * a stale Server Component layout cache.
 */
export function SiteAnnouncementBar({
  show: initialShow = false,
  announcementEn: initialEn = '',
  announcementAr: initialAr = '',
}: SiteAnnouncementBarProps) {
  const { lang } = useLanguage();
  const [payload, setPayload] = useState<AnnouncementPayload>({
    show: initialShow,
    en: initialEn,
    ar: initialAr,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/announcement?t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = (await res.json()) as AnnouncementPayload;
        if (!cancelled) {
          setPayload({
            show: Boolean(data.show),
            en: String(data.en ?? ''),
            ar: String(data.ar ?? ''),
          });
        }
      } catch {
        // keep initial props
      }
    }

    void load();
    const id = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (!payload.show) return null;

  const primary = (lang === 'ar' ? payload.ar : payload.en).trim();
  const fallback = (lang === 'ar' ? payload.en : payload.ar).trim();
  const text = primary || fallback;
  if (!text) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[90] flex justify-center px-3 pt-[3.6rem] sm:pt-16">
      <div className="pointer-events-auto w-full max-w-3xl rounded-xl border-2 border-amber-300/80 bg-amber-400 px-4 py-2.5 text-center text-sm font-semibold text-black shadow-[0_8px_30px_rgba(0,0,0,0.45)]">
        {text}
      </div>
    </div>
  );
}
