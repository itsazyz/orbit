import type { Language } from '@/types/database';
import type { HomepageContentConfig, HomepageLangContent } from './types';

export function getHomepageStrings(
  content: HomepageContentConfig,
  lang: Language
): HomepageLangContent & { examples: string[]; siteName: string; demoDomain: string } {
  const langContent = lang === 'ar' ? content.ar : content.en;
  return {
    ...langContent,
    examples: lang === 'ar' ? content.examples.ar : content.examples.en,
    siteName: content.siteName,
    demoDomain: content.demoDomain,
  };
}
