'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
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

export async function getAdminStats(): Promise<AdminStats> {
  await requireAdmin();

  const admin = createServiceRoleClient();

  const [usersRes, profilesRes, publishedRes, starsRes] = await Promise.all([
    admin.rpc('get_registered_user_count'),
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true),
    admin.from('stars').select('id', { count: 'exact', head: true }),
  ]);

  return {
    totalUsers: Number(usersRes.data ?? 0),
    totalProfiles: profilesRes.count ?? 0,
    publishedProfiles: publishedRes.count ?? 0,
    totalStars: starsRes.count ?? 0,
  };
}

export async function getVisualPresets() {
  await requireAdmin();

  const admin = createServiceRoleClient();
  const { data } = await admin
    .from('site_config')
    .select('value')
    .eq('key', 'visual_presets')
    .maybeSingle();

  if (data?.value && typeof data.value === 'object') {
    return data.value as typeof DEFAULT_VISUAL_PRESETS;
  }

  return DEFAULT_VISUAL_PRESETS;
}

export async function saveVisualPresets(presets: {
  starTypes: Array<{ id: string; labelEn: string; labelAr: string }>;
  planetSurfaces: Array<{ id: string; labelEn: string; labelAr: string }>;
}) {
  await requireAdmin();

  const admin = createServiceRoleClient();
  const value = {
    starTypes: presets.starTypes.length ? presets.starTypes : STAR_VISUAL_OPTIONS,
    planetSurfaces: presets.planetSurfaces.length
      ? presets.planetSurfaces
      : PLANET_SURFACE_OPTIONS,
    planetMoods: DEFAULT_VISUAL_PRESETS.planetMoods,
  };

  const { error } = await admin.from('site_config').upsert({
    key: 'visual_presets',
    value,
  });

  if (error) throw new Error(error.message);

  revalidatePath('/orbit-control');
  revalidatePath('/create');
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
