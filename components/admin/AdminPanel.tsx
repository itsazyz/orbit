'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import type { AdminDashboardPayload } from '@/lib/admin/dashboard-data';
import {
  saveHomepageContent,
  saveSiteSettings,
  saveVisualPresets,
  setPlanetPublished,
  setPlanetVisibility,
  deleteUserPlanet,
} from '@/lib/actions/admin';
import { DEFAULT_HOMEPAGE_CONTENT, DEFAULT_SITE_SETTINGS } from '@/lib/site-config/defaults';
import {
  STAR_VISUAL_OPTIONS,
  PLANET_SURFACE_OPTIONS,
  PLANET_MOOD_OPTIONS,
} from '@/lib/universe/visual-styles';
import type {
  HomepageContentConfig,
  SiteSettingsConfig,
  VisualPresetsConfig,
} from '@/lib/site-config/types';
import { AdminCard, AdminField, AdminTabs, type AdminTab } from './AdminUi';

interface AdminPanelProps {
  data: AdminDashboardPayload;
}

export function AdminPanel({ data }: AdminPanelProps) {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();

  const [presets, setPresets] = useState<VisualPresetsConfig>(data.presets);
  const [homepage, setHomepage] = useState<HomepageContentConfig>(data.homepage);
  const [settings, setSettings] = useState<SiteSettingsConfig>(data.siteSettings);
  const [users, setUsers] = useState(data.users);
  const [planets, setPlanets] = useState(data.planets);

  const publishedPlanets = useMemo(
    () => planets.filter((planet) => planet.isPublished),
    [planets]
  );

  function notify(text: string) {
    setMessage(text);
  }

  function savePresets() {
    startTransition(async () => {
      try {
        await saveVisualPresets(presets);
        notify('Visual presets saved. Create page will update immediately.');
      } catch (e) {
        notify(e instanceof Error ? e.message : 'Save failed.');
      }
    });
  }

  function saveHomepage() {
    startTransition(async () => {
      try {
        await saveHomepageContent(homepage);
        notify('Homepage saved. Visit / to preview.');
      } catch (e) {
        notify(e instanceof Error ? e.message : 'Save failed.');
      }
    });
  }

  function saveSettings() {
    startTransition(async () => {
      try {
        await saveSiteSettings(settings);
        notify('Site settings saved.');
      } catch (e) {
        notify(e instanceof Error ? e.message : 'Save failed.');
      }
    });
  }

  function togglePublish(profileId: string, next: boolean) {
    startTransition(async () => {
      try {
        await setPlanetPublished(profileId, next);
        setPlanets((current) =>
          current.map((planet) =>
            planet.id === profileId ? { ...planet, isPublished: next } : planet
          )
        );
        setUsers((current) =>
          current.map((user) =>
            user.id === profileId ? { ...user, isPublished: next } : user
          )
        );
        notify(next ? 'Planet published.' : 'Planet unpublished.');
      } catch (e) {
        notify(e instanceof Error ? e.message : 'Update failed.');
      }
    });
  }

  function toggleVisibility(profileId: string, next: 'public' | 'private') {
    startTransition(async () => {
      try {
        await setPlanetVisibility(profileId, next);
        setPlanets((current) =>
          current.map((planet) =>
            planet.id === profileId ? { ...planet, visibility: next } : planet
          )
        );
        notify(`Visibility set to ${next}.`);
      } catch (e) {
        notify(e instanceof Error ? e.message : 'Update failed.');
      }
    });
  }

  function resetPlanet(profileId: string) {
    if (!confirm('Unpublish this planet and remove all stars?')) return;

    startTransition(async () => {
      try {
        await deleteUserPlanet(profileId);
        setPlanets((current) =>
          current.map((planet) =>
            planet.id === profileId
              ? { ...planet, isPublished: false, visibility: 'private', starCount: 0 }
              : planet
          )
        );
        setUsers((current) =>
          current.map((user) =>
            user.id === profileId
              ? { ...user, isPublished: false, starCount: 0 }
              : user
          )
        );
        notify('Planet reset (unpublished, stars removed).');
      } catch (e) {
        notify(e instanceof Error ? e.message : 'Reset failed.');
      }
    });
  }

  function addPresetRow(kind: 'starTypes' | 'planetSurfaces' | 'planetMoods') {
    const id = `custom_${Date.now()}`;
    setPresets((current) => ({
      ...current,
      [kind]: [...current[kind], { id, labelEn: 'New option', labelAr: 'خيار جديد' }],
    }));
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 text-white">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm tracking-[0.3em] text-violet-400">ORBIT CONTROL</p>
          <h1 className="mt-2 text-3xl font-light">Admin dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage users, planets, homepage, and create-flow presets
          </p>
        </div>
        <Link href="/" className="text-sm text-slate-400 hover:text-white">
          ← View site
        </Link>
      </header>

      <AdminTabs active={tab} onChange={setTab} />

      <div className="mt-8 space-y-8">
        {tab === 'overview' ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Registered users', value: data.stats.totalUsers },
                { label: 'Profiles', value: data.stats.totalProfiles },
                { label: 'Published planets', value: data.stats.publishedProfiles },
                { label: 'Total stars', value: data.stats.totalStars },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <p className="text-sm text-slate-400">{item.label}</p>
                  <p className="mt-2 text-3xl font-semibold">{item.value}</p>
                </div>
              ))}
            </section>

            <AdminCard title="Recent planets" description="Latest published worlds">
              <ul className="space-y-2">
                {publishedPlanets.slice(0, 8).map((planet) => (
                  <li
                    key={planet.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-black/20 px-3 py-2 text-sm"
                  >
                    <span>
                      {planet.displayName}{' '}
                      <span className="text-slate-500">orbit/{planet.username}</span>
                    </span>
                    <Link
                      href={`/${planet.username}`}
                      className="text-violet-300 hover:text-white"
                      target="_blank"
                    >
                      View →
                    </Link>
                  </li>
                ))}
                {publishedPlanets.length === 0 ? (
                  <p className="text-sm text-slate-500">No published planets yet.</p>
                ) : null}
              </ul>
            </AdminCard>
          </>
        ) : null}

        {tab === 'users' ? (
          <AdminCard title="Registered users" description="All profiles linked to auth accounts">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Username</th>
                    <th className="pb-3 pr-4">Stars</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-white/5">
                      <td className="py-3 pr-4 text-slate-300">{user.email}</td>
                      <td className="py-3 pr-4">orbit/{user.username}</td>
                      <td className="py-3 pr-4">{user.starCount}</td>
                      <td className="py-3 pr-4">
                        {user.isPublished ? 'Published' : 'Draft'}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          {user.isPublished ? (
                            <Link
                              href={`/${user.username}`}
                              target="_blank"
                              className="text-violet-300 hover:text-white"
                            >
                              View
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => togglePublish(user.id, !user.isPublished)}
                            className="text-slate-400 hover:text-white"
                          >
                            {user.isPublished ? 'Unpublish' : 'Publish'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminCard>
        ) : null}

        {tab === 'planets' ? (
          <AdminCard title="All planets" description="Moderate content and visibility">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="pb-3 pr-4">Planet</th>
                    <th className="pb-3 pr-4">Stars</th>
                    <th className="pb-3 pr-4">Music</th>
                    <th className="pb-3 pr-4">Visibility</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {planets.map((planet) => (
                    <tr key={planet.id} className="border-t border-white/5">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-full"
                            style={{ background: planet.planetColor }}
                          />
                          <span>
                            {planet.displayName}{' '}
                            <span className="text-slate-500">/{planet.username}</span>
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">{planet.starCount}</td>
                      <td className="py-3 pr-4">
                        {planet.musicEnabled ? 'On' : 'Off'}
                      </td>
                      <td className="py-3 pr-4">{planet.visibility}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          {planet.isPublished ? (
                            <Link
                              href={`/${planet.username}`}
                              target="_blank"
                              className="text-violet-300"
                            >
                              View
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            onClick={() =>
                              toggleVisibility(
                                planet.id,
                                planet.visibility === 'public' ? 'private' : 'public'
                              )
                            }
                            className="text-slate-400 hover:text-white"
                          >
                            Toggle visibility
                          </button>
                          <button
                            type="button"
                            onClick={() => resetPlanet(planet.id)}
                            className="text-red-300 hover:text-red-200"
                          >
                            Reset
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminCard>
        ) : null}

        {tab === 'presets' ? (
          <AdminCard
            title="Create flow presets"
            description="Star shapes, planet surfaces, and moods shown on /create"
          >
            {(['starTypes', 'planetSurfaces', 'planetMoods'] as const).map((kind) => (
              <div key={kind} className="mb-8">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-medium capitalize text-violet-300">
                    {kind.replace(/([A-Z])/g, ' $1')}
                  </h3>
                  <button
                    type="button"
                    onClick={() => addPresetRow(kind)}
                    className="text-sm text-violet-400 hover:text-violet-200"
                  >
                    + Add
                  </button>
                </div>
                <ul className="space-y-2">
                  {presets[kind].map((item, index) => (
                    <li key={`${kind}-${index}`} className="grid grid-cols-3 gap-2">
                      <input
                        value={item.id}
                        onChange={(e) => {
                          const next = [...presets[kind]];
                          next[index] = { ...item, id: e.target.value };
                          setPresets({ ...presets, [kind]: next });
                        }}
                        className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-xs"
                      />
                      <input
                        value={item.labelEn}
                        onChange={(e) => {
                          const next = [...presets[kind]];
                          next[index] = { ...item, labelEn: e.target.value };
                          setPresets({ ...presets, [kind]: next });
                        }}
                        className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
                      />
                      <input
                        value={item.labelAr}
                        onChange={(e) => {
                          const next = [...presets[kind]];
                          next[index] = { ...item, labelAr: e.target.value };
                          setPresets({ ...presets, [kind]: next });
                        }}
                        dir="rtl"
                        className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={savePresets}
                className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium hover:bg-violet-500 disabled:opacity-50"
              >
                {pending ? 'Saving…' : 'Save presets'}
              </button>
              <button
                type="button"
                onClick={() =>
                  setPresets({
                    starTypes: STAR_VISUAL_OPTIONS,
                    planetSurfaces: PLANET_SURFACE_OPTIONS,
                    planetMoods: PLANET_MOOD_OPTIONS,
                  })
                }
                className="rounded-xl border border-white/15 px-5 py-2.5 text-sm hover:bg-white/5"
              >
                Reset defaults
              </button>
            </div>
          </AdminCard>
        ) : null}

        {tab === 'homepage' ? (
          <AdminCard title="Homepage content" description="Edit landing page copy (EN + AR)">
            <div className="grid gap-4 md:grid-cols-2">
              <AdminField
                label="Site name"
                value={homepage.siteName}
                onChange={(siteName) => setHomepage({ ...homepage, siteName })}
              />
              <AdminField
                label="Demo domain"
                value={homepage.demoDomain}
                onChange={(demoDomain) => setHomepage({ ...homepage, demoDomain })}
              />
              <AdminField
                label="Hero planet color"
                value={homepage.heroPlanet.color}
                onChange={(color) =>
                  setHomepage({
                    ...homepage,
                    heroPlanet: { ...homepage.heroPlanet, color },
                  })
                }
              />
            </div>

            {(['en', 'ar'] as const).map((lang) => (
              <div key={lang} className="mt-8 space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-300">
                  {lang === 'en' ? 'English' : 'Arabic'}
                </h3>
                {(
                  [
                    'heroTitle',
                    'heroSubtitle',
                    'section1Title',
                    'section1Desc',
                    'section2Title',
                    'section2Desc',
                    'footerTagline',
                    'footerCta',
                  ] as const
                ).map((field) => (
                  <AdminField
                    key={`${lang}-${field}`}
                    label={field}
                    value={homepage[lang][field] ?? ''}
                    dir={lang === 'ar' ? 'rtl' : 'ltr'}
                    multiline={field.includes('Desc') || field.includes('Subtitle')}
                    onChange={(value) =>
                      setHomepage({
                        ...homepage,
                        [lang]: { ...homepage[lang], [field]: value },
                      })
                    }
                  />
                ))}
                <AdminField
                  label="Examples (comma separated)"
                  value={homepage.examples[lang].join(', ')}
                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                  onChange={(value) =>
                    setHomepage({
                      ...homepage,
                      examples: {
                        ...homepage.examples,
                        [lang]: value
                          .split(',')
                          .map((item) => item.trim())
                          .filter(Boolean),
                      },
                    })
                  }
                />
              </div>
            ))}

            <button
              type="button"
              disabled={pending}
              onClick={saveHomepage}
              className="mt-6 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium hover:bg-violet-500 disabled:opacity-50"
            >
              {pending ? 'Saving…' : 'Save homepage'}
            </button>
            <button
              type="button"
              onClick={() => setHomepage(DEFAULT_HOMEPAGE_CONTENT)}
              className="ms-3 rounded-xl border border-white/15 px-5 py-2.5 text-sm hover:bg-white/5"
            >
              Reset defaults
            </button>
          </AdminCard>
        ) : null}

        {tab === 'settings' ? (
          <AdminCard title="Site settings" description="Maintenance mode and announcements">
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) =>
                    setSettings({ ...settings, maintenanceMode: e.target.checked })
                  }
                />
                Maintenance mode (shows maintenance page on homepage)
              </label>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={settings.allowSignups}
                  onChange={(e) =>
                    setSettings({ ...settings, allowSignups: e.target.checked })
                  }
                />
                Allow new sign-ups
              </label>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={settings.showAnnouncement}
                  onChange={(e) =>
                    setSettings({ ...settings, showAnnouncement: e.target.checked })
                  }
                />
                Show announcement banner on homepage
              </label>
              <AdminField
                label="Maintenance message (EN)"
                value={settings.maintenanceMessageEn}
                onChange={(maintenanceMessageEn) =>
                  setSettings({ ...settings, maintenanceMessageEn })
                }
              />
              <AdminField
                label="Maintenance message (AR)"
                value={settings.maintenanceMessageAr}
                dir="rtl"
                onChange={(maintenanceMessageAr) =>
                  setSettings({ ...settings, maintenanceMessageAr })
                }
              />
              <AdminField
                label="Announcement (EN)"
                value={settings.announcementEn}
                onChange={(announcementEn) => setSettings({ ...settings, announcementEn })}
              />
              <AdminField
                label="Announcement (AR)"
                value={settings.announcementAr}
                dir="rtl"
                onChange={(announcementAr) => setSettings({ ...settings, announcementAr })}
              />
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={saveSettings}
              className="mt-6 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium hover:bg-violet-500 disabled:opacity-50"
            >
              {pending ? 'Saving…' : 'Save settings'}
            </button>
            <button
              type="button"
              onClick={() => setSettings(DEFAULT_SITE_SETTINGS)}
              className="ms-3 rounded-xl border border-white/15 px-5 py-2.5 text-sm hover:bg-white/5"
            >
              Reset defaults
            </button>
          </AdminCard>
        ) : null}
      </div>

      {message ? (
        <p className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-violet-600/90 px-5 py-2 text-sm shadow-lg">
          {message}
        </p>
      ) : null}
    </div>
  );
}
