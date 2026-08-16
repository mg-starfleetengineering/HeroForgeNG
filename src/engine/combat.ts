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

export interface ActiveCombatModifier {
  id: string;
  name: string;
  icon: string;
  colorClass: {
    bg: string;
    text: string;
    border: string;
    badge: string;
  };
  summary: string;
  effects: string[];
  affectedStats: {
    str?: number;
    con?: number;
    hpPerLevel?: number;
    ac?: number;
    touchAc?: number;
    flatAc?: number;
    speed?: number;
    fort?: number;
    ref?: number;
    will?: number;
    attack?: number;
    damage?: string;
    extraAttacks?: number;
  };
}

/**
 * Returns a list of all currently active tactical combat modifiers and stances
 * with detailed descriptions of what each applies to stats, AC, saves, and attacks.
 */
export function getActiveCombatModifiers(tcState: TacticalCombatState, totalLevel: number = 1): ActiveCombatModifier[] {
  const active: ActiveCombatModifier[] = [];

  if (tcState.whirlingFrenzy) {
    active.push({
      id: 'whirlingFrenzy',
      name: 'Whirling Frenzy',
      icon: 'fa-solid fa-tornado',
      colorClass: {
        bg: 'bg-teal-500/10',
        text: 'text-teal-300',
        border: 'border-teal-500/30',
        badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30'
      },
      summary: '+4 Str, +2 Dodge AC, +2 Ref, -2 Flurry, +1 Extra Atk',
      effects: [
        '+4 Strength (+2 bonus to melee attack, damage & Grapple)',
        '+2 Dodge bonus to Armor Class and Reflex saves',
        '-2 penalty on all attack rolls (Flurry)',
        '+1 extra attack at highest BAB during full attack'
      ],
      affectedStats: {
        str: 4,
        ac: 2,
        touchAc: 2,
        ref: 2,
        attack: -2,
        damage: '+2 (+3 for 2H)',
        extraAttacks: 1
      }
    });
  }

  if (tcState.rage) {
    active.push({
      id: 'rage',
      name: 'Barbarian Rage',
      icon: 'fa-solid fa-fire-flame-curved',
      colorClass: {
        bg: 'bg-rose-500/10',
        text: 'text-rose-300',
        border: 'border-rose-500/30',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      },
      summary: `+4 Str, +4 Con, +2 Will, -2 AC, +${2 * Math.max(1, totalLevel)} HP`,
      effects: [
        '+4 Strength (+2 bonus to melee attack, damage & Grapple)',
        `+4 Constitution (+2 Fortitude saves, +2 HP/level = +${2 * Math.max(1, totalLevel)} total HP)`,
        '+2 Morale bonus on Will saving throws',
        '-2 penalty to Armor Class'
      ],
      affectedStats: {
        str: 4,
        con: 4,
        hpPerLevel: 2,
        ac: -2,
        touchAc: -2,
        flatAc: -2,
        fort: 2,
        will: 2,
        damage: '+2 (+3 for 2H)'
      }
    });
  }

  if (tcState.haste) {
    active.push({
      id: 'haste',
      name: 'Haste',
      icon: 'fa-solid fa-bolt-lightning',
      colorClass: {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-300',
        border: 'border-cyan-500/30',
        badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
      },
      summary: '+1 Atk, +1 AC, +1 Ref, +30ft Speed, +1 Extra Atk',
      effects: [
        '+1 bonus on all attack rolls',
        '+1 Dodge bonus to Armor Class and Reflex saves',
        '+30 ft enhancement bonus to base speed',
        '+1 extra attack at highest BAB during full attack'
      ],
      affectedStats: {
        attack: 1,
        ac: 1,
        touchAc: 1,
        ref: 1,
        speed: 30,
        extraAttacks: 1
      }
    });
  }

  if (tcState.powerAttack > 0) {
    active.push({
      id: 'powerAttack',
      name: `Power Attack (-${tcState.powerAttack})`,
      icon: 'fa-solid fa-gavel',
      colorClass: {
        bg: 'bg-amber-500/10',
        text: 'text-amber-300',
        border: 'border-amber-500/30',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      },
      summary: `-${tcState.powerAttack} Atk / +${tcState.powerAttack} Dmg (+${tcState.powerAttack * 2} 2H)`,
      effects: [
        `-${tcState.powerAttack} penalty on melee attack rolls`,
        `+${tcState.powerAttack} bonus to 1-handed melee damage (+${tcState.powerAttack * 2} for 2-handed weapons)`
      ],
      affectedStats: {
        attack: -tcState.powerAttack,
        damage: `+${tcState.powerAttack} (+${tcState.powerAttack * 2} 2H)`
      }
    });
  }

  if (tcState.combatExpertise > 0) {
    active.push({
      id: 'combatExpertise',
      name: `Combat Expertise (-${tcState.combatExpertise})`,
      icon: 'fa-solid fa-user-shield',
      colorClass: {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-300',
        border: 'border-emerald-500/30',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      },
      summary: `-${tcState.combatExpertise} Atk / +${tcState.combatExpertise} Dodge AC`,
      effects: [
        `-${tcState.combatExpertise} penalty on attack rolls`,
        `+${tcState.combatExpertise} Dodge bonus to Armor Class`
      ],
      affectedStats: {
        attack: -tcState.combatExpertise,
        ac: tcState.combatExpertise,
        touchAc: tcState.combatExpertise
      }
    });
  }

  if (tcState.fightingDefensively) {
    active.push({
      id: 'fightingDefensively',
      name: 'Fighting Defensively',
      icon: 'fa-solid fa-shield-halved',
      colorClass: {
        bg: 'bg-sky-500/10',
        text: 'text-sky-300',
        border: 'border-sky-500/30',
        badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30'
      },
      summary: '-4 Atk / +2 Dodge AC',
      effects: [
        '-4 penalty on all attack rolls',
        '+2 Dodge bonus to Armor Class'
      ],
      affectedStats: {
        attack: -4,
        ac: 2,
        touchAc: 2
      }
    });
  }

  if (tcState.flurryOfBlows) {
    active.push({
      id: 'flurryOfBlows',
      name: 'Flurry of Blows',
      icon: 'fa-solid fa-hand-fist',
      colorClass: {
        bg: 'bg-indigo-500/10',
        text: 'text-indigo-300',
        border: 'border-indigo-500/30',
        badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
      },
      summary: '-2 All Atks / +1 Extra Atk',
      effects: [
        '-2 penalty on all attack rolls',
        '+1 extra attack at highest BAB during full attack'
      ],
      affectedStats: {
        attack: -2,
        extraAttacks: 1
      }
    });
  }

  return active;
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
