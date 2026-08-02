import { z } from 'zod';
import type { ObjectCategory, VisualType } from '@/types/database';

export const USERNAME_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

export const usernameSchema = z
  .string()
  .min(3, 'Too short')
  .max(30, 'Too long')
  .regex(USERNAME_REGEX, 'Invalid format')
  .refine((v) => !v.includes('--'), 'No consecutive hyphens');

export function isValidUsername(username: string): boolean {
  return usernameSchema.safeParse(username).success;
}

export const objectCategorySchema = z.enum([
  'interest',
  'idea',
  'value',
  'skill',
  'goal',
  'passion',
  'current_exploration',
]);

export const visualTypeSchema = z.enum([
  'star',
  'moon',
  'planet',
  'comet',
  'satellite',
]);

export const importanceSchema = z.number().int().min(1).max(5);

export const universeObjectSchema = z.object({
  name: z.string().min(1).max(60),
  category: objectCategorySchema,
  description: z.string().max(280).optional().nullable(),
  importance: importanceSchema,
  visual_type: visualTypeSchema,
});

export const identityStepSchema = z.object({
  display_name: z.string().min(1).max(60),
  username: usernameSchema,
  bio: z.string().min(1).max(240),
});

export const planetCustomizationSchema = z.object({
  planet_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  planet_surface_style: z.enum(['smooth', 'cratered', 'banded', 'crystalline', 'oceanic']),
  planet_atmosphere: z.enum(['none', 'thin', 'thick', 'stormy']),
  planet_glow: z.number().int().min(0).max(5),
  planet_has_ring: z.boolean(),
  universe_mood: z.enum(['calm', 'mysterious', 'creative', 'warm', 'futuristic', 'minimal']),
  space_background: z.enum(['deep_space', 'nebula', 'aurora', 'void']),
});

export const MIN_OBJECTS = 3;
export const MAX_OBJECTS = 20;

export function canAccessPublicProfile(
  isPublished: boolean,
  visibility: string
): boolean {
  return isPublished && visibility === 'public';
}

export function suggestVisualType(category: ObjectCategory): VisualType {
  const map: Record<ObjectCategory, VisualType> = {
    interest: 'star',
    idea: 'star',
    value: 'moon',
    skill: 'satellite',
    goal: 'planet',
    passion: 'star',
    current_exploration: 'comet',
  };
  return map[category];
}

export function importanceToSize(importance: number): number {
  const sizes: Record<number, number> = {
    1: 0.6,
    2: 0.75,
    3: 1.0,
    4: 1.25,
    5: 1.5,
  };
  return sizes[importance] ?? 1.0;
}

export function importanceToOrbitRadius(importance: number, base = 120): number {
  const radii: Record<number, number> = {
    1: base * 1.8,
    2: base * 1.5,
    3: base * 1.2,
    4: base * 0.95,
    5: base * 0.75,
  };
  return radii[importance] ?? base;
}

export type UniverseObjectInput = z.infer<typeof universeObjectSchema>;
export type IdentityStepInput = z.infer<typeof identityStepSchema>;
export type PlanetCustomizationInput = z.infer<typeof planetCustomizationSchema>;
