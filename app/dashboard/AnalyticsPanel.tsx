'use client';

import { useMemo, useState } from 'react';
import { Globe2, Link2, MonitorSmartphone, Share2, Sparkles, Waypoints } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';
import { linkDisplayText, getLinkMeta } from '@/lib/links';
import { LinkIcon } from '@/components/links/LinkIcon';
import type { ProfileLink } from '@/types/database';
import { cn, formatCompact } from '@/lib/utils';

export interface StatRow {
  day: string;
  metric: string;
  dim: string;
  count: number;
}

interface AnalyticsPanelProps {
  stats: StatRow[];
  stars: { id: string; title: string; icon: string }[];
  links: ProfileLink[];
  color: string;
}

function flagEmoji(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return '🌐';
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function sum(rows: StatRow[], metric: string) {
  const map = new Map<string, number>();
  for (const r of rows) if (r.metric === metric) map.set(r.dim, (map.get(r.dim) ?? 0) + r.count);
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function Bars({
  rows,
  color,
  render,
  empty,
}: {
  rows: Array<[string, number]>;
  color: string;
  render: (dim: string) => React.ReactNode;
  empty: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  if (!rows.length) return <p className="py-3 text-sm text-white/40">{empty}</p>;
  return (
    <ul className="space-y-2">
      {rows.slice(0, 8).map(([dim, count]) => (
        <li key={dim} className="relative overflow-hidden rounded-xl bg-white/[0.03] px-3 py-2">
          <span
            className="absolute inset-y-0 start-0 rounded-xl opacity-25"
            style={{ width: `${(count / max) * 100}%`, background: color }}
            aria-hidden
          />
          <span className="relative flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{render(dim)}</span>
            <span className="shrink-0 tabular-nums text-white/70">{count}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Where visits come from, who they are, and what they interact with. */
export function AnalyticsPanel({ stats, stars, links, color }: AnalyticsPanelProps) {
  const { t, lang } = useLanguage();
  const [days, setDays] = useState<7 | 30>(30);

  const rows = useMemo(() => {
    const since = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);
    return stats.filter((r) => r.day >= since);
  }, [stats, days]);

  const regionNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([lang === 'ar' ? 'ar' : 'en'], { type: 'region' });
    } catch {
      return null;
    }
  }, [lang]);

  const sources = sum(rows, 'source');
  const countries = sum(rows, 'country');
  const devices = sum(rows, 'device');
  const starOpens = sum(rows, 'star_open');
  const linkClicks = sum(rows, 'link_click');
  const shares = sum(rows, 'share');
  const totalDevices = devices.reduce((s, [, c]) => s + c, 0);
  const starById = new Map(stars.map((s) => [s.id, s]));
  const linkByUrl = new Map(links.map((l) => [l.url, l]));
  const hasData = rows.length > 0;

  const card = 'rounded-3xl border border-white/10 bg-white/[0.035] p-5';
  const heading = 'mb-3 flex items-center gap-2 text-sm font-medium text-white/80';

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t('dash.analyticsTitle')}</h2>
        <div className="flex rounded-full border border-white/10 p-0.5">
          {([7, 30] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={cn('rounded-full px-3 py-1 text-xs', days === d ? 'bg-white text-black' : 'text-white/60')}
            >
              {d === 7 ? t('dash.period7') : t('dash.period30')}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <p className={cn(card, 'text-sm text-white/45')}>{t('dash.analyticsEmpty')}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className={card}>
            <h3 className={heading}>
              <Waypoints size={15} /> {t('dash.sources')}
            </h3>
            <Bars rows={sources} color={color} empty={t('dash.noData')} render={(d) => t(`dash.source.${d}`)} />
          </div>

          <div className={card}>
            <h3 className={heading}>
              <Globe2 size={15} /> {t('dash.countries')}
            </h3>
            <Bars
              rows={countries}
              color={color}
              empty={t('dash.noData')}
              render={(d) => (
                <>
                  <span className="me-2">{flagEmoji(d)}</span>
                  {d === '??' ? t('dash.unknownCountry') : regionNames?.of(d) ?? d}
                </>
              )}
            />
          </div>

          <div className={card}>
            <h3 className={heading}>
              <MonitorSmartphone size={15} /> {t('dash.devices')}
            </h3>
            {devices.length ? (
              <>
                <div className="flex h-3 overflow-hidden rounded-full bg-white/5">
                  {devices.map(([d, c], i) => (
                    <span
                      key={d}
                      style={{ width: `${(c / totalDevices) * 100}%`, background: color, opacity: 1 - i * 0.3 }}
                    />
                  ))}
                </div>
                <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  {devices.map(([d, c]) => (
                    <li key={d} className="text-white/70">
                      {t(`dash.device.${d}`)}{' '}
                      <span className="text-white">{Math.round((c / totalDevices) * 100)}%</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="py-3 text-sm text-white/40">{t('dash.noData')}</p>
            )}
          </div>

          <div className={card}>
            <h3 className={heading}>
              <Share2 size={15} /> {t('dash.shares')}
            </h3>
            <Bars rows={shares} color={color} empty={t('dash.noData')} render={(d) => t(`dash.shareChannel.${d}`)} />
          </div>

          <div className={card}>
            <h3 className={heading}>
              <Sparkles size={15} /> {t('dash.topStarOpens')}
            </h3>
            <Bars
              rows={starOpens.filter(([id]) => starById.has(id))}
              color={color}
              empty={t('dash.noData')}
              render={(id) => {
                const star = starById.get(id);
                return (
                  <span dir="auto">
                    {star?.icon} {star?.title}
                  </span>
                );
              }}
            />
          </div>

          <div className={card}>
            <h3 className={heading}>
              <Link2 size={15} /> {t('dash.topLinks')}
            </h3>
            <Bars
              rows={linkClicks}
              color={color}
              empty={t('dash.noData')}
              render={(url) => {
                const link = linkByUrl.get(url);
                if (!link) return <span dir="ltr">{url.replace(/^https?:\/\//, '')}</span>;
                return (
                  <span className="flex items-center gap-2">
                    <span style={{ color: getLinkMeta(link.type).color }}>
                      <LinkIcon type={link.type} size={14} />
                    </span>
                    <span dir="ltr">{linkDisplayText(link)}</span>
                  </span>
                );
              }}
            />
          </div>
        </div>
      )}
      <p className="text-[11px] text-white/35">
        {t('dash.analyticsPrivacy')} · {formatCompact(rows.reduce((s, r) => s + (r.metric === 'device' ? r.count : 0), 0), lang)}{' '}
        {t('dash.visitsInPeriod')}
      </p>
    </section>
  );
}
