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
  const { lang, dir } = useLanguage();
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
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[90] flex justify-center px-4 pt-[3.5rem] sm:pt-[3.75rem]">
      <div
        dir={dir}
        className="pointer-events-auto max-w-xl rounded-full border border-white/10 bg-[#0c1018]/80 px-5 py-2 text-center text-[13px] leading-relaxed tracking-wide text-slate-300 shadow-[0_6px_24px_rgba(0,0,0,0.35)] backdrop-blur-md"
      >
        <span className="me-2 inline-block h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-sky-300/70" />
        {text}
      </div>
    </div>
  );
}
