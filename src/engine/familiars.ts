import { FamiliarData, CustomFamiliarData, FamiliarState, CharacterState, ClassData } from '../types/character';
import { getAbilityMod } from './stats';
import { calculateBAB, calculateBaseSave, calculateTotalHP } from './classes';
import { hasClassFeature } from './features';

export interface SizeModifier {
  size: string;
  acAndAttackMod: number;
  hideMod: number;
}

export const SIZE_MODIFIERS: Record<string, SizeModifier> = {
  Fine: { size: 'Fine', acAndAttackMod: 8, hideMod: 16 },
  Diminutive: { size: 'Diminutive', acAndAttackMod: 4, hideMod: 12 },
  Tiny: { size: 'Tiny', acAndAttackMod: 2, hideMod: 8 },
  Small: { size: 'Small', acAndAttackMod: 1, hideMod: 4 },
  Medium: { size: 'Medium', acAndAttackMod: 0, hideMod: 0 },
  Large: { size: 'Large', acAndAttackMod: -1, hideMod: -4 },
  Huge: { size: 'Huge', acAndAttackMod: -2, hideMod: -8 },
  Gargantuan: { size: 'Gargantuan', acAndAttackMod: -4, hideMod: -12 },
  Colossal: { size: 'Colossal', acAndAttackMod: -8, hideMod: -16 }
};

export interface UnlockedFamiliarAbility {
  minLevel: number;
  name: string;
  description: string;
  unlocked: boolean;
}

export function getMasterFamiliarLevel(character: CharacterState, classesData?: ClassData[]): number {
  const progression = character.levelProgression || [];
  if (progression.length === 0) return 1;

  // Arcane caster / familiar classes in 3.5e
  const familiarClasses = new Set([
    'wizard', 'sorcerer', 'hexblade', 'duskblade', 'wu_jen',
    'arcane_trickster', 'archmage', 'eldritch_knight'
  ]);

  let count = 0;
  for (const item of progression) {
    if (item.primaryClass) {
      const clsLower = item.primaryClass.toLowerCase().replace(/[\s-]+/g, '_');
      const clsObj = classesData?.find(
        c => (c.id && c.id.toLowerCase().replace(/[\s-]+/g, '_') === clsLower) ||
             c.name.toLowerCase().replace(/[\s-]+/g, '_') === clsLower
      );
      if (clsObj?.features?.includes('familiar') || familiarClasses.has(clsLower)) {
        count++;
      }
    }
  }

  // If character has the familiar class feature or active familiar
  if (count === 0 && hasClassFeature(character, 'familiar', classesData)) {
    return progression.filter(l => l.primaryClass).length || 1;
  }

  // If no specific caster class found or count is 0, fall back to total character level
  return count > 0 ? count : progression.filter(l => l.primaryClass).length || 1;
}

export function calculateFamiliarNaturalArmorBonus(masterLevel: number): number {
  if (masterLevel < 1) return 1;
  return Math.floor((masterLevel + 1) / 2);
}

export function calculateFamiliarIntScore(baseInt: number, masterLevel: number): number {
  const scaledInt = 5 + Math.ceil(masterLevel / 2); // lvl 1-2: 6, 3-4: 7, 5-6: 8, 7-8: 9, 9-10: 10...
  return Math.max(baseInt, scaledInt);
}

export function calculateFamiliarHP(character: CharacterState, classesData: ClassData[], customHpOverride?: number): number {
  if (customHpOverride && customHpOverride > 0) {
    return customHpOverride;
  }
  // Master max HP
  const progression = character.levelProgression || [];
  const conScore = character.baseStats.con || 10;
  const conMod = getAbilityMod(conScore);
  const masterMaxHP = calculateTotalHP(progression, classesData, conMod);
  return Math.max(1, Math.floor(masterMaxHP / 2));
}

export function getFamiliarAbilitiesTimeline(masterLevel: number): UnlockedFamiliarAbility[] {
  const abilities = [
    {
      minLevel: 1,
      name: 'Alertness',
      description: 'Master gains the Alertness feat (+2 Listen, +2 Spot) while familiar is within arm\'s reach.'
    },
    {
      minLevel: 1,
      name: 'Improved Evasion',
      description: 'Takes no damage on a successful Reflex save and only half damage on a failed save.'
    },
    {
      minLevel: 1,
      name: 'Share Spells',
      description: 'Master may have any spell he casts on himself also affect his familiar (within 5 ft).'
    },
    {
      minLevel: 1,
      name: 'Empathic Link',
      description: 'Master has empathic link up to 1 mile. Communicates emotions and senses.'
    },
    {
      minLevel: 3,
      name: 'Deliver Touch Spells',
      description: 'Familiar can deliver touch spells cast by the master.'
    },
    {
      minLevel: 5,
      name: 'Speak with Master',
      description: 'Familiar and master can communicate verbally in their own secret language.'
    },
    {
      minLevel: 7,
      name: 'Speak with Animals of Its Kind',
      description: 'Familiar can communicate with animals of approximately its same kind.'
    },
    {
      minLevel: 9,
      name: 'Spell Resistance',
      description: `Familiar gains Spell Resistance equal to Master Level + 5 (SR ${masterLevel >= 9 ? masterLevel + 5 : 'N/A'}).`
    },
    {
      minLevel: 11,
      name: 'Scry on Familiar',
      description: 'Master may scry on familiar once per day as per the scrying spell.'
    }
  ];

  return abilities.map(a => ({
    ...a,
    unlocked: masterLevel >= a.minLevel
  }));
}

export interface FamiliarComputedStats {
  name: string;
  size: string;
  creatureType: string;
  masterLevel: number;
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
  scaledNatArmor: number;
  totalNatArmor: number;
  sizeMod: number;
  totalAc: number;
  touchAc: number;
  flatFootedAc: number;
  dr: string;
  sr: number;
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
  meleeAttackBonus: number;
  rangedAttackBonus: number;
  attacks: { name: string; damage: string; attackBonus: number }[];
  masterBonus: string;
  specialAbilities: string[];
  feats: string[];
  unlockedAbilities: UnlockedFamiliarAbility[];
  skillBonus: Record<string, number>;
}

export function computeFamiliarStats(
  character: CharacterState,
  classesData: ClassData[],
  familiarsData: FamiliarData[],
  familiarState?: FamiliarState
): FamiliarComputedStats | null {
  if (!familiarState || !familiarState.hasFamiliar) {
    return null;
  }

  const masterLevel = getMasterFamiliarLevel(character, classesData);
  const masterBAB = calculateBAB(character.levelProgression, classesData);
  const masterBaseFort = calculateBaseSave('fort', character.levelProgression, classesData);
  const masterBaseRef = calculateBaseSave('ref', character.levelProgression, classesData);
  const masterBaseWill = calculateBaseSave('will', character.levelProgression, classesData);

  const selectedId = familiarState.selectedFamiliarId || 'bat';
  const custom = familiarState.customFamiliar;

  let baseData: {
    name: string;
    size: string;
    creatureType: string;
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
    naturalArmor: number;
    dr: string;
    sr: number;
    speed: { land: number; fly?: number; flyManeuverability?: string; swim?: number; climb?: number; burrow?: number };
    baseFort: number;
    baseRef: number;
    baseWill: number;
    masterBonus: string;
    specialAbilities: string[];
    feats: string[];
    attacks: { name: string; damage: string }[];
    skillBonus: Record<string, number>;
  };

  if (selectedId === 'custom' && custom) {
    baseData = {
      name: custom.name || 'Custom Familiar',
      size: custom.size || 'Tiny',
      creatureType: custom.creatureType || 'Magical Beast',
      str: custom.str ?? 3,
      dex: custom.dex ?? 15,
      con: custom.con ?? 10,
      int: custom.int ?? 2,
      wis: custom.wis ?? 12,
      cha: custom.cha ?? 6,
      naturalArmor: custom.naturalArmor ?? 0,
      dr: custom.dr || 'None',
      sr: custom.sr ?? 0,
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
      baseFort: custom.baseFort ?? 2,
      baseRef: custom.baseRef ?? 2,
      baseWill: custom.baseWill ?? 0,
      masterBonus: custom.masterBonus || 'Custom bonus to master',
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
            { name: custom.attack1Name || 'Bite', damage: custom.attack1Damage || '1d3-4' },
            ...(custom.attack2Name ? [{ name: custom.attack2Name, damage: custom.attack2Damage || '1d2' }] : [])
          ],
      skillBonus: custom.skillBonus || {}
    };
  } else {
    const found = familiarsData.find(f => f.id === selectedId) || familiarsData[0];
    if (!found) return null;
    baseData = {
      name: found.name,
      size: found.size,
      creatureType: found.creatureType,
      str: found.str,
      dex: found.dex,
      con: found.con,
      int: found.int,
      wis: found.wis,
      cha: found.cha,
      naturalArmor: found.naturalArmor,
      dr: found.dr,
      sr: found.sr,
      speed: found.speed,
      baseFort: found.baseFort,
      baseRef: found.baseRef,
      baseWill: found.baseWill,
      masterBonus: found.masterBonus,
      specialAbilities: found.specialAbilities,
      feats: found.feats,
      attacks: found.attacks,
      skillBonus: found.skillBonus || {}
    };
  }

  const name = familiarState.overrideName ? `${familiarState.overrideName} (${baseData.name})` : baseData.name;
  const hp = calculateFamiliarHP(character, classesData, familiarState.customHp);
  
  const intScore = calculateFamiliarIntScore(baseData.int, masterLevel);
  const scaledNatArmor = calculateFamiliarNaturalArmorBonus(masterLevel);
  const totalNatArmor = baseData.naturalArmor + scaledNatArmor;

  const strMod = getAbilityMod(baseData.str);
  const dexMod = getAbilityMod(baseData.dex);
  const conMod = getAbilityMod(baseData.con);
  const intMod = getAbilityMod(intScore);
  const wisMod = getAbilityMod(baseData.wis);
  const chaMod = getAbilityMod(baseData.cha);

  const sizeInfo = SIZE_MODIFIERS[baseData.size] || SIZE_MODIFIERS['Tiny'];
  const sizeMod = sizeInfo.acAndAttackMod;

  const totalAc = 10 + dexMod + sizeMod + totalNatArmor;
  const touchAc = 10 + dexMod + sizeMod;
  const flatFootedAc = 10 + sizeMod + totalNatArmor;

  // Saves: familiar uses its own base save or master's base save (whichever is higher) + ability mod
  const fort = Math.max(baseData.baseFort, masterBaseFort) + conMod;
  const ref = Math.max(baseData.baseRef, masterBaseRef) + dexMod;
  const will = Math.max(baseData.baseWill, masterBaseWill) + wisMod;

  // Attack bonuses
  const hasFinesse = baseData.feats.some(f => f.toLowerCase().includes('weapon finesse')) || baseData.size === 'Tiny' || baseData.size === 'Diminutive' || baseData.size === 'Fine';
  const meleeAttackBonus = masterBAB + (hasFinesse ? dexMod : strMod) + sizeMod;
  const rangedAttackBonus = masterBAB + dexMod + sizeMod;

  const computedAttacks = baseData.attacks.map(atk => ({
    name: atk.name,
    damage: atk.damage,
    attackBonus: meleeAttackBonus
  }));

  const unlockedAbilities = getFamiliarAbilitiesTimeline(masterLevel);

  // SR check
  const sr = masterLevel >= 9 ? Math.max(baseData.sr, masterLevel + 5) : baseData.sr;

  return {
    name,
    size: baseData.size,
    creatureType: baseData.creatureType,
    masterLevel,
    hp,
    str: baseData.str,
    dex: baseData.dex,
    con: baseData.con,
    int: intScore,
    wis: baseData.wis,
    cha: baseData.cha,
    strMod,
    dexMod,
    conMod,
    intMod,
    wisMod,
    chaMod,
    baseNatArmor: baseData.naturalArmor,
    scaledNatArmor,
    totalNatArmor,
    sizeMod,
    totalAc,
    touchAc,
    flatFootedAc,
    dr: baseData.dr,
    sr,
    speed: baseData.speed,
    fort,
    ref,
    will,
    bab: masterBAB,
    meleeAttackBonus,
    rangedAttackBonus,
    attacks: computedAttacks,
    masterBonus: baseData.masterBonus,
    specialAbilities: baseData.specialAbilities,
    feats: baseData.feats,
    unlockedAbilities,
    skillBonus: baseData.skillBonus
  };
}
