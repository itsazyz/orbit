'use client';

import { Globe } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';
import type { Language } from '@/types/database';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'pill' | 'minimal' | 'toggle';
}

export function LanguageSelector({ className, variant = 'pill' }: LanguageSelectorProps) {
  const { lang, setLang } = useLanguage();

  const options: { value: Language; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'ar', label: 'العربية' },
  ];

  if (variant === 'minimal') {
    return (
      <button
        type="button"
        onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
        className={cn(
          'inline-flex items-center gap-2 text-sm text-star-dim transition-colors hover:text-star',
          className
        )}
        aria-label="Switch language"
      >
        <Globe className="h-4 w-4" />
        {lang === 'en' ? 'العربية' : 'English'}
      </button>
    );
  }

  if (variant === 'toggle') {
    return (
      <button
        type="button"
        onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition-colors',
          'text-star-dim hover:text-star',
          className
        )}
        aria-label={lang === 'en' ? 'Switch to Arabic' : 'Switch to English'}
      >
        <Globe className="h-4 w-4 shrink-0" />
        <span>{lang === 'en' ? 'العربية' : 'English'}</span>
      </button>
    );
  }

  return (
    <div
      className={cn('inline-flex rounded-full border border-space-border bg-space-panel p-1', className)}
      role="group"
      aria-label="Language selector"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setLang(opt.value)}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm transition-colors',
            lang === opt.value
              ? 'bg-accent text-white'
              : 'text-star-dim hover:text-star'
          )}
          aria-pressed={lang === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
