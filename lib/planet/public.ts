import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { parseProfileLinks } from '@/lib/links';
import { parseStarMedia } from '@/lib/media';
import type { ProfileLink, ProfileRow, StarMedia, StarRow } from '@/types/database';

export type PublicPlanetProfile = Pick<
  ProfileRow,
  | 'id'
  | 'username'
  | 'display_name'
  | 'bio'
  | 'language'
  | 'planet_color'
  | 'planet_surface_style'
  | 'planet_atmosphere'
  | 'planet_glow'
  | 'planet_has_ring'
  | 'planet_design'
  | 'universe_mood'
  | 'space_background'
  | 'music_url'
  | 'music_enabled'
  | 'music_volume'
  | 'published_at'
  | 'guestbook_enabled'
> & { links: ProfileLink[] };

export type PublicPlanetStar = Pick<
  StarRow,
  'id' | 'title' | 'content' | 'icon' | 'category' | 'link_url' | 'visual_type' | 'resonance_count'
> & { media: StarMedia | null };

export interface PublicMessage {
  id: string;
  author_name: string;
  body: string;
  created_at: string;
}

export interface PublicPlanet {
  profile: PublicPlanetProfile;
  stars: PublicPlanetStar[];
  messages: PublicMessage[];
  viewerIsOwner: boolean;
  /** Published and public (an owner may be previewing a draft) */
  isLive: boolean;
}

const PROFILE_COLUMNS =
  'id, username, display_name, bio, language, planet_color, planet_surface_style, planet_atmosphere, planet_glow, planet_has_ring, planet_design, universe_mood, space_background, music_url, music_enabled, music_volume, published_at, links, is_published, visibility, guestbook_enabled';

const STAR_COLUMNS = 'id, title, content, icon, category, link_url, visual_type, resonance_count, media';

export function normalizeUsername(raw: string): string {
  try {
    return decodeURIComponent(raw).trim().toLowerCase();
  } catch {
    return raw.trim().toLowerCase();
  }
}

/**
 * Server-side read of a live planet (deduplicated per request with React
 * cache, so generateMetadata and the page share one query). The owner can
 * also preview an unpublished planet at its own URL.
 */
export const getPublicPlanet = cache(async (rawUsername: string): Promise<PublicPlanet | null> => {
  const username = normalizeUsername(rawUsername);
  if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(username)) return null;

  const supabase = await createClient();
  const [{ data: profile, error }, { data: auth }] = await Promise.all([
    supabase.from('profiles').select(PROFILE_COLUMNS).eq('username', username).maybeSingle(),
    supabase.auth.getUser(),
  ]);

  if (error) {
    console.error('[planet] profile read failed:', error.message);
    return null;
  }
  if (!profile) return null;

  const viewerIsOwner = auth.user?.id === profile.id;
  const isLive = profile.is_published && profile.visibility === 'public';
  if (!isLive && !viewerIsOwner) return null;

  const [{ data: stars, error: starsError }, { data: messages }] = await Promise.all([
    supabase.from('stars').select(STAR_COLUMNS).eq('profile_id', profile.id).order('sort_order', { ascending: true }),
    profile.guestbook_enabled
      ? supabase
          .from('planet_messages')
          .select('id, author_name, body, created_at')
          .eq('profile_id', profile.id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(60)
      : Promise.resolve({ data: [] as PublicMessage[] }),
  ]);

  if (starsError) console.error('[planet] stars read failed:', starsError.message);

  const { is_published: _p, visibility: _v, links, ...rest } = profile;

  return {
    profile: { ...rest, links: parseProfileLinks(links) },
    stars: ((stars ?? []) as Array<PublicPlanetStar & { media: unknown }>).map((star) => ({
      ...star,
      media: parseStarMedia(star.media),
    })),
    messages: (messages ?? []) as PublicMessage[],
    viewerIsOwner,
    isLive,
  };
});

/** Detects Arabic script — used to pick fonts and skip glyphs OG can't shape. */
export function hasArabic(text: string | null | undefined): boolean {
  return !!text && /[؀-ۿݐ-ݿࢠ-ࣿ]/.test(text);
}
