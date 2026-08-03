'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
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

type ActionResult = { ok: true } | { ok: false; error: string };

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
    const payload = {
      key,
      value,
      updated_at: new Date().toISOString(),
    };

    const { data: existing, error: readError } = await admin
      .from('site_config')
      .select('key')
      .eq('key', key)
      .maybeSingle();

    if (readError) {
      return { ok: false, error: `Read site_config failed: ${readError.message}` };
    }

    if (existing) {
      const { error } = await admin
        .from('site_config')
        .update({
          value: payload.value,
          updated_at: payload.updated_at,
        })
        .eq('key', key);

      if (error) {
        return { ok: false, error: `Update failed: ${error.message}` };
      }
    } else {
      const { error } = await admin.from('site_config').insert({
        key: payload.key,
        value: payload.value,
        updated_at: payload.updated_at,
      });

      if (error) {
        return { ok: false, error: `Insert failed: ${error.message}` };
      }
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

  const value = normalizeSiteSettings(settings) as unknown as Record<
    string,
    unknown
  >;
  const result = await upsertSiteConfig(SITE_CONFIG_KEYS.siteSettings, value);
  if (!result.ok) return result;

  // Avoid revalidatePath here — it can crash the admin RSC tree in production.
  // Homepage will pick up new settings on the next normal request.
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

export { DEFAULT_VISUAL_PRESETS_CONFIG, DEFAULT_HOMEPAGE_CONTENT, DEFAULT_SITE_SETTINGS };
