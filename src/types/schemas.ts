import { z } from 'zod';
import { CharacterSheetData, CharacterState } from './character';
import { RosterBackupPackage } from '../storage/characterStore';

/**
 * Zod Schemas with Lenient .passthrough() configuration.
 *
 * In accordance with Phase 5A architectural invariants:
 * - Loader-Exclusivity: Validation runs AFTER normalizeCharacterOnLoad.
 * - Non-Breaking: All schemas use .passthrough() so deprecated, unknown,
 *   or custom fields from legacy versions are never rejected.
 */

export const baseStatsSchema = z.object({
  str: z.number().optional(),
  dex: z.number().optional(),
  con: z.number().optional(),
  int: z.number().optional(),
  wis: z.number().optional(),
  cha: z.number().optional()
}).passthrough();

export const levelProgressionSchema = z.object({
  level: z.number(),
  primaryClass: z.string(),
  secondaryClass: z.string().optional(),
  hpRoll: z.number().optional()
}).passthrough();

export const characterFeatSchema = z.object({
  id: z.string().optional(),
  featId: z.string(),
  targetId: z.string().optional(),
  targetType: z.string().optional(),
  notes: z.string().optional()
}).passthrough();

export const inventoryItemSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  quantity: z.number().optional(),
  weight: z.number().optional(),
  location: z.string().optional(),
  value: z.string().optional(),
  notes: z.string().optional(),
  material: z.string().optional(),
  baseItemId: z.string().optional(),
  enhancementBonus: z.number().optional(),
  specialQualities: z.array(z.string()).optional(),
  isMasterwork: z.boolean().optional(),
  itemType: z.string().optional()
}).passthrough();

export const equipmentSchema = z.object({
  armor: z.string().optional(),
  armorEnhancement: z.number().optional(),
  armorMaterial: z.string().optional(),
  shield: z.string().optional(),
  shieldEnhancement: z.number().optional(),
  shieldMaterial: z.string().optional(),
  deflection: z.number().optional(),
  natural: z.number().optional(),
  dodge: z.number().optional(),
  primaryWeapon: z.string().optional()
}).passthrough();

export const drEntrySchema = z.object({
  value: z.number(),
  bypass: z.string(),
  abilityType: z.enum(['Ex', 'Su']).optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  stacks: z.boolean().optional()
}).passthrough();

export const srEntrySchema = z.object({
  value: z.number(),
  source: z.string().optional(),
  notes: z.string().optional(),
  stacks: z.boolean().optional()
}).passthrough();

export const auraSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  type: z.string().optional(),
  radius: z.number().optional(),
  target: z.string().optional(),
  effect: z.string().optional(),
  active: z.boolean().optional()
}).passthrough();

export const activeCombatBuffSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().optional(),
  active: z.boolean()
}).passthrough();

export const characterStateSchema = z.object({
  name: z.string().optional(),
  player: z.string().optional(),
  alignment: z.string().optional(),
  deity: z.string().optional(),
  portraitUrl: z.string().optional(),
  pointBuyTarget: z.string().optional(),
  baseStats: baseStatsSchema.optional(),
  enhancementMods: baseStatsSchema.optional(),
  levelBumps: z.record(z.string(), z.string()).optional(),
  selectedRace: z.string().optional(),
  raceOverride: z.string().optional(),
  isGestalt: z.boolean().optional(),
  levelProgression: z.array(levelProgressionSchema).optional(),
  skillRanks: z.record(z.string(), z.number()).optional(),
  selectedFeatEntities: z.array(characterFeatSchema).optional(),
  equipment: equipmentSchema.optional(),
  inventory: z.array(inventoryItemSchema).optional(),
  allowedSources: z.array(z.string()).optional(),
  auras: z.array(auraSchema).optional(),
  activeBuffs: z.array(activeCombatBuffSchema).optional(),
  damageReduction: z.array(drEntrySchema).optional(),
  spellResistance: z.array(srEntrySchema).optional()
}).passthrough().refine(
  data => Boolean(data.name || (data.levelProgression && data.levelProgression.length > 0) || data.baseStats || data.selectedRace),
  { message: 'Object does not contain recognizable character attributes (e.g. name, levelProgression, baseStats, or selectedRace)' }
);

export const characterSheetDataSchema = characterStateSchema.and(
  z.object({
    id: z.string().optional(),
    updatedAt: z.number().optional()
  }).passthrough()
);

export const rosterBackupPackageSchema = z.object({
  version: z.string().optional(),
  exportType: z.literal('heroforge_roster_backup').optional(),
  exportedAt: z.number().optional(),
  activeCharacterId: z.string().nullable().optional(),
  characters: z.union([
    z.array(z.record(z.string(), z.any())),
    z.record(z.string(), z.any())
  ])
}).passthrough();

/**
 * Safely validates character sheet data, returning strongly typed result.
 */
export type ValidationResult<T> =
  | { success: true; data: T; error?: never }
  | { success: false; error: z.ZodError; data?: never };

/**
 * Safely validates character sheet data, returning strongly typed result.
 */
export function safeValidateCharacter(data: unknown): ValidationResult<CharacterSheetData> {
  const result = characterSheetDataSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data as unknown as CharacterSheetData };
  }
  return { success: false, error: result.error };
}

/**
 * Safely validates a roster backup package.
 */
export function safeValidateRosterPackage(data: unknown): ValidationResult<RosterBackupPackage> {
  const result = rosterBackupPackageSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data as unknown as RosterBackupPackage };
  }
  return { success: false, error: result.error };
}
