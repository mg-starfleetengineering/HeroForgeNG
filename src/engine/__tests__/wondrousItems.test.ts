import { describe, it, expect } from 'vitest';
import {
  STANDARD_WONDROUS_ITEMS,
  getPredefinedWondrousItems,
  createWondrousItemFromPredefined
} from '../wondrousItems';
import { BodySlotId } from '../../types/character';
import wondrousItemsJson from '../../data/wondrous_items.json';

describe('3.5e Standard Wondrous Items Catalog', () => {
  it('contains exactly 1059 items loaded from wondrous_items.json', () => {
    expect(STANDARD_WONDROUS_ITEMS).toHaveLength(1059);
    expect(STANDARD_WONDROUS_ITEMS).toEqual(wondrousItemsJson);
  });

  it('ensures every item has a unique canonical snake_case id and non-empty name', () => {
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();

    for (const item of STANDARD_WONDROUS_ITEMS) {
      expect(item.id, `Missing id for ${item.name}`).toBeTruthy();
      expect(seenIds.has(item.id), `Duplicate ID found: ${item.id}`).toBe(false);
      seenIds.add(item.id);

      expect(item.name, `Missing name for ${item.id}`).toBeTruthy();
      const lowerName = item.name.toLowerCase();
      expect(seenNames.has(lowerName), `Duplicate name found: ${item.name}`).toBe(false);
      seenNames.add(lowerName);

      // Verify canonical snake_case formatting (only lowercase letters, numbers, and underscores)
      expect(item.id).toMatch(/^[a-z0-9_]+$/);
    }
  });

  it('ensures every item has valid slot, effect, cost, weight, and source', () => {
    const validSlots = new Set<BodySlotId>([
      'head', 'headband', 'neck', 'shoulders', 'chest', 'body',
      'armor', 'hands', 'arms', 'waist', 'feet', 'ring1', 'ring2', 'slotless'
    ]);
    const validSources = new Set(['DMG', 'MIC', 'CAr', 'CM', 'RoD']);

    for (const item of STANDARD_WONDROUS_ITEMS) {
      expect(validSlots.has(item.slot), `Invalid slot for ${item.name}: ${item.slot}`).toBe(true);
      expect(item.effect, `Missing effect for ${item.name}`).toBeTruthy();
      expect(item.effect.length).toBeGreaterThan(5);
      expect(item.cost, `Missing cost for ${item.name}`).toBeTruthy();
      expect(typeof item.weight).toBe('number');
      expect(item.weight).toBeGreaterThanOrEqual(0);
      expect(validSources.has(item.source), `Invalid source for ${item.name}: ${item.source}`).toBe(true);
    }
  });

  it('filters items by body slot correctly with accurate slot counts', () => {
    const headItems = getPredefinedWondrousItems('head');
    expect(headItems).toHaveLength(67);
    expect(headItems.every(i => i.slot === 'head')).toBe(true);

    const headbandItems = getPredefinedWondrousItems('headband');
    expect(headbandItems).toHaveLength(58);
    expect(headbandItems.every(i => i.slot === 'headband')).toBe(true);

    const neckItems = getPredefinedWondrousItems('neck');
    expect(neckItems).toHaveLength(99);
    expect(neckItems.every(i => i.slot === 'neck')).toBe(true);

    const shoulderItems = getPredefinedWondrousItems('shoulders');
    expect(shoulderItems).toHaveLength(64);
    expect(shoulderItems.every(i => i.slot === 'shoulders')).toBe(true);

    const chestItems = getPredefinedWondrousItems('chest');
    expect(chestItems).toHaveLength(32);
    expect(chestItems.every(i => i.slot === 'chest')).toBe(true);

    const bodyItems = getPredefinedWondrousItems('body');
    expect(bodyItems).toHaveLength(31);
    expect(bodyItems.every(i => i.slot === 'body')).toBe(true);

    const armorItems = getPredefinedWondrousItems('armor');
    expect(armorItems).toHaveLength(68);
    expect(armorItems.every(i => i.slot === 'armor')).toBe(true);

    const handsItems = getPredefinedWondrousItems('hands');
    expect(handsItems).toHaveLength(49);
    expect(handsItems.every(i => i.slot === 'hands')).toBe(true);

    const armsItems = getPredefinedWondrousItems('arms');
    expect(armsItems).toHaveLength(44);
    expect(armsItems.every(i => i.slot === 'arms')).toBe(true);

    const waistItems = getPredefinedWondrousItems('waist');
    expect(waistItems).toHaveLength(33);
    expect(waistItems.every(i => i.slot === 'waist')).toBe(true);

    const feetItems = getPredefinedWondrousItems('feet');
    expect(feetItems).toHaveLength(46);
    expect(feetItems.every(i => i.slot === 'feet')).toBe(true);

    // Ring filtering includes ring items for both ring1 and ring2
    const ring1Items = getPredefinedWondrousItems('ring1');
    const ring2Items = getPredefinedWondrousItems('ring2');
    expect(ring1Items).toHaveLength(85);
    expect(ring2Items).toHaveLength(85);

    const slotlessItems = getPredefinedWondrousItems('slotless');
    expect(slotlessItems).toHaveLength(383);
    expect(slotlessItems.every(i => i.slot === 'slotless')).toBe(true);
  });

  it('filters items by search query case-insensitively', () => {
    const teleportItems = getPredefinedWondrousItems('all', 'teleport');
    expect(teleportItems.length).toBeGreaterThanOrEqual(5);
    expect(teleportItems.some(i => i.name === 'Helm of Teleportation')).toBe(true);
    expect(teleportItems.some(i => i.name === 'Boots of Teleportation')).toBe(true);
    expect(teleportItems.some(i => i.name === 'Anklet of Translocation')).toBe(true);

    const iounStones = getPredefinedWondrousItems('all', 'ioun stone');
    expect(iounStones).toHaveLength(11);

    const healingBelt = getPredefinedWondrousItems('waist', 'healing');
    expect(healingBelt.some(i => i.name === 'Healing Belt')).toBe(true);

    const crystals = getPredefinedWondrousItems('slotless', 'crystal of');
    expect(crystals.length).toBeGreaterThanOrEqual(40);
  });

  it('creates synchronized WondrousItem and InventoryItem entries with optional slot override', () => {
    const beltPreset = STANDARD_WONDROUS_ITEMS.find(i => i.id === 'belt_of_giant_strength_4')!;
    expect(beltPreset).toBeDefined();

    const { wondrousItem, inventoryItem } = createWondrousItemFromPredefined(beltPreset);

    expect(wondrousItem.name).toBe('Belt of Giant Strength (+4)');
    expect(wondrousItem.slot).toBe('waist');
    expect(wondrousItem.effect).toContain('+4 enhancement bonus');
    expect(wondrousItem.source).toBe('DMG');
    expect(wondrousItem.inventoryItemId).toBe(inventoryItem.id);

    expect(inventoryItem.name).toBe('Belt of Giant Strength (+4)');
    expect(inventoryItem.itemType).toBe('wondrous');
    expect(inventoryItem.bodySlot).toBe('waist');
    expect(inventoryItem.source).toBe('DMG');
    expect(inventoryItem.value).toBe('16,000 gp');
    expect(inventoryItem.weight).toBe(1);

    // Test ring slot override (e.g. equipping into ring2 instead of ring1)
    const ringPreset = STANDARD_WONDROUS_ITEMS.find(i => i.id === 'ring_of_protection_3')!;
    const ringOverride = createWondrousItemFromPredefined(ringPreset, 'ring2');

    expect(ringOverride.wondrousItem.slot).toBe('ring2');
    expect(ringOverride.wondrousItem.source).toBe('DMG');
    expect(ringOverride.inventoryItem.bodySlot).toBe('ring2');
    expect(ringOverride.inventoryItem.source).toBe('DMG');
  });

  it('assigns canonical source codes (DMG, MIC, CAr, CM, RoD) to all 1059 items', () => {
    const dmgItems = STANDARD_WONDROUS_ITEMS.filter(i => i.source === 'DMG');
    const micItems = STANDARD_WONDROUS_ITEMS.filter(i => i.source === 'MIC');
    const carItems = STANDARD_WONDROUS_ITEMS.filter(i => i.source === 'CAr');
    const cmItems = STANDARD_WONDROUS_ITEMS.filter(i => i.source === 'CM');
    const rodItems = STANDARD_WONDROUS_ITEMS.filter(i => i.source === 'RoD');

    expect(dmgItems).toHaveLength(279);
    expect(micItems).toHaveLength(739);
    expect(carItems).toHaveLength(26);
    expect(cmItems).toHaveLength(14);
    expect(rodItems).toHaveLength(1);

    expect(carItems.some(i => i.name === 'Girdle of Many Pouches')).toBe(true);
    expect(carItems.some(i => i.name === 'Thought Bottle')).toBe(true);
    expect(cmItems.some(i => i.name === 'Ring of Theurgy')).toBe(true);
    expect(rodItems[0].name).toBe('Vestment of Many Styles');
  });

  it('filters wondrous items by allowedSources when includeDisallowedSources is false', () => {
    // 1. Core Only: only DMG items returned (279)
    const coreOnly = getPredefinedWondrousItems('all', undefined, ['PHB', 'DMG', 'MM'], false);
    expect(coreOnly).toHaveLength(279);
    expect(coreOnly.every(i => i.source === 'DMG')).toBe(true);
    expect(coreOnly.some(i => i.name === 'Belt of Battle')).toBe(false);
    expect(coreOnly.some(i => i.name === 'Healing Belt')).toBe(false);
    expect(coreOnly.some(i => i.name === 'Armbands of Might')).toBe(false);
    expect(coreOnly.some(i => i.name === 'Girdle of Many Pouches')).toBe(false);
    expect(coreOnly.some(i => i.name === 'Vestment of Many Styles')).toBe(false);

    // 2. Core + Magic Item Compendium (id: 'Mag'): MIC items included (279 + 739 = 1018)
    const corePlusMic = getPredefinedWondrousItems('all', undefined, ['PHB', 'DMG', 'MM', 'Mag'], false);
    expect(corePlusMic).toHaveLength(1018);
    expect(corePlusMic.some(i => i.name === 'Belt of Battle')).toBe(true);
    expect(corePlusMic.some(i => i.name === 'Healing Belt')).toBe(true);
    expect(corePlusMic.some(i => i.name === 'Armbands of Might')).toBe(true);
    expect(corePlusMic.some(i => i.name === 'Anklet of Translocation')).toBe(true);
    expect(corePlusMic.some(i => i.name === 'Girdle of Many Pouches')).toBe(false);

    // 3. Bidirectional tolerance: ['MIC'] alias directly in allowedSources
    const corePlusMicAlias = getPredefinedWondrousItems('all', undefined, ['PHB', 'DMG', 'MM', 'MIC'], false);
    expect(corePlusMicAlias).toHaveLength(1018);

    // 4. Core + Complete Arcane ('CAr') + Complete Mage ('CM') + Races of Destiny ('RoD') (279 + 26 + 14 + 1 = 320)
    const corePlusArcaneRod = getPredefinedWondrousItems('all', undefined, ['PHB', 'DMG', 'MM', 'CAr', 'CM', 'RoD'], false);
    expect(corePlusArcaneRod).toHaveLength(320);
    expect(corePlusArcaneRod.some(i => i.name === 'Girdle of Many Pouches')).toBe(true);
    expect(corePlusArcaneRod.some(i => i.name === 'Thought Bottle')).toBe(true);
    expect(corePlusArcaneRod.some(i => i.name === 'Ring of Theurgy')).toBe(true);
    expect(corePlusArcaneRod.some(i => i.name === 'Vestment of Many Styles')).toBe(true);
    expect(corePlusArcaneRod.some(i => i.name === 'Belt of Battle')).toBe(false);

    // 5. When includeDisallowedSources is true: all 1059 items returned regardless
    const allAllowed = getPredefinedWondrousItems('all', undefined, ['PHB', 'DMG', 'MM'], true);
    expect(allAllowed).toHaveLength(1059);
  });
});
