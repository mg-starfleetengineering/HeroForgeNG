import React, { useState, useMemo, useEffect } from 'react';
import { CharacterState, WeaponData, RaceData, ClassData, Equipment, CustomArmorData, WondrousItem, InventoryItem, Funds } from '../types/character';
import { getSourceBadgeInfo, sortDropdownItems } from '../utils/sourceFilter';
import { SearchableSelect, SearchableOption } from './SearchableSelect';
import { calculateTotalScore, getAbilityMod, parseRaceMods } from '../engine/stats';
import { calculateBAB } from '../engine/classes';
import {
  resolveWeapon, resolveArmor, resolveShield, calculateFeatCombatBonuses,
  calculateCarryingCapacity, calculateCoinWeight, calculateTotalNetWorthGP,
  calculateTotalCarriedWeight, getEncumbranceStatus, ARMOR_WEIGHT_MAP, SHIELD_WEIGHT_MAP,
  ensureEquippedItemInInventory, isItemInInventory, syncEquippedItemsToInventory
} from '../engine/equipment';

interface EquipmentTabProps {
  character: CharacterState;
  weaponsData: WeaponData[];
  racesData: RaceData[];
  classesData: ClassData[];
  onChange: (updated: Partial<CharacterState>) => void;
}

const COMMON_ITEM_PRESETS = [
  { name: "Explorer's Backpack", weight: 2, location: 'Carried', value: '2 gp', notes: 'Holds up to 2 cu. ft. / 60 lbs' },
  { name: "Belt Pouch", weight: 0.5, location: 'Carried', value: '1 gp', notes: 'Holds up to 1/5 cu. ft. / 10 lbs' },
  { name: "Handy Haversack", weight: 5, location: 'Carried', value: '2,000 gp', notes: 'Magic container: items inside weigh 0 lbs' },
  { name: "Bedroll", weight: 5, location: 'Backpack', value: '1 sp' },
  { name: "Trail Rations (1 day)", weight: 1, location: 'Backpack', value: '5 sp' },
  { name: "Waterskin", weight: 4, location: 'Carried', value: '1 gp' },
  { name: "Flint and Steel", weight: 0, location: 'Belt Pouch', value: '1 gp' },
  { name: "Torches (5)", weight: 5, location: 'Backpack', value: '5 cp' },
  { name: "Hempen Rope (50 ft)", weight: 10, location: 'Backpack', value: '1 gp' },
  { name: "Silk Rope (50 ft)", weight: 5, location: 'Backpack', value: '10 gp' },
  { name: "Grappling Hook", weight: 4, location: 'Backpack', value: '1 gp' },
  { name: "Crowbar", weight: 5, location: 'Backpack', value: '2 gp' },
  { name: "Potion of Cure Light Wounds", weight: 0.1, location: 'Belt Pouch', value: '50 gp', notes: 'Heals 1d8+1 HP' },
  { name: "Potion of Cure Moderate Wounds", weight: 0.1, location: 'Belt Pouch', value: '300 gp', notes: 'Heals 2d8+3 HP' },
  { name: "Potion of Cure Serious Wounds", weight: 0.1, location: 'Belt Pouch', value: '750 gp', notes: 'Heals 3d8+5 HP' },
  { name: "Scroll of Fly", weight: 0, location: 'Belt Pouch', value: '375 gp' },
  { name: "Wand of Cure Light Wounds (50 chg)", weight: 0.1, location: 'Belt Pouch', value: '750 gp' },
  { name: "Spellbook (Blank)", weight: 3, location: 'Backpack', value: '15 gp', notes: '100 pages' },
  { name: "Healer's Kit (10 uses)", weight: 1, location: 'Backpack', value: '50 gp', notes: '+2 Heal check' },
  { name: "Thieves' Tools (Masterwork)", weight: 2, location: 'Belt Pouch', value: '100 gp', notes: '+2 Open Lock/Disable Device' },
  { name: "Alchemist's Fire (Flask)", weight: 1, location: 'Belt Pouch', value: '20 gp', notes: '1d6 fire dmg' },
  { name: "Sunrod", weight: 1, location: 'Backpack', value: '2 gp', notes: 'Provides light 30 ft radius' },
  { name: "Tanglefoot Bag", weight: 4, location: 'Backpack', value: '50 gp' },
  { name: "Spyglass", weight: 1, location: 'Belt Pouch', value: '1,000 gp' }
].sort((a, b) => a.name.localeCompare(b.name));

export const EquipmentTab: React.FC<EquipmentTabProps> = ({
  character,
  weaponsData,
  racesData,
  classesData,
  onChange
}) => {
  const [showCustomWpnModal, setShowCustomWpnModal] = useState(false);
  const [showCustomArmorModal, setShowCustomArmorModal] = useState(false);
  const [showWondrousModal, setShowWondrousModal] = useState(false);
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);

  useEffect(() => {
    const syncedChar = syncEquippedItemsToInventory(character, weaponsData);
    if (syncedChar.inventory !== character.inventory) {
      onChange({ inventory: syncedChar.inventory });
    }
  }, [character.equipment, weaponsData]);

  // New Custom Weapon Form State
  const [customWpnName, setCustomWpnName] = useState('');
  const [customWpnDamage, setCustomWpnDamage] = useState('2d6');
  const [customWpnThreat, setCustomWpnThreat] = useState(19);
  const [customWpnCritMultiplier, setCustomWpnCritMultiplier] = useState(2);
  const [customWpnType, setCustomWpnType] = useState('Slashing');
  const [customWpnCategory, setCustomWpnCategory] = useState('Martial');

  // New Custom Armor Form State
  const [customArmorName, setCustomArmorName] = useState('');
  const [customArmorAC, setCustomArmorAC] = useState(4);
  const [customArmorMaxDex, setCustomArmorMaxDex] = useState(4);
  const [customArmorCheck, setCustomArmorCheck] = useState(-2);
  const [customArmorType, setCustomArmorType] = useState<'light' | 'medium' | 'heavy' | 'shield' | 'other'>('medium');

  // New Wondrous Item Form State
  const [wondrousName, setWondrousName] = useState('');
  const [wondrousSlot, setWondrousSlot] = useState<WondrousItem['slot']>('shoulders');
  const [wondrousEffect, setWondrousEffect] = useState('');

  // General Inventory Form State
  const [invName, setInvName] = useState('');
  const [invQty, setInvQty] = useState(1);
  const [invWeight, setInvWeight] = useState(1);
  const [invLocation, setInvLocation] = useState<string>('Backpack');
  const [invValue, setInvValue] = useState('');
  const [invNotes, setInvNotes] = useState('');
  const [activeLocationFilter, setActiveLocationFilter] = useState<string>('All');
  const [includeEquippedInTable, setIncludeEquippedInTable] = useState<boolean>(true);

  const eq: Equipment = character.equipment || {
    armor: 'chainshirt',
    armorEnhancement: 1,
    shield: 'heavy_shield',
    shieldEnhancement: 1,
    deflection: 0,
    natural: 0,
    dodge: 0,
    primaryWeapon: 'Longsword',
    primaryWeaponEnhancement: 0,
    secondaryWeapon: 'none',
    secondaryWeaponEnhancement: 0,
    rangedWeapon: 'none',
    rangedWeaponEnhancement: 0,
    wondrousItems: []
  };

  const funds: Funds = character.funds || {
    cp: 0, sp: 0, gp: 0, pp: 0, otherValuables: 0
  };

  const inventory: InventoryItem[] = character.inventory || [];
  const customWeapons = character.customWeapons || [];
  const customArmors = character.customArmors || [];

  const handleEqChange = (field: keyof Equipment, val: any) => {
    const newEq = { ...eq, [field]: val };
    let updatedInv = [...inventory];

    if (val && val !== 'none' && val !== '__CUSTOM__') {
      if (field === 'primaryWeapon' || field === 'secondaryWeapon' || field === 'rangedWeapon') {
        const wpn = resolveWeapon(val, customWeapons, weaponsData);
        updatedInv = ensureEquippedItemInInventory(updatedInv, { name: wpn.name, weight: wpn.weight });
      } else if (field === 'armor') {
        const arm = resolveArmor(val, customArmors);
        const armorKey = val.toLowerCase().trim();
        const w = ARMOR_WEIGHT_MAP[armorKey] !== undefined ? ARMOR_WEIGHT_MAP[armorKey] : 20;
        updatedInv = ensureEquippedItemInInventory(updatedInv, { name: arm.name, weight: w });
      } else if (field === 'shield') {
        const shd = resolveShield(val, customArmors);
        const shieldKey = val.toLowerCase().trim();
        const w = SHIELD_WEIGHT_MAP[shieldKey] !== undefined ? SHIELD_WEIGHT_MAP[shieldKey] : 10;
        updatedInv = ensureEquippedItemInInventory(updatedInv, { name: shd.name, weight: w });
      }
    }

    onChange({ equipment: newEq, inventory: updatedInv });
  };

  const handleFundsChange = (field: keyof Funds, val: number) => {
    onChange({ funds: { ...funds, [field]: Math.max(0, val || 0) } });
  };

  const raceObj: Partial<RaceData> = racesData.find(r => r.name === character.selectedRace) || {};
  const raceMods = parseRaceMods(raceObj);
  const totalLevel = character.levelProgression?.filter(l => l.primaryClass).length || 1;
  const strScore = calculateTotalScore('str', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel);
  const dexScore = calculateTotalScore('dex', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel);
  const strMod = getAbilityMod(strScore);
  const dexMod = getAbilityMod(dexScore);
  const bab = calculateBAB(character.levelProgression, classesData);

  // Carrying Capacity & Encumbrance Calculations
  const carryingCapacity = calculateCarryingCapacity(strScore, raceObj.size || 'Medium');
  const totalCarriedWeight = calculateTotalCarriedWeight(character, weaponsData);
  const coinWeight = calculateCoinWeight(funds);
  const netWorthGP = calculateTotalNetWorthGP(funds);
  const encumbrance = getEncumbranceStatus(totalCarriedWeight, carryingCapacity);

  const armorObj = resolveArmor(eq.armor, customArmors);
  const shieldObj = resolveShield(eq.shield, customArmors);
  const armorAc = armorObj.acBonus + (eq.armorEnhancement || 0);
  const shieldAc = shieldObj.acBonus + (eq.shieldEnhancement || 0);

  // Combined weapons list for dropdowns (allowed sources grouped at top, sorted A-Z)
  const availableWeapons = useMemo(
    () => sortDropdownItems([...customWeapons, ...weaponsData], character.allowedSources),
    [customWeapons, weaponsData, character.allowedSources]
  );

  const weaponOptions: SearchableOption[] = useMemo(() => {
    const options: SearchableOption[] = [
      { value: 'none', label: '-- None --', isAllowed: true }
    ];

    availableWeapons.forEach(w => {
      const badge = getSourceBadgeInfo(w.source, character.allowedSources);
      options.push({
        value: w.name,
        label: w.name,
        sublabel: `(${w.damageM}, ${w.type})`,
        badge: badge.sourceCode,
        isAllowed: badge.isAllowed
      });
    });

    options.push({ value: '__CUSTOM__', label: '+ Custom / Typed Weapon Name...', isAllowed: true });
    return options;
  }, [availableWeapons, character.allowedSources]);

  const presetOptions: SearchableOption[] = useMemo(() => {
    return [
      { value: '', label: '+ Quick Add Gear Preset...', isAllowed: true },
      ...COMMON_ITEM_PRESETS.map(p => ({
        value: p.name,
        label: p.name,
        sublabel: `(${p.weight} lb, ${p.value})`,
        isAllowed: true
      }))
    ];
  }, []);

  // Resolve Weapons
  const primaryWpnObj = resolveWeapon(eq.primaryWeapon, customWeapons, weaponsData);
  const primaryFeatBonuses = calculateFeatCombatBonuses(character, primaryWpnObj);
  const primaryEnhancement = eq.primaryWeaponEnhancement || 0;
  const primaryTotalAtk = bab + strMod + primaryEnhancement + primaryFeatBonuses.attackBonus;
  const primaryDmgVal = strMod + primaryEnhancement + primaryFeatBonuses.damageBonus;
  const primaryDmgStr = primaryDmgVal >= 0 ? `+${primaryDmgVal}` : `${primaryDmgVal}`;

  const hasSecondary = eq.secondaryWeapon && eq.secondaryWeapon !== 'none';
  const secondaryWpnObj = hasSecondary ? resolveWeapon(eq.secondaryWeapon, customWeapons, weaponsData) : null;
  const secondaryFeatBonuses = secondaryWpnObj ? calculateFeatCombatBonuses(character, secondaryWpnObj) : { attackBonus: 0, damageBonus: 0 };
  const secondaryEnhancement = eq.secondaryWeaponEnhancement || 0;
  const secondaryTotalAtk = secondaryWpnObj ? (bab + strMod + secondaryEnhancement + secondaryFeatBonuses.attackBonus) : 0;
  const secondaryDmgVal = secondaryWpnObj ? (Math.floor(strMod / 2) + secondaryEnhancement + secondaryFeatBonuses.damageBonus) : 0;

  const hasRanged = eq.rangedWeapon && eq.rangedWeapon !== 'none';
  const rangedWpnObj = hasRanged ? resolveWeapon(eq.rangedWeapon, customWeapons, weaponsData) : null;
  const rangedFeatBonuses = rangedWpnObj ? calculateFeatCombatBonuses(character, rangedWpnObj) : { attackBonus: 0, damageBonus: 0 };
  const rangedEnhancement = eq.rangedWeaponEnhancement || 0;
  const rangedTotalAtk = rangedWpnObj ? (bab + dexMod + rangedEnhancement + rangedFeatBonuses.attackBonus) : 0;

  // Inventory Actions
  const handleAddInventoryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invName.trim()) return;

    const newItem: InventoryItem = {
      id: `inv_${Date.now()}`,
      name: invName.trim(),
      quantity: Math.max(1, invQty),
      weight: Math.max(0, invWeight),
      location: invLocation,
      value: invValue.trim(),
      notes: invNotes.trim()
    };

    onChange({ inventory: [...inventory, newItem] });

    setInvName('');
    setInvQty(1);
    setInvWeight(1);
    setInvValue('');
    setInvNotes('');
    setShowAddInventoryModal(false);
  };

  const handleQuickAddPreset = (presetName: string) => {
    const preset = COMMON_ITEM_PRESETS.find(p => p.name === presetName);
    if (!preset) return;

    const existingIdx = inventory.findIndex(i => i.name.toLowerCase() === preset.name.toLowerCase() && i.location === preset.location);
    if (existingIdx >= 0) {
      const updated = [...inventory];
      updated[existingIdx].quantity += 1;
      onChange({ inventory: updated });
    } else {
      const newItem: InventoryItem = {
        id: `inv_${Date.now()}`,
        name: preset.name,
        quantity: 1,
        weight: preset.weight,
        location: preset.location,
        value: preset.value,
        notes: preset.notes
      };
      onChange({ inventory: [...inventory, newItem] });
    }
  };

  const handleUpdateItemQty = (id: string, delta: number) => {
    const updated = inventory.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as InventoryItem[];

    onChange({ inventory: updated });
  };

  const handleUpdateItemLocation = (id: string, location: string) => {
    const updated = inventory.map(item => item.id === id ? { ...item, location } : item);
    onChange({ inventory: updated });
  };

  const handleRemoveInventoryItem = (id: string) => {
    const itemToRemove = inventory.find(i => i.id === id);
    const newInventory = inventory.filter(item => item.id !== id);
    const newEq = { ...eq };

    if (itemToRemove) {
      const cleanName = itemToRemove.name.toLowerCase().trim();

      if (eq.primaryWeapon && (resolveWeapon(eq.primaryWeapon, customWeapons, weaponsData).name.toLowerCase().trim() === cleanName || eq.primaryWeapon.toLowerCase().trim() === cleanName)) {
        newEq.primaryWeapon = 'none';
      }
      if (eq.secondaryWeapon && (resolveWeapon(eq.secondaryWeapon, customWeapons, weaponsData).name.toLowerCase().trim() === cleanName || eq.secondaryWeapon.toLowerCase().trim() === cleanName)) {
        newEq.secondaryWeapon = 'none';
      }
      if (eq.rangedWeapon && (resolveWeapon(eq.rangedWeapon, customWeapons, weaponsData).name.toLowerCase().trim() === cleanName || eq.rangedWeapon.toLowerCase().trim() === cleanName)) {
        newEq.rangedWeapon = 'none';
      }
      if (eq.armor && (resolveArmor(eq.armor, customArmors).name.toLowerCase().trim() === cleanName || eq.armor.toLowerCase().trim() === cleanName)) {
        newEq.armor = 'none';
      }
      if (eq.shield && (resolveShield(eq.shield, customArmors).name.toLowerCase().trim() === cleanName || eq.shield.toLowerCase().trim() === cleanName)) {
        newEq.shield = 'none';
      }
      if (eq.wondrousItems && eq.wondrousItems.length > 0) {
        newEq.wondrousItems = eq.wondrousItems.filter(w => w.name.toLowerCase().trim() !== cleanName);
      }
    }

    onChange({ equipment: newEq, inventory: newInventory });
  };

  // Add Custom Weapon
  const handleAddCustomWeapon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customWpnName.trim()) return;

    const newWpn: WeaponData = {
      id: `custom_${Date.now()}`,
      name: customWpnName.trim(),
      category: customWpnCategory,
      size: 'M',
      damageM: customWpnDamage,
      threat: customWpnThreat,
      critMultiplier: customWpnCritMultiplier,
      weight: 4,
      type: customWpnType,
      source: 'Custom'
    };

    const updatedCustoms = [...customWeapons, newWpn];
    const updatedInv = ensureEquippedItemInInventory(inventory, { name: newWpn.name, weight: newWpn.weight });
    onChange({
      customWeapons: updatedCustoms,
      equipment: { ...eq, primaryWeapon: newWpn.name },
      inventory: updatedInv
    });

    setCustomWpnName('');
    setShowCustomWpnModal(false);
  };

  // Add Custom Armor
  const handleAddCustomArmor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customArmorName.trim()) return;

    const newArmor: CustomArmorData = {
      id: `custom_armor_${Date.now()}`,
      name: customArmorName.trim(),
      acBonus: customArmorAC,
      maxDex: customArmorMaxDex,
      armorCheckPenalty: customArmorCheck,
      type: customArmorType
    };

    const updatedArmors = [...customArmors, newArmor];
    const w = customArmorType === 'shield' ? 10 : 20;
    const updatedInv = ensureEquippedItemInInventory(inventory, { name: newArmor.name, weight: w });
    const slot = customArmorType === 'shield' ? 'shield' : 'armor';
    onChange({
      customArmors: updatedArmors,
      equipment: { ...eq, [slot]: newArmor.name },
      inventory: updatedInv
    });

    setCustomArmorName('');
    setShowCustomArmorModal(false);
  };

  // Add Wondrous Item
  const handleAddWondrousItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wondrousName.trim()) return;

    const newItem: WondrousItem = {
      id: `wondrous_${Date.now()}`,
      name: wondrousName.trim(),
      slot: wondrousSlot,
      effect: wondrousEffect.trim()
    };

    const currentItems = eq.wondrousItems || [];
    const updatedInv = ensureEquippedItemInInventory(inventory, { name: newItem.name, weight: 0, notes: newItem.effect });
    onChange({
      equipment: { ...eq, wondrousItems: [...currentItems, newItem] },
      inventory: updatedInv
    });

    setWondrousName('');
    setWondrousEffect('');
    setShowWondrousModal(false);
  };

  const handleRemoveWondrousItem = (id: string) => {
    const currentItems = eq.wondrousItems || [];
    handleEqChange('wondrousItems', currentItems.filter(i => i.id !== id));
  };

  const parseWeight = (val: any): number => {
    if (val === null || val === undefined) return 0;
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    return isNaN(num) ? 0 : num;
  };

  const getEquippedSlotLabel = (itemName: string): string | null => {
    if (!itemName || !itemName.trim()) return null;
    const clean = itemName.toLowerCase().trim();

    if (eq.primaryWeapon && eq.primaryWeapon !== 'none') {
      const wpnObj = resolveWeapon(eq.primaryWeapon, customWeapons, weaponsData);
      if (wpnObj.name.toLowerCase().trim() === clean || eq.primaryWeapon.toLowerCase().trim() === clean) {
        return 'Equipped (Primary)';
      }
    }
    if (eq.secondaryWeapon && eq.secondaryWeapon !== 'none') {
      const secObj = resolveWeapon(eq.secondaryWeapon, customWeapons, weaponsData);
      if (secObj.name.toLowerCase().trim() === clean || eq.secondaryWeapon.toLowerCase().trim() === clean) {
        return 'Equipped (Off-Hand)';
      }
    }
    if (eq.rangedWeapon && eq.rangedWeapon !== 'none') {
      const rngObj = resolveWeapon(eq.rangedWeapon, customWeapons, weaponsData);
      if (rngObj.name.toLowerCase().trim() === clean || eq.rangedWeapon.toLowerCase().trim() === clean) {
        return 'Equipped (Ranged)';
      }
    }
    if (eq.armor && eq.armor !== 'none') {
      const armObj = resolveArmor(eq.armor, customArmors);
      if (armObj.name.toLowerCase().trim() === clean || eq.armor.toLowerCase().trim() === clean) {
        return 'Equipped (Armor)';
      }
    }
    if (eq.shield && eq.shield !== 'none') {
      const shdObj = resolveShield(eq.shield, customArmors);
      if (shdObj.name.toLowerCase().trim() === clean || eq.shield.toLowerCase().trim() === clean) {
        return 'Equipped (Shield)';
      }
    }
    if (eq.wondrousItems && eq.wondrousItems.length > 0) {
      const itemMatch = eq.wondrousItems.find(w => w.name.toLowerCase().trim() === clean);
      if (itemMatch) {
        return `Equipped (${itemMatch.slot})`;
      }
    }
    return null;
  };

  // Auto-sync any equipped items that are missing from inventory
  const syncedInventory = useMemo(() => {
    let updated = [...inventory];

    if (eq.armor && eq.armor !== 'none') {
      const arm = resolveArmor(eq.armor, customArmors);
      if (!isItemInInventory(updated, arm.name) && !isItemInInventory(updated, eq.armor)) {
        const armorKey = eq.armor.toLowerCase().trim();
        const w = ARMOR_WEIGHT_MAP[armorKey] !== undefined ? ARMOR_WEIGHT_MAP[armorKey] : 20;
        updated = ensureEquippedItemInInventory(updated, { name: arm.name, weight: w });
      }
    }
    if (eq.shield && eq.shield !== 'none') {
      const shd = resolveShield(eq.shield, customArmors);
      if (!isItemInInventory(updated, shd.name) && !isItemInInventory(updated, eq.shield)) {
        const shieldKey = eq.shield.toLowerCase().trim();
        const w = SHIELD_WEIGHT_MAP[shieldKey] !== undefined ? SHIELD_WEIGHT_MAP[shieldKey] : 10;
        updated = ensureEquippedItemInInventory(updated, { name: shd.name, weight: w });
      }
    }
    if (eq.primaryWeapon && eq.primaryWeapon !== 'none') {
      const wpn = resolveWeapon(eq.primaryWeapon, customWeapons, weaponsData);
      if (!isItemInInventory(updated, wpn.name) && !isItemInInventory(updated, eq.primaryWeapon)) {
        updated = ensureEquippedItemInInventory(updated, { name: wpn.name, weight: wpn.weight });
      }
    }
    if (eq.secondaryWeapon && eq.secondaryWeapon !== 'none') {
      const wpn = resolveWeapon(eq.secondaryWeapon, customWeapons, weaponsData);
      if (!isItemInInventory(updated, wpn.name) && !isItemInInventory(updated, eq.secondaryWeapon)) {
        updated = ensureEquippedItemInInventory(updated, { name: wpn.name, weight: wpn.weight });
      }
    }
    if (eq.rangedWeapon && eq.rangedWeapon !== 'none') {
      const wpn = resolveWeapon(eq.rangedWeapon, customWeapons, weaponsData);
      if (!isItemInInventory(updated, wpn.name) && !isItemInInventory(updated, eq.rangedWeapon)) {
        updated = ensureEquippedItemInInventory(updated, { name: wpn.name, weight: wpn.weight });
      }
    }
    (eq.wondrousItems || []).forEach(w => {
      if (!isItemInInventory(updated, w.name)) {
        updated = ensureEquippedItemInInventory(updated, { name: w.name, weight: w.weight || 0, notes: w.effect });
      }
    });

    return updated;
  }, [eq, inventory, customArmors, customWeapons, weaponsData]);

  // Build complete itemized list of all gear/items contributing to character weight
  const activeCarriedItemsBreakdown: Array<{
    id: string;
    name: string;
    icon: string;
    location: string;
    quantity: number;
    unitWeight: number;
    totalWeight: number;
    notes?: string;
    value?: string;
    isEquippedGear?: boolean;
    isCurrency?: boolean;
    isStashed?: boolean;
    isHaversack?: boolean;
    equippedLabel?: string | null;
  }> = [];

  // 1. Coin Purse / Currency Weight
  const totalCoinsNum = (funds.cp || 0) + (funds.sp || 0) + (funds.gp || 0) + (funds.pp || 0);
  if (totalCoinsNum > 0 && coinWeight > 0) {
    activeCarriedItemsBreakdown.push({
      id: `eq_coin_purse`,
      name: `Coin Purse (${totalCoinsNum} coins)`,
      icon: '🪙',
      location: 'Belt Pouch (Coins)',
      quantity: 1,
      unitWeight: coinWeight,
      totalWeight: coinWeight,
      notes: `50 coins/lb (${funds.gp || 0} GP, ${funds.sp || 0} SP, ${funds.cp || 0} CP, ${funds.pp || 0} PP)`,
      value: `${netWorthGP.toLocaleString()} GP`,
      isCurrency: true
    });
  }

  // 2. All Inventory Items (includes weapons, armors, shields, wondrous items, and general gear)
  syncedInventory.forEach(item => {
    const loc = (item.location || 'Carried').toLowerCase();
    const isStashed = loc === 'stash' || loc === 'mount';
    const isHaversack = loc === 'haversack';
    const unitW = parseWeight(item.weight);
    const totW = isStashed ? 0 : (isHaversack ? 0 : (item.quantity * unitW));
    const equippedLabel = getEquippedSlotLabel(item.name);

    let icon = '🎒';
    if (equippedLabel?.includes('Weapon') || equippedLabel?.includes('Primary') || equippedLabel?.includes('Off-Hand')) icon = '⚔️';
    else if (equippedLabel?.includes('Ranged')) icon = '🏹';
    else if (equippedLabel?.includes('Armor') || equippedLabel?.includes('Shield')) icon = '🛡️';
    else if (equippedLabel?.includes('Equipped')) icon = '💎';

    activeCarriedItemsBreakdown.push({
      id: item.id,
      name: item.name,
      icon,
      location: item.location || 'Carried',
      quantity: item.quantity,
      unitWeight: unitW,
      totalWeight: totW,
      notes: item.notes,
      value: item.value,
      isStashed,
      isHaversack,
      isEquippedGear: !!equippedLabel,
      equippedLabel
    });
  });

  const tableSourceItems = includeEquippedInTable
    ? activeCarriedItemsBreakdown
    : activeCarriedItemsBreakdown.filter(item => !item.isEquippedGear);

  const filteredInventoryTable = activeLocationFilter === 'All'
    ? tableSourceItems
    : tableSourceItems.filter(item => {
        const locLower = item.location.toLowerCase();
        const filterLower = activeLocationFilter.toLowerCase();
        if (locLower.includes(filterLower)) return true;
        if (filterLower === 'carried' && (locLower.includes('equipped') || locLower.includes('carried'))) return true;
        if (filterLower === 'belt pouch' && locLower.includes('belt pouch')) return true;
        return false;
      });

  // Encumbrance level color class
  const getEncumbranceBadgeClass = () => {
    switch (encumbrance.level) {
      case 'light': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'heavy': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'overloaded': return 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse';
    }
  };

  const getMeterFillPercentage = () => {
    if (carryingCapacity.heavy <= 0) return 0;
    return Math.min(100, Math.round((totalCarriedWeight / carryingCapacity.heavy) * 100));
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 backdrop-blur border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <i className="fa-solid fa-boxes-packing text-amber-500"></i> Equipment, Inventory & Wealth Workshop
          </h2>
          <p className="text-xs text-slate-400">Manage weapons, armor, general adventuring gear, funds, and track carrying capacity.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddInventoryModal(true)}
            className="btn btn-primary text-xs flex items-center gap-1.5"
          >
            <i className="fa-solid fa-cart-plus"></i> Add Inventory Item
          </button>
          <button
            onClick={() => setShowCustomWpnModal(true)}
            className="btn btn-secondary text-xs flex items-center gap-1.5"
          >
            <i className="fa-solid fa-plus"></i> Custom Weapon
          </button>
          <button
            onClick={() => setShowCustomArmorModal(true)}
            className="btn btn-secondary text-xs flex items-center gap-1.5"
          >
            <i className="fa-solid fa-shield text-amber-400"></i> Custom Armor
          </button>
          <button
            onClick={() => setShowWondrousModal(true)}
            className="btn btn-secondary text-xs flex items-center gap-1.5"
          >
            <i className="fa-solid fa-gem text-purple-400"></i> Add Wondrous Item
          </button>
        </div>
      </div>

      {/* Main Grid: Armor/Shield & Weapons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Armor & Shield Configuration */}
        <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-bold font-heading text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
            <i className="fa-solid fa-shield-cat text-amber-500"></i> Armor & Shield Configuration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-text">Equipped Armor</label>
              <select
                value={eq.armor || 'chainshirt'}
                onChange={e => handleEqChange('armor', e.target.value)}
                className="input-field text-xs"
              >
                <option value="none">None (AC +0, Max Dex --, Check 0)</option>
                <option value="padded">Padded (+1 AC, Max Dex +8, Check 0, 10 lbs)</option>
                <option value="leather">Leather (+2 AC, Max Dex +6, Check 0, 15 lbs)</option>
                <option value="studded">Studded Leather (+3 AC, Max Dex +5, Check -1, 20 lbs)</option>
                <option value="chainshirt">Chain Shirt (+4 AC, Max Dex +4, Check -2, 25 lbs)</option>
                <option value="breastplate">Breastplate (+5 AC, Max Dex +3, Check -4, 30 lbs)</option>
                <option value="fullplate">Full Plate (+8 AC, Max Dex +1, Check -6, 50 lbs)</option>
                {customArmors.filter(a => a.type !== 'shield').map(ca => (
                  <option key={ca.id} value={ca.name}>{ca.name} (+{ca.acBonus} AC, Custom)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-text">Armor Enhancement</label>
              <select
                value={eq.armorEnhancement || 0}
                onChange={e => handleEqChange('armorEnhancement', parseInt(e.target.value) || 0)}
                className="input-field text-xs"
              >
                {[0, 1, 2, 3, 4, 5].map(v => (
                  <option key={v} value={v}>+{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-text">Equipped Shield</label>
              <select
                value={eq.shield || 'heavy_shield'}
                onChange={e => handleEqChange('shield', e.target.value)}
                className="input-field text-xs"
              >
                <option value="none">None (+0 AC)</option>
                <option value="buckler">Buckler (+1 AC, Check -1, 5 lbs)</option>
                <option value="light_wooden">Light Shield (+1 AC, Check -1, 5 lbs)</option>
                <option value="heavy_shield">Heavy Shield (+2 AC, Check -2, 15 lbs)</option>
                <option value="tower_shield">Tower Shield (+4 AC, Check -10, 45 lbs)</option>
                {customArmors.filter(a => a.type === 'shield').map(ca => (
                  <option key={ca.id} value={ca.name}>{ca.name} (+{ca.acBonus} AC, Custom Shield)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-text">Shield Enhancement</label>
              <select
                value={eq.shieldEnhancement || 0}
                onChange={e => handleEqChange('shieldEnhancement', parseInt(e.target.value) || 0)}
                className="input-field text-xs"
              >
                {[0, 1, 2, 3, 4, 5].map(v => (
                  <option key={v} value={v}>+{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label-text">Deflection Mod</label>
              <input
                type="number"
                min="0"
                value={eq.deflection || 0}
                onChange={e => handleEqChange('deflection', parseInt(e.target.value) || 0)}
                className="input-field font-mono text-center text-xs"
              />
            </div>
            <div>
              <label className="label-text">Natural Armor</label>
              <input
                type="number"
                min="0"
                value={eq.natural || 0}
                onChange={e => handleEqChange('natural', parseInt(e.target.value) || 0)}
                className="input-field font-mono text-center text-xs"
              />
            </div>
            <div>
              <label className="label-text">Dodge Mod</label>
              <input
                type="number"
                min="0"
                value={eq.dodge || 0}
                onChange={e => handleEqChange('dodge', parseInt(e.target.value) || 0)}
                className="input-field font-mono text-center text-xs"
              />
            </div>
          </div>

          {/* Wondrous Items & Magic Gear Section */}
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center justify-between">
              <span><i className="fa-solid fa-gem mr-1"></i> Equipped Wondrous Items & Gear</span>
              <span className="text-[10px] text-slate-400">({(eq.wondrousItems || []).length} items)</span>
            </h3>

            {(eq.wondrousItems || []).length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 text-center bg-slate-950/40 rounded-xl">No wondrous items equipped. Click 'Add Wondrous Item' to record magic gear.</p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {(eq.wondrousItems || []).map(item => (
                  <div key={item.id} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-300 truncate">{item.name}</span>
                        <span className="badge bg-purple-900/60 text-purple-300 text-[9px] uppercase font-mono px-1.5">{item.slot}</span>
                      </div>
                      {item.effect && <p className="text-[11px] text-slate-400 truncate">{item.effect}</p>}
                    </div>
                    <button
                      onClick={() => handleRemoveWondrousItem(item.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 text-xs"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Weapons Inventory & Custom Arsenal */}
        <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-bold font-heading text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
            <i className="fa-solid fa-wand-magic-sparkles text-amber-500"></i> Primary & Off-Hand Weapon Arsenal
          </h2>

          {/* Primary Weapon Selection */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="label-text">Primary Weapon</label>
              <span className="text-[10px] text-slate-400 italic">Supports aliasing e.g. Nodachi (Greatsword)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1.5">
                <SearchableSelect
                  value={availableWeapons.some(w => w.name === eq.primaryWeapon) ? eq.primaryWeapon : (eq.primaryWeapon && eq.primaryWeapon !== 'none' ? '__CUSTOM__' : 'none')}
                  options={weaponOptions}
                  onChange={val => {
                    if (val !== '__CUSTOM__') {
                      handleEqChange('primaryWeapon', val);
                    } else {
                      handleEqChange('primaryWeapon', '__CUSTOM__');
                    }
                  }}
                  placeholder="Select primary weapon..."
                />

                {/* Freeform input if custom or user wants to edit name */}
                {(!availableWeapons.some(w => w.name === eq.primaryWeapon) || eq.primaryWeapon === '__CUSTOM__') && (
                  <input
                    type="text"
                    value={eq.primaryWeapon === '__CUSTOM__' ? '' : (eq.primaryWeapon || '')}
                    onChange={e => handleEqChange('primaryWeapon', e.target.value)}
                    placeholder="Type custom weapon name e.g. Nodachi (Greatsword)"
                    className="input-field text-xs font-semibold text-amber-300 border-amber-500/40"
                  />
                )}
              </div>
              <div>
                <select
                  value={eq.primaryWeaponEnhancement || 0}
                  onChange={e => handleEqChange('primaryWeaponEnhancement', parseInt(e.target.value) || 0)}
                  className="input-field text-xs"
                >
                  {[0, 1, 2, 3, 4, 5].map(v => (
                    <option key={v} value={v}>Enh: +{v}</option>
                  ))}
                </select>
              </div>
            </div>

            {primaryWpnObj && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-amber-400 text-sm block">{primaryWpnObj.name}</span>
                    {primaryFeatBonuses.attackBonus > 0 || primaryFeatBonuses.damageBonus > 0 ? (
                      <span className="text-[10px] text-emerald-400">
                        Includes Feat Bonus (+{primaryFeatBonuses.attackBonus} Atk / +{primaryFeatBonuses.damageBonus} Dmg)
                      </span>
                    ) : null}
                  </div>
                  <span className="font-mono text-emerald-400 font-bold text-sm">
                    {primaryTotalAtk >= 0 ? '+' : ''}{primaryTotalAtk} Melee
                  </span>
                </div>
                <div className="grid grid-cols-3 text-center gap-2 py-1 font-mono text-slate-300 bg-slate-900/60 rounded border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Damage</span>
                    <span>{primaryWpnObj.damageM}{primaryDmgVal !== 0 ? primaryDmgStr : ''}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Critical</span>
                    <span>{primaryWpnObj.threat < 20 ? `${primaryWpnObj.threat}-20` : '20'}/x{primaryWpnObj.critMultiplier || 2}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Type</span>
                    <span>{primaryWpnObj.type || 'Slashing'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Off-hand / Secondary Weapon */}
          <div className="border-t border-slate-800 pt-3 space-y-2">
            <label className="label-text">Secondary / Off-Hand Weapon</label>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1.5">
                <SearchableSelect
                  value={availableWeapons.some(w => w.name === eq.secondaryWeapon) ? eq.secondaryWeapon : (eq.secondaryWeapon && eq.secondaryWeapon !== 'none' ? '__CUSTOM__' : 'none')}
                  options={weaponOptions}
                  onChange={val => {
                    if (val !== '__CUSTOM__') {
                      handleEqChange('secondaryWeapon', val);
                    } else {
                      handleEqChange('secondaryWeapon', '__CUSTOM__');
                    }
                  }}
                  placeholder="Select secondary weapon..."
                />

                {(!availableWeapons.some(w => w.name === eq.secondaryWeapon) && eq.secondaryWeapon && eq.secondaryWeapon !== 'none') && (
                  <input
                    type="text"
                    value={eq.secondaryWeapon === '__CUSTOM__' ? '' : (eq.secondaryWeapon || '')}
                    onChange={e => handleEqChange('secondaryWeapon', e.target.value)}
                    placeholder="Type custom secondary weapon name"
                    className="input-field text-xs font-semibold text-amber-300 border-amber-500/40"
                  />
                )}
              </div>
              <div>
                <select
                  value={eq.secondaryWeaponEnhancement || 0}
                  onChange={e => handleEqChange('secondaryWeaponEnhancement', parseInt(e.target.value) || 0)}
                  className="input-field text-xs"
                >
                  {[0, 1, 2, 3, 4, 5].map(v => (
                    <option key={v} value={v}>Enh: +{v}</option>
                  ))}
                </select>
              </div>
            </div>
            {secondaryWpnObj && (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">{secondaryWpnObj.name}</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {secondaryTotalAtk >= 0 ? '+' : ''}{secondaryTotalAtk} Atk ({secondaryWpnObj.damageM}{secondaryDmgVal >= 0 ? `+${secondaryDmgVal}` : secondaryDmgVal})
                </span>
              </div>
            )}
          </div>

          {/* Ranged Weapon */}
          <div className="border-t border-slate-800 pt-3 space-y-2">
            <label className="label-text">Ranged Weapon</label>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1.5">
                <SearchableSelect
                  value={availableWeapons.some(w => w.name === eq.rangedWeapon) ? eq.rangedWeapon : (eq.rangedWeapon && eq.rangedWeapon !== 'none' ? '__CUSTOM__' : 'none')}
                  options={weaponOptions}
                  onChange={val => {
                    if (val !== '__CUSTOM__') {
                      handleEqChange('rangedWeapon', val);
                    } else {
                      handleEqChange('rangedWeapon', '__CUSTOM__');
                    }
                  }}
                  placeholder="Select ranged weapon..."
                />

                {(!availableWeapons.some(w => w.name === eq.rangedWeapon) && eq.rangedWeapon && eq.rangedWeapon !== 'none') && (
                  <input
                    type="text"
                    value={eq.rangedWeapon === '__CUSTOM__' ? '' : (eq.rangedWeapon || '')}
                    onChange={e => handleEqChange('rangedWeapon', e.target.value)}
                    placeholder="Type custom ranged weapon name"
                    className="input-field text-xs font-semibold text-amber-300 border-amber-500/40"
                  />
                )}
              </div>
              <div>
                <select
                  value={eq.rangedWeaponEnhancement || 0}
                  onChange={e => handleEqChange('rangedWeaponEnhancement', parseInt(e.target.value) || 0)}
                  className="input-field text-xs"
                >
                  {[0, 1, 2, 3, 4, 5].map(v => (
                    <option key={v} value={v}>Enh: +{v}</option>
                  ))}
                </select>
              </div>
            </div>
            {rangedWpnObj && (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">{rangedWpnObj.name}</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {rangedTotalAtk >= 0 ? '+' : ''}{rangedTotalAtk} Ranged Atk ({rangedWpnObj.damageM})
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Capacity & Currency Section (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carrying Capacity & Encumbrance Status */}
        <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
              <i className="fa-solid fa-weight-hanging text-amber-500"></i> Carrying Capacity & Encumbrance
            </h2>
            <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border uppercase ${getEncumbranceBadgeClass()}`}>
              {encumbrance.label}
            </span>
          </div>

          {/* Visual Load Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Total Carried Weight:</span>
              <span className="font-mono font-bold text-amber-300 text-sm">{totalCarriedWeight} lbs</span>
            </div>

            <div className="w-full h-4 bg-slate-950 rounded-full border border-slate-800 overflow-hidden relative p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  encumbrance.level === 'light' ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                  encumbrance.level === 'medium' ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
                  encumbrance.level === 'heavy' ? 'bg-gradient-to-r from-orange-600 to-orange-400' :
                  'bg-gradient-to-r from-rose-600 to-rose-400'
                }`}
                style={{ width: `${getMeterFillPercentage()}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-3 text-center text-[11px] font-mono text-slate-400 pt-1">
              <div>
                <span className="block text-[9px] uppercase text-emerald-400 font-sans font-bold">Light Load</span>
                <span>Up to {carryingCapacity.light} lbs</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase text-amber-400 font-sans font-bold">Medium Load</span>
                <span>Up to {carryingCapacity.medium} lbs</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase text-orange-400 font-sans font-bold">Heavy Load</span>
                <span>Up to {carryingCapacity.heavy} lbs</span>
              </div>
            </div>
          </div>

          {/* Lift & Drag Statistics */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-sans">Overhead Lift</span>
              <span className="text-slate-200 font-bold">{carryingCapacity.overhead} lbs</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-sans">Lift Off Ground</span>
              <span className="text-slate-200 font-bold">{carryingCapacity.offGround} lbs</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-sans">Push or Drag</span>
              <span className="text-slate-200 font-bold">{carryingCapacity.pushDrag} lbs</span>
            </div>
          </div>

          {/* Encumbrance Penalties */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-1">
            <span className="font-bold text-amber-400 block">Encumbrance Effects:</span>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 font-mono">
              <div>Max Dex Bonus Cap: <span className="text-white font-bold">{encumbrance.maxDexCap !== null ? `+${encumbrance.maxDexCap}` : 'None'}</span></div>
              <div>Check Penalty: <span className="text-white font-bold">{encumbrance.checkPenalty}</span></div>
            </div>
            <p className="text-[10px] text-slate-400">Coin Weight: <span className="text-amber-300 font-mono font-bold">{coinWeight} lbs</span> (50 coins/lb in D&D 3.5e).</p>
          </div>

          {/* Active Carried Weight Itemized Breakdown */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <i className="fa-solid fa-list-check text-amber-500"></i> Active Carried Weight Itemized Breakdown
              </span>
              <span className="font-mono text-amber-300 font-bold text-xs">{totalCarriedWeight} lbs total</span>
            </div>
            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px] scrollbar-thin">
              {activeCarriedItemsBreakdown.filter(i => !i.isStashed).map(item => (
                <div key={item.id} className="flex justify-between items-center bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800/80">
                  <span className="text-slate-200 truncate mr-2 flex items-center gap-1.5">
                    <span>{item.icon}</span>
                    <span className="font-semibold">{item.name}</span>
                    <span className="text-[10px] text-slate-400 font-sans">({item.location})</span>
                  </span>
                  <span className={`font-bold shrink-0 ${item.totalWeight > 0 ? 'text-amber-300' : 'text-slate-500'}`}>
                    {item.isHaversack ? '0 lb (Haversack)' : `${item.totalWeight.toFixed(1)} lb`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Currency & Funds Tracker */}
        <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
              <i className="fa-solid fa-coins text-amber-400"></i> Funds & Wealth Tracker
            </h2>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Net Worth</span>
              <span className="font-mono font-bold text-amber-300 text-base">{netWorthGP.toLocaleString()} GP</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <label className="text-[11px] font-bold text-amber-700 block mb-1">Copper (CP)</label>
              <input
                type="number"
                min="0"
                value={funds.cp || 0}
                onChange={e => handleFundsChange('cp', parseInt(e.target.value) || 0)}
                className="input-field text-center font-mono font-bold text-xs"
              />
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Silver (SP)</label>
              <input
                type="number"
                min="0"
                value={funds.sp || 0}
                onChange={e => handleFundsChange('sp', parseInt(e.target.value) || 0)}
                className="input-field text-center font-mono font-bold text-xs"
              />
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <label className="text-[11px] font-bold text-amber-400 block mb-1">Gold (GP)</label>
              <input
                type="number"
                min="0"
                value={funds.gp || 0}
                onChange={e => handleFundsChange('gp', parseInt(e.target.value) || 0)}
                className="input-field text-center font-mono font-bold text-xs"
              />
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <label className="text-[11px] font-bold text-cyan-300 block mb-1">Platinum (PP)</label>
              <input
                type="number"
                min="0"
                value={funds.pp || 0}
                onChange={e => handleFundsChange('pp', parseInt(e.target.value) || 0)}
                className="input-field text-center font-mono font-bold text-xs"
              />
            </div>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-purple-400">Gems, Art & Other Valuables (GP Value)</label>
              <span className="text-[10px] text-slate-400">Added to total net worth</span>
            </div>
            <input
              type="number"
              min="0"
              value={funds.otherValuables || 0}
              onChange={e => handleFundsChange('otherValuables', parseInt(e.target.value) || 0)}
              className="input-field text-xs font-mono font-bold"
              placeholder="e.g. 500 GP (gems, trade goods)"
            />
          </div>

          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <i className="fa-solid fa-scale-balanced text-amber-400"></i> Coin Weight Total:
            </span>
            <span className="font-mono font-bold text-amber-300">{coinWeight} lbs ({(funds.cp || 0) + (funds.sp || 0) + (funds.gp || 0) + (funds.pp || 0)} coins)</span>
          </div>
        </div>
      </div>

      {/* General Inventory & Container Manager */}
      <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
              <i className="fa-solid fa-bag-shopping text-amber-500"></i> General Inventory & Containers
            </h2>
            <p className="text-xs text-slate-400">Organize potions, adventuring gear, containers, equipped items, and stash.</p>
          </div>

          {/* Quick Add Presets Bar & Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-amber-500/50 transition shadow-sm">
              <input
                type="checkbox"
                checked={includeEquippedInTable}
                onChange={e => setIncludeEquippedInTable(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
              />
              <span className="font-medium text-[11px]">Include Equipped Gear & Coins in List</span>
            </label>
            <div className="w-52">
              <SearchableSelect
                value=""
                options={presetOptions}
                onChange={val => {
                  if (val) {
                    handleQuickAddPreset(val);
                  }
                }}
                placeholder="+ Quick Add Gear..."
              />
            </div>
            <button
              onClick={() => setShowAddInventoryModal(true)}
              className="btn btn-primary text-xs flex items-center gap-1.5"
            >
              <i className="fa-solid fa-plus"></i> Add Item
            </button>
          </div>
        </div>

        {/* Location Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800/60 pb-3 text-xs">
          <span className="text-slate-400 font-semibold mr-2 text-[11px] uppercase">Container Filter:</span>
          {['All', 'Carried', 'Backpack', 'Belt Pouch', 'Haversack', 'Mount', 'Stash'].map(loc => (
            <button
              key={loc}
              onClick={() => setActiveLocationFilter(loc)}
              className={`px-3 py-1 rounded-lg transition font-medium ${
                activeLocationFilter === loc
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {loc}
              {loc !== 'All' && (
                <span className="ml-1.5 text-[10px] opacity-75">
                  ({filteredInventoryTable.filter(i => (i.location || 'Carried').toLowerCase().includes(loc.toLowerCase())).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Inventory Items List */}
        {filteredInventoryTable.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
            <i className="fa-solid fa-box-open text-3xl text-slate-600"></i>
            <p className="text-xs text-slate-400">No items found for container filter "{activeLocationFilter}".</p>
            <p className="text-[11px] text-slate-500">Select a preset above or click 'Add Item' to add gear to your inventory.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3 text-center">Container / Location</th>
                  <th className="py-2.5 px-3 text-center">Quantity</th>
                  <th className="py-2.5 px-3 text-center">Unit Weight</th>
                  <th className="py-2.5 px-3 text-center">Total Weight</th>
                  <th className="py-2.5 px-3 text-center">Value</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredInventoryTable.map(item => {
                  const isStashed = item.isStashed;
                  const isHaversack = item.isHaversack;
                  const isEquippedGear = item.isEquippedGear;
                  const isCurrency = item.isCurrency;

                  return (
                    <tr key={item.id} className={`hover:bg-slate-950/40 transition ${isEquippedGear ? 'bg-amber-500/5' : isCurrency ? 'bg-cyan-500/5' : ''}`}>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{item.icon}</span>
                          <div>
                            <span className="font-bold text-amber-200 text-xs flex items-center gap-1.5">
                              {item.name}
                              {isEquippedGear && <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] font-sans uppercase font-bold border border-amber-500/30">{item.equippedLabel || 'Equipped'}</span>}
                              {isCurrency && <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-sans uppercase font-bold border border-cyan-500/30">Coins</span>}
                            </span>
                            {item.notes && <span className="text-[10px] text-slate-400 font-sans block">{item.notes}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {!isCurrency ? (
                          <select
                            value={item.location || 'Backpack'}
                            onChange={e => handleUpdateItemLocation(item.id, e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-slate-300 font-sans"
                          >
                            <option value="Carried">Carried</option>
                            <option value="Backpack">Backpack</option>
                            <option value="Belt Pouch">Belt Pouch</option>
                            <option value="Haversack">Haversack</option>
                            <option value="Mount">Mount</option>
                            <option value="Stash">Stash</option>
                          </select>
                        ) : (
                          <span className="text-[11px] text-amber-300 font-sans font-medium">{item.location}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {!isCurrency ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleUpdateItemQty(item.id, -1)}
                              className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold"
                            >
                              -
                            </button>
                            <span className="font-bold text-white w-6 text-center">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateItemQty(item.id, 1)}
                              className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <span className="font-bold text-slate-300 text-xs">1</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-300">{item.unitWeight.toFixed(1)} lb</td>
                      <td className="py-2.5 px-3 text-center">
                        {isStashed ? (
                          <span className="text-slate-500 italic text-[10px]">({item.totalWeight.toFixed(1)} lb stashed)</span>
                        ) : isHaversack ? (
                          <span className="text-purple-400 font-bold text-[10px]">0 lb (Haversack)</span>
                        ) : (
                          <span className="text-amber-300 font-bold">{item.totalWeight.toFixed(1)} lb</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400">{item.value || '-'}</td>
                      <td className="py-2.5 px-3 text-right">
                        {!isCurrency ? (
                          <button
                            onClick={() => handleRemoveInventoryItem(item.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 text-xs"
                            title="Delete Item"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-sans italic">Coins</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Inventory Item */}
      {showAddInventoryModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddInventoryItem} className="card bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <i className="fa-solid fa-cart-plus"></i> Add General Inventory Item
            </h3>

            <div>
              <label className="label-text">Item Name</label>
              <input
                type="text"
                required
                value={invName}
                onChange={e => setInvName(e.target.value)}
                placeholder="e.g. Grappling Hook, Potion of Fly, Rations"
                className="input-field text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-text">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={invQty}
                  onChange={e => setInvQty(parseInt(e.target.value) || 1)}
                  className="input-field text-xs font-mono text-center"
                />
              </div>
              <div>
                <label className="label-text">Weight per Item (lbs)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={invWeight}
                  onChange={e => setInvWeight(parseFloat(e.target.value) || 0)}
                  className="input-field text-xs font-mono text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-text">Container / Location</label>
                <select
                  value={invLocation}
                  onChange={e => setInvLocation(e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="Carried">Carried on Person</option>
                  <option value="Backpack">Backpack</option>
                  <option value="Belt Pouch">Belt Pouch</option>
                  <option value="Haversack">Handy Haversack</option>
                  <option value="Mount">Mount / Saddlebags</option>
                  <option value="Stash">Stash / Home Base</option>
                </select>
              </div>
              <div>
                <label className="label-text">Value (optional)</label>
                <input
                  type="text"
                  value={invValue}
                  onChange={e => setInvValue(e.target.value)}
                  placeholder="e.g. 50 gp"
                  className="input-field text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="label-text">Notes / Description (optional)</label>
              <input
                type="text"
                value={invNotes}
                onChange={e => setInvNotes(e.target.value)}
                placeholder="e.g. Heals 1d8+1 HP or Capacity 2 cu. ft."
                className="input-field text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddInventoryModal(false)}
                className="btn btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary text-xs"
              >
                Add to Inventory
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Create Custom Weapon */}
      {showCustomWpnModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddCustomWeapon} className="card bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <i className="fa-solid fa-plus-circle"></i> Create Custom Weapon
            </h3>

            <div>
              <label className="label-text">Weapon Display Name</label>
              <input
                type="text"
                required
                value={customWpnName}
                onChange={e => setCustomWpnName(e.target.value)}
                placeholder="e.g. Nodachi, Sun Blade, or Elven Curve Blade"
                className="input-field text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-text">Damage (Medium)</label>
                <input
                  type="text"
                  required
                  value={customWpnDamage}
                  onChange={e => setCustomWpnDamage(e.target.value)}
                  placeholder="e.g. 2d6, 1d10, 1d8"
                  className="input-field text-xs font-mono"
                />
              </div>
              <div>
                <label className="label-text">Damage Type</label>
                <select
                  value={customWpnType}
                  onChange={e => setCustomWpnType(e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="Slashing">Slashing</option>
                  <option value="Piercing">Piercing</option>
                  <option value="Bludgeoning">Bludgeoning</option>
                  <option value="Slashing or Piercing">Slashing/Piercing</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-text">Threat Range</label>
                <select
                  value={customWpnThreat}
                  onChange={e => setCustomWpnThreat(parseInt(e.target.value))}
                  className="input-field text-xs font-mono"
                >
                  <option value={20}>20</option>
                  <option value={19}>19-20</option>
                  <option value={18}>18-20</option>
                </select>
              </div>
              <div>
                <label className="label-text">Crit Multiplier</label>
                <select
                  value={customWpnCritMultiplier}
                  onChange={e => setCustomWpnCritMultiplier(parseInt(e.target.value))}
                  className="input-field text-xs font-mono"
                >
                  <option value={2}>x2</option>
                  <option value={3}>x3</option>
                  <option value={4}>x4</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label-text">Weapon Category</label>
              <select
                value={customWpnCategory}
                onChange={e => setCustomWpnCategory(e.target.value)}
                className="input-field text-xs"
              >
                <option value="Simple">Simple</option>
                <option value="Martial">Martial</option>
                <option value="Exotic">Exotic</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCustomWpnModal(false)}
                className="btn btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary text-xs"
              >
                Save & Equip Custom Weapon
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Create Custom Armor */}
      {showCustomArmorModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddCustomArmor} className="card bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <i className="fa-solid fa-shield"></i> Create Custom Armor / Shield
            </h3>

            <div>
              <label className="label-text">Armor Name</label>
              <input
                type="text"
                required
                value={customArmorName}
                onChange={e => setCustomArmorName(e.target.value)}
                placeholder="e.g. Mithral Shirt, Dragonhide Plate"
                className="input-field text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label-text">AC Bonus</label>
                <input
                  type="number"
                  required
                  value={customArmorAC}
                  onChange={e => setCustomArmorAC(parseInt(e.target.value) || 0)}
                  className="input-field text-xs font-mono text-center"
                />
              </div>
              <div>
                <label className="label-text">Max Dex</label>
                <input
                  type="number"
                  value={customArmorMaxDex}
                  onChange={e => setCustomArmorMaxDex(parseInt(e.target.value) || 0)}
                  className="input-field text-xs font-mono text-center"
                />
              </div>
              <div>
                <label className="label-text">Check Penalty</label>
                <input
                  type="number"
                  value={customArmorCheck}
                  onChange={e => setCustomArmorCheck(parseInt(e.target.value) || 0)}
                  className="input-field text-xs font-mono text-center"
                />
              </div>
            </div>

            <div>
              <label className="label-text">Type</label>
              <select
                value={customArmorType}
                onChange={e => setCustomArmorType(e.target.value as any)}
                className="input-field text-xs"
              >
                <option value="light">Light Armor</option>
                <option value="medium">Medium Armor</option>
                <option value="heavy">Heavy Armor</option>
                <option value="shield">Shield</option>
                <option value="other">Other / Wondrous Protection</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCustomArmorModal(false)}
                className="btn btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary text-xs"
              >
                Save & Equip Custom Armor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Wondrous Item */}
      {showWondrousModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddWondrousItem} className="card bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-purple-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <i className="fa-solid fa-gem"></i> Add Wondrous Item / Magic Gear
            </h3>

            <div>
              <label className="label-text">Item Name</label>
              <input
                type="text"
                required
                value={wondrousName}
                onChange={e => setWondrousName(e.target.value)}
                placeholder="e.g. Cloak of Resistance +2, Belt of Giant Strength +4"
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="label-text">Item Slot</label>
              <select
                value={wondrousSlot}
                onChange={e => setWondrousSlot(e.target.value as any)}
                className="input-field text-xs"
              >
                <option value="shoulders">Shoulders (Cloaks / Capes)</option>
                <option value="head">Head (Helms / Hats)</option>
                <option value="headband">Headband (Phylacteries / Headbands)</option>
                <option value="neck">Neck (Amulets / Neclaces)</option>

                <option value="chest">Chest (Vests / Mantles)</option>
                <option value="body">Body (Robes / Vestments)</option>
                <option value="hands">Hands (Gauntlets / Gloves)</option>
                <option value="arms">Arms (Bracers / Armbands)</option>
                <option value="waist">Waist (Belts / Girdles)</option>
                <option value="feet">Feet (Boots / Shoes)</option>
                <option value="ring1">Ring Slot 1</option>
                <option value="ring2">Ring Slot 2</option>
                <option value="slotless">Slotless / Wondrous Item</option>
              </select>
            </div>

            <div>
              <label className="label-text">Effect / Property Description</label>
              <input
                type="text"
                value={wondrousEffect}
                onChange={e => setWondrousEffect(e.target.value)}
                placeholder="e.g. +2 resistance bonus to all saving throws"
                className="input-field text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowWondrousModal(false)}
                className="btn btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary text-xs"
              >
                Add Item
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
