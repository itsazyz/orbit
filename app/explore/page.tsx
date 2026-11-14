import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ExploreView } from './ExploreView';
import type { ExplorePlanetRow } from '@/types/database';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Explore universes — ORBIT',
  description: 'Real people, mapped as planets. Step inside their universes.',
};

export default async function ExplorePage() {
  let planets: ExplorePlanetRow[] = [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('explore_planets')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(120);
    if (error) console.error('[explore] read failed:', error.message);
    planets = (data ?? []) as ExplorePlanetRow[];
  } catch (error) {
    console.error('[explore] failed:', error);
  }

  return <ExploreView planets={planets} />;
}
