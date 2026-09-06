import {
  CharacterState,
  ClassData,
  RaceData,
  TraitData,
  FlawData,
  TemplateData,
  FeatData,
  StatType
} from '../types/character';
import {
  calculateTotalScore,
  getCharacterLevel,
  parseRaceMods,
  parseTemplateMods,
  calculateTraitFlawStatMods
} from './stats';
import { calculateBAB } from './classes';
import { SPELLCASTING_CLASSES, getSpellSlotsForClass } from './spells';

export interface FeatPrereqValidationResult {
  isQualified: boolean;
  unmetPrereqs: string[];
  satisfiedPrereqs: string[];
  rawPrerequisites: string | null;
}

export interface CharacterPrereqContext {
  stats: Record<StatType, number>;
  bab: number;
  characterLevel: number;
  classLevels: Record<string, number>;
  activeFeats: string[];
  rawActiveFeats: string[];
  skills: Record<string, number>;
  casterLevel: {
    max: number;
    arcane: number;
    divine: number;
    psionic: number;
    byClass: Record<string, number>;
  };
  maxSpellLevel: {
    arcane: number;
    divine: number;
    psionic: number;
    overall: number;
  };
  proficiencies: {
    lightArmor: boolean;
    mediumArmor: boolean;
    heavyArmor: boolean;
    shields: boolean;
    towerShield: boolean;
    simpleWeapons: boolean;
    martialWeapons: boolean;
  };
  race: string;
  raceType: string;
  raceSubtypes: string[];
  size: string;
  alignment: string;
  specialFeatures: Set<string>;
  metamagicCount: number;
  itemCreationCount: number;
}

// Known metamagic feat base names
const KNOWN_METAMAGIC_FEATS = new Set([
  'empower spell',
  'enlarge spell',
  'extend spell',
  'heighten spell',
  'maximize spell',
  'quicken spell',
  'silent spell',
  'still spell',
  'widen spell',
  'chain spell',
  'sculpt spell',
  'split ray',
  'twinned spell',
  'born of the three thunders',
  'energy substitution',
  'energy admixture',
  'reach spell',
  'fell animate',
  'fell drain',
  'fell frighten',
  'fell weaken',
  'invisible spell',
  'transdimensional spell',
  'repeat spell',
  'persistent spell',
  'ocular spell'
]);

// Known item creation feat base names
const KNOWN_ITEM_CREATION_FEATS = new Set([
  'brew potion',
  'craft magic arms and armor',
  'craft rod',
  'craft staff',
  'craft wand',
  'craft wondrous item',
  'forge ring',
  'scribe scroll',
  'craft construct',
  'attune gem',
  'craft dorje',
  'craft universal item',
  'craft psychoactive skin',
  'craft cognisance crystal',
  'etch schema',
  'inscribe rune'
]);

/**
 * Normalizes feat name for comparison (lowercasing, trimming, removing parenthetical targets).
 */
export function normalizeFeatName(featName: string): string {
  if (!featName) return '';
  return featName
    .toLowerCase()
    .replace(/\s*\([^)]*\)/g, '')
    .trim();
}

/**
 * Normalizes skill name for comparison (lowercasing, removing extra spaces).
 */
export function normalizeSkillName(skillName: string): string {
  if (!skillName) return '';
  return skillName.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Builds a fast-lookup character prerequisite context.
 */
export function buildCharacterPrereqContext(
  character: CharacterState,
  classesData: ClassData[] = [],
  racesData: RaceData[] = [],
  traitsData: TraitData[] = [],
  flawsData: FlawData[] = [],
  templatesData: TemplateData[] = []
): CharacterPrereqContext {
  const selectedRace = character.selectedRace || '';
  const raceObj = racesData.find(
    r => r.name.toLowerCase() === selectedRace.toLowerCase() || r.id === selectedRace.toLowerCase()
  );

  const selectedTemplate = character.selectedTemplate || '';
  const templateObj = templatesData.find(
    t => t.name.toLowerCase() === selectedTemplate.toLowerCase() || t.id === selectedTemplate.toLowerCase()
  );

  const raceMods = parseRaceMods(raceObj);
  const templateMods = parseTemplateMods(templateObj);
  const traitFlawMods = calculateTraitFlawStatMods(
    character.selectedTraits || [],
    character.selectedFlaws || [],
    traitsData,
    flawsData
  );

  const characterLevel = getCharacterLevel(character.levelProgression);

  // 1. Total Ability Scores
  const stats: Record<StatType, number> = {
    str: calculateTotalScore('str', character.baseStats, raceMods, character.levelBumps, character.enhancementMods, characterLevel, traitFlawMods, templateMods),
    dex: calculateTotalScore('dex', character.baseStats, raceMods, character.levelBumps, character.enhancementMods, characterLevel, traitFlawMods, templateMods),
    con: calculateTotalScore('con', character.baseStats, raceMods, character.levelBumps, character.enhancementMods, characterLevel, traitFlawMods, templateMods),
    int: calculateTotalScore('int', character.baseStats, raceMods, character.levelBumps, character.enhancementMods, characterLevel, traitFlawMods, templateMods),
    wis: calculateTotalScore('wis', character.baseStats, raceMods, character.levelBumps, character.enhancementMods, characterLevel, traitFlawMods, templateMods),
    cha: calculateTotalScore('cha', character.baseStats, raceMods, character.levelBumps, character.enhancementMods, characterLevel, traitFlawMods, templateMods)
  };

  // 2. Base Attack Bonus
  const bab = calculateBAB(character.levelProgression || [], classesData);

  // 3. Class Levels Count
  const classLevels: Record<string, number> = {};
  (character.levelProgression || []).forEach(lvl => {
    if (lvl.primaryClass) {
      const pKey = lvl.primaryClass.toLowerCase().trim();
      classLevels[pKey] = (classLevels[pKey] || 0) + 1;
    }
    if (lvl.secondaryClass) {
      const sKey = lvl.secondaryClass.toLowerCase().trim();
      classLevels[sKey] = (classLevels[sKey] || 0) + 1;
    }
  });

  // 4. Caster Levels & Spell Levels
  const casterLevelByClass: Record<string, number> = {};
  let maxArcaneCl = 0;
  let maxDivineCl = 0;
  let maxPsionicCl = 0;
  let maxArcaneSpellLvl = 0;
  let maxDivineSpellLvl = 0;
  let maxPsionicSpellLvl = 0;

  for (const [clsKey, lvl] of Object.entries(classLevels)) {
    const normKey = clsKey.replace(/[\s\/-]+/g, '_');
    const spellInfo = SPELLCASTING_CLASSES[normKey];
    let cl = 0;

    if (spellInfo) {
      const isHalfCaster = normKey === 'paladin' || normKey === 'ranger' || normKey === 'hexblade' || normKey === 'spellthief';
      if (isHalfCaster) {
        cl = lvl >= 4 ? Math.floor(lvl / 2) : 0;
      } else {
        cl = lvl;
      }

      casterLevelByClass[normKey] = cl;

      const statMod = Math.floor((stats[spellInfo.keyAbility] - 10) / 2);
      const slots = getSpellSlotsForClass(clsKey, lvl, statMod);
      let maxCastable = 0;
      if (slots && slots.slots) {
        slots.slots.forEach(s => {
          if (s.canCast && s.spellLevel > maxCastable) {
            maxCastable = s.spellLevel;
          }
        });
      }

      if (spellInfo.type === 'Arcane') {
        if (cl > maxArcaneCl) maxArcaneCl = cl;
        if (maxCastable > maxArcaneSpellLvl) maxArcaneSpellLvl = maxCastable;
      } else if (spellInfo.type === 'Divine') {
        if (cl > maxDivineCl) maxDivineCl = cl;
        if (maxCastable > maxDivineSpellLvl) maxDivineSpellLvl = maxCastable;
      } else if (spellInfo.type === 'Psionic') {
        if (cl > maxPsionicCl) maxPsionicCl = cl;
        if (maxCastable > maxPsionicSpellLvl) maxPsionicSpellLvl = maxCastable;
      }
    } else {
      // Check if class data suggests spellcasting
      const cObj = classesData.find(c => c.name.toLowerCase() === clsKey);
      if (cObj?.bonusCaster) {
        cl = lvl;
        casterLevelByClass[clsKey] = cl;
      }
    }
  }

  const maxCasterLevel = Math.max(maxArcaneCl, maxDivineCl, maxPsionicCl, ...Object.values(casterLevelByClass), 0);
  const maxSpellLevelOverall = Math.max(maxArcaneSpellLvl, maxDivineSpellLvl, maxPsionicSpellLvl, 0);

  // 5. Proficiencies from Classes & Feats
  const proficiencies = {
    lightArmor: false,
    mediumArmor: false,
    heavyArmor: false,
    shields: false,
    towerShield: false,
    simpleWeapons: false,
    martialWeapons: false
  };

  for (const clsKey of Object.keys(classLevels)) {
    const cObj = classesData.find(c => c.name.toLowerCase() === clsKey);
    if (cObj?.proficiencies) {
      if (cObj.proficiencies.lightArmor) proficiencies.lightArmor = true;
      if (cObj.proficiencies.mediumArmor) {
        proficiencies.lightArmor = true;
        proficiencies.mediumArmor = true;
      }
      if (cObj.proficiencies.heavyArmor) {
        proficiencies.lightArmor = true;
        proficiencies.mediumArmor = true;
        proficiencies.heavyArmor = true;
      }
      if (cObj.proficiencies.shield) proficiencies.shields = true;
      if (cObj.proficiencies.towerShield) {
        proficiencies.shields = true;
        proficiencies.towerShield = true;
      }
      if (cObj.proficiencies.simpleWeapons) proficiencies.simpleWeapons = true;
      if (cObj.proficiencies.martialWeapons) {
        proficiencies.simpleWeapons = true;
        proficiencies.martialWeapons = true;
      }
    }
  }

  // 6. Active Feats
  const rawActiveFeats = character.selectedFeats || [];
  const activeFeats: string[] = [];
  let metamagicCount = 0;
  let itemCreationCount = 0;

  rawActiveFeats.forEach(f => {
    const rawLower = f.toLowerCase().trim();
    activeFeats.push(rawLower);

    const norm = normalizeFeatName(f);
    if (norm && !activeFeats.includes(norm)) {
      activeFeats.push(norm);
    }

    if (KNOWN_METAMAGIC_FEATS.has(norm) || rawLower.includes('metamagic')) {
      metamagicCount++;
    }
    if (KNOWN_ITEM_CREATION_FEATS.has(norm) || rawLower.includes('craft') || rawLower.includes('scribe') || rawLower.includes('brew') || rawLower.includes('forge')) {
      itemCreationCount++;
    }

    // Feat proficiency grants
    if (rawLower.includes('armor proficiency (light)')) proficiencies.lightArmor = true;
    if (rawLower.includes('armor proficiency (medium)')) {
      proficiencies.lightArmor = true;
      proficiencies.mediumArmor = true;
    }
    if (rawLower.includes('armor proficiency (heavy)')) {
      proficiencies.lightArmor = true;
      proficiencies.mediumArmor = true;
      proficiencies.heavyArmor = true;
    }
    if (rawLower.includes('shield proficiency')) proficiencies.shields = true;
    if (rawLower.includes('tower shield proficiency')) {
      proficiencies.shields = true;
      proficiencies.towerShield = true;
    }
    if (rawLower.includes('martial weapon proficiency')) proficiencies.martialWeapons = true;
  });

  // 7. Skills
  const skills: Record<string, number> = {};
  for (const [sName, ranks] of Object.entries(character.skillRanks || {})) {
    skills[normalizeSkillName(sName)] = Number(ranks) || 0;
  }
  // Pathfinder Perception mapping
  if (character.usePathfinderPerception) {
    const percRanks = skills['perception'] || 0;
    if (!skills['spot']) skills['spot'] = percRanks;
    if (!skills['listen']) skills['listen'] = percRanks;
    if (!skills['search']) skills['search'] = percRanks;
  }

  // 8. Race, Subtypes, Size
  const raceName = selectedRace.toLowerCase().trim();
  const raceType = (templateObj?.type || raceObj?.type || 'Humanoid').toLowerCase();
  const raceSubtypes: string[] = [];
  if (raceObj?.subtype) {
    raceObj.subtype.split(',').forEach(st => raceSubtypes.push(st.toLowerCase().trim()));
  }
  if (templateObj?.subtype) {
    templateObj.subtype.split(',').forEach(st => raceSubtypes.push(st.toLowerCase().trim()));
  }
  if (raceName.includes('dragon') || raceName.includes('kobold') || raceName.includes('spellscale')) {
    if (!raceSubtypes.includes('dragonblood')) raceSubtypes.push('dragonblood');
  }
  if (raceName.includes('elf') && !raceSubtypes.includes('elf')) raceSubtypes.push('elf');
  if (raceName.includes('dwarf') && !raceSubtypes.includes('dwarf')) raceSubtypes.push('dwarf');
  if (raceName.includes('gnome') && !raceSubtypes.includes('gnome')) raceSubtypes.push('gnome');
  if (raceName.includes('halfling') && !raceSubtypes.includes('halfling')) raceSubtypes.push('halfling');
  if (raceName.includes('orc') && !raceSubtypes.includes('orc')) raceSubtypes.push('orc');
  if (raceName.includes('goblin') && !raceSubtypes.includes('goblinoid')) raceSubtypes.push('goblinoid');
  if (raceName.includes('shifter') || raceName.includes('changeling')) {
    if (!raceSubtypes.includes('shapechanger')) raceSubtypes.push('shapechanger');
  }

  const size = (templateObj?.size || raceObj?.size || 'Medium').toLowerCase();
  const alignment = (character.alignment || 'True Neutral').toLowerCase();

  // 9. Special Class Features
  const specialFeatures = new Set<string>();

  const fighterLvl = classLevels['fighter'] || 0;
  const clericLvl = classLevels['cleric'] || 0;
  const paladinLvl = classLevels['paladin'] || 0;
  const druidLvl = classLevels['druid'] || 0;
  const rogueLvl = classLevels['rogue'] || 0;
  const monkLvl = classLevels['monk'] || 0;
  const bardLvl = classLevels['bard'] || 0;
  const barbarianLvl = classLevels['barbarian'] || 0;
  const rangerLvl = classLevels['ranger'] || 0;
  const scoutLvl = classLevels['scout'] || 0;
  const wizardLvl = classLevels['wizard'] || 0;
  const sorcererLvl = classLevels['sorcerer'] || 0;

  if (clericLvl >= 1 || paladinLvl >= 4) {
    specialFeatures.add('turn_undead');
    specialFeatures.add('rebuke_undead');
    specialFeatures.add('turn_or_rebuke_undead');
  }
  if (druidLvl >= 5 || character.wildShape?.isActive || Boolean(character.wildShape?.selectedFormId)) {
    specialFeatures.add('wild_shape');
  }
  if (rogueLvl >= 1 || scoutLvl >= 1 || classLevels['assassin'] || classLevels['ninja']) {
    specialFeatures.add('sneak_attack');
    if (scoutLvl >= 1) specialFeatures.add('skirmish');
  }
  if (rogueLvl >= 2 || monkLvl >= 2 || scoutLvl >= 5) {
    specialFeatures.add('evasion');
  }
  if (rogueLvl >= 5 || barbarianLvl >= 2) {
    specialFeatures.add('uncanny_dodge');
  }
  if (rogueLvl >= 10 || barbarianLvl >= 5) {
    specialFeatures.add('improved_uncanny_dodge');
  }
  if (bardLvl >= 1) {
    specialFeatures.add('bardic_music');
  }
  if (barbarianLvl >= 1) {
    specialFeatures.add('rage');
  }
  if (monkLvl >= 1) {
    specialFeatures.add('flurry_of_blows');
    specialFeatures.add('improved_unarmed_strike');
  }
  if (monkLvl >= 4) {
    specialFeatures.add('ki_strike');
  }
  if (paladinLvl >= 1) {
    specialFeatures.add('smite_evil');
  }
  if (paladinLvl >= 2) {
    specialFeatures.add('lay_on_hands');
  }
  if (wizardLvl >= 1 || sorcererLvl >= 1 || character.familiar?.hasFamiliar || Boolean(character.familiar?.selectedFamiliarId)) {
    specialFeatures.add('familiar');
  }
  if (druidLvl >= 1 || rangerLvl >= 4 || character.animalCompanion?.hasCompanion || Boolean(character.animalCompanion?.selectedCompanionId)) {
    specialFeatures.add('animal_companion');
  }
  if (raceName.includes('dragonborn') || raceName.includes('half-dragon') || classLevels['dragonfire adept']) {
    specialFeatures.add('breath_weapon');
  }
  if (activeFeats.includes('improved unarmed strike')) {
    specialFeatures.add('improved_unarmed_strike');
  }

  return {
    stats,
    bab,
    characterLevel,
    classLevels,
    activeFeats,
    rawActiveFeats,
    skills,
    casterLevel: {
      max: maxCasterLevel,
      arcane: maxArcaneCl,
      divine: maxDivineCl,
      psionic: maxPsionicCl,
      byClass: casterLevelByClass
    },
    maxSpellLevel: {
      arcane: maxArcaneSpellLvl,
      divine: maxDivineSpellLvl,
      psionic: maxPsionicSpellLvl,
      overall: maxSpellLevelOverall
    },
    proficiencies,
    race: raceName,
    raceType,
    raceSubtypes,
    size,
    alignment,
    specialFeatures,
    metamagicCount,
    itemCreationCount
  };
}

interface SinglePrereqEvaluation {
  satisfied: boolean;
  unmetDescription?: string;
  satisfiedDescription?: string;
  isEditorial?: boolean;
}

const STAT_SYNONYMS: Record<string, StatType> = {
  str: 'str',
  strength: 'str',
  dex: 'dex',
  dexterity: 'dex',
  con: 'con',
  constitution: 'con',
  int: 'int',
  intelligence: 'int',
  wis: 'wis',
  wisdom: 'wis',
  cha: 'cha',
  charisma: 'cha'
};

/**
 * Evaluates an individual atomic prerequisite clause (without top-level 'or').
 */
function evaluateAtomicPrerequisite(
  rawClause: string,
  context: CharacterPrereqContext
): SinglePrereqEvaluation {
  const clause = rawClause.trim();
  if (!clause || clause === '-' || clause === '—' || clause === 'None' || clause === 'none') {
    return { satisfied: true, isEditorial: true };
  }

  // 1. Editorial / Regional / Reference notes (treat as advisory / satisfied so as not to lock out valid choices)
  const lower = clause.toLowerCase();
  if (
    lower.includes('meet regional requirement') ||
    lower.includes('dnt tbd') ||
    lower.includes('(not verified)') ||
    lower.startsWith('-see ') ||
    lower.startsWith('(see ') ||
    lower === 'special' ||
    lower === 'special (see text)' ||
    lower === 'see text' ||
    lower === 'character level'
  ) {
    return { satisfied: true, isEditorial: true };
  }

  // 2. Ability Score Requirements (e.g. "Str 13", "Int 13+", "Dexterity 15", "Con 13")
  const statMatch = clause.match(
    /\b(Str|Dex|Con|Int|Wis|Cha|Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s*(\d+)\+?/i
  );
  if (statMatch) {
    const statName = statMatch[1].toLowerCase();
    const statKey = STAT_SYNONYMS[statName];
    const reqVal = parseInt(statMatch[2], 10);
    if (statKey && !isNaN(reqVal)) {
      const currentVal = context.stats[statKey] || 0;
      const statDisplay = statKey.toUpperCase();
      if (currentVal >= reqVal) {
        return { satisfied: true, satisfiedDescription: `${statDisplay} ${reqVal}` };
      }
      return {
        satisfied: false,
        unmetDescription: `Requires ${statDisplay} ${reqVal} (current: ${currentVal})`
      };
    }
  }

  // 3. Base Attack Bonus (e.g. "BAB +1", "BAB +6", "Base attack bonus +4", "BAB 6+")
  const babMatch = clause.match(/\b(?:BAB|Base\s+attack\s+bonus)\s*\+?(\d+)\+?/i);
  if (babMatch) {
    const reqBab = parseInt(babMatch[1], 10);
    if (!isNaN(reqBab)) {
      if (context.bab >= reqBab) {
        return { satisfied: true, satisfiedDescription: `BAB +${reqBab}` };
      }
      return {
        satisfied: false,
        unmetDescription: `Requires BAB +${reqBab} (current: +${context.bab})`
      };
    }
  }

  // 4. Character Level / HD (e.g. "Character Level 6+", "Character level 6th", "HD 4", "Hit Dice 6+")
  const charLvlMatch = clause.match(
    /\b(?:Character\s+level|Hit\s+Dice|HD)\s*(\d+)(?:st|nd|rd|th|\+)?/i
  );
  if (charLvlMatch) {
    const reqLvl = parseInt(charLvlMatch[1], 10);
    if (!isNaN(reqLvl)) {
      if (context.characterLevel >= reqLvl) {
        return { satisfied: true, satisfiedDescription: `Character Level ${reqLvl}` };
      }
      return {
        satisfied: false,
        unmetDescription: `Requires Character Level ${reqLvl} (current: ${context.characterLevel})`
      };
    }
  }

  // 5. 1st Level Only
  if (
    lower.includes('1st level only') ||
    lower.includes('must be taken at 1st level') ||
    lower.includes('1st-level character only')
  ) {
    // If character is level 1, or character already has this feat selected
    if (context.characterLevel <= 1) {
      return { satisfied: true, satisfiedDescription: '1st level character' };
    }
    return {
      satisfied: false,
      unmetDescription: 'Must be selected at 1st level'
    };
  }

  // 6. Skill Ranks (e.g. "Spellcraft 4 ranks", "Knowledge (religion) 4 ranks", "Ride 4 ranks", "Tumble 5 ranks")
  const skillMatch = clause.match(/([A-Za-z\s\(\)]+?)\s+(\d+)\s+ranks?/i);
  if (skillMatch) {
    const rawSkillName = skillMatch[1].trim();
    const reqRanks = parseInt(skillMatch[2], 10);
    const normSkill = normalizeSkillName(rawSkillName);
    const currentRanks = context.skills[normSkill] || 0;

    if (currentRanks >= reqRanks) {
      return { satisfied: true, satisfiedDescription: `${rawSkillName} ${reqRanks} ranks` };
    }
    return {
      satisfied: false,
      unmetDescription: `Requires ${rawSkillName} ${reqRanks} ranks (current: ${currentRanks})`
    };
  }

  // 7. General Skill requirement without explicit number (e.g. "Ride skill")
  const simpleSkillMatch = clause.match(/([A-Za-z\s\(\)]+?)\s+skill\b/i);
  if (simpleSkillMatch) {
    const rawSkillName = simpleSkillMatch[1].trim();
    const normSkill = normalizeSkillName(rawSkillName);
    const currentRanks = context.skills[normSkill] || 0;
    if (currentRanks >= 1) {
      return { satisfied: true, satisfiedDescription: `${rawSkillName} skill` };
    }
    return {
      satisfied: false,
      unmetDescription: `Requires ${rawSkillName} skill (at least 1 rank)`
    };
  }

  // 8. Caster Level / Manifester Level (e.g. "Caster level 3rd", "Caster level 6th", "Manifester level 3rd")
  const clMatch = clause.match(/\b(?:Caster\s+level|Manifester\s+level)\s*(\d+)(?:st|nd|rd|th|\+)?/i);
  if (clMatch) {
    const reqCl = parseInt(clMatch[1], 10);
    if (!isNaN(reqCl)) {
      if (context.casterLevel.max >= reqCl) {
        return { satisfied: true, satisfiedDescription: `Caster Level ${reqCl}` };
      }
      return {
        satisfied: false,
        unmetDescription: `Requires Caster Level ${reqCl} (current: ${context.casterLevel.max})`
      };
    }
  }

  // 9. Class Level (e.g. "Fighter level 4th", "Cleric level 3rd", "Wizard 5th", "Monk level 6th", "Sorcerer 1st level")
  const classLvlMatch = clause.match(
    /\b([A-Za-z\s]+?)\s+(?:level\s+)?(\d+)(?:st|nd|rd|th|\+)?(?:\s+level)?\b/i
  );
  if (classLvlMatch) {
    const candidateClass = classLvlMatch[1].trim().toLowerCase();
    const reqLvl = parseInt(classLvlMatch[2], 10);
    // Ignore if it was "caster level" or "character level" or stat name
    if (
      !candidateClass.includes('caster') &&
      !candidateClass.includes('character') &&
      !candidateClass.includes('manifester') &&
      !STAT_SYNONYMS[candidateClass] &&
      !isNaN(reqLvl)
    ) {
      const curLvl = context.classLevels[candidateClass] || 0;
      const classDisplayName = candidateClass.charAt(0).toUpperCase() + candidateClass.slice(1);
      if (curLvl >= reqLvl) {
        return { satisfied: true, satisfiedDescription: `${classDisplayName} level ${reqLvl}` };
      }
      return {
        satisfied: false,
        unmetDescription: `Requires ${classDisplayName} level ${reqLvl} (current: ${curLvl})`
      };
    }
  }

  // 10. Spellcasting Capability (e.g. "Ability to cast 3rd-level spells", "Ability to cast arcane spells", "Ability to cast 1st-level arcane spells")
  const spellLvlMatch = clause.match(
    /Ability\s+to\s+cast\s+(\d+)(?:st|nd|rd|th)?-level\s+(?:(arcane|divine|psionic)\s+)?spells?/i
  );
  if (spellLvlMatch) {
    const reqSpellLvl = parseInt(spellLvlMatch[1], 10);
    const spellType = spellLvlMatch[2]?.toLowerCase();
    let curMax = context.maxSpellLevel.overall;
    if (spellType === 'arcane') curMax = context.maxSpellLevel.arcane;
    else if (spellType === 'divine') curMax = context.maxSpellLevel.divine;
    else if (spellType === 'psionic') curMax = context.maxSpellLevel.psionic;

    if (curMax >= reqSpellLvl) {
      return { satisfied: true, satisfiedDescription: `Ability to cast ${reqSpellLvl}-level spells` };
    }
    return {
      satisfied: false,
      unmetDescription: `Requires ability to cast ${spellType ? spellType + ' ' : ''}level ${reqSpellLvl} spells (current max: ${curMax})`
    };
  }

  if (lower.includes('ability to cast arcane spells') || lower.includes('cast arcane spells')) {
    if (context.maxSpellLevel.arcane >= 1 || context.casterLevel.arcane >= 1) {
      return { satisfied: true, satisfiedDescription: 'Ability to cast arcane spells' };
    }
    return { satisfied: false, unmetDescription: 'Requires ability to cast arcane spells' };
  }
  if (lower.includes('ability to cast divine spells') || lower.includes('cast divine spells')) {
    if (context.maxSpellLevel.divine >= 1 || context.casterLevel.divine >= 1) {
      return { satisfied: true, satisfiedDescription: 'Ability to cast divine spells' };
    }
    return { satisfied: false, unmetDescription: 'Requires ability to cast divine spells' };
  }
  if (lower.includes('ability to cast spells') || lower.includes('spellcaster')) {
    if (context.casterLevel.max >= 1) {
      return { satisfied: true, satisfiedDescription: 'Ability to cast spells' };
    }
    return { satisfied: false, unmetDescription: 'Requires spellcasting ability' };
  }

  // 11. Class Features / Special Abilities
  if (
    lower.includes('turn or rebuke undead') ||
    lower.includes('turn/rebuke undead') ||
    lower.includes('turn undead') ||
    lower.includes('rebuke undead')
  ) {
    if (context.specialFeatures.has('turn_or_rebuke_undead')) {
      return { satisfied: true, satisfiedDescription: 'Turn or rebuke undead' };
    }
    return { satisfied: false, unmetDescription: 'Requires ability to turn or rebuke undead' };
  }

  if (lower.includes('wild shape') || lower.includes('ability to use wild shape')) {
    if (context.specialFeatures.has('wild_shape')) {
      return { satisfied: true, satisfiedDescription: 'Wild shape ability' };
    }
    return { satisfied: false, unmetDescription: 'Requires Wild Shape ability' };
  }

  if (lower.includes('sneak attack')) {
    if (context.specialFeatures.has('sneak_attack')) {
      return { satisfied: true, satisfiedDescription: 'Sneak attack feature' };
    }
    return { satisfied: false, unmetDescription: 'Requires Sneak Attack class feature' };
  }

  if (lower.includes('evasion')) {
    if (context.specialFeatures.has('evasion')) {
      return { satisfied: true, satisfiedDescription: 'Evasion' };
    }
    return { satisfied: false, unmetDescription: 'Requires Evasion feature' };
  }

  if (lower.includes('bardic music')) {
    if (context.specialFeatures.has('bardic_music')) {
      return { satisfied: true, satisfiedDescription: 'Bardic music feature' };
    }
    return { satisfied: false, unmetDescription: 'Requires Bardic Music class feature' };
  }

  if (lower.includes('flurry of blows')) {
    if (context.specialFeatures.has('flurry_of_blows')) {
      return { satisfied: true, satisfiedDescription: 'Flurry of blows' };
    }
    return { satisfied: false, unmetDescription: 'Requires Flurry of Blows feature' };
  }

  if (lower.includes('smite evil')) {
    if (context.specialFeatures.has('smite_evil')) {
      return { satisfied: true, satisfiedDescription: 'Smite evil' };
    }
    return { satisfied: false, unmetDescription: 'Requires Smite Evil feature' };
  }

  if (lower.includes('breath weapon')) {
    if (context.specialFeatures.has('breath_weapon')) {
      return { satisfied: true, satisfiedDescription: 'Breath weapon' };
    }
    return { satisfied: false, unmetDescription: 'Requires Breath Weapon' };
  }

  // 12. Metamagic / Item Creation Feat Counts
  if (lower.includes('any metamagic feat') || lower.includes('one metamagic feat')) {
    if (context.metamagicCount >= 1) {
      return { satisfied: true, satisfiedDescription: 'Any metamagic feat' };
    }
    return { satisfied: false, unmetDescription: 'Requires at least 1 metamagic feat' };
  }
  if (lower.includes('two metamagic feats') || lower.includes('2 metamagic feats') || lower.includes('any two metamagic feats')) {
    if (context.metamagicCount >= 2) {
      return { satisfied: true, satisfiedDescription: 'Two metamagic feats' };
    }
    return { satisfied: false, unmetDescription: `Requires 2 metamagic feats (current: ${context.metamagicCount})` };
  }
  if (lower.includes('any item creation feat') || lower.includes('one item creation feat')) {
    if (context.itemCreationCount >= 1) {
      return { satisfied: true, satisfiedDescription: 'Any item creation feat' };
    }
    return { satisfied: false, unmetDescription: 'Requires at least 1 item creation feat' };
  }

  // 13. Proficiencies
  if (lower.includes('armor proficiency (light)')) {
    if (context.proficiencies.lightArmor || context.activeFeats.includes('armor proficiency (light)')) {
      return { satisfied: true, satisfiedDescription: 'Armor Proficiency (light)' };
    }
    return { satisfied: false, unmetDescription: 'Requires Armor Proficiency (light)' };
  }
  if (lower.includes('armor proficiency (medium)')) {
    if (context.proficiencies.mediumArmor || context.activeFeats.includes('armor proficiency (medium)')) {
      return { satisfied: true, satisfiedDescription: 'Armor Proficiency (medium)' };
    }
    return { satisfied: false, unmetDescription: 'Requires Armor Proficiency (medium)' };
  }
  if (lower.includes('armor proficiency (heavy)') || lower.includes('proficient with heavy armor')) {
    if (context.proficiencies.heavyArmor || context.activeFeats.includes('armor proficiency (heavy)')) {
      return { satisfied: true, satisfiedDescription: 'Armor Proficiency (heavy)' };
    }
    return { satisfied: false, unmetDescription: 'Requires Armor Proficiency (heavy)' };
  }
  if (lower.includes('shield proficiency') || lower.includes('proficient with shields')) {
    if (context.proficiencies.shields || context.activeFeats.includes('shield proficiency')) {
      return { satisfied: true, satisfiedDescription: 'Shield Proficiency' };
    }
    return { satisfied: false, unmetDescription: 'Requires Shield Proficiency' };
  }
  if (lower.includes('tower shield proficiency')) {
    if (context.proficiencies.towerShield || context.activeFeats.includes('tower shield proficiency')) {
      return { satisfied: true, satisfiedDescription: 'Tower Shield Proficiency' };
    }
    return { satisfied: false, unmetDescription: 'Requires Tower Shield Proficiency' };
  }
  if (lower.includes('proficient with weapon') || lower.includes('weapon proficiency')) {
    if (context.proficiencies.simpleWeapons || context.proficiencies.martialWeapons) {
      return { satisfied: true, satisfiedDescription: 'Weapon Proficiency' };
    }
    return { satisfied: false, unmetDescription: 'Requires Weapon Proficiency' };
  }

  // 14. Races & Subtypes
  const KNOWN_RACES = [
    'human', 'elf', 'dwarf', 'gnome', 'halfling', 'half-elf', 'half-orc',
    'warforged', 'shifter', 'changeling', 'kalashtar', 'goliath', 'orc',
    'kobold', 'dragonborn', 'illumian', 'drow', 'tiefling', 'aasimar', 'raptoran'
  ];
  for (const r of KNOWN_RACES) {
    // Check word boundary
    const rRegex = new RegExp(`\\b${r}\\b`, 'i');
    if (rRegex.test(clause)) {
      if (context.race.includes(r) || context.raceSubtypes.includes(r)) {
        return { satisfied: true, satisfiedDescription: `Race: ${r}` };
      }
      return { satisfied: false, unmetDescription: `Requires Race: ${r.charAt(0).toUpperCase() + r.slice(1)}` };
    }
  }

  if (lower.includes('dragonblood subtype') || lower.includes('dragonblood')) {
    if (context.raceSubtypes.includes('dragonblood')) {
      return { satisfied: true, satisfiedDescription: 'Dragonblood subtype' };
    }
    return { satisfied: false, unmetDescription: 'Requires Dragonblood subtype' };
  }
  if (lower.includes('shapechanger subtype') || lower.includes('shapechanger')) {
    if (context.raceSubtypes.includes('shapechanger')) {
      return { satisfied: true, satisfiedDescription: 'Shapechanger subtype' };
    }
    return { satisfied: false, unmetDescription: 'Requires Shapechanger subtype' };
  }

  // 15. Alignment Requirements
  if (lower.includes('any evil alignment') || lower.includes('evil alignment')) {
    if (context.alignment.includes('evil')) {
      return { satisfied: true, satisfiedDescription: 'Evil alignment' };
    }
    return { satisfied: false, unmetDescription: 'Requires Evil alignment' };
  }
  if (lower.includes('any good alignment') || lower.includes('good alignment')) {
    if (context.alignment.includes('good')) {
      return { satisfied: true, satisfiedDescription: 'Good alignment' };
    }
    return { satisfied: false, unmetDescription: 'Requires Good alignment' };
  }
  if (lower.includes('any chaotic alignment') || lower.includes('chaotic alignment')) {
    if (context.alignment.includes('chaotic')) {
      return { satisfied: true, satisfiedDescription: 'Chaotic alignment' };
    }
    return { satisfied: false, unmetDescription: 'Requires Chaotic alignment' };
  }
  if (lower.includes('any lawful alignment') || lower.includes('lawful alignment')) {
    if (context.alignment.includes('lawful')) {
      return { satisfied: true, satisfiedDescription: 'Lawful alignment' };
    }
    return { satisfied: false, unmetDescription: 'Requires Lawful alignment' };
  }
  if (lower.includes('non-good')) {
    if (!context.alignment.includes('good')) {
      return { satisfied: true, satisfiedDescription: 'Non-good alignment' };
    }
    return { satisfied: false, unmetDescription: 'Requires Non-Good alignment' };
  }
  if (lower.includes('non-lawful')) {
    if (!context.alignment.includes('lawful')) {
      return { satisfied: true, satisfiedDescription: 'Non-lawful alignment' };
    }
    return { satisfied: false, unmetDescription: 'Requires Non-Lawful alignment' };
  }

  // 16. Size Requirements
  if (lower.includes('medium or larger')) {
    if (context.size === 'medium' || context.size === 'large' || context.size === 'huge' || context.size === 'gargantuan' || context.size === 'colossal') {
      return { satisfied: true, satisfiedDescription: 'Medium or larger size' };
    }
    return { satisfied: false, unmetDescription: 'Requires Medium or larger size' };
  }
  if (lower.includes('small or medium')) {
    if (context.size === 'small' || context.size === 'medium') {
      return { satisfied: true, satisfiedDescription: 'Small or Medium size' };
    }
    return { satisfied: false, unmetDescription: 'Requires Small or Medium size' };
  }

  // 17. Feat Matching
  // Check if character has feat matching this clause or base feat
  const normClause = normalizeFeatName(clause);
  const clauseClean = clause.toLowerCase().replace(/^(?:feat:|\+)/i, '').trim();

  // Strip descriptive suffixes like "with weapon", "with chosen weapon", "in chosen school", etc.
  const baseStripped = normClause
    .replace(/\s+(with|in|for)\s+(weapon|chosen weapon|selected weapon|chosen spell school|school|chosen skill|specified weapon|chosen deity)/gi, '')
    .trim();

  // Check direct match, base match, or substring match
  const hasExact = context.activeFeats.includes(clauseClean) ||
                    context.activeFeats.includes(normClause) ||
                    context.activeFeats.includes(baseStripped);

  const hasBase = context.activeFeats.some(
    af => af === normClause ||
          af === baseStripped ||
          af.startsWith(normClause + ' ') ||
          af.startsWith(normClause + '(') ||
          af.startsWith(baseStripped + ' ') ||
          af.startsWith(baseStripped + '(') ||
          (af.length > 4 && baseStripped.startsWith(af))
  );

  // Special case for Improved Unarmed Strike granted by Monk
  if ((normClause === 'improved unarmed strike' || baseStripped === 'improved unarmed strike') && context.specialFeatures.has('improved_unarmed_strike')) {
    return { satisfied: true, satisfiedDescription: 'Improved Unarmed Strike' };
  }

  if (hasExact || hasBase) {
    return { satisfied: true, satisfiedDescription: `Feat: ${clause}` };
  }

  return {
    satisfied: false,
    unmetDescription: `Requires Feat: ${clause}`
  };
}

/**
 * Evaluates a single compound prerequisite clause which may contain 'or'.
 */
export function evaluatePrerequisiteClause(
  rawClause: string,
  context: CharacterPrereqContext
): SinglePrereqEvaluation {
  const clause = rawClause.trim();
  if (!clause) return { satisfied: true, isEditorial: true };

  // Check for " or " disjunction (e.g. "Base attack bonus +6 or fighter level 4th", "Str 13 or Dex 13", "Elf or half-elf")
  // Make sure not to split "turn or rebuke undead" which is a single ability
  if (
    clause.toLowerCase().includes(' or ') &&
    !clause.toLowerCase().includes('turn or rebuke')
  ) {
    const branches = clause.split(/\s+or\s+/i);
    const branchResults = branches.map(b => evaluateAtomicPrerequisite(b, context));

    // If ANY branch is satisfied, the compound OR clause is satisfied!
    const satisfiedBranch = branchResults.find(r => r.satisfied);
    if (satisfiedBranch) {
      return {
        satisfied: true,
        satisfiedDescription: satisfiedBranch.satisfiedDescription || clause
      };
    }

    // None satisfied: construct an informative message
    const unmetDetails = branchResults
      .map(r => r.unmetDescription || '')
      .filter(Boolean)
      .join(' OR ');

    return {
      satisfied: false,
      unmetDescription: unmetDetails || `Requires: ${clause}`
    };
  }

  return evaluateAtomicPrerequisite(clause, context);
}

/**
 * Splits a full prerequisite string into individual clauses by commas or semicolons,
 * respecting nested parentheses.
 */
export function splitPrerequisiteClauses(prereqText: string): string[] {
  if (!prereqText) return [];

  // Remove trailing periods and common editorial prefixes
  let cleaned = prereqText.trim().replace(/\.$/, '');

  // Split on commas and semicolons not inside parentheses
  const clauses: string[] = [];
  let current = '';
  let parenDepth = 0;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (char === '(') {
      parenDepth++;
      current += char;
    } else if (char === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
      current += char;
    } else if ((char === ',' || char === ';') && parenDepth === 0) {
      if (current.trim()) {
        clauses.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    clauses.push(current.trim());
  }

  return clauses;
}

/**
 * Evaluates whether a character qualifies for a given feat and returns all met & unmet criteria.
 */
export function evaluateFeatPrerequisites(
  feat: FeatData,
  character: CharacterState,
  classesData: ClassData[] = [],
  racesData: RaceData[] = [],
  traitsData: TraitData[] = [],
  flawsData: FlawData[] = [],
  templatesData: TemplateData[] = []
): FeatPrereqValidationResult {
  if (!feat.prerequisites || !feat.prerequisites.trim()) {
    return {
      isQualified: true,
      unmetPrereqs: [],
      satisfiedPrereqs: [],
      rawPrerequisites: null
    };
  }

  const context = buildCharacterPrereqContext(
    character,
    classesData,
    racesData,
    traitsData,
    flawsData,
    templatesData
  );

  return evaluateFeatPrerequisitesWithContext(feat, context);
}

/**
 * Evaluates feat prerequisites using a prebuilt character context for maximum batch performance.
 */
export function evaluateFeatPrerequisitesWithContext(
  feat: FeatData,
  context: CharacterPrereqContext
): FeatPrereqValidationResult {
  if (!feat.prerequisites || !feat.prerequisites.trim()) {
    return {
      isQualified: true,
      unmetPrereqs: [],
      satisfiedPrereqs: [],
      rawPrerequisites: null
    };
  }

  const rawPrerequisites = feat.prerequisites;
  const clauses = splitPrerequisiteClauses(rawPrerequisites);

  const unmetPrereqs: string[] = [];
  const satisfiedPrereqs: string[] = [];

  for (const clause of clauses) {
    const result = evaluatePrerequisiteClause(clause, context);
    if (result.isEditorial) continue;

    if (result.satisfied) {
      if (result.satisfiedDescription) {
        satisfiedPrereqs.push(result.satisfiedDescription);
      }
    } else {
      if (result.unmetDescription) {
        unmetPrereqs.push(result.unmetDescription);
      }
    }
  }

  return {
    isQualified: unmetPrereqs.length === 0,
    unmetPrereqs,
    satisfiedPrereqs,
    rawPrerequisites
  };
}
