/**
 * Planet design model ("planet DNA"). The original columns (color, surface,
 * atmosphere, glow, ring flag, mood, background) stay where they were;
 * everything newer lives in profiles.planet_design (jsonb) and is resolved
 * here into a complete PlanetLook that every renderer consumes.
 */
import type { PlanetAtmosphere, SpaceBackground, UniverseMood } from '@/types/database';
import { normalizePlanetSurface, type PlanetSurfaceId } from '../universe/planet-surfaces';

export type RingStyle = 'none' | 'classic' | 'thin' | 'double' | 'dust' | 'neon' | 'ice' | 'cross';
export type LightStyle = 'sun' | 'blue' | 'red' | 'binary';
export type LightPhase = 'front' | 'side' | 'back';
export type PlanetEffect = 'lights' | 'caps' | 'aurora' | 'satellites';

export interface PlanetDesign {
  /** Secondary colour; null = derived from the main colour */
  color2: string | null;
  /** Atmosphere tint; null = picked from the surface */
  atmoColor: string | null;
  ring: RingStyle;
  moons: number;
  /** Axial tilt in degrees */
  tilt: number;
  /** 0 = still … 3 = fast */
  spin: number;
  light: LightStyle;
  phase: LightPhase;
  /** Pattern size 1 (huge features) … 5 (fine detail) */
  scale: number;
  /** Re-roll number for a new pattern with the same choices */
  variant: number;
  effects: PlanetEffect[];
}

export interface PlanetLook {
  color: string;
  color2: string;
  atmoColor: string;
  surface: PlanetSurfaceId;
  atmosphere: PlanetAtmosphere;
  glow: number;
  ring: RingStyle;
  moons: number;
  tilt: number;
  spin: number;
  light: LightStyle;
  phase: LightPhase;
  scale: number;
  variant: number;
  effects: PlanetEffect[];
  mood: UniverseMood;
  spaceBackground: SpaceBackground;
  /** Pattern seed (usually the username) */
  seed: string;
}

// ---------------------------------------------------------------- options

export interface DesignOption<T extends string = string> {
  id: T;
  labelEn: string;
  labelAr: string;
}

export const ATMOSPHERES: DesignOption<PlanetAtmosphere>[] = [
  { id: 'none', labelEn: 'None', labelAr: 'بدون' },
  { id: 'thin', labelEn: 'Thin sky', labelAr: 'سماء رقيقة' },
  { id: 'thick', labelEn: 'Thick haze', labelAr: 'ضباب كثيف' },
  { id: 'stormy', labelEn: 'Storms', labelAr: 'عواصف' },
  { id: 'electric', labelEn: 'Electric', labelAr: 'كهربائي' },
  { id: 'dusty', labelEn: 'Dust', labelAr: 'غبار' },
];

export const RINGS: DesignOption<RingStyle>[] = [
  { id: 'none', labelEn: 'No ring', labelAr: 'بدون' },
  { id: 'classic', labelEn: 'Saturn', labelAr: 'زحل' },
  { id: 'thin', labelEn: 'Thin', labelAr: 'رفيعة' },
  { id: 'double', labelEn: 'Double', labelAr: 'مزدوجة' },
  { id: 'dust', labelEn: 'Dust', labelAr: 'غبارية' },
  { id: 'neon', labelEn: 'Neon', labelAr: 'نيون' },
  { id: 'ice', labelEn: 'Ice shards', labelAr: 'شظايا جليد' },
  { id: 'cross', labelEn: 'Gyroscope', labelAr: 'جيروسكوب' },
];

export const LIGHTS: DesignOption<LightStyle>[] = [
  { id: 'sun', labelEn: 'Yellow sun', labelAr: 'شمس صفراء' },
  { id: 'blue', labelEn: 'Blue giant', labelAr: 'عملاق أزرق' },
  { id: 'red', labelEn: 'Red dwarf', labelAr: 'قزم أحمر' },
  { id: 'binary', labelEn: 'Two suns', labelAr: 'شمسان' },
];

export const PHASES: DesignOption<LightPhase>[] = [
  { id: 'front', labelEn: 'Full', labelAr: 'مكتمل' },
  { id: 'side', labelEn: 'Half', labelAr: 'نصفي' },
  { id: 'back', labelEn: 'Crescent', labelAr: 'هلال' },
];

export const SPINS: DesignOption<'0' | '1' | '2' | '3'>[] = [
  { id: '0', labelEn: 'Still', labelAr: 'ثابت' },
  { id: '1', labelEn: 'Slow', labelAr: 'بطيء' },
  { id: '2', labelEn: 'Normal', labelAr: 'عادي' },
  { id: '3', labelEn: 'Fast', labelAr: 'سريع' },
];

export const EFFECTS: DesignOption<PlanetEffect>[] = [
  { id: 'lights', labelEn: 'City lights', labelAr: 'أضواء مدن' },
  { id: 'caps', labelEn: 'Polar ice', labelAr: 'جليد قطبي' },
  { id: 'aurora', labelEn: 'Polar aurora', labelAr: 'شفق قطبي' },
  { id: 'satellites', labelEn: 'Satellites', labelAr: 'أقمار صناعية' },
];

export const SPACE_BACKGROUNDS: DesignOption<SpaceBackground>[] = [
  { id: 'deep_space', labelEn: 'Deep space', labelAr: 'فضاء عميق' },
  { id: 'nebula', labelEn: 'Nebula', labelAr: 'سديم' },
  { id: 'aurora', labelEn: 'Aurora sky', labelAr: 'سماء الشفق' },
  { id: 'galaxy', labelEn: 'Spiral galaxy', labelAr: 'مجرة حلزونية' },
  { id: 'milkyway', labelEn: 'Milky Way', labelAr: 'درب التبانة' },
  { id: 'sunrise', labelEn: 'Star rise', labelAr: 'شروق نجم' },
  { id: 'void', labelEn: 'Void', labelAr: 'فراغ' },
];

export const MOODS: DesignOption<UniverseMood>[] = [
  { id: 'calm', labelEn: 'Calm', labelAr: 'هادئ' },
  { id: 'mysterious', labelEn: 'Mysterious', labelAr: 'غامض' },
  { id: 'creative', labelEn: 'Creative', labelAr: 'إبداعي' },
  { id: 'warm', labelEn: 'Warm', labelAr: 'دافئ' },
  { id: 'futuristic', labelEn: 'Futuristic', labelAr: 'مستقبلي' },
  { id: 'minimal', labelEn: 'Minimal', labelAr: 'بسيط' },
];

const ATMO_IDS = ATMOSPHERES.map((o) => o.id) as string[];
const RING_IDS = RINGS.map((o) => o.id) as string[];
const LIGHT_IDS = LIGHTS.map((o) => o.id) as string[];
const PHASE_IDS = PHASES.map((o) => o.id) as string[];
const EFFECT_IDS = EFFECTS.map((o) => o.id) as string[];
const BG_IDS = SPACE_BACKGROUNDS.map((o) => o.id) as string[];
const MOOD_IDS = MOODS.map((o) => o.id) as string[];

export const DEFAULT_DESIGN: PlanetDesign = {
  color2: null,
  atmoColor: null,
  ring: 'none',
  moons: 0,
  tilt: 14,
  spin: 2,
  light: 'sun',
  phase: 'side',
  scale: 3,
  variant: 0,
  effects: [],
};

// ---------------------------------------------------------------- colour

const HEX_RE = /^#[0-9a-f]{6}$/i;

export function isHex(value: unknown): value is string {
  return typeof value === 'string' && HEX_RE.test(value);
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export function hexToHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

export function hslToHex(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360;
  const ss = clamp(s, 0, 1);
  const ll = clamp(l, 0, 1);
  const c = (1 - Math.abs(2 * ll - 1)) * ss;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = ll - c / 2;
  let rgb: [number, number, number];
  if (hh < 60) rgb = [c, x, 0];
  else if (hh < 120) rgb = [x, c, 0];
  else if (hh < 180) rgb = [0, c, x];
  else if (hh < 240) rgb = [0, x, c];
  else if (hh < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return (
    '#' +
    rgb
      .map((v) =>
        Math.round((v + m) * 255)
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
  );
}

/** Colour suggestions that sit well next to the main colour */
export function harmonyColors(hex: string): string[] {
  const [h, s, l] = hexToHsl(isHex(hex) ? hex : '#7c8cff');
  const sat = clamp(Math.max(s, 0.45), 0, 0.95);
  return [
    hslToHex(h + 38, sat, clamp(l + 0.05, 0.35, 0.72)),
    hslToHex(h + 180, sat, clamp(l, 0.4, 0.66)),
    hslToHex(h + 120, sat, clamp(l, 0.42, 0.66)),
    hslToHex(h - 40, sat, clamp(l - 0.08, 0.3, 0.6)),
    hslToHex(h, clamp(s * 0.6, 0.15, 0.6), clamp(l + 0.28, 0.6, 0.9)),
    hslToHex(h + 205, clamp(sat * 0.85, 0.3, 0.9), clamp(l - 0.2, 0.18, 0.4)),
  ];
}

export function autoSecondColor(hex: string): string {
  return harmonyColors(hex)[0]!;
}

/** The sky colour each kind of surface would naturally have */
export function autoAtmoColor(surface: PlanetSurfaceId, color: string, color2: string): string {
  switch (surface) {
    case 'oceanic':
    case 'forest':
    case 'cloudy':
    case 'misty':
      return '#7cc4ff';
    case 'desert':
    case 'twilight':
      return '#ffb37a';
    case 'volcanic':
    case 'lava_veins':
    case 'cracked':
      return '#ff7a45';
    case 'frozen':
    case 'pearl':
      return '#bfeaff';
    case 'toxic':
      return '#c8ff6a';
    case 'neon':
    case 'hologram':
    case 'shadowy':
    case 'aurora':
      return color2;
    default: {
      const [h, s, l] = hexToHsl(color);
      return hslToHex(h, clamp(s * 0.85, 0.2, 0.9), clamp(l + 0.18, 0.55, 0.85));
    }
  }
}

// ---------------------------------------------------------------- parsing

export function parseDesign(raw: unknown, hasRing = false): PlanetDesign {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const num = (v: unknown, lo: number, hi: number, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v) ? clamp(Math.round(v), lo, hi) : fallback;
  const pick = <T extends string>(v: unknown, ids: string[], fallback: T): T =>
    typeof v === 'string' && ids.includes(v) ? (v as T) : fallback;

  const effects = Array.isArray(src.effects)
    ? (src.effects.filter((e) => typeof e === 'string' && EFFECT_IDS.includes(e)) as PlanetEffect[])
    : [];

  return {
    color2: isHex(src.color2) ? src.color2.toLowerCase() : null,
    atmoColor: isHex(src.atmoColor) ? src.atmoColor.toLowerCase() : null,
    ring: pick<RingStyle>(src.ring, RING_IDS, hasRing ? 'classic' : 'none'),
    moons: num(src.moons, 0, 3, DEFAULT_DESIGN.moons),
    tilt: num(src.tilt, -45, 45, DEFAULT_DESIGN.tilt),
    spin: num(src.spin, 0, 3, DEFAULT_DESIGN.spin),
    light: pick<LightStyle>(src.light, LIGHT_IDS, DEFAULT_DESIGN.light),
    phase: pick<LightPhase>(src.phase, PHASE_IDS, DEFAULT_DESIGN.phase),
    scale: num(src.scale, 1, 5, DEFAULT_DESIGN.scale),
    variant: num(src.variant, 0, 9999, DEFAULT_DESIGN.variant),
    effects: Array.from(new Set(effects)),
  };
}

/** Compact jsonb payload for profiles.planet_design */
export function serializeDesign(design: PlanetDesign): Record<string, unknown> {
  const clean = parseDesign(design, design.ring !== 'none');
  return {
    v: 1,
    color2: clean.color2,
    atmoColor: clean.atmoColor,
    ring: clean.ring,
    moons: clean.moons,
    tilt: clean.tilt,
    spin: clean.spin,
    light: clean.light,
    phase: clean.phase,
    scale: clean.scale,
    variant: clean.variant,
    effects: clean.effects,
  };
}

export function normalizeAtmosphere(value: unknown): PlanetAtmosphere {
  return typeof value === 'string' && ATMO_IDS.includes(value) ? (value as PlanetAtmosphere) : 'thin';
}

export function normalizeBackground(value: unknown): SpaceBackground {
  return typeof value === 'string' && BG_IDS.includes(value) ? (value as SpaceBackground) : 'deep_space';
}

export function normalizeMood(value: unknown): UniverseMood {
  return typeof value === 'string' && MOOD_IDS.includes(value) ? (value as UniverseMood) : 'calm';
}

export interface LookBase {
  color: string;
  surface: string;
  atmosphere: string;
  glow: number;
  mood: string;
  spaceBackground: string;
  seed: string;
}

export function buildLook(base: LookBase, design: PlanetDesign): PlanetLook {
  const color = isHex(base.color) ? base.color.toLowerCase() : '#7c8cff';
  const surface = normalizePlanetSurface(base.surface);
  const color2 = design.color2 ?? autoSecondColor(color);
  return {
    color,
    color2,
    atmoColor: design.atmoColor ?? autoAtmoColor(surface, color, color2),
    surface,
    atmosphere: normalizeAtmosphere(base.atmosphere),
    glow: clamp(Math.round(Number(base.glow) || 0), 0, 5),
    ring: design.ring,
    moons: design.moons,
    tilt: design.tilt,
    spin: design.spin,
    light: design.light,
    phase: design.phase,
    scale: design.scale,
    variant: design.variant,
    effects: design.effects,
    mood: normalizeMood(base.mood),
    spaceBackground: normalizeBackground(base.spaceBackground),
    seed: base.seed || 'orbit',
  };
}

export interface ProfileLookSource {
  username: string;
  planet_color: string;
  planet_surface_style: string;
  planet_atmosphere: string;
  planet_glow: number;
  planet_has_ring: boolean;
  planet_design?: unknown;
  universe_mood: string;
  space_background: string;
}

export function lookFromProfile(row: ProfileLookSource): PlanetLook {
  return buildLook(
    {
      color: row.planet_color,
      surface: row.planet_surface_style,
      atmosphere: row.planet_atmosphere,
      glow: row.planet_glow,
      mood: row.universe_mood,
      spaceBackground: row.space_background,
      seed: row.username,
    },
    parseDesign(row.planet_design, row.planet_has_ring)
  );
}

/** Same look with a few fields swapped — used by option thumbnails */
export function withLook(look: PlanetLook, patch: Partial<PlanetLook>): PlanetLook {
  const next = { ...look, ...patch };
  if (patch.surface && !('atmoColor' in patch)) {
    // keep an explicit atmosphere colour, re-derive an automatic one
    const auto = autoAtmoColor(look.surface, look.color, look.color2);
    if (look.atmoColor === auto) next.atmoColor = autoAtmoColor(patch.surface, next.color, next.color2);
  }
  return next;
}

/** Cache key for rendered stills */
export function lookKey(look: PlanetLook, extra = ''): string {
  return [
    look.color,
    look.color2,
    look.atmoColor,
    look.surface,
    look.atmosphere,
    look.glow,
    look.ring,
    look.moons,
    look.tilt,
    look.light,
    look.phase,
    look.scale,
    look.variant,
    look.effects.join('.'),
    look.seed,
    extra,
  ].join('|');
}
