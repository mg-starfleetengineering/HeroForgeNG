import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseDiceFormula,
  formatBreakdown,
  rollDice,
  rollAttack,
  rollAttackSequence,
  rollDamage,
  rollSavingThrow,
  rollSkillCheck,
  rollAbilityCheck,
  rollGrappleCheck,
  rollInitiative,
  getRollHistory,
  clearRollHistory,
  subscribeRolls,
  getThreatMin,
  getCritMultiplier,
  DiceTerm
} from '../dice';
import { WeaponData } from '../../types/character';

describe('Interactive Dice Engine (src/engine/dice.ts)', () => {
  beforeEach(() => {
    clearRollHistory();
  });

  describe('parseDiceFormula', () => {
    it('parses standard single-dice expressions with positive modifier', () => {
      const parsed = parseDiceFormula('1d20+7');
      expect(parsed).toEqual([
        { type: 'dice', sign: '+', count: 1, sides: 20 },
        { type: 'modifier', sign: '+', value: 7 }
      ]);
    });

    it('parses standard expressions with negative modifier and whitespace', () => {
      const parsed = parseDiceFormula(' 2d6 - 3 ');
      expect(parsed).toEqual([
        { type: 'dice', sign: '+', count: 2, sides: 6 },
        { type: 'modifier', sign: '-', value: 3 }
      ]);
    });

    it('parses multi-dice and mixed dice formulas', () => {
      const parsed = parseDiceFormula('1d8 + 2d6 + 5');
      expect(parsed).toEqual([
        { type: 'dice', sign: '+', count: 1, sides: 8 },
        { type: 'dice', sign: '+', count: 2, sides: 6 },
        { type: 'modifier', sign: '+', value: 5 }
      ]);
    });

    it('parses shorthand expressions without count (e.g. d20, d6)', () => {
      const parsed = parseDiceFormula('d20 + 4');
      expect(parsed).toEqual([
        { type: 'dice', sign: '+', count: 1, sides: 20 },
        { type: 'modifier', sign: '+', value: 4 }
      ]);
    });

    it('parses pure numeric constants (+5, -2, 10)', () => {
      expect(parseDiceFormula('+5')).toEqual([{ type: 'modifier', sign: '+', value: 5 }]);
      expect(parseDiceFormula('-2')).toEqual([{ type: 'modifier', sign: '-', value: 2 }]);
      expect(parseDiceFormula('10')).toEqual([{ type: 'modifier', sign: '+', value: 10 }]);
    });

    it('returns empty array for empty string', () => {
      expect(parseDiceFormula('')).toEqual([]);
      expect(parseDiceFormula('   ')).toEqual([]);
    });
  });

  describe('formatBreakdown', () => {
    it('formats single dice and modifier correctly', () => {
      const terms = [
        { type: 'dice' as const, count: 1, sides: 20, results: [19], subtotal: 19, sign: '+' as const },
        { type: 'modifier' as const, value: 7, sign: '+' as const }
      ];
      expect(formatBreakdown(terms, 26)).toBe('[19] + 7 = 26');
    });

    it('formats multiple dice terms', () => {
      const terms = [
        { type: 'dice' as const, count: 2, sides: 6, results: [4, 6], subtotal: 10, sign: '+' as const },
        { type: 'modifier' as const, value: 5, sign: '+' as const }
      ];
      expect(formatBreakdown(terms, 15)).toBe('[4, 6] + 5 = 15');
    });
  });

  describe('rollDice with deterministic RNG', () => {
    it('evaluates 1d20+7 correctly with mock RNG', () => {
      // Mock RNG returning 15
      const customRng = () => 15;
      const result = rollDice('1d20+7', 'Attack Check', { customRng });

      expect(result.total).toBe(22);
      expect(result.d20Result).toBe(15);
      expect(result.isNatural20).toBe(false);
      expect(result.isNatural1).toBe(false);
      expect(result.isCritThreat).toBe(false);
      expect(result.status).toBe('normal');
      expect(result.breakdown).toBe('[15] + 7 = 22');
      expect(result.confirmationRoll).toBeUndefined();
    });

    it('evaluates 2d6+5 correctly with sequential mock RNG', () => {
      const rolls = [3, 4];
      let idx = 0;
      const customRng = () => rolls[idx++];

      const result = rollDice('2d6+5', 'Greatsword Damage', { customRng });
      expect(result.total).toBe(12);
      expect((result.terms[0] as DiceTerm).subtotal).toBe(7);
      expect(result.breakdown).toBe('[3, 4] + 5 = 12');
    });
  });

  describe('Critical Threat Range & Confirmation Rolls (D&D 3.5e)', () => {
    it('detects Natural 20, flags crit threat, and generates automatic confirmation roll', () => {
      // Primary roll is 20, Confirmation roll is 14
      const rolls = [20, 14];
      let idx = 0;
      const customRng = () => rolls[idx++];

      const result = rollDice('1d20+8', 'Longsword Attack', {
        customRng,
        rollType: 'attack'
      });

      expect(result.d20Result).toBe(20);
      expect(result.isNatural20).toBe(true);
      expect(result.isNatural1).toBe(false);
      expect(result.isCritThreat).toBe(true);
      expect(result.status).toBe('nat20');
      expect(result.total).toBe(28);

      // Verify automatic confirmation roll
      expect(result.confirmationRoll).toBeDefined();
      expect(result.confirmationRoll?.d20Result).toBe(14);
      expect(result.confirmationRoll?.total).toBe(22);
      expect(result.confirmationRoll?.breakdown).toBe('[14] + 8 = 22');
      expect(result.summary).toContain('NATURAL 20');
      expect(result.summary).toContain('Confirmation: 22');
    });

    it('detects Natural 1 as Fumble with no confirmation roll', () => {
      const customRng = () => 1;

      const result = rollDice('1d20+5', 'Attack', {
        customRng,
        rollType: 'attack'
      });

      expect(result.d20Result).toBe(1);
      expect(result.isNatural1).toBe(true);
      expect(result.isNatural20).toBe(false);
      expect(result.isCritThreat).toBe(false);
      expect(result.status).toBe('nat1');
      expect(result.confirmationRoll).toBeUndefined();
      expect(result.summary).toContain('NATURAL 1 (Fumble!)');
    });

    it('handles weapon with expanded threat range 19-20 (e.g. Longsword)', () => {
      const longsword: Partial<WeaponData> = {
        name: 'Longsword',
        threat: 19,
        critMultiplier: 2
      };

      // Roll 19 on d20 with 19-20 threat weapon, confirmation rolls 16
      const rolls = [19, 16];
      let idx = 0;
      const customRng = () => rolls[idx++];

      const result = rollDice('1d20+7', 'Longsword Attack', {
        customRng,
        weapon: longsword,
        rollType: 'attack'
      });

      expect(result.d20Result).toBe(19);
      expect(result.isNatural20).toBe(false);
      expect(result.isCritThreat).toBe(true);
      expect(result.status).toBe('crit_threat');
      expect(result.threatMin).toBe(19);
      expect(result.summary).toContain('CRITICAL THREAT (19-20)!');
      expect(result.confirmationRoll).toBeDefined();
      expect(result.confirmationRoll?.total).toBe(23); // 16 + 7
    });

    it('does not trigger threat when roll is below expanded threat range', () => {
      const longsword: Partial<WeaponData> = {
        name: 'Longsword',
        threat: 19,
        critMultiplier: 2
      };

      const customRng = () => 18; // 18 is below 19

      const result = rollDice('1d20+7', 'Longsword Attack', {
        customRng,
        weapon: longsword,
        rollType: 'attack'
      });

      expect(result.d20Result).toBe(18);
      expect(result.isCritThreat).toBe(false);
      expect(result.status).toBe('normal');
      expect(result.confirmationRoll).toBeUndefined();
    });

    it('handles weapon with 18-20 threat range (e.g. Falchion/Scimitar/Kukri)', () => {
      const falchion: Partial<WeaponData> = {
        name: 'Falchion',
        threat: 18,
        critMultiplier: 2
      };

      // Roll 18 on 18-20 weapon
      const rolls = [18, 12];
      let idx = 0;
      const customRng = () => rolls[idx++];

      const result = rollDice('1d20+10', 'Falchion Attack', {
        customRng,
        weapon: falchion,
        rollType: 'attack'
      });

      expect(result.d20Result).toBe(18);
      expect(result.isCritThreat).toBe(true);
      expect(result.status).toBe('crit_threat');
      expect(result.threatMin).toBe(18);
      expect(result.summary).toContain('CRITICAL THREAT (18-20)!');
      expect(result.confirmationRoll?.total).toBe(22); // 12 + 10
    });

    it('respects autoConfirmCrit: false option', () => {
      const customRng = () => 20;

      const result = rollDice('1d20+5', 'Attack', {
        customRng,
        rollType: 'attack',
        autoConfirmCrit: false
      });

      expect(result.isNatural20).toBe(true);
      expect(result.isCritThreat).toBe(true);
      expect(result.confirmationRoll).toBeUndefined();
    });
  });

  describe('Specialized Helper Functions', () => {
    it('rollAttack handles positive and negative bonuses', () => {
      const customRng = () => 10;

      const posResult = rollAttack(7, 'Primary Attack', undefined, { customRng });
      expect(posResult.formula).toBe('1d20+7');
      expect(posResult.total).toBe(17);
      expect(posResult.rollType).toBe('attack');

      const negResult = rollAttack('-3', 'Penalty Attack', undefined, { customRng });
      expect(negResult.formula).toBe('1d20-3');
      expect(negResult.total).toBe(7);
    });

    it('rollAttackSequence handles full iterative sequences like +11/+6/+1', () => {
      const customRng = () => 10;
      const seqResults = rollAttackSequence('+11/+6/+1', 'Full Attack', undefined, { customRng });

      expect(seqResults.length).toBe(3);
      expect(seqResults[0].formula).toBe('1d20+11');
      expect(seqResults[0].total).toBe(21);
      expect(seqResults[1].formula).toBe('1d20+6');
      expect(seqResults[1].total).toBe(16);
      expect(seqResults[2].formula).toBe('1d20+1');
      expect(seqResults[2].total).toBe(11);
    });

    it('rollDamage sets damage roll type and evaluates formulas', () => {
      const customRng = () => 4;
      const result = rollDamage('1d8+3', 'Longsword Damage', { customRng });

      expect(result.rollType).toBe('damage');
      expect(result.total).toBe(7);
      expect(result.label).toBe('Longsword Damage');
    });

    it('rollSavingThrow generates properly labeled saving throw rolls', () => {
      const customRng = () => 12;
      const fort = rollSavingThrow(5, 'Fortitude', { customRng });

      expect(fort.rollType).toBe('save');
      expect(fort.label).toBe('Fortitude Save');
      expect(fort.formula).toBe('1d20+5');
      expect(fort.total).toBe(17);
    });

    it('rollSkillCheck generates properly labeled skill rolls', () => {
      const customRng = () => 8;
      const spot = rollSkillCheck(9, 'Spot', { customRng });

      expect(spot.rollType).toBe('skill');
      expect(spot.label).toBe('Spot Check');
      expect(spot.total).toBe(17);
    });

    it('rollAbilityCheck generates properly labeled ability checks', () => {
      const customRng = () => 14;
      const strCheck = rollAbilityCheck(3, 'str', { customRng });

      expect(strCheck.rollType).toBe('ability');
      expect(strCheck.label).toBe('STR Check');
      expect(strCheck.total).toBe(17);
    });

    it('rollGrappleCheck and rollInitiative generate correct rollTypes', () => {
      const customRng = () => 10;
      const grapple = rollGrappleCheck(8, { customRng });
      expect(grapple.rollType).toBe('grapple');
      expect(grapple.total).toBe(18);

      const init = rollInitiative(2, { customRng });
      expect(init.rollType).toBe('initiative');
      expect(init.total).toBe(12);
    });
  });

  describe('Roll History & Event Pub/Sub', () => {
    it('records rolls in history and retrieves them in reverse chronological order', () => {
      clearRollHistory();
      expect(getRollHistory().length).toBe(0);

      rollDice('1d20+2', 'First Roll');
      rollDice('1d20+4', 'Second Roll');

      const history = getRollHistory();
      expect(history.length).toBe(2);
      expect(history[0].label).toBe('Second Roll');
      expect(history[1].label).toBe('First Roll');
    });

    it('notifies subscribers on each roll and supports unsubscription', () => {
      clearRollHistory();
      const listener = vi.fn();
      const unsubscribe = subscribeRolls(listener);

      rollDice('1d20+5', 'Notification Roll');
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ label: 'Notification Roll' }));

      unsubscribe();
      rollDice('1d20+1', 'After Unsubscribe');
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('getThreatMin & getCritMultiplier', () => {
    it('defaults to threat 20 and crit multiplier 2', () => {
      expect(getThreatMin()).toBe(20);
      expect(getCritMultiplier()).toBe(2);
    });

    it('extracts from weapon data or options', () => {
      const weapon: Partial<WeaponData> = { threat: 18, critMultiplier: 3 };
      expect(getThreatMin({ weapon })).toBe(18);
      expect(getCritMultiplier({ weapon })).toBe(3);

      expect(getThreatMin({ threatMin: 17 })).toBe(17);
      expect(getCritMultiplier({ critMultiplier: 4 })).toBe(4);
    });
  });
});
