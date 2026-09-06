import { describe, it, expect } from 'vitest';
import {
  evaluateFeatPrerequisites,
  buildCharacterPrereqContext,
  evaluateFeatPrerequisitesWithContext,
  splitPrerequisiteClauses,
  normalizeFeatName
} from '../featPrereqs';
import { CharacterState, FeatData, ClassData, RaceData } from '../../types/character';

const MOCK_CLASSES: ClassData[] = [
  {
    id: 'fighter',
    name: 'Fighter',
    abbr: 'Ftr',
    maxLevels: 20,
    hitDie: 10,
    skillPoints: 2,
    babFactor: 1.0,
    fortFactor: 0.5,
    refFactor: 0.34,
    willFactor: 0.34,
    proficiencies: {
      lightArmor: true,
      mediumArmor: true,
      heavyArmor: true,
      shield: true,
      towerShield: true,
      simpleWeapons: true,
      martialWeapons: true
    },
    classSkills: ['Climb', 'Jump', 'Ride', 'Swim']
  },
  {
    id: 'wizard',
    name: 'Wizard',
    abbr: 'Wiz',
    maxLevels: 20,
    hitDie: 4,
    skillPoints: 2,
    babFactor: 0.5,
    fortFactor: 0.34,
    refFactor: 0.34,
    willFactor: 0.5,
    proficiencies: {
      lightArmor: false,
      mediumArmor: false,
      heavyArmor: false,
      shield: false,
      towerShield: false,
      simpleWeapons: false,
      martialWeapons: false
    },
    classSkills: ['Concentration', 'Knowledge (Arcana)', 'Spellcraft']
  },
  {
    id: 'druid',
    name: 'Druid',
    abbr: 'Drd',
    maxLevels: 20,
    hitDie: 8,
    skillPoints: 4,
    babFactor: 0.75,
    fortFactor: 0.5,
    refFactor: 0.34,
    willFactor: 0.5,
    proficiencies: {
      lightArmor: true,
      mediumArmor: true,
      heavyArmor: false,
      shield: true,
      towerShield: false,
      simpleWeapons: true,
      martialWeapons: false
    },
    classSkills: ['Concentration', 'Handle Animal', 'Heal', 'Knowledge (Nature)', 'Listen', 'Ride', 'Spellcraft', 'Spot', 'Survival', 'Swim']
  },
  {
    id: 'rogue',
    name: 'Rogue',
    abbr: 'Rog',
    maxLevels: 20,
    hitDie: 6,
    skillPoints: 8,
    babFactor: 0.75,
    fortFactor: 0.34,
    refFactor: 0.5,
    willFactor: 0.34,
    proficiencies: {
      lightArmor: true,
      mediumArmor: false,
      heavyArmor: false,
      shield: false,
      towerShield: false,
      simpleWeapons: true,
      martialWeapons: false
    },
    classSkills: ['Appraise', 'Balance', 'Bluff', 'Climb', 'Disable Device', 'Escape Artist', 'Hide', 'Jump', 'Listen', 'Move Silently', 'Open Lock', 'Search', 'Sense Motive', 'Sleight of Hand', 'Spot', 'Tumble', 'Use Magic Device', 'Use Rope']
  }
];

const MOCK_RACES: RaceData[] = [
  {
    id: 'human',
    name: 'Human',
    size: 'Medium',
    type: 'Humanoid',
    subtype: 'Human',
    speed: { land: 30 },
    strAdj: 0,
    dexAdj: 0,
    conAdj: 0,
    intAdj: 0,
    wisAdj: 0,
    chaAdj: 0,
    bonusFeats: '1 bonus feat at 1st level'
  },
  {
    id: 'elf',
    name: 'Elf',
    size: 'Medium',
    type: 'Humanoid',
    subtype: 'Elf',
    speed: { land: 30 },
    strAdj: 0,
    dexAdj: 2,
    conAdj: -2,
    intAdj: 0,
    wisAdj: 0,
    chaAdj: 0
  },
  {
    id: 'warforged',
    name: 'Warforged',
    size: 'Medium',
    type: 'Construct',
    subtype: 'Living Construct',
    speed: { land: 30 },
    strAdj: 0,
    dexAdj: 0,
    conAdj: 2,
    intAdj: 0,
    wisAdj: -2,
    chaAdj: -2
  }
];

function createBaseCharacter(overrides: Partial<CharacterState> = {}): CharacterState {
  return {
    name: 'Test Hero',
    player: 'Player 1',
    alignment: 'Neutral Good',
    deity: 'Pelor',
    pointBuyTarget: '32',
    baseStats: { str: 14, dex: 12, con: 14, int: 10, wis: 10, cha: 10 },
    enhancementMods: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    levelBumps: {},
    selectedRace: 'Human',
    isGestalt: false,
    levelProgression: [
      { level: 1, primaryClass: 'Fighter', hpRoll: 10 }
    ],
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
    },
    ...overrides
  };
}

describe('Feat Prerequisite Validator Engine', () => {
  describe('Prerequisite String Parsing Helpers', () => {
    it('splits comma-separated clauses respecting parentheses', () => {
      const prereq = 'Dex 13+, Dodge, Spell Focus (evocation), BAB +4';
      const clauses = splitPrerequisiteClauses(prereq);
      expect(clauses).toEqual([
        'Dex 13+',
        'Dodge',
        'Spell Focus (evocation)',
        'BAB +4'
      ]);
    });

    it('normalizes parameterized feat names', () => {
      expect(normalizeFeatName('Weapon Focus (Longsword)')).toBe('weapon focus');
      expect(normalizeFeatName('Spell Focus (Conjuration)')).toBe('spell focus');
      expect(normalizeFeatName('Power Attack')).toBe('power attack');
    });
  });

  describe('Ability Score Prerequisites', () => {
    it('qualifies for Power Attack when Str >= 13', () => {
      const char = createBaseCharacter({ baseStats: { str: 14, dex: 10, con: 10, int: 10, wis: 10, cha: 10 } });
      const feat: FeatData = { id: 'power_attack', name: 'Power Attack', prerequisites: 'Str 13', description: 'Trade BAB for damage' };
      const res = evaluateFeatPrerequisites(feat, char, MOCK_CLASSES, MOCK_RACES);
      expect(res.isQualified).toBe(true);
      expect(res.unmetPrereqs).toHaveLength(0);
    });

    it('fails Power Attack when Str < 13', () => {
      const char = createBaseCharacter({ baseStats: { str: 11, dex: 10, con: 10, int: 10, wis: 10, cha: 10 } });
      const feat: FeatData = { id: 'power_attack', name: 'Power Attack', prerequisites: 'Str 13', description: 'Trade BAB for damage' };
      const res = evaluateFeatPrerequisites(feat, char, MOCK_CLASSES, MOCK_RACES);
      expect(res.isQualified).toBe(false);
      expect(res.unmetPrereqs[0]).toContain('Requires STR 13 (current: 11)');
    });

    it('considers racial stat bonuses when checking prerequisites', () => {
      // Elf has +2 Dex
      const char = createBaseCharacter({
        selectedRace: 'Elf',
        baseStats: { str: 10, dex: 12, con: 12, int: 10, wis: 10, cha: 10 }
      });
      // Base 12 Dex + 2 Elf = 14 Dex >= 13
      const feat: FeatData = { id: 'dodge', name: 'Dodge', prerequisites: 'Dex 13', description: '+1 AC' };
      const res = evaluateFeatPrerequisites(feat, char, MOCK_CLASSES, MOCK_RACES);
      expect(res.isQualified).toBe(true);
    });
  });

  describe('Base Attack Bonus (BAB) Prerequisites', () => {
    it('qualifies for Weapon Focus at BAB +1 (Fighter 1)', () => {
      const char = createBaseCharacter({
        levelProgression: [{ level: 1, primaryClass: 'Fighter', hpRoll: 10 }]
      });
      const feat: FeatData = { id: 'weapon_focus', name: 'Weapon Focus', prerequisites: 'Base attack bonus +1, Proficient with weapon', description: '+1 attack' };
      const res = evaluateFeatPrerequisites(feat, char, MOCK_CLASSES, MOCK_RACES);
      expect(res.isQualified).toBe(true);
    });

    it('fails Spring Attack when BAB < 4 (Fighter 1)', () => {
      const char = createBaseCharacter({
        baseStats: { str: 14, dex: 14, con: 10, int: 10, wis: 10, cha: 10 },
        selectedFeats: ['Dodge', 'Mobility'],
        levelProgression: [{ level: 1, primaryClass: 'Fighter', hpRoll: 10 }]
      });
      const feat: FeatData = { id: 'spring_attack', name: 'Spring Attack', prerequisites: 'Dex 13, Dodge, Mobility, BAB +4', description: 'Move and attack' };
      const res = evaluateFeatPrerequisites(feat, char, MOCK_CLASSES, MOCK_RACES);
      expect(res.isQualified).toBe(false);
      expect(res.unmetPrereqs.some(u => u.includes('BAB +4'))).toBe(true);
    });

    it('qualifies for Spring Attack when character has BAB +4 and required feats', () => {
      const char = createBaseCharacter({
        baseStats: { str: 14, dex: 14, con: 10, int: 10, wis: 10, cha: 10 },
        selectedFeats: ['Dodge', 'Mobility'],
        levelProgression: [
          { level: 1, primaryClass: 'Fighter', hpRoll: 10 },
          { level: 2, primaryClass: 'Fighter', hpRoll: 6 },
          { level: 3, primaryClass: 'Fighter', hpRoll: 6 },
          { level: 4, primaryClass: 'Fighter', hpRoll: 6 }
        ]
      });
      const feat: FeatData = { id: 'spring_attack', name: 'Spring Attack', prerequisites: 'Dex 13, Dodge, Mobility, BAB +4', description: 'Move and attack' };
      const res = evaluateFeatPrerequisites(feat, char, MOCK_CLASSES, MOCK_RACES);
      expect(res.isQualified).toBe(true);
    });
  });

  describe('Feat Chains & Parameterized Feat Matching', () => {
    it('qualifies for Cleave if character already has Power Attack', () => {
      const char = createBaseCharacter({
        baseStats: { str: 14, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        selectedFeats: ['Power Attack']
      });
      const feat: FeatData = { id: 'cleave', name: 'Cleave', prerequisites: 'Str 13, Power Attack', description: 'Extra attack on kill' };
      const res = evaluateFeatPrerequisites(feat, char, MOCK_CLASSES, MOCK_RACES);
      expect(res.isQualified).toBe(true);
    });

    it('fails Cleave if character lacks Power Attack', () => {
      const char = createBaseCharacter({
        baseStats: { str: 14, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        selectedFeats: []
      });
      const feat: FeatData = { id: 'cleave', name: 'Cleave', prerequisites: 'Str 13, Power Attack', description: 'Extra attack on kill' };
      const res = evaluateFeatPrerequisites(feat, char, MOCK_CLASSES, MOCK_RACES);
      expect(res.isQualified).toBe(false);
      expect(res.unmetPrereqs).toContain('Requires Feat: Power Attack');
    });

    it('matches parameterized feats like Weapon Focus (Nodachi) for Weapon Specialization', () => {
      const char = createBaseCharacter({
        selectedFeats: ['Weapon Focus (Nodachi)'],
        levelProgression: [
          { level: 1, primaryClass: 'Fighter', hpRoll: 10 },
          { level: 2, primaryClass: 'Fighter', hpRoll: 6 },
          { level: 3, primaryClass: 'Fighter', hpRoll: 6 },
          { level: 4, primaryClass: 'Fighter', hpRoll: 6 }
        ]
      });
      const feat: FeatData = {
        id: 'weapon_specialization',
        name: 'Weapon Specialization',
        prerequisites: 'Proficient with weapon, Weapon Focus with weapon, fighter level 4th',
        description: '+2 damage'
      };
      const res = evaluateFeatPrerequisites(feat, char, MOCK_CLASSES, MOCK_RACES);
      expect(res.isQualified).toBe(true);
    });
  });

  describe('Class Level & Caster Level Prerequisites', () => {
    it('validates Fighter level 4th', () => {
      const charLvl2 = createBaseCharacter({
        levelProgression: [
          { level: 1, primaryClass: 'Fighter', hpRoll: 10 },
          { level: 2, primaryClass: 'Fighter', hpRoll: 6 }
        ]
      });
      const feat: FeatData = { id: 'ws', name: 'Weapon Specialization', prerequisites: 'Fighter level 4th', description: '+2 damage' };
      const res2 = evaluateFeatPrerequisites(feat, charLvl2, MOCK_CLASSES, MOCK_RACES);
      expect(res2.isQualified).toBe(false);
      expect(res2.unmetPrereqs[0]).toContain('Requires Fighter level 4 (current: 2)');
    });

    it('validates Caster Level 3rd for item creation feats', () => {
      const wiz1 = createBaseCharacter({
        levelProgression: [{ level: 1, primaryClass: 'Wizard', hpRoll: 4 }]
      });
      const craftWondrous: FeatData = { id: 'craft_wondrous', name: 'Craft Wondrous Item', prerequisites: 'Caster level 3rd', description: 'Craft items' };
      const resWiz1 = evaluateFeatPrerequisites(craftWondrous, wiz1, MOCK_CLASSES, MOCK_RACES);
      expect(resWiz1.isQualified).toBe(false);
      expect(resWiz1.unmetPrereqs[0]).toContain('Requires Caster Level 3 (current: 1)');

      const wiz3 = createBaseCharacter({
        levelProgression: [
          { level: 1, primaryClass: 'Wizard', hpRoll: 4 },
          { level: 2, primaryClass: 'Wizard', hpRoll: 4 },
          { level: 3, primaryClass: 'Wizard', hpRoll: 4 }
        ]
      });
      const resWiz3 = evaluateFeatPrerequisites(craftWondrous, wiz3, MOCK_CLASSES, MOCK_RACES);
      expect(resWiz3.isQualified).toBe(true);
    });

    it('validates Natural Spell (Wis 13, Wild Shape ability)', () => {
      const druid4 = createBaseCharacter({
        baseStats: { str: 10, dex: 10, con: 10, int: 10, wis: 14, cha: 10 },
        levelProgression: [
          { level: 1, primaryClass: 'Druid', hpRoll: 8 },
          { level: 2, primaryClass: 'Druid', hpRoll: 5 },
          { level: 3, primaryClass: 'Druid', hpRoll: 5 },
          { level: 4, primaryClass: 'Druid', hpRoll: 5 }
        ]
      });
      const naturalSpell: FeatData = {
        id: 'natural_spell',
        name: 'Natural Spell',
        prerequisites: 'Wis 13, Ability to use wild shape',
        description: 'Cast spells in wild shape'
      };
      const res4 = evaluateFeatPrerequisites(naturalSpell, druid4, MOCK_CLASSES, MOCK_RACES);
      expect(res4.isQualified).toBe(false);
      expect(res4.unmetPrereqs[0]).toContain('Requires Wild Shape ability');

      const druid5 = createBaseCharacter({
        baseStats: { str: 10, dex: 10, con: 10, int: 10, wis: 14, cha: 10 },
        levelProgression: [
          { level: 1, primaryClass: 'Druid', hpRoll: 8 },
          { level: 2, primaryClass: 'Druid', hpRoll: 5 },
          { level: 3, primaryClass: 'Druid', hpRoll: 5 },
          { level: 4, primaryClass: 'Druid', hpRoll: 5 },
          { level: 5, primaryClass: 'Druid', hpRoll: 5 }
        ]
      });
      const res5 = evaluateFeatPrerequisites(naturalSpell, druid5, MOCK_CLASSES, MOCK_RACES);
      expect(res5.isQualified).toBe(true);
    });
  });

  describe('Skill Ranks Prerequisites', () => {
    it('validates skill ranks correctly', () => {
      const char = createBaseCharacter({
        skillRanks: { 'Spellcraft': 4, 'Knowledge (Arcana)': 2 }
      });
      const feat1: FeatData = { id: 'f1', name: 'Arcane Thesis', prerequisites: 'Spellcraft 4 ranks', description: 'Thesis' };
      const feat2: FeatData = { id: 'f2', name: 'Arcane Mastery', prerequisites: 'Knowledge (Arcana) 4 ranks', description: 'Mastery' };

      expect(evaluateFeatPrerequisites(feat1, char, MOCK_CLASSES, MOCK_RACES).isQualified).toBe(true);
      const res2 = evaluateFeatPrerequisites(feat2, char, MOCK_CLASSES, MOCK_RACES);
      expect(res2.isQualified).toBe(false);
      expect(res2.unmetPrereqs[0]).toContain('Requires Knowledge (Arcana) 4 ranks (current: 2)');
    });
  });

  describe('Compound OR Logic', () => {
    it('satisfies OR requirement if either side matches', () => {
      // "Base attack bonus +6 or fighter level 4th"
      // Case 1: Fighter 4 (BAB +4, Fighter level 4) -> should be satisfied via Fighter level 4
      const charFtr4 = createBaseCharacter({
        levelProgression: [
          { level: 1, primaryClass: 'Fighter', hpRoll: 10 },
          { level: 2, primaryClass: 'Fighter', hpRoll: 6 },
          { level: 3, primaryClass: 'Fighter', hpRoll: 6 },
          { level: 4, primaryClass: 'Fighter', hpRoll: 6 }
        ]
      });
      const feat: FeatData = { id: 'or_feat', name: 'Weapon Spec Option', prerequisites: 'Base attack bonus +6 or fighter level 4th', description: 'OR test' };
      expect(evaluateFeatPrerequisites(feat, charFtr4, MOCK_CLASSES, MOCK_RACES).isQualified).toBe(true);

      // Case 2: Rogue 8 (BAB +6, Fighter level 0) -> should be satisfied via BAB +6
      const charRog8 = createBaseCharacter({
        levelProgression: Array(8).fill({ primaryClass: 'Rogue', hpRoll: 6 })
      });
      expect(evaluateFeatPrerequisites(feat, charRog8, MOCK_CLASSES, MOCK_RACES).isQualified).toBe(true);

      // Case 3: Rogue 2 (BAB +1, Fighter level 0) -> should fail
      const charRog2 = createBaseCharacter({
        levelProgression: Array(2).fill({ primaryClass: 'Rogue', hpRoll: 6 })
      });
      expect(evaluateFeatPrerequisites(feat, charRog2, MOCK_CLASSES, MOCK_RACES).isQualified).toBe(false);
    });
  });

  describe('Racial & Editorial Clauses', () => {
    it('validates Warforged racial feat requirement', () => {
      const human = createBaseCharacter({ selectedRace: 'Human' });
      const warforged = createBaseCharacter({ selectedRace: 'Warforged' });
      const feat: FeatData = { id: 'adamantine_body', name: 'Adamantine Body', prerequisites: 'Warforged, 1st level only', description: 'Heavy plating' };

      expect(evaluateFeatPrerequisites(feat, human, MOCK_CLASSES, MOCK_RACES).isQualified).toBe(false);
      expect(evaluateFeatPrerequisites(feat, warforged, MOCK_CLASSES, MOCK_RACES).isQualified).toBe(true);
    });

    it('ignores editorial comments like (not verified) or Meet Regional Requirement', () => {
      const char = createBaseCharacter({ baseStats: { str: 14, dex: 10, con: 10, int: 10, wis: 10, cha: 10 } });
      const feat: FeatData = {
        id: 'regional_feat',
        name: 'Regional Power',
        prerequisites: 'Str 13, Meet Regional Requirement (not verified)',
        description: 'Regional feat'
      };
      const res = evaluateFeatPrerequisites(feat, char, MOCK_CLASSES, MOCK_RACES);
      expect(res.isQualified).toBe(true);
    });
  });
});
