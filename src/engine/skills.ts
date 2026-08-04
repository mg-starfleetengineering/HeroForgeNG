import { ClassData, LevelProgression, StatType } from '../types/character';

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
  classDatabase: ClassData[] = []
): number {
  let spentPts = 0;
  for (const [sName, ranks] of Object.entries(skillRanks)) {
    if (!ranks || ranks <= 0) continue;
    const isClass = isClassSkillForCharacter(sName, levelProgression, classDatabase);
    // In D&D 3.5e: Class skills cost 1pt per rank. Cross-class skills cost 2pts per rank (1pt per 0.5 rank).
    spentPts += isClass ? ranks : ranks * 2;
  }
  return spentPts;
}

export function isClassSkillForCharacter(
  skillName: string,
  levelProgression: LevelProgression[] = [],
  classDatabase: ClassData[] = []
): boolean {
  const activeClasses = new Set<string>();
  levelProgression.forEach(lvl => {
    if (lvl.primaryClass) activeClasses.add(lvl.primaryClass.toLowerCase());
    if (lvl.secondaryClass) activeClasses.add(lvl.secondaryClass.toLowerCase());
  });

  for (const clsName of activeClasses) {
    const clsObj = classDatabase.find(c => c.name.toLowerCase() === clsName);
    if (clsObj && clsObj.classSkills) {
      const match = clsObj.classSkills.some(s => {
        const sClean = s.toLowerCase().trim();
        const targetClean = skillName.toLowerCase().trim();
        if (sClean === targetClean) return true;

        // Group skills
        const groups = ['craft', 'knowledge', 'perform', 'profession'];
        for (const group of groups) {
          if (sClean === group && targetClean.startsWith(group)) return true;
          if (sClean.startsWith(group) && targetClean.startsWith(group)) return true;
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
