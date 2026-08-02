import type {
  PlanetAtmosphere,
  PlanetSurfaceStyle,
  SpaceBackground,
  UniverseMood,
} from '@/types/database';

export const PLANET_COLORS = [
  '#7c8cff',
  '#6cd9ff',
  '#c78cff',
  '#ff9d6c',
  '#7cffa8',
  '#ff7eb3',
  '#ffd56c',
  '#a8b4ff',
];

export const MOOD_PRESETS: Record<
  UniverseMood,
  { bg: string; accent: string; glow: string }
> = {
  calm: { bg: '#0a0d16', accent: '#6cd9ff', glow: '#6cd9ff40' },
  mysterious: { bg: '#0d0818', accent: '#c78cff', glow: '#c78cff50' },
  creative: { bg: '#120a1a', accent: '#ff9d6c', glow: '#ff9d6c40' },
  warm: { bg: '#140c0a', accent: '#ff9d6c', glow: '#ff9d6c50' },
  futuristic: { bg: '#060a14', accent: '#7c8cff', glow: '#7c8cff60' },
  minimal: { bg: '#080808', accent: '#9aa0c3', glow: '#9aa0c330' },
};

export const BACKGROUND_GRADIENTS: Record<SpaceBackground, string> = {
  deep_space: 'radial-gradient(ellipse at 50% 50%, #12162a 0%, #05060a 70%)',
  nebula: 'radial-gradient(ellipse at 30% 40%, #1a1040 0%, #05060a 80%)',
  aurora: 'radial-gradient(ellipse at 70% 20%, #0a3028 0%, #05060a 75%)',
  void: 'radial-gradient(ellipse at 50% 50%, #0a0a0a 0%, #000000 100%)',
};

export function getPlanetGradient(
  color: string,
  surface: PlanetSurfaceStyle
): string {
  switch (surface) {
    case 'cratered':
      return `radial-gradient(circle at 35% 35%, ${color}cc 0%, ${color}88 40%, ${color}44 100%)`;
    case 'banded':
      return `linear-gradient(180deg, ${color} 0%, ${color}aa 25%, ${color}66 50%, ${color}aa 75%, ${color} 100%)`;
    case 'crystalline':
      return `radial-gradient(circle at 50% 30%, #ffffff44 0%, ${color} 50%, ${color}66 100%)`;
    case 'oceanic':
      return `radial-gradient(circle at 40% 60%, ${color}dd 0%, ${color}88 60%, ${color}33 100%)`;
    default:
      return `radial-gradient(circle at 35% 30%, ${color}ee 0%, ${color} 60%, ${color}88 100%)`;
  }
}

export function getAtmosphereOpacity(atmosphere: PlanetAtmosphere): number {
  switch (atmosphere) {
    case 'none':
      return 0;
    case 'thin':
      return 0.15;
    case 'thick':
      return 0.35;
    case 'stormy':
      return 0.25;
    default:
      return 0.15;
  }
}

export function glowIntensity(glow: number): string {
  const map: Record<number, string> = {
    0: '0 0 0px transparent',
    1: '0 0 8px var(--glow-color)',
    2: '0 0 16px var(--glow-color)',
    3: '0 0 24px var(--glow-color)',
    4: '0 0 36px var(--glow-color)',
    5: '0 0 48px var(--glow-color)',
  };
  return map[glow] ?? map[3]!;
}
