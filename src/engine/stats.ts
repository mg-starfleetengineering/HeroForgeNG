import { BaseStats, RaceData, StatType, TraitData, FlawData, CharacterState, ClassData } from '../types/character';

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

export function calculateBonusFeatsFromFlaws(selectedFlaws?: string[]): number {
  if (!selectedFlaws || !Array.isArray(selectedFlaws)) return 0;
  return Math.min(2, selectedFlaws.length);
}

export function calculateTotalFeatSlots(
  character: CharacterState,
  classDatabase: ClassData[] = [],
  raceDatabase: RaceData[] = []
): {
  baseFeats: number;
  racialBonus: number;
  classBonus: number;
  flawBonus: number;
  totalSlots: number;
} {
  const totalLevel = getCharacterLevel(character.levelProgression);
  
  // 1. Standard D&D 3.5e character level progression feats: Lvl 1, 3, 6, 9, 12, 15, 18
  const baseFeats = totalLevel >= 1 ? 1 + Math.floor((totalLevel - 1) / 3) : 1;

  // 2. Racial bonus feats (Human, Silverbrow Human, or any race with bonusFeats)
  const raceName = (character.selectedRace || '').toLowerCase();
  const raceObj = raceDatabase.find(r => r.name.toLowerCase() === raceName || r.id === raceName);
  const isHumanoidHuman = raceName.includes('human');
  const isStrongheart = raceName.includes('strongheart');
  const hasRacialBonusFeat = isHumanoidHuman || isStrongheart || Boolean(raceObj?.bonusFeats && raceObj.bonusFeats.toLowerCase().includes('bonus feat'));
  const racialBonus = hasRacialBonusFeat ? 1 : 0;

  // 3. Class bonus feats count
  let classBonus = 0;
  const primaryCounts: Record<string, number> = {};
  (character.levelProgression || []).forEach(lvl => {
    if (lvl.primaryClass) {
      primaryCounts[lvl.primaryClass] = (primaryCounts[lvl.primaryClass] || 0) + 1;
    }
  });

  for (const [clsName, count] of Object.entries(primaryCounts)) {
    const cLower = clsName.toLowerCase();
    if (cLower === 'fighter') {
      if (count >= 1) classBonus += 1;
      if (count >= 2) classBonus += 1;
      for (let fLvl = 4; fLvl <= count; fLvl += 2) {
        classBonus += 1;
      }
    } else if (cLower === 'wizard') {
      if (count >= 1) classBonus += 1;
      for (let wLvl = 5; wLvl <= count; wLvl += 5) {
        classBonus += 1;
      }
    } else if (cLower === 'monk') {
      if (count >= 1) classBonus += 1;
      if (count >= 2) classBonus += 1;
      if (count >= 6) classBonus += 1;
    }
  }

  // 4. Flaw bonus feats
  const flawBonus = calculateBonusFeatsFromFlaws(character.selectedFlaws);

  const totalSlots = baseFeats + racialBonus + classBonus + flawBonus;

  return {
    baseFeats,
    racialBonus,
    classBonus,
    flawBonus,
    totalSlots
  };
}

export function calculateTraitFlawStatMods(
  selectedTraits: string[] = [],
  selectedFlaws: string[] = [],
  traitsData: TraitData[] = [],
  flawsData: FlawData[] = []
): BaseStats {
  const totals: BaseStats = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
  
  for (const tName of selectedTraits) {
    const tObj = traitsData.find(t => t.name.toLowerCase() === tName.toLowerCase() || t.id === tName);
    if (tObj?.statMods) {
      for (const stat of ABILITY_NAMES) {
        totals[stat] += parseVal(tObj.statMods[stat]);
      }
    }
  }
  
  for (const fName of selectedFlaws) {
    const fObj = flawsData.find(f => f.name.toLowerCase() === fName.toLowerCase() || f.id === fName);
    if (fObj?.statMods) {
      for (const stat of ABILITY_NAMES) {
        totals[stat] += parseVal(fObj.statMods[stat]);
      }
    }
  }
  
  return totals;
}

export function calculateTraitFlawSaveMods(
  selectedTraits: string[] = [],
  selectedFlaws: string[] = [],
  traitsData: TraitData[] = [],
  flawsData: FlawData[] = []
): { fort: number; ref: number; will: number } {
  let fort = 0, ref = 0, will = 0;
  
  for (const tName of selectedTraits) {
    const tObj = traitsData.find(t => t.name.toLowerCase() === tName.toLowerCase() || t.id === tName);
    if (tObj?.saveMods) {
      fort += parseVal(tObj.saveMods.fort);
      ref += parseVal(tObj.saveMods.ref);
      will += parseVal(tObj.saveMods.will);
    }
  }
  
  for (const fName of selectedFlaws) {
    const fObj = flawsData.find(f => f.name.toLowerCase() === fName.toLowerCase() || f.id === fName);
    if (fObj?.saveMods) {
      fort += parseVal(fObj.saveMods.fort);
      ref += parseVal(fObj.saveMods.ref);
      will += parseVal(fObj.saveMods.will);
    }
  }
  
  return { fort, ref, will };
}

export function calculateTraitFlawSkillMods(
  selectedTraits: string[] = [],
  selectedFlaws: string[] = [],
  traitsData: TraitData[] = [],
  flawsData: FlawData[] = [],
  usePathfinderPerception: boolean = false
): Record<string, number> {
  const result: Record<string, number> = {};
  
  const activeItems: Array<TraitData | FlawData> = [];
  for (const tName of selectedTraits) {
    const tObj = traitsData.find(t => t.name.toLowerCase() === tName.toLowerCase() || t.id === tName);
    if (tObj) activeItems.push(tObj);
  }
  for (const fName of selectedFlaws) {
    const fObj = flawsData.find(f => f.name.toLowerCase() === fName.toLowerCase() || f.id === fName);
    if (fObj) activeItems.push(fObj);
  }
  
  for (const item of activeItems) {
    if (!item.skillMods) continue;
    
    if (usePathfinderPerception) {
      const spotMod = item.skillMods['Spot'];
      const listenMod = item.skillMods['Listen'];
      const searchMod = item.skillMods['Search'];
      
      // If item penalizes/boosts Spot or Listen or Search
      if (spotMod !== undefined || listenMod !== undefined || searchMod !== undefined) {
        let percMod = 0;
        if (spotMod !== undefined && listenMod !== undefined && spotMod === listenMod) {
          // Rule: Apply penalty/bonus ONCE to Perception rather than double-stacking (e.g. Inattentive -4 Spot, -4 Listen -> -4 Perception)
          percMod = spotMod;
        } else {
          // Combine unique effects (e.g., Hard of Hearing: +1 Spot, -2 Listen -> -1 Perception; Farsighted: +1 Spot, -1 Search -> 0)
          percMod = parseVal(spotMod) + parseVal(listenMod) + parseVal(searchMod);
        }
        result['Perception'] = (result['Perception'] || 0) + percMod;
      }
      
      // Copy other non-Spot/Listen/Search skill mods
      for (const [sName, val] of Object.entries(item.skillMods)) {
        if (sName !== 'Spot' && sName !== 'Listen' && sName !== 'Search') {
          result[sName] = (result[sName] || 0) + val;
        }
      }
    } else {
      for (const [sName, val] of Object.entries(item.skillMods)) {
        result[sName] = (result[sName] || 0) + val;
      }
    }
  }
  
  return result;
}

export function calculateTraitFlawHpPerLevel(
  selectedTraits: string[] = [],
  selectedFlaws: string[] = [],
  traitsData: TraitData[] = [],
  flawsData: FlawData[] = []
): number {
  let hpMod = 0;
  for (const tName of selectedTraits) {
    const tObj = traitsData.find(t => t.name.toLowerCase() === tName.toLowerCase() || t.id === tName);
    if (tObj?.hpPerLevelMod) hpMod += tObj.hpPerLevelMod;
  }
  for (const fName of selectedFlaws) {
    const fObj = flawsData.find(f => f.name.toLowerCase() === fName.toLowerCase() || f.id === fName);
    if (fObj?.hpPerLevelMod) hpMod += fObj.hpPerLevelMod;
  }
  return hpMod;
}

export function calculateTraitFlawAcMod(
  selectedTraits: string[] = [],
  selectedFlaws: string[] = [],
  traitsData: TraitData[] = [],
  flawsData: FlawData[] = []
): number {
  let acMod = 0;
  for (const tName of selectedTraits) {
    const tObj = traitsData.find(t => t.name.toLowerCase() === tName.toLowerCase() || t.id === tName);
    if (tObj?.acMod) acMod += tObj.acMod;
  }
  for (const fName of selectedFlaws) {
    const fObj = flawsData.find(f => f.name.toLowerCase() === fName.toLowerCase() || f.id === fName);
    if (fObj?.acMod) acMod += fObj.acMod;
  }
  return acMod;
}

export function calculateTraitFlawInitiativeMod(
  selectedTraits: string[] = [],
  selectedFlaws: string[] = [],
  traitsData: TraitData[] = [],
  flawsData: FlawData[] = []
): number {
  let initMod = 0;
  for (const tName of selectedTraits) {
    const tObj = traitsData.find(t => t.name.toLowerCase() === tName.toLowerCase() || t.id === tName);
    if (tObj?.initiativeMod) initMod += tObj.initiativeMod;
  }
  for (const fName of selectedFlaws) {
    const fObj = flawsData.find(f => f.name.toLowerCase() === fName.toLowerCase() || f.id === fName);
    if (fObj?.initiativeMod) initMod += fObj.initiativeMod;
  }
  return initMod;
}

export function calculateTraitFlawSpeedMod(
  selectedTraits: string[] = [],
  selectedFlaws: string[] = [],
  traitsData: TraitData[] = [],
  flawsData: FlawData[] = [],
  baseSpeed: number = 30
): number {
  let delta = 0;
  let halveCount = 0;

  for (const tName of selectedTraits) {
    const tObj = traitsData.find(t => t.name.toLowerCase() === tName.toLowerCase() || t.id === tName);
    if (tObj?.speedMod) {
      if (tObj.speedMod < 0 && tObj.speedMod > -1) {
        halveCount++;
      } else {
        delta += tObj.speedMod;
      }
    }
  }
  for (const fName of selectedFlaws) {
    const fObj = flawsData.find(f => f.name.toLowerCase() === fName.toLowerCase() || f.id === fName);
    if (fObj?.speedMod) {
      if (fObj.speedMod < 0 && fObj.speedMod > -1) {
        halveCount++;
      } else {
        delta += fObj.speedMod;
      }
    }
  }

  let finalSpeed = baseSpeed + delta;
  if (halveCount > 0) {
    for (let i = 0; i < halveCount; i++) {
      finalSpeed = Math.floor(finalSpeed / 2 / 5) * 5; // rounded down to nearest 5 ft
    }
  }

  return finalSpeed - baseSpeed;
}

export function calculateTotalScore(
  attribute: StatType,
  baseStats: BaseStats,
  raceMods: Partial<BaseStats>,
  levelBumps: Record<number, StatType>,
  enhancementMods: Partial<BaseStats> = {},
  characterLevelOrProgression: number | Array<{ primaryClass?: string }> = 1,
  traitFlawMods: Partial<BaseStats> = {}
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
  const tf = parseVal(traitFlawMods?.[attribute], 0);

  return base + race + bumpCount + enh + tf;
}

