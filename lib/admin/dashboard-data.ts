import { createServiceRoleClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';
import {
  loadHomepageContentAdmin,
  loadSiteSettingsAdmin,
  loadVisualPresetsAdmin,
} from '@/lib/site-config/load';
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
}

export interface AdminDashboardPayload {
  stats: AdminStats;
  presets: VisualPresetsConfig;
  homepage: HomepageContentConfig;
  siteSettings: SiteSettingsConfig;
  users: AdminUserRow[];
  planets: AdminPlanetRow[];
}

function assertAdminEmail(userEmail: string | null | undefined) {
  if (!userEmail || !isAdminEmail(userEmail)) {
    throw new Error('Unauthorized');
  }
}

export async function loadAdminDashboard(
  userEmail: string | null | undefined
): Promise<AdminDashboardPayload> {
  assertAdminEmail(userEmail);
  const admin = createServiceRoleClient();

  const [
    usersRes,
    profilesRes,
    publishedRes,
    starsRes,
    presets,
    homepage,
    siteSettings,
    profilesListRes,
  ] = await Promise.all([
    admin.rpc('get_registered_user_count'),
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true),
    admin.from('stars').select('id', { count: 'exact', head: true }),
    loadVisualPresetsAdmin(),
    loadHomepageContentAdmin(),
    loadSiteSettingsAdmin(),
    admin
      .from('profiles')
      .select(
        'id, username, display_name, is_published, visibility, planet_color, music_enabled, created_at, updated_at'
      )
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  const authUsersRes = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const emailById = new Map(
    (authUsersRes.data.users ?? []).map((user) => [user.id, user.email ?? ''])
  );

  const profileRows = profilesListRes.data ?? [];
  const profileIds = profileRows.map((row) => row.id);

  const starCounts = new Map<string, number>();
  if (profileIds.length > 0) {
    const { data: starRows } = await admin
      .from('stars')
      .select('profile_id')
      .in('profile_id', profileIds);

    for (const row of starRows ?? []) {
      starCounts.set(row.profile_id, (starCounts.get(row.profile_id) ?? 0) + 1);
    }
  }

  const users: AdminUserRow[] = profileRows.map((profile) => ({
    id: profile.id,
    email: emailById.get(profile.id) ?? '—',
    username: profile.username,
    displayName: profile.display_name,
    isPublished: profile.is_published,
    visibility: profile.visibility,
    starCount: starCounts.get(profile.id) ?? 0,
    createdAt: profile.created_at,
  }));

  const planets: AdminPlanetRow[] = profileRows.map((profile) => ({
    id: profile.id,
    username: profile.username,
    displayName: profile.display_name,
    isPublished: profile.is_published,
    visibility: profile.visibility,
    planetColor: profile.planet_color,
    starCount: starCounts.get(profile.id) ?? 0,
    musicEnabled: profile.music_enabled,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  }));

  return {
    stats: {
      totalUsers: usersRes.error ? profilesRes.count ?? 0 : Number(usersRes.data ?? 0),
      totalProfiles: profilesRes.error ? 0 : profilesRes.count ?? 0,
      publishedProfiles: publishedRes.error ? 0 : publishedRes.count ?? 0,
      totalStars: starsRes.error ? 0 : starsRes.count ?? 0,
    },
    presets,
    homepage,
    siteSettings,
    users,
    planets,
  };
}
