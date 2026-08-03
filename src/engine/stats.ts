import { BaseStats, RaceData, StatType } from '../types/character';

export const ABILITY_NAMES: StatType[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 6, 15: 8, 16: 10, 17: 13, 18: 16
};

export function parseVal(val: any, defaultVal = 0): number {
  if (val === undefined || val === null || val === '') return defaultVal;
  const n = Number(val);
  return isNaN(n) ? defaultVal : n;
}

export function parseRaceMods(raceObj?: Partial<RaceData>): BaseStats {
  return {
    str: parseVal(raceObj?.strAdj),
    dex: parseVal(raceObj?.dexAdj),
    con: parseVal(raceObj?.conAdj),
    int: parseVal(raceObj?.intAdj),
    wis: parseVal(raceObj?.wisAdj),
    cha: parseVal(raceObj?.chaAdj)
  };
}

export function getAbilityMod(score: number): number {
  const numScore = parseVal(score, 10);
  return Math.floor((numScore - 10) / 2);
}

export function getPointBuyCost(score: number): number {
  const numScore = parseVal(score, 8);
  if (numScore < 8) return 0;
  if (numScore > 18) return (POINT_BUY_COSTS[18] || 16) + (numScore - 18) * 4;
  return POINT_BUY_COSTS[numScore] || 0;
}

export function getTotalPointBuySpent(baseStats: BaseStats): number {
  let total = 0;
  for (const stat of ABILITY_NAMES) {
    total += getPointBuyCost(baseStats[stat] || 8);
  }
  return total;
}

export function getCharacterLevel(levelProgression?: Array<{ primaryClass?: string }>): number {
  if (!levelProgression || !Array.isArray(levelProgression)) return 1;
  const count = levelProgression.filter(l => Boolean(l.primaryClass)).length;
  return count > 0 ? count : 1;
}

export function calculateTotalScore(
  attribute: StatType,
  baseStats: BaseStats,
  raceMods: Partial<BaseStats>,
  levelBumps: Record<number, StatType>,
  enhancementMods: Partial<BaseStats> = {},
  characterLevelOrProgression: number | Array<{ primaryClass?: string }> = 1
): number {
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
