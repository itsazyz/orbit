'use client';

import { useLanguage } from '@/lib/i18n/context';

interface SiteAnnouncementBarProps {
  show: boolean;
  announcementEn: string;
  announcementAr: string;
}

/** Fixed banner under the language switcher — visible on every page */
export function SiteAnnouncementBar({
  show,
  announcementEn,
  announcementAr,
}: SiteAnnouncementBarProps) {
  const { lang } = useLanguage();

  if (!show) return null;

  const primary = (lang === 'ar' ? announcementAr : announcementEn).trim();
  const fallback = (lang === 'ar' ? announcementEn : announcementAr).trim();
  const text = primary || fallback;

  if (!text) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[3.35rem] z-[99] flex justify-center px-3 sm:top-16">
      <div className="pointer-events-auto max-w-3xl rounded-full border border-amber-400/35 bg-amber-950/95 px-5 py-2.5 text-center text-sm font-medium text-amber-50 shadow-lg shadow-black/50 backdrop-blur-md">
        {text}
      </div>
    </div>
  );
}
