'use client';

import type { PlanetSurfaceStyle } from '@/types/database';

interface PlanetSurfaceLayersProps {
  surfaceStyle: PlanetSurfaceStyle;
  color: string;
  size: number;
}

/** Soft, planet-like surface detail — no harsh grid/hatch lines */
export function PlanetSurfaceLayers({
  surfaceStyle,
  color,
  size,
}: PlanetSurfaceLayersProps) {
  const s = size;

  switch (surfaceStyle) {
    case 'smooth':
      return <Shine x={0.18} y={0.12} w={0.48} h={0.26} size={s} strong />;

    case 'cratered':
      return (
        <>
          <Spot x={0.3} y={0.28} r={0.18} opacity={0.4} size={s} softRim />
          <Spot x={0.6} y={0.5} r={0.14} opacity={0.35} size={s} softRim />
          <Spot x={0.68} y={0.3} r={0.09} opacity={0.3} size={s} softRim />
          <Spot x={0.4} y={0.68} r={0.12} opacity={0.32} size={s} softRim />
        </>
      );

    case 'banded':
      return (
        <>
          <SoftBand y={0.22} h={0.1} opacity={0.22} size={s} />
          <SoftBand y={0.4} h={0.08} opacity={0.16} light size={s} />
          <SoftBand y={0.56} h={0.11} opacity={0.24} size={s} />
          <SoftBand y={0.74} h={0.08} opacity={0.18} light size={s} />
          <Shine x={0.22} y={0.14} w={0.35} h={0.18} size={s} />
        </>
      );

    case 'striped':
      return (
        <>
          <SoftBand y={0.2} h={0.09} opacity={0.2} size={s} />
          <SoftBand y={0.38} h={0.07} opacity={0.14} light size={s} />
          <SoftBand y={0.52} h={0.1} opacity={0.22} size={s} />
          <SoftBand y={0.7} h={0.08} opacity={0.16} size={s} />
        </>
      );

    case 'crystalline':
      return (
        <>
          <Shine x={0.2} y={0.12} w={0.42} h={0.24} size={s} strong />
          <Spot x={0.55} y={0.4} r={0.16} opacity={0.25} light size={s} />
          <Spot x={0.35} y={0.58} r={0.12} opacity={0.2} light size={s} />
        </>
      );

    case 'prism':
      return (
        <div
          className="absolute inset-0 opacity-40 mix-blend-soft-light"
          style={{
            background: `radial-gradient(circle at 30% 30%, #ffb3d988 0%, transparent 40%), radial-gradient(circle at 70% 55%, #7cffa866 0%, transparent 40%), radial-gradient(circle at 45% 75%, #6cd9ff66 0%, transparent 35%)`,
          }}
        />
      );

    case 'oceanic':
      return (
        <>
          <Spot x={0.55} y={0.35} r={0.24} opacity={0.28} light size={s} />
          <Spot x={0.3} y={0.62} r={0.2} opacity={0.3} tint="#0a3040" size={s} />
          <SoftBand y={0.48} h={0.06} opacity={0.12} light size={s} />
        </>
      );

    case 'coral':
      return (
        <>
          <Spot x={0.36} y={0.36} r={0.16} opacity={0.4} tint="#ff7eb3" size={s} />
          <Spot x={0.6} y={0.52} r={0.14} opacity={0.35} tint="#ff9d6c" size={s} />
          <Spot x={0.45} y={0.68} r={0.12} opacity={0.32} tint="#fda4af" size={s} />
        </>
      );

    case 'volcanic':
      return (
        <>
          <Spot x={0.42} y={0.42} r={0.24} opacity={0.5} tint="#ff6b35" size={s} />
          <Spot x={0.42} y={0.42} r={0.1} opacity={0.65} tint="#ffe566" size={s} />
          <Spot x={0.64} y={0.58} r={0.14} opacity={0.4} tint="#ff3d00" size={s} />
        </>
      );

    case 'lava_veins':
      return (
        <>
          <Spot x={0.35} y={0.4} r={0.14} opacity={0.45} tint="#ff6b35" size={s} />
          <Spot x={0.58} y={0.52} r={0.12} opacity={0.4} tint="#ff9d6c" size={s} />
          <Spot x={0.48} y={0.68} r={0.1} opacity={0.35} tint="#ff4d00" size={s} />
          <SoftGlow path blob size={s} color="#ff6b3566" />
        </>
      );

    case 'frozen':
      return (
        <>
          <Shine x={0.16} y={0.1} w={0.5} h={0.28} size={s} strong />
          <Spot x={0.55} y={0.5} r={0.16} opacity={0.22} light size={s} />
          <Spot x={0.35} y={0.65} r={0.12} opacity={0.18} light size={s} />
        </>
      );

    case 'pearl':
      return (
        <>
          <Shine x={0.18} y={0.12} w={0.5} h={0.3} size={s} strong />
          <Spot x={0.55} y={0.48} r={0.18} opacity={0.18} light size={s} />
        </>
      );

    case 'stormy_surface':
      return (
        <>
          <div
            className="absolute inset-0 opacity-35 mix-blend-soft-light"
            style={{
              background: `radial-gradient(circle at 40% 45%, ${color}99 0%, transparent 45%), radial-gradient(circle at 65% 55%, #ffffff33 0%, transparent 35%)`,
            }}
          />
          <SoftBand y={0.44} h={0.12} opacity={0.22} size={s} />
        </>
      );

    case 'forest':
      return (
        <>
          <Spot x={0.34} y={0.4} r={0.22} opacity={0.4} tint="#14532d" size={s} />
          <Spot x={0.6} y={0.52} r={0.18} opacity={0.35} tint="#166534" size={s} />
          <Spot x={0.46} y={0.68} r={0.15} opacity={0.32} tint="#052e16" size={s} />
        </>
      );

    case 'desert':
      return (
        <>
          <SoftBand y={0.32} h={0.09} opacity={0.18} light size={s} />
          <SoftBand y={0.52} h={0.11} opacity={0.22} size={s} />
          <SoftBand y={0.72} h={0.08} opacity={0.16} light size={s} />
          <Spot x={0.65} y={0.4} r={0.12} opacity={0.25} tint="#92400e" size={s} />
        </>
      );

    case 'neon':
      return (
        <>
          <Shine x={0.2} y={0.14} w={0.4} h={0.22} size={s} strong />
          <div
            className="absolute inset-0 opacity-45"
            style={{
              background: `radial-gradient(circle at 50% 50%, transparent 42%, ${color}66 58%, transparent 72%)`,
            }}
          />
        </>
      );

    case 'marble':
      return (
        <>
          <Shine x={0.18} y={0.12} w={0.42} h={0.24} size={s} strong />
          <Spot x={0.48} y={0.42} r={0.2} opacity={0.12} light size={s} />
          <Spot x={0.62} y={0.6} r={0.14} opacity={0.1} light size={s} />
        </>
      );

    case 'mosaic':
      return (
        <>
          <Spot x={0.3} y={0.3} r={0.14} opacity={0.35} tint={color} size={s} />
          <Spot x={0.55} y={0.28} r={0.12} opacity={0.3} tint="#ff9d6c" size={s} />
          <Spot x={0.68} y={0.52} r={0.13} opacity={0.32} tint="#7c8cff" size={s} />
          <Spot x={0.38} y={0.62} r={0.12} opacity={0.28} tint="#c78cff" size={s} />
          <Spot x={0.52} y={0.72} r={0.1} opacity={0.25} light size={s} />
        </>
      );

    case 'geometric':
      return (
        <>
          <Spot x={0.4} y={0.35} r={0.2} opacity={0.22} light size={s} />
          <Spot x={0.6} y={0.55} r={0.16} opacity={0.2} size={s} />
          <Shine x={0.22} y={0.16} w={0.35} h={0.2} size={s} />
        </>
      );

    case 'cracked':
      return (
        <>
          <Spot x={0.4} y={0.4} r={0.18} opacity={0.25} size={s} />
          <Spot x={0.6} y={0.55} r={0.14} opacity={0.22} size={s} />
          <Spot x={0.35} y={0.65} r={0.1} opacity={0.18} size={s} />
        </>
      );

    case 'luminous':
      return (
        <>
          <Shine x={0.14} y={0.1} w={0.55} h={0.34} size={s} strong />
          <div
            className="absolute inset-0 opacity-35 mix-blend-soft-light"
            style={{
              background: `radial-gradient(circle at 40% 35%, #ffffffaa 0%, ${color}55 45%, transparent 70%)`,
            }}
          />
        </>
      );

    case 'shadowy':
      return (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 30% 35%, transparent 20%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.65) 100%)',
          }}
        />
      );

    case 'eclipse':
      return (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 72% 38%, transparent 14%, rgba(0,0,0,0.45) 32%, rgba(0,0,0,0.85) 60%, #000 100%)',
          }}
        />
      );

    case 'spotted':
      return (
        <>
          <Spot x={0.3} y={0.3} r={0.12} opacity={0.35} size={s} />
          <Spot x={0.55} y={0.25} r={0.1} opacity={0.3} size={s} />
          <Spot x={0.68} y={0.5} r={0.13} opacity={0.32} size={s} />
          <Spot x={0.36} y={0.6} r={0.1} opacity={0.28} size={s} />
          <Spot x={0.52} y={0.72} r={0.09} opacity={0.25} size={s} />
        </>
      );

    case 'aurora':
      return (
        <div
          className="absolute inset-0 opacity-45 mix-blend-soft-light"
          style={{
            background: `radial-gradient(circle at 40% 35%, #80ffdb88 0%, transparent 40%), radial-gradient(circle at 65% 55%, ${color}77 0%, transparent 40%), radial-gradient(circle at 45% 70%, #c78cff66 0%, transparent 35%)`,
          }}
        />
      );

    case 'metallic':
      return (
        <>
          <Shine x={0.14} y={0.1} w={0.55} h={0.3} size={s} strong />
          <div
            className="absolute inset-0 opacity-35"
            style={{
              background:
                'linear-gradient(160deg, rgba(255,255,255,0.4) 0%, transparent 40%, rgba(0,0,0,0.25) 100%)',
            }}
          />
        </>
      );

    case 'cloudy':
      return (
        <>
          <Spot x={0.34} y={0.34} r={0.26} opacity={0.32} light size={s} />
          <Spot x={0.6} y={0.5} r={0.22} opacity={0.28} light size={s} />
          <Spot x={0.42} y={0.66} r={0.18} opacity={0.24} light size={s} />
        </>
      );

    case 'misty':
      return (
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(circle at 40% 40%, rgba(255,255,255,0.4) 0%, transparent 45%), radial-gradient(circle at 65% 60%, rgba(200,220,255,0.3) 0%, transparent 40%)',
          }}
        />
      );

    default:
      return <Shine x={0.2} y={0.15} w={0.4} h={0.22} size={s} />;
  }
}

function Spot({
  x,
  y,
  r,
  opacity,
  size,
  light,
  tint,
  softRim,
}: {
  x: number;
  y: number;
  r: number;
  opacity: number;
  size: number;
  light?: boolean;
  tint?: string;
  softRim?: boolean;
}) {
  return (
    <div
      className="absolute rounded-full"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: size * r,
        height: size * r,
        transform: 'translate(-50%, -50%)',
        background: tint
          ? `radial-gradient(circle, ${tint} 0%, transparent 70%)`
          : light
            ? 'radial-gradient(circle, rgba(255,255,255,0.55) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(0,0,0,0.45) 0%, transparent 70%)',
        opacity,
        boxShadow: softRim ? 'inset 0 0 6px rgba(0,0,0,0.25)' : undefined,
      }}
    />
  );
}

function SoftBand({
  y,
  h,
  opacity,
  size,
  light,
}: {
  y: number;
  h: number;
  opacity: number;
  size: number;
  light?: boolean;
}) {
  return (
    <div
      className="absolute inset-x-[-8%]"
      style={{
        top: `${y * 100}%`,
        height: size * h,
        background: light
          ? 'linear-gradient(180deg, transparent, rgba(255,255,255,0.22), transparent)'
          : 'linear-gradient(180deg, transparent, rgba(0,0,0,0.28), transparent)',
        opacity,
        filter: 'blur(1.5px)',
        borderRadius: '40%',
      }}
    />
  );
}

function Shine({
  x,
  y,
  w,
  h,
  size,
  strong,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  size: number;
  strong?: boolean;
}) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: size * w,
        height: size * h,
        background: strong
          ? 'radial-gradient(ellipse, rgba(255,255,255,0.55) 0%, transparent 70%)'
          : 'radial-gradient(ellipse, rgba(255,255,255,0.35) 0%, transparent 70%)',
        filter: 'blur(1px)',
      }}
    />
  );
}

function SoftGlow({
  size,
  color,
}: {
  size: number;
  color: string;
  path?: boolean;
  blob?: boolean;
}) {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-50"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(ellipse at 40% 50%, ${color} 0%, transparent 45%), radial-gradient(ellipse at 65% 60%, ${color} 0%, transparent 40%)`,
      }}
    />
  );
}
