/**
 * 3.5e Standard Wondrous Items & Magic Gear Catalog
 * Sources: Dungeon Master's Guide (DMG Ch. 7),
 * Magic Item Compendium (MIC), Complete Arcane (CAr), Races of Destiny (RoD).
 */

import { BodySlotId, WondrousItem, InventoryItem } from '../types/character';
import { isSourceAllowed } from '../utils/sourceFilter';
import wondrousItemsData from '../data/wondrous_items.json';

export interface PredefinedWondrousItem {
  id: string;
  name: string;
  slot: BodySlotId;
  effect: string;
  cost?: string;
  weight?: number;
  source: string;
  category?: string;
}

export const STANDARD_WONDROUS_ITEMS: PredefinedWondrousItem[] = wondrousItemsData as PredefinedWondrousItem[];

/**
 * Filter predefined wondrous items by slot or search text.
 */
export function getPredefinedWondrousItems(
  slotFilter?: BodySlotId | 'all',
  searchQuery?: string,
  allowedSources?: string[],
  includeDisallowedSources: boolean = true
): PredefinedWondrousItem[] {
  let items = STANDARD_WONDROUS_ITEMS;

  if (slotFilter && slotFilter !== 'all') {
    if (slotFilter === 'ring1' || slotFilter === 'ring2') {
      items = items.filter(i => i.slot === 'ring1' || i.slot === 'ring2');
    } else {
      items = items.filter(i => i.slot === slotFilter);
    }
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    items = items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.effect.toLowerCase().includes(q) ||
      i.source.toLowerCase().includes(q) ||
      i.slot.toLowerCase().includes(q)
    );
  }

  if (allowedSources && allowedSources.length > 0 && !includeDisallowedSources) {
    items = items.filter(i => isSourceAllowed(i.source, allowedSources));
  }

  return items;
}

/**
 * Creates both a WondrousItem entry and a matching InventoryItem entry
 * from a predefined wondrous item definition.
 */
export function createWondrousItemFromPredefined(
  predefined: PredefinedWondrousItem,
  targetSlotOverride?: BodySlotId
): { wondrousItem: WondrousItem; inventoryItem: InventoryItem } {
  const invId = `inv_wondrous_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const wondrousId = `wondrous_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const finalSlot = targetSlotOverride || predefined.slot;

  const wondrousItem: WondrousItem = {
    id: wondrousId,
    name: predefined.name,
    slot: finalSlot,
    effect: predefined.effect,
    weight: predefined.weight,
    source: predefined.source,
    inventoryItemId: invId
  };

  const inventoryItem: InventoryItem = {
    id: invId,
    name: predefined.name,
    quantity: 1,
    weight: predefined.weight ?? 0,
    location: 'Carried',
    value: predefined.cost,
    notes: predefined.effect,
    itemType: 'wondrous',
    bodySlot: finalSlot,
    source: predefined.source
  };

  return { wondrousItem, inventoryItem };
}
