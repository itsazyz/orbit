'use client';

import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

const REASONS = ['spam', 'offensive', 'impersonation', 'other'] as const;

interface ReportSheetProps {
  username: string;
  messageId?: string | null;
  onClose: () => void;
}

export function ReportSheet({ username, messageId, onClose }: ReportSheetProps) {
  const { t } = useLanguage();
  const [reason, setReason] = useState<(typeof REASONS)[number] | null>(null);
  const [details, setDetails] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  async function submit() {
    if (!reason) return;
    setState('sending');
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc('submit_report', {
      p_username: username,
      p_reason: reason,
      p_details: details.trim() || null,
      p_message_id: messageId ?? null,
    });
    if (rpcError) {
      setState('idle');
      setError(/RATE_LIMITED/.test(rpcError.message) ? t('planet.guestbookRateLimited') : t('planet.genericError'));
      return;
    }
    setState('sent');
  }

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="animate-sheet-up relative w-full max-w-md rounded-[28px] border border-white/15 bg-[#0b0d18]/95 p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute end-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10"
          aria-label={t('planet.close')}
        >
          <X size={18} />
        </button>
        <h2 className="text-lg font-semibold">{messageId ? t('planet.reportMessage') : t('planet.reportTitle')}</h2>
        {state === 'sent' ? (
          <p className="mt-4 rounded-2xl bg-white/[0.05] p-4 text-sm text-white/75">{t('planet.reportSent')}</p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={cn(
                    'rounded-2xl border px-3 py-3 text-sm transition',
                    reason === r ? 'border-white bg-white text-black' : 'border-white/12 text-white/75 hover:border-white/30'
                  )}
                >
                  {t(`planet.reasons.${r}`)}
                </button>
              ))}
            </div>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={500}
              rows={3}
              dir="auto"
              placeholder={t('planet.reportDetails')}
              className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"
            />
            {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
            <button
              type="button"
              onClick={submit}
              disabled={!reason || state === 'sending'}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-medium text-black disabled:opacity-40"
            >
              {state === 'sending' ? <Loader2 size={15} className="animate-spin" /> : null}
              {t('planet.reportSend')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
