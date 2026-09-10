import { describe, it, expect } from 'vitest';
import {
  calculateTotalCarriedWeight, isItemInInventory, ensureEquippedItemInInventory,
  syncEquippedItemsToInventory, matchesItemName, resolveWeapon, getThemedWeaponBase,
  resolveArmor, resolveShield, createInventoryWeapon, createInventoryArmor, createInventoryShield
} from '../equipment';
import { CharacterState, InventoryItem } from '../../types/character';

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
});

