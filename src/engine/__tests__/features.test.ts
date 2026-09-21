import { describe, it, expect } from 'vitest';
import { hasRacialTrait, hasSubtype, hasClassFeature } from '../features';
import { calculateTotalFeatSlots, calculateTotalSpeed } from '../stats';
import { calculateTotalSkillPoints } from '../skills';
import { calculateGrappleModifier } from '../combat';
import { evaluateFeatPrerequisites, compilePrerequisiteClause } from '../featPrereqs';
import { CharacterState, RaceData, ClassData, FeatData } from '../../types/character';

describe('Engine Query Helpers: features.ts', () => {
  const MOCK_HUMAN: RaceData = {
    id: 'human',
    name: 'Human',
    size: 'Medium',
    type: 'Humanoid',
    subtype: 'Human',
    subtypes: ['human', 'humanoid'],
    traits: ['bonus_feat', 'bonus_skill_points'],
    speed: { land: 30 }
  };

  const MOCK_STRONGHEART: RaceData = {
    id: 'halfling,_strongheart',
    name: 'Halfling, Strongheart',
    size: 'Small',
    type: 'Humanoid',
    subtype: 'Halfling',
    subtypes: ['halfling', 'humanoid'],
    traits: ['bonus_feat'],
    speed: { land: 20 }
  };

  const MOCK_DWARF: RaceData = {
    id: 'dwarf,_hill',
    name: 'Dwarf, Hill',
    size: 'Medium',
    type: 'Humanoid',
    subtype: 'Dwarf',
    subtypes: ['dwarf', 'humanoid'],
    traits: ['stability', 'dwarf_speed', 'darkvision'],
    speed: { land: 20 }
  };

  const MOCK_GOLIATH: RaceData = {
    id: 'goliath',
    name: 'Goliath',
    size: 'Medium',
    type: 'Humanoid',
    subtype: 'Goliath',
    subtypes: ['humanoid'],
    traits: ['powerful_build'],
    speed: { land: 30 }
  };

  const MOCK_KOBOLD: RaceData = {
    id: 'kobold',
    name: 'Kobold',
    size: 'Small',
    type: 'Humanoid',
    subtype: 'Dragonblood, Reptilian',
    subtypes: ['dragonblood', 'humanoid', 'reptilian'],
    traits: ['darkvision'],
    speed: { land: 30 }
  };

  const MOCK_CHANGELING: RaceData = {
    id: 'changeling',
    name: 'Changeling',
    size: 'Medium',
    type: 'Humanoid',
    subtype: 'Shapechanger',
    subtypes: ['humanoid', 'shapechanger'],
    traits: [],
    speed: { land: 30 }
  };

  const MOCK_CLASSES: ClassData[] = [
    {
      id: 'barbarian',
      name: 'Barbarian',
      abbr: 'Bbn',
      maxLevels: 20,
      hitDie: 12,
      skillPoints: 4,
      babFactor: 1,
      fortFactor: 0.5,
      refFactor: 0.34,
      willFactor: 0.34,
      proficiencies: { lightArmor: true, mediumArmor: true, heavyArmor: false, shield: true, towerShield: false, simpleWeapons: true, martialWeapons: true },
      classSkills: ['Climb', 'Jump', 'Survival'],
      features: ['rage', 'fast_movement', 'uncanny_dodge', 'improved_uncanny_dodge']
    },
    {
      id: 'cleric',
      name: 'Cleric',
      abbr: 'Clr',
      maxLevels: 20,
      hitDie: 8,
      skillPoints: 2,
      babFactor: 0.75,
      fortFactor: 0.5,
      refFactor: 0.34,
      willFactor: 0.5,
      proficiencies: { lightArmor: true, mediumArmor: true, heavyArmor: true, shield: true, towerShield: false, simpleWeapons: true, martialWeapons: false },
      classSkills: ['Concentration', 'Heal'],
      features: ['turn_undead']
    },
    {
      id: 'paladin',
      name: 'Paladin',
      abbr: 'Pal',
      maxLevels: 20,
      hitDie: 10,
      skillPoints: 2,
      babFactor: 1,
      fortFactor: 0.5,
      refFactor: 0.34,
      willFactor: 0.34,
      proficiencies: { lightArmor: true, mediumArmor: true, heavyArmor: true, shield: true, towerShield: false, simpleWeapons: true, martialWeapons: true },
      classSkills: ['Diplomacy', 'Heal', 'Ride'],
      features: ['smite_evil', 'lay_on_hands', 'turn_undead']
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
      proficiencies: { lightArmor: true, mediumArmor: false, heavyArmor: false, shield: false, towerShield: false, simpleWeapons: true, martialWeapons: false },
      classSkills: ['Appraise', 'Hide', 'Move Silently', 'Search', 'Spot'],
      features: ['sneak_attack', 'evasion', 'uncanny_dodge', 'improved_uncanny_dodge']
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
      proficiencies: { lightArmor: true, mediumArmor: true, heavyArmor: false, shield: true, towerShield: false, simpleWeapons: true, martialWeapons: false },
      classSkills: ['Concentration', 'Survival'],
      features: ['animal_companion', 'wild_shape']
    },
    {
      id: 'ranger',
      name: 'Ranger',
      abbr: 'Rgr',
      maxLevels: 20,
      hitDie: 8,
      skillPoints: 6,
      babFactor: 1,
      fortFactor: 0.5,
      refFactor: 0.5,
      willFactor: 0.34,
      proficiencies: { lightArmor: true, mediumArmor: false, heavyArmor: false, shield: true, towerShield: false, simpleWeapons: true, martialWeapons: true },
      classSkills: ['Hide', 'Listen', 'Move Silently', 'Spot', 'Survival'],
      features: ['animal_companion']
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
      proficiencies: { lightArmor: false, mediumArmor: false, heavyArmor: false, shield: false, towerShield: false, simpleWeapons: false, martialWeapons: false },
      classSkills: ['Concentration', 'Spellcraft'],
      features: ['familiar']
    }
  ];

  const createBaseCharacter = (overrides?: Partial<CharacterState>): CharacterState => ({
    name: 'Hero',
    player: 'Player',
    alignment: 'True Neutral',
    deity: '',
    pointBuyTarget: '32',
    baseStats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
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
    },
    ...overrides
  });

  describe('hasRacialTrait', () => {
    it('correctly identifies bonus_feat on Human and Strongheart Halfling', () => {
      expect(hasRacialTrait(MOCK_HUMAN, 'bonus_feat')).toBe(true);
      expect(hasRacialTrait(MOCK_STRONGHEART, 'bonus_feat')).toBe(true);
      expect(hasRacialTrait(MOCK_DWARF, 'bonus_feat')).toBe(false);
      expect(hasRacialTrait('Human', 'bonus_feat')).toBe(true);
      expect(hasRacialTrait('Halfling, Strongheart', 'bonus_feat')).toBe(true);
      expect(hasRacialTrait('Dwarf, Hill', 'bonus_feat')).toBe(false);
    });

    it('correctly distinguishes bonus_skill_points (Human yes, Strongheart Halfling no)', () => {
      expect(hasRacialTrait(MOCK_HUMAN, 'bonus_skill_points')).toBe(true);
      expect(hasRacialTrait(MOCK_STRONGHEART, 'bonus_skill_points')).toBe(false);
      expect(hasRacialTrait(MOCK_DWARF, 'bonus_skill_points')).toBe(false);
      expect(hasRacialTrait('Human', 'bonus_skill_points')).toBe(true);
      expect(hasRacialTrait('Halfling, Strongheart', 'bonus_skill_points')).toBe(false);
    });

    it('identifies stability and dwarf_speed on Dwarves', () => {
      expect(hasRacialTrait(MOCK_DWARF, 'stability')).toBe(true);
      expect(hasRacialTrait(MOCK_DWARF, 'dwarf_speed')).toBe(true);
      expect(hasRacialTrait(MOCK_HUMAN, 'stability')).toBe(false);
      expect(hasRacialTrait(MOCK_HUMAN, 'dwarf_speed')).toBe(false);
      expect(hasRacialTrait('Dwarf', 'stability')).toBe(true);
      expect(hasRacialTrait('Dwarf', 'dwarf_speed')).toBe(true);
    });

    it('identifies powerful_build on Goliath and Half-Giant', () => {
      expect(hasRacialTrait(MOCK_GOLIATH, 'powerful_build')).toBe(true);
      expect(hasRacialTrait('Goliath', 'powerful_build')).toBe(true);
      expect(hasRacialTrait('Half-Giant', 'powerful_build')).toBe(true);
      expect(hasRacialTrait(MOCK_HUMAN, 'powerful_build')).toBe(false);
    });

    it('handles custom traits on RaceData objects', () => {
      const customRace: RaceData = {
        id: 'custom',
        name: 'Custom',
        traits: ['sunlight_sensitivity', 'telepathy']
      };
      expect(hasRacialTrait(customRace, 'sunlight_sensitivity')).toBe(true);
      expect(hasRacialTrait(customRace, 'telepathy')).toBe(true);
      expect(hasRacialTrait(customRace, 'bonus_feat')).toBe(false);
    });
  });

  describe('hasSubtype', () => {
    it('detects dragonblood subtype on Kobolds and dragon races', () => {
      expect(hasSubtype(MOCK_KOBOLD, 'dragonblood')).toBe(true);
      expect(hasSubtype(MOCK_KOBOLD, 'reptilian')).toBe(true);
      expect(hasSubtype('Kobold', 'dragonblood')).toBe(true);
      expect(hasSubtype('Spellscale', 'dragonblood')).toBe(true);
      expect(hasSubtype(MOCK_HUMAN, 'dragonblood')).toBe(false);
    });

    it('detects shapechanger subtype on Changelings and Shifters', () => {
      expect(hasSubtype(MOCK_CHANGELING, 'shapechanger')).toBe(true);
      expect(hasSubtype('Changeling', 'shapechanger')).toBe(true);
      expect(hasSubtype('Shifter', 'shapechanger')).toBe(true);
      expect(hasSubtype(MOCK_HUMAN, 'shapechanger')).toBe(false);
    });

    it('detects race-specific subtypes: dwarf, elf, orc, goblinoid', () => {
      expect(hasSubtype(MOCK_DWARF, 'dwarf')).toBe(true);
      expect(hasSubtype('Elf', 'elf')).toBe(true);
      expect(hasSubtype('Half-Orc', 'orc')).toBe(true);
      expect(hasSubtype('Goblin', 'goblinoid')).toBe(true);
      expect(hasSubtype('Hobgoblin', 'goblinoid')).toBe(true);
    });
  });

  describe('hasClassFeature', () => {
    it('detects 1st level features (rage, sneak_attack, familiar)', () => {
      const barb = createBaseCharacter({ levelProgression: [{ level: 1, primaryClass: 'Barbarian', hpRoll: 12 }] });
      expect(hasClassFeature(barb, 'rage')).toBe(true);
      expect(hasClassFeature(barb, 'fast_movement')).toBe(true);
      expect(hasClassFeature(barb, 'sneak_attack')).toBe(false);

      const rogue = createBaseCharacter({ levelProgression: [{ level: 1, primaryClass: 'Rogue', hpRoll: 6 }] });
      expect(hasClassFeature(rogue, 'sneak_attack')).toBe(true);
      expect(hasClassFeature(rogue, 'evasion')).toBe(false); // Evasion requires lvl 2

      const wiz = createBaseCharacter({ levelProgression: [{ level: 1, primaryClass: 'Wizard', hpRoll: 4 }] });
      expect(hasClassFeature(wiz, 'familiar')).toBe(true);
    });

    it('enforces level requirements for Paladin turn undead (lvl 4)', () => {
      const paladin1 = createBaseCharacter({ levelProgression: [{ level: 1, primaryClass: 'Paladin', hpRoll: 10 }] });
      expect(hasClassFeature(paladin1, 'smite_evil')).toBe(true);
      expect(hasClassFeature(paladin1, 'turn_undead')).toBe(false);

      const paladin4 = createBaseCharacter({
        levelProgression: [
          { level: 1, primaryClass: 'Paladin', hpRoll: 10 },
          { level: 2, primaryClass: 'Paladin', hpRoll: 10 },
          { level: 3, primaryClass: 'Paladin', hpRoll: 10 },
          { level: 4, primaryClass: 'Paladin', hpRoll: 10 }
        ]
      });
      expect(hasClassFeature(paladin4, 'turn_undead')).toBe(true);
    });

    it('enforces level requirements for Druid wild shape (lvl 5)', () => {
      const druid1 = createBaseCharacter({ levelProgression: [{ level: 1, primaryClass: 'Druid', hpRoll: 8 }] });
      expect(hasClassFeature(druid1, 'animal_companion')).toBe(true);
      expect(hasClassFeature(druid1, 'wild_shape')).toBe(false);

      const druid5 = createBaseCharacter({
        levelProgression: Array(5).fill(null).map((_, i) => ({ level: i + 1, primaryClass: 'Druid', hpRoll: 8 }))
      });
      expect(hasClassFeature(druid5, 'wild_shape')).toBe(true);
    });

    it('enforces level requirements for Ranger animal companion (lvl 4)', () => {
      const ranger1 = createBaseCharacter({ levelProgression: [{ level: 1, primaryClass: 'Ranger', hpRoll: 8 }] });
      expect(hasClassFeature(ranger1, 'animal_companion')).toBe(false);

      const ranger4 = createBaseCharacter({
        levelProgression: Array(4).fill(null).map((_, i) => ({ level: i + 1, primaryClass: 'Ranger', hpRoll: 8 }))
      });
      expect(hasClassFeature(ranger4, 'animal_companion')).toBe(true);
    });

    it('respects active state overrides for familiar, companion, and wild shape', () => {
      const fighter = createBaseCharacter({
        levelProgression: [{ level: 1, primaryClass: 'Fighter', hpRoll: 10 }],
        wildShape: { isActive: true, selectedFormId: 'wolf' },
        familiar: { hasFamiliar: true, selectedFamiliarId: 'bat' },
        animalCompanion: { hasCompanion: true, selectedCompanionId: 'wolf' }
      });
      expect(hasClassFeature(fighter, 'wild_shape')).toBe(true);
      expect(hasClassFeature(fighter, 'familiar')).toBe(true);
      expect(hasClassFeature(fighter, 'animal_companion')).toBe(true);
    });
  });

  describe('Integration with engine calculations', () => {
    it('calculateTotalFeatSlots awards bonus feat to races with bonus_feat trait', () => {
      const humanChar = createBaseCharacter({ selectedRace: 'Human' });
      const humanSlots = calculateTotalFeatSlots(humanChar, MOCK_CLASSES, [MOCK_HUMAN]);
      expect(humanSlots.racialBonus).toBe(1);

      const strongheartChar = createBaseCharacter({ selectedRace: 'Halfling, Strongheart' });
      const strongheartSlots = calculateTotalFeatSlots(strongheartChar, MOCK_CLASSES, [MOCK_STRONGHEART]);
      expect(strongheartSlots.racialBonus).toBe(1);

      const dwarfChar = createBaseCharacter({ selectedRace: 'Dwarf, Hill' });
      const dwarfSlots = calculateTotalFeatSlots(dwarfChar, MOCK_CLASSES, [MOCK_DWARF]);
      expect(dwarfSlots.racialBonus).toBe(0);
    });

    it('calculateTotalSkillPoints awards bonus skill points to Human but not Strongheart Halfling', () => {
      // 1st level Fighter (2 skill points per level), Int 10 (+0 mod)
      // Human: (2 + 0 + 1) * 4 = 12
      const humanPts = calculateTotalSkillPoints([{ level: 1, primaryClass: 'Fighter', hpRoll: 10 }], MOCK_CLASSES, 0, MOCK_HUMAN);
      expect(humanPts).toBe(12);

      // Strongheart: (2 + 0) * 4 = 8
      const strongheartPts = calculateTotalSkillPoints([{ level: 1, primaryClass: 'Fighter', hpRoll: 10 }], MOCK_CLASSES, 0, MOCK_STRONGHEART);
      expect(strongheartPts).toBe(8);

      // Dwarf: (2 + 0) * 4 = 8
      const dwarfPts = calculateTotalSkillPoints([{ level: 1, primaryClass: 'Fighter', hpRoll: 10 }], MOCK_CLASSES, 0, MOCK_DWARF);
      expect(dwarfPts).toBe(8);
    });

    it('calculateGrappleModifier applies Powerful Build bonus to Goliath', () => {
      const goliathChar = createBaseCharacter({ selectedRace: 'Goliath' });
      const goliathGrapple = calculateGrappleModifier(goliathChar, 1, 0, MOCK_GOLIATH);
      expect(goliathGrapple.sizeMod).toBe(4);
      expect(goliathGrapple.notes).toContain('Powerful Build (+4)');

      const humanChar = createBaseCharacter({ selectedRace: 'Human' });
      const humanGrapple = calculateGrappleModifier(humanChar, 1, 0, MOCK_HUMAN);
      expect(humanGrapple.sizeMod).toBe(0);
    });

    it('evaluateFeatPrerequisites qualifies dragonblood feats with Kobold or Silverbrow Human', () => {
      const dragonFeat: FeatData = {
        id: 'draconic_heritage',
        name: 'Draconic Heritage',
        prerequisites: 'dragonblood subtype',
        description: 'Requires dragonblood subtype'
      };

      const koboldChar = createBaseCharacter({ selectedRace: 'Kobold' });
      const koboldEval = evaluateFeatPrerequisites(dragonFeat, koboldChar, MOCK_CLASSES, [MOCK_KOBOLD]);
      expect(koboldEval.isQualified).toBe(true);

      const dwarfChar = createBaseCharacter({ selectedRace: 'Dwarf, Hill' });
      const dwarfEval = evaluateFeatPrerequisites(dragonFeat, dwarfChar, MOCK_CLASSES, [MOCK_DWARF]);
      expect(dwarfEval.isQualified).toBe(false);
    });
  });
});
