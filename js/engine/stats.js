// HeroForge Anew 3.5 - Ability Score Engine

export const ABILITY_NAMES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export const POINT_BUY_COSTS = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 6, 15: 8, 16: 10, 17: 13, 18: 16
};

export function parseVal(val, defaultVal = 0) {
  if (val === undefined || val === null || val === '') return defaultVal;
  const n = Number(val);
  return isNaN(n) ? defaultVal : n;
}

export function parseRaceMods(raceObj) {
  return {
    str: parseVal(raceObj?.strAdj),
    dex: parseVal(raceObj?.dexAdj),
    con: parseVal(raceObj?.conAdj),
    int: parseVal(raceObj?.intAdj),
    wis: parseVal(raceObj?.wisAdj),
    cha: parseVal(raceObj?.chaAdj)
  };
}

/**
 * Calculates D&D 3.5 Ability Modifier for a given score.
 * Formula: floor((score - 10) / 2)
 */
export function getAbilityMod(score) {
  const numScore = parseVal(score, 10);
  return Math.floor((numScore - 10) / 2);
}

/**
 * Calculates point buy cost for a base score.
 */
export function getPointBuyCost(score) {
  const numScore = parseVal(score, 8);
  if (numScore < 8) return 0;
  if (numScore > 18) return POINT_BUY_COSTS[18] + (numScore - 18) * 4;
  return POINT_BUY_COSTS[numScore] || 0;
}

/**
 * Computes total spent points across all 6 base stats.
 */
export function getTotalPointBuySpent(baseStats) {
  let total = 0;
  for (const stat of ABILITY_NAMES) {
    total += getPointBuyCost(baseStats[stat] || 8);
  }
  return total;
}

export function getCharacterLevel(levelProgression) {
  if (!levelProgression || !Array.isArray(levelProgression)) return 1;
  const count = levelProgression.filter(l => Boolean(l.primaryClass)).length;
  return count > 0 ? count : 1;
}

/**
 * Calculates full total score for a given attribute.
 */
export function calculateTotalScore(attribute, baseStats, raceMods, levelBumps, enhancementMods = {}, characterLevelOrProgression = 1) {
  const characterLevel = typeof characterLevelOrProgression === 'number'
    ? characterLevelOrProgression
    : getCharacterLevel(characterLevelOrProgression);

  const base = parseVal(baseStats?.[attribute], 10);
  const race = parseVal(raceMods?.[attribute], 0);
  const bumpCount = Object.entries(levelBumps || {}).filter(([lvlStr, stat]) => {
    const lvl = Number(lvlStr);
    return stat === attribute && characterLevel >= lvl;
  }).length;
  const enh = parseVal(enhancementMods?.[attribute], 0);

  return base + race + bumpCount + enh;
}
