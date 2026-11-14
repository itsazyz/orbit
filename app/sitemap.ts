import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/utils';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/explore`, changeFrequency: 'daily', priority: 0.8 },
  ];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return entries;

  try {
    const res = await fetch(
      `${url}/rest/v1/profiles?select=username,updated_at&is_published=eq.true&visibility=eq.public&order=updated_at.desc&limit=5000`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const rows = (await res.json()) as { username: string; updated_at: string }[];
      for (const row of rows) {
        entries.push({
          url: `${base}/${row.username}`,
          lastModified: row.updated_at,
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      }
    }
  } catch (error) {
    console.error('[sitemap] failed:', error);
  }

  return entries;
}
