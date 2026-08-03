import { unstable_noStore as noStore } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { SITE_CONFIG_KEYS } from './keys';
import {
  DEFAULT_HOMEPAGE_CONTENT,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_VISUAL_PRESETS_CONFIG,
  normalizeHomepageContent,
  normalizeSiteSettings,
  normalizeVisualPresets,
} from './defaults';
import type {
  HomepageContentConfig,
  SiteSettingsConfig,
  VisualPresetsConfig,
} from './types';

async function fetchConfigValue(
  supabase: SupabaseClient<Database>,
  key: string
): Promise<unknown | null> {
  const { data, error } = await supabase
    .from('site_config')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error) {
    console.error(`[site_config] read "${key}" failed:`, error.message);
    return null;
  }

  if (data == null || data.value == null) return null;

  let value: unknown = data.value;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      console.error(`[site_config] "${key}" value is a non-JSON string`);
      return null;
    }
  }

  return value;
}

export async function loadVisualPresetsServer(): Promise<VisualPresetsConfig> {
  try {
    const supabase = await createServerClient();
    const value = await fetchConfigValue(supabase, SITE_CONFIG_KEYS.visualPresets);
    return normalizeVisualPresets(value);
  } catch {
    return DEFAULT_VISUAL_PRESETS_CONFIG;
  }
}

export async function loadVisualPresetsClient(): Promise<VisualPresetsConfig> {
  try {
    const supabase = createBrowserClient();
    const value = await fetchConfigValue(supabase, SITE_CONFIG_KEYS.visualPresets);
    return normalizeVisualPresets(value);
  } catch {
    return DEFAULT_VISUAL_PRESETS_CONFIG;
  }
}

export async function loadVisualPresetsAdmin(): Promise<VisualPresetsConfig> {
  const admin = createServiceRoleClient();
  const value = await fetchConfigValue(admin, SITE_CONFIG_KEYS.visualPresets);
  return normalizeVisualPresets(value);
}

export async function loadHomepageContentServer(): Promise<HomepageContentConfig> {
  try {
    const supabase = await createServerClient();
    const value = await fetchConfigValue(supabase, SITE_CONFIG_KEYS.homepageContent);
    return normalizeHomepageContent(value);
  } catch {
    return DEFAULT_HOMEPAGE_CONTENT;
  }
}

export async function loadHomepageContentAdmin(): Promise<HomepageContentConfig> {
  const admin = createServiceRoleClient();
  const value = await fetchConfigValue(admin, SITE_CONFIG_KEYS.homepageContent);
  return normalizeHomepageContent(value);
}

export async function loadSiteSettingsServer(): Promise<SiteSettingsConfig> {
  noStore();

  // Prefer service role so public pages always see admin-saved settings
  // even if anon RLS/policies are misconfigured.
  try {
    const admin = createServiceRoleClient();
    const value = await fetchConfigValue(admin, SITE_CONFIG_KEYS.siteSettings);
    if (value != null) return normalizeSiteSettings(value);
  } catch (error) {
    console.error('[site-config] service-role settings read failed:', error);
  }

  try {
    const supabase = await createServerClient();
    const value = await fetchConfigValue(supabase, SITE_CONFIG_KEYS.siteSettings);
    return normalizeSiteSettings(value);
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

export async function loadSiteSettingsAdmin(): Promise<SiteSettingsConfig> {
  const admin = createServiceRoleClient();
  const value = await fetchConfigValue(admin, SITE_CONFIG_KEYS.siteSettings);
  return normalizeSiteSettings(value);
}
