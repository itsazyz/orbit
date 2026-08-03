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
  return !profile.username.startsWith('user-');
}

/** Minimal profile read — safe even when optional columns are missing in DB. */
async function fetchProfileRouting(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ username: string; is_published: boolean } | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, is_published')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[profile] routing query failed:', error.message);
    return null;
  }

  return data;
}

export async function fetchUserPlanetSummary(
  supabase: SupabaseClient<Database>
): Promise<UserPlanetSummary | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(
      'id, username, display_name, bio, planet_color, planet_surface_style, music_enabled, music_url, music_volume, is_published'
    )
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    const routing = await fetchProfileRouting(supabase, user.id);
    if (!routing) return null;

    return {
      id: user.id,
      username: routing.username,
      display_name: routing.username,
      bio: null,
      planet_color: '#7c8cff',
      planet_surface_style: 'smooth',
      music_enabled: false,
      music_url: null,
      music_volume: 0.3,
      is_published: routing.is_published,
      starCount: 0,
    };
  }

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

/** Where to send the user right after sign-in / email verification. */
export async function getPostAuthPath(
  supabase: SupabaseClient<Database>
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return '/auth/sign-in';

  const profile = await fetchProfileRouting(supabase, user.id);

  if (profile && hasPublishedPlanet(profile)) {
    return '/dashboard';
  }

  return '/auth/verified';
}

export interface LoadedPlanetEditorData {
  profile: {
    display_name: string;
    username: string;
    bio: string;
    planet_color: string;
    planet_surface_style: string;
    planet_atmosphere: string;
    planet_glow: number;
    planet_has_ring: boolean;
    universe_mood: string;
    space_background: string;
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

  const routing = await fetchProfileRouting(supabase, user.id);
  if (!routing || !hasPublishedPlanet(routing)) return null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(
      'display_name, username, bio, planet_color, planet_surface_style, planet_atmosphere, planet_glow, planet_has_ring, universe_mood, space_background, music_enabled, music_url, music_volume, is_published'
    )
    .eq('id', user.id)
    .maybeSingle();

  const safeProfile = profile ?? {
    display_name: routing.username,
    username: routing.username,
    bio: null,
    planet_color: '#7C3AED',
    planet_surface_style: 'smooth',
    planet_atmosphere: 'thin',
    planet_glow: 3,
    planet_has_ring: false,
    universe_mood: 'calm',
    space_background: 'deep_space',
    music_enabled: false,
    music_url: null,
    music_volume: 0.3,
    is_published: routing.is_published,
  };

  if (profileError && !profile) {
    console.error('[profile] editor load failed:', profileError.message);
  }

  const { data: starsData, error: starsError } = await supabase
    .from('stars')
    .select('id, title, content, icon, visual_type')
    .eq('profile_id', user.id)
    .order('sort_order', { ascending: true });

  if (starsError) {
    const { data: basicStars } = await supabase
      .from('stars')
      .select('id, title, content, icon')
      .eq('profile_id', user.id)
      .order('sort_order', { ascending: true });

    return {
      profile: {
        display_name: safeProfile.display_name,
        username: safeProfile.username,
        bio: safeProfile.bio ?? '',
        planet_color: safeProfile.planet_color ?? '#7C3AED',
        planet_surface_style: safeProfile.planet_surface_style ?? 'smooth',
        planet_atmosphere:
          ('planet_atmosphere' in safeProfile && safeProfile.planet_atmosphere) ||
          'thin',
        planet_glow:
          ('planet_glow' in safeProfile && typeof safeProfile.planet_glow === 'number'
            ? safeProfile.planet_glow
            : 3),
        planet_has_ring:
          ('planet_has_ring' in safeProfile && !!safeProfile.planet_has_ring) || false,
        universe_mood:
          ('universe_mood' in safeProfile && safeProfile.universe_mood) || 'calm',
        space_background:
          ('space_background' in safeProfile && safeProfile.space_background) ||
          'deep_space',
        music_enabled: safeProfile.music_enabled ?? false,
        music_url: safeProfile.music_url ?? '',
        music_volume: safeProfile.music_volume ?? 0.3,
      },
      stars: (basicStars ?? []).map((star) => ({
        id: star.id,
        title: star.title,
        content: star.content ?? '',
        icon: star.icon,
        visualType: 'sparkle',
      })),
    };
  }

  return {
    profile: {
      display_name: safeProfile.display_name,
      username: safeProfile.username,
      bio: safeProfile.bio ?? '',
      planet_color: safeProfile.planet_color ?? '#7C3AED',
      planet_surface_style: safeProfile.planet_surface_style ?? 'smooth',
      planet_atmosphere:
        ('planet_atmosphere' in safeProfile && safeProfile.planet_atmosphere) || 'thin',
      planet_glow:
        'planet_glow' in safeProfile && typeof safeProfile.planet_glow === 'number'
          ? safeProfile.planet_glow
          : 3,
      planet_has_ring:
        ('planet_has_ring' in safeProfile && !!safeProfile.planet_has_ring) || false,
      universe_mood:
        ('universe_mood' in safeProfile && safeProfile.universe_mood) || 'calm',
      space_background:
        ('space_background' in safeProfile && safeProfile.space_background) ||
        'deep_space',
      music_enabled: safeProfile.music_enabled ?? false,
      music_url: safeProfile.music_url ?? '',
      music_volume: safeProfile.music_volume ?? 0.3,
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
