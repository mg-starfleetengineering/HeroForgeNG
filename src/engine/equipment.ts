import { WeaponData, CustomArmorData, CharacterState, InventoryItem, ItemArmorData, ItemWeaponData, Equipment } from '../types/character';
import { parseMagicItemName, formatMagicItemName } from './magicItems';

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
  if (!rawName || !rawName.trim()) {
    return normalizeWeapon(DEFAULT_WEAPON);
  }

  const cleanName = rawName.trim();

  // 1. Check direct match in customWeapons
  const customMatch = customWeapons.find(
    w => w.name.toLowerCase() === cleanName.toLowerCase()
  );
  if (customMatch) return normalizeWeapon(customMatch);

  // 2. Check direct match in standard weaponsData
  const stdMatch = weaponsData.find(
    w => w.name.toLowerCase() === cleanName.toLowerCase()
  );
  if (stdMatch) return normalizeWeapon({ ...stdMatch, source: stdMatch.source || 'PHB' });

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

  // 4. Check if cleanName is a magic weapon name e.g. "+1 Flaming Longsword" or "+2 Keen Nodachi"
  const parsedMagicWpn = parseMagicItemName(cleanName);
  if (parsedMagicWpn.enhancementBonus > 0 || parsedMagicWpn.qualities.length > 0) {
    const baseWpn = resolveWeapon(parsedMagicWpn.baseName, customWeapons, weaponsData);
    if (baseWpn && (baseWpn.id !== 'unarmed' || parsedMagicWpn.baseName.toLowerCase().includes('unarmed'))) {
      return normalizeWeapon({
        ...baseWpn,
        name: cleanName,
        enhancementBonus: parsedMagicWpn.enhancementBonus,
        specialQualities: parsedMagicWpn.qualities
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
      return {
        ...baseResolved,
        name: armorKey,
        baseArmorId: baseResolved.baseArmorId || baseResolved.name
      };
    }
  }

  // 4. Magic armor name e.g. "+1 Chain Shirt", "+2 Shadow Leather Armor"
  const parsedMagicArmor = parseMagicItemName(armorKey, 'armor');
  if (parsedMagicArmor.enhancementBonus > 0 || parsedMagicArmor.qualities.length > 0) {
    const baseArmor = resolveArmor(parsedMagicArmor.baseName, customArmors);
    if (baseArmor && (baseArmor.name.toLowerCase() !== 'none' || parsedMagicArmor.baseName.toLowerCase() === 'none')) {
      return {
        ...baseArmor,
        name: armorKey,
        enhancementBonus: parsedMagicArmor.enhancementBonus,
        specialQualities: parsedMagicArmor.qualities,
        baseArmorId: baseArmor.baseArmorId || baseArmor.name
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
      baseArmorId: customMatch.baseArmorId || customMatch.id
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
      return {
        ...baseResolved,
        name: shieldKey,
        baseArmorId: baseResolved.baseArmorId || baseResolved.name
      };
    }
  }

  // 4. Magic shield name e.g. "+1 Heavy Shield"
  const parsedMagicShield = parseMagicItemName(shieldKey, 'shield');
  if (parsedMagicShield.enhancementBonus > 0 || parsedMagicShield.qualities.length > 0) {
    const baseShield = resolveShield(parsedMagicShield.baseName, customArmors);
    if (baseShield && (baseShield.name.toLowerCase() !== 'none' || parsedMagicShield.baseName.toLowerCase() === 'none')) {
      return {
        ...baseShield,
        name: shieldKey,
        enhancementBonus: parsedMagicShield.enhancementBonus,
        specialQualities: parsedMagicShield.qualities,
        baseArmorId: baseShield.baseArmorId || baseShield.name
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

  const selectedFeats = character.selectedFeats || [];
  const wpnName = weapon.name.toLowerCase();

  // Extract base model if alias pattern exists, e.g. "Nodachi (Greatsword)" -> "greatsword"
  const aliasMatch = weapon.name.match(/^(.+?)\s*\((.+?)\)$/);
  const customSubName = aliasMatch ? aliasMatch[1].trim().toLowerCase() : wpnName;
  const baseSubName = aliasMatch ? aliasMatch[2].trim().toLowerCase() : wpnName;

  selectedFeats.forEach(featStr => {
    // Parse feat pattern e.g. "Weapon Focus (Nodachi)" or "Weapon Focus: Nodachi"
    const featMatch = featStr.match(/^(.+?)(?:\s*[\(:])\s*(.+?)\)?$/);
    if (!featMatch) return;

    const featName = featMatch[1].trim().toLowerCase();
    const featTarget = featMatch[2].trim().toLowerCase();

    // Check if target matches custom weapon name, base weapon name, or full string
    const isMatch =
      featTarget === wpnName ||
      featTarget === customSubName ||
      featTarget === baseSubName ||
      wpnName.includes(featTarget) ||
      featTarget.includes(wpnName);

    if (isMatch) {
      if (featName === 'weapon focus') attackBonus += 1;
      if (featName === 'greater weapon focus') attackBonus += 1;
      if (featName === 'weapon specialization') damageBonus += 2;
      if (featName === 'greater weapon specialization') damageBonus += 2;
      if (featName === 'epic weapon focus') attackBonus += 2;
      if (featName === 'epic weapon specialization') damageBonus += 4;
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
    location?: string;
  },
  arg3?: WeaponData[] | {
    id?: string;
    name?: string;
    quantity?: number;
    enhancementBonus?: number;
    specialQualities?: string[];
    location?: string;
  },
  arg4?: {
    id?: string;
    name?: string;
    quantity?: number;
    enhancementBonus?: number;
    specialQualities?: string[];
    location?: string;
  }
): InventoryItem {
  let resolved: WeaponData;
  let options: {
    id?: string;
    name?: string;
    quantity?: number;
    enhancementBonus?: number;
    specialQualities?: string[];
    location?: string;
  } | undefined;

  if (typeof baseWeapon === 'string') {
    const weaponsData = Array.isArray(arg2) ? arg2 : [];
    const customWeapons = Array.isArray(arg3) ? arg3 : [];
    resolved = resolveWeapon(baseWeapon, customWeapons, weaponsData);
    options = (!Array.isArray(arg2) && typeof arg2 === 'object')
      ? arg2
      : ((!Array.isArray(arg3) && typeof arg3 === 'object') ? arg3 : arg4);
  } else {
    resolved = baseWeapon;
    options = (!Array.isArray(arg2) && typeof arg2 === 'object') ? arg2 : undefined;
  }

  const enh = options?.enhancementBonus ?? resolved.enhancementBonus ?? 0;
  const qualities = options?.specialQualities ?? resolved.specialQualities ?? [];
  const name = options?.name || (enh > 0 || qualities.length > 0
    ? formatMagicItemName(resolved.name, enh, qualities)
    : resolved.name);

  return {
    id: options?.id || `inv_wpn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name,
    quantity: options?.quantity ?? 1,
    weight: resolved.weight ?? 0,
    location: options?.location || 'Carried',
    itemType: 'weapon',
    baseItemId: resolved.id,
    enhancementBonus: enh,
    specialQualities: qualities,
    weaponData: {
      category: resolved.category,
      size: resolved.size,
      damageM: resolved.damageM,
      damageS: resolved.damageS,
      threat: resolved.threat ?? 20,
      critMultiplier: resolved.critMultiplier ?? 2,
      damageType: resolved.type,
      rangeIncrement: resolved.rangeIncrement,
      isRanged: resolved.category === 'Ranged' || resolved.size === 'Ranged'
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
  }
): InventoryItem {
  const resolved = resolveArmor(armorKey, customArmors);
  const enh = options?.enhancementBonus ?? resolved.enhancementBonus ?? 0;
  const qualities = options?.specialQualities ?? resolved.specialQualities ?? [];
  const baseName = resolved.baseArmorId || resolved.name;
  const name = options?.name || (enh > 0 || qualities.length > 0
    ? formatMagicItemName(baseName, enh, qualities)
    : resolved.name);

  const stdWeight = resolved.weight ?? (ARMOR_WEIGHT_MAP[resolved.name.toLowerCase()] ?? 20);

  return {
    id: options?.id || `inv_arm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name,
    quantity: options?.quantity ?? 1,
    weight: stdWeight,
    location: options?.location || 'Carried',
    itemType: 'armor',
    baseItemId: resolved.baseArmorId || resolved.name.toLowerCase().replace(/\s+/g, '_'),
    enhancementBonus: enh,
    specialQualities: qualities,
    armorData: {
      type: (resolved.type as any) || 'medium',
      acBonus: resolved.acBonus,
      maxDex: resolved.maxDex ?? 99,
      armorCheckPenalty: resolved.checkPenalty ?? 0,
      spellFailure: resolved.spellFailure ?? 0,
      speedPenalty: resolved.speedPenalty ?? (resolved.type === 'heavy' || resolved.type === 'medium')
    }
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
  }
): InventoryItem {
  const resolved = resolveShield(shieldKey, customArmors);
  const enh = options?.enhancementBonus ?? resolved.enhancementBonus ?? 0;
  const qualities = options?.specialQualities ?? resolved.specialQualities ?? [];
  const baseName = resolved.baseArmorId || resolved.name;
  const name = options?.name || (enh > 0 || qualities.length > 0
    ? formatMagicItemName(baseName, enh, qualities)
    : resolved.name);

  const stdWeight = resolved.weight ?? (SHIELD_WEIGHT_MAP[resolved.name.toLowerCase()] ?? 10);

  return {
    id: options?.id || `inv_shd_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name,
    quantity: options?.quantity ?? 1,
    weight: stdWeight,
    location: options?.location || 'Carried',
    itemType: 'shield',
    baseItemId: resolved.baseArmorId || resolved.name.toLowerCase().replace(/\s+/g, '_'),
    enhancementBonus: enh,
    specialQualities: qualities,
    armorData: {
      type: 'shield',
      acBonus: resolved.acBonus,
      maxDex: 99,
      armorCheckPenalty: resolved.checkPenalty ?? 0,
      spellFailure: resolved.spellFailure ?? 0,
      speedPenalty: false
    }
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
      return {
        name: item.name,
        acBonus: item.armorData.acBonus,
        checkPenalty: item.armorData.armorCheckPenalty,
        type: item.armorData.type,
        maxDex: item.armorData.maxDex,
        speedPenalty: item.armorData.speedPenalty,
        spellFailure: item.armorData.spellFailure,
        enhancementBonus: item.enhancementBonus || 0,
        specialQualities: item.specialQualities ? [...item.specialQualities] : [],
        baseArmorId: item.baseItemId
      };
    }
  }
  return resolveArmor(eq.armor, customArmors);
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
      return {
        name: item.name,
        acBonus: item.armorData.acBonus,
        checkPenalty: item.armorData.armorCheckPenalty,
        type: 'shield',
        spellFailure: item.armorData.spellFailure,
        enhancementBonus: item.enhancementBonus || 0,
        specialQualities: item.specialQualities ? [...item.specialQualities] : [],
        baseArmorId: item.baseItemId
      };
    }
  }
  return resolveShield(eq.shield, customArmors);
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
    return resolveWeapon('none', customWeapons, weaponsData);
  }
  const idKey = `${slot}ItemId` as keyof Equipment;
  const itemId = eq[idKey] as string | undefined;
  if (itemId && character.inventory) {
    const item = character.inventory.find(i => i.id === itemId);
    if (item && item.weaponData) {
      return {
        id: item.baseItemId || item.id,
        name: item.name,
        category: item.weaponData.category || 'Martial',
        size: item.weaponData.size || 'M',
        damageM: item.weaponData.damageM || '1d8',
        threat: item.weaponData.threat ?? 20,
        critMultiplier: item.weaponData.critMultiplier ?? 2,
        weight: item.weight ?? 4,
        type: item.weaponData.damageType || 'Slashing',
        enhancementBonus: item.enhancementBonus || 0,
        specialQualities: item.specialQualities ? [...item.specialQualities] : [],
        source: 'Custom'
      };
    }
  }
  return resolveWeapon(slotName, customWeapons, weaponsData);
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
      if (!existing.armorData) {
        const resolved = resolveArmor(existing.name, customArmors);
        existing.armorData = {
          type: (resolved.type as any) || 'medium',
          acBonus: resolved.acBonus,
          maxDex: resolved.maxDex ?? 99,
          armorCheckPenalty: resolved.checkPenalty ?? 0,
          spellFailure: resolved.spellFailure ?? 0,
          speedPenalty: resolved.speedPenalty ?? (resolved.type === 'heavy' || resolved.type === 'medium')
        };
        existing.itemType = 'armor';
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
    const resolved = resolveArmor(updatedEq.armor, customArmors);
    const existingMatch = currentInventory.find(i => matchesItemName(i.name, updatedEq.armor) || matchesItemName(i.name, resolved.name));
    if (existingMatch) {
      if (!existingMatch.armorData) {
        existingMatch.armorData = {
          type: (resolved.type as any) || 'medium',
          acBonus: resolved.acBonus,
          maxDex: resolved.maxDex ?? 99,
          armorCheckPenalty: resolved.checkPenalty ?? 0,
          spellFailure: resolved.spellFailure ?? 0,
          speedPenalty: resolved.speedPenalty ?? (resolved.type === 'heavy' || resolved.type === 'medium')
        };
        existingMatch.itemType = 'armor';
      }
      if (existingMatch.enhancementBonus === undefined && updatedEq.armorEnhancement) {
        existingMatch.enhancementBonus = updatedEq.armorEnhancement;
      }
      if ((!existingMatch.specialQualities || existingMatch.specialQualities.length === 0) && updatedEq.armorQualities) {
        existingMatch.specialQualities = [...updatedEq.armorQualities];
      }
      updatedEq.armorItemId = existingMatch.id;
      modified = true;
    } else {
      const newArm = createInventoryArmor(updatedEq.armor, customArmors, {
        enhancementBonus: updatedEq.armorEnhancement,
        specialQualities: updatedEq.armorQualities
      });
      currentInventory.push(newArm);
      updatedEq.armorItemId = newArm.id;
      modified = true;
    }
  }

  // 2. Shield Sync & Migration
  if (updatedEq.shieldItemId) {
    const existing = currentInventory.find(i => i.id === updatedEq.shieldItemId);
    if (existing) {
      if (!existing.armorData) {
        const resolved = resolveShield(existing.name, customArmors);
        existing.armorData = {
          type: 'shield',
          acBonus: resolved.acBonus,
          maxDex: 99,
          armorCheckPenalty: resolved.checkPenalty ?? 0,
          spellFailure: resolved.spellFailure ?? 0,
          speedPenalty: false
        };
        existing.itemType = 'shield';
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
    const resolved = resolveShield(updatedEq.shield, customArmors);
    const existingMatch = currentInventory.find(i => matchesItemName(i.name, updatedEq.shield) || matchesItemName(i.name, resolved.name));
    if (existingMatch) {
      if (!existingMatch.armorData) {
        existingMatch.armorData = {
          type: 'shield',
          acBonus: resolved.acBonus,
          maxDex: 99,
          armorCheckPenalty: resolved.checkPenalty ?? 0,
          spellFailure: resolved.spellFailure ?? 0,
          speedPenalty: false
        };
        existingMatch.itemType = 'shield';
      }
      if (existingMatch.enhancementBonus === undefined && updatedEq.shieldEnhancement) {
        existingMatch.enhancementBonus = updatedEq.shieldEnhancement;
      }
      if ((!existingMatch.specialQualities || existingMatch.specialQualities.length === 0) && updatedEq.shieldQualities) {
        existingMatch.specialQualities = [...updatedEq.shieldQualities];
      }
      updatedEq.shieldItemId = existingMatch.id;
      modified = true;
    } else {
      const newShd = createInventoryShield(updatedEq.shield, customArmors, {
        enhancementBonus: updatedEq.shieldEnhancement,
        specialQualities: updatedEq.shieldQualities
      });
      currentInventory.push(newShd);
      updatedEq.shieldItemId = newShd.id;
      modified = true;
    }
  }

  // 3. Primary Weapon Sync & Migration
  if (updatedEq.primaryWeaponItemId) {
    const existing = currentInventory.find(i => i.id === updatedEq.primaryWeaponItemId);
    if (existing) {
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
          isRanged: resolved.category === 'Ranged' || resolved.size === 'Ranged'
        };
        existing.itemType = 'weapon';
        modified = true;
      }
      if (updatedEq.primaryWeapon !== existing.name || updatedEq.primaryWeaponEnhancement !== (existing.enhancementBonus || 0)) {
        updatedEq.primaryWeapon = existing.name;
        updatedEq.primaryWeaponEnhancement = existing.enhancementBonus || 0;
        updatedEq.primaryWeaponQualities = existing.specialQualities || [];
        modified = true;
      }
    } else {
      updatedEq.primaryWeaponItemId = null;
      modified = true;
    }
  } else if (isValidEquippedName(updatedEq.primaryWeapon)) {
    const resolved = resolveWeapon(updatedEq.primaryWeapon, customWeapons, weaponsData);
    const existingMatch = currentInventory.find(i => matchesItemName(i.name, updatedEq.primaryWeapon) || matchesItemName(i.name, resolved.name));
    if (existingMatch) {
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
          isRanged: resolved.category === 'Ranged' || resolved.size === 'Ranged'
        };
        existingMatch.itemType = 'weapon';
      }
      if (existingMatch.enhancementBonus === undefined && updatedEq.primaryWeaponEnhancement) {
        existingMatch.enhancementBonus = updatedEq.primaryWeaponEnhancement;
      }
      if ((!existingMatch.specialQualities || existingMatch.specialQualities.length === 0) && updatedEq.primaryWeaponQualities) {
        existingMatch.specialQualities = [...updatedEq.primaryWeaponQualities];
      }
      updatedEq.primaryWeaponItemId = existingMatch.id;
      modified = true;
    } else {
      const newWpn = createInventoryWeapon(resolved, {
        name: updatedEq.primaryWeapon,
        enhancementBonus: updatedEq.primaryWeaponEnhancement,
        specialQualities: updatedEq.primaryWeaponQualities
      });
      currentInventory.push(newWpn);
      updatedEq.primaryWeaponItemId = newWpn.id;
      modified = true;
    }
  }

  // 4. Secondary Weapon Sync & Migration
  if (updatedEq.secondaryWeaponItemId) {
    const existing = currentInventory.find(i => i.id === updatedEq.secondaryWeaponItemId);
    if (existing) {
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
          isRanged: resolved.category === 'Ranged' || resolved.size === 'Ranged'
        };
        existing.itemType = 'weapon';
        modified = true;
      }
      if (updatedEq.secondaryWeapon !== existing.name || updatedEq.secondaryWeaponEnhancement !== (existing.enhancementBonus || 0)) {
        updatedEq.secondaryWeapon = existing.name;
        updatedEq.secondaryWeaponEnhancement = existing.enhancementBonus || 0;
        updatedEq.secondaryWeaponQualities = existing.specialQualities || [];
        modified = true;
      }
    } else {
      updatedEq.secondaryWeaponItemId = null;
      modified = true;
    }
  } else if (isValidEquippedName(updatedEq.secondaryWeapon)) {
    const resolved = resolveWeapon(updatedEq.secondaryWeapon, customWeapons, weaponsData);
    const existingMatch = currentInventory.find(i => i.id !== updatedEq.primaryWeaponItemId && (matchesItemName(i.name, updatedEq.secondaryWeapon) || matchesItemName(i.name, resolved.name)));
    if (existingMatch) {
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
          isRanged: resolved.category === 'Ranged' || resolved.size === 'Ranged'
        };
        existingMatch.itemType = 'weapon';
      }
      if (existingMatch.enhancementBonus === undefined && updatedEq.secondaryWeaponEnhancement) {
        existingMatch.enhancementBonus = updatedEq.secondaryWeaponEnhancement;
      }
      if ((!existingMatch.specialQualities || existingMatch.specialQualities.length === 0) && updatedEq.secondaryWeaponQualities) {
        existingMatch.specialQualities = [...updatedEq.secondaryWeaponQualities];
      }
      updatedEq.secondaryWeaponItemId = existingMatch.id;
      modified = true;
    } else {
      const newWpn = createInventoryWeapon(resolved, {
        name: updatedEq.secondaryWeapon,
        enhancementBonus: updatedEq.secondaryWeaponEnhancement,
        specialQualities: updatedEq.secondaryWeaponQualities
      });
      currentInventory.push(newWpn);
      updatedEq.secondaryWeaponItemId = newWpn.id;
      modified = true;
    }
  }

  // 5. Ranged Weapon Sync & Migration
  if (updatedEq.rangedWeaponItemId) {
    const existing = currentInventory.find(i => i.id === updatedEq.rangedWeaponItemId);
    if (existing) {
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
          isRanged: true
        };
        existing.itemType = 'weapon';
        modified = true;
      }
      if (updatedEq.rangedWeapon !== existing.name || updatedEq.rangedWeaponEnhancement !== (existing.enhancementBonus || 0)) {
        updatedEq.rangedWeapon = existing.name;
        updatedEq.rangedWeaponEnhancement = existing.enhancementBonus || 0;
        updatedEq.rangedWeaponQualities = existing.specialQualities || [];
        modified = true;
      }
    } else {
      updatedEq.rangedWeaponItemId = null;
      modified = true;
    }
  } else if (isValidEquippedName(updatedEq.rangedWeapon)) {
    const resolved = resolveWeapon(updatedEq.rangedWeapon, customWeapons, weaponsData);
    const existingMatch = currentInventory.find(i => matchesItemName(i.name, updatedEq.rangedWeapon) || matchesItemName(i.name, resolved.name));
    if (existingMatch) {
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
          isRanged: true
        };
        existingMatch.itemType = 'weapon';
      }
      if (existingMatch.enhancementBonus === undefined && updatedEq.rangedWeaponEnhancement) {
        existingMatch.enhancementBonus = updatedEq.rangedWeaponEnhancement;
      }
      if ((!existingMatch.specialQualities || existingMatch.specialQualities.length === 0) && updatedEq.rangedWeaponQualities) {
        existingMatch.specialQualities = [...updatedEq.rangedWeaponQualities];
      }
      updatedEq.rangedWeaponItemId = existingMatch.id;
      modified = true;
    } else {
      const newWpn = createInventoryWeapon(resolved, {
        name: updatedEq.rangedWeapon,
        enhancementBonus: updatedEq.rangedWeaponEnhancement,
        specialQualities: updatedEq.rangedWeaponQualities
      });
      currentInventory.push(newWpn);
      updatedEq.rangedWeaponItemId = newWpn.id;
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

