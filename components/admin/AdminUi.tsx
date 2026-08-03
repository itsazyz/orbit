'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type AdminTab =
  | 'overview'
  | 'users'
  | 'planets'
  | 'presets'
  | 'homepage'
  | 'settings';

export function AdminTabs({
  active,
  onChange,
  labels,
}: {
  active: AdminTab;
  onChange: (tab: AdminTab) => void;
  labels: Record<AdminTab, string>;
}) {
  const tabs: AdminTab[] = [
    'overview',
    'users',
    'planets',
    'presets',
    'homepage',
    'settings',
  ];

  return (
    <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            'rounded-full px-4 py-2 text-sm transition-colors',
            active === tab
              ? 'bg-violet-600 text-white'
              : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
          )}
        >
          {labels[tab]}
        </button>
      ))}
    </div>
  );
}

export function AdminCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <h2 className="text-xl font-medium">{title}</h2>
      {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function AdminField({
  label,
  value,
  onChange,
  dir,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  dir?: 'rtl' | 'ltr';
  multiline?: boolean;
}) {
  const className =
    'w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white';

  return (
    <label className="block space-y-1.5">
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          dir={dir}
          className={className}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir={dir}
          className={className}
        />
      )}
    </label>
  );
}
