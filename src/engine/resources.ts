import {
  CharacterState,
  DailyResourceTrack,
  CustomResourceDefinition,
  BaseStats,
  RaceData,
  TemplateData,
  TraitData,
  FlawData
} from '../types/character';
import {
  getAbilityMod,
  calculateTotalScore,
  parseRaceMods,
  parseTemplateMods,
  calculateTraitFlawStatMods,
  getCharacterLevel
} from './stats';
import { getEffectiveDruidLevel, getWildShapeProgression } from './wildshape';

/**
 * Calculates the total levels a character has in a specific class name (case-insensitive).
 * Supports both standard multiclassing and gestalt progression.
 */
export function getClassLevel(character: CharacterState, targetClassName: string): number {
  if (!character.levelProgression || !Array.isArray(character.levelProgression)) return 0;
  const target = targetClassName.toLowerCase().trim();
  let count = 0;

  for (const lvl of character.levelProgression) {
    const c1 = (lvl.primaryClass || '').toLowerCase().trim();
    const c2 = (lvl.secondaryClass || '').toLowerCase().trim();
    if (c1 === target || c2 === target) {
      count++;
    }
  }

  return count;
}

/**
 * Counts how many times a feat (or feat starting with prefix) is selected by the character.
 */
export function countFeats(character: CharacterState, targetFeat: string): number {
  if (!character.selectedFeats || !Array.isArray(character.selectedFeats)) return 0;
  const target = targetFeat.toLowerCase().trim();

  return character.selectedFeats.filter(f => {
    const fn = (f || '').toLowerCase().trim();
    return fn === target || fn.startsWith(target);
  }).length;
}

/**
 * Helper to resolve the effective Charisma score & modifier for a character.
 */
export function resolveEffectiveChaMod(
  character: CharacterState,
  racesData: RaceData[] = [],
  templatesData: TemplateData[] = [],
  traitsData: TraitData[] = [],
  flawsData: FlawData[] = []
): number {
  const raceObj = racesData.find(r => r.name === character.selectedRace) || {};
  const templateObj = templatesData.find(
    t => t.name === character.selectedTemplate || t.id === character.selectedTemplate
  );
  const raceMods = parseRaceMods(raceObj);
  const templateMods = parseTemplateMods(templateObj);
  const traitFlawMods = calculateTraitFlawStatMods(
    character.selectedTraits || [],
    character.selectedFlaws || [],
    traitsData,
    flawsData
  );
  const totalLevel = getCharacterLevel(character.levelProgression);

  const totalCha = calculateTotalScore(
    'cha',
    character.baseStats,
    raceMods,
    character.levelBumps || {},
    character.enhancementMods || {},
    totalLevel,
    traitFlawMods,
    templateMods
  );

  return getAbilityMod(totalCha);
}

/**
 * Barbarian Rage:
 * 1/day at 1st level, +1/day every 4 levels thereafter (1 at 1st, 2 at 4th, 3 at 8th, 4 at 12th, 5 at 16th, 6 at 20th).
 * Feats: Extra Rage grants +2 uses/day per feat selection.
 */
export function calculateBarbarianRageUses(character: CharacterState): number {
  const barbLevel = getClassLevel(character, 'barbarian');
  if (barbLevel < 1) return 0;

  const baseUses = 1 + Math.floor(barbLevel / 4);
  const featBonus = countFeats(character, 'extra rage') * 2;

  return Math.max(0, baseUses + featBonus);
}

/**
 * Turn / Rebuke Undead:
 * Cleric (1st level) or Paladin (4th level) or other turning classes.
 * Daily usages: 3 + Charisma modifier.
 * Feats: Extra Turning grants +4 uses/day per feat selection.
 */
export function calculateTurnUndeadUses(character: CharacterState, chaMod: number): number {
  const clericLevel = getClassLevel(character, 'cleric');
  const paladinLevel = getClassLevel(character, 'paladin');
  const blackguardLevel = getClassLevel(character, 'blackguard');
  const dreadNecroLevel = getClassLevel(character, 'dread necromancer');
  const deathMasterLevel = getClassLevel(character, 'death master');
  const extraTurningCount = countFeats(character, 'extra turning');

  const hasTurnClass =
    clericLevel >= 1 ||
    paladinLevel >= 4 ||
    blackguardLevel >= 3 ||
    dreadNecroLevel >= 1 ||
    deathMasterLevel >= 1;

  if (!hasTurnClass && extraTurningCount === 0) {
    return 0;
  }

  const baseUses = hasTurnClass ? 3 + chaMod : 0;
  const featBonus = extraTurningCount * 4;

  return Math.max(0, baseUses + featBonus);
}

/**
 * Paladin Smite Evil:
 * 1/day at 1st level, +1/day for every 5 levels thereafter (1 at 1st, 2 at 5th, 3 at 10th, 4 at 15th, 5 at 20th).
 * Destruction Domain grants +1 Smite/day.
 * Feats: Extra Smiting grants +2 uses/day per selection.
 */
export function calculateSmiteEvilUses(character: CharacterState): number {
  const paladinLevel = getClassLevel(character, 'paladin');
  const hasDestructionDomain = (character.selectedDomains || []).some(
    d => d.toLowerCase() === 'destruction'
  );
  const extraSmitingCount = countFeats(character, 'extra smiting');

  if (paladinLevel < 1 && !hasDestructionDomain && extraSmitingCount === 0) {
    return 0;
  }

  const baseUses = paladinLevel >= 1 ? 1 + Math.floor(paladinLevel / 5) : 0;
  const domainBonus = hasDestructionDomain ? 1 : 0;
  const featBonus = extraSmitingCount * 2;

  return Math.max(0, baseUses + domainBonus + featBonus);
}

/**
 * Paladin Lay on Hands:
 * Healing point pool equal to Paladin Level × Charisma bonus.
 * Gained at Paladin 2nd level. (0 if Cha mod <= 0).
 */
export function calculateLayOnHandsPool(character: CharacterState, chaMod: number): number {
  const paladinLevel = getClassLevel(character, 'paladin');
  if (paladinLevel < 2 || chaMod <= 0) {
    return 0;
  }

  return paladinLevel * chaMod;
}

/**
 * Bardic Music:
 * 1/day per Bard level (1 at 1st, 2 at 2nd... 20 at 20th).
 * Feats: Extra Music grants +4 uses/day per selection.
 */
export function calculateBardicMusicUses(character: CharacterState): number {
  const bardLevel = getClassLevel(character, 'bard');
  const extraMusicCount = countFeats(character, 'extra music');

  if (bardLevel < 1 && extraMusicCount === 0) {
    return 0;
  }

  const baseUses = bardLevel >= 1 ? bardLevel : 0;
  const featBonus = extraMusicCount * 4;

  return Math.max(0, baseUses + featBonus);
}

/**
 * Wild Shape:
 * Standard D&D 3.5e Druid progression (gain at Druid 5: 1/day, 6th: 2/day, 7th: 3/day, 10th: 4/day, 14th: 5/day, 18th: 6/day).
 * Elemental Wild Shape at 16th (1/day), 18th (2/day), 20th (3/day).
 * Feats: Extra Wild Shape grants +2 standard uses/day.
 */
export function calculateWildShapeUses(character: CharacterState): {
  standardUses: number;
  elementalUses: number;
  druidLevel: number;
  hasWildShape: boolean;
} {
  const druidLevel = getEffectiveDruidLevel(character);
  const progression = getWildShapeProgression(druidLevel);
  const extraWildShapeCount = countFeats(character, 'extra wild shape');

  const standardUses = progression.hasWildShape
    ? progression.dailyUses + extraWildShapeCount * 2
    : 0;

  return {
    standardUses,
    elementalUses: progression.elementalUses,
    druidLevel,
    hasWildShape: progression.hasWildShape
  };
}

/**
 * Monk / Feat Stunning Fist:
 * Monk gets 1/day per monk level.
 * Non-monk with feat gets 1/day per 4 character levels.
 * Feats: Extra Stunning grants +3 uses/day.
 */
export function calculateStunningFistUses(character: CharacterState): number {
  const monkLevel = getClassLevel(character, 'monk');
  const hasFeat = countFeats(character, 'stunning fist') > 0;

  if (monkLevel < 1 && !hasFeat) {
    return 0;
  }

  const totalLevel = getCharacterLevel(character.levelProgression);
  const nonMonkLevels = Math.max(0, totalLevel - monkLevel);
  const baseUses = monkLevel + Math.floor(nonMonkLevels / 4);
  const extraStunningCount = countFeats(character, 'extra stunning');

  return Math.max(0, baseUses + extraStunningCount * 3);
}

/**
 * Calculates all active daily resources for a character.
 */
export function calculateDailyResources(
  character: CharacterState,
  chaModOverride?: number,
  racesData: RaceData[] = [],
  templatesData: TemplateData[] = [],
  traitsData: TraitData[] = [],
  flawsData: FlawData[] = []
): DailyResourceTrack[] {
  const chaMod =
    chaModOverride !== undefined
      ? chaModOverride
      : resolveEffectiveChaMod(character, racesData, templatesData, traitsData, flawsData);

  const resources: DailyResourceTrack[] = [];
  const usages = character.resourceUsages || {};

  // 1. Barbarian Rage / Whirling Frenzy
  const rageMax = calculateBarbarianRageUses(character);
  if (rageMax > 0) {
    const barbLevel = getClassLevel(character, 'barbarian');
    const isWhirlingFrenzy = character.barbarianVariant === 'whirling_frenzy';

    resources.push({
      id: 'barbarian_rage',
      name: isWhirlingFrenzy ? 'Barbarian Whirling Frenzy' : 'Barbarian Rage',
      category: 'class',
      maxUses: rageMax,
      usedUses: Math.min(rageMax, Math.max(0, usages['barbarian_rage'] || 0)),
      isPool: false,
      unit: 'uses',
      source: isWhirlingFrenzy
        ? `Barbarian ${barbLevel} (Whirling Frenzy)`
        : `Barbarian ${barbLevel} (${rageMax}/day)`,
      description: isWhirlingFrenzy
        ? '+4 Str (+2 Atk/Dmg), +2 Dodge AC, +2 Ref saves, -2 Flurry (+1 Extra Attack at highest BAB). Duration: 3 + Con mod rounds.'
        : '+4 Str, +4 Con, +2 Morale Will saves, -2 AC. Duration: 3 + Con mod rounds. Cannot cast spells.',
      icon: isWhirlingFrenzy ? 'fa-solid fa-tornado' : 'fa-solid fa-fire',
      badgeColor: isWhirlingFrenzy
        ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
    });
  }

  // 2. Turn Undead
  const turnMax = calculateTurnUndeadUses(character, chaMod);
  if (turnMax > 0) {
    const clericLvl = getClassLevel(character, 'cleric');
    const paladinLvl = getClassLevel(character, 'paladin');
    const srcDesc =
      clericLvl >= 1
        ? `Cleric ${clericLvl}`
        : paladinLvl >= 4
        ? `Paladin ${paladinLvl}`
        : 'Turn Undead';

    resources.push({
      id: 'turn_undead',
      name: 'Turn / Rebuke Undead',
      category: 'class',
      maxUses: turnMax,
      usedUses: Math.min(turnMax, Math.max(0, usages['turn_undead'] || 0)),
      isPool: false,
      unit: 'uses',
      source: `${srcDesc} (3 + Cha mod ${chaMod >= 0 ? `+${chaMod}` : chaMod})`,
      description:
        'Standard action: Turn or rebuke undead within 60 ft. Turning check 1d20 + Cha mod; damage 2d6 + Turning Lvl + Cha mod HD.',
      icon: 'fa-solid fa-sun',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    });
  }

  // 3. Paladin Smite Evil
  const smiteMax = calculateSmiteEvilUses(character);
  if (smiteMax > 0) {
    const paladinLvl = getClassLevel(character, 'paladin');
    resources.push({
      id: 'smite_evil',
      name: 'Smite Evil',
      category: 'class',
      maxUses: smiteMax,
      usedUses: Math.min(smiteMax, Math.max(0, usages['smite_evil'] || 0)),
      isPool: false,
      unit: 'uses',
      source: paladinLvl >= 1 ? `Paladin ${paladinLvl}` : 'Smite Evil',
      description:
        'Add +Cha mod to melee attack roll and +Paladin level to damage against evil foes. Wasted if target is not evil.',
      icon: 'fa-solid fa-gavel',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
    });
  }

  // 4. Paladin Lay on Hands (HP Pool)
  const layOnHandsPool = calculateLayOnHandsPool(character, chaMod);
  if (layOnHandsPool > 0) {
    const paladinLvl = getClassLevel(character, 'paladin');
    resources.push({
      id: 'lay_on_hands',
      name: 'Lay on Hands Pool',
      category: 'pool',
      maxUses: layOnHandsPool,
      usedUses: Math.min(layOnHandsPool, Math.max(0, usages['lay_on_hands'] || 0)),
      isPool: true,
      unit: 'HP',
      source: `Paladin ${paladinLvl} (${paladinLvl} × Cha mod ${chaMod >= 0 ? `+${chaMod}` : chaMod})`,
      description:
        'Heal living creatures by touch or deal damage to undead (melee touch attack, no save). Divisible across multiple uses.',
      icon: 'fa-solid fa-hand-holding-heart',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    });
  }

  // 5. Bardic Music
  const musicMax = calculateBardicMusicUses(character);
  if (musicMax > 0) {
    const bardLevel = getClassLevel(character, 'bard');
    resources.push({
      id: 'bardic_music',
      name: 'Bardic Music',
      category: 'class',
      maxUses: musicMax,
      usedUses: Math.min(musicMax, Math.max(0, usages['bardic_music'] || 0)),
      isPool: false,
      unit: 'uses',
      source: `Bard ${bardLevel} (1/day per lvl)`,
      description:
        'Perform Inspire Courage, Countersong, Fascinate, Inspire Competence, Suggestion, Inspire Greatness, or Song of Freedom.',
      icon: 'fa-solid fa-music',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
    });
  }

  // 6. Wild Shape (Standard)
  const wsInfo = calculateWildShapeUses(character);
  if (wsInfo.standardUses > 0) {
    resources.push({
      id: 'wild_shape',
      name: 'Wild Shape',
      category: 'class',
      maxUses: wsInfo.standardUses,
      usedUses: Math.min(wsInfo.standardUses, Math.max(0, usages['wild_shape'] || 0)),
      isPool: false,
      unit: 'uses',
      source: `Druid ${wsInfo.druidLevel} (Duration: ${wsInfo.druidLevel} hrs/use)`,
      description:
        'Standard action: Assume form of animal/plant. Retain mental scores, acquire physical scores & natural attacks.',
      icon: 'fa-solid fa-paw',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40'
    });
  }

  // 7. Elemental Wild Shape
  if (wsInfo.elementalUses > 0) {
    resources.push({
      id: 'elemental_wild_shape',
      name: 'Elemental Wild Shape',
      category: 'class',
      maxUses: wsInfo.elementalUses,
      usedUses: Math.min(wsInfo.elementalUses, Math.max(0, usages['elemental_wild_shape'] || 0)),
      isPool: false,
      unit: 'uses',
      source: `Druid ${wsInfo.druidLevel} (Elemental)`,
      description:
        'Assume form of a Small, Medium, Large, or Huge Air, Earth, Fire, or Water elemental.',
      icon: 'fa-solid fa-wind',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
    });
  }

  // 8. Stunning Fist
  const stunningMax = calculateStunningFistUses(character);
  if (stunningMax > 0) {
    const monkLevel = getClassLevel(character, 'monk');
    resources.push({
      id: 'stunning_fist',
      name: 'Stunning Fist',
      category: 'feat',
      maxUses: stunningMax,
      usedUses: Math.min(stunningMax, Math.max(0, usages['stunning_fist'] || 0)),
      isPool: false,
      unit: 'uses',
      source: monkLevel >= 1 ? `Monk ${monkLevel}` : 'Stunning Fist Feat',
      description:
        'Declare before attack. If attack hits, foe must make Fort save (DC 10 + 1/2 lvl + Wis mod) or be stunned for 1 round.',
      icon: 'fa-solid fa-hand-back-fist',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40'
    });
  }

  // 9. Custom User-Defined Resources
  if (character.customResources && Array.isArray(character.customResources)) {
    for (const custom of character.customResources) {
      if (!custom || !custom.id || custom.maxUses <= 0) continue;
      resources.push({
        id: custom.id,
        name: custom.name || 'Custom Resource',
        category: 'custom',
        maxUses: custom.maxUses,
        usedUses: Math.min(custom.maxUses, Math.max(0, usages[custom.id] || 0)),
        isPool: Boolean(custom.isPool),
        unit: custom.unit || (custom.isPool ? 'Points' : 'uses'),
        source: 'Custom Resource',
        description: custom.description || 'User-defined daily tracker item.',
        icon: custom.icon || 'fa-solid fa-gem',
        badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
      });
    }
  }

  return resources;
}

/**
 * Adjusts used uses for a specific resource, clamping between 0 and maxUses.
 */
export function useResource(
  currentUsages: Record<string, number> = {},
  resourceId: string,
  delta: number,
  maxUses: number
): Record<string, number> {
  const current = currentUsages[resourceId] || 0;
  const next = Math.max(0, Math.min(maxUses, current + delta));
  return {
    ...currentUsages,
    [resourceId]: next
  };
}

/**
 * Directly sets the used amount for a specific resource, clamping between 0 and maxUses.
 */
export function setResourceUsed(
  currentUsages: Record<string, number> = {},
  resourceId: string,
  used: number,
  maxUses: number
): Record<string, number> {
  const next = Math.max(0, Math.min(maxUses, used));
  return {
    ...currentUsages,
    [resourceId]: next
  };
}

/**
 * Resets a single resource back to 0 uses expended (100% available).
 */
export function resetResource(
  currentUsages: Record<string, number> = {},
  resourceId: string
): Record<string, number> {
  return {
    ...currentUsages,
    [resourceId]: 0
  };
}

/**
 * Conditions cleared by a full uninterrupted 8-Hour Long Rest in D&D 3.5e.
 */
export const LONG_REST_CLEARED_CONDITIONS = new Set([
  'fatigued',
  'exhausted',
  'shaken',
  'dazed',
  'dazzled',
  'sickened',
  'staggered'
]);

/**
 * Performs an 8-Hour Long Rest:
 * - Restores Hit Points to full maxHp
 * - Resets Temporary HP to 0
 * - Clears Nonlethal Damage to 0
 * - Clears all daily resource usages (resets to 0 used / full uses available)
 * - Removes temporary conditions (fatigued, exhausted, shaken, etc.)
 * - Deactivates temporary active combat states (rage, whirling frenzy)
 */
export function performLongRest(
  character: CharacterState,
  maxHp: number
): Partial<CharacterState> {
  const activeConditions = character.activeConditions || [];
  const remainingConditions = activeConditions.filter(
    cond => !LONG_REST_CLEARED_CONDITIONS.has(cond.toLowerCase().trim())
  );

  const updatedTactical = character.tacticalCombat
    ? {
        ...character.tacticalCombat,
        rage: false,
        whirlingFrenzy: false
      }
    : undefined;

  const updatedPreparedSpells = character.preparedSpells
    ? character.preparedSpells.map(slot => (slot.isCast ? { ...slot, isCast: false } : slot))
    : undefined;

  return {
    currentHp: maxHp,
    tempHp: 0,
    nonlethalDamage: 0,
    resourceUsages: {},
    activeConditions: remainingConditions,
    tacticalCombat: updatedTactical,
    ...(updatedPreparedSpells ? { preparedSpells: updatedPreparedSpells } : {})
  };
}

