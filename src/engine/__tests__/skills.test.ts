import { describe, it, expect } from 'vitest';
import { CharacterState, ClassData } from '../../types/character';
import {
  isClassSkillForCharacter,
  convertSkillsToPerception,
  revertPerceptionToSkills,
  calculateSpentSkillPoints,
  calculateTotalSkillPoints,
  calculatePerceptionStats
} from '../skills';

const mockClasses: ClassData[] = [
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
    classSkills: ['Disable Device', 'Hide', 'Listen', 'Move Silently', 'Open Lock', 'Search', 'Spot', 'Tumble']
  },
  {
    id: 'ranger',
    name: 'Ranger',
    abbr: 'Rgr',
    maxLevels: 20,
    hitDie: 8,
    skillPoints: 6,
    babFactor: 1.0,
    fortFactor: 0.5,
    refFactor: 0.5,
    willFactor: 0.33,
    proficiencies: {
      lightArmor: true, mediumArmor: false, heavyArmor: false, shield: true, towerShield: false, simpleWeapons: true, martialWeapons: true
    },
    classSkills: ['Handle Animal', 'Hide', 'Listen', 'Move Silently', 'Spot', 'Survival']
  },
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
    classSkills: ['Climb', 'Handle Animal', 'Intimidate', 'Jump', 'Ride', 'Swim']
  }
];

const createBaseCharacter = (): CharacterState => ({
  name: 'Test Hero',
  player: 'Tester',
  alignment: 'Neutral',
  deity: 'None',
  pointBuyTarget: '32',
  baseStats: { str: 10, dex: 10, con: 10, int: 10, wis: 14, cha: 10 },
  enhancementMods: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
  levelBumps: {},
  selectedRace: 'Human',
  isGestalt: false,
  levelProgression: [
    { level: 1, primaryClass: 'Fighter', secondaryClass: '', hpRoll: 10 },
    { level: 2, primaryClass: 'Fighter', secondaryClass: '', hpRoll: 6 }
  ],
  skillRanks: {},
  selectedFeats: [],
  equipment: {
    armor: 'none', armorEnhancement: 0, shield: 'none', shieldEnhancement: 0, deflection: 0, natural: 0, dodge: 0, primaryWeapon: 'Unarmed'
  }
});

describe('Pathfinder Perception Skill Logic', () => {
  describe('Class Skill Inheritance', () => {
    it('identifies Perception as a Class Skill for Rogue (has Search, Spot, Listen)', () => {
      const char = createBaseCharacter();
      char.levelProgression = [{ level: 1, primaryClass: 'Rogue', hpRoll: 6 }];
      expect(isClassSkillForCharacter('Perception', char.levelProgression, mockClasses)).toBe(true);
    });

    it('identifies Perception as a Class Skill for Ranger (has Spot, Listen)', () => {
      const char = createBaseCharacter();
      char.levelProgression = [{ level: 1, primaryClass: 'Ranger', hpRoll: 8 }];
      expect(isClassSkillForCharacter('Perception', char.levelProgression, mockClasses)).toBe(true);
    });

    it('identifies Perception as a Cross-Class Skill for Fighter (has none of the three)', () => {
      const char = createBaseCharacter();
      char.levelProgression = [{ level: 1, primaryClass: 'Fighter', hpRoll: 10 }];
      expect(isClassSkillForCharacter('Perception', char.levelProgression, mockClasses)).toBe(false);
    });

    it('identifies Perception as a Class Skill for Multiclass Fighter/Rogue', () => {
      const char = createBaseCharacter();
      char.levelProgression = [
        { level: 1, primaryClass: 'Fighter', hpRoll: 10 },
        { level: 2, primaryClass: 'Rogue', hpRoll: 6 }
      ];
      expect(isClassSkillForCharacter('Perception', char.levelProgression, mockClasses)).toBe(true);
    });
  });

  describe('Option B Cache Test (Lossless Reversibility)', () => {
    it('restores exact rank distributions (Spot: 5, Listen: 2, Search: 0) when toggling ON -> OFF', () => {
      const char = createBaseCharacter();
      char.levelProgression = [{ level: 1, primaryClass: 'Rogue', hpRoll: 6 }];
      char.skillRanks = { Spot: 5, Listen: 2, Search: 0, Hide: 3 };

      // Toggle ON
      const mergedChar = convertSkillsToPerception(char);
      expect(mergedChar.usePathfinderPerception).toBe(true);
      expect(mergedChar.skillRanks['Perception']).toBe(5);
      expect(mergedChar.skillRanks['Spot']).toBeUndefined();
      expect(mergedChar.skillRanks['Listen']).toBeUndefined();
      expect(mergedChar.skillRanks['Search']).toBeUndefined();
      expect(mergedChar.prePerceptionSkillsCache).toEqual({ spotRanks: 5, listenRanks: 2, searchRanks: 0 });

      // Toggle OFF
      const revertedChar = revertPerceptionToSkills(mergedChar);
      expect(revertedChar.usePathfinderPerception).toBe(false);
      expect(revertedChar.prePerceptionSkillsCache).toBeUndefined();
      expect(revertedChar.skillRanks['Perception']).toBeUndefined();
      expect(revertedChar.skillRanks['Spot']).toBe(5);
      expect(revertedChar.skillRanks['Listen']).toBe(2);
      expect(revertedChar.skillRanks['Search']).toBe(0);
      expect(revertedChar.skillRanks['Hide']).toBe(3);
    });
  });

  describe('Merged Investment Test', () => {
    it('correctly distributes added Perception ranks to component skills when reverting', () => {
      const char = createBaseCharacter();
      char.levelProgression = [{ level: 1, primaryClass: 'Rogue', hpRoll: 6 }];
      char.skillRanks = { Spot: 5, Listen: 2, Search: 0 };

      // 1. Toggle ON
      const merged = convertSkillsToPerception(char);
      expect(merged.skillRanks['Perception']).toBe(5);

      // 2. User adds 2 ranks to Perception (total 7)
      merged.skillRanks['Perception'] = 7;

      // 3. Toggle OFF
      const reverted = revertPerceptionToSkills(merged);
      expect(reverted.skillRanks['Spot']).toBe(7); // 5 + 2
      expect(reverted.skillRanks['Listen']).toBe(4); // 2 + 2
      expect(reverted.skillRanks['Search']).toBe(2); // 0 + 2
      expect(reverted.skillRanks['Perception']).toBeUndefined();
    });
  });

  describe('Skill Point Balance Integrity', () => {
    it('maintains budget invariant (Spent + Unallocated = Total Budget) before, during, and after toggling', () => {
      const char = createBaseCharacter();
      char.levelProgression = [
        { level: 1, primaryClass: 'Rogue', hpRoll: 6 },
        { level: 2, primaryClass: 'Rogue', hpRoll: 6 }
      ];
      // Int 10 (+0), Human (+1 per level): L1 = (8+0+1)*4 = 36, L2 = (8+0+1) = 9. Total budget = 45.
      const totalBudget = calculateTotalSkillPoints(char.levelProgression, mockClasses, 0, true);
      expect(totalBudget).toBe(45);

      // Initial 3.5e skills: Spot: 5, Listen: 2, Search: 1 -> total spent = 8 pts
      char.skillRanks = { Spot: 5, Listen: 2, Search: 1 };
      const spent1 = calculateSpentSkillPoints(char.skillRanks, char.levelProgression, mockClasses, false);
      expect(spent1).toBe(8);
      const unallocated1 = totalBudget - spent1;
      expect(spent1 + unallocated1).toBe(totalBudget);

      // Toggle ON -> Perception becomes max(5, 2, 1) = 5 -> spent = 5 pts (refunded 3 pts)
      const merged = convertSkillsToPerception(char);
      const spent2 = calculateSpentSkillPoints(merged.skillRanks, merged.levelProgression, mockClasses, true);
      expect(spent2).toBe(5);
      const unallocated2 = totalBudget - spent2;
      expect(spent2 + unallocated2).toBe(totalBudget);
      expect(unallocated2 - unallocated1).toBe(3); // 3 pts refunded!

      // Toggle OFF -> Spot: 5, Listen: 2, Search: 1 restored -> spent = 8 pts
      const reverted = revertPerceptionToSkills(merged);
      const spent3 = calculateSpentSkillPoints(reverted.skillRanks, reverted.levelProgression, mockClasses, false);
      expect(spent3).toBe(8);
      const unallocated3 = totalBudget - spent3;
      expect(spent3 + unallocated3).toBe(totalBudget);
    });
  });

  describe('Alertness Feat & Perception Stats Calculation', () => {
    it('adds +2 Alertness bonus to Perception when Alertness feat is selected', () => {
      const char = createBaseCharacter();
      char.selectedFeats = ['Alertness'];
      char.skillRanks = { Perception: 4 };

      // Wis Mod = +2 (Wis 14)
      const stats = calculatePerceptionStats(char, mockClasses, 2);
      expect(stats.ranks).toBe(4);
      expect(stats.wisMod).toBe(2);
      expect(stats.alertnessBonus).toBe(2);
      expect(stats.totalBonus).toBe(8); // 4 ranks + 2 wis + 2 alertness
    });

    it('does not add Alertness bonus when Alertness feat is absent', () => {
      const char = createBaseCharacter();
      char.selectedFeats = ['Power Attack'];
      char.skillRanks = { Perception: 4 };

      const stats = calculatePerceptionStats(char, mockClasses, 2);
      expect(stats.alertnessBonus).toBe(0);
      expect(stats.totalBonus).toBe(6); // 4 ranks + 2 wis
    });
  });
});
