'use client';

import { X } from 'lucide-react';
import type { ObjectCategory } from '@/types/database';
import { useLanguage } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface ObjectDetailPanelProps {
  name: string;
  category: ObjectCategory;
  description: string | null;
  open: boolean;
  onClose: () => void;
}

export function ObjectDetailPanel({
  name,
  category,
  description,
  open,
  onClose,
}: ObjectDetailPanelProps) {
  const { t, dict } = useLanguage();

  if (!open) return null;

  const categoryLabel = dict.categories[category] ?? category;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 md:hidden"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel: bottom sheet on mobile, side panel on desktop */}
      <div
        className={cn(
          'fixed z-50 glass-panel',
          'inset-x-0 bottom-0 rounded-t-2xl p-6 md:inset-y-0 md:end-0 md:w-96 md:rounded-none md:rounded-s-2xl',
          'motion-safe:animate-in motion-safe:slide-in-from-bottom md:motion-safe:slide-in-from-end'
        )}
        role="dialog"
        aria-label={t('public.objectDetails')}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-accent">{categoryLabel}</p>
            <h2 className="mt-1 text-xl font-medium text-star">{name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-star-dim hover:bg-space-border hover:text-star"
            aria-label={t('public.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {description ? (
          <p className="text-star-dim leading-relaxed">{description}</p>
        ) : null}

        <Button variant="secondary" size="sm" className="mt-6 w-full md:hidden" onClick={onClose}>
          {t('public.close')}
        </Button>
      </div>
    </>
  );
}
