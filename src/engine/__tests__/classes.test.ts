import { describe, it, expect } from 'vitest';
import { calculateBAB, calculateBaseSave, calculateTotalHP, findClassInDatabase } from '../classes';
import { ClassData, LevelProgression } from '../../types/character';

const mockClasses: ClassData[] = [
  {
    id: 'fighter',
    name: 'Fighter',
    abbr: 'Ftr',
    maxLevels: 20,
    hitDie: 10,
    skillPoints: 2,
    babFactor: 1.0,
    fortFactor: 0.5,
    refFactor: 0.33,
    willFactor: 0.33,
    proficiencies: {
      lightArmor: true, mediumArmor: true, heavyArmor: true, shield: true, towerShield: true, simpleWeapons: true, martialWeapons: true
    },
    classSkills: ['Climb', 'Jump']
  },
  {
    id: 'wizard',
    name: 'Wizard',
    abbr: 'Wiz',
    maxLevels: 20,
    hitDie: 4,
    skillPoints: 2,
    babFactor: 0.5,
    fortFactor: 0.33,
    refFactor: 0.33,
    willFactor: 0.5,
    proficiencies: {
      lightArmor: false, mediumArmor: false, heavyArmor: false, shield: false, towerShield: false, simpleWeapons: false, martialWeapons: false
    },
    classSkills: ['Spellcraft']
  },
  {
    id: 'rogue',
    name: 'Rogue',
    abbr: 'Rog',
    maxLevels: 20,
    hitDie: 6,
    skillPoints: 8,
    babFactor: 0.75,
    fortFactor: 0.33,
    refFactor: 0.5,
    willFactor: 0.33,
    proficiencies: {
      lightArmor: true, mediumArmor: false, heavyArmor: false, shield: false, towerShield: false, simpleWeapons: true, martialWeapons: false
    },
    classSkills: ['Hide', 'Move Silently']
  }
];

describe('classes.ts Engine Calculations', () => {
  describe('findClassInDatabase', () => {
    it('finds class by exact name', () => {
      expect(findClassInDatabase('Fighter', mockClasses)?.id).toBe('fighter');
    });

    it('finds class by lowercase name', () => {
      expect(findClassInDatabase('fighter', mockClasses)?.id).toBe('fighter');
    });

    it('finds class by slug ID', () => {
      expect(findClassInDatabase('wizard', mockClasses)?.name).toBe('Wizard');
    });

    it('handles untrimmed strings gracefully', () => {
      expect(findClassInDatabase('  Rogue  ', mockClasses)?.id).toBe('rogue');
    });

    it('returns undefined for non-existent class', () => {
      expect(findClassInDatabase('NonExistent', mockClasses)).toBeUndefined();
      expect(findClassInDatabase(undefined, mockClasses)).toBeUndefined();
    });
  });

  describe('calculateBAB', () => {
    it('calculates full BAB for Fighter correctly with standard casing', () => {
      const progression: LevelProgression[] = [
        { level: 1, primaryClass: 'Fighter', hpRoll: 10 },
        { level: 2, primaryClass: 'Fighter', hpRoll: 6 },
        { level: 3, primaryClass: 'Fighter', hpRoll: 8 }
      ];
      expect(calculateBAB(progression, mockClasses)).toBe(3);
    });

    it('calculates full BAB correctly when primaryClass uses lowercase slug id', () => {
      const progression: LevelProgression[] = [
        { level: 1, primaryClass: 'fighter', hpRoll: 10 },
        { level: 2, primaryClass: 'fighter', hpRoll: 6 },
        { level: 3, primaryClass: 'fighter', hpRoll: 8 }
      ];
      expect(calculateBAB(progression, mockClasses)).toBe(3);
    });

    it('calculates Gestalt BAB taking maximum factor across classes', () => {
      const progression: LevelProgression[] = [
        { level: 1, primaryClass: 'wizard', secondaryClass: 'fighter', hpRoll: 10 },
        { level: 2, primaryClass: 'wizard', secondaryClass: 'fighter', hpRoll: 8 }
      ];
      // Fighter factor is 1.0, Wizard is 0.5 -> max is 1.0 per level -> BAB 2
      expect(calculateBAB(progression, mockClasses)).toBe(2);
    });
  });

  describe('calculateBaseSave', () => {
    it('calculates good Fort save for Fighter correctly with standard casing', () => {
      const progression: LevelProgression[] = [
        { level: 1, primaryClass: 'Fighter', hpRoll: 10 },
        { level: 2, primaryClass: 'Fighter', hpRoll: 6 }
      ];
      // Good save: 2 + floor(2 / 2) = 3
      expect(calculateBaseSave('fort', progression, mockClasses)).toBe(3);
      // Poor save (Ref): floor(2 / 3) = 0
      expect(calculateBaseSave('ref', progression, mockClasses)).toBe(0);
    });

    it('aggregates class count correctly even if casing varies between levels', () => {
      const progression: LevelProgression[] = [
        { level: 1, primaryClass: 'fighter', hpRoll: 10 },
        { level: 2, primaryClass: 'Fighter', hpRoll: 6 }
      ];
      // Should aggregate into Fighter 2: Good Fort = 2 + 1 = 3
      expect(calculateBaseSave('fort', progression, mockClasses)).toBe(3);
    });
  });

  describe('calculateTotalHP', () => {
    it('calculates HP accurately using class hitDie from case-insensitive lookups', () => {
      const progression: LevelProgression[] = [
        { level: 1, primaryClass: 'fighter', hpRoll: 0 }, // max at level 1: 10
        { level: 2, primaryClass: 'fighter', hpRoll: 0 }  // average: floor(10/2) + 1 = 6
      ];
      // Con mod = 2 -> (10 + 2) + (6 + 2) = 20
      expect(calculateTotalHP(progression, mockClasses, 2)).toBe(20);
    });
  });
});
