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
import { PlanetSurfaceLayers } from '@/components/planet/PlanetSurfaceLayers';
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
  spin?: boolean;
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
  spin = false,
}: PlanetRendererProps) {
  const moodPreset = MOOD_PRESETS[mood];
  const atmosphereOpacity = getAtmosphereOpacity(atmosphere);
  const gradient = getPlanetGradient(color, surfaceStyle);
  const glowStyle = glowIntensity(glow);
  const isStormy = atmosphere === 'stormy';

  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{
        width: size * (hasRing ? 1.95 : 1.2),
        height: size * (hasRing ? 1.35 : 1.2),
        ['--glow-color' as string]: color,
      }}
    >
      {/* Soft ambient bloom behind planet */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size * 1.6,
          height: size * 1.6,
          background: `radial-gradient(circle, ${color}33 0%, transparent 68%)`,
          filter: 'blur(8px)',
          opacity: 0.7 + glow * 0.05,
        }}
      />

      {hasRing ? (
        <>
          <div
            className={cn(
              'absolute rounded-full pointer-events-none',
              animate && 'motion-safe:animate-[spin_60s_linear_infinite]'
            )}
            style={{
              width: size * 1.85,
              height: size * 0.42,
              border: '1.5px solid rgba(255,255,255,0.22)',
              boxShadow: `0 0 18px ${color}44, inset 0 0 12px ${color}22`,
              transform: 'rotate(-22deg)',
              background: `linear-gradient(90deg, transparent 8%, ${color}18 35%, ${color}33 50%, ${color}18 65%, transparent 92%)`,
            }}
          />
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: size * 2.05,
              height: size * 0.5,
              border: '1px solid rgba(255,255,255,0.08)',
              transform: 'rotate(-22deg)',
            }}
          />
        </>
      ) : null}

      {atmosphereOpacity > 0 ? (
        <div
          className={cn(
            'absolute rounded-full pointer-events-none',
            isStormy && animate && 'motion-safe:animate-pulse-glow'
          )}
          style={{
            width: size * (isStormy ? 1.28 : 1.18),
            height: size * (isStormy ? 1.28 : 1.18),
            background: isStormy
              ? `conic-gradient(from 40deg, ${color}00, ${color}${Math.round(atmosphereOpacity * 200)
                  .toString(16)
                  .padStart(2, '0')}, ${color}00, ${moodPreset.accent}55, ${color}00)`
              : `radial-gradient(circle, ${color}${Math.round(atmosphereOpacity * 255)
                  .toString(16)
                  .padStart(2, '0')} 0%, transparent 70%)`,
            filter: isStormy ? 'blur(2px)' : undefined,
          }}
        />
      ) : null}

      <div
        className={cn(
          'rounded-full relative overflow-hidden z-[1]',
          animate && 'motion-safe:animate-pulse-glow',
          spin && 'motion-safe:animate-[spin_48s_linear_infinite]'
        )}
        style={{
          width: size,
          height: size,
          background: gradient,
          boxShadow: `${glowStyle}, inset -${size * 0.12}px -${size * 0.08}px ${size * 0.2}px rgba(0,0,0,0.45)`,
        }}
      >
        <PlanetSurfaceLayers surfaceStyle={surfaceStyle} color={color} size={size} />

        {isStormy ? (
          <div
            className="absolute inset-0 opacity-40 mix-blend-soft-light motion-safe:animate-[spin_20s_linear_infinite]"
            style={{
              background: `conic-gradient(from 0deg, transparent, ${color}88, transparent 40%, ${moodPreset.accent}66, transparent 75%)`,
            }}
          />
        ) : null}
      </div>

      {/* Ground shadow for depth */}
      <div
        className="absolute pointer-events-none rounded-[50%]"
        style={{
          bottom: hasRing ? size * 0.08 : size * 0.02,
          width: size * 0.7,
          height: size * 0.12,
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.45) 0%, transparent 70%)',
          filter: 'blur(4px)',
        }}
      />
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
    <div className={cn('absolute inset-0 overflow-hidden', className)} aria-hidden>
      <div
        className="absolute inset-0"
        style={{ background: bg, backgroundColor: moodPreset.bg }}
      />
      {/* Mood accent wash */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(ellipse at 20% 30%, ${moodPreset.glow} 0%, transparent 45%), radial-gradient(ellipse at 80% 70%, ${moodPreset.accent}22 0%, transparent 40%)`,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />
    </div>
  );
}
