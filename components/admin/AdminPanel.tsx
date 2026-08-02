'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { AdminStats } from '@/lib/actions/admin';
import { saveVisualPresets } from '@/lib/actions/admin';
import {
  STAR_VISUAL_OPTIONS,
  PLANET_SURFACE_OPTIONS,
  type VisualPresetOption,
} from '@/lib/universe/visual-styles';

interface AdminPanelProps {
  stats: AdminStats;
  initialPresets: {
    starTypes: VisualPresetOption[];
    planetSurfaces: VisualPresetOption[];
  };
}

export function AdminPanel({ stats, initialPresets }: AdminPanelProps) {
  const [starTypes, setStarTypes] = useState(initialPresets.starTypes);
  const [planetSurfaces, setPlanetSurfaces] = useState(initialPresets.planetSurfaces);
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();

  function addStarType() {
    const id = `custom_${Date.now()}`;
    setStarTypes((current) => [
      ...current,
      { id, labelEn: 'New shape', labelAr: 'شكل جديد' },
    ]);
  }

  function addPlanetSurface() {
    const id = `custom_${Date.now()}`;
    setPlanetSurfaces((current) => [
      ...current,
      { id, labelEn: 'New surface', labelAr: 'سطح جديد' },
    ]);
  }

  function save() {
    setMessage('');
    startTransition(async () => {
      try {
        await saveVisualPresets({ starTypes, planetSurfaces });
        setMessage('Saved successfully.');
      } catch (e) {
        setMessage(e instanceof Error ? e.message : 'Save failed.');
      }
    });
  }

  function resetDefaults() {
    setStarTypes(STAR_VISUAL_OPTIONS);
    setPlanetSurfaces(PLANET_SURFACE_OPTIONS);
    setMessage('Reset to defaults — click Save to apply.');
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 text-white">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm tracking-[0.3em] text-violet-400">ORBIT CONTROL</p>
          <h1 className="mt-2 text-3xl font-light">Operations dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Private admin — linked to your account only</p>
        </div>
        <Link href="/" className="text-sm text-slate-400 hover:text-white">
          ← Home
        </Link>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Registered users', value: stats.totalUsers },
          { label: 'Profiles created', value: stats.totalProfiles },
          { label: 'Published planets', value: stats.publishedProfiles },
          { label: 'Total stars', value: stats.totalStars },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
          >
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <h2 className="text-xl font-medium">Visual customization presets</h2>
        <p className="mt-1 text-sm text-slate-400">
          Edit labels and add new star/planet style options shown in the create flow.
        </p>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium text-violet-300">Star shapes</h3>
              <button
                type="button"
                onClick={addStarType}
                className="text-sm text-violet-400 hover:text-violet-200"
              >
                + Add
              </button>
            </div>
            <ul className="space-y-2">
              {starTypes.map((item, index) => (
                <li key={item.id} className="grid grid-cols-3 gap-2">
                  <input
                    value={item.id}
                    onChange={(e) => {
                      const next = [...starTypes];
                      next[index] = { ...item, id: e.target.value };
                      setStarTypes(next);
                    }}
                    className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-xs"
                    placeholder="id"
                  />
                  <input
                    value={item.labelEn}
                    onChange={(e) => {
                      const next = [...starTypes];
                      next[index] = { ...item, labelEn: e.target.value };
                      setStarTypes(next);
                    }}
                    className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
                    placeholder="English"
                  />
                  <input
                    value={item.labelAr}
                    onChange={(e) => {
                      const next = [...starTypes];
                      next[index] = { ...item, labelAr: e.target.value };
                      setStarTypes(next);
                    }}
                    className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
                    placeholder="Arabic"
                    dir="rtl"
                  />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium text-violet-300">Planet surfaces</h3>
              <button
                type="button"
                onClick={addPlanetSurface}
                className="text-sm text-violet-400 hover:text-violet-200"
              >
                + Add
              </button>
            </div>
            <ul className="space-y-2">
              {planetSurfaces.map((item, index) => (
                <li key={item.id} className="grid grid-cols-3 gap-2">
                  <input
                    value={item.id}
                    onChange={(e) => {
                      const next = [...planetSurfaces];
                      next[index] = { ...item, id: e.target.value };
                      setPlanetSurfaces(next);
                    }}
                    className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-xs"
                  />
                  <input
                    value={item.labelEn}
                    onChange={(e) => {
                      const next = [...planetSurfaces];
                      next[index] = { ...item, labelEn: e.target.value };
                      setPlanetSurfaces(next);
                    }}
                    className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
                  />
                  <input
                    value={item.labelAr}
                    onChange={(e) => {
                      const next = [...planetSurfaces];
                      next[index] = { ...item, labelAr: e.target.value };
                      setPlanetSurfaces(next);
                    }}
                    className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
                    dir="rtl"
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium hover:bg-violet-500 disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Save presets'}
          </button>
          <button
            type="button"
            onClick={resetDefaults}
            className="rounded-xl border border-white/15 px-5 py-2.5 text-sm hover:bg-white/5"
          >
            Reset defaults
          </button>
        </div>

        {message ? <p className="mt-4 text-sm text-violet-300">{message}</p> : null}
      </section>
    </div>
  );
}
