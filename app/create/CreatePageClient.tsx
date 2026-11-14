'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Shuffle,
  Trash2,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/context';
import {
  EMPTY_EDITOR_STATE,
  loadPlanetForEditor,
  type EditorStar,
  type EditorState,
} from '@/lib/profile/client';
import { savePlanet } from '@/lib/profile/publish-planet';
import { LINK_TYPES, MAX_LINKS, getLinkMeta, linkDisplayText, normalizeLinkUrl } from '@/lib/links';
import { UNIVERSE_THEMES } from '@/lib/universe/themes';
import { PLANET_COLORS } from '@/lib/universe/constants';
import { PLANET_SURFACE_CATALOG, normalizePlanetSurface } from '@/lib/universe/planet-surfaces';
import { STAR_CATEGORIES, STAR_ICONS, STAR_PROMPTS, type StarPrompt } from '@/lib/universe/star-prompts';
import { PlanetSurfacePicker } from '@/components/create/PlanetSurfacePicker';
import { AtmospherePicker, BackgroundPicker, MoodPicker, StarShapePicker } from '@/components/create/VisualPickers';
import { MusicPicker } from '@/components/create/MusicPicker';
import { PlanetPreview } from '@/components/create/PlanetPreview';
import { StarMediaEditor } from '@/components/create/StarMediaEditor';
import { LinkIcon } from '@/components/links/LinkIcon';
import type { LinkType } from '@/types/database';
import { cn } from '@/lib/utils';
import './create.css';

const USERNAME_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
const STEPS = ['stepIdentity', 'stepPlanet', 'stepStars', 'stepLinks'] as const;
type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

interface StarDraft extends EditorStar {
  isNew: boolean;
  prompt?: string;
}

function newStarDraft(prompt?: StarPrompt, lang: 'en' | 'ar' = 'en'): StarDraft {
  return {
    id: crypto.randomUUID(),
    title: '',
    content: '',
    icon: prompt?.icon ?? '✦',
    visualType: 'sparkle',
    category: prompt?.category ?? null,
    linkUrl: '',
    media: null,
    isNew: true,
    prompt: prompt ? prompt[lang] : undefined,
  };
}

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

const label = 'mb-2 block text-sm font-medium text-white/85';
const input =
  'w-full rounded-xl border border-white/12 bg-black/30 px-4 py-3 text-[15px] text-white outline-none transition placeholder:text-white/30 focus:border-accent focus:bg-black/40';
const chip =
  'rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-2 text-sm text-white/80 transition hover:border-white/25 hover:bg-white/[0.08]';

export function CreatePageClient() {
  const router = useRouter();
  const { t, lang, dir } = useLanguage();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [state, setState] = useState<EditorState>(EMPTY_EDITOR_STATE);
  const [serverState, setServerState] = useState<EditorState>(EMPTY_EDITOR_STATE);
  const [originalUsername, setOriginalUsername] = useState('');
  const [step, setStep] = useState(0);
  const [draftRestored, setDraftRestored] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [starDraft, setStarDraft] = useState<StarDraft | null>(null);
  const [linkType, setLinkType] = useState<LinkType>('instagram');
  const [linkValue, setLinkValue] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const formTopRef = useRef<HTMLDivElement>(null);

  const draftKey = userId ? `orbit:draft:${userId}` : null;
  const patch = useCallback((p: Partial<EditorState>) => setState((s) => ({ ...s, ...p })), []);

  // ---------------- load ----------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await loadPlanetForEditor(supabase);
        if (cancelled) return;
        if (!loaded) {
          router.replace('/auth/sign-in?redirectTo=/create');
          return;
        }
        setUserId(loaded.userId);
        setIsEditing(loaded.isEditing);
        setServerState(loaded.state);
        setOriginalUsername(loaded.state.username);

        let initial = loaded.state;
        const rawDraft = readStorage(`orbit:draft:${loaded.userId}`);
        if (rawDraft) {
          try {
            const parsed = JSON.parse(rawDraft) as EditorState;
            if (JSON.stringify(parsed) !== JSON.stringify(loaded.state)) {
              initial = { ...loaded.state, ...parsed };
              setDraftRestored(true);
            }
          } catch {
            writeStorage(`orbit:draft:${loaded.userId}`, null);
          }
        }
        if (!initial.username) {
          const claim = readStorage('orbit:claim');
          if (claim && USERNAME_RE.test(claim)) initial = { ...initial, username: claim };
        }
        setState(initial);
      } catch (err) {
        console.error('[create] load failed:', err);
        setError(t('wizard.errSave'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, router]);

  // ---------------- autosave draft ----------------
  useEffect(() => {
    if (loading || !draftKey) return;
    const id = window.setTimeout(() => writeStorage(draftKey, JSON.stringify(state)), 600);
    return () => window.clearTimeout(id);
  }, [state, loading, draftKey]);

  // ---------------- username availability ----------------
  useEffect(() => {
    const name = state.username;
    if (!name) {
      setUsernameStatus('idle');
      return;
    }
    if (!USERNAME_RE.test(name) || name.includes('--')) {
      setUsernameStatus('invalid');
      return;
    }
    if (name === originalUsername) {
      setUsernameStatus('available');
      return;
    }
    setUsernameStatus('checking');
    const id = window.setTimeout(async () => {
      const { data, error: rpcError } = await supabase.rpc('is_username_available', { p_username: name });
      if (rpcError) {
        setUsernameStatus('idle');
        return;
      }
      setUsernameStatus(data ? 'available' : 'taken');
    }, 400);
    return () => window.clearTimeout(id);
  }, [state.username, originalUsername, supabase]);

  // ---------------- validation ----------------
  const starsValid = state.stars.length > 0;

  function goTo(next: number) {
    setError('');
    setStep(Math.max(0, Math.min(STEPS.length - 1, next)));
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function validateStep(index: number): string | null {
    if (index === 0) {
      if (!state.displayName.trim()) return t('wizard.errName');
      if (usernameStatus !== 'available' && usernameStatus !== 'checking') return t('wizard.errUsername');
    }
    if (index === 2 && !starsValid) return t('wizard.errStars');
    return null;
  }

  function next() {
    const problem = validateStep(step);
    if (problem) {
      setError(problem);
      return;
    }
    goTo(step + 1);
  }

  async function submit() {
    for (const index of [0, 2]) {
      const problem = validateStep(index);
      if (problem) {
        goTo(index);
        setError(problem);
        return;
      }
    }
    if (!userId) {
      setError(t('wizard.errNotSignedIn'));
      return;
    }

    setSaving(true);
    setError('');
    const result = await savePlanet(supabase, userId, state, { publish: !isEditing });
    if (!result.ok) {
      setSaving(false);
      if (result.code === '23505') {
        setUsernameStatus('taken');
        goTo(0);
        setError(t('wizard.taken'));
        return;
      }
      if (/reserved/i.test(result.error)) {
        goTo(0);
        setError(t('wizard.reserved'));
        return;
      }
      if (/CONTENT_BLOCKED/.test(result.error)) {
        setError(t('wizard.errBlocked'));
        return;
      }
      setError(result.error || t('wizard.errSave'));
      return;
    }

    if (draftKey) writeStorage(draftKey, null);
    writeStorage('orbit:claim', null);
    router.push(isEditing ? `/${result.username}` : `/${result.username}?published=1`);
    router.refresh();
  }

  function discardDraft() {
    if (draftKey) writeStorage(draftKey, null);
    setState(serverState);
    setDraftRestored(false);
  }

  // ---------------- planet helpers ----------------
  function applyTheme(themeId: string) {
    const theme = UNIVERSE_THEMES.find((th) => th.id === themeId);
    if (!theme) return;
    patch({
      planetColor: theme.planetColor,
      planetSurface: theme.planetSurface,
      atmosphere: theme.atmosphere,
      glow: theme.glow,
      hasRing: theme.hasRing,
      mood: theme.mood,
      spaceBackground: theme.spaceBackground,
    });
  }

  function surpriseMe() {
    const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)]!;
    patch({
      planetColor: pick(PLANET_COLORS),
      planetSurface: pick(PLANET_SURFACE_CATALOG).id,
      atmosphere: pick(['none', 'thin', 'thick', 'stormy'] as const),
      glow: 2 + Math.floor(Math.random() * 4),
      hasRing: Math.random() > 0.45,
      mood: pick(['calm', 'mysterious', 'creative', 'warm', 'futuristic', 'minimal'] as const),
      spaceBackground: pick(['deep_space', 'nebula', 'aurora', 'void'] as const),
    });
  }

  // ---------------- star helpers ----------------
  function openStar(prompt?: StarPrompt) {
    if (state.stars.length >= 20) {
      setError(t('wizard.errMaxStars'));
      return;
    }
    setError('');
    setStarDraft(newStarDraft(prompt, lang));
  }

  function saveStarDraft() {
    if (!starDraft) return;
    const title = starDraft.title.trim();
    if (!title || title.length > 60) {
      setError(t('wizard.errStarTitle'));
      return;
    }
    if (starDraft.content.length > 400) {
      setError(t('wizard.errStarContent'));
      return;
    }
    let linkUrl = '';
    if (starDraft.linkUrl.trim()) {
      const normalized = normalizeLinkUrl('website', starDraft.linkUrl);
      if (!normalized) {
        setError(t('wizard.errLink'));
        return;
      }
      linkUrl = normalized;
    }
    const { isNew, prompt: _prompt, ...star } = starDraft;
    const clean: EditorStar = { ...star, title, content: star.content.trim(), linkUrl };
    setState((s) => ({
      ...s,
      stars: isNew ? [...s.stars, clean] : s.stars.map((x) => (x.id === clean.id ? clean : x)),
    }));
    setStarDraft(null);
    setError('');
  }

  function moveStar(index: number, delta: number) {
    setState((s) => {
      const target = index + delta;
      if (target < 0 || target >= s.stars.length) return s;
      const stars = [...s.stars];
      [stars[index], stars[target]] = [stars[target]!, stars[index]!];
      return { ...s, stars };
    });
  }

  // ---------------- link helpers ----------------
  function addLink() {
    const url = normalizeLinkUrl(linkType, linkValue);
    if (!url) {
      setError(t('wizard.errLink'));
      return;
    }
    if (state.links.length >= MAX_LINKS) return;
    patch({ links: [...state.links, { type: linkType, url }] });
    setLinkValue('');
    setError('');
  }

  // ---------------- render ----------------
  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-space-void text-star-dim">
        <Loader2 className="me-2 h-5 w-5 animate-spin" /> {t('common.loading')}
      </main>
    );
  }

  const usernameHintNode = (() => {
    switch (usernameStatus) {
      case 'checking':
        return <span className="text-white/50">{t('wizard.checking')}</span>;
      case 'available':
        return (
          <span className="flex items-center gap-1 text-emerald-300">
            <Check size={14} /> {t('wizard.available')}
          </span>
        );
      case 'taken':
        return <span className="text-rose-300">{t('wizard.taken')}</span>;
      case 'invalid':
        return <span className="text-amber-200">{t('wizard.invalid')}</span>;
      default:
        return <span className="text-white/45">{t('wizard.usernameHint')}</span>;
    }
  })();

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const NextIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const isLast = step === STEPS.length - 1;
  const host = typeof window !== 'undefined' ? window.location.host : 'orbit';

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top,#141c3d_0%,#080a16_50%,#04050a_100%)] text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#06070e]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 pb-3 pt-14 sm:px-6">
          <Link
            href={isEditing ? '/dashboard' : '/'}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white"
          >
            <BackIcon size={16} /> {isEditing ? t('dash.eyebrow') : 'ORBIT'}
          </Link>
          <p className="hidden text-sm font-medium sm:block">
            {isEditing ? t('wizard.titleEdit') : t('wizard.titleNew')}
          </p>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-2 rounded-full border border-white/12 px-3 py-1.5 text-sm text-white/80 lg:hidden"
          >
            <Eye size={15} /> {t('wizard.preview')}
          </button>
          <span className="hidden w-[88px] lg:block" />
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6" aria-label="steps">
          {STEPS.map((key, i) => (
            <button
              key={key}
              type="button"
              onClick={() => (i <= step || (i > step && !validateStep(step)) ? goTo(i) : next())}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm transition',
                i === step ? 'bg-white text-black' : 'text-white/55 hover:text-white'
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[11px]',
                  i === step ? 'bg-black text-white' : i < step ? 'bg-accent text-white' : 'bg-white/10'
                )}
              >
                {i < step ? <Check size={12} /> : i + 1}
              </span>
              {t(`wizard.${key}`)}
            </button>
          ))}
        </nav>
      </header>

      <div ref={formTopRef} className="mx-auto grid max-w-6xl gap-8 px-4 pb-36 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        {/* ---------------- FORM ---------------- */}
        <section className="min-w-0">
          {draftRestored ? (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
              <span>{t('wizard.draftRestored')}</span>
              <button type="button" onClick={discardDraft} className="text-accent hover:text-white">
                {t('wizard.discardDraft')}
              </button>
            </div>
          ) : null}

          {/* STEP 1 — identity */}
          {step === 0 ? (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">{t('wizard.identityTitle')}</h1>
                <p className="mt-2 text-white/55">{t('wizard.identityHint')}</p>
              </div>
              <div>
                <label className={label} htmlFor="w-name">
                  {t('wizard.name')}
                </label>
                <input
                  id="w-name"
                  className={input}
                  value={state.displayName}
                  maxLength={60}
                  onChange={(e) => patch({ displayName: e.target.value })}
                  placeholder={t('wizard.namePlaceholder')}
                  autoComplete="name"
                />
              </div>
              <div>
                <label className={label} htmlFor="w-username">
                  {t('wizard.username')}
                </label>
                <div
                  dir="ltr"
                  className="flex items-center overflow-hidden rounded-xl border border-white/12 bg-black/30 focus-within:border-accent"
                >
                  <span className="shrink-0 ps-4 text-[15px] text-white/40">{host}/</span>
                  <input
                    id="w-username"
                    className="w-full bg-transparent py-3 pe-4 text-[15px] text-white outline-none"
                    value={state.username}
                    maxLength={30}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    onChange={(e) => patch({ username: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="aziz"
                  />
                </div>
                <p className="mt-2 text-xs">{usernameHintNode}</p>
              </div>
              <div>
                <label className={label} htmlFor="w-bio">
                  {t('wizard.bio')}
                </label>
                <textarea
                  id="w-bio"
                  className={cn(input, 'min-h-[96px] resize-y')}
                  value={state.bio}
                  maxLength={240}
                  onChange={(e) => patch({ bio: e.target.value })}
                  placeholder={t('wizard.bioPlaceholder')}
                />
                <p className="mt-1 text-end text-xs text-white/35">{state.bio.length}/240</p>
              </div>
            </div>
          ) : null}

          {/* STEP 2 — planet */}
          {step === 1 ? (
            <div className="space-y-7">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight">{t('wizard.planetTitle')}</h1>
                  <p className="mt-2 text-white/55">{t('wizard.planetHint')}</p>
                </div>
                <button type="button" onClick={surpriseMe} className={cn(chip, 'flex items-center gap-2')}>
                  <Shuffle size={15} /> {t('wizard.surprise')}
                </button>
              </div>

              <div>
                <span className={label}>{t('wizard.themes')}</span>
                <div className="flex flex-wrap gap-2">
                  {UNIVERSE_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => applyTheme(theme.id)}
                      className={cn(chip, 'flex items-center gap-2')}
                    >
                      <span className="h-3 w-3 rounded-full" style={{ background: theme.planetColor }} />
                      {lang === 'ar' ? theme.labelAr : theme.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className={label}>{t('wizard.color')}</span>
                <div className="flex flex-wrap items-center gap-2">
                  {PLANET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => patch({ planetColor: c })}
                      aria-label={c}
                      className={cn(
                        'h-9 w-9 rounded-full border-2 transition',
                        state.planetColor.toLowerCase() === c ? 'scale-110 border-white' : 'border-transparent'
                      )}
                      style={{ background: c, boxShadow: `0 0 16px ${c}66` }}
                    />
                  ))}
                  <label className="relative flex h-9 items-center gap-2 rounded-full border border-white/12 px-3 text-sm text-white/70">
                    <input
                      type="color"
                      value={state.planetColor}
                      onChange={(e) => patch({ planetColor: e.target.value })}
                      className="h-5 w-5 cursor-pointer rounded-full border-0 bg-transparent p-0"
                    />
                    <span dir="ltr">{state.planetColor}</span>
                  </label>
                </div>
              </div>

              <div>
                <span className={label}>{t('wizard.surface')}</span>
                <PlanetSurfacePicker
                  color={state.planetColor}
                  value={normalizePlanetSurface(state.planetSurface)}
                  onChange={(v) => patch({ planetSurface: v })}
                />
              </div>

              <div>
                <span className={label}>{t('wizard.atmosphere')}</span>
                <AtmospherePicker
                  color={state.planetColor}
                  value={state.atmosphere}
                  onChange={(v) => patch({ atmosphere: v })}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <span className={label}>
                    {t('wizard.glow')} — {state.glow}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={1}
                    value={state.glow}
                    onChange={(e) => patch({ glow: Number(e.target.value) })}
                    className="w-full"
                    style={{ accentColor: state.planetColor }}
                  />
                </div>
                <div>
                  <span className={label}>{t('wizard.ring')}</span>
                  <div className="flex gap-2">
                    {[true, false].map((on) => (
                      <button
                        key={String(on)}
                        type="button"
                        onClick={() => patch({ hasRing: on })}
                        className={cn(chip, state.hasRing === on && 'border-white bg-white text-black hover:bg-white')}
                      >
                        {on ? t('wizard.ringOn') : t('wizard.ringOff')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <span className={label}>{t('wizard.mood')}</span>
                <MoodPicker value={state.mood} onChange={(v) => patch({ mood: v })} />
              </div>

              <div>
                <span className={label}>{t('wizard.background')}</span>
                <BackgroundPicker value={state.spaceBackground} onChange={(v) => patch({ spaceBackground: v })} />
              </div>
            </div>
          ) : null}

          {/* STEP 3 — stars */}
          {step === 2 ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight">{t('wizard.starsTitle')}</h1>
                  <p className="mt-2 max-w-xl text-white/55">{t('wizard.starsHint')}</p>
                </div>
                <span className="text-sm text-white/45">{t('wizard.starsCount', { count: state.stars.length })}</span>
              </div>

              <div>
                <span className={label}>{t('wizard.promptsTitle')}</span>
                <div className="flex flex-wrap gap-2">
                  {STAR_PROMPTS.map((prompt) => (
                    <button
                      key={prompt.category}
                      type="button"
                      onClick={() => openStar(prompt)}
                      className={cn(chip, 'flex items-center gap-2 text-start')}
                    >
                      <span className="text-white/60">{prompt.icon}</span>
                      {prompt[lang]}
                    </button>
                  ))}
                </div>
              </div>

              {state.stars.length === 0 && !starDraft ? (
                <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-white/50">
                  {t('wizard.noStars')}
                </div>
              ) : null}

              <ul className="space-y-2">
                {state.stars.map((star, index) => (
                  <li
                    key={star.id}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-lg">
                      {star.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{star.title}</p>
                      {star.category ? (
                        <p className="text-[11px] uppercase tracking-[0.15em] text-white/40">
                          {t(`starKinds.${star.category}`)}
                        </p>
                      ) : null}
                      {star.content ? (
                        <p className="mt-1 line-clamp-2 text-sm text-white/55">{star.content}</p>
                      ) : null}
                      {star.media ? (
                        <p className="mt-1 text-[11px] text-accent">
                          {star.media.type === 'youtube'
                            ? '▶ YouTube'
                            : star.media.type === 'spotify'
                              ? '♪ Spotify'
                              : `▣ ${star.media.type === 'gallery' ? star.media.urls.length : 1}`}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveStar(index, -1)}
                        disabled={index === 0}
                        className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-25"
                        aria-label={t('wizard.moveUp')}
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStar(index, 1)}
                        disabled={index === state.stars.length - 1}
                        className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-25"
                        aria-label={t('wizard.moveDown')}
                      >
                        <ArrowDown size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setStarDraft({ ...star, isNew: false })}
                        className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
                        aria-label={t('wizard.editStar')}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => patch({ stars: state.stars.filter((s) => s.id !== star.id) })}
                        className="rounded-lg p-2 text-rose-300/70 hover:bg-rose-500/10 hover:text-rose-200"
                        aria-label={t('wizard.delete')}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {!starDraft && state.stars.length < 20 ? (
                <button
                  type="button"
                  onClick={() => openStar()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-4 text-white/70 hover:border-white/40 hover:text-white"
                >
                  <Plus size={18} /> {t('wizard.addStar')}
                </button>
              ) : null}

              {starDraft ? (
                <div className="animate-sheet-up space-y-5 rounded-3xl border border-white/15 bg-white/[0.05] p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">
                        {starDraft.isNew ? t('wizard.addStar') : t('wizard.editStar')}
                      </p>
                      {starDraft.prompt ? <p className="mt-1 text-sm text-accent">{starDraft.prompt}</p> : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => setStarDraft(null)}
                      className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white"
                      aria-label={t('wizard.cancel')}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div>
                    <label className={label} htmlFor="s-title">
                      {t('wizard.starTitle')}
                    </label>
                    <input
                      id="s-title"
                      className={input}
                      value={starDraft.title}
                      maxLength={60}
                      autoFocus
                      onChange={(e) => setStarDraft({ ...starDraft, title: e.target.value })}
                      placeholder={t('wizard.starTitlePlaceholder')}
                    />
                  </div>

                  <div>
                    <label className={label} htmlFor="s-content">
                      {t('wizard.starContent')}
                    </label>
                    <textarea
                      id="s-content"
                      className={cn(input, 'min-h-[96px] resize-y')}
                      value={starDraft.content}
                      maxLength={400}
                      onChange={(e) => setStarDraft({ ...starDraft, content: e.target.value })}
                      placeholder={t('wizard.starContentPlaceholder')}
                    />
                    <p className="mt-1 text-end text-xs text-white/35">{starDraft.content.length}/400</p>
                  </div>

                  <div>
                    <span className={label}>{t('wizard.starCategory')}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {STAR_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() =>
                            setStarDraft({ ...starDraft, category: starDraft.category === cat ? null : cat })
                          }
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-xs transition',
                            starDraft.category === cat
                              ? 'border-white bg-white text-black'
                              : 'border-white/12 text-white/70 hover:border-white/30'
                          )}
                        >
                          {t(`starKinds.${cat}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className={label}>{t('wizard.starIcon')}</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {STAR_ICONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setStarDraft({ ...starDraft, icon })}
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-xl border text-lg transition',
                            starDraft.icon === icon ? 'border-white bg-white/15' : 'border-white/10 hover:border-white/30'
                          )}
                        >
                          {icon}
                        </button>
                      ))}
                      <input
                        aria-label="emoji"
                        className="h-10 w-16 rounded-xl border border-white/10 bg-black/30 text-center text-lg outline-none focus:border-accent"
                        maxLength={4}
                        placeholder="🙂"
                        value={STAR_ICONS.includes(starDraft.icon) ? '' : starDraft.icon}
                        onChange={(e) => setStarDraft({ ...starDraft, icon: e.target.value.trim() || '✦' })}
                      />
                    </div>
                  </div>

                  <div>
                    <span className={label}>{t('wizard.starShape')}</span>
                    <StarShapePicker
                      value={starDraft.visualType}
                      onChange={(v) => setStarDraft({ ...starDraft, visualType: v })}
                    />
                  </div>

                  {userId ? (
                    <StarMediaEditor
                      userId={userId}
                      starId={starDraft.id}
                      value={starDraft.media}
                      onChange={(media) => setStarDraft((d) => (d ? { ...d, media } : d))}
                    />
                  ) : null}

                  <div>
                    <label className={label} htmlFor="s-link">
                      {t('wizard.starLink')}
                    </label>
                    <input
                      id="s-link"
                      dir="ltr"
                      className={input}
                      value={starDraft.linkUrl}
                      onChange={(e) => setStarDraft({ ...starDraft, linkUrl: e.target.value })}
                      placeholder={t('wizard.starLinkPlaceholder')}
                      inputMode="url"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setStarDraft(null)}
                      className="rounded-full px-5 py-2.5 text-sm text-white/70 hover:text-white"
                    >
                      {t('wizard.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={saveStarDraft}
                      className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-white/90"
                    >
                      {starDraft.isNew ? t('wizard.addStarConfirm') : t('wizard.saveStar')}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* STEP 4 — links & music */}
          {step === 3 ? (
            <div className="space-y-7">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">{t('wizard.linksTitle')}</h1>
                <p className="mt-2 text-white/55">{t('wizard.linksHint')}</p>
              </div>

              <ul className="space-y-2">
                {state.links.map((link, i) => {
                  const meta = getLinkMeta(link.type);
                  return (
                    <li
                      key={`${link.url}-${i}`}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
                    >
                      <span style={{ color: meta.color }}>
                        <LinkIcon type={link.type} />
                      </span>
                      <span className="text-sm text-white/50">{meta.label}</span>
                      <span className="min-w-0 flex-1 truncate text-sm" dir="ltr">
                        {linkDisplayText(link)}
                      </span>
                      <button
                        type="button"
                        onClick={() => patch({ links: state.links.filter((_, j) => j !== i) })}
                        className="rounded-lg p-2 text-white/45 hover:bg-white/10 hover:text-white"
                        aria-label={t('wizard.remove')}
                      >
                        <X size={15} />
                      </button>
                    </li>
                  );
                })}
              </ul>

              {state.links.length < MAX_LINKS ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-none">
                    {LINK_TYPES.map((meta) => (
                      <button
                        key={meta.type}
                        type="button"
                        onClick={() => setLinkType(meta.type)}
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition',
                          linkType === meta.type ? 'border-white bg-white/15' : 'border-white/10 hover:border-white/25'
                        )}
                        style={{ color: meta.color }}
                        title={meta.label}
                        aria-label={meta.label}
                      >
                        <LinkIcon type={meta.type} />
                      </button>
                    ))}
                  </div>
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      addLink();
                    }}
                  >
                    <input
                      dir="ltr"
                      className={input}
                      value={linkValue}
                      onChange={(e) => setLinkValue(e.target.value)}
                      placeholder={`${getLinkMeta(linkType).label} — ${getLinkMeta(linkType).placeholder}`}
                      aria-label={t('wizard.linkValue')}
                    />
                    <button
                      type="submit"
                      className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-medium text-black hover:bg-white/90"
                    >
                      <Plus size={16} /> {t('wizard.addLink')}
                    </button>
                  </form>
                </div>
              ) : null}

              <div>
                <span className={label}>{t('wizard.music')}</span>
                <MusicPicker
                  enabled={state.musicEnabled}
                  onEnabledChange={(v) => patch({ musicEnabled: v })}
                  musicUrl={state.musicUrl}
                  onMusicUrlChange={(v) => patch({ musicUrl: v })}
                />
              </div>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="mt-6 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          ) : null}
        </section>

        {/* ---------------- PREVIEW (desktop) ---------------- */}
        <aside className="hidden lg:block">
          <div className="sticky top-36">
            <PlanetPreview
              state={state}
              emptyName={t('create.previewPlanet')}
              emptyBio={t('create.previewBio')}
              className="h-[620px]"
            />
          </div>
        </aside>
      </div>

      {/* ---------------- BOTTOM NAV ---------------- */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/5 bg-[#06070e]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-6">
          <button
            type="button"
            onClick={() => goTo(step - 1)}
            disabled={step === 0}
            className="flex items-center gap-2 rounded-full px-4 py-3 text-sm text-white/70 hover:text-white disabled:invisible"
          >
            <BackIcon size={16} /> {t('wizard.back')}
          </button>

          <div className="flex items-center gap-2">
            {isEditing && !isLast ? (
              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="rounded-full border border-white/15 px-5 py-3 text-sm hover:bg-white/10 disabled:opacity-50"
              >
                {saving ? t('wizard.saving') : t('wizard.save')}
              </button>
            ) : null}
            {isLast ? (
              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-lg shadow-accent/25 hover:bg-accent/90 disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                {saving
                  ? isEditing
                    ? t('wizard.saving')
                    : t('wizard.publishing')
                  : isEditing
                    ? t('wizard.save')
                    : t('wizard.publish')}
              </button>
            ) : (
              <button
                type="button"
                onClick={next}
                className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black hover:bg-white/90"
              >
                {t('wizard.next')} <NextIcon size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- PREVIEW (mobile overlay) ---------------- */}
      {previewOpen ? (
        <div className="animate-fade-in fixed inset-0 z-50 flex flex-col bg-black/80 p-3 backdrop-blur-sm lg:hidden">
          <PlanetPreview
            state={state}
            emptyName={t('create.previewPlanet')}
            emptyBio={t('create.previewBio')}
            className="min-h-0 flex-1"
          />
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            className="mt-3 rounded-full bg-white py-3.5 text-sm font-medium text-black"
          >
            {t('wizard.hidePreview')}
          </button>
        </div>
      ) : null}
    </main>
  );
}
