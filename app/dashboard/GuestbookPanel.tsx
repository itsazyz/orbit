'use client';

import { useMemo, useState } from 'react';
import { Check, EyeOff, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

export interface OwnerMessage {
  id: string;
  author_name: string;
  body: string;
  status: 'pending' | 'approved' | 'hidden';
  created_at: string;
}

interface GuestbookPanelProps {
  initialMessages: OwnerMessage[];
  initialEnabled: boolean;
}

/** Owner inbox: approve, hide or delete visitor messages; switch the guestbook on/off. */
export function GuestbookPanel({ initialMessages, initialEnabled }: GuestbookPanelProps) {
  const { t, lang } = useLanguage();
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState(initialMessages);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [tab, setTab] = useState<'pending' | 'approved' | 'hidden'>('pending');

  const counts = {
    pending: messages.filter((m) => m.status === 'pending').length,
    approved: messages.filter((m) => m.status === 'approved').length,
    hidden: messages.filter((m) => m.status === 'hidden').length,
  };
  const list = messages.filter((m) => m.status === tab);

  async function setStatus(id: string, status: OwnerMessage['status']) {
    const prev = messages;
    setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, status } : m)));
    const { error } = await supabase.from('planet_messages').update({ status }).eq('id', id);
    if (error) setMessages(prev);
  }

  async function remove(id: string) {
    const prev = messages;
    setMessages((ms) => ms.filter((m) => m.id !== id));
    const { error } = await supabase.from('planet_messages').delete().eq('id', id);
    if (error) setMessages(prev);
  }

  async function toggle(next: boolean) {
    setEnabled(next);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ guestbook_enabled: next }).eq('id', user.id);
    if (error) setEnabled(!next);
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t('dash.guestbookTitle')}</h2>
          <p className="text-xs text-white/50">{t('dash.guestbookHint')}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => toggle(!enabled)}
          className="flex items-center gap-2 text-xs text-white/70"
        >
          {t('dash.guestbookEnabled')}
          <span className={cn('relative h-6 w-11 rounded-full transition', enabled ? 'bg-accent' : 'bg-white/15')}>
            <span
              className={cn(
                'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
                enabled ? 'start-[22px]' : 'start-0.5'
              )}
            />
          </span>
        </button>
      </div>

      <div className="mt-4 flex gap-1">
        {(['pending', 'approved', 'hidden'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition',
              tab === k ? 'bg-white text-black' : 'text-white/60 hover:text-white'
            )}
          >
            {t(`dash.msg.${k}`)}
            <span className={cn('rounded-full px-1.5 text-[10px]', tab === k ? 'bg-black/10' : 'bg-white/10')}>
              {counts[k]}
            </span>
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {list.length === 0 ? (
          <li className="py-4 text-center text-sm text-white/40">{t('dash.msg.empty')}</li>
        ) : (
          list.map((m) => (
            <li key={m.id} className="rounded-2xl bg-white/[0.04] p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium" dir="auto">
                    {m.author_name}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-white/70" dir="auto">
                    {m.body}
                  </p>
                  <p className="mt-1.5 text-[11px] text-white/35">
                    {new Date(m.created_at).toLocaleString(lang === 'ar' ? 'ar' : 'en', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {m.status !== 'approved' ? (
                    <button
                      type="button"
                      onClick={() => setStatus(m.id, 'approved')}
                      className="rounded-lg p-2 text-emerald-300 hover:bg-emerald-400/10"
                      aria-label={t('dash.msg.approve')}
                      title={t('dash.msg.approve')}
                    >
                      <Check size={15} />
                    </button>
                  ) : null}
                  {m.status !== 'hidden' ? (
                    <button
                      type="button"
                      onClick={() => setStatus(m.id, 'hidden')}
                      className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
                      aria-label={t('dash.msg.hide')}
                      title={t('dash.msg.hide')}
                    >
                      <EyeOff size={15} />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => remove(m.id)}
                    className="rounded-lg p-2 text-rose-300/70 hover:bg-rose-500/10 hover:text-rose-200"
                    aria-label={t('dash.msg.delete')}
                    title={t('dash.msg.delete')}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
