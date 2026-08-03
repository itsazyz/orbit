'use client';

import dynamic from 'next/dynamic';
import type { AdminDashboardPayload } from '@/lib/admin/dashboard-data';

const AdminPanel = dynamic(
  () => import('./AdminPanel').then((mod) => mod.AdminPanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center px-6 text-sm text-slate-400">
        Loading admin…
      </div>
    ),
  }
);

export function AdminPanelClient({ data }: { data: AdminDashboardPayload }) {
  return <AdminPanel data={data} />;
}
