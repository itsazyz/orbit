import type { VisualPresetOption } from '@/lib/universe/visual-styles';

/** Personality-driven planet surface catalog (24 looks) */
export const PLANET_SURFACE_IDS = [
  'smooth',
  'cratered',
  'banded',
  'crystalline',
  'oceanic',
  'volcanic',
  'frozen',
  'stormy_surface',
  'forest',
  'desert',
  'neon',
  'marble',
  'mosaic',
  'cracked',
  'luminous',
  'shadowy',
  'striped',
  'spotted',
  'aurora',
  'metallic',
  'cloudy',
  'lava_veins',
  'pearl',
  'geometric',
  'misty',
  'coral',
  'eclipse',
  'prism',
] as const;

export type PlanetSurfaceId = (typeof PLANET_SURFACE_IDS)[number];

export interface PlanetSurfaceOption extends VisualPresetOption {
  id: PlanetSurfaceId;
  /** Short personality vibe */
  vibeEn: string;
  vibeAr: string;
}

export const PLANET_SURFACE_CATALOG: PlanetSurfaceOption[] = [
  {
    id: 'smooth',
    labelEn: 'Smooth',
    labelAr: 'أملس',
    vibeEn: 'Calm & clear',
    vibeAr: 'هادئ وواضح',
  },
  {
    id: 'cratered',
    labelEn: 'Cratered',
    labelAr: 'فوهات',
    vibeEn: 'Resilient',
    vibeAr: 'صلب ومتحمّل',
  },
  {
    id: 'banded',
    labelEn: 'Banded',
    labelAr: 'مخطّط',
    vibeEn: 'Dynamic energy',
    vibeAr: 'طاقة متحركة',
  },
  {
    id: 'crystalline',
    labelEn: 'Crystalline',
    labelAr: 'بلوري',
    vibeEn: 'Dreamer',
    vibeAr: 'حالم',
  },
  {
    id: 'oceanic',
    labelEn: 'Oceanic',
    labelAr: 'محيطي',
    vibeEn: 'Deep feelings',
    vibeAr: 'عمق عاطفي',
  },
  {
    id: 'volcanic',
    labelEn: 'Volcanic',
    labelAr: 'بركاني',
    vibeEn: 'Passionate',
    vibeAr: 'شغوف',
  },
  {
    id: 'frozen',
    labelEn: 'Frozen',
    labelAr: 'متجمّد',
    vibeEn: 'Reserved',
    vibeAr: 'متحفّظ',
  },
  {
    id: 'stormy_surface',
    labelEn: 'Stormy',
    labelAr: 'عاصف',
    vibeEn: 'Intense',
    vibeAr: 'قوي الطاقة',
  },
  {
    id: 'forest',
    labelEn: 'Living',
    labelAr: 'حيّ',
    vibeEn: 'Nurturing',
    vibeAr: 'حنون',
  },
  {
    id: 'desert',
    labelEn: 'Desert',
    labelAr: 'صحراوي',
    vibeEn: 'Independent',
    vibeAr: 'مستقل',
  },
  {
    id: 'neon',
    labelEn: 'Neon',
    labelAr: 'نيون',
    vibeEn: 'Futuristic',
    vibeAr: 'مستقبلي',
  },
  {
    id: 'marble',
    labelEn: 'Marble',
    labelAr: 'رخامي',
    vibeEn: 'Elegant',
    vibeAr: 'أنيق',
  },
  {
    id: 'mosaic',
    labelEn: 'Mosaic',
    labelAr: 'فسيفساء',
    vibeEn: 'Creative',
    vibeAr: 'مبدع',
  },
  {
    id: 'cracked',
    labelEn: 'Cracked',
    labelAr: 'متصدّع',
    vibeEn: 'Rebuilding',
    vibeAr: 'يعيد بناء نفسه',
  },
  {
    id: 'luminous',
    labelEn: 'Luminous',
    labelAr: 'مضيء',
    vibeEn: 'Radiant',
    vibeAr: 'مشرق',
  },
  {
    id: 'shadowy',
    labelEn: 'Shadow',
    labelAr: 'ظلّي',
    vibeEn: 'Mysterious',
    vibeAr: 'غامض',
  },
  {
    id: 'striped',
    labelEn: 'Striped',
    labelAr: 'شرائط',
    vibeEn: 'Structured',
    vibeAr: 'منظّم',
  },
  {
    id: 'spotted',
    labelEn: 'Spotted',
    labelAr: 'منقّط',
    vibeEn: 'Playful',
    vibeAr: 'مرح',
  },
  {
    id: 'aurora',
    labelEn: 'Aurora',
    labelAr: 'شفق',
    vibeEn: 'Sensitive',
    vibeAr: 'حسّاس',
  },
  {
    id: 'metallic',
    labelEn: 'Metallic',
    labelAr: 'معدني',
    vibeEn: 'Ambitious',
    vibeAr: 'طموح',
  },
  {
    id: 'cloudy',
    labelEn: 'Cloudy',
    labelAr: 'سحابي',
    vibeEn: 'Thoughtful',
    vibeAr: 'متأمّل',
  },
  {
    id: 'lava_veins',
    labelEn: 'Lava veins',
    labelAr: 'عروق لافا',
    vibeEn: 'Bold',
    vibeAr: 'جريء',
  },
  {
    id: 'pearl',
    labelEn: 'Pearl',
    labelAr: 'لؤلؤي',
    vibeEn: 'Soft soul',
    vibeAr: 'روح ناعمة',
  },
  {
    id: 'geometric',
    labelEn: 'Geometric',
    labelAr: 'هندسي',
    vibeEn: 'Logical',
    vibeAr: 'منطقي',
  },
  {
    id: 'misty',
    labelEn: 'Misty',
    labelAr: 'ضبابي',
    vibeEn: 'Quiet mind',
    vibeAr: 'هدوء داخلي',
  },
  {
    id: 'coral',
    labelEn: 'Coral',
    labelAr: 'مرجاني',
    vibeEn: 'Warm',
    vibeAr: 'دافئ',
  },
  {
    id: 'eclipse',
    labelEn: 'Eclipse',
    labelAr: 'كسوف',
    vibeEn: 'Focused',
    vibeAr: 'تركيز عميق',
  },
  {
    id: 'prism',
    labelEn: 'Prism',
    labelAr: 'موشور',
    vibeEn: 'Many sides',
    vibeAr: 'متعدّد الجوانب',
  },
];

export function isPlanetSurfaceId(value: string): value is PlanetSurfaceId {
  return (PLANET_SURFACE_IDS as readonly string[]).includes(value);
}

export function normalizePlanetSurface(value: string | null | undefined): PlanetSurfaceId {
  if (value && isPlanetSurfaceId(value)) return value;
  return 'smooth';
}
