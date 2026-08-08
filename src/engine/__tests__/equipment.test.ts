import { describe, it, expect } from 'vitest';
import { calculateTotalCarriedWeight, isItemInInventory, ensureEquippedItemInInventory, syncEquippedItemsToInventory } from '../equipment';
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
});
