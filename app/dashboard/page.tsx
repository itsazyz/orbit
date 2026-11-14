import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { parseProfileLinks } from '@/lib/links';
import { DashboardClient, type DashboardData } from './DashboardClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard — ORBIT',
  robots: { index: false },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in?redirectTo=/dashboard');

  const since = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);

  const [{ data: profile }, { data: stars }, { data: views }, { data: totals }, { data: stats }, { data: messages }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase
      .from('stars')
      .select('id, title, icon, resonance_count')
      .eq('profile_id', user.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('planet_views_daily')
      .select('day, views')
      .eq('profile_id', user.id)
      .gte('day', since)
      .order('day', { ascending: true }),
    supabase.from('planet_views_daily').select('views').eq('profile_id', user.id),
    supabase
      .from('planet_stats_daily')
      .select('day, metric, dim, count')
      .eq('profile_id', user.id)
      .gte('day', since),
    supabase
      .from('planet_messages')
      .select('id, author_name, body, status, created_at')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  const data: DashboardData = {
    email: user.email ?? '',
    profile: profile
      ? {
          username: profile.username,
          displayName: profile.display_name,
          bio: profile.bio,
          planetColor: profile.planet_color,
          planetSurface: profile.planet_surface_style,
          atmosphere: profile.planet_atmosphere,
          glow: profile.planet_glow,
          hasRing: profile.planet_has_ring,
          mood: profile.universe_mood,
          spaceBackground: profile.space_background,
          isPublished: profile.is_published,
          showInExplore: profile.show_in_explore,
          linksCount: parseProfileLinks(profile.links).length,
          links: parseProfileLinks(profile.links),
          guestbookEnabled: profile.guestbook_enabled,
        }
      : null,
    stars: stars ?? [],
    viewsByDay: views ?? [],
    totalViews: (totals ?? []).reduce((sum, row) => sum + (row.views ?? 0), 0),
    stats: stats ?? [],
    messages: messages ?? [],
  };

  return <DashboardClient data={data} />;
}
