import { describe, it, expect } from 'vitest';
import {
  STANDARD_WONDROUS_ITEMS,
  getPredefinedWondrousItems,
  createWondrousItemFromPredefined
} from '../wondrousItems';
import { BodySlotId } from '../../types/character';

// The user-provided list of 142 3.5e wondrous items
const EXPECTED_USER_ITEMS = [
  { name: 'Circlet of Persuasion', slot: 'head' },
  { name: 'Hat of Disguise', slot: 'head' },
  { name: 'Helm of Telepathy', slot: 'head' },
  { name: 'Helm of Teleportation', slot: 'head' },
  { name: 'Helm of Comprehend Languages and Read Magic', slot: 'head' },
  { name: 'Helm of Brilliance', slot: 'head' },
  { name: 'Cap of Water Breathing', slot: 'head' },
  { name: 'Mask of the Skull', slot: 'head' },
  { name: 'Helm of Underwater Action', slot: 'head' },
  { name: 'Circlet of Blasting, Minor', slot: 'head' },
  { name: 'Circlet of Blasting, Major', slot: 'head' },
  { name: 'Headband of Intellect (+2)', slot: 'headband' },
  { name: 'Headband of Intellect (+4)', slot: 'headband' },
  { name: 'Headband of Intellect (+6)', slot: 'headband' },
  { name: 'Phylactery of Undead Turning', slot: 'headband' },
  { name: 'Phylactery of Faithfulness', slot: 'headband' },
  { name: 'Goggles of Night', slot: 'headband' },
  { name: 'Goggles of Minute Seeing', slot: 'headband' },
  { name: 'Eyes of the Eagle', slot: 'headband' },
  { name: 'Eyes of Charming', slot: 'headband' },
  { name: 'Eyes of Petrification', slot: 'headband' },
  { name: 'Eyes of Doom', slot: 'headband' },
  { name: 'Lens of Detection', slot: 'headband' },
  { name: 'Amulet of Health (+2)', slot: 'neck' },
  { name: 'Amulet of Health (+4)', slot: 'neck' },
  { name: 'Amulet of Health (+6)', slot: 'neck' },
  { name: 'Amulet of Natural Armor (+1)', slot: 'neck' },
  { name: 'Amulet of Natural Armor (+2)', slot: 'neck' },
  { name: 'Amulet of Natural Armor (+3)', slot: 'neck' },
  { name: 'Amulet of Natural Armor (+4)', slot: 'neck' },
  { name: 'Amulet of Natural Armor (+5)', slot: 'neck' },
  { name: 'Amulet of Mighty Fists (+1 to +5)', slot: 'neck' },
  { name: 'Amulet of the Planes', slot: 'neck' },
  { name: 'Periapt of Wisdom (+2)', slot: 'neck' },
  { name: 'Periapt of Wisdom (+4)', slot: 'neck' },
  { name: 'Periapt of Wisdom (+6)', slot: 'neck' },
  { name: 'Periapt of Proof against Poison', slot: 'neck' },
  { name: 'Periapt of Wound Closure', slot: 'neck' },
  { name: 'Periapt of Health', slot: 'neck' },
  { name: 'Necklace of Adaptation', slot: 'neck' },
  { name: 'Necklace of Fireballs (Type I)', slot: 'neck' },
  { name: 'Necklace of Fireballs (Type II)', slot: 'neck' },
  { name: 'Necklace of Fireballs (Type III)', slot: 'neck' },
  { name: 'Necklace of Fireballs (Type IV)', slot: 'neck' },
  { name: 'Necklace of Fireballs (Type V)', slot: 'neck' },
  { name: 'Necklace of Fireballs (Type VI)', slot: 'neck' },
  { name: 'Necklace of Fireballs (Type VII)', slot: 'neck' },
  { name: 'Medallion of Thoughts', slot: 'neck' },
  { name: 'Brooch of Shielding', slot: 'neck' },
  { name: 'Scarab of Protection', slot: 'neck' },
  { name: 'Scarab, Golembane', slot: 'neck' },
  { name: 'Hand of Glory', slot: 'neck' },
  { name: 'Cloak of Resistance (+1)', slot: 'shoulders' },
  { name: 'Cloak of Resistance (+2)', slot: 'shoulders' },
  { name: 'Cloak of Resistance (+3)', slot: 'shoulders' },
  { name: 'Cloak of Resistance (+4)', slot: 'shoulders' },
  { name: 'Cloak of Resistance (+5)', slot: 'shoulders' },
  { name: 'Cloak of Charisma (+2)', slot: 'shoulders' },
  { name: 'Cloak of Charisma (+4)', slot: 'shoulders' },
  { name: 'Cloak of Charisma (+6)', slot: 'shoulders' },
  { name: 'Cloak of Elvenkind', slot: 'shoulders' },
  { name: 'Cloak of the Bat', slot: 'shoulders' },
  { name: 'Cloak of Arachnida', slot: 'shoulders' },
  { name: 'Cloak of the Manta Ray', slot: 'shoulders' },
  { name: 'Minor Cloak of Displacement', slot: 'shoulders' },
  { name: 'Major Cloak of Displacement', slot: 'shoulders' },
  { name: 'Cape of the Mountebank', slot: 'shoulders' },
  { name: 'Wings of Flying', slot: 'shoulders' },
  { name: 'Vest of Escape', slot: 'chest' },
  { name: 'Vestment of Many Styles', slot: 'chest' },
  { name: "Druid's Vestment", slot: 'chest' },
  { name: 'Mantle of Faith', slot: 'chest' },
  { name: 'Mantle of Spell Resistance', slot: 'chest' },
  { name: 'Robe of the Archmagi', slot: 'body' },
  { name: 'Robe of Useful Items', slot: 'body' },
  { name: 'Robe of Scintillating Colors', slot: 'body' },
  { name: 'Robe of Blending', slot: 'body' },
  { name: 'Robe of Eyes', slot: 'body' },
  { name: 'Robe of Bones', slot: 'body' },
  { name: 'Celestial Armor', slot: 'armor' },
  { name: 'Demon Armor', slot: 'armor' },
  { name: 'Elven Chain', slot: 'armor' },
  { name: 'Gloves of Dexterity (+2)', slot: 'hands' },
  { name: 'Gloves of Dexterity (+4)', slot: 'hands' },
  { name: 'Gloves of Dexterity (+6)', slot: 'hands' },
  { name: 'Gauntlets of Ogre Power', slot: 'hands' },
  { name: 'Gloves of Arrow Snaring', slot: 'hands' },
  { name: 'Gloves of Swimming and Climbing', slot: 'hands' },
  { name: 'Gauntlet of Rust', slot: 'hands' },
  { name: 'Glove of Storing', slot: 'hands' },
  { name: 'Bracers of Armor (+1)', slot: 'arms' },
  { name: 'Bracers of Armor (+2)', slot: 'arms' },
  { name: 'Bracers of Armor (+3)', slot: 'arms' },
  { name: 'Bracers of Armor (+4)', slot: 'arms' },
  { name: 'Bracers of Armor (+5)', slot: 'arms' },
  { name: 'Bracers of Armor (+6)', slot: 'arms' },
  { name: 'Bracers of Armor (+7)', slot: 'arms' },
  { name: 'Bracers of Armor (+8)', slot: 'arms' },
  { name: 'Lesser Bracers of Archery', slot: 'arms' },
  { name: 'Greater Bracers of Archery', slot: 'arms' },
  { name: 'Armbands of Might', slot: 'arms' },
  { name: 'Belt of Giant Strength (+2)', slot: 'waist' },
  { name: 'Belt of Giant Strength (+4)', slot: 'waist' },
  { name: 'Belt of Giant Strength (+6)', slot: 'waist' },
  { name: 'Belt of Battle', slot: 'waist' },
  { name: 'Healing Belt', slot: 'waist' },
  { name: "Monk's Belt", slot: 'waist' },
  { name: 'Girdle of Many Pouches', slot: 'waist' },
  { name: 'Boots of Speed', slot: 'feet' },
  { name: 'Boots of Striding and Springing', slot: 'feet' },
  { name: 'Boots of Elvenkind', slot: 'feet' },
  { name: 'Slippers of Spider Climbing', slot: 'feet' },
  { name: 'Winged Boots', slot: 'feet' },
  { name: 'Boots of Levitation', slot: 'feet' },
  { name: 'Boots of the Winterlands', slot: 'feet' },
  { name: 'Boots of Teleportation', slot: 'feet' },
  { name: 'Ring of Protection (+1)', slot: 'ring1' },
  { name: 'Ring of Protection (+2)', slot: 'ring1' },
  { name: 'Ring of Protection (+3)', slot: 'ring1' },
  { name: 'Ring of Protection (+4)', slot: 'ring1' },
  { name: 'Ring of Protection (+5)', slot: 'ring1' },
  { name: 'Ring of Sustenance', slot: 'ring1' },
  { name: 'Ring of Invisibility', slot: 'ring1' },
  { name: 'Ring of Feather Falling', slot: 'ring1' },
  { name: 'Ring of Wizardry (I)', slot: 'ring1' },
  { name: 'Ring of Wizardry (II)', slot: 'ring1' },
  { name: 'Ring of Wizardry (III)', slot: 'ring1' },
  { name: 'Ring of Wizardry (IV)', slot: 'ring1' },
  { name: 'Ring of Evasion', slot: 'ring1' },
  { name: 'Ring of Freedom of Movement', slot: 'ring1' },
  { name: 'Ring of Counterspells', slot: 'ring1' },
  { name: 'Ring of Force Shield', slot: 'ring1' },
  { name: 'Minor Ring of Energy Resistance', slot: 'ring1' },
  { name: 'Major Ring of Energy Resistance', slot: 'ring1' },
  { name: 'Ring of Mind Shielding', slot: 'ring1' },
  { name: 'Ring of Regeneration', slot: 'ring1' },
  { name: 'Ring of Spell Turning', slot: 'ring1' },
  { name: 'Ring of Blinking', slot: 'ring1' },
  { name: 'Ring of Jumping', slot: 'ring1' },
  { name: 'Bag of Holding (Type I)', slot: 'slotless' },
  { name: 'Bag of Holding (Type II)', slot: 'slotless' },
  { name: 'Bag of Holding (Type III)', slot: 'slotless' },
  { name: 'Bag of Holding (Type IV)', slot: 'slotless' },
  { name: "Heward's Handy Haversack", slot: 'slotless' },
  { name: 'Portable Hole', slot: 'slotless' },
  { name: 'Quiver of Ehlonna', slot: 'slotless' },
  { name: 'Stone of Good Luck', slot: 'slotless' },
  { name: 'Pearl of Power (1st level)', slot: 'slotless' },
  { name: 'Pearl of Power (2nd level)', slot: 'slotless' },
  { name: 'Pearl of Power (3rd level)', slot: 'slotless' },
  { name: 'Pearl of Power (4th level)', slot: 'slotless' },
  { name: 'Pearl of Power (5th level)', slot: 'slotless' },
  { name: 'Pearl of Power (6th level)', slot: 'slotless' },
  { name: 'Pearl of Power (7th level)', slot: 'slotless' },
  { name: 'Pearl of Power (8th level)', slot: 'slotless' },
  { name: 'Pearl of Power (9th level)', slot: 'slotless' },
  { name: 'Ioun Stone (Dusty Rose)', slot: 'slotless' },
  { name: 'Ioun Stone (Pale Green)', slot: 'slotless' },
  { name: 'Ioun Stone (Orange)', slot: 'slotless' },
  { name: 'Ioun Stone (Clear Spindle)', slot: 'slotless' },
  { name: 'Ioun Stone (Incandescent Blue)', slot: 'slotless' },
  { name: 'Ioun Stone (Deep Red)', slot: 'slotless' },
  { name: 'Ioun Stone (Pink & Green)', slot: 'slotless' },
  { name: 'Ioun Stone (Pink)', slot: 'slotless' },
  { name: 'Ioun Stone (Scarlet & Blue)', slot: 'slotless' },
  { name: 'Ioun Stone (Pearly White)', slot: 'slotless' },
  { name: 'Ioun Stone (Dark Blue)', slot: 'slotless' },
  { name: 'Decanter of Endless Water', slot: 'slotless' },
  { name: 'Eversmoking Bottle', slot: 'slotless' },
  { name: 'Horseshoes of Speed', slot: 'slotless' },
  { name: 'Horseshoes of a Zephyr', slot: 'slotless' },
  { name: 'Chime of Opening', slot: 'slotless' },
  { name: 'Gem of Seeing', slot: 'slotless' },
  { name: 'Strand of Prayer Beads', slot: 'slotless' },
  { name: 'Cube of Force', slot: 'slotless' },
  { name: 'Sustaining Spoon', slot: 'slotless' }
];

describe('3.5e Standard Wondrous Items Catalog', () => {
  it('contains exactly the 176 items specified in the user catalog', () => {
    expect(STANDARD_WONDROUS_ITEMS).toHaveLength(EXPECTED_USER_ITEMS.length);
    expect(STANDARD_WONDROUS_ITEMS).toHaveLength(176);
  });

  it('includes every requested item from the user list with matching name and slot', () => {
    const catalogMap = new Map(STANDARD_WONDROUS_ITEMS.map(i => [i.name.toLowerCase(), i]));

    for (const expected of EXPECTED_USER_ITEMS) {
      const found = catalogMap.get(expected.name.toLowerCase());
      expect(found, `Expected item "${expected.name}" to exist in catalog`).toBeDefined();
      expect(found?.slot, `Expected slot for "${expected.name}"`).toBe(expected.slot);
      expect(found?.effect, `Expected effect for "${expected.name}"`).toBeTruthy();
      expect(found?.cost, `Expected cost for "${expected.name}"`).toBeTruthy();
      expect(found?.source, `Expected source for "${expected.name}"`).toBeTruthy();
    }
  });

  it('filters items by body slot correctly', () => {
    const headItems = getPredefinedWondrousItems('head');
    expect(headItems).toHaveLength(11);
    expect(headItems.every(i => i.slot === 'head')).toBe(true);

    const headbandItems = getPredefinedWondrousItems('headband');
    expect(headbandItems).toHaveLength(12);

    const neckItems = getPredefinedWondrousItems('neck');
    expect(neckItems).toHaveLength(29);

    const shoulderItems = getPredefinedWondrousItems('shoulders');
    expect(shoulderItems).toHaveLength(16);

    const waistItems = getPredefinedWondrousItems('waist');
    expect(waistItems).toHaveLength(7);

    // Ring filtering includes ring items for both ring1 and ring2
    const ring1Items = getPredefinedWondrousItems('ring1');
    const ring2Items = getPredefinedWondrousItems('ring2');
    expect(ring1Items).toHaveLength(23);
    expect(ring2Items).toHaveLength(23);

    const slotlessItems = getPredefinedWondrousItems('slotless');
    expect(slotlessItems).toHaveLength(37);
  });

  it('filters items by search query case-insensitively', () => {
    const teleportItems = getPredefinedWondrousItems('all', 'teleport');
    expect(teleportItems.length).toBeGreaterThanOrEqual(2);
    expect(teleportItems.some(i => i.name === 'Helm of Teleportation')).toBe(true);
    expect(teleportItems.some(i => i.name === 'Boots of Teleportation')).toBe(true);

    const iounStones = getPredefinedWondrousItems('all', 'ioun stone');
    expect(iounStones).toHaveLength(11);

    const healingBelt = getPredefinedWondrousItems('waist', 'healing');
    expect(healingBelt).toHaveLength(1);
    expect(healingBelt[0].name).toBe('Healing Belt');
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

  it('assigns canonical source codes (DMG, MIC, CAr, RoD) to all 176 items', () => {
    const validSources = new Set(['DMG', 'MIC', 'CAr', 'RoD']);

    for (const item of STANDARD_WONDROUS_ITEMS) {
      expect(validSources.has(item.source), `Item "${item.name}" has invalid source: "${item.source}"`).toBe(true);
    }

    const dmgItems = STANDARD_WONDROUS_ITEMS.filter(i => i.source === 'DMG');
    const micItems = STANDARD_WONDROUS_ITEMS.filter(i => i.source === 'MIC');
    const carItems = STANDARD_WONDROUS_ITEMS.filter(i => i.source === 'CAr');
    const rodItems = STANDARD_WONDROUS_ITEMS.filter(i => i.source === 'RoD');

    expect(dmgItems).toHaveLength(171);
    expect(micItems).toHaveLength(3);
    expect(carItems).toHaveLength(1);
    expect(rodItems).toHaveLength(1);

    expect(micItems.map(i => i.name).sort()).toEqual([
      'Armbands of Might',
      'Belt of Battle',
      'Healing Belt'
    ]);
    expect(carItems[0].name).toBe('Girdle of Many Pouches');
    expect(rodItems[0].name).toBe('Vestment of Many Styles');
  });

  it('filters wondrous items by allowedSources when includeDisallowedSources is false', () => {
    // 1. Core Only: only DMG items returned
    const coreOnly = getPredefinedWondrousItems('all', undefined, ['PHB', 'DMG', 'MM'], false);
    expect(coreOnly).toHaveLength(171);
    expect(coreOnly.every(i => i.source === 'DMG')).toBe(true);
    expect(coreOnly.some(i => i.name === 'Belt of Battle')).toBe(false);
    expect(coreOnly.some(i => i.name === 'Healing Belt')).toBe(false);
    expect(coreOnly.some(i => i.name === 'Armbands of Might')).toBe(false);
    expect(coreOnly.some(i => i.name === 'Girdle of Many Pouches')).toBe(false);
    expect(coreOnly.some(i => i.name === 'Vestment of Many Styles')).toBe(false);

    // 2. Core + Magic Item Compendium (id: 'Mag'): MIC items included
    const corePlusMic = getPredefinedWondrousItems('all', undefined, ['PHB', 'DMG', 'MM', 'Mag'], false);
    expect(corePlusMic).toHaveLength(174);
    expect(corePlusMic.some(i => i.name === 'Belt of Battle')).toBe(true);
    expect(corePlusMic.some(i => i.name === 'Healing Belt')).toBe(true);
    expect(corePlusMic.some(i => i.name === 'Armbands of Might')).toBe(true);
    expect(corePlusMic.some(i => i.name === 'Girdle of Many Pouches')).toBe(false);

    // 3. Bidirectional tolerance: ['MIC'] alias directly in allowedSources
    const corePlusMicAlias = getPredefinedWondrousItems('all', undefined, ['PHB', 'DMG', 'MM', 'MIC'], false);
    expect(corePlusMicAlias).toHaveLength(174);

    // 4. Core + Complete Arcane ('CAr') + Races of Destiny ('RoD')
    const corePlusCarRod = getPredefinedWondrousItems('all', undefined, ['PHB', 'DMG', 'MM', 'CAr', 'RoD'], false);
    expect(corePlusCarRod).toHaveLength(173);
    expect(corePlusCarRod.some(i => i.name === 'Girdle of Many Pouches')).toBe(true);
    expect(corePlusCarRod.some(i => i.name === 'Vestment of Many Styles')).toBe(true);
    expect(corePlusCarRod.some(i => i.name === 'Belt of Battle')).toBe(false);

    // 5. When includeDisallowedSources is true: all 176 items returned regardless
    const allAllowed = getPredefinedWondrousItems('all', undefined, ['PHB', 'DMG', 'MM'], true);
    expect(allAllowed).toHaveLength(176);
  });
});
