import { ClassData, LevelProgression } from '../types/character';

export function findClassInDatabase(classNameOrId: string | undefined, classDatabase: ClassData[]): ClassData | undefined {
  if (!classNameOrId) return undefined;
  const clean = classNameOrId.trim().toLowerCase();
  return classDatabase.find(c => (c.id && c.id.toLowerCase() === clean) || c.name.toLowerCase() === clean);
}

export function calculateBAB(levelProgression: LevelProgression[], classDatabase: ClassData[]): number {
  let babAcc = 0;

  for (const lvl of levelProgression) {
    if (!lvl.primaryClass) continue;
    const primaryClassObj = findClassInDatabase(lvl.primaryClass, classDatabase);
    const factorPrimary = primaryClassObj ? primaryClassObj.babFactor : 0.5;

    let levelFactor = factorPrimary;

    if (lvl.secondaryClass) {
      const secondaryClassObj = findClassInDatabase(lvl.secondaryClass, classDatabase);
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
      const cls = findClassInDatabase(lvl.primaryClass, classDatabase);
      const key = cls ? cls.name : lvl.primaryClass.trim().toLowerCase();
      classCountMap[key] = (classCountMap[key] || 0) + 1;
    }
    if (lvl.secondaryClass) {
      const cls = findClassInDatabase(lvl.secondaryClass, classDatabase);
      const key = cls ? cls.name : lvl.secondaryClass.trim().toLowerCase();
      classCountMap[key] = (classCountMap[key] || 0) + 1;
    }
  }

  let totalSave = 0;

  for (const [className, count] of Object.entries(classCountMap)) {
    const classObj = findClassInDatabase(className, classDatabase);
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
  conMod: number,
  hpPerLevelMod: number = 0
): number {
  let totalHP = 0;

  levelProgression.forEach((lvl, idx) => {
    if (!lvl.primaryClass) return;
    const clsObj = findClassInDatabase(lvl.primaryClass, classDatabase);
    let hd = clsObj ? clsObj.hitDie : 6;

    if (lvl.secondaryClass) {
      const cls2Obj = findClassInDatabase(lvl.secondaryClass, classDatabase);
      if (cls2Obj) hd = Math.max(hd, cls2Obj.hitDie);
    }

    let rolledHp = lvl.hpRoll;
    if (!rolledHp || rolledHp <= 0) {
      rolledHp = (idx === 0) ? hd : Math.floor(hd / 2) + 1;
    }

    const hpWithCon = Math.max(0, rolledHp + conMod + hpPerLevelMod);
    totalHP += hpWithCon;
  });

  return Math.max(1, totalHP);
}
