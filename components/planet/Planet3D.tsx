'use client';

import { useEffect, useRef, useState } from 'react';
import type { PlanetLook } from '@/lib/planet/design';
import { PlanetRenderer } from '@/components/planet/PlanetRenderer';
import { GLKit, SPIN_SPEED, drawPlanet, planetExtent, stillTime, type PlanetProgram } from '@/lib/planet/engine';

export interface PlanetVisualProps {
  look: PlanetLook;
  /** Planet diameter in CSS px (the canvas is larger to fit halo, rings, moons) */
  size?: number;
  /** Render with WebGL when available (falls back to the CSS planet) */
  render3d?: boolean;
  /** Animate rotation, clouds and moons */
  spin?: boolean;
  className?: string;
}

/** CSS-only planet for devices without WebGL */
function FallbackPlanet({ look, size }: { look: PlanetLook; size: number }) {
  return (
    <PlanetRenderer
      color={look.color}
      surfaceStyle={look.surface}
      atmosphere={look.atmosphere}
      glow={look.glow}
      hasRing={look.ring !== 'none'}
      mood={look.mood}
      spaceBackground={look.spaceBackground}
      size={size}
      animate
      spin={look.spin > 0}
    />
  );
}

/**
 * A live planet: its own WebGL context, rendered at the on-screen size
 * (transform-aware), slowed down automatically on weak GPUs, paused when
 * off-screen, a single still frame for reduced-motion users.
 */
export function PlanetVisual({ look, size = 150, render3d = true, spin = true, className }: PlanetVisualProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const lookRef = useRef(look);
  const spinRef = useRef(spin);
  const redrawRef = useRef<(() => void) | null>(null);
  lookRef.current = look;
  spinRef.current = spin;

  const extent = planetExtent(look);
  const canvasSize = size * extent;

  // Still frames (reduced motion / paused) need a redraw when the look changes.
  useEffect(() => {
    redrawRef.current?.();
  }, [look]);

  useEffect(() => {
    if (!render3d || failed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) {
      setFailed(true);
      return;
    }
    const kit = new GLKit(gl);
    if (kit.broken) {
      setFailed(true);
      return;
    }
    // keep drawing the last ready program while a new surface compiles
    let current: PlanetProgram | null = null;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const maxDpr = Math.min(window.devicePixelRatio || 1, 2);
    let quality = 1;
    let visible = true;
    let raf = 0;
    let last = performance.now();
    let elapsed = stillTime(lookRef.current);
    let rot = 0.9;
    let frames = 0;
    let slowFrames = 0;
    let cssPx = 0;
    let pendingRedraw = false;
    let pollTimer = 0;

    const measure = () => {
      const rect = canvas.getBoundingClientRect();
      cssPx = Math.max(rect.width, 8);
    };
    measure();

    const draw = () => {
      const l = lookRef.current;
      const next = kit.planetProgram(l);
      if (next) current = next;
      else if (kit.planetFailed(l)) {
        setFailed(true);
        return;
      }
      if (!current) {
        pendingRedraw = true;
        return;
      }
      pendingRedraw = !next;
      if (frames % 30 === 0) measure();
      const px = Math.max(32, Math.min(1400, Math.round(cssPx * maxDpr * quality)));
      if (canvas.width !== px || canvas.height !== px) {
        canvas.width = px;
        canvas.height = px;
      }
      gl.viewport(0, 0, px, px);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      drawPlanet(kit, current, l, { time: elapsed, rot, px });
    };

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (spinRef.current) {
        elapsed += dt;
        rot += dt * (SPIN_SPEED[lookRef.current.spin] ?? 0.11);
      }
      // adaptive resolution: drop quality when frames take too long
      frames += 1;
      if (frames > 20 && dt > 0.028) slowFrames += 1;
      if (slowFrames > 12 && quality > 0.55) {
        quality -= 0.15;
        slowFrames = 0;
      }
      draw();
      if (visible) raf = requestAnimationFrame(loop);
    };

    // still frames (reduced motion / off-screen) poll until a compile finishes
    const drawStill = () => {
      window.clearTimeout(pollTimer);
      draw();
      if (pendingRedraw) pollTimer = window.setTimeout(drawStill, 120);
    };
    redrawRef.current = () => {
      if (reduced || !visible) drawStill();
    };

    if (reduced) {
      drawStill();
    } else {
      raf = requestAnimationFrame(loop);
    }

    const io = new IntersectionObserver(([entry]) => {
      const now = !!entry?.isIntersecting;
      if (now && !visible && !reduced) {
        visible = true;
        last = performance.now();
        raf = requestAnimationFrame(loop);
      } else if (!now) {
        visible = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(canvas);

    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      setFailed(true);
    };
    canvas.addEventListener('webglcontextlost', onLost);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(pollTimer);
      io.disconnect();
      canvas.removeEventListener('webglcontextlost', onLost);
      redrawRef.current = null;
      kit.dispose();
    };
  }, [render3d, failed]);

  if (!render3d || failed) return <FallbackPlanet look={look} size={size} />;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className ?? 'pointer-events-none block'}
      style={{ width: canvasSize, height: canvasSize }}
    />
  );
}
