'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';
import type { AdminStats } from '@/lib/admin/dashboard-data';
import {
  DEFAULT_VISUAL_PRESETS,
  STAR_VISUAL_OPTIONS,
  PLANET_SURFACE_OPTIONS,
} from '@/lib/universe/visual-styles';

export type { AdminStats };

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
  const user = await requireAdmin();
  const { loadAdminDashboard } = await import('@/lib/admin/dashboard-data');
  const { stats } = await loadAdminDashboard(user.email);
  return stats;
}

export async function getVisualPresets() {
  const user = await requireAdmin();
  const { loadAdminDashboard } = await import('@/lib/admin/dashboard-data');
  const { presets } = await loadAdminDashboard(user.email);
  return { ...DEFAULT_VISUAL_PRESETS, ...presets };
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
