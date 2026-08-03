'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';
import { SITE_CONFIG_KEYS } from '@/lib/site-config/keys';
import {
  DEFAULT_HOMEPAGE_CONTENT,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_VISUAL_PRESETS_CONFIG,
  normalizeHomepageContent,
  normalizeSiteSettings,
  normalizeVisualPresets,
} from '@/lib/site-config/defaults';
import type {
  HomepageContentConfig,
  SiteSettingsConfig,
  VisualPresetsConfig,
} from '@/lib/site-config/types';
import type { AdminStats } from '@/lib/admin/dashboard-data';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    throw new Error('Unauthorized');
  }

  return user;
}

function revalidateSite() {
  revalidatePath('/orbit-control');
  revalidatePath('/create');
  revalidatePath('/');
}

export async function getAdminStats(): Promise<AdminStats> {
  const user = await requireAdmin();
  const { loadAdminDashboard } = await import('@/lib/admin/dashboard-data');
  const { stats } = await loadAdminDashboard(user.email);
  return stats;
}

export async function saveVisualPresets(presets: VisualPresetsConfig) {
  await requireAdmin();
  const admin = createServiceRoleClient();
  const value = normalizeVisualPresets(presets);

  const { error } = await admin.from('site_config').upsert(
    {
      key: SITE_CONFIG_KEYS.visualPresets,
      value: value as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );

  if (error) throw new Error(`Visual presets save failed: ${error.message}`);
  revalidateSite();
  return { ok: true as const };
}

export async function saveHomepageContent(content: HomepageContentConfig) {
  await requireAdmin();
  const admin = createServiceRoleClient();
  const value = normalizeHomepageContent(content);

  const { error } = await admin.from('site_config').upsert(
    {
      key: SITE_CONFIG_KEYS.homepageContent,
      value: value as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );

  if (error) throw new Error(`Homepage save failed: ${error.message}`);
  revalidateSite();
  return { ok: true as const };
}

export async function saveSiteSettings(settings: SiteSettingsConfig) {
  await requireAdmin();
  const admin = createServiceRoleClient();
  const value = normalizeSiteSettings(settings);

  const { error } = await admin.from('site_config').upsert(
    {
      key: SITE_CONFIG_KEYS.siteSettings,
      value: value as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );

  if (error) {
    throw new Error(`Site settings save failed: ${error.message}`);
  }

  revalidateSite();
  return { ok: true as const };
}

export async function setPlanetPublished(profileId: string, isPublished: boolean) {
  await requireAdmin();
  const admin = createServiceRoleClient();

  const { error } = await admin
    .from('profiles')
    .update({ is_published: isPublished })
    .eq('id', profileId);

  if (error) throw new Error(error.message);
  revalidatePath('/orbit-control');
  revalidatePath('/');
  return { ok: true };
}

export async function setPlanetVisibility(
  profileId: string,
  visibility: 'public' | 'private'
) {
  await requireAdmin();
  const admin = createServiceRoleClient();

  const { error } = await admin
    .from('profiles')
    .update({ visibility })
    .eq('id', profileId);

  if (error) throw new Error(error.message);
  revalidatePath('/orbit-control');
  return { ok: true };
}

export async function deleteUserPlanet(profileId: string) {
  await requireAdmin();
  const admin = createServiceRoleClient();

  const { error: starsError } = await admin.from('stars').delete().eq('profile_id', profileId);
  if (starsError) throw new Error(starsError.message);

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      is_published: false,
      visibility: 'private',
      bio: null,
    })
    .eq('id', profileId);

  if (profileError) throw new Error(profileError.message);
  revalidatePath('/orbit-control');
  return { ok: true };
}

export async function checkIsAdmin(): Promise<boolean> {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}

export { DEFAULT_VISUAL_PRESETS_CONFIG, DEFAULT_HOMEPAGE_CONTENT, DEFAULT_SITE_SETTINGS };
