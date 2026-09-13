import {
  CharacterState,
  ClassData,
  RaceData,
  TraitData,
  FlawData,
  TemplateData,
  FeatData,
  StatType,
  CharacterFeat,
  FeatPrereqRuleType,
  FeatPrereqRule,
  FeatPrereqClauseAST,
  CompiledFeatPrerequisites,
  migrateLegacyFeatStrings,
  parseLegacyFeatString
} from '../types/character';
import {
  calculateTotalScore,
  getCharacterLevel,
  parseRaceMods,
  parseTemplateMods,
  calculateTraitFlawStatMods
} from './stats';
import { calculateBAB, calculateBaseSave } from './classes';
import { SPELLCASTING_CLASSES, getSpellSlotsForClass } from './spells';
import { getThemedWeaponBase } from './equipment';
import { hasSubtype, hasClassFeature } from './features';

export type {
  CharacterFeat,
  FeatPrereqRuleType,
  FeatPrereqRule,
  FeatPrereqClauseAST,
  CompiledFeatPrerequisites
};
export { migrateLegacyFeatStrings, parseLegacyFeatString };

export interface FeatPrereqValidationResult {
  isQualified: boolean;
  unmetPrereqs: string[];
  satisfiedPrereqs: string[];
  rawPrerequisites: string | null;
}

export interface CharacterPrereqContext {
  stats: Record<StatType, number>;
  bab: number;
  baseSaves: {
    fort: number;
    ref: number;
    will: number;
  };
  characterLevel: number;
  classLevels: Record<string, number>;
  activeFeats: string[];
  rawActiveFeats: string[];
  activeFeatEntities: CharacterFeat[];
  candidateTargetId?: string;
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

// Aliases mapping older edition / variant feat names to their canonical 3.5e counterpart
export const FEAT_EDITION_ALIASES: Record<string, string> = {
  'ki shout': 'kiai shout',
  'great ki shout': 'greater kiai shout',
  'remain conscious': 'diehard',
  'superior expertise': 'improved combat expertise',
  'longstrider elite': 'longstride elite',
  'tunnel fighter': 'tunnel fighting'
};

/**
 * Normalizes feat name for comparison (lowercasing, trimming, removing dashes, parenthetical targets, and resolving aliases).
 */
export function normalizeFeatName(featName: string): string {
  if (!featName) return '';
  const stripped = featName
    .toLowerCase()
    .replace(/^[\s\-–—]+|[\s\-–—]+$/g, '')
    .replace(/\s*\([^)]*\)/g, '')
    .trim();
  return FEAT_EDITION_ALIASES[stripped] || stripped;
}

/**
 * Normalizes skill name for comparison (lowercasing, removing extra spaces).
 */
export function normalizeSkillName(skillName: string): string {
  if (!skillName) return '';
  return skillName.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Normalizes feat name into a canonical featId slug.
 */
export function featNameToId(featName: string): string {
  if (!featName) return '';
  const lower = featName.toLowerCase().trim();
  if (lower.includes('armor proficiency')) {
    if (lower.includes('light')) return 'armor_proficiency_light';
    if (lower.includes('medium')) return 'armor_proficiency_medium';
    if (lower.includes('heavy')) return 'armor_proficiency_heavy';
  }
  const norm = normalizeFeatName(featName);
  return norm.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

/**
 * Normalizes a target string for comparison (lowercasing, trimming, replacing underscores).
 */
export function normalizeTarget(target?: string): string {
  if (!target) return '';
  return target.toLowerCase().trim().replace(/_/g, ' ');
}

/**
 * Compares two feat targets considering base weapon equivalence, composite bows, and themed aliases.
 */
export function matchesFeatTarget(targetA?: string, targetB?: string): boolean {
  if (!targetA || !targetB) return false;
  const a = normalizeTarget(targetA);
  const b = normalizeTarget(targetB);
  if (a === b) return true;

  // Check weapon alias / themed base e.g. "nodachi" -> "greatsword"
  const themedA = getThemedWeaponBase(a)?.toLowerCase();
  const themedB = getThemedWeaponBase(b)?.toLowerCase();
  if (themedA && (themedA === b || themedA === themedB)) return true;
  if (themedB && (themedB === a || themedB === themedA)) return true;

  // Composite bow equivalence
  if (a.startsWith('composite ') && a.replace(/^composite\s+/, '') === b) return true;
  if (b.startsWith('composite ') && b.replace(/^composite\s+/, '') === a) return true;

  // Parenthetical alias e.g. "nodachi (greatsword)"
  const matchA = a.match(/^(.+?)\s*\((.+?)\)$/);
  if (matchA && (matchA[1].trim() === b || matchA[2].trim() === b)) return true;
  const matchB = b.match(/^(.+?)\s*\((.+?)\)$/);
  if (matchB && (matchB[1].trim() === a || matchB[2].trim() === a)) return true;

  return false;
}

export interface ParsedFeatPrereq {
  featId: string;
  targetCandidates?: string[];
  requiresSameTarget?: boolean;
}

/**
 * Parses a feat prerequisite clause into structured featId and target requirements.
 */
export function parseFeatPrerequisiteClause(clause: string): ParsedFeatPrereq | null {
  let c = clause
    .replace(/^(?:feat:|\+)/i, '')
    .replace(/\s*\((?:not|non)\s+verified\)/gi, '')
    .trim();

  // Parameterized clause: "Weapon Focus (Longsword)", "Weapon Focus: Longsword", "Weapon Focus (warhammer or light hammer)"
  const match = c.match(/^(.+?)\s*[\(:]([^\)]+)\)?$/);
  if (match) {
    const rawBase = match[1].trim();
    const rawTarget = match[2].trim();
    const lowerBase = rawBase.toLowerCase();

    // Check armor proficiency
    if (lowerBase === 'armor proficiency') {
      const targetLower = rawTarget.toLowerCase().trim();
      return {
        featId: `armor_proficiency_${targetLower.replace(/[^a-z0-9]+/g, '_')}`
      };
    }

    const featId = featNameToId(rawBase);
    const targetCandidates = rawTarget
      .split(/,|\bor\b/)
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    return {
      featId,
      targetCandidates
    };
  }

  // Same-target requirement (e.g. "Weapon Focus with Weapon", "Weapon Focus with chosen weapon", "Spell Focus in chosen school")
  const sameTargetSuffixRegex = /\s+(?:with|in|for)\s+(?:a\s+|the\s+|chosen\s+|selected\s+|specified\s+|deity's\s+chosen\s+)*(?:weapon|spell\s+school|school|skill|deity)/i;
  if (sameTargetSuffixRegex.test(c)) {
    const baseStripped = c.replace(sameTargetSuffixRegex, '').trim();
    const featId = featNameToId(baseStripped);
    return {
      featId,
      requiresSameTarget: true
    };
  }

  // Untargeted feat clause (e.g. "Power Attack", "Cleave", "Point Blank Shot")
  const featId = featNameToId(c);
  if (!featId) return null;
  return {
    featId
  };
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

  // 2. Base Attack Bonus & Base Saves
  const bab = calculateBAB(character.levelProgression || [], classesData);
  const baseSaves = {
    fort: calculateBaseSave('fort', character.levelProgression || [], classesData),
    ref: calculateBaseSave('ref', character.levelProgression || [], classesData),
    will: calculateBaseSave('will', character.levelProgression || [], classesData)
  };

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
  const activeFeatEntities: CharacterFeat[] = (Array.isArray(character.selectedFeatEntities) && character.selectedFeatEntities.length > 0)
    ? [...character.selectedFeatEntities]
    : migrateLegacyFeatStrings(rawActiveFeats);

  // If character has selectedFeatEntities but also extra strings in selectedFeats, merge any unmigrated ones
  if (Array.isArray(character.selectedFeatEntities) && character.selectedFeatEntities.length > 0 && rawActiveFeats.length > 0) {
    const existingKeys = new Set(activeFeatEntities.map(e => `${e.featId}::${e.targetId || ''}`));
    const extraMigrated = migrateLegacyFeatStrings(rawActiveFeats);
    extraMigrated.forEach(e => {
      const key = `${e.featId}::${e.targetId || ''}`;
      if (!existingKeys.has(key)) {
        existingKeys.add(key);
        activeFeatEntities.push(e);
      }
    });
  }

  const activeFeats: string[] = [];
  let metamagicCount = 0;
  let itemCreationCount = 0;

  // Populate activeFeats strings from activeFeatEntities
  activeFeatEntities.forEach(entity => {
    const fId = entity.featId.toLowerCase();
    activeFeats.push(fId);
    activeFeats.push(fId.replace(/_/g, ' '));
    if (entity.targetId) {
      const t = entity.targetId.toLowerCase();
      activeFeats.push(`${fId} (${t})`);
      activeFeats.push(`${fId.replace(/_/g, ' ')} (${t})`);
    }
  });

  rawActiveFeats.forEach(f => {
    const rawLower = f.toLowerCase().trim();
    if (!activeFeats.includes(rawLower)) {
      activeFeats.push(rawLower);
    }

    const norm = normalizeFeatName(f);
    if (norm && !activeFeats.includes(norm)) {
      activeFeats.push(norm);
    }
  });

  // Metamagic and item creation counts
  activeFeats.forEach(f => {
    if (KNOWN_METAMAGIC_FEATS.has(f) || f.includes('metamagic')) {
      metamagicCount++;
    }
    if (KNOWN_ITEM_CREATION_FEATS.has(f) || f.includes('craft') || f.includes('scribe') || f.includes('brew') || f.includes('forge')) {
      itemCreationCount++;
    }
  });

  // Proficiency grants from entities
  activeFeatEntities.forEach(entity => {
    const id = entity.featId.toLowerCase();
    if (id === 'armor_proficiency_light') proficiencies.lightArmor = true;
    if (id === 'armor_proficiency_medium') {
      proficiencies.lightArmor = true;
      proficiencies.mediumArmor = true;
    }
    if (id === 'armor_proficiency_heavy') {
      proficiencies.lightArmor = true;
      proficiencies.mediumArmor = true;
      proficiencies.heavyArmor = true;
    }
    if (id === 'shield_proficiency') proficiencies.shields = true;
    if (id === 'tower_shield_proficiency') {
      proficiencies.shields = true;
      proficiencies.towerShield = true;
    }
    if (id === 'martial_weapon_proficiency') proficiencies.martialWeapons = true;
  });

  rawActiveFeats.forEach(f => {
    const rawLower = f.toLowerCase().trim();
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
  if (raceObj?.subtypes) {
    raceObj.subtypes.forEach(st => {
      const clean = st.toLowerCase().trim();
      if (clean && !raceSubtypes.includes(clean)) raceSubtypes.push(clean);
    });
  }
  if (raceObj?.subtype) {
    raceObj.subtype.split(',').forEach(st => {
      const clean = st.toLowerCase().trim();
      if (clean && !raceSubtypes.includes(clean)) raceSubtypes.push(clean);
    });
  }
  if (templateObj?.subtype) {
    templateObj.subtype.split(',').forEach(st => {
      const clean = st.toLowerCase().trim();
      if (clean && !raceSubtypes.includes(clean)) raceSubtypes.push(clean);
    });
  }
  const standardSubtypes = ['dragonblood', 'elf', 'dwarf', 'gnome', 'halfling', 'orc', 'goblinoid', 'shapechanger', 'human', 'humanoid'];
  for (const st of standardSubtypes) {
    if (hasSubtype(raceObj || selectedRace, st) && !raceSubtypes.includes(st)) {
      raceSubtypes.push(st);
    }
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

  const checkFeatures = [
    'turn_undead', 'rebuke_undead', 'turn_or_rebuke_undead',
    'wild_shape', 'sneak_attack', 'skirmish', 'evasion',
    'uncanny_dodge', 'improved_uncanny_dodge', 'bardic_music',
    'rage', 'flurry_of_blows', 'improved_unarmed_strike', 'ki_strike',
    'smite_evil', 'lay_on_hands', 'familiar', 'animal_companion'
  ];
  for (const feat of checkFeatures) {
    if (hasClassFeature(character, feat, classesData)) {
      specialFeatures.add(feat);
    }
  }
  if (raceName.includes('dragonborn') || raceName.includes('half-dragon') || classLevels['dragonfire adept']) {
    specialFeatures.add('breath_weapon');
  }
  if (
    activeFeats.includes('improved unarmed strike') ||
    activeFeatEntities.some(e => featNameToId(e.featId) === 'improved_unarmed_strike')
  ) {
    specialFeatures.add('improved_unarmed_strike');
  }

  return {
    stats,
    bab,
    baseSaves,
    characterLevel,
    classLevels,
    activeFeats,
    rawActiveFeats,
    activeFeatEntities,
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

const KNOWN_RACES = [
  'human', 'elf', 'dwarf', 'gnome', 'halfling', 'half-elf', 'half-orc',
  'warforged', 'shifter', 'changeling', 'kalashtar', 'goliath', 'orc',
  'kobold', 'dragonborn', 'illumian', 'drow', 'tiefling', 'aasimar', 'raptoran'
];

/**
 * Compiles an atomic prerequisite clause string into a structured FeatPrereqRule.
 */
export function compilePrerequisiteClause(rawClause: string): FeatPrereqRule {
  const clause = rawClause.trim();
  if (!clause || clause === '-' || clause === '—' || clause === 'None' || clause === 'none') {
    return { type: 'editorial', rawText: rawClause };
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
    return { type: 'editorial', rawText: rawClause };
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
      return {
        type: 'ability_score',
        stat: statKey,
        minValue: reqVal,
        rawText: rawClause
      };
    }
  }

  // 3. Base Attack Bonus (e.g. "BAB +1", "BAB +6", "Base attack bonus +4", "BAB 6+")
  const babMatch = clause.match(/\b(?:BAB|Base\s+attack\s+bonus)\s*\+?(\d+)\+?/i);
  if (babMatch) {
    const reqBab = parseInt(babMatch[1], 10);
    if (!isNaN(reqBab)) {
      return {
        type: 'bab',
        minValue: reqBab,
        rawText: rawClause
      };
    }
  }

  // 4. Base Save Requirements (e.g. "Base Fortitude save bonus +2.", "Base Reflex save +3", "Base Will save bonus +4", "Fortitude save bonus +2")
  const saveMatch = clause.match(
    /\b(?:Base\s+)?(Fortitude|Fort|Reflex|Ref|Will)\s+save(?:\s+bonus)?\s*\+?(\d+)\b/i
  );
  if (saveMatch) {
    const saveRaw = saveMatch[1].toLowerCase();
    const saveType: 'fort' | 'ref' | 'will' = saveRaw.startsWith('fort')
      ? 'fort'
      : saveRaw.startsWith('ref')
      ? 'ref'
      : 'will';
    const reqBonus = parseInt(saveMatch[2], 10);
    if (!isNaN(reqBonus)) {
      return {
        type: 'base_save',
        saveType,
        minValue: reqBonus,
        rawText: rawClause
      };
    }
  }

  // 5. Character Level / HD (e.g. "Character Level 6+", "Character level 6th", "HD 4", "Hit Dice 6+")
  const charLvlMatch = clause.match(
    /\b(?:Character\s+level|Hit\s+Dice|HD)\s*(\d+)(?:st|nd|rd|th|\+)?/i
  );
  if (charLvlMatch) {
    const reqLvl = parseInt(charLvlMatch[1], 10);
    if (!isNaN(reqLvl)) {
      return {
        type: 'character_level',
        minValue: reqLvl,
        rawText: rawClause
      };
    }
  }

  // 6. 1st Level Only
  if (
    lower.includes('1st level only') ||
    lower.includes('must be taken at 1st level') ||
    lower.includes('1st-level character only')
  ) {
    return {
      type: 'first_level_only',
      rawText: rawClause
    };
  }

  // 7. Skill Ranks (e.g. "Spellcraft 4 ranks", "Knowledge (religion) 4 ranks", "Ride 4 ranks", "Tumble 5 ranks")
  const skillMatch = clause.match(/([A-Za-z\s\(\)]+?)\s+(\d+)\s+ranks?/i);
  if (skillMatch) {
    const rawSkillName = skillMatch[1].trim();
    const reqRanks = parseInt(skillMatch[2], 10);
    const normSkill = normalizeSkillName(rawSkillName);
    if (!isNaN(reqRanks)) {
      return {
        type: 'skill_rank',
        skillName: normSkill,
        featureName: rawSkillName,
        minValue: reqRanks,
        rawText: rawClause
      };
    }
  }

  // 8. General Skill requirement without explicit number (e.g. "Ride skill")
  const simpleSkillMatch = clause.match(/([A-Za-z\s\(\)]+?)\s+skill\b/i);
  if (simpleSkillMatch) {
    const rawSkillName = simpleSkillMatch[1].trim();
    const normSkill = normalizeSkillName(rawSkillName);
    return {
      type: 'skill_rank',
      skillName: normSkill,
      featureName: rawSkillName,
      minValue: 1,
      rawText: rawClause
    };
  }

  // 9. Caster Level / Manifester Level (e.g. "Caster level 3rd", "Caster level 6th", "Manifester level 3rd")
  const clMatch = clause.match(/\b(Caster\s+level|Manifester\s+level)\s*(\d+)(?:st|nd|rd|th|\+)?/i);
  if (clMatch) {
    const reqCl = parseInt(clMatch[2], 10);
    if (!isNaN(reqCl)) {
      const isManifester = clMatch[1].toLowerCase().includes('manifester');
      return {
        type: isManifester ? 'manifester_level' : 'caster_level',
        minValue: reqCl,
        rawText: rawClause
      };
    }
  }

  // 10. Spellcasting Capability (e.g. "Ability to cast 3rd-level spells", "Ability to cast 1st-level arcane spells")
  const spellLvlMatch = clause.match(
    /Ability\s+to\s+cast\s+(\d+)(?:st|nd|rd|th)?-level\s+(?:(arcane|divine|psionic)\s+)?spells?/i
  );
  if (spellLvlMatch) {
    const reqSpellLvl = parseInt(spellLvlMatch[1], 10);
    const spellType = (spellLvlMatch[2]?.toLowerCase() || 'any') as 'arcane' | 'divine' | 'psionic' | 'any';
    return {
      type: 'spell_level',
      minValue: reqSpellLvl,
      spellType,
      rawText: rawClause
    };
  }

  // 11. Class Level (e.g. "Fighter level 4th", "Cleric level 3rd", "Wizard 5th", "Monk level 6th", "Sorcerer 1st level")
  const classLvlMatch = clause.match(
    /\b([A-Za-z\s]+?)\s+(?:level\s+)?(\d+)(?:st|nd|rd|th|\+)?(?:\s+level)?\b/i
  );
  if (classLvlMatch) {
    const candidateClass = classLvlMatch[1].trim().toLowerCase();
    const reqLvl = parseInt(classLvlMatch[2], 10);
    if (
      !candidateClass.includes('caster') &&
      !candidateClass.includes('character') &&
      !candidateClass.includes('manifester') &&
      !candidateClass.includes('ability') &&
      !candidateClass.includes('cast') &&
      !candidateClass.includes('spell') &&
      !STAT_SYNONYMS[candidateClass] &&
      !isNaN(reqLvl)
    ) {
      return {
        type: 'class_level',
        className: candidateClass,
        minValue: reqLvl,
        rawText: rawClause
      };
    }
  }

  if (lower.includes('ability to cast arcane spells') || lower.includes('cast arcane spells')) {
    return {
      type: 'spellcasting_type',
      spellType: 'arcane',
      minValue: 1,
      rawText: rawClause
    };
  }
  if (lower.includes('ability to cast divine spells') || lower.includes('cast divine spells')) {
    return {
      type: 'spellcasting_type',
      spellType: 'divine',
      minValue: 1,
      rawText: rawClause
    };
  }
  if (lower.includes('ability to cast spells') || lower.includes('spellcaster')) {
    return {
      type: 'spellcasting_type',
      spellType: 'any',
      minValue: 1,
      rawText: rawClause
    };
  }

  // 12. Class Features / Special Abilities
  if (
    lower.includes('turn or rebuke undead') ||
    lower.includes('turn/rebuke undead') ||
    lower.includes('turn undead') ||
    lower.includes('rebuke undead')
  ) {
    return {
      type: 'special_feature',
      featureName: 'turn_or_rebuke_undead',
      rawText: rawClause
    };
  }

  if (lower.includes('wild shape') || lower.includes('ability to use wild shape')) {
    return {
      type: 'special_feature',
      featureName: 'wild_shape',
      rawText: rawClause
    };
  }

  if (lower.includes('sneak attack')) {
    return {
      type: 'special_feature',
      featureName: 'sneak_attack',
      rawText: rawClause
    };
  }

  if (lower.includes('evasion')) {
    return {
      type: 'special_feature',
      featureName: 'evasion',
      rawText: rawClause
    };
  }

  if (lower.includes('bardic music')) {
    return {
      type: 'special_feature',
      featureName: 'bardic_music',
      rawText: rawClause
    };
  }

  if (lower.includes('flurry of blows')) {
    return {
      type: 'special_feature',
      featureName: 'flurry_of_blows',
      rawText: rawClause
    };
  }

  if (lower.includes('smite evil')) {
    return {
      type: 'special_feature',
      featureName: 'smite_evil',
      rawText: rawClause
    };
  }

  if (lower.includes('breath weapon')) {
    return {
      type: 'special_feature',
      featureName: 'breath_weapon',
      rawText: rawClause
    };
  }

  // 13. Metamagic / Item Creation Feat Counts
  if (lower.includes('two metamagic feats') || lower.includes('2 metamagic feats') || lower.includes('any two metamagic feats')) {
    return {
      type: 'metamagic_count',
      minValue: 2,
      rawText: rawClause
    };
  }
  if (lower.includes('any metamagic feat') || lower.includes('one metamagic feat')) {
    return {
      type: 'metamagic_count',
      minValue: 1,
      rawText: rawClause
    };
  }
  if (lower.includes('any item creation feat') || lower.includes('one item creation feat')) {
    return {
      type: 'item_creation_count',
      minValue: 1,
      rawText: rawClause
    };
  }

  // 14. Proficiencies
  if (lower.includes('armor proficiency (light)')) {
    return {
      type: 'proficiency',
      proficiencyType: 'light_armor',
      rawText: rawClause
    };
  }
  if (lower.includes('armor proficiency (medium)')) {
    return {
      type: 'proficiency',
      proficiencyType: 'medium_armor',
      rawText: rawClause
    };
  }
  if (lower.includes('armor proficiency (heavy)') || lower.includes('proficient with heavy armor')) {
    return {
      type: 'proficiency',
      proficiencyType: 'heavy_armor',
      rawText: rawClause
    };
  }
  if (lower.includes('shield proficiency') || lower.includes('proficient with shields')) {
    return {
      type: 'proficiency',
      proficiencyType: 'shields',
      rawText: rawClause
    };
  }
  if (lower.includes('tower shield proficiency')) {
    return {
      type: 'proficiency',
      proficiencyType: 'tower_shield',
      rawText: rawClause
    };
  }
  if (lower.includes('proficient with weapon') || lower.includes('weapon proficiency')) {
    return {
      type: 'proficiency',
      proficiencyType: 'weapon',
      rawText: rawClause
    };
  }

  // 15. Races & Subtypes
  for (const r of KNOWN_RACES) {
    const rRegex = new RegExp(`\\b${r}\\b`, 'i');
    if (rRegex.test(clause)) {
      return {
        type: 'race',
        raceName: r,
        rawText: rawClause
      };
    }
  }

  if (lower.includes('dragonblood subtype') || lower.includes('dragonblood')) {
    return {
      type: 'subtype',
      subtypeName: 'dragonblood',
      rawText: rawClause
    };
  }
  if (lower.includes('shapechanger subtype') || lower.includes('shapechanger')) {
    return {
      type: 'subtype',
      subtypeName: 'shapechanger',
      rawText: rawClause
    };
  }

  // 16. Alignment Requirements
  if (lower.includes('any evil alignment') || lower.includes('evil alignment')) {
    return { type: 'alignment', alignmentValue: 'evil', rawText: rawClause };
  }
  if (lower.includes('any good alignment') || lower.includes('good alignment')) {
    return { type: 'alignment', alignmentValue: 'good', rawText: rawClause };
  }
  if (lower.includes('any chaotic alignment') || lower.includes('chaotic alignment')) {
    return { type: 'alignment', alignmentValue: 'chaotic', rawText: rawClause };
  }
  if (lower.includes('any lawful alignment') || lower.includes('lawful alignment')) {
    return { type: 'alignment', alignmentValue: 'lawful', rawText: rawClause };
  }
  if (lower.includes('non-good')) {
    return { type: 'alignment', alignmentValue: 'non-good', rawText: rawClause };
  }
  if (lower.includes('non-lawful')) {
    return { type: 'alignment', alignmentValue: 'non-lawful', rawText: rawClause };
  }

  // 17. Size Requirements
  if (lower.includes('medium or larger')) {
    return { type: 'size', sizeValue: 'medium_or_larger', rawText: rawClause };
  }
  if (lower.includes('small or medium')) {
    return { type: 'size', sizeValue: 'small_or_medium', rawText: rawClause };
  }

  // 18. Feat Matching
  const parsedPrereq = parseFeatPrerequisiteClause(clause);
  if (parsedPrereq) {
    return {
      type: 'feat',
      featId: parsedPrereq.featId,
      targetCandidates: parsedPrereq.targetCandidates,
      requiresSameTarget: parsedPrereq.requiresSameTarget,
      rawText: rawClause
    };
  }

  const featId = featNameToId(clause) || lower;
  return {
    type: 'feat',
    featId,
    rawText: rawClause
  };
}

/**
 * Direct evaluation of a structured FeatPrereqRule with zero runtime regular expressions.
 */
export function evaluateStructuredRule(
  rule: FeatPrereqRule,
  context: CharacterPrereqContext,
  candidateTargetId?: string
): SinglePrereqEvaluation {
  switch (rule.type) {
    case 'editorial':
      return { satisfied: true, isEditorial: true };

    case 'ability_score': {
      const statKey = rule.stat!;
      const reqVal = rule.minValue!;
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

    case 'bab': {
      const reqBab = rule.minValue!;
      if (context.bab >= reqBab) {
        return { satisfied: true, satisfiedDescription: `BAB +${reqBab}` };
      }
      return {
        satisfied: false,
        unmetDescription: `Requires BAB +${reqBab} (current: +${context.bab})`
      };
    }

    case 'base_save': {
      const saveType = rule.saveType!;
      const reqBonus = rule.minValue!;
      const curBonus = context.baseSaves ? (context.baseSaves[saveType] || 0) : 0;
      const saveDisplayName = saveType === 'fort' ? 'Fortitude' : saveType === 'ref' ? 'Reflex' : 'Will';
      if (curBonus >= reqBonus) {
        return { satisfied: true, satisfiedDescription: `Base ${saveDisplayName} save +${reqBonus}` };
      }
      return {
        satisfied: false,
        unmetDescription: `Requires Base ${saveDisplayName} save +${reqBonus} (current: +${curBonus})`
      };
    }

    case 'character_level': {
      const reqLvl = rule.minValue!;
      if (context.characterLevel >= reqLvl) {
        return { satisfied: true, satisfiedDescription: `Character Level ${reqLvl}` };
      }
      return {
        satisfied: false,
        unmetDescription: `Requires Character Level ${reqLvl} (current: ${context.characterLevel})`
      };
    }

    case 'first_level_only': {
      if (context.characterLevel <= 1) {
        return { satisfied: true, satisfiedDescription: '1st level character' };
      }
      return {
        satisfied: false,
        unmetDescription: 'Must be selected at 1st level'
      };
    }

    case 'skill_rank': {
      const normSkill = rule.skillName!;
      const reqRanks = rule.minValue || 1;
      const currentRanks = context.skills[normSkill] || 0;
      const displayName = rule.featureName || (normSkill.charAt(0).toUpperCase() + normSkill.slice(1));
      if (currentRanks >= reqRanks) {
        return { satisfied: true, satisfiedDescription: `${displayName} ${reqRanks} ranks` };
      }
      return {
        satisfied: false,
        unmetDescription: `Requires ${displayName} ${reqRanks} ranks (current: ${currentRanks})`
      };
    }

    case 'caster_level': {
      const reqCl = rule.minValue!;
      if (context.casterLevel.max >= reqCl) {
        return { satisfied: true, satisfiedDescription: `Caster Level ${reqCl}` };
      }
      return {
        satisfied: false,
        unmetDescription: `Requires Caster Level ${reqCl} (current: ${context.casterLevel.max})`
      };
    }

    case 'manifester_level': {
      const reqCl = rule.minValue!;
      const curMl = context.casterLevel.psionic || context.casterLevel.max;
      if (curMl >= reqCl) {
        return { satisfied: true, satisfiedDescription: `Manifester Level ${reqCl}` };
      }
      return {
        satisfied: false,
        unmetDescription: `Requires Manifester Level ${reqCl} (current: ${curMl})`
      };
    }

    case 'spell_level': {
      const reqSpellLvl = rule.minValue!;
      const spellType = rule.spellType;
      let curMax = context.maxSpellLevel.overall;
      if (spellType === 'arcane') curMax = context.maxSpellLevel.arcane;
      else if (spellType === 'divine') curMax = context.maxSpellLevel.divine;
      else if (spellType === 'psionic') curMax = context.maxSpellLevel.psionic;

      if (curMax >= reqSpellLvl) {
        return { satisfied: true, satisfiedDescription: `Ability to cast ${reqSpellLvl}-level spells` };
      }
      const typeDisplay = spellType && spellType !== 'any' ? `${spellType} ` : '';
      return {
        satisfied: false,
        unmetDescription: `Requires ability to cast ${typeDisplay}level ${reqSpellLvl} spells (current max: ${curMax})`
      };
    }

    case 'spellcasting_type': {
      if (rule.spellType === 'arcane') {
        if (context.maxSpellLevel.arcane >= 1 || context.casterLevel.arcane >= 1) {
          return { satisfied: true, satisfiedDescription: 'Ability to cast arcane spells' };
        }
        return { satisfied: false, unmetDescription: 'Requires ability to cast arcane spells' };
      }
      if (rule.spellType === 'divine') {
        if (context.maxSpellLevel.divine >= 1 || context.casterLevel.divine >= 1) {
          return { satisfied: true, satisfiedDescription: 'Ability to cast divine spells' };
        }
        return { satisfied: false, unmetDescription: 'Requires ability to cast divine spells' };
      }
      if (context.casterLevel.max >= 1) {
        return { satisfied: true, satisfiedDescription: 'Ability to cast spells' };
      }
      return { satisfied: false, unmetDescription: 'Requires spellcasting ability' };
    }

    case 'class_level': {
      const candidateClass = rule.className!;
      const reqLvl = rule.minValue!;
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

    case 'special_feature': {
      const feature = rule.featureName!;
      const descMap: Record<string, { sat: string; unmet: string }> = {
        turn_or_rebuke_undead: { sat: 'Turn or rebuke undead', unmet: 'Requires ability to turn or rebuke undead' },
        wild_shape: { sat: 'Wild shape ability', unmet: 'Requires Wild Shape ability' },
        sneak_attack: { sat: 'Sneak attack feature', unmet: 'Requires Sneak Attack class feature' },
        evasion: { sat: 'Evasion', unmet: 'Requires Evasion feature' },
        bardic_music: { sat: 'Bardic music feature', unmet: 'Requires Bardic Music class feature' },
        flurry_of_blows: { sat: 'Flurry of blows', unmet: 'Requires Flurry of Blows feature' },
        smite_evil: { sat: 'Smite evil', unmet: 'Requires Smite Evil feature' },
        breath_weapon: { sat: 'Breath weapon', unmet: 'Requires Breath Weapon' }
      };
      const info = descMap[feature];
      if (context.specialFeatures.has(feature)) {
        return { satisfied: true, satisfiedDescription: info?.sat || rule.rawText };
      }
      return { satisfied: false, unmetDescription: info?.unmet || `Requires ${rule.rawText}` };
    }

    case 'metamagic_count': {
      const reqCount = rule.minValue || 1;
      if (context.metamagicCount >= reqCount) {
        return { satisfied: true, satisfiedDescription: rule.rawText };
      }
      if (reqCount === 1) {
        return { satisfied: false, unmetDescription: 'Requires at least 1 metamagic feat' };
      }
      return { satisfied: false, unmetDescription: `Requires ${reqCount} metamagic feats (current: ${context.metamagicCount})` };
    }

    case 'item_creation_count': {
      if (context.itemCreationCount >= (rule.minValue || 1)) {
        return { satisfied: true, satisfiedDescription: rule.rawText };
      }
      return { satisfied: false, unmetDescription: 'Requires at least 1 item creation feat' };
    }

    case 'proficiency': {
      const pType = rule.proficiencyType;
      if (pType === 'light_armor') {
        if (context.proficiencies.lightArmor || context.activeFeats.includes('armor proficiency (light)')) {
          return { satisfied: true, satisfiedDescription: 'Armor Proficiency (light)' };
        }
        return { satisfied: false, unmetDescription: 'Requires Armor Proficiency (light)' };
      }
      if (pType === 'medium_armor') {
        if (context.proficiencies.mediumArmor || context.activeFeats.includes('armor proficiency (medium)')) {
          return { satisfied: true, satisfiedDescription: 'Armor Proficiency (medium)' };
        }
        return { satisfied: false, unmetDescription: 'Requires Armor Proficiency (medium)' };
      }
      if (pType === 'heavy_armor') {
        if (context.proficiencies.heavyArmor || context.activeFeats.includes('armor proficiency (heavy)')) {
          return { satisfied: true, satisfiedDescription: 'Armor Proficiency (heavy)' };
        }
        return { satisfied: false, unmetDescription: 'Requires Armor Proficiency (heavy)' };
      }
      if (pType === 'shields') {
        if (context.proficiencies.shields || context.activeFeats.includes('shield proficiency')) {
          return { satisfied: true, satisfiedDescription: 'Shield Proficiency' };
        }
        return { satisfied: false, unmetDescription: 'Requires Shield Proficiency' };
      }
      if (pType === 'tower_shield') {
        if (context.proficiencies.towerShield || context.activeFeats.includes('tower shield proficiency')) {
          return { satisfied: true, satisfiedDescription: 'Tower Shield Proficiency' };
        }
        return { satisfied: false, unmetDescription: 'Requires Tower Shield Proficiency' };
      }
      if (pType === 'weapon') {
        if (context.proficiencies.simpleWeapons || context.proficiencies.martialWeapons) {
          return { satisfied: true, satisfiedDescription: 'Weapon Proficiency' };
        }
        return { satisfied: false, unmetDescription: 'Requires Weapon Proficiency' };
      }
      return { satisfied: true, satisfiedDescription: rule.rawText };
    }

    case 'race': {
      const r = rule.raceName!;
      if (context.race.includes(r) || context.raceSubtypes.includes(r)) {
        return { satisfied: true, satisfiedDescription: `Race: ${r}` };
      }
      return { satisfied: false, unmetDescription: `Requires Race: ${r.charAt(0).toUpperCase() + r.slice(1)}` };
    }

    case 'subtype': {
      const st = rule.subtypeName!;
      if (context.raceSubtypes.includes(st) || hasSubtype(context.race, st)) {
        return { satisfied: true, satisfiedDescription: `${st} subtype` };
      }
      return { satisfied: false, unmetDescription: `Requires ${st} subtype` };
    }

    case 'alignment': {
      const align = rule.alignmentValue;
      if (align === 'evil') {
        if (context.alignment.includes('evil')) return { satisfied: true, satisfiedDescription: 'Evil alignment' };
        return { satisfied: false, unmetDescription: 'Requires Evil alignment' };
      }
      if (align === 'good') {
        if (context.alignment.includes('good')) return { satisfied: true, satisfiedDescription: 'Good alignment' };
        return { satisfied: false, unmetDescription: 'Requires Good alignment' };
      }
      if (align === 'chaotic') {
        if (context.alignment.includes('chaotic')) return { satisfied: true, satisfiedDescription: 'Chaotic alignment' };
        return { satisfied: false, unmetDescription: 'Requires Chaotic alignment' };
      }
      if (align === 'lawful') {
        if (context.alignment.includes('lawful')) return { satisfied: true, satisfiedDescription: 'Lawful alignment' };
        return { satisfied: false, unmetDescription: 'Requires Lawful alignment' };
      }
      if (align === 'non-good') {
        if (!context.alignment.includes('good')) return { satisfied: true, satisfiedDescription: 'Non-good alignment' };
        return { satisfied: false, unmetDescription: 'Requires Non-Good alignment' };
      }
      if (align === 'non-lawful') {
        if (!context.alignment.includes('lawful')) return { satisfied: true, satisfiedDescription: 'Non-lawful alignment' };
        return { satisfied: false, unmetDescription: 'Requires Non-Lawful alignment' };
      }
      return { satisfied: true };
    }

    case 'size': {
      if (rule.sizeValue === 'medium_or_larger') {
        if (['medium', 'large', 'huge', 'gargantuan', 'colossal'].includes(context.size)) {
          return { satisfied: true, satisfiedDescription: 'Medium or larger size' };
        }
        return { satisfied: false, unmetDescription: 'Requires Medium or larger size' };
      }
      if (rule.sizeValue === 'small_or_medium') {
        if (['small', 'medium'].includes(context.size)) {
          return { satisfied: true, satisfiedDescription: 'Small or Medium size' };
        }
        return { satisfied: false, unmetDescription: 'Requires Small or Medium size' };
      }
      return { satisfied: true };
    }

    case 'feat': {
      const reqFeatId = rule.featId;
      const clause = rule.rawText;

      // Special case for Improved Unarmed Strike granted by Monk
      if (reqFeatId === 'improved_unarmed_strike' && context.specialFeatures.has('improved_unarmed_strike')) {
        return { satisfied: true, satisfiedDescription: 'Improved Unarmed Strike' };
      }

      if (reqFeatId) {
        const matchingEntities = context.activeFeatEntities.filter(
          entity => featNameToId(entity.featId) === reqFeatId
        );

        if (matchingEntities.length > 0) {
          if (rule.requiresSameTarget) {
            const effectiveTarget = candidateTargetId || context.candidateTargetId;
            if (effectiveTarget) {
              const hasTargetMatch = matchingEntities.some(entity =>
                matchesFeatTarget(entity.targetId, effectiveTarget)
              );
              if (hasTargetMatch) {
                return { satisfied: true, satisfiedDescription: `Feat: ${clause}` };
              }
              return {
                satisfied: false,
                unmetDescription: `Requires Feat: ${clause} (${effectiveTarget})`
              };
            }
            // If candidate target not specified, possession of the prerequisite feat for any target qualifies
            return { satisfied: true, satisfiedDescription: `Feat: ${clause}` };
          }

          if (rule.targetCandidates && rule.targetCandidates.length > 0) {
            const hasCandidateMatch = matchingEntities.some(entity =>
              rule.targetCandidates!.some(tc => matchesFeatTarget(entity.targetId, tc))
            );
            if (hasCandidateMatch) {
              return { satisfied: true, satisfiedDescription: `Feat: ${clause}` };
            }
            return {
              satisfied: false,
              unmetDescription: `Requires Feat: ${clause}`
            };
          }

          // Untargeted feat match
          return { satisfied: true, satisfiedDescription: `Feat: ${clause}` };
        }
      }

      // Fallback safety check for legacy raw strings or unparsed variants
      const normClause = normalizeFeatName(clause);
      const clauseClean = clause.toLowerCase().replace(/^(?:feat:|\+)/i, '').trim();
      const baseStripped = normClause
        .replace(/\s+(with|in|for)\s+(weapon|chosen weapon|selected weapon|chosen spell school|school|chosen skill|specified weapon|chosen deity)/gi, '')
        .trim();

      if ((normClause === 'improved unarmed strike' || baseStripped === 'improved unarmed strike') && context.specialFeatures.has('improved_unarmed_strike')) {
        return { satisfied: true, satisfiedDescription: 'Improved Unarmed Strike' };
      }

      const hasExact = context.activeFeats.includes(clauseClean) ||
                        context.activeFeats.includes(normClause) ||
                        context.activeFeats.includes(baseStripped);

      const hasBase = context.activeFeats.some(
        af => af === normClause ||
              af === baseStripped ||
              af.startsWith(normClause + ' ') ||
              af.startsWith(normClause + '(') ||
              af.startsWith(baseStripped + ' ') ||
              af.startsWith(baseStripped + '(')
      );

      if (hasExact || hasBase) {
        return { satisfied: true, satisfiedDescription: `Feat: ${clause}` };
      }

      return {
        satisfied: false,
        unmetDescription: `Requires Feat: ${clause}`
      };
    }
  }

  return { satisfied: true };
}

/**
 * Evaluates an individual atomic prerequisite clause via AST compilation.
 */
function evaluateAtomicPrerequisite(
  rawClause: string,
  context: CharacterPrereqContext,
  candidateTargetId?: string
): SinglePrereqEvaluation {
  const rule = compilePrerequisiteClause(rawClause);
  return evaluateStructuredRule(rule, context, candidateTargetId);
}

/**
 * Splits a compound clause on top-level 'or' outside of parentheses.
 */
export function splitTopLevelOr(clause: string): string[] | null {
  if (!clause.toLowerCase().includes(' or ') || clause.toLowerCase().includes('turn or rebuke')) {
    return null;
  }

  const branches: string[] = [];
  let current = '';
  let parenDepth = 0;
  let i = 0;

  while (i < clause.length) {
    const char = clause[i];
    if (char === '(') {
      parenDepth++;
      current += char;
      i++;
    } else if (char === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
      current += char;
      i++;
    } else if (parenDepth === 0 && /\s+or\s+/i.test(clause.slice(i))) {
      const match = clause.slice(i).match(/^(\s+or\s+)/i);
      if (match) {
        branches.push(current.trim());
        current = '';
        i += match[1].length;
        continue;
      }
      current += char;
      i++;
    } else {
      current += char;
      i++;
    }
  }

  if (branches.length > 0) {
    if (current.trim()) {
      branches.push(current.trim());
    }
    return branches;
  }

  return null;
}

/**
 * Global cache for compiled feat prerequisites to ensure AST compilation runs at most once per unique prerequisite string.
 */
export const COMPILED_PREREQS_CACHE = new Map<string, CompiledFeatPrerequisites>();

/**
 * Compiles a full prerequisite string into an AST consisting of structured clauses and rules.
 */
export function compileFeatPrerequisites(prereqText: string): CompiledFeatPrerequisites {
  if (!prereqText || !prereqText.trim()) {
    return { clauses: [], raw: '' };
  }

  const cached = COMPILED_PREREQS_CACHE.get(prereqText);
  if (cached) return cached;

  const rawClauses = splitPrerequisiteClauses(prereqText);
  const clauses: FeatPrereqClauseAST[] = [];

  for (const rawClause of rawClauses) {
    const branches = splitTopLevelOr(rawClause);
    if (branches && branches.length > 1) {
      clauses.push({
        operator: 'OR',
        rules: branches.map(b => compilePrerequisiteClause(b)),
        rawClause
      });
    } else {
      clauses.push({
        operator: 'AND',
        rules: [compilePrerequisiteClause(rawClause)],
        rawClause
      });
    }
  }

  const compiled: CompiledFeatPrerequisites = { clauses, raw: prereqText };
  COMPILED_PREREQS_CACHE.set(prereqText, compiled);
  return compiled;
}

/**
 * Evaluates a single compiled FeatPrereqClauseAST.
 */
export function evaluatePrereqClauseAST(
  clauseAST: FeatPrereqClauseAST,
  context: CharacterPrereqContext,
  candidateTargetId?: string
): SinglePrereqEvaluation {
  if (!clauseAST.rules || clauseAST.rules.length === 0) {
    return { satisfied: true, isEditorial: true };
  }

  if (clauseAST.operator === 'OR') {
    const branchResults = clauseAST.rules.map(r => evaluateStructuredRule(r, context, candidateTargetId));

    // If ANY branch is satisfied, the compound OR clause is satisfied!
    const satisfiedBranch = branchResults.find(r => r.satisfied);
    if (satisfiedBranch) {
      return {
        satisfied: true,
        satisfiedDescription: satisfiedBranch.satisfiedDescription || clauseAST.rawClause
      };
    }

    // None satisfied: construct an informative message
    const unmetDetails = branchResults
      .map(r => r.unmetDescription || '')
      .filter(Boolean)
      .join(' OR ');

    return {
      satisfied: false,
      unmetDescription: unmetDetails || `Requires: ${clauseAST.rawClause}`
    };
  }

  // AND operator
  let lastResult: SinglePrereqEvaluation = { satisfied: true };
  for (const rule of clauseAST.rules) {
    const res = evaluateStructuredRule(rule, context, candidateTargetId);
    if (res.isEditorial) continue;
    if (!res.satisfied) {
      return res;
    }
    lastResult = res;
  }
  return lastResult;
}

/**
 * Evaluates a single compound prerequisite clause which may contain top-level 'or'.
 */
export function evaluatePrerequisiteClause(
  rawClause: string,
  context: CharacterPrereqContext,
  candidateTargetId?: string
): SinglePrereqEvaluation {
  const clause = rawClause.trim();
  if (!clause) return { satisfied: true, isEditorial: true };

  const branches = splitTopLevelOr(clause);
  if (branches && branches.length > 1) {
    const clauseAST: FeatPrereqClauseAST = {
      operator: 'OR',
      rules: branches.map(b => compilePrerequisiteClause(b)),
      rawClause: clause
    };
    return evaluatePrereqClauseAST(clauseAST, context, candidateTargetId);
  }

  const rule = compilePrerequisiteClause(clause);
  return evaluateStructuredRule(rule, context, candidateTargetId);
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
  feat: FeatData | (FeatData & { targetId?: string }) | CharacterFeat,
  character: CharacterState,
  classesData: ClassData[] = [],
  racesData: RaceData[] = [],
  traitsData: TraitData[] = [],
  flawsData: FlawData[] = [],
  templatesData: TemplateData[] = [],
  candidateTargetId?: string
): FeatPrereqValidationResult {
  const target = candidateTargetId || (feat as any).targetId;
  const rawPrerequisites = (feat as FeatData).prerequisites;

  if (!rawPrerequisites || !rawPrerequisites.trim()) {
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

  return evaluateFeatPrerequisitesWithContext(feat, context, target);
}

/**
 * Evaluates feat prerequisites using a prebuilt character context for maximum batch performance.
 */
export function evaluateFeatPrerequisitesWithContext(
  feat: FeatData | (FeatData & { targetId?: string }) | CharacterFeat,
  context: CharacterPrereqContext,
  candidateTargetId?: string
): FeatPrereqValidationResult {
  const rawPrerequisites = (feat as FeatData).prerequisites;
  if (!rawPrerequisites || !rawPrerequisites.trim()) {
    return {
      isQualified: true,
      unmetPrereqs: [],
      satisfiedPrereqs: [],
      rawPrerequisites: null
    };
  }

  const target = candidateTargetId || (feat as any).targetId || context.candidateTargetId;
  const compiled = (feat as FeatData).compiledPrerequisites || compileFeatPrerequisites(rawPrerequisites);
  if (!(feat as FeatData).compiledPrerequisites && typeof feat === 'object' && feat !== null) {
    (feat as FeatData).compiledPrerequisites = compiled;
  }

  const unmetPrereqs: string[] = [];
  const satisfiedPrereqs: string[] = [];

  for (const clauseAST of compiled.clauses) {
    const result = evaluatePrereqClauseAST(clauseAST, context, target);
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

function isPointerDesc(desc?: string): boolean {
  if (!desc) return true;
  const clean = desc.replace(/^:\s*/, '').trim().toLowerCase();
  return (
    clean === '' ||
    clean === 'no description available.' ||
    clean === 'see text' ||
    clean.startsWith('-see ') ||
    clean.startsWith('(see ')
  );
}

function isPointerPrereq(prereq?: string): boolean {
  if (!prereq) return true;
  const clean = prereq.trim().toLowerCase();
  return (
    clean === '' ||
    clean === 'none' ||
    clean === '-' ||
    clean === '—' ||
    clean.startsWith('(see ') ||
    clean.startsWith('-see ') ||
    clean.startsWith('see ')
  );
}

function cleanDescText(desc?: string): string {
  if (!desc) return '';
  let cleaned = desc.replace(/^:\s*/, '').trim();
  if (cleaned.length > 0 && !/[.!?]$/.test(cleaned)) {
    cleaned += '.';
  }
  return cleaned;
}

function selectOrMergeDescriptions(desc1?: string, desc2?: string): string {
  const d1 = cleanDescText(desc1);
  const d2 = cleanDescText(desc2);

  if (isPointerDesc(d1) && isPointerDesc(d2)) return d1 || d2 || '';
  if (isPointerDesc(d1)) return d2;
  if (isPointerDesc(d2)) return d1;

  if (d1.toLowerCase() === d2.toLowerCase()) return d1;

  const d1Lower = d1.toLowerCase();
  const d2Lower = d2.toLowerCase();

  // If one contains the other
  if (d1Lower.includes(d2Lower.replace(/\.$/, ''))) return d1;
  if (d2Lower.includes(d1Lower.replace(/\.$/, ''))) return d2;

  // Clinging Breath special case
  if (
    (d1Lower.includes('continues to affect') && d2Lower.includes('1 round later')) ||
    (d2Lower.includes('continues to affect') && d1Lower.includes('1 round later'))
  ) {
    return 'Your breath weapon continues to affect targets after you breathe, dealing extra damage 1 round later.';
  }

  // Tunnel Fighting special case (ignore dataset copy-paste error where PH had Goad's description)
  if (d1Lower.includes('squeezing')) return d1;
  if (d2Lower.includes('squeezing')) return d2;

  // Check if one is a brief generic summary (<= 45 chars) while the other has detailed gameplay mechanics
  if (d1.length <= 45 && d2.length > 55) return d2;
  if (d2.length <= 45 && d1.length > 55) return d1;

  // Otherwise, choose the longer, more descriptive one
  return d1.length >= d2.length ? d1 : d2;
}

/**
 * Aggregates and deduplicates cross-reference and multi-source feat entries.
 * Merges dashed pointer records (e.g. "-- Improved Toughness --" from PH) and
 * edition/variant aliases into their canonical counterparts (e.g. "Improved Toughness" from MM4)
 * while collecting all sourcebooks into feat.sources and retaining the richest rules descriptions.
 */
export function aggregateAndDeduplicateFeats(feats: FeatData[]): FeatData[] {
  if (!feats || feats.length === 0) return [];

  const map = new Map<string, { canonical: FeatData; candidates: FeatData[] }>();

  for (const feat of feats) {
    // Strip leading/trailing hyphens, dashes, and whitespace
    const rawClean = feat.name.replace(/^[\s\-–—]+|[\s\-–—]+$/g, '').trim();
    const cleanLower = rawClean.toLowerCase();
    const canonicalKey = FEAT_EDITION_ALIASES[cleanLower] || cleanLower;

    if (!map.has(canonicalKey)) {
      map.set(canonicalKey, {
        canonical: {
          ...feat,
          name: rawClean,
          sources: feat.sources && feat.sources.length > 0 
            ? [...feat.sources] 
            : [feat.source || 'PHB']
        },
        candidates: [feat]
      });
    } else {
      const entry = map.get(canonicalKey)!;
      entry.candidates.push(feat);

      // Collect sources
      const existingSources = entry.canonical.sources || [];
      if (feat.source && !existingSources.includes(feat.source)) {
        existingSources.push(feat.source);
      }
      if (feat.sources) {
        feat.sources.forEach(s => {
          if (s && !existingSources.includes(s)) {
            existingSources.push(s);
          }
        });
      }
      entry.canonical.sources = existingSources;

      // 1. Pick the best prerequisite (never keep a '(See ...)' pointer if a real prerequisite exists)
      const curIsPointer = isPointerPrereq(entry.canonical.prerequisites);
      const candIsPointer = isPointerPrereq(feat.prerequisites);

      let bestPrereq = entry.canonical.prerequisites;
      if (curIsPointer && !candIsPointer) {
        bestPrereq = feat.prerequisites;
      }

      // 2. Intelligently merge/select descriptions
      const bestDesc = selectOrMergeDescriptions(entry.canonical.description, feat.description);

      // 3. ID and primary display name (prefer non-dashed, non-aliased entry name and ID)
      const curIsDashed = /^[\s\-–—]+/.test(entry.canonical.id || entry.canonical.name);
      const candIsDashed = /^[\s\-–—]+/.test(feat.id || feat.name);
      const curIsAliased = Object.prototype.hasOwnProperty.call(FEAT_EDITION_ALIASES, entry.canonical.name.toLowerCase());
      const candIsAliased = Object.prototype.hasOwnProperty.call(FEAT_EDITION_ALIASES, cleanLower);

      const curIsDashedOrAliased = curIsDashed || curIsAliased;
      const candIsDashedOrAliased = candIsDashed || candIsAliased;

      let bestId = entry.canonical.id;
      let bestName = entry.canonical.name;

      if (curIsDashedOrAliased && !candIsDashedOrAliased) {
        bestId = feat.id;
        bestName = rawClean;
      } else if (!curIsDashedOrAliased) {
        bestName = entry.canonical.name;
      }

      entry.canonical = {
        ...entry.canonical,
        id: bestId,
        name: bestName,
        prerequisites: bestPrereq,
        description: bestDesc,
        sources: existingSources
      };
    }
  }

  return Array.from(map.values()).map(e => e.canonical);
}


