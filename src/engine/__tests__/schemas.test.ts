import { describe, it, expect } from 'vitest';
import { safeValidateCharacter, safeValidateRosterPackage } from '../../types/schemas';
import { normalizeCharacterOnLoad } from '../../storage/migration';
import { importCharacterJSON, importRosterPackage, getCharacter } from '../../storage/characterStore';
import { CharacterSheetData } from '../../types/character';

describe('Zod Schema Validation & Legacy Migration Preservation (Phase 5A)', () => {
  const validModernCharacter: CharacterSheetData = {
    id: 'char_valid_123',
    updatedAt: 1700000000000,
    name: 'Valerius Modern',
    player: 'Shadow',
    alignment: 'Neutral Good',
    deity: 'Pelor',
    pointBuyTarget: '32',
    selectedRace: 'Human',
    isGestalt: false,
    baseStats: { str: 16, dex: 12, con: 14, int: 10, wis: 14, cha: 10 },
    enhancementMods: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    levelBumps: {},
    levelProgression: [
      { level: 1, primaryClass: 'paladin', hpRoll: 10 },
      { level: 2, primaryClass: 'paladin', hpRoll: 6 }
    ],
    skillRanks: { diplomacy: 4 },
    selectedFeatEntities: [
      { id: 'feat_pa', featId: 'power_attack', notes: 'Power Attack' }
    ],
    equipment: {
      armor: 'chainshirt',
      armorEnhancement: 1,
      shield: 'heavy_shield',
      shieldEnhancement: 1,
      deflection: 0,
      natural: 0,
      dodge: 0,
      primaryWeapon: 'longsword'
    },
    inventory: [
      { id: 'inv_1', name: 'Longsword', quantity: 1, weight: 4, itemType: 'weapon' }
    ]
  };

  it('should successfully validate a well-formed modern character sheet', () => {
    const result = safeValidateCharacter(validModernCharacter);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Valerius Modern');
      expect(result.data.levelProgression).toHaveLength(2);
    }
  });

  it('should preserve unknown and custom fields via .passthrough()', () => {
    const characterWithCustomFields = {
      ...validModernCharacter,
      customCampaignSetting: 'Eberron',
      legacyHeroForgeVersion: '1.8.4',
      customNotesObject: { arbitraryKey: 42, tags: ['hero', 'champion'] }
    };

    const result = safeValidateCharacter(characterWithCustomFields);
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as any;
      expect(data.customCampaignSetting).toBe('Eberron');
      expect(data.legacyHeroForgeVersion).toBe('1.8.4');
      expect(data.customNotesObject).toEqual({ arbitraryKey: 42, tags: ['hero', 'champion'] });
    }
  });

  it('should validate legacy character backups AFTER normalizeCharacterOnLoad runs', () => {
    const rawLegacyCharacter = {
      name: 'Old School Knight',
      selectedRace: 'Human',
      levelProgression: [{ level: 1, primaryClass: 'Fighter', hpRoll: 10 }],
      selectedFeats: ['Power Attack', 'Weapon Focus (Longsword)'],
      equipment: {
        armor: '+1 Full Plate',
        shield: 'Mithral Heavy Shield',
        primaryWeapon: '+1 Longsword'
      },
      tacticalCombat: {
        haste: true,
        rage: false
      },
      dr: '5/magic',
      sr: '15'
    };

    // Step 1: Normalize (runs migration)
    const normalized = normalizeCharacterOnLoad(rawLegacyCharacter);

    // Step 2: Validate with Zod
    const result = safeValidateCharacter(normalized);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.selectedFeatEntities).toHaveLength(2);
      expect(result.data.selectedFeatEntities?.map(f => f.featId)).toEqual(['power_attack', 'weapon_focus']);
      expect(result.data.activeBuffs?.some(b => b.id === 'haste' && b.active)).toBe(true);
      expect(result.data.damageReduction).toBeDefined();
      expect(result.data.damageReduction?.[0]).toMatchObject({ value: 5, bypass: 'Magic' });
    }
  });

  it('should reject genuinely corrupted character structures', () => {
    // Primitives
    expect(safeValidateCharacter(null).success).toBe(false);
    expect(safeValidateCharacter('not a character').success).toBe(false);
    expect(safeValidateCharacter(42).success).toBe(false);
    expect(safeValidateCharacter(true).success).toBe(false);

    // Empty or completely unidentifiable object
    expect(safeValidateCharacter({ randomKey: 'randomValue' }).success).toBe(false);

    // Corrupted levelProgression (e.g. string instead of array)
    const corruptedProgression = {
      ...validModernCharacter,
      levelProgression: 'Fighter 5' as any
    };
    expect(safeValidateCharacter(corruptedProgression).success).toBe(false);

    // Corrupted baseStats (e.g. string instead of object)
    const corruptedStats = {
      ...validModernCharacter,
      baseStats: '16/12/14/10/14/10' as any
    };
    expect(safeValidateCharacter(corruptedStats).success).toBe(false);
  });

  it('should validate a valid roster backup package', () => {
    const validPackage = {
      version: '1.0',
      exportType: 'heroforge_roster_backup' as const,
      exportedAt: Date.now(),
      activeCharacterId: 'char_valid_123',
      characters: [validModernCharacter]
    };

    const result = safeValidateRosterPackage(validPackage);
    expect(result.success).toBe(true);
  });

  it('should reject a malformed roster backup package structure', () => {
    const malformedPackage = {
      version: '1.0',
      exportType: 'heroforge_roster_backup' as const,
      characters: 'not an array or object' as any
    };

    const result = safeValidateRosterPackage(malformedPackage);
    expect(result.success).toBe(false);
  });

  describe('characterStore import Character & Roster integration', () => {
    it('importCharacterJSON should successfully import a valid character JSON string', async () => {
      const jsonStr = JSON.stringify(validModernCharacter);
      const imported = await importCharacterJSON(jsonStr);
      expect(imported).not.toBeNull();
      expect(imported?.name).toBe('Valerius Modern');
      expect(imported?.id).toBe('char_valid_123');
    });

    it('importCharacterJSON should gracefully return null for unparseable JSON string', async () => {
      const corruptedJson = '{"name": "Broken", broken syntax';
      const result = await importCharacterJSON(corruptedJson);
      expect(result).toBeNull();
    });

    it('importCharacterJSON should return null for corrupted character object', async () => {
      const corruptedObj = { invalidField: 123, levelProgression: 'corrupted' };
      const result = await importCharacterJSON(corruptedObj);
      expect(result).toBeNull();
    });

    it('importRosterPackage should import valid entries and skip corrupted entries within a batch', async () => {
      const mixedBatch = [
        validModernCharacter,
        { nonCharacterObject: true }, // Corrupted: lacks any character fields
        {
          name: 'Second Valid Adventurer',
          selectedRace: 'Elf',
          baseStats: { str: 10, dex: 16, con: 12, int: 14, wis: 12, cha: 10 },
          levelProgression: [{ level: 1, primaryClass: 'Rogue', hpRoll: 6 }]
        }
      ];

      const result = await importRosterPackage(mixedBatch);
      // Only 2 should import successfully; 1 corrupted should be skipped
      expect(result.importedCount).toBe(2);
    });

    it('importRosterPackage should reject malformed roster packages without importing', async () => {
      const malformedPkg = {
        exportType: 'heroforge_roster_backup',
        characters: 'corrupted_string_not_array'
      };

      const result = await importRosterPackage(malformedPkg);
      expect(result.importedCount).toBe(0);
      expect(result.lastImportedId).toBeNull();
    });
  });
});
