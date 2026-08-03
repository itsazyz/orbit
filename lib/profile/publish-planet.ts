import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Database,
  PlanetAtmosphere,
  PlanetSurfaceStyle,
  SpaceBackground,
  UniverseMood,
} from '@/types/database';
import { computeAllStarLayouts } from '@/lib/universe/star-layout';
import { normalizePlanetSurface } from '@/lib/universe/planet-surfaces';

export interface PublishStarInput {
  title: string;
  content: string;
  icon: string;
  visualType: string;
}

export interface PublishPlanetInput {
  displayName: string;
  username: string;
  bio: string;
  planetColor: string;
  planetSurface: PlanetSurfaceStyle;
  atmosphere: PlanetAtmosphere;
  glow: number;
  hasRing: boolean;
  mood: UniverseMood;
  spaceBackground: SpaceBackground;
  musicEnabled: boolean;
  musicUrl: string;
}

function isSchemaColumnError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('column') ||
    lower.includes('schema cache') ||
    lower.includes('could not find')
  );
}

export async function publishUserPlanet(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: PublishPlanetInput,
  stars: PublishStarInput[]
): Promise<{ ok: true; username: string } | { ok: false; error: string }> {
  const fullPayload = {
    id: userId,
    username: input.username,
    display_name: input.displayName,
    bio: input.bio || null,
    planet_color: input.planetColor,
    planet_surface_style: normalizePlanetSurface(input.planetSurface),
    planet_atmosphere: input.atmosphere,
    planet_glow: Math.min(5, Math.max(0, Math.round(input.glow))),
    planet_has_ring: input.hasRing,
    universe_mood: input.mood,
    space_background: input.spaceBackground,
    music_enabled: input.musicEnabled,
    music_url: input.musicEnabled && input.musicUrl.trim() ? input.musicUrl.trim() : null,
    music_volume: 0.3,
    is_published: true,
    visibility: 'public' as const,
  };

  const minimalPayload = {
    id: userId,
    username: input.username,
    display_name: input.displayName,
    bio: input.bio || null,
    planet_color: input.planetColor,
    is_published: true,
    visibility: 'public' as const,
  };

  let profileResult = await supabase
    .from('profiles')
    .upsert(fullPayload, { onConflict: 'id' })
    .select('id, username')
    .maybeSingle();

  if (profileResult.error && isSchemaColumnError(profileResult.error.message)) {
    profileResult = await supabase
      .from('profiles')
      .upsert(minimalPayload, { onConflict: 'id' })
      .select('id, username')
      .maybeSingle();
  }

  if (profileResult.error) {
    return { ok: false, error: profileResult.error.message };
  }

  if (!profileResult.data) {
    return {
      ok: false,
      error:
        'Could not save your profile. Please try again or contact support if this continues.',
    };
  }

  const { error: deleteError } = await supabase
    .from('stars')
    .delete()
    .eq('profile_id', userId);

  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  const layouts = computeAllStarLayouts(stars.length);

  const fullStars = stars.map((star, index) => {
    const layout = layouts[index]!;
    return {
      profile_id: userId,
      title: star.title,
      content: star.content,
      icon: star.icon,
      visual_type: star.visualType,
      orbit_speed: 0.8 + (index % 3) * 0.4,
      angle: layout.angle,
      distance: layout.distance,
      size: layout.size,
      sort_order: index,
    };
  });

  let starsError = (await supabase.from('stars').insert(fullStars)).error;

  if (starsError && isSchemaColumnError(starsError.message)) {
    const basicStars = stars.map((star, index) => {
      const layout = layouts[index]!;
      return {
        profile_id: userId,
        title: star.title,
        content: star.content,
        icon: star.icon,
        angle: layout.angle,
        distance: layout.distance,
        size: layout.size,
        sort_order: index,
      };
    });
    starsError = (await supabase.from('stars').insert(basicStars)).error;
  }

  if (starsError) {
    return { ok: false, error: starsError.message };
  }

  return { ok: true, username: profileResult.data.username };
}
