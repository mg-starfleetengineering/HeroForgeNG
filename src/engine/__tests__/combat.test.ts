import { describe, it, expect } from 'vitest';
import {
  DEFAULT_TACTICAL_COMBAT,
  getTacticalCombatState,
  isTwoHandedWeapon,
  isLightWeapon,
  calculateTacticalCombatModifiers,
  calculateTacticalCombat,
  calculateCombatStats,
  generateFullAttackSequence,
  getSizeGrappleModifier,
  calculateGrappleModifier,
  getGrappleDamageDice,
  getGrappleAttackEntry,
  getActiveCombatModifiers,
  STANDARD_SRD_BUFFS,
  aggregateBuffBonuses,
  resolveActiveBuffs,
  migrateCharacterBuffs
} from '../combat';
import { CharacterState, TacticalCombatState, ActiveCombatBuff, WeaponData, RaceData } from '../../types/character';

describe('Tactical Combat Engine', () => {
  const dummyGreatsword: WeaponData = {
    id: 'greatsword',
    name: 'Greatsword',
    category: 'Martial',
    size: 'M',
    damageM: '2d6',
    threat: 19,
    critMultiplier: 2,
    weight: 8,
    type: 'Slashing'
  };

  const dummyLongsword: WeaponData = {
    id: 'longsword',
    name: 'Longsword',
    category: 'Martial',
    size: 'M',
    damageM: '1d8',
    threat: 19,
    critMultiplier: 2,
    weight: 4,
    type: 'Slashing'
  };

  const dummyDagger: WeaponData = {
    id: 'dagger',
    name: 'Dagger',
    category: 'Simple',
    size: 'M',
    damageM: '1d4',
    threat: 19,
    critMultiplier: 2,
    weight: 1,
    type: 'Piercing'
  };

  it('clamps slider bounds based on BAB', () => {
    const charState = {
      tacticalCombat: {
        powerAttack: 10,
        combatExpertise: 8,
        fightingDefensively: true,
        haste: true,
        rage: false,
        flurryOfBlows: false
      }
    } as CharacterState;

    const clamped = getTacticalCombatState(charState, 4);
    expect(clamped.powerAttack).toBe(4);
    expect(clamped.combatExpertise).toBe(4); // capped at min(BAB, 5) => 4
  });

  it('correctly identifies two-handed and light weapons', () => {
    expect(isTwoHandedWeapon(dummyGreatsword)).toBe(true);
    expect(isTwoHandedWeapon(dummyLongsword)).toBe(false);
    expect(isLightWeapon(dummyDagger)).toBe(true);
    expect(isLightWeapon(dummyLongsword)).toBe(false);

    // Test structured size: 'T' (Two-Handed) for weapons without "great" in name
    const spikedChain: WeaponData = {
      id: 'spiked_chain',
      name: 'Spiked Chain',
      category: 'Exotic',
      size: 'T',
      damageM: '2d4',
      threat: 20,
      critMultiplier: 2,
      weight: 10,
      type: 'Piercing'
    };
    const longspear: WeaponData = {
      id: 'longspear',
      name: 'Longspear',
      category: 'Simple',
      size: 'T',
      damageM: '1d8',
      threat: 20,
      critMultiplier: 3,
      weight: 9,
      type: 'Piercing'
    };
    expect(isTwoHandedWeapon(spikedChain)).toBe(true);
    expect(isTwoHandedWeapon(longspear)).toBe(true);

    // Test structured size: 'L' (Light) and 'U' (Unarmed)
    const lightPick: WeaponData = {
      id: 'light_pick',
      name: 'Light Pick',
      category: 'Martial',
      size: 'L',
      damageM: '1d4',
      threat: 20,
      critMultiplier: 4,
      weight: 3,
      type: 'Piercing'
    };
    const kama: WeaponData = {
      id: 'kama',
      name: 'Kama',
      category: 'Exotic',
      size: 'L',
      damageM: '1d6',
      threat: 20,
      critMultiplier: 2,
      weight: 2,
      type: 'Slashing'
    };
    const unarmed: WeaponData = {
      id: 'unarmed_strike',
      name: 'Unarmed Strike',
      category: 'Simple',
      size: 'U',
      damageM: '1d3',
      threat: 20,
      critMultiplier: 2,
      weight: 0,
      type: 'Bludgeoning'
    };
    expect(isLightWeapon(lightPick)).toBe(true);
    expect(isLightWeapon(kama)).toBe(true);
    expect(isLightWeapon(unarmed)).toBe(true);
  });

  it('calculates Power Attack damage scaling (2x for 2H, 1x for 1H, 0 for Light)', () => {
    const tcState = {
      ...DEFAULT_TACTICAL_COMBAT,
      powerAttack: 3
    };

    const greatswordMods = calculateTacticalCombatModifiers(tcState, dummyGreatsword);
    expect(greatswordMods.attackMod).toBe(-3);
    expect(greatswordMods.damageMod).toBe(6); // 3 * 2

    const spikedChain: WeaponData = {
      id: 'spiked_chain',
      name: 'Spiked Chain',
      category: 'Exotic',
      size: 'T',
      damageM: '2d4',
      threat: 20,
      critMultiplier: 2,
      weight: 10,
      type: 'Piercing'
    };
    const spikedChainMods = calculateTacticalCombatModifiers(tcState, spikedChain);
    expect(spikedChainMods.damageMod).toBe(6); // 3 * 2 for two-handed exotic weapon

    const longswordMods = calculateTacticalCombatModifiers(tcState, dummyLongsword);
    expect(longswordMods.attackMod).toBe(-3);
    expect(longswordMods.damageMod).toBe(3); // 3 * 1

    const daggerMods = calculateTacticalCombatModifiers(tcState, dummyDagger);
    expect(daggerMods.attackMod).toBe(-3);
    expect(daggerMods.damageMod).toBe(0); // light weapon

    const lightPick: WeaponData = {
      id: 'light_pick',
      name: 'Light Pick',
      category: 'Martial',
      size: 'L',
      damageM: '1d4',
      threat: 20,
      critMultiplier: 4,
      weight: 3,
      type: 'Piercing'
    };
    const lightPickMods = calculateTacticalCombatModifiers(tcState, lightPick);
    expect(lightPickMods.damageMod).toBe(0); // light weapon receives 0 Power Attack bonus
  });

  it('calculates Fighting Defensively & Combat Expertise Dodge AC bonuses', () => {
    const tcState = {
      ...DEFAULT_TACTICAL_COMBAT,
      fightingDefensively: true,
      combatExpertise: 2
    };

    const mods = calculateTacticalCombatModifiers(tcState, dummyLongsword);
    expect(mods.attackMod).toBe(-6); // -4 (FD) -2 (CE)
    expect(mods.acDodgeMod).toBe(4); // +2 (FD) +2 (CE)
    expect(mods.acNetMod).toBe(4);
    expect(mods.touchAcMod).toBe(4);
    expect(mods.flatAcMod).toBe(0); // Dodge AC lost when flat-footed
  });

  it('calculates Haste attack, AC, speed, and save bonuses', () => {
    const tcState = {
      ...DEFAULT_TACTICAL_COMBAT,
      haste: true
    };

    const mods = calculateTacticalCombatModifiers(tcState, dummyLongsword);
    expect(mods.attackMod).toBe(1);
    expect(mods.acDodgeMod).toBe(1);
    expect(mods.speedMod).toBe(30);
    expect(mods.refSaveMod).toBe(1);
  });

  it('calculates Barbarian Rage Str, Con, Will save, and AC penalty', () => {
    const tcState = {
      ...DEFAULT_TACTICAL_COMBAT,
      rage: true
    };

    const mods = calculateTacticalCombatModifiers(tcState, dummyGreatsword);
    expect(mods.attackMod).toBe(0); // Stance penalty 0 (Str +4 adds +2 to Str mod)
    expect(mods.damageMod).toBe(3); // 2H 1.5x Str mod => +3
    expect(mods.acNetMod).toBe(-2);
    expect(mods.touchAcMod).toBe(-2);
    expect(mods.flatAcMod).toBe(-2);
    expect(mods.fortSaveMod).toBe(2); // +4 Con => +2 Fort
    expect(mods.willSaveMod).toBe(2); // +2 morale
    expect(mods.hpBonusPerLevel).toBe(2);
  });

  it('calculates Whirling Frenzy Str, Dodge AC, Ref save, and extra attack', () => {
    const tcState = {
      ...DEFAULT_TACTICAL_COMBAT,
      whirlingFrenzy: true
    };

    const mods = calculateTacticalCombatModifiers(tcState, dummyGreatsword);
    expect(mods.attackMod).toBe(-2); // -2 flurry penalty on all attacks
    expect(mods.damageMod).toBe(3); // 2H 1.5x Str mod => +3
    expect(mods.acDodgeMod).toBe(2);
    expect(mods.acNetMod).toBe(2);
    expect(mods.refSaveMod).toBe(2);
    expect(mods.strBonus).toBe(4);

    // With +4 Str (+2 mod) and -2 flurry penalty, net attack bonus is 0 over base
    const seqFrenzy = generateFullAttackSequence(11, 0, false, false, true);
    expect(seqFrenzy).toBe('+11/+11/+6/+1');
  });

  it('correctly formats attack sequence when character has BAB 0', () => {
    // Level 1 Dragon Shaman / Wizard (BAB 0), Str 12 (+1), Masterwork (+1) => +2 total attack
    const seqMwk = generateFullAttackSequence(0, 2);
    expect(seqMwk).toBe('+2');

    // Level 1 Dragon Shaman / Wizard (BAB 0), Str 12 (+1), Standard (+0) => +1 total attack
    const seqNormal = generateFullAttackSequence(0, 1);
    expect(seqNormal).toBe('+1');

    // Level 1 Dragon Shaman / Wizard (BAB 0), Str 10 (+0), Standard (+0) => +0 total attack
    const seqZero = generateFullAttackSequence(0, 0);
    expect(seqZero).toBe('+0');
  });

  describe('Active Combat Modifiers Descriptor List', () => {
    it('returns empty array when no tactical modifiers are active', () => {
      const active = getActiveCombatModifiers(DEFAULT_TACTICAL_COMBAT, 5);
      expect(active).toEqual([]);
    });

    it('returns Whirling Frenzy descriptors with full stat breakdown', () => {
      const tcState = {
        ...DEFAULT_TACTICAL_COMBAT,
        whirlingFrenzy: true
      };
      const active = getActiveCombatModifiers(tcState, 5);
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe('whirlingFrenzy');
      expect(active[0].name).toBe('Whirling Frenzy');
      expect(active[0].affectedStats.str).toBe(4);
      expect(active[0].affectedStats.ac).toBe(2);
      expect(active[0].affectedStats.ref).toBe(2);
      expect(active[0].affectedStats.attack).toBe(-2);
      expect(active[0].affectedStats.extraAttacks).toBe(1);
    });

    it('returns Barbarian Rage descriptors with HP scaling by level', () => {
      const tcState = {
        ...DEFAULT_TACTICAL_COMBAT,
        rage: true
      };
      const active = getActiveCombatModifiers(tcState, 6);
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe('rage');
      expect(active[0].summary).toContain('+12 HP');
      expect(active[0].affectedStats.con).toBe(4);
      expect(active[0].affectedStats.fort).toBe(2);
      expect(active[0].affectedStats.will).toBe(2);
      expect(active[0].affectedStats.ac).toBe(-2);
    });

    it('returns multiple active modifiers in correct sequence', () => {
      const tcState = {
        ...DEFAULT_TACTICAL_COMBAT,
        haste: true,
        powerAttack: 4,
        combatExpertise: 2
      };
      const active = getActiveCombatModifiers(tcState, 5);
      expect(active.map(a => a.id)).toEqual(['haste', 'powerAttack', 'combatExpertise']);
    });
  });

  describe('Grapple Calculations', () => {
    it('verifies size modifier progression (±4 steps)', () => {
      expect(getSizeGrappleModifier('Fine')).toBe(-16);
      expect(getSizeGrappleModifier('Diminutive')).toBe(-12);
      expect(getSizeGrappleModifier('Tiny')).toBe(-8);
      expect(getSizeGrappleModifier('Small')).toBe(-4);
      expect(getSizeGrappleModifier('Medium')).toBe(0);
      expect(getSizeGrappleModifier('Large')).toBe(4);
      expect(getSizeGrappleModifier('Huge')).toBe(8);
      expect(getSizeGrappleModifier('Gargantuan')).toBe(12);
      expect(getSizeGrappleModifier('Colossal')).toBe(16);
    });

    it('calculates basic grapple modifier (BAB + StrMod + SizeMod)', () => {
      const char: Partial<CharacterState> = {
        selectedRace: 'Human',
        selectedFeats: []
      };
      const race: Partial<RaceData> = { name: 'Human', size: 'Medium' };
      const grapple = calculateGrappleModifier(char as CharacterState, 1, 3, race);
      expect(grapple.total).toBe(4); // BAB 1 + Str 3 + Size 0
      expect(grapple.sizeMod).toBe(0);
      expect(grapple.featBonus).toBe(0);
    });

    it('adds +4 bonus for Improved Grapple feat', () => {
      const char: Partial<CharacterState> = {
        selectedRace: 'Elf',
        selectedFeats: ['Improved Grapple']
      };
      const race: Partial<RaceData> = { name: 'Elf', size: 'Medium' };
      const grapple = calculateGrappleModifier(char as CharacterState, 1, 3, race);
      expect(grapple.total).toBe(8); // BAB 1 + Str 3 + Size 0 + Feat 4
      expect(grapple.featBonus).toBe(4);
    });

    it('applies Powerful Build size bonus (+4)', () => {
      const char: Partial<CharacterState> = {
        selectedRace: 'Goliath',
        selectedFeats: []
      };
      const race: Partial<RaceData> = { name: 'Goliath', size: 'Medium', specialAbilities: 'Powerful Build' };
      const grapple = calculateGrappleModifier(char as CharacterState, 2, 4, race);
      expect(grapple.total).toBe(10); // BAB 2 + Str 4 + Size 4 (Treated as Large)
      expect(grapple.sizeMod).toBe(4);
    });

    it('scales grapple unarmed damage dice based on Monk levels', () => {
      expect(getGrappleDamageDice('Medium', 0)).toBe('1d3');
      expect(getGrappleDamageDice('Small', 0)).toBe('1d2');
      expect(getGrappleDamageDice('Large', 0)).toBe('1d4');

      expect(getGrappleDamageDice('Medium', 1)).toBe('1d6');
      expect(getGrappleDamageDice('Medium', 4)).toBe('1d8');
      expect(getGrappleDamageDice('Medium', 8)).toBe('1d10');
      expect(getGrappleDamageDice('Medium', 12)).toBe('2d6');
      expect(getGrappleDamageDice('Medium', 16)).toBe('2d8');
      expect(getGrappleDamageDice('Medium', 20)).toBe('2d10');
    });

    it('generates a full weapon-row entry for Grapple Check', () => {
      const char: Partial<CharacterState> = {
        selectedRace: 'Elf',
        selectedFeats: ['Improved Grapple'],
        levelProgression: [{ level: 1, primaryClass: 'Barbarian', hpRoll: 12 }]
      };
      const race: Partial<RaceData> = { name: 'Elf', size: 'Medium' };
      const entry = getGrappleAttackEntry(char as CharacterState, 1, 3, DEFAULT_TACTICAL_COMBAT, race);
      expect(entry.label).toBe('Special');
      expect(entry.weapon.name).toBe('Grapple Check');
      expect(entry.attackBonus).toBe(8); // BAB 1 + Str 3 + Feat 4
      expect(entry.damageStr).toBe('1d3+3 nonlethal');
      expect(entry.type).toBe('Bludgeoning');
    });

    it('handles Smite Evil and Stunning Fist in Tactical Combat State', () => {
      const tcState = {
        ...DEFAULT_TACTICAL_COMBAT,
        smiteEvil: true,
        stunningFist: true
      };

      const activeMods = getActiveCombatModifiers(tcState);
      expect(activeMods.some(m => m.id === 'smiteEvil')).toBe(true);
      expect(activeMods.some(m => m.id === 'stunningFist')).toBe(true);

      const parsed = getTacticalCombatState({ tacticalCombat: tcState } as CharacterState);
      expect(parsed.smiteEvil).toBe(true);
      expect(parsed.stunningFist).toBe(true);
    });
  });

  describe('Extensible Combat Buffs & Stances Entity System', () => {
    it('verifies standard SRD buffs library exports', () => {
      expect(STANDARD_SRD_BUFFS.length).toBeGreaterThanOrEqual(10);
      const haste = STANDARD_SRD_BUFFS.find(b => b.id === 'haste');
      const rage = STANDARD_SRD_BUFFS.find(b => b.id === 'rage');
      const rm = STANDARD_SRD_BUFFS.find(b => b.id === 'righteous_might');
      const df = STANDARD_SRD_BUFFS.find(b => b.id === 'divine_favor');
      const ic = STANDARD_SRD_BUFFS.find(b => b.id === 'inspire_courage');
      const bs = STANDARD_SRD_BUFFS.find(b => b.id === 'bulls_strength');

      expect(haste).toBeDefined();
      expect(haste?.attackBonus).toBe(1);
      expect(haste?.speedBonus).toBe(30);

      expect(rage).toBeDefined();
      expect(rage?.abilityBonuses?.STR).toBe(4);
      expect(rage?.abilityBonuses?.CON).toBe(4);

      expect(rm).toBeDefined();
      expect(rm?.abilityBonuses?.STR).toBe(4);

      expect(df).toBeDefined();
      expect(df?.bonusType).toBe('luck');

      expect(ic).toBeDefined();
      expect(ic?.bonusType).toBe('morale');

      expect(bs).toBeDefined();
      expect(bs?.abilityBonuses?.STR).toBe(4);
    });

    it('stacks multiple Dodge AC bonuses correctly', () => {
      const buffs: ActiveCombatBuff[] = [
        {
          id: 'haste',
          name: 'Haste',
          category: 'spell',
          active: true,
          acBonus: { value: 1, type: 'dodge' }
        },
        {
          id: 'dodge_stance',
          name: 'Dodge Stance',
          category: 'stance',
          active: true,
          acBonus: { value: 2, type: 'dodge' }
        }
      ];

      const agg = aggregateBuffBonuses(buffs);
      expect(agg.acDodgeBonus).toBe(3); // 1 + 2
      expect(agg.acNetBonus).toBe(3);
      expect(agg.touchAcBonus).toBe(3);
      expect(agg.flatAcBonus).toBe(0); // Dodge bonuses lost when flat-footed
    });

    it('stacks untyped bonuses and penalties properly', () => {
      const buffs: ActiveCombatBuff[] = [
        {
          id: 'rage',
          name: 'Rage',
          category: 'class_feature',
          active: true,
          acBonus: { value: -2, type: 'untyped' }
        },
        {
          id: 'shield_spell',
          name: 'Shield',
          category: 'spell',
          active: true,
          acBonus: { value: 4, type: 'untyped' }
        }
      ];

      const agg = aggregateBuffBonuses(buffs);
      expect(agg.acUntypedBonus).toBe(2); // -2 + 4
      expect(agg.acNetBonus).toBe(2);
      expect(agg.touchAcBonus).toBe(2);
      expect(agg.flatAcBonus).toBe(2);
    });

    it('does not stack deflection bonuses (takes highest)', () => {
      const buffs: ActiveCombatBuff[] = [
        {
          id: 'shield_of_faith',
          name: 'Shield of Faith',
          category: 'spell',
          active: true,
          acBonus: { value: 2, type: 'deflection' }
        },
        {
          id: 'ring_protection',
          name: 'Ring of Protection +3',
          category: 'item',
          active: true,
          acBonus: { value: 3, type: 'deflection' }
        }
      ];

      const agg = aggregateBuffBonuses(buffs);
      expect(agg.acDeflectionMax).toBe(3);
      expect(agg.acNetBonus).toBe(3); // max(2, 3) = 3, does not stack to 5
      expect(agg.touchAcBonus).toBe(3);
      expect(agg.flatAcBonus).toBe(3);
    });

    it('does not stack morale bonuses of the same type (takes highest)', () => {
      const buffs: ActiveCombatBuff[] = [
        {
          id: 'bless',
          name: 'Bless',
          category: 'spell',
          active: true,
          bonusType: 'morale',
          attackBonus: 1
        },
        {
          id: 'good_hope',
          name: 'Good Hope',
          category: 'spell',
          active: true,
          bonusType: 'morale',
          attackBonus: 2
        }
      ];

      const agg = aggregateBuffBonuses(buffs);
      expect(agg.attackBonus).toBe(2); // max(1, 2)
    });

    it('stacks different named bonus types (e.g. Morale + Luck + Dodge)', () => {
      const buffs: ActiveCombatBuff[] = [
        {
          id: 'inspire_courage',
          name: 'Inspire Courage',
          category: 'class_feature',
          active: true,
          bonusType: 'morale',
          attackBonus: 1,
          damageBonus: 1
        },
        {
          id: 'divine_favor',
          name: 'Divine Favor',
          category: 'spell',
          active: true,
          bonusType: 'luck',
          attackBonus: 2,
          damageBonus: 2
        },
        {
          id: 'haste',
          name: 'Haste',
          category: 'spell',
          active: true,
          bonusType: 'dodge',
          attackBonus: 1
        }
      ];

      const agg = aggregateBuffBonuses(buffs);
      // Morale +1, Luck +2, Dodge +1 => Net +4 Attack; Morale +1, Luck +2 => Net +3 Damage
      expect(agg.attackBonus).toBe(4);
      expect(agg.damageBonus).toBe(3);
    });

    it('calculates ability score bonuses, save bonuses, and HP per level scaling', () => {
      const buffs: ActiveCombatBuff[] = [
        {
          id: 'bulls_strength',
          name: "Bull's Strength",
          category: 'spell',
          active: true,
          abilityBonuses: { STR: 4 }
        },
        {
          id: 'bears_endurance',
          name: "Bear's Endurance",
          category: 'spell',
          active: true,
          abilityBonuses: { CON: 4 }
        },
        {
          id: 'prayer',
          name: 'Prayer',
          category: 'spell',
          active: true,
          bonusType: 'luck',
          saveBonuses: { all: 1, type: 'luck' }
        }
      ];

      const mods = calculateTacticalCombatModifiers(DEFAULT_TACTICAL_COMBAT, undefined, false, false, buffs);
      expect(mods.strBonus).toBe(4);
      expect(mods.conBonus).toBe(4);
      expect(mods.hpBonusPerLevel).toBe(2); // +4 CON => +2 HP/level
      expect(mods.fortSaveMod).toBe(3); // +2 from CON mod + 1 from Prayer
      expect(mods.refSaveMod).toBe(1); // +1 from Prayer
      expect(mods.willSaveMod).toBe(1); // +1 from Prayer
    });

    it('bridges legacy tacticalCombat booleans seamlessly into activeBuffs', () => {
      const legacyTc: TacticalCombatState = {
        ...DEFAULT_TACTICAL_COMBAT,
        haste: true,
        rage: true
      };

      // Calling calculateTacticalCombatModifiers without explicit activeBuffs
      const mods = calculateTacticalCombatModifiers(legacyTc, dummyGreatsword);
      expect(mods.attackMod).toBe(1); // +1 from Haste
      expect(mods.speedMod).toBe(30);
      expect(mods.strBonus).toBe(4); // +4 from Rage
      expect(mods.conBonus).toBe(4);
      expect(mods.acNetMod).toBe(-1); // +1 Haste dodge - 2 Rage untyped = -1
      expect(mods.touchAcMod).toBe(-1);
      expect(mods.damageMod).toBe(3); // 2H 1.5x Str mod from Rage

      // Verify resolveActiveBuffs does not duplicate when both legacy flag and entity exist
      const resolved = resolveActiveBuffs(legacyTc, [{
        id: 'haste',
        name: 'Haste',
        category: 'spell',
        active: true,
        attackBonus: 1
      }]);
      expect(resolved.filter(b => b.id === 'haste')).toHaveLength(1);
      expect(resolved.some(b => b.id === 'rage' && b.active)).toBe(true);
    });

    it('migrates legacy character state with migrateCharacterBuffs', () => {
      const charState = {
        name: 'Old Barbarian',
        tacticalCombat: {
          ...DEFAULT_TACTICAL_COMBAT,
          haste: true,
          whirlingFrenzy: true
        }
      } as CharacterState;

      const migrated = migrateCharacterBuffs(charState);
      expect(migrated.activeBuffs).toBeDefined();
      expect(migrated.activeBuffs?.some(b => b.id === 'haste' && b.active)).toBe(true);
      expect(migrated.activeBuffs?.some(b => b.id === 'whirling_frenzy' && b.active)).toBe(true);
    });

    it('calculates full combat stats using calculateCombatStats helper', () => {
      const char: CharacterState = {
        name: 'Test Paladin',
        player: 'Tester',
        alignment: 'Lawful Good',
        deity: 'Heironeous',
        pointBuyTarget: '32',
        baseStats: { str: 16, dex: 12, con: 14, int: 10, wis: 12, cha: 14 },
        enhancementMods: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
        levelBumps: {},
        selectedRace: 'Human',
        isGestalt: false,
        levelProgression: [{ level: 1, primaryClass: 'Paladin', hpRoll: 10 }],
        skillRanks: {},
        selectedFeats: [],
        equipment: {
          armor: 'chainshirt',
          armorEnhancement: 0,
          shield: 'none',
          shieldEnhancement: 0,
          deflection: 0,
          natural: 0,
          dodge: 0,
          primaryWeapon: 'Greatsword'
        },
        tacticalCombat: {
          ...DEFAULT_TACTICAL_COMBAT,
          powerAttack: 1
        },
        activeBuffs: [
          {
            id: 'haste',
            name: 'Haste',
            category: 'spell',
            active: true,
            attackBonus: 1,
            acBonus: { value: 1, type: 'dodge' },
            extraAttacks: 1
          },
          {
            id: 'divine_favor',
            name: 'Divine Favor',
            category: 'spell',
            active: true,
            attackBonus: 2,
            damageBonus: 2
          }
        ]
      };

      const combatStats = calculateCombatStats(char, dummyGreatsword, { bab: 6 });
      // Power Attack -1, Haste +1, Divine Favor +2 => Net Attack +2
      expect(combatStats.netAttackBonus).toBe(2);
      // Power Attack 2H +2, Divine Favor +2 => Net Damage +4
      expect(combatStats.netDamageBonus).toBe(4);
      // With BAB 6 and Haste: full attack sequence has iterative attack (6, 1) + Haste extra attack at highest BAB
      expect(combatStats.fullAttackSequence).toBe('+8/+8/+3');
      expect(combatStats.activeBuffCount).toBe(2);
    });

    it('populates active combat descriptors with custom buffs', () => {
      const tcState = {
        ...DEFAULT_TACTICAL_COMBAT
      };
      const customBuffs: ActiveCombatBuff[] = [
        {
          id: 'custom_dragon_stance',
          name: 'Dragon Stance',
          category: 'stance',
          active: true,
          abilityBonuses: { STR: 2 },
          acBonus: { value: 2, type: 'dodge' },
          notes: '+2 Str, +2 Dodge AC'
        }
      ];

      const descriptors = getActiveCombatModifiers(tcState, 5, customBuffs);
      expect(descriptors.some(d => d.id === 'custom_dragon_stance')).toBe(true);
      const dragonStance = descriptors.find(d => d.id === 'custom_dragon_stance');
      expect(dragonStance?.name).toBe('Dragon Stance');
      expect(dragonStance?.affectedStats.str).toBe(2);
      expect(dragonStance?.affectedStats.ac).toBe(2);
    });
  });
});
