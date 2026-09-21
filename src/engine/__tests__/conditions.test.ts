import { describe, it, expect } from 'vitest';
import {
  calculateConditionPenalties,
  getHealthStatus,
  applyDamage,
  applyHeal,
  toggleCondition,
  DND_CONDITIONS
} from '../conditions';

describe('conditions engine tests', () => {
  it('should contain all standard D&D 3.5e conditions in DND_CONDITIONS registry', () => {
    expect(DND_CONDITIONS.length).toBeGreaterThanOrEqual(20);
    const ids = DND_CONDITIONS.map(c => c.id);
    expect(ids).toContain('shaken');
    expect(ids).toContain('fatigued');
    expect(ids).toContain('exhausted');
    expect(ids).toContain('sickened');
    expect(ids).toContain('blinded');
    expect(ids).toContain('prone');
    expect(ids).toContain('stunned');
    expect(ids).toContain('entangled');
    expect(ids).toContain('flat_footed');
  });

  describe('calculateConditionPenalties', () => {
    it('returns zeroes and no flags when no conditions active', () => {
      const penalties = calculateConditionPenalties([]);
      expect(penalties.attackPenalty).toBe(0);
      expect(penalties.strPenalty).toBe(0);
      expect(penalties.dexPenalty).toBe(0);
      expect(penalties.acPenalty).toBe(0);
      expect(penalties.allSavesPenalty).toBe(0);
      expect(penalties.loseDexToAc).toBe(false);
      expect(penalties.speedMultiplier).toBe(1.0);
    });

    it('calculates exact penalties for Shaken', () => {
      const penalties = calculateConditionPenalties(['shaken']);
      expect(penalties.attackPenalty).toBe(-2);
      expect(penalties.allSavesPenalty).toBe(-2);
      expect(penalties.fortPenalty).toBe(-2);
      expect(penalties.refPenalty).toBe(-2);
      expect(penalties.willPenalty).toBe(-2);
      expect(penalties.skillCheckPenalty).toBe(-2);
      expect(penalties.strPenalty).toBe(0);
      expect(penalties.dexPenalty).toBe(0);
    });

    it('calculates exact penalties for Fatigued and Exhausted', () => {
      const fatiguedPenalties = calculateConditionPenalties(['fatigued']);
      expect(fatiguedPenalties.strPenalty).toBe(-2);
      expect(fatiguedPenalties.dexPenalty).toBe(-2);
      expect(fatiguedPenalties.speedMultiplier).toBe(1.0);

      const exhaustedPenalties = calculateConditionPenalties(['exhausted']);
      expect(exhaustedPenalties.strPenalty).toBe(-6);
      expect(exhaustedPenalties.dexPenalty).toBe(-6);
      expect(exhaustedPenalties.speedMultiplier).toBe(0.5);

      // Exhausted supersedes Fatigued without double penalty
      const bothPenalties = calculateConditionPenalties(['fatigued', 'exhausted']);
      expect(bothPenalties.strPenalty).toBe(-6);
      expect(bothPenalties.dexPenalty).toBe(-6);
    });

    it('calculates exact penalties for Entangled', () => {
      const penalties = calculateConditionPenalties(['entangled']);
      expect(penalties.attackPenalty).toBe(-2);
      expect(penalties.dexPenalty).toBe(-4);
      expect(penalties.speedMultiplier).toBe(0.5);
    });

    it('calculates exact penalties for Sickened', () => {
      const penalties = calculateConditionPenalties(['sickened']);
      expect(penalties.attackPenalty).toBe(-2);
      expect(penalties.damagePenalty).toBe(-2);
      expect(penalties.allSavesPenalty).toBe(-2);
      expect(penalties.skillCheckPenalty).toBe(-2);
    });

    it('stacks distinct condition penalties appropriately (Shaken + Sickened + Entangled)', () => {
      const penalties = calculateConditionPenalties(['shaken', 'sickened', 'entangled']);
      // Shaken (-2) + Sickened (-2) + Entangled (-2) = -6 attack
      expect(penalties.attackPenalty).toBe(-6);
      // Shaken (-2) + Sickened (-2) = -4 all saves
      expect(penalties.allSavesPenalty).toBe(-4);
      expect(penalties.fortPenalty).toBe(-4);
      expect(penalties.damagePenalty).toBe(-2);
      expect(penalties.dexPenalty).toBe(-4);
      expect(penalties.speedMultiplier).toBe(0.5);
    });

    it('handles loseDexToAc flags for Blinded, Stunned, Flat-Footed, Cowering, Helpless, Pinned', () => {
      expect(calculateConditionPenalties(['blinded']).loseDexToAc).toBe(true);
      expect(calculateConditionPenalties(['blinded']).acPenalty).toBe(-2);
      expect(calculateConditionPenalties(['stunned']).loseDexToAc).toBe(true);
      expect(calculateConditionPenalties(['stunned']).acPenalty).toBe(-2);
      expect(calculateConditionPenalties(['flat_footed']).loseDexToAc).toBe(true);
      expect(calculateConditionPenalties(['cowering']).loseDexToAc).toBe(true);
      expect(calculateConditionPenalties(['cowering']).acPenalty).toBe(-2);
      expect(calculateConditionPenalties(['pinned']).loseDexToAc).toBe(true);
      expect(calculateConditionPenalties(['pinned']).acPenalty).toBe(-4);
      expect(calculateConditionPenalties(['helpless']).loseDexToAc).toBe(true);
    });

    it('calculates positional penalties for Prone', () => {
      const penalties = calculateConditionPenalties(['prone']);
      expect(penalties.meleeAttackPenalty).toBe(-4);
      expect(penalties.meleeAcPenalty).toBe(-4);
      expect(penalties.rangedAcPenalty).toBe(4);
    });

    it('calculates sensory penalties for Dazzled and Deafened', () => {
      const dazzled = calculateConditionPenalties(['dazzled']);
      expect(dazzled.attackPenalty).toBe(-1);
      expect(dazzled.searchPenalty).toBe(-1);
      expect(dazzled.spotPenalty).toBe(-1);

      const deafened = calculateConditionPenalties(['deafened']);
      expect(deafened.initiativePenalty).toBe(-4);
      expect(deafened.listenPenalty).toBe(-99);
    });
  });

  describe('getHealthStatus', () => {
    it('returns Healthy when HP is 100%', () => {
      const res = getHealthStatus(30, 30, 0, 0);
      expect(res.status).toBe('healthy');
      expect(res.percent).toBe(100);
      expect(res.isUnconsciousOrDead).toBe(false);
    });

    it('returns Injured when HP is between 50% and 99%', () => {
      const res = getHealthStatus(20, 30, 0, 0);
      expect(res.status).toBe('injured');
      expect(res.percent).toBe(67);
    });

    it('returns Bloodied when HP is less than 50%', () => {
      const res = getHealthStatus(10, 30, 0, 0);
      expect(res.status).toBe('bloodied');
      expect(res.percent).toBe(33);
    });

    it('returns Disabled when HP is exactly 0', () => {
      const res = getHealthStatus(0, 30, 0, 0);
      expect(res.status).toBe('disabled');
      expect(res.isUnconsciousOrDead).toBe(false);
    });

    it('returns Dying when HP is between -1 and -9', () => {
      const res = getHealthStatus(-4, 30, 0, 0);
      expect(res.status).toBe('dying');
      expect(res.isUnconsciousOrDead).toBe(true);
    });

    it('returns Dead when HP is -10 or less', () => {
      const res = getHealthStatus(-12, 30, 0, 0);
      expect(res.status).toBe('dead');
      expect(res.isUnconsciousOrDead).toBe(true);
    });

    it('detects Staggered and Unconscious from nonlethal damage', () => {
      // Staggered: nonlethal == currentHp
      const staggeredRes = getHealthStatus(20, 30, 0, 20);
      expect(staggeredRes.status).toBe('staggered');
      expect(staggeredRes.isUnconsciousOrDead).toBe(false);

      // Unconscious: nonlethal > currentHp
      const unconsciousRes = getHealthStatus(20, 30, 0, 25);
      expect(unconsciousRes.status).toBe('unconscious');
      expect(unconsciousRes.isUnconsciousOrDead).toBe(true);
    });
  });

  describe('applyDamage', () => {
    it('absorbs from Temp HP first before reducing current HP', () => {
      // 30 HP, 10 Temp HP, take 6 damage -> 30 HP, 4 Temp HP
      const res1 = applyDamage(30, 30, 10, 6, false);
      expect(res1.currentHp).toBe(30);
      expect(res1.tempHp).toBe(4);

      // 30 HP, 5 Temp HP, take 12 damage -> 23 HP, 0 Temp HP
      const res2 = applyDamage(30, 30, 5, 12, false);
      expect(res2.currentHp).toBe(23);
      expect(res2.tempHp).toBe(0);
    });

    it('adds nonlethal damage to nonlethal counter without lowering current HP', () => {
      const res = applyDamage(30, 30, 0, 8, true, 4);
      expect(res.currentHp).toBe(30);
      expect(res.nonlethalDamage).toBe(12);
    });
  });

  describe('applyHeal', () => {
    it('restores current HP up to max HP', () => {
      const res = applyHeal(15, 30, 0, 10);
      expect(res.currentHp).toBe(25);

      const resCapped = applyHeal(25, 30, 0, 20);
      expect(resCapped.currentHp).toBe(30);
    });

    it('simultaneously heals nonlethal damage', () => {
      const res = applyHeal(15, 30, 10, 8);
      expect(res.currentHp).toBe(23);
      expect(res.nonlethalDamage).toBe(2);
    });
  });

  describe('toggleCondition', () => {
    it('adds a condition if not present, removes if already present', () => {
      const c1 = toggleCondition([], 'shaken');
      expect(c1).toEqual(['shaken']);

      const c2 = toggleCondition(c1, 'fatigued');
      expect(c2).toEqual(['shaken', 'fatigued']);

      const c3 = toggleCondition(c2, 'SHAKEN');
      expect(c3).toEqual(['fatigued']);
    });
  });
});
