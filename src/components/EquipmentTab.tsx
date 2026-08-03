import React, { useState } from 'react';
import { CharacterState, WeaponData, RaceData, ClassData, Equipment, CustomArmorData, WondrousItem, InventoryItem, Funds } from '../types/character';
import { getSourceBadgeInfo } from '../utils/sourceFilter';
import { calculateTotalScore, getAbilityMod, parseRaceMods } from '../engine/stats';
import { calculateBAB } from '../engine/classes';
import {
  resolveWeapon, resolveArmor, resolveShield, calculateFeatCombatBonuses,
  calculateCarryingCapacity, calculateCoinWeight, calculateTotalNetWorthGP,
  calculateTotalCarriedWeight, getEncumbranceStatus
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
];

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

  const handleEqChange = (field: keyof Equipment, val: any) => {
    onChange({ equipment: { ...eq, [field]: val } });
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

  const customWeapons = character.customWeapons || [];
  const customArmors = character.customArmors || [];

  // Combined weapons list for dropdowns
  const availableWeapons = [...customWeapons, ...weaponsData];

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
    onChange({ inventory: inventory.filter(item => item.id !== id) });
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
    onChange({
      customWeapons: updatedCustoms,
      equipment: { ...eq, primaryWeapon: newWpn.name }
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
    onChange({
      customArmors: updatedArmors,
      equipment: { ...eq, armor: newArmor.name }
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
    handleEqChange('wondrousItems', [...currentItems, newItem]);

    setWondrousName('');
    setWondrousEffect('');
    setShowWondrousModal(false);
  };

  const handleRemoveWondrousItem = (id: string) => {
    const currentItems = eq.wondrousItems || [];
    handleEqChange('wondrousItems', currentItems.filter(i => i.id !== id));
  };

  // Filtered inventory items
  const filteredInventory = activeLocationFilter === 'All'
    ? inventory
    : inventory.filter(item => (item.location || 'Carried').toLowerCase() === activeLocationFilter.toLowerCase());

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
                <select
                  value={availableWeapons.some(w => w.name === eq.primaryWeapon) ? eq.primaryWeapon : '__CUSTOM__'}
                  onChange={e => {
                    if (e.target.value !== '__CUSTOM__') {
                      handleEqChange('primaryWeapon', e.target.value);
                    }
                  }}
                  className="input-field text-xs font-semibold text-amber-300"
                >
                  <option value="none">-- None --</option>
                  {!availableWeapons.some(w => w.name === eq.primaryWeapon) && eq.primaryWeapon && eq.primaryWeapon !== 'none' && (
                    <option value="__CUSTOM__">Custom: {eq.primaryWeapon}</option>
                  )}
                  {availableWeapons.map((w, idx) => {
                    const badge = getSourceBadgeInfo(w.source, character.allowedSources);
                    return (
                      <option key={w.id || `${w.name}_${idx}`} value={w.name}>
                        {!badge.isAllowed ? `⚠️ ${w.name} (${w.damageM}, ${w.type}) [${badge.sourceCode} - Restricted]` : `${w.name} (${w.damageM}, ${w.type}) [${badge.sourceCode}]`}
                      </option>
                    );
                  })}
                  <option value="__CUSTOM__">+ Custom / Typed Weapon Name...</option>
                </select>

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
                <select
                  value={availableWeapons.some(w => w.name === eq.secondaryWeapon) ? eq.secondaryWeapon : (eq.secondaryWeapon && eq.secondaryWeapon !== 'none' ? '__CUSTOM__' : 'none')}
                  onChange={e => {
                    if (e.target.value !== '__CUSTOM__') {
                      handleEqChange('secondaryWeapon', e.target.value);
                    }
                  }}
                  className="input-field text-xs"
                >
                  <option value="none">-- None --</option>
                  {!availableWeapons.some(w => w.name === eq.secondaryWeapon) && eq.secondaryWeapon && eq.secondaryWeapon !== 'none' && (
                    <option value="__CUSTOM__">Custom: {eq.secondaryWeapon}</option>
                  )}
                  {availableWeapons.map((w, idx) => {
                    const badge = getSourceBadgeInfo(w.source, character.allowedSources);
                    return (
                      <option key={w.id || `${w.name}_sec_${idx}`} value={w.name}>
                        {!badge.isAllowed ? `⚠️ ${w.name} (${w.damageM}, ${w.type}) [${badge.sourceCode} - Restricted]` : `${w.name} (${w.damageM}, ${w.type}) [${badge.sourceCode}]`}
                      </option>
                    );
                  })}
                  <option value="__CUSTOM__">+ Custom / Typed Weapon Name...</option>
                </select>

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
                <select
                  value={availableWeapons.some(w => w.name === eq.rangedWeapon) ? eq.rangedWeapon : (eq.rangedWeapon && eq.rangedWeapon !== 'none' ? '__CUSTOM__' : 'none')}
                  onChange={e => {
                    if (e.target.value !== '__CUSTOM__') {
                      handleEqChange('rangedWeapon', e.target.value);
                    }
                  }}
                  className="input-field text-xs"
                >
                  <option value="none">-- None --</option>
                  {!availableWeapons.some(w => w.name === eq.rangedWeapon) && eq.rangedWeapon && eq.rangedWeapon !== 'none' && (
                    <option value="__CUSTOM__">Custom: {eq.rangedWeapon}</option>
                  )}
                  {availableWeapons.map((w, idx) => {
                    const badge = getSourceBadgeInfo(w.source, character.allowedSources);
                    return (
                      <option key={w.id || `${w.name}_rng_${idx}`} value={w.name}>
                        {!badge.isAllowed ? `⚠️ ${w.name} (${w.damageM}, ${w.type}) [${badge.sourceCode} - Restricted]` : `${w.name} (${w.damageM}, ${w.type}) [${badge.sourceCode}]`}
                      </option>
                    );
                  })}
                  <option value="__CUSTOM__">+ Custom / Typed Weapon Name...</option>
                </select>

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
            <p className="text-xs text-slate-400">Organize potions, adventuring gear, containers, and stash.</p>
          </div>

          {/* Quick Add Presets Bar */}
          <div className="flex items-center gap-2">
            <select
              onChange={e => {
                if (e.target.value) {
                  handleQuickAddPreset(e.target.value);
                  e.target.value = '';
                }
              }}
              className="input-field text-xs text-amber-300 font-semibold max-w-[200px]"
              defaultValue=""
            >
              <option value="" disabled>+ Quick Add Gear Preset...</option>
              {COMMON_ITEM_PRESETS.map((p, idx) => (
                <option key={idx} value={p.name}>{p.name} ({p.weight} lb, {p.value})</option>
              ))}
            </select>
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
                  ({inventory.filter(i => (i.location || 'Carried').toLowerCase() === loc.toLowerCase()).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Inventory Items List */}
        {filteredInventory.length === 0 ? (
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
                {filteredInventory.map(item => {
                  const totalLineWeight = (item.quantity * item.weight);
                  const isStashed = ['stash', 'mount'].includes((item.location || '').toLowerCase());
                  const isHaversack = (item.location || '').toLowerCase() === 'haversack';

                  return (
                    <tr key={item.id} className="hover:bg-slate-950/40 transition">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-amber-200 block text-xs">{item.name}</span>
                        {item.notes && <span className="text-[10px] text-slate-400 font-sans block">{item.notes}</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center">
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
                      </td>
                      <td className="py-2.5 px-3 text-center">
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
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-300">{item.weight} lb</td>
                      <td className="py-2.5 px-3 text-center">
                        {isStashed ? (
                          <span className="text-slate-500 italic text-[10px]">({totalLineWeight.toFixed(1)} lb stashed)</span>
                        ) : isHaversack ? (
                          <span className="text-purple-400 font-bold text-[10px]">0 lb (Haversack)</span>
                        ) : (
                          <span className="text-amber-300 font-bold">{totalLineWeight.toFixed(1)} lb</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400">{item.value || '-'}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleRemoveInventoryItem(item.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 text-xs"
                          title="Delete Item"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
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
