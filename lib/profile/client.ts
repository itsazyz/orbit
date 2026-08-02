import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export interface UserPlanetSummary {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  planet_color: string;
  planet_surface_style: string;
  music_enabled: boolean;
  music_url: string | null;
  music_volume: number;
  is_published: boolean;
  starCount: number;
}

/** True when the user finished the creation flow at least once. */
export function hasPublishedPlanet(
  profile: Pick<UserPlanetSummary, 'is_published' | 'username'> | null | undefined
): boolean {
  if (!profile?.is_published) return false;
  // Placeholder usernames from signup trigger mean the flow was never completed.
  return !profile.username.startsWith('user-');
}

export async function fetchUserPlanetSummary(
  supabase: SupabaseClient<Database>
): Promise<UserPlanetSummary | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'id, username, display_name, bio, planet_color, planet_surface_style, music_enabled, music_url, music_volume, is_published'
    )
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) return null;

  const { count } = await supabase
    .from('stars')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', user.id);

  return {
    ...profile,
    starCount: count ?? 0,
  };
}

/** Where to send the user right after sign-in / sign-up. */
export async function getPostAuthPath(
  supabase: SupabaseClient<Database>
): Promise<string> {
  const summary = await fetchUserPlanetSummary(supabase);
  if (summary && hasPublishedPlanet(summary)) {
    return '/dashboard';
  }
  return '/create';
}

export interface LoadedPlanetEditorData {
  profile: {
    display_name: string;
    username: string;
    bio: string;
    planet_color: string;
    planet_surface_style: string;
    music_enabled: boolean;
    music_url: string;
    music_volume: number;
  };
  stars: Array<{
    id: string;
    title: string;
    content: string;
    icon: string;
    visualType: string;
  }>;
}

export async function loadPlanetForEditor(
  supabase: SupabaseClient<Database>
): Promise<LoadedPlanetEditorData | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'display_name, username, bio, planet_color, planet_surface_style, music_enabled, music_url, music_volume, is_published'
    )
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !hasPublishedPlanet(profile)) return null;

  const { data: starsData } = await supabase
    .from('stars')
    .select('id, title, content, icon, visual_type')
    .eq('profile_id', user.id)
    .order('sort_order', { ascending: true });

  return {
    profile: {
      display_name: profile.display_name,
      username: profile.username,
      bio: profile.bio ?? '',
      planet_color: profile.planet_color,
      planet_surface_style: profile.planet_surface_style,
      music_enabled: profile.music_enabled ?? false,
      music_url: profile.music_url ?? '',
      music_volume: profile.music_volume ?? 0.3,
    },
    stars: (starsData ?? []).map((star) => ({
      id: star.id,
      title: star.title,
      content: star.content ?? '',
      icon: star.icon,
      visualType: star.visual_type ?? 'sparkle',
    })),
  };
}
