import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { Language } from '@/types/database';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
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
  HomepageLangContent,
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

  if (error || !data?.value) return null;
  return data.value;
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

export function getHomepageStrings(
  content: HomepageContentConfig,
  lang: Language
): HomepageLangContent & { examples: string[]; siteName: string; demoDomain: string } {
  const langContent = lang === 'ar' ? content.ar : content.en;
  return {
    ...langContent,
    examples: lang === 'ar' ? content.examples.ar : content.examples.en,
    siteName: content.siteName,
    demoDomain: content.demoDomain,
  };
}
