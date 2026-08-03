import { loadVisualPresetsServer } from '@/lib/site-config/load';
import { CreatePageClient } from './CreatePageClient';

export const dynamic = 'force-dynamic';

export default async function CreatePage() {
  const presets = await loadVisualPresetsServer();

  return (
    <CreatePageClient
      initialStarTypes={presets.starTypes}
      initialPlanetSurfaces={presets.planetSurfaces}
    />
  );
}
