import { BaseStats, StatType } from '../types/character';

export const ABILITY_NAMES: StatType[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 6, 15: 8, 16: 10, 17: 13, 18: 16
};

export function getAbilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function getPointBuyCost(score: number): number {
  if (score < 8) return 0;
  if (score > 18) return (POINT_BUY_COSTS[18] || 16) + (score - 18) * 4;
  return POINT_BUY_COSTS[score] || 0;
}

export function getTotalPointBuySpent(baseStats: BaseStats): number {
  let total = 0;
  for (const stat of ABILITY_NAMES) {
    total += getPointBuyCost(baseStats[stat] || 8);
  }
  return total;
}

export function calculateTotalScore(
  attribute: StatType,
  baseStats: BaseStats,
  raceMods: Partial<BaseStats>,
  levelBumps: Record<number, StatType>,
  enhancementMods: Partial<BaseStats> = {}
): number {
  const base = baseStats[attribute] || 10;
  const race = raceMods[attribute] || 0;
  const bumpCount = Object.values(levelBumps).filter(stat => stat === attribute).length;
  const enh = enhancementMods[attribute] || 0;

  return base + race + bumpCount + enh;
}
