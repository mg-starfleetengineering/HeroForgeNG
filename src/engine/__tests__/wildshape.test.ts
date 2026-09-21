import { describe, it, expect } from 'vitest';
import {
  getEffectiveDruidLevel,
  getWildShapeProgression,
  resolveActiveWildShape,
  calculateWildShapeAttacks,
  getSizeAttackModifier,
  getSizeAcModifier,
  customDataToFormData
} from '../wildshape';
import { CharacterState, WildShapeFormData, TacticalCombatState } from '../../types/character';
import { calculateTotalScore, getAbilityMod } from '../stats';
import { calculateGrappleModifier } from '../combat';
import wildShapeFormsJson from '../../data/wildshape_forms.json';

const formsData: WildShapeFormData[] = wildShapeFormsJson as WildShapeFormData[];

const createBaseCharacter = (overrides: Partial<CharacterState> = {}): CharacterState => ({
  name: 'Sylvia the Moon Druid',
  player: 'Shadow',
  alignment: 'Neutral Good',
  deity: 'Ehlonna',
  pointBuyTarget: '32',
  baseStats: { str: 10, dex: 12, con: 14, int: 12, wis: 18, cha: 10 },
  enhancementMods: { str: 0, dex: 0, con: 0, int: 0, wis: 2, cha: 0 },
  levelBumps: { 4: 'wis', 8: 'wis', 12: 'wis' },
  selectedRace: 'Human',
  isGestalt: false,
  levelProgression: [
    { level: 1, primaryClass: 'Druid', hpRoll: 8 },
    { level: 2, primaryClass: 'Druid', hpRoll: 5 },
    { level: 3, primaryClass: 'Druid', hpRoll: 5 },
    { level: 4, primaryClass: 'Druid', hpRoll: 5 },
    { level: 5, primaryClass: 'Druid', hpRoll: 5 },
    { level: 6, primaryClass: 'Druid', hpRoll: 5 },
    { level: 7, primaryClass: 'Druid', hpRoll: 5 },
    { level: 8, primaryClass: 'Druid', hpRoll: 5 }
  ],
  skillRanks: { 'Survival': 11, 'Knowledge (Nature)': 11 },
  selectedFeats: ['Natural Spell', 'Multiattack', 'Weapon Focus (Claw)'],
  equipment: {
    armor: 'leather',
    armorEnhancement: 1,
    shield: 'light_wooden',
    shieldEnhancement: 1,
    deflection: 1,
    natural: 0,
    dodge: 0,
    primaryWeapon: 'Scimitar'
  },
  wildShape: {
    isActive: false,
    selectedFormId: 'wolf'
  },
  ...overrides
});

const defaultTcState: TacticalCombatState = {
  powerAttack: 0,
  combatExpertise: 0,
  fightingDefensively: false,
  haste: false,
  rage: false,
  whirlingFrenzy: false,
  flurryOfBlows: false
};

describe('Wild Shape Engine & Form Manager', () => {
  describe('Druid Level & Progression Calculations', () => {
    it('calculates effective Druid level from level progression', () => {
      const druid8 = createBaseCharacter();
      expect(getEffectiveDruidLevel(druid8)).toBe(8);

      const multiclassChar = createBaseCharacter({
        levelProgression: [
          { level: 1, primaryClass: 'Druid', hpRoll: 8 },
          { level: 2, primaryClass: 'Druid', hpRoll: 5 },
          { level: 3, primaryClass: 'Druid', hpRoll: 5 },
          { level: 4, primaryClass: 'Druid', hpRoll: 5 },
          { level: 5, primaryClass: 'Druid', hpRoll: 5 },
          { level: 6, primaryClass: 'Master of Many Forms', hpRoll: 6 },
          { level: 7, primaryClass: 'Master of Many Forms', hpRoll: 6 }
        ]
      });
      expect(getEffectiveDruidLevel(multiclassChar)).toBe(7);

      const nonDruid = createBaseCharacter({
        levelProgression: [
          { level: 1, primaryClass: 'Fighter', hpRoll: 10 },
          { level: 2, primaryClass: 'Wizard', hpRoll: 4 }
        ]
      });
      expect(getEffectiveDruidLevel(nonDruid)).toBe(0);
    });

    it('returns accurate Wild Shape progression details for various levels', () => {
      const prog4 = getWildShapeProgression(4);
      expect(prog4.hasWildShape).toBe(false);
      expect(prog4.dailyUses).toBe(0);

      const prog5 = getWildShapeProgression(5);
      expect(prog5.hasWildShape).toBe(true);
      expect(prog5.dailyUses).toBe(1);
      expect(prog5.allowedSizes).toEqual(['Small', 'Medium']);
      expect(prog5.allowedTypes).toEqual(['Animal']);

      const prog8 = getWildShapeProgression(8);
      expect(prog8.dailyUses).toBe(3);
      expect(prog8.allowedSizes).toContain('Large');

      const prog11 = getWildShapeProgression(11);
      expect(prog11.dailyUses).toBe(4);
      expect(prog11.allowedSizes).toContain('Tiny');

      const prog12 = getWildShapeProgression(12);
      expect(prog12.allowedTypes).toContain('Plant');

      const prog15 = getWildShapeProgression(15);
      expect(prog15.allowedSizes).toContain('Huge');

      const prog16 = getWildShapeProgression(16);
      expect(prog16.allowedTypes).toContain('Elemental');
      expect(prog16.elementalUses).toBe(1);

      const prog20 = getWildShapeProgression(20);
      expect(prog20.elementalUses).toBe(3);
    });
  });

  describe('Form Resolution', () => {
    it('returns null when Wild Shape is inactive', () => {
      const char = createBaseCharacter({
        wildShape: { isActive: false, selectedFormId: 'wolf' }
      });
      const resolved = resolveActiveWildShape(char, formsData);
      expect(resolved).toBeNull();
    });

    it('resolves standard form data by form ID when active', () => {
      const char = createBaseCharacter({
        wildShape: { isActive: true, selectedFormId: 'brown_bear' }
      });
      const resolved = resolveActiveWildShape(char, formsData);
      expect(resolved).not.toBeNull();
      expect(resolved?.name).toBe('Brown Bear');
      expect(resolved?.size).toBe('Large');
      expect(resolved?.str).toBe(27);
      expect(resolved?.dex).toBe(13);
      expect(resolved?.con).toBe(19);
      expect(resolved?.naturalArmor).toBe(5);
    });

    it('resolves custom form data when selectedFormId is custom', () => {
      const char = createBaseCharacter({
        wildShape: {
          isActive: true,
          selectedFormId: 'custom',
          customForm: {
            name: 'Shadow Chimera',
            category: 'custom',
            size: 'Large',
            creatureType: 'Magical Beast',
            minDruidLevel: 8,
            str: 24,
            dex: 16,
            con: 18,
            naturalArmor: 6,
            speedLand: 45,
            attack1Name: 'Bite',
            attack1Damage: '2d6',
            attack1IsPrimary: true,
            attack2Name: '2 Claws',
            attack2Damage: '1d8',
            attack2IsPrimary: false
          }
        }
      });
      const resolved = resolveActiveWildShape(char, formsData);
      expect(resolved).not.toBeNull();
      expect(resolved?.name).toBe('Shadow Chimera');
      expect(resolved?.str).toBe(24);
      expect(resolved?.naturalArmor).toBe(6);
      expect(resolved?.speed.land).toBe(45);
    });
  });

  describe('Physical Ability Scores Substitution & Mental Stats Retention', () => {
    it('substitutes Str, Dex, Con with form values while retaining mental stats (Int, Wis, Cha)', () => {
      const char = createBaseCharacter({
        wildShape: { isActive: true, selectedFormId: 'brown_bear' }
      });
      const form = resolveActiveWildShape(char, formsData)!;

      // Base mental stats before transformation
      const intScore = calculateTotalScore('int', char.baseStats, {}, char.levelBumps, char.enhancementMods, 8);
      const wisScore = calculateTotalScore('wis', char.baseStats, {}, char.levelBumps, char.enhancementMods, 8);
      const chaScore = calculateTotalScore('cha', char.baseStats, {}, char.levelBumps, char.enhancementMods, 8);

      expect(intScore).toBe(12);
      expect(wisScore).toBe(22); // 18 base + 2 enh + 2 bumps (lvl 4 & 8)
      expect(chaScore).toBe(10);

      // In Wild Shape, physical scores become the form's base values
      const transformedStr = form.str;
      const transformedDex = form.dex;
      const transformedCon = form.con;

      expect(transformedStr).toBe(27);
      expect(transformedDex).toBe(13);
      expect(transformedCon).toBe(19);

      expect(getAbilityMod(transformedStr)).toBe(8);
      expect(getAbilityMod(transformedDex)).toBe(1);
      expect(getAbilityMod(transformedCon)).toBe(4);
    });

    it('substitutes Fleshraker dinosaur physical stats accurately', () => {
      const char = createBaseCharacter({
        wildShape: { isActive: true, selectedFormId: 'fleshraker' }
      });
      const form = resolveActiveWildShape(char, formsData)!;

      expect(form.str).toBe(17);
      expect(form.dex).toBe(19);
      expect(form.con).toBe(15);
      expect(form.naturalArmor).toBe(3);
      expect(form.speed.land).toBe(50);
      expect(form.attacks.length).toBe(3); // Claws, Bite, Tail
    });
  });

  describe('Natural Attacks & Multiattack Routines', () => {
    it('calculates natural weapon attacks for Brown Bear with Large size modifier (-1 Atk)', () => {
      const char = createBaseCharacter({
        wildShape: { isActive: true, selectedFormId: 'brown_bear' }
      });
      const form = resolveActiveWildShape(char, formsData)!;
      const bab = 6; // Druid 8 BAB = +6
      const effectiveStrMod = getAbilityMod(form.str); // +8
      const effectiveDexMod = getAbilityMod(form.dex); // +1

      const attacks = calculateWildShapeAttacks(char, form, bab, effectiveStrMod, effectiveDexMod, defaultTcState);

      // Brown Bear has Claws (Primary 2x) and Bite (Secondary)
      expect(attacks.length).toBe(2);

      // Primary: Claws (2x)
      // Attack Bonus = BAB (6) + Str (8) + Size (-1 for Large) = +13
      const clawAtk = attacks[0];
      expect(clawAtk.label).toBe('Primary Natural');
      expect(clawAtk.attackBonus).toBe(13);
      expect(clawAtk.fullSeq).toBe('+13/+13');
      expect(clawAtk.damageStr).toBe('1d8+8');

      // Secondary: Bite
      // Since character has 'Multiattack' feat, secondary penalty is -2 (instead of -5)
      // Attack Bonus = BAB (6) + Str (8) + Size (-1) - 2 (Multiattack) = +11
      const biteAtk = attacks[1];
      expect(biteAtk.label).toBe('Secondary Natural');
      expect(biteAtk.attackBonus).toBe(11);
      expect(biteAtk.fullSeq).toBe('+11');
      // Secondary Bite gets 0.5x Str mod (8 * 0.5 = +4)
      expect(biteAtk.damageStr).toBe('2d6+4');
    });

    it('calculates Deinonychus raptor attacks with Pounce', () => {
      const char = createBaseCharacter({
        wildShape: { isActive: true, selectedFormId: 'deinonychus' }
      });
      const form = resolveActiveWildShape(char, formsData)!;
      const bab = 6;
      const strMod = getAbilityMod(form.str); // 19 Str -> +4
      const dexMod = getAbilityMod(form.dex); // 15 Dex -> +2

      const attacks = calculateWildShapeAttacks(char, form, bab, strMod, dexMod, defaultTcState);
      expect(attacks.length).toBe(3);

      // Talons: 2d6+4 (Primary, Med size = +0) -> Atk: 6 + 4 = +10
      expect(attacks[0].attackBonus).toBe(10);
      expect(attacks[0].damageStr).toBe('2d6+4');

      // Foreclaws: 2x 1d3+2 (Secondary, Multiattack -2) -> Atk: 6 + 4 - 2 = +8
      expect(attacks[1].attackBonus).toBe(8);
      expect(attacks[1].fullSeq).toBe('+8/+8');
      expect(attacks[1].damageStr).toBe('1d3+2');

      // Bite: 1d6+2 (Secondary, Multiattack -2) -> Atk: 6 + 4 - 2 = +8
      expect(attacks[2].attackBonus).toBe(8);
      expect(attacks[2].damageStr).toBe('1d6+2');
    });

    it('applies tactical modifiers like Haste and Power Attack to Wild Shape natural attacks', () => {
      const char = createBaseCharacter({
        wildShape: { isActive: true, selectedFormId: 'wolf' }
      });
      const form = resolveActiveWildShape(char, formsData)!;
      const bab = 6;
      const strMod = getAbilityMod(form.str); // 13 Str -> +1
      const dexMod = getAbilityMod(form.dex); // 15 Dex -> +2

      const tcWithHasteAndPA: TacticalCombatState = {
        ...defaultTcState,
        haste: true,
        powerAttack: 2
      };

      const attacks = calculateWildShapeAttacks(char, form, bab, strMod, dexMod, tcWithHasteAndPA);
      const bite = attacks[0];

      // Atk Bonus = BAB (6) + Str (1) + Haste (1) - PA (2) = +6
      expect(bite.attackBonus).toBe(6);
      // Haste adds 1 extra attack at highest bonus -> sequence "+6/+6"
      expect(bite.fullSeq).toBe('+6/+6');
      // Damage = 1d6 + 1.5x Str (1) + PA (2) = 1d6+3
      expect(bite.damageStr).toBe('1d6+3');
    });
  });

  describe('Grapple Calculations in Large and Huge Forms', () => {
    it('applies Large size grapple modifier (+4) and high Str in Brown Bear form', () => {
      const char = createBaseCharacter({
        wildShape: { isActive: true, selectedFormId: 'brown_bear' }
      });
      const form = resolveActiveWildShape(char, formsData)!;
      const bab = 6;
      const strMod = getAbilityMod(form.str); // +8

      const grapple = calculateGrappleModifier(char, bab, strMod, { size: form.size, name: form.name });
      // Grapple = BAB (6) + Str (8) + Large Size Mod (4) = +18
      expect(grapple.total).toBe(18);
      expect(grapple.sizeMod).toBe(4);
    });

    it('applies Huge size grapple modifier (+8) and 31 Str in Dire Bear form', () => {
      const char = createBaseCharacter({
        wildShape: { isActive: true, selectedFormId: 'dire_bear' }
      });
      const form = resolveActiveWildShape(char, formsData)!;
      const bab = 11; // Level 15 Druid BAB = +11
      const strMod = getAbilityMod(form.str); // 31 Str -> +10

      const grapple = calculateGrappleModifier(char, bab, strMod, { size: form.size, name: form.name });
      // Grapple = BAB (11) + Str (10) + Huge Size Mod (8) = +29
      expect(grapple.total).toBe(29);
      expect(grapple.sizeMod).toBe(8);
    });
  });

  describe('Size & AC Modifiers', () => {
    it('computes correct size modifiers for attack and AC across sizes', () => {
      expect(getSizeAttackModifier('Tiny')).toBe(2);
      expect(getSizeAttackModifier('Small')).toBe(1);
      expect(getSizeAttackModifier('Medium')).toBe(0);
      expect(getSizeAttackModifier('Large')).toBe(-1);
      expect(getSizeAttackModifier('Huge')).toBe(-2);

      expect(getSizeAcModifier('Large')).toBe(-1);
      expect(getSizeAcModifier('Huge')).toBe(-2);
      expect(getSizeAcModifier('Small')).toBe(1);
    });
  });

  describe('Natural Attack Damage Types', () => {
    it('accurately resolves damage types for catalog wildshape forms', () => {
      const char = createBaseCharacter({ wildShape: { isActive: true, selectedFormId: 'wolf' } });
      const wolfForm = formsData.find(f => f.id === 'wolf')!;
      const wolfAttacks = calculateWildShapeAttacks(char, wolfForm, 6, 1, 2, defaultTcState);

      // Wolf Bite -> Piercing/Slashing
      expect(wolfAttacks[0].type).toBe('Piercing/Slashing');

      const bearForm = formsData.find(f => f.id === 'black_bear')!;
      const bearAttacks = calculateWildShapeAttacks(char, bearForm, 6, 4, 1, defaultTcState);

      // Black Bear Claw -> Slashing, Bite -> Piercing/Slashing
      expect(bearAttacks[0].type).toBe('Slashing');
      expect(bearAttacks[1].type).toBe('Piercing/Slashing');
    });

    it('falls back to D&D 3.5e natural attack heuristic for custom attacks without explicit damageType', () => {
      const char = createBaseCharacter({ wildShape: { isActive: true, selectedFormId: 'custom' } });
      const testForm: WildShapeFormData = {
        id: 'test_beast',
        name: 'Test Beast',
        category: 'animal',
        size: 'Large',
        creatureType: 'Animal',
        minDruidLevel: 5,
        str: 18,
        dex: 12,
        con: 14,
        naturalArmor: 3,
        speed: { land: 40 },
        attacks: [
          { name: 'Hoof', damage: '1d6', isPrimary: true },
          { name: 'Tail Slap', damage: '1d8', isPrimary: false },
          { name: 'Sting', damage: '1d4', isPrimary: false },
          { name: 'Gore', damage: '1d8', isPrimary: false },
          { name: 'Slam', damage: '1d6', isPrimary: false }
        ]
      };

      const attacks = calculateWildShapeAttacks(char, testForm, 6, 4, 1, defaultTcState);
      expect(attacks[0].type).toBe('Bludgeoning'); // Hoof
      expect(attacks[1].type).toBe('Bludgeoning'); // Tail Slap
      expect(attacks[2].type).toBe('Piercing');    // Sting
      expect(attacks[3].type).toBe('Piercing/Slashing'); // Gore
      expect(attacks[4].type).toBe('Bludgeoning'); // Slam
    });

    it('honors explicit damageType overrides on attacks', () => {
      const char = createBaseCharacter({ wildShape: { isActive: true, selectedFormId: 'custom' } });
      const testForm: WildShapeFormData = {
        id: 'override_beast',
        name: 'Override Beast',
        category: 'magical beast',
        size: 'Medium',
        creatureType: 'Magical Beast',
        minDruidLevel: 5,
        str: 16,
        dex: 14,
        con: 14,
        naturalArmor: 2,
        speed: { land: 30 },
        attacks: [
          { name: 'Tentacle', damage: '1d4', isPrimary: true, damageType: 'Bludgeoning/Piercing' }
        ]
      };

      const attacks = calculateWildShapeAttacks(char, testForm, 6, 3, 2, defaultTcState);
      expect(attacks[0].type).toBe('Bludgeoning/Piercing');
    });
  });
});
