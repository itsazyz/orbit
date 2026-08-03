import type { PlanetSurfaceStyle } from '@/types/database';
import {
  PLANET_SURFACE_CATALOG,
  isPlanetSurfaceId,
} from '@/lib/universe/planet-surfaces';

export type StarVisualType =
  | 'sparkle'
  | 'diamond'
  | 'glow'
  | 'comet'
  | 'ring'
  | 'classic';

export interface VisualPresetOption {
  id: string;
  labelEn: string;
  labelAr: string;
}

export const STAR_VISUAL_OPTIONS: VisualPresetOption[] = [
  { id: 'sparkle', labelEn: 'Sparkle', labelAr: 'بريق' },
  { id: 'diamond', labelEn: 'Diamond', labelAr: 'ماسي' },
  { id: 'glow', labelEn: 'Soft glow', labelAr: 'توهج ناعم' },
  { id: 'comet', labelEn: 'Comet', labelAr: 'مذنّب' },
  { id: 'ring', labelEn: 'Ring', labelAr: 'حلقي' },
  { id: 'classic', labelEn: 'Classic star', labelAr: 'نجمة كلاسيكية' },
];

export const PLANET_SURFACE_OPTIONS: VisualPresetOption[] = PLANET_SURFACE_CATALOG.map(
  ({ id, labelEn, labelAr }) => ({ id, labelEn, labelAr })
);

export const PLANET_MOOD_OPTIONS: VisualPresetOption[] = [
  { id: 'calm', labelEn: 'Calm', labelAr: 'هادئ' },
  { id: 'mysterious', labelEn: 'Mysterious', labelAr: 'غامض' },
  { id: 'creative', labelEn: 'Creative', labelAr: 'إبداعي' },
  { id: 'warm', labelEn: 'Warm', labelAr: 'دافئ' },
  { id: 'futuristic', labelEn: 'Futuristic', labelAr: 'مستقبلي' },
  { id: 'minimal', labelEn: 'Minimal', labelAr: 'بسيط' },
];

export function isStarVisualType(value: string): value is StarVisualType {
  return STAR_VISUAL_OPTIONS.some((o) => o.id === value);
}

export function isPlanetSurfaceStyle(value: string): value is PlanetSurfaceStyle {
  return isPlanetSurfaceId(value);
}

export const DEFAULT_VISUAL_PRESETS = {
  starTypes: STAR_VISUAL_OPTIONS,
  planetSurfaces: PLANET_SURFACE_OPTIONS,
  planetMoods: PLANET_MOOD_OPTIONS,
};
