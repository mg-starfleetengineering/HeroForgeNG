import { describe, it, expect } from 'vitest';
import {
  formatClassesSummary,
  createCharacterSummary,
  generateCharacterId
} from '../../storage/characterStore';
import { CharacterSheetData } from '../../types/character';

describe('characterStore Storage Helper & Summary Tests', () => {
  it('should correctly format level progression into a class breakdown string', () => {
    const progression = [
      { level: 1, primaryClass: 'Fighter', hpRoll: 10 },
      { level: 2, primaryClass: 'Fighter', hpRoll: 6 },
      { level: 3, primaryClass: 'Wizard', hpRoll: 4 }
    ];

    const result = formatClassesSummary(progression);
    expect(result).toBe('Fighter 2 / Wizard 1');
  });

  it('should handle single class progression', () => {
    const progression = [
      { level: 1, primaryClass: 'Rogue', hpRoll: 6 },
      { level: 2, primaryClass: 'Rogue', hpRoll: 6 }
    ];

    const result = formatClassesSummary(progression);
    expect(result).toBe('Rogue 2');
  });

  it('should return "Unclassed" for empty level progression', () => {
    expect(formatClassesSummary([])).toBe('Unclassed');
  });

  it('should generate a valid character summary from full sheet data', () => {
    const sheet: CharacterSheetData = {
      id: 'test_uuid_123',
      updatedAt: 1700000000000,
      name: 'Thorin Oakenshield',
      player: 'Gamer',
      alignment: 'Lawful Good',
      deity: 'Moradin',
      pointBuyTarget: '32',
      baseStats: { str: 16, dex: 10, con: 16, int: 10, wis: 12, cha: 12 },
      enhancementMods: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
      levelBumps: {},
      selectedRace: 'Dwarf',
      isGestalt: false,
      levelProgression: [
        { level: 1, primaryClass: 'Fighter', hpRoll: 10 },
        { level: 2, primaryClass: 'Fighter', hpRoll: 6 }
      ],
      skillRanks: {},
      selectedFeats: ['Power Attack'],
      equipment: {
        armor: 'fullplate',
        armorEnhancement: 1,
        shield: 'heavy_shield',
        shieldEnhancement: 1,
        deflection: 0,
        natural: 0,
        dodge: 0,
        primaryWeapon: 'Warhammer'
      }
    };

    const summary = createCharacterSummary(sheet);
    expect(summary.id).toBe('test_uuid_123');
    expect(summary.name).toBe('Thorin Oakenshield');
    expect(summary.race).toBe('Dwarf');
    expect(summary.level).toBe(2);
    expect(summary.classes).toBe('Fighter 2');
    expect(summary.updatedAt).toBe(1700000000000);
  });

  it('should generate non-empty unique character IDs', () => {
    const id1 = generateCharacterId();
    const id2 = generateCharacterId();
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });

  it('should parse roster backup package format in importRosterPackage', async () => {
    const { importRosterPackage } = await import('../../storage/characterStore');

    const backupPkg = {
      version: '1.0',
      exportType: 'heroforge_roster_backup',
      exportedAt: Date.now(),
      characters: [
        { name: 'Character Alpha', selectedRace: 'Elf', levelProgression: [{ level: 1, primaryClass: 'Wizard', hpRoll: 4 }] },
        { name: 'Character Beta', selectedRace: 'Halfling', levelProgression: [{ level: 1, primaryClass: 'Rogue', hpRoll: 6 }] }
      ]
    };

    const result = await importRosterPackage(backupPkg);
    expect(result.importedCount).toBe(2);
    expect(result.lastImportedId).toBeTruthy();
  });
});
