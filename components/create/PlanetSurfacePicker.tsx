'use client';

import { PlanetRenderer } from '@/components/planet/PlanetRenderer';
import {
  PLANET_SURFACE_CATALOG,
  type PlanetSurfaceId,
} from '@/lib/universe/planet-surfaces';
import { useLanguage } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

interface PlanetSurfacePickerProps {
  color: string;
  value: string;
  onChange: (surface: PlanetSurfaceId) => void;
}

export function PlanetSurfacePicker({
  color,
  value,
  onChange,
}: PlanetSurfacePickerProps) {
  const { lang } = useLanguage();

  return (
    <div className="planet-surface-picker">
      <div className="planet-surface-grid">
        {PLANET_SURFACE_CATALOG.map((surface) => {
          const selected = value === surface.id;
          const label = lang === 'ar' ? surface.labelAr : surface.labelEn;
          const vibe = lang === 'ar' ? surface.vibeAr : surface.vibeEn;

          return (
            <button
              key={surface.id}
              type="button"
              onClick={() => onChange(surface.id)}
              className={cn('planet-surface-card', selected && 'is-selected')}
              aria-pressed={selected}
              aria-label={`${label} — ${vibe}`}
            >
              <div className="planet-surface-preview">
                <PlanetRenderer
                  color={color}
                  surfaceStyle={surface.id}
                  atmosphere="thin"
                  glow={selected ? 4 : 2}
                  hasRing={false}
                  mood="calm"
                  spaceBackground="deep_space"
                  size={56}
                  animate={selected}
                  spin={false}
                />
              </div>
              <span className="planet-surface-name">{label}</span>
              <span className="planet-surface-vibe">{vibe}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
