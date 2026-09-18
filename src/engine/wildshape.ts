import {
  CharacterState,
  WildShapeFormData,
  CustomWildShapeData,
  WildShapeState,
  WildShapeAttack,
  WeaponData,
  TacticalCombatState
} from '../types/character';
import { getAbilityMod, parseVal } from './stats';
import { getSizeGrappleModifier } from './combat';

export const DEFAULT_CUSTOM_WILDSHAPE: CustomWildShapeData = {
  name: 'Custom Beast Form',
  category: 'animal',
  size: 'Medium',
  creatureType: 'Animal',
  minDruidLevel: 5,
  str: 16,
  dex: 14,
  con: 15,
  naturalArmor: 3,
  space: 5,
  reach: 5,
  speedLand: 40,
  attack1Name: 'Bite',
  attack1Damage: '1d8',
  attack1Count: 1,
  attack1IsPrimary: true,
  attack1Special: 'Improved Grab',
  attack2Name: 'Claws',
  attack2Damage: '1d6',
  attack2Count: 2,
  attack2IsPrimary: false,
  specialQualities: 'Low-Light Vision, Scent'
};

/**
 * Calculates effective Druid level for Wild Shape progression.
 */
export function getEffectiveDruidLevel(character: CharacterState): number {
  const wildShapeClasses = [
    'druid',
    'master of many forms',
    'planar shepherd',
    'nature\'s warrior',
    'lion of talisid',
    'swanmay',
    'moon drover',
    'hierophant',
    'wild shape ranger'
  ];

  let level = 0;
  (character.levelProgression || []).forEach(l => {
    const c1 = (l.primaryClass || '').toLowerCase().trim();
    const c2 = (l.secondaryClass || '').toLowerCase().trim();

    const matchesC1 = wildShapeClasses.some(wc => c1 === wc || c1.includes(wc));
    const matchesC2 = wildShapeClasses.some(wc => c2 === wc || c2.includes(wc));

    if (matchesC1 || matchesC2) {
      level += 1;
    }
  });

  return level;
}

export interface WildShapeProgressionInfo {
  dailyUses: number;
  elementalUses: number;
  maxHd: number;
  allowedSizes: string[];
  allowedTypes: string[];
  hasWildShape: boolean;
  notes: string[];
}

/**
 * Returns progression details (daily uses, elemental uses, allowed sizes, allowed types) for a given Druid level.
 */
export function getWildShapeProgression(druidLevel: number): WildShapeProgressionInfo {
  if (druidLevel < 5) {
    return {
      dailyUses: 0,
      elementalUses: 0,
      maxHd: druidLevel,
      allowedSizes: [],
      allowedTypes: [],
      hasWildShape: false,
      notes: ['Wild Shape is gained at Druid Level 5.']
    };
  }

  // Daily standard uses: L5: 1/day, L6: 2/day, L7: 3/day, L10: 4/day, L14: 5/day, L18+: 6/day
  let dailyUses = 1;
  if (druidLevel >= 18) dailyUses = 6;
  else if (druidLevel >= 14) dailyUses = 5;
  else if (druidLevel >= 10) dailyUses = 4;
  else if (druidLevel >= 7) dailyUses = 3;
  else if (druidLevel >= 6) dailyUses = 2;

  // Elemental uses: L16: 1/day, L18: 2/day, L20: 3/day
  let elementalUses = 0;
  if (druidLevel >= 20) elementalUses = 3;
  else if (druidLevel >= 18) elementalUses = 2;
  else if (druidLevel >= 16) elementalUses = 1;

  // Sizes: L5: Small, Medium; L8: Large; L11: Tiny; L15+: Huge, Diminutive
  const allowedSizes: string[] = ['Small', 'Medium'];
  if (druidLevel >= 8) allowedSizes.push('Large');
  if (druidLevel >= 11) allowedSizes.push('Tiny');
  if (druidLevel >= 15) allowedSizes.push('Huge', 'Diminutive');

  // Types: L5: Animal; L12: Plant; L16: Elemental
  const allowedTypes: string[] = ['Animal'];
  if (druidLevel >= 12) allowedTypes.push('Plant');
  if (druidLevel >= 16) allowedTypes.push('Elemental');

  const notes: string[] = [];
  notes.push(`${dailyUses}/day (Duration: ${druidLevel} hours/use)`);
  if (elementalUses > 0) {
    notes.push(`Elemental Wild Shape: ${elementalUses}/day`);
  }
  notes.push(`Max HD: ${druidLevel}`);

  return {
    dailyUses,
    elementalUses,
    maxHd: druidLevel,
    allowedSizes,
    allowedTypes,
    hasWildShape: true,
    notes
  };
}

/**
 * Converts a CustomWildShapeData object into a WildShapeFormData object.
 */
export function customDataToFormData(custom: CustomWildShapeData): WildShapeFormData {
  let attacks: WildShapeAttack[] = [];
  if (Array.isArray(custom.attacks) && custom.attacks.length > 0) {
    attacks = custom.attacks.map(atk => ({
      name: atk.name,
      damage: atk.damage || '1d6',
      attackCount: atk.attackCount || 1,
      isPrimary: atk.isPrimary ?? true,
      strMultiplier: atk.strMultiplier ?? (atk.isPrimary ? 1.0 : 0.5),
      special: atk.special,
      damageType: atk.damageType
    }));
  } else {
    if (custom.attack1Name) {
      attacks.push({
        name: custom.attack1Name,
        damage: custom.attack1Damage || '1d6',
        attackCount: custom.attack1Count || 1,
        isPrimary: custom.attack1IsPrimary ?? true,
        strMultiplier: custom.attack1IsPrimary ? 1.0 : 0.5,
        special: custom.attack1Special
      });
    }
    if (custom.attack2Name) {
      attacks.push({
        name: custom.attack2Name,
        damage: custom.attack2Damage || '1d4',
        attackCount: custom.attack2Count || 1,
        isPrimary: custom.attack2IsPrimary ?? false,
        strMultiplier: custom.attack2IsPrimary ? 1.0 : 0.5,
        special: custom.attack2Special
      });
    }
  }

  const speed = (custom.speed && typeof custom.speed === 'object' && custom.speed.land !== undefined)
    ? {
        land: custom.speed.land,
        fly: custom.speed.fly ?? custom.speedFly,
        flyManeuverability: custom.speed.flyManeuverability ?? custom.speedFlyManeuverability,
        swim: custom.speed.swim ?? custom.speedSwim,
        climb: custom.speed.climb ?? custom.speedClimb,
        burrow: custom.speed.burrow ?? custom.speedBurrow
      }
    : {
        land: custom.speedLand || 30,
        fly: custom.speedFly,
        flyManeuverability: custom.speedFlyManeuverability,
        swim: custom.speedSwim,
        climb: custom.speedClimb,
        burrow: custom.speedBurrow
      };

  const specialList = Array.isArray(custom.specialQualities)
    ? custom.specialQualities
    : (typeof custom.specialQualities === 'string'
        ? custom.specialQualities.split(/[;,]/).map(s => s.trim()).filter(Boolean)
        : []);

  return {
    id: 'custom',
    name: custom.name || 'Custom Beast',
    category: custom.category || 'animal',
    size: custom.size || 'Medium',
    creatureType: custom.creatureType || 'Animal',
    minDruidLevel: custom.minDruidLevel || 5,
    str: custom.str || 10,
    dex: custom.dex || 10,
    con: custom.con || 10,
    naturalArmor: custom.naturalArmor || 0,
    space: custom.space || 5,
    reach: custom.reach || 5,
    speed,
    attacks,
    specialQualities: specialList,
    source: 'Custom',
    description: custom.notes || 'Custom wild shape transformation form.'
  };
}

/**
 * Resolves the currently active Wild Shape form from character state and form database.
 */
export function resolveActiveWildShape(
  character: CharacterState,
  formsData: WildShapeFormData[] = []
): WildShapeFormData | null {
  const ws = character.wildShape;
  if (!ws || !ws.isActive) return null;

  if (ws.selectedFormId === 'custom') {
    return customDataToFormData(ws.customForm || DEFAULT_CUSTOM_WILDSHAPE);
  }

  const formId = (ws.selectedFormId || '').toLowerCase().trim();
  if (!formId) return null;

  const found = formsData.find(
    f => f.id.toLowerCase() === formId || f.name.toLowerCase() === formId
  );

  return found || null;
}

/**
 * Returns D&D 3.5e Size Attack Modifier:
 * Fine +8, Diminutive +4, Tiny +2, Small +1, Medium 0, Large -1, Huge -2, Gargantuan -4, Colossal -8
 */
export function getSizeAttackModifier(sizeStr?: string): number {
  if (!sizeStr) return 0;
  const s = sizeStr.trim().toLowerCase();
  if (s.startsWith('fine') || s === 'f') return 8;
  if (s.startsWith('dim') || s === 'd') return 4;
  if (s.startsWith('tiny') || s === 't') return 2;
  if (s.startsWith('small') || s === 's') return 1;
  if (s.startsWith('med') || s === 'm') return 0;
  if (s.startsWith('large') || s === 'l') return -1;
  if (s.startsWith('huge') || s === 'h') return -2;
  if (s.startsWith('garg') || s === 'g') return -4;
  if (s.startsWith('col') || s === 'c') return -8;
  return 0;
}

/**
 * Returns D&D 3.5e Size Armor Class Modifier:
 * Fine +8, Diminutive +4, Tiny +2, Small +1, Medium 0, Large -1, Huge -2, Gargantuan -4, Colossal -8
 */
export function getSizeAcModifier(sizeStr?: string): number {
  return getSizeAttackModifier(sizeStr);
}

export interface ActiveWildShapeAttackEntry {
  label: string;
  weapon: WeaponData;
  attackBonus: number;
  fullSeq: string;
  damageStr: string;
  damageBonus?: number;
  damageFormula?: string;
  threatMin?: number;
  critStr: string;
  type: string;
  featAtkBonus: number;
  featDmgBonus: number;
  tacticalNote?: string;
  isNatural: boolean;
  special?: string;
}

/**
 * Computes natural weapon attack entries for an active Wild Shape form.
 */
export function calculateWildShapeAttacks(
  character: CharacterState,
  form: WildShapeFormData,
  bab: number,
  effectiveStrMod: number,
  effectiveDexMod: number,
  tcState: TacticalCombatState
): ActiveWildShapeAttackEntry[] {
  const featEntities = (character.selectedFeatEntities && character.selectedFeatEntities.length > 0)
    ? character.selectedFeatEntities
    : (((character as any).selectedFeats || []).map((f: string) => ({ id: f, featId: f.toLowerCase().replace(/[^a-z0-9]+/g, '_'), notes: f })));
  const hasMultiattack = featEntities.some(f => f.featId === 'multiattack' || (f.notes && f.notes.toLowerCase().includes('multiattack')));
  const hasWeaponFinesse = featEntities.some(f => f.featId === 'weapon_finesse' || (f.notes && f.notes.toLowerCase().includes('weapon finesse')));

  const sizeMod = getSizeAttackModifier(form.size);
  const useDex = hasWeaponFinesse && effectiveDexMod > effectiveStrMod;
  const baseStatMod = useDex ? effectiveDexMod : effectiveStrMod;

  // Tactical attack adjustments
  let tacticalAtkMod = 0;
  if (tcState.haste) tacticalAtkMod += 1;
  if (tcState.fightingDefensively) tacticalAtkMod -= 4;
  tacticalAtkMod -= tcState.powerAttack;
  tacticalAtkMod -= tcState.combatExpertise;
  if (tcState.flurryOfBlows) tacticalAtkMod -= 2;
  if (tcState.whirlingFrenzy) tacticalAtkMod -= 2;

  const entries: ActiveWildShapeAttackEntry[] = [];

  (form.attacks || []).forEach((atk, index) => {
    const isPrimary = atk.isPrimary ?? (index === 0);
    const count = Math.max(1, atk.attackCount || 1);
    const secondaryPenalty = isPrimary ? 0 : (hasMultiattack ? -2 : -5);

    const netAttackBonus = baseStatMod + sizeMod + secondaryPenalty + tacticalAtkMod;
    const totalAttack = bab + netAttackBonus;

    // Tactical notes
    const notes: string[] = [];
    if (!isPrimary) {
      notes.push(hasMultiattack ? 'Secondary (-2 Multiattack)' : 'Secondary (-5)');
    }
    if (atk.special) {
      notes.push(atk.special);
    }
    if (tcState.haste && isPrimary) {
      notes.push('Haste (+1 Atk, +1 Extra)');
    }
    if (tcState.whirlingFrenzy) {
      notes.push('Frenzy (-2 Atk, +1 Extra)');
    }
    if (tcState.powerAttack > 0) {
      notes.push(`PA (-${tcState.powerAttack})`);
    }

    // Generate sequence for this natural weapon
    let fullSeq: string;
    const atkValStr = totalAttack >= 0 ? `+${totalAttack}` : `${totalAttack}`;
    if (count > 1) {
      const parts = Array(count).fill(atkValStr);
      if (tcState.haste && isPrimary) parts.unshift(atkValStr);
      if (tcState.whirlingFrenzy && isPrimary) parts.unshift(atkValStr);
      fullSeq = parts.join('/');
    } else {
      const parts = [atkValStr];
      if (tcState.haste && isPrimary) parts.unshift(atkValStr);
      if (tcState.whirlingFrenzy && isPrimary) parts.unshift(atkValStr);
      fullSeq = parts.join('/');
    }

    // Damage bonus calculation
    const mult = atk.strMultiplier ?? (isPrimary ? 1.0 : 0.5);
    let dmgBonus = Math.floor(effectiveStrMod * mult);
    if (tcState.powerAttack > 0 && isPrimary) {
      dmgBonus += tcState.powerAttack; // 1-handed rate for natural attacks
    }

    const damageStr = `${atk.damage}${dmgBonus >= 0 ? `+${dmgBonus}` : dmgBonus}`;

    const resolvedType = atk.damageType || (() => {
      const lower = atk.name.toLowerCase();
      if (
        lower.includes('slam') || lower.includes('hoof') || lower.includes('tail') ||
        lower.includes('tentacle') || lower.includes('constrict') || lower.includes('butt') ||
        lower.includes('pummel')
      ) {
        return 'Bludgeoning';
      }
      if (lower.includes('sting') || lower.includes('horn')) {
        return 'Piercing';
      }
      if (lower.includes('bite') || lower.includes('gore')) {
        return 'Piercing/Slashing';
      }
      if (lower.includes('claw') || lower.includes('talon') || lower.includes('pincer')) {
        return 'Slashing';
      }
      return 'Bludgeoning';
    })();

    const pseudoWeapon: WeaponData = {
      id: `ws_nat_${form.id}_${index}`,
      name: `${atk.name}${count > 1 ? ` (${count}x)` : ''}`,
      category: 'Natural Weapon',
      size: form.size || 'Medium',
      damageM: atk.damage,
      threat: 20,
      critMultiplier: 2,
      type: resolvedType,
      weight: 0,
      special: atk.special,
      source: form.source || 'Monster Manual'
    };

    entries.push({
      label: isPrimary ? 'Primary Natural' : 'Secondary Natural',
      weapon: pseudoWeapon,
      attackBonus: totalAttack,
      fullSeq,
      damageStr,
      damageBonus: dmgBonus,
      damageFormula: damageStr,
      threatMin: 20,
      critStr: '20/x2',
      type: pseudoWeapon.type,
      featAtkBonus: 0,
      featDmgBonus: 0,
      tacticalNote: notes.length > 0 ? `(${notes.join(', ')})` : undefined,
      isNatural: true,
      special: atk.special
    });
  });

  return entries;
}
