import { ClassData, LevelProgression, StatType } from '../types/character';

export interface SpellcastingClassInfo {
  name: string;
  keyAbility: StatType;
  type: 'Arcane' | 'Divine' | 'Psionic';
  method: 'Prepared' | 'Spontaneous' | 'Manifesting';
  maxSpellLevel: number;
}

export const SPELLCASTING_CLASSES: Record<string, SpellcastingClassInfo> = {
  bard: { name: 'Bard', keyAbility: 'cha', type: 'Arcane', method: 'Spontaneous', maxSpellLevel: 6 },
  wizard: { name: 'Wizard', keyAbility: 'int', type: 'Arcane', method: 'Prepared', maxSpellLevel: 9 },
  sorcerer: { name: 'Sorcerer', keyAbility: 'cha', type: 'Arcane', method: 'Spontaneous', maxSpellLevel: 9 },
  cleric: { name: 'Cleric', keyAbility: 'wis', type: 'Divine', method: 'Prepared', maxSpellLevel: 9 },
  druid: { name: 'Druid', keyAbility: 'wis', type: 'Divine', method: 'Prepared', maxSpellLevel: 9 },
  paladin: { name: 'Paladin', keyAbility: 'wis', type: 'Divine', method: 'Prepared', maxSpellLevel: 4 },
  ranger: { name: 'Ranger', keyAbility: 'wis', type: 'Divine', method: 'Prepared', maxSpellLevel: 4 },
  beguiler: { name: 'Beguiler', keyAbility: 'int', type: 'Arcane', method: 'Spontaneous', maxSpellLevel: 9 },
  duskblade: { name: 'Duskblade', keyAbility: 'int', type: 'Arcane', method: 'Spontaneous', maxSpellLevel: 5 },
  warmage: { name: 'Warmage', keyAbility: 'cha', type: 'Arcane', method: 'Spontaneous', maxSpellLevel: 9 },
  favored_soul: { name: 'Favored Soul', keyAbility: 'cha', type: 'Divine', method: 'Spontaneous', maxSpellLevel: 9 },
  archivist: { name: 'Archivist', keyAbility: 'int', type: 'Divine', method: 'Prepared', maxSpellLevel: 9 },
  healer: { name: 'Healer', keyAbility: 'wis', type: 'Divine', method: 'Prepared', maxSpellLevel: 9 },
  hexblade: { name: 'Hexblade', keyAbility: 'cha', type: 'Arcane', method: 'Spontaneous', maxSpellLevel: 4 },
  spellthief: { name: 'Spellthief', keyAbility: 'cha', type: 'Arcane', method: 'Spontaneous', maxSpellLevel: 4 },
  shugenja: { name: 'Shugenja', keyAbility: 'cha', type: 'Divine', method: 'Spontaneous', maxSpellLevel: 9 },
  wu_jen: { name: 'Wu Jen', keyAbility: 'int', type: 'Arcane', method: 'Prepared', maxSpellLevel: 9 },
  psion: { name: 'Psion', keyAbility: 'int', type: 'Psionic', method: 'Manifesting', maxSpellLevel: 9 },
  wilder: { name: 'Wilder', keyAbility: 'cha', type: 'Psionic', method: 'Manifesting', maxSpellLevel: 9 },
  psychic_warrior: { name: 'Psychic Warrior', keyAbility: 'wis', type: 'Psionic', method: 'Manifesting', maxSpellLevel: 6 },
  ardent: { name: 'Ardent', keyAbility: 'wis', type: 'Psionic', method: 'Manifesting', maxSpellLevel: 9 },
  divine_mind: { name: 'Divine Mind', keyAbility: 'wis', type: 'Psionic', method: 'Manifesting', maxSpellLevel: 6 },
  lurk: { name: 'Lurk', keyAbility: 'int', type: 'Psionic', method: 'Manifesting', maxSpellLevel: 6 }
};

// Calculate bonus spells per day from high ability score (D&D 3.5e rule)
export function getBonusSpells(abilityMod: number, spellLevel: number): number {
  if (spellLevel <= 0 || abilityMod < spellLevel) return 0;
  return Math.floor((abilityMod - spellLevel) / 4) + 1;
}

// Base Spells per Day tables for standard class progressions (by class level 1..20)
// Bard Spells per Day (levels 0 through 6)
const BARD_SPELLS_PER_DAY: Record<number, number[]> = {
  1:  [2, 0],
  2:  [3, 1],
  3:  [3, 2],
  4:  [3, 2, 0],
  5:  [3, 3, 1],
  6:  [3, 3, 2],
  7:  [3, 3, 2, 0],
  8:  [3, 3, 3, 1],
  9:  [3, 3, 3, 2],
  10: [3, 3, 3, 2, 0],
  11: [3, 3, 3, 3, 1],
  12: [3, 3, 3, 3, 2],
  13: [3, 3, 3, 3, 2, 0],
  14: [4, 3, 3, 3, 3, 1],
  15: [4, 4, 3, 3, 3, 2],
  16: [4, 4, 4, 3, 3, 2, 0],
  17: [4, 4, 4, 4, 3, 3, 1],
  18: [4, 4, 4, 4, 4, 3, 2],
  19: [4, 4, 4, 4, 4, 4, 3],
  20: [4, 4, 4, 4, 4, 4, 4]
};

// Wizard / Cleric / Druid Spells per Day (levels 0 through 9)
const PREPARED_FULL_SPELLS_PER_DAY: Record<number, number[]> = {
  1:  [3, 1],
  2:  [4, 2],
  3:  [4, 2, 1],
  4:  [4, 3, 2],
  5:  [4, 3, 2, 1],
  6:  [4, 3, 3, 2],
  7:  [4, 4, 3, 2, 1],
  8:  [4, 4, 3, 3, 2],
  9:  [4, 4, 4, 3, 2, 1],
  10: [4, 4, 4, 3, 3, 2],
  11: [4, 4, 4, 4, 3, 2, 1],
  12: [4, 4, 4, 4, 3, 3, 2],
  13: [4, 4, 4, 4, 4, 3, 2, 1],
  14: [4, 4, 4, 4, 4, 3, 3, 2],
  15: [4, 4, 4, 4, 4, 4, 3, 2, 1],
  16: [4, 4, 4, 4, 4, 4, 3, 3, 2],
  17: [4, 4, 4, 4, 4, 4, 4, 3, 2, 1],
  18: [4, 4, 4, 4, 4, 4, 4, 3, 3, 2],
  19: [4, 4, 4, 4, 4, 4, 4, 4, 3, 3],
  20: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4]
};

// Sorcerer Spells per Day (levels 0 through 9)
const SORCERER_SPELLS_PER_DAY: Record<number, number[]> = {
  1:  [5, 3],
  2:  [6, 4],
  3:  [6, 5],
  4:  [6, 6, 3],
  5:  [6, 6, 4],
  6:  [6, 6, 5, 3],
  7:  [6, 6, 6, 4],
  8:  [6, 6, 6, 5, 3],
  9:  [6, 6, 6, 6, 4],
  10: [6, 6, 6, 6, 5, 3],
  11: [6, 6, 6, 6, 6, 4],
  12: [6, 6, 6, 6, 6, 5, 3],
  13: [6, 6, 6, 6, 6, 6, 4],
  14: [6, 6, 6, 6, 6, 6, 5, 3],
  15: [6, 6, 6, 6, 6, 6, 6, 4],
  16: [6, 6, 6, 6, 6, 6, 6, 5, 3],
  17: [6, 6, 6, 6, 6, 6, 6, 6, 4],
  18: [6, 6, 6, 6, 6, 6, 6, 6, 5, 3],
  19: [6, 6, 6, 6, 6, 6, 6, 6, 6, 4],
  20: [6, 6, 6, 6, 6, 6, 6, 6, 6, 6]
};

// Paladin / Ranger Spells per Day (levels 1 through 4, starting at class level 4)
const HALF_CASTER_SPELLS_PER_DAY: Record<number, number[]> = {
  1:  [],
  2:  [],
  3:  [],
  4:  [0],
  5:  [0],
  6:  [1],
  7:  [1],
  8:  [1, 0],
  9:  [1, 0],
  10: [1, 1],
  11: [1, 1, 0],
  12: [1, 1, 1],
  13: [1, 1, 1],
  14: [2, 1, 1, 0],
  15: [2, 1, 1, 1],
  16: [2, 2, 1, 1],
  17: [2, 2, 2, 1],
  18: [3, 2, 2, 1],
  19: [3, 3, 3, 2],
  20: [3, 3, 3, 3]
};

export interface ClassSpellSlots {
  className: string;
  classLevel: number;
  info: SpellcastingClassInfo;
  slots: {
    spellLevel: number;
    base: number;
    bonus: number;
    total: number;
    canCast: boolean;
    saveDc: number;
  }[];
}

export function getSpellSlotsForClass(
  className: string,
  classLevel: number,
  abilityMod: number
): ClassSpellSlots | null {
  const key = className.toLowerCase().replace(/[\s\/-]+/g, '_');
  const info = SPELLCASTING_CLASSES[key] || {
    name: className,
    keyAbility: 'int' as StatType,
    type: 'Arcane' as const,
    method: 'Prepared' as const,
    maxSpellLevel: 9
  };

  const lvl = Math.min(20, Math.max(1, classLevel));
  let baseArray: number[] = [];

  if (key === 'bard') {
    baseArray = BARD_SPELLS_PER_DAY[lvl] || [];
  } else if (key === 'sorcerer' || key === 'warmage' || key === 'beguiler') {
    baseArray = SORCERER_SPELLS_PER_DAY[lvl] || [];
  } else if (key === 'paladin' || key === 'ranger' || key === 'hexblade' || key === 'spellthief') {
    baseArray = HALF_CASTER_SPELLS_PER_DAY[lvl] || [];
  } else {
    baseArray = PREPARED_FULL_SPELLS_PER_DAY[lvl] || [];
  }

  const slots = [];
  const isHalfCaster = key === 'paladin' || key === 'ranger' || key === 'hexblade' || key === 'spellthief';
  const startLevel = isHalfCaster ? 1 : 0;

  for (let i = 0; i < baseArray.length; i++) {
    const spellLvl = startLevel + i;
    const base = baseArray[i];
    const bonus = getBonusSpells(abilityMod, spellLvl);
    const total = base + bonus;
    const canCast = total > 0;
    const saveDc = 10 + spellLvl + abilityMod;

    slots.push({
      spellLevel: spellLvl,
      base,
      bonus,
      total,
      canCast,
      saveDc
    });
  }

  return {
    className: info.name,
    classLevel: lvl,
    info,
    slots
  };
}

export function isSpellcastingClassName(className: string, classData?: ClassData): boolean {
  if (!className) return false;
  const key = className.toLowerCase().replace(/[\s\/-]+/g, '_');
  if (SPELLCASTING_CLASSES[key]) return true;
  if (classData && (classData.bonusCaster || classData.name.toLowerCase().includes('caster') || classData.name.toLowerCase().includes('mage') || classData.name.toLowerCase().includes('spell'))) {
    return true;
  }
  return false;
}
