import { createServiceRoleClient } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/admin';
import {
  loadHomepageContentAdmin,
  loadSiteSettingsAdmin,
  loadVisualPresetsAdmin,
} from '@/lib/site-config/load';
import {
  DEFAULT_HOMEPAGE_CONTENT,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_VISUAL_PRESETS_CONFIG,
} from '@/lib/site-config/defaults';
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

function toPlainString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (value == null) return fallback;
  return String(value);
}

export async function loadAdminDashboard(
  userEmail: string | null | undefined
): Promise<AdminDashboardPayload> {
  assertAdminEmail(userEmail);

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to create admin database client.'
    );
  }

  let presets: VisualPresetsConfig = DEFAULT_VISUAL_PRESETS_CONFIG;
  let homepage: HomepageContentConfig = DEFAULT_HOMEPAGE_CONTENT;
  let siteSettings: SiteSettingsConfig = DEFAULT_SITE_SETTINGS;

  try {
    presets = await loadVisualPresetsAdmin();
  } catch (error) {
    console.error('[admin] presets load failed:', error);
  }

  try {
    homepage = await loadHomepageContentAdmin();
  } catch (error) {
    console.error('[admin] homepage load failed:', error);
  }

  try {
    siteSettings = await loadSiteSettingsAdmin();
  } catch (error) {
    console.error('[admin] settings load failed:', error);
  }

  const [
    usersRes,
    profilesRes,
    publishedRes,
    starsRes,
    profilesListRes,
  ] = await Promise.all([
    admin.rpc('get_registered_user_count').then(
      (result) => result,
      (error) => {
        console.error('[admin] user count rpc failed:', error);
        return { data: null, error };
      }
    ),
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true),
    admin.from('stars').select('id', { count: 'exact', head: true }),
    admin
      .from('profiles')
      .select(
        'id, username, display_name, is_published, visibility, planet_color, music_enabled, created_at, updated_at'
      )
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  if (profilesListRes.error) {
    console.error('[admin] profiles list failed:', profilesListRes.error.message);
  }

  let emailById = new Map<string, string>();
  try {
    const authUsersRes = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (authUsersRes.error) {
      console.error('[admin] listUsers failed:', authUsersRes.error.message);
    } else {
      emailById = new Map(
        (authUsersRes.data.users ?? []).map((user) => [
          user.id,
          toPlainString(user.email, '—'),
        ])
      );
    }
  } catch (error) {
    console.error('[admin] listUsers threw:', error);
  }

  const profileRows = profilesListRes.data ?? [];
  const profileIds = profileRows.map((row) => row.id);

  const starCounts = new Map<string, number>();
  if (profileIds.length > 0) {
    const { data: starRows, error: starError } = await admin
      .from('stars')
      .select('profile_id')
      .in('profile_id', profileIds);

    if (starError) {
      console.error('[admin] star counts failed:', starError.message);
    } else {
      for (const row of starRows ?? []) {
        starCounts.set(row.profile_id, (starCounts.get(row.profile_id) ?? 0) + 1);
      }
    }
  }

  const users: AdminUserRow[] = profileRows.map((profile) => ({
    id: toPlainString(profile.id),
    email: emailById.get(profile.id) ?? '—',
    username: toPlainString(profile.username),
    displayName: toPlainString(profile.display_name),
    isPublished: Boolean(profile.is_published),
    visibility: profile.visibility === 'private' ? 'private' : 'public',
    starCount: starCounts.get(profile.id) ?? 0,
    createdAt: toPlainString(profile.created_at),
  }));

  const planets: AdminPlanetRow[] = profileRows.map((profile) => ({
    id: toPlainString(profile.id),
    username: toPlainString(profile.username),
    displayName: toPlainString(profile.display_name),
    isPublished: Boolean(profile.is_published),
    visibility: profile.visibility === 'private' ? 'private' : 'public',
    planetColor: toPlainString(profile.planet_color, '#7c8cff'),
    starCount: starCounts.get(profile.id) ?? 0,
    musicEnabled: Boolean(profile.music_enabled),
    createdAt: toPlainString(profile.created_at),
    updatedAt: toPlainString(profile.updated_at),
  }));

  // Fully JSON-serializable payload for the client AdminPanel
  return {
    stats: {
      totalUsers: usersRes.error
        ? profilesRes.count ?? 0
        : Number(usersRes.data ?? 0),
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
