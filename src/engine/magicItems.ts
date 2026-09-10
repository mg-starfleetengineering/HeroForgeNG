/**
 * D&D 3.5e Magic Item Special Qualities Catalog & Calculations
 * Source: D&D 3.5e Dungeon Master's Guide (DMG) Chapter 7
 */

import { WeaponData, CustomArmorData } from '../types/character';

export type QualityTarget = 'weapon' | 'melee' | 'ranged' | 'armor' | 'shield' | 'armor_or_shield';

export type CostType = 'bonus' | 'gp';

export interface DamageBonus {
  dice: string; // e.g. '1d6', '2d6'
  type: string; // e.g. 'Fire', 'Cold', 'Electricity', 'Holy'
  condition?: string; // e.g. 'vs Evil', 'vs Good'
}

export interface MagicQuality {
  id: string;
  name: string;
  target: QualityTarget;
  costType: CostType;
  costValue: number; // +1 to +5 for 'bonus' type, or raw GP amount for 'gp' type
  description: string;
  damageBonus?: DamageBonus;
  threatMultiplier?: number; // e.g. 2 for Keen (doubles threat range)
  extraAttacks?: number; // e.g. 1 for Speed
  fortificationPercent?: number; // 25, 75, 100
  skillBonus?: {
    skill: string;
    bonus: number;
    type: 'competence';
  };
  drGrant?: {
    value: number;
    bypass: string;
  };
  srGrant?: number;
  source?: string;
}

// ----------------------------------------------------------------------
// WEAPON SPECIAL QUALITIES CATALOG (3.5e DMG)
// ----------------------------------------------------------------------

export const WEAPON_SPECIAL_QUALITIES: MagicQuality[] = [
  {
    id: 'flaming',
    name: 'Flaming',
    target: 'weapon',
    costType: 'bonus',
    costValue: 1,
    description: '+1d6 fire damage on successful hits.',
    damageBonus: { dice: '1d6', type: 'Fire' }
  },
  {
    id: 'frost',
    name: 'Frost',
    target: 'weapon',
    costType: 'bonus',
    costValue: 1,
    description: '+1d6 cold damage on successful hits.',
    damageBonus: { dice: '1d6', type: 'Cold' }
  },
  {
    id: 'shock',
    name: 'Shock',
    target: 'weapon',
    costType: 'bonus',
    costValue: 1,
    description: '+1d6 electricity damage on successful hits.',
    damageBonus: { dice: '1d6', type: 'Electricity' }
  },
  {
    id: 'keen',
    name: 'Keen',
    target: 'melee',
    costType: 'bonus',
    costValue: 1,
    description: 'Doubles the weapon\'s critical threat range (e.g. 19-20 becomes 17-20). Only applies to piercing or slashing weapons.',
    threatMultiplier: 2
  },
  {
    id: 'holy',
    name: 'Holy',
    target: 'weapon',
    costType: 'bonus',
    costValue: 2,
    description: '+2d6 damage against evil creatures and weapon bypasses Good damage reduction.',
    damageBonus: { dice: '2d6', type: 'Holy', condition: 'vs Evil' }
  },
  {
    id: 'speed',
    name: 'Speed',
    target: 'weapon',
    costType: 'bonus',
    costValue: 3,
    description: 'When making a full attack action, the wielder may make 1 extra attack at highest BAB (does not stack with Haste).',
    extraAttacks: 1
  },
  {
    id: 'flaming_burst',
    name: 'Flaming Burst',
    target: 'weapon',
    costType: 'bonus',
    costValue: 2,
    description: '+1d6 fire damage on hits, plus extra fire damage on critical hit (+1d10 for x2, +2d10 for x3, +3d10 for x4).',
    damageBonus: { dice: '1d6', type: 'Fire' }
  },
  {
    id: 'icy_burst',
    name: 'Icy Burst',
    target: 'weapon',
    costType: 'bonus',
    costValue: 2,
    description: '+1d6 cold damage on hits, plus extra cold damage on critical hit (+1d10 for x2, +2d10 for x3, +3d10 for x4).',
    damageBonus: { dice: '1d6', type: 'Cold' }
  },
  {
    id: 'shocking_burst',
    name: 'Shocking Burst',
    target: 'weapon',
    costType: 'bonus',
    costValue: 2,
    description: '+1d6 electricity damage on hits, plus extra electricity damage on critical hit (+1d10 for x2, +2d10 for x3, +3d10 for x4).',
    damageBonus: { dice: '1d6', type: 'Electricity' }
  },
  {
    id: 'unholy',
    name: 'Unholy',
    target: 'weapon',
    costType: 'bonus',
    costValue: 2,
    description: '+2d6 damage against good creatures and weapon bypasses Evil damage reduction.',
    damageBonus: { dice: '2d6', type: 'Unholy', condition: 'vs Good' }
  },
  {
    id: 'anarchic',
    name: 'Anarchic',
    target: 'weapon',
    costType: 'bonus',
    costValue: 2,
    description: '+2d6 damage against lawful creatures and weapon bypasses Chaotic damage reduction.',
    damageBonus: { dice: '2d6', type: 'Chaos', condition: 'vs Lawful' }
  },
  {
    id: 'axiomatic',
    name: 'Axiomatic',
    target: 'weapon',
    costType: 'bonus',
    costValue: 2,
    description: '+2d6 damage against chaotic creatures and weapon bypasses Lawful damage reduction.',
    damageBonus: { dice: '2d6', type: 'Law', condition: 'vs Chaotic' }
  },
  {
    id: 'ghost_touch_weapon',
    name: 'Ghost Touch',
    target: 'weapon',
    costType: 'bonus',
    costValue: 1,
    description: 'Deals normal damage against incorporeal creatures regardless of their 50% incorporeal miss chance.'
  },
  {
    id: 'bane',
    name: 'Bane',
    target: 'weapon',
    costType: 'bonus',
    costValue: 1,
    description: '+2 effective enhancement bonus and +2d6 damage against a designated creature type.',
    damageBonus: { dice: '2d6', type: 'Bane', condition: 'vs Designated Foe' }
  },
  {
    id: 'vicious',
    name: 'Vicious',
    target: 'melee',
    costType: 'bonus',
    costValue: 1,
    description: '+2d6 damage to the target on hit, while the wielder suffers 1d6 damage in feedback.',
    damageBonus: { dice: '2d6', type: 'Vicious' }
  },
  {
    id: 'vorpal',
    name: 'Vorpal',
    target: 'melee',
    costType: 'bonus',
    costValue: 5,
    description: 'On a confirmed natural 20 critical hit, severs the opponent\'s head (slashing weapons only).'
  },
  {
    id: 'defending',
    name: 'Defending',
    target: 'melee',
    costType: 'bonus',
    costValue: 1,
    description: 'Allows the wielder to allocate some or all of the weapon\'s enhancement bonus as a dodge bonus to AC.'
  },
  {
    id: 'distance',
    name: 'Distance',
    target: 'ranged',
    costType: 'bonus',
    costValue: 1,
    description: 'Doubles the weapon\'s range increment.'
  },
  {
    id: 'returning',
    name: 'Returning',
    target: 'weapon',
    costType: 'bonus',
    costValue: 1,
    description: 'Thrown weapon returns through the air just before the wielder\'s next turn.'
  },
  {
    id: 'seeking',
    name: 'Seeking',
    target: 'ranged',
    costType: 'bonus',
    costValue: 1,
    description: 'Negates miss chances from concealment or cover for ranged attacks.'
  },
  {
    id: 'thundering',
    name: 'Thundering',
    target: 'weapon',
    costType: 'bonus',
    costValue: 1,
    description: 'Deals extra sonic damage on critical hits (+1d8 for x2, +2d8 for x3, +3d8 for x4) and deafens target.'
  },
  {
    id: 'merciful',
    name: 'Merciful',
    target: 'weapon',
    costType: 'bonus',
    costValue: 1,
    description: '+1d6 damage, and all damage dealt by the weapon is nonlethal.',
    damageBonus: { dice: '1d6', type: 'Nonlethal' }
  }
];

// ----------------------------------------------------------------------
// ARMOR & SHIELD SPECIAL QUALITIES CATALOG (3.5e DMG)
// ----------------------------------------------------------------------

export const ARMOR_SPECIAL_QUALITIES: MagicQuality[] = [
  {
    id: 'fortification_light',
    name: 'Fortification (Light 25%)',
    target: 'armor_or_shield',
    costType: 'bonus',
    costValue: 1,
    description: '25% chance to negate critical hits and sneak attacks, converting them to normal damage.',
    fortificationPercent: 25
  },
  {
    id: 'fortification_moderate',
    name: 'Fortification (Moderate 75%)',
    target: 'armor_or_shield',
    costType: 'bonus',
    costValue: 3,
    description: '75% chance to negate critical hits and sneak attacks, converting them to normal damage.',
    fortificationPercent: 75
  },
  {
    id: 'fortification_heavy',
    name: 'Fortification (Heavy 100%)',
    target: 'armor_or_shield',
    costType: 'bonus',
    costValue: 5,
    description: '100% chance to negate critical hits and sneak attacks, making the wearer immune to crits and sneak attacks.',
    fortificationPercent: 100
  },
  {
    id: 'shadow',
    name: 'Shadow',
    target: 'armor',
    costType: 'gp',
    costValue: 3750,
    description: 'Grants a +5 competence bonus on Hide checks.',
    skillBonus: { skill: 'Hide', bonus: 5, type: 'competence' }
  },
  {
    id: 'improved_shadow',
    name: 'Improved Shadow',
    target: 'armor',
    costType: 'gp',
    costValue: 15000,
    description: 'Grants a +10 competence bonus on Hide checks.',
    skillBonus: { skill: 'Hide', bonus: 10, type: 'competence' }
  },
  {
    id: 'greater_shadow',
    name: 'Greater Shadow',
    target: 'armor',
    costType: 'gp',
    costValue: 33750,
    description: 'Grants a +15 competence bonus on Hide checks.',
    skillBonus: { skill: 'Hide', bonus: 15, type: 'competence' }
  },
  {
    id: 'silent_moves',
    name: 'Silent Moves',
    target: 'armor',
    costType: 'gp',
    costValue: 3750,
    description: 'Grants a +5 competence bonus on Move Silently checks.',
    skillBonus: { skill: 'Move Silently', bonus: 5, type: 'competence' }
  },
  {
    id: 'improved_silent_moves',
    name: 'Improved Silent Moves',
    target: 'armor',
    costType: 'gp',
    costValue: 15000,
    description: 'Grants a +10 competence bonus on Move Silently checks.',
    skillBonus: { skill: 'Move Silently', bonus: 10, type: 'competence' }
  },
  {
    id: 'greater_silent_moves',
    name: 'Greater Silent Moves',
    target: 'armor',
    costType: 'gp',
    costValue: 33750,
    description: 'Grants a +15 competence bonus on Move Silently checks.',
    skillBonus: { skill: 'Move Silently', bonus: 15, type: 'competence' }
  },
  {
    id: 'slick',
    name: 'Slick',
    target: 'armor',
    costType: 'gp',
    costValue: 3750,
    description: 'Grants a +5 competence bonus on Escape Artist checks.',
    skillBonus: { skill: 'Escape Artist', bonus: 5, type: 'competence' }
  },
  {
    id: 'improved_slick',
    name: 'Improved Slick',
    target: 'armor',
    costType: 'gp',
    costValue: 15000,
    description: 'Grants a +10 competence bonus on Escape Artist checks.',
    skillBonus: { skill: 'Escape Artist', bonus: 10, type: 'competence' }
  },
  {
    id: 'greater_slick',
    name: 'Greater Slick',
    target: 'armor',
    costType: 'gp',
    costValue: 33750,
    description: 'Grants a +15 competence bonus on Escape Artist checks.',
    skillBonus: { skill: 'Escape Artist', bonus: 15, type: 'competence' }
  },
  {
    id: 'invulnerability',
    name: 'Invulnerability',
    target: 'armor',
    costType: 'bonus',
    costValue: 3,
    description: 'Grants Damage Reduction 5/magic.',
    drGrant: { value: 5, bypass: 'magic' }
  },
  {
    id: 'spell_resistance_13',
    name: 'Spell Resistance (13)',
    target: 'armor',
    costType: 'bonus',
    costValue: 2,
    description: 'Grants the wearer Spell Resistance 13.',
    srGrant: 13
  },
  {
    id: 'spell_resistance_15',
    name: 'Spell Resistance (15)',
    target: 'armor',
    costType: 'bonus',
    costValue: 3,
    description: 'Grants the wearer Spell Resistance 15.',
    srGrant: 15
  },
  {
    id: 'spell_resistance_17',
    name: 'Spell Resistance (17)',
    target: 'armor',
    costType: 'bonus',
    costValue: 4,
    description: 'Grants the wearer Spell Resistance 17.',
    srGrant: 17
  },
  {
    id: 'spell_resistance_19',
    name: 'Spell Resistance (19)',
    target: 'armor',
    costType: 'bonus',
    costValue: 5,
    description: 'Grants the wearer Spell Resistance 19.',
    srGrant: 19
  },
  {
    id: 'ghost_touch_armor',
    name: 'Ghost Touch',
    target: 'armor_or_shield',
    costType: 'bonus',
    costValue: 3,
    description: 'Armor/Shield bonus applies against incorporeal touch attacks.'
  },
  {
    id: 'glamered',
    name: 'Glamered',
    target: 'armor',
    costType: 'gp',
    costValue: 2700,
    description: 'Can assume the appearance of a normal set of clothing upon command.'
  },
  {
    id: 'animated',
    name: 'Animated',
    target: 'shield',
    costType: 'bonus',
    costValue: 2,
    description: 'Floats in front of the wielder, protecting them as if held in hand, while leaving both hands free.'
  },
  {
    id: 'arrow_deflection',
    name: 'Arrow Deflection',
    target: 'shield',
    costType: 'bonus',
    costValue: 2,
    description: 'Allows the user to attempt a DC 20 Reflex save once per round to deflect a ranged weapon attack.'
  }
];

// All qualities unified map
export const ARMOR_SHIELD_SPECIAL_QUALITIES = ARMOR_SPECIAL_QUALITIES;

export const ALL_SPECIAL_QUALITIES_MAP: Record<string, MagicQuality> = {};
[...WEAPON_SPECIAL_QUALITIES, ...ARMOR_SPECIAL_QUALITIES].forEach(q => {
  ALL_SPECIAL_QUALITIES_MAP[q.id] = q;
  ALL_SPECIAL_QUALITIES_MAP[q.name.toLowerCase()] = q;
});

// ID aliases for convenience
if (ALL_SPECIAL_QUALITIES_MAP['improved_shadow']) {
  ALL_SPECIAL_QUALITIES_MAP['shadow_improved'] = ALL_SPECIAL_QUALITIES_MAP['improved_shadow'];
}
if (ALL_SPECIAL_QUALITIES_MAP['greater_shadow']) {
  ALL_SPECIAL_QUALITIES_MAP['shadow_greater'] = ALL_SPECIAL_QUALITIES_MAP['greater_shadow'];
}
if (ALL_SPECIAL_QUALITIES_MAP['improved_silent_moves']) {
  ALL_SPECIAL_QUALITIES_MAP['silent_moves_improved'] = ALL_SPECIAL_QUALITIES_MAP['improved_silent_moves'];
}
if (ALL_SPECIAL_QUALITIES_MAP['greater_silent_moves']) {
  ALL_SPECIAL_QUALITIES_MAP['silent_moves_greater'] = ALL_SPECIAL_QUALITIES_MAP['greater_silent_moves'];
}

/**
 * Retrieves a quality by id or case-insensitive name.
 */
export function getQualityById(idOrName: string): MagicQuality | undefined {
  if (!idOrName) return undefined;
  const key = idOrName.toLowerCase().trim();
  return ALL_SPECIAL_QUALITIES_MAP[key];
}

/**
 * Returns eligible qualities for a weapon (melee, ranged, or any).
 */
export function getAvailableWeaponQualities(isRanged: boolean = false): MagicQuality[] {
  return WEAPON_SPECIAL_QUALITIES.filter(q => {
    if (q.target === 'weapon') return true;
    if (isRanged && q.target === 'ranged') return true;
    if (!isRanged && q.target === 'melee') return true;
    return false;
  });
}

/**
 * Returns eligible qualities for armor.
 */
export function getAvailableArmorQualities(): MagicQuality[] {
  return ARMOR_SPECIAL_QUALITIES.filter(q => q.target === 'armor' || q.target === 'armor_or_shield');
}

/**
 * Returns eligible qualities for shields.
 */
export function getAvailableShieldQualities(): MagicQuality[] {
  return ARMOR_SPECIAL_QUALITIES.filter(q => q.target === 'shield' || q.target === 'armor_or_shield');
}

/**
 * Calculates doubled critical threat range for Keen weapons.
 * D&D 3.5e Rule:
 * Base 20 (range 1: 20) -> 19 (range 2: 19-20)
 * Base 19 (range 2: 19-20) -> 17 (range 4: 17-20)
 * Base 18 (range 3: 18-20) -> 15 (range 6: 15-20)
 */
export function calculateKeenThreat(baseThreat: number): number {
  const threat = Math.max(1, Math.min(20, baseThreat || 20));
  const threatRange = 21 - threat;
  const doubledRange = threatRange * 2;
  return Math.max(1, 21 - doubledRange);
}

/**
 * Checks if 'keen' is present in the weapon's qualities.
 */
export function hasKeenQuality(qualities?: string[]): boolean {
  if (!qualities || qualities.length === 0) return false;
  return qualities.some(q => {
    const qLower = q.toLowerCase().trim();
    return qLower === 'keen' || qLower === 'quality_keen';
  });
}

/**
 * Checks if 'speed' is present in the weapon's qualities.
 */
export function hasSpeedQuality(qualities?: string[]): boolean {
  if (!qualities || qualities.length === 0) return false;
  return qualities.some(q => {
    const qLower = q.toLowerCase().trim();
    return qLower === 'speed' || qLower === 'quality_speed';
  });
}

export interface SpecialDamageResult {
  damageDiceString: string; // e.g. " + 1d6 Fire + 2d6 Holy (vs Evil)"
  damageDiceFormula: string; // e.g. "+1d6+2d6"
  bonusList: DamageBonus[];
  summaryLabels: string[];
}

/**
 * Gathers and compiles all extra damage dice granted by special qualities.
 * e.g. Flaming (+1d6 Fire), Frost (+1d6 Cold), Shock (+1d6 Elec), Holy (+2d6 Holy vs Evil)
 */
export function getWeaponSpecialDamage(qualities?: string[]): SpecialDamageResult {
  if (!qualities || qualities.length === 0) {
    return { damageDiceString: '', damageDiceFormula: '', bonusList: [], summaryLabels: [] };
  }

  const bonusList: DamageBonus[] = [];
  const stringParts: string[] = [];
  const formulaParts: string[] = [];
  const summaryLabels: string[] = [];

  for (const qId of qualities) {
    const q = getQualityById(qId);
    if (q && q.damageBonus) {
      bonusList.push(q.damageBonus);
      const conditionStr = q.damageBonus.condition ? ` (${q.damageBonus.condition})` : '';
      stringParts.push(`+ ${q.damageBonus.dice} ${q.damageBonus.type}${conditionStr}`);
      formulaParts.push(`+${q.damageBonus.dice}`);
      summaryLabels.push(`+${q.damageBonus.dice} ${q.damageBonus.type}`);
    }
  }

  return {
    damageDiceString: stringParts.length > 0 ? ` ${stringParts.join(' ')}` : '',
    damageDiceFormula: formulaParts.join(''),
    bonusList,
    summaryLabels
  };
}

/**
 * Calculates competence bonuses to skills (e.g. Hide from Shadow, Move Silently from Silent Moves).
 * Competence bonuses of the same type do not stack in 3.5e (takes maximum).
 */
export function getArmorSkillBonus(
  armorQualities?: string[],
  shieldQualities?: string[],
  skillName?: string
): number {
  if (!skillName) return 0;
  const targetSkill = skillName.toLowerCase().trim();
  const allQualities = [...(armorQualities || []), ...(shieldQualities || [])];
  if (allQualities.length === 0) return 0;

  let maxBonus = 0;
  for (const qId of allQualities) {
    const q = getQualityById(qId);
    if (q && q.skillBonus) {
      const qSkill = q.skillBonus.skill.toLowerCase().trim();
      if (qSkill === targetSkill) {
        if (q.skillBonus.bonus > maxBonus) {
          maxBonus = q.skillBonus.bonus;
        }
      }
    }
  }

  return maxBonus;
}

export interface FortificationSummary {
  hasFortification: boolean;
  percentage: number;
  percent: number;
  label: string;
  source: string;
  tier: 'light' | 'moderate' | 'heavy';
}

/**
 * Checks for Fortification (Light, Moderate, Heavy) on equipped armor or shield.
 * Takes the highest percentage (100% > 75% > 25%).
 */
export function getFortificationSummary(
  armorQualities?: string[],
  shieldQualities?: string[]
): FortificationSummary {
  const allArmor = armorQualities || [];
  const allShield = shieldQualities || [];
  let bestPercent = 0;
  let bestTier: 'light' | 'moderate' | 'heavy' = 'light';
  let bestLabel = '';
  let bestSource = '';

  for (const qId of allArmor) {
    const q = getQualityById(qId);
    if (q && q.fortificationPercent && q.fortificationPercent > bestPercent) {
      bestPercent = q.fortificationPercent;
      bestLabel = q.name;
      bestSource = `Armor (${q.name})`;
      if (bestPercent === 100) bestTier = 'heavy';
      else if (bestPercent === 75) bestTier = 'moderate';
      else bestTier = 'light';
    }
  }

  for (const qId of allShield) {
    const q = getQualityById(qId);
    if (q && q.fortificationPercent && q.fortificationPercent > bestPercent) {
      bestPercent = q.fortificationPercent;
      bestLabel = q.name;
      bestSource = `Shield (${q.name})`;
      if (bestPercent === 100) bestTier = 'heavy';
      else if (bestPercent === 75) bestTier = 'moderate';
      else bestTier = 'light';
    }
  }

  return {
    hasFortification: bestPercent > 0,
    percentage: bestPercent,
    percent: bestPercent,
    label: bestLabel,
    source: bestSource,
    tier: bestTier
  };
}

/**
 * Calculates total 3.5e market price and effective enhancement bonus.
 * Weapon Base Formula: (Total Enhancement Bonus)^2 * 2,000 gp + base cost + 300 gp (Masterwork) + flat GP qualities
 * Armor Base Formula:  (Total Enhancement Bonus)^2 * 1,000 gp + base cost + 150 gp (Masterwork) + flat GP qualities
 */
export function calculateTotalItemCost(
  baseItemCostGp: number,
  enhancementBonus: number,
  qualities: string[] = [],
  itemType: 'weapon' | 'armor' | 'shield' = 'weapon'
): { totalBonus: number; totalGp: number; breakdown: string } {
  let bonusEquiv = 0;
  let flatGp = 0;

  qualities.forEach(qId => {
    const q = getQualityById(qId);
    if (q) {
      if (q.costType === 'bonus') {
        bonusEquiv += q.costValue;
      } else if (q.costType === 'gp') {
        flatGp += q.costValue;
      }
    }
  });

  const totalBonus = enhancementBonus + bonusEquiv;
  const isWeapon = itemType === 'weapon';
  const mwkCost = isWeapon ? 300 : 150;
  const multiplier = isWeapon ? 2000 : 1000;

  const magicBaseCost = totalBonus > 0 ? (totalBonus * totalBonus) * multiplier : 0;
  const totalGp = baseItemCostGp + (totalBonus > 0 ? mwkCost : 0) + magicBaseCost + flatGp;

  const breakdown = totalBonus > 0
    ? `+${totalBonus} Equiv (+${enhancementBonus} base + +${bonusEquiv} qualities) = ${totalGp.toLocaleString()} gp`
    : `${totalGp.toLocaleString()} gp`;

  return { totalBonus, totalGp, breakdown };
}

/**
 * Cleanly formats a 3.5e magic item name based on its base name, enhancement bonus, and qualities.
 * e.g.:
 * - baseName="Longsword", enh=1, qualities=['flaming'] -> "+1 Flaming Longsword"
 * - baseName="Longsword", enh=1, qualities=['flaming', 'keen'] -> "+1 Flaming Keen Longsword"
 * - baseName="Chain Shirt", enh=2, qualities=['shadow'] -> "+2 Shadow Chain Shirt"
 * - baseName="Longsword", enh=0, qualities=[] -> "Longsword"
 */
export function formatMagicItemName(
  baseName: string,
  enhancementBonus: number = 0,
  qualities: string[] = []
): string {
  if (!baseName || baseName.trim() === '' || baseName === 'none') return baseName;

  // Use parseMagicItemName to safely strip existing leading +X and qualities
  const parsed = parseMagicItemName(baseName);
  let cleanBase = parsed.baseName.trim();

  // Strip remaining known fortification / SR prefixes
  cleanBase = cleanBase
    .replace(/^(?:Light|Moderate|Heavy)\s+Fortification\s+/i, '')
    .replace(/^SR\s+\d+\s+/i, '')
    .trim();

  const parts: string[] = [];
  if (enhancementBonus > 0) {
    parts.push(`+${enhancementBonus}`);
  }

  const qualityNames: string[] = [];
  for (const qId of qualities) {
    const q = getQualityById(qId);
    if (q) {
      if (q.id === 'fortification_light') qualityNames.push('Light Fortification');
      else if (q.id === 'fortification_moderate') qualityNames.push('Moderate Fortification');
      else if (q.id === 'fortification_heavy') qualityNames.push('Heavy Fortification');
      else if (q.id.startsWith('spell_resistance_')) qualityNames.push(`SR ${q.srGrant}`);
      else qualityNames.push(q.name);
    }
  }

  if (qualityNames.length > 0) {
    parts.push(qualityNames.join(' '));
  }

  parts.push(cleanBase);
  return parts.join(' ').trim();
}

export interface ParsedMagicItem {
  baseName: string;
  enhancementBonus: number;
  qualities: string[];
}

/**
 * Parses a 3.5e magic item name to extract enhancement bonus, special qualities, and base item name.
 * e.g.:
 * - "+1 Flaming Longsword" -> { baseName: 'Longsword', enhancementBonus: 1, qualities: ['flaming'] }
 * - "+2 Keen Falchion" -> { baseName: 'Falchion', enhancementBonus: 2, qualities: ['keen'] }
 * - "Unholy Holy Dagger" -> { baseName: 'Dagger', enhancementBonus: 0, qualities: ['unholy', 'holy'] }
 * - "Javelin" -> { baseName: 'Javelin', enhancementBonus: 0, qualities: [] }
 */
export function parseMagicItemName(
  fullName: string | undefined,
  targetHint?: 'weapon' | 'armor' | 'shield'
): ParsedMagicItem {
  if (!fullName || !fullName.trim()) {
    return { baseName: '', enhancementBonus: 0, qualities: [] };
  }

  let clean = fullName.trim();
  let enhancementBonus = 0;

  // 1. Extract leading +X enhancement bonus (e.g. "+1 ", "+2 ")
  const leadingEnh = clean.match(/^\+(\d+)\s+(.+)$/);
  if (leadingEnh) {
    enhancementBonus = parseInt(leadingEnh[1], 10);
    clean = leadingEnh[2].trim();
  } else {
    // 2. Extract trailing +X enhancement bonus (e.g. "Longsword +1")
    const trailingEnh = clean.match(/^(.+?)\s+\+(\d+)$/);
    if (trailingEnh) {
      enhancementBonus = parseInt(trailingEnh[2], 10);
      clean = trailingEnh[1].trim();
    }
  }

  const allQualities = targetHint === 'armor' || targetHint === 'shield'
    ? [...ARMOR_SPECIAL_QUALITIES, ...WEAPON_SPECIAL_QUALITIES]
    : [...WEAPON_SPECIAL_QUALITIES, ...ARMOR_SPECIAL_QUALITIES];

  // Sort qualities by name length descending so multi-word qualities match before single-word subsets
  const sortedQualities = [...allQualities].sort((a, b) => b.name.length - a.name.length);

  const matchedQualities: string[] = [];

  for (const q of sortedQualities) {
    const escaped = q.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = /[a-zA-Z0-9_]$/.test(q.name)
      ? `\\b${escaped}\\b`
      : `(?:^|\\s)${escaped}(?:\\s|$)`;
    const regex = new RegExp(pattern, 'i');
    if (regex.test(clean)) {
      if (!matchedQualities.includes(q.id)) {
        matchedQualities.push(q.id);
      }
      clean = clean.replace(regex, ' ').trim();
    }
  }

  // Also check special aliases like "Light Fortification", "Moderate Fortification", "Heavy Fortification", "SR 13", etc.
  const fortificationAliases: [string, string][] = [
    ['Heavy Fortification', 'fortification_heavy'],
    ['Moderate Fortification', 'fortification_moderate'],
    ['Light Fortification', 'fortification_light'],
    ['SR 19', 'spell_resistance_19'],
    ['SR 17', 'spell_resistance_17'],
    ['SR 15', 'spell_resistance_15'],
    ['SR 13', 'spell_resistance_13']
  ];
  for (const [alias, id] of fortificationAliases) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(clean)) {
      if (!matchedQualities.includes(id)) {
        matchedQualities.push(id);
      }
      clean = clean.replace(regex, ' ').trim();
    }
  }

  // Handle [Creature] Bane (e.g. "Dragon Bane Greatsword" -> strip "Dragon Bane")
  if (matchedQualities.includes('bane')) {
    clean = clean.replace(/^[a-zA-Z\s]+?\s+Bane\s+/i, '').replace(/\bBane\b/i, '').trim();
  }

  clean = clean.replace(/\s+/g, ' ').trim();

  return {
    baseName: clean || fullName.trim(),
    enhancementBonus,
    qualities: matchedQualities
  };
}

/**
 * Creates a persistent custom WeaponData object with baked-in enhancement and special qualities.
 */
export function createMagicWeaponData(
  baseWeapon: WeaponData,
  enhancementBonus: number = 0,
  qualities: string[] = [],
  customName?: string
): WeaponData {
  const name = customName?.trim() || formatMagicItemName(baseWeapon.name, enhancementBonus, qualities);
  const baseCostMatch = (baseWeapon.cost || '0').match(/([\d,]+)/);
  const baseCostGp = baseCostMatch ? parseInt(baseCostMatch[1].replace(/,/g, ''), 10) : 0;
  const costCalc = calculateTotalItemCost(baseCostGp, enhancementBonus, qualities, 'weapon');
  return {
    ...baseWeapon,
    id: `custom_magic_wpn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name,
    enhancementBonus,
    specialQualities: [...qualities],
    baseWeaponId: baseWeapon.id,
    cost: `${costCalc.totalGp.toLocaleString()} gp`,
    source: 'Custom Magic'
  };
}

/**
 * Creates a persistent CustomArmorData object with baked-in enhancement and special qualities.
 */
export function createMagicArmorData(
  baseArmor: {
    id?: string;
    name: string;
    acBonus: number;
    maxDex?: number;
    armorCheckPenalty?: number;
    type?: 'light' | 'medium' | 'heavy' | 'shield' | 'other';
    weight?: number;
    description?: string;
    cost?: string | number;
  },
  enhancementBonus: number = 0,
  qualities: string[] = [],
  customName?: string
): CustomArmorData {
  const name = customName?.trim() || formatMagicItemName(baseArmor.name, enhancementBonus, qualities);
  const rawCost = typeof baseArmor.cost === 'string' ? baseArmor.cost : (baseArmor.cost ? `${baseArmor.cost} gp` : (baseArmor.type === 'shield' ? '15 gp' : '100 gp'));
  const baseCostMatch = rawCost.match(/([\d,]+)/);
  const baseCostGp = baseCostMatch ? parseInt(baseCostMatch[1].replace(/,/g, ''), 10) : (baseArmor.type === 'shield' ? 15 : 100);
  const itemType = baseArmor.type === 'shield' ? 'shield' : 'armor';
  const costCalc = calculateTotalItemCost(baseCostGp, enhancementBonus, qualities, itemType);
  return {
    id: `custom_magic_armor_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name,
    acBonus: baseArmor.acBonus,
    maxDex: baseArmor.maxDex !== undefined ? baseArmor.maxDex : 8,
    armorCheckPenalty: baseArmor.armorCheckPenalty !== undefined ? baseArmor.armorCheckPenalty : 0,
    type: baseArmor.type || 'medium',
    weight: baseArmor.weight !== undefined ? baseArmor.weight : 20,
    description: baseArmor.description || '',
    enhancementBonus,
    specialQualities: [...qualities],
    baseArmorId: baseArmor.id,
    cost: `${costCalc.totalGp.toLocaleString()} gp`
  };
}
