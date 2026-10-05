import { describe, it, expect } from 'vitest';
import {
  getEffectiveSpeed,
  calculateTraitFlawSpeedMod,
  calculateClassSpeedBonus,
  calculateFeatSpeedBonus,
  calculateTotalSpeed
} from '../stats';
import { CharacterState, RaceData } from '../../types/character';

describe('Speed Calculations & Coercion', () => {
  it('should return numeric land speed even when race data has land speed as a string', () => {
    const raceObj: Partial<RaceData> = {
      speed: {
        land: '30' as any,
        fly: '50' as any
      }
    };

    const speed = getEffectiveSpeed(raceObj);
    expect(typeof speed.land).toBe('number');
    expect(speed.land).toBe(30);
    expect(speed.fly).toBe(50);
  });

  it('should correctly calculate trait/flaw speed delta without string concatenation', () => {
    // If baseSpeed is passed as string "30", parseVal ensures numeric math
    const delta = calculateTraitFlawSpeedMod([], [], [], [], '30' as any);
    expect(delta).toBe(0);
    expect(typeof delta).toBe('number');
  });

  it('should calculate Barbarian Fast Movement (+10 ft speed bonus)', () => {
    const levelProgression = [{ level: 1, primaryClass: 'Barbarian', hpRoll: 12 }];
    const bonus = calculateClassSpeedBonus(levelProgression, 'chainshirt', false);
    expect(bonus).toBe(10);
  });

  it('should calculate total speed for a Wild Elf Barbarian 1 without bugged values like 30270', () => {
    const wildElfRace: Partial<RaceData> = {
      name: 'Elf, Wild',
      speed: { land: '30' as any }
    };

    const charState: CharacterState = {
      name: 'Ghislaine Dedoldia',
      player: 'Michael',
      alignment: 'Chaotic Neutral',
      deity: 'Kord',
      pointBuyTarget: '32',
      baseStats: { str: 14, dex: 16, con: 14, int: 10, wis: 10, cha: 10 },
      enhancementMods: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
      levelBumps: {},
      selectedRace: 'Elf, Wild',
      isGestalt: false,
      levelProgression: [{ level: 1, primaryClass: 'Barbarian', hpRoll: 14 }],
      skillRanks: {},
      selectedFeats: [],
      equipment: {
        armor: 'none',
        armorEnhancement: 0,
        shield: 'none',
        shieldEnhancement: 0,
        deflection: 0,
        natural: 0,
        dodge: 0,
        primaryWeapon: 'Longsword'
      }
    };

    const result = calculateTotalSpeed(charState, wildElfRace, undefined, [], []);
    expect(typeof result.land).toBe('number');
    expect(result.land).toBe(40); // 30 base + 10 Barbarian fast movement
    expect(String(result.land)).not.toContain('30270');
  });

  describe('Encumbrance Movement Speed Penalties (PHB p. 162)', () => {
    const humanFighter: CharacterState = {
      name: 'Human Fighter',
      player: 'Player',
      alignment: 'Neutral Good',
      deity: 'None',
      pointBuyTarget: '32',
      baseStats: { str: 14, dex: 14, con: 14, int: 10, wis: 10, cha: 10 },
      enhancementMods: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
      levelBumps: {},
      selectedRace: 'Human',
      isGestalt: false,
      levelProgression: [{ level: 1, primaryClass: 'Fighter', hpRoll: 10 }],
      skillRanks: {},
      selectedFeats: [],
      equipment: {
        armor: 'none',
        armorEnhancement: 0,
        shield: 'none',
        shieldEnhancement: 0,
        deflection: 0,
        natural: 0,
        dodge: 0,
        primaryWeapon: 'Longsword'
      }
    };

    const humanRace: Partial<RaceData> = {
      name: 'Human',
      speed: { land: 30 }
    };

    const dwarfFighter: CharacterState = {
      ...humanFighter,
      name: 'Dwarf Fighter',
      selectedRace: 'Dwarf'
    };

    const dwarfRace: Partial<RaceData> = {
      name: 'Dwarf',
      speed: { land: 20 },
      traits: ['dwarf_speed']
    };

    it('retains 30 ft base speed under light encumbrance', () => {
      const res = calculateTotalSpeed(humanFighter, humanRace, undefined, [], [], 'light');
      expect(res.land).toBe(30);
    });

    it('reduces speed from 30 ft to 20 ft under medium encumbrance', () => {
      const res = calculateTotalSpeed(humanFighter, humanRace, undefined, [], [], 'medium');
      expect(res.land).toBe(20);
    });

    it('reduces speed from 30 ft to 20 ft under heavy encumbrance', () => {
      const res = calculateTotalSpeed(humanFighter, humanRace, undefined, [], [], 'heavy');
      expect(res.land).toBe(20);
    });

    it('does not reduce Dwarf movement speed under medium or heavy encumbrance', () => {
      const resMedium = calculateTotalSpeed(dwarfFighter, dwarfRace, undefined, [], [], 'medium');
      expect(resMedium.land).toBe(20);

      const resHeavy = calculateTotalSpeed(dwarfFighter, dwarfRace, undefined, [], [], 'heavy');
      expect(resHeavy.land).toBe(20);
    });

    it('negates Barbarian Fast Movement when encumbered (medium or heavy load)', () => {
      const barbLevel = [{ level: 1, primaryClass: 'Barbarian', hpRoll: 12 }];
      // Unencumbered
      expect(calculateClassSpeedBonus(barbLevel, 'chainshirt', false)).toBe(10);
      // Encumbered
      expect(calculateClassSpeedBonus(barbLevel, 'chainshirt', true)).toBe(0);

      const wildElfRace: Partial<RaceData> = { name: 'Elf, Wild', speed: { land: 30 } };
      const barbChar: CharacterState = {
        ...humanFighter,
        levelProgression: barbLevel
      };
      // Medium load suppresses 10 ft fast movement and reduces 30 ft base to 20 ft
      const resEncumbered = calculateTotalSpeed(barbChar, wildElfRace, undefined, [], [], 'medium');
      expect(resEncumbered.classBonus).toBe(0);
      expect(resEncumbered.land).toBe(20);
    });
  });
});
