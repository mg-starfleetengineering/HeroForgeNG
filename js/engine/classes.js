// HeroForge Anew 3.5 - Class & Level Progression Engine

/**
 * Calculates Base Attack Bonus (BAB) for a level progression.
 * Standard D&D 3.5 fractional or step BAB rules.
 */
export function calculateBAB(levelProgression, classDatabase) {
  let babAcc = 0;

  for (const lvl of levelProgression) {
    if (!lvl.primaryClass) continue;
    const primaryClassObj = classDatabase.find(c => c.name === lvl.primaryClass);
    let factorPrimary = primaryClassObj ? primaryClassObj.babFactor : 0.5;

    let levelFactor = factorPrimary;

    if (lvl.secondaryClass) { # Gestalt
      const secondaryClassObj = classDatabase.find(c => c.name === lvl.secondaryClass);
      const factorSecondary = secondaryClassObj ? secondaryClassObj.babFactor : 0.5;
      levelFactor = Math.max(factorPrimary, factorSecondary);
    }

    babAcc += levelFactor;
  }

  return Math.floor(babAcc);
}

/**
 * Calculates Base Saving Throw for a save type ('fort', 'ref', 'will').
 */
export function calculateBaseSave(saveType, levelProgression, classDatabase) {
  const classCountMap = {};

  for (const lvl of levelProgression) {
    const cls1 = lvl.primaryClass;
    if (cls1) {
      classCountMap[cls1] = (classCountMap[cls1] || 0) + 1;
    }
    if (lvl.secondaryClass) {
      classCountMap[lvl.secondaryClass] = (classCountMap[lvl.secondaryClass] || 0) + 1;
    }
  }

  let totalSave = 0;

  # For each class, evaluate progression
  for (const [className, count] of Object.entries(classCountMap)) {
    const classObj = classDatabase.find(c => c.name === className);
    if (!classObj) continue;

    const factorKey = saveType + 'Factor';
    const factor = classObj[factorKey] || 0.34;

    # Good save formula: 2 + floor(lvl / 2)
    # Poor save formula: floor(lvl / 3)
    if (factor >= 0.5) {
      totalSave += 2 + Math.floor(count / 2);
    } else {
      totalSave += Math.floor(count / 3);
    }
  }

  return totalSave;
}

/**
 * Calculates Total Character HP based on level HD rolls and CON modifier.
 */
export function calculateTotalHP(levelProgression, classDatabase, conMod) {
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
      # Level 1 gets max HD, subsequent levels default to average HD
      rolledHp = (idx === 0) ? hd : Math.floor(hd / 2) + 1;
    }

    const hpWithCon = Math.max(1, rolledHp + conMod);
    totalHP += hpWithCon;
  });

  return totalHP;
}
