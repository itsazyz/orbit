import type { VisualPresetOption } from '@/lib/universe/visual-styles';

/**
 * Planet surface catalog. Every id has its own procedural algorithm in
 * lib/planet/shader.ts (SURFACE_INDEX) — no two ids share a look.
 * Ids are stored in profiles.planet_surface_style, so never rename one.
 */
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
  'cosmic',
  'hologram',
  'toxic',
  'twilight',
] as const;

export type PlanetSurfaceId = (typeof PLANET_SURFACE_IDS)[number];

export interface PlanetSurfaceOption extends VisualPresetOption {
  id: PlanetSurfaceId;
  /** Short personality vibe */
  vibeEn: string;
  vibeAr: string;
}

export const PLANET_SURFACE_CATALOG: PlanetSurfaceOption[] = [
  { id: 'smooth', labelEn: 'Silk', labelAr: 'حريري', vibeEn: 'Calm & clear', vibeAr: 'هادئ وواضح' },
  { id: 'cratered', labelEn: 'Cratered', labelAr: 'فوهات', vibeEn: 'Resilient', vibeAr: 'صلب ومتحمّل' },
  { id: 'banded', labelEn: 'Gas giant', labelAr: 'عملاق غازي', vibeEn: 'Big energy', vibeAr: 'طاقة كبيرة' },
  { id: 'crystalline', labelEn: 'Gemstone', labelAr: 'جوهرة', vibeEn: 'Dreamer', vibeAr: 'حالم' },
  { id: 'oceanic', labelEn: 'Ocean world', labelAr: 'عالم مائي', vibeEn: 'Deep feelings', vibeAr: 'عمق عاطفي' },
  { id: 'volcanic', labelEn: 'Volcanic', labelAr: 'بركاني', vibeEn: 'Passionate', vibeAr: 'شغوف' },
  { id: 'frozen', labelEn: 'Glacier', labelAr: 'جليدي', vibeEn: 'Reserved', vibeAr: 'متحفّظ' },
  { id: 'stormy_surface', labelEn: 'Cyclones', labelAr: 'أعاصير', vibeEn: 'Intense', vibeAr: 'قوي الطاقة' },
  { id: 'forest', labelEn: 'Living world', labelAr: 'عالم حيّ', vibeEn: 'Nurturing', vibeAr: 'حنون' },
  { id: 'desert', labelEn: 'Dunes', labelAr: 'كثبان', vibeEn: 'Independent', vibeAr: 'مستقل' },
  { id: 'neon', labelEn: 'Neon grid', labelAr: 'شبكة نيون', vibeEn: 'Futuristic', vibeAr: 'مستقبلي' },
  { id: 'marble', labelEn: 'Marble', labelAr: 'رخامي', vibeEn: 'Elegant', vibeAr: 'أنيق' },
  { id: 'mosaic', labelEn: 'Stained glass', labelAr: 'زجاج معشّق', vibeEn: 'Creative', vibeAr: 'مبدع' },
  { id: 'cracked', labelEn: 'Shattered', labelAr: 'متشظٍّ', vibeEn: 'Rebuilding', vibeAr: 'يعيد بناء نفسه' },
  { id: 'luminous', labelEn: 'Little sun', labelAr: 'شمس صغيرة', vibeEn: 'Radiant', vibeAr: 'مشرق' },
  { id: 'shadowy', labelEn: 'Shadow', labelAr: 'ظلّي', vibeEn: 'Mysterious', vibeAr: 'غامض' },
  { id: 'striped', labelEn: 'Candy spiral', labelAr: 'حلزون حلوى', vibeEn: 'Structured', vibeAr: 'منظّم' },
  { id: 'spotted', labelEn: 'Spotted', labelAr: 'منقّط', vibeEn: 'Playful', vibeAr: 'مرح' },
  { id: 'aurora', labelEn: 'Aurora', labelAr: 'شفق', vibeEn: 'Sensitive', vibeAr: 'حسّاس' },
  { id: 'metallic', labelEn: 'Chrome', labelAr: 'كروم', vibeEn: 'Ambitious', vibeAr: 'طموح' },
  { id: 'cloudy', labelEn: 'Cloud veil', labelAr: 'غطاء سحابي', vibeEn: 'Thoughtful', vibeAr: 'متأمّل' },
  { id: 'lava_veins', labelEn: 'Molten', labelAr: 'منصهر', vibeEn: 'Bold', vibeAr: 'جريء' },
  { id: 'pearl', labelEn: 'Pearl', labelAr: 'لؤلؤي', vibeEn: 'Soft soul', vibeAr: 'روح ناعمة' },
  { id: 'geometric', labelEn: 'Low-poly', labelAr: 'مضلّع', vibeEn: 'Logical', vibeAr: 'منطقي' },
  { id: 'misty', labelEn: 'Misty', labelAr: 'ضبابي', vibeEn: 'Quiet mind', vibeAr: 'هدوء داخلي' },
  { id: 'coral', labelEn: 'Coral reef', labelAr: 'شعاب مرجانية', vibeEn: 'Warm', vibeAr: 'دافئ' },
  { id: 'eclipse', labelEn: 'Eclipse', labelAr: 'كسوف', vibeEn: 'Focused', vibeAr: 'تركيز عميق' },
  { id: 'prism', labelEn: 'Prism', labelAr: 'موشور', vibeEn: 'Many sides', vibeAr: 'متعدّد الجوانب' },
  { id: 'cosmic', labelEn: 'Cosmic window', labelAr: 'نافذة كونية', vibeEn: 'Big thinker', vibeAr: 'تفكير واسع' },
  { id: 'hologram', labelEn: 'Hologram', labelAr: 'هولوغرام', vibeEn: 'Ahead of time', vibeAr: 'سابق لوقته' },
  { id: 'toxic', labelEn: 'Acid swamp', labelAr: 'مستنقع حمضي', vibeEn: 'Untamed', vibeAr: 'جامح' },
  { id: 'twilight', labelEn: 'Twilight', labelAr: 'شفق دائم', vibeEn: 'Balanced', vibeAr: 'متوازن' },
];

export function isPlanetSurfaceId(value: string): value is PlanetSurfaceId {
  return (PLANET_SURFACE_IDS as readonly string[]).includes(value);
}

export function normalizePlanetSurface(value: string | null | undefined): PlanetSurfaceId {
  if (value && isPlanetSurfaceId(value)) return value;
  return 'smooth';
}
