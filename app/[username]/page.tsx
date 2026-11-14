import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicUniverseView } from '@/components/universe/PublicUniverseView';
import { getPublicPlanet } from '@/lib/planet/public';
import { getSiteUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { username: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const planet = await getPublicPlanet(params.username);
  if (!planet) {
    return { title: 'ORBIT', robots: { index: false } };
  }

  const { profile, stars, isLive } = planet;
  const name = profile.display_name || profile.username;
  const title = `${name} (@${profile.username}) — ORBIT`;
  const starTitles = stars.slice(0, 4).map((s) => s.title).join(' · ');
  const description =
    profile.bio?.trim() ||
    (starTitles ? `${starTitles} — ${name}'s universe on ORBIT.` : `${name}'s universe on ORBIT.`);
  const url = `${getSiteUrl()}/${profile.username}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: isLive ? undefined : { index: false, follow: false },
    openGraph: {
      title,
      description,
      url,
      type: 'profile',
      siteName: 'ORBIT',
      username: profile.username,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function UserPlanetPage({ params }: PageProps) {
  const planet = await getPublicPlanet(params.username);
  if (!planet) notFound();

  return <PublicUniverseView planet={planet} />;
}
