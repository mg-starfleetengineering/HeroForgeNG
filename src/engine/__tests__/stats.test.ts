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
});
