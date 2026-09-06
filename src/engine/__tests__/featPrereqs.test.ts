import { describe, it, expect } from 'vitest';
import {
  evaluateFeatPrerequisites,
  buildCharacterPrereqContext,
  evaluateFeatPrerequisitesWithContext,
  splitPrerequisiteClauses,
  normalizeFeatName,
  aggregateAndDeduplicateFeats
} from '../featPrereqs';
import { isItemSourceAllowed, getAllSourceBadges } from '../../utils/sourceFilter';
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

  describe('Base Save Prerequisites', () => {
    it('validates Base Fortitude save bonus +2 for Fighter 1 (base fort +2)', () => {
      const ftr1 = createBaseCharacter({
        levelProgression: [{ level: 1, primaryClass: 'Fighter', hpRoll: 10 }]
      });
      const improvedToughness: FeatData = {
        id: 'improved_toughness',
        name: 'Improved Toughness',
        prerequisites: 'Base Fortitude save bonus +2.',
        description: 'Gain hp equal to current HD'
      };
      const res = evaluateFeatPrerequisites(improvedToughness, ftr1, MOCK_CLASSES, MOCK_RACES);
      expect(res.isQualified).toBe(true);
      expect(res.unmetPrereqs).toHaveLength(0);
    });

    it('fails Base Fortitude save bonus +2 for Wizard 1 (base fort +0)', () => {
      const wiz1 = createBaseCharacter({
        levelProgression: [{ level: 1, primaryClass: 'Wizard', hpRoll: 4 }]
      });
      const improvedToughness: FeatData = {
        id: 'improved_toughness',
        name: 'Improved Toughness',
        prerequisites: 'Base Fortitude save bonus +2.',
        description: 'Gain hp equal to current HD'
      };
      const res = evaluateFeatPrerequisites(improvedToughness, wiz1, MOCK_CLASSES, MOCK_RACES);
      expect(res.isQualified).toBe(false);
      expect(res.unmetPrereqs[0]).toContain('Requires Base Fortitude save +2 (current: +0)');
    });

    it('validates base Will save +3 and Base Reflex save +3', () => {
      // Wizard 3 (good Will save: 2 + floor(3/2) = +3)
      const wiz3 = createBaseCharacter({
        levelProgression: [
          { level: 1, primaryClass: 'Wizard', hpRoll: 4 },
          { level: 2, primaryClass: 'Wizard', hpRoll: 4 },
          { level: 3, primaryClass: 'Wizard', hpRoll: 4 }
        ]
      });
      const willFeat: FeatData = {
        id: 'gestalt_anchor',
        name: 'Gestalt Anchor',
        prerequisites: 'base Will save +3',
        description: 'Anchor'
      };
      const refFeat: FeatData = {
        id: 'ref_feat',
        name: 'Reflex Master',
        prerequisites: 'Base Reflex save +3',
        description: 'Reflex test'
      };

      const willRes = evaluateFeatPrerequisites(willFeat, wiz3, MOCK_CLASSES, MOCK_RACES);
      expect(willRes.isQualified).toBe(true);

      const refRes = evaluateFeatPrerequisites(refFeat, wiz3, MOCK_CLASSES, MOCK_RACES);
      expect(refRes.isQualified).toBe(false);
      expect(refRes.unmetPrereqs[0]).toContain('Requires Base Reflex save +3 (current: +1)');
    });
  });

  describe('Feat Deduplication and Multi-Source Aggregation', () => {
    it('merges cross-reference dashed pointer entries into the canonical feat', () => {
      const rawFeats: FeatData[] = [
        {
          id: '--improved_toughness--',
          name: '--Improved Toughness--',
          prerequisites: '(See Monster Manual IV)',
          description: ': Gain hp equal to your current HD.',
          source: 'PH'
        },
        {
          id: '--_improved_toughness_--',
          name: '-- Improved Toughness --',
          prerequisites: '(See Monster Manual 4)',
          description: ': Gain hp equal to your current HD',
          source: 'PH'
        },
        {
          id: 'improved_toughness',
          name: 'Improved Toughness',
          prerequisites: 'Base Fortitude save bonus +2.',
          description: ': Gain hp equal to your current HD.',
          source: 'MM4'
        }
      ];

      const deduped = aggregateAndDeduplicateFeats(rawFeats);
      expect(deduped).toHaveLength(1);

      const canonical = deduped[0];
      expect(canonical.name).toBe('Improved Toughness');
      expect(canonical.prerequisites).toBe('Base Fortitude save bonus +2.');
      expect(canonical.sources).toEqual(expect.arrayContaining(['PH', 'MM4']));
    });

    it('allows a multi-source feat when ANY of its sources is allowed', () => {
      const feat: FeatData = {
        id: 'improved_toughness',
        name: 'Improved Toughness',
        source: 'MM4',
        sources: ['PH', 'MM4'],
        description: 'Gain hp equal to current HD'
      };

      // Allowed sources only contains PHB (Core)
      const allowedSources = ['PHB', 'DMG', 'MM'];
      expect(isItemSourceAllowed(feat, allowedSources)).toBe(true);

      // Returns badge info for all sources
      const badgeInfo = getAllSourceBadges(feat, allowedSources);
      expect(badgeInfo.isAllowed).toBe(true);
      expect(badgeInfo.badges).toHaveLength(2);

      const phBadge = badgeInfo.badges.find(b => b.sourceCode === 'PHB');
      const mm4Badge = badgeInfo.badges.find(b => b.sourceCode === 'MM4');
      expect(phBadge?.isAllowed).toBe(true);
      expect(mm4Badge?.isAllowed).toBe(false);
    });

    it('intelligently preserves the richer mechanical rules description for Clinging Breath and Fling Enemy', () => {
      const clingingFeats: FeatData[] = [
        {
          id: '--_clinging_breath_--',
          name: '-- Clinging Breath --',
          prerequisites: '(See Monster Manual IV)',
          description: ': Breath deals extra damage 1 round later',
          source: 'PH'
        },
        {
          id: 'clinging_breath',
          name: 'Clinging Breath',
          prerequisites: 'Con 13, Breath weapon (not verified)',
          description: ': Your breath weapon continues to affect targets after you breathe.',
          source: 'MM4'
        }
      ];

      const dedupedClinging = aggregateAndDeduplicateFeats(clingingFeats);
      expect(dedupedClinging).toHaveLength(1);
      expect(dedupedClinging[0].prerequisites).toBe('Con 13, Breath weapon (not verified)');
      expect(dedupedClinging[0].description).toContain('1 round later');

      const flingFeats: FeatData[] = [
        {
          id: '--fling_enemy--',
          name: '--Fling Enemy--',
          prerequisites: '(see Races of Stone)',
          description: ': You can make a grapple check at a -20 penalty against an opponent at least two size categories smaller than you. The range increment for the thrown creature is 120 feet.',
          source: 'PH'
        },
        {
          id: 'fling_enemy',
          name: 'Fling Enemy',
          prerequisites: 'Str 19, Rock Hurling or racial ability to throw rocks, size Large or larger (or Powerful Build)',
          description: ': Throw an enemy you\'re grappling',
          source: 'RoS'
        }
      ];

      const dedupedFling = aggregateAndDeduplicateFeats(flingFeats);
      expect(dedupedFling).toHaveLength(1);
      expect(dedupedFling[0].prerequisites).toContain('Str 19, Rock Hurling');
      expect(dedupedFling[0].description).toContain('-20 penalty');
      expect(dedupedFling[0].description).toContain('120 feet');
    });

    it('merges 3.0e / variant edition aliases into canonical 3.5e records', () => {
      const aliasFeats: FeatData[] = [
        {
          id: '--ki_shout--',
          name: '-- Ki Shout --',
          prerequisites: '(see Complete Warrior)',
          description: ': Make a shout to panic foes',
          source: 'OA'
        },
        {
          id: 'kiai_shout',
          name: 'Kiai Shout',
          prerequisites: 'Cha 13, Base attack bonus +1',
          description: ': Yell to make opponents within 30 ft. become shaken',
          source: 'CW'
        },
        {
          id: '--tunnel_fighter--',
          name: '-- Tunnel Fighter --',
          prerequisites: '(see Dungeonscape)',
          description: ': Cause enemy to make melee attacks only against you.',
          source: 'PH'
        },
        {
          id: 'tunnel_fighting',
          name: 'Tunnel Fighting',
          prerequisites: 'Base attack bonus +1',
          description: ': No penalty on attacks or to AC when squeezing.',
          source: 'Ds'
        }
      ];

      const deduped = aggregateAndDeduplicateFeats(aliasFeats);
      expect(deduped).toHaveLength(2);

      const kiai = deduped.find(f => f.name === 'Kiai Shout');
      expect(kiai).toBeDefined();
      expect(kiai?.id).toBe('kiai_shout');
      expect(kiai?.prerequisites).toBe('Cha 13, Base attack bonus +1');
      expect(kiai?.sources).toEqual(expect.arrayContaining(['OA', 'CW']));

      const tunnel = deduped.find(f => f.name === 'Tunnel Fighting');
      expect(tunnel).toBeDefined();
      expect(tunnel?.id).toBe('tunnel_fighting');
      expect(tunnel?.prerequisites).toBe('Base attack bonus +1');
      expect(tunnel?.sources).toEqual(expect.arrayContaining(['PH', 'Ds']));
      expect(tunnel?.description).toContain('squeezing');
    });
  });
});



