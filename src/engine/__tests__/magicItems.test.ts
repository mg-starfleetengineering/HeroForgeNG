import { describe, it, expect } from 'vitest';
import {
  WEAPON_SPECIAL_QUALITIES,
  ARMOR_SHIELD_SPECIAL_QUALITIES,
  getQualityById,
  calculateKeenThreat,
  hasKeenQuality,
  hasSpeedQuality,
  getWeaponSpecialDamage,
  getArmorSkillBonus,
  getFortificationSummary,
  calculateTotalItemCost,
  formatMagicItemName,
  createMagicWeaponData,
  createMagicArmorData
} from '../magicItems';
import { generateFullAttackSequence } from '../combat';
import { calculateTotalDR } from '../dr';
import { calculateTotalSR } from '../sr';
import { resolveArmor, resolveShield, resolveWeapon } from '../equipment';
import { CharacterState, WeaponData, CustomArmorData } from '../../types/character';

describe('Magic Item Special Qualities Engine (3.5e DMG)', () => {
  describe('Catalog & Lookups', () => {
    it('contains all core 3.5e weapon qualities', () => {
      const ids = WEAPON_SPECIAL_QUALITIES.map(q => q.id);
      expect(ids).toContain('flaming');
      expect(ids).toContain('frost');
      expect(ids).toContain('shock');
      expect(ids).toContain('keen');
      expect(ids).toContain('holy');
      expect(ids).toContain('speed');
      expect(ids).toContain('vicious');
      expect(ids).toContain('vorpal');
    });

    it('contains all core 3.5e armor and shield qualities', () => {
      const ids = ARMOR_SHIELD_SPECIAL_QUALITIES.map(q => q.id);
      expect(ids).toContain('fortification_light');
      expect(ids).toContain('fortification_moderate');
      expect(ids).toContain('fortification_heavy');
      expect(ids).toContain('shadow');
      expect(ids).toContain('improved_shadow');
      expect(ids).toContain('greater_shadow');
      expect(ids).toContain('silent_moves');
      expect(ids).toContain('improved_silent_moves');
      expect(ids).toContain('greater_silent_moves');
      expect(ids).toContain('invulnerability');
      expect(ids).toContain('spell_resistance_13');
      expect(ids).toContain('animated');
    });

    it('resolves alias IDs via getQualityById', () => {
      expect(getQualityById('shadow_improved')).toBeDefined();
      expect(getQualityById('shadow_improved')?.name).toBe('Improved Shadow');
      expect(getQualityById('shadow_greater')?.name).toBe('Greater Shadow');
    });

    it('getQualityById retrieves qualities by id', () => {
      const flaming = getQualityById('flaming');
      expect(flaming).toBeDefined();
      expect(flaming?.name).toBe('Flaming');
      expect(flaming?.damageBonus?.dice).toBe('1d6');
      expect(flaming?.damageBonus?.type).toBe('Fire');

      const fort = getQualityById('fortification_light');
      expect(fort).toBeDefined();
      expect(fort?.fortificationPercent).toBe(25);

      expect(getQualityById('non_existent_id')).toBeUndefined();
    });
  });

  describe('Keen Threat Range Doubling', () => {
    it('doubles threat range from 20 to 19-20 (threat: 19)', () => {
      expect(calculateKeenThreat(20)).toBe(19);
    });

    it('doubles threat range from 19-20 to 17-20 (threat: 17)', () => {
      expect(calculateKeenThreat(19)).toBe(17);
    });

    it('doubles threat range from 18-20 to 15-20 (threat: 15)', () => {
      expect(calculateKeenThreat(18)).toBe(15);
    });

    it('handles weapon with undefined or baseline threat', () => {
      expect(calculateKeenThreat(undefined)).toBe(19);
    });

    it('hasKeenQuality detects presence of keen', () => {
      expect(hasKeenQuality(['flaming', 'keen'])).toBe(true);
      expect(hasKeenQuality(['flaming', 'frost'])).toBe(false);
      expect(hasKeenQuality([])).toBe(false);
      expect(hasKeenQuality(undefined)).toBe(false);
    });
  });

  describe('Speed Extra Attack & Non-Stacking with Haste', () => {
    it('hasSpeedQuality detects presence of speed', () => {
      expect(hasSpeedQuality(['speed'])).toBe(true);
      expect(hasSpeedQuality(['flaming'])).toBe(false);
      expect(hasSpeedQuality(undefined)).toBe(false);
    });

    it('generateFullAttackSequence adds +1 extra attack at highest BAB with Speed', () => {
      // BAB 6 -> base sequence +6/+1, with Speed -> +6/+6/+1
      const seq = generateFullAttackSequence(6, 0, false, false, false, true);
      expect(seq).toBe('+6/+6/+1');
    });

    it('generateFullAttackSequence does not stack Haste and Speed extra attacks (3.5e rules)', () => {
      // BAB 6 with Haste alone (+1 tactical attack bonus): 1 extra attack -> +7/+7/+2
      const seqHaste = generateFullAttackSequence(6, 1, true, false, false, false);
      expect(seqHaste).toBe('+7/+7/+2');

      // BAB 6 with Haste AND Speed: Still only 1 extra attack -> +7/+7/+2
      const seqBoth = generateFullAttackSequence(6, 1, true, false, false, true);
      expect(seqBoth).toBe('+7/+7/+2');
    });

    it('Speed stacks with Flurry of Blows', () => {
      // BAB 6, flurry active (-2 net attack penalty, +1 extra attack), speed active (+1 extra attack)
      // Sequence: 3 attacks at +4, 1 iterative at -1 -> +4/+4/+4/-1
      const seq = generateFullAttackSequence(6, -2, false, true, false, true);
      expect(seq).toBe('+4/+4/+4/-1');
    });
  });

  describe('Special Damage Calculations', () => {
    it('returns empty result when no qualities provided', () => {
      const res = getWeaponSpecialDamage([]);
      expect(res.damageDiceString).toBe('');
      expect(res.damageDiceFormula).toBe('');
      expect(res.bonusList).toEqual([]);
      expect(res.summaryLabels).toEqual([]);
    });

    it('compiles single elemental damage quality (Flaming +1d6 Fire)', () => {
      const res = getWeaponSpecialDamage(['flaming']);
      expect(res.damageDiceString).toBe(' + 1d6 Fire');
      expect(res.damageDiceFormula).toBe('+1d6');
      expect(res.bonusList).toHaveLength(1);
      expect(res.summaryLabels).toEqual(['+1d6 Fire']);
    });

    it('compiles multiple qualities including conditional Holy damage', () => {
      const res = getWeaponSpecialDamage(['flaming', 'frost', 'shock', 'holy']);
      expect(res.damageDiceString).toBe(' + 1d6 Fire + 1d6 Cold + 1d6 Electricity + 2d6 Holy (vs Evil)');
      expect(res.damageDiceFormula).toBe('+1d6+1d6+1d6+2d6');
      expect(res.bonusList).toHaveLength(4);
      expect(res.summaryLabels).toEqual(['+1d6 Fire', '+1d6 Cold', '+1d6 Electricity', '+2d6 Holy']);
    });

    it('ignores non-damage qualities like Keen or Speed', () => {
      const res = getWeaponSpecialDamage(['keen', 'speed', 'flaming']);
      expect(res.damageDiceString).toBe(' + 1d6 Fire');
      expect(res.damageDiceFormula).toBe('+1d6');
      expect(res.bonusList).toHaveLength(1);
    });
  });

  describe('Armor Skill Bonuses (Shadow & Silent Moves)', () => {
    it('calculates competence bonus to Hide from Shadow qualities', () => {
      expect(getArmorSkillBonus(['shadow'], [], 'Hide')).toBe(5);
      expect(getArmorSkillBonus(['shadow_improved'], [], 'Hide')).toBe(10);
      expect(getArmorSkillBonus(['shadow_greater'], [], 'Hide')).toBe(15);
    });

    it('calculates competence bonus to Move Silently from Silent Moves', () => {
      expect(getArmorSkillBonus(['silent_moves'], [], 'Move Silently')).toBe(5);
      expect(getArmorSkillBonus(['silent_moves_improved'], [], 'Move Silently')).toBe(10);
      expect(getArmorSkillBonus(['silent_moves_greater'], [], 'Move Silently')).toBe(15);
    });

    it('does not stack bonuses of the same skill (takes maximum per 3.5e competence bonus rules)', () => {
      // Armor has shadow (+5) and shield has shadow_improved (+10) -> max 10
      expect(getArmorSkillBonus(['shadow'], ['shadow_improved'], 'Hide')).toBe(10);
      // Both have regular shadow (+5) -> 5, not 10
      expect(getArmorSkillBonus(['shadow'], ['shadow'], 'Hide')).toBe(5);
    });

    it('returns 0 for unaffected skills', () => {
      expect(getArmorSkillBonus(['shadow', 'silent_moves'], [], 'Jump')).toBe(0);
      expect(getArmorSkillBonus(['shadow', 'silent_moves'], [], 'Spot')).toBe(0);
    });
  });

  describe('Fortification Summary', () => {
    it('returns hasFortification: false when no fortification quality is equipped', () => {
      const res = getFortificationSummary(['shadow'], ['silent_moves']);
      expect(res.hasFortification).toBe(false);
      expect(res.percentage).toBe(0);
    });

    it('correctly parses Light, Moderate, and Heavy fortification', () => {
      const light = getFortificationSummary(['fortification_light'], []);
      expect(light.hasFortification).toBe(true);
      expect(light.percentage).toBe(25);
      expect(light.tier).toBe('light');
      expect(light.source).toBe('Armor (Fortification (Light 25%))');

      const mod = getFortificationSummary([], ['fortification_moderate']);
      expect(mod.hasFortification).toBe(true);
      expect(mod.percentage).toBe(75);
      expect(mod.tier).toBe('moderate');
      expect(mod.source).toBe('Shield (Fortification (Moderate 75%))');

      const heavy = getFortificationSummary(['fortification_heavy'], []);
      expect(heavy.hasFortification).toBe(true);
      expect(heavy.percentage).toBe(100);
      expect(heavy.tier).toBe('heavy');
    });

    it('takes the highest fortification percentage if multiple are present', () => {
      const res = getFortificationSummary(['fortification_light'], ['fortification_moderate']);
      expect(res.hasFortification).toBe(true);
      expect(res.percentage).toBe(75);
      expect(res.tier).toBe('moderate');
    });
  });

  describe('Total Item Cost (3.5e DMG Formulas)', () => {
    it('calculates +1 Longsword cost: 15 base + 300 MWK + 2,000 (+1^2 * 2000) = 2,315 gp', () => {
      const res = calculateTotalItemCost(15, 1, [], 'weapon');
      expect(res.totalBonus).toBe(1);
      expect(res.totalGp).toBe(2315);
    });

    it('calculates +1 Flaming Longsword cost (+2 equivalent): 15 + 300 + 8,000 = 8,315 gp', () => {
      const res = calculateTotalItemCost(15, 1, ['flaming'], 'weapon');
      expect(res.totalBonus).toBe(2);
      expect(res.totalGp).toBe(8315);
    });

    it('calculates +1 Fortification Light Chain Shirt (+2 equivalent): 100 + 150 + 4,000 = 4,250 gp', () => {
      const res = calculateTotalItemCost(100, 1, ['fortification_light'], 'armor');
      expect(res.totalBonus).toBe(2);
      expect(res.totalGp).toBe(4250);
    });

    it('adds flat GP cost qualities (e.g. Shadow +3,750 gp)', () => {
      // +1 Chain Shirt with Shadow: +1 equiv (1,000 gp) + 100 base + 150 MWK + 3,750 gp flat = 5,000 gp
      const res = calculateTotalItemCost(100, 1, ['shadow'], 'armor');
      expect(res.totalBonus).toBe(1);
      expect(res.totalGp).toBe(5000);
    });
  });

  describe('DR & SR Integration from Armor Qualities', () => {
    it('armor with invulnerability grants DR 5/magic', () => {
      const char: Partial<CharacterState> = {
        equipment: {
          armor: 'fullplate',
          armorEnhancement: 1,
          armorQualities: ['invulnerability']
        } as any,
        levelProgression: [{ level: 1, primaryClass: 'Fighter', hpRoll: 10 }]
      };

      const dr = calculateTotalDR(char as CharacterState);
      expect(dr.hasDR).toBe(true);
      expect(dr.sources.some(s => s.bypass === 'Magic' && s.value === 5)).toBe(true);
      expect(dr.fullDRString).toContain('5/Magic');
    });

    it('armor with spell_resistance_15 grants SR 15', () => {
      const char: Partial<CharacterState> = {
        equipment: {
          armor: 'breastplate',
          armorEnhancement: 2,
          armorQualities: ['spell_resistance_15']
        } as any,
        levelProgression: [{ level: 1, primaryClass: 'Fighter', hpRoll: 10 }]
      };

      const sr = calculateTotalSR(char as CharacterState);
      expect(sr.hasSR).toBe(true);
      expect(sr.bestSR).toBe(15);
      expect(sr.bestSRString).toBe('SR 15');
    });
  });

  describe('Magic Item Naming & Factory Functions', () => {
    it('formatMagicItemName produces standard 3.5e naming format', () => {
      expect(formatMagicItemName('Longsword', 1, ['flaming'])).toBe('+1 Flaming Longsword');
      expect(formatMagicItemName('Longsword', 2, ['flaming', 'frost'])).toBe('+2 Flaming Frost Longsword');
      expect(formatMagicItemName('Chain Shirt', 1, ['shadow'])).toBe('+1 Shadow Chain Shirt');
      expect(formatMagicItemName('Heavy Shield', 0, ['animated'])).toBe('Animated Heavy Shield');
      expect(formatMagicItemName('Longsword', 0, [])).toBe('Longsword');
    });

    it('formatMagicItemName cleans up previous enhancement prefix and duplicate quality names', () => {
      expect(formatMagicItemName('+1 Longsword', 2, ['keen'])).toBe('+2 Keen Longsword');
      expect(formatMagicItemName('+1 Flaming Longsword', 1, ['flaming'])).toBe('+1 Flaming Longsword');
    });

    it('createMagicWeaponData instantiates custom weapon data with appropriate stats and cost', () => {
      const baseWpn: WeaponData = {
        id: 'longsword',
        name: 'Longsword',
        damageM: '1d8',
        threat: 19,
        critMultiplier: 2,
        cost: '15 gp',
        weight: 4,
        size: 'Medium',
        category: 'Martial Weapons',
        type: 'Slashing'
      };

      const magicWpn = createMagicWeaponData(baseWpn, 1, ['flaming']);
      expect(magicWpn.name).toBe('+1 Flaming Longsword');
      expect(magicWpn.enhancementBonus).toBe(1);
      expect(magicWpn.specialQualities).toEqual(['flaming']);
      expect(magicWpn.baseWeaponId).toBe('longsword');
      expect(magicWpn.damageM).toBe('1d8');
      expect(magicWpn.cost).toContain('8,315 gp');
    });

    it('createMagicArmorData instantiates custom armor data with appropriate stats and cost', () => {
      const baseArmor = {
        name: 'Chain Shirt',
        acBonus: 4,
        maxDex: 4,
        checkPenalty: -2,
        type: 'light' as const
      };

      const magicArmor = createMagicArmorData(baseArmor, 2, ['shadow']);
      expect(magicArmor.name).toBe('+2 Shadow Chain Shirt');
      expect(magicArmor.enhancementBonus).toBe(2);
      expect(magicArmor.specialQualities).toEqual(['shadow']);
      expect(magicArmor.acBonus).toBe(4);
      expect(magicArmor.type).toBe('light');
      expect(magicArmor.cost).toContain('8,000 gp');
    });
  });

  describe('Persistent Custom Item Resolution', () => {
    it('resolveWeapon preserves enhancementBonus and specialQualities on custom weapons', () => {
      const customWeapons: WeaponData[] = [
        {
          id: 'custom_wpn_1',
          name: '+1 Flaming Longsword',
          damageM: '1d8',
          threat: 19,
          critMultiplier: 2,
          enhancementBonus: 1,
          specialQualities: ['flaming'],
          baseWeaponId: 'longsword',
          category: 'Martial Weapons',
          size: 'Medium',
          weight: 4,
          type: 'Slashing'
        }
      ];

      const resolved = resolveWeapon('+1 Flaming Longsword', customWeapons, []);
      expect(resolved.name).toBe('+1 Flaming Longsword');
      expect(resolved.enhancementBonus).toBe(1);
      expect(resolved.specialQualities).toEqual(['flaming']);
    });

    it('resolveArmor and resolveShield preserve enhancementBonus and specialQualities on custom armor', () => {
      const customArmors: CustomArmorData[] = [
        {
          id: 'custom_armor_1',
          name: '+2 Shadow Chain Shirt',
          acBonus: 4,
          maxDex: 4,
          armorCheckPenalty: -2,
          type: 'light',
          enhancementBonus: 2,
          specialQualities: ['shadow']
        },
        {
          id: 'custom_shield_1',
          name: '+1 Fortification Heavy Shield',
          acBonus: 2,
          armorCheckPenalty: -2,
          type: 'shield',
          enhancementBonus: 1,
          specialQualities: ['fortification_light']
        }
      ];

      const armor = resolveArmor('+2 Shadow Chain Shirt', customArmors);
      expect(armor.name).toBe('+2 Shadow Chain Shirt');
      expect(armor.enhancementBonus).toBe(2);
      expect(armor.specialQualities).toEqual(['shadow']);

      const shield = resolveShield('+1 Fortification Heavy Shield', customArmors);
      expect(shield.name).toBe('+1 Fortification Heavy Shield');
      expect(shield.enhancementBonus).toBe(1);
      expect(shield.specialQualities).toEqual(['fortification_light']);
    });
  });
});
