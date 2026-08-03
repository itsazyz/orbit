'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

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

const ARABIC_SCRIPT = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

function hasArabicScript(text: string): boolean {
  return ARABIC_SCRIPT.test(text);
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

  // Font/dir follow the announcement text itself, not the page language —
  // so Arabic copy keeps Noto Sans Arabic even when the UI is English.
  const arabicText = hasArabicScript(text);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[90] flex justify-center px-4 pt-[3.5rem] sm:pt-[3.75rem]">
      <div
        dir={arabicText ? 'rtl' : 'ltr'}
        lang={arabicText ? 'ar' : 'en'}
        className={cn(
          'pointer-events-auto max-w-xl rounded-full border border-white/10 bg-[#0c1018]/80 px-5 py-2 text-center text-[13px] leading-relaxed text-slate-300 shadow-[0_6px_24px_rgba(0,0,0,0.35)] backdrop-blur-md',
          arabicText
            ? 'font-arabic tracking-normal'
            : 'font-sans tracking-wide'
        )}
      >
        <span className="me-2 inline-block h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-sky-300/70" />
        {text}
      </div>
    </div>
  );
}
