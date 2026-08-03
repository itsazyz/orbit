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
import { useLanguage } from '@/lib/i18n/context';
import { interpolate } from '@/lib/i18n';
import { AdminCard, AdminField, AdminTabs, type AdminTab } from './AdminUi';

interface AdminPanelProps {
  data: AdminDashboardPayload;
}

export function AdminPanel({ data }: AdminPanelProps) {
  const { t, dir } = useLanguage();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();

  const [presets, setPresets] = useState<VisualPresetsConfig>(data.presets);
  const [homepage, setHomepage] = useState<HomepageContentConfig>(data.homepage);
  const [settings, setSettings] = useState<SiteSettingsConfig>(data.siteSettings);
  const [users, setUsers] = useState(data.users);
  const [planets, setPlanets] = useState(data.planets);

  const tabLabels: Record<AdminTab, string> = {
    overview: t('admin.tabs.overview'),
    users: t('admin.tabs.users'),
    planets: t('admin.tabs.planets'),
    presets: t('admin.tabs.presets'),
    homepage: t('admin.tabs.homepage'),
    settings: t('admin.tabs.settings'),
  };

  const publishedPlanets = useMemo(
    () => planets.filter((planet) => planet.isPublished),
    [planets]
  );

  function notify(text: string) {
    setMessage(text);
  }

  function savePresets() {
    startTransition(async () => {
      const result = await saveVisualPresets(presets);
      if (!result.ok) {
        notify(result.error || t('admin.messages.saveFailed'));
        return;
      }
      notify(t('admin.messages.presetsSaved'));
    });
  }

  function saveHomepage() {
    startTransition(async () => {
      const result = await saveHomepageContent(homepage);
      if (!result.ok) {
        notify(result.error || t('admin.messages.saveFailed'));
        return;
      }
      notify(t('admin.messages.homepageSaved'));
    });
  }

  function saveSettings() {
    startTransition(async () => {
      const payload: SiteSettingsConfig = {
        maintenanceMode: !!settings.maintenanceMode,
        maintenanceMessageEn: String(settings.maintenanceMessageEn ?? ''),
        maintenanceMessageAr: String(settings.maintenanceMessageAr ?? ''),
        allowSignups: !!settings.allowSignups,
        showAnnouncement: !!settings.showAnnouncement,
        announcementEn: String(settings.announcementEn ?? ''),
        announcementAr: String(settings.announcementAr ?? ''),
      };

      const result = await saveSiteSettings(payload);
      if (!result.ok) {
        notify(result.error || t('admin.messages.saveFailed'));
        return;
      }

      setSettings(payload);
      notify(t('admin.messages.settingsSaved'));
    });
  }

  function togglePublish(profileId: string, next: boolean) {
    startTransition(async () => {
      const result = await setPlanetPublished(profileId, next);
      if (!result.ok) {
        notify(result.error || t('admin.messages.updateFailed'));
        return;
      }
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
      notify(next ? t('admin.messages.planetPublished') : t('admin.messages.planetUnpublished'));
    });
  }

  function toggleVisibility(profileId: string, next: 'public' | 'private') {
    startTransition(async () => {
      const result = await setPlanetVisibility(profileId, next);
      if (!result.ok) {
        notify(result.error || t('admin.messages.updateFailed'));
        return;
      }
      setPlanets((current) =>
        current.map((planet) =>
          planet.id === profileId ? { ...planet, visibility: next } : planet
        )
      );
      notify(interpolate(t('admin.messages.visibilitySet'), { value: next }));
    });
  }

  function resetPlanet(profileId: string) {
    if (!confirm(t('admin.planets.confirmReset'))) return;

    startTransition(async () => {
      const result = await deleteUserPlanet(profileId);
      if (!result.ok) {
        notify(result.error || t('admin.messages.resetFailed'));
        return;
      }
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
      notify(t('admin.messages.planetReset'));
    });
  }

  function addPresetRow(kind: 'starTypes' | 'planetSurfaces' | 'planetMoods') {
    const id = `custom_${Date.now()}`;
    setPresets((current) => ({
      ...current,
      [kind]: [
        ...current[kind],
        { id, labelEn: t('admin.presets.newOptionEn'), labelAr: t('admin.presets.newOptionAr') },
      ],
    }));
  }

  const homepageFields = [
    'heroTitle',
    'heroSubtitle',
    'section1Title',
    'section1Desc',
    'section2Title',
    'section2Desc',
    'footerTagline',
    'footerCta',
  ] as const;

  return (
    <div dir={dir} className="mx-auto max-w-6xl px-6 py-12 text-white">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm tracking-[0.3em] text-violet-400">{t('admin.eyebrow')}</p>
          <h1 className="mt-2 text-3xl font-light">{t('admin.title')}</h1>
          <p className="mt-1 text-sm text-slate-400">{t('admin.subtitle')}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-slate-400 hover:text-white">
            {t('admin.viewSite')}
          </Link>
        </div>
      </header>

      <AdminTabs active={tab} onChange={setTab} labels={tabLabels} />

      <div className="mt-8 space-y-8">
        {tab === 'overview' ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: t('admin.stats.users'), value: data.stats.totalUsers },
                { label: t('admin.stats.profiles'), value: data.stats.totalProfiles },
                { label: t('admin.stats.published'), value: data.stats.publishedProfiles },
                { label: t('admin.stats.stars'), value: data.stats.totalStars },
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

            <AdminCard
              title={t('admin.overview.recentTitle')}
              description={t('admin.overview.recentDesc')}
            >
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
                      {t('admin.overview.view')}
                    </Link>
                  </li>
                ))}
                {publishedPlanets.length === 0 ? (
                  <p className="text-sm text-slate-500">{t('admin.overview.empty')}</p>
                ) : null}
              </ul>
            </AdminCard>
          </>
        ) : null}

        {tab === 'users' ? (
          <AdminCard title={t('admin.users.title')} description={t('admin.users.desc')}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-start text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="pb-3 pe-4">{t('admin.users.email')}</th>
                    <th className="pb-3 pe-4">{t('admin.users.username')}</th>
                    <th className="pb-3 pe-4">{t('admin.users.stars')}</th>
                    <th className="pb-3 pe-4">{t('admin.users.status')}</th>
                    <th className="pb-3">{t('admin.users.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-white/5">
                      <td className="py-3 pe-4 text-slate-300">{user.email}</td>
                      <td className="py-3 pe-4">orbit/{user.username}</td>
                      <td className="py-3 pe-4">{user.starCount}</td>
                      <td className="py-3 pe-4">
                        {user.isPublished ? t('admin.users.published') : t('admin.users.draft')}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          {user.isPublished ? (
                            <Link
                              href={`/${user.username}`}
                              target="_blank"
                              className="text-violet-300 hover:text-white"
                            >
                              {t('admin.users.view')}
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => togglePublish(user.id, !user.isPublished)}
                            className="text-slate-400 hover:text-white"
                          >
                            {user.isPublished
                              ? t('admin.users.unpublish')
                              : t('admin.users.publish')}
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
          <AdminCard title={t('admin.planets.title')} description={t('admin.planets.desc')}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-start text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="pb-3 pe-4">{t('admin.planets.planet')}</th>
                    <th className="pb-3 pe-4">{t('admin.planets.stars')}</th>
                    <th className="pb-3 pe-4">{t('admin.planets.music')}</th>
                    <th className="pb-3 pe-4">{t('admin.planets.visibility')}</th>
                    <th className="pb-3">{t('admin.planets.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {planets.map((planet) => (
                    <tr key={planet.id} className="border-t border-white/5">
                      <td className="py-3 pe-4">
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
                      <td className="py-3 pe-4">{planet.starCount}</td>
                      <td className="py-3 pe-4">
                        {planet.musicEnabled ? t('admin.planets.on') : t('admin.planets.off')}
                      </td>
                      <td className="py-3 pe-4">{planet.visibility}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          {planet.isPublished ? (
                            <Link
                              href={`/${planet.username}`}
                              target="_blank"
                              className="text-violet-300"
                            >
                              {t('admin.planets.view')}
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
                            {t('admin.planets.toggleVisibility')}
                          </button>
                          <button
                            type="button"
                            onClick={() => resetPlanet(planet.id)}
                            className="text-red-300 hover:text-red-200"
                          >
                            {t('admin.planets.reset')}
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
          <AdminCard title={t('admin.presets.title')} description={t('admin.presets.desc')}>
            {(['starTypes', 'planetSurfaces', 'planetMoods'] as const).map((kind) => (
              <div key={kind} className="mb-8">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-medium text-violet-300">
                    {t(`admin.presets.kinds.${kind}`)}
                  </h3>
                  <button
                    type="button"
                    onClick={() => addPresetRow(kind)}
                    className="text-sm text-violet-400 hover:text-violet-200"
                  >
                    {t('admin.presets.add')}
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
                {pending ? t('admin.presets.saving') : t('admin.presets.save')}
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
                {t('admin.presets.reset')}
              </button>
            </div>
          </AdminCard>
        ) : null}

        {tab === 'homepage' ? (
          <AdminCard title={t('admin.homepage.title')} description={t('admin.homepage.desc')}>
            <div className="grid gap-4 md:grid-cols-2">
              <AdminField
                label={t('admin.homepage.siteName')}
                value={homepage.siteName}
                onChange={(siteName) => setHomepage({ ...homepage, siteName })}
              />
              <AdminField
                label={t('admin.homepage.demoDomain')}
                value={homepage.demoDomain}
                onChange={(demoDomain) => setHomepage({ ...homepage, demoDomain })}
              />
              <AdminField
                label={t('admin.homepage.heroColor')}
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
                  {lang === 'en' ? t('admin.homepage.english') : t('admin.homepage.arabic')}
                </h3>
                {homepageFields.map((field) => (
                  <AdminField
                    key={`${lang}-${field}`}
                    label={t(`admin.homepage.fields.${field}`)}
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
                  label={t('admin.homepage.examples')}
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
              {pending ? t('admin.homepage.saving') : t('admin.homepage.save')}
            </button>
            <button
              type="button"
              onClick={() => setHomepage(DEFAULT_HOMEPAGE_CONTENT)}
              className="ms-3 rounded-xl border border-white/15 px-5 py-2.5 text-sm hover:bg-white/5"
            >
              {t('admin.homepage.reset')}
            </button>
          </AdminCard>
        ) : null}

        {tab === 'settings' ? (
          <AdminCard title={t('admin.settings.title')} description={t('admin.settings.desc')}>
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) =>
                    setSettings({ ...settings, maintenanceMode: e.target.checked })
                  }
                />
                {t('admin.settings.maintenance')}
              </label>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={settings.allowSignups}
                  onChange={(e) =>
                    setSettings({ ...settings, allowSignups: e.target.checked })
                  }
                />
                {t('admin.settings.allowSignups')}
              </label>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={settings.showAnnouncement}
                  onChange={(e) =>
                    setSettings({ ...settings, showAnnouncement: e.target.checked })
                  }
                />
                {t('admin.settings.announcement')}
              </label>
              <AdminField
                label={t('admin.settings.maintenanceEn')}
                value={settings.maintenanceMessageEn}
                onChange={(maintenanceMessageEn) =>
                  setSettings({ ...settings, maintenanceMessageEn })
                }
              />
              <AdminField
                label={t('admin.settings.maintenanceAr')}
                value={settings.maintenanceMessageAr}
                dir="rtl"
                onChange={(maintenanceMessageAr) =>
                  setSettings({ ...settings, maintenanceMessageAr })
                }
              />
              <AdminField
                label={t('admin.settings.announcementEn')}
                value={settings.announcementEn ?? ''}
                multiline
                onChange={(announcementEn) =>
                  setSettings({ ...settings, announcementEn })
                }
              />
              <AdminField
                label={t('admin.settings.announcementAr')}
                value={settings.announcementAr ?? ''}
                dir="rtl"
                multiline
                onChange={(announcementAr) =>
                  setSettings({ ...settings, announcementAr })
                }
              />
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={saveSettings}
              className="mt-6 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium hover:bg-violet-500 disabled:opacity-50"
            >
              {pending ? t('admin.settings.saving') : t('admin.settings.save')}
            </button>
            <button
              type="button"
              onClick={() => setSettings(DEFAULT_SITE_SETTINGS)}
              className="ms-3 rounded-xl border border-white/15 px-5 py-2.5 text-sm hover:bg-white/5"
            >
              {t('admin.settings.reset')}
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
