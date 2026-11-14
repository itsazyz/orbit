import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { loadAllSiteConfig } from '@/lib/site-config/load';
import type {
  AdminPlanetRow,
  AdminUserRow,
  HomepageContentConfig,
  SiteSettingsConfig,
  VisualPresetsConfig,
} from '@/lib/site-config/types';

export interface AdminStats {
  totalUsers: number;
  totalProfiles: number;
  publishedProfiles: number;
  totalStars: number;
  totalViews: number;
  viewsToday: number;
  signups7d: number;
  totalResonance: number;
  openReports: number;
  bannedUsers: number;
  totalMessages: number;
}

export interface AdminDashboardPayload {
  stats: AdminStats;
  presets: VisualPresetsConfig;
  homepage: HomepageContentConfig;
  siteSettings: SiteSettingsConfig;
  users: AdminUserRow[];
  planets: AdminPlanetRow[];
}

interface OverviewPayload {
  stats?: Partial<AdminStats>;
  users?: AdminUserRow[];
  planets?: AdminPlanetRow[];
}

const num = (value: unknown) => (typeof value === 'number' ? value : Number(value ?? 0) || 0);

/**
 * Loads the control panel in two round trips: one SECURITY DEFINER RPC
 * (admin_overview, which re-checks is_admin() inside Postgres) plus the CMS
 * rows. Runs as the signed-in admin — no service-role key involved.
 */
export async function loadAdminDashboard(
  supabase: SupabaseClient<Database>
): Promise<AdminDashboardPayload> {
  const [overviewRes, config] = await Promise.all([
    supabase.rpc('admin_overview'),
    loadAllSiteConfig(supabase),
  ]);

  if (overviewRes.error) {
    throw new Error(overviewRes.error.message);
  }

  const overview = (overviewRes.data ?? {}) as OverviewPayload;
  const stats = overview.stats ?? {};

  return {
    stats: {
      totalUsers: num(stats.totalUsers),
      totalProfiles: num(stats.totalProfiles),
      publishedProfiles: num(stats.publishedProfiles),
      totalStars: num(stats.totalStars),
      totalViews: num(stats.totalViews),
      viewsToday: num(stats.viewsToday),
      signups7d: num(stats.signups7d),
      totalResonance: num(stats.totalResonance),
      openReports: num(stats.openReports),
      bannedUsers: num(stats.bannedUsers),
      totalMessages: num(stats.totalMessages),
    },
    ...config,
    users: (overview.users ?? []).map((u) => ({ ...u, email: u.email ?? '—' })),
    planets: overview.planets ?? [],
  };
}
