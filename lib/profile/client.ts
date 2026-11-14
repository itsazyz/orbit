import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Database,
  PlanetAtmosphere,
  ProfileLink,
  SpaceBackground,
  StarMedia,
  UniverseMood,
} from '@/types/database';
import { parseProfileLinks } from '@/lib/links';
import { parseStarMedia } from '@/lib/media';
import { normalizePlanetSurface } from '@/lib/universe/planet-surfaces';

/** A real username was chosen (not the placeholder created at sign-up). */
export function hasClaimedUsername(username: string | null | undefined): boolean {
  return !!username && !username.startsWith('user-');
}

export function hasPublishedPlanet(
  profile: { is_published: boolean; username: string } | null | undefined
): boolean {
  return !!profile?.is_published && hasClaimedUsername(profile.username);
}

/** Where to send the user right after sign-in / email verification. */
export async function getPostAuthPath(supabase: SupabaseClient<Database>): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return '/auth/sign-in';

  const { data } = await supabase
    .from('profiles')
    .select('username, is_published')
    .eq('id', user.id)
    .maybeSingle();

  return data && hasClaimedUsername(data.username) ? '/dashboard' : '/create';
}

export interface EditorStar {
  id: string;
  title: string;
  content: string;
  icon: string;
  visualType: string;
  category: string | null;
  linkUrl: string;
  media: StarMedia | null;
}

export interface EditorState {
  displayName: string;
  username: string;
  bio: string;
  planetColor: string;
  planetSurface: string;
  atmosphere: PlanetAtmosphere;
  glow: number;
  hasRing: boolean;
  mood: UniverseMood;
  spaceBackground: SpaceBackground;
  musicEnabled: boolean;
  musicUrl: string;
  links: ProfileLink[];
  stars: EditorStar[];
}

export const EMPTY_EDITOR_STATE: EditorState = {
  displayName: '',
  username: '',
  bio: '',
  planetColor: '#7c8cff',
  planetSurface: 'smooth',
  atmosphere: 'thin',
  glow: 3,
  hasRing: true,
  mood: 'calm',
  spaceBackground: 'deep_space',
  musicEnabled: false,
  musicUrl: '',
  links: [],
  stars: [],
};

export interface LoadedEditor {
  userId: string;
  state: EditorState;
  /** The planet was published before (editing vs. first publish) */
  isEditing: boolean;
}

export async function loadPlanetForEditor(
  supabase: SupabaseClient<Database>
): Promise<LoadedEditor | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile, error }, { data: stars }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase
      .from('stars')
      .select('id, title, content, icon, visual_type, category, link_url, media')
      .eq('profile_id', user.id)
      .order('sort_order', { ascending: true }),
  ]);

  if (error) console.error('[editor] profile load failed:', error.message);
  if (!profile) return { userId: user.id, state: EMPTY_EDITOR_STATE, isEditing: false };

  const claimed = hasClaimedUsername(profile.username);
  const metaName = (user.user_metadata?.display_name as string | undefined)?.trim() ?? '';
  const displayName =
    profile.display_name && profile.display_name !== 'New Explorer' ? profile.display_name : metaName;

  return {
    userId: user.id,
    isEditing: claimed && (profile.is_published || (stars?.length ?? 0) > 0),
    state: {
      displayName,
      username: claimed ? profile.username : '',
      bio: profile.bio ?? '',
      planetColor: profile.planet_color,
      planetSurface: normalizePlanetSurface(profile.planet_surface_style),
      atmosphere: profile.planet_atmosphere,
      glow: profile.planet_glow,
      hasRing: profile.planet_has_ring,
      mood: profile.universe_mood,
      spaceBackground: profile.space_background,
      musicEnabled: profile.music_enabled,
      musicUrl: profile.music_url ?? '',
      links: parseProfileLinks(profile.links),
      stars: (stars ?? []).map((s) => ({
        id: s.id,
        title: s.title,
        content: s.content ?? '',
        icon: s.icon,
        visualType: s.visual_type,
        category: s.category,
        linkUrl: s.link_url ?? '',
        media: parseStarMedia(s.media),
      })),
    },
  };
}
