'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { SpaceBackground, UniverseMood } from '@/types/database';
import { renderBackdropStill } from '@/lib/planet/engine';
import { UniverseBackground } from '@/components/planet/PlanetRenderer';
import { MOOD_PRESETS } from '@/lib/universe/constants';
import { cn } from '@/lib/utils';

interface SpaceBackdropProps {
  background: SpaceBackground;
  mood: UniverseMood;
  color: string;
  color2: string;
  seed: string;
  className?: string;
  /** Mood particles on top of the backdrop */
  ambience?: boolean;
}

/**
 * Procedural space backdrop rendered once (per size/params) by the shared
 * WebGL renderer into a plain canvas, drifting slowly via CSS. The CSS
 * gradient version sits underneath as the instant/no-WebGL fallback.
 */
export function SpaceBackdrop({ background, mood, color, color2, seed, className, ambience = true }: SpaceBackdropProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    let timer = 0;
    const update = () => {
      const rect = box.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) return;
      // Nebulae are soft: render at reduced resolution and let CSS scale up.
      const scale = Math.min(1, 1280 / Math.max(rect.width, rect.height)) * 0.85;
      setSize((prev) => {
        const w = Math.round(rect.width * scale);
        const h = Math.round(rect.height * scale);
        if (prev && Math.abs(prev.w - w) < 24 && Math.abs(prev.h - h) < 24) return prev;
        return { w, h };
      });
    };
    update();
    const ro = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(update, 180);
    });
    ro.observe(box);
    return () => {
      ro.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size) return;
    return renderBackdropStill(canvas, { background, mood, color, color2, seed }, size.w, size.h, (ok) => setReady(ok));
  }, [background, mood, color, color2, seed, size]);

  return (
    <div ref={boxRef} className={cn('absolute inset-0 overflow-hidden', className)} aria-hidden>
      <UniverseBackground mood={mood} spaceBackground={background} />
      <canvas
        ref={canvasRef}
        className={cn(
          'absolute inset-0 h-full w-full transition-opacity duration-700 motion-safe:animate-[backdrop-drift_70s_ease-in-out_infinite_alternate]',
          ready ? 'opacity-100' : 'opacity-0'
        )}
      />
      {ambience ? <MoodAmbience mood={mood} color={color} color2={color2} seed={seed} /> : null}
    </div>
  );
}

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Each mood moves differently: motes, fog, sparkles, embers, a grid — or nothing */
export function MoodAmbience({
  mood,
  color,
  color2,
  seed,
  density = 1,
}: {
  mood: UniverseMood;
  color: string;
  color2: string;
  seed: string;
  density?: number;
}) {
  const accent = (MOOD_PRESETS[mood] ?? MOOD_PRESETS.calm).accent;
  const items = useMemo(() => {
    const r = rng(`${seed}:${mood}`);
    const n = (k: number) => Math.max(1, Math.round(k * density));
    return Array.from({ length: n(30) }, () => ({
      x: r() * 100,
      y: r() * 100,
      s: r(),
      d: r(),
      delay: -r() * 30,
      hue: r(),
    }));
  }, [seed, mood, density]);

  if (mood === 'minimal') return null;

  if (mood === 'mysterious') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {items.slice(0, 5).map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full motion-safe:animate-[fog-drift_linear_infinite_alternate]"
            style={{
              left: `${p.x - 20}%`,
              top: `${p.y - 15}%`,
              width: `${40 + p.s * 40}%`,
              height: `${30 + p.d * 30}%`,
              background: `radial-gradient(closest-side, ${i % 2 ? accent : color}26, transparent)`,
              filter: 'blur(24px)',
              animationDuration: `${40 + p.d * 40}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
        {items.slice(5, 17).map((p, i) => (
          <span
            key={`m${i}`}
            className="absolute rounded-full motion-safe:animate-dust-drift"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: 2,
              height: 2,
              background: accent,
              opacity: 0.25 + p.s * 0.3,
              animationDuration: `${24 + p.d * 20}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (mood === 'creative') {
    const palette = [color, color2, accent, '#ffffff'];
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {items.slice(0, 24).map((p, i) => {
          const c = palette[Math.floor(p.hue * palette.length)]!;
          const s = 6 + p.s * 10;
          return (
            <span
              key={i}
              className="absolute motion-safe:animate-[sparkle-pop_ease-in-out_infinite]"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: s,
                height: s,
                background: c,
                clipPath:
                  'polygon(50% 0, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0 50%, 39% 39%)',
                filter: `drop-shadow(0 0 4px ${c})`,
                animationDuration: `${3 + p.d * 4}s`,
                animationDelay: `${p.delay / 6}s`,
              }}
            />
          );
        })}
      </div>
    );
  }

  if (mood === 'warm') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {items.map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full motion-safe:animate-[ember-rise_linear_infinite]"
            style={{
              left: `${p.x}%`,
              bottom: `-${4 + p.s * 10}%`,
              width: 2 + p.s * 3,
              height: 2 + p.s * 3,
              background: p.hue > 0.5 ? '#ffb347' : '#ff7a3c',
              boxShadow: `0 0 ${6 + p.s * 8}px ${p.hue > 0.5 ? '#ffb347' : '#ff7a3c'}`,
              animationDuration: `${12 + p.d * 16}s`,
              animationDelay: `${p.delay}s`,
              ['--sway' as string]: `${(p.hue - 0.5) * 80}px`,
            }}
          />
        ))}
      </div>
    );
  }

  if (mood === 'futuristic') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-[-50%] bottom-0 h-[42%] [perspective:420px]">
          <div
            className="absolute inset-0 origin-bottom motion-safe:animate-[grid-scroll_6s_linear_infinite]"
            style={{
              transform: 'rotateX(68deg)',
              backgroundImage: `linear-gradient(${accent}55 1px, transparent 1px), linear-gradient(90deg, ${accent}55 1px, transparent 1px)`,
              backgroundSize: '56px 56px',
              maskImage: 'linear-gradient(to top, black 10%, transparent 85%)',
              WebkitMaskImage: 'linear-gradient(to top, black 10%, transparent 85%)',
            }}
          />
        </div>
        <div
          className="absolute inset-x-0 h-24 motion-safe:animate-[scan-sweep_9s_ease-in-out_infinite]"
          style={{ background: `linear-gradient(to bottom, transparent, ${accent}14, transparent)` }}
        />
      </div>
    );
  }

  // calm — slow soft motes
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.slice(0, 26).map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full motion-safe:animate-dust-drift"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: 1 + p.s * 3,
            height: 1 + p.s * 3,
            background: `${color}88`,
            opacity: 0.15 + p.d * 0.35,
            filter: 'blur(0.5px)',
            animationDuration: `${18 + p.d * 28}s`,
            animationDelay: `${p.delay}s`,
            ['--dust-x' as string]: `${(p.hue - 0.5) * 40}px`,
            ['--dust-y' as string]: `${(p.s - 0.5) * 50}px`,
          }}
        />
      ))}
    </div>
  );
}
