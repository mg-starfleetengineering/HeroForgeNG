import { describe, it, expect } from 'vitest';
import {
  DEFAULT_TACTICAL_COMBAT,
  getTacticalCombatState,
  isTwoHandedWeapon,
  isLightWeapon,
  calculateTacticalCombatModifiers,
  generateFullAttackSequence,
  getSizeGrappleModifier,
  calculateGrappleModifier,
  getGrappleDamageDice,
  getGrappleAttackEntry
} from '../combat';
import { CharacterState, WeaponData, RaceData } from '../../types/character';

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
  });

  it('calculates Power Attack damage scaling (2x for 2H, 1x for 1H, 0 for Light)', () => {
    const tcState = {
      ...DEFAULT_TACTICAL_COMBAT,
      powerAttack: 3
    };

    const greatswordMods = calculateTacticalCombatModifiers(tcState, dummyGreatsword);
    expect(greatswordMods.attackMod).toBe(-3);
    expect(greatswordMods.damageMod).toBe(6); // 3 * 2

    const longswordMods = calculateTacticalCombatModifiers(tcState, dummyLongsword);
    expect(longswordMods.attackMod).toBe(-3);
    expect(longswordMods.damageMod).toBe(3); // 3 * 1

    const daggerMods = calculateTacticalCombatModifiers(tcState, dummyDagger);
    expect(daggerMods.attackMod).toBe(-3);
    expect(daggerMods.damageMod).toBe(0); // light weapon
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
  });
});
