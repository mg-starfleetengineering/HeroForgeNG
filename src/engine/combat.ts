import { CharacterState, TacticalCombatState, WeaponData, RaceData, TemplateData } from '../types/character';

export const DEFAULT_TACTICAL_COMBAT: TacticalCombatState = {
  powerAttack: 0,
  combatExpertise: 0,
  fightingDefensively: false,
  haste: false,
  rage: false,
  whirlingFrenzy: false,
  flurryOfBlows: false,
  isCollapsed: false
};

/**
 * Returns clean TacticalCombatState from character, ensuring numeric bounds.
 */
export function getTacticalCombatState(character: CharacterState, bab: number = 0): TacticalCombatState {
  const tc = character.tacticalCombat || DEFAULT_TACTICAL_COMBAT;
  const maxPa = Math.max(0, bab);
  const maxCe = Math.max(0, Math.min(bab, 5));

  return {
    powerAttack: Math.min(maxPa, Math.max(0, tc.powerAttack || 0)),
    combatExpertise: Math.min(maxCe, Math.max(0, tc.combatExpertise || 0)),
    fightingDefensively: !!tc.fightingDefensively,
    haste: !!tc.haste,
    rage: !!tc.rage,
    whirlingFrenzy: !!tc.whirlingFrenzy,
    flurryOfBlows: !!tc.flurryOfBlows,
    isCollapsed: !!tc.isCollapsed
  };
}

/**
 * Checks if a weapon is two-handed based on its name, category, or special properties.
 */
export function isTwoHandedWeapon(weapon?: WeaponData): boolean {
  if (!weapon) return false;
  const name = weapon.name.toLowerCase();
  const cat = (weapon.category || '').toLowerCase();
  const spec = (weapon.special || '').toLowerCase();

  return (
    name.includes('great') ||
    name.includes('nodachi') ||
    name.includes('falchion') ||
    name.includes('halberd') ||
    name.includes('scythe') ||
    name.includes('quarterstaff') ||
    name.includes('dire flail') ||
    name.includes('glaive') ||
    name.includes('guisarme') ||
    name.includes('ranseur') ||
    name.includes('heavy flail') ||
    cat.includes('two-handed') ||
    spec.includes('two-handed') ||
    spec.includes('2-handed')
  );
}

/**
 * Checks if a weapon is light (cannot receive Power Attack damage in 3.5e).
 */
export function isLightWeapon(weapon?: WeaponData): boolean {
  if (!weapon) return false;
  const name = weapon.name.toLowerCase();
  const spec = (weapon.special || '').toLowerCase();

  return (
    name.includes('dagger') ||
    name.includes('light mace') ||
    name.includes('short sword') ||
    name.includes('handaxe') ||
    name.includes('kukri') ||
    name.includes('sickle') ||
    name.includes('unarmed') ||
    spec.includes('light')
  );
}

export interface TacticalCombatModifiers {
  attackMod: number;
  damageMod: number;
  acDodgeMod: number;
  acNetMod: number;
  touchAcMod: number;
  flatAcMod: number;
  speedMod: number;
  fortSaveMod: number;
  refSaveMod: number;
  willSaveMod: number;
  strBonus: number;
  conBonus: number;
  hpBonusPerLevel: number;
}

/**
 * Calculates net tactical combat modifiers based on active combat states.
 */
export function calculateTacticalCombatModifiers(
  tcState: TacticalCombatState,
  weapon?: WeaponData,
  isOffhand: boolean = false,
  isRanged: boolean = false
): TacticalCombatModifiers {
  // 1. Attack roll stance modifier (penalties & direct stance attack bonuses)
  let attackMod = 0;
  if (tcState.haste) attackMod += 1;
  if (tcState.fightingDefensively) attackMod -= 4;
  attackMod -= tcState.powerAttack;
  attackMod -= tcState.combatExpertise;
  if (tcState.flurryOfBlows) attackMod -= 2;
  if (tcState.whirlingFrenzy) attackMod -= 2; // -2 flurry penalty on all attacks

  // 2. Damage modifier
  let damageMod = 0;
  if (!isRanged && weapon) {
    const is2H = isTwoHandedWeapon(weapon);
    const isLight = isLightWeapon(weapon);

    // Power Attack bonus
    if (!isLight) {
      if (is2H) {
        damageMod += tcState.powerAttack * 2;
      } else {
        damageMod += tcState.powerAttack * 1;
      }
    }

    // Barbarian Rage Strength bonus to damage (+4 Str = +2 Str mod)
    if (tcState.rage) {
      if (is2H) {
        damageMod += 3; // 1.5x Str mod (+2 * 1.5 = +3)
      } else if (isOffhand) {
        damageMod += 1; // 0.5x Str mod (+2 * 0.5 = +1)
      } else {
        damageMod += 2; // 1.0x Str mod
      }
    }

    // Whirling Frenzy Strength bonus to damage (+4 Str = +2 Str mod)
    if (tcState.whirlingFrenzy) {
      if (is2H) {
        damageMod += 3;
      } else if (isOffhand) {
        damageMod += 1;
      } else {
        damageMod += 2;
      }
    }
  }

  // 3. AC Modifiers
  let acDodgeMod = 0;
  if (tcState.haste) acDodgeMod += 1;
  if (tcState.fightingDefensively) acDodgeMod += 2;
  acDodgeMod += tcState.combatExpertise;
  if (tcState.whirlingFrenzy) acDodgeMod += 2; // +2 Dodge AC in Whirling Frenzy

  const acPenalty = tcState.rage ? 2 : 0;
  const acNetMod = acDodgeMod - acPenalty;
  const touchAcMod = acDodgeMod - acPenalty;
  const flatAcMod = acPenalty > 0 ? -acPenalty : 0; // Dodge bonuses do not apply when flat-footed

  // 4. Speed & Save Modifiers
  const speedMod = tcState.haste ? 30 : 0;
  const fortSaveMod = tcState.rage ? 2 : 0; // +4 Con -> +2 Fort
  const refSaveMod = (tcState.haste ? 1 : 0) + (tcState.whirlingFrenzy ? 2 : 0);
  const willSaveMod = tcState.rage ? 2 : 0; // Morale bonus

  const totalStrBonus = (tcState.rage ? 4 : 0) + (tcState.whirlingFrenzy ? 4 : 0);
  const totalConBonus = tcState.rage ? 4 : 0;

  return {
    attackMod,
    damageMod,
    acDodgeMod,
    acNetMod,
    touchAcMod,
    flatAcMod,
    speedMod,
    fortSaveMod,
    refSaveMod,
    willSaveMod,
    strBonus: totalStrBonus,
    conBonus: totalConBonus,
    hpBonusPerLevel: tcState.rage ? 2 : 0
  };
}

/**
 * Generates full attack sequence string (e.g. "+11/+11/+6/+1").
 */
export function generateFullAttackSequence(
  bab: number,
  netAttackBonus: number,
  hasHaste: boolean = false,
  hasFlurry: boolean = false,
  hasWhirlingFrenzy: boolean = false
): string {
  const baseBab = Math.max(1, bab);

  // Generate standard iterative attacks
  const attacks: number[] = [baseBab];
  if (baseBab >= 6) attacks.push(baseBab - 5);
  if (baseBab >= 11) attacks.push(baseBab - 10);
  if (baseBab >= 16) attacks.push(baseBab - 15);

  // Extra attacks at highest BAB
  if (hasHaste) {
    attacks.unshift(baseBab);
  }
  if (hasFlurry) {
    attacks.unshift(baseBab);
  }
  if (hasWhirlingFrenzy) {
    attacks.unshift(baseBab);
  }

  // Apply net attack bonus to every attack in sequence
  return attacks
    .map(atk => {
      const val = atk + netAttackBonus;
      return val >= 0 ? `+${val}` : `${val}`;
    })
    .join('/');
}

/**
 * D&D 3.5e Size Modifiers for Grapple Checks.
 * Progression: Colossal +16, Gargantuan +12, Huge +8, Large +4, Medium 0, Small -4, Tiny -8, Diminutive -12, Fine -16
 */
export const SIZE_GRAPPLE_MODIFIERS: Record<string, number> = {
  Fine: -16,
  Diminutive: -12,
  Tiny: -8,
  Small: -4,
  Medium: 0,
  Large: 4,
  Huge: 8,
  Gargantuan: 12,
  Colossal: 16
};

export function getSizeGrappleModifier(sizeStr?: string): number {
  if (!sizeStr) return 0;
  const s = sizeStr.trim().toLowerCase();
  if (s.startsWith('fine') || s === 'f') return -16;
  if (s.startsWith('dim') || s === 'd') return -12;
  if (s.startsWith('tiny') || s === 't') return -8;
  if (s.startsWith('small') || s === 's') return -4;
  if (s.startsWith('med') || s === 'm') return 0;
  if (s.startsWith('large') || s === 'l') return 4;
  if (s.startsWith('huge') || s === 'h') return 8;
  if (s.startsWith('garg') || s === 'g') return 12;
  if (s.startsWith('col') || s === 'c') return 16;
  return 0;
}

export interface GrappleCalculation {
  total: number;
  bab: number;
  strMod: number;
  sizeMod: number;
  featBonus: number;
  notes: string[];
}

/**
 * Calculates D&D 3.5e Grapple Check Modifier:
 * Grapple = BAB + STR Modifier + Size Modifier + Feat/Misc Bonuses
 */
export function calculateGrappleModifier(
  character: CharacterState,
  bab: number,
  effectiveStrMod: number,
  raceObj?: Partial<RaceData>,
  templateObj?: Partial<TemplateData>
): GrappleCalculation {
  const notes: string[] = [];

  // Determine base size
  const baseSize = templateObj?.size || raceObj?.size || 'Medium';
  let sizeMod = getSizeGrappleModifier(baseSize);

  // Check for Powerful Build (Goliath, Half-Giant, or trait/ability) -> treat as 1 size category larger
  const raceName = (raceObj?.name || '').toLowerCase();
  const raceAbils = (raceObj?.specialAbilities || '').toLowerCase();
  const traits = (character.selectedTraits || []).map(t => t.toLowerCase());

  const hasPowerfulBuild =
    raceName.includes('goliath') ||
    raceName.includes('half-giant') ||
    raceAbils.includes('powerful build') ||
    traits.some(t => t.includes('powerful build'));

  if (hasPowerfulBuild && sizeMod === 0) {
    sizeMod = 4; // Treated as Large (+4)
    notes.push('Powerful Build (+4)');
  }

  // Feat bonuses
  let featBonus = 0;
  const selectedFeats = character.selectedFeats || [];

  for (const fName of selectedFeats) {
    const fLower = fName.toLowerCase();
    if (fLower === 'improved grapple' || fLower === '--improved grapple--') {
      featBonus += 4;
      notes.push('Improved Grapple (+4)');
    } else if (fLower.includes('illithid grapple')) {
      featBonus += 2;
      notes.push('Illithid Grapple (+2)');
    } else if (fLower.includes('jotunbrud') && sizeMod === 0) {
      sizeMod = 4;
      notes.push('Jotunbrud (+4)');
    }
  }

  const total = bab + effectiveStrMod + sizeMod + featBonus;

  return {
    total,
    bab,
    strMod: effectiveStrMod,
    sizeMod,
    featBonus,
    notes
  };
}

/**
 * Resolves standard Grapple damage dice based on creature size and Monk levels.
 */
export function getGrappleDamageDice(sizeStr?: string, monkLevels: number = 0): string {
  const s = (sizeStr || 'Medium').trim().toLowerCase();
  const isSmall = s.startsWith('small') || s === 's';
  const isLarge = s.startsWith('large') || s === 'l';
  const isHuge = s.startsWith('huge') || s === 'h';
  const isTiny = s.startsWith('tiny') || s === 't';

  if (monkLevels >= 20) {
    if (isSmall) return '2d8';
    if (isLarge || isHuge) return '4d8';
    return '2d10';
  }
  if (monkLevels >= 16) {
    if (isSmall) return '2d6';
    if (isLarge || isHuge) return '3d8';
    return '2d8';
  }
  if (monkLevels >= 12) {
    if (isSmall) return '1d10';
    if (isLarge || isHuge) return '3d6';
    return '2d6';
  }
  if (monkLevels >= 8) {
    if (isSmall) return '1d8';
    if (isLarge || isHuge) return '2d8';
    return '1d10';
  }
  if (monkLevels >= 4) {
    if (isSmall) return '1d6';
    if (isLarge || isHuge) return '2d6';
    return '1d8';
  }
  if (monkLevels >= 1) {
    if (isSmall) return '1d4';
    if (isLarge || isHuge) return '1d8';
    return '1d6';
  }

  // Non-Monk standard unarmed strike damage
  if (isTiny) return '1d1';
  if (isSmall) return '1d2';
  if (isLarge || isHuge) return '1d4';
  return '1d3';
}

/**
 * Creates weapon-row compatible entry for Grapple maneuver.
 */
export function getGrappleAttackEntry(
  character: CharacterState,
  bab: number,
  effectiveStrMod: number,
  tcState: TacticalCombatState,
  raceObj?: Partial<RaceData>,
  templateObj?: Partial<TemplateData>
): {
  label: string;
  weapon: WeaponData;
  attackBonus: number;
  fullSeq: string;
  damageStr: string;
  critStr: string;
  type: string;
  featAtkBonus: number;
  featDmgBonus: number;
  tacticalNote?: string;
} {
  const grappleCalc = calculateGrappleModifier(character, bab, effectiveStrMod, raceObj, templateObj);
  const monkLevels = (character.levelProgression || []).filter(l => (l.primaryClass || '').toLowerCase() === 'monk').length;
  const baseSize = templateObj?.size || raceObj?.size || 'Medium';
  const dmgDice = getGrappleDamageDice(baseSize, monkLevels);

  const dmgVal = effectiveStrMod;
  const dmgStr = `${dmgDice}${dmgVal >= 0 ? `+${dmgVal}` : dmgVal} nonlethal`;

  // Iterative attacks sequence for grapple checks (in 3.5e grapple checks can be made multiple times during full attack)
  const fullSeq = generateFullAttackSequence(
    bab,
    grappleCalc.total - bab,
    tcState.haste,
    tcState.flurryOfBlows,
    tcState.whirlingFrenzy
  );

  const notes = [...grappleCalc.notes];
  if (tcState.whirlingFrenzy) notes.push('+2 Str', '-2 Flurry');
  else if (tcState.rage) notes.push('+2 Str');
  if (tcState.flurryOfBlows && !tcState.whirlingFrenzy) notes.push('-2 Flurry');
  if (tcState.haste) notes.push('+1 Haste');

  const tacticalNote = notes.length > 0 ? `(${notes.join(', ')})` : undefined;

  const pseudoWeapon: WeaponData = {
    id: 'grapple_maneuver',
    name: 'Grapple Check',
    category: 'Special Combat Action',
    size: baseSize || 'Medium',
    damageM: dmgDice,
    threat: 20,
    critMultiplier: 2,
    type: 'Bludgeoning',
    weight: 0,
    source: 'PHB'
  };

  return {
    label: 'Special',
    weapon: pseudoWeapon,
    attackBonus: grappleCalc.total,
    fullSeq,
    damageStr: dmgStr,
    critStr: '20/x2',
    type: 'Bludgeoning',
    featAtkBonus: grappleCalc.featBonus,
    featDmgBonus: 0,
    tacticalNote
  };
}

function isSmallSize(sizeStr?: string): boolean {
  if (!sizeStr) return false;
  const s = sizeStr.trim().toLowerCase();
  return s.startsWith('small') || s === 's' || s.startsWith('tiny') || s.startsWith('dim') || s.startsWith('fine');
}
