import { WeaponData, CustomArmorData, CharacterState } from '../types/character';

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

const STANDARD_ARMOR_MAP: Record<string, { name: string; acBonus: number; maxDex: number; checkPenalty: number }> = {
  none: { name: 'None', acBonus: 0, maxDex: 99, checkPenalty: 0 },
  padded: { name: 'Padded Armor', acBonus: 1, maxDex: 8, checkPenalty: 0 },
  leather: { name: 'Leather Armor', acBonus: 2, maxDex: 6, checkPenalty: 0 },
  studded: { name: 'Studded Leather Armor', acBonus: 3, maxDex: 5, checkPenalty: -1 },
  chainshirt: { name: 'Chain Shirt', acBonus: 4, maxDex: 4, checkPenalty: -2 },
  breastplate: { name: 'Breastplate', acBonus: 5, maxDex: 3, checkPenalty: -4 },
  fullplate: { name: 'Full Plate', acBonus: 8, maxDex: 1, checkPenalty: -6 }
};

const STANDARD_SHIELD_MAP: Record<string, { name: string; acBonus: number; checkPenalty: number }> = {
  none: { name: 'None', acBonus: 0, checkPenalty: 0 },
  buckler: { name: 'Buckler', acBonus: 1, checkPenalty: -1 },
  light_wooden: { name: 'Light Shield', acBonus: 1, checkPenalty: -1 },
  heavy_shield: { name: 'Heavy Shield', acBonus: 2, checkPenalty: -2 },
  tower_shield: { name: 'Tower Shield', acBonus: 4, checkPenalty: -10 }
};

/**
 * Resolves a weapon name to full WeaponData.
 * Supports format: "Custom Name (Base Model Name)" (e.g. "Nodachi (Greatsword)").
 */
export function resolveWeapon(
  rawName: string | undefined,
  customWeapons: WeaponData[] = [],
  weaponsData: WeaponData[] = []
): WeaponData {
  if (!rawName || !rawName.trim()) {
    return DEFAULT_WEAPON;
  }

  const cleanName = rawName.trim();

  // 1. Check direct match in customWeapons
  const customMatch = customWeapons.find(
    w => w.name.toLowerCase() === cleanName.toLowerCase()
  );
  if (customMatch) return customMatch;

  // 2. Check direct match in standard weaponsData
  const stdMatch = weaponsData.find(
    w => w.name.toLowerCase() === cleanName.toLowerCase()
  );
  if (stdMatch) return stdMatch;

  // 3. Check aliased pattern: "Custom Name (Base Weapon)" e.g. "Nodachi (Greatsword)"
  const aliasMatch = cleanName.match(/^(.+?)\s*\((.+?)\)$/);
  let baseName = cleanName;
  if (aliasMatch) {
    baseName = aliasMatch[2].trim();
  }

  // Look for base model match in custom or standard weapons
  const baseCustomMatch = customWeapons.find(
    w => w.name.toLowerCase() === baseName.toLowerCase()
  );
  if (baseCustomMatch) {
    return { ...baseCustomMatch, name: cleanName };
  }

  const baseStdMatch = weaponsData.find(
    w => w.name.toLowerCase() === baseName.toLowerCase() ||
         w.name.toLowerCase().includes(baseName.toLowerCase()) ||
         baseName.toLowerCase().includes(w.name.toLowerCase())
  );
  if (baseStdMatch) {
    return { ...baseStdMatch, name: cleanName };
  }

  // 4. Default fallback with custom name
  return {
    id: cleanName.toLowerCase().replace(/\s+/g, '_'),
    name: cleanName,
    category: 'Martial',
    size: 'M',
    damageM: '1d8',
    threat: 20,
    critMultiplier: 2,
    weight: 4,
    type: 'Slashing'
  };
}

/**
 * Resolves an armor key/name to Armor stats.
 */
export function resolveArmor(
  armorKey: string | undefined,
  customArmors: CustomArmorData[] = []
): { name: string; acBonus: number; maxDex: number; checkPenalty: number } {
  if (!armorKey) return STANDARD_ARMOR_MAP.none;

  const keyLower = armorKey.toLowerCase().trim();

  if (STANDARD_ARMOR_MAP[keyLower]) {
    return STANDARD_ARMOR_MAP[keyLower];
  }

  const customMatch = customArmors.find(
    a => a.name.toLowerCase() === keyLower || a.id.toLowerCase() === keyLower
  );
  if (customMatch) {
    return {
      name: customMatch.name,
      acBonus: customMatch.acBonus,
      maxDex: customMatch.maxDex ?? 99,
      checkPenalty: customMatch.armorCheckPenalty ?? 0
    };
  }

  return { name: armorKey, acBonus: 0, maxDex: 99, checkPenalty: 0 };
}

/**
 * Resolves a shield key/name to Shield stats.
 */
export function resolveShield(
  shieldKey: string | undefined,
  customArmors: CustomArmorData[] = []
): { name: string; acBonus: number; checkPenalty: number } {
  if (!shieldKey) return STANDARD_SHIELD_MAP.none;

  const keyLower = shieldKey.toLowerCase().trim();

  if (STANDARD_SHIELD_MAP[keyLower]) {
    return STANDARD_SHIELD_MAP[keyLower];
  }

  const customMatch = customArmors.find(
    a => (a.name.toLowerCase() === keyLower || a.id.toLowerCase() === keyLower) && a.type === 'shield'
  );
  if (customMatch) {
    return {
      name: customMatch.name,
      acBonus: customMatch.acBonus,
      checkPenalty: customMatch.armorCheckPenalty ?? 0
    };
  }

  return { name: shieldKey, acBonus: 0, checkPenalty: 0 };
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

const ARMOR_WEIGHT_MAP: Record<string, number> = {
  none: 0, padded: 10, leather: 15, studded: 20, chainshirt: 25, breastplate: 30, fullplate: 50
};

const SHIELD_WEIGHT_MAP: Record<string, number> = {
  none: 0, buckler: 5, light_wooden: 5, heavy_shield: 15, tower_shield: 45
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
 * Calculates total carried weight on person (in lbs).
 * Excludes items located in 'Stash' or 'Mount'.
 */
export function calculateTotalCarriedWeight(character: CharacterState, weaponsData: WeaponData[] = []): number {
  let weight = 0;
  const eq = character.equipment;

  const parseWeight = (val: any): number => {
    if (val === null || val === undefined) return 0;
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    return isNaN(num) ? 0 : num;
  };

  if (eq) {
    // 1. Armor Weight
    if (eq.armor) {
      const armorKey = eq.armor.toLowerCase().trim();
      if (ARMOR_WEIGHT_MAP[armorKey] !== undefined) {
        weight += ARMOR_WEIGHT_MAP[armorKey];
      } else {
        const customArmor = (character.customArmors || []).find(a => a.name.toLowerCase() === armorKey || a.id.toLowerCase() === armorKey);
        weight += parseWeight(customArmor?.weight || 20);
      }
    }

    // 2. Shield Weight
    if (eq.shield) {
      const shieldKey = eq.shield.toLowerCase().trim();
      if (SHIELD_WEIGHT_MAP[shieldKey] !== undefined) {
        weight += SHIELD_WEIGHT_MAP[shieldKey];
      } else {
        const customShield = (character.customArmors || []).find(a => a.name.toLowerCase() === shieldKey || a.id.toLowerCase() === shieldKey);
        weight += parseWeight(customShield?.weight || 10);
      }
    }

    // 3. Equipped Weapons Weight
    if (eq.primaryWeapon && eq.primaryWeapon !== 'none') {
      const primaryWpn = resolveWeapon(eq.primaryWeapon, character.customWeapons || [], weaponsData);
      weight += parseWeight(primaryWpn.weight);
    }
    if (eq.secondaryWeapon && eq.secondaryWeapon !== 'none') {
      const secWpn = resolveWeapon(eq.secondaryWeapon, character.customWeapons || [], weaponsData);
      weight += parseWeight(secWpn.weight);
    }
    if (eq.rangedWeapon && eq.rangedWeapon !== 'none') {
      const rngWpn = resolveWeapon(eq.rangedWeapon, character.customWeapons || [], weaponsData);
      weight += parseWeight(rngWpn.weight);
    }

    // 4. Wondrous Items Weight
    if (eq.wondrousItems && eq.wondrousItems.length > 0) {
      eq.wondrousItems.forEach(item => {
        weight += parseWeight(item.weight);
      });
    }
  }

  // 5. General Inventory Weight (excluding Stash & Mount)
  if (character.inventory && character.inventory.length > 0) {
    character.inventory.forEach(item => {
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

