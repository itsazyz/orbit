'use client';

import { useLanguage } from '@/lib/i18n/context';
import { interpolate } from '@/lib/i18n';

type AdminErrorVariant = 'supabase' | 'service_role' | 'session' | 'setup';

export function AdminErrorScreenClient({
  variant,
  detail,
}: {
  variant: AdminErrorVariant;
  detail?: string;
}) {
  const { t, dir } = useLanguage();

  const titleKey =
    variant === 'supabase'
      ? 'admin.errors.supabaseTitle'
      : variant === 'service_role'
        ? 'admin.errors.keyTitle'
        : variant === 'session'
          ? 'admin.errors.sessionTitle'
          : 'admin.errors.setupTitle';

  const messageKey =
    variant === 'supabase'
      ? 'admin.errors.supabaseMessage'
      : variant === 'service_role'
        ? 'admin.errors.keyMessage'
        : variant === 'session'
          ? 'admin.errors.sessionMessage'
          : 'admin.errors.setupMessage';

  const message =
    variant === 'session' && detail
      ? detail
      : variant === 'setup' && detail
        ? `${detail} ${t('admin.errors.setupMessage')}`
        : t(messageKey);

  return (
    <main
      dir={dir}
      className="relative flex min-h-svh items-center justify-center bg-[#05060a] px-6 text-center text-white"
    >
      <div className="max-w-lg">
        <h1 className="text-2xl font-semibold">{t(titleKey)}</h1>
        <p className="mt-3 text-slate-400">{message}</p>
        <ul className="mt-6 space-y-2 text-start text-sm text-slate-500">
          <li>
            <code className="text-violet-400">NEXT_PUBLIC_SUPABASE_URL</code>
          </li>
          <li>
            <code className="text-violet-400">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
          </li>
          <li>
            <code className="text-violet-400">SUPABASE_SERVICE_ROLE_KEY</code> —{' '}
            {t('admin.errors.envServiceRole')}
          </li>
          <li>
            <code className="text-violet-400">ORBIT_ADMIN_EMAIL</code> —{' '}
            {t('admin.errors.envAdminEmail')}
          </li>
        </ul>
        <p className="mt-6 text-xs text-slate-600">{t('admin.redeployHint')}</p>
      </div>
    </main>
  );
}

export function AdminAccessDeniedClient({
  userEmail,
  adminConfigured,
}: {
  userEmail: string;
  adminConfigured: boolean;
}) {
  const { t, dir } = useLanguage();

  return (
    <main
      dir={dir}
      className="relative flex min-h-svh items-center justify-center bg-[#05060a] px-6 text-center text-white"
    >
      <div>
        <h1 className="text-2xl font-semibold">{t('admin.errors.accessDeniedTitle')}</h1>
        <p className="mt-3 max-w-md text-slate-400">
          {interpolate(t('admin.errors.accessDeniedMessage'), {
            status: adminConfigured ? t('admin.configured') : t('admin.notConfigured'),
          })}
        </p>
        <p className="mt-4 text-sm text-slate-500">
          {t('admin.signedInAs')}{' '}
          <span className="text-slate-300">{userEmail}</span>
        </p>
      </div>
    </main>
  );
}
