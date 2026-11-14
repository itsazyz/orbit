import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, StarMedia } from '@/types/database';

export const MAX_GALLERY_IMAGES = 4;
const MAX_IMAGE_EDGE = 1600;
const MEDIA_BUCKET = 'star-media';

/** youtube.com/watch?v=, youtu.be/, /shorts/, /embed/ → 11-char id */
export function parseYouTubeId(raw: string): string | null {
  const value = raw.trim();
  if (/^[\w-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') return url.pathname.slice(1, 12) || null;
    if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'music.youtube.com') {
      const v = url.searchParams.get('v');
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const m = url.pathname.match(/\/(?:shorts|embed|live|v)\/([\w-]{11})/);
      return m ? m[1]! : null;
    }
  } catch {
    /* not a URL */
  }
  return null;
}

const SPOTIFY_KINDS = ['track', 'album', 'playlist', 'episode', 'show'] as const;
type SpotifyKind = (typeof SPOTIFY_KINDS)[number];

/** open.spotify.com/{kind}/{id} (with optional /intl-xx/) or spotify:{kind}:{id} */
export function parseSpotify(raw: string): { kind: SpotifyKind; id: string } | null {
  const value = raw.trim();
  const uri = value.match(/^spotify:(track|album|playlist|episode|show):([A-Za-z0-9]{10,40})$/);
  if (uri) return { kind: uri[1] as SpotifyKind, id: uri[2]! };
  try {
    const url = new URL(value);
    if (!url.hostname.endsWith('spotify.com')) return null;
    const parts = url.pathname.split('/').filter(Boolean).filter((p) => !p.startsWith('intl-'));
    const kind = parts[0] as SpotifyKind;
    const id = parts[1];
    if (SPOTIFY_KINDS.includes(kind) && id && /^[A-Za-z0-9]{10,40}$/.test(id)) return { kind, id };
  } catch {
    /* not a URL */
  }
  return null;
}

export function youtubeEmbedUrl(id: string) {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
}

export function spotifyEmbedUrl(kind: string, id: string) {
  return `https://open.spotify.com/embed/${kind}/${id}?utm_source=orbit`;
}

function isStorageUrl(url: unknown): url is string {
  return typeof url === 'string' && /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//.test(url);
}

/** Defensive parse — the column is user-writable jsonb. */
export function parseStarMedia(value: unknown): StarMedia | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  switch (v.type) {
    case 'image':
      return isStorageUrl(v.url) ? { type: 'image', url: v.url } : null;
    case 'gallery': {
      const urls = Array.isArray(v.urls) ? v.urls.filter(isStorageUrl).slice(0, MAX_GALLERY_IMAGES) : [];
      return urls.length ? { type: 'gallery', urls } : null;
    }
    case 'youtube':
      return typeof v.id === 'string' && /^[\w-]{11}$/.test(v.id) ? { type: 'youtube', id: v.id } : null;
    case 'spotify':
      return typeof v.id === 'string' &&
        /^[A-Za-z0-9]{10,40}$/.test(v.id) &&
        SPOTIFY_KINDS.includes(v.kind as SpotifyKind)
        ? { type: 'spotify', kind: v.kind as SpotifyKind, id: v.id }
        : null;
    default:
      return null;
  }
}

export function mediaImages(media: StarMedia | null): string[] {
  if (!media) return [];
  if (media.type === 'image') return [media.url];
  if (media.type === 'gallery') return media.urls;
  return [];
}

/** Downscale to ≤1600px and re-encode (keeps GIFs untouched so they still animate). */
export async function compressImage(file: File): Promise<Blob> {
  if (file.type === 'image/gif') return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.86));
  return blob && blob.size < file.size ? blob : file;
}

export async function uploadStarImage(
  supabase: SupabaseClient<Database>,
  userId: string,
  starId: string,
  file: File
): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('NOT_IMAGE');
  const blob = await compressImage(file);
  if (blob.size > 5 * 1024 * 1024) throw new Error('TOO_LARGE');
  const ext = blob.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/${starId}/${Date.now().toString(36)}.${ext}`;
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, blob, { contentType: blob.type || file.type, cacheControl: '31536000', upsert: false });
  if (error) throw error;
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}
