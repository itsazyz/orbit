import type { PlanetDesign } from '@/lib/planet/design';
import type {
  PlanetAtmosphere,
  PlanetSurfaceStyle,
  SpaceBackground,
  UniverseMood,
} from '@/types/database';
import type { VisualPresetOption } from '@/lib/universe/visual-styles';

export interface VisualPresetsConfig {
  starTypes: VisualPresetOption[];
  planetSurfaces: VisualPresetOption[];
  planetMoods: VisualPresetOption[];
}

export interface HomepageLangContent {
  heroTitle?: string;
  heroSubtitle?: string;
  createPlanet?: string;
  seeHowItWorks?: string;
  section1Title?: string;
  section1Desc?: string;
  section2Title?: string;
  section2Desc?: string;
  section3Title?: string;
  section3Desc?: string;
  section4Title?: string;
  section4Desc?: string;
  footerTagline?: string;
  footerCta?: string;
  tagline?: string;
}

export interface HomepageHeroPlanet {
  color: string;
  surfaceStyle: PlanetSurfaceStyle;
  atmosphere: PlanetAtmosphere;
  glow: number;
  hasRing: boolean;
  mood: UniverseMood;
  spaceBackground: SpaceBackground;
  size: number;
  /** Extended look (rings, moons, second colour…) */
  design?: Partial<PlanetDesign>;
}

export interface HomepageContentConfig {
  siteName: string;
  demoDomain: string;
  en: HomepageLangContent;
  ar: HomepageLangContent;
  examples: { en: string[]; ar: string[] };
  heroPlanet: HomepageHeroPlanet;
}

export interface SiteSettingsConfig {
  maintenanceMode: boolean;
  maintenanceMessageEn: string;
  maintenanceMessageAr: string;
  allowSignups: boolean;
  showAnnouncement: boolean;
  announcementEn: string;
  announcementAr: string;
}

export interface AdminUserRow {
  id: string;
  email: string;
  username: string;
  displayName: string;
  isPublished: boolean;
  visibility: string;
  starCount: number;
  createdAt: string;
  lastSignInAt?: string | null;
  isBanned?: boolean;
}

export interface AdminPlanetRow {
  id: string;
  username: string;
  displayName: string;
  isPublished: boolean;
  visibility: string;
  planetColor: string;
  starCount: number;
  musicEnabled: boolean;
  isBanned?: boolean;
  views?: number;
  createdAt: string;
  updatedAt: string;
}
