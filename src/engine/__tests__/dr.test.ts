import { describe, it, expect } from 'vitest';
import {
  GetDRValue,
  GetDRCombo,
  GetDRAbilityType,
  parseDRText,
  collectDRSources,
  calculateTotalDR
} from '../dr';
import { CharacterState, RaceData, TemplateData } from '../../types/character';

describe('Damage Reduction (DR) Engine', () => {
  describe('VBA DR Utility Functions', () => {
    it('GetDRValue parses max DR matching a bypass', () => {
      const drText = 'DR 5/Magic, 3/-, 10/Adamantine';
      expect(GetDRValue(drText, 'Magic')).toBe(5);
      expect(GetDRValue(drText, 'Adamantine')).toBe(10);
      expect(GetDRValue(drText, '-')).toBe(3);
      expect(GetDRValue(drText, 'Cold Iron')).toBe(0);
    });

    it('GetDRCombo identifies compound bypass types', () => {
      const drText = '10/Silver and Magic';
      expect(GetDRCombo(drText, 'and')).toBe('Silver and Magic');
    });

    it('GetDRAbilityType identifies Ex vs Su', () => {
      expect(GetDRAbilityType('Adamantine')).toBe('Ex');
      expect(GetDRAbilityType('Magic')).toBe('Su');
      expect(GetDRAbilityType('Silver and Magic')).toBe('Su');
    });

    it('parseDRText parses simple and compound DR strings', () => {
      const parsed1 = parseDRText('DR 5/Adamantine');
      expect(parsed1).toEqual([{ value: 5, bypass: 'Adamantine', abilityType: 'Ex' }]);

      const parsed2 = parseDRText('15/Bludgeoning and Magic');
      expect(parsed2).toEqual([{ value: 15, bypass: 'Bludgeoning and Magic', abilityType: 'Su' }]);
    });
  });

  describe('DR Source Collection & Calculations', () => {
    it('returns None when character has no DR sources', () => {
      const character: Partial<CharacterState> = {
        selectedRace: 'Human',
        levelProgression: [{ level: 1, primaryClass: 'Fighter', hpRoll: 10 }],
        selectedFeats: ['Power Attack']
      };

      const summary = calculateTotalDR(character as CharacterState);
      expect(summary.hasDR).toBe(false);
      expect(summary.bestDRString).toBe('None');
      expect(summary.baselineStackingDR).toBe(0);
    });

    it('calculates Barbarian DR progression', () => {
      const characterL5: Partial<CharacterState> = {
        selectedRace: 'Human',
        levelProgression: Array(5).fill({ primaryClass: 'Barbarian', hpRoll: 8 }),
        selectedFeats: []
      };
      expect(calculateTotalDR(characterL5 as CharacterState).hasDR).toBe(false);

      const characterL7: Partial<CharacterState> = {
        selectedRace: 'Human',
        levelProgression: Array(7).fill({ primaryClass: 'Barbarian', hpRoll: 8 }),
        selectedFeats: []
      };
      const summaryL7 = calculateTotalDR(characterL7 as CharacterState);
      expect(summaryL7.hasDR).toBe(true);
      expect(summaryL7.bestDRString).toBe('DR 1/-');

      const characterL10: Partial<CharacterState> = {
        selectedRace: 'Human',
        levelProgression: Array(10).fill({ primaryClass: 'Barbarian', hpRoll: 8 }),
        selectedFeats: []
      };
      expect(calculateTotalDR(characterL10 as CharacterState).bestDRString).toBe('DR 2/-');
    });

    it('stacks Barbarian DR, Roll With It, and Adamantine Heavy Armor', () => {
      const character: Partial<CharacterState> = {
        selectedRace: 'Human',
        levelProgression: Array(10).fill({ primaryClass: 'Barbarian', hpRoll: 8 }), // DR 2/-
        selectedFeats: ['Roll With It'], // DR 2/- (stacking)
        equipment: {
          armor: 'fullplate', // Heavy Adamantine armor => DR 3/- (stacking)
          armorEnhancement: 1,
          shield: 'none',
          shieldEnhancement: 0,
          deflection: 0,
          natural: 0,
          dodge: 0,
          primaryWeapon: 'Greatsword'
        },
        customArmors: [
          {
            id: 'fullplate',
            name: 'Adamantine Full Plate',
            acBonus: 8,
            type: 'heavy'
          }
        ]
      };

      const summary = calculateTotalDR(character as CharacterState);
      expect(summary.hasDR).toBe(true);
      // 2 (Barbarian) + 2 (Roll With It) + 3 (Adamantine Heavy Armor) = 7/-
      expect(summary.baselineStackingDR).toBe(7);
      expect(summary.bestDRString).toBe('DR 7/-');
    });

    it('applies baseline stacking DR to non-stacking Template DR (e.g. Vampire 10/Silver and Magic)', () => {
      const character: Partial<CharacterState> = {
        selectedRace: 'Human',
        selectedTemplate: 'Vampire',
        levelProgression: Array(10).fill({ primaryClass: 'Barbarian', hpRoll: 8 }), // DR 2/- stacking
        selectedFeats: ['Roll With It'] // DR 2/- stacking
      };

      const templateObj: Partial<TemplateData> = {
        name: 'Vampire',
        specialAbilities: 'DR 10/Silver and Magic'
      };

      const summary = calculateTotalDR(character as CharacterState, undefined, templateObj);
      expect(summary.hasDR).toBe(true);
      expect(summary.baselineStackingDR).toBe(4); // 2 (Barbarian) + 2 (Roll With It)
      // 10/Silver and Magic + 4 baseline stacking = DR 14/Silver and Magic
      expect(summary.bestDRString).toBe('DR 14/Silver and Magic');
    });

    it('applies Thick-skinned bonus (+2 to all DR per rank)', () => {
      const character: Partial<CharacterState> = {
        selectedRace: 'Gargoyle',
        levelProgression: [{ level: 1, primaryClass: 'Fighter', hpRoll: 10 }],
        selectedFeats: ['Thick-skinned']
      };

      const raceObj: Partial<RaceData> = {
        name: 'Gargoyle',
        specialAbilities: 'DR 10/Magic'
      };

      const summary = calculateTotalDR(character as CharacterState, raceObj);
      expect(summary.hasDR).toBe(true);
      // 10/Magic + 2 (Thick-skinned) = DR 12/Magic
      expect(summary.bestDRString).toBe('DR 12/Magic');
    });
  });
});
