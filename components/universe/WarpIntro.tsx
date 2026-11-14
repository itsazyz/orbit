'use client';

import { useEffect, useRef, useState } from 'react';

interface WarpIntroProps {
  color: string;
  label: string;
  /** sessionStorage key — the intro plays once per planet per session */
  storageKey: string;
  disabled?: boolean;
  onDone?: () => void;
}

const DURATION = 1700;
const FADE = 450;

/**
 * Hyperspace jump into a universe: streaks of light rush outward, tinted by
 * the planet's color, then the overlay dissolves into the page. The overlay
 * is server-rendered and also fades out on its own via CSS, so the page is
 * never stuck behind it if JavaScript is slow or disabled.
 */
export function WarpIntro({ color, label, storageKey, disabled, onDone }: WarpIntroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<'playing' | 'fading' | 'done'>('playing');
  const doneRef = useRef(false);

  useEffect(() => {
    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      setState('fading');
      window.setTimeout(() => {
        setState('done');
        onDone?.();
      }, FADE);
    };

    let seen = false;
    try {
      seen = !!window.sessionStorage.getItem(storageKey);
      window.sessionStorage.setItem(storageKey, '1');
    } catch {
      /* storage unavailable */
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (disabled || seen || reduced) {
      doneRef.current = true;
      setState('done');
      onDone?.();
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      finish();
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();

    const stars = Array.from({ length: 420 }, () => ({
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: Math.random(),
      tint: Math.random() < 0.35,
    }));

    const start = performance.now();
    let last = start;
    let raf = 0;

    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const dt = Math.min(48, now - last) / 1000;
      last = now;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      // ease-in acceleration, then a gentle settle
      const speed = 0.25 + Math.pow(t, 2.2) * 5.5;

      ctx.fillStyle = `rgba(3, 4, 10, ${0.35 + 0.4 * (1 - t)})`;
      ctx.fillRect(0, 0, w, h);

      for (const s of stars) {
        const pz = s.z;
        s.z -= speed * dt;
        if (s.z <= 0.02) {
          s.x = (Math.random() - 0.5) * 2;
          s.y = (Math.random() - 0.5) * 2;
          s.z = 1;
          continue;
        }
        const k = Math.max(w, h) * 0.5;
        const x1 = cx + (s.x / pz) * k * 0.5;
        const y1 = cy + (s.y / pz) * k * 0.5;
        const x2 = cx + (s.x / s.z) * k * 0.5;
        const y2 = cy + (s.y / s.z) * k * 0.5;
        const alpha = Math.min(1, (1 - s.z) * 1.4);
        ctx.strokeStyle = s.tint ? color : `rgba(255,255,255,${alpha})`;
        ctx.globalAlpha = s.tint ? alpha : 1;
        ctx.lineWidth = (1 - s.z) * 2.6 * dpr;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // central bloom that swells toward the end
      const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * (0.15 + t * 0.35));
      bloom.addColorStop(0, `${color}${Math.round(40 + t * 120).toString(16).padStart(2, '0')}`);
      bloom.addColorStop(1, 'transparent');
      ctx.fillStyle = bloom;
      ctx.fillRect(0, 0, w, h);

      if (t < 1) raf = requestAnimationFrame(frame);
      else finish();
    };
    raf = requestAnimationFrame(frame);

    const skip = () => finish();
    window.addEventListener('pointerdown', skip, { once: true });
    window.addEventListener('keydown', skip, { once: true });
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('resize', resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === 'done') return null;

  return (
    <div
      className="warp-overlay fixed inset-0 z-[90] bg-[#03040a]"
      style={{
        opacity: state === 'fading' ? 0 : 1,
        transition: `opacity ${FADE}ms ease-out`,
      }}
      aria-hidden
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <p className="warp-label absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 text-center text-lg font-light tracking-[0.18em] text-white/85">
        {label}
      </p>
    </div>
  );
}
