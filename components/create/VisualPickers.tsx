'use client';

import { StarShape } from '@/components/universe/StarShape';
import { STAR_TYPE_COLORS } from '@/lib/universe/constants';
import { STAR_VISUAL_OPTIONS } from '@/lib/universe/visual-styles';
import { useLanguage } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

function presetLabel(
  lang: string,
  option: { labelEn: string; labelAr: string }
) {
  return lang === 'ar' ? option.labelAr : option.labelEn;
}

export function StarShapePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const { lang } = useLanguage();

  return (
    <div className="visual-pick-grid stars">
      {STAR_VISUAL_OPTIONS.map((option) => {
        const selected = value === option.id;
        const color = STAR_TYPE_COLORS[option.id] ?? '#fff';
        return (
          <button
            key={option.id}
            type="button"
            className={cn('visual-pick-card', selected && 'is-selected')}
            onClick={() => onChange(option.id)}
            aria-pressed={selected}
          >
            <div className="visual-pick-stage dark">
              <StarShape type={option.id} size={18} color={color} icon="★" />
            </div>
            <span>{presetLabel(lang, option)}</span>
          </button>
        );
      })}
    </div>
  );
}
