import type { PlanetAtmosphere, PlanetSurfaceStyle, SpaceBackground, UniverseMood } from '@/types/database';
import type { PlanetDesign } from '@/lib/planet/design';
import { ATMOSPHERES, SPACE_BACKGROUNDS } from '@/lib/planet/design';
import type { VisualPresetOption } from '@/lib/universe/visual-styles';

export interface UniverseTheme {
  id: string;
  labelEn: string;
  labelAr: string;
  planetColor: string;
  planetSurface: PlanetSurfaceStyle;
  atmosphere: PlanetAtmosphere;
  glow: number;
  mood: UniverseMood;
  spaceBackground: SpaceBackground;
  design: Partial<PlanetDesign>;
}

export const ATMOSPHERE_OPTIONS: VisualPresetOption[] = ATMOSPHERES;
export const SPACE_BACKGROUND_OPTIONS: VisualPresetOption[] = SPACE_BACKGROUNDS;

/** Ready-made looks — each shows off a different corner of the engine */
export const UNIVERSE_THEMES: UniverseTheme[] = [
  {
    id: 'gas-giant',
    labelEn: 'Gas Giant',
    labelAr: 'عملاق غازي',
    planetColor: '#e0a96d',
    planetSurface: 'banded',
    atmosphere: 'thin',
    glow: 2,
    mood: 'warm',
    spaceBackground: 'milkyway',
    design: { color2: '#8b4a2b', ring: 'classic', moons: 3, tilt: 18, light: 'sun', phase: 'side' },
  },
  {
    id: 'living-world',
    labelEn: 'Living World',
    labelAr: 'عالم حيّ',
    planetColor: '#5fd38a',
    planetSurface: 'forest',
    atmosphere: 'thin',
    glow: 3,
    mood: 'calm',
    spaceBackground: 'deep_space',
    design: { color2: '#2f7fd8', moons: 1, effects: ['lights', 'caps'], phase: 'side', tilt: 20 },
  },
  {
    id: 'neon-night',
    labelEn: 'Neon Night',
    labelAr: 'ليلة نيون',
    planetColor: '#7c8cff',
    planetSurface: 'neon',
    atmosphere: 'electric',
    glow: 5,
    mood: 'futuristic',
    spaceBackground: 'galaxy',
    design: { color2: '#ff5ecf', ring: 'neon', moons: 1, light: 'blue', effects: ['satellites'] },
  },
  {
    id: 'ember',
    labelEn: 'Ember',
    labelAr: 'جمرة',
    planetColor: '#ff7a45',
    planetSurface: 'volcanic',
    atmosphere: 'dusty',
    glow: 4,
    mood: 'warm',
    spaceBackground: 'nebula',
    design: { color2: '#ffd56c', ring: 'dust', light: 'red', phase: 'back' },
  },
  {
    id: 'crystal-void',
    labelEn: 'Crystal Void',
    labelAr: 'فراغ بلوري',
    planetColor: '#c4b5fd',
    planetSurface: 'crystalline',
    atmosphere: 'thin',
    glow: 4,
    mood: 'mysterious',
    spaceBackground: 'void',
    design: { color2: '#6cd9ff', ring: 'ice', moons: 2, light: 'blue', tilt: -16 },
  },
  {
    id: 'total-eclipse',
    labelEn: 'Total Eclipse',
    labelAr: 'كسوف كلّي',
    planetColor: '#ffd56c',
    planetSurface: 'eclipse',
    atmosphere: 'none',
    glow: 3,
    mood: 'mysterious',
    spaceBackground: 'deep_space',
    design: { color2: '#ff7eb3', moons: 1 },
  },
  {
    id: 'soft-dawn',
    labelEn: 'Soft Dawn',
    labelAr: 'فجر ناعم',
    planetColor: '#f0abfc',
    planetSurface: 'pearl',
    atmosphere: 'thick',
    glow: 3,
    mood: 'creative',
    spaceBackground: 'sunrise',
    design: { color2: '#ffd56c', ring: 'thin', phase: 'front', tilt: 8 },
  },
  {
    id: 'hologram',
    labelEn: 'Hologram',
    labelAr: 'هولوغرام',
    planetColor: '#6cd9ff',
    planetSurface: 'hologram',
    atmosphere: 'none',
    glow: 4,
    mood: 'futuristic',
    spaceBackground: 'deep_space',
    design: { color2: '#c78cff', ring: 'cross', effects: ['satellites'] },
  },
  {
    id: 'ice-moon',
    labelEn: 'Ice Moon',
    labelAr: 'قمر جليدي',
    planetColor: '#9fd8ff',
    planetSurface: 'frozen',
    atmosphere: 'thin',
    glow: 2,
    mood: 'calm',
    spaceBackground: 'aurora',
    design: { color2: '#3b82f6', moons: 2, effects: ['aurora'], light: 'blue' },
  },
  {
    id: 'minimal-orbit',
    labelEn: 'Minimal',
    labelAr: 'بسيط',
    planetColor: '#94a3b8',
    planetSurface: 'smooth',
    atmosphere: 'none',
    glow: 1,
    mood: 'minimal',
    spaceBackground: 'void',
    design: { color2: '#e2e8f0', ring: 'thin', spin: 1 },
  },
];
