'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Dices, Shuffle, Sparkles } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';
import type { EditorState } from '@/lib/profile/client';
import { lookFromEditor } from '@/lib/profile/client';
import {
  ATMOSPHERES,
  EFFECTS,
  LIGHTS,
  MOODS,
  PHASES,
  RINGS,
  SPACE_BACKGROUNDS,
  SPINS,
  harmonyColors,
  hslToHex,
  withLook,
  type DesignOption,
  type PlanetDesign,
  type PlanetEffect,
  type PlanetLook,
} from '@/lib/planet/design';
import { PLANET_SURFACE_CATALOG, type PlanetSurfaceId } from '@/lib/universe/planet-surfaces';
import { UNIVERSE_THEMES } from '@/lib/universe/themes';
import { MOOD_PRESETS } from '@/lib/universe/constants';
import { planetExtent, renderBackdropStill } from '@/lib/planet/engine';
import { PlanetThumb } from '@/components/planet/PlanetThumb';
import { PlanetVisual } from '@/components/planet/Planet3D';
import { MoodAmbience } from '@/components/universe/SpaceBackdrop';
import type { PlanetAtmosphere, SpaceBackground, UniverseMood } from '@/types/database';
import { cn } from '@/lib/utils';

const TABS = ['surface', 'colors', 'atmosphere', 'rings', 'light', 'universe'] as const;
type Tab = (typeof TABS)[number];

const MAIN_COLORS = [
  '#7c8cff', '#6cd9ff', '#3b9eff', '#5fd38a', '#c8ff6a', '#ffd56c',
  '#ffb347', '#ff7a45', '#ff5e7e', '#ff7eb3', '#c78cff', '#e2e8f0',
];

const ATMO_SWATCHES = ['#7cc4ff', '#ffb37a', '#8dffc8', '#c9a6ff', '#ffffff', '#ff7a8a'];

interface PlanetStudioProps {
  state: EditorState;
  patch: (p: Partial<EditorState>) => void;
}

function label(lang: string, o: { labelEn: string; labelAr: string }) {
  return lang === 'ar' ? o.labelAr : o.labelEn;
}

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)]!;
}

/** Planet design studio: every option previews itself with a real render. */
export function PlanetStudio({ state, patch }: PlanetStudioProps) {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState<Tab>('surface');
  const look = useMemo(() => lookFromEditor(state), [state]);
  // Thumbnails lag the slider a moment so dragging stays smooth.
  const [thumbLook, setThumbLook] = useState(look);
  useEffect(() => {
    const id = window.setTimeout(() => setThumbLook(look), 160);
    return () => window.clearTimeout(id);
  }, [look]);

  const design = state.design;
  const setDesign = (d: Partial<PlanetDesign>) => patch({ design: { ...design, ...d } });

  function applyTheme(id: string) {
    const th = UNIVERSE_THEMES.find((x) => x.id === id);
    if (!th) return;
    patch({
      planetColor: th.planetColor,
      planetSurface: th.planetSurface,
      atmosphere: th.atmosphere,
      glow: th.glow,
      mood: th.mood,
      spaceBackground: th.spaceBackground,
      design: {
        color2: null,
        atmoColor: null,
        ring: 'none',
        moons: 0,
        tilt: 14,
        spin: 2,
        light: 'sun',
        phase: 'side',
        scale: 3,
        variant: design.variant,
        effects: [],
        ...th.design,
      },
    });
  }

  function surprise() {
    const hue = Math.random() * 360;
    const color = hslToHex(hue, 0.55 + Math.random() * 0.35, 0.5 + Math.random() * 0.18);
    const rings = ['none', 'none', 'none', 'classic', 'thin', 'double', 'dust', 'neon', 'ice', 'cross'] as const;
    const effects = EFFECTS.map((e) => e.id).filter(() => Math.random() < 0.22);
    patch({
      planetColor: color,
      planetSurface: pick(PLANET_SURFACE_CATALOG).id,
      atmosphere: pick(ATMOSPHERES).id,
      glow: 2 + Math.floor(Math.random() * 4),
      mood: pick(MOODS).id,
      spaceBackground: pick(SPACE_BACKGROUNDS).id,
      design: {
        color2: Math.random() < 0.7 ? pick(harmonyColors(color)) : null,
        atmoColor: null,
        ring: pick(rings),
        moons: pick([0, 0, 1, 1, 2, 3]),
        tilt: Math.round((Math.random() - 0.5) * 60),
        spin: pick([1, 2, 2, 3]),
        light: pick(['sun', 'sun', 'blue', 'red', 'binary'] as const),
        phase: pick(['front', 'side', 'side', 'side', 'back'] as const),
        scale: 2 + Math.floor(Math.random() * 3),
        variant: Math.floor(Math.random() * 10000),
        effects,
      },
    });
  }

  // Each group of thumbnails shares a scale so the planets line up.
  const bare = withLook(thumbLook, { ring: 'none', moons: 0, effects: [] });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-xl">
          <h1 className="text-3xl font-semibold tracking-tight">{t('wizard.planetTitle')}</h1>
          <p className="mt-2 text-white/55">{t('studio.hint')}</p>
        </div>
        <button
          type="button"
          onClick={surprise}
          className="flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm text-white/85 transition hover:border-white/30 hover:bg-white/10"
        >
          <Dices size={16} /> {t('wizard.surprise')}
        </button>
      </div>

      {/* presets */}
      <div>
        <p className="mb-2 text-xs text-white/45">{t('studio.presets')}</p>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
          {UNIVERSE_THEMES.map((th) => {
            const thLook = withLook(
              lookFromEditor({
                ...state,
                planetColor: th.planetColor,
                planetSurface: th.planetSurface,
                atmosphere: th.atmosphere,
                glow: th.glow,
                mood: th.mood,
                spaceBackground: th.spaceBackground,
                design: { ...design, color2: null, atmoColor: null, ring: 'none', moons: 0, effects: [], phase: 'side', light: 'sun', ...th.design },
              }),
              { moons: 0 }
            );
            return (
              <button
                key={th.id}
                type="button"
                onClick={() => applyTheme(th.id)}
                className="group flex w-[88px] shrink-0 flex-col items-center gap-1 rounded-2xl border border-white/8 bg-white/[0.03] px-1 pb-2 pt-1 transition hover:border-white/25"
              >
                <PlanetThumb look={thLook} size={72} extent={2.3} />
                <span className="line-clamp-1 text-[11px] text-white/70 group-hover:text-white">{label(lang, th)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* tabs */}
      <div className="-mx-4 border-y border-white/[0.06] bg-white/[0.02] px-4 py-2 sm:mx-0 sm:rounded-full sm:border sm:px-1.5">
        <div className="flex gap-1 overflow-x-auto [scrollbar-width:none]" role="tablist">
          {TABS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={(e) => {
                setTab(id);
                e.currentTarget.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
              }}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-2 text-sm transition',
                tab === id ? 'bg-white text-black' : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
              )}
            >
              {t(`studio.tab.${id}`)}
            </button>
          ))}
        </div>
      </div>

      {tab === 'surface' ? (
        <section className="space-y-5">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
            {PLANET_SURFACE_CATALOG.map((s) => (
              <OptionCard
                key={s.id}
                selected={state.planetSurface === s.id}
                onClick={() => patch({ planetSurface: s.id as PlanetSurfaceId })}
                title={label(lang, s)}
                sub={lang === 'ar' ? s.vibeAr : s.vibeEn}
              >
                <PlanetThumb look={withLook(bare, { surface: s.id })} size={92} extent={1.75} hoverSpin />
              </OptionCard>
            ))}
          </div>
          <div className="grid gap-4 rounded-3xl border border-white/8 bg-white/[0.02] p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <Slider
              label={t('studio.scale')}
              min={1}
              max={5}
              value={design.scale}
              onChange={(v) => setDesign({ scale: v })}
              ends={[t('studio.scaleBig'), t('studio.scaleFine')]}
              color={look.color}
            />
            <button
              type="button"
              onClick={() => setDesign({ variant: Math.floor(Math.random() * 10000) })}
              className="flex items-center justify-center gap-2 rounded-full border border-white/12 px-4 py-2.5 text-sm text-white/85 hover:border-white/30 hover:bg-white/[0.06]"
            >
              <Shuffle size={15} /> {t('studio.newPattern')}
              <span className="text-white/35" dir="ltr">
                #{String(design.variant).padStart(4, '0')}
              </span>
            </button>
          </div>
        </section>
      ) : null}

      {tab === 'colors' ? (
        <section className="space-y-6">
          <ColorRow
            title={t('studio.mainColor')}
            value={state.planetColor}
            swatches={MAIN_COLORS}
            onChange={(c) => patch({ planetColor: c })}
          />
          <ColorRow
            title={t('studio.secondColor')}
            hint={t('studio.secondHint')}
            value={look.color2}
            swatches={harmonyColors(state.planetColor)}
            auto={design.color2 === null}
            autoLabel={t('studio.auto')}
            onAuto={() => setDesign({ color2: null })}
            onChange={(c) => setDesign({ color2: c })}
          />
          <ColorRow
            title={t('studio.atmoColor')}
            value={look.atmoColor}
            swatches={ATMO_SWATCHES}
            auto={design.atmoColor === null}
            autoLabel={t('studio.auto')}
            onAuto={() => setDesign({ atmoColor: null })}
            onChange={(c) => setDesign({ atmoColor: c })}
          />
          <div className="flex items-center gap-4 rounded-3xl border border-white/8 bg-white/[0.02] p-4">
            <PlanetThumb look={thumbLook} size={96} extent={1.75} />
            <div className="flex h-10 flex-1 overflow-hidden rounded-full border border-white/10">
              {[look.color, look.color2, look.atmoColor].map((c, i) => (
                <span key={i} className="flex-1" style={{ background: c }} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {tab === 'atmosphere' ? (
        <section className="space-y-6">
          <Group title={t('studio.atmosphere')}>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {ATMOSPHERES.map((a) => (
                <OptionCard
                  key={a.id}
                  selected={state.atmosphere === a.id}
                  onClick={() => patch({ atmosphere: a.id as PlanetAtmosphere })}
                  title={label(lang, a)}
                >
                  <PlanetThumb look={withLook(bare, { atmosphere: a.id })} size={76} extent={1.75} />
                </OptionCard>
              ))}
            </div>
          </Group>
          <div className="rounded-3xl border border-white/8 bg-white/[0.02] p-4">
            <Slider
              label={t('wizard.glow')}
              min={0}
              max={5}
              value={state.glow}
              onChange={(v) => patch({ glow: v })}
              ends={[t('studio.glowNone'), t('studio.glowMax')]}
              color={look.color}
            />
          </div>
        </section>
      ) : null}

      {tab === 'rings' ? (
        <section className="space-y-6">
          <Group title={t('studio.ring')}>
            <div className="grid grid-cols-4 gap-2">
              {RINGS.map((r) => (
                <OptionCard key={r.id} selected={design.ring === r.id} onClick={() => setDesign({ ring: r.id })} title={label(lang, r)}>
                  <PlanetThumb look={withLook(thumbLook, { ring: r.id, moons: 0 })} size={76} extent={2.3} />
                </OptionCard>
              ))}
            </div>
          </Group>
          <Group title={t('studio.moons')}>
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((m) => (
                <OptionCard
                  key={m}
                  selected={design.moons === m}
                  onClick={() => setDesign({ moons: m })}
                  title={m === 0 ? t('studio.noMoons') : t(`studio.moons${m}`)}
                >
                  <PlanetThumb look={withLook(thumbLook, { moons: m, ring: 'none' })} size={76} extent={2.36} />
                </OptionCard>
              ))}
            </div>
          </Group>
          <Group title={t('studio.effects')} hint={t('studio.effectsHint')}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {EFFECTS.map((e) => {
                const on = design.effects.includes(e.id);
                const next: PlanetEffect[] = on ? design.effects.filter((x) => x !== e.id) : [...design.effects, e.id];
                return (
                  <OptionCard key={e.id} selected={on} onClick={() => setDesign({ effects: next })} title={label(lang, e)} toggle>
                    <PlanetThumb
                      look={withLook(bare, { effects: [e.id], phase: e.id === 'caps' ? 'front' : 'back' })}
                      size={76}
                      extent={1.75}
                    />
                  </OptionCard>
                );
              })}
            </div>
          </Group>
        </section>
      ) : null}

      {tab === 'light' ? (
        <section className="space-y-6">
          <Group title={t('studio.star')}>
            <div className="grid grid-cols-4 gap-2">
              {LIGHTS.map((l) => (
                <OptionCard key={l.id} selected={design.light === l.id} onClick={() => setDesign({ light: l.id })} title={label(lang, l)}>
                  <PlanetThumb look={withLook(bare, { light: l.id })} size={76} extent={1.75} />
                </OptionCard>
              ))}
            </div>
          </Group>
          <Group title={t('studio.phase')}>
            <div className="grid grid-cols-3 gap-2">
              {PHASES.map((p) => (
                <OptionCard key={p.id} selected={design.phase === p.id} onClick={() => setDesign({ phase: p.id })} title={label(lang, p)}>
                  <PlanetThumb look={withLook(bare, { phase: p.id })} size={76} extent={1.75} />
                </OptionCard>
              ))}
            </div>
          </Group>
          <div className="grid gap-4 rounded-3xl border border-white/8 bg-white/[0.02] p-4 sm:grid-cols-2">
            <Slider
              label={t('studio.tilt')}
              min={-45}
              max={45}
              value={design.tilt}
              onChange={(v) => setDesign({ tilt: v })}
              suffix="°"
              color={look.color}
            />
            <div>
              <p className="mb-2 text-sm text-white/70">{t('studio.spin')}</p>
              <div className="flex flex-wrap gap-1.5">
                {SPINS.map((s) => (
                  <Chip key={s.id} active={design.spin === Number(s.id)} onClick={() => setDesign({ spin: Number(s.id) })}>
                    {label(lang, s)}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {tab === 'universe' ? (
        <section className="space-y-6">
          <Group title={t('wizard.background')}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SPACE_BACKGROUNDS.map((b) => (
                <OptionCard
                  key={b.id}
                  selected={state.spaceBackground === b.id}
                  onClick={() => patch({ spaceBackground: b.id as SpaceBackground })}
                  title={label(lang, b)}
                  wide
                >
                  <BackdropThumb background={b.id} look={thumbLook} />
                </OptionCard>
              ))}
            </div>
          </Group>
          <Group title={t('wizard.mood')} hint={t('studio.moodHint')}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {MOODS.map((m) => (
                <OptionCard key={m.id} selected={state.mood === m.id} onClick={() => patch({ mood: m.id as UniverseMood })} title={label(lang, m)} wide>
                  <MoodThumb mood={m.id} look={thumbLook} />
                </OptionCard>
              ))}
            </div>
          </Group>
        </section>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------------ pieces

function OptionCard({
  selected,
  onClick,
  title,
  sub,
  children,
  toggle,
  wide,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  sub?: string;
  children: ReactNode;
  toggle?: boolean;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'group relative flex min-w-0 flex-col items-center rounded-2xl border px-1.5 pb-2.5 pt-1.5 text-center transition',
        selected
          ? 'border-white/70 bg-white/[0.09] shadow-[0_0_0_1px_rgba(255,255,255,0.25),0_8px_30px_-12px_rgba(140,160,255,0.55)]'
          : 'border-white/[0.07] bg-white/[0.025] hover:border-white/25 hover:bg-white/[0.05]'
      )}
    >
      <div className="flex w-full items-center justify-center">{children}</div>
      <span className="mt-1 line-clamp-1 w-full text-[12px] font-medium text-white/85">{title}</span>
      {sub ? <span className="line-clamp-1 w-full text-[10.5px] text-white/40">{sub}</span> : null}
      {toggle ? (
        <span
          className={cn(
            'absolute end-2 top-2 h-4 w-4 rounded-full border transition',
            selected ? 'border-white bg-white' : 'border-white/30'
          )}
          aria-hidden
        />
      ) : null}
    </button>
  );
}

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium text-white/85">{title}</h2>
        {hint ? <p className="text-xs text-white/40">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3.5 py-2 text-sm transition',
        active ? 'border-white bg-white text-black' : 'border-white/12 text-white/75 hover:border-white/30'
      )}
    >
      {children}
    </button>
  );
}

function Slider({
  label: text,
  min,
  max,
  value,
  onChange,
  ends,
  suffix,
  color,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  ends?: [string, string];
  suffix?: string;
  color: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between text-sm text-white/70">
        {text}
        <span className="tabular-nums text-white/45" dir="ltr">
          {value}
          {suffix ?? ''}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: color }}
      />
      {ends ? (
        <span className="mt-1 flex justify-between text-[11px] text-white/35">
          <span>{ends[0]}</span>
          <span>{ends[1]}</span>
        </span>
      ) : null}
    </label>
  );
}

function ColorRow({
  title,
  hint,
  value,
  swatches,
  onChange,
  auto,
  autoLabel,
  onAuto,
}: {
  title: string;
  hint?: string;
  value: string;
  swatches: string[];
  onChange: (c: string) => void;
  auto?: boolean;
  autoLabel?: string;
  onAuto?: () => void;
}) {
  return (
    <Group title={title} hint={hint}>
      <div className="flex flex-wrap items-center gap-2">
        {onAuto ? (
          <button
            type="button"
            onClick={onAuto}
            aria-pressed={auto}
            className={cn(
              'flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs transition',
              auto ? 'border-white bg-white text-black' : 'border-white/15 text-white/70 hover:border-white/35'
            )}
          >
            <Sparkles size={13} /> {autoLabel}
          </button>
        ) : null}
        {swatches.map((c) => {
          const active = !auto && value.toLowerCase() === c.toLowerCase();
          return (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              aria-label={c}
              aria-pressed={active}
              className={cn('h-9 w-9 rounded-full border-2 transition', active ? 'scale-110 border-white' : 'border-transparent hover:scale-105')}
              style={{ background: c, boxShadow: `0 0 14px ${c}55` }}
            />
          );
        })}
        <label className="relative flex h-9 cursor-pointer items-center gap-2 rounded-full border border-white/12 px-3 text-xs text-white/70 hover:border-white/30">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-5 w-5 cursor-pointer rounded-full border-0 bg-transparent p-0"
          />
          <span dir="ltr">{value}</span>
        </label>
      </div>
    </Group>
  );
}

function BackdropThumb({ background, look }: { background: SpaceBackground; look: PlanetLook }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    return renderBackdropStill(
      canvas,
      { background, mood: look.mood, color: look.color, color2: look.color2, seed: look.seed },
      Math.round(150 * dpr),
      Math.round(84 * dpr)
    );
  }, [background, look.mood, look.color, look.color2, look.seed]);
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl">
      <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />
      <span
        className="absolute bottom-[12%] end-[14%] h-5 w-5 rounded-full"
        style={{ background: `radial-gradient(circle at 35% 30%, #fff8, ${look.color} 45%, #0008)`, boxShadow: `0 0 12px ${look.color}66` }}
      />
    </div>
  );
}

function MoodThumb({ mood, look }: { mood: UniverseMood; look: PlanetLook }) {
  const preset = MOOD_PRESETS[mood] ?? MOOD_PRESETS.calm;
  return (
    <div
      className="relative aspect-[16/9] w-full overflow-hidden rounded-xl"
      style={{ background: `${preset.wash}, ${preset.bg}` }}
    >
      <MoodAmbience mood={mood} color={look.color} color2={look.color2} seed={`thumb-${mood}`} density={0.5} />
      <span
        className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: preset.accent, boxShadow: `0 0 18px ${preset.accent}` }}
      />
    </div>
  );
}

export type { DesignOption };

/** Floating live planet for small screens while designing */
export function StudioMiniPreview({ state, onOpen, label: aria }: { state: EditorState; onOpen: () => void; label: string }) {
  const look = useMemo(() => lookFromEditor(state), [state]);
  const size = Math.floor(108 / planetExtent(look));
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={aria}
      className="fixed bottom-[88px] end-3 z-30 flex h-[112px] w-[112px] items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#04050b]/85 shadow-[0_10px_40px_-8px_rgba(0,0,0,0.8)] backdrop-blur lg:hidden"
    >
      <PlanetVisual look={look} size={size} />
    </button>
  );
}
