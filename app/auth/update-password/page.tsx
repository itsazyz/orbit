'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/lib/i18n/context';

/**
 * Landing page of the password-reset email. The callback route has already
 * exchanged the email link for a session, so here the user just picks a new
 * password.
 */
export default function UpdatePasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'ready' | 'expired' | 'done'>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setStatus(data.user ? 'ready' : 'expired'));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError(t('auth.passwordShort'));
    if (password !== confirm) return setError(t('auth.passwordMismatch'));

    setSaving(true);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setStatus('done');
    window.setTimeout(() => router.replace('/dashboard'), 1500);
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="text-sm tracking-[0.28em] text-star-dim">
            ORBIT
          </Link>
          <h1 className="mt-4 text-2xl font-light text-star">{t('auth.newPasswordTitle')}</h1>
        </div>

        {status === 'checking' ? (
          <p className="text-center text-star-dim">{t('common.loading')}</p>
        ) : status === 'expired' ? (
          <div className="space-y-4 text-center">
            <p className="text-star-dim">{t('auth.resetLinkExpired')}</p>
            <Link href="/auth/reset" className="inline-block text-accent hover:text-star">
              {t('auth.requestNewLink')}
            </Link>
          </div>
        ) : status === 'done' ? (
          <p className="text-center text-emerald-300">{t('auth.passwordUpdated')}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('auth.newPassword')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
            />
            <Input
              label={t('auth.confirmNewPassword')}
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
            />
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? t('common.loading') : t('auth.savePassword')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
