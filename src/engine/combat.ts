import { CharacterState, TacticalCombatState, ActiveCombatBuff, WeaponData, RaceData, TemplateData } from '../types/character';

export const STANDARD_SRD_BUFFS: ActiveCombatBuff[] = [
  {
    id: 'haste',
    name: 'Haste',
    category: 'spell',
    active: false,
    attackBonus: 1,
    acBonus: { value: 1, type: 'dodge' },
    saveBonuses: { ref: 1, type: 'dodge' },
    speedBonus: 30,
    extraAttacks: 1,
    notes: '+1 attack, +1 dodge AC/Reflex, +30ft speed, +1 extra attack on full attack'
  },
  {
    id: 'rage',
    name: 'Barbarian Rage',
    category: 'class_feature',
    active: false,
    abilityBonuses: { STR: 4, CON: 4 },
    acBonus: { value: -2, type: 'untyped' },
    saveBonuses: { will: 2, type: 'morale' },
    notes: '+4 Str, +4 Con (+2 HP/lvl, +2 Fort), +2 morale Will, -2 AC'
  },
  {
    id: 'whirling_frenzy',
    name: 'Whirling Frenzy',
    category: 'stance',
    active: false,
    abilityBonuses: { STR: 4 },
    attackBonus: -2,
    acBonus: { value: 2, type: 'dodge' },
    saveBonuses: { ref: 2, type: 'dodge' },
    extraAttacks: 1,
    notes: '+4 Str, +2 dodge AC/Reflex, -2 penalty to attacks, +1 extra attack'
  },
  {
    id: 'righteous_might',
    name: 'Righteous Might',
    category: 'spell',
    active: false,
    abilityBonuses: { STR: 4, CON: 2 },
    attackBonus: -1,
    damageBonus: 2,
    acBonus: { value: 1, type: 'untyped' },
    notes: 'Grow 1 size category: +4 size Str, +2 size Con, +2 natural armor, -1 size Atk/AC, +2 weapon damage, DR 3 or 5/evil'
  },
  {
    id: 'divine_favor',
    name: 'Divine Favor',
    category: 'spell',
    active: false,
    bonusType: 'luck',
    attackBonus: 2,
    damageBonus: 2,
    notes: '+1 to +3 (default +2) luck bonus on attack and weapon damage rolls'
  },
  {
    id: 'inspire_courage',
    name: 'Inspire Courage',
    category: 'class_feature',
    active: false,
    bonusType: 'morale',
    attackBonus: 1,
    damageBonus: 1,
    saveBonuses: { will: 1, type: 'morale' },
    notes: '+1 morale bonus on attack rolls, weapon damage rolls, and saves vs fear/charm'
  },
  {
    id: 'bulls_strength',
    name: "Bull's Strength",
    category: 'spell',
    active: false,
    bonusType: 'enhancement',
    abilityBonuses: { STR: 4 },
    notes: '+4 enhancement bonus to Strength (+2 attack, damage, grapple)'
  },
  {
    id: 'cats_grace',
    name: "Cat's Grace",
    category: 'spell',
    active: false,
    bonusType: 'enhancement',
    abilityBonuses: { DEX: 4 },
    notes: '+4 enhancement bonus to Dexterity (+2 Dex mod, Ref saves, initiative, ranged atk)'
  },
  {
    id: 'bears_endurance',
    name: "Bear's Endurance",
    category: 'spell',
    active: false,
    bonusType: 'enhancement',
    abilityBonuses: { CON: 4 },
    notes: '+4 enhancement bonus to Constitution (+2 Con mod, Fort saves, +2 HP/level)'
  },
  {
    id: 'shield',
    name: 'Shield',
    category: 'spell',
    active: false,
    acBonus: { value: 4, type: 'untyped' },
    notes: '+4 shield bonus to AC, negates magic missiles'
  },
  {
    id: 'shield_of_faith',
    name: 'Shield of Faith',
    category: 'spell',
    active: false,
    acBonus: { value: 2, type: 'deflection' },
    notes: '+2 (+1 per 6 levels, max +5) deflection bonus to AC'
  },
  {
    id: 'prayer',
    name: 'Prayer',
    category: 'spell',
    active: false,
    bonusType: 'luck',
    attackBonus: 1,
    damageBonus: 1,
    saveBonuses: { all: 1, type: 'luck' },
    notes: '+1 luck bonus on attack rolls, damage rolls, saves, and skill checks'
  },
  {
    id: 'bless',
    name: 'Bless',
    category: 'spell',
    active: false,
    bonusType: 'morale',
    attackBonus: 1,
    saveBonuses: { will: 1, type: 'morale' },
    notes: '+1 morale bonus on attack rolls and saves vs fear'
  }
];

export interface AggregatedBuffBonuses {
  abilityBonuses: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  attackBonus: number;
  damageBonus: number;
  acDodgeBonus: number;
  acUntypedBonus: number;
  acDeflectionMax: number;
  acMoraleMax: number;
  acInsightMax: number;
  acSacredMax: number;
  acNetBonus: number;
  touchAcBonus: number;
  flatAcBonus: number;
  saveBonuses: {
    fort: number;
    ref: number;
    will: number;
  };
  speedBonus: number;
  extraAttacks: number;
}

/**
 * Aggregates active combat buffs according to official D&D 3.5e bonus stacking rules:
 * - Dodge bonuses always stack with other dodge bonuses.
 * - Untyped bonuses (and penalties) always stack.
 * - Named bonus types (deflection, morale, insight, sacred, enhancement, luck, size) take highest per type.
 */
export function aggregateBuffBonuses(buffs: ActiveCombatBuff[] = []): AggregatedBuffBonuses {
  const active = (buffs || []).filter(b => b.active);

  const abilityTypeMap: Record<string, { untyped: number; byType: Record<string, number> }> = {
    str: { untyped: 0, byType: {} },
    dex: { untyped: 0, byType: {} },
    con: { untyped: 0, byType: {} },
    int: { untyped: 0, byType: {} },
    wis: { untyped: 0, byType: {} },
    cha: { untyped: 0, byType: {} }
  };

  let untypedAttack = 0;
  const attackByType: Record<string, number> = {};

  let untypedDamage = 0;
  const damageByType: Record<string, number> = {};

  let acDodgeBonus = 0;
  let acUntypedBonus = 0;
  let acDeflectionMax = 0;
  let acMoraleMax = 0;
  let acInsightMax = 0;
  let acSacredMax = 0;

  let untypedFort = 0;
  let untypedRef = 0;
  let untypedWill = 0;
  const fortByType: Record<string, number> = {};
  const refByType: Record<string, number> = {};
  const willByType: Record<string, number> = {};

  let speedBonus = 0;
  let extraAttacks = 0;

  for (const b of active) {
    const bType = b.bonusType || 'untyped';

    // 1. Ability bonuses
    if (b.abilityBonuses) {
      for (const [statUpper, val] of Object.entries(b.abilityBonuses)) {
        const statKey = statUpper.toLowerCase();
        if (abilityTypeMap[statKey] && typeof val === 'number') {
          if (bType === 'untyped') {
            abilityTypeMap[statKey].untyped += val;
          } else {
            abilityTypeMap[statKey].byType[bType] = Math.max(abilityTypeMap[statKey].byType[bType] || 0, val);
          }
        }
      }
    }

    // 2. Attack bonus
    if (typeof b.attackBonus === 'number' && b.attackBonus !== 0) {
      if (bType === 'untyped' || bType === 'dodge') {
        untypedAttack += b.attackBonus;
      } else {
        if (b.attackBonus > 0) {
          attackByType[bType] = Math.max(attackByType[bType] || 0, b.attackBonus);
        } else {
          untypedAttack += b.attackBonus;
        }
      }
    }

    // 3. Damage bonus
    if (typeof b.damageBonus === 'number' && b.damageBonus !== 0) {
      if (bType === 'untyped') {
        untypedDamage += b.damageBonus;
      } else {
        if (b.damageBonus > 0) {
          damageByType[bType] = Math.max(damageByType[bType] || 0, b.damageBonus);
        } else {
          untypedDamage += b.damageBonus;
        }
      }
    }

    // 4. AC bonus
    if (b.acBonus && typeof b.acBonus.value === 'number') {
      const acType = b.acBonus.type;
      const acVal = b.acBonus.value;

      if (acType === 'dodge') {
        acDodgeBonus += acVal;
      } else if (acType === 'untyped') {
        acUntypedBonus += acVal;
      } else if (acType === 'deflection') {
        acDeflectionMax = Math.max(acDeflectionMax, acVal);
      } else if (acType === 'morale') {
        acMoraleMax = Math.max(acMoraleMax, acVal);
      } else if (acType === 'insight') {
        acInsightMax = Math.max(acInsightMax, acVal);
      } else if (acType === 'sacred') {
        acSacredMax = Math.max(acSacredMax, acVal);
      }
    }

    // 5. Saves bonuses
    if (b.saveBonuses) {
      const sType = b.saveBonuses.type || bType;
      const allVal = b.saveBonuses.all || 0;
      const fortVal = (b.saveBonuses.fort || 0) + allVal;
      const refVal = (b.saveBonuses.ref || 0) + allVal;
      const willVal = (b.saveBonuses.will || 0) + allVal;

      if (sType === 'untyped' || sType === 'dodge') {
        untypedFort += fortVal;
        untypedRef += refVal;
        untypedWill += willVal;
      } else {
        if (fortVal > 0) fortByType[sType] = Math.max(fortByType[sType] || 0, fortVal);
        else untypedFort += fortVal;

        if (refVal > 0) refByType[sType] = Math.max(refByType[sType] || 0, refVal);
        else untypedRef += refVal;

        if (willVal > 0) willByType[sType] = Math.max(willByType[sType] || 0, willVal);
        else untypedWill += willVal;
      }
    }

    // 6. Speed & Extra Attacks
    if (typeof b.speedBonus === 'number') {
      speedBonus += b.speedBonus;
    }
    if (typeof b.extraAttacks === 'number') {
      extraAttacks += b.extraAttacks;
    }
  }

  const abilityBonuses = {
    str: abilityTypeMap.str.untyped + Object.values(abilityTypeMap.str.byType).reduce((a, b) => a + b, 0),
    dex: abilityTypeMap.dex.untyped + Object.values(abilityTypeMap.dex.byType).reduce((a, b) => a + b, 0),
    con: abilityTypeMap.con.untyped + Object.values(abilityTypeMap.con.byType).reduce((a, b) => a + b, 0),
    int: abilityTypeMap.int.untyped + Object.values(abilityTypeMap.int.byType).reduce((a, b) => a + b, 0),
    wis: abilityTypeMap.wis.untyped + Object.values(abilityTypeMap.wis.byType).reduce((a, b) => a + b, 0),
    cha: abilityTypeMap.cha.untyped + Object.values(abilityTypeMap.cha.byType).reduce((a, b) => a + b, 0)
  };

  const attackBonus = untypedAttack + Object.values(attackByType).reduce((a, b) => a + b, 0);
  const damageBonus = untypedDamage + Object.values(damageByType).reduce((a, b) => a + b, 0);

  const namedAcTotal = acDeflectionMax + acMoraleMax + acInsightMax + acSacredMax;
  const acNetBonus = acDodgeBonus + acUntypedBonus + namedAcTotal;
  const touchAcBonus = acDodgeBonus + acUntypedBonus + namedAcTotal;
  const flatAcBonus = acUntypedBonus + namedAcTotal;

  const saveBonuses = {
    fort: untypedFort + Object.values(fortByType).reduce((a, b) => a + b, 0),
    ref: untypedRef + Object.values(refByType).reduce((a, b) => a + b, 0),
    will: untypedWill + Object.values(willByType).reduce((a, b) => a + b, 0)
  };

  return {
    abilityBonuses,
    attackBonus,
    damageBonus,
    acDodgeBonus,
    acUntypedBonus,
    acDeflectionMax,
    acMoraleMax,
    acInsightMax,
    acSacredMax,
    acNetBonus,
    touchAcBonus,
    flatAcBonus,
    saveBonuses,
    speedBonus,
    extraAttacks
  };
}

/**
 * Bridges legacy boolean flags (haste, rage, whirlingFrenzy) into ActiveCombatBuff array,
 * ensuring no double counting and full backwards compatibility.
 */
export function resolveActiveBuffs(
  tcState?: TacticalCombatState,
  activeBuffs?: ActiveCombatBuff[]
): ActiveCombatBuff[] {
  const result: ActiveCombatBuff[] = (activeBuffs || []).map(b => ({ ...b }));
  if (!tcState) return result;

  const hasHasteBuff = result.some(b => b.id === 'haste' && b.active);
  if (tcState.haste && !hasHasteBuff) {
    const existingIdx = result.findIndex(b => b.id === 'haste');
    if (existingIdx >= 0) {
      result[existingIdx] = { ...result[existingIdx], active: true };
    } else {
      const hasteDef = STANDARD_SRD_BUFFS.find(b => b.id === 'haste');
      if (hasteDef) result.push({ ...hasteDef, active: true });
    }
  }

  const hasRageBuff = result.some(b => b.id === 'rage' && b.active);
  if (tcState.rage && !hasRageBuff) {
    const existingIdx = result.findIndex(b => b.id === 'rage');
    if (existingIdx >= 0) {
      result[existingIdx] = { ...result[existingIdx], active: true };
    } else {
      const rageDef = STANDARD_SRD_BUFFS.find(b => b.id === 'rage');
      if (rageDef) result.push({ ...rageDef, active: true });
    }
  }

  const hasFrenzyBuff = result.some(b => b.id === 'whirling_frenzy' && b.active);
  if (tcState.whirlingFrenzy && !hasFrenzyBuff) {
    const existingIdx = result.findIndex(b => b.id === 'whirling_frenzy');
    if (existingIdx >= 0) {
      result[existingIdx] = { ...result[existingIdx], active: true };
    } else {
      const frenzyDef = STANDARD_SRD_BUFFS.find(b => b.id === 'whirling_frenzy');
      if (frenzyDef) result.push({ ...frenzyDef, active: true });
    }
  }

  return result;
}

/**
 * Migrates a character state ensuring activeBuffs is defined and legacy combat flags are populated.
 */
export function migrateCharacterBuffs(character: CharacterState): CharacterState {
  if (!character) return character;
  const activeBuffs = resolveActiveBuffs(character.tacticalCombat, character.activeBuffs || []);
  return {
    ...character,
    activeBuffs
  };
}

export const DEFAULT_TACTICAL_COMBAT: TacticalCombatState = {
  powerAttack: 0,
  combatExpertise: 0,
  fightingDefensively: false,
  haste: false,
  rage: false,
  whirlingFrenzy: false,
  flurryOfBlows: false,
  smiteEvil: false,
  stunningFist: false,
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
    smiteEvil: !!tc.smiteEvil,
    stunningFist: !!tc.stunningFist,
    isCollapsed: !!tc.isCollapsed
  };
}

/**
 * Checks if a weapon is two-handed based on its name, category, or special properties.
 */
export function isTwoHandedWeapon(weapon?: WeaponData): boolean {
  if (!weapon) return false;

  const size = (weapon.size || '').toUpperCase().trim();
  const cat = (weapon.category || '').toLowerCase().trim();
  const spec = (weapon.special || '').toLowerCase().trim();

  // Structured size check: 'T' indicates Two-Handed in HeroForge weapons data
  if (size === 'T' || size === 'TWO-HANDED' || size === '2H') return true;
  if (cat.includes('two-handed') || spec.includes('two-handed') || spec.includes('2-handed')) return true;

  // If explicitly designated Light or One-Handed, it is not Two-Handed
  if (size === 'L' || size === 'O' || size === 'U' || cat.includes('light') || cat.includes('one-handed')) return false;

  const name = weapon.name.toLowerCase();
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
    name.includes('spiked chain') ||
    name.includes('longspear')
  );
}

/**
 * Checks if a weapon is light (cannot receive Power Attack damage in 3.5e).
 */
export function isLightWeapon(weapon?: WeaponData): boolean {
  if (!weapon) return false;

  const size = (weapon.size || '').toUpperCase().trim();
  const cat = (weapon.category || '').toLowerCase().trim();
  const spec = (weapon.special || '').toLowerCase().trim();

  // Structured size check: 'L' indicates Light, 'U' indicates Unarmed in HeroForge weapons data
  if (size === 'L' || size === 'U' || size === 'LIGHT') return true;
  if (cat.includes('light') || spec.includes('light')) return true;

  // If explicitly designated Two-Handed or One-Handed, it is not Light
  if (size === 'T' || size === 'O' || cat.includes('two-handed') || cat.includes('one-handed')) return false;

  const name = weapon.name.toLowerCase();
  return (
    name.includes('dagger') ||
    name.includes('light mace') ||
    name.includes('short sword') ||
    name.includes('shortsword') ||
    name.includes('handaxe') ||
    name.includes('kukri') ||
    name.includes('sickle') ||
    name.includes('kama') ||
    name.includes('light pick') ||
    name.includes('unarmed')
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
export function getActiveCombatModifiers(
  tcState: TacticalCombatState,
  totalLevel: number = 1,
  activeBuffs?: ActiveCombatBuff[]
): ActiveCombatModifier[] {
  const active: ActiveCombatModifier[] = [];
  const effectiveBuffs = resolveActiveBuffs(tcState, activeBuffs);

  // 1. Whirling Frenzy
  const hasFrenzy = tcState.whirlingFrenzy || effectiveBuffs.some(b => b.id === 'whirling_frenzy' && b.active);
  if (hasFrenzy) {
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

  // 2. Barbarian Rage
  const hasRage = tcState.rage || effectiveBuffs.some(b => b.id === 'rage' && b.active);
  if (hasRage) {
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

  // 3. Haste
  const hasHaste = tcState.haste || effectiveBuffs.some(b => b.id === 'haste' && b.active);
  if (hasHaste) {
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

  // 4. Power Attack
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

  // 5. Combat Expertise
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

  // 6. Fighting Defensively
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

  // 7. Flurry of Blows
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

  // 8. Smite Evil
  if (tcState.smiteEvil) {
    active.push({
      id: 'smiteEvil',
      name: 'Smite Evil',
      icon: 'fa-solid fa-gavel',
      colorClass: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-300',
        border: 'border-blue-500/30',
        badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      },
      summary: '+Cha mod Attack, +Paladin Level Damage vs Evil',
      effects: [
        '+Cha modifier bonus to attack roll',
        '+Paladin level bonus to melee damage against evil foe'
      ],
      affectedStats: {}
    });
  }

  // 9. Stunning Fist
  if (tcState.stunningFist) {
    active.push({
      id: 'stunningFist',
      name: 'Stunning Fist',
      icon: 'fa-solid fa-hand-back-fist',
      colorClass: {
        bg: 'bg-orange-500/10',
        text: 'text-orange-300',
        border: 'border-orange-500/30',
        badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      },
      summary: 'Fort save DC 10 + 1/2 Lvl + Wis mod or Stunned 1 round',
      effects: [
        'On hit, target must succeed on a Fortitude save or be stunned for 1 round'
      ],
      affectedStats: {}
    });
  }

  // 10. Any other active combat buffs from activeBuffs
  for (const b of effectiveBuffs) {
    if (!b.active) continue;
    if (b.id === 'haste' || b.id === 'rage' || b.id === 'whirling_frenzy') continue;

    const effects: string[] = [];
    if (b.abilityBonuses) {
      for (const [stat, val] of Object.entries(b.abilityBonuses)) {
        if (val) effects.push(`+${val} ${stat.toUpperCase()}`);
      }
    }
    if (b.attackBonus) effects.push(`${b.attackBonus > 0 ? '+' : ''}${b.attackBonus} Attack`);
    if (b.damageBonus) effects.push(`${b.damageBonus > 0 ? '+' : ''}${b.damageBonus} Damage`);
    if (b.acBonus) effects.push(`${b.acBonus.value > 0 ? '+' : ''}${b.acBonus.value} AC (${b.acBonus.type})`);
    if (b.saveBonuses) {
      if (b.saveBonuses.all) effects.push(`+${b.saveBonuses.all} All Saves`);
      if (b.saveBonuses.fort) effects.push(`+${b.saveBonuses.fort} Fort`);
      if (b.saveBonuses.ref) effects.push(`+${b.saveBonuses.ref} Ref`);
      if (b.saveBonuses.will) effects.push(`+${b.saveBonuses.will} Will`);
    }
    if (b.speedBonus) effects.push(`+${b.speedBonus} ft Speed`);
    if (b.extraAttacks) effects.push(`+${b.extraAttacks} Extra Attack`);
    if (b.notes) effects.push(b.notes);

    const icon =
      b.category === 'spell'
        ? 'fa-solid fa-wand-magic-sparkles'
        : b.category === 'stance'
        ? 'fa-solid fa-shield-halved'
        : b.category === 'class_feature'
        ? 'fa-solid fa-crown'
        : b.category === 'item'
        ? 'fa-solid fa-ring'
        : 'fa-solid fa-sparkles';

    const colorClass =
      b.category === 'spell'
        ? {
            bg: 'bg-purple-500/10',
            text: 'text-purple-300',
            border: 'border-purple-500/30',
            badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
          }
        : b.category === 'stance'
        ? {
            bg: 'bg-teal-500/10',
            text: 'text-teal-300',
            border: 'border-teal-500/30',
            badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30'
          }
        : b.category === 'class_feature'
        ? {
            bg: 'bg-amber-500/10',
            text: 'text-amber-300',
            border: 'border-amber-500/30',
            badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
          }
        : {
            bg: 'bg-blue-500/10',
            text: 'text-blue-300',
            border: 'border-blue-500/30',
            badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
          };

    active.push({
      id: b.id,
      name: b.name,
      icon,
      colorClass,
      summary: effects.slice(0, 3).join(', ') || b.name,
      effects,
      affectedStats: {
        str: b.abilityBonuses?.STR,
        con: b.abilityBonuses?.CON,
        attack: b.attackBonus,
        damage: b.damageBonus ? `+${b.damageBonus}` : undefined,
        ac: b.acBonus?.value,
        fort: b.saveBonuses?.fort || b.saveBonuses?.all,
        ref: b.saveBonuses?.ref || b.saveBonuses?.all,
        will: b.saveBonuses?.will || b.saveBonuses?.all,
        speed: b.speedBonus,
        extraAttacks: b.extraAttacks
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
  dexBonus?: number;
  intBonus?: number;
  wisBonus?: number;
  chaBonus?: number;
  hpBonusPerLevel: number;
  extraAttacks?: number;
}

/**
 * Calculates net tactical combat modifiers based on active combat states and buffs.
 */
export function calculateTacticalCombatModifiers(
  tcState: TacticalCombatState,
  weapon?: WeaponData,
  isOffhand: boolean = false,
  isRanged: boolean = false,
  activeBuffs?: ActiveCombatBuff[]
): TacticalCombatModifiers {
  const effectiveBuffs = resolveActiveBuffs(tcState, activeBuffs);
  const buffAgg = aggregateBuffBonuses(effectiveBuffs);

  const isRageActive = tcState.rage || effectiveBuffs.some(b => b.id === 'rage' && b.active);
  const isWhirlingFrenzyActive = tcState.whirlingFrenzy || effectiveBuffs.some(b => b.id === 'whirling_frenzy' && b.active);

  // 1. Attack roll stance modifier (penalties & direct stance attack bonuses)
  let attackMod = 0;
  if (tcState.fightingDefensively) attackMod -= 4;
  attackMod -= tcState.powerAttack;
  attackMod -= tcState.combatExpertise;
  if (tcState.flurryOfBlows) attackMod -= 2;

  attackMod += buffAgg.attackBonus;

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

    // Barbarian Rage / Frenzy Strength bonus to damage (+4 Str = +2 Str mod)
    if (isRageActive) {
      if (is2H) {
        damageMod += 3; // 1.5x Str mod (+2 * 1.5 = +3)
      } else if (isOffhand) {
        damageMod += 1; // 0.5x Str mod (+2 * 0.5 = +1)
      } else {
        damageMod += 2; // 1.0x Str mod
      }
    } else if (isWhirlingFrenzyActive) {
      if (is2H) {
        damageMod += 3;
      } else if (isOffhand) {
        damageMod += 1;
      } else {
        damageMod += 2;
      }
    }

    damageMod += buffAgg.damageBonus;
  } else {
    damageMod += buffAgg.damageBonus;
  }

  // 3. AC Modifiers
  let stanceDodge = 0;
  if (tcState.fightingDefensively) stanceDodge += 2;
  stanceDodge += tcState.combatExpertise;

  const acDodgeMod = stanceDodge + buffAgg.acDodgeBonus;
  const acNetMod = stanceDodge + buffAgg.acNetBonus;
  const touchAcMod = stanceDodge + buffAgg.touchAcBonus;
  const flatAcMod = buffAgg.flatAcBonus;

  // 4. Speed & Save Modifiers
  const speedMod = buffAgg.speedBonus;

  const conBonusMod = Math.floor(buffAgg.abilityBonuses.con / 2);
  const fortSaveMod = conBonusMod + buffAgg.saveBonuses.fort;

  const dexBonusMod = Math.floor(buffAgg.abilityBonuses.dex / 2);
  const refSaveMod = dexBonusMod + buffAgg.saveBonuses.ref;

  const wisBonusMod = Math.floor(buffAgg.abilityBonuses.wis / 2);
  const willSaveMod = wisBonusMod + buffAgg.saveBonuses.will;

  let totalExtraAttacks = buffAgg.extraAttacks;
  if (tcState.flurryOfBlows && !isWhirlingFrenzyActive) {
    totalExtraAttacks += 1;
  }

  const hpBonusPerLevel = Math.floor(buffAgg.abilityBonuses.con / 2);

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
    strBonus: buffAgg.abilityBonuses.str,
    conBonus: buffAgg.abilityBonuses.con,
    dexBonus: buffAgg.abilityBonuses.dex,
    intBonus: buffAgg.abilityBonuses.int,
    wisBonus: buffAgg.abilityBonuses.wis,
    chaBonus: buffAgg.abilityBonuses.cha,
    hpBonusPerLevel,
    extraAttacks: totalExtraAttacks
  };
}

/**
 * Calculates tactical combat modifiers combining tactical stances and active buffs.
 */
export function calculateTacticalCombat(
  tcState: TacticalCombatState,
  activeBuffs?: ActiveCombatBuff[],
  weapon?: WeaponData,
  isOffhand: boolean = false,
  isRanged: boolean = false
): TacticalCombatModifiers {
  return calculateTacticalCombatModifiers(tcState, weapon, isOffhand, isRanged, activeBuffs);
}

export interface FullCombatStats extends TacticalCombatModifiers {
  netAttackBonus: number;
  netDamageBonus: number;
  fullAttackSequence: string;
  activeBuffCount: number;
}

/**
 * High-level helper to calculate full combat stats for a character with given weapon and buffs.
 */
export function calculateCombatStats(
  character: CharacterState,
  weapon?: WeaponData,
  options: { isOffhand?: boolean; isRanged?: boolean; bab?: number } = {}
): FullCombatStats {
  const bab = options.bab !== undefined ? options.bab : 0;
  const tcState = getTacticalCombatState(character, bab);
  const activeBuffs = character.activeBuffs || [];
  const mods = calculateTacticalCombatModifiers(
    tcState,
    weapon,
    options.isOffhand || false,
    options.isRanged || false,
    activeBuffs
  );

  const netAttack = mods.attackMod;
  const netDamage = mods.damageMod;
  const hasHaste = tcState.haste || activeBuffs.some(b => b.active && b.id === 'haste');
  const hasFlurry = tcState.flurryOfBlows;
  const hasWhirlingFrenzy = tcState.whirlingFrenzy || activeBuffs.some(b => b.active && b.id === 'whirling_frenzy');

  const fullAttackSequence = generateFullAttackSequence(
    bab,
    netAttack,
    hasHaste,
    hasFlurry,
    hasWhirlingFrenzy
  );

  return {
    ...mods,
    netAttackBonus: netAttack,
    netDamageBonus: netDamage,
    fullAttackSequence,
    activeBuffCount: activeBuffs.filter(b => b.active).length
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
  hasWhirlingFrenzy: boolean = false,
  hasSpeed: boolean = false
): string {
  const baseBab = Math.max(1, bab);

  // Generate standard iterative attacks
  const attacks: number[] = [baseBab];
  if (baseBab >= 6) attacks.push(baseBab - 5);
  if (baseBab >= 11) attacks.push(baseBab - 10);
  if (baseBab >= 16) attacks.push(baseBab - 15);

  // Extra attacks at highest BAB
  // In D&D 3.5e, Speed grants 1 extra attack at highest BAB and does not stack with Haste
  if (hasHaste || hasSpeed) {
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
