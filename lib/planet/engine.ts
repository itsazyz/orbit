/**
 * WebGL plumbing for planets and backdrops: program setup, uniforms from a
 * PlanetLook, and one shared offscreen context that renders still images
 * (option thumbnails, backdrops, share images) without spending a WebGL
 * context per picture.
 */
import type { PlanetLook } from './design';
import {
  ATMO_INDEX,
  BACKDROP_FRAGMENT,
  BACKDROP_INDEX,
  PLANET_FRAGMENT,
  RING_INDEX,
  SURFACE_INDEX,
  VERTEX_SHADER,
  hexToRgb,
  seedNumbers,
} from './shader';
import { MOOD_PRESETS } from '../universe/constants';
import type { SpaceBackground, UniverseMood } from '@/types/database';

type Vec3 = [number, number, number];
type M3 = number[]; // row-major 3×3

const rx = (a: number): M3 => [1, 0, 0, 0, Math.cos(a), -Math.sin(a), 0, Math.sin(a), Math.cos(a)];
const ry = (a: number): M3 => [Math.cos(a), 0, Math.sin(a), 0, 1, 0, -Math.sin(a), 0, Math.cos(a)];
const rz = (a: number): M3 => [Math.cos(a), -Math.sin(a), 0, Math.sin(a), Math.cos(a), 0, 0, 0, 1];

function mul(a: M3, b: M3): M3 {
  const o: M3 = [];
  for (let r = 0; r < 3; r += 1)
    for (let c = 0; c < 3; c += 1) {
      let sum = 0;
      for (let k = 0; k < 3; k += 1) sum += a[r * 3 + k]! * b[k * 3 + c]!;
      o.push(sum);
    }
  return o;
}

function apply(m: M3, v: Vec3): Vec3 {
  return [
    m[0]! * v[0] + m[1]! * v[1] + m[2]! * v[2],
    m[3]! * v[0] + m[4]! * v[1] + m[5]! * v[2],
    m[6]! * v[0] + m[7]! * v[1] + m[8]! * v[2],
  ];
}

const transpose = (m: M3): M3 => [m[0]!, m[3]!, m[6]!, m[1]!, m[4]!, m[7]!, m[2]!, m[5]!, m[8]!];
/** WebGL wants column-major */
const toGL = (m: M3) => new Float32Array(transpose(m));

function norm(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

const VIEW_TILT = 0.38;
const DETAIL = [0.55, 0.75, 1, 1.35, 1.8];
export const SPIN_SPEED = [0, 0.045, 0.11, 0.28];

const PHASE_DIR: Record<string, Vec3> = {
  front: norm([-0.38, 0.4, 0.83]),
  side: norm([-0.85, 0.36, 0.38]),
  back: norm([-0.86, 0.24, -0.45]),
};

function scale3(v: Vec3, k: number): Vec3 {
  return [v[0] * k, v[1] * k, v[2] * k];
}

export function lightSetup(look: Pick<PlanetLook, 'light' | 'phase'>) {
  const L1 = PHASE_DIR[look.phase] ?? PHASE_DIR.side!;
  let c1: Vec3 = scale3([1.0, 0.95, 0.86], 1.12);
  let L2: Vec3 = norm([-L1[0], -L1[1] * 0.4, L1[2]]);
  let c2: Vec3 = [0, 0, 0];
  if (look.light === 'blue') c1 = scale3([0.72, 0.84, 1.0], 1.2);
  if (look.light === 'red') c1 = scale3([1.0, 0.5, 0.32], 1.05);
  if (look.light === 'binary') {
    c1 = scale3([1.0, 0.72, 0.45], 0.95);
    c2 = scale3([0.5, 0.68, 1.0], 0.85);
    L2 = norm([-L1[0], -L1[1] * 0.4, Math.max(L1[2], 0.25)]);
  }
  return { L1, L2, c1, c2 };
}

/** Canvas half-size in planet radii: room for halo, rings and moons */
export function planetExtent(look: Pick<PlanetLook, 'ring' | 'moons' | 'surface' | 'glow'>): number {
  let e = 1.6;
  if (look.glow >= 4) e = 1.8;
  if (look.surface === 'eclipse' || look.surface === 'luminous') e = Math.max(e, 1.95);
  if (look.ring !== 'none') e = Math.max(e, 2.3);
  if (look.moons > 0) e = Math.max(e, 2.36);
  return e;
}

const MOON_ORBITS = [
  { a: 1.62, r: 0.15, period: 26, inc: 0.16 },
  { a: 1.92, r: 0.105, period: 41, inc: -0.22 },
  { a: 2.14, r: 0.08, period: 60, inc: 0.34 },
];

const PLANET_UNIFORMS = [
  'uTime', 'uExtent', 'uPx', 'uC1', 'uC2', 'uAtmoCol', 'uAmbient', 'uSurf', 'uAtmo', 'uGlow', 'uRing',
  'uSeed', 'uVar', 'uDetail', 'uObj', 'uFrame', 'uRingN', 'uRingN2', 'uRingSpin', 'uL1', 'uL2', 'uL1c',
  'uL2c', 'uMoon0', 'uMoon1', 'uMoon2', 'uFx',
] as const;

const BACKDROP_UNIFORMS = ['uAspect', 'uBg', 'uBase', 'uAccent', 'uPlanet', 'uPlanet2', 'uSeed', 'uPxB'] as const;

export interface GLProgram<U extends string> {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  buffer: WebGLBuffer;
  loc: Record<U, WebGLUniformLocation | null>;
  dispose: () => void;
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('[planet] shader error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function makeProgram<U extends string>(
  gl: WebGLRenderingContext,
  fragment: string,
  uniforms: readonly U[]
): GLProgram<U> | null {
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragment);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  if (!program || !buffer) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('[planet] link error:', gl.getProgramInfoLog(program));
    return null;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = {} as Record<U, WebGLUniformLocation | null>;
  for (const name of uniforms) loc[name] = gl.getUniformLocation(program, name);
  return {
    gl,
    program,
    buffer,
    loc,
    dispose: () => {
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    },
  };
}

function bindQuad<U extends string>(p: GLProgram<U>) {
  const { gl, program, buffer } = p;
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
}

export type PlanetProgram = GLProgram<(typeof PLANET_UNIFORMS)[number]>;
export type BackdropProgram = GLProgram<(typeof BACKDROP_UNIFORMS)[number]>;

export function createPlanetProgram(gl: WebGLRenderingContext): PlanetProgram | null {
  return makeProgram(gl, PLANET_FRAGMENT, PLANET_UNIFORMS);
}

export function createBackdropProgram(gl: WebGLRenderingContext): BackdropProgram | null {
  return makeProgram(gl, BACKDROP_FRAGMENT, BACKDROP_UNIFORMS);
}

export interface PlanetFrame {
  /** Seconds — drives clouds, lava, pulses, moons */
  time: number;
  /** Planet rotation in radians */
  rot: number;
  /** Canvas size in device pixels (square) */
  px: number;
  /** Force the canvas extent (keeps option thumbnails the same scale) */
  extent?: number;
}

function moodAmbient(mood: UniverseMood): Vec3 {
  const accent = hexToRgb((MOOD_PRESETS[mood] ?? MOOD_PRESETS.calm).accent);
  return [accent[0] * 0.05 + 0.014, accent[1] * 0.05 + 0.014, accent[2] * 0.05 + 0.018];
}

/** Draw one planet frame into the program's current framebuffer/viewport */
export function drawPlanet(p: PlanetProgram, look: PlanetLook, frame: PlanetFrame) {
  const { gl, loc } = p;
  bindQuad(p);
  const extent = frame.extent ?? planetExtent(look);
  const nums = seedNumbers(`${look.seed}:${look.variant}`, 9);
  const F = mul(rz((look.tilt * Math.PI) / 180), rx(VIEW_TILT));
  const W = mul(F, ry(-frame.rot));
  const light = lightSetup(look);

  gl.uniform1f(loc.uTime, frame.time);
  gl.uniform1f(loc.uExtent, extent);
  gl.uniform1f(loc.uPx, (2 * extent) / Math.max(frame.px, 1));
  gl.uniform3fv(loc.uC1, hexToRgb(look.color));
  gl.uniform3fv(loc.uC2, hexToRgb(look.color2));
  gl.uniform3fv(loc.uAtmoCol, hexToRgb(look.atmoColor));
  gl.uniform3fv(loc.uAmbient, moodAmbient(look.mood));
  gl.uniform1f(loc.uSurf, SURFACE_INDEX[look.surface] ?? 0);
  gl.uniform1f(loc.uAtmo, ATMO_INDEX[look.atmosphere] ?? 1);
  gl.uniform1f(loc.uGlow, Math.max(0, Math.min(5, look.glow)) / 5);
  gl.uniform1f(loc.uRing, RING_INDEX[look.ring] ?? 0);
  gl.uniform3f(loc.uSeed, nums[0]! * 40 - 20, nums[1]! * 40 - 20, nums[2]! * 40 - 20);
  gl.uniform3f(loc.uVar, nums[3]!, nums[4]!, nums[5]!);
  gl.uniform1f(loc.uDetail, DETAIL[Math.max(0, Math.min(4, look.scale - 1))]!);
  gl.uniformMatrix3fv(loc.uObj, false, toGL(transpose(W)));
  gl.uniformMatrix3fv(loc.uFrame, false, toGL(F));
  gl.uniform3fv(loc.uRingN, apply(F, [0, 1, 0]));
  const beta = 1.05 + frame.time * 0.12;
  gl.uniform3fv(loc.uRingN2, apply(F, [Math.cos(beta), 0, Math.sin(beta)]));
  gl.uniform1f(loc.uRingSpin, frame.time * 0.05);
  gl.uniform3fv(loc.uL1, light.L1);
  gl.uniform3fv(loc.uL2, light.L2);
  gl.uniform3fv(loc.uL1c, light.c1);
  gl.uniform3fv(loc.uL2c, light.c2);

  const moonLocs = [loc.uMoon0, loc.uMoon1, loc.uMoon2];
  MOON_ORBITS.forEach((orbit, i) => {
    if (i >= look.moons) {
      gl.uniform4f(moonLocs[i]!, 0, 0, 0, 0);
      return;
    }
    const th = nums[6]! * Math.PI * 2 + i * 2.3 + (frame.time * Math.PI * 2) / orbit.period;
    const po: Vec3 = [
      orbit.a * Math.cos(th),
      -orbit.a * Math.sin(th) * Math.sin(orbit.inc),
      orbit.a * Math.sin(th) * Math.cos(orbit.inc),
    ];
    const w = apply(F, po);
    gl.uniform4f(moonLocs[i]!, w[0], w[1], w[2], orbit.r * (0.9 + 0.2 * nums[(i + 3) % 9]!));
  });

  const fx = look.effects;
  gl.uniform4f(
    loc.uFx,
    fx.includes('lights') ? 1 : 0,
    fx.includes('caps') ? 1 : 0,
    fx.includes('aurora') ? 1 : 0,
    fx.includes('satellites') ? 1 : 0
  );
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

export interface BackdropParams {
  background: SpaceBackground;
  mood: UniverseMood;
  color: string;
  color2: string;
  seed: string;
}

export function drawBackdrop(p: BackdropProgram, params: BackdropParams, width: number, height: number) {
  const { gl, loc } = p;
  bindQuad(p);
  const preset = MOOD_PRESETS[params.mood] ?? MOOD_PRESETS.calm;
  const nums = seedNumbers(params.seed, 3);
  gl.uniform1f(loc.uAspect, width / Math.max(height, 1));
  gl.uniform1f(loc.uBg, BACKDROP_INDEX[params.background] ?? 0);
  gl.uniform3fv(loc.uBase, hexToRgb(preset.bg));
  gl.uniform3fv(loc.uAccent, hexToRgb(preset.accent));
  gl.uniform3fv(loc.uPlanet, hexToRgb(params.color));
  gl.uniform3fv(loc.uPlanet2, hexToRgb(params.color2));
  gl.uniform3f(loc.uSeed, nums[0]! * 30, nums[1]!, nums[2]! * 30);
  gl.uniform1f(loc.uPxB, 1 / Math.max(height, 1));
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// ------------------------------------------------------------ shared renderer

interface Job {
  target: HTMLCanvasElement;
  width: number;
  height: number;
  run: (r: SharedRenderer) => boolean;
  cancelled: boolean;
}

class SharedRenderer {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext | null = null;
  planet: PlanetProgram | null = null;
  backdrop: BackdropProgram | null = null;
  broken = false;
  private queue: Job[] = [];
  private scheduled = false;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.gl = null;
      this.planet = null;
      this.backdrop = null;
    });
  }

  ensure(): WebGLRenderingContext | null {
    if (this.broken) return null;
    if (this.gl && !this.gl.isContextLost()) return this.gl;
    const gl = this.canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: true,
      antialias: false,
    });
    if (!gl) {
      this.broken = true;
      return null;
    }
    this.gl = gl;
    this.planet = null;
    this.backdrop = null;
    return gl;
  }

  planetProgram(): PlanetProgram | null {
    const gl = this.ensure();
    if (!gl) return null;
    if (!this.planet) {
      this.planet = createPlanetProgram(gl);
      if (!this.planet) this.broken = true;
    }
    return this.planet;
  }

  backdropProgram(): BackdropProgram | null {
    const gl = this.ensure();
    if (!gl) return null;
    if (!this.backdrop) this.backdrop = createBackdropProgram(gl);
    return this.backdrop;
  }

  prepare(width: number, height: number): WebGLRenderingContext | null {
    const gl = this.ensure();
    if (!gl) return null;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return gl;
  }

  copyTo(target: HTMLCanvasElement, width: number, height: number) {
    if (target.width !== width || target.height !== height) {
      target.width = width;
      target.height = height;
    }
    const ctx = target.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(this.canvas, 0, 0, width, height, 0, 0, width, height);
  }

  enqueue(job: Job) {
    // newest request for a canvas wins
    this.queue = this.queue.filter((j) => j.target !== job.target);
    this.queue.push(job);
    this.schedule();
  }

  private schedule() {
    if (this.scheduled) return;
    this.scheduled = true;
    requestAnimationFrame(() => this.flush());
  }

  private flush() {
    this.scheduled = false;
    const start = performance.now();
    while (this.queue.length && performance.now() - start < 12) {
      const job = this.queue.shift()!;
      if (job.cancelled || !job.target.isConnected) continue;
      job.run(this);
    }
    if (this.queue.length) this.schedule();
  }
}

let shared: SharedRenderer | null = null;

function getShared(): SharedRenderer | null {
  if (typeof window === 'undefined') return null;
  if (!shared) shared = new SharedRenderer();
  return shared.broken ? null : shared;
}

export function webglAvailable(): boolean {
  const r = getShared();
  return !!r && !!r.ensure();
}

/** A moment where the first moon sits beside the planet, in front */
export function stillTime(look: PlanetLook): number {
  if (look.moons <= 0) return 20;
  const base = seedNumbers(`${look.seed}:${look.variant}`, 9)[6]! * Math.PI * 2;
  const period = MOON_ORBITS[0]!.period;
  let t = ((0.75 - base) * period) / (Math.PI * 2);
  t = ((t % period) + period) % period;
  return t + period;
}

export interface StillOptions {
  /** Rendered size in device pixels */
  px: number;
  time?: number;
  rot?: number;
  extent?: number;
}

/** Queue a still render of a planet into a 2D canvas. Returns a cancel fn. */
export function renderPlanetStill(
  target: HTMLCanvasElement,
  look: PlanetLook,
  options: StillOptions,
  onDone?: (ok: boolean) => void
): () => void {
  const renderer = getShared();
  if (!renderer) {
    onDone?.(false);
    return () => undefined;
  }
  const px = Math.max(16, Math.round(options.px));
  const job: Job = {
    target,
    width: px,
    height: px,
    cancelled: false,
    run: (r) => {
      const program = r.planetProgram();
      const gl = program ? r.prepare(px, px) : null;
      if (!program || !gl) {
        onDone?.(false);
        return false;
      }
      drawPlanet(program, look, { time: options.time ?? stillTime(look), rot: options.rot ?? 0.9, px, extent: options.extent });
      r.copyTo(target, px, px);
      onDone?.(true);
      return true;
    },
  };
  renderer.enqueue(job);
  return () => {
    job.cancelled = true;
  };
}

/** Queue a backdrop render into a 2D canvas */
export function renderBackdropStill(
  target: HTMLCanvasElement,
  params: BackdropParams,
  width: number,
  height: number,
  onDone?: (ok: boolean) => void
): () => void {
  const renderer = getShared();
  if (!renderer) {
    onDone?.(false);
    return () => undefined;
  }
  const w = Math.max(8, Math.round(width));
  const h = Math.max(8, Math.round(height));
  const job: Job = {
    target,
    width: w,
    height: h,
    cancelled: false,
    run: (r) => {
      const program = r.backdropProgram();
      const gl = program ? r.prepare(w, h) : null;
      if (!program || !gl) {
        onDone?.(false);
        return false;
      }
      drawBackdrop(program, params, w, h);
      r.copyTo(target, w, h);
      onDone?.(true);
      return true;
    },
  };
  renderer.enqueue(job);
  return () => {
    job.cancelled = true;
  };
}

/** Synchronous planet snapshot (for share images). Null without WebGL. */
export function snapshotPlanet(look: PlanetLook, px: number, time?: number): HTMLCanvasElement | null {
  const renderer = getShared();
  const program = renderer?.planetProgram();
  if (!renderer || !program) return null;
  const size = Math.round(px);
  if (!renderer.prepare(size, size)) return null;
  drawPlanet(program, look, { time: time ?? stillTime(look), rot: 0.9, px: size });
  const out = document.createElement('canvas');
  renderer.copyTo(out, size, size);
  return out;
}
