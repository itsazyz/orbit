import { LandingPage } from '@/components/landing/LandingPage';
import { MaintenancePage } from '@/components/site/MaintenancePage';
import { loadHomepageContentServer, loadSiteSettingsServer } from '@/lib/site-config/load';
import { createClient } from '@/lib/supabase/server';
import type { ExplorePlanetRow } from '@/types/database';

export const dynamic = 'force-dynamic';

async function loadLandingData() {
  try {
    const supabase = await createClient();
    const [statsRes, featuredRes, userRes] = await Promise.all([
      supabase.rpc('get_public_stats'),
      supabase
        .from('explore_planets')
        .select('*')
        .gte('star_count', 3)
        .order('published_at', { ascending: false })
        .limit(8),
      supabase.auth.getUser(),
    ]);
    return {
      stats: (statsRes.data as { planets: number; stars: number } | null) ?? null,
      featured: (featuredRes.data ?? []) as ExplorePlanetRow[],
      signedIn: !!userRes.data.user,
    };
  } catch (error) {
    console.error('[home] landing data failed:', error);
    return { stats: null, featured: [] as ExplorePlanetRow[], signedIn: false };
  }
}

export default async function HomePage() {
  const [homepage, settings, data] = await Promise.all([
    loadHomepageContentServer(),
    loadSiteSettingsServer(),
    loadLandingData(),
  ]);

  if (settings.maintenanceMode) {
    return <MaintenancePage settings={settings} />;
  }

  return <LandingPage homepage={homepage} {...data} />;
}
