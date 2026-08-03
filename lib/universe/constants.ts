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
    case 'striped':
      return `linear-gradient(180deg, ${color} 0%, ${color}aa 25%, ${color}66 50%, ${color}aa 75%, ${color} 100%)`;
    case 'crystalline':
    case 'prism':
      return `radial-gradient(circle at 50% 30%, #ffffff55 0%, ${color} 45%, ${color}66 100%)`;
    case 'oceanic':
    case 'coral':
      return `radial-gradient(circle at 40% 60%, ${color}dd 0%, ${color}88 55%, ${color}33 100%)`;
    case 'volcanic':
    case 'lava_veins':
      return `radial-gradient(circle at 40% 40%, ${color} 0%, #3a1010 55%, ${color}88 100%)`;
    case 'frozen':
    case 'pearl':
      return `radial-gradient(circle at 35% 30%, #ffffffaa 0%, ${color}cc 40%, ${color}66 100%)`;
    case 'stormy_surface':
      return `radial-gradient(circle at 50% 50%, ${color}ee 0%, ${color}66 50%, #0a0a12 100%)`;
    case 'forest':
      return `radial-gradient(circle at 40% 35%, ${color}ee 0%, #1a3a22 60%, ${color}44 100%)`;
    case 'desert':
      return `radial-gradient(circle at 45% 30%, ${color}ff 0%, ${color}99 50%, #5a3a18 100%)`;
    case 'neon':
      return `radial-gradient(circle at 40% 35%, #ffffff66 0%, ${color} 45%, #050510 100%)`;
    case 'marble':
      return `radial-gradient(circle at 30% 25%, #ffffff88 0%, ${color}bb 40%, ${color}77 100%)`;
    case 'mosaic':
    case 'geometric':
      return `radial-gradient(circle at 40% 40%, ${color}ee 0%, ${color}99 55%, ${color}55 100%)`;
    case 'cracked':
      return `radial-gradient(circle at 45% 40%, ${color}cc 0%, ${color}66 50%, #1a1210 100%)`;
    case 'luminous':
      return `radial-gradient(circle at 40% 30%, #ffffffcc 0%, ${color} 40%, ${color}88 100%)`;
    case 'shadowy':
    case 'eclipse':
      return `radial-gradient(circle at 60% 40%, ${color}99 0%, #0a0a12 55%, #000000 100%)`;
    case 'spotted':
      return `radial-gradient(circle at 35% 35%, ${color}ee 0%, ${color}aa 50%, ${color}66 100%)`;
    case 'aurora':
      return `radial-gradient(circle at 50% 40%, ${color}dd 0%, #2a1040 50%, ${color}55 100%)`;
    case 'metallic':
      return `linear-gradient(145deg, #ffffff88 0%, ${color} 35%, ${color}66 70%, #ffffff33 100%)`;
    case 'cloudy':
    case 'misty':
      return `radial-gradient(circle at 40% 35%, ${color}bb 0%, ${color}77 45%, ${color}44 100%)`;
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
