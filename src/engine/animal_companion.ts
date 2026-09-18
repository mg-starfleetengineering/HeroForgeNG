import {
  CharacterState,
  AnimalCompanionData,
  CustomAnimalCompanionData,
  AnimalCompanionState,
  ClassData
} from '../types/character';
import { getAbilityMod } from './stats';
import { hasClassFeature } from './features';

export interface SizeModifier {
  size: string;
  acAndAttackMod: number;
  hideMod: number;
  bipedCarryMult: number;
  quadCarryMult: number;
}

export const COMPANION_SIZE_MODIFIERS: Record<string, SizeModifier> = {
  Fine: { size: 'Fine', acAndAttackMod: 8, hideMod: 16, bipedCarryMult: 0.125, quadCarryMult: 0.25 },
  Diminutive: { size: 'Diminutive', acAndAttackMod: 4, hideMod: 12, bipedCarryMult: 0.25, quadCarryMult: 0.5 },
  Tiny: { size: 'Tiny', acAndAttackMod: 2, hideMod: 8, bipedCarryMult: 0.5, quadCarryMult: 0.75 },
  Small: { size: 'Small', acAndAttackMod: 1, hideMod: 4, bipedCarryMult: 0.75, quadCarryMult: 1.0 },
  Medium: { size: 'Medium', acAndAttackMod: 0, hideMod: 0, bipedCarryMult: 1.0, quadCarryMult: 1.5 },
  Large: { size: 'Large', acAndAttackMod: -1, hideMod: -4, bipedCarryMult: 2.0, quadCarryMult: 3.0 },
  Huge: { size: 'Huge', acAndAttackMod: -2, hideMod: -8, bipedCarryMult: 4.0, quadCarryMult: 6.0 },
  Gargantuan: { size: 'Gargantuan', acAndAttackMod: -4, hideMod: -12, bipedCarryMult: 8.0, quadCarryMult: 12.0 },
  Colossal: { size: 'Colossal', acAndAttackMod: -8, hideMod: -16, bipedCarryMult: 16.0, quadCarryMult: 24.0 }
};

export const BASE_CARRYING_CAPACITY_LIGHT: Record<number, number> = {
  1: 3, 2: 6, 3: 10, 4: 13, 5: 16, 6: 20, 7: 23, 8: 26, 9: 30, 10: 33,
  11: 38, 12: 43, 13: 50, 14: 58, 15: 66, 16: 76, 17: 86, 18: 100, 19: 116, 20: 133,
  21: 153, 22: 173, 23: 200, 24: 233, 25: 266, 26: 300, 27: 346, 28: 400, 29: 466
};

export function getBaseLightCapacity(str: number): number {
  if (str <= 0) return 0;
  if (str in BASE_CARRYING_CAPACITY_LIGHT) {
    return BASE_CARRYING_CAPACITY_LIGHT[str];
  }
  // Formula for STR >= 30
  const remainder = str % 10;
  const baseStr = 20 + remainder;
  const baseVal = BASE_CARRYING_CAPACITY_LIGHT[baseStr] || 133;
  const multiplier = Math.pow(4, Math.floor((str - baseStr) / 10));
  return Math.floor(baseVal * multiplier);
}

export interface CarryingCapacity {
  lightLoad: number;
  mediumLoadMin: number;
  mediumLoadMax: number;
  heavyLoadMin: number;
  heavyLoadMax: number;
  liftOverHead: number;
  liftOffGround: number;
  pushOrDrag: number;
}

export function calculateCarryingCapacity(
  strScore: number,
  size: string,
  isQuadruped: boolean = true
): CarryingCapacity {
  const baseLight = getBaseLightCapacity(strScore);
  const sizeObj = COMPANION_SIZE_MODIFIERS[size] || COMPANION_SIZE_MODIFIERS['Medium'];
  const mult = isQuadruped ? sizeObj.quadCarryMult : sizeObj.bipedCarryMult;

  const lightLoad = Math.floor(baseLight * mult);
  const heavyLoadMax = Math.floor(baseLight * 3 * mult);
  const mediumLoadMin = lightLoad + 1;
  const mediumLoadMax = Math.floor(baseLight * 2 * mult);
  const heavyLoadMin = mediumLoadMax + 1;

  return {
    lightLoad,
    mediumLoadMin,
    mediumLoadMax,
    heavyLoadMin,
    heavyLoadMax,
    liftOverHead: heavyLoadMax,
    liftOffGround: heavyLoadMax * 2,
    pushOrDrag: heavyLoadMax * 5
  };
}

export interface CompanionBonusTier {
  effectiveLevel: number;
  bonusHD: number;
  bonusNatArmor: number;
  strDexAdjust: number;
  bonusTricks: number;
  specialAbilities: string[];
}

export function getAnimalCompanionBonus(effectiveDruidLevel: number, minLevelReq: number = 1): CompanionBonusTier {
  const adjustedLevel = effectiveDruidLevel - minLevelReq + 1;

  if (adjustedLevel < 1) {
    return {
      effectiveLevel: adjustedLevel,
      bonusHD: 0,
      bonusNatArmor: 0,
      strDexAdjust: 0,
      bonusTricks: 0,
      specialAbilities: []
    };
  }

  let bonusHD = 0;
  let bonusNatArmor = 0;
  let strDexAdjust = 0;
  let bonusTricks = 1;
  const abilities: string[] = ['Link', 'Share Spells'];

  if (adjustedLevel >= 3) {
    bonusHD = 2;
    bonusNatArmor = 2;
    strDexAdjust = 1;
    bonusTricks = 2;
    abilities.push('Evasion');
  }
  if (adjustedLevel >= 6) {
    bonusHD = 4;
    bonusNatArmor = 4;
    strDexAdjust = 2;
    bonusTricks = 3;
    abilities.push('Devotion');
  }
  if (adjustedLevel >= 9) {
    bonusHD = 6;
    bonusNatArmor = 6;
    strDexAdjust = 3;
    bonusTricks = 4;
    abilities.push('Multiattack');
  }
  if (adjustedLevel >= 12) {
    bonusHD = 8;
    bonusNatArmor = 8;
    strDexAdjust = 4;
    bonusTricks = 5;
  }
  if (adjustedLevel >= 15) {
    bonusHD = 10;
    bonusNatArmor = 10;
    strDexAdjust = 5;
    bonusTricks = 6;
    abilities.push('Improved Evasion');
  }
  if (adjustedLevel >= 18) {
    bonusHD = 12;
    bonusNatArmor = 12;
    strDexAdjust = 6;
    bonusTricks = 7;
  }

  return {
    effectiveLevel: adjustedLevel,
    bonusHD,
    bonusNatArmor,
    strDexAdjust,
    bonusTricks,
    specialAbilities: abilities
  };
}

export function getEffectiveDruidLevel(
  character: CharacterState,
  hasNaturalBondToggle?: boolean,
  classesData?: ClassData[]
): number {
  const progression = character.levelProgression || [];
  const charLvl = progression.length || 1;

  let druidLevels = 0;
  let rangerLevels = 0;
  let beastmasterLevels = 0;
  let otherLevels = 0;

  for (const p of progression) {
    if (!p.primaryClass) continue;
    const cls = p.primaryClass.toLowerCase().replace(/[\s_-]+/g, '');
    const clsObj = classesData?.find(
      c => (c.id && c.id.toLowerCase().replace(/[\s_-]+/g, '') === cls) ||
           c.name.toLowerCase().replace(/[\s_-]+/g, '') === cls
    );

    if (cls === 'druid') {
      druidLevels++;
    } else if (cls === 'ranger') {
      rangerLevels++;
    } else if (cls === 'beastmaster') {
      beastmasterLevels++;
    } else if (
      clsObj?.features?.includes('animal_companion') ||
      cls.includes('lionoftalisid') ||
      cls.includes('wavekeeper') ||
      cls.includes('wildrunner')
    ) {
      otherLevels++;
    }
  }

  let effective = druidLevels;

  if (rangerLevels >= 4) {
    effective += Math.floor(rangerLevels / 2);
  }

  if (beastmasterLevels >= 1) {
    effective += beastmasterLevels + 3;
  }

  effective += otherLevels;

  // Natural Bond feat (+3 bonus)
  const hasNaturalBondInFeats = (character.selectedFeatEntities || []).some(
    f => f.featId === 'natural_bond' || f.featId.includes('natural_bond')
  ) || ((character as any).selectedFeats || []).some(
    (f: string) => f.toLowerCase().includes('natural bond')
  );
  if (hasNaturalBondInFeats || hasNaturalBondToggle) {
    effective += 3;
  }

  // If total effective druid level is 0 but character has animal_companion feature (or companion enabled), default to min 1
  if (effective === 0 && charLvl > 0 && hasClassFeature(character, 'animal_companion', classesData)) {
    effective = 1;
  }

  // Cap effective level at character total Hit Dice
  return Math.min(effective, charLvl);
}

export interface AnimalCompanionComputedStats {
  name: string;
  speciesName: string;
  minLevelReq: number;
  size: string;
  creatureType: string;
  effectiveDruidLevel: number;
  baseHD: number;
  bonusHD: number;
  totalHD: number;
  hp: number;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  strMod: number;
  dexMod: number;
  conMod: number;
  intMod: number;
  wisMod: number;
  chaMod: number;
  baseNatArmor: number;
  bonusNatArmor: number;
  totalNatArmor: number;
  sizeMod: number;
  totalAc: number;
  touchAc: number;
  flatFootedAc: number;
  speed: {
    land: number;
    fly?: number;
    flyManeuverability?: string;
    swim?: number;
    climb?: number;
    burrow?: number;
  };
  fort: number;
  ref: number;
  will: number;
  bab: number;
  grapple: number;
  meleeAttackBonus: number;
  rangedAttackBonus: number;
  attacks: { name: string; damage: string; attackBonus: number }[];
  specialAbilities: string[];
  feats: string[];
  maxFeatsAllowed: number;
  assignedFeats: string[];
  maxSkillPoints: number;
  assignedSkillRanks: Record<string, number>;
  maxTricksAllowed: number;
  selectedTricks: string[];
  carryingCapacity: CarryingCapacity;
  isQuadruped: boolean;
}

export const STANDARD_COMPANION_TRICKS = [
  'Attack',
  'Attack All Creatures',
  'Come',
  'Defend',
  'Down',
  'Fetch',
  'Guard',
  'Heel',
  'Perform',
  'Seek',
  'Stay',
  'Track',
  'Work'
];

export const STANDARD_COMPANION_SKILLS = [
  'Balance',
  'Climb',
  'Concentration',
  'Hide',
  'Jump',
  'Listen',
  'Move Silently',
  'Spot',
  'Swim',
  'Survival'
];

/**
 * Infers canonical natural attack damage based on attack type and creature size (D&D 3.5e Monster Manual).
 */
export function inferCompanionAttackDamage(attackName: string, size: string = 'Medium'): string {
  const norm = (attackName || '').toLowerCase();
  const s = (size || 'Medium').toLowerCase();

  if (norm.includes('touch') || norm.includes('attach')) {
    return 'attach';
  }

  const isFine = s === 'fine';
  const isDiminutive = s === 'diminutive';
  const isTiny = s === 'tiny';
  const isSmall = s === 'small';
  const isLarge = s === 'large';
  const isHuge = s === 'huge';
  const isGargantuan = s === 'gargantuan';
  const isColossal = s === 'colossal';

  if (norm.includes('claw') || norm.includes('talon') || norm.includes('foreclaw') || norm.includes('rake')) {
    if (isFine || isDiminutive) return '1';
    if (isTiny) return '1d2';
    if (isSmall) return '1d3';
    if (isLarge) return '1d6';
    if (isHuge) return '1d8';
    if (isGargantuan) return '2d6';
    if (isColossal) return '2d8';
    return '1d4'; // Medium
  }

  if (norm.includes('bite')) {
    if (isFine) return '1';
    if (isDiminutive) return '1d2';
    if (isTiny) return '1d3';
    if (isSmall) return '1d4';
    if (isLarge) return '1d8';
    if (isHuge) return '2d6';
    if (isGargantuan) return '2d8';
    if (isColossal) return '4d6';
    return '1d6'; // Medium
  }

  if (norm.includes('gore') || norm.includes('horn')) {
    if (isFine) return '1';
    if (isDiminutive) return '1d2';
    if (isTiny) return '1d3';
    if (isSmall) return '1d4';
    if (isLarge) return '1d8';
    if (isHuge) return '2d6';
    if (isGargantuan) return '2d8';
    if (isColossal) return '3d6';
    return '1d6'; // Medium
  }

  if (norm.includes('slam') || norm.includes('hoof') || norm.includes('hooves') || norm.includes('stamp') || norm.includes('tentacle')) {
    if (isFine) return '1';
    if (isDiminutive) return '1d2';
    if (isTiny) return '1d3';
    if (isSmall) return '1d4';
    if (isLarge) return '1d6';
    if (isHuge) return '2d4';
    if (isGargantuan) return '2d6';
    if (isColossal) return '2d8';
    return '1d4'; // Medium
  }

  // General fallback by size
  if (isFine) return '1';
  if (isDiminutive) return '1d2';
  if (isTiny) return '1d3';
  if (isSmall) return '1d4';
  if (isLarge) return '1d8';
  if (isHuge) return '2d6';
  if (isGargantuan) return '2d8';
  if (isColossal) return '4d6';
  return '1d6'; // Medium
}

export function computeAnimalCompanionStats(
  character: CharacterState,
  companionsData: AnimalCompanionData[],
  state?: AnimalCompanionState,
  classesData?: ClassData[]
): AnimalCompanionComputedStats | null {
  if (!state || !state.hasCompanion) {
    return null;
  }

  const effectiveDruidLevel = getEffectiveDruidLevel(character, state.hasNaturalBondFeat, classesData);
  const selectedId = state.selectedCompanionId || 'wolf';

  let baseData: {
    name: string;
    minLevelReq: number;
    size: string;
    creatureType: string;
    hd: number;
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
    naturalArmor: number;
    speed: { land: number; fly?: number; flyManeuverability?: string; swim?: number; climb?: number; burrow?: number };
    specialAbilities: string[];
    feats: string[];
    attacks: { name: string; damage: string }[];
    isQuadruped: boolean;
  };

  if (selectedId === 'custom' && state.customCompanion) {
    const custom = state.customCompanion;
    baseData = {
      name: custom.name || 'Custom Companion',
      minLevelReq: custom.minLevel ?? 1,
      size: custom.size || 'Medium',
      creatureType: custom.creatureType || 'Animal',
      hd: custom.hd ?? 2,
      str: custom.str ?? 13,
      dex: custom.dex ?? 15,
      con: custom.con ?? 15,
      int: custom.int ?? 2,
      wis: custom.wis ?? 12,
      cha: custom.cha ?? 6,
      naturalArmor: custom.naturalArmor ?? 2,
      speed: (custom.speed && typeof custom.speed === 'object' && custom.speed.land !== undefined)
        ? {
            land: custom.speed.land,
            fly: custom.speed.fly ?? custom.speedFly,
            flyManeuverability: custom.speed.flyManeuverability ?? custom.speedFlyManeuverability,
            swim: custom.speed.swim ?? custom.speedSwim,
            climb: custom.speed.climb ?? custom.speedClimb,
            burrow: custom.speed.burrow ?? custom.speedBurrow
          }
        : {
            land: custom.speedLand ?? 30,
            fly: custom.speedFly,
            flyManeuverability: custom.speedFlyManeuverability,
            swim: custom.speedSwim,
            climb: custom.speedClimb,
            burrow: custom.speedBurrow
          },
      specialAbilities: Array.isArray(custom.specialAbilities)
        ? custom.specialAbilities
        : (typeof custom.specialAbilities === 'string'
            ? custom.specialAbilities.split(/[;,]/).map(s => s.trim()).filter(Boolean)
            : []),
      feats: Array.isArray(custom.feats)
        ? custom.feats
        : (typeof custom.feats === 'string'
            ? custom.feats.split(/[;,]/).map(s => s.trim()).filter(Boolean)
            : []),
      attacks: Array.isArray(custom.attacks) && custom.attacks.length > 0
        ? custom.attacks.map(a => ({ name: a.name, damage: a.damage }))
        : [
            { name: custom.attack1Name || 'Bite', damage: custom.attack1Damage || '1d6' },
            ...(custom.attack2Name ? [{ name: custom.attack2Name, damage: custom.attack2Damage || '1d4' }] : [])
          ],
      isQuadruped: custom.isQuadruped ?? true
    };
  } else {
    const found = companionsData.find(c => c.id === selectedId) || companionsData[0] || {
      id: 'wolf',
      name: 'Wolf',
      minLevel: 1,
      size: 'Medium',
      creatureType: 'Animal',
      hd: 2,
      str: 13,
      dex: 15,
      con: 15,
      int: 2,
      wis: 12,
      cha: 6,
      naturalArmor: 2,
      speed: { land: 50 },
      attacks: [{ name: 'Bite', damage: '1d6' }],
      specialAbilities: [],
      feats: []
    };

    baseData = {
      name: found.name,
      minLevelReq: found.minLevel || 1,
      size: found.size || 'Medium',
      creatureType: found.creatureType || 'Animal',
      hd: found.hd || 1,
      str: found.str,
      dex: found.dex,
      con: found.con,
      int: found.int,
      wis: found.wis,
      cha: found.cha,
      naturalArmor: found.naturalArmor || 0,
      speed: found.speed || { land: 30 },
      specialAbilities: found.specialAbilities || [],
      feats: found.feats || [],
      attacks: found.attacks || [],
      isQuadruped: found.isQuadruped ?? (found.size !== 'Tiny' && found.size !== 'Small')
    };
  }

  const bonus = getAnimalCompanionBonus(effectiveDruidLevel, baseData.minLevelReq);

  const baseHD = baseData.hd;
  const bonusHD = bonus.bonusHD;
  const totalHD = baseHD + bonusHD;

  // Ability scores with Str/Dex adjustment
  const finalStr = baseData.str + bonus.strDexAdjust;
  const finalDex = baseData.dex + bonus.strDexAdjust;
  const finalCon = baseData.con;
  const finalInt = baseData.int;
  const finalWis = baseData.wis;
  const finalCha = baseData.cha;

  const strMod = getAbilityMod(finalStr);
  const dexMod = getAbilityMod(finalDex);
  const conMod = getAbilityMod(finalCon);
  const intMod = getAbilityMod(finalInt);
  const wisMod = getAbilityMod(finalWis);
  const chaMod = getAbilityMod(finalCha);

  // Total HP calculation
  // d8 average = 4.5. First HD = 8 + conMod if totalHD >= 1.
  let hp = 0;
  if (state.customHp && state.customHp > 0) {
    hp = state.customHp;
  } else {
    hp = Math.max(1, 8 + Math.floor((totalHD - 1) * 4.5) + totalHD * conMod);
  }

  // Size Modifier
  const sizeObj = COMPANION_SIZE_MODIFIERS[baseData.size] || COMPANION_SIZE_MODIFIERS['Medium'];
  const sizeMod = sizeObj.acAndAttackMod;

  // Armor Class
  const totalNatArmor = baseData.naturalArmor + bonus.bonusNatArmor;
  const totalAc = 10 + dexMod + sizeMod + totalNatArmor;
  const touchAc = 10 + dexMod + sizeMod;
  const flatFootedAc = 10 + sizeMod + totalNatArmor;

  // BAB (Animals: 3/4 BAB)
  const bab = Math.floor(totalHD * 0.75);

  // Saving Throws: Animals (Good Fort, Good Ref, Poor Will)
  const goodSave = 2 + Math.floor(totalHD / 2);
  const poorSave = Math.floor(totalHD / 3);

  const fort = goodSave + conMod;
  const ref = goodSave + dexMod;
  const will = poorSave + wisMod;

  // Grapple: BAB + StrMod + GrappleSizeMod (Fine -16, Dim -12, Tiny -8, Small -4, Med 0, Large +4, Huge +8, Garg +12, Col +16)
  const grappleSizeMod = -sizeObj.hideMod; // In 3.5e grapple size mod is opposite of hide mod
  const grapple = bab + strMod + grappleSizeMod;

  // Attack bonuses
  const hasFinesse = baseData.feats.some(f => f.toLowerCase().includes('weapon finesse')) || baseData.size === 'Tiny' || baseData.size === 'Diminutive' || baseData.size === 'Fine';
  const meleeAttackBonus = bab + (hasFinesse ? dexMod : strMod) + sizeMod;
  const rangedAttackBonus = bab + dexMod + sizeMod;

  const attacks = baseData.attacks.map(atk => {
    let cleanName = (atk.name || '').trim();
    cleanName = cleanName.replace(/[;:]+$/, '').trim();
    cleanName = cleanName.replace(/[\+\-]\d+[\+\-\d]*$/, '').trim();
    cleanName = cleanName.replace(/[;:]+$/, '').trim();

    let damage = (atk.damage || '').trim();
    if (!damage) {
      damage = inferCompanionAttackDamage(cleanName, baseData.size);
    }

    return {
      name: cleanName,
      damage,
      attackBonus: meleeAttackBonus
    };
  });

  // Feat allowance: 1 + floor((totalHD - 1) / 3)
  const maxFeatsAllowed = 1 + Math.floor((totalHD - 1) / 3);

  // Skill points allowance: (2 + intMod) * (totalHD + 3), minimum 1 per HD
  const maxSkillPoints = Math.max(totalHD, (2 + Math.max(-1, intMod)) * (totalHD + 3));

  // Max tricks: 3 base + bonusTricks
  const maxTricksAllowed = 3 + bonus.bonusTricks;

  // Carrying Capacity
  const carryingCapacity = calculateCarryingCapacity(finalStr, baseData.size, baseData.isQuadruped);

  const name = state.overrideName ? `${state.overrideName} (${baseData.name})` : baseData.name;

  const allAbilities = Array.from(new Set([...baseData.specialAbilities, ...bonus.specialAbilities]));

  return {
    name,
    speciesName: baseData.name,
    minLevelReq: baseData.minLevelReq,
    size: baseData.size,
    creatureType: baseData.creatureType,
    effectiveDruidLevel,
    baseHD,
    bonusHD,
    totalHD,
    hp,
    str: finalStr,
    dex: finalDex,
    con: finalCon,
    int: finalInt,
    wis: finalWis,
    cha: finalCha,
    strMod,
    dexMod,
    conMod,
    intMod,
    wisMod,
    chaMod,
    baseNatArmor: baseData.naturalArmor,
    bonusNatArmor: bonus.bonusNatArmor,
    totalNatArmor,
    sizeMod,
    totalAc,
    touchAc,
    flatFootedAc,
    speed: baseData.speed,
    fort,
    ref,
    will,
    bab,
    grapple,
    meleeAttackBonus,
    rangedAttackBonus,
    attacks,
    specialAbilities: allAbilities,
    feats: baseData.feats,
    maxFeatsAllowed,
    assignedFeats: state.assignedFeats || [],
    maxSkillPoints,
    assignedSkillRanks: state.assignedSkillRanks || {},
    maxTricksAllowed,
    selectedTricks: state.selectedTricks || [],
    carryingCapacity,
    isQuadruped: baseData.isQuadruped
  };
}
