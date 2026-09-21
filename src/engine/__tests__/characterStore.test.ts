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

  it('should use raceOverride in createCharacterSummary when specified', () => {
    const sheet: CharacterSheetData = {
      id: 'test_override_456',
      updatedAt: 1700000000000,
      name: 'Ghislaine',
      player: 'Shadow',
      alignment: 'Chaotic Good',
      deity: 'Solonor Thelandira',
      pointBuyTarget: '32',
      baseStats: { str: 14, dex: 16, con: 12, int: 10, wis: 12, cha: 10 },
      enhancementMods: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
      levelBumps: {},
      selectedRace: 'Elf, Wild',
      raceOverride: 'Catfolk',
      isGestalt: false,
      levelProgression: [{ level: 1, primaryClass: 'Ranger', hpRoll: 8 }],
      skillRanks: {},
      selectedFeats: ['Track'],
      equipment: {
        armor: 'leather',
        armorEnhancement: 0,
        shield: 'none',
        shieldEnhancement: 0,
        deflection: 0,
        natural: 0,
        dodge: 0,
        primaryWeapon: 'Longbow'
      }
    };

    const summary = createCharacterSummary(sheet);
    expect(summary.race).toBe('Catfolk');
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

  it('should automatically migrate legacy selectedFeats into selectedFeatEntities on load and purge selectedFeats', async () => {
    const { saveCharacter, getCharacter } = await import('../../storage/characterStore');

    const legacySheet: any = {
      id: 'legacy_warrior_999',
      name: 'Legacy Warrior',
      selectedRace: 'Human',
      levelProgression: [{ level: 1, primaryClass: 'Fighter', hpRoll: 10 }],
      selectedFeats: ['Weapon Focus (Longsword)', 'Dodge']
    };

    await saveCharacter(legacySheet);
    const loaded = await getCharacter('legacy_warrior_999');

    expect(loaded).not.toBeNull();
    expect(loaded?.selectedFeatEntities).toBeDefined();
    expect(loaded?.selectedFeatEntities).toHaveLength(2);

    const wf = loaded?.selectedFeatEntities?.find(e => e.featId === 'weapon_focus');
    expect(wf).toBeDefined();
    expect(wf?.targetId).toBe('longsword');
    expect(wf?.targetType).toBe('weapon');

    const dodge = loaded?.selectedFeatEntities?.find(e => e.featId === 'dodge');
    expect(dodge).toBeDefined();
    expect(dodge?.targetId).toBeUndefined();

    // Verify selectedFeats is purged
    expect((loaded as any)?.selectedFeats).toBeUndefined();
  });

  it('should normalize legacy characters when importing roster package', async () => {
    const { importRosterPackage, getCharacter } = await import('../../storage/characterStore');

    const backupPkg = {
      version: '1.0',
      exportType: 'heroforge_roster_backup',
      exportedAt: Date.now(),
      characters: [
        {
          id: 'roster_legacy_paladin',
          name: 'Legacy Paladin',
          selectedRace: 'Human',
          levelProgression: [{ level: 1, primaryClass: 'Paladin', hpRoll: 10 }],
          selectedFeats: ['Power Attack', 'Cleave']
        }
      ]
    };

    const importResult = await importRosterPackage(backupPkg);
    expect(importResult.importedCount).toBe(1);
    expect(importResult.lastImportedId).toBe('roster_legacy_paladin');

    const imported = await getCharacter('roster_legacy_paladin');
    expect(imported).not.toBeNull();
    expect(imported?.selectedFeatEntities).toHaveLength(2);
    expect(imported?.selectedFeatEntities?.map(e => e.featId)).toEqual(['power_attack', 'cleave']);
    expect((imported as any)?.selectedFeats).toBeUndefined();
  });

  it('normalizeCharacterOnLoad should migrate combat buffs and legacy feat strings', async () => {
    const { normalizeCharacterOnLoad } = await import('../../storage/migration');

    const raw: any = {
      name: 'Buffed Wizard',
      selectedFeats: ['Spell Focus (Evocation)', 'Combat Casting'],
      tacticalCombat: {
        haste: true,
        rage: true
      }
    };

    const normalized = normalizeCharacterOnLoad(raw);
    expect(normalized.selectedFeatEntities).toHaveLength(2);
    expect(normalized.selectedFeatEntities[0]).toMatchObject({
      featId: 'spell_focus',
      targetId: 'evocation',
      targetType: 'school'
    });
    expect(normalized.selectedFeatEntities[1]).toMatchObject({
      featId: 'combat_casting'
    });
    // Checks buffs migration
    expect(normalized.activeBuffs).toBeDefined();
    expect(normalized.activeBuffs.length).toBeGreaterThanOrEqual(2);
    expect(normalized.activeBuffs.some(b => b.id === 'haste' && b.active)).toBe(true);
    expect(normalized.activeBuffs.some(b => b.id === 'rage' && b.active)).toBe(true);
    // Checks selectedFeats purge
    expect((normalized as any).selectedFeats).toBeUndefined();
  });

  it('normalizeCharacterOnLoad should migrate legacy equipment strings to structured inventory items', async () => {
    const { normalizeCharacterOnLoad } = await import('../../storage/migration');

    const raw: any = {
      name: 'Legacy Knight',
      equipment: {
        primaryWeapon: '+2 Keen Longsword',
        armor: 'Adamantine Full Plate',
        shield: 'Mithral Heavy Shield',
        secondaryWeapon: 'Cold Iron Dagger'
      },
      inventory: [
        { id: 'inv_1', name: "Explorer's Pack", quantity: 1, weight: 10, location: 'Carried' }
      ]
    };

    const normalized = normalizeCharacterOnLoad(raw);

    // Primary weapon
    expect(normalized.equipment.primaryWeaponItemId).toBeDefined();
    const primaryItem = normalized.inventory.find(i => i.id === normalized.equipment.primaryWeaponItemId);
    expect(primaryItem).toBeDefined();
    expect(primaryItem?.itemType).toBe('weapon');
    expect(primaryItem?.enhancementBonus).toBe(2);
    expect(primaryItem?.specialQualities).toEqual(['keen']);
    expect(primaryItem?.weaponData?.damageM).toBe('1d8');

    // Armor
    expect(normalized.equipment.armorItemId).toBeDefined();
    expect(normalized.equipment.armorMaterial).toBe('adamantine');
    const armorItem = normalized.inventory.find(i => i.id === normalized.equipment.armorItemId);
    expect(armorItem).toBeDefined();
    expect(armorItem?.itemType).toBe('armor');
    expect(armorItem?.material).toBe('adamantine');
    expect(armorItem?.baseItemId).toBe('full_plate');

    // Shield
    expect(normalized.equipment.shieldItemId).toBeDefined();
    expect(normalized.equipment.shieldMaterial).toBe('mithral');
    const shieldItem = normalized.inventory.find(i => i.id === normalized.equipment.shieldItemId);
    expect(shieldItem).toBeDefined();
    expect(shieldItem?.itemType).toBe('shield');
    expect(shieldItem?.material).toBe('mithral');
    expect(shieldItem?.weight).toBe(7.5); // 15 / 2

    // Secondary weapon
    expect(normalized.equipment.secondaryWeaponItemId).toBeDefined();
    expect(normalized.equipment.secondaryWeaponMaterial).toBe('cold_iron');
    const secItem = normalized.inventory.find(i => i.id === normalized.equipment.secondaryWeaponItemId);
    expect(secItem).toBeDefined();
    expect(secItem?.itemType).toBe('weapon');
    expect(secItem?.material).toBe('cold_iron');
  });
});
