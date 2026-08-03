import { LandingPage } from '@/components/landing/LandingPage';
import { MaintenancePage } from '@/components/site/MaintenancePage';
import {
  loadHomepageContentServer,
  loadSiteSettingsServer,
} from '@/lib/site-config/load';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [homepage, settings] = await Promise.all([
    loadHomepageContentServer(),
    loadSiteSettingsServer(),
  ]);

  if (settings.maintenanceMode) {
    return <MaintenancePage settings={settings} />;
  }

  return <LandingPage homepage={homepage} />;
}
