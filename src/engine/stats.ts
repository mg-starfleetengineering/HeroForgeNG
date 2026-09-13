import { BaseStats, RaceData, StatType, TraitData, FlawData, CharacterState, ClassData, TemplateData, ActiveCombatBuff } from '../types/character';
import { resolveArmor } from './equipment';
import { hasRacialTrait } from './features';
export { calculateCombatStats, calculateTacticalCombat, aggregateBuffBonuses, resolveActiveBuffs, migrateCharacterBuffs, STANDARD_SRD_BUFFS } from './combat';

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

export function parseTemplateMods(templateObj?: Partial<TemplateData>): BaseStats {
  return {
    str: parseVal(templateObj?.strAdj),
    dex: parseVal(templateObj?.dexAdj),
    con: parseVal(templateObj?.conAdj),
    int: parseVal(templateObj?.intAdj),
    wis: parseVal(templateObj?.wisAdj),
    cha: parseVal(templateObj?.chaAdj)
  };
}

export function getEffectiveRaceMods(raceObj?: Partial<RaceData>, templateObj?: Partial<TemplateData>): BaseStats {
  const rMods = parseRaceMods(raceObj);
  const tMods = parseTemplateMods(templateObj);
  return {
    str: rMods.str + tMods.str,
    dex: rMods.dex + tMods.dex,
    con: rMods.con + tMods.con,
    int: rMods.int + tMods.int,
    wis: rMods.wis + tMods.wis,
    cha: rMods.cha + tMods.cha
  };
}

export function getEffectiveLevelAdj(raceObj?: Partial<RaceData>, templateObj?: Partial<TemplateData>): number {
  const rLA = parseVal(raceObj?.levelAdj, 0);
  const tLA = parseVal(templateObj?.levelAdj, 0);
  return rLA + tLA;
}

export function getEffectiveRaceType(raceObj?: Partial<RaceData>, templateObj?: Partial<TemplateData>): { type: string; subtype: string } {
  const baseType = raceObj?.type || 'Humanoid';
  const baseSubtype = raceObj?.subtype || '';

  const tType = templateObj?.type;
  const tSubtype = templateObj?.subtype;

  const finalType = tType || baseType;

  let finalSubtype = baseSubtype;
  if (tSubtype) {
    if (!finalSubtype) {
      finalSubtype = tSubtype;
    } else if (!finalSubtype.toLowerCase().includes(tSubtype.toLowerCase())) {
      finalSubtype = `${finalSubtype}, ${tSubtype}`;
    }
  }

  return { type: finalType, subtype: finalSubtype };
}

export function getEffectiveSpeed(raceObj?: Partial<RaceData>, templateObj?: Partial<TemplateData>): {
  land: number;
  fly?: number;
  flyManeuverability?: string;
  swim?: number;
  burrow?: number;
  climb?: number;
} {
  const baseLand = parseVal(raceObj?.speed?.land, 30);
  const baseFly = raceObj?.speed?.fly != null ? parseVal(raceObj.speed.fly, 0) : undefined;
  const baseSwim = raceObj?.speed?.swim != null ? parseVal(raceObj.speed.swim, 0) : undefined;
  const baseBurrow = raceObj?.speed?.burrow != null ? parseVal(raceObj.speed.burrow, 0) : undefined;
  const baseClimb = raceObj?.speed?.climb != null ? parseVal(raceObj.speed.climb, 0) : undefined;

  const tSpeed = templateObj?.speed;

  const land = tSpeed?.land !== undefined && tSpeed?.land !== null ? parseVal(tSpeed.land, baseLand) : baseLand;
  const fly = tSpeed?.fly !== undefined && tSpeed?.fly !== null ? parseVal(tSpeed.fly, baseFly || 0) : baseFly;
  const swim = tSpeed?.swim !== undefined && tSpeed?.swim !== null ? parseVal(tSpeed.swim, baseSwim || 0) : baseSwim;
  const burrow = tSpeed?.burrow !== undefined && tSpeed?.burrow !== null ? parseVal(tSpeed.burrow, baseBurrow || 0) : baseBurrow;
  const climb = tSpeed?.climb !== undefined && tSpeed?.climb !== null ? parseVal(tSpeed.climb, baseClimb || 0) : baseClimb;

  return {
    land,
    fly,
    flyManeuverability: tSpeed?.flyManeuverability,
    swim,
    burrow,
    climb
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

  // 2. Racial bonus feats (Human, Silverbrow Human, or any race with bonus_feat trait)
  const raceName = (character.selectedRace || '').toLowerCase();
  const raceObj = raceDatabase.find(r => r.name.toLowerCase() === raceName || r.id === raceName);
  const hasRacialBonusFeat = hasRacialTrait(raceObj || character.selectedRace, 'bonus_feat');
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

export function calculateClassSpeedBonus(
  levelProgression: Array<{ primaryClass?: string }> = [],
  armorType: string = 'none',
  isEncumbered: boolean = false
): number {
  if (isEncumbered) return 0;

  let bonus = 0;
  const classCounts: Record<string, number> = {};
  (levelProgression || []).forEach(l => {
    if (l.primaryClass) {
      classCounts[l.primaryClass] = (classCounts[l.primaryClass] || 0) + 1;
    }
  });

  const armorLower = (armorType || 'none').toLowerCase();
  const isHeavyArmor = armorLower === 'fullplate' || armorLower.includes('heavy') || armorLower === 'heavy';
  const isMediumArmor = armorLower === 'breastplate' || armorLower.includes('medium') || armorLower === 'medium';
  const isArmored = armorLower !== 'none' && armorLower !== '';

  for (const [clsName, count] of Object.entries(classCounts)) {
    const cLower = clsName.toLowerCase();

    // Barbarian Fast Movement (+10 ft in light, medium, or no armor, not heavy)
    if (cLower === 'barbarian' && count >= 1) {
      if (!isHeavyArmor) {
        bonus += 10;
      }
    }

    // Monk Fast Movement (unarmored only)
    if (cLower === 'monk' && count >= 3) {
      if (!isArmored) {
        if (count >= 18) bonus += 60;
        else if (count >= 15) bonus += 50;
        else if (count >= 12) bonus += 40;
        else if (count >= 9) bonus += 30;
        else if (count >= 6) bonus += 20;
        else if (count >= 3) bonus += 10;
      }
    }

    // Scout Fast Movement (light or no armor)
    if (cLower === 'scout' && count >= 3) {
      if (!isArmored || armorLower === 'padded' || armorLower === 'leather' || armorLower === 'studded' || armorLower === 'chainshirt' || armorLower.includes('light')) {
        if (count >= 19) bonus += 30;
        else if (count >= 11) bonus += 20;
        else if (count >= 3) bonus += 10;
      }
    }
  }

  return bonus;
}

export function calculateFeatSpeedBonus(selectedFeats: string[] = []): number {
  let bonus = 0;
  (selectedFeats || []).forEach(f => {
    const fLower = f.toLowerCase();
    if (fLower.includes('dash')) bonus += 5;
    if (fLower.includes('speed of thought')) bonus += 10;
    if (fLower.includes('fleet of foot')) bonus += 10;
  });
  return bonus;
}

export function calculateTraitFlawSpeedMod(
  selectedTraits: string[] = [],
  selectedFlaws: string[] = [],
  traitsData: TraitData[] = [],
  flawsData: FlawData[] = [],
  baseSpeed: number = 30
): number {
  const numBaseSpeed = parseVal(baseSpeed, 30);
  let delta = 0;
  let halveCount = 0;

  for (const tName of selectedTraits) {
    const tObj = traitsData.find(t => t.name.toLowerCase() === tName.toLowerCase() || t.id === tName);
    if (tObj?.speedMod) {
      if (tObj.speedMod < 0 && tObj.speedMod > -1) {
        halveCount++;
      } else {
        delta += parseVal(tObj.speedMod);
      }
    }
  }
  for (const fName of selectedFlaws) {
    const fObj = flawsData.find(f => f.name.toLowerCase() === fName.toLowerCase() || f.id === fName);
    if (fObj?.speedMod) {
      if (fObj.speedMod < 0 && fObj.speedMod > -1) {
        halveCount++;
      } else {
        delta += parseVal(fObj.speedMod);
      }
    }
  }

  let finalSpeed = numBaseSpeed + delta;
  if (halveCount > 0) {
    for (let i = 0; i < halveCount; i++) {
      finalSpeed = Math.floor(finalSpeed / 2 / 5) * 5; // rounded down to nearest 5 ft
    }
  }

  return finalSpeed - numBaseSpeed;
}

export function calculateTotalSpeed(
  character: CharacterState,
  raceObj?: Partial<RaceData>,
  templateObj?: Partial<TemplateData>,
  traitsData: TraitData[] = [],
  flawsData: FlawData[] = []
): {
  land: number;
  fly?: number;
  flyManeuverability?: string;
  swim?: number;
  burrow?: number;
  climb?: number;
  baseLand: number;
  classBonus: number;
  featBonus: number;
  traitFlawDelta: number;
} {
  const effSpeed = getEffectiveSpeed(raceObj, templateObj);
  const baseLand = parseVal(effSpeed.land, 30);

  const equippedArmor = character.equipment?.armorItemId
    ? character.inventory?.find(i => i.id === character.equipment!.armorItemId)
    : undefined;

  let armorCategory = equippedArmor?.armorData?.type;
  if (!armorCategory && character.equipment?.armor) {
    const resolved = resolveArmor(character.equipment.armor, character.customArmors || []);
    armorCategory = resolved.type as any;
  }

  const armorKey = armorCategory || (character.equipment?.armor || 'none').toLowerCase();
  const isDwarf = hasRacialTrait(raceObj as RaceData || character.selectedRace, 'dwarf_speed');

  const classBonus = calculateClassSpeedBonus(character.levelProgression, armorKey, false);
  const featBonus = calculateFeatSpeedBonus(character.selectedFeats);

  const selectedTraits = character.selectedTraits || [];
  const selectedFlaws = character.selectedFlaws || [];
  const traitFlawDelta = calculateTraitFlawSpeedMod(selectedTraits, selectedFlaws, traitsData, flawsData, baseLand);

  let land = baseLand + classBonus + featBonus + traitFlawDelta;

  const isHeavy = armorCategory === 'heavy' || armorKey === 'fullplate' || armorKey.includes('heavy');
  const isMedium = armorCategory === 'medium' || armorKey === 'breastplate' || armorKey.includes('medium');
  if (!isDwarf && (isHeavy || isMedium)) {
    if (land >= 40) {
      land = Math.max(30, land - 10);
    } else if (land >= 30) {
      land = 20;
    } else if (land >= 20) {
      land = 15;
    }
  }

  return {
    land: Math.max(0, land),
    fly: effSpeed.fly,
    flyManeuverability: effSpeed.flyManeuverability,
    swim: effSpeed.swim,
    burrow: effSpeed.burrow,
    climb: effSpeed.climb,
    baseLand,
    classBonus,
    featBonus,
    traitFlawDelta
  };
}

export function calculateTotalScore(
  attribute: StatType,
  baseStats: BaseStats,
  raceMods: Partial<BaseStats>,
  levelBumps: Record<number, StatType>,
  enhancementMods: Partial<BaseStats> = {},
  characterLevelOrProgression: number | Array<{ primaryClass?: string }> = 1,
  traitFlawMods: Partial<BaseStats> = {},
  templateMods: Partial<BaseStats> = {}
): number {
  const characterLevel = typeof characterLevelOrProgression === 'number'
    ? characterLevelOrProgression
    : getCharacterLevel(characterLevelOrProgression);

  const base = parseVal(baseStats?.[attribute], 10);
  const race = parseVal(raceMods?.[attribute], 0);
  const tmpl = parseVal(templateMods?.[attribute], 0);
  const bumpCount = Object.entries(levelBumps || {}).filter(([lvlStr, stat]) => {
    const lvl = Number(lvlStr);
    return stat === attribute && characterLevel >= lvl;
  }).length;
  const enh = parseVal(enhancementMods?.[attribute], 0);
  const tf = parseVal(traitFlawMods?.[attribute], 0);

  return base + race + tmpl + bumpCount + enh + tf;
}

/**
 * Aggregates net ability score modifiers granted by active combat buffs.
 */
export function calculateBuffAbilityBonuses(activeBuffs: ActiveCombatBuff[] = []): BaseStats {
  const result: BaseStats = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
  if (!activeBuffs || !Array.isArray(activeBuffs)) return result;

  const active = activeBuffs.filter(b => b.active);
  const typeMap: Record<StatType, { untyped: number; byType: Record<string, number> }> = {
    str: { untyped: 0, byType: {} },
    dex: { untyped: 0, byType: {} },
    con: { untyped: 0, byType: {} },
    int: { untyped: 0, byType: {} },
    wis: { untyped: 0, byType: {} },
    cha: { untyped: 0, byType: {} }
  };

  for (const b of active) {
    if (!b.abilityBonuses) continue;
    for (const [statUpper, val] of Object.entries(b.abilityBonuses)) {
      const statLower = statUpper.toLowerCase() as StatType;
      if (typeMap[statLower] && typeof val === 'number') {
        const bType = b.bonusType || 'untyped';
        if (bType === 'untyped') {
          typeMap[statLower].untyped += val;
        } else {
          typeMap[statLower].byType[bType] = Math.max(typeMap[statLower].byType[bType] || 0, val);
        }
      }
    }
  }

  for (const stat of ABILITY_NAMES) {
    const namedSum = Object.values(typeMap[stat].byType).reduce((a, b) => a + b, 0);
    result[stat] = typeMap[stat].untyped + namedSum;
  }

  return result;
}

