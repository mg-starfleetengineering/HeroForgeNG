import { ClassData, LevelProgression } from '../types/character';

export function calculateBAB(levelProgression: LevelProgression[], classDatabase: ClassData[]): number {
  let babAcc = 0;

  for (const lvl of levelProgression) {
    if (!lvl.primaryClass) continue;
    const primaryClassObj = classDatabase.find(c => c.name === lvl.primaryClass);
    const factorPrimary = primaryClassObj ? primaryClassObj.babFactor : 0.5;

    let levelFactor = factorPrimary;

    if (lvl.secondaryClass) {
      const secondaryClassObj = classDatabase.find(c => c.name === lvl.secondaryClass);
      const factorSecondary = secondaryClassObj ? secondaryClassObj.babFactor : 0.5;
      levelFactor = Math.max(factorPrimary, factorSecondary);
    }

    babAcc += levelFactor;
  }

  return Math.floor(babAcc);
}

export function calculateBaseSave(
  saveType: 'fort' | 'ref' | 'will',
  levelProgression: LevelProgression[],
  classDatabase: ClassData[]
): number {
  const classCountMap: Record<string, number> = {};

  for (const lvl of levelProgression) {
    if (lvl.primaryClass) {
      classCountMap[lvl.primaryClass] = (classCountMap[lvl.primaryClass] || 0) + 1;
    }
    if (lvl.secondaryClass) {
      classCountMap[lvl.secondaryClass] = (classCountMap[lvl.secondaryClass] || 0) + 1;
    }
  }

  let totalSave = 0;

  for (const [className, count] of Object.entries(classCountMap)) {
    const classObj = classDatabase.find(c => c.name === className);
    if (!classObj) continue;

    const factorKey = `${saveType}Factor` as keyof ClassData;
    const factor = (classObj[factorKey] as number) || 0.34;

    if (factor >= 0.5) {
      totalSave += 2 + Math.floor(count / 2);
    } else {
      totalSave += Math.floor(count / 3);
    }
  }

  return totalSave;
}

export function calculateTotalHP(
  levelProgression: LevelProgression[],
  classDatabase: ClassData[],
  conMod: number
): number {
  let totalHP = 0;

  levelProgression.forEach((lvl, idx) => {
    if (!lvl.primaryClass) return;
    const clsObj = classDatabase.find(c => c.name === lvl.primaryClass);
    let hd = clsObj ? clsObj.hitDie : 6;

    if (lvl.secondaryClass) {
      const cls2Obj = classDatabase.find(c => c.name === lvl.secondaryClass);
      if (cls2Obj) hd = Math.max(hd, cls2Obj.hitDie);
    }

    let rolledHp = lvl.hpRoll;
    if (!rolledHp || rolledHp <= 0) {
      rolledHp = (idx === 0) ? hd : Math.floor(hd / 2) + 1;
    }

    const hpWithCon = Math.max(1, rolledHp + conMod);
    totalHP += hpWithCon;
  });

  return totalHP;
}
