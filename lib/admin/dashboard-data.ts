import { createServiceRoleClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';
import {
  DEFAULT_VISUAL_PRESETS,
  STAR_VISUAL_OPTIONS,
  PLANET_SURFACE_OPTIONS,
} from '@/lib/universe/visual-styles';

export interface AdminStats {
  totalUsers: number;
  totalProfiles: number;
  publishedProfiles: number;
  totalStars: number;
}

export interface AdminDashboardData {
  stats: AdminStats;
  presets: {
    starTypes: typeof STAR_VISUAL_OPTIONS;
    planetSurfaces: typeof PLANET_SURFACE_OPTIONS;
  };
}

function normalizePresets(value: unknown): AdminDashboardData['presets'] {
  if (!value || typeof value !== 'object') {
    return {
      starTypes: DEFAULT_VISUAL_PRESETS.starTypes,
      planetSurfaces: DEFAULT_VISUAL_PRESETS.planetSurfaces,
    };
  }

  const record = value as Record<string, unknown>;
  const starTypes = Array.isArray(record.starTypes)
    ? (record.starTypes as AdminDashboardData['presets']['starTypes'])
    : DEFAULT_VISUAL_PRESETS.starTypes;
  const planetSurfaces = Array.isArray(record.planetSurfaces)
    ? (record.planetSurfaces as AdminDashboardData['presets']['planetSurfaces'])
    : DEFAULT_VISUAL_PRESETS.planetSurfaces;

  return { starTypes, planetSurfaces };
}

/**
 * Loads admin dashboard data on the server (not a Server Action).
 * Safe fallbacks when RPC/tables are missing.
 */
export async function loadAdminDashboard(
  userEmail: string | null | undefined
): Promise<AdminDashboardData> {
  if (!userEmail || !isAdminEmail(userEmail)) {
    throw new Error('Unauthorized');
  }

  const admin = createServiceRoleClient();

  const [usersRes, profilesRes, publishedRes, starsRes, presetsRes] =
    await Promise.all([
      admin.rpc('get_registered_user_count'),
      admin.from('profiles').select('id', { count: 'exact', head: true }),
      admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true),
      admin.from('stars').select('id', { count: 'exact', head: true }),
      admin
        .from('site_config')
        .select('value')
        .eq('key', 'visual_presets')
        .maybeSingle(),
    ]);

  const stats: AdminStats = {
    totalUsers: usersRes.error ? profilesRes.count ?? 0 : Number(usersRes.data ?? 0),
    totalProfiles: profilesRes.error ? 0 : profilesRes.count ?? 0,
    publishedProfiles: publishedRes.error ? 0 : publishedRes.count ?? 0,
    totalStars: starsRes.error ? 0 : starsRes.count ?? 0,
  };

  const presets = presetsRes.error
    ? normalizePresets(null)
    : normalizePresets(presetsRes.data?.value);

  return { stats, presets };
}
