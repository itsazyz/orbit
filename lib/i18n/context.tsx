'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Language } from '@/types/database';
import {
  getDictionary,
  interpolate,
  isRTL,
  LANGUAGE_COOKIE,
  parseLanguage,
  type Dictionary,
} from '@/lib/i18n';

interface LanguageContextValue {
  lang: Language;
  dir: 'ltr' | 'rtl';
  dict: Dictionary;
  setLang: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}

interface LanguageProviderProps {
  initialLang: Language;
  children: ReactNode;
}

export function LanguageProvider({ initialLang, children }: LanguageProviderProps) {
  const [lang, setLangState] = useState<Language>(initialLang);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    document.cookie = `${LANGUAGE_COOKIE}=${next};path=/;max-age=31536000;SameSite=Lax`;
    document.documentElement.lang = next;
    document.documentElement.dir = isRTL(next) ? 'rtl' : 'ltr';
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL(lang) ? 'rtl' : 'ltr';
  }, [lang]);

  const dict = useMemo(() => getDictionary(lang), [lang]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const raw = getNestedValue(dict as unknown as Record<string, unknown>, key);
      return vars ? interpolate(raw, vars) : raw;
    },
    [dict]
  );

  const value = useMemo(
    () => ({
      lang,
      dir: isRTL(lang) ? ('rtl' as const) : ('ltr' as const),
      dict,
      setLang,
      t,
    }),
    [lang, dict, setLang, t]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export function useLanguageFromCookie(cookieValue: string | undefined): Language {
  return parseLanguage(cookieValue);
}
