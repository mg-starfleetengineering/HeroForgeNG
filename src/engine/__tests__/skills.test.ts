import { describe, it, expect } from 'vitest';
import { CharacterState, ClassData } from '../../types/character';
import {
  isClassSkillForCharacter,
  convertSkillsToPerception,
  revertPerceptionToSkills,
  calculateSpentSkillPoints,
  calculateTotalSkillPoints,
  calculatePerceptionStats,
  getMaxSkillTricks,
  calculateSkillTrickPoints,
  validateSkillTrickPrerequisites
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
  },
  {
    id: 'sorcerer',
    name: 'Sorcerer',
    abbr: 'Sor',
    maxLevels: 20,
    hitDie: 4,
    skillPoints: 2,
    babFactor: 0.5,
    fortFactor: 0.33,
    refFactor: 0.33,
    willFactor: 0.5,
    proficiencies: {
      lightArmor: false, mediumArmor: false, heavyArmor: false, shield: false, towerShield: false, simpleWeapons: true, martialWeapons: false
    },
    classSkills: ['Bluff', 'Concentration', 'Craft', 'Knowledge (arcana)', 'Profession', 'Spellcraft']
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
    classSkills: ['Concentration', 'Craft', 'Decipher Script', 'Knowledge', 'Profession', 'Spellcraft']
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

  describe('Complete Scoundrel Skill Tricks Logic', () => {
    it('calculates max skill tricks based on character level (1 per 2 levels)', () => {
      expect(getMaxSkillTricks(1)).toBe(0);
      expect(getMaxSkillTricks(2)).toBe(1);
      expect(getMaxSkillTricks(3)).toBe(1);
      expect(getMaxSkillTricks(4)).toBe(2);
      expect(getMaxSkillTricks(10)).toBe(5);
    });

    it('deducts 2 skill points per selected trick in calculateSpentSkillPoints', () => {
      const char = createBaseCharacter();
      char.skillRanks = { Jump: 5 }; // Fighter class skill -> 5 pts
      const spent0 = calculateSpentSkillPoints(char.skillRanks, char.levelProgression, mockClasses, false, []);
      expect(spent0).toBe(5);

      const spent2 = calculateSpentSkillPoints(char.skillRanks, char.levelProgression, mockClasses, false, ['acrobatic_backstab', 'nimble_stand']);
      expect(spent2).toBe(9); // 5 skill ranks + 4 trick points
    });

    it('validates skill ranks and feat prerequisites correctly', () => {
      const char = createBaseCharacter();
      char.skillRanks = { Tumble: 12, Jump: 7 };
      char.selectedFeats = ['Quick Draw'];

      const trick1 = {
        id: 'acrobatic_backstab',
        name: 'Acrobatic Backstab',
        category: 'Movement',
        description: 'Move through foe space',
        prereqRanks: { Tumble: 12 },
        prereqFeats: []
      };

      const result1 = validateSkillTrickPrerequisites(trick1, char);
      expect(result1.valid).toBe(true);

      const trick2 = {
        id: 'sudden_draw',
        name: 'Sudden Draw',
        category: 'Manipulation',
        description: 'Draw hidden weapon',
        prereqRanks: { 'Sleight of Hand': 8 },
        prereqFeats: ['Quick Draw']
      };

      const result2 = validateSkillTrickPrerequisites(trick2, char);
      expect(result2.valid).toBe(false);
      expect(result2.missing).toContain('Requires Sleight of Hand 8 ranks (current: 0)');

      char.skillRanks['Sleight of Hand'] = 8;
      const result3 = validateSkillTrickPrerequisites(trick2, char);
      expect(result3.valid).toBe(true);
    });

    it('supports Pathfinder Perception fallback for Spot/Listen/Search skill trick prerequisites', () => {
      const char = createBaseCharacter();
      char.usePathfinderPerception = true;
      char.skillRanks = { Perception: 12 };

      const spotTrick = {
        id: 'spot_the_weak_point',
        name: 'Spot the Weak Point',
        category: 'Mental',
        description: 'Touch attack',
        prereqRanks: { Spot: 12 }
      };

      const result = validateSkillTrickPrerequisites(spotTrick, char);
      expect(result.valid).toBe(true);
    });
  });

  describe('Knowledge & Group Skill Isolation', () => {
    it('isolates specific Knowledge skills without leaking to all Knowledge sub-skills', () => {
      // Sorcerer only has Knowledge (arcana) as a class skill
      const sorcProgression = [{ level: 1, primaryClass: 'Sorcerer', hpRoll: 4 }];

      expect(isClassSkillForCharacter('Knowledge (arcana)', sorcProgression, mockClasses)).toBe(true);
      expect(isClassSkillForCharacter('Knowledge (religion)', sorcProgression, mockClasses)).toBe(false);
      expect(isClassSkillForCharacter('Knowledge (nature)', sorcProgression, mockClasses)).toBe(false);
      expect(isClassSkillForCharacter('Knowledge (the planes)', sorcProgression, mockClasses)).toBe(false);
    });

    it('grants all Knowledge sub-skills to classes with the general Knowledge group skill', () => {
      // Wizard has general 'Knowledge' in classSkills
      const wizProgression = [{ level: 1, primaryClass: 'Wizard', hpRoll: 4 }];

      expect(isClassSkillForCharacter('Knowledge (arcana)', wizProgression, mockClasses)).toBe(true);
      expect(isClassSkillForCharacter('Knowledge (religion)', wizProgression, mockClasses)).toBe(true);
      expect(isClassSkillForCharacter('Knowledge (nature)', wizProgression, mockClasses)).toBe(true);
      expect(isClassSkillForCharacter('Knowledge (history)', wizProgression, mockClasses)).toBe(true);
    });

    it('matches classes case-insensitively and by slug ID', () => {
      // Lowercase slug 'sorcerer'
      const slugProgression = [{ level: 1, primaryClass: 'sorcerer', hpRoll: 4 }];
      expect(isClassSkillForCharacter('Knowledge (arcana)', slugProgression, mockClasses)).toBe(true);
      expect(isClassSkillForCharacter('Knowledge (religion)', slugProgression, mockClasses)).toBe(false);
    });
  });
});


