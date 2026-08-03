'use server';

import { createClient } from '@/lib/supabase/server';
import type { ProfileRow, UniverseObjectRow } from '@/types/database';
import { applyLayoutToObjects } from '@/lib/universe/layout';
import { suggestVisualType } from '@/lib/universe/validation';

export async function getProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data;
}

export async function getUniverseObjects(profileId: string): Promise<UniverseObjectRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('universe_objects')
    .select('*')
    .eq('profile_id', profileId)
    .order('sort_order');

  return data ?? [];
}

export async function updateProfile(updates: Partial<ProfileRow>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) throw error;
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  return !data;
}

export async function saveUniverseObject(
  object: Partial<UniverseObjectRow> & { profile_id: string; name: string; category: UniverseObjectRow['category'] },
  profileId: string
) {
  const supabase = await createClient();
  const layout = applyLayoutToObjects(profileId, [{
    id: object.id ?? 'new',
    importance: object.importance ?? 3,
    sortOrder: object.sort_order ?? 0,
  }]);

  const layoutData = layout[0]!;
  const visualType = object.visual_type ?? suggestVisualType(object.category);

  if (object.id) {
    const { error } = await supabase
      .from('universe_objects')
      .update({ ...object, visual_type: visualType })
      .eq('id', object.id);
    if (error) throw error;
  } else {
    const { data: existing } = await supabase
      .from('universe_objects')
      .select('sort_order')
      .eq('profile_id', profileId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;
    const importance = object.importance ?? 3;

    const { error } = await supabase.from('universe_objects').insert({
      profile_id: profileId,
      name: object.name,
      category: object.category,
      description: object.description ?? null,
      importance,
      visual_type: visualType,
      sort_order: nextOrder,
      position_x: layoutData.position_x,
      position_y: layoutData.position_y,
      orbit_radius: layoutData.orbit_radius,
      orbit_speed: layoutData.orbit_speed,
      object_size: layoutData.object_size,
    });
    if (error) throw error;
  }
}

export async function deleteUniverseObject(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('universe_objects').delete().eq('id', id);
  if (error) throw error;
}

export async function updateObjectPosition(id: string, x: number, y: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('universe_objects')
    .update({ position_x: x, position_y: y })
    .eq('id', id);
  if (error) throw error;
}

export async function publishUniverse() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update({ is_published: true, visibility: 'public' })
    .eq('id', user.id);

  if (error) throw error;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function deleteAccount() {
  const supabase = await createClient();
  const { createServiceRoleClient } = await import('@/lib/supabase/service');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const serviceClient = createServiceRoleClient();
  const { error } = await serviceClient.auth.admin.deleteUser(user.id);
  if (error) throw error;
}
