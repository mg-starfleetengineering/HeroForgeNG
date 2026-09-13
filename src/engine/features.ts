import { RaceData, ClassData, CharacterState } from '../types/character';

/**
 * Normalizes a tag, trait, subtype, or class feature identifier.
 * Converts to lowercase and replaces spaces and hyphens with underscores.
 */
export function normalizeTag(tag: string): string {
  return (tag || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
}

/**
 * Checks whether a given race (as a RaceData object or race name/id string)
 * possesses a specific racial trait (e.g. 'bonus_feat', 'bonus_skill_points',
 * 'stability', 'dwarf_speed', 'powerful_build', 'low_light_vision', 'darkvision').
 */
export function hasRacialTrait(
  race: RaceData | string | undefined | null,
  trait: string
): boolean {
  if (!race || !trait) return false;
  const normTrait = normalizeTag(trait);

  // 1. If race is a RaceData object
  if (typeof race === 'object') {
    if (Array.isArray(race.traits) && race.traits.length > 0) {
      if (race.traits.some(t => normalizeTag(t) === normTrait)) {
        return true;
      }
    }

    // Property-based checks on RaceData
    if (normTrait === 'bonus_feat') {
      if (race.bonusFeats && race.bonusFeats.toLowerCase().includes('bonus feat')) {
        return true;
      }
    }

    if (normTrait === 'stability') {
      if (race.specialAbilities && race.specialAbilities.toLowerCase().includes('stability')) {
        return true;
      }
    }

    if (normTrait === 'powerful_build') {
      const ab = (race.specialAbilities || '').toLowerCase();
      const bf = (race.bonusFeats || '').toLowerCase();
      if (ab.includes('powerful build') || bf.includes('powerful build')) {
        return true;
      }
    }

    if (normTrait === 'low_light_vision') {
      const ab = (race.specialAbilities || '').toLowerCase();
      if (ab.includes('low-light') || ab.includes('low light')) {
        return true;
      }
    }

    if (normTrait === 'darkvision') {
      const ab = (race.specialAbilities || '').toLowerCase();
      if (ab.includes('darkvision')) {
        return true;
      }
    }

    // Fall back to name/id resolution
    const identifier = race.name || race.id || '';
    if (identifier) {
      return checkCanonicalTrait(identifier, normTrait);
    }
    return false;
  }

  // 2. If race is a string (name or id)
  return checkCanonicalTrait(race, normTrait);
}

function checkCanonicalTrait(nameOrId: string, normTrait: string): boolean {
  const rLower = (nameOrId || '').toLowerCase().trim();
  if (!rLower) return false;

  switch (normTrait) {
    case 'bonus_feat':
      return (
        (rLower.includes('human') && !rLower.includes('half')) ||
        rLower.includes('strongheart') ||
        rLower.includes('azurin') ||
        rLower.includes('karsite')
      );

    case 'bonus_skill_points':
      return (
        rLower.includes('human') &&
        !rLower.includes('half') &&
        !rLower.includes('azurin') &&
        !rLower.includes('karsite')
      );

    case 'stability':
      return rLower.includes('dwarf');

    case 'dwarf_speed':
      return rLower.includes('dwarf');

    case 'powerful_build':
      return rLower.includes('goliath') || rLower.includes('half-giant') || rLower.includes('half_giant');

    case 'low_light_vision':
      return (
        rLower.includes('elf') ||
        rLower.includes('gnome') ||
        rLower.includes('half-elf') ||
        rLower.includes('half_elf') ||
        rLower.includes('catfolk') ||
        rLower.includes('raptoran')
      );

    case 'darkvision':
      return (
        rLower.includes('dwarf') ||
        rLower.includes('half-orc') ||
        rLower.includes('half_orc') ||
        rLower.includes('orc') ||
        rLower.includes('drow') ||
        rLower.includes('duergar') ||
        rLower.includes('svirfneblin') ||
        rLower.includes('kobold') ||
        rLower.includes('tiefling') ||
        rLower.includes('aasimar')
      );

    default:
      return false;
  }
}

/**
 * Checks whether a given race (as a RaceData object or race name/id string)
 * possesses a specific creature subtype (e.g. 'dragonblood', 'orc', 'elf',
 * 'dwarf', 'goblinoid', 'shapechanger', 'humanoid').
 */
export function hasSubtype(
  race: RaceData | string | undefined | null,
  subtype: string
): boolean {
  if (!race || !subtype) return false;
  const normSt = normalizeTag(subtype);

  if (typeof race === 'object') {
    // 1. Check structured subtypes array
    if (Array.isArray(race.subtypes) && race.subtypes.length > 0) {
      if (race.subtypes.some(s => normalizeTag(s) === normSt)) {
        return true;
      }
    }

    // 2. Check comma-separated subtype string
    if (race.subtype) {
      const parts = race.subtype.split(',').map(s => normalizeTag(s));
      if (parts.includes(normSt)) {
        return true;
      }
    }

    // 3. Humanoid type check
    if (normSt === 'humanoid' && race.type && race.type.toLowerCase().includes('humanoid')) {
      return true;
    }

    // 4. Fallback to name/id
    const identifier = race.name || race.id || '';
    if (identifier) {
      return checkCanonicalSubtype(identifier, normSt);
    }
    return false;
  }

  // If string
  return checkCanonicalSubtype(race, normSt);
}

function checkCanonicalSubtype(nameOrId: string, normSt: string): boolean {
  const rLower = (nameOrId || '').toLowerCase().trim();
  if (!rLower) return false;

  switch (normSt) {
    case 'humanoid':
      return (
        rLower.includes('human') ||
        rLower.includes('elf') ||
        rLower.includes('dwarf') ||
        rLower.includes('gnome') ||
        rLower.includes('halfling') ||
        rLower.includes('orc') ||
        rLower.includes('goblin') ||
        rLower.includes('kobold')
      );

    case 'dragonblood':
      return (
        rLower.includes('dragon') ||
        rLower.includes('kobold') ||
        rLower.includes('spellscale') ||
        rLower.includes('dragonborn') ||
        rLower.includes('silverbrow') ||
        rLower.includes('fireblood') ||
        rLower.includes('frostblood') ||
        rLower.includes('sunscorch')
      );

    case 'dwarf':
      return rLower.includes('dwarf');

    case 'elf':
      return rLower.includes('elf') || rLower.includes('drow') || rLower.includes('eladrin');

    case 'orc':
      return rLower.includes('orc');

    case 'gnome':
      return rLower.includes('gnome');

    case 'halfling':
      return rLower.includes('halfling');

    case 'goblinoid':
      return rLower.includes('goblin') || rLower.includes('hobgoblin') || rLower.includes('bugbear');

    case 'shapechanger':
      return rLower.includes('shifter') || rLower.includes('changeling');

    case 'human':
      return rLower.includes('human') && !rLower.includes('monstrous');

    default:
      return false;
  }
}

/**
 * Checks whether a character has a specific class feature, taking into account
 * character level progression, class-specific level prerequisites, and active state overrides.
 */
export function hasClassFeature(
  character: CharacterState | undefined | null,
  feature: string,
  classesData?: ClassData[]
): boolean {
  if (!character || !feature) return false;
  const normFeat = normalizeTag(feature);

  // 1. Check explicit character overrides / active states
  if (normFeat === 'wild_shape') {
    if (character.wildShape?.isActive || Boolean(character.wildShape?.selectedFormId)) {
      return true;
    }
  }

  if (normFeat === 'familiar') {
    if (character.familiar?.hasFamiliar || Boolean(character.familiar?.selectedFamiliarId)) {
      return true;
    }
  }

  if (normFeat === 'animal_companion') {
    if (character.animalCompanion?.hasCompanion || Boolean(character.animalCompanion?.selectedCompanionId)) {
      return true;
    }
  }

  // 2. Aggregate class levels
  const classLevels: Record<string, number> = {};
  for (const lvl of character.levelProgression || []) {
    if (lvl.primaryClass) {
      const key = normalizeTag(lvl.primaryClass);
      classLevels[key] = (classLevels[key] || 0) + 1;
    }
    if (lvl.secondaryClass) {
      const key = normalizeTag(lvl.secondaryClass);
      classLevels[key] = (classLevels[key] || 0) + 1;
    }
  }

  // Helper to check level in any matching class key
  const getLevel = (...classKeys: string[]): number => {
    let sum = 0;
    for (const ck of classKeys) {
      const normCk = normalizeTag(ck);
      sum += classLevels[normCk] || 0;
    }
    return sum;
  };

  // 3. Level-dependent feature rules in D&D 3.5e
  switch (normFeat) {
    case 'turn_undead':
    case 'rebuke_undead':
    case 'turn_or_rebuke_undead': {
      if (getLevel('cleric') >= 1) return true;
      if (getLevel('paladin') >= 4) return true;
      const turnClasses = ['radiant_servant', 'radiant_servant_of_pelor', 'knight_of_the_raven', 'sacred_exorcist', 'ur_priest'];
      if (turnClasses.some(c => getLevel(c) >= 1)) return true;
      break;
    }

    case 'wild_shape': {
      if (getLevel('druid') >= 5) return true;
      const wsClasses = ['master_of_many_forms', 'lion_of_talisid', 'planar_shepherd'];
      if (wsClasses.some(c => getLevel(c) >= 1)) return true;
      break;
    }

    case 'sneak_attack': {
      if (getLevel('rogue', 'scout', 'assassin', 'ninja') >= 1) return true;
      if (getLevel('blackguard') >= 4) return true;
      const saClasses = ['spellwarp_sniper', 'nightsong_enforcer', 'daggerspell_mage', 'daggerspell_scoundrel', 'guild_thief', 'dread_commando'];
      if (saClasses.some(c => getLevel(c) >= 1)) return true;
      break;
    }

    case 'skirmish': {
      if (getLevel('scout') >= 1) return true;
      break;
    }

    case 'evasion': {
      if (getLevel('rogue', 'monk') >= 2) return true;
      if (getLevel('scout') >= 5) return true;
      if (getLevel('ninja', 'shadowdancer') >= 2) return true;
      break;
    }

    case 'rage': {
      if (getLevel('barbarian') >= 1) return true;
      if (getLevel('frenzied_berserker', 'berserker') >= 1) return true;
      break;
    }

    case 'fast_movement': {
      if (getLevel('barbarian') >= 1) return true;
      if (getLevel('monk', 'scout') >= 3) return true;
      break;
    }

    case 'flurry_of_blows': {
      if (getLevel('monk', 'shou_disciple') >= 1) return true;
      break;
    }

    case 'improved_unarmed_strike': {
      if (getLevel('monk') >= 1) return true;
      break;
    }

    case 'ki_strike': {
      if (getLevel('monk') >= 4) return true;
      break;
    }

    case 'smite_evil': {
      if (getLevel('paladin') >= 1) return true;
      break;
    }

    case 'lay_on_hands': {
      if (getLevel('paladin') >= 2) return true;
      break;
    }

    case 'bardic_music': {
      if (getLevel('bard') >= 1) return true;
      break;
    }

    case 'uncanny_dodge': {
      if (getLevel('barbarian') >= 2) return true;
      if (getLevel('rogue') >= 5) return true;
      if (getLevel('scout') >= 4) return true;
      break;
    }

    case 'improved_uncanny_dodge': {
      if (getLevel('barbarian') >= 5) return true;
      if (getLevel('rogue') >= 10) return true;
      break;
    }

    case 'familiar': {
      if (getLevel('wizard', 'sorcerer', 'duskblade', 'wu_jen') >= 1) return true;
      if (getLevel('hexblade') >= 4) return true;
      const famClasses = ['arcane_trickster', 'archmage', 'eldritch_knight'];
      if (famClasses.some(c => getLevel(c) >= 1)) return true;
      break;
    }

    case 'animal_companion': {
      if (getLevel('druid', 'beastmaster') >= 1) return true;
      if (getLevel('ranger') >= 4) return true;
      const acClasses = ['lion_of_talisid', 'wavekeeper', 'wildrunner'];
      if (acClasses.some(c => getLevel(c) >= 1)) return true;
      break;
    }
  }

  // 4. If classesData is available, check class features with level thresholds
  if (classesData && classesData.length > 0) {
    for (const [clsKey, lvl] of Object.entries(classLevels)) {
      if (lvl <= 0) continue;
      const classObj = classesData.find(
        c => (c.id && normalizeTag(c.id) === clsKey) || normalizeTag(c.name) === clsKey
      );
      if (!classObj?.features?.some(f => normalizeTag(f) === normFeat)) {
        continue;
      }

      // Check level requirements for features that aren't granted at level 1
      const cId = normalizeTag(classObj.id || classObj.name);
      if (normFeat === 'turn_undead' && cId === 'paladin' && lvl < 4) continue;
      if (normFeat === 'wild_shape' && cId === 'druid' && lvl < 5) continue;
      if (normFeat === 'animal_companion' && cId === 'ranger' && lvl < 4) continue;
      if (normFeat === 'evasion' && (cId === 'rogue' || cId === 'monk') && lvl < 2) continue;
      if (normFeat === 'evasion' && cId === 'scout' && lvl < 5) continue;
      if (normFeat === 'familiar' && cId === 'hexblade' && lvl < 4) continue;

      return true;
    }
  }

  return false;
}
