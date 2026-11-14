'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  deleteUserPlanet,
  getModerationAction,
  hideMessageAsAdmin,
  saveBlockedWords,
  setReportStatus,
  setUserBanned,
  type AdminReport,
} from '@/lib/actions/admin';
import { useLanguage } from '@/lib/i18n/context';
import { AdminCard } from './AdminUi';

/** Reports queue + blocked-word list. Loads on demand. */
export function ModerationTab({ notify }: { notify: (message: string) => void }) {
  const { t, lang } = useLanguage();
  const [reports, setReports] = useState<AdminReport[] | null>(null);
  const [words, setWords] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    getModerationAction().then((res) => {
      if (!res.ok) {
        setError(res.error);
        setReports([]);
        return;
      }
      setReports(res.reports);
      setWords(res.blockedWords.join('\n'));
    });
  }, []);

  function closeReport(id: string, status: 'resolved' | 'dismissed') {
    startTransition(async () => {
      const res = await setReportStatus(id, status);
      if (!res.ok) return notify(res.error);
      setReports((rs) => (rs ?? []).filter((r) => r.id !== id));
    });
  }

  function act(report: AdminReport, action: 'hide' | 'ban' | 'unban' | 'reset') {
    if (action === 'reset' && !confirm(t('admin.planets.confirmReset'))) return;
    startTransition(async () => {
      const res =
        action === 'hide' && report.messageId
          ? await hideMessageAsAdmin(report.messageId)
          : action === 'ban' || action === 'unban'
            ? await setUserBanned(report.profileId, action === 'ban')
            : await deleteUserPlanet(report.profileId);
      if (!res.ok) return notify(res.error);
      setReports((rs) =>
        (rs ?? []).map((r) =>
          r.profileId === report.profileId
            ? {
                ...r,
                isBanned: action === 'ban' ? true : action === 'unban' ? false : r.isBanned,
                messageStatus: r.id === report.id && action === 'hide' ? 'hidden' : r.messageStatus,
              }
            : r
        )
      );
      notify(t('admin.moderation.done'));
    });
  }

  function saveWords() {
    startTransition(async () => {
      const res = await saveBlockedWords(words.split(/[\n,]/));
      notify(res.ok ? t('admin.moderation.wordsSaved') : res.error);
    });
  }

  return (
    <div className="space-y-8">
      <AdminCard title={t('admin.moderation.reportsTitle')} description={t('admin.moderation.reportsDesc')}>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        {reports === null ? (
          <p className="text-sm text-slate-400">{t('common.loading')}</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-slate-500">{t('admin.moderation.noReports')}</p>
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => (
              <li key={r.id} className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-xs text-rose-200">
                      {t(`planet.reasons.${r.reason}`)}
                    </span>
                    <Link href={`/${r.username}`} target="_blank" className="text-violet-300 hover:text-white">
                      /{r.username}
                    </Link>
                    {r.isBanned ? (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">
                        {t('admin.users.banned')}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(r.createdAt).toLocaleString(lang === 'ar' ? 'ar' : 'en')}
                  </span>
                </div>
                {r.details ? (
                  <p className="mt-2 text-slate-300" dir="auto">
                    {r.details}
                  </p>
                ) : null}
                {r.messageId ? (
                  <blockquote className="mt-2 rounded-lg border-s-2 border-white/20 bg-white/5 px-3 py-2 text-slate-300">
                    <span className="text-xs text-slate-500" dir="auto">
                      {r.messageAuthor} · {r.messageStatus}
                    </span>
                    <p dir="auto">{r.messageBody}</p>
                  </blockquote>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  {r.messageId && r.messageStatus !== 'hidden' ? (
                    <button type="button" disabled={pending} onClick={() => act(r, 'hide')} className="text-amber-200 hover:text-white">
                      {t('admin.moderation.hideMessage')}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => act(r, r.isBanned ? 'unban' : 'ban')}
                    className="text-rose-300 hover:text-rose-100"
                  >
                    {r.isBanned ? t('admin.users.unban') : t('admin.users.ban')}
                  </button>
                  <button type="button" disabled={pending} onClick={() => act(r, 'reset')} className="text-rose-300/80 hover:text-rose-100">
                    {t('admin.planets.reset')}
                  </button>
                  <span className="flex-1" />
                  <button type="button" disabled={pending} onClick={() => closeReport(r.id, 'resolved')} className="text-emerald-300 hover:text-white">
                    {t('admin.moderation.resolve')}
                  </button>
                  <button type="button" disabled={pending} onClick={() => closeReport(r.id, 'dismissed')} className="text-slate-400 hover:text-white">
                    {t('admin.moderation.dismiss')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard title={t('admin.moderation.wordsTitle')} description={t('admin.moderation.wordsDesc')}>
        <textarea
          value={words}
          onChange={(e) => setWords(e.target.value)}
          rows={8}
          dir="auto"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-white outline-none focus:border-violet-400"
          placeholder={t('admin.moderation.wordsPlaceholder')}
        />
        <button
          type="button"
          onClick={saveWords}
          disabled={pending}
          className="mt-3 rounded-full bg-violet-500 px-5 py-2 text-sm font-medium text-white hover:bg-violet-400 disabled:opacity-50"
        >
          {t('admin.moderation.wordsSave')}
        </button>
      </AdminCard>
    </div>
  );
}
