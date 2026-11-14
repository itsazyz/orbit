'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Eye, Pencil, Sparkles, Star, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/context';
import { PlanetRenderer } from '@/components/planet/PlanetRenderer';
import { StarsBackground } from '@/components/universe/StarsBackground';
import { SharePanel } from '@/components/share/SharePanel';
import { hasClaimedUsername } from '@/lib/profile/client';
import { normalizePlanetSurface } from '@/lib/universe/planet-surfaces';
import type { PlanetAtmosphere, SpaceBackground, UniverseMood } from '@/types/database';
import { cn, formatCompact } from '@/lib/utils';

export interface DashboardData {
  email: string;
  profile: {
    username: string;
    displayName: string;
    bio: string | null;
    planetColor: string;
    planetSurface: string;
    atmosphere: PlanetAtmosphere;
    glow: number;
    hasRing: boolean;
    mood: UniverseMood;
    spaceBackground: SpaceBackground;
    isPublished: boolean;
    showInExplore: boolean;
    linksCount: number;
  } | null;
  stars: { id: string; title: string; icon: string; resonance_count: number }[];
  viewsByDay: { day: string; views: number }[];
  totalViews: number;
}

const card = 'rounded-3xl border border-white/10 bg-white/[0.035] p-6';

function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint: string;
  disabled?: boolean;
}) {
  return (
    <label className={cn('flex cursor-pointer items-start justify-between gap-4 py-3', disabled && 'opacity-50')}>
      <span>
        <span className="block text-sm font-medium text-white">{label}</span>
        <span className="block text-xs text-white/50">{hint}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition',
          checked ? 'bg-accent' : 'bg-white/15'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
            checked ? 'start-[22px]' : 'start-0.5'
          )}
        />
      </button>
    </label>
  );
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const profile = data.profile;

  const [isPublished, setIsPublished] = useState(profile?.isPublished ?? false);
  const [showInExplore, setShowInExplore] = useState(profile?.showInExplore ?? true);
  const [savedFlash, setSavedFlash] = useState(false);
  const [shared, setShared] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
    try {
      setShared(!!window.localStorage.getItem('orbit:shared'));
    } catch {
      /* ignore */
    }
  }, []);

  const markShared = () => {
    setShared(true);
    try {
      window.localStorage.setItem('orbit:shared', '1');
    } catch {
      /* ignore */
    }
  };

  async function updateFlags(patch: { is_published?: boolean; show_in_explore?: boolean }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('profiles').update(patch).eq('id', user.id);
    if (!error) {
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1500);
      router.refresh();
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  async function deleteAccount() {
    if (deleteText.trim() !== t('dash.deleteWord')) return;
    setDeleting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: files } = await supabase.storage.from('planet-music').list(user.id);
        if (files?.length) {
          await supabase.storage.from('planet-music').remove(files.map((f) => `${user.id}/${f.name}`));
        }
      }
      const { error } = await supabase.rpc('delete_my_account');
      if (error) throw error;
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('[dashboard] delete failed:', error);
      setDeleting(false);
    }
  }

  // ---- derived numbers ----
  const series = useMemo(() => {
    const map = new Map(data.viewsByDay.map((d) => [d.day, d.views]));
    return Array.from({ length: 30 }, (_, i) => {
      const day = new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10);
      return { day, views: map.get(day) ?? 0 };
    });
  }, [data.viewsByDay]);
  const views7 = series.slice(-7).reduce((s, d) => s + d.views, 0);
  const maxViews = Math.max(1, ...series.map((d) => d.views));
  const totalResonance = data.stars.reduce((s, x) => s + x.resonance_count, 0);
  const topStars = [...data.stars].filter((s) => s.resonance_count > 0).sort((a, b) => b.resonance_count - a.resonance_count).slice(0, 5);

  const hasPlanet = !!profile && hasClaimedUsername(profile.username) && data.stars.length > 0;
  const planetUrl = profile ? `${origin}/${profile.username}` : '';

  const checklist = profile
    ? [
        { done: data.stars.length >= 5, label: t('dash.checkStars'), href: '/create' },
        { done: !!profile.bio?.trim(), label: t('dash.checkBio'), href: '/create' },
        { done: profile.linksCount > 0, label: t('dash.checkLinks'), href: '/create' },
        { done: shared, label: t('dash.checkShare'), href: null },
      ]
    : [];
  const checklistDone = checklist.every((c) => c.done);

  return (
    <main className="relative min-h-svh bg-[radial-gradient(circle_at_top,#141c3d_0%,#080a16_50%,#04050a_100%)] text-white">
      <StarsBackground seed="dashboard" count={50} />
      <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-16 sm:px-6">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-medium tracking-[0.28em] text-white/80 hover:text-white">
            ORBIT
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/explore" className="rounded-full px-3 py-2 text-sm text-white/60 hover:text-white">
              {t('home.explore')}
            </Link>
            <button type="button" onClick={signOut} className="rounded-full px-3 py-2 text-sm text-white/60 hover:text-white">
              {t('dash.signOut')}
            </button>
          </nav>
        </header>

        {!hasPlanet || !profile ? (
          <section className={cn(card, 'mt-10 flex flex-col items-center px-6 py-14 text-center')}>
            <PlanetRenderer
              color="#7c8cff"
              surfaceStyle="crystalline"
              atmosphere="thin"
              glow={4}
              hasRing
              mood="futuristic"
              spaceBackground="deep_space"
              size={110}
              animate
              spin
            />
            <h1 className="mt-8 text-3xl font-semibold">{t('dash.emptyTitle')}</h1>
            <p className="mx-auto mt-3 max-w-md text-white/60">{t('dash.emptyText')}</p>
            <Link
              href="/create"
              className="mt-8 rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-white shadow-lg shadow-accent/25 hover:bg-accent/90"
            >
              {t('dash.start')}
            </Link>
          </section>
        ) : (
          <>
            {/* Hero */}
            <section className={cn(card, 'mt-8 flex flex-col items-center gap-6 sm:flex-row sm:items-center')}>
              <div className="flex h-36 w-44 shrink-0 items-center justify-center">
                <PlanetRenderer
                  color={profile.planetColor}
                  surfaceStyle={normalizePlanetSurface(profile.planetSurface)}
                  atmosphere={profile.atmosphere}
                  glow={profile.glow}
                  hasRing={profile.hasRing}
                  mood={profile.mood}
                  spaceBackground={profile.spaceBackground}
                  size={84}
                  animate
                  spin
                />
              </div>
              <div className="min-w-0 flex-1 text-center sm:text-start">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">{t('dash.eyebrow')}</p>
                <h1 className="mt-1 truncate text-3xl font-semibold">
                  {t('dash.greeting', { name: profile.displayName })}
                </h1>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="text-sm" style={{ color: profile.planetColor }} dir="ltr">
                    /{profile.username}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                      isPublished ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/10 text-white/60'
                    )}
                  >
                    {isPublished ? t('dash.live') : t('dash.draft')}
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <Link
                    href={`/${profile.username}`}
                    className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-white/90"
                  >
                    <Eye size={15} /> {t('dash.viewPlanet')}
                  </Link>
                  <Link
                    href="/create"
                    className="flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm hover:bg-white/10"
                  >
                    <Pencil size={15} /> {t('dash.edit')}
                  </Link>
                </div>
              </div>
            </section>

            {/* Stats */}
            <section className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { icon: Eye, label: t('dash.statViews'), value: data.totalViews },
                { icon: TrendingUp, label: t('dash.statViews7'), value: views7 },
                { icon: Star, label: t('dash.statStars'), value: data.stars.length },
                { icon: Sparkles, label: t('dash.statResonance'), value: totalResonance },
              ].map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                  <stat.icon size={16} className="text-white/45" />
                  <p className="mt-3 text-3xl font-semibold tabular-nums">{formatCompact(stat.value, lang)}</p>
                  <p className="text-xs text-white/50">{stat.label}</p>
                </div>
              ))}
            </section>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
              <div className="space-y-4">
                {/* Chart */}
                <section className={card}>
                  <h2 className="text-sm font-medium text-white/80">{t('dash.chartTitle')}</h2>
                  {data.totalViews === 0 ? (
                    <p className="mt-6 text-sm text-white/45">{t('dash.chartEmpty')}</p>
                  ) : null}
                  <div className="mt-5 flex h-32 items-end gap-[3px]" dir="ltr" aria-hidden={data.totalViews === 0}>
                    {series.map((d) => (
                      <div
                        key={d.day}
                        className="group relative flex-1 rounded-t-sm transition"
                        style={{
                          height: `${Math.max(4, (d.views / maxViews) * 100)}%`,
                          background: d.views ? profile.planetColor : 'rgba(255,255,255,0.07)',
                          opacity: d.views ? 0.9 : 1,
                        }}
                        title={`${d.day}: ${d.views}`}
                      />
                    ))}
                  </div>
                </section>

                {/* Share */}
                <section className={card}>
                  <h2 className="text-lg font-semibold">{t('share.title')}</h2>
                  <p className="mt-1 text-sm text-white/55">{t('share.subtitle')}</p>
                  {origin ? (
                    <SharePanel
                      className="mt-5"
                      url={planetUrl}
                      username={profile.username}
                      displayName={profile.displayName}
                      bio={profile.bio}
                      planetColor={profile.planetColor}
                      hasRing={profile.hasRing}
                      mood={profile.mood}
                      starTitles={data.stars.map((s) => s.title)}
                      onShared={markShared}
                    />
                  ) : null}
                  <p className="mt-4 text-xs text-white/40">{t('share.bioTip')}</p>
                </section>
              </div>

              <div className="space-y-4">
                {!checklistDone ? (
                  <section className={card}>
                    <h2 className="text-sm font-medium text-white/80">{t('dash.checklistTitle')}</h2>
                    <ul className="mt-4 space-y-2.5">
                      {checklist.map((item) => (
                        <li key={item.label} className="flex items-center gap-3 text-sm">
                          <span
                            className={cn(
                              'flex h-5 w-5 items-center justify-center rounded-full border',
                              item.done ? 'border-transparent bg-emerald-400 text-black' : 'border-white/25'
                            )}
                          >
                            {item.done ? <Check size={12} strokeWidth={3} /> : null}
                          </span>
                          {item.href && !item.done ? (
                            <Link href={item.href} className="text-white/80 hover:text-white">
                              {item.label}
                            </Link>
                          ) : (
                            <span className={item.done ? 'text-white/45 line-through' : 'text-white/80'}>{item.label}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                <section className={card}>
                  <h2 className="text-sm font-medium text-white/80">{t('dash.topStars')}</h2>
                  {topStars.length === 0 ? (
                    <p className="mt-4 text-sm text-white/45">{t('dash.topStarsEmpty')}</p>
                  ) : (
                    <ul className="mt-4 space-y-2">
                      {topStars.map((star) => (
                        <li key={star.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-3 py-2.5">
                          <span className="text-lg">{star.icon}</span>
                          <span className="min-w-0 flex-1 truncate text-sm">{star.title}</span>
                          <span className="flex items-center gap-1 text-xs text-white/60">
                            <Sparkles size={12} style={{ color: profile.planetColor }} /> {star.resonance_count}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className={card}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium text-white/80">{t('dash.settingsTitle')}</h2>
                    {savedFlash ? <span className="text-xs text-emerald-300">{t('dash.saved')}</span> : null}
                  </div>
                  <div className="mt-2 divide-y divide-white/5">
                    <Toggle
                      checked={isPublished}
                      onChange={(next) => {
                        setIsPublished(next);
                        updateFlags(next ? { is_published: true } : { is_published: false });
                      }}
                      label={t('dash.publishedLabel')}
                      hint={t('dash.publishedHint')}
                    />
                    <Toggle
                      checked={showInExplore}
                      onChange={(next) => {
                        setShowInExplore(next);
                        updateFlags({ show_in_explore: next });
                      }}
                      label={t('dash.exploreLabel')}
                      hint={t('dash.exploreHint')}
                      disabled={!isPublished}
                    />
                  </div>
                </section>

                <section className={card}>
                  <h2 className="text-sm font-medium text-white/80">{t('dash.account')}</h2>
                  <p className="mt-2 truncate text-sm text-white/55" dir="ltr">
                    {data.email}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={signOut}
                      className="rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
                    >
                      {t('dash.signOut')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteOpen((v) => !v)}
                      className="rounded-full px-4 py-2 text-sm text-rose-300 hover:bg-rose-500/10"
                    >
                      {t('dash.deleteAccount')}
                    </button>
                  </div>
                  {deleteOpen ? (
                    <div className="animate-sheet-up mt-4 space-y-3 rounded-2xl border border-rose-400/25 bg-rose-500/5 p-4">
                      <p className="text-sm text-rose-100/90">{t('dash.deleteConfirm')}</p>
                      <input
                        dir="ltr"
                        value={deleteText}
                        onChange={(e) => setDeleteText(e.target.value)}
                        className="w-full rounded-xl border border-white/12 bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-rose-300"
                        placeholder={t('dash.deleteWord')}
                      />
                      <button
                        type="button"
                        onClick={deleteAccount}
                        disabled={deleting || deleteText.trim() !== t('dash.deleteWord')}
                        className="w-full rounded-xl bg-rose-600 py-2.5 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-40"
                      >
                        {deleting ? t('dash.deleting') : t('dash.deleteAccount')}
                      </button>
                    </div>
                  ) : null}
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
