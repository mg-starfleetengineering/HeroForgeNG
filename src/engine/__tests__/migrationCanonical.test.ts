import { describe, it, expect } from 'vitest';
import {
  toCanonicalClassId,
  toCanonicalDomainId,
  findClassInDatabase,
  calculateBAB,
  calculateBaseSave
} from '../classes';
import {
  migrateCanonicalIdentifiers,
  normalizeCharacterOnLoad
} from '../../storage/migration';
import {
  formatClassesSummary,
  formatClassNameToTitle
} from '../../storage/characterStore';
import {
  getSpellSlotsForClass,
  isPreparedCaster,
  isSpellcastingClassName,
  syncPreparedSlotsForCharacter,
  getSpellSlotUsageKey,
  resetExpendedSpellSlotsForClass,
  clearAllPreparedSlots,
  resetAllPreparedSlotsCast
} from '../spells';
import { CharacterSheetData } from '../../types/character';
import classesData from '../../data/classes.json';

describe('Phase 3: Canonical Identifiers & Storage Migration Engine', () => {
  describe('toCanonicalClassId', () => {
    it('should normalize standard single-word class names to lowercase snake_case', () => {
      expect(toCanonicalClassId('Wizard')).toBe('wizard');
      expect(toCanonicalClassId('Fighter')).toBe('fighter');
      expect(toCanonicalClassId('Cleric')).toBe('cleric');
      expect(toCanonicalClassId('Rogue')).toBe('rogue');
    });

    it('should normalize multi-word and spaced class names to snake_case', () => {
      expect(toCanonicalClassId('Dragon Shaman')).toBe('dragon_shaman');
      expect(toCanonicalClassId('Psychic Warrior')).toBe('psychic_warrior');
      expect(toCanonicalClassId('Favored Soul')).toBe('favored_soul');
      expect(toCanonicalClassId('Wu Jen')).toBe('wu_jen');
      expect(toCanonicalClassId('Divine Mind')).toBe('divine_mind');
    });

    it('should handle slashes, hyphens, and multiple spaces', () => {
      expect(toCanonicalClassId('Spell-Thief')).toBe('spell_thief');
      expect(toCanonicalClassId('War/Mage')).toBe('war_mage');
      expect(toCanonicalClassId('  Dragon   Shaman  ')).toBe('dragon_shaman');
    });

    it('should return empty string for falsy/empty input', () => {
      expect(toCanonicalClassId('')).toBe('');
      expect(toCanonicalClassId(undefined as any)).toBe('');
      expect(toCanonicalClassId(null as any)).toBe('');
    });
  });

  describe('toCanonicalDomainId', () => {
    it('should normalize single-word and multi-word domains', () => {
      expect(toCanonicalDomainId('War')).toBe('war');
      expect(toCanonicalDomainId('Magic')).toBe('magic');
      expect(toCanonicalDomainId('Healing')).toBe('healing');
      expect(toCanonicalDomainId('Good Evil')).toBe('good_evil');
      expect(toCanonicalDomainId('Sun/Moon')).toBe('sun_moon');
    });

    it('should trim and handle empty inputs', () => {
      expect(toCanonicalDomainId('  War  ')).toBe('war');
      expect(toCanonicalDomainId('')).toBe('');
      expect(toCanonicalDomainId(undefined as any)).toBe('');
    });
  });

  describe('findClassInDatabase with canonical IDs', () => {
    it('should find classes by either display name or canonical snake_case id', () => {
      const cls1 = findClassInDatabase('wizard', classesData as any);
      expect(cls1).toBeDefined();
      expect(cls1?.name).toBe('Wizard');

      const cls2 = findClassInDatabase('Wizard', classesData as any);
      expect(cls2).toBeDefined();
      expect(cls2?.name).toBe('Wizard');

      const bbn = findClassInDatabase('barbarian', classesData as any);
      expect(bbn).toBeDefined();
      expect(bbn?.name).toBe('Barbarian');
    });
  });

  describe('formatClassNameToTitle & formatClassesSummary', () => {
    it('should convert snake_case class IDs to title-cased names', () => {
      expect(formatClassNameToTitle('fighter')).toBe('Fighter');
      expect(formatClassNameToTitle('dragon_shaman')).toBe('Dragon Shaman');
      expect(formatClassNameToTitle('wizard')).toBe('Wizard');
      expect(formatClassNameToTitle('wu_jen')).toBe('Wu Jen');
    });

    it('should format level progression with canonical snake_case into human-readable summary', () => {
      const progression = [
        { level: 1, primaryClass: 'fighter', hpRoll: 10 },
        { level: 2, primaryClass: 'fighter', hpRoll: 6 },
        { level: 3, primaryClass: 'wizard', hpRoll: 4 }
      ];
      expect(formatClassesSummary(progression)).toBe('Fighter 2 / Wizard 1');
    });

    it('should handle multi-word canonical class IDs in formatClassesSummary', () => {
      const progression = [
        { level: 1, primaryClass: 'dragon_shaman', hpRoll: 10 },
        { level: 2, primaryClass: 'dragon_shaman', hpRoll: 6 }
      ];
      expect(formatClassesSummary(progression)).toBe('Dragon Shaman 2');
    });

    it('should return Unclassed for empty progression', () => {
      expect(formatClassesSummary([])).toBe('Unclassed');
    });
  });

  describe('migrateCanonicalIdentifiers', () => {
    it('should normalize levelProgression primaryClass and secondaryClass', () => {
      const char = {
        id: 'test_char',
        updatedAt: 1000,
        levelProgression: [
          { level: 1, primaryClass: 'Dragon Shaman', secondaryClass: 'Wizard', hpRoll: 10 },
          { level: 2, primaryClass: 'Dragon Shaman', secondaryClass: 'Wizard', hpRoll: 8 },
          { level: 3, primaryClass: 'Cleric', hpRoll: 8 }
        ]
      } as unknown as CharacterSheetData;

      const migrated = migrateCanonicalIdentifiers(char);
      expect(migrated.levelProgression[0].primaryClass).toBe('dragon_shaman');
      expect(migrated.levelProgression[0].secondaryClass).toBe('wizard');
      expect(migrated.levelProgression[1].primaryClass).toBe('dragon_shaman');
      expect(migrated.levelProgression[2].primaryClass).toBe('cleric');
      expect(migrated.levelProgression[2].secondaryClass).toBeUndefined();
    });

    it('should normalize preparedSpells className, classId, domainId and reconcile slot.id', () => {
      const char = {
        id: 'test_char',
        updatedAt: 1000,
        preparedSpells: [
          {
            id: 'Wizard_lvl1_slot_0',
            className: 'Wizard',
            spellLevel: 1,
            slotIndex: 0,
            spellId: 'magic_missile',
            spellName: 'Magic Missile',
            isCast: false
          },
          {
            id: 'Dragon Shaman_lvl2_slot_1',
            className: 'Dragon Shaman',
            spellLevel: 2,
            slotIndex: 1,
            spellId: null,
            isCast: false
          },
          {
            id: 'Cleric_lvl1_domain_0',
            className: 'Cleric',
            domainId: 'War',
            spellLevel: 1,
            slotIndex: 0,
            isDomain: true,
            spellId: 'magic_weapon',
            isCast: false
          }
        ]
      } as unknown as CharacterSheetData;

      const migrated = migrateCanonicalIdentifiers(char);
      const slots = migrated.preparedSpells || [];

      expect(slots[0].id).toBe('wizard_lvl1_slot_0');
      expect(slots[0].className).toBe('wizard');
      expect(slots[0].classId).toBe('wizard');

      expect(slots[1].id).toBe('dragon_shaman_lvl2_slot_1');
      expect(slots[1].className).toBe('dragon_shaman');
      expect(slots[1].classId).toBe('dragon_shaman');

      expect(slots[2].id).toBe('cleric_lvl1_domain_0');
      expect(slots[2].className).toBe('cleric');
      expect(slots[2].classId).toBe('cleric');
      expect(slots[2].domainId).toBe('war');
    });

    it('should normalize selectedDomains to canonical snake_case IDs', () => {
      const char = {
        id: 'test_char',
        updatedAt: 1000,
        selectedDomains: ['War', 'Healing', 'Good Magic']
      } as unknown as CharacterSheetData;

      const migrated = migrateCanonicalIdentifiers(char);
      expect(migrated.selectedDomains).toEqual(['war', 'healing', 'good_magic']);
    });

    it('should normalize expendedSpellSlots keys', () => {
      const char = {
        id: 'test_char',
        updatedAt: 1000,
        expendedSpellSlots: {
          'Wizard_lvl1': 2,
          'Cleric_lvl2': 1,
          'Dragon Shaman_lvl3': 3,
          'already_canonical_lvl0': 4
        }
      } as unknown as CharacterSheetData;

      const migrated = migrateCanonicalIdentifiers(char);
      expect(migrated.expendedSpellSlots).toEqual({
        'wizard_lvl1': 2,
        'cleric_lvl2': 1,
        'dragon_shaman_lvl3': 3,
        'already_canonical_lvl0': 4
      });
    });

    it('should be completely idempotent when run multiple times', () => {
      const char = {
        id: 'test_char',
        updatedAt: 1000,
        levelProgression: [{ level: 1, primaryClass: 'Dragon Shaman', hpRoll: 10 }],
        preparedSpells: [
          {
            id: 'Dragon Shaman_lvl1_slot_0',
            className: 'Dragon Shaman',
            spellLevel: 1,
            slotIndex: 0,
            spellId: null,
            isCast: false
          }
        ],
        selectedDomains: ['War', 'Sun'],
        expendedSpellSlots: { 'Dragon Shaman_lvl1': 1 }
      } as unknown as CharacterSheetData;

      const firstPass = migrateCanonicalIdentifiers(char);
      const secondPass = migrateCanonicalIdentifiers(firstPass);

      expect(secondPass).toEqual(firstPass);
      expect(secondPass.levelProgression[0].primaryClass).toBe('dragon_shaman');
      expect(secondPass.preparedSpells?.[0].id).toBe('dragon_shaman_lvl1_slot_0');
      expect(secondPass.preparedSpells?.[0].className).toBe('dragon_shaman');
      expect(secondPass.selectedDomains).toEqual(['war', 'sun']);
      expect(secondPass.expendedSpellSlots).toEqual({ 'dragon_shaman_lvl1': 1 });
    });
  });

  describe('normalizeCharacterOnLoad Integration', () => {
    it('should run canonical identifier migration as part of load pipeline', () => {
      const legacyRaw = {
        id: 'char_legacy',
        name: 'Elminster',
        selectedRace: 'Human',
        levelProgression: [
          { level: 1, primaryClass: 'Wizard', hpRoll: 4 },
          { level: 2, primaryClass: 'Wizard', hpRoll: 4 }
        ],
        selectedFeats: ['Toughness', 'Weapon Focus (Longsword)'],
        preparedSpells: [
          {
            id: 'Wizard_lvl1_slot_0',
            className: 'Wizard',
            spellLevel: 1,
            slotIndex: 0,
            spellId: 'magic_missile'
          }
        ],
        selectedDomains: ['Magic'],
        expendedSpellSlots: {
          'Wizard_lvl1': 1
        },
        equipment: {
          armor: 'Leather Armor',
          primaryWeapon: 'Longsword'
        }
      };

      const normalized = normalizeCharacterOnLoad(legacyRaw);

      // 1. Canonical identifiers applied
      expect(normalized.levelProgression[0].primaryClass).toBe('wizard');
      expect(normalized.levelProgression[1].primaryClass).toBe('wizard');
      expect(normalized.preparedSpells?.[0].id).toBe('wizard_lvl1_slot_0');
      expect(normalized.preparedSpells?.[0].className).toBe('wizard');
      expect(normalized.preparedSpells?.[0].classId).toBe('wizard');
      expect(normalized.selectedDomains).toEqual(['magic']);
      expect(normalized.expendedSpellSlots).toEqual({ 'wizard_lvl1': 1 });

      // 2. Feat migration preserved
      expect(normalized.selectedFeatEntities).toBeDefined();
      expect(normalized.selectedFeatEntities?.length).toBe(2);
      expect((normalized as any).selectedFeats).toBeUndefined();

      // 3. Equipment migration preserved
      expect(normalized.inventory).toBeDefined();
      expect(normalized.inventory?.some(i => i.name === 'Leather Armor')).toBe(true);
      expect(normalized.inventory?.some(i => i.name === 'Longsword')).toBe(true);
    });
  });

  describe('Runtime Spell Engine with Canonical Identifiers', () => {
    it('should work seamlessly with canonical class names in getSpellSlotsForClass', () => {
      const canonicalSlots = getSpellSlotsForClass('wizard', 5, 4);
      const displaySlots = getSpellSlotsForClass('Wizard', 5, 4);

      expect(canonicalSlots).not.toBeNull();
      expect(displaySlots).not.toBeNull();
      expect(canonicalSlots?.slots.length).toBe(displaySlots?.slots.length);
      expect(canonicalSlots?.slots[1].total).toBe(4);
    });

    it('should recognize canonical class names in isPreparedCaster and isSpellcastingClassName', () => {
      expect(isPreparedCaster('wizard')).toBe(true);
      expect(isPreparedCaster('cleric')).toBe(true);
      expect(isPreparedCaster('dragon_shaman')).toBe(false);

      expect(isSpellcastingClassName('wizard')).toBe(true);
      expect(isSpellcastingClassName('cleric')).toBe(true);
      expect(isSpellcastingClassName('sorcerer')).toBe(true);
    });

    it('should synchronize slots and build canonical slot IDs', () => {
      const slots = syncPreparedSlotsForCharacter('wizard', 3, 3);
      expect(slots.length).toBeGreaterThan(0);
      slots.forEach(slot => {
        expect(slot.className).toBe('wizard');
        expect(slot.classId).toBe('wizard');
        expect(slot.id.startsWith('wizard_lvl')).toBe(true);
      });
    });

    it('should compute usage key and reset expended slots canonically', () => {
      expect(getSpellSlotUsageKey('Wizard', 2)).toBe('wizard_lvl2');
      expect(getSpellSlotUsageKey('dragon_shaman', 1)).toBe('dragon_shaman_lvl1');

      const expended = {
        'wizard_lvl1': 2,
        'wizard_lvl2': 1,
        'cleric_lvl1': 3
      };

      const resetWizard = resetExpendedSpellSlotsForClass(expended, 'wizard');
      expect(resetWizard).toEqual({ 'cleric_lvl1': 3 });

      const resetCleric = resetExpendedSpellSlotsForClass(expended, 'Cleric');
      expect(resetCleric).toEqual({ 'wizard_lvl1': 2, 'wizard_lvl2': 1 });
    });

    it('should clear and reset prepared slots using direct className comparison', () => {
      const slots = [
        { id: 'wizard_lvl1_slot_0', className: 'wizard', classId: 'wizard', spellLevel: 1, slotIndex: 0, spellId: 'magic_missile', isCast: true },
        { id: 'cleric_lvl1_slot_0', className: 'cleric', classId: 'cleric', spellLevel: 1, slotIndex: 0, spellId: 'cure_light_wounds', isCast: true }
      ];

      const resetCast = resetAllPreparedSlotsCast(slots, 'wizard');
      expect(resetCast[0].isCast).toBe(false);
      expect(resetCast[1].isCast).toBe(true);

      const cleared = clearAllPreparedSlots(slots, 'wizard');
      expect(cleared[0].spellId).toBeNull();
      expect(cleared[1].spellId).toBe('cure_light_wounds');
    });
  });

  describe('Rule Calculation Engine with Canonical Identifiers', () => {
    it('should calculate BAB accurately with canonical primaryClass', () => {
      const progression = [
        { level: 1, primaryClass: 'fighter', hpRoll: 10 },
        { level: 2, primaryClass: 'fighter', hpRoll: 6 },
        { level: 3, primaryClass: 'wizard', hpRoll: 4 }
      ];
      // Fighter BAB factor = 1.0 (2 levels -> 2.0), Wizard BAB factor = 0.5 (1 level -> 0.5) => floor(2.5) = 2
      const bab = calculateBAB(progression as any, classesData as any);
      expect(bab).toBe(2);
    });

    it('should calculate Base Saves accurately with canonical primaryClass', () => {
      const progression = [
        { level: 1, primaryClass: 'fighter', hpRoll: 10 },
        { level: 2, primaryClass: 'fighter', hpRoll: 6 }
      ];
      // Fighter Fort save factor >= 0.5: 2 + floor(2/2) = 3
      const fort = calculateBaseSave('fort', progression as any, classesData as any);
      expect(fort).toBe(3);
    });
  });
});
