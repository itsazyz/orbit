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
  { bg: string; accent: string; glow: string; wash: string }
> = {
  calm: {
    bg: '#071018',
    accent: '#5ec8ff',
    glow: '#5ec8ff66',
    wash: 'radial-gradient(ellipse at 30% 20%, #0d3a4a88 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, #163a5888 0%, transparent 45%)',
  },
  mysterious: {
    bg: '#10061c',
    accent: '#d28cff',
    glow: '#d28cff77',
    wash: 'radial-gradient(ellipse at 20% 40%, #4a187888 0%, transparent 50%), radial-gradient(ellipse at 80% 30%, #2a0a4888 0%, transparent 45%)',
  },
  creative: {
    bg: '#1a0a14',
    accent: '#ff8a4c',
    glow: '#ff8a4c66',
    wash: 'radial-gradient(ellipse at 25% 30%, #5a204088 0%, transparent 50%), radial-gradient(ellipse at 75% 70%, #ff6b3588 0%, transparent 40%)',
  },
  warm: {
    bg: '#1a0c08',
    accent: '#ffb347',
    glow: '#ffb34777',
    wash: 'radial-gradient(ellipse at 40% 20%, #6a301888 0%, transparent 55%), radial-gradient(ellipse at 60% 80%, #ff704388 0%, transparent 45%)',
  },
  futuristic: {
    bg: '#040a18',
    accent: '#6ea0ff',
    glow: '#6ea0ff88',
    wash: 'radial-gradient(ellipse at 50% 10%, #1a3cff66 0%, transparent 45%), linear-gradient(180deg, #0a1a4088 0%, transparent 40%)',
  },
  minimal: {
    bg: '#090909',
    accent: '#c8c8d0',
    glow: '#c8c8d044',
    wash: 'radial-gradient(ellipse at 50% 50%, #22222866 0%, transparent 60%)',
  },
};

export const BACKGROUND_GRADIENTS: Record<SpaceBackground, string> = {
  deep_space:
    'radial-gradient(ellipse at 50% 40%, #1a2450 0%, #0a1028 40%, #03040c 75%)',
  nebula:
    'radial-gradient(ellipse at 25% 35%, #5a2088 0%, #2a1050 35%, #0a0618 70%), radial-gradient(ellipse at 75% 65%, #ff4d8844 0%, transparent 45%)',
  aurora:
    'radial-gradient(ellipse at 60% 15%, #20c997aa 0%, #0a4030 30%, #050e14 70%), radial-gradient(ellipse at 30% 70%, #4cc9f066 0%, transparent 40%)',
  void: 'radial-gradient(ellipse at 50% 50%, #121212 0%, #050505 50%, #000000 100%)',
};

/** Extra decorative layers unique to each space background */
export function getSpaceExtraLayers(space: SpaceBackground): {
  opacity: number;
  background: string;
}[] {
  switch (space) {
    case 'nebula':
      return [
        {
          opacity: 0.55,
          background:
            'radial-gradient(ellipse at 70% 25%, #ff6bcb66 0%, transparent 40%), radial-gradient(ellipse at 20% 70%, #7c5cff66 0%, transparent 35%)',
        },
        {
          opacity: 0.35,
          background:
            'conic-gradient(from 120deg at 40% 50%, transparent, #c78cff44, transparent 40%, #ff9d6c33, transparent 70%)',
        },
      ];
    case 'aurora':
      return [
        {
          opacity: 0.5,
          background:
            'linear-gradient(115deg, transparent 20%, #20c99755 35%, transparent 45%, #4cc9f055 60%, transparent 75%)',
        },
        {
          opacity: 0.35,
          background:
            'linear-gradient(250deg, transparent 30%, #80ffdb44 50%, transparent 65%)',
        },
      ];
    case 'void':
      return [
        {
          opacity: 0.9,
          background: 'radial-gradient(circle at 50% 50%, #0a0a0a 0%, #000 70%)',
        },
      ];
    case 'deep_space':
    default:
      return [
        {
          opacity: 0.4,
          background:
            'radial-gradient(ellipse at 15% 20%, #3a5cff44 0%, transparent 35%), radial-gradient(ellipse at 85% 75%, #2040aa33 0%, transparent 40%)',
        },
      ];
  }
}

export function getPlanetGradient(
  color: string,
  surface: PlanetSurfaceStyle
): string {
  switch (surface) {
    case 'smooth':
      return `radial-gradient(circle at 32% 28%, #ffffffcc 0%, ${color} 38%, ${color} 70%, #1a1028 100%)`;
    case 'cratered':
      return `radial-gradient(circle at 30% 30%, ${color} 0%, #3a2a20 45%, ${color}88 70%, #1a1008 100%)`;
    case 'banded':
      return `repeating-linear-gradient(180deg, ${color} 0 12%, ${color}66 12% 22%, #1a1030 22% 30%, ${color}aa 30% 42%, ${color}44 42% 52%, ${color} 52% 100%)`;
    case 'striped':
      return `repeating-linear-gradient(12deg, ${color} 0 8%, #0a0a14 8% 14%, ${color}cc 14% 22%, ${color}55 22% 28%)`;
    case 'crystalline':
      return `radial-gradient(circle at 50% 20%, #ffffff 0%, ${color} 35%, #6ecbff66 55%, ${color}44 80%)`;
    case 'prism':
      return `conic-gradient(from 40deg, #ff7eb3, ${color}, #7cffa8, #ffd56c, #6cd9ff, #ff7eb3)`;
    case 'oceanic':
      return `radial-gradient(circle at 40% 55%, #a8e6ff 0%, ${color} 35%, #0a3a55 65%, #021018 100%)`;
    case 'coral':
      return `radial-gradient(circle at 45% 40%, #ffb3d9 0%, #ff7eb3 30%, ${color} 55%, #5a2040 100%)`;
    case 'volcanic':
      return `radial-gradient(circle at 45% 45%, #ffdd55 0%, #ff6b35 25%, #8b1a00 55%, #1a0500 100%)`;
    case 'lava_veins':
      return `radial-gradient(circle at 40% 40%, #ff9d6c 0%, #ff3d00 30%, ${color} 50%, #1a0808 100%)`;
    case 'frozen':
      return `radial-gradient(circle at 35% 30%, #ffffff 0%, #c8f0ff 30%, #7ec8e8 55%, #1a3040 100%)`;
    case 'pearl':
      return `radial-gradient(circle at 30% 25%, #ffffff 0%, #f5e6ff 35%, ${color}aa 60%, #d0b8e8 100%)`;
    case 'stormy_surface':
      return `radial-gradient(circle at 50% 50%, ${color} 0%, #2a1840 40%, #0a0818 70%, #000 100%)`;
    case 'forest':
      return `radial-gradient(circle at 40% 35%, #8fef9a 0%, #2d6a4f 35%, #1b4332 60%, #081c15 100%)`;
    case 'desert':
      return `radial-gradient(circle at 45% 30%, #ffe8a3 0%, #e0a96d 35%, #c4843a 60%, #5a3a18 100%)`;
    case 'neon':
      return `radial-gradient(circle at 40% 35%, #ffffff 0%, ${color} 25%, #050510 55%, ${color} 56%, #050510 100%)`;
    case 'marble':
      return `radial-gradient(circle at 28% 22%, #ffffff 0%, #f0e8ff 25%, ${color}99 50%, #d8d0e8 80%)`;
    case 'mosaic':
      return `radial-gradient(circle at 40% 40%, ${color} 0%, #ff9d6c 40%, #7c8cff 70%, #1a1030 100%)`;
    case 'geometric':
      return `radial-gradient(circle at 50% 50%, ${color}ee 0%, #1a2040 50%, ${color}66 80%)`;
    case 'cracked':
      return `radial-gradient(circle at 45% 40%, ${color} 0%, #4a3020 40%, #1a1008 70%, #0a0604 100%)`;
    case 'luminous':
      return `radial-gradient(circle at 40% 30%, #ffffff 0%, ${color} 25%, #ffffff88 45%, ${color} 70%)`;
    case 'shadowy':
      return `radial-gradient(circle at 65% 35%, ${color}88 0%, #1a1028 35%, #050508 65%, #000 100%)`;
    case 'eclipse':
      return `radial-gradient(circle at 72% 38%, ${color} 0%, #1a0a20 25%, #000 55%, #000 100%)`;
    case 'spotted':
      return `radial-gradient(circle at 35% 35%, ${color} 0%, ${color}cc 40%, #2a1830 100%)`;
    case 'aurora':
      return `radial-gradient(circle at 50% 40%, #80ffdb 0%, ${color} 30%, #7c5cff 55%, #1a1040 100%)`;
    case 'metallic':
      return `linear-gradient(145deg, #ffffff 0%, #d0d8e8 20%, ${color} 45%, #404858 70%, #ffffff66 100%)`;
    case 'cloudy':
      return `radial-gradient(circle at 40% 35%, #ffffffaa 0%, ${color}99 40%, #7080a0 70%, ${color}55 100%)`;
    case 'misty':
      return `radial-gradient(circle at 45% 40%, #e8f0ff99 0%, ${color}66 45%, #405060 80%)`;
    default:
      return `radial-gradient(circle at 35% 30%, ${color}ee 0%, ${color} 60%, ${color}88 100%)`;
  }
}

export function getAtmosphereOpacity(atmosphere: PlanetAtmosphere): number {
  switch (atmosphere) {
    case 'none':
      return 0;
    case 'thin':
      return 0.22;
    case 'thick':
      return 0.55;
    case 'stormy':
      return 0.4;
    default:
      return 0.22;
  }
}

export function getAtmosphereScale(atmosphere: PlanetAtmosphere): number {
  switch (atmosphere) {
    case 'none':
      return 1;
    case 'thin':
      return 1.2;
    case 'thick':
      return 1.45;
    case 'stormy':
      return 1.38;
    default:
      return 1.2;
  }
}

export function glowIntensity(glow: number): string {
  const map: Record<number, string> = {
    0: '0 0 0 transparent',
    1: '0 0 12px var(--glow-color)',
    2: '0 0 22px var(--glow-color), 0 0 40px var(--glow-color)',
    3: '0 0 32px var(--glow-color), 0 0 64px var(--glow-color)',
    4: '0 0 44px var(--glow-color), 0 0 90px var(--glow-color)',
    5: '0 0 60px var(--glow-color), 0 0 120px var(--glow-color), 0 0 180px var(--glow-color)',
  };
  return map[glow] ?? map[3]!;
}

/** Distinct accent colors for star shape types so they never look the same */
export const STAR_TYPE_COLORS: Record<string, string> = {
  sparkle: '#ffffff',
  diamond: '#7dd3fc',
  glow: '#f0abfc',
  comet: '#fdba74',
  ring: '#a5b4fc',
  classic: '#fde68a',
};
