'use client';

import { useEffect, useRef, useState } from 'react';
import type { PlanetAtmosphere, PlanetSurfaceStyle, SpaceBackground, UniverseMood } from '@/types/database';
import { PlanetRenderer } from '@/components/planet/PlanetRenderer';
import {
  FRAGMENT_SHADER,
  VERTEX_SHADER,
  atmosphereParams,
  hexToRgb,
  seedFromString,
  surfaceType,
} from '@/lib/planet/shader';

export interface PlanetVisualProps {
  color: string;
  surfaceStyle: PlanetSurfaceStyle;
  atmosphere: PlanetAtmosphere;
  glow: number;
  hasRing: boolean;
  mood: UniverseMood;
  spaceBackground: SpaceBackground;
  size?: number;
  seed?: string;
  /** Render with WebGL when available (falls back to the CSS planet) */
  render3d?: boolean;
  spin?: boolean;
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('[planet3d] shader error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * A planet rendered by a procedural WebGL shader: lit sphere, surface from
 * the chosen style, clouds, atmosphere glow and a real 3D ring. Pauses when
 * off-screen; renders one still frame for reduced-motion users; falls back
 * to the CSS planet when WebGL is unavailable or the context is lost.
 */
export function PlanetVisual(props: PlanetVisualProps) {
  const { render3d = true, size = 150 } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const paramsRef = useRef(props);
  paramsRef.current = props;

  const canvasSize = size * (props.hasRing ? 2.3 : 1.6);

  useEffect(() => {
    if (!render3d || failed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true });
    if (!gl) {
      setFailed(true);
      return;
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) {
      setFailed(true);
      return;
    }
    const program = gl.createProgram();
    if (!program) {
      setFailed(true);
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('[planet3d] link error:', gl.getProgramInfoLog(program));
      setFailed(true);
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const uTime = u('uTime');
    const uColor = u('uColor');
    const uType = u('uType');
    const uAtmo = u('uAtmo');
    const uGlow = u('uGlow');
    const uRing = u('uRing');
    const uSeed = u('uSeed');
    const uClouds = u('uClouds');
    const uScale = u('uScale');

    gl.clearColor(0, 0, 0, 0);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let visible = true;
    let raf = 0;
    const start = performance.now();

    const draw = (now: number) => {
      const p = paramsRef.current;
      const px = Math.round(p.size! * (p.hasRing ? 2.3 : 1.6) * dpr);
      if (canvas.width !== px || canvas.height !== px) {
        canvas.width = px;
        canvas.height = px;
      }
      gl.viewport(0, 0, px, px);
      gl.clear(gl.COLOR_BUFFER_BIT);
      const [r, g, b] = hexToRgb(p.color);
      const { atmo, clouds } = atmosphereParams(p.atmosphere, p.surfaceStyle);
      gl.uniform1f(uTime, p.spin === false || reduced ? 4 : (now - start) / 1000);
      gl.uniform3f(uColor, r, g, b);
      gl.uniform1f(uType, surfaceType(p.surfaceStyle));
      gl.uniform1f(uAtmo, atmo);
      gl.uniform1f(uGlow, Math.max(0, Math.min(5, p.glow)) / 5);
      gl.uniform1f(uRing, p.hasRing ? 1 : 0);
      gl.uniform1f(uSeed, seedFromString(p.seed ?? p.color));
      gl.uniform1f(uClouds, clouds);
      gl.uniform1f(uScale, 1 / (p.hasRing ? 2.3 : 1.6));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const loop = (now: number) => {
      draw(now);
      if (!reduced && visible) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const io = new IntersectionObserver(([entry]) => {
      const nowVisible = !!entry?.isIntersecting;
      if (nowVisible && !visible && !reduced) {
        visible = true;
        raf = requestAnimationFrame(loop);
      } else {
        visible = nowVisible;
      }
    });
    io.observe(canvas);

    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      setFailed(true);
    };
    canvas.addEventListener('webglcontextlost', onLost);

    // Redraw a still frame when props change under reduced motion.
    const redraw = window.setInterval(() => {
      if (reduced) draw(performance.now());
    }, 500);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(redraw);
      io.disconnect();
      canvas.removeEventListener('webglcontextlost', onLost);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, [render3d, failed]);

  if (!render3d || failed) {
    return (
      <PlanetRenderer
        color={props.color}
        surfaceStyle={props.surfaceStyle}
        atmosphere={props.atmosphere}
        glow={props.glow}
        hasRing={props.hasRing}
        mood={props.mood}
        spaceBackground={props.spaceBackground}
        size={size}
        animate
        spin={props.spin !== false}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none block"
      style={{ width: canvasSize, height: canvasSize }}
    />
  );
}
