import type { Language } from '@/types/database';
import type { Dictionary } from './types';

import en from '@/messages/en.json';
import ar from '@/messages/ar.json';

const dictionaries: Record<Language, Dictionary> = {
  en: en as Dictionary,
  ar: ar as Dictionary,
};

export function getDictionary(lang: Language): Dictionary {
  return dictionaries[lang] ?? dictionaries.en;
}

export function isRTL(lang: Language): boolean {
  return lang === 'ar';
}

export function interpolate(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(vars[key] ?? `{${key}}`)
  );
}

export const LANGUAGE_COOKIE = 'orbit-lang';

export function parseLanguage(value: string | null | undefined): Language {
  return value === 'ar' ? 'ar' : 'en';
}
