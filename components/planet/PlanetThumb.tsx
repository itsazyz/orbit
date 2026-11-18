'use client';

import { useEffect, useRef, useState } from 'react';
import type { PlanetLook } from '@/lib/planet/design';
import { lookKey } from '@/lib/planet/design';
import { renderPlanetStill } from '@/lib/planet/engine';
import { PlanetRenderer } from '@/components/planet/PlanetRenderer';
import { cn } from '@/lib/utils';

interface PlanetThumbProps {
  look: PlanetLook;
  /** CSS size of the square canvas */
  size: number;
  /** Fixed extent so a row of thumbnails shares one scale */
  extent?: number;
  /** Animate while hovered (shared renderer, one frame per tick) */
  hoverSpin?: boolean;
  className?: string;
  time?: number;
}

/**
 * A still render of a planet from the shared WebGL renderer — dozens of
 * these cost one context. Falls back to the CSS planet without WebGL.
 */
export function PlanetThumb({ look, size, extent, hoverSpin = false, className, time }: PlanetThumbProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const [hover, setHover] = useState(false);
  const key = lookKey(look, `${size}:${extent ?? ''}:${time ?? ''}`);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || failed) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.round(size * dpr);
    if (!hover) {
      let cancel = () => undefined as void;
      const handle = window.setTimeout(() => {
        cancel = renderPlanetStill(canvas, look, { px, extent, time }, (ok) => {
          if (!ok) setFailed(true);
        });
      }, 40);
      return () => {
        window.clearTimeout(handle);
        cancel();
      };
    }
    // hovered: re-render with advancing rotation
    let raf = 0;
    let rot = 0.9;
    let t = time ?? 20;
    let lastStamp = performance.now();
    let cancel = () => undefined as void;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastStamp) / 1000);
      lastStamp = now;
      rot += dt * 0.5;
      t += dt;
      cancel = renderPlanetStill(canvas, look, { px, extent, time: t, rot });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, hover, failed]);

  if (failed) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ width: size, height: size }}>
        <PlanetRenderer
          color={look.color}
          surfaceStyle={look.surface}
          atmosphere={look.atmosphere}
          glow={Math.min(look.glow, 3)}
          hasRing={look.ring !== 'none'}
          mood={look.mood}
          spaceBackground={look.spaceBackground}
          size={size * 0.42}
          animate={false}
        />
      </div>
    );
  }

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={cn('block', className)}
      style={{ width: size, height: size }}
      onPointerEnter={hoverSpin ? () => setHover(true) : undefined}
      onPointerLeave={hoverSpin ? () => setHover(false) : undefined}
    />
  );
}
