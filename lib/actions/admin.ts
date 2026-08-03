'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/admin';
import { loadAdminDashboard } from '@/lib/admin/dashboard-data';
import type { AdminDashboardPayload } from '@/lib/admin/dashboard-data';
import { SITE_CONFIG_KEYS } from '@/lib/site-config/keys';
import {
  normalizeHomepageContent,
  normalizeSiteSettings,
  normalizeVisualPresets,
} from '@/lib/site-config/defaults';
import type {
  HomepageContentConfig,
  SiteSettingsConfig,
  VisualPresetsConfig,
} from '@/lib/site-config/types';

type ActionResult = { ok: true } | { ok: false; error: string };
type DashboardResult =
  | { ok: true; data: AdminDashboardPayload }
  | { ok: false; error: string };

async function requireAdmin(): Promise<
  { ok: true; email: string } | { ok: false; error: string }
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return { ok: false, error: `Auth error: ${error.message}` };
    }

    if (!user?.email) {
      return { ok: false, error: 'Not signed in. Please sign in again.' };
    }

    if (!isAdminEmail(user.email)) {
      return { ok: false, error: 'Unauthorized: this account is not the admin.' };
    }

    return { ok: true, email: user.email };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Auth check failed',
    };
  }
}

async function upsertSiteConfig(
  key: string,
  value: Record<string, unknown>
): Promise<ActionResult> {
  try {
    const admin = createServiceRoleClient();
    // Ensure a plain JSON object (no class instances / prototypes)
    const plainValue = JSON.parse(JSON.stringify(value)) as Record<string, unknown>;

    const { data, error } = await admin
      .from('site_config')
      .upsert(
        {
          key,
          value: plainValue,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )
      .select('key, value')
      .single();

    if (error) {
      return { ok: false, error: `Upsert failed: ${error.message}` };
    }

    if (!data?.key) {
      return { ok: false, error: 'Upsert returned no row — check site_config table.' };
    }

    // Verify round-trip read
    const { data: verify, error: verifyError } = await admin
      .from('site_config')
      .select('value')
      .eq('key', key)
      .single();

    if (verifyError) {
      return {
        ok: false,
        error: `Saved but could not re-read: ${verifyError.message}`,
      };
    }

    if (verify?.value == null) {
      return { ok: false, error: 'Saved but value is empty on re-read.' };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Database write failed',
    };
  }
}

export async function saveVisualPresets(
  presets: VisualPresetsConfig
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate;

  const value = normalizeVisualPresets(presets) as unknown as Record<string, unknown>;
  const result = await upsertSiteConfig(SITE_CONFIG_KEYS.visualPresets, value);
  if (!result.ok) return result;

  revalidatePath('/create');
  return { ok: true };
}

export async function saveHomepageContent(
  content: HomepageContentConfig
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate;

  const value = normalizeHomepageContent(content) as unknown as Record<
    string,
    unknown
  >;
  const result = await upsertSiteConfig(SITE_CONFIG_KEYS.homepageContent, value);
  if (!result.ok) return result;

  revalidatePath('/');
  return { ok: true };
}

export async function saveSiteSettings(
  settings: SiteSettingsConfig
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate;

  const normalized = normalizeSiteSettings(settings);
  const hasAnnouncementText =
    normalized.announcementEn.trim().length > 0 ||
    normalized.announcementAr.trim().length > 0;

  // Mirror non-empty text into the empty language so EN/AR both show something
  let announcementEn = normalized.announcementEn.trim();
  let announcementAr = normalized.announcementAr.trim();
  if (announcementEn && !announcementAr) announcementAr = announcementEn;
  if (announcementAr && !announcementEn) announcementEn = announcementAr;

  const value = {
    ...normalized,
    announcementEn,
    announcementAr,
    showAnnouncement: normalized.showAnnouncement || hasAnnouncementText,
  } as unknown as Record<string, unknown>;

  const result = await upsertSiteConfig(SITE_CONFIG_KEYS.siteSettings, value);
  if (!result.ok) return result;

  // Safe now: admin UI loads client-side and won't remount from this
  revalidatePath('/', 'layout');
  revalidatePath('/');
  return { ok: true };
}

export async function setPlanetPublished(
  profileId: string,
  isPublished: boolean
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate;

  try {
    const admin = createServiceRoleClient();
    const { error } = await admin
      .from('profiles')
      .update({ is_published: isPublished })
      .eq('id', profileId);

    if (error) return { ok: false, error: error.message };
    revalidatePath('/');
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Update failed',
    };
  }
}

export async function setPlanetVisibility(
  profileId: string,
  visibility: 'public' | 'private'
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate;

  try {
    const admin = createServiceRoleClient();
    const { error } = await admin
      .from('profiles')
      .update({ visibility })
      .eq('id', profileId);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Update failed',
    };
  }
}

export async function deleteUserPlanet(profileId: string): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate;

  try {
    const admin = createServiceRoleClient();

    const { error: starsError } = await admin
      .from('stars')
      .delete()
      .eq('profile_id', profileId);
    if (starsError) return { ok: false, error: starsError.message };

    const { error: profileError } = await admin
      .from('profiles')
      .update({
        is_published: false,
        visibility: 'private',
        bio: null,
      })
      .eq('id', profileId);

    if (profileError) return { ok: false, error: profileError.message };
    revalidatePath('/');
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Reset failed',
    };
  }
}

export async function checkIsAdmin(): Promise<boolean> {
  const gate = await requireAdmin();
  return gate.ok;
}

export async function getAdminDashboardAction(): Promise<DashboardResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate;

  try {
    const data = await loadAdminDashboard(gate.email);
    const safe = JSON.parse(JSON.stringify(data)) as AdminDashboardPayload;
    return { ok: true, data: safe };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to load admin dashboard',
    };
  }
}
