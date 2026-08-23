import { describe, it, expect } from 'vitest';
import { getSpellSlotsForClass, getBonusSpells, isSpellcastingClassName } from '../spells';
import spellsData from '../../data/spells.json';
import suppSpellsData from '../../data/supplemental_domain_spells.json';

describe('D&D 3.5e Spells Engine & Data Verification', () => {
  describe('Bonus Spells Calculation (PHB 3.5e Rule)', () => {
    it('should return 0 bonus spells for cantrips/level 0', () => {
      expect(getBonusSpells(5, 0)).toBe(0);
      expect(getBonusSpells(10, 0)).toBe(0);
    });

    it('should calculate correct bonus spells for 1st-4th level spells based on ability modifier', () => {
      expect(getBonusSpells(1, 1)).toBe(1);
      expect(getBonusSpells(1, 2)).toBe(0);

      expect(getBonusSpells(2, 1)).toBe(1);
      expect(getBonusSpells(2, 2)).toBe(1);
      expect(getBonusSpells(2, 3)).toBe(0);

      expect(getBonusSpells(5, 1)).toBe(2);
      expect(getBonusSpells(5, 2)).toBe(1);
      expect(getBonusSpells(5, 3)).toBe(1);
      expect(getBonusSpells(5, 4)).toBe(1);
      expect(getBonusSpells(5, 5)).toBe(1);
      expect(getBonusSpells(5, 6)).toBe(0);
    });
  });

  describe('Spell Slots Progression for Classes', () => {
    it('should return correct slots for a 5th-level Wizard with 18 INT (+4 mod)', () => {
      const wizardSlots = getSpellSlotsForClass('Wizard', 5, 4);
      expect(wizardSlots).not.toBeNull();
      expect(wizardSlots?.className).toBe('Wizard');
      expect(wizardSlots?.slots).toHaveLength(4);

      expect(wizardSlots?.slots[0].spellLevel).toBe(0);
      expect(wizardSlots?.slots[0].base).toBe(4);
      expect(wizardSlots?.slots[0].total).toBe(4);
      expect(wizardSlots?.slots[0].saveDc).toBe(14);

      expect(wizardSlots?.slots[1].spellLevel).toBe(1);
      expect(wizardSlots?.slots[1].base).toBe(3);
      expect(wizardSlots?.slots[1].bonus).toBe(1);
      expect(wizardSlots?.slots[1].total).toBe(4);
      expect(wizardSlots?.slots[1].saveDc).toBe(15);

      expect(wizardSlots?.slots[2].spellLevel).toBe(2);
      expect(wizardSlots?.slots[2].base).toBe(2);
      expect(wizardSlots?.slots[2].total).toBe(3);
      expect(wizardSlots?.slots[2].saveDc).toBe(16);

      expect(wizardSlots?.slots[3].spellLevel).toBe(3);
      expect(wizardSlots?.slots[3].base).toBe(1);
      expect(wizardSlots?.slots[3].total).toBe(2);
      expect(wizardSlots?.slots[3].saveDc).toBe(17);
    });

    it('should handle Paladin half-caster spell slots starting at level 4', () => {
      const paladinLow = getSpellSlotsForClass('Paladin', 3, 2);
      expect(paladinLow?.slots).toHaveLength(0);

      const paladinLvl4 = getSpellSlotsForClass('Paladin', 4, 2);
      expect(paladinLvl4?.slots).toHaveLength(1);
      expect(paladinLvl4?.slots[0].spellLevel).toBe(1);
      expect(paladinLvl4?.slots[0].base).toBe(0);
      expect(paladinLvl4?.slots[0].bonus).toBe(1);
      expect(paladinLvl4?.slots[0].total).toBe(1);
      expect(paladinLvl4?.slots[0].canCast).toBe(true);
    });

    it('should detect spellcasting class names correctly', () => {
      expect(isSpellcastingClassName('Wizard')).toBe(true);
      expect(isSpellcastingClassName('Cleric')).toBe(true);
      expect(isSpellcastingClassName('Bard')).toBe(true);
      expect(isSpellcastingClassName('Fighter')).toBe(false);
      expect(isSpellcastingClassName('Rogue')).toBe(false);
    });
  });

  describe('3.5e Core Spells Database Integrity', () => {
    it('should load 596 core spells with all required schema fields', () => {
      expect(spellsData.length).toBe(596);

      spellsData.forEach(spell => {
        expect(spell.id).toBeTruthy();
        expect(spell.name).toBeTruthy();
        expect(spell.school).toBeTruthy();
        expect(spell.levels).toBeDefined();
        expect(typeof spell.levels).toBe('object');
        expect(spell.castingTime).toBeTruthy();
        expect(spell.range).toBeTruthy();
        expect(spell.duration).toBeTruthy();
        expect(spell.savingThrow).toBeTruthy();
        expect(spell.spellResistance).toBeTruthy();
        expect(spell.description).toBeTruthy();
        expect(spell.source).toBe('PHB');
      });
    });

    it('should contain iconic spells with accurate schools and levels', () => {
      const fireball = spellsData.find(s => s.name === 'Fireball');
      expect(fireball).toBeDefined();
      expect(fireball?.school).toBe('Evocation');
      expect(fireball?.levels['Sorcerer']).toBe(3);
      expect(fireball?.levels['Wizard']).toBe(3);
      expect(fireball?.savingThrow).toContain('Reflex');

      const magicMissile = spellsData.find(s => s.name === 'Magic Missile');
      expect(magicMissile).toBeDefined();
      expect(magicMissile?.school).toBe('Evocation');
      expect(magicMissile?.levels['Wizard']).toBe(1);

      const cureLight = spellsData.find(s => s.name === 'Cure Light Wounds');
      expect(cureLight).toBeDefined();
      expect(cureLight?.school).toBe('Conjuration');
      expect(cureLight?.levels['Cleric']).toBe(1);
    });

    it('should load supplemental domain spells from Excel workbook', () => {
      expect(suppSpellsData.length).toBeGreaterThan(200);

      suppSpellsData.forEach(sp => {
        expect(sp.id).toBeTruthy();
        expect(sp.name).toBeTruthy();
        expect(sp.excelOrigin).toBeDefined();
        expect(sp.excelOrigin.sheet).toBe('Domains');
        expect(sp.domains.length).toBeGreaterThan(0);
        expect(sp.levels).toBeDefined();
      });
    });
  });
});
