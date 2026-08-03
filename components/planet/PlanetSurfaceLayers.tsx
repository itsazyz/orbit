'use client';

import type { PlanetSurfaceStyle } from '@/types/database';

interface PlanetSurfaceLayersProps {
  surfaceStyle: PlanetSurfaceStyle;
  color: string;
  size: number;
}

/** Bold, clearly different surface overlays */
export function PlanetSurfaceLayers({
  surfaceStyle,
  color,
  size,
}: PlanetSurfaceLayersProps) {
  const s = size;

  switch (surfaceStyle) {
    case 'smooth':
      return <Shine x={0.18} y={0.12} w={0.5} h={0.28} size={s} strong />;

    case 'cratered':
      return (
        <>
          <Spot x={0.28} y={0.26} r={0.22} opacity={0.55} size={s} rim />
          <Spot x={0.62} y={0.48} r={0.16} opacity={0.45} size={s} rim />
          <Spot x={0.7} y={0.28} r={0.1} opacity={0.4} size={s} rim />
          <Spot x={0.4} y={0.7} r={0.14} opacity={0.4} size={s} rim />
          <Spot x={0.5} y={0.38} r={0.08} opacity={0.35} size={s} rim />
        </>
      );

    case 'banded':
      return (
        <>
          <Band y={0.15} h={0.1} opacity={0.45} size={s} />
          <Band y={0.32} h={0.07} opacity={0.35} light size={s} />
          <Band y={0.48} h={0.12} opacity={0.5} size={s} />
          <Band y={0.68} h={0.08} opacity={0.4} light size={s} />
          <Band y={0.82} h={0.1} opacity={0.35} size={s} />
        </>
      );

    case 'striped':
      return (
        <div
          className="absolute inset-0"
          style={{
            background: `repeating-linear-gradient(20deg, transparent 0 6px, rgba(0,0,0,0.35) 6px 11px, rgba(255,255,255,0.2) 11px 14px)`,
            opacity: 0.85,
          }}
        />
      );

    case 'crystalline':
      return (
        <>
          <Diamond x={0.4} y={0.22} r={0.42} opacity={0.7} size={s} />
          <Diamond x={0.65} y={0.5} r={0.26} opacity={0.5} size={s} />
          <Diamond x={0.3} y={0.58} r={0.2} opacity={0.4} size={s} />
          <Shine x={0.2} y={0.12} w={0.4} h={0.22} size={s} strong />
        </>
      );

    case 'prism':
      return (
        <div
          className="absolute inset-0 mix-blend-screen opacity-70"
          style={{
            background:
              'conic-gradient(from 0deg, #ff7eb3, #7c8cff, #7cffa8, #ffd56c, #6cd9ff, #ff7eb3)',
          }}
        />
      );

    case 'oceanic':
      return (
        <>
          <div
            className="absolute inset-0 opacity-50"
            style={{
              background:
                'repeating-radial-gradient(circle at 40% 60%, transparent 0 8%, rgba(255,255,255,0.15) 8% 10%)',
            }}
          />
          <Spot x={0.55} y={0.35} r={0.28} opacity={0.35} light size={s} />
          <Spot x={0.28} y={0.62} r={0.22} opacity={0.4} tint="#0a3040" size={s} />
        </>
      );

    case 'coral':
      return (
        <>
          <Spot x={0.35} y={0.35} r={0.18} opacity={0.55} tint="#ff7eb3" size={s} />
          <Spot x={0.6} y={0.5} r={0.16} opacity={0.5} tint="#ff9d6c" size={s} />
          <Spot x={0.45} y={0.68} r={0.14} opacity={0.45} tint="#fda4af" size={s} />
          <Spot x={0.7} y={0.3} r={0.1} opacity={0.4} tint="#fb7185" size={s} />
        </>
      );

    case 'volcanic':
      return (
        <>
          <Spot x={0.42} y={0.4} r={0.28} opacity={0.7} tint="#ff6b35" size={s} />
          <Spot x={0.42} y={0.4} r={0.12} opacity={0.9} tint="#ffe566" size={s} />
          <Spot x={0.65} y={0.58} r={0.16} opacity={0.55} tint="#ff3d00" size={s} />
          <Vein path="M18 28 Q40 55 60 38 T90 72" color="#ff9d6ccc" size={s} width={3.5} />
        </>
      );

    case 'lava_veins':
      return (
        <>
          <Vein path="M15 20 Q35 60 55 35 T90 80" color="#ff4d00" size={s} width={4} />
          <Vein path="M25 75 Q50 45 80 55" color="#ffdd55" size={s} width={3} />
          <Vein path="M40 15 Q55 40 70 25" color="#ff6b35" size={s} width={2.5} />
          <Spot x={0.48} y={0.48} r={0.12} opacity={0.7} tint="#ff9d6c" size={s} />
        </>
      );

    case 'frozen':
      return (
        <>
          <Shine x={0.15} y={0.1} w={0.55} h={0.32} size={s} strong />
          <Crack
            lines={['M25 18 L48 52', 'M55 15 L72 58', 'M35 40 L65 45', 'M40 70 L60 85']}
            size={s}
            opacity={0.55}
            color="rgba(200,240,255,0.8)"
          />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                'repeating-linear-gradient(135deg, transparent 0 10px, rgba(255,255,255,0.2) 10px 12px)',
            }}
          />
        </>
      );

    case 'pearl':
      return (
        <>
          <Shine x={0.18} y={0.12} w={0.55} h={0.35} size={s} strong />
          <Ring line opacity={0.45} color="#ffffff" size={s} inset={0.18} />
          <Ring line opacity={0.25} color="#f0abfc" size={s} inset={0.32} />
        </>
      );

    case 'stormy_surface':
      return (
        <>
          <Swirl color={color} size={s} />
          <div
            className="absolute inset-0 opacity-50 mix-blend-overlay motion-safe:animate-[spin_14s_linear_infinite]"
            style={{
              background: `conic-gradient(from 90deg, transparent, #ffffff55, transparent 30%, ${color}aa, transparent 65%)`,
            }}
          />
          <Band y={0.42} h={0.16} opacity={0.4} size={s} />
        </>
      );

    case 'forest':
      return (
        <>
          <Spot x={0.32} y={0.38} r={0.26} opacity={0.55} tint="#14532d" size={s} />
          <Spot x={0.62} y={0.52} r={0.22} opacity={0.5} tint="#166534" size={s} />
          <Spot x={0.45} y={0.7} r={0.18} opacity={0.45} tint="#052e16" size={s} />
          <Spot x={0.55} y={0.3} r={0.12} opacity={0.4} tint="#4ade80" size={s} />
        </>
      );

    case 'desert':
      return (
        <>
          <Band y={0.28} h={0.1} opacity={0.35} light size={s} />
          <Band y={0.48} h={0.14} opacity={0.4} size={s} />
          <Band y={0.7} h={0.1} opacity={0.3} light size={s} />
          <Spot x={0.68} y={0.38} r={0.14} opacity={0.35} tint="#92400e" size={s} />
        </>
      );

    case 'neon':
      return (
        <>
          <Ring line opacity={0.9} color={color} size={s} inset={0.12} />
          <Ring line opacity={0.7} color="#ffffff" size={s} inset={0.26} />
          <Ring line opacity={0.55} color={color} size={s} inset={0.4} />
          <Shine x={0.2} y={0.15} w={0.35} h={0.2} size={s} strong />
        </>
      );

    case 'marble':
      return (
        <>
          <Vein path="M12 22 Q38 48 52 18 T88 55" color="rgba(255,255,255,0.75)" size={s} width={2.8} />
          <Vein path="M20 70 Q48 40 82 75" color="rgba(255,255,255,0.45)" size={s} width={2.2} />
          <Vein path="M35 10 Q50 35 65 15" color="rgba(200,180,255,0.5)" size={s} width={1.8} />
          <Shine x={0.18} y={0.12} w={0.45} h={0.25} size={s} strong />
        </>
      );

    case 'mosaic':
      return <Tiles size={s} color={color} bold />;

    case 'geometric':
      return <GeoLines size={s} color={color} bold />;

    case 'cracked':
      return (
        <>
          <Crack
            lines={[
              'M20 15 L48 55 L30 90',
              'M55 10 L62 48 L88 75',
              'M38 38 L75 42',
              'M45 60 L70 85',
            ]}
            size={s}
            opacity={0.75}
            color="rgba(0,0,0,0.85)"
          />
          <Crack
            lines={['M22 16 L49 54', 'M56 12 L63 47']}
            size={s}
            opacity={0.45}
            color="rgba(255,200,150,0.5)"
          />
        </>
      );

    case 'luminous':
      return (
        <>
          <Shine x={0.12} y={0.08} w={0.65} h={0.4} size={s} strong />
          <div
            className="absolute inset-0 opacity-45 mix-blend-screen"
            style={{
              background: `radial-gradient(circle at 40% 35%, #ffffffcc 0%, ${color}88 40%, transparent 70%)`,
            }}
          />
        </>
      );

    case 'shadowy':
      return (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(125deg, transparent 25%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.85) 100%)',
            }}
          />
          <Spot x={0.28} y={0.32} r={0.2} opacity={0.35} light size={s} />
        </>
      );

    case 'eclipse':
      return (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 75% 38%, transparent 12%, rgba(0,0,0,0.55) 28%, rgba(0,0,0,0.92) 55%, #000 100%)',
            }}
          />
          <Ring line opacity={0.7} color={color} size={s} inset={0.06} />
        </>
      );

    case 'spotted':
      return (
        <>
          {[
            [0.28, 0.28, 0.14],
            [0.55, 0.22, 0.11],
            [0.7, 0.48, 0.16],
            [0.35, 0.58, 0.12],
            [0.52, 0.72, 0.1],
            [0.22, 0.48, 0.09],
          ].map(([x, y, r], i) => (
            <Spot key={i} x={x!} y={y!} r={r!} opacity={0.5} size={s} />
          ))}
        </>
      );

    case 'aurora':
      return (
        <div
          className="absolute inset-0 opacity-75 mix-blend-screen"
          style={{
            background: `conic-gradient(from 180deg, transparent, #80ffdbcc, transparent 35%, ${color}aa, transparent 60%, #c78cffaa, transparent)`,
          }}
        />
      );

    case 'metallic':
      return (
        <>
          <Shine x={0.12} y={0.08} w={0.65} h={0.35} size={s} strong />
          <div
            className="absolute inset-0 opacity-55"
            style={{
              background:
                'linear-gradient(160deg, rgba(255,255,255,0.55) 0%, transparent 35%, rgba(0,0,0,0.35) 70%, rgba(255,255,255,0.2) 100%)',
            }}
          />
          <Band y={0.5} h={0.05} opacity={0.35} light size={s} />
        </>
      );

    case 'cloudy':
      return (
        <>
          <Spot x={0.32} y={0.32} r={0.32} opacity={0.45} light size={s} />
          <Spot x={0.62} y={0.48} r={0.28} opacity={0.4} light size={s} />
          <Spot x={0.42} y={0.68} r={0.24} opacity={0.35} light size={s} />
        </>
      );

    case 'misty':
      return (
        <div
          className="absolute inset-0 opacity-55"
          style={{
            background:
              'radial-gradient(circle at 40% 40%, rgba(255,255,255,0.45) 0%, transparent 45%), radial-gradient(circle at 65% 60%, rgba(200,220,255,0.35) 0%, transparent 40%)',
            filter: 'blur(2px)',
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
  rim,
}: {
  x: number;
  y: number;
  r: number;
  opacity: number;
  size: number;
  light?: boolean;
  tint?: string;
  rim?: boolean;
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
        background: tint ?? (light ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'),
        opacity,
        boxShadow: rim ? 'inset 0 0 0 2px rgba(0,0,0,0.35)' : undefined,
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
        background: light ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.35)',
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
          ? 'radial-gradient(ellipse, rgba(255,255,255,0.7) 0%, transparent 70%)'
          : 'radial-gradient(ellipse, rgba(255,255,255,0.4) 0%, transparent 70%)',
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
        background: 'linear-gradient(135deg, rgba(255,255,255,0.75), transparent 60%)',
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
  color = 'rgba(0,0,0,0.55)',
}: {
  lines: string[];
  size: number;
  opacity: number;
  color?: string;
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
        <path key={d} d={d} fill="none" stroke={color} strokeWidth="2" />
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
        border: line ? `2px solid ${color}` : undefined,
        boxShadow: line ? `0 0 14px ${color}` : undefined,
        opacity,
      }}
    />
  );
}

function Swirl({ color, size }: { color: string; size: number }) {
  return (
    <div
      className="absolute inset-0 opacity-55 mix-blend-soft-light"
      style={{
        background: `conic-gradient(from 20deg, transparent, ${color}, transparent 40%, #ffffff66, transparent 70%)`,
        width: size,
        height: size,
      }}
    />
  );
}

function Tiles({ size, color, bold }: { size: number; color: string; bold?: boolean }) {
  const cell = size * (bold ? 0.16 : 0.2);
  return (
    <div
      className="absolute inset-0"
      style={{
        opacity: bold ? 0.65 : 0.35,
        backgroundImage: `
          linear-gradient(45deg, ${color} 25%, transparent 25%),
          linear-gradient(-45deg, rgba(255,255,255,0.35) 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #ff9d6c 75%),
          linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.35) 75%)
        `,
        backgroundSize: `${cell}px ${cell}px`,
        backgroundPosition: `0 0, 0 ${cell / 2}px, ${cell / 2}px -${cell / 2}px, -${cell / 2}px 0`,
      }}
    />
  );
}

function GeoLines({ size, color, bold }: { size: number; color: string; bold?: boolean }) {
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ opacity: bold ? 0.8 : 0.45 }}
    >
      <polygon
        points="50,8 90,35 78,82 22,82 10,35"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
      />
      <polygon
        points="50,22 75,40 68,70 32,70 25,40"
        fill="rgba(255,255,255,0.12)"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.4"
      />
      <line x1="50" y1="8" x2="50" y2="82" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" />
      <line x1="10" y1="35" x2="90" y2="35" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
    </svg>
  );
}
