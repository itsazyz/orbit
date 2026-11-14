import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { EditorState } from '@/lib/profile/client';
import { legacyStarColumns } from '@/lib/universe/orbit-layout';
import { normalizePlanetSurface } from '@/lib/universe/planet-surfaces';

export type SaveResult = { ok: true; username: string } | { ok: false; error: string; code?: string };

/**
 * Persist the editor state. Stars are upserted by id (so resonance counts
 * and ids survive edits) and removed stars are deleted first, which keeps
 * the 20-star cap happy.
 */
export async function savePlanet(
  supabase: SupabaseClient<Database>,
  userId: string,
  state: EditorState,
  options: { publish: boolean }
): Promise<SaveResult> {
  const username = state.username.trim().toLowerCase();

  const profilePatch: Database['public']['Tables']['profiles']['Update'] = {
    username,
    display_name: state.displayName.trim(),
    bio: state.bio.trim() || null,
    planet_color: state.planetColor,
    planet_surface_style: normalizePlanetSurface(state.planetSurface),
    planet_atmosphere: state.atmosphere,
    planet_glow: Math.min(5, Math.max(0, Math.round(state.glow))),
    planet_has_ring: state.hasRing,
    universe_mood: state.mood,
    space_background: state.spaceBackground,
    music_enabled: state.musicEnabled && !!state.musicUrl.trim(),
    music_url: state.musicUrl.trim() || null,
    links: state.links,
    ...(options.publish ? { is_published: true, visibility: 'public' as const } : {}),
  };

  const { error: profileError } = await supabase.from('profiles').update(profilePatch).eq('id', userId);
  if (profileError) {
    return { ok: false, error: profileError.message, code: profileError.code };
  }

  const keepIds = state.stars.map((s) => s.id);
  let removeQuery = supabase.from('stars').delete().eq('profile_id', userId);
  if (keepIds.length) removeQuery = removeQuery.not('id', 'in', `(${keepIds.join(',')})`);
  const { error: deleteError } = await removeQuery;
  if (deleteError) return { ok: false, error: deleteError.message, code: deleteError.code };

  if (state.stars.length) {
    const rows = state.stars.map((star, index) => ({
      id: star.id,
      profile_id: userId,
      title: star.title.trim(),
      content: star.content.trim() || null,
      icon: star.icon || '✦',
      visual_type: star.visualType || 'sparkle',
      category: star.category,
      link_url: star.linkUrl.trim() || null,
      sort_order: index,
      orbit_speed: 1,
      ...legacyStarColumns(index, state.stars.length),
    }));

    const { error: starsError } = await supabase.from('stars').upsert(rows, { onConflict: 'id' });
    if (starsError) return { ok: false, error: starsError.message, code: starsError.code };
  }

  return { ok: true, username };
}
