'use client';

import { PlanetRenderer } from '@/components/planet/PlanetRenderer';
import { StarShape } from '@/components/universe/StarShape';
import {
  BACKGROUND_GRADIENTS,
  MOOD_PRESETS,
  STAR_TYPE_COLORS,
} from '@/lib/universe/constants';
import { ATMOSPHERE_OPTIONS, SPACE_BACKGROUND_OPTIONS } from '@/lib/universe/themes';
import { PLANET_MOOD_OPTIONS, STAR_VISUAL_OPTIONS } from '@/lib/universe/visual-styles';
import { useLanguage } from '@/lib/i18n/context';
import type {
  PlanetAtmosphere,
  SpaceBackground,
  UniverseMood,
} from '@/types/database';
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

export function AtmospherePicker({
  color,
  value,
  onChange,
}: {
  color: string;
  value: PlanetAtmosphere;
  onChange: (v: PlanetAtmosphere) => void;
}) {
  const { lang } = useLanguage();

  return (
    <div className="visual-pick-grid atmosphere">
      {ATMOSPHERE_OPTIONS.map((option) => {
        const id = option.id as PlanetAtmosphere;
        const selected = value === id;
        return (
          <button
            key={option.id}
            type="button"
            className={cn('visual-pick-card', selected && 'is-selected')}
            onClick={() => onChange(id)}
            aria-pressed={selected}
          >
            <div className="visual-pick-stage">
              <PlanetRenderer
                color={color}
                surfaceStyle="smooth"
                atmosphere={id}
                glow={id === 'none' ? 1 : 4}
                hasRing={false}
                mood="calm"
                spaceBackground="deep_space"
                size={44}
                animate={selected}
                spin={false}
              />
            </div>
            <span>{presetLabel(lang, option)}</span>
          </button>
        );
      })}
    </div>
  );
}

export function MoodPicker({
  value,
  onChange,
}: {
  value: UniverseMood;
  onChange: (v: UniverseMood) => void;
}) {
  const { lang } = useLanguage();

  return (
    <div className="visual-pick-grid moods">
      {PLANET_MOOD_OPTIONS.map((option) => {
        const id = option.id as UniverseMood;
        const selected = value === id;
        const preset = MOOD_PRESETS[id];
        return (
          <button
            key={option.id}
            type="button"
            className={cn('visual-pick-card', selected && 'is-selected')}
            onClick={() => onChange(id)}
            aria-pressed={selected}
            style={{
              borderColor: selected ? preset.accent : undefined,
            }}
          >
            <div
              className="visual-pick-stage"
              style={{
                background: `${BACKGROUND_GRADIENTS.deep_space}, ${preset.wash}`,
                backgroundColor: preset.bg,
              }}
            >
              <span
                className="mood-dot"
                style={{
                  background: preset.accent,
                  boxShadow: `0 0 18px ${preset.accent}`,
                }}
              />
            </div>
            <span>{presetLabel(lang, option)}</span>
          </button>
        );
      })}
    </div>
  );
}

export function BackgroundPicker({
  value,
  onChange,
}: {
  value: SpaceBackground;
  onChange: (v: SpaceBackground) => void;
}) {
  const { lang } = useLanguage();

  return (
    <div className="visual-pick-grid backgrounds">
      {SPACE_BACKGROUND_OPTIONS.map((option) => {
        const id = option.id as SpaceBackground;
        const selected = value === id;
        return (
          <button
            key={option.id}
            type="button"
            className={cn('visual-pick-card', selected && 'is-selected')}
            onClick={() => onChange(id)}
            aria-pressed={selected}
          >
            <div
              className="visual-pick-stage"
              style={{
                background: BACKGROUND_GRADIENTS[id],
              }}
            />
            <span>{presetLabel(lang, option)}</span>
          </button>
        );
      })}
    </div>
  );
}
