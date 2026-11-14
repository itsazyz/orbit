import { ImageResponse } from 'next/og';
import { MOOD_PRESETS } from '@/lib/universe/constants';
import type { UniverseMood } from '@/types/database';

export const runtime = 'edge';
export const alt = 'A personal universe on ORBIT';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface OgProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  planet_color: string;
  planet_has_ring: boolean;
  universe_mood: UniverseMood;
}

const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿ]/;
// Satori cannot shape Arabic script, so only Latin-safe text is drawn.
const drawable = (text: string | null | undefined) => !!text && !ARABIC.test(text);

async function loadPlanet(username: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const headers = { apikey: key, Authorization: `Bearer ${key}` };

  const profileRes = await fetch(
    `${url}/rest/v1/profiles?select=id,username,display_name,bio,planet_color,planet_has_ring,universe_mood` +
      `&username=eq.${encodeURIComponent(username.toLowerCase())}&is_published=eq.true&visibility=eq.public&limit=1`,
    { headers, next: { revalidate: 300 } }
  );
  if (!profileRes.ok) return null;
  const [profile] = (await profileRes.json()) as OgProfile[];
  if (!profile) return null;

  const starsRes = await fetch(
    `${url}/rest/v1/stars?select=title&profile_id=eq.${profile.id}&order=sort_order.asc&limit=20`,
    { headers, next: { revalidate: 300 } }
  );
  const stars = starsRes.ok ? ((await starsRes.json()) as { title: string }[]) : [];
  return { profile, stars };
}

export default async function OpengraphImage({ params }: { params: { username: string } }) {
  const data = await loadPlanet(params.username).catch(() => null);

  const color = data?.profile.planet_color ?? '#7c8cff';
  const mood = MOOD_PRESETS[data?.profile.universe_mood ?? 'calm'] ?? MOOD_PRESETS.calm;
  const username = data?.profile.username ?? params.username;
  const name = data?.profile.display_name;
  const showName = drawable(name);
  const bio = drawable(data?.profile.bio) ? data!.profile.bio! : null;
  const chips = (data?.stars ?? []).filter((s) => drawable(s.title)).slice(0, 4);
  const starCount = data?.stars.length ?? 0;

  // Deterministic sprinkle of background stars.
  const dots = Array.from({ length: 70 }, (_, i) => {
    const x = (i * 197) % 1200;
    const y = (i * 113 + (i % 7) * 41) % 630;
    const r = (i % 3) + 1;
    return { x, y, r, o: 0.15 + ((i * 37) % 60) / 100 };
  });

  // Orbiting stars around the planet.
  const orbiterCount = Math.min(Math.max(starCount, 5), 12);
  const orbiters = Array.from({ length: orbiterCount }, (_, i) => {
    const angle = (i / orbiterCount) * Math.PI * 2 - Math.PI / 3;
    const radius = i % 2 === 0 ? 205 : 165;
    return { x: 300 + Math.cos(angle) * radius, y: 315 + Math.sin(angle) * radius * 0.92 };
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: `radial-gradient(circle at 25% 50%, ${color}33 0%, ${mood.bg} 45%, #04050a 100%)`,
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        {dots.map((d, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: d.x,
              top: d.y,
              width: d.r,
              height: d.r,
              borderRadius: 9999,
              background: 'white',
              opacity: d.o,
            }}
          />
        ))}

        {/* orbit rings */}
        <div
          style={{
            position: 'absolute',
            left: 300 - 205,
            top: 315 - 190,
            width: 410,
            height: 380,
            borderRadius: 9999,
            border: '1px dashed rgba(255,255,255,0.14)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 300 - 165,
            top: 315 - 152,
            width: 330,
            height: 304,
            borderRadius: 9999,
            border: '1px dashed rgba(255,255,255,0.1)',
          }}
        />

        {/* planet glow + body */}
        <div
          style={{
            position: 'absolute',
            left: 300 - 150,
            top: 315 - 150,
            width: 300,
            height: 300,
            borderRadius: 9999,
            background: `radial-gradient(circle, ${color}66 0%, transparent 70%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 300 - 95,
            top: 315 - 95,
            width: 190,
            height: 190,
            borderRadius: 9999,
            background: `radial-gradient(circle at 32% 28%, #ffffffdd 0%, ${color} 40%, ${color} 68%, #0b0614 100%)`,
            boxShadow: `0 0 70px ${color}, 0 0 140px ${color}88`,
          }}
        />
        {data?.profile.planet_has_ring ? (
          <div
            style={{
              position: 'absolute',
              left: 300 - 170,
              top: 315 - 38,
              width: 340,
              height: 76,
              borderRadius: '50%',
              border: `3px solid ${color}`,
              transform: 'rotate(-22deg)',
              opacity: 0.85,
            }}
          />
        ) : null}

        {orbiters.map((o, i) => (
          <div
            key={`o${i}`}
            style={{
              position: 'absolute',
              left: o.x - 6,
              top: o.y - 6,
              width: 12,
              height: 12,
              borderRadius: 9999,
              background: 'white',
              boxShadow: `0 0 18px ${i % 3 === 0 ? color : '#ffffff'}`,
            }}
          />
        ))}

        {/* text column */}
        <div
          style={{
            position: 'absolute',
            left: 620,
            top: 0,
            width: 520,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: 22, letterSpacing: 8, opacity: 0.6, display: 'flex' }}>ORBIT</div>
          <div
            style={{
              fontSize: showName ? 68 : 60,
              fontWeight: 700,
              lineHeight: 1.05,
              marginTop: 18,
              display: 'flex',
            }}
          >
            {showName ? name : `@${username}`}
          </div>
          {showName ? (
            <div style={{ fontSize: 28, marginTop: 10, color, display: 'flex' }}>@{username}</div>
          ) : null}
          {bio ? (
            <div style={{ fontSize: 26, marginTop: 22, opacity: 0.75, lineHeight: 1.35, display: 'flex' }}>
              {bio.length > 110 ? `${bio.slice(0, 107)}…` : bio}
            </div>
          ) : null}
          {chips.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 26 }}>
              {chips.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    fontSize: 22,
                    padding: '8px 16px',
                    borderRadius: 9999,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.06)',
                  }}
                >
                  {c.title.length > 26 ? `${c.title.slice(0, 24)}…` : c.title}
                </div>
              ))}
            </div>
          ) : null}
          <div style={{ display: 'flex', fontSize: 22, marginTop: 34, opacity: 0.55 }}>
            {starCount > 0 ? `${starCount} stars · ` : ''}Every person is a universe.
          </div>
        </div>
      </div>
    ),
    size
  );
}
