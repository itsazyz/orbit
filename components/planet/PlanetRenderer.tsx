'use client';

import type {
  PlanetAtmosphere,
  PlanetSurfaceStyle,
  SpaceBackground,
  UniverseMood,
} from '@/types/database';
import {
  BACKGROUND_GRADIENTS,
  getAtmosphereOpacity,
  getPlanetGradient,
  glowIntensity,
  MOOD_PRESETS,
} from '@/lib/universe/constants';
import { cn } from '@/lib/utils';

interface PlanetRendererProps {
  color: string;
  surfaceStyle: PlanetSurfaceStyle;
  atmosphere: PlanetAtmosphere;
  glow: number;
  hasRing: boolean;
  mood: UniverseMood;
  spaceBackground: SpaceBackground;
  size?: number;
  className?: string;
  animate?: boolean;
}

export function PlanetRenderer({
  color,
  surfaceStyle,
  atmosphere,
  glow,
  hasRing,
  mood,
  spaceBackground,
  size = 120,
  className,
  animate = true,
}: PlanetRendererProps) {
  const moodPreset = MOOD_PRESETS[mood];
  const atmosphereOpacity = getAtmosphereOpacity(atmosphere);
  const gradient = getPlanetGradient(color, surfaceStyle);
  const glowStyle = glowIntensity(glow);

  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{
        width: size,
        height: size,
        ['--glow-color' as string]: color,
      }}
    >
      {hasRing ? (
        <div
          className="absolute rounded-full border border-white/20"
          style={{
            width: size * 1.8,
            height: size * 0.4,
            transform: 'rotate(-20deg)',
            boxShadow: '0 0 12px rgba(255,255,255,0.1)',
          }}
        />
      ) : null}

      {atmosphereOpacity > 0 ? (
        <div
          className="absolute rounded-full"
          style={{
            width: size * 1.15,
            height: size * 1.15,
            background: `radial-gradient(circle, ${color}${Math.round(atmosphereOpacity * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
          }}
        />
      ) : null}

      <div
        className={cn('rounded-full', animate && 'motion-safe:animate-pulse-glow')}
        style={{
          width: size,
          height: size,
          background: gradient,
          boxShadow: glowStyle,
        }}
      >
        {surfaceStyle === 'cratered' ? (
          <>
            <div className="absolute rounded-full bg-black/20" style={{ width: size * 0.15, height: size * 0.15, top: '25%', left: '30%' }} />
            <div className="absolute rounded-full bg-black/15" style={{ width: size * 0.1, height: size * 0.1, top: '55%', left: '60%' }} />
          </>
        ) : null}
      </div>
    </div>
  );
}

export function UniverseBackground({
  mood,
  spaceBackground,
  className,
}: {
  mood: UniverseMood;
  spaceBackground: SpaceBackground;
  className?: string;
}) {
  const moodPreset = MOOD_PRESETS[mood];
  const bg = BACKGROUND_GRADIENTS[spaceBackground] ?? BACKGROUND_GRADIENTS.deep_space;

  return (
    <div
      className={cn('absolute inset-0', className)}
      style={{ background: bg, backgroundColor: moodPreset.bg }}
    />
  );
}
