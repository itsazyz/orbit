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
  getAtmosphereScale,
  getPlanetGradient,
  getSpaceExtraLayers,
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
  const moodPreset = MOOD_PRESETS[mood] ?? MOOD_PRESETS.calm;
  const atmosphereOpacity = getAtmosphereOpacity(atmosphere);
  const atmosphereScale = getAtmosphereScale(atmosphere);
  const gradient = getPlanetGradient(color, surfaceStyle);
  const glowStyle = glowIntensity(glow);
  const isStormy = atmosphere === 'stormy';
  const isThick = atmosphere === 'thick';

  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{
        width: size * (hasRing ? 2.1 : 1.35),
        height: size * (hasRing ? 1.45 : 1.35),
        ['--glow-color' as string]: color,
      }}
    >
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size * (1.5 + glow * 0.12),
          height: size * (1.5 + glow * 0.12),
          background: `radial-gradient(circle, ${color}${glow >= 4 ? '66' : '33'} 0%, transparent 68%)`,
          filter: 'blur(10px)',
          opacity: 0.55 + glow * 0.08,
        }}
      />

      {hasRing ? (
        <>
          <div
            className={cn(
              'absolute rounded-full pointer-events-none',
              animate && 'motion-safe:animate-[spin_50s_linear_infinite]'
            )}
            style={{
              width: size * 2.05,
              height: size * 0.48,
              border: `2.5px solid ${color}cc`,
              boxShadow: `0 0 24px ${color}88, inset 0 0 16px ${color}55`,
              transform: 'rotate(-24deg)',
              background: `linear-gradient(90deg, transparent 5%, ${color}55 30%, #ffffff66 50%, ${color}55 70%, transparent 95%)`,
            }}
          />
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: size * 2.3,
              height: size * 0.58,
              border: `1.5px solid ${color}66`,
              transform: 'rotate(-24deg)',
              boxShadow: `0 0 16px ${color}44`,
            }}
          />
        </>
      ) : null}

      {atmosphereOpacity > 0 ? (
        <>
          <div
            className={cn(
              'absolute rounded-full pointer-events-none',
              isStormy && animate && 'motion-safe:animate-pulse-glow'
            )}
            style={{
              width: size * atmosphereScale,
              height: size * atmosphereScale,
              background: isStormy
                ? `conic-gradient(from 40deg, transparent, ${color}cc, transparent 35%, ${moodPreset.accent}aa, transparent 70%)`
                : isThick
                  ? `radial-gradient(circle, ${color}99 0%, ${color}44 45%, transparent 72%)`
                  : `radial-gradient(circle, ${color}66 0%, transparent 70%)`,
              filter: isStormy || isThick ? 'blur(3px)' : 'blur(1px)',
              opacity: Math.min(1, atmosphereOpacity + 0.25),
            }}
          />
          {isThick ? (
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: size * 1.55,
                height: size * 1.55,
                border: `1px solid ${color}55`,
                boxShadow: `0 0 30px ${color}44`,
              }}
            />
          ) : null}
        </>
      ) : null}

      <div
        className={cn(
          'rounded-full relative overflow-hidden z-[1]',
          animate && glow >= 3 && 'motion-safe:animate-pulse-glow',
          spin && 'motion-safe:animate-[spin_48s_linear_infinite]'
        )}
        style={{
          width: size,
          height: size,
          background: gradient,
          boxShadow: `${glowStyle}, inset -${size * 0.14}px -${size * 0.1}px ${size * 0.22}px rgba(0,0,0,0.55)`,
        }}
      >
        <PlanetSurfaceLayers surfaceStyle={surfaceStyle} color={color} size={size} />

        {isStormy ? (
          <div
            className="absolute inset-0 opacity-55 mix-blend-soft-light motion-safe:animate-[spin_12s_linear_infinite]"
            style={{
              background: `conic-gradient(from 0deg, transparent, #ffffff88, transparent 35%, ${moodPreset.accent}, transparent 70%)`,
            }}
          />
        ) : null}
      </div>

      <div
        className="absolute pointer-events-none rounded-[50%]"
        style={{
          bottom: hasRing ? size * 0.06 : size * 0.02,
          width: size * 0.75,
          height: size * 0.14,
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)',
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
  const moodPreset = MOOD_PRESETS[mood] ?? MOOD_PRESETS.calm;
  const bg = BACKGROUND_GRADIENTS[spaceBackground] ?? BACKGROUND_GRADIENTS.deep_space;
  const extras = getSpaceExtraLayers(spaceBackground);

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)} aria-hidden>
      <div
        className="absolute inset-0"
        style={{ background: bg, backgroundColor: moodPreset.bg }}
      />
      {extras.map((layer, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{ background: layer.background, opacity: layer.opacity }}
        />
      ))}
      <div
        className="absolute inset-0"
        style={{ background: moodPreset.wash, opacity: 0.85 }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            spaceBackground === 'void'
              ? 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.75) 100%)'
              : 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%)',
        }}
      />
    </div>
  );
}
