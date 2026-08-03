import type {
  PlanetAtmosphere,
  PlanetSurfaceStyle,
  SpaceBackground,
  UniverseMood,
} from '@/types/database';
import type { VisualPresetOption } from '@/lib/universe/visual-styles';

export interface UniverseTheme {
  id: string;
  labelEn: string;
  labelAr: string;
  planetColor: string;
  planetSurface: PlanetSurfaceStyle;
  atmosphere: PlanetAtmosphere;
  glow: number;
  hasRing: boolean;
  mood: UniverseMood;
  spaceBackground: SpaceBackground;
}

export const ATMOSPHERE_OPTIONS: VisualPresetOption[] = [
  { id: 'none', labelEn: 'None', labelAr: 'بدون' },
  { id: 'thin', labelEn: 'Thin', labelAr: 'خفيف' },
  { id: 'thick', labelEn: 'Thick', labelAr: 'كثيف' },
  { id: 'stormy', labelEn: 'Stormy', labelAr: 'عاصف' },
];

export const SPACE_BACKGROUND_OPTIONS: VisualPresetOption[] = [
  { id: 'deep_space', labelEn: 'Deep space', labelAr: 'فضاء عميق' },
  { id: 'nebula', labelEn: 'Nebula', labelAr: 'سديم' },
  { id: 'aurora', labelEn: 'Aurora', labelAr: 'شفق' },
  { id: 'void', labelEn: 'Void', labelAr: 'فراغ' },
];

export const UNIVERSE_THEMES: UniverseTheme[] = [
  {
    id: 'neon-night',
    labelEn: 'Neon Night',
    labelAr: 'ليلة نيون',
    planetColor: '#7c8cff',
    planetSurface: 'crystalline',
    atmosphere: 'thin',
    glow: 5,
    hasRing: true,
    mood: 'futuristic',
    spaceBackground: 'deep_space',
  },
  {
    id: 'ocean-quiet',
    labelEn: 'Ocean Quiet',
    labelAr: 'هدوء المحيط',
    planetColor: '#3b9eff',
    planetSurface: 'oceanic',
    atmosphere: 'thick',
    glow: 3,
    hasRing: false,
    mood: 'calm',
    spaceBackground: 'aurora',
  },
  {
    id: 'ember',
    labelEn: 'Ember',
    labelAr: 'جمرة',
    planetColor: '#ff7a45',
    planetSurface: 'banded',
    atmosphere: 'stormy',
    glow: 4,
    hasRing: false,
    mood: 'warm',
    spaceBackground: 'nebula',
  },
  {
    id: 'crystal-void',
    labelEn: 'Crystal Void',
    labelAr: 'فراغ بلوري',
    planetColor: '#c4b5fd',
    planetSurface: 'crystalline',
    atmosphere: 'thin',
    glow: 4,
    hasRing: true,
    mood: 'mysterious',
    spaceBackground: 'void',
  },
  {
    id: 'soft-dawn',
    labelEn: 'Soft Dawn',
    labelAr: 'فجر ناعم',
    planetColor: '#f0abfc',
    planetSurface: 'smooth',
    atmosphere: 'thick',
    glow: 3,
    hasRing: false,
    mood: 'creative',
    spaceBackground: 'nebula',
  },
  {
    id: 'minimal-orbit',
    labelEn: 'Minimal Orbit',
    labelAr: 'مدار بسيط',
    planetColor: '#94a3b8',
    planetSurface: 'smooth',
    atmosphere: 'none',
    glow: 2,
    hasRing: false,
    mood: 'minimal',
    spaceBackground: 'void',
  },
];
