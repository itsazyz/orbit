import type { Metadata } from 'next';
import { CreatePageClient } from './CreatePageClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Build your universe — ORBIT',
  robots: { index: false },
};

export default function CreatePage() {
  return <CreatePageClient />;
}
