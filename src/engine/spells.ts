import {
  ClassData,
  LevelProgression,
  StatType,
  PreparedSpellSlot,
  CharacterState,
  SpellData,
  DomainData
} from '../types/character';

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

/**
 * Calculates individual Spell Save DC for a given spell level and ability score modifier.
 * D&D 3.5e Core Rule: DC = 10 + Spell Level + Key Ability Modifier
 */
export function calculateSpellSaveDc(spellLevel: number, keyAbilityMod: number): number {
  return 10 + spellLevel + keyAbilityMod;
}

/**
 * Checks if a class is a prepared caster (prepares daily spell slots).
 */
export function isPreparedCaster(className: string): boolean {
  if (!className) return false;
  const key = className.toLowerCase().replace(/[\s\/-]+/g, '_');
  const info = SPELLCASTING_CLASSES[key];
  if (info) {
    return info.method === 'Prepared';
  }
  const lower = className.toLowerCase();
  return (
    lower.includes('wizard') ||
    lower.includes('cleric') ||
    lower.includes('druid') ||
    lower.includes('paladin') ||
    lower.includes('ranger') ||
    lower.includes('archivist') ||
    lower.includes('healer') ||
    lower.includes('wu jen')
  );
}

export interface PreparedLevelSlotGroup {
  spellLevel: number;
  baseSlots: number;
  bonusSlots: number;
  regularSlots: number;
  domainSlots: number;
  totalSlots: number;
  canCast: boolean;
  saveDc: number;
}

/**
 * Returns the slot structure by spell level for a prepared class.
 * Includes domain slots for Clerics (+1 slot per level 1..9 if they have spell slots at that level).
 */
export function getPreparedSlotsStructure(
  className: string,
  classLevel: number,
  abilityMod: number,
  selectedDomains: string[] = []
): PreparedLevelSlotGroup[] {
  const classSlots = getSpellSlotsForClass(className, classLevel, abilityMod);
  if (!classSlots) return [];

  const key = className.toLowerCase().replace(/[\s\/-]+/g, '_');
  const isCleric = key === 'cleric';

  return classSlots.slots.map(slot => {
    const isLevel1Plus = slot.spellLevel >= 1;
    // Cleric gets +1 domain slot per spell level 1-9 if they can cast spells of that level
    const hasDomainSlot = isCleric && isLevel1Plus && slot.canCast;
    const domainSlotsCount = hasDomainSlot ? 1 : 0;
    const totalSlotsWithDomain = slot.total + domainSlotsCount;

    return {
      spellLevel: slot.spellLevel,
      baseSlots: slot.base,
      bonusSlots: slot.bonus,
      regularSlots: slot.total,
      domainSlots: domainSlotsCount,
      totalSlots: totalSlotsWithDomain,
      canCast: totalSlotsWithDomain > 0,
      saveDc: calculateSpellSaveDc(slot.spellLevel, abilityMod)
    };
  });
}

/**
 * Builds a deterministic slot ID.
 */
export function buildSlotId(
  className: string,
  spellLevel: number,
  slotIndex: number,
  isDomain: boolean = false
): string {
  const cKey = className.toLowerCase().replace(/[\s\/-]+/g, '_');
  return `${cKey}_lvl${spellLevel}_${isDomain ? 'domain_' : 'slot_'}${slotIndex}`;
}

/**
 * Reconciles and synchronizes prepared spell slots for a character.
 * Retains existing prepared spells if the slot remains valid.
 */
export function syncPreparedSlotsForCharacter(
  className: string,
  classLevel: number,
  abilityMod: number,
  selectedDomains: string[] = [],
  currentPreparedSpells: PreparedSpellSlot[] = []
): PreparedSpellSlot[] {
  const structure = getPreparedSlotsStructure(className, classLevel, abilityMod, selectedDomains);
  const existingMap = new Map<string, PreparedSpellSlot>();

  for (const slot of currentPreparedSpells) {
    existingMap.set(slot.id, slot);
  }

  // Preserve prepared slots from other classes
  const cKey = className.toLowerCase().replace(/[\s\/-]+/g, '_');
  const otherClassSlots = currentPreparedSpells.filter(
    s => s.className.toLowerCase().replace(/[\s\/-]+/g, '_') !== cKey
  );

  const syncedForThisClass: PreparedSpellSlot[] = [];

  for (const lvlGroup of structure) {
    if (!lvlGroup.canCast) continue;

    // Regular slots
    for (let idx = 0; idx < lvlGroup.regularSlots; idx++) {
      const slotId = buildSlotId(className, lvlGroup.spellLevel, idx, false);
      const existing = existingMap.get(slotId);
      syncedForThisClass.push({
        id: slotId,
        className,
        spellLevel: lvlGroup.spellLevel,
        slotIndex: idx,
        spellId: existing?.spellId || null,
        spellName: existing?.spellName || undefined,
        isDomain: false,
        isCast: existing?.isCast || false
      });
    }

    // Domain slot (if applicable)
    if (lvlGroup.domainSlots > 0) {
      const domSlotId = buildSlotId(className, lvlGroup.spellLevel, 0, true);
      const existingDom = existingMap.get(domSlotId);
      syncedForThisClass.push({
        id: domSlotId,
        className,
        spellLevel: lvlGroup.spellLevel,
        slotIndex: 0,
        spellId: existingDom?.spellId || null,
        spellName: existingDom?.spellName || undefined,
        isDomain: true,
        isCast: existingDom?.isCast || false
      });
    }
  }

  return [...otherClassSlots, ...syncedForThisClass];
}

/**
 * Assigns a spell to a specific slot ID.
 */
export function assignPreparedSpellSlot(
  preparedSpells: PreparedSpellSlot[] = [],
  slotId: string,
  spell: { id: string; name: string }
): PreparedSpellSlot[] {
  const index = preparedSpells.findIndex(s => s.id === slotId);
  if (index === -1) {
    // If not found, return unchanged
    return preparedSpells;
  }

  const updated = [...preparedSpells];
  updated[index] = {
    ...updated[index],
    spellId: spell.id,
    spellName: spell.name,
    isCast: false
  };
  return updated;
}

/**
 * Clears an assigned spell from a slot ID.
 */
export function clearPreparedSpellSlot(
  preparedSpells: PreparedSpellSlot[] = [],
  slotId: string
): PreparedSpellSlot[] {
  const index = preparedSpells.findIndex(s => s.id === slotId);
  if (index === -1) return preparedSpells;

  const updated = [...preparedSpells];
  updated[index] = {
    ...updated[index],
    spellId: null,
    spellName: undefined,
    isCast: false
  };
  return updated;
}

/**
 * Toggles the in-play expended/cast state of a prepared slot.
 */
export function togglePreparedSpellSlotCast(
  preparedSpells: PreparedSpellSlot[] = [],
  slotId: string
): PreparedSpellSlot[] {
  const index = preparedSpells.findIndex(s => s.id === slotId);
  if (index === -1) return preparedSpells;

  const updated = [...preparedSpells];
  updated[index] = {
    ...updated[index],
    isCast: !updated[index].isCast
  };
  return updated;
}

/**
 * Clears all prepared spells for a class (or all classes if className is omitted).
 */
export function clearAllPreparedSlots(
  preparedSpells: PreparedSpellSlot[] = [],
  className?: string
): PreparedSpellSlot[] {
  const cKey = className ? className.toLowerCase().replace(/[\s\/-]+/g, '_') : null;
  return preparedSpells.map(slot => {
    if (!cKey || slot.className.toLowerCase().replace(/[\s\/-]+/g, '_') === cKey) {
      return {
        ...slot,
        spellId: null,
        spellName: undefined,
        isCast: false
      };
    }
    return slot;
  });
}

/**
 * Resets all cast states (isCast = false) for a class (or all classes), e.g. after a rest.
 */
export function resetAllPreparedSlotsCast(
  preparedSpells: PreparedSpellSlot[] = [],
  className?: string
): PreparedSpellSlot[] {
  const cKey = className ? className.toLowerCase().replace(/[\s\/-]+/g, '_') : null;
  return preparedSpells.map(slot => {
    if (!cKey || slot.className.toLowerCase().replace(/[\s\/-]+/g, '_') === cKey) {
      return {
        ...slot,
        isCast: false
      };
    }
    return slot;
  });
}

/**
 * Adds a spell ID to the character's live spellbook if not already present.
 */
export function addSpellToSpellbook(
  spellbookSpells: string[] = [],
  spellId: string
): string[] {
  if (!spellId) return spellbookSpells;
  if (spellbookSpells.includes(spellId)) return spellbookSpells;
  return [...spellbookSpells, spellId];
}

/**
 * Removes a spell ID from the character's live spellbook.
 */
export function removeSpellFromSpellbook(
  spellbookSpells: string[] = [],
  spellId: string
): string[] {
  return spellbookSpells.filter(id => id !== spellId);
}

/**
 * Returns all 0th level cantrips for Wizard from the core spells database.
 * Used for the quick "Add All Cantrips" button in the Live Spellbook.
 */
export function getStarterWizardCantripIds(spellsData: SpellData[] = []): string[] {
  return spellsData
    .filter(s => s.levels && s.levels['Wizard'] === 0)
    .map(s => s.id);
}

/**
 * Resolves the spell level for a specific class name (case-insensitive, normalized).
 */
export function getSpellLevelForClass(spell: SpellData, className: string): number | undefined {
  if (!spell || !spell.levels || !className) return undefined;
  const target = className.toLowerCase().replace(/[\s\/-]+/g, '_');

  for (const [clsKey, lvl] of Object.entries(spell.levels)) {
    const norm = clsKey.toLowerCase().replace(/[\s\/-]+/g, '_');
    if (norm === target) return lvl;
  }
  return undefined;
}

/**
 * Resolves available spells for daily preparation.
 * For regular slots: returns matching spells of that spell level for the class.
 * If onlySpellbook is true: filters by character.spellbookSpells.
 * For Cleric Domain Slots: returns domain spells corresponding to the character's domains.
 */
export function getAvailableSpellsForPreparation(
  className: string,
  spellLevel: number,
  character: CharacterState,
  spellsData: SpellData[] = [],
  domainsData: DomainData[] = [],
  isDomainSlot: boolean = false,
  onlySpellbook: boolean = false
): SpellData[] {
  const spellbook = new Set(character.spellbookSpells || []);

  // 1. Cleric Domain Slot: Spells from character's selected domains at this level
  if (isDomainSlot) {
    const selectedDomains = (character.selectedDomains || []).map(d => d.toLowerCase().trim());

    // Check domain spells directly from domain objects
    const domainSpellNames = new Set<string>();
    for (const domName of selectedDomains) {
      const domObj = domainsData.find(
        d => d.name.toLowerCase() === domName || d.id.toLowerCase() === domName
      );
      if (domObj && domObj.spells && domObj.spells[spellLevel - 1]) {
        domainSpellNames.add(domObj.spells[spellLevel - 1].toLowerCase().trim());
      }
    }

    const domainMatches = spellsData.filter(spell => {
      // Direct name match from domain spell array
      if (domainSpellNames.has(spell.name.toLowerCase().trim())) return true;
      // Or spell.levels has this domain
      for (const [domKey, domLvl] of Object.entries(spell.levels)) {
        if (selectedDomains.includes(domKey.toLowerCase().trim()) && domLvl === spellLevel) {
          return true;
        }
      }
      return false;
    });

    if (domainMatches.length > 0) {
      return domainMatches;
    }

    // Fallback if domains not yet selected: return all domain spells at this level
    const hasDomainsData = domainsData && domainsData.length > 0;
    const knownDomainNames = hasDomainsData
      ? new Set(domainsData.flatMap(d => [d.name.toLowerCase().trim(), d.id.toLowerCase().trim()]))
      : null;

    return spellsData.filter(spell => {
      for (const [lvlKey, lvlVal] of Object.entries(spell.levels)) {
        if (lvlVal === spellLevel) {
          const kLower = lvlKey.toLowerCase().trim();
          if (knownDomainNames) {
            if (knownDomainNames.has(kLower)) return true;
          } else {
            const nonDomainClasses = [
              'wizard', 'sorcerer', 'cleric', 'druid', 'paladin', 'ranger', 'bard',
              'warmage', 'beguiler', 'dread necromancer', 'duskblade', 'hexblade',
              'favored soul', 'archivist', 'warlock', 'shugenja', 'wu jen', 'healer'
            ];
            if (!nonDomainClasses.includes(kLower)) return true;
          }
        }
      }
      return getSpellLevelForClass(spell, 'Cleric') === spellLevel;
    });
  }

  // 2. Regular slots for any spellcasting class
  return spellsData.filter(spell => {
    const classLvl = getSpellLevelForClass(spell, className);
    if (classLvl !== spellLevel) return false;

    if (onlySpellbook) {
      return spellbook.has(spell.id);
    }

    return true;
  });
}

/**
 * Generates deterministic slot key for tracking active expended spell slots by class and level.
 */
export function getSpellSlotUsageKey(className: string, spellLevel: number): string {
  const cKey = className.toLowerCase().replace(/[\s\/-]+/g, '_');
  return `${cKey}_lvl${spellLevel}`;
}

/**
 * Returns the count of expended spell slots for a given class and spell level.
 */
export function getExpendedSpellSlotsCount(
  expendedMap: Record<string, number> | undefined,
  className: string,
  spellLevel: number
): number {
  if (!expendedMap) return 0;
  const key = getSpellSlotUsageKey(className, spellLevel);
  return Math.max(0, expendedMap[key] || 0);
}

/**
 * Returns the remaining available spell slots for a given class and spell level.
 */
export function getRemainingSpellSlotsCount(
  expendedMap: Record<string, number> | undefined,
  className: string,
  spellLevel: number,
  totalSlots: number
): number {
  const expended = getExpendedSpellSlotsCount(expendedMap, className, spellLevel);
  return Math.max(0, totalSlots - expended);
}

/**
 * Expends (or restores if negative delta) spell slots for a class & level, clamping between 0 and maxSlots.
 */
export function expendSpellSlot(
  expendedMap: Record<string, number> | undefined,
  className: string,
  spellLevel: number,
  maxSlots: number,
  delta: number = 1
): Record<string, number> {
  const key = getSpellSlotUsageKey(className, spellLevel);
  const current = (expendedMap && expendedMap[key]) || 0;
  const next = Math.min(maxSlots, Math.max(0, current + delta));
  return {
    ...(expendedMap || {}),
    [key]: next
  };
}

/**
 * Restores spell slots (decreases expended count) for a class & level.
 */
export function restoreSpellSlot(
  expendedMap: Record<string, number> | undefined,
  className: string,
  spellLevel: number,
  maxSlots: number,
  delta: number = 1
): Record<string, number> {
  return expendSpellSlot(expendedMap, className, spellLevel, maxSlots, -delta);
}

/**
 * Directly sets the expended spell slots count for a class & level, clamped between 0 and maxSlots.
 */
export function setExpendedSpellSlots(
  expendedMap: Record<string, number> | undefined,
  className: string,
  spellLevel: number,
  count: number,
  maxSlots: number
): Record<string, number> {
  const key = getSpellSlotUsageKey(className, spellLevel);
  const clamped = Math.min(maxSlots, Math.max(0, count));
  return {
    ...(expendedMap || {}),
    [key]: clamped
  };
}

/**
 * Resets all expended spell slots for a specific class (e.g. on rest).
 */
export function resetExpendedSpellSlotsForClass(
  expendedMap: Record<string, number> | undefined,
  className: string
): Record<string, number> {
  if (!expendedMap) return {};
  const cKey = className.toLowerCase().replace(/[\s\/-]+/g, '_');
  const prefix = `${cKey}_lvl`;
  const result: Record<string, number> = {};
  for (const [k, v] of Object.entries(expendedMap)) {
    if (!k.startsWith(prefix)) {
      result[k] = v;
    }
  }
  return result;
}

/**
 * Resets all expended spell slots across all classes.
 */
export function resetAllExpendedSpellSlots(): Record<string, number> {
  return {};
}


