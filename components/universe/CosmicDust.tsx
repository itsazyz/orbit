'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface CosmicDustProps {
  seed?: string;
  count?: number;
  color?: string;
  className?: string;
}

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Soft drifting dust / nebula motes for depth */
export function CosmicDust({
  seed = 'orbit-dust',
  count = 28,
  color = 'rgba(180, 190, 255, 0.35)',
  className,
}: CosmicDustProps) {
  const particles = useMemo(() => {
    const rng = mulberry32(hashSeed(seed));
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: rng() * 100,
      y: rng() * 100,
      size: rng() * 3 + 1,
      opacity: rng() * 0.35 + 0.1,
      duration: 18 + rng() * 28,
      delay: rng() * -20,
      driftX: (rng() - 0.5) * 40,
      driftY: (rng() - 0.5) * 50,
    }));
  }, [count, seed]);

  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      aria-hidden
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full motion-safe:animate-dust-drift"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: color,
            opacity: p.opacity,
            filter: 'blur(0.5px)',
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            ['--dust-x' as string]: `${p.driftX}px`,
            ['--dust-y' as string]: `${p.driftY}px`,
          }}
        />
      ))}
    </div>
  );
}
