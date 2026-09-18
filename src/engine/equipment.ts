import {
  WeaponData,
  CustomArmorData,
  CharacterState,
  InventoryItem,
  ItemArmorData,
  ItemWeaponData,
  Equipment,
  EquipmentMaterial,
  BodySlotId,
  BodySlotDefinition,
  AmmoCategory,
  WondrousItem
} from '../types/character';
import { parseMagicItemName, formatMagicItemName, parseItemMaterial, formatMaterialName } from './magicItems';

export const DEFAULT_WEAPON: WeaponData = {
  id: 'unarmed',
  name: 'Unarmed Strike',
  category: 'Simple',
  size: 'M',
  damageM: '1d3',
  threat: 20,
  critMultiplier: 2,
  weight: 0,
  type: 'Bludgeoning'
};

export interface StandardArmorEntry {
  name: string;
  acBonus: number;
  maxDex: number;
  checkPenalty: number;
  type: 'light' | 'medium' | 'heavy' | 'none';
  weight: number;
  spellFailure: number;
  speedPenalty: boolean;
}

export interface StandardShieldEntry {
  name: string;
  acBonus: number;
  checkPenalty: number;
  type: 'shield';
  weight: number;
  spellFailure: number;
}

const STANDARD_ARMOR_MAP: Record<string, StandardArmorEntry> = {
  none: { name: 'None', acBonus: 0, maxDex: 99, checkPenalty: 0, type: 'none', weight: 0, spellFailure: 0, speedPenalty: false },
  padded: { name: 'Padded', acBonus: 1, maxDex: 8, checkPenalty: 0, type: 'light', weight: 10, spellFailure: 5, speedPenalty: false },
  'padded armor': { name: 'Padded', acBonus: 1, maxDex: 8, checkPenalty: 0, type: 'light', weight: 10, spellFailure: 5, speedPenalty: false },
  leather: { name: 'Leather', acBonus: 2, maxDex: 6, checkPenalty: 0, type: 'light', weight: 15, spellFailure: 10, speedPenalty: false },
  'leather armor': { name: 'Leather', acBonus: 2, maxDex: 6, checkPenalty: 0, type: 'light', weight: 15, spellFailure: 10, speedPenalty: false },
  studded: { name: 'Studded Leather', acBonus: 3, maxDex: 5, checkPenalty: -1, type: 'light', weight: 20, spellFailure: 15, speedPenalty: false },
  'studded leather': { name: 'Studded Leather', acBonus: 3, maxDex: 5, checkPenalty: -1, type: 'light', weight: 20, spellFailure: 15, speedPenalty: false },
  'studded leather armor': { name: 'Studded Leather', acBonus: 3, maxDex: 5, checkPenalty: -1, type: 'light', weight: 20, spellFailure: 15, speedPenalty: false },
  chainshirt: { name: 'Chain Shirt', acBonus: 4, maxDex: 4, checkPenalty: -2, type: 'light', weight: 25, spellFailure: 20, speedPenalty: false },
  'chain shirt': { name: 'Chain Shirt', acBonus: 4, maxDex: 4, checkPenalty: -2, type: 'light', weight: 25, spellFailure: 20, speedPenalty: false },
  breastplate: { name: 'Breastplate', acBonus: 5, maxDex: 3, checkPenalty: -4, type: 'medium', weight: 30, spellFailure: 20, speedPenalty: true },
  fullplate: { name: 'Full Plate', acBonus: 8, maxDex: 1, checkPenalty: -6, type: 'heavy', weight: 50, spellFailure: 35, speedPenalty: true },
  'full plate': { name: 'Full Plate', acBonus: 8, maxDex: 1, checkPenalty: -6, type: 'heavy', weight: 50, spellFailure: 35, speedPenalty: true },
  hide: { name: 'Hide', acBonus: 3, maxDex: 4, checkPenalty: -3, type: 'medium', weight: 25, spellFailure: 20, speedPenalty: true },
  'hide armor': { name: 'Hide', acBonus: 3, maxDex: 4, checkPenalty: -3, type: 'medium', weight: 25, spellFailure: 20, speedPenalty: true },
  scale_mail: { name: 'Scale Mail', acBonus: 4, maxDex: 3, checkPenalty: -4, type: 'medium', weight: 30, spellFailure: 25, speedPenalty: true },
  'scale mail': { name: 'Scale Mail', acBonus: 4, maxDex: 3, checkPenalty: -4, type: 'medium', weight: 30, spellFailure: 25, speedPenalty: true },
  chainmail: { name: 'Chainmail', acBonus: 5, maxDex: 2, checkPenalty: -5, type: 'medium', weight: 40, spellFailure: 30, speedPenalty: true },
  banded_mail: { name: 'Banded Mail', acBonus: 6, maxDex: 1, checkPenalty: -6, type: 'heavy', weight: 35, spellFailure: 35, speedPenalty: true },
  'banded mail': { name: 'Banded Mail', acBonus: 6, maxDex: 1, checkPenalty: -6, type: 'heavy', weight: 35, spellFailure: 35, speedPenalty: true },
  splint_mail: { name: 'Splint Mail', acBonus: 6, maxDex: 0, checkPenalty: -7, type: 'heavy', weight: 45, spellFailure: 40, speedPenalty: true },
  'splint mail': { name: 'Splint Mail', acBonus: 6, maxDex: 0, checkPenalty: -7, type: 'heavy', weight: 45, spellFailure: 40, speedPenalty: true },
  half_plate: { name: 'Half-Plate', acBonus: 7, maxDex: 0, checkPenalty: -7, type: 'heavy', weight: 50, spellFailure: 40, speedPenalty: true },
  'half-plate': { name: 'Half-Plate', acBonus: 7, maxDex: 0, checkPenalty: -7, type: 'heavy', weight: 50, spellFailure: 40, speedPenalty: true },
  'half plate': { name: 'Half-Plate', acBonus: 7, maxDex: 0, checkPenalty: -7, type: 'heavy', weight: 50, spellFailure: 40, speedPenalty: true }
};

const STANDARD_SHIELD_MAP: Record<string, StandardShieldEntry> = {
  none: { name: 'None', acBonus: 0, checkPenalty: 0, type: 'shield', weight: 0, spellFailure: 0 },
  buckler: { name: 'Buckler', acBonus: 1, checkPenalty: -1, type: 'shield', weight: 5, spellFailure: 5 },
  light_wooden: { name: 'Light Shield', acBonus: 1, checkPenalty: -1, type: 'shield', weight: 5, spellFailure: 5 },
  'light shield': { name: 'Light Shield', acBonus: 1, checkPenalty: -1, type: 'shield', weight: 5, spellFailure: 5 },
  'light wooden shield': { name: 'Light Shield', acBonus: 1, checkPenalty: -1, type: 'shield', weight: 5, spellFailure: 5 },
  'light steel shield': { name: 'Light Shield', acBonus: 1, checkPenalty: -1, type: 'shield', weight: 5, spellFailure: 5 },
  heavy_shield: { name: 'Heavy Shield', acBonus: 2, checkPenalty: -2, type: 'shield', weight: 15, spellFailure: 15 },
  'heavy shield': { name: 'Heavy Shield', acBonus: 2, checkPenalty: -2, type: 'shield', weight: 15, spellFailure: 15 },
  'heavy steel shield': { name: 'Heavy Shield', acBonus: 2, checkPenalty: -2, type: 'shield', weight: 15, spellFailure: 15 },
  'heavy wooden shield': { name: 'Heavy Shield', acBonus: 2, checkPenalty: -2, type: 'shield', weight: 15, spellFailure: 15 },
  tower_shield: { name: 'Tower Shield', acBonus: 4, checkPenalty: -10, type: 'shield', weight: 45, spellFailure: 50 },
  'tower shield': { name: 'Tower Shield', acBonus: 4, checkPenalty: -10, type: 'shield', weight: 45, spellFailure: 50 }
};

const DAMAGE_INDEX_MAP: Record<string, string> = {
  '1': '1d2',
  '2': '1d3',
  '3': '1d4',
  '4': '1d6',
  '5': '1d8',
  '6': '1d10',
  '7': '1d12',
  '8': '2d4',
  '9': '2d4',
  '10': '2d6',
  '11': '2d8',
  '12': '2d10',
  '13': '3d6'
};

const normalizeWeapon = (wpn: WeaponData): WeaponData => {
  if (wpn.damageM && DAMAGE_INDEX_MAP[String(wpn.damageM).trim()]) {
    return { ...wpn, damageM: DAMAGE_INDEX_MAP[String(wpn.damageM).trim()] };
  }
  return wpn;
};

export const THEMED_WEAPON_BASE_MAP: Record<string, string> = {
  nodachi: 'greatsword',
  katana: 'bastard sword',
  wakizashi: 'short sword',
  naginata: 'glaive',
  broadsword: 'longsword',
  saber: 'scimitar',
  claymore: 'greatsword',
  estoc: 'rapier',
  gladius: 'short sword',
  messer: 'scimitar'
};

export const THEMED_WEAPON_LIST: { name: string; baseName: string; displayName: string }[] = [
  { name: 'Nodachi', baseName: 'Greatsword', displayName: 'Nodachi (Greatsword)' },
  { name: 'Katana', baseName: 'Bastard Sword', displayName: 'Katana (Bastard Sword)' },
  { name: 'Wakizashi', baseName: 'Short Sword', displayName: 'Wakizashi (Short Sword)' },
  { name: 'Naginata', baseName: 'Glaive', displayName: 'Naginata (Glaive)' },
  { name: 'Broadsword', baseName: 'Longsword', displayName: 'Broadsword (Longsword)' },
  { name: 'Saber', baseName: 'Scimitar', displayName: 'Saber (Scimitar)' },
  { name: 'Claymore', baseName: 'Greatsword', displayName: 'Claymore (Greatsword)' },
  { name: 'Estoc', baseName: 'Rapier', displayName: 'Estoc (Rapier)' },
  { name: 'Gladius', baseName: 'Short Sword', displayName: 'Gladius (Short Sword)' },
  { name: 'Messer', baseName: 'Scimitar', displayName: 'Messer (Scimitar)' }
];

export const STANDARD_BASE_WEAPONS: Record<string, WeaponData> = {
  greatsword: { id: 'greatsword', name: 'Greatsword', category: 'Martial', size: 'T', damageM: '2d6', threat: 19, critMultiplier: 2, weight: 8, type: 'Slashing', source: 'PHB' },
  longsword: { id: 'longsword', name: 'Longsword', category: 'Martial', size: 'O', damageM: '1d8', threat: 19, critMultiplier: 2, weight: 4, type: 'Slashing', source: 'PHB' },
  'bastard sword': { id: 'bastard_sword', name: 'Bastard Sword', category: 'Exotic', size: 'O', damageM: '1d10', threat: 19, critMultiplier: 2, weight: 6, type: 'Slashing', source: 'PHB' },
  'short sword': { id: 'short_sword', name: 'Short Sword', category: 'Martial', size: 'L', damageM: '1d6', threat: 19, critMultiplier: 2, weight: 2, type: 'Piercing', source: 'PHB' },
  dagger: { id: 'dagger', name: 'Dagger', category: 'Simple', size: 'L', damageM: '1d4', threat: 19, critMultiplier: 2, weight: 1, type: 'Piercing or Slashing', source: 'PHB' },
  scimitar: { id: 'scimitar', name: 'Scimitar', category: 'Martial', size: 'O', damageM: '1d6', threat: 18, critMultiplier: 2, weight: 4, type: 'Slashing', source: 'PHB' },
  rapier: { id: 'rapier', name: 'Rapier', category: 'Martial', size: 'O', damageM: '1d6', threat: 18, critMultiplier: 2, weight: 2, type: 'Piercing', source: 'PHB' },
  falchion: { id: 'falchion', name: 'Falchion', category: 'Martial', size: 'T', damageM: '2d4', threat: 18, critMultiplier: 2, weight: 8, type: 'Slashing', source: 'PHB' },
  glaive: { id: 'glaive', name: 'Glaive', category: 'Martial', size: 'T', damageM: '1d10', threat: 20, critMultiplier: 3, weight: 10, type: 'Slashing', source: 'PHB' },
  halberd: { id: 'halberd', name: 'Halberd', category: 'Martial', size: 'T', damageM: '1d10', threat: 20, critMultiplier: 3, weight: 12, type: 'Piercing or Slashing', source: 'PHB' },
  greataxe: { id: 'greataxe', name: 'Greataxe', category: 'Martial', size: 'T', damageM: '1d12', threat: 20, critMultiplier: 3, weight: 12, type: 'Slashing', source: 'PHB' },
  battleaxe: { id: 'battleaxe', name: 'Battleaxe', category: 'Martial', size: 'O', damageM: '1d8', threat: 20, critMultiplier: 3, weight: 6, type: 'Slashing', source: 'PHB' },
  handaxe: { id: 'handaxe', name: 'Handaxe', category: 'Martial', size: 'L', damageM: '1d6', threat: 20, critMultiplier: 3, weight: 3, type: 'Slashing', source: 'PHB' },
  warhammer: { id: 'warhammer', name: 'Warhammer', category: 'Martial', size: 'O', damageM: '1d8', threat: 20, critMultiplier: 3, weight: 5, type: 'Bludgeoning', source: 'PHB' },
  longbow: { id: 'longbow', name: 'Longbow', category: 'Martial', size: 'R', damageM: '1d8', threat: 20, critMultiplier: 3, weight: 3, type: 'Piercing', source: 'PHB' },
  shortbow: { id: 'shortbow', name: 'Shortbow', category: 'Martial', size: 'R', damageM: '1d6', threat: 20, critMultiplier: 3, weight: 2, type: 'Piercing', source: 'PHB' }
};

/**
 * Returns the base weapon name for a themed weapon or aliased weapon name, or null if none.
 * e.g. "Nodachi" -> "greatsword", "Nodachi (Greatsword)" -> "greatsword".
 * Excludes official weapons with parenthetical text (e.g. "Tangat, Talenta (Halfling)")
 * and non-weapons (e.g. "Torches (5)", "Trail Rations (1 day)").
 */
export function getThemedWeaponBase(
  name: string | undefined,
  weaponsData?: WeaponData[]
): string | null {
  if (!name) return null;
  const clean = name.toLowerCase().trim();

  // 1. Direct match in well-known themed weapon map (e.g. "nodachi" -> "greatsword")
  if (THEMED_WEAPON_BASE_MAP[clean]) {
    return THEMED_WEAPON_BASE_MAP[clean];
  }

  // 2. Check alias pattern "Custom Name (Base Weapon)" e.g. "Nodachi (Greatsword)"
  const aliasMatch = clean.match(/^(.+?)\s*\((.+?)\)$/);
  if (aliasMatch) {
    const prefix = aliasMatch[1].trim().toLowerCase();
    const suffix = aliasMatch[2].trim().toLowerCase();

    // If the prefix is a known themed weapon (e.g. "Nodachi (Greatsword)")
    if (THEMED_WEAPON_BASE_MAP[prefix]) {
      return THEMED_WEAPON_BASE_MAP[prefix];
    }

    // Exclude official weapons whose canonical name contains parentheses (e.g. "Tangat, Talenta (Halfling)")
    if (clean === 'tangat, talenta (halfling)') {
      return null;
    }
    if (weaponsData && weaponsData.some(w => w.name.toLowerCase() === clean)) {
      return null;
    }

    // Check if the suffix is a recognized standard base weapon
    if (STANDARD_BASE_WEAPONS[suffix] !== undefined) {
      return suffix;
    }
    if (Object.values(THEMED_WEAPON_BASE_MAP).includes(suffix)) {
      return suffix;
    }
    if (weaponsData && weaponsData.some(w => w.name.toLowerCase() === suffix)) {
      return suffix;
    }
  }

  return null;
}

/**
 * Resolves a weapon name to full WeaponData.
 * Supports format: "Custom Name (Base Model Name)" (e.g. "Nodachi (Greatsword)")
 * or well-known themed names (e.g. "Nodachi" -> Greatsword stats).
 */
export function resolveWeapon(
  rawName: string | undefined,
  customWeapons: WeaponData[] = [],
  weaponsData: WeaponData[] = []
): WeaponData {
  if (!rawName || !rawName.trim() || rawName.trim().toLowerCase() === 'none') {
    return normalizeWeapon(DEFAULT_WEAPON);
  }

  const cleanName = rawName.trim();
  const lowerName = cleanName.toLowerCase();
  const lowerWithSpaces = lowerName.replace(/_/g, ' ');

  // 1. Check direct match in customWeapons
  const customMatch = customWeapons.find(
    w => w.name.toLowerCase() === lowerName ||
         (w.id && w.id.toLowerCase() === lowerName) ||
         w.name.toLowerCase() === lowerWithSpaces
  );
  if (customMatch) return normalizeWeapon(customMatch);

  // 2. Check direct match in standard weaponsData
  const stdMatch = weaponsData.find(
    w => w.name.toLowerCase() === lowerName ||
         (w.id && w.id.toLowerCase() === lowerName) ||
         w.name.toLowerCase() === lowerWithSpaces ||
         w.name.toLowerCase().replace(/[\s\/-]+/g, '_') === lowerName
  );
  if (stdMatch) return normalizeWeapon({ ...stdMatch, source: stdMatch.source || 'PHB' });

  // 2b. Check in STANDARD_BASE_WEAPONS (e.g. "longsword", "bastard sword", "bastard_sword")
  const stdBase = STANDARD_BASE_WEAPONS[lowerName] ||
                  STANDARD_BASE_WEAPONS[lowerWithSpaces];
  if (stdBase) return normalizeWeapon(stdBase);

  // 3. Check aliased pattern: "Custom Name (Base Weapon)" e.g. "Nodachi (Greatsword)"
  // or well-known themed weapon map: e.g. "Nodachi" -> "greatsword"
  const themedBase = getThemedWeaponBase(cleanName, weaponsData);
  let baseName: string | null = themedBase;
  if (!baseName) {
    const aliasMatch = cleanName.match(/^(.+?)\s*\((.+?)\)$/);
    if (aliasMatch) {
      const candidateBase = aliasMatch[2].trim().toLowerCase();
      if (STANDARD_BASE_WEAPONS[candidateBase] || (weaponsData && weaponsData.some(w => w.name.toLowerCase() === candidateBase))) {
        baseName = candidateBase;
      }
    }
  }

  if (baseName) {
    // Look for base model match in custom or standard weapons
    const baseCustomMatch = customWeapons.find(
      w => w.name.toLowerCase() === baseName!.toLowerCase()
    );
    if (baseCustomMatch) {
      return normalizeWeapon({ ...baseCustomMatch, name: cleanName, source: baseCustomMatch.source || 'PHB' });
    }

    const baseStdMatch = weaponsData.find(
      w => w.name.toLowerCase() === baseName!.toLowerCase() ||
           w.name.toLowerCase().includes(baseName!.toLowerCase()) ||
           baseName!.toLowerCase().includes(w.name.toLowerCase())
    ) || STANDARD_BASE_WEAPONS[baseName.toLowerCase()];
    if (baseStdMatch) {
      return normalizeWeapon({ ...baseStdMatch, name: cleanName, source: baseStdMatch.source || 'PHB' });
    }
  }

  // 4. Check if cleanName is a magic or masterwork weapon name e.g. "+1 Flaming Longsword", "Masterwork Longsword"
  const parsedMagicWpn = parseMagicItemName(cleanName);
  if (parsedMagicWpn.enhancementBonus > 0 || parsedMagicWpn.qualities.length > 0 || parsedMagicWpn.isMasterwork) {
    const baseWpn = resolveWeapon(parsedMagicWpn.baseName, customWeapons, weaponsData);
    if (baseWpn && (baseWpn.id !== 'unarmed' || parsedMagicWpn.baseName.toLowerCase().includes('unarmed'))) {
      const isMwk = Boolean(parsedMagicWpn.isMasterwork || parsedMagicWpn.enhancementBonus > 0 || (baseWpn as any).isMasterwork);
      return normalizeWeapon({
        ...baseWpn,
        name: cleanName,
        enhancementBonus: parsedMagicWpn.enhancementBonus,
        specialQualities: parsedMagicWpn.qualities,
        isMasterwork: isMwk
      });
    }
  }

  // 5. Default fallback with custom name
  return normalizeWeapon({
    id: cleanName.toLowerCase().replace(/\s+/g, '_'),
    name: cleanName,
    category: 'Martial',
    size: 'M',
    damageM: '1d8',
    threat: 20,
    critMultiplier: 2,
    weight: 4,
    type: 'Slashing',
    source: 'Custom'
  });
}

export interface ResolvedArmor {
  name: string;
  acBonus: number;
  maxDex: number;
  checkPenalty: number;
  type?: 'light' | 'medium' | 'heavy' | 'shield' | 'none';
  weight?: number;
  spellFailure?: number;
  speedPenalty?: boolean;
  enhancementBonus?: number;
  specialQualities?: string[];
  baseArmorId?: string;
  material?: EquipmentMaterial | string;
  isMasterwork?: boolean;
}

export interface ResolvedShield {
  name: string;
  acBonus: number;
  checkPenalty: number;
  type: 'shield';
  weight?: number;
  spellFailure?: number;
  enhancementBonus?: number;
  specialQualities?: string[];
  baseArmorId?: string;
  material?: EquipmentMaterial | string;
  isMasterwork?: boolean;
}

/**
 * Applies material modifications to base armor data (e.g. Mithral reduces weight, check penalty, increases max dex).
 * Also reduces Armor Check Penalty by 1 for masterwork armor or shield (min 0).
 */
export function applyMaterialToArmorData(
  baseData: ItemArmorData,
  material?: string,
  isMasterwork?: boolean
): ItemArmorData {
  if (!material || material === 'standard') {
    if (isMasterwork) {
      return {
        ...baseData,
        armorCheckPenalty: Math.min(0, baseData.armorCheckPenalty + 1),
        isMasterwork: true
      };
    }
    return { ...baseData };
  }
  const mat = material.toLowerCase();
  if (mat === 'mithral' || mat === 'mithril') {
    const adjustedType = baseData.type === 'heavy' ? 'medium' : (baseData.type === 'medium' ? 'light' : baseData.type);
    return {
      ...baseData,
      type: adjustedType,
      maxDex: baseData.maxDex + 2,
      armorCheckPenalty: Math.min(0, baseData.armorCheckPenalty + 3),
      spellFailure: Math.max(0, (baseData.spellFailure ?? 0) - 10),
      speedPenalty: adjustedType === 'medium',
      isMasterwork: true
    };
  }
  if (mat === 'darkwood' && baseData.type === 'shield') {
    return {
      ...baseData,
      armorCheckPenalty: Math.min(0, baseData.armorCheckPenalty + 2),
      isMasterwork: true
    };
  }
  if (isMasterwork || mat === 'adamantine') {
    return {
      ...baseData,
      armorCheckPenalty: Math.min(0, baseData.armorCheckPenalty + 1),
      isMasterwork: true
    };
  }
  return { ...baseData };
}

/**
 * Applies material weight modifications (e.g. Mithral and Darkwood halve weight).
 */
export function applyMaterialToWeight(
  baseWeight: number,
  material?: string
): number {
  if (!material || material === 'standard') return baseWeight;
  const mat = material.toLowerCase();
  if (mat === 'mithral' || mat === 'mithril' || mat === 'darkwood') {
    return Math.round(baseWeight * 0.5 * 10) / 10;
  }
  return baseWeight;
}

/**
 * Resolves an armor key/name to Armor stats.
 */
export function resolveArmor(
  armorKey: string | undefined,
  customArmors: CustomArmorData[] = []
): ResolvedArmor {
  if (!armorKey) return STANDARD_ARMOR_MAP.none;

  const keyLower = armorKey.toLowerCase().trim();

  // 1. Direct key match
  if (STANDARD_ARMOR_MAP[keyLower]) {
    return STANDARD_ARMOR_MAP[keyLower];
  }

  // 2. Custom armor match
  const customMatch = customArmors.find(
    a => (a.name.toLowerCase() === keyLower || a.id.toLowerCase() === keyLower) && a.type !== 'shield'
  );
  if (customMatch) {
    return {
      name: customMatch.name,
      acBonus: customMatch.acBonus,
      maxDex: customMatch.maxDex ?? 99,
      checkPenalty: customMatch.armorCheckPenalty ?? 0,
      type: (customMatch.type as any) || 'medium',
      weight: customMatch.weight ?? 20,
      spellFailure: 20,
      speedPenalty: customMatch.type === 'heavy' || customMatch.type === 'medium',
      enhancementBonus: customMatch.enhancementBonus,
      specialQualities: customMatch.specialQualities,
      baseArmorId: customMatch.baseArmorId || customMatch.id
    };
  }

  // 3. Name or fuzzy key match in STANDARD_ARMOR_MAP
  const stdMatch = Object.values(STANDARD_ARMOR_MAP).find(
    a => a.name.toLowerCase() === keyLower ||
         a.name.toLowerCase().replace(/ armor$/i, '') === keyLower ||
         keyLower.replace(/ armor$/i, '') === a.name.toLowerCase()
  );
  if (stdMatch) return stdMatch;

  const normKey = keyLower.replace(/[^a-z0-9]/g, '');
  if (STANDARD_ARMOR_MAP[normKey]) return STANDARD_ARMOR_MAP[normKey];

  // 3b. Material prefixes e.g. "Adamantine Full Plate", "Mithral Chain Shirt"
  const cleanMaterialKey = keyLower.replace(/^(adamantine|mithral|mithril|dragonhide|darkwood)\s+/i, '');
  if (cleanMaterialKey !== keyLower) {
    const baseResolved = resolveArmor(cleanMaterialKey, customArmors);
    if (baseResolved && baseResolved.type !== 'none') {
      const mat = keyLower.split(' ')[0].toLowerCase();
      const isMwk = mat === 'mithral' || mat === 'mithril' || mat === 'adamantine';
      return {
        ...baseResolved,
        name: armorKey,
        baseArmorId: baseResolved.baseArmorId || baseResolved.name,
        isMasterwork: isMwk ? true : baseResolved.isMasterwork
      };
    }
  }

  // 4. Magic armor name e.g. "+1 Chain Shirt", "+2 Shadow Leather Armor", "Masterwork Full Plate"
  const parsedMagicArmor = parseMagicItemName(armorKey, 'armor');
  if (parsedMagicArmor.enhancementBonus > 0 || parsedMagicArmor.qualities.length > 0 || parsedMagicArmor.isMasterwork) {
    const baseArmor = resolveArmor(parsedMagicArmor.baseName, customArmors);
    if (baseArmor && (baseArmor.name.toLowerCase() !== 'none' || parsedMagicArmor.baseName.toLowerCase() === 'none')) {
      const isMwk = Boolean(parsedMagicArmor.isMasterwork || parsedMagicArmor.enhancementBonus > 0 || baseArmor.isMasterwork);
      const checkPenalty = (isMwk && !baseArmor.isMasterwork)
        ? Math.min(0, baseArmor.checkPenalty + 1)
        : baseArmor.checkPenalty;
      return {
        ...baseArmor,
        name: armorKey,
        enhancementBonus: parsedMagicArmor.enhancementBonus,
        specialQualities: parsedMagicArmor.qualities,
        baseArmorId: baseArmor.baseArmorId || baseArmor.name,
        checkPenalty,
        isMasterwork: isMwk
      };
    }
  }

  return { name: armorKey, acBonus: 0, maxDex: 99, checkPenalty: 0, type: 'none', weight: 0, spellFailure: 0, speedPenalty: false };
}

/**
 * Resolves a shield key/name to Shield stats.
 */
export function resolveShield(
  shieldKey: string | undefined,
  customArmors: CustomArmorData[] = []
): ResolvedShield {
  if (!shieldKey) return STANDARD_SHIELD_MAP.none;

  const keyLower = shieldKey.toLowerCase().trim();

  // 1. Direct key match
  if (STANDARD_SHIELD_MAP[keyLower]) {
    return STANDARD_SHIELD_MAP[keyLower];
  }

  // 2. Custom shield match
  const customMatch = customArmors.find(
    a => (a.name.toLowerCase() === keyLower || a.id.toLowerCase() === keyLower) && a.type === 'shield'
  );
  if (customMatch) {
    return {
      name: customMatch.name,
      acBonus: customMatch.acBonus,
      checkPenalty: customMatch.armorCheckPenalty ?? 0,
      type: 'shield',
      weight: customMatch.weight ?? 10,
      spellFailure: 15,
      enhancementBonus: customMatch.enhancementBonus,
      specialQualities: customMatch.specialQualities,
      baseArmorId: customMatch.baseArmorId || customMatch.id,
      isMasterwork: customMatch.isMasterwork
    };
  }

  // 3. Name or fuzzy key match in STANDARD_SHIELD_MAP
  const stdMatch = Object.values(STANDARD_SHIELD_MAP).find(
    s => s.name.toLowerCase() === keyLower ||
         s.name.toLowerCase().replace(/ shield$/i, '') === keyLower ||
         keyLower.replace(/ shield$/i, '') === s.name.toLowerCase()
  );
  if (stdMatch) return stdMatch;

  const normKey = keyLower.replace(/[^a-z0-9]/g, '');
  if (STANDARD_SHIELD_MAP[normKey]) return STANDARD_SHIELD_MAP[normKey];

  // 3b. Material prefixes e.g. "Mithral Heavy Shield", "Darkwood Buckler"
  const cleanMaterialKey = keyLower.replace(/^(adamantine|mithral|mithril|dragonhide|darkwood)\s+/i, '');
  if (cleanMaterialKey !== keyLower) {
    const baseResolved = resolveShield(cleanMaterialKey, customArmors);
    if (baseResolved && baseResolved.name.toLowerCase() !== 'none') {
      const mat = keyLower.split(' ')[0].toLowerCase();
      const isMwk = mat === 'mithral' || mat === 'mithril' || mat === 'darkwood' || mat === 'adamantine';
      return {
        ...baseResolved,
        name: shieldKey,
        baseArmorId: baseResolved.baseArmorId || baseResolved.name,
        isMasterwork: isMwk ? true : baseResolved.isMasterwork
      };
    }
  }

  // 4. Magic shield name e.g. "+1 Heavy Shield", "Masterwork Heavy Shield"
  const parsedMagicShield = parseMagicItemName(shieldKey, 'shield');
  if (parsedMagicShield.enhancementBonus > 0 || parsedMagicShield.qualities.length > 0 || parsedMagicShield.isMasterwork) {
    const baseShield = resolveShield(parsedMagicShield.baseName, customArmors);
    if (baseShield && (baseShield.name.toLowerCase() !== 'none' || parsedMagicShield.baseName.toLowerCase() === 'none')) {
      const isMwk = Boolean(parsedMagicShield.isMasterwork || parsedMagicShield.enhancementBonus > 0 || baseShield.isMasterwork);
      const checkPenalty = (isMwk && !baseShield.isMasterwork)
        ? Math.min(0, baseShield.checkPenalty + 1)
        : baseShield.checkPenalty;
      return {
        ...baseShield,
        name: shieldKey,
        enhancementBonus: parsedMagicShield.enhancementBonus,
        specialQualities: parsedMagicShield.qualities,
        baseArmorId: baseShield.baseArmorId || baseShield.name,
        checkPenalty,
        isMasterwork: isMwk
      };
    }
  }

  return { name: shieldKey, acBonus: 0, checkPenalty: 0, type: 'shield', weight: 0, spellFailure: 0 };
}

/**
 * Calculates combat attack and damage bonuses derived from parameterized feats
 * matching the specified weapon (e.g. Weapon Focus (Nodachi)).
 */
export function calculateFeatCombatBonuses(
  character: CharacterState,
  weapon: WeaponData
): { attackBonus: number; damageBonus: number } {
  let attackBonus = 0;
  let damageBonus = 0;

  const rawWpnName = (weapon.name || '').toLowerCase().trim();

  // Strip magic prefixes like "+1 ", "+2 Keen "
  const parsed = parseMagicItemName(rawWpnName);
  const baseParsedName = (parsed.baseName || rawWpnName).toLowerCase().trim();

  // Strip count suffixes like " (2x)" on natural attacks
  const cleanWpnName = baseParsedName.replace(/\s*\(\d+x\)$/i, '').trim();

  // Extract base model if alias pattern exists, e.g. "Nodachi (Greatsword)" -> "greatsword"
  // or via themed weapon map e.g. "Nodachi" -> "greatsword"
  const aliasMatch = cleanWpnName.match(/^(.+?)\s*\((.+?)\)$/);
  const themedBase = getThemedWeaponBase(cleanWpnName);
  const customSubName = aliasMatch ? aliasMatch[1].trim().toLowerCase() : cleanWpnName;
  const baseSubName = aliasMatch
    ? aliasMatch[2].trim().toLowerCase()
    : (themedBase ? themedBase.toLowerCase() : cleanWpnName);

  // Composite bow equivalence (e.g. Composite Longbow qualifies for Longbow focus)
  const baseWithoutComposite = cleanWpnName.startsWith('composite ')
    ? cleanWpnName.replace(/^composite\s+/, '').trim()
    : null;

  const wpnId = (weapon.id || '').toLowerCase().trim();
  const baseWpnId = (weapon.baseWeaponId || '').toLowerCase().trim();

  const isWeaponMatch = (target: string): boolean => {
    const t = target.toLowerCase().trim();
    const tWithSpaces = t.replace(/_/g, ' ');
    const tWithUnderscores = t.replace(/\s+/g, '_');
    return (
      t === rawWpnName ||
      t === cleanWpnName ||
      t === customSubName ||
      t === baseSubName ||
      (baseWithoutComposite !== null && t === baseWithoutComposite) ||
      tWithSpaces === rawWpnName ||
      tWithSpaces === cleanWpnName ||
      tWithSpaces === customSubName ||
      tWithSpaces === baseSubName ||
      (baseWithoutComposite !== null && tWithSpaces === baseWithoutComposite) ||
      (wpnId.length > 0 && (t === wpnId || tWithUnderscores === wpnId)) ||
      (baseWpnId.length > 0 && (t === baseWpnId || tWithUnderscores === baseWpnId))
    );
  };

  const applyBonus = (featNameOrId: string) => {
    const key = featNameOrId.toLowerCase().replace(/[\s\-]+/g, '_');
    if (key === 'weapon_focus') attackBonus += 1;
    if (key === 'greater_weapon_focus') attackBonus += 1;
    if (key === 'weapon_specialization') damageBonus += 2;
    if (key === 'greater_weapon_specialization') damageBonus += 2;
    if (key === 'epic_weapon_focus') attackBonus += 2;
    if (key === 'epic_weapon_specialization') damageBonus += 4;
  };

  // 1. Check structured CharacterFeat entities first if present
  if (Array.isArray(character.selectedFeatEntities) && character.selectedFeatEntities.length > 0) {
    character.selectedFeatEntities.forEach(entity => {
      if (!entity.featId || !entity.targetId) return;
      if (isWeaponMatch(entity.targetId)) {
        applyBonus(entity.featId);
      }
    });
    return { attackBonus, damageBonus };
  }

  // 2. Fallback to legacy string parsing
  const selectedFeats = character.selectedFeats || [];
  selectedFeats.forEach(featStr => {
    const featMatch = featStr.match(/^(.+?)(?:\s*[\(:])\s*(.+?)\)?$/);
    if (!featMatch) return;

    const featName = featMatch[1].trim();
    const featTarget = featMatch[2].trim();

    if (isWeaponMatch(featTarget)) {
      applyBonus(featName);
    }
  });

  return { attackBonus, damageBonus };
}

// D&D 3.5e Standard Carrying Capacity Table (Heavy Load Max for Medium Biped)
const BASE_HEAVY_LOAD: Record<number, number> = {
  0: 0, 1: 10, 2: 20, 3: 30, 4: 40, 5: 50, 6: 60, 7: 70, 8: 80, 9: 90,
  10: 100, 11: 115, 12: 130, 13: 150, 14: 175, 15: 200, 16: 230, 17: 260, 18: 300, 19: 350,
  20: 400, 21: 460, 22: 520, 23: 600, 24: 700, 25: 800, 26: 920, 27: 1040, 28: 1200, 29: 1400
};

const SIZE_CARRYING_MULTIPLIERS: Record<string, number> = {
  Fine: 0.125,
  Diminutive: 0.25,
  Tiny: 0.5,
  Small: 0.75,
  Medium: 1.0,
  Large: 2.0,
  Huge: 4.0,
  Gargantuan: 8.0,
  Colossal: 16.0
};

export interface CarryingCapacity {
  light: number;
  medium: number;
  heavy: number;
  overhead: number;
  offGround: number;
  pushDrag: number;
}

/**
 * Calculates D&D 3.5e Carrying Capacity based on Strength score and Creature Size.
 */
export function calculateCarryingCapacity(strScore: number, sizeStr: string = 'Medium'): CarryingCapacity {
  const str = Math.max(0, strScore);

  let baseHeavy = 0;
  if (str <= 29) {
    baseHeavy = BASE_HEAVY_LOAD[str] || 0;
  } else {
    const tens = Math.floor((str - 20) / 10);
    const base = str - (tens * 10);
    baseHeavy = (BASE_HEAVY_LOAD[base] || 100) * Math.pow(4, tens);
  }

  const sizeMult = SIZE_CARRYING_MULTIPLIERS[sizeStr] ?? 1.0;
  const maxHeavy = Math.round(baseHeavy * sizeMult);

  const light = Math.round(maxHeavy * (1 / 3));
  const medium = Math.round(maxHeavy * (2 / 3));

  return {
    light,
    medium,
    heavy: maxHeavy,
    overhead: maxHeavy,
    offGround: maxHeavy * 2,
    pushDrag: maxHeavy * 5
  };
}

export const ARMOR_WEIGHT_MAP: Record<string, number> = {
  none: 0,
  padded: 10,
  'padded armor': 10,
  leather: 15,
  'leather armor': 15,
  studded: 20,
  'studded leather': 20,
  'studded leather armor': 20,
  chainshirt: 25,
  'chain shirt': 25,
  breastplate: 30,
  fullplate: 50,
  'full plate': 50,
  hide: 25,
  'hide armor': 25,
  scale_mail: 30,
  'scale mail': 30,
  chainmail: 40,
  banded_mail: 35,
  'banded mail': 35,
  splint_mail: 45,
  'splint mail': 45,
  half_plate: 50,
  'half-plate': 50,
  'half plate': 50
};

export const SHIELD_WEIGHT_MAP: Record<string, number> = {
  none: 0,
  buckler: 5,
  light_wooden: 5,
  'light shield': 5,
  'light wooden shield': 5,
  'light steel shield': 5,
  heavy_shield: 15,
  'heavy shield': 15,
  'heavy steel shield': 15,
  'heavy wooden shield': 15,
  tower_shield: 45,
  'tower shield': 45
};

/**
 * Calculates total coin weight in lbs (50 coins per lb in D&D 3.5e).
 */
export function calculateCoinWeight(funds?: { cp: number; sp: number; gp: number; pp: number }): number {
  if (!funds) return 0;
  const totalCoins = (funds.cp || 0) + (funds.sp || 0) + (funds.gp || 0) + (funds.pp || 0);
  return parseFloat((totalCoins / 50).toFixed(2));
}

/**
 * Calculates net worth in Gold Pieces (GP).
 * 10 CP = 1 SP, 10 SP = 1 GP, 10 GP = 1 PP.
 */
export function calculateTotalNetWorthGP(funds?: { cp: number; sp: number; gp: number; pp: number; otherValuables?: number }): number {
  if (!funds) return 0;
  const cpInGp = (funds.cp || 0) / 100;
  const spInGp = (funds.sp || 0) / 10;
  const gp = funds.gp || 0;
  const ppInGp = (funds.pp || 0) * 10;
  const standardValuables = funds.otherValuables || 0;
  return parseFloat((cpInGp + spInGp + gp + ppInGp + standardValuables).toFixed(2));
}

/**
 * Helper to check if two item names match, ignoring case, optional parenthetical aliases,
 * and canonical armor/shield key aliases (e.g. "studded" vs "Studded Leather Armor").
 */
export function matchesItemName(name1: string | undefined, name2: string | undefined): boolean {
  if (!name1 || !name2) return false;
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();
  if (!n1 || !n2 || n1 === 'none' || n2 === 'none' || n1 === '__custom__' || n2 === '__custom__') return false;
  if (n1 === n2) return true;
  const stripped1 = n1.replace(/\s*\(.*?\)\s*/g, '').trim();
  const stripped2 = n2.replace(/\s*\(.*?\)\s*/g, '').trim();
  if (stripped1 !== '' && stripped1 === stripped2) return true;

  // Check if both resolve to the exact same standard armor name
  const arm1 = resolveArmor(n1);
  const arm2 = resolveArmor(n2);
  if (arm1.acBonus > 0 && arm2.acBonus > 0 && arm1.name.toLowerCase() === arm2.name.toLowerCase()) {
    return true;
  }

  // Check if both resolve to the exact same standard shield name
  const shd1 = resolveShield(n1);
  const shd2 = resolveShield(n2);
  if (shd1.acBonus > 0 && shd2.acBonus > 0 && shd1.name.toLowerCase() === shd2.name.toLowerCase()) {
    return true;
  }

  return false;
}

/**
 * Helper to check if an item by name is present in inventory.
 */
export function isItemInInventory(inventory: InventoryItem[] = [], name: string | undefined): boolean {
  if (!name || !name.trim() || name.toLowerCase().trim() === 'none' || name.trim() === '__CUSTOM__') return false;
  return inventory.some(i => matchesItemName(i.name, name));
}

/**
 * Ensures an equipped item exists in character.inventory.
 * Returns updated inventory array (or unchanged array if already present).
 */
export function ensureEquippedItemInInventory(
  inventory: InventoryItem[] = [],
  itemData: {
    name: string;
    weight: number;
    location?: string;
    value?: string;
    notes?: string;
    enhancementBonus?: number;
    specialQualities?: string[];
    material?: EquipmentMaterial | string;
    baseItemId?: string;
    itemType?: 'weapon' | 'armor' | 'shield' | 'wondrous' | 'gear' | 'consumable';
    armorData?: ItemArmorData;
    weaponData?: ItemWeaponData;
  }
): InventoryItem[] {
  if (!itemData.name || !itemData.name.trim() || itemData.name.toLowerCase().trim() === 'none' || itemData.name.trim() === '__CUSTOM__') {
    return inventory;
  }
  const cleanName = itemData.name.trim();

  // Check if item already exists in inventory (case-insensitive and alias-aware)
  const existingIdx = inventory.findIndex(i => matchesItemName(i.name, cleanName));
  if (existingIdx >= 0) {
    const existing = inventory[existingIdx];
    let needsUpdate = false;
    let newEnh = existing.enhancementBonus;
    let newQualities = existing.specialQualities;
    let newBaseId = existing.baseItemId;
    let newMaterial = existing.material;
    let newType = existing.itemType;
    let newArmorData = existing.armorData;
    let newWeaponData = existing.weaponData;

    if (itemData.enhancementBonus !== undefined && existing.enhancementBonus === undefined) {
      newEnh = itemData.enhancementBonus;
      needsUpdate = true;
    }
    if (itemData.specialQualities && itemData.specialQualities.length > 0 && (!existing.specialQualities || existing.specialQualities.length === 0)) {
      newQualities = [...itemData.specialQualities];
      needsUpdate = true;
    }
    if (itemData.baseItemId && !existing.baseItemId) {
      newBaseId = itemData.baseItemId;
      needsUpdate = true;
    }
    if (itemData.material && (!existing.material || existing.material === 'standard')) {
      newMaterial = itemData.material;
      needsUpdate = true;
    }
    if (itemData.itemType && !existing.itemType) {
      newType = itemData.itemType;
      needsUpdate = true;
    }
    if (itemData.armorData && !existing.armorData) {
      newArmorData = { ...itemData.armorData };
      needsUpdate = true;
    }
    if (itemData.weaponData && !existing.weaponData) {
      newWeaponData = { ...itemData.weaponData };
      needsUpdate = true;
    }

    if (needsUpdate) {
      const updated = [...inventory];
      updated[existingIdx] = {
        ...existing,
        enhancementBonus: newEnh,
        specialQualities: newQualities,
        baseItemId: newBaseId,
        material: newMaterial,
        itemType: newType,
        armorData: newArmorData,
        weaponData: newWeaponData
      };
      return updated;
    }
    return inventory;
  }

  const newItem: InventoryItem = {
    id: `inv_eq_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: cleanName,
    quantity: 1,
    weight: Math.max(0, itemData.weight || 0),
    location: itemData.location || 'Carried',
    value: itemData.value || '',
    notes: itemData.notes || '',
    enhancementBonus: itemData.enhancementBonus,
    specialQualities: itemData.specialQualities ? [...itemData.specialQualities] : undefined,
    baseItemId: itemData.baseItemId,
    material: itemData.material,
    itemType: itemData.itemType,
    armorData: itemData.armorData,
    weaponData: itemData.weaponData
  };

  return [...inventory, newItem];
}

/**
 * Creates a fully populated InventoryItem for a weapon.
 */
export function createInventoryWeapon(
  baseWeapon: WeaponData | string,
  arg2?: WeaponData[] | {
    id?: string;
    name?: string;
    quantity?: number;
    enhancementBonus?: number;
    specialQualities?: string[];
    baneTarget?: string;
    location?: string;
    material?: EquipmentMaterial | string;
    baseItemId?: string;
    isMasterwork?: boolean;
  },
  arg3?: WeaponData[] | {
    id?: string;
    name?: string;
    quantity?: number;
    enhancementBonus?: number;
    specialQualities?: string[];
    baneTarget?: string;
    location?: string;
    material?: EquipmentMaterial | string;
    baseItemId?: string;
    isMasterwork?: boolean;
  },
  arg4?: {
    id?: string;
    name?: string;
    quantity?: number;
    enhancementBonus?: number;
    specialQualities?: string[];
    baneTarget?: string;
    location?: string;
    material?: EquipmentMaterial | string;
    baseItemId?: string;
    isMasterwork?: boolean;
  }
): InventoryItem {
  let resolved: WeaponData;
  let options: {
    id?: string;
    name?: string;
    quantity?: number;
    enhancementBonus?: number;
    specialQualities?: string[];
    baneTarget?: string;
    location?: string;
    material?: EquipmentMaterial | string;
    baseItemId?: string;
    isMasterwork?: boolean;
  } | undefined;

  let parsedMagic: { material?: EquipmentMaterial | string; enhancementBonus: number; qualities: string[]; isMasterwork?: boolean; } = { material: 'standard', enhancementBonus: 0, qualities: [], isMasterwork: false };
  if (typeof baseWeapon === 'string') {
    parsedMagic = parseMagicItemName(baseWeapon, 'weapon');
    const weaponsData = Array.isArray(arg2) ? arg2 : [];
    const customWeapons = Array.isArray(arg3) ? arg3 : [];
    resolved = resolveWeapon(baseWeapon, customWeapons, weaponsData);
    options = (!Array.isArray(arg2) && typeof arg2 === 'object')
      ? arg2
      : ((!Array.isArray(arg3) && typeof arg3 === 'object') ? arg3 : arg4);
  } else {
    resolved = baseWeapon;
    parsedMagic = {
      material: (baseWeapon as any).material || 'standard',
      enhancementBonus: baseWeapon.enhancementBonus || 0,
      qualities: baseWeapon.specialQualities || [],
      isMasterwork: baseWeapon.isMasterwork || false
    };
    options = (!Array.isArray(arg2) && typeof arg2 === 'object') ? arg2 : undefined;
  }

  const mat = options?.material || parsedMagic.material || (resolved as any).material || 'standard';
  const enh = options?.enhancementBonus ?? (parsedMagic.enhancementBonus > 0 ? parsedMagic.enhancementBonus : (resolved.enhancementBonus ?? 0));
  const qualities = options?.specialQualities ?? (parsedMagic.qualities.length > 0 ? parsedMagic.qualities : (resolved.specialQualities ?? []));
  const baneTarget = options?.baneTarget ?? (resolved as any).baneTarget;
  const isMwk = options?.isMasterwork ?? Boolean(parsedMagic.isMasterwork || (resolved as any).isMasterwork || enh > 0 || mat === 'adamantine');
  const name = options?.name || (enh > 0 || qualities.length > 0 || (mat && mat !== 'standard') || isMwk
    ? formatMagicItemName(resolved.name, enh, qualities, mat, isMwk)
    : resolved.name);

  return {
    id: options?.id || `inv_wpn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name,
    quantity: options?.quantity ?? 1,
    weight: resolved.weight ?? 0,
    location: options?.location || 'Carried',
    itemType: 'weapon',
    material: mat,
    baseItemId: options?.baseItemId || resolved.id,
    enhancementBonus: enh,
    specialQualities: qualities,
    baneTarget,
    isMasterwork: isMwk,
    weaponData: {
      category: resolved.category,
      size: resolved.size,
      damageM: resolved.damageM,
      damageS: resolved.damageS,
      threat: resolved.threat ?? 20,
      critMultiplier: resolved.critMultiplier ?? 2,
      damageType: resolved.type,
      rangeIncrement: resolved.rangeIncrement,
      isRanged: resolved.category === 'Ranged' || resolved.size === 'Ranged',
      baneTarget,
      isMasterwork: isMwk
    }
  };
}

/**
 * Creates a fully populated InventoryItem for armor.
 */
export function createInventoryArmor(
  armorKey: string,
  customArmors: CustomArmorData[] = [],
  options?: {
    id?: string;
    name?: string;
    quantity?: number;
    enhancementBonus?: number;
    specialQualities?: string[];
    location?: string;
    material?: EquipmentMaterial | string;
    baseItemId?: string;
    isMasterwork?: boolean;
  }
): InventoryItem {
  const parsedMagic = parseMagicItemName(armorKey, 'armor');
  const mat = options?.material || parsedMagic.material || 'standard';
  const enh = options?.enhancementBonus ?? (parsedMagic.enhancementBonus > 0 ? parsedMagic.enhancementBonus : 0);
  const qualities = options?.specialQualities ?? (parsedMagic.qualities.length > 0 ? parsedMagic.qualities : []);
  const baseKey = options?.baseItemId || parsedMagic.baseName || armorKey;

  const resolved = resolveArmor(baseKey, customArmors);
  const isMwk = options?.isMasterwork ?? Boolean(parsedMagic.isMasterwork || resolved.isMasterwork || enh > 0 || mat === 'adamantine' || mat === 'mithral' || mat === 'mithril');
  const stdWeight = resolved.weight ?? (ARMOR_WEIGHT_MAP[resolved.name.toLowerCase()] ?? 20);
  const finalWeight = applyMaterialToWeight(stdWeight, mat);

  const baseArmorData: ItemArmorData = {
    type: (resolved.type as any) || 'medium',
    acBonus: resolved.acBonus,
    maxDex: resolved.maxDex ?? 99,
    armorCheckPenalty: resolved.checkPenalty ?? 0,
    spellFailure: resolved.spellFailure ?? 0,
    speedPenalty: resolved.speedPenalty ?? (resolved.type === 'heavy' || resolved.type === 'medium')
  };
  const finalArmorData = applyMaterialToArmorData(baseArmorData, mat, isMwk);

  const baseName = resolved.name;
  const name = options?.name || (enh > 0 || qualities.length > 0 || (mat && mat !== 'standard') || isMwk
    ? formatMagicItemName(baseName, enh, qualities, mat, isMwk)
    : resolved.name);

  return {
    id: options?.id || `inv_arm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name,
    quantity: options?.quantity ?? 1,
    weight: finalWeight,
    location: options?.location || 'Carried',
    itemType: 'armor',
    material: mat,
    baseItemId: options?.baseItemId || resolved.baseArmorId || resolved.name.toLowerCase().replace(/\s+/g, '_'),
    enhancementBonus: enh,
    specialQualities: qualities,
    isMasterwork: isMwk,
    armorData: finalArmorData
  };
}

/**
 * Creates a fully populated InventoryItem for a shield.
 */
export function createInventoryShield(
  shieldKey: string,
  customArmors: CustomArmorData[] = [],
  options?: {
    id?: string;
    name?: string;
    quantity?: number;
    enhancementBonus?: number;
    specialQualities?: string[];
    location?: string;
    material?: EquipmentMaterial | string;
    baseItemId?: string;
    isMasterwork?: boolean;
  }
): InventoryItem {
  const parsedMagic = parseMagicItemName(shieldKey, 'shield');
  const mat = options?.material || parsedMagic.material || 'standard';
  const enh = options?.enhancementBonus ?? (parsedMagic.enhancementBonus > 0 ? parsedMagic.enhancementBonus : 0);
  const qualities = options?.specialQualities ?? (parsedMagic.qualities.length > 0 ? parsedMagic.qualities : []);
  const baseKey = options?.baseItemId || parsedMagic.baseName || shieldKey;

  const resolved = resolveShield(baseKey, customArmors);
  const isMwk = options?.isMasterwork ?? Boolean(parsedMagic.isMasterwork || resolved.isMasterwork || enh > 0 || mat === 'adamantine' || mat === 'mithral' || mat === 'mithril' || mat === 'darkwood');
  const stdWeight = resolved.weight ?? (SHIELD_WEIGHT_MAP[resolved.name.toLowerCase()] ?? 10);
  const finalWeight = applyMaterialToWeight(stdWeight, mat);

  const baseArmorData: ItemArmorData = {
    type: 'shield',
    acBonus: resolved.acBonus,
    maxDex: 99,
    armorCheckPenalty: resolved.checkPenalty ?? 0,
    spellFailure: resolved.spellFailure ?? 0,
    speedPenalty: false
  };
  const finalArmorData = applyMaterialToArmorData(baseArmorData, mat, isMwk);

  const baseName = resolved.name;
  const name = options?.name || (enh > 0 || qualities.length > 0 || (mat && mat !== 'standard') || isMwk
    ? formatMagicItemName(baseName, enh, qualities, mat, isMwk)
    : resolved.name);

  return {
    id: options?.id || `inv_shd_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name,
    quantity: options?.quantity ?? 1,
    weight: finalWeight,
    location: options?.location || 'Carried',
    itemType: 'shield',
    material: mat,
    baseItemId: options?.baseItemId || resolved.baseArmorId || resolved.name.toLowerCase().replace(/\s+/g, '_'),
    enhancementBonus: enh,
    specialQualities: qualities,
    isMasterwork: isMwk,
    armorData: finalArmorData
  };
}

export function getEquippedArmorItem(character: CharacterState): InventoryItem | undefined {
  if (character.equipment?.armorItemId) {
    return character.inventory?.find(i => i.id === character.equipment!.armorItemId);
  }
  return undefined;
}

export function getEquippedShieldItem(character: CharacterState): InventoryItem | undefined {
  if (character.equipment?.shieldItemId) {
    return character.inventory?.find(i => i.id === character.equipment!.shieldItemId);
  }
  return undefined;
}

export function getEquippedWeaponItem(
  character: CharacterState,
  slot: 'primaryWeapon' | 'secondaryWeapon' | 'rangedWeapon'
): InventoryItem | undefined {
  const idKey = `${slot}ItemId` as keyof Equipment;
  const itemId = character.equipment?.[idKey] as string | undefined;
  if (itemId) {
    return character.inventory?.find(i => i.id === itemId);
  }
  return undefined;
}

export function resolveEquippedArmor(
  character: CharacterState,
  customArmors: CustomArmorData[] = []
): ResolvedArmor {
  const eq = character.equipment;
  if (!eq || !eq.armor || eq.armor === 'none') return resolveArmor('none', customArmors);
  if (eq.armorItemId && character.inventory) {
    const item = character.inventory.find(i => i.id === eq.armorItemId);
    if (item && item.armorData) {
      const mat = item.material || eq.armorMaterial || 'standard';
      const isMwk = Boolean(item.isMasterwork || eq.armorMasterwork || (item.enhancementBonus ? item.enhancementBonus > 0 : false) || mat === 'adamantine' || mat === 'mithral' || mat === 'mithril');
      return {
        name: item.name,
        acBonus: item.armorData.acBonus,
        checkPenalty: item.armorData.armorCheckPenalty,
        type: item.armorData.type,
        maxDex: item.armorData.maxDex,
        weight: item.weight ?? 0,
        speedPenalty: item.armorData.speedPenalty,
        spellFailure: item.armorData.spellFailure,
        enhancementBonus: item.enhancementBonus || 0,
        specialQualities: item.specialQualities ? [...item.specialQualities] : [],
        baseArmorId: item.baseItemId,
        material: mat,
        isMasterwork: isMwk
      };
    }
  }
  const resolved = resolveArmor(eq.armor, customArmors);
  const mat = eq.armorMaterial || resolved.material;
  const enh = eq.armorEnhancement || 0;
  const isInherentlyMwk = enh > 0 || mat === 'adamantine' || mat === 'mithral' || mat === 'mithril';
  const isMwk = isInherentlyMwk || (eq.armorMasterwork !== undefined ? eq.armorMasterwork : Boolean(resolved.isMasterwork));
  const checkPenalty = (isMwk && !resolved.isMasterwork)
    ? Math.min(0, resolved.checkPenalty + 1)
    : resolved.checkPenalty;
  return {
    ...resolved,
    checkPenalty,
    material: mat,
    isMasterwork: isMwk
  };
}

export function resolveEquippedShield(
  character: CharacterState,
  customArmors: CustomArmorData[] = []
): ResolvedShield {
  const eq = character.equipment;
  if (!eq || !eq.shield || eq.shield === 'none') return resolveShield('none', customArmors);
  if (eq.shieldItemId && character.inventory) {
    const item = character.inventory.find(i => i.id === eq.shieldItemId);
    if (item && item.armorData) {
      const mat = item.material || eq.shieldMaterial || 'standard';
      const enh = item.enhancementBonus || 0;
      const isInherentlyMwk = enh > 0 || mat === 'darkwood' || mat === 'adamantine' || mat === 'mithral' || mat === 'mithril';
      const isMwk = isInherentlyMwk || (eq.shieldMasterwork !== undefined ? eq.shieldMasterwork : Boolean(item.isMasterwork));
      return {
        name: item.name,
        acBonus: item.armorData.acBonus,
        checkPenalty: item.armorData.armorCheckPenalty,
        type: 'shield',
        weight: item.weight ?? 0,
        spellFailure: item.armorData.spellFailure,
        enhancementBonus: item.enhancementBonus || 0,
        specialQualities: item.specialQualities ? [...item.specialQualities] : [],
        baseArmorId: item.baseItemId,
        material: mat,
        isMasterwork: isMwk
      };
    }
  }
  const resolved = resolveShield(eq.shield, customArmors);
  const mat = eq.shieldMaterial || resolved.material;
  const enh = eq.shieldEnhancement || 0;
  const isInherentlyMwk = enh > 0 || mat === 'darkwood' || mat === 'adamantine' || mat === 'mithral' || mat === 'mithril';
  const isMwk = isInherentlyMwk || (eq.shieldMasterwork !== undefined ? eq.shieldMasterwork : Boolean(resolved.isMasterwork));
  const checkPenalty = (isMwk && !resolved.isMasterwork)
    ? Math.min(0, resolved.checkPenalty + 1)
    : resolved.checkPenalty;
  return {
    ...resolved,
    checkPenalty,
    material: mat,
    isMasterwork: isMwk
  };
}

export function resolveEquippedWeapon(
  character: CharacterState,
  slot: 'primaryWeapon' | 'secondaryWeapon' | 'rangedWeapon',
  weaponsData: WeaponData[] = [],
  customWeapons: WeaponData[] = []
): WeaponData {
  const eq = character.equipment;
  const slotName = eq?.[slot];
  if (!slotName || slotName === 'none') {
    return normalizeWeapon(DEFAULT_WEAPON);
  }
  const idKey = `${slot}ItemId` as keyof Equipment;
  const baneKey = `${slot}BaneTarget` as keyof Equipment;
  const mwkKey = `${slot}Masterwork` as keyof Equipment;
  const itemId = eq[idKey] as string | undefined;
  const eqBaneTarget = eq[baneKey] as string | undefined;
  const eqMwk = eq[mwkKey] as boolean | undefined;
  const matKey = `${slot}Material` as keyof Equipment;
  const eqMaterial = eq?.[matKey] as EquipmentMaterial | undefined;

  if (itemId && character.inventory) {
    const item = character.inventory.find(i => i.id === itemId);
    if (item && item.weaponData) {
      const mat = item.material || eqMaterial || 'standard';
      const enh = item.enhancementBonus || 0;
      const isInherentlyMwk = enh > 0 || mat === 'adamantine';
      const isMwk = isInherentlyMwk || (eqMwk !== undefined ? eqMwk : Boolean(item.isMasterwork));
      return {
        id: item.baseItemId || item.id,
        name: item.name,
        category: item.weaponData.category || 'Martial',
        size: item.weaponData.size || 'M',
        damageM: item.weaponData.damageM || '1d8',
        damageS: item.weaponData.damageS,
        threat: item.weaponData.threat ?? 20,
        critMultiplier: item.weaponData.critMultiplier ?? 2,
        weight: item.weight ?? 4,
        type: item.weaponData.damageType || 'Slashing',
        enhancementBonus: item.enhancementBonus || 0,
        specialQualities: item.specialQualities ? [...item.specialQualities] : [],
        baneTarget: eqBaneTarget || item.weaponData.baneTarget || item.baneTarget,
        material: mat,
        isMasterwork: isMwk,
        source: 'Custom'
      };
    }
  }
  const resolved = resolveWeapon(slotName, customWeapons, weaponsData);
  const finalMaterial = eqMaterial || resolved.material || 'standard';
  const enhKey = `${slot}Enhancement` as keyof Equipment;
  const eqEnh = (eq[enhKey] as number) || 0;
  const isInherentlyMwk = (eqEnh > 0) || finalMaterial === 'adamantine';
  const isMwk = isInherentlyMwk || (eqMwk !== undefined ? eqMwk : Boolean(resolved.isMasterwork));
  return {
    ...resolved,
    baneTarget: eqBaneTarget || resolved.baneTarget,
    material: finalMaterial,
    isMasterwork: isMwk
  };
}

/**
 * In D&D 3.5e, Masterwork weapons and Adamantine weapons grant a +1 enhancement bonus on attack rolls.
 * Because enhancement bonuses to attack do not stack, the effective attack enhancement is
 * max(magicEnhancement, 1) for Masterwork or Adamantine weapons.
 */
export function getWeaponEffectiveAttackEnhancement(
  material?: EquipmentMaterial | string,
  enhancementBonus: number = 0,
  isMasterwork?: boolean
): number {
  const isMwk = Boolean(isMasterwork || material === 'adamantine');
  return Math.max(enhancementBonus, isMwk ? 1 : 0);
}

/**
 * In D&D 3.5e, Alchemical Silver imposes a -1 penalty on damage rolls (min 1 total damage).
 * Adamantine does NOT grant extra damage to weapons (damage is standard).
 */
export function getWeaponMaterialDamageMod(
  material?: EquipmentMaterial | string
): number {
  if (material === 'alchemical_silver') return -1;
  return 0;
}

/**
 * Returns descriptive traits for weapon special materials (e.g. DR bypass, hardness bypass).
 */
export function getWeaponMaterialTraits(
  material?: EquipmentMaterial | string,
  isMasterwork?: boolean
): string[] {
  const traits: string[] = [];
  if (material && material !== 'standard') {
    switch (material) {
      case 'adamantine':
        traits.push(
          'Adamantine (Bypasses DR/Adamantine & Hardness < 20)',
          'Masterwork (+1 Atk)'
        );
        break;
      case 'cold_iron':
        traits.push('Cold Iron (Bypasses DR/Cold Iron)');
        break;
      case 'alchemical_silver':
        traits.push('Silver (Bypasses DR/Silver, -1 Dmg)');
        break;
      case 'mithral':
        traits.push('Mithral (Half Weight)');
        break;
      default:
        break;
    }
  }
  if (isMasterwork && !traits.includes('Masterwork (+1 Atk)')) {
    traits.push('Masterwork (+1 Atk)');
  }
  return traits;
}

/**
 * Automatically inspects a CharacterState and ensures all currently equipped items
 * (armor, shield, primary weapon, secondary weapon, ranged weapon, wondrous items)
 * exist persistently in character.inventory and are linked via equipment.*ItemId.
 * Returns an updated CharacterState if missing items were added or links established.
 */
export function syncEquippedItemsToInventory<T extends CharacterState>(
  character: T,
  weaponsData: WeaponData[] = []
): T {
  const eq = character.equipment;
  if (!eq) return character;

  let currentInventory = character.inventory ? [...character.inventory] : [];
  const customArmors = character.customArmors || [];
  const customWeapons = character.customWeapons || [];
  const updatedEq: Equipment = { ...eq };
  let modified = false;

  const isValidEquippedName = (name: string | undefined): boolean => {
    if (!name) return false;
    const clean = name.trim();
    return clean !== '' && clean.toLowerCase() !== 'none' && clean !== '__CUSTOM__';
  };

  // 1. Armor Sync & Migration
  if (updatedEq.armorItemId) {
    const existing = currentInventory.find(i => i.id === updatedEq.armorItemId);
    if (existing) {
      if (!existing.material) {
        existing.material = parseMagicItemName(existing.name, 'armor').material || updatedEq.armorMaterial || 'standard';
        modified = true;
      }
      if (!existing.baseItemId) {
        existing.baseItemId = resolveArmor(existing.name, customArmors).baseArmorId || parseMagicItemName(existing.name, 'armor').baseName.toLowerCase().replace(/\s+/g, '_');
        modified = true;
      }
      if (existing.isMasterwork === undefined) {
        const parsed = parseMagicItemName(existing.name, 'armor');
        existing.isMasterwork = updatedEq.armorMasterwork ?? parsed.isMasterwork ?? false;
        modified = true;
      }
      if (!existing.armorData) {
        const resolved = resolveArmor(existing.baseItemId || existing.name, customArmors);
        const baseArmorData: ItemArmorData = {
          type: (resolved.type as any) || 'medium',
          acBonus: resolved.acBonus,
          maxDex: resolved.maxDex ?? 99,
          armorCheckPenalty: resolved.checkPenalty ?? 0,
          spellFailure: resolved.spellFailure ?? 0,
          speedPenalty: resolved.speedPenalty ?? (resolved.type === 'heavy' || resolved.type === 'medium')
        };
        existing.armorData = applyMaterialToArmorData(baseArmorData, existing.material, existing.isMasterwork);
        existing.itemType = 'armor';
        modified = true;
      }
      if (existing.weight === undefined) {
        const resolved = resolveArmor(existing.baseItemId || existing.name, customArmors);
        const stdWeight = resolved.weight ?? (ARMOR_WEIGHT_MAP[resolved.name.toLowerCase()] ?? 20);
        existing.weight = applyMaterialToWeight(stdWeight, existing.material);
        modified = true;
      }
      if (updatedEq.armorMaterial !== existing.material && existing.material && existing.material !== 'standard') {
        updatedEq.armorMaterial = existing.material;
        modified = true;
      }
      if (updatedEq.armorMasterwork !== undefined) {
        if (existing.isMasterwork !== updatedEq.armorMasterwork) {
          existing.isMasterwork = updatedEq.armorMasterwork;
          const resolved = resolveArmor(existing.baseItemId || existing.name, customArmors);
          const baseArmorData: ItemArmorData = {
            type: (resolved.type as any) || 'medium',
            acBonus: resolved.acBonus,
            maxDex: resolved.maxDex ?? 99,
            armorCheckPenalty: resolved.checkPenalty ?? 0,
            spellFailure: resolved.spellFailure ?? 0,
            speedPenalty: resolved.speedPenalty ?? (resolved.type === 'heavy' || resolved.type === 'medium')
          };
          existing.armorData = applyMaterialToArmorData(baseArmorData, existing.material, existing.isMasterwork);
          existing.name = formatMagicItemName(resolved.name, existing.enhancementBonus || 0, existing.specialQualities || [], existing.material, existing.isMasterwork);
          updatedEq.armor = existing.name;
          modified = true;
        }
      } else if (existing.isMasterwork !== undefined) {
        updatedEq.armorMasterwork = existing.isMasterwork;
        modified = true;
      }
      if (updatedEq.armor !== existing.name || updatedEq.armorEnhancement !== (existing.enhancementBonus || 0)) {
        updatedEq.armor = existing.name;
        updatedEq.armorEnhancement = existing.enhancementBonus || 0;
        updatedEq.armorQualities = existing.specialQualities || [];
        modified = true;
      }
    } else {
      updatedEq.armorItemId = null;
      modified = true;
    }
  } else if (isValidEquippedName(updatedEq.armor)) {
    const parsed = parseMagicItemName(updatedEq.armor, 'armor');
    const mat = (parsed.material && parsed.material !== 'standard' ? parsed.material : undefined) || updatedEq.armorMaterial || 'standard';
    const isMwk = updatedEq.armorMasterwork ?? parsed.isMasterwork;
    const resolved = resolveArmor(parsed.baseName || updatedEq.armor, customArmors);
    const existingMatch = currentInventory.find(i => matchesItemName(i.name, updatedEq.armor) || matchesItemName(i.name, resolved.name));
    if (existingMatch) {
      if (!existingMatch.material) {
        existingMatch.material = mat;
      }
      if (!existingMatch.baseItemId) {
        existingMatch.baseItemId = resolved.baseArmorId || parsed.baseName.toLowerCase().replace(/\s+/g, '_');
      }
      if (existingMatch.isMasterwork === undefined && isMwk !== undefined) {
        existingMatch.isMasterwork = isMwk;
      }
      if (!existingMatch.armorData) {
        const baseArmorData: ItemArmorData = {
          type: (resolved.type as any) || 'medium',
          acBonus: resolved.acBonus,
          maxDex: resolved.maxDex ?? 99,
          armorCheckPenalty: resolved.checkPenalty ?? 0,
          spellFailure: resolved.spellFailure ?? 0,
          speedPenalty: resolved.speedPenalty ?? (resolved.type === 'heavy' || resolved.type === 'medium')
        };
        existingMatch.armorData = applyMaterialToArmorData(baseArmorData, existingMatch.material, existingMatch.isMasterwork);
        existingMatch.itemType = 'armor';
      }
      if (existingMatch.weight === undefined) {
        const stdWeight = resolved.weight ?? (ARMOR_WEIGHT_MAP[resolved.name.toLowerCase()] ?? 20);
        existingMatch.weight = applyMaterialToWeight(stdWeight, existingMatch.material);
      }
      if (existingMatch.enhancementBonus === undefined && updatedEq.armorEnhancement) {
        existingMatch.enhancementBonus = updatedEq.armorEnhancement;
      }
      if ((!existingMatch.specialQualities || existingMatch.specialQualities.length === 0) && updatedEq.armorQualities) {
        existingMatch.specialQualities = [...updatedEq.armorQualities];
      }
      updatedEq.armorItemId = existingMatch.id;
      updatedEq.armorMaterial = existingMatch.material;
      if (updatedEq.armorMasterwork !== undefined) {
        existingMatch.isMasterwork = updatedEq.armorMasterwork;
      } else if (existingMatch.isMasterwork !== undefined) {
        updatedEq.armorMasterwork = existingMatch.isMasterwork;
      }
      modified = true;
    } else {
      const newArm = createInventoryArmor(updatedEq.armor, customArmors, {
        enhancementBonus: updatedEq.armorEnhancement,
        specialQualities: updatedEq.armorQualities,
        material: mat,
        isMasterwork: isMwk
      });
      currentInventory.push(newArm);
      updatedEq.armorItemId = newArm.id;
      updatedEq.armorMaterial = newArm.material;
      updatedEq.armorMasterwork = newArm.isMasterwork;
      modified = true;
    }
  }

  // 2. Shield Sync & Migration
  if (updatedEq.shieldItemId) {
    const existing = currentInventory.find(i => i.id === updatedEq.shieldItemId);
    if (existing) {
      if (!existing.material) {
        existing.material = parseMagicItemName(existing.name, 'shield').material || updatedEq.shieldMaterial || 'standard';
        modified = true;
      }
      if (!existing.baseItemId) {
        existing.baseItemId = resolveShield(existing.name, customArmors).baseArmorId || parseMagicItemName(existing.name, 'shield').baseName.toLowerCase().replace(/\s+/g, '_');
        modified = true;
      }
      if (existing.isMasterwork === undefined) {
        const parsed = parseMagicItemName(existing.name, 'shield');
        existing.isMasterwork = updatedEq.shieldMasterwork ?? parsed.isMasterwork ?? false;
        modified = true;
      }
      if (!existing.armorData) {
        const resolved = resolveShield(existing.baseItemId || existing.name, customArmors);
        const baseArmorData: ItemArmorData = {
          type: 'shield',
          acBonus: resolved.acBonus,
          maxDex: 99,
          armorCheckPenalty: resolved.checkPenalty ?? 0,
          spellFailure: resolved.spellFailure ?? 0,
          speedPenalty: false
        };
        existing.armorData = applyMaterialToArmorData(baseArmorData, existing.material, existing.isMasterwork);
        existing.itemType = 'shield';
        modified = true;
      }
      if (existing.weight === undefined) {
        const resolved = resolveShield(existing.baseItemId || existing.name, customArmors);
        const stdWeight = resolved.weight ?? (SHIELD_WEIGHT_MAP[resolved.name.toLowerCase()] ?? 10);
        existing.weight = applyMaterialToWeight(stdWeight, existing.material);
        modified = true;
      }
      if (updatedEq.shieldMaterial !== existing.material && existing.material && existing.material !== 'standard') {
        updatedEq.shieldMaterial = existing.material;
        modified = true;
      }
      if (updatedEq.shieldMasterwork !== undefined) {
        if (existing.isMasterwork !== updatedEq.shieldMasterwork) {
          existing.isMasterwork = updatedEq.shieldMasterwork;
          const resolved = resolveShield(existing.baseItemId || existing.name, customArmors);
          const baseArmorData: ItemArmorData = {
            type: 'shield',
            acBonus: resolved.acBonus,
            maxDex: 99,
            armorCheckPenalty: resolved.checkPenalty ?? 0,
            spellFailure: resolved.spellFailure ?? 0,
            speedPenalty: false
          };
          existing.armorData = applyMaterialToArmorData(baseArmorData, existing.material, existing.isMasterwork);
          existing.name = formatMagicItemName(resolved.name, existing.enhancementBonus || 0, existing.specialQualities || [], existing.material, existing.isMasterwork);
          updatedEq.shield = existing.name;
          modified = true;
        }
      } else if (existing.isMasterwork !== undefined) {
        updatedEq.shieldMasterwork = existing.isMasterwork;
        modified = true;
      }
      if (updatedEq.shield !== existing.name || updatedEq.shieldEnhancement !== (existing.enhancementBonus || 0)) {
        updatedEq.shield = existing.name;
        updatedEq.shieldEnhancement = existing.enhancementBonus || 0;
        updatedEq.shieldQualities = existing.specialQualities || [];
        modified = true;
      }
    } else {
      updatedEq.shieldItemId = null;
      modified = true;
    }
  } else if (isValidEquippedName(updatedEq.shield)) {
    const parsed = parseMagicItemName(updatedEq.shield, 'shield');
    const mat = (parsed.material && parsed.material !== 'standard' ? parsed.material : undefined) || updatedEq.shieldMaterial || 'standard';
    const isMwk = updatedEq.shieldMasterwork ?? parsed.isMasterwork;
    const resolved = resolveShield(parsed.baseName || updatedEq.shield, customArmors);
    const existingMatch = currentInventory.find(i => matchesItemName(i.name, updatedEq.shield) || matchesItemName(i.name, resolved.name));
    if (existingMatch) {
      if (!existingMatch.material) {
        existingMatch.material = mat;
      }
      if (!existingMatch.baseItemId) {
        existingMatch.baseItemId = resolved.baseArmorId || parsed.baseName.toLowerCase().replace(/\s+/g, '_');
      }
      if (existingMatch.isMasterwork === undefined && isMwk !== undefined) {
        existingMatch.isMasterwork = isMwk;
      }
      if (!existingMatch.armorData) {
        const baseArmorData: ItemArmorData = {
          type: 'shield',
          acBonus: resolved.acBonus,
          maxDex: 99,
          armorCheckPenalty: resolved.checkPenalty ?? 0,
          spellFailure: resolved.spellFailure ?? 0,
          speedPenalty: false
        };
        existingMatch.armorData = applyMaterialToArmorData(baseArmorData, existingMatch.material, existingMatch.isMasterwork);
        existingMatch.itemType = 'shield';
      }
      if (existingMatch.weight === undefined) {
        const stdWeight = resolved.weight ?? (SHIELD_WEIGHT_MAP[resolved.name.toLowerCase()] ?? 10);
        existingMatch.weight = applyMaterialToWeight(stdWeight, existingMatch.material);
      }
      if (existingMatch.enhancementBonus === undefined && updatedEq.shieldEnhancement) {
        existingMatch.enhancementBonus = updatedEq.shieldEnhancement;
      }
      if ((!existingMatch.specialQualities || existingMatch.specialQualities.length === 0) && updatedEq.shieldQualities) {
        existingMatch.specialQualities = [...updatedEq.shieldQualities];
      }
      updatedEq.shieldItemId = existingMatch.id;
      updatedEq.shieldMaterial = existingMatch.material;
      if (updatedEq.shieldMasterwork !== undefined) {
        existingMatch.isMasterwork = updatedEq.shieldMasterwork;
      } else if (existingMatch.isMasterwork !== undefined) {
        updatedEq.shieldMasterwork = existingMatch.isMasterwork;
      }
      modified = true;
    } else {
      const newShd = createInventoryShield(updatedEq.shield, customArmors, {
        enhancementBonus: updatedEq.shieldEnhancement,
        specialQualities: updatedEq.shieldQualities,
        material: mat,
        isMasterwork: isMwk
      });
      currentInventory.push(newShd);
      updatedEq.shieldItemId = newShd.id;
      updatedEq.shieldMaterial = newShd.material;
      updatedEq.shieldMasterwork = newShd.isMasterwork;
      modified = true;
    }
  }

  // 3. Primary Weapon Sync & Migration
  if (updatedEq.primaryWeaponItemId) {
    const existing = currentInventory.find(i => i.id === updatedEq.primaryWeaponItemId);
    if (existing) {
      if (!existing.material) {
        existing.material = parseMagicItemName(existing.name, 'weapon').material || 'standard';
        modified = true;
      }
      if (!existing.baseItemId) {
        existing.baseItemId = resolveWeapon(existing.name, customWeapons, weaponsData).id;
        modified = true;
      }
      if (existing.isMasterwork === undefined) {
        const parsed = parseMagicItemName(existing.name, 'weapon');
        existing.isMasterwork = updatedEq.primaryWeaponMasterwork ?? (parsed.isMasterwork || false);
        modified = true;
      }
      if (!existing.weaponData) {
        const resolved = resolveWeapon(existing.name, customWeapons, weaponsData);
        existing.weaponData = {
          category: resolved.category,
          size: resolved.size,
          damageM: resolved.damageM,
          damageS: resolved.damageS,
          threat: resolved.threat ?? 20,
          critMultiplier: resolved.critMultiplier ?? 2,
          damageType: resolved.type,
          rangeIncrement: resolved.rangeIncrement,
          isRanged: resolved.category === 'Ranged' || resolved.size === 'Ranged',
          isMasterwork: existing.isMasterwork
        };
        existing.itemType = 'weapon';
        modified = true;
      }
      const existingBane = existing.weaponData?.baneTarget || existing.baneTarget;
      if (updatedEq.primaryWeaponMasterwork !== undefined) {
        if (existing.isMasterwork !== updatedEq.primaryWeaponMasterwork) {
          existing.isMasterwork = updatedEq.primaryWeaponMasterwork;
          if (existing.weaponData) {
            existing.weaponData.isMasterwork = existing.isMasterwork;
          }
          const resolved = resolveWeapon(existing.baseItemId || existing.name, customWeapons, weaponsData);
          existing.name = formatMagicItemName(resolved.name, existing.enhancementBonus || 0, existing.specialQualities || [], existing.material, existing.isMasterwork);
          updatedEq.primaryWeapon = existing.name;
          modified = true;
        }
      } else if (existing.isMasterwork !== undefined) {
        updatedEq.primaryWeaponMasterwork = existing.isMasterwork;
        modified = true;
      }
      if (
        updatedEq.primaryWeapon !== existing.name ||
        updatedEq.primaryWeaponEnhancement !== (existing.enhancementBonus || 0) ||
        updatedEq.primaryWeaponBaneTarget !== existingBane ||
        updatedEq.primaryWeaponMaterial !== (existing.material || 'standard')
      ) {
        updatedEq.primaryWeapon = existing.name;
        updatedEq.primaryWeaponEnhancement = existing.enhancementBonus || 0;
        updatedEq.primaryWeaponQualities = existing.specialQualities || [];
        updatedEq.primaryWeaponBaneTarget = existingBane;
        updatedEq.primaryWeaponMaterial = existing.material || 'standard';
        modified = true;
      }
    } else {
      updatedEq.primaryWeaponItemId = null;
      modified = true;
    }
  } else if (isValidEquippedName(updatedEq.primaryWeapon)) {
    const parsed = parseMagicItemName(updatedEq.primaryWeapon, 'weapon');
    const mat = parsed.material || 'standard';
    const isMwk = updatedEq.primaryWeaponMasterwork ?? parsed.isMasterwork;
    const resolved = resolveWeapon(updatedEq.primaryWeapon, customWeapons, weaponsData);
    const existingMatch = currentInventory.find(i => matchesItemName(i.name, updatedEq.primaryWeapon) || matchesItemName(i.name, resolved.name));
    if (existingMatch) {
      if (!existingMatch.material) {
        existingMatch.material = mat;
      }
      if (!existingMatch.baseItemId) {
        existingMatch.baseItemId = resolved.id;
      }
      if (existingMatch.isMasterwork === undefined && isMwk !== undefined) {
        existingMatch.isMasterwork = isMwk;
      }
      if (!existingMatch.weaponData) {
        existingMatch.weaponData = {
          category: resolved.category,
          size: resolved.size,
          damageM: resolved.damageM,
          damageS: resolved.damageS,
          threat: resolved.threat ?? 20,
          critMultiplier: resolved.critMultiplier ?? 2,
          damageType: resolved.type,
          rangeIncrement: resolved.rangeIncrement,
          isRanged: resolved.category === 'Ranged' || resolved.size === 'Ranged',
          isMasterwork: existingMatch.isMasterwork
        };
        existingMatch.itemType = 'weapon';
      }
      if (existingMatch.enhancementBonus === undefined && updatedEq.primaryWeaponEnhancement) {
        existingMatch.enhancementBonus = updatedEq.primaryWeaponEnhancement;
      }
      if ((!existingMatch.specialQualities || existingMatch.specialQualities.length === 0) && updatedEq.primaryWeaponQualities) {
        existingMatch.specialQualities = [...updatedEq.primaryWeaponQualities];
      }
      if (!existingMatch.weaponData.baneTarget && updatedEq.primaryWeaponBaneTarget) {
        existingMatch.weaponData.baneTarget = updatedEq.primaryWeaponBaneTarget;
        existingMatch.baneTarget = updatedEq.primaryWeaponBaneTarget;
      }
      updatedEq.primaryWeaponItemId = existingMatch.id;
      updatedEq.primaryWeaponMaterial = existingMatch.material || 'standard';
      if (updatedEq.primaryWeaponMasterwork !== undefined) {
        existingMatch.isMasterwork = updatedEq.primaryWeaponMasterwork;
        if (existingMatch.weaponData) {
          existingMatch.weaponData.isMasterwork = updatedEq.primaryWeaponMasterwork;
        }
      } else if (existingMatch.isMasterwork !== undefined) {
        updatedEq.primaryWeaponMasterwork = existingMatch.isMasterwork;
      }
      modified = true;
    } else {
      const newWpn = createInventoryWeapon(resolved, {
        name: updatedEq.primaryWeapon,
        enhancementBonus: updatedEq.primaryWeaponEnhancement,
        specialQualities: updatedEq.primaryWeaponQualities,
        baneTarget: updatedEq.primaryWeaponBaneTarget,
        material: mat,
        isMasterwork: isMwk
      });
      currentInventory.push(newWpn);
      updatedEq.primaryWeaponItemId = newWpn.id;
      updatedEq.primaryWeaponMaterial = newWpn.material || 'standard';
      updatedEq.primaryWeaponMasterwork = newWpn.isMasterwork;
      modified = true;
    }
  }

  // 4. Secondary Weapon Sync & Migration
  if (updatedEq.secondaryWeaponItemId) {
    const existing = currentInventory.find(i => i.id === updatedEq.secondaryWeaponItemId);
    if (existing) {
      if (!existing.material) {
        existing.material = parseMagicItemName(existing.name, 'weapon').material || 'standard';
        modified = true;
      }
      if (!existing.baseItemId) {
        existing.baseItemId = resolveWeapon(existing.name, customWeapons, weaponsData).id;
        modified = true;
      }
      if (existing.isMasterwork === undefined) {
        const parsed = parseMagicItemName(existing.name, 'weapon');
        existing.isMasterwork = updatedEq.secondaryWeaponMasterwork ?? (parsed.isMasterwork || false);
        modified = true;
      }
      if (!existing.weaponData) {
        const resolved = resolveWeapon(existing.name, customWeapons, weaponsData);
        existing.weaponData = {
          category: resolved.category,
          size: resolved.size,
          damageM: resolved.damageM,
          damageS: resolved.damageS,
          threat: resolved.threat ?? 20,
          critMultiplier: resolved.critMultiplier ?? 2,
          damageType: resolved.type,
          rangeIncrement: resolved.rangeIncrement,
          isRanged: resolved.category === 'Ranged' || resolved.size === 'Ranged',
          isMasterwork: existing.isMasterwork
        };
        existing.itemType = 'weapon';
        modified = true;
      }
      const existingBane = existing.weaponData?.baneTarget || existing.baneTarget;
      if (updatedEq.secondaryWeaponMasterwork !== undefined) {
        if (existing.isMasterwork !== updatedEq.secondaryWeaponMasterwork) {
          existing.isMasterwork = updatedEq.secondaryWeaponMasterwork;
          if (existing.weaponData) {
            existing.weaponData.isMasterwork = existing.isMasterwork;
          }
          const resolved = resolveWeapon(existing.baseItemId || existing.name, customWeapons, weaponsData);
          existing.name = formatMagicItemName(resolved.name, existing.enhancementBonus || 0, existing.specialQualities || [], existing.material, existing.isMasterwork);
          updatedEq.secondaryWeapon = existing.name;
          modified = true;
        }
      } else if (existing.isMasterwork !== undefined) {
        updatedEq.secondaryWeaponMasterwork = existing.isMasterwork;
        modified = true;
      }
      if (
        updatedEq.secondaryWeapon !== existing.name ||
        updatedEq.secondaryWeaponEnhancement !== (existing.enhancementBonus || 0) ||
        updatedEq.secondaryWeaponBaneTarget !== existingBane ||
        updatedEq.secondaryWeaponMaterial !== (existing.material || 'standard')
      ) {
        updatedEq.secondaryWeapon = existing.name;
        updatedEq.secondaryWeaponEnhancement = existing.enhancementBonus || 0;
        updatedEq.secondaryWeaponQualities = existing.specialQualities || [];
        updatedEq.secondaryWeaponBaneTarget = existingBane;
        updatedEq.secondaryWeaponMaterial = existing.material || 'standard';
        modified = true;
      }
    } else {
      updatedEq.secondaryWeaponItemId = null;
      modified = true;
    }
  } else if (isValidEquippedName(updatedEq.secondaryWeapon)) {
    const parsed = parseMagicItemName(updatedEq.secondaryWeapon, 'weapon');
    const mat = parsed.material || 'standard';
    const isMwk = updatedEq.secondaryWeaponMasterwork ?? parsed.isMasterwork;
    const resolved = resolveWeapon(updatedEq.secondaryWeapon, customWeapons, weaponsData);
    const existingMatch = currentInventory.find(i => i.id !== updatedEq.primaryWeaponItemId && (matchesItemName(i.name, updatedEq.secondaryWeapon) || matchesItemName(i.name, resolved.name)));
    if (existingMatch) {
      if (!existingMatch.material) {
        existingMatch.material = mat;
      }
      if (!existingMatch.baseItemId) {
        existingMatch.baseItemId = resolved.id;
      }
      if (existingMatch.isMasterwork === undefined && isMwk !== undefined) {
        existingMatch.isMasterwork = isMwk;
      }
      if (!existingMatch.weaponData) {
        existingMatch.weaponData = {
          category: resolved.category,
          size: resolved.size,
          damageM: resolved.damageM,
          damageS: resolved.damageS,
          threat: resolved.threat ?? 20,
          critMultiplier: resolved.critMultiplier ?? 2,
          damageType: resolved.type,
          rangeIncrement: resolved.rangeIncrement,
          isRanged: resolved.category === 'Ranged' || resolved.size === 'Ranged',
          isMasterwork: existingMatch.isMasterwork
        };
        existingMatch.itemType = 'weapon';
      }
      if (existingMatch.enhancementBonus === undefined && updatedEq.secondaryWeaponEnhancement) {
        existingMatch.enhancementBonus = updatedEq.secondaryWeaponEnhancement;
      }
      if ((!existingMatch.specialQualities || existingMatch.specialQualities.length === 0) && updatedEq.secondaryWeaponQualities) {
        existingMatch.specialQualities = [...updatedEq.secondaryWeaponQualities];
      }
      if (!existingMatch.weaponData.baneTarget && updatedEq.secondaryWeaponBaneTarget) {
        existingMatch.weaponData.baneTarget = updatedEq.secondaryWeaponBaneTarget;
        existingMatch.baneTarget = updatedEq.secondaryWeaponBaneTarget;
      }
      updatedEq.secondaryWeaponItemId = existingMatch.id;
      updatedEq.secondaryWeaponMaterial = existingMatch.material || 'standard';
      if (updatedEq.secondaryWeaponMasterwork !== undefined) {
        existingMatch.isMasterwork = updatedEq.secondaryWeaponMasterwork;
        if (existingMatch.weaponData) {
          existingMatch.weaponData.isMasterwork = updatedEq.secondaryWeaponMasterwork;
        }
      } else if (existingMatch.isMasterwork !== undefined) {
        updatedEq.secondaryWeaponMasterwork = existingMatch.isMasterwork;
      }
      modified = true;
    } else {
      const newWpn = createInventoryWeapon(resolved, {
        name: updatedEq.secondaryWeapon,
        enhancementBonus: updatedEq.secondaryWeaponEnhancement,
        specialQualities: updatedEq.secondaryWeaponQualities,
        baneTarget: updatedEq.secondaryWeaponBaneTarget,
        material: mat,
        isMasterwork: isMwk
      });
      currentInventory.push(newWpn);
      updatedEq.secondaryWeaponItemId = newWpn.id;
      updatedEq.secondaryWeaponMaterial = newWpn.material || 'standard';
      updatedEq.secondaryWeaponMasterwork = newWpn.isMasterwork;
      modified = true;
    }
  }

  // 5. Ranged Weapon Sync & Migration
  if (updatedEq.rangedWeaponItemId) {
    const existing = currentInventory.find(i => i.id === updatedEq.rangedWeaponItemId);
    if (existing) {
      if (!existing.material) {
        existing.material = parseMagicItemName(existing.name, 'weapon').material || 'standard';
        modified = true;
      }
      if (!existing.baseItemId) {
        existing.baseItemId = resolveWeapon(existing.name, customWeapons, weaponsData).id;
        modified = true;
      }
      if (existing.isMasterwork === undefined) {
        const parsed = parseMagicItemName(existing.name, 'weapon');
        existing.isMasterwork = updatedEq.rangedWeaponMasterwork ?? (parsed.isMasterwork || false);
        modified = true;
      }
      if (!existing.weaponData) {
        const resolved = resolveWeapon(existing.name, customWeapons, weaponsData);
        existing.weaponData = {
          category: resolved.category,
          size: resolved.size,
          damageM: resolved.damageM,
          damageS: resolved.damageS,
          threat: resolved.threat ?? 20,
          critMultiplier: resolved.critMultiplier ?? 2,
          damageType: resolved.type,
          rangeIncrement: resolved.rangeIncrement,
          isRanged: true,
          isMasterwork: existing.isMasterwork
        };
        existing.itemType = 'weapon';
        modified = true;
      }
      const existingBane = existing.weaponData?.baneTarget || existing.baneTarget;
      if (updatedEq.rangedWeaponMasterwork !== undefined) {
        if (existing.isMasterwork !== updatedEq.rangedWeaponMasterwork) {
          existing.isMasterwork = updatedEq.rangedWeaponMasterwork;
          if (existing.weaponData) {
            existing.weaponData.isMasterwork = existing.isMasterwork;
          }
          const resolved = resolveWeapon(existing.baseItemId || existing.name, customWeapons, weaponsData);
          existing.name = formatMagicItemName(resolved.name, existing.enhancementBonus || 0, existing.specialQualities || [], existing.material, existing.isMasterwork);
          updatedEq.rangedWeapon = existing.name;
          modified = true;
        }
      } else if (existing.isMasterwork !== undefined) {
        updatedEq.rangedWeaponMasterwork = existing.isMasterwork;
        modified = true;
      }
      if (
        updatedEq.rangedWeapon !== existing.name ||
        updatedEq.rangedWeaponEnhancement !== (existing.enhancementBonus || 0) ||
        updatedEq.rangedWeaponBaneTarget !== existingBane ||
        updatedEq.rangedWeaponMaterial !== (existing.material || 'standard')
      ) {
        updatedEq.rangedWeapon = existing.name;
        updatedEq.rangedWeaponEnhancement = existing.enhancementBonus || 0;
        updatedEq.rangedWeaponQualities = existing.specialQualities || [];
        updatedEq.rangedWeaponBaneTarget = existingBane;
        updatedEq.rangedWeaponMaterial = existing.material || 'standard';
        modified = true;
      }
    } else {
      updatedEq.rangedWeaponItemId = null;
      modified = true;
    }
  } else if (isValidEquippedName(updatedEq.rangedWeapon)) {
    const parsed = parseMagicItemName(updatedEq.rangedWeapon, 'weapon');
    const mat = parsed.material || 'standard';
    const isMwk = updatedEq.rangedWeaponMasterwork ?? parsed.isMasterwork;
    const resolved = resolveWeapon(updatedEq.rangedWeapon, customWeapons, weaponsData);
    const existingMatch = currentInventory.find(i => matchesItemName(i.name, updatedEq.rangedWeapon) || matchesItemName(i.name, resolved.name));
    if (existingMatch) {
      if (!existingMatch.material) {
        existingMatch.material = mat;
      }
      if (!existingMatch.baseItemId) {
        existingMatch.baseItemId = resolved.id;
      }
      if (existingMatch.isMasterwork === undefined && isMwk !== undefined) {
        existingMatch.isMasterwork = isMwk;
      }
      if (!existingMatch.weaponData) {
        existingMatch.weaponData = {
          category: resolved.category,
          size: resolved.size,
          damageM: resolved.damageM,
          damageS: resolved.damageS,
          threat: resolved.threat ?? 20,
          critMultiplier: resolved.critMultiplier ?? 2,
          damageType: resolved.type,
          rangeIncrement: resolved.rangeIncrement,
          isRanged: true,
          isMasterwork: existingMatch.isMasterwork
        };
        existingMatch.itemType = 'weapon';
      }
      if (existingMatch.enhancementBonus === undefined && updatedEq.rangedWeaponEnhancement) {
        existingMatch.enhancementBonus = updatedEq.rangedWeaponEnhancement;
      }
      if ((!existingMatch.specialQualities || existingMatch.specialQualities.length === 0) && updatedEq.rangedWeaponQualities) {
        existingMatch.specialQualities = [...updatedEq.rangedWeaponQualities];
      }
      if (!existingMatch.weaponData.baneTarget && updatedEq.rangedWeaponBaneTarget) {
        existingMatch.weaponData.baneTarget = updatedEq.rangedWeaponBaneTarget;
        existingMatch.baneTarget = updatedEq.rangedWeaponBaneTarget;
      }
      updatedEq.rangedWeaponItemId = existingMatch.id;
      updatedEq.rangedWeaponMaterial = existingMatch.material || 'standard';
      if (updatedEq.rangedWeaponMasterwork !== undefined) {
        existingMatch.isMasterwork = updatedEq.rangedWeaponMasterwork;
        if (existingMatch.weaponData) {
          existingMatch.weaponData.isMasterwork = updatedEq.rangedWeaponMasterwork;
        }
      } else if (existingMatch.isMasterwork !== undefined) {
        updatedEq.rangedWeaponMasterwork = existingMatch.isMasterwork;
      }
      modified = true;
    } else {
      const newWpn = createInventoryWeapon(resolved, {
        name: updatedEq.rangedWeapon,
        enhancementBonus: updatedEq.rangedWeaponEnhancement,
        specialQualities: updatedEq.rangedWeaponQualities,
        baneTarget: updatedEq.rangedWeaponBaneTarget,
        material: mat,
        isMasterwork: isMwk
      });
      currentInventory.push(newWpn);
      updatedEq.rangedWeaponItemId = newWpn.id;
      updatedEq.rangedWeaponMaterial = newWpn.material || 'standard';
      updatedEq.rangedWeaponMasterwork = newWpn.isMasterwork;
      modified = true;
    }
  }

  // 6. Wondrous Items
  if (updatedEq.wondrousItems && updatedEq.wondrousItems.length > 0) {
    updatedEq.wondrousItems = updatedEq.wondrousItems.map(w => {
      let linkedItem = w.inventoryItemId
        ? currentInventory.find(i => i.id === w.inventoryItemId)
        : currentInventory.find(i => matchesItemName(i.name, w.name) && (i.itemType === 'wondrous' || !i.itemType));

      if (!linkedItem) {
        linkedItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: w.name,
          quantity: 1,
          weight: w.weight || 0,
          notes: w.effect,
          itemType: 'wondrous',
          location: 'Carried'
        };
        currentInventory = [...currentInventory, linkedItem];
        modified = true;
      }

      if (w.inventoryItemId !== linkedItem.id) {
        modified = true;
        return { ...w, inventoryItemId: linkedItem.id };
      }
      return w;
    });
  }

  return modified ? { ...character, inventory: currentInventory, equipment: updatedEq } : character;
}

/**
 * Calculates total carried weight on person (in lbs).
 * Excludes items located in 'Stash' or 'Mount'.
 * Prevents double counting if equipped gear is already recorded in character.inventory.
 */
export function calculateTotalCarriedWeight(character: CharacterState, weaponsData: WeaponData[] = []): number {
  let weight = 0;
  const eq = character.equipment;
  const inv = character.inventory || [];

  const parseWeight = (val: any): number => {
    if (val === null || val === undefined) return 0;
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    return isNaN(num) ? 0 : num;
  };

  if (eq) {
    // 1. Armor Weight (if not already recorded in inventory)
    if (eq.armor && eq.armor !== 'none') {
      const isRecorded = (eq.armorItemId && inv.some(i => i.id === eq.armorItemId)) ||
        isItemInInventory(inv, eq.armor) ||
        isItemInInventory(inv, resolveArmor(eq.armor, character.customArmors || []).name);

      if (!isRecorded) {
        const armorKey = eq.armor.toLowerCase().trim();
        if (ARMOR_WEIGHT_MAP[armorKey] !== undefined) {
          weight += ARMOR_WEIGHT_MAP[armorKey];
        } else {
          const customArmor = (character.customArmors || []).find(a => a.name.toLowerCase() === armorKey || a.id.toLowerCase() === armorKey);
          weight += parseWeight(customArmor?.weight || 20);
        }
      }
    }

    // 2. Shield Weight (if not already recorded in inventory)
    if (eq.shield && eq.shield !== 'none') {
      const isRecorded = (eq.shieldItemId && inv.some(i => i.id === eq.shieldItemId)) ||
        isItemInInventory(inv, eq.shield) ||
        isItemInInventory(inv, resolveShield(eq.shield, character.customArmors || []).name);

      if (!isRecorded) {
        const shieldKey = eq.shield.toLowerCase().trim();
        if (SHIELD_WEIGHT_MAP[shieldKey] !== undefined) {
          weight += SHIELD_WEIGHT_MAP[shieldKey];
        } else {
          const customShield = (character.customArmors || []).find(a => a.name.toLowerCase() === shieldKey || a.id.toLowerCase() === shieldKey);
          weight += parseWeight(customShield?.weight || 10);
        }
      }
    }

    // 3. Equipped Weapons Weight (if not already recorded in inventory)
    if (eq.primaryWeapon && eq.primaryWeapon !== 'none') {
      const isRecorded = (eq.primaryWeaponItemId && inv.some(i => i.id === eq.primaryWeaponItemId)) ||
        isItemInInventory(inv, eq.primaryWeapon) ||
        isItemInInventory(inv, resolveWeapon(eq.primaryWeapon, character.customWeapons || [], weaponsData).name);

      if (!isRecorded) {
        const primaryWpn = resolveWeapon(eq.primaryWeapon, character.customWeapons || [], weaponsData);
        weight += parseWeight(primaryWpn.weight);
      }
    }
    if (eq.secondaryWeapon && eq.secondaryWeapon !== 'none') {
      const isRecorded = (eq.secondaryWeaponItemId && inv.some(i => i.id === eq.secondaryWeaponItemId)) ||
        isItemInInventory(inv, eq.secondaryWeapon) ||
        isItemInInventory(inv, resolveWeapon(eq.secondaryWeapon, character.customWeapons || [], weaponsData).name);

      if (!isRecorded) {
        const secWpn = resolveWeapon(eq.secondaryWeapon, character.customWeapons || [], weaponsData);
        weight += parseWeight(secWpn.weight);
      }
    }
    if (eq.rangedWeapon && eq.rangedWeapon !== 'none') {
      const isRecorded = (eq.rangedWeaponItemId && inv.some(i => i.id === eq.rangedWeaponItemId)) ||
        isItemInInventory(inv, eq.rangedWeapon) ||
        isItemInInventory(inv, resolveWeapon(eq.rangedWeapon, character.customWeapons || [], weaponsData).name);

      if (!isRecorded) {
        const rngWpn = resolveWeapon(eq.rangedWeapon, character.customWeapons || [], weaponsData);
        weight += parseWeight(rngWpn.weight);
      }
    }

    // 4. Wondrous Items Weight (if not already recorded in inventory)
    if (eq.wondrousItems && eq.wondrousItems.length > 0) {
      eq.wondrousItems.forEach(item => {
        const isRecorded = (item.inventoryItemId && inv.some(i => i.id === item.inventoryItemId)) ||
          isItemInInventory(inv, item.name);
        if (!isRecorded) {
          weight += parseWeight(item.weight);
        }
      });
    }
  }

  // 5. General Inventory Weight (excluding Stash & Mount)
  if (inv.length > 0) {
    inv.forEach(item => {
      const loc = (item.location || 'Carried').toLowerCase();
      if (loc !== 'stash' && loc !== 'mount') {
        const qty = parseWeight(item.quantity) || 1;
        const itemW = parseWeight(item.weight);
        // Haversack items weigh 0 in D&D 3.5e
        if (loc !== 'haversack') {
          weight += qty * itemW;
        }
      }
    });
  }

  // 6. Coin Weight
  weight += parseWeight(calculateCoinWeight(character.funds));

  return parseFloat(weight.toFixed(1));
}

export type EncumbranceLevel = 'light' | 'medium' | 'heavy' | 'overloaded';

export interface EncumbranceStatus {
  level: EncumbranceLevel;
  label: string;
  maxDexCap: number | null;
  checkPenalty: number;
  speedPenalty: string;
}

/**
 * Determines current encumbrance level and associated penalties.
 */
export function getEncumbranceStatus(carriedWeight: number, capacity: CarryingCapacity): EncumbranceStatus {
  if (carriedWeight <= capacity.light) {
    return {
      level: 'light',
      label: 'Light Load',
      maxDexCap: null,
      checkPenalty: 0,
      speedPenalty: 'Normal'
    };
  } else if (carriedWeight <= capacity.medium) {
    return {
      level: 'medium',
      label: 'Medium Load',
      maxDexCap: 3,
      checkPenalty: -3,
      speedPenalty: '30 ft -> 20 ft / 20 ft -> 15 ft'
    };
  } else if (carriedWeight <= capacity.heavy) {
    return {
      level: 'heavy',
      label: 'Heavy Load',
      maxDexCap: 1,
      checkPenalty: -6,
      speedPenalty: '30 ft -> 20 ft (x3 run)'
    };
  } else {
    return {
      level: 'overloaded',
      label: 'Overloaded!',
      maxDexCap: 0,
      checkPenalty: -10,
      speedPenalty: 'Cannot move / Drag only'
    };
  }
}

// ======================================================================
// 3.5e 12 BODY SLOT CATALOG & AFFINITY DEFINITIONS (DMG Table 7-33 & MIC Ch 6)
// ======================================================================

export const CANONICAL_BODY_SLOTS: BodySlotDefinition[] = [
  {
    id: 'head',
    name: 'Head',
    category: 'head_face',
    description: 'Circlets, crowns, hats, helmets, phylacteries',
    affinity: 'Mental acuity, intellect/wisdom boons, telepathy, mind-affecting effects',
    icon: 'fa-solid fa-crown',
    examples: ['Circlet of Blasting', 'Helm of Telepathy', 'Phylactery of Faithfulness', 'Hat of Disguise']
  },
  {
    id: 'headband',
    name: 'Headband / Eyes',
    category: 'head_face',
    description: 'Headbands, eye lenses, goggles, spectacles, masks',
    affinity: 'Vision enhancements, perception, gaze attacks and gaze protection',
    icon: 'fa-solid fa-glasses',
    examples: ['Goggles of Minute Seeing', 'Eyes of the Eagle', 'Headband of Intellect', 'Lenses of Detection']
  },
  {
    id: 'neck',
    name: 'Neck',
    category: 'torso',
    description: 'Amulets, brooches, medallions, necklaces, periapts, scarabs',
    affinity: 'Constitution, natural armor, health, adaptations, bodily warding',
    icon: 'fa-solid fa-gem',
    examples: ['Amulet of Health', 'Amulet of Natural Armor', 'Periapt of Wisdom', 'Medallion of Thoughts']
  },
  {
    id: 'shoulders',
    name: 'Shoulders',
    category: 'torso',
    description: 'Capes, cloaks, mantles, shawls',
    affinity: 'Saving throw resistance bonuses, deflection AC, stealth, movement & flight',
    icon: 'fa-solid fa-feather',
    examples: ['Cloak of Resistance', 'Cloak of Elvenkind', 'Cloak of Displacement', 'Wings of Flying']
  },
  {
    id: 'chest',
    name: 'Chest',
    category: 'torso',
    description: 'Vests, vestments, shirts',
    affinity: 'Armor bonuses, swift action utility, bodily resilience',
    icon: 'fa-solid fa-vest',
    examples: ['Vest of Health', 'Shirt of the Leech', 'Vestment of Many Styles']
  },
  {
    id: 'body',
    name: 'Body',
    category: 'torso',
    description: 'Robes, full-body vestments, suits of magical apparel',
    affinity: 'Spellcasting enhancements, spell resistance, energy resistance',
    icon: 'fa-solid fa-person-dress',
    examples: ['Robe of the Archmagi', 'Robe of Eyes', 'Robe of Scintillating Colors', 'Monk\'s Robe']
  },
  {
    id: 'armor',
    name: 'Armor',
    category: 'torso',
    description: 'Suit of armor (padded, leather, chainmail, full plate, etc.)',
    affinity: 'Armor Class enhancement bonuses, armor special qualities',
    icon: 'fa-solid fa-shield-halved',
    examples: ['Full Plate +1', 'Mithral Breastplate', 'Shadow Leather Armor']
  },
  {
    id: 'hands',
    name: 'Hands',
    category: 'arms_hands',
    description: 'Gloves, gauntlets',
    affinity: 'Dexterity bonuses, unarmed/touch damage, weapon grip & sleight of hand',
    icon: 'fa-solid fa-mitten',
    examples: ['Gloves of Dexterity', 'Gauntlets of Ogre Power', 'Gloves of Arrow Snaring']
  },
  {
    id: 'arms',
    name: 'Arms',
    category: 'arms_hands',
    description: 'Bracers, armbands, bracelets',
    affinity: 'Armor/shield bonuses, combat deflection, arm strength boons',
    icon: 'fa-solid fa-hand-back-fist',
    examples: ['Bracers of Armor', 'Armbands of Might', 'Bracers of Archery']
  },
  {
    id: 'waist',
    name: 'Waist',
    category: 'waist_feet',
    description: 'Belts, girdles, sashes',
    affinity: 'Strength bonuses, constitution, healing reserves, carrying capacity',
    icon: 'fa-solid fa-grip-lines',
    examples: ['Belt of Giant Strength', 'Belt of Battle', 'Healing Belt', 'Monk\'s Belt']
  },
  {
    id: 'feet',
    name: 'Feet',
    category: 'waist_feet',
    description: 'Boots, shoes, slippers',
    affinity: 'Speed increases, acrobatics, balance, movement, mobility & teleportation',
    icon: 'fa-solid fa-shoe-prints',
    examples: ['Boots of Speed', 'Boots of Striding and Springing', 'Winged Boots', 'Boots of the Winterlands']
  },
  {
    id: 'ring1',
    name: 'Ring 1',
    category: 'rings',
    description: 'Magic ring worn on right hand',
    affinity: 'Diverse magical boons, deflection, energy resistance, spell storing',
    icon: 'fa-solid fa-ring',
    examples: ['Ring of Protection', 'Ring of Wizardry', 'Ring of Invisibility']
  },
  {
    id: 'ring2',
    name: 'Ring 2',
    category: 'rings',
    description: 'Magic ring worn on left hand',
    affinity: 'Diverse magical boons, deflection, energy resistance, spell storing',
    icon: 'fa-solid fa-ring',
    examples: ['Ring of Protection', 'Ring of Sustenance', 'Ring of Feather Falling']
  },
  {
    id: 'slotless',
    name: 'Slotless / Other',
    category: 'slotless',
    description: 'Magic items that do not occupy a body slot (carried, activated, or floating)',
    affinity: 'Ioun stones, portable containers, wondrous instruments',
    icon: 'fa-solid fa-wand-magic-sparkles',
    examples: ['Ioun Stone', 'Handy Haversack', 'Bag of Holding', 'Portable Hole']
  }
];

export const BODY_SLOT_MAP: Record<BodySlotId, BodySlotDefinition> = CANONICAL_BODY_SLOTS.reduce(
  (acc, slot) => {
    acc[slot.id] = slot;
    return acc;
  },
  {} as Record<BodySlotId, BodySlotDefinition>
);

export interface SlotItem {
  id: string;
  name: string;
  slot: BodySlotId;
  effect?: string;
  source: 'armor' | 'wondrous';
  weight?: number;
  inventoryItemId?: string;
}

export interface SlotValidationReport {
  slot: BodySlotDefinition;
  equippedItems: SlotItem[];
  isOccupied: boolean;
  hasConflict: boolean;
  conflictMessage?: string;
}

export interface BodySlotReport {
  slots: Record<BodySlotId, SlotValidationReport>;
  conflicts: SlotValidationReport[];
  totalConflicts: number;
  conflictSummary: string[];
  totalOccupiedSlots: number;
  isAllValid: boolean;
}

/**
 * Validates equipped items across all 3.5e body slots.
 * Detects multiple items assigned to the same slot (slot conflict) and evaluates
 * armor occupancy between equipment.armor and wondrous items with slot='armor'.
 */
export function validateBodySlots(
  equipment: Equipment | undefined,
  customArmors: CustomArmorData[] = []
): BodySlotReport {
  const eq = equipment || { armor: 'none', armorEnhancement: 0, shield: 'none', shieldEnhancement: 0, deflection: 0, natural: 0, dodge: 0, primaryWeapon: 'none' };
  const itemsBySlot: Record<BodySlotId, SlotItem[]> = {
    head: [],
    headband: [],
    neck: [],
    shoulders: [],
    chest: [],
    body: [],
    armor: [],
    hands: [],
    arms: [],
    waist: [],
    feet: [],
    ring1: [],
    ring2: [],
    slotless: []
  };

  // 1. Equipped Suit of Armor
  if (eq.armor && eq.armor !== 'none' && eq.armor !== '__CUSTOM__') {
    const resolved = resolveArmor(eq.armor, customArmors);
    itemsBySlot.armor.push({
      id: eq.armorItemId || 'equipped_armor',
      name: resolved.name || eq.armor,
      slot: 'armor',
      source: 'armor',
      inventoryItemId: eq.armorItemId || undefined
    });
  }

  // 2. Equipped Wondrous Items
  if (Array.isArray(eq.wondrousItems)) {
    for (const item of eq.wondrousItems) {
      const targetSlot = (itemsBySlot[item.slot] ? item.slot : 'slotless') as BodySlotId;
      itemsBySlot[targetSlot].push({
        id: item.id,
        name: item.name,
        slot: targetSlot,
        effect: item.effect,
        source: 'wondrous',
        weight: item.weight,
        inventoryItemId: item.inventoryItemId
      });
    }
  }

  const slotsReport: Partial<Record<BodySlotId, SlotValidationReport>> = {};
  const conflicts: SlotValidationReport[] = [];
  let totalConflicts = 0;
  const conflictSummary: string[] = [];
  let totalOccupiedSlots = 0;

  for (const slotDef of CANONICAL_BODY_SLOTS) {
    const items = itemsBySlot[slotDef.id] || [];
    const isOccupied = items.length > 0;
    // Slotless items never conflict
    const hasConflict = slotDef.id !== 'slotless' && items.length > 1;

    if (slotDef.id !== 'slotless' && isOccupied) {
      totalOccupiedSlots++;
    }

    let conflictMessage: string | undefined;
    if (hasConflict) {
      totalConflicts++;
      const itemNames = items.map(i => i.name).join(', ');
      conflictMessage = `Slot Conflict: ${items.length} items equipped in ${slotDef.name} slot (${itemNames}). In 3.5e rules, only one item per body slot is functional.`;
      conflictSummary.push(`${slotDef.name}: ${itemNames}`);
    }

    const reportItem: SlotValidationReport = {
      slot: slotDef,
      equippedItems: items,
      isOccupied,
      hasConflict,
      conflictMessage
    };

    slotsReport[slotDef.id] = reportItem;
    if (hasConflict) {
      conflicts.push(reportItem);
    }
  }

  return {
    slots: slotsReport as Record<BodySlotId, SlotValidationReport>,
    conflicts,
    totalConflicts,
    conflictSummary,
    totalOccupiedSlots,
    isAllValid: totalConflicts === 0
  };
}

// ======================================================================
// 3.5e AMMUNITION TRACKER & PRESETS
// ======================================================================

export interface AmmoPreset {
  id: string;
  name: string;
  ammoType: AmmoCategory;
  quantity: number;
  weight: number; // total batch weight in lbs
  value: string;
  location: string;
  notes?: string;
  material?: EquipmentMaterial | string;
  enhancementBonus?: number;
  specialQualities?: string[];
  isMasterwork?: boolean;
}

export const STANDARD_AMMO_PRESETS: AmmoPreset[] = [
  {
    id: 'arrows_20',
    name: 'Arrows (20)',
    ammoType: 'arrow',
    quantity: 20,
    weight: 3,
    value: '1 gp',
    location: 'Quiver',
    notes: 'Standard arrows for bows (20)'
  },
  {
    id: 'bolts_10',
    name: 'Crossbow Bolts (10)',
    ammoType: 'bolt',
    quantity: 10,
    weight: 1,
    value: '1 gp',
    location: 'Quiver',
    notes: 'Standard bolts for crossbows (10)'
  },
  {
    id: 'bullets_10',
    name: 'Sling Bullets (10)',
    ammoType: 'bullet',
    quantity: 10,
    weight: 5,
    value: '1 sp',
    location: 'Belt Pouch',
    notes: 'Lead bullets for slings (10)'
  },
  {
    id: 'mwk_arrows_20',
    name: 'Masterwork Arrows (20)',
    ammoType: 'arrow',
    quantity: 20,
    weight: 3,
    value: '121 gp',
    location: 'Quiver',
    isMasterwork: true,
    notes: '+1 enhancement bonus on attack rolls'
  },
  {
    id: 'mwk_bolts_10',
    name: 'Masterwork Bolts (10)',
    ammoType: 'bolt',
    quantity: 10,
    weight: 1,
    value: '61 gp',
    location: 'Quiver',
    isMasterwork: true,
    notes: '+1 enhancement bonus on attack rolls'
  },
  {
    id: 'silver_arrows_20',
    name: 'Alchemical Silver Arrows (20)',
    ammoType: 'arrow',
    quantity: 20,
    weight: 3,
    value: '41 gp',
    location: 'Quiver',
    material: 'alchemical_silver',
    notes: 'Bypasses Silver DR (-1 damage penalty)'
  },
  {
    id: 'cold_iron_arrows_20',
    name: 'Cold Iron Arrows (20)',
    ammoType: 'arrow',
    quantity: 20,
    weight: 3,
    value: '2 gp',
    location: 'Quiver',
    material: 'cold_iron',
    notes: 'Bypasses Cold Iron DR'
  },
  {
    id: 'adamantine_arrows_10',
    name: 'Adamantine Arrows (10)',
    ammoType: 'arrow',
    quantity: 10,
    weight: 1.5,
    value: '601 gp',
    location: 'Quiver',
    material: 'adamantine',
    notes: 'Bypasses Adamantine DR & ignores hardness < 20'
  },
  {
    id: 'flaming_arrows_20',
    name: '+1 Flaming Arrows (20)',
    ammoType: 'arrow',
    quantity: 20,
    weight: 3,
    value: '3,200 gp',
    location: 'Quiver',
    enhancementBonus: 1,
    specialQualities: ['flaming'],
    notes: '+1 attack & damage, +1d6 fire damage on hit'
  },
  {
    id: 'screaming_bolts_5',
    name: 'Screaming Bolts (5)',
    ammoType: 'bolt',
    quantity: 5,
    weight: 0.5,
    value: '1,335 gp',
    location: 'Quiver',
    enhancementBonus: 2,
    notes: '+2 bolt, screams in flight forcing DC 14 Will save vs shaken'
  },
  {
    id: 'sleep_arrows_5',
    name: 'Sleep Arrows (5)',
    ammoType: 'arrow',
    quantity: 5,
    weight: 0.5,
    value: '660 gp',
    location: 'Quiver',
    notes: '+1 arrow, target must succeed DC 11 Will save or fall asleep for 5 minutes'
  }
];

/**
 * Maps a weapon name to its canonical 3.5e ammunition type.
 */
export function getMatchingAmmoTypeForWeapon(weaponName: string, category?: string): AmmoCategory {
  const clean = (weaponName || '').toLowerCase();
  if (clean.includes('crossbow') || clean.includes('arbalest')) {
    return 'bolt';
  }
  if (clean.includes('sling') || clean.includes('warsling')) {
    return 'bullet';
  }
  if (clean.includes('blowgun')) {
    return 'needle';
  }
  if (clean.includes('shuriken')) {
    return 'shuriken';
  }
  if (clean.includes('bow') || clean.includes('arrow')) {
    return 'arrow';
  }
  return 'other';
}

/**
 * Creates an InventoryItem representation from an AmmoPreset.
 */
export function createInventoryAmmo(preset: AmmoPreset, quantityOverride?: number): InventoryItem {
  const qty = quantityOverride !== undefined ? quantityOverride : preset.quantity;
  const unitWeight = preset.quantity > 0 ? preset.weight / preset.quantity : preset.weight;
  return {
    id: `ammo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: preset.name,
    quantity: qty,
    weight: parseFloat(unitWeight.toFixed(3)),
    location: preset.location || 'Quiver',
    value: preset.value,
    notes: preset.notes,
    material: preset.material,
    enhancementBonus: preset.enhancementBonus,
    specialQualities: preset.specialQualities,
    isMasterwork: preset.isMasterwork,
    itemType: 'ammunition',
    ammoType: preset.ammoType
  };
}

/**
 * Returns all ammunition items in a character's inventory.
 */
export function getCharacterAmmunition(character: CharacterState): InventoryItem[] {
  const inv = character.inventory || [];
  return inv.filter(i => {
    if (i.itemType === 'ammunition') return true;
    const clean = (i.name || '').toLowerCase();
    return clean.includes('arrow') || clean.includes('bolt') || clean.includes('bullet') || clean.includes('needle') || clean.includes('shuriken');
  });
}

export interface DecrementAmmoResult {
  updatedCharacter: CharacterState;
  ammoItem?: InventoryItem;
  countDrawn: number;
  remaining: number;
  exhausted: boolean;
  message: string;
}

/**
 * Decrements the quantity of the character's active/equipped ammunition.
 * If no explicit equippedAmmoId is set, attempts to auto-detect matching ammunition for the equipped ranged weapon.
 */
export function decrementEquippedAmmunition(
  character: CharacterState,
  count: number = 1,
  force: boolean = false
): DecrementAmmoResult {
  const eq = character.equipment || { armor: 'none', armorEnhancement: 0, shield: 'none', shieldEnhancement: 0, deflection: 0, natural: 0, dodge: 0, primaryWeapon: 'none' };

  if (!force && eq.autoDecrementAmmo === false) {
    return {
      updatedCharacter: character,
      countDrawn: 0,
      remaining: 0,
      exhausted: false,
      message: 'Auto-decrement ammunition is disabled.'
    };
  }

  if (count <= 0) {
    return {
      updatedCharacter: character,
      countDrawn: 0,
      remaining: 0,
      exhausted: false,
      message: 'No ammunition drawn.'
    };
  }

  const inventory = Array.isArray(character.inventory) ? [...character.inventory] : [];

  // 1. Locate ammo item
  let ammoIndex = -1;
  if (eq.equippedAmmoId) {
    ammoIndex = inventory.findIndex(i => i.id === eq.equippedAmmoId);
  }

  // 2. Fallback: match by equipped ranged weapon type
  if (ammoIndex === -1 && eq.rangedWeapon && eq.rangedWeapon !== 'none') {
    const expectedType = getMatchingAmmoTypeForWeapon(eq.rangedWeapon);
    ammoIndex = inventory.findIndex(i =>
      (i.itemType === 'ammunition' || (i.name && (i.name.toLowerCase().includes('arrow') || i.name.toLowerCase().includes('bolt') || i.name.toLowerCase().includes('bullet')))) &&
      (i.ammoType === expectedType || (expectedType === 'arrow' && i.name.toLowerCase().includes('arrow')) || (expectedType === 'bolt' && i.name.toLowerCase().includes('bolt')) || (expectedType === 'bullet' && i.name.toLowerCase().includes('bullet'))) &&
      (i.quantity || 0) > 0
    );
  }

  // 3. Fallback: any available ammunition item with quantity > 0
  if (ammoIndex === -1) {
    ammoIndex = inventory.findIndex(i =>
      (i.itemType === 'ammunition' || (i.name && (i.name.toLowerCase().includes('arrow') || i.name.toLowerCase().includes('bolt') || i.name.toLowerCase().includes('bullet')))) &&
      (i.quantity || 0) > 0
    );
  }

  if (ammoIndex === -1) {
    return {
      updatedCharacter: character,
      countDrawn: 0,
      remaining: 0,
      exhausted: true,
      message: 'No ammunition available in inventory!'
    };
  }

  const currentAmmo = inventory[ammoIndex];
  const currentQty = currentAmmo.quantity || 0;

  if (currentQty <= 0) {
    return {
      updatedCharacter: character,
      ammoItem: currentAmmo,
      countDrawn: 0,
      remaining: 0,
      exhausted: true,
      message: `Out of ammunition: ${currentAmmo.name} has 0 remaining!`
    };
  }

  const countDrawn = Math.min(currentQty, count);
  const remaining = currentQty - countDrawn;
  const exhausted = remaining === 0;

  const updatedAmmo: InventoryItem = {
    ...currentAmmo,
    quantity: remaining,
    itemType: 'ammunition'
  };

  inventory[ammoIndex] = updatedAmmo;

  const updatedEq: Equipment = {
    ...eq,
    equippedAmmoId: currentAmmo.id
  };

  const updatedCharacter: CharacterState = {
    ...character,
    inventory,
    equipment: updatedEq
  };

  const message = exhausted
    ? `Expended ${countDrawn} ${currentAmmo.name}. Ammunition is now completely exhausted (0 remaining)!`
    : `Expended ${countDrawn} ${currentAmmo.name} (${remaining} remaining).`;

  return {
    updatedCharacter,
    ammoItem: updatedAmmo,
    countDrawn,
    remaining,
    exhausted,
    message
  };
}

export {
  STANDARD_WONDROUS_ITEMS,
  getPredefinedWondrousItems,
  createWondrousItemFromPredefined
} from './wondrousItems';
export type { PredefinedWondrousItem } from './wondrousItems';
