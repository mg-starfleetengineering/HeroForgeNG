import { CharacterState, RaceData, ClassData, TemplateData, FeatData } from '../types/character';
import { getCharacterLevel } from './stats';

export interface SRSource {
  name: string;
  category: 'race' | 'template' | 'feat' | 'class' | 'equipment' | 'aura' | 'custom';
  value: number;
  notes?: string;
  stacks?: boolean;
}

export interface ActiveSRSummary {
  bestSR: number;
  bestSRString: string;
  hasSR: boolean;
  baseSR: number;
  bonusSR: number;
  sources: SRSource[];
}

/**
 * Parses SR text (e.g. "SR 18", "Spell Resistance 21", "SR 11 + Level")
 */
export function parseSRText(text: string, characterLevel: number = 1): number {
  if (!text) return 0;

  // Regex matching "SR 11 + level" or "Spell Resistance 11 + HD"
  const dynamicMatch = text.match(/(?:SR|Spell Resistance)\s*(?:equal to|:)?\s*(\d+)\s*\+\s*(?:level|HD|character level)/i);
  if (dynamicMatch) {
    const base = parseInt(dynamicMatch[1], 10);
    if (!isNaN(base)) {
      return base + characterLevel;
    }
  }

  // Regex matching static "SR 18" or "Spell Resistance: 21"
  const staticMatch = text.match(/(?:SR|Spell Resistance)\s*(?:equal to|:)?\s*(\d+)/i);
  if (staticMatch) {
    const val = parseInt(staticMatch[1], 10);
    if (!isNaN(val)) {
      return val;
    }
  }

  return 0;
}

/**
 * Collects all active SR sources for a character across Race, Template, Classes, Feats, Equipment, and Auras.
 */
export function collectSRSources(
  character: CharacterState,
  raceObj?: Partial<RaceData>,
  templateObj?: Partial<TemplateData>,
  featsData: FeatData[] = [],
  classesData: ClassData[] = []
): SRSource[] {
  const sources: SRSource[] = [];
  const levelProgression = character.levelProgression || [];
  const characterLevel = getCharacterLevel(levelProgression);
  const selectedFeats = character.selectedFeats || [];

  // 1. Race SR
  if (raceObj) {
    const rName = (raceObj.name || '').toLowerCase();
    const isDrow = rName.includes('drow');
    const isSvirfneblin = rName.includes('svirfneblin') || rName.includes('deep gnome');

    if (isDrow) {
      sources.push({
        name: `Racial (${raceObj.name})`,
        category: 'race',
        value: 11 + characterLevel,
        notes: `11 + Character Level (${characterLevel})`
      });
    } else if (isSvirfneblin) {
      sources.push({
        name: `Racial (${raceObj.name})`,
        category: 'race',
        value: 11 + characterLevel,
        notes: `11 + Character Level (${characterLevel})`
      });
    } else if (raceObj.specialAbilities) {
      const parsed = parseSRText(raceObj.specialAbilities, characterLevel);
      if (parsed > 0) {
        sources.push({
          name: `Racial (${raceObj.name})`,
          category: 'race',
          value: parsed
        });
      }
    }
  }

  // 2. Template SR
  if (templateObj) {
    const tName = (templateObj.name || '').toLowerCase();
    if (tName.includes('half-celestial')) {
      const srVal = Math.min(35, 10 + characterLevel);
      sources.push({
        name: `Half-Celestial Template`,
        category: 'template',
        value: srVal,
        notes: `10 + Level (max 35)`
      });
    } else if (tName.includes('half-fiend')) {
      const srVal = Math.min(35, 10 + characterLevel);
      sources.push({
        name: `Half-Fiend Template`,
        category: 'template',
        value: srVal,
        notes: `10 + Level (max 35)`
      });
    } else if (tName.includes('celestial') || tName.includes('axiomatic') || tName.includes('anarchic')) {
      if (characterLevel >= 4) {
        const srVal = Math.min(25, characterLevel * 2);
        sources.push({
          name: `${templateObj.name} Template`,
          category: 'template',
          value: srVal,
          notes: `2 x Level (max 25)`
        });
      }
    } else if (templateObj.specialAbilities) {
      const parsed = parseSRText(templateObj.specialAbilities, characterLevel);
      if (parsed > 0) {
        sources.push({
          name: `Template (${templateObj.name})`,
          category: 'template',
          value: parsed
        });
      }
    }
  }

  // 3. Class Features SR
  const classCounts: Record<string, number> = {};
  levelProgression.forEach(l => {
    if (l.primaryClass) {
      classCounts[l.primaryClass] = (classCounts[l.primaryClass] || 0) + 1;
    }
  });

  for (const [clsName, count] of Object.entries(classCounts)) {
    const cLower = clsName.toLowerCase();

    // Monk Diamond Soul: SR = 10 + Monk Level at level 13+
    if (cLower === 'monk' && count >= 13) {
      sources.push({
        name: `Monk Diamond Soul (Lv ${count})`,
        category: 'class',
        value: 10 + count,
        notes: `10 + Monk Level (${count})`
      });
    }
  }

  // 4. Equipment & Wondrous Items SR
  if (character.equipment?.wondrousItems) {
    character.equipment.wondrousItems.forEach(item => {
      const iName = (item.name || '').toLowerCase();
      const iEffect = (item.effect || '').toLowerCase();

      if (iName.includes('mantle of spell resistance') || iEffect.includes('mantle of spell resistance')) {
        sources.push({
          name: item.name,
          category: 'equipment',
          value: 21,
          notes: 'SR 21'
        });
      } else if (iName.includes('robe of the archmagi') || iEffect.includes('robe of the archmagi')) {
        sources.push({
          name: item.name,
          category: 'equipment',
          value: 18,
          notes: 'SR 18'
        });
      } else if (item.effect) {
        const parsed = parseSRText(item.effect, characterLevel);
        if (parsed > 0) {
          sources.push({
            name: item.name,
            category: 'equipment',
            value: parsed
          });
        }
      }
    });
  }

  // Armor with Spell Resistance property
  if (character.equipment?.armor) {
    const aName = character.equipment.armor.toLowerCase();
    const match = aName.match(/spell resistance\s*\(?(\d+)\)?/i);
    if (match) {
      const val = parseInt(match[1], 10);
      if (!isNaN(val)) {
        sources.push({
          name: `Armor (${character.equipment.armor})`,
          category: 'equipment',
          value: val
        });
      }
    }
  }

  // 5. Active Auras SR
  if (character.auras) {
    character.auras.filter(a => a.active && a.effect).forEach(aura => {
      const parsed = parseSRText(aura.effect, characterLevel);
      if (parsed > 0) {
        sources.push({
          name: `Aura: ${aura.name}`,
          category: 'aura',
          value: parsed
        });
      }
    });
  }

  // 6. Feats SR
  for (const fName of selectedFeats) {
    const fLower = fName.toLowerCase();

    if (fLower.includes('awaken spell resistance')) {
      sources.push({
        name: 'Awaken Spell Resistance',
        category: 'feat',
        value: 11 + characterLevel,
        notes: `11 + Character Level (${characterLevel})`
      });
    }

    // Explicit Feat from featsData with static/dynamic SR
    const fObj = featsData.find(f => f.name.toLowerCase() === fLower || f.id === fLower);
    if (fObj && fObj.description) {
      if (fObj.description.toLowerCase().includes('spell resistance') || fObj.description.toLowerCase().includes('sr ')) {
        const parsed = parseSRText(fObj.description, characterLevel);
        if (parsed > 0 && !sources.some(s => s.name.toLowerCase().includes(fObj.name.toLowerCase()))) {
          sources.push({
            name: `Feat: ${fObj.name}`,
            category: 'feat',
            value: parsed
          });
        }
      }
    }
  }

  return sources;
}

/**
 * Calculates effective Spell Resistance (SR) for a character.
 * D&D 3.5e Rule:
 * - Spell Resistance values from different non-stacking items/races/classes DO NOT stack; take the highest.
 * - Feats like Boost Spell Resistance (+2 profane) and Improved Spell Resistance (+2 per rank) stack onto existing SR.
 */
export function calculateTotalSR(
  character: CharacterState,
  raceObj?: Partial<RaceData>,
  templateObj?: Partial<TemplateData>,
  featsData: FeatData[] = [],
  classesData: ClassData[] = []
): ActiveSRSummary {
  const sources = collectSRSources(character, raceObj, templateObj, featsData, classesData);
  const selectedFeats = character.selectedFeats || [];

  // Calculate stacking SR bonuses from feats
  let stackingBonus = 0;
  for (const fName of selectedFeats) {
    const fLower = fName.toLowerCase();

    // Boost Spell Resistance (+2 profane bonus to existing SR)
    if (fLower.includes('boost spell resistance')) {
      stackingBonus += 2;
    }

    // Improved Spell Resistance (+2 per rank)
    if (fLower === 'improved spell resistance' || fLower.includes('improved spell resistance x')) {
      let count = 1;
      if (fLower.includes('x3')) count = 3;
      else if (fLower.includes('x2')) count = 2;
      stackingBonus += count * 2;
    }
  }

  if (sources.length === 0) {
    return {
      bestSR: 0,
      bestSRString: 'None',
      hasSR: false,
      baseSR: 0,
      bonusSR: 0,
      sources: []
    };
  }

  // Find the highest base SR
  let maxBaseSR = 0;
  sources.forEach(s => {
    if (s.value > maxBaseSR) {
      maxBaseSR = s.value;
    }
  });

  const totalSR = maxBaseSR + stackingBonus;

  return {
    bestSR: totalSR,
    bestSRString: `SR ${totalSR}`,
    hasSR: totalSR > 0,
    baseSR: maxBaseSR,
    bonusSR: stackingBonus,
    sources
  };
}
