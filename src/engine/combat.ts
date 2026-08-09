import { CharacterState, TacticalCombatState, WeaponData } from '../types/character';

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
    name.includes('scythe') ||
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
