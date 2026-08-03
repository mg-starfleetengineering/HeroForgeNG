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

export function isClassSkillForCharacter(
  skillName: string,
  levelProgression: LevelProgression[],
  classDatabase: ClassData[]
): boolean {
  const activeClasses = new Set<string>();
  levelProgression.forEach(lvl => {
    if (lvl.primaryClass) activeClasses.add(lvl.primaryClass);
    if (lvl.secondaryClass) activeClasses.add(lvl.secondaryClass);
  });

  for (const className of activeClasses) {
    const clsObj = classDatabase.find(c => c.name === className);
    if (clsObj && clsObj.classSkills) {
      const match = clsObj.classSkills.some(s => s.toLowerCase().includes(skillName.toLowerCase()));
      if (match) return true;
    }
  }

  return false;
}
