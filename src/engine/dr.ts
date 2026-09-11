import { CharacterState, RaceData, ClassData, TemplateData, FeatData, Equipment } from '../types/character';
import { getCharacterLevel, parseVal } from './stats';
import { resolveArmor } from './equipment';

export interface DRSource {
  name: string;
  category: 'race' | 'template' | 'feat' | 'class' | 'equipment' | 'aura' | 'custom';
  value: number;
  bypass: string;
  stacks: boolean;
  abilityType?: 'Ex' | 'Su';
}

export interface DREntry {
  value: number;
  bypass: string;
  abilityType?: 'Ex' | 'Su';
}

export interface ActiveDRSummary {
  bestDRString: string;
  fullDRString: string;
  hasDR: boolean;
  baselineStackingDR: number;
  sources: DRSource[];
  effectiveDRList: DREntry[];
}

/**
 * Port of DRCalc.bas - GetDRValue
 * Extracts the maximum DR value matching a specific DR bypass type from a DR text string.
 */
export function GetDRValue(drText: string, drType: string): number {
  if (!drText || !drType) return 0;
  let maxVal = 0;
  if (drText.toLowerCase().includes(drType.toLowerCase())) {
    const parts = drText.includes(',') ? drText.split(',') : [drText];
    for (const part of parts) {
      const trimmed = part.trim();
      const slashIdx = trimmed.indexOf('/');
      if (slashIdx !== -1) {
        const bypass = trimmed.substring(slashIdx + 1).trim();
        if (bypass.toLowerCase() === drType.toLowerCase()) {
          const valStr = trimmed.substring(0, slashIdx).replace(/[^0-9]/g, '');
          const val = parseInt(valStr, 10);
          if (!isNaN(val) && val > maxVal) {
            maxVal = val;
          }
        }
      }
    }
  }
  return maxVal;
}

/**
 * Port of DRCalc.bas - GetDRCombo
 * Extracts compound DR bypass type (e.g. "Magic and Silver", "Cold Iron or Evil")
 */
export function GetDRCombo(drText: string, drComboType: string): string {
  if (!drText || !drComboType) return ` ${drComboType} `;
  const comboTarget = ` ${drComboType.trim()} `;
  if (drText.toLowerCase().includes(comboTarget.toLowerCase())) {
    const parts = drText.includes(',') ? drText.split(',') : [drText];
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.toLowerCase().includes(comboTarget.toLowerCase())) {
        if (comboTarget.trim().toLowerCase() !== 'or' || !trimmed.toLowerCase().includes(' and ')) {
          const slashIdx = trimmed.indexOf('/');
          if (slashIdx !== -1) {
            return trimmed.substring(slashIdx + 1).trim();
          }
        }
      }
    }
  }
  return comboTarget.trim();
}

/**
 * Port of DRCalc.bas - GetDRAbilityType
 * Determines whether DR is Extraordinary (Ex) or Supernatural (Su)
 */
export function GetDRAbilityType(drText: string): 'Ex' | 'Su' {
  if (!drText) return 'Ex';
  const lower = drText.toLowerCase();
  if (lower.includes('su') || lower.includes('supernatural') || lower.includes('magic') || lower.includes('alignment')) {
    return 'Su';
  }
  return 'Ex';
}

/**
 * Parses DR text strings into structured DREntry objects.
 * Examples: "DR 5/Adamantine", "10/Magic and Silver", "5/magic, 3/-"
 */
export function parseDRText(text: string): DREntry[] {
  if (!text) return [];
  const results: DREntry[] = [];

  // Split ONLY on commas or semicolons for separate DR entries
  const chunks = text.split(/[,;]/).map(s => s.trim()).filter(Boolean);

  // Regex to match "DR 5/Magic" or "5/Adamantine" or "3/-" or "10/Silver and Magic"
  const drRegex = /(?:DR\s*)?(\d+)\s*\/\s*([A-Za-z0-9\s\-]+)/i;

  for (const chunk of chunks) {
    const match = chunk.match(drRegex);
    if (match) {
      const val = parseInt(match[1], 10);
      const bypass = match[2].trim();
      if (!isNaN(val) && val > 0 && bypass) {
        results.push({
          value: val,
          bypass: normalizeBypass(bypass),
          abilityType: GetDRAbilityType(bypass)
        });
      }
    }
  }

  return results;
}

export function normalizeBypass(bypass: string): string {
  if (!bypass) return '-';
  const clean = bypass.trim();
  if (clean === '-' || clean.toLowerCase() === 'none' || clean.toLowerCase() === 'n/a') return '-';
  // Capitalize nicely (e.g., "adamantine" -> "Adamantine", "cold iron" -> "Cold Iron")
  return clean.split(' ').map(word => {
    if (word.toLowerCase() === 'and' || word.toLowerCase() === 'or') return word.toLowerCase();
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

/**
 * Collects all active DR sources for a character across Race, Template, Feats, Classes, and Equipment.
 */
export function collectDRSources(
  character: CharacterState,
  raceObj?: Partial<RaceData>,
  templateObj?: Partial<TemplateData>,
  featsData: FeatData[] = [],
  classesData: ClassData[] = []
): DRSource[] {
  const sources: DRSource[] = [];
  const levelProgression = character.levelProgression || [];
  const characterLevel = getCharacterLevel(levelProgression);
  const selectedFeats = character.selectedFeats || [];

  // 1. Race DR
  if (raceObj) {
    if (raceObj.specialAbilities) {
      const parsed = parseDRText(raceObj.specialAbilities);
      parsed.forEach(p => {
        sources.push({
          name: `Racial (${raceObj.name})`,
          category: 'race',
          value: p.value,
          bypass: p.bypass,
          stacks: false,
          abilityType: p.abilityType
        });
      });
    }
    // Hardcoded known racial DR if not in specialAbilities text
    const rName = (raceObj.name || '').toLowerCase();
    if (rName.includes('gargoyle') && !sources.some(s => s.category === 'race')) {
      sources.push({ name: 'Racial (Gargoyle)', category: 'race', value: 10, bypass: 'Magic', stacks: false, abilityType: 'Su' });
    } else if (rName.includes('earth elemental') && !sources.some(s => s.category === 'race')) {
      sources.push({ name: 'Racial (Earth Elemental)', category: 'race', value: 5, bypass: '-', stacks: false, abilityType: 'Ex' });
    }
  }

  // 2. Template DR
  if (templateObj) {
    if (templateObj.specialAbilities) {
      const parsed = parseDRText(templateObj.specialAbilities);
      parsed.forEach(p => {
        sources.push({
          name: `Template (${templateObj.name})`,
          category: 'template',
          value: p.value,
          bypass: p.bypass,
          stacks: false,
          abilityType: p.abilityType
        });
      });
    }
    const tName = (templateObj.name || '').toLowerCase();
    if (tName.includes('lich') && !sources.some(s => s.category === 'template')) {
      sources.push({ name: 'Lich Template', category: 'template', value: 15, bypass: 'Bludgeoning and Magic', stacks: false, abilityType: 'Su' });
    } else if (tName.includes('vampire') && !sources.some(s => s.category === 'template')) {
      sources.push({ name: 'Vampire Template', category: 'template', value: 10, bypass: 'Silver and Magic', stacks: false, abilityType: 'Su' });
    } else if (tName.includes('woodling') && !sources.some(s => s.category === 'template')) {
      sources.push({ name: 'Woodling Template', category: 'template', value: 5, bypass: 'Slashing', stacks: false, abilityType: 'Ex' });
    } else if (tName.includes('half-fiend') && !sources.some(s => s.category === 'template')) {
      const drVal = characterLevel >= 12 ? 10 : 5;
      sources.push({ name: 'Half-Fiend Template', category: 'template', value: drVal, bypass: 'Magic', stacks: false, abilityType: 'Su' });
    } else if (tName.includes('half-celestial') && !sources.some(s => s.category === 'template')) {
      const drVal = characterLevel >= 12 ? 10 : 5;
      sources.push({ name: 'Half-Celestial Template', category: 'template', value: drVal, bypass: 'Magic', stacks: false, abilityType: 'Su' });
    }
  }

  // 3. Class Features DR
  const classCounts: Record<string, number> = {};
  levelProgression.forEach(l => {
    if (l.primaryClass) {
      classCounts[l.primaryClass] = (classCounts[l.primaryClass] || 0) + 1;
    }
  });

  for (const [clsName, count] of Object.entries(classCounts)) {
    const cLower = clsName.toLowerCase();

    // Barbarian DR: 1/- at 7, 2/- at 10, 3/- at 13, 4/- at 16, 5/- at 19 (STACKS)
    if (cLower === 'barbarian' && count >= 7) {
      const drVal = 1 + Math.floor((count - 7) / 3);
      sources.push({
        name: `Barbarian DR (${drVal}/-)`,
        category: 'class',
        value: drVal,
        bypass: '-',
        stacks: true,
        abilityType: 'Ex'
      });
    }

    // Dwarven Defender DR: 3/- at 2, 6/- at 6, 9/- at 10 (STACKS)
    if (cLower.includes('dwarven defender') && count >= 2) {
      let drVal = 3;
      if (count >= 10) drVal = 9;
      else if (count >= 6) drVal = 6;
      sources.push({
        name: `Dwarven Defender DR (${drVal}/-)`,
        category: 'class',
        value: drVal,
        bypass: '-',
        stacks: true,
        abilityType: 'Ex'
      });
    }

    // Warlock DR: 1/cold iron at 3, 2 at 7, 3 at 11, 4 at 15, 5 at 19 (non-stacking base)
    if (cLower === 'warlock' && count >= 3) {
      const drVal = 1 + Math.floor((count - 3) / 4);
      sources.push({
        name: `Warlock DR (${drVal}/Cold Iron)`,
        category: 'class',
        value: drVal,
        bypass: 'Cold Iron',
        stacks: false,
        abilityType: 'Su'
      });
    }

    // Dragon Shaman DR: 1/magic at 9, 2 at 12, 3 at 15, 4 at 18
    if (cLower.includes('dragon shaman') && count >= 9) {
      const drVal = 1 + Math.floor((count - 9) / 3);
      sources.push({
        name: `Dragon Shaman DR (${drVal}/Magic)`,
        category: 'class',
        value: drVal,
        bypass: 'Magic',
        stacks: false,
        abilityType: 'Su'
      });
    }

    // Wilder DR (Elusiveness): 1/- at 2, 2/- at 7, 3/- at 12, 4/- at 17 (STACKS)
    if (cLower === 'wilder' && count >= 2) {
      const drVal = 1 + Math.floor((count - 2) / 5);
      sources.push({
        name: `Wilder Elusiveness DR (${drVal}/-)`,
        category: 'class',
        value: drVal,
        bypass: '-',
        stacks: true,
        abilityType: 'Ex'
      });
    }
  }

  // 4. Feats DR
  for (const fName of selectedFeats) {
    const fLower = fName.toLowerCase();

    // Roll With It (+2/- per selection, STACKS)
    if (fLower.includes('roll with it')) {
      let rollCount = 1;
      if (fLower.includes('x3')) rollCount = 3;
      else if (fLower.includes('x2')) rollCount = 2;
      sources.push({
        name: `Roll With It (${rollCount * 2}/-)`,
        category: 'feat',
        value: rollCount * 2,
        bypass: '-',
        stacks: true,
        abilityType: 'Ex'
      });
    }

    // Armor Specialization (+2/- while wearing armor, STACKS)
    if (fLower.includes('armor specialization')) {
      sources.push({
        name: 'Armor Specialization (2/-)',
        category: 'feat',
        value: 2,
        bypass: '-',
        stacks: true,
        abilityType: 'Ex'
      });
    }

    // Epic DR / Damage Reduction (+3/- per selection, STACKS)
    if (fLower === 'damage reduction' || fLower === 'improved damage reduction' || fLower.includes('damage reduction x')) {
      let count = 1;
      if (fLower.includes('x3')) count = 3;
      else if (fLower.includes('x2')) count = 2;
      sources.push({
        name: `Damage Reduction Feat (${count * 3}/-)`,
        category: 'feat',
        value: count * 3,
        bypass: '-',
        stacks: true,
        abilityType: 'Ex'
      });
    }

    // Divine Damage Reduction (2/Adamantine, non-stacking)
    if (fLower.includes('divine damage reduction')) {
      sources.push({
        name: 'Divine Damage Reduction (2/Adamantine)',
        category: 'feat',
        value: 2,
        bypass: 'Adamantine',
        stacks: false,
        abilityType: 'Su'
      });
    }

    // Fey Skin / Fey Heritage (1/Cold Iron + 1 per 2 Fey feats)
    if (fLower.includes('fey skin')) {
      const feyCount = selectedFeats.filter(f => f.toLowerCase().includes('fey')).length;
      const feyDR = 1 + Math.floor(feyCount / 2);
      sources.push({
        name: `Fey Skin (${feyDR}/Cold Iron)`,
        category: 'feat',
        value: feyDR,
        bypass: 'Cold Iron',
        stacks: false,
        abilityType: 'Su'
      });
    }

    // Check general feat description from featsData if not covered above
    const fObj = featsData.find(f => f.name.toLowerCase() === fLower || f.id === fLower);
    if (fObj && fObj.description) {
      if (fObj.description.toLowerCase().includes('damage reduction') || fObj.description.toLowerCase().includes('dr ')) {
        const parsed = parseDRText(fObj.description);
        parsed.forEach(p => {
          if (!sources.some(s => s.name.toLowerCase().includes(fObj.name.toLowerCase()))) {
            sources.push({
              name: `Feat: ${fObj.name}`,
              category: 'feat',
              value: p.value,
              bypass: p.bypass,
              stacks: fObj.description.toLowerCase().includes('in addition to') || fObj.description.toLowerCase().includes('stacks'),
              abilityType: p.abilityType
            });
          }
        });
      }
    }
  }

  // 5. Equipment DR (e.g. Adamantine Armor)
  const equippedArmorItem = character.equipment?.armorItemId
    ? (character.inventory || []).find(i => i.id === character.equipment!.armorItemId)
    : undefined;

  if (character.equipment?.armor && character.equipment.armor !== 'none') {
    const customArmors = character.customArmors || [];
    const armorObj = resolveArmor(character.equipment.armor, customArmors);
    const armorName = (equippedArmorItem?.name || armorObj.name || '').toLowerCase();
    const armorKey = (character.equipment.armor || '').toLowerCase();
    const customArmor = customArmors.find(a => a.id === character.equipment.armor || a.name.toLowerCase() === armorKey || a.id.toLowerCase() === armorKey);

    const detectedType = (
      equippedArmorItem?.armorData?.type ||
      customArmor?.type ||
      armorObj.type ||
      ''
    ).toLowerCase();

    const isAdamantine = armorName.includes('adamantine') || armorKey.includes('adamantine') ||
      Boolean(customArmor && customArmor.name.toLowerCase().includes('adamantine')) ||
      Boolean(equippedArmorItem?.specialQualities?.some(q => q.toLowerCase().includes('adamantine')));

    if (isAdamantine) {
      let adamantineVal = 1; // Light armor fallback
      if (detectedType === 'heavy') {
        adamantineVal = 3;
      } else if (detectedType === 'medium') {
        adamantineVal = 2;
      }
      sources.push({
        name: `Adamantine Armor (${adamantineVal}/-)`,
        category: 'equipment',
        value: adamantineVal,
        bypass: '-',
        stacks: true,
        abilityType: 'Ex'
      });
    }

    // Armor / Shield Special Qualities DR (e.g. Invulnerability)
    const armorQualities = [
      ...(character.equipment.armorQualities || []),
      ...(character.equipment.shieldQualities || [])
    ];
    if (armorQualities.some(q => q.toLowerCase() === 'invulnerability')) {
      sources.push({
        name: 'Armor Quality: Invulnerability (5/Magic)',
        category: 'equipment',
        value: 5,
        bypass: 'Magic',
        stacks: false,
        abilityType: 'Su'
      });
    }
  }

  // Wondrous Items & Magic Gear DR
  if (character.equipment?.wondrousItems) {
    character.equipment.wondrousItems.forEach(item => {
      if (item.effect) {
        const parsed = parseDRText(item.effect);
        parsed.forEach(p => {
          sources.push({
            name: item.name,
            category: 'equipment',
            value: p.value,
            bypass: p.bypass,
            stacks: item.effect.toLowerCase().includes('stacks') || item.effect.toLowerCase().includes('in addition'),
            abilityType: p.abilityType
          });
        });
      }
    });
  }

  // 6. Active Auras DR
  if (character.auras) {
    character.auras.filter(a => a.active && a.effect).forEach(aura => {
      const parsed = parseDRText(aura.effect);
      parsed.forEach(p => {
        sources.push({
          name: `Aura: ${aura.name}`,
          category: 'aura',
          value: p.value,
          bypass: p.bypass,
          stacks: aura.effect.toLowerCase().includes('stacks'),
          abilityType: p.abilityType
        });
      });
    });
  }

  return sources;
}

/**
 * Compares stacking vs non-stacking DR rules and calculates the character's effective active DR ratings.
 * D&D 3.5e Rule:
 * - DR from stacking sources (Barbarian DR, Roll With It, Armor Spec, Adamantine armor) sums to baselineStackingDR.
 * - For each non-stacking bypass type, effective DR = maxNonStackingValue + baselineStackingDR.
 * - Thick-skinned feat adds +2 per rank to all DR ratings.
 */
export function calculateTotalDR(
  character: CharacterState,
  raceObj?: Partial<RaceData>,
  templateObj?: Partial<TemplateData>,
  featsData: FeatData[] = [],
  classesData: ClassData[] = []
): ActiveDRSummary {
  const sources = collectDRSources(character, raceObj, templateObj, featsData, classesData);
  const selectedFeats = character.selectedFeats || [];

  // Check for Thick-skinned feat bonus (+2 to all DR per rank)
  let thickSkinnedBonus = 0;
  selectedFeats.forEach(f => {
    const fLower = f.toLowerCase();
    if (fLower.includes('thick-skinned') || fLower.includes('thick skinned')) {
      if (fLower.includes('x3')) thickSkinnedBonus += 6;
      else if (fLower.includes('x2')) thickSkinnedBonus += 4;
      else thickSkinnedBonus += 2;
    }
  });

  // Calculate baseline stacking DR (sources with stacks: true)
  const stackingSources = sources.filter(s => s.stacks);
  const nonStackingSources = sources.filter(s => !s.stacks);

  let baselineStackingDR = stackingSources.reduce((sum, s) => sum + s.value, 0) + thickSkinnedBonus;

  // Group non-stacking sources by bypass
  const bypassMap: Record<string, { maxVal: number; abilityType?: 'Ex' | 'Su' }> = {};

  nonStackingSources.forEach(s => {
    const key = normalizeBypass(s.bypass);
    if (!bypassMap[key] || s.value > bypassMap[key].maxVal) {
      bypassMap[key] = { maxVal: s.value, abilityType: s.abilityType };
    }
  });

  const effectiveDRList: DREntry[] = [];

  // Apply baseline stacking DR onto each non-stacking bypass category
  const bypassKeys = Object.keys(bypassMap);

  if (bypassKeys.length > 0) {
    for (const key of bypassKeys) {
      const totalVal = bypassMap[key].maxVal + baselineStackingDR;
      effectiveDRList.push({
        value: totalVal,
        bypass: key,
        abilityType: bypassMap[key].abilityType
      });
    }
  } else if (baselineStackingDR > 0) {
    // If character only has stacking DR (e.g. Barbarian 2/- + Roll With It 2/- = 4/-)
    effectiveDRList.push({
      value: baselineStackingDR,
      bypass: '-',
      abilityType: 'Ex'
    });
  }

  // Sort effective DR list descending by value
  effectiveDRList.sort((a, b) => b.value - a.value);

  const hasDR = effectiveDRList.length > 0;

  // Determine best active DR rating string (e.g. "DR 5/Adamantine" or "DR 10/Magic")
  let bestDRString = 'None';
  let fullDRString = 'None';

  if (hasDR) {
    const best = effectiveDRList[0];
    bestDRString = `DR ${best.value}/${best.bypass}`;

    fullDRString = effectiveDRList.map(e => `DR ${e.value}/${e.bypass}`).join(', ');
  }

  return {
    bestDRString,
    fullDRString,
    hasDR,
    baselineStackingDR,
    sources,
    effectiveDRList
  };
}
