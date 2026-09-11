import { CharacterState, ClassData, LevelProgression, StatType, SkillTrickData } from '../types/character';

export interface SkillDefinition {
  name: string;
  keyAbility: StatType;
}

export const ALL_SKILLS: SkillDefinition[] = [
  { name: 'Appraise', keyAbility: 'int' },
  { name: 'Autohypnosis', keyAbility: 'wis' },
  { name: 'Balance', keyAbility: 'dex' },
  { name: 'Bluff', keyAbility: 'cha' },
  { name: 'Climb', keyAbility: 'str' },
  { name: 'Concentration', keyAbility: 'con' },
  { name: 'Craft (Alchemy)', keyAbility: 'int' },
  { name: 'Craft (Armorsmithing)', keyAbility: 'int' },
  { name: 'Craft (Weaponsmithing)', keyAbility: 'int' },
  { name: 'Decipher Script', keyAbility: 'int' },
  { name: 'Diplomacy', keyAbility: 'cha' },
  { name: 'Disable Device', keyAbility: 'int' },
  { name: 'Disguise', keyAbility: 'cha' },
  { name: 'Escape Artist', keyAbility: 'dex' },
  { name: 'Forgery', keyAbility: 'int' },
  { name: 'Gather Information', keyAbility: 'cha' },
  { name: 'Handle Animal', keyAbility: 'cha' },
  { name: 'Heal', keyAbility: 'wis' },
  { name: 'Hide', keyAbility: 'dex' },
  { name: 'Intimidate', keyAbility: 'cha' },
  { name: 'Jump', keyAbility: 'str' },
  { name: 'Knowledge (Arcana)', keyAbility: 'int' },
  { name: 'Knowledge (Dungeoneering)', keyAbility: 'int' },
  { name: 'Knowledge (Local)', keyAbility: 'int' },
  { name: 'Knowledge (Nature)', keyAbility: 'int' },
  { name: 'Knowledge (Religion)', keyAbility: 'int' },
  { name: 'Knowledge (The Planes)', keyAbility: 'int' },
  { name: 'Listen', keyAbility: 'wis' },
  { name: 'Move Silently', keyAbility: 'dex' },
  { name: 'Open Lock', keyAbility: 'dex' },
  { name: 'Perform (Oratory)', keyAbility: 'cha' },
  { name: 'Ride', keyAbility: 'dex' },
  { name: 'Search', keyAbility: 'int' },
  { name: 'Sense Motive', keyAbility: 'wis' },
  { name: 'Sleight of Hand', keyAbility: 'dex' },
  { name: 'Spellcraft', keyAbility: 'int' },
  { name: 'Spot', keyAbility: 'wis' },
  { name: 'Survival', keyAbility: 'wis' },
  { name: 'Swim', keyAbility: 'str' },
  { name: 'Tumble', keyAbility: 'dex' },
  { name: 'Use Magic Device', keyAbility: 'cha' },
  { name: 'Use Rope', keyAbility: 'dex' }
];

export const PERCEPTION_SKILL: SkillDefinition = { name: 'Perception', keyAbility: 'wis' };

export function getAvailableSkills(usePathfinderPerception: boolean = false): SkillDefinition[] {
  if (!usePathfinderPerception) {
    return ALL_SKILLS;
  }
  const filtered = ALL_SKILLS.filter(s => s.name !== 'Spot' && s.name !== 'Listen' && s.name !== 'Search');
  const result = [...filtered, PERCEPTION_SKILL];
  result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}

export function calculateTotalSkillPoints(
  levelProgression: LevelProgression[],
  classDatabase: ClassData[],
  intMod: number,
  isHuman: boolean = false
): number {
  let totalPts = 0;

  levelProgression.forEach((lvl, idx) => {
    if (!lvl.primaryClass) return;
    const clsObj = classDatabase.find(c => c.name === lvl.primaryClass);
    let ptsPerLvl = clsObj ? clsObj.skillPoints : 2;

    if (lvl.secondaryClass) {
      const cls2Obj = classDatabase.find(c => c.name === lvl.secondaryClass);
      if (cls2Obj) ptsPerLvl = Math.max(ptsPerLvl, cls2Obj.skillPoints);
    }

    let gained = Math.max(1, ptsPerLvl + intMod);
    if (isHuman) gained += 1;

    if (idx === 0) {
      totalPts += gained * 4;
    } else {
      totalPts += gained;
    }
  });

  return totalPts;
}

export function calculateSpentSkillPoints(
  skillRanks: Record<string, number> = {},
  levelProgression: LevelProgression[] = [],
  classDatabase: ClassData[] = [],
  usePathfinderPerception: boolean = false,
  selectedSkillTricks: string[] = []
): number {
  let spentPts = 0;
  const activeSkillNames = new Set(getAvailableSkills(usePathfinderPerception).map(s => s.name));

  for (const [sName, ranks] of Object.entries(skillRanks)) {
    if (!ranks || ranks <= 0) continue;
    if (!activeSkillNames.has(sName)) continue;
    const isClass = isClassSkillForCharacter(sName, levelProgression, classDatabase);
    // In D&D 3.5e: Class skills cost 1pt per rank. Cross-class skills cost 2pts per rank (1pt per 0.5 rank).
    spentPts += isClass ? ranks : ranks * 2;
  }

  // Deduct 2 skill points per selected skill trick
  spentPts += (selectedSkillTricks?.length || 0) * 2;

  return spentPts;
}

export function isClassSkillForCharacter(
  skillName: string,
  levelProgression: LevelProgression[] = [],
  classDatabase: ClassData[] = []
): boolean {
  if (skillName.toLowerCase() === 'perception') {
    return (
      isClassSkillForCharacter('Spot', levelProgression, classDatabase) ||
      isClassSkillForCharacter('Listen', levelProgression, classDatabase) ||
      isClassSkillForCharacter('Search', levelProgression, classDatabase)
    );
  }

  const activeClasses = new Set<string>();
  levelProgression.forEach(lvl => {
    if (lvl.primaryClass) activeClasses.add(lvl.primaryClass.toLowerCase());
    if (lvl.secondaryClass) activeClasses.add(lvl.secondaryClass.toLowerCase());
  });

  for (const clsName of activeClasses) {
    const clsObj = classDatabase.find(c => (c.id && c.id.toLowerCase() === clsName) || c.name.toLowerCase() === clsName);
    if (clsObj && clsObj.classSkills) {
      const match = clsObj.classSkills.some(s => {
        const sClean = s.toLowerCase().trim();
        const targetClean = skillName.toLowerCase().trim();
        if (sClean === targetClean) return true;

        // Group skills: only when the class grants the entire group (e.g. "Knowledge", "Knowledge (all)", "Knowledge (any)")
        const groups = ['craft', 'knowledge', 'perform', 'profession'];
        for (const group of groups) {
          if ((sClean === group || sClean === `${group} (all)` || sClean === `${group} (any)`) && targetClean.startsWith(group)) {
            return true;
          }
        }

        // Compare after stripping punctuation and whitespace
        if (sClean.replace(/[^a-z0-9]/g, '') === targetClean.replace(/[^a-z0-9]/g, '')) return true;

        return false;
      });
      if (match) return true;
    }
  }

  return false;
}

export function convertSkillsToPerception(character: CharacterState): CharacterState {
  const ranks = character.skillRanks || {};
  const spotRanks = ranks['Spot'] || 0;
  const listenRanks = ranks['Listen'] || 0;
  const searchRanks = ranks['Search'] || 0;

  const maxRank = Math.max(spotRanks, listenRanks, searchRanks);

  const prePerceptionSkillsCache = {
    spotRanks,
    listenRanks,
    searchRanks
  };

  const updatedRanks = { ...ranks };
  delete updatedRanks['Spot'];
  delete updatedRanks['Listen'];
  delete updatedRanks['Search'];

  if (maxRank > 0) {
    updatedRanks['Perception'] = maxRank;
  } else {
    delete updatedRanks['Perception'];
  }

  return {
    ...character,
    usePathfinderPerception: true,
    prePerceptionSkillsCache,
    skillRanks: updatedRanks
  };
}

export function revertPerceptionToSkills(character: CharacterState): CharacterState {
  const ranks = character.skillRanks || {};
  const perceptionRanks = ranks['Perception'] || 0;
  const cache = character.prePerceptionSkillsCache;

  const updatedRanks = { ...ranks };
  delete updatedRanks['Perception'];

  if (cache) {
    const originalMax = Math.max(cache.spotRanks, cache.listenRanks, cache.searchRanks);
    const addedRanks = Math.max(0, perceptionRanks - originalMax);

    updatedRanks['Spot'] = cache.spotRanks + addedRanks;
    updatedRanks['Listen'] = cache.listenRanks + addedRanks;
    updatedRanks['Search'] = cache.searchRanks + addedRanks;
  } else {
    if (perceptionRanks > 0) {
      updatedRanks['Spot'] = perceptionRanks;
      updatedRanks['Listen'] = perceptionRanks;
      updatedRanks['Search'] = perceptionRanks;
    }
  }

  const updatedChar: CharacterState = {
    ...character,
    usePathfinderPerception: false,
    skillRanks: updatedRanks
  };

  delete updatedChar.prePerceptionSkillsCache;
  return updatedChar;
}

export function calculatePerceptionStats(
  character: CharacterState,
  classDatabase: ClassData[] = [],
  wisMod: number = 0
): {
  ranks: number;
  wisMod: number;
  isClass: boolean;
  alertnessBonus: number;
  totalBonus: number;
} {
  const ranks = (character.skillRanks || {})['Perception'] || 0;
  const isClass = isClassSkillForCharacter('Perception', character.levelProgression, classDatabase);

  const selectedFeats = character.selectedFeats || [];
  const hasAlertness = selectedFeats.some(f => f.toLowerCase() === 'alertness');
  const alertnessBonus = hasAlertness ? 2 : 0;

  const totalBonus = Math.floor(ranks) + wisMod + alertnessBonus;

  return {
    ranks,
    wisMod,
    isClass,
    alertnessBonus,
    totalBonus
  };
}

export function calculateSkillTrickPoints(selectedSkillTricks: string[] = []): number {
  return (selectedSkillTricks?.length || 0) * 2;
}

export function getMaxSkillTricks(totalLevel: number): number {
  return Math.floor(Math.max(0, totalLevel) / 2);
}

export function validateSkillTrickPrerequisites(
  trick: SkillTrickData,
  character: CharacterState
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  const ranksMap = character.skillRanks || {};
  const selectedFeats = character.selectedFeats || [];
  const usePathfinder = !!character.usePathfinderPerception;

  // Check skill ranks
  if (trick.prereqRanks) {
    for (const [sName, reqRanks] of Object.entries(trick.prereqRanks)) {
      if (sName === 'Knowledge (any)') {
        const hasAnyKnowledge = Object.entries(ranksMap).some(
          ([k, r]) => k.toLowerCase().startsWith('knowledge') && r >= reqRanks
        );
        if (!hasAnyKnowledge) {
          missing.push(`Requires ${reqRanks} ranks in any Knowledge skill`);
        }
      } else if (sName === 'Bluff/Sleight of Hand') {
        const bluffRanks = ranksMap['Bluff'] || 0;
        const sohRanks = ranksMap['Sleight of Hand'] || 0;
        if (bluffRanks < reqRanks && sohRanks < reqRanks) {
          missing.push(`Requires Bluff ${reqRanks} ranks OR Sleight of Hand ${reqRanks} ranks`);
        }
      } else {
        let charRanks = ranksMap[sName] || 0;
        // Pathfinder Perception fallback: if target skill is Spot, Listen, or Search and usePathfinder is active
        if (usePathfinder && (sName === 'Spot' || sName === 'Listen' || sName === 'Search')) {
          charRanks = Math.max(charRanks, ranksMap['Perception'] || 0);
        }
        if (charRanks < reqRanks) {
          missing.push(`Requires ${sName} ${reqRanks} ranks (current: ${charRanks})`);
        }
      }
    }
  }

  // Check feat prerequisites
  if (trick.prereqFeats) {
    for (const featName of trick.prereqFeats) {
      const hasFeat = selectedFeats.some(f => f.toLowerCase() === featName.toLowerCase());
      if (!hasFeat) {
        missing.push(`Requires ${featName} feat`);
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing
  };
}

