import { describe, it, expect } from 'vitest';
import {
  migrateDefenses,
  migrateCompanionsAndWildShape,
  toCanonicalCompanionId,
  normalizeCharacterOnLoad
} from '../../storage/migration';
import { calculateTotalDR, collectDRSources } from '../dr';
import { calculateTotalSR, collectSRSources } from '../sr';
import { computeFamiliarStats } from '../familiars';
import { computeAnimalCompanionStats, inferCompanionAttackDamage } from '../animal_companion';
import { customDataToFormData } from '../wildshape';
import { CharacterSheetData, CharacterState, DREntry, SREntry } from '../../types/character';
import srcCompanions from '../../data/animal_companions.json';
import pubCompanions from '../../../public/data/animal_companions.json';

describe('Phase 4: Defenses and Companions Migration Engine', () => {
  describe('toCanonicalCompanionId', () => {
    it('normalizes companion IDs to canonical snake_case', () => {
      expect(toCanonicalCompanionId('Bat')).toBe('bat');
      expect(toCanonicalCompanionId('Celestial Hawk')).toBe('celestial_hawk');
      expect(toCanonicalCompanionId('Dire Wolf')).toBe('dire_wolf');
      expect(toCanonicalCompanionId('Brown Bear')).toBe('brown_bear');
      expect(toCanonicalCompanionId('custom')).toBe('custom');
      expect(toCanonicalCompanionId('')).toBe('');
      expect(toCanonicalCompanionId(null)).toBe('');
      expect(toCanonicalCompanionId(undefined)).toBe('');
    });
  });

  describe('migrateDefenses', () => {
    it('migrates legacy dr string to structured damageReduction array and purges dr', () => {
      const legacy: any = {
        name: 'Hero',
        player: 'Player',
        alignment: 'LG',
        deity: 'None',
        pointBuyTarget: '32',
        baseStats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        enhancementMods: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
        levelBumps: {},
        selectedRace: 'Human',
        isGestalt: false,
        levelProgression: [{ level: 1, primaryClass: 'barbarian', hpRoll: 12 }],
        skillRanks: {},
        equipment: {
          armor: 'none',
          armorEnhancement: 0,
          shield: 'none',
          shieldEnhancement: 0,
          deflection: 0,
          natural: 0,
          dodge: 0,
          primaryWeapon: 'Greatsword'
        },
        dr: '5/magic'
      };

      const migrated = migrateDefenses(legacy);
      expect(migrated.damageReduction).toBeDefined();
      expect(Array.isArray(migrated.damageReduction)).toBe(true);
      expect(migrated.damageReduction?.length).toBe(1);
      expect(migrated.damageReduction?.[0]).toEqual({
        value: 5,
        bypass: 'Magic',
        abilityType: 'Su'
      });
      expect((migrated as any).dr).toBeUndefined();
    });

    it('migrates legacy damageReduction string with multiple bypasses', () => {
      const legacy: any = {
        name: 'Iron Hero',
        damageReduction: 'DR 10/adamantine, 5/-',
        levelProgression: [{ level: 1, primaryClass: 'fighter', hpRoll: 10 }]
      };

      const migrated = migrateDefenses(legacy);
      expect(migrated.damageReduction?.length).toBe(2);
      expect(migrated.damageReduction?.[0].value).toBe(10);
      expect(migrated.damageReduction?.[0].bypass).toBe('Adamantine');
      expect(migrated.damageReduction?.[1].value).toBe(5);
      expect(migrated.damageReduction?.[1].bypass).toBe('-');
    });

    it('migrates numeric legacy dr to value/-', () => {
      const legacy: any = {
        name: 'Barbarian',
        dr: 3,
        levelProgression: []
      };

      const migrated = migrateDefenses(legacy);
      expect(migrated.damageReduction?.length).toBe(1);
      expect(migrated.damageReduction?.[0]).toEqual({
        value: 3,
        bypass: '-',
        abilityType: 'Ex'
      });
      expect((migrated as any).dr).toBeUndefined();
    });

    it('migrates legacy sr number and sr string to structured spellResistance array and purges sr', () => {
      const legacyNum: any = {
        name: 'Monk',
        sr: 23,
        levelProgression: []
      };
      const migratedNum = migrateDefenses(legacyNum);
      expect(migratedNum.spellResistance).toBeDefined();
      expect(migratedNum.spellResistance?.length).toBe(1);
      expect(migratedNum.spellResistance?.[0]).toEqual({ value: 23 });
      expect((migratedNum as any).sr).toBeUndefined();

      const legacyStr: any = {
        name: 'Drow',
        sr: 'SR 18',
        levelProgression: [{ level: 7, primaryClass: 'rogue', hpRoll: 6 }]
      };
      const migratedStr = migrateDefenses(legacyStr);
      expect(migratedStr.spellResistance?.length).toBe(1);
      expect(migratedStr.spellResistance?.[0]).toEqual({ value: 18 });
      expect((migratedStr as any).sr).toBeUndefined();
    });

    it('preserves existing structured damageReduction and spellResistance arrays', () => {
      const alreadyStructured: any = {
        name: 'Structured Hero',
        damageReduction: [{ value: 10, bypass: 'Magic', abilityType: 'Su' as const, source: 'Spell' }],
        spellResistance: [{ value: 25, source: 'Mantle' }]
      };

      const migrated = migrateDefenses(alreadyStructured);
      expect(migrated.damageReduction).toEqual(alreadyStructured.damageReduction);
      expect(migrated.spellResistance).toEqual(alreadyStructured.spellResistance);
    });

    it('handles None and empty dr/sr safely without producing phantom entries', () => {
      const cleanChar: any = {
        name: 'Clean',
        dr: 'None',
        sr: 0,
        levelProgression: []
      };

      const migrated = migrateDefenses(cleanChar);
      expect(migrated.damageReduction).toEqual([]);
      expect(migrated.spellResistance).toEqual([]);
      expect((migrated as any).dr).toBeUndefined();
      expect((migrated as any).sr).toBeUndefined();
    });
  });

  describe('migrateCompanionsAndWildShape', () => {
    it('modernizes custom familiar flat fields into structured attacks, speed, specialAbilities, and feats', () => {
      const legacyChar: any = {
        name: 'Wizard',
        familiar: {
          hasFamiliar: true,
          selectedFamiliarId: 'Custom',
          customFamiliar: {
            name: 'Shadow Cat',
            size: 'Tiny',
            creatureType: 'Magical Beast',
            str: 3,
            dex: 15,
            con: 10,
            int: 6,
            wis: 12,
            cha: 6,
            naturalArmor: 1,
            speedLand: 30,
            speedClimb: 20,
            attack1Name: 'Claw',
            attack1Damage: '1d2-4',
            attack2Name: 'Bite',
            attack2Damage: '1d3-4',
            specialAbilities: 'Low-light vision; Scent',
            feats: 'Weapon Finesse; Stealthy'
          }
        }
      };

      const migrated = migrateCompanionsAndWildShape(legacyChar);
      const fam = migrated.familiar?.customFamiliar;
      expect(fam).toBeDefined();
      expect(migrated.familiar?.selectedFamiliarId).toBe('custom');
      expect(fam?.attacks).toEqual([
        { name: 'Claw', damage: '1d2-4' },
        { name: 'Bite', damage: '1d3-4' }
      ]);
      expect(fam?.speed).toEqual({
        land: 30,
        climb: 20
      });
      expect(fam?.specialAbilities).toEqual(['Low-light vision', 'Scent']);
      expect(fam?.feats).toEqual(['Weapon Finesse', 'Stealthy']);
      // Flat fields are preserved for backwards compatibility with drafts
      expect(fam?.attack1Name).toBe('Claw');
      expect(fam?.speedLand).toBe(30);
    });

    it('modernizes custom animal companion flat fields into structured attacks, speed, specialAbilities, and feats', () => {
      const legacyChar: any = {
        name: 'Druid',
        animalCompanion: {
          hasCompanion: true,
          selectedCompanionId: 'Dire Wolf',
          customCompanion: {
            name: 'Spirit Wolf',
            minLevel: 1,
            size: 'Medium',
            creatureType: 'Animal',
            hd: 2,
            str: 14,
            dex: 15,
            con: 15,
            int: 2,
            wis: 12,
            cha: 6,
            naturalArmor: 2,
            speedLand: 50,
            attack1Name: 'Bite',
            attack1Damage: '1d6+2',
            specialAbilities: 'Trip; Scent',
            feats: 'Track; Weapon Focus (Bite)',
            isQuadruped: true
          }
        }
      };

      const migrated = migrateCompanionsAndWildShape(legacyChar);
      const comp = migrated.animalCompanion?.customCompanion;
      expect(comp).toBeDefined();
      expect(migrated.animalCompanion?.selectedCompanionId).toBe('dire_wolf');
      expect(comp?.attacks).toEqual([
        { name: 'Bite', damage: '1d6+2' }
      ]);
      expect(comp?.speed).toEqual({ land: 50 });
      expect(comp?.specialAbilities).toEqual(['Trip', 'Scent']);
      expect(comp?.feats).toEqual(['Track', 'Weapon Focus (Bite)']);
      expect(comp?.attack1Name).toBe('Bite');
      expect(comp?.speedLand).toBe(50);
    });

    it('modernizes custom wild shape form flat fields into structured attacks, speed, and specialQualities', () => {
      const legacyChar: any = {
        name: 'Druid',
        wildShape: {
          isActive: true,
          selectedFormId: 'Brown Bear',
          customForm: {
            name: 'Custom War Bear',
            category: 'animal',
            size: 'Large',
            creatureType: 'Animal',
            minDruidLevel: 8,
            str: 27,
            dex: 13,
            con: 19,
            naturalArmor: 5,
            space: 10,
            reach: 5,
            speedLand: 40,
            speedSwim: 20,
            attack1Name: 'Claw',
            attack1Damage: '1d8+8',
            attack1Count: 2,
            attack1IsPrimary: true,
            attack1Special: 'Improved Grab',
            attack2Name: 'Bite',
            attack2Damage: '2d6+4',
            attack2Count: 1,
            attack2IsPrimary: false,
            specialQualities: 'Low-Light Vision; Scent; Ferocity'
          }
        }
      };

      const migrated = migrateCompanionsAndWildShape(legacyChar);
      const ws = migrated.wildShape;
      const form = ws?.customForm;
      expect(ws?.selectedFormId).toBe('brown_bear');
      expect(form).toBeDefined();
      expect(form?.attacks).toEqual([
        {
          name: 'Claw',
          damage: '1d8+8',
          attackCount: 2,
          isPrimary: true,
          strMultiplier: 1.0,
          special: 'Improved Grab'
        },
        {
          name: 'Bite',
          damage: '2d6+4',
          attackCount: 1,
          isPrimary: false,
          strMultiplier: 0.5,
          special: undefined
        }
      ]);
      expect(form?.speed).toEqual({
        land: 40,
        swim: 20
      });
      expect(form?.specialQualities).toEqual(['Low-Light Vision', 'Scent', 'Ferocity']);
      expect(form?.attack1Name).toBe('Claw');
      expect(form?.speedLand).toBe(40);
    });
  });

  describe('normalizeCharacterOnLoad integration and idempotency', () => {
    it('normalizes legacy defenses and companion structures on load', () => {
      const rawLegacy = {
        id: 'char-123',
        updatedAt: 1234567890,
        name: 'Archmage',
        player: 'Player',
        alignment: 'TN',
        deity: 'Boccob',
        pointBuyTarget: '32',
        baseStats: { str: 10, dex: 14, con: 14, int: 18, wis: 12, cha: 8 },
        enhancementMods: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
        levelBumps: {},
        selectedRace: 'Human',
        isGestalt: false,
        levelProgression: [{ level: 1, primaryClass: 'Wizard', hpRoll: 4 }],
        skillRanks: {},
        equipment: {
          armor: 'none',
          armorEnhancement: 0,
          shield: 'none',
          shieldEnhancement: 0,
          deflection: 0,
          natural: 0,
          dodge: 0,
          primaryWeapon: 'Dagger'
        },
        dr: '10/magic',
        sr: 21,
        familiar: {
          hasFamiliar: true,
          selectedFamiliarId: 'Bat',
          customFamiliar: {
            name: 'My Bat',
            size: 'Diminutive',
            creatureType: 'Animal',
            str: 1,
            dex: 15,
            con: 10,
            int: 2,
            wis: 14,
            cha: 4,
            naturalArmor: 0,
            speedLand: 5,
            speedFly: 40,
            attack1Name: 'Bite',
            attack1Damage: '1',
            specialAbilities: 'Blindsight 20 ft.; Low-light vision',
            feats: 'Weapon Finesse'
          }
        }
      };

      const normalized = normalizeCharacterOnLoad(rawLegacy);

      // Defenses normalized
      expect(normalized.damageReduction).toEqual([
        { value: 10, bypass: 'Magic', abilityType: 'Su' }
      ]);
      expect(normalized.spellResistance).toEqual([{ value: 21 }]);
      expect((normalized as any).dr).toBeUndefined();
      expect((normalized as any).sr).toBeUndefined();

      // Companion normalized
      expect(normalized.familiar?.selectedFamiliarId).toBe('bat');
      expect(normalized.familiar?.customFamiliar?.attacks).toEqual([
        { name: 'Bite', damage: '1' }
      ]);
      expect(normalized.familiar?.customFamiliar?.specialAbilities).toEqual([
        'Blindsight 20 ft.',
        'Low-light vision'
      ]);
    });

    it('is strictly idempotent on repeated normalizations', () => {
      const rawLegacy = {
        id: 'char-idempotent',
        updatedAt: 1234567890,
        name: 'Idempotent Test',
        player: 'Player',
        alignment: 'NG',
        deity: 'Ehlonna',
        pointBuyTarget: '32',
        baseStats: { str: 14, dex: 14, con: 14, int: 10, wis: 14, cha: 10 },
        enhancementMods: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
        levelBumps: {},
        selectedRace: 'Human',
        isGestalt: false,
        levelProgression: [{ level: 1, primaryClass: 'ranger', hpRoll: 8 }],
        skillRanks: {},
        equipment: {
          armor: 'none',
          armorEnhancement: 0,
          shield: 'none',
          shieldEnhancement: 0,
          deflection: 0,
          natural: 0,
          dodge: 0,
          primaryWeapon: 'Longbow'
        },
        dr: '5/-',
        sr: 15,
        animalCompanion: {
          hasCompanion: true,
          selectedCompanionId: 'Badger',
          customCompanion: {
            name: 'Honey Badger',
            minLevel: 1,
            size: 'Small',
            creatureType: 'Animal',
            hd: 1,
            str: 8,
            dex: 17,
            con: 15,
            int: 2,
            wis: 12,
            cha: 6,
            naturalArmor: 1,
            speedLand: 30,
            attack1Name: 'Claw',
            attack1Damage: '1d2-1',
            specialAbilities: 'Rage; Scent',
            feats: 'Weapon Finesse'
          }
        }
      };

      const pass1 = normalizeCharacterOnLoad(rawLegacy);
      const pass2 = normalizeCharacterOnLoad(pass1);

      expect(pass1.damageReduction).toEqual(pass2.damageReduction);
      expect(pass1.spellResistance).toEqual(pass2.spellResistance);
      expect(pass1.animalCompanion).toEqual(pass2.animalCompanion);
      expect(pass2.damageReduction?.length).toBe(1);
      expect(pass2.spellResistance?.length).toBe(1);
      expect((pass2 as any).dr).toBeUndefined();
      expect((pass2 as any).sr).toBeUndefined();
    });
  });

  describe('Engine calculations with structured defenses & companions', () => {
    it('DR engine collects custom DR entries from character.damageReduction and includes them in calculations', () => {
      const char: Partial<CharacterState> = {
        name: 'Tough Guy',
        levelProgression: [{ level: 1, primaryClass: 'fighter', hpRoll: 10 }],
        equipment: {
          armor: 'none',
          armorEnhancement: 0,
          shield: 'none',
          shieldEnhancement: 0,
          deflection: 0,
          natural: 0,
          dodge: 0,
          primaryWeapon: 'Fist'
        },
        damageReduction: [
          { value: 5, bypass: 'Magic', abilityType: 'Su', source: 'Custom Ring' },
          { value: 2, bypass: '-', abilityType: 'Ex', stacks: true, source: 'Custom Feat' }
        ]
      };

      const sources = collectDRSources(char as CharacterState);
      const customSources = sources.filter(s => s.category === 'custom');
      expect(customSources.length).toBe(2);
      expect(customSources[0].name).toBe('Custom Ring');
      expect(customSources[0].value).toBe(5);
      expect(customSources[0].bypass).toBe('Magic');
      expect(customSources[1].name).toBe('Custom Feat');
      expect(customSources[1].stacks).toBe(true);

      const totalDR = calculateTotalDR(char as CharacterState);
      expect(totalDR.hasDR).toBe(true);
      expect(totalDR.baselineStackingDR).toBe(2);
      // Magic DR is 5 non-stacking + 2 baseline stacking = 7/Magic
      expect(totalDR.bestDRString).toContain('7/Magic');
    });

    it('SR engine collects custom SR entries from character.spellResistance and computes best SR', () => {
      const char: Partial<CharacterState> = {
        name: 'Resistant Hero',
        levelProgression: [{ level: 1, primaryClass: 'rogue', hpRoll: 6 }],
        spellResistance: [
          { value: 18, source: 'Custom Cloak' },
          { value: 2, stacks: true, source: 'Custom Boon' }
        ]
      };

      const sources = collectSRSources(char as CharacterState);
      const customSources = sources.filter(s => s.category === 'custom');
      expect(customSources.length).toBe(2);
      expect(customSources[0].name).toBe('Custom Cloak');
      expect(customSources[0].value).toBe(18);

      const summary = calculateTotalSR(char as CharacterState);
      expect(summary.hasSR).toBe(true);
      expect(summary.baseSR).toBe(18);
      expect(summary.bonusSR).toBe(2);
      expect(summary.bestSR).toBe(20);
      expect(summary.bestSRString).toBe('SR 20');
    });

    it('computeFamiliarStats reads structured properties directly from customFamiliar', () => {
      const char: Partial<CharacterState> = {
        name: 'Mage',
        baseStats: { str: 10, dex: 10, con: 12, int: 16, wis: 10, cha: 10 },
        levelProgression: [{ level: 1, primaryClass: 'wizard', hpRoll: 4 }]
      };

      const familiarState = {
        hasFamiliar: true,
        selectedFamiliarId: 'custom',
        customFamiliar: {
          name: 'Arcane Sprite',
          size: 'Diminutive',
          creatureType: 'Fey',
          str: 3,
          dex: 18,
          con: 10,
          int: 10,
          wis: 14,
          cha: 14,
          naturalArmor: 2,
          speed: { land: 10, fly: 60, flyManeuverability: 'perfect' },
          attacks: [{ name: 'Sting', damage: '1d2-4' }],
          specialAbilities: ['Invisibility', 'Spell Resistance'],
          feats: ['Weapon Finesse', 'Dodge']
        }
      };

      const stats = computeFamiliarStats(char as CharacterState, [], [], familiarState as any);
      expect(stats).toBeDefined();
      expect(stats?.name).toBe('Arcane Sprite');
      expect(stats?.size).toBe('Diminutive');
      expect(stats?.speed).toEqual({ land: 10, fly: 60, flyManeuverability: 'perfect' });
      expect(stats?.attacks.length).toBe(1);
      expect(stats?.attacks[0].name).toBe('Sting');
      expect(stats?.specialAbilities).toContain('Invisibility');
      expect(stats?.feats).toContain('Weapon Finesse');
    });

    it('computeAnimalCompanionStats reads structured properties directly from customCompanion', () => {
      const char: Partial<CharacterState> = {
        name: 'Beastmaster',
        baseStats: { str: 14, dex: 14, con: 14, int: 10, wis: 14, cha: 10 },
        levelProgression: [{ level: 3, primaryClass: 'druid', hpRoll: 8 }]
      };

      const companionState = {
        hasCompanion: true,
        selectedCompanionId: 'custom',
        customCompanion: {
          name: 'Panther',
          minLevel: 1,
          size: 'Medium',
          creatureType: 'Animal',
          hd: 3,
          str: 16,
          dex: 17,
          con: 15,
          int: 2,
          wis: 12,
          cha: 6,
          naturalArmor: 3,
          speed: { land: 40, climb: 20 },
          attacks: [
            { name: 'Bite', damage: '1d6+3' },
            { name: 'Claw', damage: '1d3+1' }
          ],
          specialAbilities: ['Pounce', 'Rake'],
          feats: ['Alertness', 'Weapon Finesse'],
          isQuadruped: true
        }
      };

      const stats = computeAnimalCompanionStats(char as CharacterState, [], companionState as any);
      expect(stats).toBeDefined();
      expect(stats?.name).toBe('Panther');
      expect(stats?.speed).toEqual({ land: 40, climb: 20 });
      expect(stats?.attacks.length).toBe(2);
      expect(stats?.specialAbilities).toContain('Pounce');
      expect(stats?.feats).toContain('Weapon Finesse');
    });

    it('customDataToFormData reads structured properties directly from customForm', () => {
      const customForm = {
        name: 'Custom Chimera',
        category: 'magical_beast',
        size: 'Large',
        creatureType: 'Magical Beast',
        minDruidLevel: 10,
        str: 19,
        dex: 12,
        con: 17,
        naturalArmor: 6,
        space: 10,
        reach: 5,
        speed: { land: 30, fly: 50 },
        attacks: [
          { name: 'Bite', damage: '2d6+4', attackCount: 1, isPrimary: true, strMultiplier: 1.0 },
          { name: 'Claws', damage: '1d6+2', attackCount: 2, isPrimary: false, strMultiplier: 0.5 },
          { name: 'Gore', damage: '1d8+2', attackCount: 1, isPrimary: false, strMultiplier: 0.5 }
        ],
        specialQualities: ['Breath Weapon', 'Scent', 'Darkvision 60 ft.']
      };

      const formData = customDataToFormData(customForm);
      expect(formData.id).toBe('custom');
      expect(formData.name).toBe('Custom Chimera');
      expect(formData.speed).toEqual({ land: 30, fly: 50 });
      expect(formData.attacks.length).toBe(3);
      expect(formData.attacks[0].name).toBe('Bite');
      expect(formData.attacks[1].attackCount).toBe(2);
      expect(formData.specialQualities).toEqual(['Breath Weapon', 'Scent', 'Darkvision 60 ft.']);
    });
  });

  describe('Phase 4 Sanitation & Polish: DR labels and Animal Companions', () => {
    it('prevents duplicate DR and SR source suffixes when source already includes them', () => {
      const drSourceWithSuffix = { name: 'Adamantine Armor (3/-)', value: 3, bypass: '-' };
      const drSourceWithoutSuffix = { name: 'Racial (Earth Elemental)', value: 5, bypass: '-' };

      const formatDRSource = (s: { name: string; value: number; bypass: string }) =>
        s.name.includes(`(${s.value}/${s.bypass})`) || s.name.includes(`/${s.bypass}`)
          ? s.name
          : `${s.name} (${s.value}/${s.bypass})`;

      expect(formatDRSource(drSourceWithSuffix)).toBe('Adamantine Armor (3/-)');
      expect(formatDRSource(drSourceWithoutSuffix)).toBe('Racial (Earth Elemental) (5/-)');

      const srSourceWithSuffix = { name: 'Robe of the Archmagi (SR 18)', value: 18 };
      const srSourceWithParen = { name: 'Armor Quality: Spell Resistance (13)', value: 13 };
      const srSourceWithoutSuffix = { name: 'Mantle of Spell Resistance', value: 21 };

      const formatSRSource = (s: { name: string; value: number }) =>
        s.name.includes(`SR ${s.value}`) || s.name.includes(`(${s.value})`)
          ? s.name
          : `${s.name} (SR ${s.value})`;

      expect(formatSRSource(srSourceWithSuffix)).toBe('Robe of the Archmagi (SR 18)');
      expect(formatSRSource(srSourceWithParen)).toBe('Armor Quality: Spell Resistance (13)');
      expect(formatSRSource(srSourceWithoutSuffix)).toBe('Mantle of Spell Resistance (SR 21)');
    });

    it('sanitizes animal_companions.json attack records and populates canonical MM damage', () => {
      expect(srcCompanions).toEqual(pubCompanions);

      // Verify no formula artifacts remain in any attack name across all records
      for (const comp of (srcCompanions as any[])) {
        for (const atk of comp.attacks || []) {
          expect(atk.name).not.toMatch(/[\+\-]\d+/);
          expect(atk.name).not.toMatch(/[;:]$/);
          expect(atk.damage).not.toBe('');
        }
      }

      // Check canonical examples from user requirements
      const byId = Object.fromEntries((srcCompanions as any[]).map((c: any) => [c.id, c]));

      expect(byId['wolf'].attacks).toEqual([{ name: 'Bite', damage: '1d6' }]);
      expect(byId['baboon'].attacks).toEqual([{ name: 'Bite', damage: '1d6' }]);
      expect(byId['badger'].attacks).toEqual([
        { name: '2 Claws', damage: '1d2' },
        { name: 'Bite', damage: '1d3' }
      ]);
      expect(byId['dire_rat'].attacks).toEqual([{ name: 'Bite', damage: '1d4' }]);
      expect(byId['dog'].attacks).toEqual([{ name: 'Bite', damage: '1d4' }]);
      expect(byId['dog_riding'].attacks).toEqual([{ name: 'Bite', damage: '1d6' }]);
      expect(byId['eagle'].attacks).toEqual([
        { name: 'Talons', damage: '1d4' },
        { name: 'Bite', damage: '1d4' }
      ]);
      expect(byId['hawk'].attacks).toEqual([{ name: 'Talons', damage: '1d4' }]);
      expect(byId['owl'].attacks).toEqual([{ name: 'Talons', damage: '1d4' }]);
      expect(byId['pony'].attacks).toEqual([{ name: '2 Hooves', damage: '1d3' }]);
      expect(byId['porpoise'].attacks).toEqual([{ name: 'Slam', damage: '2d4' }]);
      expect(byId['shark_medium'].attacks).toEqual([{ name: 'Bite', damage: '1d6' }]);
      expect(byId['snake_medium_viper'].attacks).toEqual([{ name: 'Bite', damage: '1d4' }]);
      expect(byId['snake_small_viper'].attacks).toEqual([{ name: 'Bite', damage: '1d2' }]);
      expect(byId['stirge'].attacks).toEqual([{ name: 'Touch', damage: 'attach' }]);
      expect(byId['bear_black'].attacks).toEqual([
        { name: '2 Claws', damage: '1d4' },
        { name: 'Bite', damage: '1d6' }
      ]);
      expect(byId['lion'].attacks).toEqual([
        { name: '2 Claws', damage: '1d4' },
        { name: 'Bite', damage: '1d8' },
        { name: 'Rake', damage: '1d4' }
      ]);
      expect(byId['bear_brown'].attacks).toEqual([
        { name: '2 Claws', damage: '1d8' },
        { name: 'Bite', damage: '2d6' }
      ]);
    });

    it('inferCompanionAttackDamage infers damage based on attack type and size', () => {
      expect(inferCompanionAttackDamage('Bite', 'Medium')).toBe('1d6');
      expect(inferCompanionAttackDamage('Bite', 'Small')).toBe('1d4');
      expect(inferCompanionAttackDamage('Bite', 'Large')).toBe('1d8');
      expect(inferCompanionAttackDamage('2 Claws', 'Small')).toBe('1d3');
      expect(inferCompanionAttackDamage('2 Claws', 'Medium')).toBe('1d4');
      expect(inferCompanionAttackDamage('2 Claws', 'Large')).toBe('1d6');
      expect(inferCompanionAttackDamage('Slam', 'Medium')).toBe('1d4');
      expect(inferCompanionAttackDamage('Gore', 'Large')).toBe('1d8');
      expect(inferCompanionAttackDamage('Touch', 'Tiny')).toBe('attach');
    });

    it('computeAnimalCompanionStats cleans formula artifacts and infers missing damage dynamically', () => {
      const char: Partial<CharacterState> = {
        name: 'Ranger',
        baseStats: { str: 14, dex: 14, con: 14, int: 10, wis: 14, cha: 10 },
        levelProgression: [{ level: 4, primaryClass: 'druid', hpRoll: 8 }]
      };

      const companionWithArtifacts = {
        hasCompanion: true,
        selectedCompanionId: 'custom',
        customCompanion: {
          name: 'Dirty Stat Companion',
          minLevel: 1,
          size: 'Medium',
          creatureType: 'Animal',
          hd: 2,
          str: 14,
          dex: 14,
          con: 14,
          int: 2,
          wis: 12,
          cha: 6,
          naturalArmor: 2,
          attacks: [
            { name: 'Bite+5+0+2', damage: '' },
            { name: '2 Claws;:', damage: '' }
          ]
        }
      };

      const stats = computeAnimalCompanionStats(char as CharacterState, [], companionWithArtifacts as any);
      expect(stats).toBeDefined();
      expect(stats?.attacks).toEqual([
        { name: 'Bite', damage: '1d6', attackBonus: 3 },
        { name: '2 Claws', damage: '1d4', attackBonus: 3 }
      ]);
    });
  });
});
