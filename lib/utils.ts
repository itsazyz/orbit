import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Absolute site origin for server-side code (metadata, sitemaps, OG URLs).
 * Client code should prefer window.location.origin.
 */
export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  if (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:3000';
}

export function profileUrl(username: string) {
  return `${getSiteUrl()}/${username}`;
}

/** Display-friendly host, e.g. "orbit.app" */
export function siteHost() {
  try {
    return new URL(getSiteUrl()).host;
  } catch {
    return 'orbit';
  }
}

export function formatCompact(value: number, lang: 'en' | 'ar' = 'en') {
  try {
    return new Intl.NumberFormat(lang === 'ar' ? 'ar' : 'en', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return String(value);
  }
}
