'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Flag,
  MessageSquare,
  Pencil,
  Share2,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { UniverseBackground } from '@/components/planet/PlanetRenderer';
import { StarsBackground } from '@/components/universe/StarsBackground';
import { CosmicDust } from '@/components/universe/CosmicDust';
import { OrbitStage } from '@/components/universe/OrbitStage';
import { LinkIcon } from '@/components/links/LinkIcon';
import { SharePanel } from '@/components/share/SharePanel';
import { WarpIntro } from '@/components/universe/WarpIntro';
import { StarMediaView } from '@/components/universe/StarMediaView';
import { GuestbookSheet } from '@/components/universe/GuestbookSheet';
import { ReportSheet } from '@/components/universe/ReportSheet';
import { trackPlanet } from '@/lib/track';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/context';
import { getLinkMeta, linkDisplayText } from '@/lib/links';
import { normalizePlanetSurface } from '@/lib/universe/planet-surfaces';
import type { PublicPlanet } from '@/lib/planet/public';
import { cn } from '@/lib/utils';

interface PublicUniverseViewProps {
  planet: PublicPlanet;
}

function safeStorage(kind: 'local' | 'session') {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function PublicUniverseView({ planet }: PublicUniverseViewProps) {
  const { profile, viewerIsOwner, isLive } = planet;
  const { t, dir } = useLanguage();
  const supabase = useMemo(() => createClient(), []);

  const [stars, setStars] = useState(planet.stars);
  const [selected, setSelected] = useState<number | null>(null);
  const [resonated, setResonated] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState('');
  const [muted, setMuted] = useState(false);
  const [musicStarted, setMusicStarted] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [guestbookOpen, setGuestbookOpen] = useState(false);
  const [report, setReport] = useState<{ messageId: string | null } | null>(null);
  const [arrived, setArrived] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const name = profile.display_name || profile.username;
  const musicEnabled = profile.music_enabled && !!profile.music_url;

  // --- first publish: open the share sheet once ---
  useEffect(() => {
    if (!viewerIsOwner) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('published') === '1') setCelebrate(true);
  }, [viewerIsOwner]);

  const closeCelebrate = useCallback(() => {
    setCelebrate(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('published');
    window.history.replaceState(null, '', url.pathname + url.search);
  }, []);

  // --- visit counter (once per browser session, never for the owner) ---
  useEffect(() => {
    if (viewerIsOwner || !isLive) return;
    const store = safeStorage('session');
    const key = `orbit:viewed:${profile.username}`;
    if (store?.getItem(key)) return;
    store?.setItem(key, '1');
    const params = new URLSearchParams(window.location.search);
    trackPlanet(profile.username, 'view', { s: params.get('s'), ref: document.referrer });
  }, [profile.username, viewerIsOwner, isLive]);

  // --- analytics: which stars get opened ---
  const lastOpened = useRef<string | null>(null);
  useEffect(() => {
    if (selected === null || viewerIsOwner || !isLive) return;
    const id = stars[selected]?.id;
    if (!id || lastOpened.current === id) return;
    lastOpened.current = id;
    trackPlanet(profile.username, 'star_open', { dim: id });
  }, [selected, stars, viewerIsOwner, isLive, profile.username]);

  // --- remember which stars this browser already resonated with ---
  useEffect(() => {
    const store = safeStorage('local');
    if (!store) return;
    const map: Record<string, boolean> = {};
    for (const star of planet.stars) {
      if (store.getItem(`orbit:res:${star.id}`)) map[star.id] = true;
    }
    setResonated(map);
  }, [planet.stars]);

  // --- music: browsers block autoplay with sound, so start on first tap ---
  useEffect(() => {
    if (!musicEnabled) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = profile.music_volume ?? 0.3;

    const start = () => {
      audio
        .play()
        .then(() => setMusicStarted(true))
        .catch(() => undefined);
    };
    start();
    window.addEventListener('pointerdown', start, { once: true });
    return () => window.removeEventListener('pointerdown', start);
  }, [musicEnabled, profile.music_volume]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!musicStarted) {
      audio.play().then(() => setMusicStarted(true)).catch(() => undefined);
      return;
    }
    const next = !muted;
    audio.muted = next;
    setMuted(next);
  }, [muted, musicStarted]);

  const flash = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  }, []);

  const share = useCallback(async () => {
    const url = `${window.location.origin}/${profile.username}`;
    const shareData = { title: `${name} — ORBIT`, text: t('share.message'), url };
    if (!viewerIsOwner) trackPlanet(profile.username, 'share', { dim: 'share' in navigator ? 'native' : 'copy' });
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        /* cancelled → fall back to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      flash(t('planet.copied'));
    } catch {
      flash(url);
    }
  }, [flash, name, profile.username, t, viewerIsOwner]);

  const resonate = useCallback(
    async (starId: string) => {
      if (resonated[starId] || viewerIsOwner) return;
      setResonated((r) => ({ ...r, [starId]: true }));
      setStars((list) =>
        list.map((s) => (s.id === starId ? { ...s, resonance_count: s.resonance_count + 1 } : s))
      );
      safeStorage('local')?.setItem(`orbit:res:${starId}`, '1');
      const { error } = await supabase.rpc('resonate_star', { p_star_id: starId });
      if (error) console.warn('[planet] resonance failed:', error.message);
    },
    [resonated, supabase, viewerIsOwner]
  );

  // --- keyboard navigation inside the star sheet ---
  useEffect(() => {
    if (selected === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
      const forward = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
      const backward = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
      if (e.key === forward) setSelected((i) => (i === null ? i : (i + 1) % stars.length));
      if (e.key === backward)
        setSelected((i) => (i === null ? i : (i - 1 + stars.length) % stars.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, stars.length, dir]);

  const orbitStars = useMemo(
    () =>
      stars.map((s) => ({
        id: s.id,
        title: s.title,
        icon: s.icon,
        visualType: s.visual_type,
        category: s.category,
      })),
    [stars]
  );

  const current = selected !== null ? stars[selected] : null;
  const PrevIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const NextIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <main className="relative min-h-svh overflow-x-hidden text-white">
      <WarpIntro
        color={profile.planet_color}
        label={t('planet.entering', { name })}
        storageKey={`orbit:warp:${profile.username}`}
        disabled={viewerIsOwner}
        onDone={() => setArrived(true)}
      />
      <div className="fixed inset-0 z-0">
        <UniverseBackground mood={profile.universe_mood} spaceBackground={profile.space_background} />
        <StarsBackground seed={profile.username} count={90} />
        <CosmicDust seed={`${profile.username}-dust`} count={28} color={`${profile.planet_color}66`} />
      </div>

      {musicEnabled ? (
        <audio ref={audioRef} src={profile.music_url!} loop preload="none" />
      ) : null}

      {/* Top bar */}
      <header className="relative z-20 flex items-center justify-between px-4 pt-4 sm:px-8 sm:pt-5">
        <Link
          href="/"
          className="rounded-full px-3 py-2 text-sm font-medium tracking-[0.28em] text-white/80 hover:text-white"
        >
          ORBIT
        </Link>
        <div className="flex items-center gap-2">
          {musicEnabled ? (
            <button
              type="button"
              onClick={toggleMute}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur-md hover:bg-white/10"
              aria-label={!musicStarted ? t('planet.playMusic') : muted ? t('planet.unmuteMusic') : t('planet.muteMusic')}
            >
              {!musicStarted || muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
          ) : null}
          <button
            type="button"
            onClick={share}
            className="flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 text-sm backdrop-blur-md hover:bg-white/10"
          >
            <Share2 size={16} />
            <span className="hidden sm:inline">{t('planet.share')}</span>
          </button>
        </div>
      </header>

      {viewerIsOwner && !isLive ? (
        <div className="relative z-20 mx-auto mt-3 w-fit max-w-[92%] rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-center text-xs text-amber-100">
          {t('planet.ownerPreview')}
        </div>
      ) : null}

      {/* Orbit */}
      <section
        className={cn(
          'relative z-10 mx-auto h-[min(54svh,640px)] min-h-[320px] w-full max-w-[720px] sm:h-[min(66svh,640px)]',
          arrived && 'animate-universe-arrive'
        )}
      >
        <OrbitStage
          planet={{
            color: profile.planet_color,
            surfaceStyle: normalizePlanetSurface(profile.planet_surface_style),
            atmosphere: profile.planet_atmosphere,
            glow: profile.planet_glow,
            hasRing: profile.planet_has_ring,
            mood: profile.universe_mood,
            spaceBackground: profile.space_background,
          }}
          stars={orbitStars}
          onSelect={stars.length ? setSelected : undefined}
          selectedId={current?.id ?? null}
          paused={selected !== null}
          render3d
          seed={profile.username}
        />
      </section>

      {/* Identity */}
      <section className="relative z-10 mx-auto -mt-4 max-w-xl px-6 pb-40 text-center">
        <h1 dir="auto" className="text-balance text-3xl font-semibold tracking-tight drop-shadow-[0_6px_30px_rgba(0,0,0,0.6)] sm:text-4xl">
          {name}
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: profile.planet_color }} dir="ltr">
          @{profile.username}
        </p>
        {profile.bio ? (
          <p dir="auto" className="mx-auto mt-4 max-w-md text-balance text-[15px] leading-relaxed text-white/70">
            {profile.bio}
          </p>
        ) : null}

        {profile.links.length ? (
          <nav aria-label={t('planet.links')} className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {profile.links.map((link, i) => {
              const meta = getLinkMeta(link.type);
              return (
                <a
                  key={`${link.type}-${i}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  onClick={() => {
                    if (!viewerIsOwner && isLive) trackPlanet(profile.username, 'link_click', { dim: link.url });
                  }}
                  className="group flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-2 text-sm text-white/85 backdrop-blur-md transition hover:border-white/25 hover:bg-white/[0.12]"
                  title={meta.label}
                >
                  <span style={{ color: meta.color }}>
                    <LinkIcon type={link.type} size={16} />
                  </span>
                  <span className="max-w-[160px] truncate" dir="ltr">
                    {linkDisplayText(link)}
                  </span>
                </a>
              );
            })}
          </nav>
        ) : null}

        {profile.guestbook_enabled ? (
          <button
            type="button"
            onClick={() => setGuestbookOpen(true)}
            className="mx-auto mt-5 flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm text-white/80 backdrop-blur-md transition hover:border-white/25 hover:bg-white/[0.08]"
          >
            <MessageSquare size={15} style={{ color: profile.planet_color }} />
            {t('planet.guestbook')}
            {planet.messages.length ? (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]">{planet.messages.length}</span>
            ) : null}
          </button>
        ) : null}

        {stars.length > 0 ? (
          <p className="mx-auto mt-6 w-fit rounded-full bg-white/[0.05] px-4 py-1.5 text-xs text-white/55">
            ✦ {t('planet.tapHint', { name })}
          </p>
        ) : null}

        {stars.length === 0 ? (
          <div className="mx-auto mt-10 max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <Sparkles className="mx-auto mb-3 opacity-70" size={22} />
            <p className="font-medium">{t('planet.emptyTitle')}</p>
            <p className="mt-1 text-sm text-white/60">{t('planet.emptyText')}</p>
          </div>
        ) : null}
        {!viewerIsOwner ? (
          <button
            type="button"
            onClick={() => setReport({ messageId: null })}
            className="mx-auto mt-10 flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60"
          >
            <Flag size={11} /> {t('planet.report')}
          </button>
        ) : null}
      </section>

      {/* Bottom bar: hint + viral CTA (or owner tools) */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex flex-col items-center gap-3 px-4 pb-[max(16px,env(safe-area-inset-bottom))]">

        {viewerIsOwner ? (
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/15 bg-[#07080f]/80 p-1.5 shadow-2xl backdrop-blur-xl">
            <Link href="/create" className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm hover:bg-white/10">
              <Pencil size={15} /> {t('planet.ownerEdit')}
            </Link>
            <Link href="/dashboard" className="rounded-full px-4 py-2.5 text-sm hover:bg-white/10">
              {t('planet.ownerDashboard')}
            </Link>
            <button
              type="button"
              onClick={share}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-white/90"
            >
              <Share2 size={15} /> {t('planet.ownerShare')}
            </button>
          </div>
        ) : (
          <Link
            href={`/auth/sign-up?ref=${encodeURIComponent(profile.username)}`}
            className="pointer-events-auto group flex items-center gap-3 rounded-full border border-white/15 bg-[#07080f]/80 py-1.5 pe-1.5 ps-5 shadow-2xl backdrop-blur-xl transition hover:border-white/30"
          >
            <span className="hidden text-sm text-white/75 min-[400px]:inline">{t('planet.ctaTitle')}</span>
            <span className="text-sm font-medium tracking-[0.2em] text-white/80 min-[400px]:hidden">ORBIT</span>
            <span
              className="rounded-full px-4 py-2 text-sm font-medium text-white"
              style={{ background: profile.planet_color }}
            >
              {t('planet.ctaButton')}
            </span>
          </Link>
        )}
      </div>

      {/* Star sheet */}
      {current ? (
        <div
          className="animate-fade-in fixed inset-0 z-40 flex items-end justify-center bg-black/35 p-3 sm:items-center sm:p-6"
          onClick={() => setSelected(null)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="star-title"
            onClick={(e) => e.stopPropagation()}
            className="animate-sheet-up relative max-h-[90svh] w-full max-w-md overflow-y-auto rounded-[28px] border border-white/15 bg-[#0b0d18]/95 p-6 pt-7 text-center shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:p-8"
          >
            <div
              className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl"
              style={{ background: `${profile.planet_color}55` }}
              aria-hidden
            />
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute end-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label={t('planet.close')}
            >
              <X size={18} />
            </button>

            <div
              className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl"
              style={{
                background: `radial-gradient(circle, #ffffff 0%, ${profile.planet_color} 45%, transparent 72%)`,
                boxShadow: `0 0 50px ${profile.planet_color}88`,
              }}
              aria-hidden
            >
              {current.icon || '✦'}
            </div>

            <p className="relative text-[11px] uppercase tracking-[0.2em] text-white/50">
              {current.category ? t(`starKinds.${current.category}`) : t('planet.partOf', { name })}
            </p>
            <h2 id="star-title" dir="auto" className="relative mt-2 text-balance text-2xl font-semibold sm:text-3xl">
              {current.title}
            </h2>
            {current.media ? (
              <div className="relative mt-4">
                <StarMediaView media={current.media} title={current.title} />
              </div>
            ) : null}
            {current.content ? (
              <p dir="auto" className="relative mt-4 whitespace-pre-wrap text-balance text-[15px] leading-relaxed text-white/80">
                {current.content}
              </p>
            ) : null}

            {current.link_url ? (
              <a
                href={current.link_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="relative mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
              >
                <ExternalLink size={15} /> {t('planet.openLink')}
              </a>
            ) : null}

            <div className="relative mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelected((i) => (i === null ? i : (i - 1 + stars.length) % stars.length))}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 hover:bg-white/10 disabled:opacity-30"
                aria-label={t('planet.prev')}
                disabled={stars.length < 2}
              >
                <PrevIcon size={18} />
              </button>

              <button
                type="button"
                onClick={() => resonate(current.id)}
                disabled={viewerIsOwner || resonated[current.id]}
                className={cn(
                  'flex flex-1 flex-col items-center rounded-2xl border px-4 py-2.5 text-sm transition',
                  resonated[current.id]
                    ? 'border-transparent bg-white/10 text-white'
                    : 'border-white/15 hover:bg-white/10',
                  viewerIsOwner && 'cursor-default'
                )}
              >
                <span className="flex items-center gap-2 font-medium">
                  <Sparkles size={15} style={{ color: profile.planet_color }} />
                  {resonated[current.id] ? t('planet.resonated') : t('planet.resonate')}
                </span>
                {current.resonance_count > 0 ? (
                  <span className="mt-0.5 text-[11px] text-white/50">
                    {current.resonance_count === 1
                      ? t('planet.resonanceOne')
                      : t('planet.resonanceCount', { count: current.resonance_count })}
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => setSelected((i) => (i === null ? i : (i + 1) % stars.length))}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 hover:bg-white/10 disabled:opacity-30"
                aria-label={t('planet.next')}
                disabled={stars.length < 2}
              >
                <NextIcon size={18} />
              </button>
            </div>

            <p className="relative mt-4 text-[11px] text-white/35">
              {(selected ?? 0) + 1} / {stars.length}
            </p>
          </div>
        </div>
      ) : null}

      {guestbookOpen ? (
        <GuestbookSheet
          username={profile.username}
          ownerName={name}
          color={profile.planet_color}
          messages={planet.messages}
          isOwner={viewerIsOwner}
          onClose={() => setGuestbookOpen(false)}
          onReportMessage={(messageId) => setReport({ messageId })}
        />
      ) : null}

      {report ? (
        <ReportSheet username={profile.username} messageId={report.messageId} onClose={() => setReport(null)} />
      ) : null}

      {celebrate ? (
        <div
          className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center"
          onClick={closeCelebrate}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="animate-sheet-up relative w-full max-w-lg rounded-[28px] border border-white/15 bg-[#0b0d18]/95 p-6 shadow-2xl sm:p-8"
          >
            <button
              type="button"
              onClick={closeCelebrate}
              className="absolute end-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10"
              aria-label={t('planet.close')}
            >
              <X size={18} />
            </button>
            <p className="text-2xl font-semibold">{t('wizard.publishedTitle')}</p>
            <p className="mt-1 text-sm text-white/60">{t('share.subtitle')}</p>
            <SharePanel
              className="mt-6"
              url={typeof window !== 'undefined' ? `${window.location.origin}/${profile.username}` : `/${profile.username}`}
              username={profile.username}
              displayName={name}
              bio={profile.bio}
              planetColor={profile.planet_color}
              hasRing={profile.planet_has_ring}
              mood={profile.universe_mood}
              starTitles={stars.map((s) => s.title)}
            />
            <p className="mt-5 text-center text-xs text-white/45">{t('share.bioTip')}</p>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="animate-fade-in fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black shadow-xl">
          {toast}
        </div>
      ) : null}
    </main>
  );
}
