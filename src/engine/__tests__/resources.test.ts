import { describe, it, expect } from 'vitest';
import { CharacterState } from '../../types/character';
import {
  getClassLevel,
  countFeats,
  calculateBarbarianRageUses,
  calculateTurnUndeadUses,
  calculateSmiteEvilUses,
  calculateLayOnHandsPool,
  calculateBardicMusicUses,
  calculateWildShapeUses,
  calculateStunningFistUses,
  calculateDailyResources,
  performLongRest,
  useResource,
  setResourceUsed,
  resetResource
} from '../resources';

describe('Daily Class Resources & Long Rest Engine Tests', () => {
  const baseChar: CharacterState = {
    name: 'Test Hero',
    player: 'Player 1',
    alignment: 'Neutral Good',
    deity: 'Pelor',
    pointBuyTarget: '32',
    baseStats: { str: 14, dex: 12, con: 14, int: 10, wis: 12, cha: 16 },
    enhancementMods: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    levelBumps: {},
    selectedRace: 'Human',
    isGestalt: false,
    levelProgression: [
      { level: 1, primaryClass: 'Fighter', secondaryClass: '', hpRoll: 10 }
    ],
    skillRanks: {},
    selectedFeats: [],
    equipment: {
      armor: 'chainshirt',
      armorEnhancement: 0,
      shield: 'none',
      shieldEnhancement: 0,
      deflection: 0,
      natural: 0,
      dodge: 0,
      primaryWeapon: 'Longsword'
    }
  };

  describe('Class Level and Feat Helpers', () => {
    it('calculates class levels across single, multiclass, and gestalt setups', () => {
      const multiclassChar: CharacterState = {
        ...baseChar,
        levelProgression: [
          { level: 1, primaryClass: 'Barbarian', hpRoll: 12 },
          { level: 2, primaryClass: 'Barbarian', hpRoll: 8 },
          { level: 3, primaryClass: 'Fighter', hpRoll: 10 },
          { level: 4, primaryClass: 'Paladin', secondaryClass: 'Barbarian', hpRoll: 10 }
        ]
      };

      expect(getClassLevel(multiclassChar, 'barbarian')).toBe(3);
      expect(getClassLevel(multiclassChar, 'fighter')).toBe(1);
      expect(getClassLevel(multiclassChar, 'paladin')).toBe(1);
      expect(getClassLevel(multiclassChar, 'wizard')).toBe(0);
    });

    it('counts feats with case-insensitive and prefix matching', () => {
      const featChar: CharacterState = {
        ...baseChar,
        selectedFeats: [
          'Power Attack',
          'Extra Rage',
          'Extra Turning',
          'Extra Turning',
          'Extra Music'
        ]
      };

      expect(countFeats(featChar, 'Power Attack')).toBe(1);
      expect(countFeats(featChar, 'extra rage')).toBe(1);
      expect(countFeats(featChar, 'Extra Turning')).toBe(2);
      expect(countFeats(featChar, 'Extra Smiting')).toBe(0);
    });
  });

  describe('Barbarian Rage Progression & Feats', () => {
    it('returns 0 for non-barbarians', () => {
      expect(calculateBarbarianRageUses(baseChar)).toBe(0);
    });

    it('calculates standard 3.5e progression: 1 at 1st, 2 at 4th, 3 at 8th, 4 at 12th, 5 at 16th, 6 at 20th', () => {
      const createBarb = (lvl: number): CharacterState => ({
        ...baseChar,
        levelProgression: Array.from({ length: lvl }, (_, i) => ({
          level: i + 1,
          primaryClass: 'Barbarian',
          hpRoll: 12
        }))
      });

      expect(calculateBarbarianRageUses(createBarb(1))).toBe(1);
      expect(calculateBarbarianRageUses(createBarb(3))).toBe(1);
      expect(calculateBarbarianRageUses(createBarb(4))).toBe(2);
      expect(calculateBarbarianRageUses(createBarb(7))).toBe(2);
      expect(calculateBarbarianRageUses(createBarb(8))).toBe(3);
      expect(calculateBarbarianRageUses(createBarb(11))).toBe(3);
      expect(calculateBarbarianRageUses(createBarb(12))).toBe(4);
      expect(calculateBarbarianRageUses(createBarb(15))).toBe(4);
      expect(calculateBarbarianRageUses(createBarb(16))).toBe(5);
      expect(calculateBarbarianRageUses(createBarb(19))).toBe(5);
      expect(calculateBarbarianRageUses(createBarb(20))).toBe(6);
    });

    it('applies Extra Rage feats (+2 per selection)', () => {
      const barbWithFeats: CharacterState = {
        ...baseChar,
        levelProgression: [
          { level: 1, primaryClass: 'Barbarian', hpRoll: 12 },
          { level: 2, primaryClass: 'Barbarian', hpRoll: 8 },
          { level: 3, primaryClass: 'Barbarian', hpRoll: 8 },
          { level: 4, primaryClass: 'Barbarian', hpRoll: 8 }
        ],
        selectedFeats: ['Extra Rage', 'Extra Rage']
      };

      // Base 2 at lvl 4 + 4 from 2x Extra Rage = 6
      expect(calculateBarbarianRageUses(barbWithFeats)).toBe(6);
    });

    it('renders Barbarian Whirling Frenzy track when barbarianVariant is whirling_frenzy', () => {
      const frenzyBarb: CharacterState = {
        ...baseChar,
        levelProgression: [
          { level: 1, primaryClass: 'Barbarian', hpRoll: 12 },
          { level: 2, primaryClass: 'Barbarian', hpRoll: 8 }
        ],
        barbarianVariant: 'whirling_frenzy'
      };

      const tracks = calculateDailyResources(frenzyBarb, 0);
      const frenzyTrack = tracks.find(t => t.id === 'barbarian_rage');
      expect(frenzyTrack).toBeDefined();
      expect(frenzyTrack?.name).toBe('Barbarian Whirling Frenzy');
      expect(frenzyTrack?.icon).toBe('fa-solid fa-tornado');
      expect(frenzyTrack?.source).toContain('Whirling Frenzy');
    });
  });

  describe('Turn Undead Progression & Feats', () => {
    it('calculates 3 + Cha mod for Clerics (1st level)', () => {
      const clericChar: CharacterState = {
        ...baseChar,
        levelProgression: [{ level: 1, primaryClass: 'Cleric', hpRoll: 8 }]
      };

      // Cha mod +3 -> 3 + 3 = 6
      expect(calculateTurnUndeadUses(clericChar, 3)).toBe(6);
      // Cha mod -1 -> 3 + (-1) = 2
      expect(calculateTurnUndeadUses(clericChar, -1)).toBe(2);
      // Cha mod -4 -> 3 - 4 = -1 -> clamped to 0
      expect(calculateTurnUndeadUses(clericChar, -4)).toBe(0);
    });

    it('grants Turn Undead to Paladins at 4th level, not 1st-3rd', () => {
      const paladin3: CharacterState = {
        ...baseChar,
        levelProgression: Array.from({ length: 3 }, (_, i) => ({
          level: i + 1,
          primaryClass: 'Paladin',
          hpRoll: 10
        }))
      };
      const paladin4: CharacterState = {
        ...baseChar,
        levelProgression: Array.from({ length: 4 }, (_, i) => ({
          level: i + 1,
          primaryClass: 'Paladin',
          hpRoll: 10
        }))
      };

      expect(calculateTurnUndeadUses(paladin3, 2)).toBe(0);
      expect(calculateTurnUndeadUses(paladin4, 2)).toBe(5); // 3 + 2 = 5
    });

    it('adds +4 uses per Extra Turning feat', () => {
      const clericWithFeats: CharacterState = {
        ...baseChar,
        levelProgression: [{ level: 1, primaryClass: 'Cleric', hpRoll: 8 }],
        selectedFeats: ['Extra Turning', 'Extra Turning']
      };

      // Base 3 + 2 (cha mod) + 8 = 13
      expect(calculateTurnUndeadUses(clericWithFeats, 2)).toBe(13);
    });
  });

  describe('Paladin Smite Evil Progression & Feats', () => {
    it('calculates standard 3.5e progression: 1/day + 1 per 5 levels', () => {
      const createPaladin = (lvl: number): CharacterState => ({
        ...baseChar,
        levelProgression: Array.from({ length: lvl }, (_, i) => ({
          level: i + 1,
          primaryClass: 'Paladin',
          hpRoll: 10
        }))
      });

      expect(calculateSmiteEvilUses(createPaladin(1))).toBe(1);
      expect(calculateSmiteEvilUses(createPaladin(4))).toBe(1);
      expect(calculateSmiteEvilUses(createPaladin(5))).toBe(2);
      expect(calculateSmiteEvilUses(createPaladin(9))).toBe(2);
      expect(calculateSmiteEvilUses(createPaladin(10))).toBe(3);
      expect(calculateSmiteEvilUses(createPaladin(14))).toBe(3);
      expect(calculateSmiteEvilUses(createPaladin(15))).toBe(4);
      expect(calculateSmiteEvilUses(createPaladin(19))).toBe(4);
      expect(calculateSmiteEvilUses(createPaladin(20))).toBe(5);
    });

    it('adds +1 Smite Evil from Destruction Domain and +2 from Extra Smiting feat', () => {
      const paladinWithExtras: CharacterState = {
        ...baseChar,
        levelProgression: Array.from({ length: 5 }, (_, i) => ({
          level: i + 1,
          primaryClass: 'Paladin',
          hpRoll: 10
        })),
        selectedDomains: ['Destruction'],
        selectedFeats: ['Extra Smiting']
      };

      // Level 5 base (2) + Destruction domain (1) + Extra Smiting (2) = 5
      expect(calculateSmiteEvilUses(paladinWithExtras)).toBe(5);
    });
  });

  describe('Paladin Lay on Hands Pool', () => {
    it('returns 0 for Paladin level 1', () => {
      const paladin1: CharacterState = {
        ...baseChar,
        levelProgression: [{ level: 1, primaryClass: 'Paladin', hpRoll: 10 }]
      };
      expect(calculateLayOnHandsPool(paladin1, 3)).toBe(0);
    });

    it('calculates Paladin Level × Cha mod for Paladins level 2+', () => {
      const paladin5: CharacterState = {
        ...baseChar,
        levelProgression: Array.from({ length: 5 }, (_, i) => ({
          level: i + 1,
          primaryClass: 'Paladin',
          hpRoll: 10
        }))
      };

      // 5 * 3 = 15 HP
      expect(calculateLayOnHandsPool(paladin5, 3)).toBe(15);
      // 5 * 4 = 20 HP
      expect(calculateLayOnHandsPool(paladin5, 4)).toBe(20);
    });

    it('returns 0 if Cha mod is 0 or negative', () => {
      const paladin5: CharacterState = {
        ...baseChar,
        levelProgression: Array.from({ length: 5 }, (_, i) => ({
          level: i + 1,
          primaryClass: 'Paladin',
          hpRoll: 10
        }))
      };

      expect(calculateLayOnHandsPool(paladin5, 0)).toBe(0);
      expect(calculateLayOnHandsPool(paladin5, -2)).toBe(0);
    });
  });

  describe('Bardic Music Progression & Feats', () => {
    it('calculates 1 use per Bard level', () => {
      const createBard = (lvl: number): CharacterState => ({
        ...baseChar,
        levelProgression: Array.from({ length: lvl }, (_, i) => ({
          level: i + 1,
          primaryClass: 'Bard',
          hpRoll: 6
        }))
      });

      expect(calculateBardicMusicUses(createBard(1))).toBe(1);
      expect(calculateBardicMusicUses(createBard(5))).toBe(5);
      expect(calculateBardicMusicUses(createBard(12))).toBe(12);
    });

    it('adds +4 uses per Extra Music feat', () => {
      const bardWithFeat: CharacterState = {
        ...baseChar,
        levelProgression: Array.from({ length: 3 }, (_, i) => ({
          level: i + 1,
          primaryClass: 'Bard',
          hpRoll: 6
        })),
        selectedFeats: ['Extra Music']
      };

      // 3 + 4 = 7
      expect(calculateBardicMusicUses(bardWithFeat)).toBe(7);
    });
  });

  describe('Wild Shape Daily Usages', () => {
    it('returns 0 for Druid levels below 5', () => {
      const druid4: CharacterState = {
        ...baseChar,
        levelProgression: Array.from({ length: 4 }, (_, i) => ({
          level: i + 1,
          primaryClass: 'Druid',
          hpRoll: 8
        }))
      };
      const ws = calculateWildShapeUses(druid4);
      expect(ws.hasWildShape).toBe(false);
      expect(ws.standardUses).toBe(0);
    });

    it('calculates 3.5e standard progression (1 at 5th, 2 at 6th, 3 at 7th, 4 at 10th, 5 at 14th, 6 at 18th)', () => {
      const createDruid = (lvl: number): CharacterState => ({
        ...baseChar,
        levelProgression: Array.from({ length: lvl }, (_, i) => ({
          level: i + 1,
          primaryClass: 'Druid',
          hpRoll: 8
        }))
      });

      expect(calculateWildShapeUses(createDruid(5)).standardUses).toBe(1);
      expect(calculateWildShapeUses(createDruid(6)).standardUses).toBe(2);
      expect(calculateWildShapeUses(createDruid(7)).standardUses).toBe(3);
      expect(calculateWildShapeUses(createDruid(10)).standardUses).toBe(4);
      expect(calculateWildShapeUses(createDruid(14)).standardUses).toBe(5);
      expect(calculateWildShapeUses(createDruid(18)).standardUses).toBe(6);
    });

    it('includes Elemental Wild Shape uses at 16th+', () => {
      const createDruid = (lvl: number): CharacterState => ({
        ...baseChar,
        levelProgression: Array.from({ length: lvl }, (_, i) => ({
          level: i + 1,
          primaryClass: 'Druid',
          hpRoll: 8
        }))
      });

      expect(calculateWildShapeUses(createDruid(16)).elementalUses).toBe(1);
      expect(calculateWildShapeUses(createDruid(18)).elementalUses).toBe(2);
      expect(calculateWildShapeUses(createDruid(20)).elementalUses).toBe(3);
    });

    it('adds +2 uses per Extra Wild Shape feat', () => {
      const druidWithFeat: CharacterState = {
        ...baseChar,
        levelProgression: Array.from({ length: 5 }, (_, i) => ({
          level: i + 1,
          primaryClass: 'Druid',
          hpRoll: 8
        })),
        selectedFeats: ['Extra Wild Shape']
      };

      // Base 1 at lvl 5 + 2 = 3
      expect(calculateWildShapeUses(druidWithFeat).standardUses).toBe(3);
    });
  });

  describe('Stunning Fist & Custom Resources', () => {
    it('calculates Monk Stunning Fist (1/day per monk level)', () => {
      const monk5: CharacterState = {
        ...baseChar,
        levelProgression: Array.from({ length: 5 }, (_, i) => ({
          level: i + 1,
          primaryClass: 'Monk',
          hpRoll: 8
        }))
      };
      expect(calculateStunningFistUses(monk5)).toBe(5);
    });

    it('calculates Stunning Fist feat for non-monks (1/day per 4 character levels)', () => {
      const fighter8WithFeat: CharacterState = {
        ...baseChar,
        levelProgression: Array.from({ length: 8 }, (_, i) => ({
          level: i + 1,
          primaryClass: 'Fighter',
          hpRoll: 10
        })),
        selectedFeats: ['Stunning Fist']
      };
      expect(calculateStunningFistUses(fighter8WithFeat)).toBe(2);
    });

    it('generates daily resource tracks including custom user definitions', () => {
      const customChar: CharacterState = {
        ...baseChar,
        levelProgression: [
          { level: 1, primaryClass: 'Barbarian', hpRoll: 12 },
          { level: 2, primaryClass: 'Barbarian', hpRoll: 8 },
          { level: 3, primaryClass: 'Barbarian', hpRoll: 8 },
          { level: 4, primaryClass: 'Barbarian', hpRoll: 8 }
        ],
        customResources: [
          {
            id: 'wand_fireballs',
            name: 'Wand of Fireballs',
            maxUses: 50,
            unit: 'charges',
            description: '5d6 Fireball 50 charges.'
          }
        ],
        resourceUsages: {
          barbarian_rage: 1,
          wand_fireballs: 5
        }
      };

      const tracks = calculateDailyResources(customChar, 0);
      expect(tracks.length).toBe(2);

      const rageTrack = tracks.find(t => t.id === 'barbarian_rage')!;
      expect(rageTrack).toBeDefined();
      expect(rageTrack.maxUses).toBe(2);
      expect(rageTrack.usedUses).toBe(1);

      const wandTrack = tracks.find(t => t.id === 'wand_fireballs')!;
      expect(wandTrack).toBeDefined();
      expect(wandTrack.maxUses).toBe(50);
      expect(wandTrack.usedUses).toBe(5);
    });
  });

  describe('Resource Usage & Mutation Helpers', () => {
    it('clamps useResource between 0 and maxUses', () => {
      let usages: Record<string, number> = {};
      usages = useResource(usages, 'rage', 1, 3);
      expect(usages['rage']).toBe(1);

      usages = useResource(usages, 'rage', 5, 3);
      expect(usages['rage']).toBe(3); // clamped at max

      usages = useResource(usages, 'rage', -10, 3);
      expect(usages['rage']).toBe(0); // clamped at 0
    });

    it('sets resource usage directly with clamping', () => {
      let usages: Record<string, number> = {};
      usages = setResourceUsed(usages, 'smite', 2, 4);
      expect(usages['smite']).toBe(2);

      usages = setResourceUsed(usages, 'smite', 10, 4);
      expect(usages['smite']).toBe(4);
    });

    it('resets a specific resource to 0 used', () => {
      const usages = { rage: 2, smite: 3 };
      const updated = resetResource(usages, 'rage');
      expect(updated['rage']).toBe(0);
      expect(updated['smite']).toBe(3);
    });
  });

  describe('8-Hour Long Rest Engine', () => {
    it('restores full HP, clears temp HP and nonlethal damage, resets all resource usages, and clears fatigue/shaken conditions', () => {
      const batteredChar: CharacterState = {
        ...baseChar,
        currentHp: 5,
        tempHp: 10,
        nonlethalDamage: 8,
        activeConditions: ['fatigued', 'shaken', 'exhausted', 'dazed', 'blinded'],
        resourceUsages: {
          barbarian_rage: 2,
          turn_undead: 4,
          smite_evil: 1
        },
        tacticalCombat: {
          powerAttack: 2,
          combatExpertise: 0,
          fightingDefensively: false,
          haste: false,
          rage: true,
          whirlingFrenzy: false,
          flurryOfBlows: false
        }
      };

      const restResult = performLongRest(batteredChar, 45);

      expect(restResult.currentHp).toBe(45);
      expect(restResult.tempHp).toBe(0);
      expect(restResult.nonlethalDamage).toBe(0);
      expect(restResult.resourceUsages).toEqual({});
      // Fatigue, shaken, exhausted, dazed are cleared; persistent condition 'blinded' remains
      expect(restResult.activeConditions).toEqual(['blinded']);
      // Rage is turned off
      expect(restResult.tacticalCombat?.rage).toBe(false);
    });

    it('should reset all prepared spell slots isCast state to false and clear expendedSpellSlots', () => {
      const casterWithCastSpells: any = {
        preparedSpells: [
          { id: 'wizard_lvl1_slot_0', spellId: 'magic_missile', isCast: true },
          { id: 'wizard_lvl1_slot_1', spellId: 'shield', isCast: false },
          { id: 'cleric_lvl1_domain_0', spellId: 'magic_weapon', isCast: true, isDomain: true }
        ],
        expendedSpellSlots: {
          sorcerer_lvl1: 3,
          cleric_lvl2: 1,
          bard_lvl0: 2
        }
      };

      const restResult = performLongRest(casterWithCastSpells, 30);
      expect(restResult.preparedSpells).toBeDefined();
      expect(restResult.preparedSpells?.every(slot => slot.isCast === false)).toBe(true);
      expect(restResult.expendedSpellSlots).toEqual({});
    });
  });
});

