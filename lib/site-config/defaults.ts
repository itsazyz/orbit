import en from '@/messages/en.json';
import ar from '@/messages/ar.json';
import { DEFAULT_VISUAL_PRESETS } from '@/lib/universe/visual-styles';
import type {
  HomepageContentConfig,
  SiteSettingsConfig,
  VisualPresetsConfig,
} from './types';

export const DEFAULT_HOMEPAGE_CONTENT: HomepageContentConfig = {
  siteName: 'ORBIT',
  demoDomain: 'yourdomain.com',
  en: {
    heroTitle: en.landing.heroTitle,
    heroSubtitle: en.landing.heroSubtitle,
    createPlanet: en.landing.createPlanet,
    seeHowItWorks: en.landing.seeHowItWorks,
    section1Title: en.landing.section1Title,
    section1Desc: en.landing.section1Desc,
    section2Title: en.landing.section2Title,
    section2Desc: en.landing.section2Desc,
    section3Title: en.landing.section3Title,
    section3Desc: en.landing.section3Desc,
    section4Title: en.landing.section4Title,
    section4Desc: en.landing.section4Desc,
    footerTagline: en.landing.footerTagline,
    footerCta: en.landing.footerCta,
    tagline: en.tagline,
  },
  ar: {
    heroTitle: ar.landing.heroTitle,
    heroSubtitle: ar.landing.heroSubtitle,
    createPlanet: ar.landing.createPlanet,
    seeHowItWorks: ar.landing.seeHowItWorks,
    section1Title: ar.landing.section1Title,
    section1Desc: ar.landing.section1Desc,
    section2Title: ar.landing.section2Title,
    section2Desc: ar.landing.section2Desc,
    section3Title: ar.landing.section3Title,
    section3Desc: ar.landing.section3Desc,
    section4Title: ar.landing.section4Title,
    section4Desc: ar.landing.section4Desc,
    footerTagline: ar.landing.footerTagline,
    footerCta: ar.landing.footerCta,
    tagline: ar.tagline,
  },
  examples: {
    en: [...en.landing.examples],
    ar: [...ar.landing.examples],
  },
  heroPlanet: {
    color: '#7c8cff',
    surfaceStyle: 'smooth',
    atmosphere: 'thin',
    glow: 4,
    hasRing: true,
    mood: 'calm',
    spaceBackground: 'deep_space',
    size: 160,
  },
};

export const DEFAULT_SITE_SETTINGS: SiteSettingsConfig = {
  maintenanceMode: false,
  maintenanceMessageEn: 'We are performing maintenance. Please check back soon.',
  maintenanceMessageAr: 'نجري صيانة على الموقع. عد لاحقاً.',
  allowSignups: true,
  showAnnouncement: false,
  announcementEn: '',
  announcementAr: '',
};

export const DEFAULT_VISUAL_PRESETS_CONFIG: VisualPresetsConfig = {
  starTypes: DEFAULT_VISUAL_PRESETS.starTypes,
  planetSurfaces: DEFAULT_VISUAL_PRESETS.planetSurfaces,
  planetMoods: DEFAULT_VISUAL_PRESETS.planetMoods,
};

function mergeRecords<T extends Record<string, unknown>>(
  base: T,
  patch: Partial<T> | undefined
): T {
  if (!patch) return base;
  return { ...base, ...patch };
}

export function normalizeVisualPresets(value: unknown): VisualPresetsConfig {
  if (!value || typeof value !== 'object') return DEFAULT_VISUAL_PRESETS_CONFIG;
  const record = value as Record<string, unknown>;
  return {
    starTypes: Array.isArray(record.starTypes)
      ? (record.starTypes as VisualPresetsConfig['starTypes'])
      : DEFAULT_VISUAL_PRESETS_CONFIG.starTypes,
    planetSurfaces: Array.isArray(record.planetSurfaces)
      ? (record.planetSurfaces as VisualPresetsConfig['planetSurfaces'])
      : DEFAULT_VISUAL_PRESETS_CONFIG.planetSurfaces,
    planetMoods: Array.isArray(record.planetMoods)
      ? (record.planetMoods as VisualPresetsConfig['planetMoods'])
      : DEFAULT_VISUAL_PRESETS_CONFIG.planetMoods,
  };
}

export function normalizeHomepageContent(value: unknown): HomepageContentConfig {
  if (!value || typeof value !== 'object') return DEFAULT_HOMEPAGE_CONTENT;
  const record = value as Partial<HomepageContentConfig>;
  return {
    siteName: record.siteName ?? DEFAULT_HOMEPAGE_CONTENT.siteName,
    demoDomain: record.demoDomain ?? DEFAULT_HOMEPAGE_CONTENT.demoDomain,
    en: mergeRecords(DEFAULT_HOMEPAGE_CONTENT.en, record.en),
    ar: mergeRecords(DEFAULT_HOMEPAGE_CONTENT.ar, record.ar),
    examples: {
      en: record.examples?.en?.length
        ? record.examples.en
        : DEFAULT_HOMEPAGE_CONTENT.examples.en,
      ar: record.examples?.ar?.length
        ? record.examples.ar
        : DEFAULT_HOMEPAGE_CONTENT.examples.ar,
    },
    heroPlanet: mergeRecords(DEFAULT_HOMEPAGE_CONTENT.heroPlanet, record.heroPlanet),
  };
}

export function normalizeSiteSettings(value: unknown): SiteSettingsConfig {
  if (!value || typeof value !== 'object') return DEFAULT_SITE_SETTINGS;
  const record = value as Record<string, unknown>;

  return {
    maintenanceMode: Boolean(
      record.maintenanceMode ?? DEFAULT_SITE_SETTINGS.maintenanceMode
    ),
    maintenanceMessageEn: String(
      record.maintenanceMessageEn ?? DEFAULT_SITE_SETTINGS.maintenanceMessageEn
    ),
    maintenanceMessageAr: String(
      record.maintenanceMessageAr ?? DEFAULT_SITE_SETTINGS.maintenanceMessageAr
    ),
    allowSignups: Boolean(record.allowSignups ?? DEFAULT_SITE_SETTINGS.allowSignups),
    showAnnouncement: Boolean(
      record.showAnnouncement ?? DEFAULT_SITE_SETTINGS.showAnnouncement
    ),
    announcementEn: String(record.announcementEn ?? ''),
    announcementAr: String(record.announcementAr ?? ''),
  };
}
