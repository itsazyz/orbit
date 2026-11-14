import { unstable_noStore as noStore } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
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

export async function loadHomepageContentServer(): Promise<HomepageContentConfig> {
  try {
    const supabase = await createServerClient();
    const value = await fetchConfigValue(supabase, SITE_CONFIG_KEYS.homepageContent);
    return normalizeHomepageContent(value);
  } catch {
    return DEFAULT_HOMEPAGE_CONTENT;
  }
}

export async function loadSiteSettingsServer(): Promise<SiteSettingsConfig> {
  noStore();
  try {
    const supabase = await createServerClient();
    const value = await fetchConfigValue(supabase, SITE_CONFIG_KEYS.siteSettings);
    return normalizeSiteSettings(value);
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

/** All three CMS keys in one query (admin panel). */
export async function loadAllSiteConfig(supabase: SupabaseClient<Database>): Promise<{
  presets: VisualPresetsConfig;
  homepage: HomepageContentConfig;
  siteSettings: SiteSettingsConfig;
}> {
  const { data, error } = await supabase.from('site_config').select('key, value');
  if (error) {
    console.error('[site_config] bulk read failed:', error.message);
  }
  const byKey = new Map((data ?? []).map((row) => [row.key, row.value as unknown]));
  return {
    presets: normalizeVisualPresets(byKey.get(SITE_CONFIG_KEYS.visualPresets) ?? null),
    homepage: normalizeHomepageContent(byKey.get(SITE_CONFIG_KEYS.homepageContent) ?? null),
    siteSettings: normalizeSiteSettings(byKey.get(SITE_CONFIG_KEYS.siteSettings) ?? null),
  };
}
