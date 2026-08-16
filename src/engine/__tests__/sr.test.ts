import { describe, it, expect } from 'vitest';
import { calculateTotalSR, parseSRText, collectSRSources } from '../sr';
import { CharacterState, RaceData, TemplateData } from '../../types/character';

describe('Spell Resistance (SR) Engine', () => {
  describe('parseSRText', () => {
    it('parses dynamic SR with level', () => {
      expect(parseSRText('SR 11 + level', 5)).toBe(16);
      expect(parseSRText('Spell Resistance equal to 10 + HD', 3)).toBe(13);
    });

    it('parses static SR strings', () => {
      expect(parseSRText('SR 21')).toBe(21);
      expect(parseSRText('Spell Resistance: 18')).toBe(18);
    });

    it('returns 0 for empty or non-matching text', () => {
      expect(parseSRText('')).toBe(0);
      expect(parseSRText('Immune to poison')).toBe(0);
    });
  });

  describe('calculateTotalSR', () => {
    it('returns None when character has no SR sources', () => {
      const char: Partial<CharacterState> = {
        selectedRace: 'Human',
        levelProgression: [{ level: 1, primaryClass: 'Fighter', hpRoll: 10 }]
      };
      const summary = calculateTotalSR(char as CharacterState);
      expect(summary.hasSR).toBe(false);
      expect(summary.bestSRString).toBe('None');
      expect(summary.bestSR).toBe(0);
    });

    it('calculates Drow racial SR (11 + Level)', () => {
      const drowRace: Partial<RaceData> = {
        name: 'Elf, Drow'
      };
      const charL1: Partial<CharacterState> = {
        selectedRace: 'Elf, Drow',
        levelProgression: [{ level: 1, primaryClass: 'Rogue', hpRoll: 6 }]
      };
      const summaryL1 = calculateTotalSR(charL1 as CharacterState, drowRace);
      expect(summaryL1.hasSR).toBe(true);
      expect(summaryL1.bestSR).toBe(12); // 11 + 1
      expect(summaryL1.bestSRString).toBe('SR 12');

      const charL7: Partial<CharacterState> = {
        selectedRace: 'Elf, Drow',
        levelProgression: Array(7).fill({ primaryClass: 'Rogue', hpRoll: 6 })
      };
      const summaryL7 = calculateTotalSR(charL7 as CharacterState, drowRace);
      expect(summaryL7.bestSR).toBe(18); // 11 + 7
      expect(summaryL7.bestSRString).toBe('SR 18');
    });

    it('calculates Monk Diamond Soul SR (10 + Monk Level at Lv 13+)', () => {
      const charL12: Partial<CharacterState> = {
        selectedRace: 'Human',
        levelProgression: Array(12).fill({ primaryClass: 'Monk', hpRoll: 8 })
      };
      expect(calculateTotalSR(charL12 as CharacterState).hasSR).toBe(false);

      const charL13: Partial<CharacterState> = {
        selectedRace: 'Human',
        levelProgression: Array(13).fill({ primaryClass: 'Monk', hpRoll: 8 })
      };
      const summaryL13 = calculateTotalSR(charL13 as CharacterState);
      expect(summaryL13.hasSR).toBe(true);
      expect(summaryL13.bestSR).toBe(23); // 10 + 13
      expect(summaryL13.bestSRString).toBe('SR 23');
    });

    it('takes highest non-stacking SR and applies Boost Spell Resistance', () => {
      const drowRace: Partial<RaceData> = { name: 'Elf, Drow' };
      const char: Partial<CharacterState> = {
        selectedRace: 'Elf, Drow',
        levelProgression: [{ level: 1, primaryClass: 'Fighter', hpRoll: 10 }], // Drow gives 12
        selectedFeats: ['Boost Spell Resistance'], // +2 profane
        equipment: {
          armor: 'chainshirt',
          armorEnhancement: 1,
          shield: 'none',
          shieldEnhancement: 0,
          deflection: 0,
          natural: 0,
          dodge: 0,
          primaryWeapon: 'Longsword',
          wondrousItems: [
            { id: 'mantle', name: 'Mantle of Spell Resistance', slot: 'shoulders', effect: 'Grants SR 21' }
          ]
        }
      };

      // Base SR is max(12, 21) = 21, plus Boost Spell Resistance +2 = 23
      const summary = calculateTotalSR(char as CharacterState, drowRace);
      expect(summary.hasSR).toBe(true);
      expect(summary.baseSR).toBe(21);
      expect(summary.bonusSR).toBe(2);
      expect(summary.bestSR).toBe(23);
      expect(summary.bestSRString).toBe('SR 23');
    });
  });
});
