'use client';

import type { PlanetSurfaceStyle } from '@/types/database';

interface PlanetSurfaceLayersProps {
  surfaceStyle: PlanetSurfaceStyle;
  color: string;
  size: number;
}

/** Extra surface detail drawn on top of the planet body */
export function PlanetSurfaceLayers({
  surfaceStyle,
  color,
  size,
}: PlanetSurfaceLayersProps) {
  const s = size;

  switch (surfaceStyle) {
    case 'cratered':
      return (
        <>
          <Spot x={0.28} y={0.24} r={0.16} opacity={0.28} size={s} />
          <Spot x={0.58} y={0.52} r={0.11} opacity={0.22} size={s} />
          <Spot x={0.68} y={0.3} r={0.07} opacity={0.18} size={s} />
          <Spot x={0.38} y={0.68} r={0.09} opacity={0.2} size={s} />
        </>
      );

    case 'banded':
    case 'striped':
      return (
        <>
          <Band y={0.22} h={0.07} opacity={0.18} size={s} />
          <Band y={0.38} h={0.05} opacity={0.12} light size={s} />
          <Band y={0.52} h={0.09} opacity={0.2} size={s} />
          <Band y={0.68} h={0.06} opacity={0.14} size={s} />
        </>
      );

    case 'crystalline':
      return (
        <>
          <Diamond x={0.42} y={0.2} r={0.32} opacity={0.45} size={s} />
          <Diamond x={0.62} y={0.48} r={0.18} opacity={0.28} size={s} />
          <Shine x={0.25} y={0.18} w={0.35} h={0.2} size={s} />
        </>
      );

    case 'oceanic':
      return (
        <>
          <Spot x={0.55} y={0.35} r={0.22} opacity={0.15} light size={s} />
          <Spot x={0.3} y={0.65} r={0.18} opacity={0.22} size={s} />
          <Band y={0.45} h={0.04} opacity={0.1} light size={s} />
        </>
      );

    case 'volcanic':
      return (
        <>
          <Spot x={0.4} y={0.4} r={0.2} opacity={0.35} tint="#ff6b35" size={s} />
          <Spot x={0.62} y={0.58} r={0.12} opacity={0.3} tint="#ff3d00" size={s} />
          <Vein path="M20 30 Q45 50 70 40 T90 70" color="#ff6b3588" size={s} />
        </>
      );

    case 'frozen':
      return (
        <>
          <Shine x={0.2} y={0.15} w={0.45} h={0.25} size={s} />
          <Spot x={0.55} y={0.55} r={0.14} opacity={0.2} light size={s} />
          <Crack lines={['M30 20 L50 45', 'M55 25 L70 55']} size={s} opacity={0.25} />
        </>
      );

    case 'stormy_surface':
      return (
        <>
          <Swirl color={color} size={s} />
          <Band y={0.4} h={0.12} opacity={0.25} size={s} />
          <Spot x={0.35} y={0.55} r={0.15} opacity={0.3} size={s} />
        </>
      );

    case 'forest':
      return (
        <>
          <Spot x={0.35} y={0.4} r={0.2} opacity={0.25} tint="#1b4332" size={s} />
          <Spot x={0.6} y={0.55} r={0.16} opacity={0.22} tint="#2d6a4f" size={s} />
          <Spot x={0.45} y={0.7} r={0.12} opacity={0.2} tint="#081c15" size={s} />
        </>
      );

    case 'desert':
      return (
        <>
          <Band y={0.35} h={0.08} opacity={0.15} light size={s} />
          <Band y={0.55} h={0.1} opacity={0.18} size={s} />
          <Spot x={0.65} y={0.4} r={0.1} opacity={0.15} size={s} />
        </>
      );

    case 'neon':
      return (
        <>
          <Ring line opacity={0.55} color={color} size={s} inset={0.18} />
          <Ring line opacity={0.35} color="#ffffff" size={s} inset={0.32} />
          <Shine x={0.22} y={0.2} w={0.3} h={0.18} size={s} />
        </>
      );

    case 'marble':
      return (
        <>
          <Vein path="M15 25 Q40 40 55 20 T85 50" color="rgba(255,255,255,0.35)" size={s} />
          <Vein path="M25 60 Q50 45 75 70" color="rgba(255,255,255,0.22)" size={s} />
          <Shine x={0.2} y={0.15} w={0.4} h={0.22} size={s} />
        </>
      );

    case 'mosaic':
      return (
        <>
          <Tiles size={s} color={color} />
        </>
      );

    case 'cracked':
      return (
        <>
          <Crack
            lines={['M25 20 L48 55 L35 80', 'M55 15 L60 50 L80 70', 'M40 40 L70 45']}
            size={s}
            opacity={0.45}
          />
        </>
      );

    case 'luminous':
      return (
        <>
          <Shine x={0.18} y={0.12} w={0.5} h={0.3} size={s} />
          <Spot x={0.5} y={0.5} r={0.35} opacity={0.2} light size={s} />
        </>
      );

    case 'shadowy':
      return (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(120deg, transparent 35%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.75) 100%)',
            }}
          />
          <Spot x={0.3} y={0.35} r={0.18} opacity={0.25} light size={s} />
        </>
      );

    case 'spotted':
      return (
        <>
          <Spot x={0.3} y={0.3} r={0.1} opacity={0.28} size={s} />
          <Spot x={0.55} y={0.25} r={0.08} opacity={0.22} size={s} />
          <Spot x={0.65} y={0.5} r={0.12} opacity={0.25} size={s} />
          <Spot x={0.35} y={0.6} r={0.09} opacity={0.2} size={s} />
          <Spot x={0.5} y={0.72} r={0.07} opacity={0.18} size={s} />
        </>
      );

    case 'aurora':
      return (
        <>
          <div
            className="absolute inset-0 opacity-50 mix-blend-screen"
            style={{
              background: `conic-gradient(from 200deg, transparent, ${color}88, #7cffa866, transparent 55%, #c78cff66, transparent)`,
            }}
          />
        </>
      );

    case 'metallic':
      return (
        <>
          <Shine x={0.15} y={0.12} w={0.55} h={0.28} size={s} />
          <Band y={0.48} h={0.04} opacity={0.2} light size={s} />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                'linear-gradient(160deg, rgba(255,255,255,0.35) 0%, transparent 40%, rgba(0,0,0,0.25) 100%)',
            }}
          />
        </>
      );

    case 'cloudy':
    case 'misty':
      return (
        <>
          <Spot x={0.35} y={0.35} r={0.25} opacity={0.2} light size={s} />
          <Spot x={0.6} y={0.5} r={0.22} opacity={0.18} light size={s} />
          <Spot x={0.4} y={0.65} r={0.18} opacity={0.15} light size={s} />
        </>
      );

    case 'lava_veins':
      return (
        <>
          <Vein path="M20 25 Q40 55 55 40 T85 75" color="#ff4d0088" size={s} width={2.5} />
          <Vein path="M30 70 Q50 50 75 60" color="#ff9d6c88" size={s} width={2} />
          <Spot x={0.45} y={0.45} r={0.1} opacity={0.35} tint="#ff6b35" size={s} />
        </>
      );

    case 'pearl':
      return (
        <>
          <Shine x={0.22} y={0.16} w={0.45} h={0.28} size={s} />
          <Ring line opacity={0.2} color="#ffffff" size={s} inset={0.22} />
        </>
      );

    case 'geometric':
      return (
        <>
          <GeoLines size={s} color={color} />
        </>
      );

    case 'coral':
      return (
        <>
          <Spot x={0.4} y={0.4} r={0.14} opacity={0.22} tint="#ff7eb3" size={s} />
          <Spot x={0.6} y={0.55} r={0.12} opacity={0.2} tint="#ff9d6c" size={s} />
          <Spot x={0.35} y={0.65} r={0.1} opacity={0.18} light size={s} />
        </>
      );

    case 'eclipse':
      return (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 70% 40%, transparent 20%, rgba(0,0,0,0.65) 55%, rgba(0,0,0,0.9) 100%)',
            }}
          />
          <Ring line opacity={0.35} color={color} size={s} inset={0.08} />
        </>
      );

    case 'prism':
      return (
        <>
          <Diamond x={0.35} y={0.25} r={0.28} opacity={0.4} size={s} />
          <div
            className="absolute inset-0 opacity-40 mix-blend-screen"
            style={{
              background: `conic-gradient(from 90deg, #ff7eb366, #7c8cff66, #7cffa866, #ffd56c66, #ff7eb366)`,
            }}
          />
        </>
      );

    case 'smooth':
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
}: {
  x: number;
  y: number;
  r: number;
  opacity: number;
  size: number;
  light?: boolean;
  tint?: string;
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
        background: tint ?? (light ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'),
        opacity,
      }}
    />
  );
}

function Band({
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
      className="absolute inset-x-0"
      style={{
        top: `${y * 100}%`,
        height: size * h,
        background: light ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)',
        opacity,
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
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  size: number;
}) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: size * w,
        height: size * h,
        background: 'radial-gradient(ellipse, rgba(255,255,255,0.4) 0%, transparent 70%)',
        filter: 'blur(1px)',
      }}
    />
  );
}

function Diamond({
  x,
  y,
  r,
  opacity,
  size,
}: {
  x: number;
  y: number;
  r: number;
  opacity: number;
  size: number;
}) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: size * r,
        height: size * r,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.45), transparent)',
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        opacity,
        transform: 'translate(-50%, -50%)',
      }}
    />
  );
}

function Vein({
  path,
  color,
  size,
  width = 1.8,
}: {
  path: string;
  color: string;
  size: number;
  width?: number;
}) {
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      preserveAspectRatio="none"
    >
      <path d={path} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />
    </svg>
  );
}

function Crack({
  lines,
  size,
  opacity,
}: {
  lines: string[];
  size: number;
  opacity: number;
}) {
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ opacity }}
    >
      {lines.map((d) => (
        <path key={d} d={d} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="1.4" />
      ))}
    </svg>
  );
}

function Ring({
  size,
  color,
  opacity,
  inset,
  line,
}: {
  size: number;
  color: string;
  opacity: number;
  inset: number;
  line?: boolean;
}) {
  const dim = size * (1 - inset * 2);
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: dim,
        height: dim,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        border: line ? `1.5px solid ${color}` : undefined,
        boxShadow: line ? `0 0 10px ${color}66` : undefined,
        opacity,
      }}
    />
  );
}

function Swirl({ color, size }: { color: string; size: number }) {
  return (
    <div
      className="absolute inset-0 opacity-40 mix-blend-soft-light"
      style={{
        background: `conic-gradient(from 20deg, transparent, ${color}99, transparent 40%, ${color}55, transparent 70%)`,
        width: size,
        height: size,
      }}
    />
  );
}

function Tiles({ size, color }: { size: number; color: string }) {
  return (
    <div
      className="absolute inset-0 opacity-35"
      style={{
        backgroundImage: `
          linear-gradient(45deg, ${color}55 25%, transparent 25%),
          linear-gradient(-45deg, rgba(255,255,255,0.15) 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, ${color}44 75%),
          linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.2) 75%)
        `,
        backgroundSize: `${size * 0.18}px ${size * 0.18}px`,
        backgroundPosition: `0 0, 0 ${size * 0.09}px, ${size * 0.09}px -${size * 0.09}px, -${size * 0.09}px 0`,
      }}
    />
  );
}

function GeoLines({ size, color }: { size: number; color: string }) {
  return (
    <svg
      className="absolute inset-0 pointer-events-none opacity-45"
      viewBox="0 0 100 100"
      width={size}
      height={size}
    >
      <polygon
        points="50,12 85,35 75,75 25,75 15,35"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        opacity="0.7"
      />
      <line x1="50" y1="12" x2="50" y2="75" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
      <line x1="15" y1="35" x2="85" y2="35" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
    </svg>
  );
}
