'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface StarsBackgroundProps {
  count?: number;
  seed?: string;
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

export function StarsBackground({ count = 80, seed = 'orbit', className }: StarsBackgroundProps) {
  const stars = useMemo(() => {
    const rng = mulberry32(hashSeed(seed));
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: rng() * 100,
      y: rng() * 100,
      size: rng() * 2 + 0.5,
      opacity: rng() * 0.6 + 0.2,
      delay: rng() * 5,
    }));
  }, [count, seed]);

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white motion-safe:animate-twinkle"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
