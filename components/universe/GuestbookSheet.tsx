'use client';

import { useState } from 'react';
import { Flag, Loader2, Send, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/context';
import type { PublicMessage } from '@/lib/planet/public';

interface GuestbookSheetProps {
  username: string;
  ownerName: string;
  color: string;
  messages: PublicMessage[];
  isOwner: boolean;
  onClose: () => void;
  onReportMessage: (messageId: string) => void;
}

function relativeTime(iso: string, lang: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(lang === 'ar' ? 'ar' : 'en', { numeric: 'auto' });
  if (diff < 3600) return rtf.format(-Math.max(1, Math.round(diff / 60)), 'minute');
  if (diff < 86400) return rtf.format(-Math.round(diff / 3600), 'hour');
  if (diff < 86400 * 30) return rtf.format(-Math.round(diff / 86400), 'day');
  return new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar' : 'en');
}

export function GuestbookSheet({
  username,
  ownerName,
  color,
  messages,
  isOwner,
  onClose,
  onReportMessage,
}: GuestbookSheetProps) {
  const { t, lang } = useLanguage();
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !body.trim()) return;
    setState('sending');
    setError('');
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc('submit_planet_message', {
      p_username: username,
      p_name: name.trim(),
      p_body: body.trim(),
    });
    if (rpcError) {
      setState('idle');
      setError(
        /RATE_LIMITED/.test(rpcError.message)
          ? t('planet.guestbookRateLimited')
          : /GUESTBOOK_CLOSED/.test(rpcError.message)
            ? t('planet.guestbookClosed')
            : t('planet.genericError')
      );
      return;
    }
    setState('sent');
    setBody('');
  }

  return (
    <div
      className="animate-fade-in fixed inset-0 z-40 flex items-end justify-center bg-black/45 p-3 sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guestbook-title"
        onClick={(e) => e.stopPropagation()}
        className="animate-sheet-up relative flex max-h-[88svh] w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-white/15 bg-[#0b0d18]/95 shadow-2xl backdrop-blur-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/5 p-5 pb-4">
          <div>
            <h2 id="guestbook-title" className="text-xl font-semibold">
              {t('planet.guestbookTitle')}
            </h2>
            <p className="mt-0.5 text-sm text-white/50" dir="auto">
              {t('planet.guestbookSubtitle', { name: ownerName })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10"
            aria-label={t('planet.close')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {!isOwner ? (
            state === 'sent' ? (
              <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                {t('planet.guestbookSent', { name: ownerName })}
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-2.5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={40}
                  required
                  dir="auto"
                  placeholder={t('planet.guestbookName')}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"
                />
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={280}
                  required
                  rows={3}
                  dir="auto"
                  placeholder={t('planet.guestbookMessage')}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-white/35">{t('planet.guestbookModerated')}</span>
                  <button
                    type="submit"
                    disabled={state === 'sending' || !name.trim() || !body.trim()}
                    className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                    style={{ background: color }}
                  >
                    {state === 'sending' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} className="rtl:-scale-x-100" />}
                    {t('planet.guestbookSend')}
                  </button>
                </div>
                {error ? <p className="text-xs text-rose-300">{error}</p> : null}
              </form>
            )
          ) : null}

          <ul className="mt-5 space-y-3">
            {messages.length === 0 ? (
              <li className="py-6 text-center text-sm text-white/45">{t('planet.guestbookEmpty')}</li>
            ) : (
              messages.map((m) => (
                <li key={m.id} className="group rounded-2xl bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium" dir="auto">
                      {m.author_name}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[11px] text-white/35">{relativeTime(m.created_at, lang)}</span>
                      <button
                        type="button"
                        onClick={() => onReportMessage(m.id)}
                        className="rounded-full p-1 text-white/25 opacity-0 transition hover:text-white/70 group-hover:opacity-100 focus:opacity-100"
                        aria-label={t('planet.reportMessage')}
                      >
                        <Flag size={12} />
                      </button>
                    </div>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-white/75" dir="auto">
                    {m.body}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
