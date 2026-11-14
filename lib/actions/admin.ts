'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { loadAdminDashboard, type AdminDashboardPayload } from '@/lib/admin/dashboard-data';
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
type DashboardResult = { ok: true; data: AdminDashboardPayload } | { ok: false; error: string };

/**
 * Every admin action runs as the signed-in user. Postgres decides whether
 * that user is an admin (public.is_admin() → private.admins), and RLS /
 * SECURITY DEFINER functions enforce it again on every write.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: 'Not signed in. Please sign in again.' };
  }

  const { data: isAdmin, error } = await supabase.rpc('is_admin');
  if (error) return { ok: false as const, error: error.message };
  if (!isAdmin) return { ok: false as const, error: 'Unauthorized: this account is not an admin.' };

  return { ok: true as const, supabase };
}

async function upsertSiteConfig(key: string, value: Record<string, unknown>): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate;

  const { error } = await gate.supabase
    .from('site_config')
    .upsert(
      { key, value: JSON.parse(JSON.stringify(value)), updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function saveVisualPresets(presets: VisualPresetsConfig): Promise<ActionResult> {
  const value = normalizeVisualPresets(presets) as unknown as Record<string, unknown>;
  const result = await upsertSiteConfig(SITE_CONFIG_KEYS.visualPresets, value);
  if (result.ok) revalidatePath('/create');
  return result;
}

export async function saveHomepageContent(content: HomepageContentConfig): Promise<ActionResult> {
  const value = normalizeHomepageContent(content) as unknown as Record<string, unknown>;
  const result = await upsertSiteConfig(SITE_CONFIG_KEYS.homepageContent, value);
  if (result.ok) revalidatePath('/');
  return result;
}

export async function saveSiteSettings(settings: SiteSettingsConfig): Promise<ActionResult> {
  const normalized = normalizeSiteSettings(settings);

  // Mirror non-empty text into the empty language so EN/AR both show something.
  let announcementEn = normalized.announcementEn.trim();
  let announcementAr = normalized.announcementAr.trim();
  if (announcementEn && !announcementAr) announcementAr = announcementEn;
  if (announcementAr && !announcementEn) announcementEn = announcementAr;

  const value = { ...normalized, announcementEn, announcementAr } as unknown as Record<string, unknown>;
  const result = await upsertSiteConfig(SITE_CONFIG_KEYS.siteSettings, value);
  if (result.ok) revalidatePath('/', 'layout');
  return result;
}

async function updateProfileAsAdmin(
  profileId: string,
  patch: { is_published?: boolean; visibility?: 'public' | 'private' }
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate;

  const { error } = await gate.supabase.from('profiles').update(patch).eq('id', profileId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/explore');
  return { ok: true };
}

export async function setPlanetPublished(profileId: string, isPublished: boolean) {
  return updateProfileAsAdmin(profileId, { is_published: isPublished });
}

export async function setPlanetVisibility(profileId: string, visibility: 'public' | 'private') {
  return updateProfileAsAdmin(profileId, { visibility });
}

export async function deleteUserPlanet(profileId: string): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate;

  const { error } = await gate.supabase.rpc('admin_reset_planet', { p_profile_id: profileId });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/explore');
  return { ok: true };
}

export async function deleteUserAccount(userId: string): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate;

  const { error } = await gate.supabase.rpc('admin_delete_user', { p_user_id: userId });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/explore');
  return { ok: true };
}

export async function checkIsAdmin(): Promise<boolean> {
  const gate = await requireAdmin();
  return gate.ok;
}

export async function getAdminDashboardAction(): Promise<DashboardResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate;

  try {
    const data = await loadAdminDashboard(gate.supabase);
    return { ok: true, data: JSON.parse(JSON.stringify(data)) as AdminDashboardPayload };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to load admin dashboard',
    };
  }
}

// ---------------------------------------------------------------------------
// Moderation
// ---------------------------------------------------------------------------

export interface AdminReport {
  id: string;
  reason: 'spam' | 'offensive' | 'impersonation' | 'other';
  details: string | null;
  status: string;
  createdAt: string;
  profileId: string;
  username: string;
  displayName: string;
  isBanned: boolean;
  messageId: string | null;
  messageAuthor: string | null;
  messageBody: string | null;
  messageStatus: string | null;
}

export async function getModerationAction(): Promise<
  { ok: true; reports: AdminReport[]; blockedWords: string[] } | { ok: false; error: string }
> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate;

  const [reportsRes, configRes] = await Promise.all([
    gate.supabase.rpc('admin_reports'),
    gate.supabase.from('site_config').select('value').eq('key', 'moderation').maybeSingle(),
  ]);
  if (reportsRes.error) return { ok: false, error: reportsRes.error.message };

  const words = (configRes.data?.value as { blockedWords?: unknown } | undefined)?.blockedWords;
  return {
    ok: true,
    reports: (reportsRes.data ?? []) as AdminReport[],
    blockedWords: Array.isArray(words) ? words.filter((w): w is string => typeof w === 'string') : [],
  };
}

export async function setReportStatus(reportId: string, status: 'resolved' | 'dismissed'): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate;
  const { error } = await gate.supabase.from('reports').update({ status }).eq('id', reportId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function hideMessageAsAdmin(messageId: string): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate;
  const { error } = await gate.supabase.from('planet_messages').update({ status: 'hidden' }).eq('id', messageId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function setUserBanned(profileId: string, banned: boolean): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate;
  const { error } = await gate.supabase.from('profiles').update({ is_banned: banned }).eq('id', profileId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/explore');
  return { ok: true };
}

export async function saveBlockedWords(words: string[]): Promise<ActionResult> {
  const clean = Array.from(
    new Set(words.map((w) => w.trim().toLowerCase()).filter((w) => w.length > 1 && w.length <= 60))
  ).slice(0, 2000);
  return upsertSiteConfig('moderation', { blockedWords: clean });
}
