import { describe, it, expect } from 'vitest';
import {
  calculateTotalCarriedWeight, isItemInInventory, ensureEquippedItemInInventory,
  syncEquippedItemsToInventory, matchesItemName, resolveWeapon, getThemedWeaponBase,
  resolveArmor, resolveShield, createInventoryWeapon, createInventoryArmor, createInventoryShield,
  calculateFeatCombatBonuses, resolveEquippedWeapon, DEFAULT_WEAPON,
  resolveEquippedArmor, resolveEquippedShield, applyMaterialToArmorData, applyMaterialToWeight,
  getWeaponEffectiveAttackEnhancement, getWeaponMaterialDamageMod, getWeaponMaterialTraits
} from '../equipment';
import { formatMagicItemName } from '../magicItems';
import { CharacterState, InventoryItem, CharacterFeat, CharacterSheetData } from '../../types/character';
import { migrateLegacyEquipmentToInventory } from '../../storage/migration';

describe('equipment engine & inventory sync', () => {
  it('identifies if item is in inventory case-insensitively', () => {
    const inv: InventoryItem[] = [
      { id: '1', name: 'Longsword', quantity: 1, weight: 4, location: 'Carried' },
      { id: '2', name: 'Chain Shirt', quantity: 1, weight: 25, location: 'Carried' }
    ];

    expect(isItemInInventory(inv, 'Longsword')).toBe(true);
    expect(isItemInInventory(inv, 'longsword')).toBe(true);
    expect(isItemInInventory(inv, 'CHAIN SHIRT')).toBe(true);
    expect(isItemInInventory(inv, 'Dagger')).toBe(false);
    expect(isItemInInventory(inv, 'none')).toBe(false);
  });

  it('adds item to inventory when missing', () => {
    const inv: InventoryItem[] = [
      { id: '1', name: 'Longsword', quantity: 1, weight: 4, location: 'Carried' }
    ];

    const updated = ensureEquippedItemInInventory(inv, { name: 'Greatsword', weight: 8 });
    expect(updated).toHaveLength(2);
    expect(updated.find(i => i.name === 'Greatsword')).toBeDefined();

    // Adding existing item does not duplicate
    const noDup = ensureEquippedItemInInventory(updated, { name: 'longsword', weight: 4 });
    expect(noDup).toHaveLength(2);
  });

  it('automatically syncs equipped items to inventory on character load', () => {
    const legacyChar = {
      name: 'Legacy Hero',
      equipment: {
        armor: 'fullplate',
        shield: 'heavy_shield',
        primaryWeapon: 'Greatsword'
      },
      inventory: [
        { id: 'inv_1', name: "Explorer's Pack", quantity: 1, weight: 10, location: 'Carried' }
      ]
    } as unknown as CharacterState;

    const synced = syncEquippedItemsToInventory(legacyChar, []);
    expect(synced.inventory).toHaveLength(4);
    expect(synced.inventory.some(i => i.name === 'Full Plate')).toBe(true);
    expect(synced.inventory.some(i => i.name === 'Heavy Shield')).toBe(true);
    expect(synced.inventory.some(i => i.name === 'Greatsword')).toBe(true);
  });

  it('calculates total carried weight correctly without double-counting equipped items in inventory', () => {
    const testChar = {
      name: 'Test Hero',
      player: 'Tester',
      alignment: 'TN',
      deity: 'Pelor',
      pointBuyTarget: '32',
      baseStats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      enhancementMods: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
      levelBumps: {},
      selectedRace: 'Human',
      isGestalt: false,
      levelProgression: [{ level: 1, primaryClass: 'Fighter', secondaryClass: '', hpRoll: 10 }],
      skillRanks: {},
      selectedFeats: [],
      selectedTraits: [],
      selectedFlaws: [],
      equipment: {
        armor: 'chainshirt',
        armorEnhancement: 0,
        shield: 'none',
        shieldEnhancement: 0,
        deflection: 0,
        natural: 0,
        dodge: 0,
        primaryWeapon: 'Longsword'
      },
      inventory: [
        { id: 'inv_1', name: 'Chain Shirt', quantity: 1, weight: 25, location: 'Carried' },
        { id: 'inv_2', name: 'Longsword', quantity: 1, weight: 4, location: 'Carried' },
        { id: 'inv_3', name: 'Backpack', quantity: 1, weight: 2, location: 'Carried' }
      ],
      funds: { cp: 0, sp: 0, gp: 0, pp: 0 },
      allowedSources: []
    } as unknown as CharacterState;

    // Total weight should be 25 (Chain Shirt) + 4 (Longsword) + 2 (Backpack) = 31 lbs (not 31 + 29 = 60 lbs)
    const totalWeight = calculateTotalCarriedWeight(testChar, []);
    expect(totalWeight).toBe(31);
  });

  it('retains carried weight when primary weapon is set to none (unequipped) but remains in inventory', () => {
    const testChar = {
      name: 'Test Hero',
      player: 'Tester',
      alignment: 'TN',
      deity: 'Pelor',
      pointBuyTarget: '32',
      baseStats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      enhancementMods: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
      levelBumps: {},
      selectedRace: 'Human',
      isGestalt: false,
      levelProgression: [{ level: 1, primaryClass: 'Fighter', secondaryClass: '', hpRoll: 10 }],
      skillRanks: {},
      selectedFeats: [],
      selectedTraits: [],
      selectedFlaws: [],
      equipment: {
        armor: 'chainshirt',
        armorEnhancement: 0,
        shield: 'none',
        shieldEnhancement: 0,
        deflection: 0,
        natural: 0,
        dodge: 0,
        primaryWeapon: 'none' // Unequipped
      },
      inventory: [
        { id: 'inv_1', name: 'Chain Shirt', quantity: 1, weight: 25, location: 'Carried' },
        { id: 'inv_2', name: 'Longsword', quantity: 1, weight: 4, location: 'Carried' } // Kept in inventory!
      ],
      funds: { cp: 0, sp: 0, gp: 0, pp: 0 },
      allowedSources: []
    } as unknown as CharacterState;

    const totalWeight = calculateTotalCarriedWeight(testChar, []);
    expect(totalWeight).toBe(29);
  });

  it('matchesItemName handles exact matches, aliases, and parentheticals without false positives', () => {
    expect(matchesItemName('Longsword', 'longsword')).toBe(true);
    expect(matchesItemName('Nodachi (Greatsword)', 'Nodachi')).toBe(true);
    expect(matchesItemName('Nodachi', 'Nodachi (Greatsword)')).toBe(true);
    expect(matchesItemName('+1 Flaming Greatsword (Greatsword)', '+1 Flaming Greatsword')).toBe(true);
    // False positive guards: substring words should NOT match
    expect(matchesItemName('Sword', 'Longsword')).toBe(false);
    expect(matchesItemName('Longsword', 'Sword')).toBe(false);
    expect(matchesItemName('Bow', 'Shortbow')).toBe(false);
    expect(matchesItemName('Dagger', 'Punching Dagger')).toBe(false);
    expect(matchesItemName('none', 'Longsword')).toBe(false);
    expect(matchesItemName('', 'Longsword')).toBe(false);
  });

  it('ensures equipping a new weapon does not duplicate existing inventory items or delete custom weapons', () => {
    const inv: InventoryItem[] = [
      { id: 'inv_1', name: 'Nodachi', quantity: 1, weight: 8, location: 'Carried' },
      { id: 'inv_2', name: 'Unarmed Strike', quantity: 1, weight: 0, location: 'Carried' }
    ];

    // Equipping Unarmed Strike should NOT rename Nodachi or duplicate Unarmed Strike
    const afterEquip = ensureEquippedItemInInventory(inv, { name: 'Unarmed Strike', weight: 0 });
    expect(afterEquip).toHaveLength(2);
    expect(afterEquip.filter(i => i.name === 'Unarmed Strike')).toHaveLength(1);
    expect(afterEquip.find(i => i.name === 'Nodachi')).toBeDefined();

    // Equipping Nodachi (Greatsword) when Nodachi is in inventory should not add duplicate
    const afterAlias = ensureEquippedItemInInventory(afterEquip, { name: 'Nodachi (Greatsword)', weight: 8 });
    expect(afterAlias).toHaveLength(2);
  });

  it('resolves themed weapon Nodachi to Greatsword base stats and inherits base source', () => {
    const nodachi = resolveWeapon('Nodachi', [], []);
    expect(nodachi.name).toBe('Nodachi');
    expect(nodachi.damageM).toBe('2d6');
    expect(nodachi.threat).toBe(19);
    expect(nodachi.critMultiplier).toBe(2);
    expect(nodachi.source).toBe('PHB');

    expect(getThemedWeaponBase('Nodachi')).toBe('greatsword');
    expect(getThemedWeaponBase('Nodachi (Greatsword)')).toBe('greatsword');
    expect(getThemedWeaponBase('Katana')).toBe('bastard sword');
    expect(getThemedWeaponBase('Longsword')).toBeNull();

    // Rejection of non-weapon inventory items with parentheses
    expect(getThemedWeaponBase('Torches (5)')).toBeNull();
    expect(getThemedWeaponBase('Trail Rations (1 day)')).toBeNull();
    expect(getThemedWeaponBase('Hempen Rope (50 ft)')).toBeNull();

    // Rejection of canonical 3.5e weapons that contain parentheses
    expect(getThemedWeaponBase('Tangat, Talenta (Halfling)')).toBeNull();
  });

  it('resolves armor and shield names accurately and matches aliases', () => {
    // Canonical full names
    const studded = resolveArmor('Studded Leather Armor');
    expect(studded.name).toBe('Studded Leather');
    expect(studded.acBonus).toBe(3);

    const studdedCanonical = resolveArmor('Studded Leather');
    expect(studdedCanonical.name).toBe('Studded Leather');
    expect(studdedCanonical.acBonus).toBe(3);

    const chain = resolveArmor('Chain Shirt');
    expect(chain.name).toBe('Chain Shirt');
    expect(chain.acBonus).toBe(4);

    const fullplate = resolveArmor('Full Plate');
    expect(fullplate.name).toBe('Full Plate');
    expect(fullplate.acBonus).toBe(8);

    // Short keys
    const studdedShort = resolveArmor('studded');
    expect(studdedShort.name).toBe('Studded Leather');
    expect(studdedShort.acBonus).toBe(3);

    // Shields
    const buckler = resolveShield('Buckler');
    expect(buckler.name).toBe('Buckler');
    expect(buckler.acBonus).toBe(1);

    const heavyShield = resolveShield('Heavy Shield');
    expect(heavyShield.name).toBe('Heavy Shield');
    expect(heavyShield.acBonus).toBe(2);

    // matchesItemName cross-key matching
    expect(matchesItemName('studded', 'Studded Leather Armor')).toBe(true);
    expect(matchesItemName('studded', 'Studded Leather')).toBe(true);
    expect(matchesItemName('chainshirt', 'Chain Shirt')).toBe(true);
    expect(matchesItemName('heavy_shield', 'Heavy Shield')).toBe(true);
    expect(matchesItemName('light_wooden', 'Light Shield')).toBe(true);
  });

  it('resolves magic weapons, armors, and shields with enhancement bonuses and special qualities', () => {
    // Magic weapons
    const magicSword = resolveWeapon('+1 Flaming Longsword', [], [{
      id: 'longsword',
      name: 'Longsword',
      category: 'Martial',
      size: 'M',
      damageM: '1d8',
      threat: 19,
      critMultiplier: 2,
      weight: 4,
      type: 'Slashing'
    }]);
    expect(magicSword.name).toBe('+1 Flaming Longsword');
    expect(magicSword.enhancementBonus).toBe(1);
    expect(magicSword.specialQualities).toEqual(['flaming']);
    expect(magicSword.damageM).toBe('1d8');
    expect(magicSword.threat).toBe(19);

    const magicNodachi = resolveWeapon('+2 Keen Nodachi', [], []);
    expect(magicNodachi.name).toBe('+2 Keen Nodachi');
    expect(magicNodachi.enhancementBonus).toBe(2);
    expect(magicNodachi.specialQualities).toEqual(['keen']);
    expect(magicNodachi.damageM).toBe('2d6');

    // 'none' and empty weapons should resolve to DEFAULT_WEAPON, never a phantom "none" custom weapon
    const noneWeapon = resolveWeapon('none', [], []);
    expect(noneWeapon.name).toBe(DEFAULT_WEAPON.name);
    expect(noneWeapon.id).toBe(DEFAULT_WEAPON.id);
    expect(noneWeapon.name).not.toBe('none');

    const emptyWeapon = resolveWeapon('', [], []);
    expect(emptyWeapon.name).toBe(DEFAULT_WEAPON.name);

    const testChar: any = {
      equipment: {
        primaryWeapon: 'none',
        secondaryWeapon: 'Dagger',
        rangedWeapon: 'none'
      }
    };
    const equippedPrimary = resolveEquippedWeapon(testChar, 'primaryWeapon', [], []);
    expect(equippedPrimary.name).toBe(DEFAULT_WEAPON.name);
    expect(equippedPrimary.name).not.toBe('none');

    // Magic armor & shields
    const magicArmor = resolveArmor('+1 Chain Shirt');
    expect(magicArmor.name).toBe('+1 Chain Shirt');
    expect(magicArmor.acBonus).toBe(4);
    expect(magicArmor.enhancementBonus).toBe(1);

    const shadowLeather = resolveArmor('+2 Shadow Leather Armor');
    expect(shadowLeather.name).toBe('+2 Shadow Leather Armor');
    expect(shadowLeather.acBonus).toBe(2);
    expect(shadowLeather.enhancementBonus).toBe(2);
    expect(shadowLeather.specialQualities).toEqual(['shadow']);

    const magicShield = resolveShield('+1 Heavy Shield');
    expect(magicShield.name).toBe('+1 Heavy Shield');
    expect(magicShield.acBonus).toBe(2);
    expect(magicShield.enhancementBonus).toBe(1);
  });

  it('persists enhancement bonus and special qualities on InventoryItem without losing customizations', () => {
    const inv: InventoryItem[] = [
      { id: '1', name: 'Nodachi', quantity: 1, weight: 8, location: 'Carried' }
    ];

    // Equipping/updating with qualities and enhancement updates existing item
    const updated = ensureEquippedItemInInventory(inv, {
      name: 'Nodachi',
      weight: 8,
      enhancementBonus: 1,
      specialQualities: ['keen']
    });
    expect(updated).toHaveLength(1);
    expect(updated[0].enhancementBonus).toBe(1);
    expect(updated[0].specialQualities).toEqual(['keen']);

    // Adding magic weapon directly to inventory stores properties
    const withMagic = ensureEquippedItemInInventory(updated, {
      name: '+1 Flaming Longsword',
      weight: 4,
      enhancementBonus: 1,
      specialQualities: ['flaming']
    });
    expect(withMagic).toHaveLength(2);
    const magicItem = withMagic.find(i => i.name === '+1 Flaming Longsword');
    expect(magicItem?.enhancementBonus).toBe(1);
    expect(magicItem?.specialQualities).toEqual(['flaming']);
  });

  it('createInventoryWeapon, createInventoryArmor, and createInventoryShield generate complete entities', () => {
    const wpn = createInventoryWeapon('Longsword', [{
      id: 'longsword',
      name: 'Longsword',
      category: 'Martial',
      size: 'M',
      damageM: '1d8',
      threat: 19,
      critMultiplier: 2,
      weight: 4,
      type: 'Slashing'
    }]);
    expect(wpn.itemType).toBe('weapon');
    expect(wpn.weaponData?.damageM).toBe('1d8');
    expect(wpn.weaponData?.threat).toBe(19);
    expect(wpn.weight).toBe(4);

    const arm = createInventoryArmor('Full Plate');
    expect(arm.itemType).toBe('armor');
    expect(arm.armorData?.acBonus).toBe(8);
    expect(arm.armorData?.type).toBe('heavy');
    expect(arm.armorData?.speedPenalty).toBe(true);
    expect(arm.weight).toBe(50);

    const shd = createInventoryShield('Heavy Shield');
    expect(shd.itemType).toBe('shield');
    expect(shd.armorData?.acBonus).toBe(2);
    expect(shd.armorData?.type).toBe('shield');
    expect(shd.weight).toBe(15);
  });

  it('syncEquippedItemsToInventory migrates legacy equipment to ID pointers with rich entity data', () => {
    const legacyChar = {
      name: 'Legacy Hero',
      equipment: {
        armor: 'fullplate',
        shield: 'heavy_shield',
        primaryWeapon: 'Longsword'
      },
      inventory: []
    } as unknown as CharacterState;

    const synced = syncEquippedItemsToInventory(legacyChar, [{
      id: 'longsword',
      name: 'Longsword',
      category: 'Martial',
      size: 'M',
      damageM: '1d8',
      threat: 19,
      critMultiplier: 2,
      weight: 4,
      type: 'Slashing'
    }]);

    expect(synced.equipment.armorItemId).toBeDefined();
    expect(synced.equipment.shieldItemId).toBeDefined();
    expect(synced.equipment.primaryWeaponItemId).toBeDefined();

    const equippedArmor = synced.inventory.find(i => i.id === synced.equipment.armorItemId);
    expect(equippedArmor).toBeDefined();
    expect(equippedArmor?.armorData?.type).toBe('heavy');
    expect(equippedArmor?.armorData?.speedPenalty).toBe(true);

    const equippedWeapon = synced.inventory.find(i => i.id === synced.equipment.primaryWeaponItemId);
    expect(equippedWeapon).toBeDefined();
    expect(equippedWeapon?.weaponData?.damageM).toBe('1d8');
  });

  it('isolates duplicate items in inventory by ID so mutating one does not affect the other', () => {
    const mundaneDagger: InventoryItem = {
      id: 'dagger_mundane',
      name: 'Dagger',
      quantity: 1,
      weight: 1,
      location: 'Belt Pouch',
      itemType: 'weapon',
      weaponData: {
        category: 'Simple',
        size: 'S',
        damageM: '1d4',
        threat: 19,
        critMultiplier: 2,
        damageType: 'Piercing or Slashing',
        isRanged: false
      }
    };

    const magicDagger: InventoryItem = {
      id: 'dagger_magic',
      name: '+1 Flaming Dagger',
      quantity: 1,
      weight: 1,
      location: 'Belt Pouch',
      enhancementBonus: 1,
      specialQualities: ['flaming'],
      itemType: 'weapon',
      weaponData: {
        category: 'Simple',
        size: 'S',
        damageM: '1d4',
        threat: 19,
        critMultiplier: 2,
        damageType: 'Piercing or Slashing',
        isRanged: false
      }
    };

    const testChar = {
      name: 'Rogue',
      equipment: {
        primaryWeapon: '+1 Flaming Dagger',
        primaryWeaponItemId: 'dagger_magic',
        primaryWeaponEnhancement: 1,
        primaryWeaponQualities: ['flaming']
      },
      inventory: [mundaneDagger, magicDagger]
    } as unknown as CharacterState;

    // Both daggers exist with independent IDs
    expect(testChar.inventory).toHaveLength(2);
    expect(testChar.inventory.find(i => i.id === 'dagger_mundane')?.enhancementBonus).toBeUndefined();
    expect(testChar.inventory.find(i => i.id === 'dagger_magic')?.enhancementBonus).toBe(1);
  });

  it('links wondrous items to inventory via inventoryItemId and avoids duplicates', () => {
    const charWithWondrous = {
      name: 'Mage',
      equipment: {
        armor: 'none',
        shield: 'none',
        primaryWeapon: 'none',
        wondrousItems: [
          { id: 'w_1', name: 'Cloak of Resistance +2', slot: 'shoulders', effect: '+2 to all saves', weight: 1 }
        ]
      },
      inventory: []
    } as unknown as CharacterState;

    const synced = syncEquippedItemsToInventory(charWithWondrous, []);
    expect(synced.inventory).toHaveLength(1);
    expect(synced.inventory[0].name).toBe('Cloak of Resistance +2');
    expect(synced.inventory[0].itemType).toBe('wondrous');
    expect(synced.equipment.wondrousItems![0].inventoryItemId).toBe(synced.inventory[0].id);

    // Syncing a second time should not duplicate the item
    const syncedAgain = syncEquippedItemsToInventory(synced, []);
    expect(syncedAgain.inventory).toHaveLength(1);
    expect(syncedAgain.equipment.wondrousItems![0].inventoryItemId).toBe(synced.inventory[0].id);
  });

  it('calculates total carried weight using ID pointers without duplicate weights', () => {
    const charWithIds = {
      name: 'Knight',
      equipment: {
        armor: 'Full Plate',
        armorItemId: 'armor_inv_1',
        shield: 'Heavy Shield',
        shieldItemId: 'shield_inv_1',
        primaryWeapon: 'Longsword',
        primaryWeaponItemId: 'weapon_inv_1',
        wondrousItems: [
          { id: 'w_1', inventoryItemId: 'wondrous_inv_1', name: 'Boots of Speed', slot: 'feet', effect: 'Haste', weight: 1 }
        ]
      },
      inventory: [
        { id: 'armor_inv_1', name: 'Full Plate', quantity: 1, weight: 50, location: 'Carried' },
        { id: 'shield_inv_1', name: 'Heavy Shield', quantity: 1, weight: 15, location: 'Carried' },
        { id: 'weapon_inv_1', name: 'Longsword', quantity: 1, weight: 4, location: 'Carried' },
        { id: 'wondrous_inv_1', name: 'Boots of Speed', quantity: 1, weight: 1, location: 'Carried' }
      ]
    } as unknown as CharacterState;

    // Weight should be exactly 50 + 15 + 4 + 1 = 70 lbs, not 140 lbs
    const weight = calculateTotalCarriedWeight(charWithIds, []);
    expect(weight).toBe(70);
  });

  describe('calculateFeatCombatBonuses with precision weapon matching', () => {
    it('applies Weapon Focus and Specialization to exact weapon matches and aliases', () => {
      const char = {
        selectedFeats: [
          'Weapon Focus (Longsword)',
          'Weapon Specialization (Longsword)',
          'Greater Weapon Focus (Greatsword)',
          'Weapon Focus (Longbow)',
          'Weapon Focus (Claw)'
        ]
      } as unknown as CharacterState;

      // Exact match
      const longsword = { name: 'Longsword' } as any;
      const lsBonuses = calculateFeatCombatBonuses(char, longsword);
      expect(lsBonuses.attackBonus).toBe(1);
      expect(lsBonuses.damageBonus).toBe(2);

      // Magic weapon with prefix
      const magicLs = { name: '+1 Flaming Longsword' } as any;
      const magicLsBonuses = calculateFeatCombatBonuses(char, magicLs);
      expect(magicLsBonuses.attackBonus).toBe(1);
      expect(magicLsBonuses.damageBonus).toBe(2);

      // Themed aliased weapon matching base model
      const nodachi = { name: 'Nodachi (Greatsword)' } as any;
      const nodachiBonuses = calculateFeatCombatBonuses(char, nodachi);
      expect(nodachiBonuses.attackBonus).toBe(1); // from Greater Weapon Focus (Greatsword)

      // Bare themed weapon name matching base model via map
      const bareNodachi = { name: 'Nodachi' } as any;
      const bareNodachiBonuses = calculateFeatCombatBonuses(char, bareNodachi);
      expect(bareNodachiBonuses.attackBonus).toBe(1); // from Greater Weapon Focus (Greatsword)

      // Composite bow equivalence
      const compLongbow = { name: 'Composite Longbow' } as any;
      const bowBonuses = calculateFeatCombatBonuses(char, compLongbow);
      expect(bowBonuses.attackBonus).toBe(1);

      // Natural weapon count suffix
      const claw = { name: 'Claw (2x)' } as any;
      const clawBonuses = calculateFeatCombatBonuses(char, claw);
      expect(clawBonuses.attackBonus).toBe(1);
    });

    it('does NOT apply feat bonuses to different weapons in the same broad name family', () => {
      const char = {
        selectedFeats: [
          'Weapon Focus (Longsword)',
          'Weapon Focus (Battleaxe)',
          'Weapon Focus (Heavy Mace)',
          'Weapon Focus (Bow)'
        ]
      } as unknown as CharacterState;

      // Nodachi (Greatsword) is a Greatsword, NOT a Longsword: Weapon Focus (Longsword) must NOT apply
      const nodachi = { name: 'Nodachi (Greatsword)' } as any;
      const nodachiBonuses = calculateFeatCombatBonuses(char, nodachi);
      expect(nodachiBonuses.attackBonus).toBe(0);

      // Greataxe should not match Battleaxe focus
      const greataxe = { name: 'Greataxe' } as any;
      const gaBonuses = calculateFeatCombatBonuses(char, greataxe);
      expect(gaBonuses.attackBonus).toBe(0);

      // Light Mace should not match Heavy Mace focus
      const lightMace = { name: 'Light Mace' } as any;
      const lmBonuses = calculateFeatCombatBonuses(char, lightMace);
      expect(lmBonuses.attackBonus).toBe(0);

      // Crossbow should not match generic Bow focus
      const crossbow = { name: 'Heavy Crossbow' } as any;
      const xbowBonuses = calculateFeatCombatBonuses(char, crossbow);
      expect(xbowBonuses.attackBonus).toBe(0);
    });

    it('evaluates combat bonuses using structured selectedFeatEntities', () => {
      const char = {
        selectedFeatEntities: [
          { id: '1', featId: 'weapon_focus', targetId: 'longsword', targetType: 'weapon' },
          { id: '2', featId: 'weapon_specialization', targetId: 'longsword', targetType: 'weapon' },
          { id: '3', featId: 'greater_weapon_focus', targetId: 'greatsword', targetType: 'weapon' },
          { id: '4', featId: 'greater_weapon_specialization', targetId: 'greatsword', targetType: 'weapon' },
          { id: '5', featId: 'weapon_focus', targetId: 'longbow', targetType: 'weapon' }
        ]
      } as unknown as CharacterState;

      // Exact weapon match
      const longsword = { name: 'Longsword' } as any;
      const lsBonuses = calculateFeatCombatBonuses(char, longsword);
      expect(lsBonuses.attackBonus).toBe(1);
      expect(lsBonuses.damageBonus).toBe(2);

      // Themed alias matching base model (Nodachi -> Greatsword)
      const nodachi = { name: 'Nodachi (Greatsword)' } as any;
      const nodachiBonuses = calculateFeatCombatBonuses(char, nodachi);
      expect(nodachiBonuses.attackBonus).toBe(1); // Greater Weapon Focus
      expect(nodachiBonuses.damageBonus).toBe(2); // Greater Weapon Specialization

      // Composite bow equivalence
      const compLongbow = { name: 'Composite Longbow' } as any;
      const bowBonuses = calculateFeatCombatBonuses(char, compLongbow);
      expect(bowBonuses.attackBonus).toBe(1);

      // Non-matching weapon
      const dagger = { name: 'Dagger' } as any;
      const daggerBonuses = calculateFeatCombatBonuses(char, dagger);
      expect(daggerBonuses.attackBonus).toBe(0);
      expect(daggerBonuses.damageBonus).toBe(0);
    });

    it('prioritizes selectedFeatEntities over legacy selectedFeats to prevent duplicate stacking', () => {
      const char = {
        selectedFeatEntities: [
          { id: '1', featId: 'weapon_focus', targetId: 'longsword', targetType: 'weapon' }
        ],
        selectedFeats: [
          'Weapon Focus (Longsword)',
          'Weapon Specialization (Longsword)'
        ]
      } as unknown as CharacterState;

      const longsword = { name: 'Longsword' } as any;
      const bonuses = calculateFeatCombatBonuses(char, longsword);
      // Only the selectedFeatEntities (Weapon Focus) should be evaluated: +1 attack, 0 damage (not +2 attack, +2 damage)
      expect(bonuses.attackBonus).toBe(1);
      expect(bonuses.damageBonus).toBe(0);
    });
  });

  describe('structured equipment & material rules (Phase 2)', () => {
    it('applies 3.5e material rules to armor data and weight correctly', () => {
      // Mithral Full Plate:
      // Standard Full Plate: Heavy, AC 8, Max Dex 1, Check -6, Spell Failure 35%, Weight 50
      const baseFullPlate = {
        type: 'heavy' as const,
        acBonus: 8,
        maxDex: 1,
        armorCheckPenalty: -6,
        spellFailure: 35,
        speedPenalty: true
      };

      const mithralPlateData = applyMaterialToArmorData(baseFullPlate, 'mithral');
      expect(mithralPlateData.type).toBe('medium'); // 1 category lighter
      expect(mithralPlateData.maxDex).toBe(3); // +2 max dex
      expect(mithralPlateData.armorCheckPenalty).toBe(-3); // check penalty reduced by 3
      expect(mithralPlateData.spellFailure).toBe(25); // ASF reduced by 10%
      expect(applyMaterialToWeight(50, 'mithral')).toBe(25); // weight halved

      // Darkwood Shield:
      // Standard Heavy Shield: Check -2, Weight 15
      const baseShield = {
        type: 'shield' as const,
        acBonus: 2,
        maxDex: 99,
        armorCheckPenalty: -2,
        spellFailure: 15
      };

      const darkwoodShieldData = applyMaterialToArmorData(baseShield, 'darkwood');
      expect(darkwoodShieldData.armorCheckPenalty).toBe(0); // reduced by 2 (min 0)
      expect(applyMaterialToWeight(15, 'darkwood')).toBe(7.5); // weight halved
    });

    it('creates structured inventory items with material and baseItemId', () => {
      const armorItem = createInventoryArmor('fullplate', [], {
        material: 'mithral',
        enhancementBonus: 1
      });

      expect(armorItem.itemType).toBe('armor');
      expect(armorItem.material).toBe('mithral');
      expect(armorItem.enhancementBonus).toBe(1);
      expect(armorItem.weight).toBe(25);
      expect(armorItem.armorData?.type).toBe('medium');
      expect(armorItem.armorData?.maxDex).toBe(3);
      expect(armorItem.armorData?.armorCheckPenalty).toBe(-3);

      const weaponItem = createInventoryWeapon('Longsword', {
        material: 'adamantine',
        enhancementBonus: 2,
        specialQualities: ['keen']
      });

      expect(weaponItem.itemType).toBe('weapon');
      expect(weaponItem.material).toBe('adamantine');
      expect(weaponItem.enhancementBonus).toBe(2);
      expect(weaponItem.specialQualities).toEqual(['keen']);
      expect(weaponItem.weaponData?.damageM).toBe('1d8');
      expect(weaponItem.weaponData?.critMultiplier).toBe(2);
    });

    it('resolves equipped armor and shield from structured inventory items without regex string parsing', () => {
      const char = {
        equipment: {
          armor: '+1 Mithral Full Plate',
          armorItemId: 'inv_armor_1',
          armorEnhancement: 1,
          armorMaterial: 'mithral',
          shield: 'Darkwood Heavy Shield',
          shieldItemId: 'inv_shield_1',
          shieldEnhancement: 0,
          shieldMaterial: 'darkwood'
        },
        inventory: [
          {
            id: 'inv_armor_1',
            name: '+1 Mithral Full Plate',
            quantity: 1,
            weight: 25,
            itemType: 'armor',
            material: 'mithral',
            baseItemId: 'fullplate',
            enhancementBonus: 1,
            armorData: {
              type: 'medium',
              acBonus: 8,
              maxDex: 3,
              armorCheckPenalty: -3,
              spellFailure: 25,
              speedPenalty: true
            }
          },
          {
            id: 'inv_shield_1',
            name: 'Darkwood Heavy Shield',
            quantity: 1,
            weight: 7.5,
            itemType: 'shield',
            material: 'darkwood',
            baseItemId: 'heavy_shield',
            enhancementBonus: 0,
            armorData: {
              type: 'shield',
              acBonus: 2,
              maxDex: 99,
              armorCheckPenalty: 0,
              spellFailure: 15,
              speedPenalty: false
            }
          }
        ]
      } as unknown as CharacterState;

      const resolvedArmor = resolveEquippedArmor(char);
      expect(resolvedArmor.material).toBe('mithral');
      expect(resolvedArmor.type).toBe('medium');
      expect(resolvedArmor.maxDex).toBe(3);
      expect(resolvedArmor.checkPenalty).toBe(-3);
      expect(resolvedArmor.weight).toBe(25);

      const resolvedShield = resolveEquippedShield(char);
      expect(resolvedShield.material).toBe('darkwood');
      expect(resolvedShield.checkPenalty).toBe(0);
      expect(resolvedShield.weight).toBe(7.5);
    });

    it('resolves equipped weapon from structured inventory item directly', () => {
      const char = {
        equipment: {
          primaryWeapon: '+2 Adamantine Keen Longsword',
          primaryWeaponItemId: 'inv_wpn_1',
          primaryWeaponEnhancement: 2,
          primaryWeaponQualities: ['keen'],
          primaryWeaponMaterial: 'adamantine'
        },
        inventory: [
          {
            id: 'inv_wpn_1',
            name: '+2 Adamantine Keen Longsword',
            quantity: 1,
            weight: 4,
            itemType: 'weapon',
            material: 'adamantine',
            baseItemId: 'longsword',
            enhancementBonus: 2,
            specialQualities: ['keen'],
            weaponData: {
              category: 'Martial',
              size: 'M',
              damageM: '1d8',
              threat: 19,
              critMultiplier: 2,
              damageType: 'Slashing',
              isRanged: false
            }
          }
        ]
      } as unknown as CharacterState;

      const resolved = resolveEquippedWeapon(char, 'primaryWeapon');
      expect(resolved.name).toBe('+2 Adamantine Keen Longsword');
      expect(resolved.material).toBe('adamantine');
      expect(resolved.enhancementBonus).toBe(2);
      expect(resolved.specialQualities).toEqual(['keen']);
      expect(resolved.damageM).toBe('1d8');
    });

    it('formats clean Title Case names when given snake_case base items', () => {
      expect(formatMagicItemName('full_plate', 0, [], 'mithral')).toBe('Mithral Full Plate');
      expect(formatMagicItemName('heavy_shield', 0, [], 'darkwood')).toBe('Darkwood Heavy Shield');
      expect(formatMagicItemName('bastard_sword', 1, [], 'adamantine')).toBe('+1 Adamantine Bastard Sword');
      expect(formatMagicItemName('fullplate', 0, [], 'mithral')).toBe('Mithral Full Plate');
    });

    it('createInventoryArmor and createInventoryShield produce clean human-readable names with materials', () => {
      const arm = createInventoryArmor('fullplate', [], { material: 'mithral' });
      expect(arm.name).toBe('Mithral Full Plate');
      expect(arm.baseItemId).toBe('full_plate');

      const shd = createInventoryShield('heavy_shield', [], { material: 'darkwood' });
      expect(shd.name).toBe('Darkwood Heavy Shield');
      expect(shd.baseItemId).toBe('heavy_shield');
    });

    it('calculates 3.5e Adamantine weapon masterwork attack bonus and material damage mods', () => {
      // Adamantine weapon is masterwork: +1 enhancement to attack when 0 magical enhancement
      expect(getWeaponEffectiveAttackEnhancement('adamantine', 0)).toBe(1);
      // Magical enhancement overrides masterwork (non-stacking)
      expect(getWeaponEffectiveAttackEnhancement('adamantine', 2)).toBe(2);
      // Standard weapon has 0 enhancement by default
      expect(getWeaponEffectiveAttackEnhancement('standard', 0)).toBe(0);

      // Damage: Adamantine deals normal damage
      expect(getWeaponMaterialDamageMod('adamantine')).toBe(0);
      // Alchemical Silver has -1 damage penalty
      expect(getWeaponMaterialDamageMod('alchemical_silver')).toBe(-1);
    });

    it('returns material traits for display on weapon cards', () => {
      const traits = getWeaponMaterialTraits('adamantine');
      expect(traits).toContain('Adamantine (Bypasses DR/Adamantine & Hardness < 20)');
      expect(traits).toContain('Masterwork (+1 Atk)');

      const silverTraits = getWeaponMaterialTraits('alchemical_silver');
      expect(silverTraits).toContain('Silver (Bypasses DR/Silver, -1 Dmg)');
    });
  });

  describe('Masterwork Equipment Support (3.5e PHB & DMG)', () => {
    it('calculates masterwork weapon attack enhancement correctly without stacking with magic bonuses', () => {
      // Standard masterwork weapon: +1 enhancement to attack
      expect(getWeaponEffectiveAttackEnhancement('standard', 0, true)).toBe(1);
      // Standard non-masterwork weapon: +0
      expect(getWeaponEffectiveAttackEnhancement('standard', 0, false)).toBe(0);
      // Magical enhancement overrides masterwork bonus (non-stacking: +1 MWK weapon gives +1, not +2)
      expect(getWeaponEffectiveAttackEnhancement('standard', 1, true)).toBe(1);
      expect(getWeaponEffectiveAttackEnhancement('standard', 2, true)).toBe(2);

      // Adamantine weapon is inherently masterwork
      expect(getWeaponEffectiveAttackEnhancement('adamantine', 0, false)).toBe(1);
      expect(getWeaponEffectiveAttackEnhancement('adamantine', 0, true)).toBe(1);
      expect(getWeaponEffectiveAttackEnhancement('adamantine', 3, true)).toBe(3);
    });

    it('returns masterwork trait in getWeaponMaterialTraits', () => {
      expect(getWeaponMaterialTraits('standard', true)).toContain('Masterwork (+1 Atk)');
      expect(getWeaponMaterialTraits('standard', false)).not.toContain('Masterwork (+1 Atk)');
      // For adamantine, it has Masterwork (+1 Atk) exactly once
      const admTraits = getWeaponMaterialTraits('adamantine', true);
      expect(admTraits.filter(t => t === 'Masterwork (+1 Atk)')).toHaveLength(1);
    });

    it('reduces armor and shield check penalty by 1 for masterwork (minimum 0)', () => {
      const fullPlateData = {
        type: 'heavy' as const,
        acBonus: 8,
        maxDex: 1,
        armorCheckPenalty: -6,
        spellFailure: 35,
        speedPenalty: true
      };

      // Full Plate: -6 ACP becomes -5 for masterwork
      const mwkFullPlate = applyMaterialToArmorData(fullPlateData, 'standard', true);
      expect(mwkFullPlate.armorCheckPenalty).toBe(-5);

      // Non-masterwork Full Plate stays -6
      const stdFullPlate = applyMaterialToArmorData(fullPlateData, 'standard', false);
      expect(stdFullPlate.armorCheckPenalty).toBe(-6);

      // Adamantine Full Plate reduces ACP by 1
      const admFullPlate = applyMaterialToArmorData(fullPlateData, 'adamantine', false);
      expect(admFullPlate.armorCheckPenalty).toBe(-5);

      // Mithral Full Plate reduces ACP by 3 to -3, does not stack with masterwork
      const mithFullPlate = applyMaterialToArmorData(fullPlateData, 'mithral', true);
      expect(mithFullPlate.armorCheckPenalty).toBe(-3);

      // Heavy Shield (-2 ACP): masterwork reduces to -1
      const heavyShieldData = {
        type: 'shield' as const,
        acBonus: 2,
        maxDex: 99,
        armorCheckPenalty: -2,
        spellFailure: 15,
        speedPenalty: false
      };
      const mwkShield = applyMaterialToArmorData(heavyShieldData, 'standard', true);
      expect(mwkShield.armorCheckPenalty).toBe(-1);

      // Minimum 0 check penalty: Leather Armor (ACP 0) stays 0, never becomes positive
      const leatherData = {
        type: 'light' as const,
        acBonus: 2,
        maxDex: 6,
        armorCheckPenalty: 0,
        spellFailure: 10,
        speedPenalty: false
      };
      const mwkLeather = applyMaterialToArmorData(leatherData, 'standard', true);
      expect(mwkLeather.armorCheckPenalty).toBe(0);
    });

    it('resolves masterwork weapons, armors, and shields with structured isMasterwork flag and reduced ACP', () => {
      // Weapon
      const mwkSword = resolveWeapon('Masterwork Longsword', [], [{
        id: 'longsword',
        name: 'Longsword',
        category: 'Martial',
        size: 'M',
        damageM: '1d8',
        threat: 19,
        critMultiplier: 2,
        weight: 4,
        type: 'Slashing'
      }]);
      expect(mwkSword.isMasterwork).toBe(true);
      expect(mwkSword.enhancementBonus).toBe(0);

      // Armor
      const mwkPlate = resolveArmor('Masterwork Full Plate');
      expect(mwkPlate.isMasterwork).toBe(true);
      expect(mwkPlate.checkPenalty).toBe(-5); // Baseline is -6, reduced to -5

      // Shield
      const mwkShield = resolveShield('Masterwork Heavy Shield');
      expect(mwkShield.isMasterwork).toBe(true);
      expect(mwkShield.checkPenalty).toBe(-1); // Baseline is -2, reduced to -1
    });

    it('createInventory items properly initialize isMasterwork and apply ACP reductions', () => {
      const wpn = createInventoryWeapon('Masterwork Longsword', [], []);
      expect(wpn.isMasterwork).toBe(true);
      expect(wpn.name).toBe('Masterwork Longsword');

      const arm = createInventoryArmor('Full Plate', [], { isMasterwork: true });
      expect(arm.isMasterwork).toBe(true);
      expect(arm.name).toBe('Masterwork Full Plate');
      expect(arm.armorData?.armorCheckPenalty).toBe(-5);

      const shd = createInventoryShield('Heavy Shield', [], { isMasterwork: true });
      expect(shd.isMasterwork).toBe(true);
      expect(shd.name).toBe('Masterwork Heavy Shield');
      expect(shd.armorData?.armorCheckPenalty).toBe(-1);
    });

    it('resolveEquippedWeapon propagates equipment masterwork flag to resolved item', () => {
      const char = {
        equipment: {
          primaryWeapon: 'Masterwork Longsword',
          primaryWeaponItemId: 'wpn-1',
          primaryWeaponMasterwork: true,
          primaryWeaponEnhancement: 0
        },
        inventory: [
          {
            id: 'wpn-1',
            name: 'Masterwork Longsword',
            isMasterwork: true,
            quantity: 1,
            weight: 4,
            location: 'Equipped',
            weaponData: {
              category: 'Martial',
              size: 'M',
              damageM: '1d8'
            }
          }
        ]
      } as unknown as CharacterState;

      const resolved = resolveEquippedWeapon(char, 'primaryWeapon');
      expect(resolved.isMasterwork).toBe(true);
      expect(resolved.name).toBe('Masterwork Longsword');
    });

    it('syncEquippedItemsToInventory synchronizes masterwork status between equipment and inventory', () => {
      const char = {
        equipment: {
          primaryWeapon: 'Masterwork Longsword',
          primaryWeaponMasterwork: true,
          armor: 'Masterwork Chain Shirt',
          armorMasterwork: true,
          shield: 'none'
        },
        inventory: [
          {
            id: 'inv-1',
            name: 'Masterwork Longsword',
            quantity: 1,
            weight: 4,
            location: 'Equipped'
          },
          {
            id: 'inv-2',
            name: 'Masterwork Chain Shirt',
            quantity: 1,
            weight: 25,
            location: 'Equipped'
          }
        ]
      } as unknown as CharacterState;

      const synced = syncEquippedItemsToInventory(char);
      const wpn = synced.inventory.find(i => i.id === 'inv-1');
      const arm = synced.inventory.find(i => i.id === 'inv-2');
      expect(wpn?.isMasterwork).toBe(true);
      expect(arm?.isMasterwork).toBe(true);
      expect(synced.equipment.primaryWeaponMasterwork).toBe(true);
      expect(synced.equipment.armorMasterwork).toBe(true);
    });

    it('migrates legacy equipment masterwork strings to structured isMasterwork in character loader', () => {
      const legacyChar = {
        id: 'test-char-1',
        updatedAt: Date.now(),
        equipment: {
          primaryWeapon: 'Masterwork Longsword',
          armor: 'Masterwork Breastplate',
          shield: 'Masterwork Heavy Shield'
        },
        inventory: []
      } as unknown as CharacterSheetData;

      const migrated = migrateLegacyEquipmentToInventory(legacyChar);
      expect(migrated.equipment.primaryWeaponMasterwork).toBe(true);
      expect(migrated.equipment.armorMasterwork).toBe(true);
      expect(migrated.equipment.shieldMasterwork).toBe(true);

      const wpn = migrated.inventory.find(i => i.name.includes('Longsword'));
      const arm = migrated.inventory.find(i => i.name.includes('Breastplate'));
      const shd = migrated.inventory.find(i => i.name.includes('Heavy Shield'));

      expect(wpn?.isMasterwork).toBe(true);
      expect(arm?.isMasterwork).toBe(true);
      expect(shd?.isMasterwork).toBe(true);
      // Breastplate baseline ACP is -4; masterwork is -3
      expect(arm?.armorData?.armorCheckPenalty).toBe(-3);
      // Heavy shield baseline ACP is -2; masterwork is -1
      expect(shd?.armorData?.armorCheckPenalty).toBe(-1);
    });

    it('preserves equipment masterwork toggle when synchronizing with non-masterwork inventory item', () => {
      const char = {
        equipment: {
          primaryWeapon: 'Longsword',
          primaryWeaponItemId: 'inv-ls-1',
          primaryWeaponMasterwork: true
        },
        inventory: [
          {
            id: 'inv-ls-1',
            name: 'Longsword',
            baseItemId: 'longsword',
            isMasterwork: false,
            itemType: 'weapon',
            weaponData: {
              category: 'Martial',
              size: 'M',
              damageM: '1d8',
              threat: 19,
              critMultiplier: 2,
              damageType: 'Slashing',
              isMasterwork: false
            }
          }
        ]
      } as unknown as CharacterSheetData;

      const synced = syncEquippedItemsToInventory(char as any);
      expect(synced.equipment.primaryWeaponMasterwork).toBe(true);
      expect(synced.equipment.primaryWeapon).toBe('Masterwork Longsword');
      const item = synced.inventory.find(i => i.id === 'inv-ls-1');
      expect(item?.isMasterwork).toBe(true);
      expect(item?.name).toBe('Masterwork Longsword');
      expect(item?.weaponData?.isMasterwork).toBe(true);

      const resolved = resolveEquippedWeapon({ equipment: synced.equipment, inventory: synced.inventory } as any, 'primaryWeapon');
      expect(resolved.isMasterwork).toBe(true);
      expect(getWeaponEffectiveAttackEnhancement(resolved.material, 0, resolved.isMasterwork)).toBe(1);
    });
  });
});


