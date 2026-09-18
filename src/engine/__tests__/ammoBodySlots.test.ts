import { describe, it, expect } from 'vitest';
import {
  CANONICAL_BODY_SLOTS,
  BODY_SLOT_MAP,
  validateBodySlots,
  getMatchingAmmoTypeForWeapon,
  createInventoryAmmo,
  getCharacterAmmunition,
  decrementEquippedAmmunition,
  STANDARD_AMMO_PRESETS
} from '../equipment';
import { CharacterState, InventoryItem, Equipment, CharacterSheetData } from '../../types/character';
import { migrateAmmunitionAndBodySlots } from '../../storage/migration';

describe('3.5e 12-Body-Slot Validation Engine', () => {
  it('defines the 13 canonical 3.5e body slots + slotless (14 total slots)', () => {
    expect(CANONICAL_BODY_SLOTS).toHaveLength(14);
    expect(BODY_SLOT_MAP.head).toBeDefined();
    expect(BODY_SLOT_MAP.headband).toBeDefined();
    expect(BODY_SLOT_MAP.neck).toBeDefined();
    expect(BODY_SLOT_MAP.shoulders).toBeDefined();
    expect(BODY_SLOT_MAP.chest).toBeDefined();
    expect(BODY_SLOT_MAP.body).toBeDefined();
    expect(BODY_SLOT_MAP.armor).toBeDefined();
    expect(BODY_SLOT_MAP.hands).toBeDefined();
    expect(BODY_SLOT_MAP.arms).toBeDefined();
    expect(BODY_SLOT_MAP.waist).toBeDefined();
    expect(BODY_SLOT_MAP.feet).toBeDefined();
    expect(BODY_SLOT_MAP.ring1).toBeDefined();
    expect(BODY_SLOT_MAP.ring2).toBeDefined();
    expect(BODY_SLOT_MAP.slotless).toBeDefined();

    // Verify affinities and source references
    expect(BODY_SLOT_MAP.head.affinity).toContain('Mental acuity');
    expect(BODY_SLOT_MAP.neck.affinity).toContain('natural armor');
    expect(BODY_SLOT_MAP.waist.affinity).toContain('Strength bonuses');
  });

  it('reports zero conflicts for a character with no magic items or armor', () => {
    const eq: Equipment = {
      armor: 'none',
      armorEnhancement: 0,
      shield: 'none',
      shieldEnhancement: 0,
      deflection: 0,
      natural: 0,
      dodge: 0,
      primaryWeapon: 'none',
      wondrousItems: []
    };
    const report = validateBodySlots(eq);
    expect(report.totalConflicts).toBe(0);
    expect(report.totalOccupiedSlots).toBe(0);
    expect(report.conflictSummary).toHaveLength(0);
    expect(report.isAllValid).toBe(true);
  });

  it('reports no conflict when single items occupy separate slots', () => {
    const eq: Equipment = {
      armor: 'none',
      armorEnhancement: 0,
      shield: 'none',
      shieldEnhancement: 0,
      deflection: 0,
      natural: 0,
      dodge: 0,
      primaryWeapon: 'none',
      wondrousItems: [
        { id: '1', name: 'Helm of Telepathy', slot: 'head', effect: 'Read thoughts' },
        { id: '2', name: 'Amulet of Natural Armor +2', slot: 'neck', effect: '+2 NA' },
        { id: '3', name: 'Cloak of Resistance +3', slot: 'shoulders', effect: '+3 Saves' },
        { id: '4', name: 'Belt of Giant Strength +4', slot: 'waist', effect: '+4 Str' },
        { id: '5', name: 'Boots of Speed', slot: 'feet', effect: 'Haste' }
      ]
    };

    const report = validateBodySlots(eq);
    expect(report.totalConflicts).toBe(0);
    expect(report.totalOccupiedSlots).toBe(5);
    expect(report.slots.head.equippedItems).toHaveLength(1);
    expect(report.slots.neck.equippedItems).toHaveLength(1);
    expect(report.slots.shoulders.equippedItems).toHaveLength(1);
    expect(report.slots.waist.equippedItems).toHaveLength(1);
    expect(report.slots.feet.equippedItems).toHaveLength(1);
    expect(report.isAllValid).toBe(true);
  });

  it('detects a conflict when two items occupy the same single-item slot', () => {
    const eq: Equipment = {
      armor: 'none',
      armorEnhancement: 0,
      shield: 'none',
      shieldEnhancement: 0,
      deflection: 0,
      natural: 0,
      dodge: 0,
      primaryWeapon: 'none',
      wondrousItems: [
        { id: '1', name: 'Helm of Telepathy', slot: 'head', effect: 'Read thoughts' },
        { id: '2', name: 'Circlet of Persuasion', slot: 'head', effect: '+3 to Cha checks' }
      ]
    };

    const report = validateBodySlots(eq);
    expect(report.totalConflicts).toBe(1);
    expect(report.slots.head.hasConflict).toBe(true);
    expect(report.slots.head.equippedItems).toHaveLength(2);
    expect(report.conflictSummary[0]).toContain('Head');
    expect(report.isAllValid).toBe(false);
  });

  it('permits distinct ring slots ring1 and ring2 without conflict, but flags duplicate items in ring1', () => {
    const validRingsEq: Equipment = {
      armor: 'none',
      armorEnhancement: 0,
      shield: 'none',
      shieldEnhancement: 0,
      deflection: 0,
      natural: 0,
      dodge: 0,
      primaryWeapon: 'none',
      wondrousItems: [
        { id: 'r1', name: 'Ring of Protection +2', slot: 'ring1', effect: '+2 AC' },
        { id: 'r2', name: 'Ring of Invisibility', slot: 'ring2', effect: 'Invisibility' }
      ]
    };

    const validReport = validateBodySlots(validRingsEq);
    expect(validReport.totalConflicts).toBe(0);
    expect(validReport.slots.ring1.hasConflict).toBe(false);
    expect(validReport.slots.ring2.hasConflict).toBe(false);

    const duplicateRing1Eq: Equipment = {
      ...validRingsEq,
      wondrousItems: [
        { id: 'r1', name: 'Ring of Protection +2', slot: 'ring1', effect: '+2 AC' },
        { id: 'r2', name: 'Ring of Wizardry I', slot: 'ring1', effect: 'Double L1 spells' }
      ]
    };

    const conflictReport = validateBodySlots(duplicateRing1Eq);
    expect(conflictReport.totalConflicts).toBe(1);
    expect(conflictReport.slots.ring1.hasConflict).toBe(true);
    expect(conflictReport.slots.ring1.equippedItems).toHaveLength(2);
  });

  it('detects conflict between equipped armor and wondrous item in armor slot', () => {
    const eqWithArmorConflict: Equipment = {
      armor: 'fullplate',
      armorEnhancement: 0,
      shield: 'none',
      shieldEnhancement: 0,
      deflection: 0,
      natural: 0,
      dodge: 0,
      primaryWeapon: 'none',
      wondrousItems: [
        { id: 'w1', name: 'Robe of the Archmagi', slot: 'armor', effect: 'Armor Bonus +5' }
      ]
    };

    const reportConflict = validateBodySlots(eqWithArmorConflict);
    expect(reportConflict.totalConflicts).toBe(1);
    expect(reportConflict.slots.armor.hasConflict).toBe(true);
    expect(reportConflict.slots.armor.equippedItems).toHaveLength(2);
    expect(reportConflict.slots.armor.equippedItems[0].source).toBe('armor');
    expect(reportConflict.slots.armor.equippedItems[1].source).toBe('wondrous');
    expect(reportConflict.conflictSummary[0]).toContain('Armor');

    // With no armor equipped
    const eqNoArmor: Equipment = {
      ...eqWithArmorConflict,
      armor: 'none'
    };
    const reportNoConflict = validateBodySlots(eqNoArmor);
    expect(reportNoConflict.totalConflicts).toBe(0);
    expect(reportNoConflict.slots.armor.hasConflict).toBe(false);
    expect(reportNoConflict.slots.armor.equippedItems).toHaveLength(1);
  });

  it('permits unlimited slotless items without conflict', () => {
    const eq: Equipment = {
      armor: 'none',
      armorEnhancement: 0,
      shield: 'none',
      shieldEnhancement: 0,
      deflection: 0,
      natural: 0,
      dodge: 0,
      primaryWeapon: 'none',
      wondrousItems: [
        { id: 's1', name: 'Dusty Rose Ioun Stone', slot: 'slotless', effect: '+1 insight AC' },
        { id: 's2', name: 'Orange Ioun Stone', slot: 'slotless', effect: '+1 CL' },
        { id: 's3', name: 'Clear Spindle Ioun Stone', slot: 'slotless', effect: 'Sustenance' },
        { id: 's4', name: 'Bag of Holding', slot: 'slotless', effect: 'Storage' }
      ]
    };

    const report = validateBodySlots(eq);
    expect(report.totalConflicts).toBe(0);
    expect(report.slots.slotless.hasConflict).toBe(false);
    expect(report.slots.slotless.equippedItems).toHaveLength(4);
  });
});

describe('Ammunition Tracking & Auto-Decrement Engine', () => {
  it('correctly maps weapons to canonical 3.5e ammunition categories', () => {
    expect(getMatchingAmmoTypeForWeapon('Longbow')).toBe('arrow');
    expect(getMatchingAmmoTypeForWeapon('Composite Longbow')).toBe('arrow');
    expect(getMatchingAmmoTypeForWeapon('Shortbow')).toBe('arrow');
    expect(getMatchingAmmoTypeForWeapon('Composite Shortbow')).toBe('arrow');
    expect(getMatchingAmmoTypeForWeapon('Heavy Crossbow')).toBe('bolt');
    expect(getMatchingAmmoTypeForWeapon('Light Crossbow')).toBe('bolt');
    expect(getMatchingAmmoTypeForWeapon('Hand Crossbow')).toBe('bolt');
    expect(getMatchingAmmoTypeForWeapon('Repeating Heavy Crossbow')).toBe('bolt');
    expect(getMatchingAmmoTypeForWeapon('Sling')).toBe('bullet');
    expect(getMatchingAmmoTypeForWeapon('Blowgun')).toBe('needle');
    expect(getMatchingAmmoTypeForWeapon('Shuriken')).toBe('shuriken');
    expect(getMatchingAmmoTypeForWeapon('Greatsword')).toBe('other');
    expect(getMatchingAmmoTypeForWeapon('Dagger')).toBe('other');
  });

  it('creates inventory ammunition with standard preset properties', () => {
    const arrowPreset = STANDARD_AMMO_PRESETS.find(p => p.id === 'arrows_20')!;
    expect(arrowPreset).toBeDefined();
    const item = createInventoryAmmo(arrowPreset);

    expect(item.id).toMatch(/^ammo-/);
    expect(item.name).toBe('Arrows (20)');
    expect(item.quantity).toBe(20);
    expect(item.weight).toBe(0.15); // 3 lbs / 20 arrows = 0.15 lbs per unit
    expect(item.itemType).toBe('ammunition');
    expect(item.ammoType).toBe('arrow');
    expect(item.location).toBe('Quiver');
  });

  it('filters and retrieves all ammunition items from character inventory', () => {
    const char = {
      inventory: [
        { id: '1', name: 'Longsword', quantity: 1, weight: 4, itemType: 'weapon', location: 'Carried' },
        { id: '2', name: 'Arrows (20)', quantity: 20, weight: 3, itemType: 'ammunition', ammoType: 'arrow', location: 'Quiver' },
        { id: '3', name: 'Crossbow Bolts (10)', quantity: 10, weight: 1, itemType: 'ammunition', ammoType: 'bolt', location: 'Quiver' }
      ]
    } as unknown as CharacterState;

    const ammo = getCharacterAmmunition(char);
    expect(ammo).toHaveLength(2);
    expect(ammo[0].name).toBe('Arrows (20)');
    expect(ammo[1].name).toBe('Crossbow Bolts (10)');
  });

  it('does not decrement ammunition when autoDecrementAmmo is disabled', () => {
    const char = {
      equipment: {
        primaryWeapon: 'Longbow',
        equippedAmmoId: 'ammo_1',
        autoDecrementAmmo: false
      },
      inventory: [
        { id: 'ammo_1', name: 'Arrows (20)', quantity: 20, weight: 3, itemType: 'ammunition', ammoType: 'arrow', location: 'Quiver' }
      ]
    } as unknown as CharacterState;

    const result = decrementEquippedAmmunition(char, 1);
    expect(result.updatedCharacter).toBe(char);
    expect(result.updatedCharacter.inventory[0].quantity).toBe(20);
    expect(result.countDrawn).toBe(0);
  });

  it('decrements ammunition by 1 on single attack when autoDecrementAmmo is enabled', () => {
    const char = {
      equipment: {
        primaryWeapon: 'Longbow',
        equippedAmmoId: 'ammo_1',
        autoDecrementAmmo: true
      },
      inventory: [
        { id: 'ammo_1', name: 'Arrows (20)', quantity: 20, weight: 3, itemType: 'ammunition', ammoType: 'arrow', location: 'Quiver' }
      ]
    } as unknown as CharacterState;

    const result = decrementEquippedAmmunition(char, 1);
    expect(result.updatedCharacter.inventory[0].quantity).toBe(19);
    expect(result.countDrawn).toBe(1);
    expect(result.remaining).toBe(19);
    expect(result.exhausted).toBe(false);
  });

  it('decrements multiple ammunition on full attack sequence', () => {
    const char = {
      equipment: {
        primaryWeapon: 'Longbow',
        equippedAmmoId: 'ammo_1',
        autoDecrementAmmo: true
      },
      inventory: [
        { id: 'ammo_1', name: 'Arrows (20)', quantity: 10, weight: 3, itemType: 'ammunition', ammoType: 'arrow', location: 'Quiver' }
      ]
    } as unknown as CharacterState;

    // Full attack with 3 attacks (e.g. +11/+6/+1)
    const result = decrementEquippedAmmunition(char, 3);
    expect(result.updatedCharacter.inventory[0].quantity).toBe(7);
    expect(result.countDrawn).toBe(3);
    expect(result.remaining).toBe(7);
  });

  it('clamps ammunition quantity at 0 without going negative and flags exhaustion', () => {
    const char = {
      equipment: {
        primaryWeapon: 'Longbow',
        equippedAmmoId: 'ammo_1',
        autoDecrementAmmo: true
      },
      inventory: [
        { id: 'ammo_1', name: 'Arrows (20)', quantity: 2, weight: 3, itemType: 'ammunition', ammoType: 'arrow', location: 'Quiver' }
      ]
    } as unknown as CharacterState;

    const result = decrementEquippedAmmunition(char, 4);
    expect(result.updatedCharacter.inventory[0].quantity).toBe(0);
    expect(result.countDrawn).toBe(2);
    expect(result.remaining).toBe(0);
    expect(result.exhausted).toBe(true);

    // Further decrement does not make it negative
    const next = decrementEquippedAmmunition(result.updatedCharacter, 1);
    expect(next.updatedCharacter.inventory[0].quantity).toBe(0);
    expect(next.countDrawn).toBe(0);
    expect(next.remaining).toBe(0);
  });

  it('automatically falls back to matching inventory ammo if equippedAmmoId is unassigned', () => {
    const char = {
      equipment: {
        primaryWeapon: 'Longsword',
        rangedWeapon: 'Heavy Crossbow',
        equippedAmmoId: undefined,
        autoDecrementAmmo: true
      },
      inventory: [
        { id: 'ammo_bolts', name: 'Crossbow Bolts (10)', quantity: 10, weight: 1, itemType: 'ammunition', ammoType: 'bolt', location: 'Quiver' }
      ]
    } as unknown as CharacterState;

    const result = decrementEquippedAmmunition(char, 1);
    expect(result.updatedCharacter.equipment.equippedAmmoId).toBe('ammo_bolts');
    expect(result.updatedCharacter.inventory[0].quantity).toBe(9);
  });
});

describe('Ammunition & Body Slot Migration Pipeline', () => {
  it('migrates legacy inventory ammo strings to canonical ammunition items', () => {
    const legacyChar = {
      equipment: {
        primaryWeapon: 'Longbow',
        wondrousItems: [
          { id: 'w1', name: 'Helm of Telepathy', slot: 'head' }
        ]
      },
      inventory: [
        { id: '1', name: 'Arrows (20)', quantity: 20, weight: 3, location: 'Carried' },
        { id: '2', name: 'Crossbow bolts (10)', quantity: 10, weight: 1, location: 'Carried' },
        { id: '3', name: 'Sling bullets (10)', quantity: 10, weight: 5, location: 'Carried' },
        { id: '4', name: 'Rope (50ft)', quantity: 1, weight: 10, location: 'Carried' }
      ]
    } as unknown as CharacterSheetData;

    const migrated = migrateAmmunitionAndBodySlots(legacyChar);

    expect(migrated.inventory[0].itemType).toBe('ammunition');
    expect(migrated.inventory[0].ammoType).toBe('arrow');

    expect(migrated.inventory[1].itemType).toBe('ammunition');
    expect(migrated.inventory[1].ammoType).toBe('bolt');

    expect(migrated.inventory[2].itemType).toBe('ammunition');
    expect(migrated.inventory[2].ammoType).toBe('bullet');

    expect(migrated.inventory[3].itemType).toBeUndefined();

    expect(migrated.equipment.autoDecrementAmmo).toBe(false);
    expect(migrated.equipment.equippedAmmoId).toBe('1');
  });

  it('is strictly idempotent on repeated runs', () => {
    const char = {
      equipment: {
        primaryWeapon: 'Longbow',
        equippedAmmoId: 'ammo_1',
        autoDecrementAmmo: true,
        wondrousItems: []
      },
      inventory: [
        { id: 'ammo_1', name: 'Silver Arrows (20)', quantity: 20, weight: 3, itemType: 'ammunition', ammoType: 'arrow', location: 'Quiver' }
      ]
    } as unknown as CharacterSheetData;

    const run1 = migrateAmmunitionAndBodySlots(char);
    const run2 = migrateAmmunitionAndBodySlots(run1);

    expect(run1).toEqual(run2);
    expect(run2.equipment.equippedAmmoId).toBe('ammo_1');
    expect(run2.equipment.autoDecrementAmmo).toBe(true);
    expect(run2.inventory[0].quantity).toBe(20);
  });
});
