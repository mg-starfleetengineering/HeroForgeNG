import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { CharacterState, WeaponData, RaceData, ClassData, Equipment, CustomArmorData, WondrousItem, InventoryItem, Funds } from '../types/character';
import { getSourceBadgeInfo, sortDropdownItems } from '../utils/sourceFilter';
import { SearchableSelect, SearchableOption } from './SearchableSelect';
import { calculateTotalScore, getAbilityMod, parseRaceMods } from '../engine/stats';
import { calculateBAB } from '../engine/classes';
import {
  resolveWeapon, resolveArmor, resolveShield, calculateFeatCombatBonuses,
  calculateCarryingCapacity, calculateCoinWeight, calculateTotalNetWorthGP,
  calculateTotalCarriedWeight, getEncumbranceStatus, ARMOR_WEIGHT_MAP, SHIELD_WEIGHT_MAP,
  ensureEquippedItemInInventory, isItemInInventory, syncEquippedItemsToInventory,
  matchesItemName, THEMED_WEAPON_BASE_MAP, getThemedWeaponBase, THEMED_WEAPON_LIST,
  STANDARD_BASE_WEAPONS, createInventoryWeapon, createInventoryArmor, createInventoryShield,
  getEquippedArmorItem, getEquippedShieldItem, getEquippedWeaponItem,
  resolveEquippedArmor, resolveEquippedShield, resolveEquippedWeapon
} from '../engine/equipment';
import {
  getTacticalCombatState,
  calculateTacticalCombatModifiers,
  generateFullAttackSequence,
  getActiveCombatModifiers
} from '../engine/combat';
import { rollAttack, rollDamage } from '../engine/dice';
import {
  getAvailableWeaponQualities,
  getAvailableArmorQualities,
  getAvailableShieldQualities,
  getQualityById,
  calculateKeenThreat,
  hasKeenQuality,
  hasSpeedQuality,
  getWeaponSpecialDamage,
  getWeaponRollOptions,
  calculateCritDamagePools,
  getBaneAttackOption,
  WeaponRollOption,
  getArmorSkillBonus,
  getFortificationSummary,
  calculateTotalItemCost,
  formatMagicItemName,
  parseMagicItemName,
  MagicQuality,
  WEAPON_SPECIAL_QUALITIES,
  ARMOR_SHIELD_SPECIAL_QUALITIES
} from '../engine/magicItems';

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

const CustomWeaponInput: React.FC<{
  value: string;
  onCommit: (val: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onCommit, placeholder, className }) => {
  const [localVal, setLocalVal] = useState(value === '__CUSTOM__' ? '' : value);

  useEffect(() => {
    setLocalVal(value === '__CUSTOM__' ? '' : value);
  }, [value]);

  const handleBlur = () => {
    const trimmed = localVal.trim();
    if (trimmed && trimmed !== value) {
      onCommit(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <input
      type="text"
      value={localVal}
      onChange={e => setLocalVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={className}
    />
  );
};

const QualitySelector: React.FC<{
  title: string;
  qualities: string[];
  available: MagicQuality[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  enhancementBonus?: number;
  itemType?: 'weapon' | 'armor' | 'shield';
  onOpenGuide?: () => void;
}> = ({
  title,
  qualities,
  available,
  onAdd,
  onRemove,
  enhancementBonus = 0,
  itemType = 'weapon',
  onOpenGuide
}) => {
  const costSummary = calculateTotalItemCost(0, enhancementBonus, qualities, itemType);

  const qualitySelectOptions: SearchableOption[] = useMemo(() => {
    return [
      { value: '', label: '+ Add Special Quality...', isAllowed: true },
      ...available.map(q => {
        const isSelected = qualities.includes(q.id);
        const costBadge = q.costType === 'bonus' ? `+${q.costValue}` : `+${q.costValue.toLocaleString()} gp`;
        return {
          value: q.id,
          label: q.name,
          sublabel: q.description,
          badge: costBadge,
          isAllowed: !isSelected
        };
      })
    ];
  }, [available, qualities]);

  return (
    <div className="space-y-1.5 pt-1.5 border-t border-slate-800/80">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
            <i className="fa-solid fa-sparkles text-amber-400 text-[10px]"></i>
            {title}
          </label>
          {onOpenGuide && (
            <button
              type="button"
              onClick={onOpenGuide}
              className="text-slate-400 hover:text-amber-400 text-xs transition cursor-pointer p-0.5"
              title="Open Magic Item Special Qualities Guide"
            >
              <i className="fa-solid fa-circle-question"></i>
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {qualities.length > 0 && (
            <span className="text-[10px] font-mono text-amber-300/90 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              {costSummary.breakdown}
            </span>
          )}
          {(enhancementBonus > 0 || qualities.length > 0) && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shrink-0"
              title="Enhancements and special qualities are saved directly to this item in your inventory"
            >
              <i className="fa-solid fa-check text-[9px]"></i>
              <span>Saved in Inventory</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {qualities.map(qId => {
          const q = getQualityById(qId);
          if (!q) return null;
          return (
            <span
              key={qId}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-medium shadow-xs"
              title={q.description}
            >
              <span>{q.name}</span>
              <span className="text-[9px] font-mono opacity-75">
                ({q.costType === 'bonus' ? `+${q.costValue}` : `${q.costValue.toLocaleString()} gp`})
              </span>
              <button
                type="button"
                onClick={() => onRemove(qId)}
                className="hover:text-rose-400 text-slate-400 ml-0.5 text-xs transition cursor-pointer leading-none"
                title={`Remove ${q.name}`}
              >
                &times;
              </button>
            </span>
          );
        })}

        <div className="w-56 sm:w-64 max-w-full">
          <SearchableSelect
            value=""
            options={qualitySelectOptions}
            onChange={val => {
              if (val) {
                onAdd(val);
              }
            }}
            placeholder="+ Add Special Quality..."
          />
        </div>
      </div>
    </div>
  );
};

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
  const [showQualitiesGuide, setShowQualitiesGuide] = useState(false);
  const [qualitiesGuideFilter, setQualitiesGuideFilter] = useState<'all' | 'weapon' | 'armor'>('all');
  const [qualitiesGuideSearch, setQualitiesGuideSearch] = useState('');

  useEffect(() => {
    const syncedChar = syncEquippedItemsToInventory(character, weaponsData);
    if (syncedChar.inventory !== character.inventory || syncedChar.equipment !== character.equipment) {
      onChange({ inventory: syncedChar.inventory, equipment: syncedChar.equipment });
    }
  }, [character.equipment, character.inventory, weaponsData]);

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
  const [equipSlotPickerItemId, setEquipSlotPickerItemId] = useState<string | null>(null);

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
    primaryWeaponQualities: [],
    secondaryWeapon: 'none',
    secondaryWeaponEnhancement: 0,
    secondaryWeaponQualities: [],
    rangedWeapon: 'none',
    rangedWeaponEnhancement: 0,
    rangedWeaponQualities: [],
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
    let updatedCustoms = [...customWeapons];
    let updatedArmors = [...customArmors];

    if (field === 'primaryWeapon') {
      if (val === 'none') {
        newEq.primaryWeapon = 'none';
        newEq.primaryWeaponItemId = undefined;
        newEq.primaryWeaponEnhancement = 0;
        newEq.primaryWeaponQualities = [];
      } else if (val === '__CUSTOM__') {
        newEq.primaryWeapon = '__CUSTOM__';
        newEq.primaryWeaponItemId = undefined;
      } else {
        const clean = (val || '').trim();
        if (!clean) return;
        let invItem = updatedInv.find(i => i.id === clean);
        if (!invItem) {
          invItem = updatedInv.find(i =>
            i.id !== eq.secondaryWeaponItemId &&
            i.id !== eq.rangedWeaponItemId &&
            (i.name.toLowerCase() === clean.toLowerCase() || matchesItemName(i.name, clean))
          );
        }

        if (invItem && invItem.quantity > 1) {
          const splitId = `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          const splitItem: InventoryItem = { ...invItem, id: splitId, quantity: 1 };
          updatedInv = updatedInv.map(i => i.id === invItem!.id ? { ...i, quantity: i.quantity - 1 } : i);
          updatedInv.push(splitItem);
          invItem = splitItem;
        } else if (!invItem) {
          invItem = createInventoryWeapon(clean, weaponsData, updatedCustoms);
          updatedInv.push(invItem);
        }

        newEq.primaryWeapon = invItem.name;
        newEq.primaryWeaponItemId = invItem.id;
        newEq.primaryWeaponEnhancement = invItem.enhancementBonus || 0;
        newEq.primaryWeaponQualities = invItem.specialQualities ? [...invItem.specialQualities] : [];

        // Transfer weapon from other weapon slots if already equipped there
        if (newEq.secondaryWeaponItemId === invItem.id) {
          newEq.secondaryWeapon = 'none';
          newEq.secondaryWeaponItemId = undefined;
          newEq.secondaryWeaponEnhancement = 0;
          newEq.secondaryWeaponQualities = [];
        }
        if (newEq.rangedWeaponItemId === invItem.id) {
          newEq.rangedWeapon = 'none';
          newEq.rangedWeaponItemId = undefined;
          newEq.rangedWeaponEnhancement = 0;
          newEq.rangedWeaponQualities = [];
        }

        const isTwoHanded = invItem.weaponData?.size === 'T' ||
          invItem.weaponData?.category === 'Two-Handed' ||
          resolveWeapon(invItem.name, updatedCustoms, weaponsData).size === 'T';

        if (isTwoHanded) {
          if (newEq.secondaryWeapon && newEq.secondaryWeapon !== 'none') {
            newEq.secondaryWeapon = 'none';
            newEq.secondaryWeaponItemId = undefined;
            newEq.secondaryWeaponEnhancement = 0;
            newEq.secondaryWeaponQualities = [];
          }
          if (newEq.shield && newEq.shield !== 'none' && !newEq.shield.toLowerCase().includes('buckler')) {
            newEq.shield = 'none';
            newEq.shieldItemId = undefined;
            newEq.shieldEnhancement = 0;
            newEq.shieldQualities = [];
          }
        }
      }
    } else if (field === 'secondaryWeapon') {
      if (val === 'none') {
        newEq.secondaryWeapon = 'none';
        newEq.secondaryWeaponItemId = undefined;
        newEq.secondaryWeaponEnhancement = 0;
        newEq.secondaryWeaponQualities = [];
      } else if (val === '__CUSTOM__') {
        newEq.secondaryWeapon = '__CUSTOM__';
        newEq.secondaryWeaponItemId = undefined;
      } else {
        const clean = (val || '').trim();
        if (!clean) return;
        let invItem = updatedInv.find(i => i.id === clean);
        if (!invItem) {
          invItem = updatedInv.find(i =>
            i.id !== eq.primaryWeaponItemId &&
            i.id !== eq.rangedWeaponItemId &&
            (i.name.toLowerCase() === clean.toLowerCase() || matchesItemName(i.name, clean))
          );
        }

        if (invItem && invItem.quantity > 1) {
          const splitId = `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          const splitItem: InventoryItem = { ...invItem, id: splitId, quantity: 1 };
          updatedInv = updatedInv.map(i => i.id === invItem!.id ? { ...i, quantity: i.quantity - 1 } : i);
          updatedInv.push(splitItem);
          invItem = splitItem;
        } else if (!invItem) {
          invItem = createInventoryWeapon(clean, weaponsData, updatedCustoms);
          updatedInv.push(invItem);
        }

        newEq.secondaryWeapon = invItem.name;
        newEq.secondaryWeaponItemId = invItem.id;
        newEq.secondaryWeaponEnhancement = invItem.enhancementBonus || 0;
        newEq.secondaryWeaponQualities = invItem.specialQualities ? [...invItem.specialQualities] : [];

        // Transfer weapon from other weapon slots if already equipped there
        if (newEq.primaryWeaponItemId === invItem.id) {
          newEq.primaryWeapon = 'none';
          newEq.primaryWeaponItemId = undefined;
          newEq.primaryWeaponEnhancement = 0;
          newEq.primaryWeaponQualities = [];
        }
        if (newEq.rangedWeaponItemId === invItem.id) {
          newEq.rangedWeapon = 'none';
          newEq.rangedWeaponItemId = undefined;
          newEq.rangedWeaponEnhancement = 0;
          newEq.rangedWeaponQualities = [];
        }

        if (newEq.primaryWeapon && newEq.primaryWeapon !== 'none') {
          const primaryObj = resolveEquippedWeapon({ ...character, equipment: newEq }, 'primaryWeapon', weaponsData, updatedCustoms);
          if (primaryObj.size === 'T' || primaryObj.category === 'Two-Handed') {
            newEq.primaryWeapon = 'none';
            newEq.primaryWeaponItemId = undefined;
            newEq.primaryWeaponEnhancement = 0;
            newEq.primaryWeaponQualities = [];
          }
        }
        if (newEq.shield && newEq.shield !== 'none' && !newEq.shield.toLowerCase().includes('buckler')) {
          newEq.shield = 'none';
          newEq.shieldItemId = undefined;
          newEq.shieldEnhancement = 0;
          newEq.shieldQualities = [];
        }
      }
    } else if (field === 'rangedWeapon') {
      if (val === 'none') {
        newEq.rangedWeapon = 'none';
        newEq.rangedWeaponItemId = undefined;
        newEq.rangedWeaponEnhancement = 0;
        newEq.rangedWeaponQualities = [];
      } else if (val === '__CUSTOM__') {
        newEq.rangedWeapon = '__CUSTOM__';
        newEq.rangedWeaponItemId = undefined;
      } else {
        const clean = (val || '').trim();
        if (!clean) return;
        let invItem = updatedInv.find(i => i.id === clean);
        if (!invItem) {
          invItem = updatedInv.find(i =>
            i.id !== eq.primaryWeaponItemId &&
            i.id !== eq.secondaryWeaponItemId &&
            (i.name.toLowerCase() === clean.toLowerCase() || matchesItemName(i.name, clean))
          );
        }

        if (invItem && invItem.quantity > 1) {
          const splitId = `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          const splitItem: InventoryItem = { ...invItem, id: splitId, quantity: 1 };
          updatedInv = updatedInv.map(i => i.id === invItem!.id ? { ...i, quantity: i.quantity - 1 } : i);
          updatedInv.push(splitItem);
          invItem = splitItem;
        } else if (!invItem) {
          invItem = createInventoryWeapon(clean, weaponsData, updatedCustoms);
          updatedInv.push(invItem);
        }

        newEq.rangedWeapon = invItem.name;
        newEq.rangedWeaponItemId = invItem.id;
        newEq.rangedWeaponEnhancement = invItem.enhancementBonus || 0;
        newEq.rangedWeaponQualities = invItem.specialQualities ? [...invItem.specialQualities] : [];

        // Transfer weapon from other weapon slots if already equipped there
        if (newEq.primaryWeaponItemId === invItem.id) {
          newEq.primaryWeapon = 'none';
          newEq.primaryWeaponItemId = undefined;
          newEq.primaryWeaponEnhancement = 0;
          newEq.primaryWeaponQualities = [];
        }
        if (newEq.secondaryWeaponItemId === invItem.id) {
          newEq.secondaryWeapon = 'none';
          newEq.secondaryWeaponItemId = undefined;
          newEq.secondaryWeaponEnhancement = 0;
          newEq.secondaryWeaponQualities = [];
        }
      }
    } else if (field === 'armor') {
      if (val === 'none') {
        newEq.armor = 'none';
        newEq.armorItemId = undefined;
        newEq.armorEnhancement = 0;
        newEq.armorQualities = [];
      } else {
        const clean = (val || '').trim();
        if (!clean) return;

        let invItem = updatedInv.find(i => i.id === clean);
        if (!invItem) {
          const resolved = resolveArmor(clean, updatedArmors);
          const canonicalName = resolved.name;
          invItem = updatedInv.find(i =>
            i.id !== eq.shieldItemId &&
            (i.itemType === 'armor' || i.armorData?.type !== 'shield' || !i.itemType) &&
            (
              i.name.toLowerCase() === clean.toLowerCase() ||
              i.name.toLowerCase() === canonicalName.toLowerCase() ||
              matchesItemName(i.name, clean) ||
              matchesItemName(i.name, canonicalName)
            )
          );
        }

        if (invItem && invItem.quantity > 1) {
          const splitId = `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          const splitItem: InventoryItem = { ...invItem, id: splitId, quantity: 1 };
          updatedInv = updatedInv.map(i => i.id === invItem!.id ? { ...i, quantity: i.quantity - 1 } : i);
          updatedInv.push(splitItem);
          invItem = splitItem;
        } else if (!invItem) {
          invItem = createInventoryArmor(clean, updatedArmors);
          updatedInv.push(invItem);
        }

        newEq.armor = invItem.name;
        newEq.armorItemId = invItem.id;
        newEq.armorEnhancement = invItem.enhancementBonus || 0;
        newEq.armorQualities = invItem.specialQualities ? [...invItem.specialQualities] : [];
      }
    } else if (field === 'shield') {
      if (val === 'none') {
        newEq.shield = 'none';
        newEq.shieldItemId = undefined;
        newEq.shieldEnhancement = 0;
        newEq.shieldQualities = [];
      } else {
        const clean = (val || '').trim();
        if (!clean) return;

        let invItem = updatedInv.find(i => i.id === clean);
        if (!invItem) {
          const resolved = resolveShield(clean, updatedArmors);
          const canonicalName = resolved.name;
          invItem = updatedInv.find(i =>
            i.id !== eq.armorItemId &&
            (i.itemType === 'shield' || i.armorData?.type === 'shield' || !i.itemType) &&
            (
              i.name.toLowerCase() === clean.toLowerCase() ||
              i.name.toLowerCase() === canonicalName.toLowerCase() ||
              matchesItemName(i.name, clean) ||
              matchesItemName(i.name, canonicalName)
            )
          );
        }

        if (invItem && invItem.quantity > 1) {
          const splitId = `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          const splitItem: InventoryItem = { ...invItem, id: splitId, quantity: 1 };
          updatedInv = updatedInv.map(i => i.id === invItem!.id ? { ...i, quantity: i.quantity - 1 } : i);
          updatedInv.push(splitItem);
          invItem = splitItem;
        } else if (!invItem) {
          invItem = createInventoryShield(clean, updatedArmors);
          updatedInv.push(invItem);
        }

        newEq.shield = invItem.name;
        newEq.shieldItemId = invItem.id;
        newEq.shieldEnhancement = invItem.enhancementBonus || 0;
        newEq.shieldQualities = invItem.specialQualities ? [...invItem.specialQualities] : [];

        if (!invItem.name.toLowerCase().includes('buckler')) {
          if (newEq.primaryWeapon && newEq.primaryWeapon !== 'none') {
            const primaryObj = resolveEquippedWeapon({ ...character, equipment: newEq }, 'primaryWeapon', weaponsData, updatedCustoms);
            if (primaryObj.size === 'T' || primaryObj.category === 'Two-Handed') {
              newEq.primaryWeapon = 'none';
              newEq.primaryWeaponItemId = undefined;
              newEq.primaryWeaponEnhancement = 0;
              newEq.primaryWeaponQualities = [];
            }
          }
          if (newEq.secondaryWeapon && newEq.secondaryWeapon !== 'none') {
            newEq.secondaryWeapon = 'none';
            newEq.secondaryWeaponItemId = undefined;
            newEq.secondaryWeaponEnhancement = 0;
            newEq.secondaryWeaponQualities = [];
          }
        }
      }
    } else if (field === 'primaryWeaponEnhancement' || field === 'secondaryWeaponEnhancement' || field === 'rangedWeaponEnhancement') {
      const slotKey = field === 'primaryWeaponEnhancement' ? 'primaryWeapon' : (field === 'secondaryWeaponEnhancement' ? 'secondaryWeapon' : 'rangedWeapon');
      const idKey = `${slotKey}ItemId` as keyof Equipment;
      const qKey = `${slotKey}Qualities` as keyof Equipment;
      const targetItemId = newEq[idKey] as string | undefined;
      const qualities = (newEq[qKey] as string[]) || [];

      if (targetItemId) {
        const itemIdx = updatedInv.findIndex(i => i.id === targetItemId);
        if (itemIdx >= 0) {
          const item = updatedInv[itemIdx];
          const baseName = parseMagicItemName(item.name).baseName;
          const newName = formatMagicItemName(baseName, val, qualities);
          updatedInv[itemIdx] = { ...item, name: newName, enhancementBonus: val };
          (newEq as any)[slotKey] = newName;
        }
      } else {
        const currentName = eq[slotKey];
        if (currentName && currentName !== 'none' && currentName !== '__CUSTOM__') {
          updatedInv = updatedInv.map(i => matchesItemName(i.name, currentName) ? { ...i, enhancementBonus: val } : i);
        }
      }
    } else if (field === 'armorEnhancement' || field === 'shieldEnhancement') {
      const slotKey = field === 'armorEnhancement' ? 'armor' : 'shield';
      const idKey = `${slotKey}ItemId` as keyof Equipment;
      const qKey = `${slotKey}Qualities` as keyof Equipment;
      const targetItemId = newEq[idKey] as string | undefined;
      const qualities = (newEq[qKey] as string[]) || [];

      if (targetItemId) {
        const itemIdx = updatedInv.findIndex(i => i.id === targetItemId);
        if (itemIdx >= 0) {
          const item = updatedInv[itemIdx];
          const baseName = parseMagicItemName(item.name, slotKey).baseName;
          const newName = formatMagicItemName(baseName, val, qualities);
          updatedInv[itemIdx] = { ...item, name: newName, enhancementBonus: val };
          (newEq as any)[slotKey] = newName;
        }
      } else {
        const currentName = eq[slotKey];
        if (currentName && currentName !== 'none') {
          updatedInv = updatedInv.map(i => matchesItemName(i.name, currentName) ? { ...i, enhancementBonus: val } : i);
        }
      }
    } else if (
      field === 'primaryWeaponQualities' ||
      field === 'secondaryWeaponQualities' ||
      field === 'rangedWeaponQualities' ||
      field === 'armorQualities' ||
      field === 'shieldQualities'
    ) {
      const slotKey = field === 'primaryWeaponQualities' ? 'primaryWeapon' :
        (field === 'secondaryWeaponQualities' ? 'secondaryWeapon' :
        (field === 'rangedWeaponQualities' ? 'rangedWeapon' :
        (field === 'armorQualities' ? 'armor' : 'shield')));
      const idKey = `${slotKey}ItemId` as keyof Equipment;
      const enhKey = `${slotKey}Enhancement` as keyof Equipment;
      const targetItemId = newEq[idKey] as string | undefined;
      const enh = (newEq[enhKey] as number) || 0;
      const qList = (val || []) as string[];

      if (targetItemId) {
        const itemIdx = updatedInv.findIndex(i => i.id === targetItemId);
        if (itemIdx >= 0) {
          const item = updatedInv[itemIdx];
          const targetHint = (slotKey === 'armor' || slotKey === 'shield') ? slotKey : 'weapon';
          const baseName = parseMagicItemName(item.name, targetHint).baseName;
          const newName = formatMagicItemName(baseName, enh, qList);
          updatedInv[itemIdx] = { ...item, name: newName, specialQualities: [...qList] };
          (newEq as any)[slotKey] = newName;
        }
      } else {
        const currentName = eq[slotKey];
        if (currentName && currentName !== 'none' && currentName !== '__CUSTOM__') {
          updatedInv = updatedInv.map(i => {
            if (matchesItemName(i.name, currentName)) {
              return { ...i, specialQualities: [...qList] };
            }
            return i;
          });
        }
      }
    }

    onChange({
      customWeapons: updatedCustoms,
      customArmors: updatedArmors,
      equipment: newEq,
      inventory: updatedInv
    });
  };

  const handleEquipInventoryItem = (
    item: InventoryItem,
    slot: 'primaryWeapon' | 'secondaryWeapon' | 'rangedWeapon' | 'armor' | 'shield'
  ) => {
    let updatedInv = [...inventory];
    let equippedItem = item;

    // Stack splitting if quantity > 1
    if (item.quantity > 1) {
      const splitId = `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const splitItem: InventoryItem = {
        ...item,
        id: splitId,
        quantity: 1
      };
      updatedInv = updatedInv.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i);
      updatedInv.push(splitItem);
      equippedItem = splitItem;
    }

    let newEq = { ...eq };

    // If this item was equipped in a different slot, unequip it from the old slot
    if (newEq.primaryWeaponItemId === equippedItem.id && slot !== 'primaryWeapon') {
      newEq.primaryWeapon = 'none';
      newEq.primaryWeaponItemId = undefined;
      newEq.primaryWeaponEnhancement = 0;
      newEq.primaryWeaponQualities = [];
    }
    if (newEq.secondaryWeaponItemId === equippedItem.id && slot !== 'secondaryWeapon') {
      newEq.secondaryWeapon = 'none';
      newEq.secondaryWeaponItemId = undefined;
      newEq.secondaryWeaponEnhancement = 0;
      newEq.secondaryWeaponQualities = [];
    }
    if (newEq.rangedWeaponItemId === equippedItem.id && slot !== 'rangedWeapon') {
      newEq.rangedWeapon = 'none';
      newEq.rangedWeaponItemId = undefined;
      newEq.rangedWeaponEnhancement = 0;
      newEq.rangedWeaponQualities = [];
    }
    if (newEq.armorItemId === equippedItem.id && slot !== 'armor') {
      newEq.armor = 'none';
      newEq.armorItemId = undefined;
      newEq.armorEnhancement = 0;
      newEq.armorQualities = [];
    }
    if (newEq.shieldItemId === equippedItem.id && slot !== 'shield') {
      newEq.shield = 'none';
      newEq.shieldItemId = undefined;
      newEq.shieldEnhancement = 0;
      newEq.shieldQualities = [];
    }

    if (slot === 'primaryWeapon') {
      newEq.primaryWeapon = equippedItem.name;
      newEq.primaryWeaponItemId = equippedItem.id;
      newEq.primaryWeaponEnhancement = equippedItem.enhancementBonus || 0;
      newEq.primaryWeaponQualities = equippedItem.specialQualities ? [...equippedItem.specialQualities] : [];

      const isTwoHanded = equippedItem.weaponData?.size === 'T' ||
        equippedItem.weaponData?.category === 'Two-Handed' ||
        resolveWeapon(equippedItem.name, customWeapons, weaponsData).size === 'T';

      if (isTwoHanded) {
        if (newEq.secondaryWeapon && newEq.secondaryWeapon !== 'none') {
          newEq.secondaryWeapon = 'none';
          newEq.secondaryWeaponItemId = undefined;
          newEq.secondaryWeaponEnhancement = 0;
          newEq.secondaryWeaponQualities = [];
        }
        if (newEq.shield && newEq.shield !== 'none' && !newEq.shield.toLowerCase().includes('buckler')) {
          newEq.shield = 'none';
          newEq.shieldItemId = undefined;
          newEq.shieldEnhancement = 0;
          newEq.shieldQualities = [];
        }
      }
    } else if (slot === 'secondaryWeapon') {
      newEq.secondaryWeapon = equippedItem.name;
      newEq.secondaryWeaponItemId = equippedItem.id;
      newEq.secondaryWeaponEnhancement = equippedItem.enhancementBonus || 0;
      newEq.secondaryWeaponQualities = equippedItem.specialQualities ? [...equippedItem.specialQualities] : [];

      if (newEq.primaryWeapon && newEq.primaryWeapon !== 'none') {
        const primaryObj = resolveEquippedWeapon({ ...character, equipment: newEq }, 'primaryWeapon', weaponsData, customWeapons);
        if (primaryObj.size === 'T' || primaryObj.category === 'Two-Handed') {
          newEq.primaryWeapon = 'none';
          newEq.primaryWeaponItemId = undefined;
          newEq.primaryWeaponEnhancement = 0;
          newEq.primaryWeaponQualities = [];
        }
      }
      if (newEq.shield && newEq.shield !== 'none' && !newEq.shield.toLowerCase().includes('buckler')) {
        newEq.shield = 'none';
        newEq.shieldItemId = undefined;
        newEq.shieldEnhancement = 0;
        newEq.shieldQualities = [];
      }
    } else if (slot === 'rangedWeapon') {
      newEq.rangedWeapon = equippedItem.name;
      newEq.rangedWeaponItemId = equippedItem.id;
      newEq.rangedWeaponEnhancement = equippedItem.enhancementBonus || 0;
      newEq.rangedWeaponQualities = equippedItem.specialQualities ? [...equippedItem.specialQualities] : [];
    } else if (slot === 'armor') {
      newEq.armor = equippedItem.name;
      newEq.armorItemId = equippedItem.id;
      newEq.armorEnhancement = equippedItem.enhancementBonus || 0;
      newEq.armorQualities = equippedItem.specialQualities ? [...equippedItem.specialQualities] : [];
    } else if (slot === 'shield') {
      newEq.shield = equippedItem.name;
      newEq.shieldItemId = equippedItem.id;
      newEq.shieldEnhancement = equippedItem.enhancementBonus || 0;
      newEq.shieldQualities = equippedItem.specialQualities ? [...equippedItem.specialQualities] : [];

      if (!equippedItem.name.toLowerCase().includes('buckler')) {
        if (newEq.primaryWeapon && newEq.primaryWeapon !== 'none') {
          const primaryObj = resolveEquippedWeapon({ ...character, equipment: newEq }, 'primaryWeapon', weaponsData, customWeapons);
          if (primaryObj.size === 'T' || primaryObj.category === 'Two-Handed') {
            newEq.primaryWeapon = 'none';
            newEq.primaryWeaponItemId = undefined;
            newEq.primaryWeaponEnhancement = 0;
            newEq.primaryWeaponQualities = [];
          }
        }
        if (newEq.secondaryWeapon && newEq.secondaryWeapon !== 'none') {
          newEq.secondaryWeapon = 'none';
          newEq.secondaryWeaponItemId = undefined;
          newEq.secondaryWeaponEnhancement = 0;
          newEq.secondaryWeaponQualities = [];
        }
      }
    }

    onChange({
      equipment: newEq,
      inventory: updatedInv
    });
  };

  const handleFundsChange = (field: keyof Funds, val: number) => {
    onChange({ funds: { ...funds, [field]: Math.max(0, val || 0) } });
  };

  const handleAddQuality = (
    field: 'primaryWeaponQualities' | 'secondaryWeaponQualities' | 'rangedWeaponQualities' | 'armorQualities' | 'shieldQualities',
    qId: string
  ) => {
    const current = eq[field] || [];
    if (!current.includes(qId)) {
      handleEqChange(field, [...current, qId]);
    }
  };

  const handleRemoveQuality = (
    field: 'primaryWeaponQualities' | 'secondaryWeaponQualities' | 'rangedWeaponQualities' | 'armorQualities' | 'shieldQualities',
    qId: string
  ) => {
    const current = eq[field] || [];
    handleEqChange(field, current.filter(id => id !== qId));
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

  const armorObj = resolveEquippedArmor(character, customArmors);
  const shieldObj = resolveEquippedShield(character, customArmors);
  const armorAc = armorObj.acBonus + (eq.armorEnhancement || 0);
  const shieldAc = shieldObj.acBonus + (eq.shieldEnhancement || 0);

  // Combined weapons list for dropdowns (allowed sources grouped at top, sorted A-Z, plus carried inventory weapons and themed weapons)
  const availableWeapons = useMemo(() => {
    const knownNames = new Set([...customWeapons, ...weaponsData].map(w => w.name.toLowerCase().trim()));
    const inventoryWeapons: WeaponData[] = [];
    (character.inventory || []).forEach(item => {
      const clean = (item.name || '').trim();
      if (!clean || clean.toLowerCase() === 'none' || knownNames.has(clean.toLowerCase())) return;

      // Check if it is genuinely a weapon:
      // 1. Matches a standard weapon in weaponsData
      const isKnown = weaponsData.some(w => w.name.toLowerCase() === clean.toLowerCase());
      // 2. Is a known themed weapon (e.g. "Nodachi") or aliased weapon (e.g. "Nodachi (Greatsword)")
      const themedBase = getThemedWeaponBase(clean, weaponsData);
      const isThemed = themedBase !== null;
      // 3. Or matches an alias pattern "Custom Name (BaseWeapon)" where BaseWeapon is recognized
      const aliasMatch = clean.match(/^(.+?)\s*\((.+?)\)$/);
      const isAliasedWeapon = aliasMatch
        ? (STANDARD_BASE_WEAPONS[aliasMatch[2].trim().toLowerCase()] !== undefined ||
           weaponsData.some(w => w.name.toLowerCase() === aliasMatch[2].trim().toLowerCase()))
        : false;

      // 4. Magic weapon name or item with magic properties
      const parsedMagic = parseMagicItemName(clean);
      const isMagicWeapon = (parsedMagic.enhancementBonus > 0 || parsedMagic.qualities.length > 0) &&
        (weaponsData.some(w => w.name.toLowerCase() === parsedMagic.baseName.toLowerCase()) ||
         getThemedWeaponBase(parsedMagic.baseName, weaponsData) !== null);

      if (isKnown || isThemed || isAliasedWeapon || isMagicWeapon) {
        const resolved = resolveWeapon(clean, customWeapons, weaponsData);
        inventoryWeapons.push({
          ...resolved,
          name: clean,
          source: resolved.source || 'PHB'
        });
        knownNames.add(clean.toLowerCase());
      }
    });

    // Also include well-known themed weapons with their aliased base weapon (e.g. Nodachi (Greatsword))
    const themedWeapons: WeaponData[] = THEMED_WEAPON_LIST
      .filter(item => !knownNames.has(item.displayName.toLowerCase()) && !knownNames.has(item.name.toLowerCase()))
      .map(item => {
        const resolved = resolveWeapon(item.displayName, customWeapons, weaponsData);
        knownNames.add(item.displayName.toLowerCase());
        knownNames.add(item.name.toLowerCase());
        return {
          ...resolved,
          name: item.displayName,
          source: resolved.source || 'PHB'
        };
      });

    return sortDropdownItems([...customWeapons, ...themedWeapons, ...inventoryWeapons, ...weaponsData], character.allowedSources);
  }, [customWeapons, weaponsData, character.inventory, character.allowedSources]);

  const createWeaponOptions = useCallback((forSlot: 'primary' | 'secondary' | 'ranged'): SearchableOption[] => {
    const options: SearchableOption[] = [
      { value: 'none', label: '-- None --', isAllowed: true }
    ];

    // 1. Inventory weapons first (value is invItem.id)
    (character.inventory || []).forEach(invItem => {
      const clean = (invItem.name || '').trim();
      if (!clean || clean.toLowerCase() === 'none') return;
      const isKnown = weaponsData.some(w => w.name.toLowerCase() === clean.toLowerCase());
      const isThemed = getThemedWeaponBase(clean, weaponsData) !== null;
      const isWeaponType = invItem.itemType === 'weapon' || Boolean(invItem.weaponData);
      const parsedMagic = parseMagicItemName(clean);
      const isMagicWeapon = (parsedMagic.enhancementBonus > 0 || parsedMagic.qualities.length > 0) &&
        (weaponsData.some(w => w.name.toLowerCase() === parsedMagic.baseName.toLowerCase()) ||
         getThemedWeaponBase(parsedMagic.baseName, weaponsData) !== null);

      if (isKnown || isThemed || isWeaponType || isMagicWeapon) {
        const resolved = resolveWeapon(clean, customWeapons, weaponsData);
        const enh = invItem.enhancementBonus || 0;
        const qNames = (invItem.specialQualities || []).map(q => getQualityById(q)?.name || q).join(', ');
        const magicTag = enh > 0 || qNames ? `+${enh}${qNames ? ` ${qNames}` : ''} | ` : '';
        const baseSublabel = `(${magicTag}${resolved.damageM || '1d8'}, ${resolved.type || 'P/S'}, Inv)`;

        // Only indicate equipped status if the item is currently equipped in another slot
        let otherSlotText = '';
        if (forSlot !== 'primary' && eq.primaryWeaponItemId === invItem.id) {
          otherSlotText = ' • (in Primary)';
        } else if (forSlot !== 'secondary' && eq.secondaryWeaponItemId === invItem.id) {
          otherSlotText = ' • (in Off-Hand)';
        } else if (forSlot !== 'ranged' && eq.rangedWeaponItemId === invItem.id) {
          otherSlotText = ' • (in Ranged)';
        }

        options.push({
          value: invItem.id,
          label: invItem.name,
          sublabel: otherSlotText ? `${baseSublabel}${otherSlotText}` : baseSublabel,
          badge: otherSlotText ? 'EQUIPPED' : 'INV',
          isAllowed: true
        });
      }
    });

    // 2. Catalog weapons
    availableWeapons.forEach(w => {
      const badge = getSourceBadgeInfo(w.source, character.allowedSources);
      const isCustomOrCarried = !w.source || w.source === 'Custom' || w.source === 'Backpack' || w.source.toLowerCase().includes('custom');
      
      const themedBase = getThemedWeaponBase(w.name, weaponsData);
      const isThemed = !!themedBase;

      // Display name includes aliased base weapon if it's a known themed weapon without parens
      let label = w.name;
      if (isThemed && !label.includes('(')) {
        const capBase = themedBase.charAt(0).toUpperCase() + themedBase.slice(1);
        label = `${w.name} (${capBase})`;
      }

      let sublabel = `(${w.damageM}, ${w.type})`;
      if (themedBase) {
        const capBase = themedBase.charAt(0).toUpperCase() + themedBase.slice(1);
        sublabel = `as ${capBase} | (${w.damageM}, ${w.type})`;
      }
      if (w.enhancementBonus || (w.specialQualities && w.specialQualities.length > 0)) {
        const qNames = (w.specialQualities || []).map(q => getQualityById(q)?.name || q).join(', ');
        const basePrefix = themedBase ? `as ${themedBase.charAt(0).toUpperCase() + themedBase.slice(1)} | ` : '';
        sublabel = `(+${w.enhancementBonus || 0}${qNames ? ` ${qNames}` : ''} | ${basePrefix}${w.damageM}, ${w.type})`;
      }

      // Avoid duplicate dropdown entry
      if (!options.some(o => o.value === label || o.label === label)) {
        options.push({
          value: label,
          label: label,
          sublabel,
          badge: badge.sourceCode,
          secondaryBadge: isThemed ? 'Themed' : undefined,
          isAllowed: isCustomOrCarried || isThemed ? true : badge.isAllowed
        });
      }
    });

    options.push({ value: '__CUSTOM__', label: '+ Custom / Typed Weapon Name...', isAllowed: true });
    return options;
  }, [availableWeapons, character.inventory, character.allowedSources, weaponsData, customWeapons, eq.primaryWeaponItemId, eq.secondaryWeaponItemId, eq.rangedWeaponItemId]);

  const primaryWeaponOptions = useMemo(() => createWeaponOptions('primary'), [createWeaponOptions]);
  const secondaryWeaponOptions = useMemo(() => createWeaponOptions('secondary'), [createWeaponOptions]);
  const rangedWeaponOptions = useMemo(() => createWeaponOptions('ranged'), [createWeaponOptions]);

  const selectedPrimaryWeaponValue = useMemo(() => {
    if (eq.primaryWeaponItemId && primaryWeaponOptions.some(w => w.value === eq.primaryWeaponItemId)) {
      return eq.primaryWeaponItemId;
    }
    const match = primaryWeaponOptions.find(w => w.value === eq.primaryWeapon || w.label === eq.primaryWeapon);
    if (match) return match.value;
    return eq.primaryWeapon && eq.primaryWeapon !== 'none' ? '__CUSTOM__' : 'none';
  }, [eq.primaryWeapon, eq.primaryWeaponItemId, primaryWeaponOptions]);

  const selectedSecondaryWeaponValue = useMemo(() => {
    if (eq.secondaryWeaponItemId && secondaryWeaponOptions.some(w => w.value === eq.secondaryWeaponItemId)) {
      return eq.secondaryWeaponItemId;
    }
    const match = secondaryWeaponOptions.find(w => w.value === eq.secondaryWeapon || w.label === eq.secondaryWeapon);
    if (match) return match.value;
    return eq.secondaryWeapon && eq.secondaryWeapon !== 'none' ? '__CUSTOM__' : 'none';
  }, [eq.secondaryWeapon, eq.secondaryWeaponItemId, secondaryWeaponOptions]);

  const selectedRangedWeaponValue = useMemo(() => {
    if (eq.rangedWeaponItemId && rangedWeaponOptions.some(w => w.value === eq.rangedWeaponItemId)) {
      return eq.rangedWeaponItemId;
    }
    const match = rangedWeaponOptions.find(w => w.value === eq.rangedWeapon || w.label === eq.rangedWeapon);
    if (match) return match.value;
    return eq.rangedWeapon && eq.rangedWeapon !== 'none' ? '__CUSTOM__' : 'none';
  }, [eq.rangedWeapon, eq.rangedWeaponItemId, rangedWeaponOptions]);

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

  const weaponEnhancementOptions: SearchableOption[] = useMemo(() => [
    { value: '0', label: 'Enh: +0', sublabel: 'Non-magical / Masterwork', isAllowed: true },
    { value: '1', label: 'Enh: +1', sublabel: '+1 Atk & Dmg bonus', isAllowed: true },
    { value: '2', label: 'Enh: +2', sublabel: '+2 Atk & Dmg bonus', isAllowed: true },
    { value: '3', label: 'Enh: +3', sublabel: '+3 Atk & Dmg bonus', isAllowed: true },
    { value: '4', label: 'Enh: +4', sublabel: '+4 Atk & Dmg bonus', isAllowed: true },
    { value: '5', label: 'Enh: +5', sublabel: '+5 Atk & Dmg bonus', isAllowed: true },
  ], []);

  const armorEnhancementOptions: SearchableOption[] = useMemo(() => [
    { value: '0', label: '+0', sublabel: 'Standard (+0 AC)', isAllowed: true },
    { value: '1', label: '+1', sublabel: '+1 AC bonus', isAllowed: true },
    { value: '2', label: '+2', sublabel: '+2 AC bonus', isAllowed: true },
    { value: '3', label: '+3', sublabel: '+3 AC bonus', isAllowed: true },
    { value: '4', label: '+4', sublabel: '+4 AC bonus', isAllowed: true },
    { value: '5', label: '+5', sublabel: '+5 AC bonus', isAllowed: true },
  ], []);

  const armorOptions: SearchableOption[] = useMemo(() => {
    const options: SearchableOption[] = [
      { value: 'none', label: 'None', sublabel: 'AC +0, Max Dex --, Check 0', isAllowed: true },
      { value: 'padded', label: 'Padded', sublabel: '+1 AC, Max Dex +8, Check 0, 10 lbs', badge: 'PHB', isAllowed: true },
      { value: 'leather', label: 'Leather', sublabel: '+2 AC, Max Dex +6, Check 0, 15 lbs', badge: 'PHB', isAllowed: true },
      { value: 'studded', label: 'Studded Leather', sublabel: '+3 AC, Max Dex +5, Check -1, 20 lbs', badge: 'PHB', isAllowed: true },
      { value: 'chainshirt', label: 'Chain Shirt', sublabel: '+4 AC, Max Dex +4, Check -2, 25 lbs', badge: 'PHB', isAllowed: true },
      { value: 'breastplate', label: 'Breastplate', sublabel: '+5 AC, Max Dex +3, Check -4, 30 lbs', badge: 'PHB', isAllowed: true },
      { value: 'fullplate', label: 'Full Plate', sublabel: '+8 AC, Max Dex +1, Check -6, 50 lbs', badge: 'PHB', isAllowed: true },
    ];

    customArmors.filter(a => a.type !== 'shield').forEach(ca => {
      const qNames = (ca.specialQualities || []).map(q => getQualityById(q)?.name || q).join(', ');
      const magicTag = ca.enhancementBonus || qNames ? `+${ca.enhancementBonus || 0}${qNames ? ` ${qNames}` : ''} | ` : '';
      options.push({
        value: ca.name,
        label: ca.name,
        sublabel: `(${magicTag}+${ca.acBonus} AC, Custom)`,
        badge: 'CUSTOM',
        isAllowed: true
      });
    });

    (character.inventory || []).forEach(invItem => {
      const clean = (invItem.name || '').trim();
      if (!clean || clean.toLowerCase() === 'none') return;
      if (invItem.itemType === 'shield' || invItem.armorData?.type === 'shield') return;

      const resolved = resolveArmor(clean, customArmors);
      if (resolved && resolved.type !== 'none') {
        const enh = invItem.enhancementBonus || 0;
        const qNames = (invItem.specialQualities || []).map(q => getQualityById(q)?.name || q).join(', ');
        const magicTag = enh > 0 || qNames ? `+${enh}${qNames ? ` ${qNames}` : ''} | ` : '';
        options.push({
          value: invItem.id,
          label: invItem.name,
          sublabel: `(${magicTag}+${resolved.acBonus + enh} AC, Inventory)`,
          badge: 'INV',
          isAllowed: true
        });
      }
    });

    const cur = (eq.armor || 'chainshirt').trim();
    if (cur && !options.some(o => o.value.toLowerCase() === cur.toLowerCase() || o.label.toLowerCase() === cur.toLowerCase() || matchesItemName(o.label, cur) || matchesItemName(o.value, cur))) {
      options.push({
        value: cur,
        label: cur,
        sublabel: 'Equipped Armor',
        isAllowed: true
      });
    }

    return options;
  }, [customArmors, character.inventory, eq.armor]);

  const selectedArmorValue = useMemo(() => {
    if (eq.armorItemId) {
      const match = armorOptions.find(o => o.value === eq.armorItemId);
      if (match) return match.value;
    }
    const cur = (eq.armor || 'chainshirt').trim();
    const match = armorOptions.find(o =>
      o.value.toLowerCase() === cur.toLowerCase() ||
      o.label.toLowerCase() === cur.toLowerCase() ||
      matchesItemName(o.label, cur) ||
      matchesItemName(o.value, cur)
    );
    return match ? match.value : cur;
  }, [eq.armor, eq.armorItemId, armorOptions]);

  const shieldOptions: SearchableOption[] = useMemo(() => {
    const options: SearchableOption[] = [
      { value: 'none', label: 'None', sublabel: '+0 AC', isAllowed: true },
      { value: 'buckler', label: 'Buckler', sublabel: '+1 AC, Check -1, 5 lbs', badge: 'PHB', isAllowed: true },
      { value: 'light_wooden', label: 'Light Shield', sublabel: '+1 AC, Check -1, 5 lbs', badge: 'PHB', isAllowed: true },
      { value: 'heavy_shield', label: 'Heavy Shield', sublabel: '+2 AC, Check -2, 15 lbs', badge: 'PHB', isAllowed: true },
      { value: 'tower_shield', label: 'Tower Shield', sublabel: '+4 AC, Check -10, 45 lbs', badge: 'PHB', isAllowed: true },
    ];

    customArmors.filter(a => a.type === 'shield').forEach(ca => {
      const qNames = (ca.specialQualities || []).map(q => getQualityById(q)?.name || q).join(', ');
      const magicTag = ca.enhancementBonus || qNames ? `+${ca.enhancementBonus || 0}${qNames ? ` ${qNames}` : ''} | ` : '';
      options.push({
        value: ca.name,
        label: ca.name,
        sublabel: `(${magicTag}+${ca.acBonus} AC, Custom Shield)`,
        badge: 'CUSTOM',
        isAllowed: true
      });
    });

    (character.inventory || []).forEach(invItem => {
      const clean = (invItem.name || '').trim();
      if (!clean || clean.toLowerCase() === 'none') return;
      if (invItem.itemType === 'armor' && invItem.armorData?.type !== 'shield') return;

      const resolved = resolveShield(clean, customArmors);
      if (resolved && resolved.name.toLowerCase() !== 'none') {
        const enh = invItem.enhancementBonus || 0;
        const qNames = (invItem.specialQualities || []).map(q => getQualityById(q)?.name || q).join(', ');
        const magicTag = enh > 0 || qNames ? `+${enh}${qNames ? ` ${qNames}` : ''} | ` : '';
        options.push({
          value: invItem.id,
          label: invItem.name,
          sublabel: `(${magicTag}+${resolved.acBonus + enh} AC, Inventory Shield)`,
          badge: 'INV',
          isAllowed: true
        });
      }
    });

    const cur = (eq.shield || 'heavy_shield').trim();
    if (cur && !options.some(o => o.value.toLowerCase() === cur.toLowerCase() || o.label.toLowerCase() === cur.toLowerCase() || matchesItemName(o.label, cur) || matchesItemName(o.value, cur))) {
      options.push({
        value: cur,
        label: cur,
        sublabel: 'Equipped Shield',
        isAllowed: true
      });
    }

    return options;
  }, [customArmors, character.inventory, eq.shield]);

  const selectedShieldValue = useMemo(() => {
    if (eq.shieldItemId) {
      const match = shieldOptions.find(o => o.value === eq.shieldItemId);
      if (match) return match.value;
    }
    const cur = (eq.shield || 'heavy_shield').trim();
    const match = shieldOptions.find(o =>
      o.value.toLowerCase() === cur.toLowerCase() ||
      o.label.toLowerCase() === cur.toLowerCase() ||
      matchesItemName(o.label, cur) ||
      matchesItemName(o.value, cur)
    );
    return match ? match.value : cur;
  }, [eq.shield, eq.shieldItemId, shieldOptions]);

  const filteredGuideQualities = useMemo(() => {
    let list: MagicQuality[] = [];
    if (qualitiesGuideFilter === 'all') {
      list = [...WEAPON_SPECIAL_QUALITIES, ...ARMOR_SHIELD_SPECIAL_QUALITIES];
    } else if (qualitiesGuideFilter === 'weapon') {
      list = [...WEAPON_SPECIAL_QUALITIES];
    } else {
      list = [...ARMOR_SHIELD_SPECIAL_QUALITIES];
    }

    if (qualitiesGuideSearch.trim()) {
      const qLower = qualitiesGuideSearch.toLowerCase().trim();
      list = list.filter(q =>
        q.name.toLowerCase().includes(qLower) ||
        q.description.toLowerCase().includes(qLower) ||
        (q.damageBonus && (q.damageBonus.dice.toLowerCase().includes(qLower) || q.damageBonus.type.toLowerCase().includes(qLower))) ||
        (q.costType === 'bonus' ? `+${q.costValue}`.includes(qLower) : `${q.costValue}`.includes(qLower)) ||
        q.target.toLowerCase().includes(qLower)
      );
    }

    return list;
  }, [qualitiesGuideFilter, qualitiesGuideSearch]);

  // Tactical Combat Modifiers
  const tcState = getTacticalCombatState(character, bab);
  const generalTcMods = calculateTacticalCombatModifiers(tcState);
  const activeCombatMods = getActiveCombatModifiers(tcState, totalLevel);
  const effectiveStrScore = strScore + (generalTcMods.strBonus || 0);
  const effectiveStrMod = getAbilityMod(effectiveStrScore);

  // Armor & Shield Special Qualities & Defenses
  const armorQualities = eq.armorQualities || [];
  const shieldQualities = eq.shieldQualities || [];
  const combinedFortification = getFortificationSummary(armorQualities, shieldQualities);
  const hideQualityBonus = getArmorSkillBonus(armorQualities, shieldQualities, 'Hide');
  const moveSilentlyQualityBonus = getArmorSkillBonus(armorQualities, shieldQualities, 'Move Silently');

  // Resolve Primary Weapon & Special Qualities
  const hasPrimary = Boolean(eq.primaryWeapon && eq.primaryWeapon !== 'none');
  const primaryQualities = eq.primaryWeaponQualities || [];
  const primarySpecialDmg = getWeaponSpecialDamage(primaryQualities);
  const primaryHasKeen = hasKeenQuality(primaryQualities);
  const primaryHasSpeed = hasSpeedQuality(primaryQualities);
  const primaryWpnObj = hasPrimary ? resolveEquippedWeapon(character, 'primaryWeapon', weaponsData, customWeapons) : null;
  const primaryThreat = primaryWpnObj ? (primaryHasKeen ? calculateKeenThreat(primaryWpnObj.threat) : primaryWpnObj.threat) : 20;
  const primaryTacticalMods = primaryWpnObj ? calculateTacticalCombatModifiers(tcState, primaryWpnObj, false, false) : null;
  const primaryFeatBonuses = primaryWpnObj ? calculateFeatCombatBonuses(character, primaryWpnObj) : { attackBonus: 0, damageBonus: 0 };
  const primaryEnhancement = eq.primaryWeaponEnhancement || 0;
  const primaryTotalAtk = primaryWpnObj ? (bab + effectiveStrMod + primaryEnhancement + primaryFeatBonuses.attackBonus + (primaryTacticalMods?.attackMod || 0)) : 0;
  const primaryDmgVal = primaryWpnObj ? (effectiveStrMod + primaryEnhancement + primaryFeatBonuses.damageBonus + (primaryTacticalMods?.damageMod || 0)) : 0;
  const primaryDmgStr = primaryDmgVal >= 0 ? `+${primaryDmgVal}` : `${primaryDmgVal}`;
  const primaryBaseDmgFormula = primaryWpnObj ? `${primaryWpnObj.damageM}${primaryDmgVal !== 0 ? primaryDmgStr : ''}` : '';
  const primaryDamageDisplay = `${primaryBaseDmgFormula}${primarySpecialDmg.damageDiceString}`;
  const primaryRollDamageFormula = `${primaryBaseDmgFormula}${primarySpecialDmg.damageDiceFormula}`;
  const primaryRollOptions = primaryWpnObj ? getWeaponRollOptions(primaryWpnObj, primaryBaseDmgFormula, primaryDmgVal, primaryTotalAtk, primaryQualities) : [];
  const primaryBaneAtk = primarySpecialDmg.hasBane && primaryWpnObj ? getBaneAttackOption(primaryTotalAtk, primaryWpnObj.name) : null;
  const primaryCritInfo = primaryWpnObj ? calculateCritDamagePools(primaryWpnObj, primaryDmgVal, primaryQualities) : null;
  const primaryFullAttackSeq = primaryWpnObj ? generateFullAttackSequence(
    bab,
    effectiveStrMod + primaryEnhancement + primaryFeatBonuses.attackBonus + (primaryTacticalMods?.attackMod || 0),
    tcState.haste,
    tcState.flurryOfBlows,
    tcState.whirlingFrenzy,
    primaryHasSpeed
  ) : [];

  // Resolve Secondary Weapon & Special Qualities
  const hasSecondary = eq.secondaryWeapon && eq.secondaryWeapon !== 'none';
  const secondaryQualities = eq.secondaryWeaponQualities || [];
  const secondarySpecialDmg = getWeaponSpecialDamage(secondaryQualities);
  const secondaryHasKeen = hasKeenQuality(secondaryQualities);
  const secondaryHasSpeed = hasSpeedQuality(secondaryQualities);
  const secondaryWpnObj = hasSecondary ? resolveEquippedWeapon(character, 'secondaryWeapon', weaponsData, customWeapons) : null;
  const secondaryThreat = secondaryWpnObj ? (secondaryHasKeen ? calculateKeenThreat(secondaryWpnObj.threat) : secondaryWpnObj.threat) : 20;
  const secondaryTacticalMods = secondaryWpnObj ? calculateTacticalCombatModifiers(tcState, secondaryWpnObj, true, false) : null;
  const secondaryFeatBonuses = secondaryWpnObj ? calculateFeatCombatBonuses(character, secondaryWpnObj) : { attackBonus: 0, damageBonus: 0 };
  const secondaryEnhancement = eq.secondaryWeaponEnhancement || 0;
  const secondaryTotalAtk = secondaryWpnObj ? (bab + effectiveStrMod + secondaryEnhancement + secondaryFeatBonuses.attackBonus + (secondaryTacticalMods?.attackMod || 0)) : 0;
  const secondaryDmgVal = secondaryWpnObj ? (Math.floor(effectiveStrMod / 2) + secondaryEnhancement + secondaryFeatBonuses.damageBonus + (secondaryTacticalMods?.damageMod || 0)) : 0;
  const secondaryBaseDmgFormula = secondaryWpnObj ? `${secondaryWpnObj.damageM}${secondaryDmgVal >= 0 ? `+${secondaryDmgVal}` : secondaryDmgVal}` : '';
  const secondaryDamageDisplay = `${secondaryBaseDmgFormula}${secondarySpecialDmg.damageDiceString}`;
  const secondaryRollDamageFormula = `${secondaryBaseDmgFormula}${secondarySpecialDmg.damageDiceFormula}`;
  const secondaryRollOptions = secondaryWpnObj ? getWeaponRollOptions(secondaryWpnObj, secondaryBaseDmgFormula, secondaryDmgVal, secondaryTotalAtk, secondaryQualities) : [];
  const secondaryBaneAtk = secondarySpecialDmg.hasBane && secondaryWpnObj ? getBaneAttackOption(secondaryTotalAtk, secondaryWpnObj.name) : null;
  const secondaryCritInfo = secondaryWpnObj ? calculateCritDamagePools(secondaryWpnObj, secondaryDmgVal, secondaryQualities) : null;

  // Resolve Ranged Weapon & Special Qualities
  const hasRanged = eq.rangedWeapon && eq.rangedWeapon !== 'none';
  const rangedQualities = eq.rangedWeaponQualities || [];
  const rangedSpecialDmg = getWeaponSpecialDamage(rangedQualities);
  const rangedHasKeen = hasKeenQuality(rangedQualities);
  const rangedHasSpeed = hasSpeedQuality(rangedQualities);
  const rangedWpnObj = hasRanged ? resolveEquippedWeapon(character, 'rangedWeapon', weaponsData, customWeapons) : null;
  const rangedThreat = rangedWpnObj ? (rangedHasKeen ? calculateKeenThreat(rangedWpnObj.threat) : rangedWpnObj.threat) : 20;
  const rangedTacticalMods = rangedWpnObj ? calculateTacticalCombatModifiers(tcState, rangedWpnObj, false, true) : null;
  const rangedFeatBonuses = rangedWpnObj ? calculateFeatCombatBonuses(character, rangedWpnObj) : { attackBonus: 0, damageBonus: 0 };
  const rangedEnhancement = eq.rangedWeaponEnhancement || 0;
  const rangedTotalAtk = rangedWpnObj ? (bab + dexMod + rangedEnhancement + rangedFeatBonuses.attackBonus + (rangedTacticalMods?.attackMod || 0)) : 0;
  const rangedDmgVal = rangedWpnObj ? (rangedEnhancement + rangedFeatBonuses.damageBonus + (rangedTacticalMods?.damageMod || 0)) : 0;
  const rangedDmgStr = rangedDmgVal > 0 ? `+${rangedDmgVal}` : (rangedDmgVal < 0 ? `${rangedDmgVal}` : '');
  const rangedBaseDmgFormula = rangedWpnObj ? `${rangedWpnObj.damageM}${rangedDmgStr}` : '';
  const rangedDamageDisplay = `${rangedBaseDmgFormula}${rangedSpecialDmg.damageDiceString}`;
  const rangedRollDamageFormula = `${rangedBaseDmgFormula}${rangedSpecialDmg.damageDiceFormula}`;
  const rangedRollOptions = rangedWpnObj ? getWeaponRollOptions(rangedWpnObj, rangedBaseDmgFormula, rangedDmgVal, rangedTotalAtk, rangedQualities) : [];
  const rangedBaneAtk = rangedSpecialDmg.hasBane && rangedWpnObj ? getBaneAttackOption(rangedTotalAtk, rangedWpnObj.name) : null;
  const rangedCritInfo = rangedWpnObj ? calculateCritDamagePools(rangedWpnObj, rangedDmgVal, rangedQualities) : null;

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
      if (newEq.primaryWeaponItemId === id) {
        newEq.primaryWeapon = 'none';
        newEq.primaryWeaponItemId = undefined;
        newEq.primaryWeaponEnhancement = 0;
        newEq.primaryWeaponQualities = [];
      }
      if (newEq.secondaryWeaponItemId === id) {
        newEq.secondaryWeapon = 'none';
        newEq.secondaryWeaponItemId = undefined;
        newEq.secondaryWeaponEnhancement = 0;
        newEq.secondaryWeaponQualities = [];
      }
      if (newEq.rangedWeaponItemId === id) {
        newEq.rangedWeapon = 'none';
        newEq.rangedWeaponItemId = undefined;
        newEq.rangedWeaponEnhancement = 0;
        newEq.rangedWeaponQualities = [];
      }
      if (newEq.armorItemId === id) {
        newEq.armor = 'none';
        newEq.armorItemId = undefined;
        newEq.armorEnhancement = 0;
        newEq.armorQualities = [];
      }
      if (newEq.shieldItemId === id) {
        newEq.shield = 'none';
        newEq.shieldItemId = undefined;
        newEq.shieldEnhancement = 0;
        newEq.shieldQualities = [];
      }

      const cleanName = itemToRemove.name.trim();
      const stillInInventory = newInventory.some(i => matchesItemName(i.name, cleanName));

      if (!stillInInventory) {
        if (!newEq.primaryWeaponItemId && eq.primaryWeapon && (matchesItemName(resolveWeapon(eq.primaryWeapon, customWeapons, weaponsData).name, cleanName) || matchesItemName(eq.primaryWeapon, cleanName))) {
          newEq.primaryWeapon = 'none';
        }
        if (!newEq.secondaryWeaponItemId && eq.secondaryWeapon && (matchesItemName(resolveWeapon(eq.secondaryWeapon, customWeapons, weaponsData).name, cleanName) || matchesItemName(eq.secondaryWeapon, cleanName))) {
          newEq.secondaryWeapon = 'none';
        }
        if (!newEq.rangedWeaponItemId && eq.rangedWeapon && (matchesItemName(resolveWeapon(eq.rangedWeapon, customWeapons, weaponsData).name, cleanName) || matchesItemName(eq.rangedWeapon, cleanName))) {
          newEq.rangedWeapon = 'none';
        }
        if (!newEq.armorItemId && eq.armor && (matchesItemName(resolveArmor(eq.armor, customArmors).name, cleanName) || matchesItemName(eq.armor, cleanName))) {
          newEq.armor = 'none';
        }
        if (!newEq.shieldItemId && eq.shield && (matchesItemName(resolveShield(eq.shield, customArmors).name, cleanName) || matchesItemName(eq.shield, cleanName))) {
          newEq.shield = 'none';
        }
        if (newEq.wondrousItems && newEq.wondrousItems.length > 0) {
          newEq.wondrousItems = newEq.wondrousItems.filter(w => w.inventoryItemId !== id && !matchesItemName(w.name, cleanName));
        }
      } else if (newEq.wondrousItems && newEq.wondrousItems.length > 0) {
        newEq.wondrousItems = newEq.wondrousItems.filter(w => w.inventoryItemId !== id);
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
    const invItem = createInventoryWeapon(newWpn.name, weaponsData, updatedCustoms);
    const updatedInv = [...inventory, invItem];
    onChange({
      customWeapons: updatedCustoms,
      equipment: { ...eq, primaryWeapon: newWpn.name, primaryWeaponItemId: invItem.id },
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
    const invItem = customArmorType === 'shield'
      ? createInventoryShield(newArmor.name, updatedArmors)
      : createInventoryArmor(newArmor.name, updatedArmors);
    const updatedInv = [...inventory, invItem];
    const slot = customArmorType === 'shield' ? 'shield' : 'armor';
    const idKey = customArmorType === 'shield' ? 'shieldItemId' : 'armorItemId';
    onChange({
      customArmors: updatedArmors,
      equipment: { ...eq, [slot]: newArmor.name, [idKey]: invItem.id },
      inventory: updatedInv
    });

    setCustomArmorName('');
    setShowCustomArmorModal(false);
  };

  // Add Wondrous Item
  const handleAddWondrousItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wondrousName.trim()) return;

    const invItemId = `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const invItem: InventoryItem = {
      id: invItemId,
      name: wondrousName.trim(),
      quantity: 1,
      weight: 0,
      notes: wondrousEffect.trim(),
      itemType: 'wondrous',
      location: 'Carried'
    };

    const newItem: WondrousItem = {
      id: `wondrous_${Date.now()}`,
      inventoryItemId: invItemId,
      name: wondrousName.trim(),
      slot: wondrousSlot,
      effect: wondrousEffect.trim(),
      weight: 0
    };

    const currentItems = eq.wondrousItems || [];
    onChange({
      equipment: { ...eq, wondrousItems: [...currentItems, newItem] },
      inventory: [...inventory, invItem]
    });

    setWondrousName('');
    setWondrousEffect('');
    setShowWondrousModal(false);
  };

  const handleRemoveWondrousItem = (id: string) => {
    const currentItems = eq.wondrousItems || [];
    const itemToRemove = currentItems.find(i => i.id === id);
    const nextWondrous = currentItems.filter(i => i.id !== id);

    // Also remove from inventory so it doesn't leave an orphan
    const nextInv = inventory.filter(inv => {
      if (itemToRemove?.inventoryItemId && inv.id === itemToRemove.inventoryItemId) return false;
      if (!itemToRemove?.inventoryItemId && itemToRemove && matchesItemName(inv.name, itemToRemove.name) && inv.itemType === 'wondrous') return false;
      return true;
    });

    onChange({
      equipment: { ...eq, wondrousItems: nextWondrous },
      inventory: nextInv
    });
  };

  const parseWeight = (val: any): number => {
    if (val === null || val === undefined) return 0;
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    return isNaN(num) ? 0 : num;
  };

  const getEquippedSlotLabel = (itemOrName: InventoryItem | string): string | null => {
    if (!itemOrName) return null;
    const isItemObj = typeof itemOrName === 'object';
    const itemId = isItemObj ? itemOrName.id : undefined;
    const clean = (isItemObj ? itemOrName.name : itemOrName).trim();
    if (!clean) return null;

    if (itemId) {
      if (eq.primaryWeaponItemId === itemId) return 'Equipped (Primary)';
      if (eq.secondaryWeaponItemId === itemId) return 'Equipped (Off-Hand)';
      if (eq.rangedWeaponItemId === itemId) return 'Equipped (Ranged)';
      if (eq.armorItemId === itemId) return 'Equipped (Armor)';
      if (eq.shieldItemId === itemId) return 'Equipped (Shield)';
    }

    if (eq.primaryWeapon && eq.primaryWeapon !== 'none') {
      const wpnObj = resolveWeapon(eq.primaryWeapon, customWeapons, weaponsData);
      if (matchesItemName(wpnObj.name, clean) || matchesItemName(eq.primaryWeapon, clean)) {
        return 'Equipped (Primary)';
      }
    }
    if (eq.secondaryWeapon && eq.secondaryWeapon !== 'none') {
      const secObj = resolveWeapon(eq.secondaryWeapon, customWeapons, weaponsData);
      if (matchesItemName(secObj.name, clean) || matchesItemName(eq.secondaryWeapon, clean)) {
        return 'Equipped (Off-Hand)';
      }
    }
    if (eq.rangedWeapon && eq.rangedWeapon !== 'none') {
      const rngObj = resolveWeapon(eq.rangedWeapon, customWeapons, weaponsData);
      if (matchesItemName(rngObj.name, clean) || matchesItemName(eq.rangedWeapon, clean)) {
        return 'Equipped (Ranged)';
      }
    }
    if (eq.armor && eq.armor !== 'none') {
      const armObj = resolveArmor(eq.armor, customArmors);
      if (matchesItemName(armObj.name, clean) || matchesItemName(eq.armor, clean)) {
        return 'Equipped (Armor)';
      }
    }
    if (eq.shield && eq.shield !== 'none') {
      const shdObj = resolveShield(eq.shield, customArmors);
      if (matchesItemName(shdObj.name, clean) || matchesItemName(eq.shield, clean)) {
        return 'Equipped (Shield)';
      }
    }
    if (eq.wondrousItems && eq.wondrousItems.length > 0) {
      const itemMatch = eq.wondrousItems.find(w => matchesItemName(w.name, clean));
      if (itemMatch) {
        return `Equipped (${itemMatch.slot})`;
      }
    }
    return null;
  };

  const getEquippableCategory = (itemOrName: InventoryItem | string): 'weapon' | 'armor' | 'shield' | null => {
    if (!itemOrName) return null;
    const isItemObj = typeof itemOrName === 'object';
    if (isItemObj) {
      if (itemOrName.itemType === 'shield') return 'shield';
      if (itemOrName.itemType === 'armor') return 'armor';
      if (itemOrName.itemType === 'weapon') return 'weapon';
      if (itemOrName.armorData) return itemOrName.armorData.type === 'shield' ? 'shield' : 'armor';
      if (itemOrName.weaponData) return 'weapon';
    }

    const itemName = isItemObj ? itemOrName.name : itemOrName;
    if (!itemName || !itemName.trim()) return null;
    const clean = itemName.toLowerCase().trim();
    if (customArmors.some(a => a.name.toLowerCase().trim() === clean && a.type === 'shield')) return 'shield';
    if (customArmors.some(a => a.name.toLowerCase().trim() === clean && a.type !== 'shield')) return 'armor';
    const armObj = resolveArmor(clean, customArmors);
    if (armObj && armObj.acBonus > 0 && armObj.name.toLowerCase() !== 'none') return 'armor';
    const shdObj = resolveShield(clean, customArmors);
    if (shdObj && shdObj.acBonus > 0 && shdObj.name.toLowerCase() !== 'none') return 'shield';

    // 1. Direct match in custom weapons or standard weapons database
    if (customWeapons.some(w => w.name.toLowerCase().trim() === clean)) return 'weapon';
    if (weaponsData.some(w => w.name.toLowerCase().trim() === clean)) return 'weapon';

    // 2. Direct match in themed weapon map (e.g. "Nodachi") or validated themed alias
    if (THEMED_WEAPON_BASE_MAP[clean] !== undefined) return 'weapon';
    if (getThemedWeaponBase(clean, weaponsData) !== null) return 'weapon';

    // 3. Check alias pattern "Custom Name (BaseWeapon)" where BaseWeapon is recognized
    const aliasMatch = clean.match(/^(.+?)\s*\((.+?)\)$/);
    if (aliasMatch) {
      const suffix = aliasMatch[2].trim().toLowerCase();
      if (STANDARD_BASE_WEAPONS[suffix] !== undefined || weaponsData.some(w => w.name.toLowerCase().trim() === suffix)) {
        return 'weapon';
      }
    }

    // 4. Check magic item name (e.g. "+1 Flaming Longsword" or "+2 Keen Nodachi")
    const parsedMagic = parseMagicItemName(clean);
    if (parsedMagic.enhancementBonus > 0 || parsedMagic.qualities.length > 0) {
      const baseClean = parsedMagic.baseName.toLowerCase().trim();
      if (customWeapons.some(w => w.name.toLowerCase().trim() === baseClean)) return 'weapon';
      if (weaponsData.some(w => w.name.toLowerCase().trim() === baseClean)) return 'weapon';
      if (THEMED_WEAPON_BASE_MAP[baseClean] !== undefined || getThemedWeaponBase(baseClean, weaponsData) !== null) return 'weapon';
    }

    return null;
  };

  const handleQuickUnequipFromInventory = (itemOrName: InventoryItem | string) => {
    if (!itemOrName) return;
    const isItemObj = typeof itemOrName === 'object';
    const itemId = isItemObj ? itemOrName.id : undefined;
    const clean = (isItemObj ? itemOrName.name : itemOrName).trim();

    if (itemId) {
      if (eq.primaryWeaponItemId === itemId) {
        handleEqChange('primaryWeapon', 'none');
        return;
      }
      if (eq.secondaryWeaponItemId === itemId) {
        handleEqChange('secondaryWeapon', 'none');
        return;
      }
      if (eq.rangedWeaponItemId === itemId) {
        handleEqChange('rangedWeapon', 'none');
        return;
      }
      if (eq.armorItemId === itemId) {
        handleEqChange('armor', 'none');
        return;
      }
      if (eq.shieldItemId === itemId) {
        handleEqChange('shield', 'none');
        return;
      }
    }

    if (eq.primaryWeapon && eq.primaryWeapon !== 'none') {
      const wpn = resolveWeapon(eq.primaryWeapon, customWeapons, weaponsData);
      if (matchesItemName(wpn.name, clean) || matchesItemName(eq.primaryWeapon, clean)) {
        handleEqChange('primaryWeapon', 'none');
        return;
      }
    }
    if (eq.secondaryWeapon && eq.secondaryWeapon !== 'none') {
      const wpn = resolveWeapon(eq.secondaryWeapon, customWeapons, weaponsData);
      if (matchesItemName(wpn.name, clean) || matchesItemName(eq.secondaryWeapon, clean)) {
        handleEqChange('secondaryWeapon', 'none');
        return;
      }
    }
    if (eq.rangedWeapon && eq.rangedWeapon !== 'none') {
      const wpn = resolveWeapon(eq.rangedWeapon, customWeapons, weaponsData);
      if (matchesItemName(wpn.name, clean) || matchesItemName(eq.rangedWeapon, clean)) {
        handleEqChange('rangedWeapon', 'none');
        return;
      }
    }
    if (eq.armor && eq.armor !== 'none') {
      const arm = resolveArmor(eq.armor, customArmors);
      if (matchesItemName(arm.name, clean) || matchesItemName(eq.armor, clean)) {
        handleEqChange('armor', 'none');
        return;
      }
    }
    if (eq.shield && eq.shield !== 'none') {
      const shd = resolveShield(eq.shield, customArmors);
      if (matchesItemName(shd.name, clean) || matchesItemName(eq.shield, clean)) {
        handleEqChange('shield', 'none');
        return;
      }
    }
    if (eq.wondrousItems && eq.wondrousItems.length > 0) {
      const beforeLen = eq.wondrousItems.length;
      const nextWondrous = eq.wondrousItems.filter(w => (itemId ? w.inventoryItemId !== itemId : true) && !matchesItemName(w.name, clean));
      if (nextWondrous.length !== beforeLen) {
        handleEqChange('wondrousItems', nextWondrous);
      }
    }
  };

  // Auto-sync any equipped items that are missing from inventory
  const syncedInventory = useMemo(() => {
    return syncEquippedItemsToInventory(character, weaponsData).inventory || [];
  }, [character, weaponsData]);

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
    rawItem?: InventoryItem;
  }> = [];

  // 1. Currency Coinage (if total coins > 0)
  const totalCoins = (funds.cp || 0) + (funds.sp || 0) + (funds.gp || 0) + (funds.pp || 0);
  if (totalCoins > 0) {
    activeCarriedItemsBreakdown.push({
      id: 'coinage_funds',
      name: `Coinage (${totalCoins.toLocaleString()} coins: ${funds.gp}gp, ${funds.sp}sp, ${funds.cp}cp, ${funds.pp}pp)`,
      icon: '🪙',
      location: 'Belt Pouch',
      quantity: 1,
      unitWeight: coinWeight,
      totalWeight: coinWeight,
      notes: 'Standard D&D 3.5e weight: 50 coins = 1 lb',
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
    const equippedLabel = getEquippedSlotLabel(item);

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
      equippedLabel,
      rawItem: item
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
          <button
            onClick={() => setShowQualitiesGuide(true)}
            className="btn btn-secondary text-xs flex items-center gap-1.5 text-amber-300 border-amber-500/30 hover:bg-amber-500/10"
            title="Open 3.5e Magic Item Special Qualities Guide"
          >
            <i className="fa-solid fa-book-sparkles text-amber-400"></i> Qualities Guide
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
              <SearchableSelect
                value={selectedArmorValue}
                options={armorOptions}
                onChange={val => handleEqChange('armor', val)}
                placeholder="Select equipped armor..."
              />
            </div>
            <div>
              <label className="label-text">Armor Enhancement</label>
              <SearchableSelect
                value={String(eq.armorEnhancement || 0)}
                options={armorEnhancementOptions}
                onChange={val => handleEqChange('armorEnhancement', parseInt(val) || 0)}
                showSublabelInTrigger={false}
                placeholder="Enh..."
              />
            </div>
          </div>

          {/* Armor Special Qualities */}
          {eq.armor && eq.armor !== 'none' && (
            <QualitySelector
              title="Armor Special Qualities"
              qualities={armorQualities}
              available={getAvailableArmorQualities()}
              onAdd={q => handleAddQuality('armorQualities', q)}
              onRemove={q => handleRemoveQuality('armorQualities', q)}
              enhancementBonus={eq.armorEnhancement || 0}
              itemType="armor"
              onOpenGuide={() => setShowQualitiesGuide(true)}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-text">Equipped Shield</label>
              <SearchableSelect
                value={selectedShieldValue}
                options={shieldOptions}
                onChange={val => handleEqChange('shield', val)}
                placeholder="Select equipped shield..."
              />
            </div>
            <div>
              <label className="label-text">Shield Enhancement</label>
              <SearchableSelect
                value={String(eq.shieldEnhancement || 0)}
                options={armorEnhancementOptions}
                onChange={val => handleEqChange('shieldEnhancement', parseInt(val) || 0)}
                showSublabelInTrigger={false}
                placeholder="Enh..."
              />
            </div>
          </div>

          {/* Shield Special Qualities */}
          {eq.shield && eq.shield !== 'none' && (
            <QualitySelector
              title="Shield Special Qualities"
              qualities={shieldQualities}
              available={getAvailableShieldQualities()}
              onAdd={q => handleAddQuality('shieldQualities', q)}
              onRemove={q => handleRemoveQuality('shieldQualities', q)}
              enhancementBonus={eq.shieldEnhancement || 0}
              itemType="shield"
              onOpenGuide={() => setShowQualitiesGuide(true)}
            />
          )}

          {/* Armor / Shield Defensive Benefits Badges */}
          {(combinedFortification.hasFortification || hideQualityBonus > 0 || moveSilentlyQualityBonus > 0) && (
            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono">
              {combinedFortification.hasFortification && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-bold">
                  <i className="fa-solid fa-shield-halved text-amber-400"></i>
                  Fortification: {combinedFortification.percent}% ({combinedFortification.label})
                </span>
              )}
              {hideQualityBonus > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 font-bold">
                  <i className="fa-solid fa-eye-slash text-purple-400"></i>
                  +{hideQualityBonus} Hide (Shadow)
                </span>
              )}
              {moveSilentlyQualityBonus > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1 font-bold">
                  <i className="fa-solid fa-shoe-prints text-teal-400"></i>
                  +{moveSilentlyQualityBonus} Move Silently
                </span>
              )}
            </div>
          )}

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
                  value={selectedPrimaryWeaponValue}
                  options={primaryWeaponOptions}
                  onChange={val => {
                    handleEqChange('primaryWeapon', val);
                  }}
                  placeholder="Select primary weapon..."
                />

                {/* Freeform input if custom or user wants to edit name */}
                {(selectedPrimaryWeaponValue === '__CUSTOM__' || (!primaryWeaponOptions.some(w => w.value === eq.primaryWeapon || w.label === eq.primaryWeapon || (eq.primaryWeaponItemId && w.value === eq.primaryWeaponItemId)) && eq.primaryWeapon && eq.primaryWeapon !== 'none')) && (
                  <CustomWeaponInput
                    value={eq.primaryWeapon === '__CUSTOM__' ? '' : (eq.primaryWeapon || '')}
                    onCommit={val => handleEqChange('primaryWeapon', val)}
                    placeholder="Type custom weapon name e.g. Nodachi (Greatsword)"
                    className="input-field text-xs font-semibold text-amber-300 border-amber-500/40"
                  />
                )}
              </div>
              <div>
                <SearchableSelect
                  value={String(eq.primaryWeaponEnhancement || 0)}
                  options={weaponEnhancementOptions}
                  onChange={val => handleEqChange('primaryWeaponEnhancement', parseInt(val) || 0)}
                  showSublabelInTrigger={false}
                  placeholder="Enh..."
                />
              </div>
            </div>

            {/* Primary Weapon Special Qualities */}
            {hasPrimary && (
              <QualitySelector
                title="Primary Weapon Special Qualities"
                qualities={primaryQualities}
                available={getAvailableWeaponQualities(false)}
                onAdd={q => handleAddQuality('primaryWeaponQualities', q)}
                onRemove={q => handleRemoveQuality('primaryWeaponQualities', q)}
                enhancementBonus={primaryEnhancement}
                itemType="weapon"
                onOpenGuide={() => setShowQualitiesGuide(true)}
              />
            )}

            {hasPrimary && primaryWpnObj && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-amber-400 text-sm block">{primaryWpnObj.name}</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {primaryFeatBonuses.attackBonus > 0 || primaryFeatBonuses.damageBonus > 0 ? (
                        <span className="text-[10px] text-emerald-400">
                          Includes Feat Bonus (+{primaryFeatBonuses.attackBonus} Atk / +{primaryFeatBonuses.damageBonus} Dmg)
                        </span>
                      ) : null}
                      {primarySpecialDmg.summaryLabels.length > 0 && (
                        <span className="text-[10px] text-orange-300 font-semibold">
                          • Magic: {primarySpecialDmg.summaryLabels.join(', ')}
                        </span>
                      )}
                      {primaryHasSpeed && (
                        <span className="text-[10px] text-cyan-300 font-semibold">
                          • Speed (+1 Attack)
                        </span>
                      )}
                      {primaryHasKeen && (
                        <span className="text-[10px] text-amber-300 font-semibold">
                          • Keen
                        </span>
                      )}
                      {activeCombatMods.length > 0 && (
                        <span className="text-[10px] text-amber-300 font-mono">
                          • Tactical ({activeCombatMods.map(m => m.name).join(', ')})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <button
                      onClick={() => rollAttack(primaryTotalAtk, `${primaryWpnObj.name} Attack`, primaryWpnObj, { threatMin: primaryThreat })}
                      className="font-mono text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 font-bold text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title={`Click to roll ${primaryWpnObj.name} Attack`}
                    >
                      <i className="fa-solid fa-dice-d20 text-xs"></i>
                      <span>{primaryTotalAtk >= 0 ? '+' : ''}{primaryTotalAtk} Melee</span>
                    </button>
                    {primaryBaneAtk && (
                      <button
                        onClick={() => rollAttack(primaryBaneAtk.atkBonus, primaryBaneAtk.label, primaryWpnObj, { threatMin: primaryThreat })}
                        className="font-mono text-red-400 hover:text-red-300 hover:bg-red-500/20 px-2 py-1 rounded-lg border border-red-500/30 font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow-xs"
                        title={`Click to roll ${primaryBaneAtk.label}`}
                      >
                        <i className="fa-solid fa-bullseye text-xs text-red-400"></i>
                        <span>{primaryBaneAtk.atkBonus >= 0 ? '+' : ''}{primaryBaneAtk.atkBonus} Melee (vs Foe)</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2 py-1.5 px-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-1.5 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Damage:</span>
                      <span className="font-bold text-amber-300">{primaryDamageDisplay}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-300">
                      <div
                        onClick={() => {
                          if (primaryCritInfo) {
                            rollDamage(primaryCritInfo.rollFormula, primaryCritInfo.label, {
                              rollType: 'damage',
                              weapon: primaryWpnObj,
                              critMultiplier: primaryWpnObj.critMultiplier || 2,
                              damagePools: primaryCritInfo.damagePools
                            });
                          }
                        }}
                        className="cursor-pointer hover:text-amber-300 transition flex items-center gap-1 group"
                        title="Click to roll Critical Damage (multiplied base + burst pools)"
                      >
                        <span className="text-[10px] text-slate-400 uppercase">Crit:</span>
                        <span className={primaryHasKeen ? 'text-amber-300 font-bold group-hover:underline' : 'group-hover:underline'}>
                          {primaryThreat < 20 ? `${primaryThreat}-20` : '20'}/x{primaryWpnObj.critMultiplier || 2}
                          {primaryHasKeen ? ' (Keen)' : ''}
                        </span>
                        <i className="fa-solid fa-burst text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition"></i>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase mr-1">Type:</span>
                        <span>{primaryWpnObj.type || 'Slashing'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Multi-Button Damage Roll Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {primaryRollOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => rollDamage(opt.rollFormula, `${primaryWpnObj.name} ${opt.label}`, {
                          weapon: primaryWpnObj,
                          damagePools: opt.damagePools,
                          isNonlethal: opt.isNonlethal
                        })}
                        className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                          opt.type === 'merciful'
                            ? 'bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border-teal-500/40'
                            : opt.type === 'base'
                            ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                            : opt.type === 'bane'
                            ? 'bg-red-500/15 hover:bg-red-500/25 text-red-300 border-red-500/40'
                            : opt.type === 'vicious'
                            ? 'bg-rose-900/25 hover:bg-rose-900/35 text-rose-300 border-rose-500/40'
                            : opt.type === 'alignment'
                            ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-500/40'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                        title={opt.buttonTitle || `Roll ${opt.label}`}
                      >
                        {opt.icon && <i className={`${opt.icon} text-[11px]`}></i>}
                        <span>{opt.label}</span>
                      </button>
                    ))}
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
                  value={selectedSecondaryWeaponValue}
                  options={secondaryWeaponOptions}
                  onChange={val => {
                    handleEqChange('secondaryWeapon', val);
                  }}
                  placeholder="Select secondary weapon..."
                />

                {(selectedSecondaryWeaponValue === '__CUSTOM__' || (!secondaryWeaponOptions.some(w => w.value === eq.secondaryWeapon || w.label === eq.secondaryWeapon || (eq.secondaryWeaponItemId && w.value === eq.secondaryWeaponItemId)) && eq.secondaryWeapon && eq.secondaryWeapon !== 'none')) && (
                  <CustomWeaponInput
                    value={eq.secondaryWeapon === '__CUSTOM__' ? '' : (eq.secondaryWeapon || '')}
                    onCommit={val => handleEqChange('secondaryWeapon', val)}
                    placeholder="Type custom secondary weapon name"
                    className="input-field text-xs font-semibold text-amber-300 border-amber-500/40"
                  />
                )}
              </div>
              <div>
                <SearchableSelect
                  value={String(eq.secondaryWeaponEnhancement || 0)}
                  options={weaponEnhancementOptions}
                  onChange={val => handleEqChange('secondaryWeaponEnhancement', parseInt(val) || 0)}
                  showSublabelInTrigger={false}
                  placeholder="Enh..."
                />
              </div>
            </div>

            {/* Secondary Weapon Special Qualities */}
            {hasSecondary && (
              <QualitySelector
                title="Secondary Weapon Special Qualities"
                qualities={secondaryQualities}
                available={getAvailableWeaponQualities(false)}
                onAdd={q => handleAddQuality('secondaryWeaponQualities', q)}
                onRemove={q => handleRemoveQuality('secondaryWeaponQualities', q)}
                enhancementBonus={secondaryEnhancement}
                itemType="weapon"
                onOpenGuide={() => setShowQualitiesGuide(true)}
              />
            )}

            {secondaryWpnObj && (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-300">{secondaryWpnObj.name}</span>
                    {secondarySpecialDmg.summaryLabels.length > 0 && (
                      <span className="text-[10px] text-orange-300 font-semibold">
                        ({secondarySpecialDmg.summaryLabels.join(', ')})
                      </span>
                    )}
                    {secondaryHasKeen && (
                      <span className="text-[10px] text-amber-300 font-semibold">
                        (Keen {secondaryThreat}-20)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => rollAttack(secondaryTotalAtk, `${secondaryWpnObj.name} Off-Hand Attack`, secondaryWpnObj, { threatMin: secondaryThreat })}
                      className="font-mono text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 font-bold transition flex items-center gap-1 cursor-pointer"
                      title={`Click to roll ${secondaryWpnObj.name} Off-Hand Attack`}
                    >
                      <i className="fa-solid fa-dice-d20 text-[10px]"></i>
                      <span>{secondaryTotalAtk >= 0 ? '+' : ''}{secondaryTotalAtk} Atk</span>
                    </button>
                    {secondaryBaneAtk && (
                      <button
                        onClick={() => rollAttack(secondaryBaneAtk.atkBonus, secondaryBaneAtk.label, secondaryWpnObj, { threatMin: secondaryThreat })}
                        className="font-mono text-red-400 hover:text-red-300 hover:bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                        title={`Click to roll ${secondaryBaneAtk.label}`}
                      >
                        <i className="fa-solid fa-bullseye text-[10px] text-red-400"></i>
                        <span>{secondaryBaneAtk.atkBonus >= 0 ? '+' : ''}{secondaryBaneAtk.atkBonus} Atk (vs Foe)</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-800/80">
                  {secondaryRollOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => rollDamage(opt.rollFormula, `${secondaryWpnObj.name} ${opt.label}`, {
                        weapon: secondaryWpnObj,
                        damagePools: opt.damagePools,
                        isNonlethal: opt.isNonlethal
                      })}
                      className={`px-2 py-0.5 rounded text-xs font-mono font-bold border transition flex items-center gap-1 cursor-pointer shadow-xs ${
                        opt.type === 'merciful'
                          ? 'bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border-teal-500/40'
                          : opt.type === 'base'
                          ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                          : opt.type === 'bane'
                          ? 'bg-red-500/15 hover:bg-red-500/25 text-red-300 border-red-500/40'
                          : opt.type === 'vicious'
                          ? 'bg-rose-900/25 hover:bg-rose-900/35 text-rose-300 border-rose-500/40'
                          : opt.type === 'alignment'
                          ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-500/40'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                      title={opt.buttonTitle || `Roll ${opt.label}`}
                    >
                      {opt.icon && <i className={`${opt.icon} text-[10px]`}></i>}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                  {secondaryCritInfo && (
                    <button
                      onClick={() => {
                        rollDamage(secondaryCritInfo.rollFormula, secondaryCritInfo.label, {
                          rollType: 'damage',
                          weapon: secondaryWpnObj,
                          critMultiplier: secondaryWpnObj.critMultiplier || 2,
                          damagePools: secondaryCritInfo.damagePools
                        });
                      }}
                      className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 hover:text-amber-300 hover:bg-slate-800 border border-slate-800 transition flex items-center gap-1 cursor-pointer"
                      title="Roll Critical Damage"
                    >
                      <i className="fa-solid fa-burst text-[10px] text-amber-400"></i>
                      <span>Crit ({secondaryThreat < 20 ? `${secondaryThreat}-20` : '20'}/x{secondaryWpnObj.critMultiplier || 2})</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Ranged Weapon */}
          <div className="border-t border-slate-800 pt-3 space-y-2">
            <label className="label-text">Ranged Weapon</label>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1.5">
                <SearchableSelect
                  value={selectedRangedWeaponValue}
                  options={rangedWeaponOptions}
                  onChange={val => {
                    handleEqChange('rangedWeapon', val);
                  }}
                  placeholder="Select ranged weapon..."
                />

                {(selectedRangedWeaponValue === '__CUSTOM__' || (!rangedWeaponOptions.some(w => w.value === eq.rangedWeapon || w.label === eq.rangedWeapon || (eq.rangedWeaponItemId && w.value === eq.rangedWeaponItemId)) && eq.rangedWeapon && eq.rangedWeapon !== 'none')) && (
                  <CustomWeaponInput
                    value={eq.rangedWeapon === '__CUSTOM__' ? '' : (eq.rangedWeapon || '')}
                    onCommit={val => handleEqChange('rangedWeapon', val)}
                    placeholder="Type custom ranged weapon name"
                    className="input-field text-xs font-semibold text-amber-300 border-amber-500/40"
                  />
                )}
              </div>
              <div>
                <SearchableSelect
                  value={String(eq.rangedWeaponEnhancement || 0)}
                  options={weaponEnhancementOptions}
                  onChange={val => handleEqChange('rangedWeaponEnhancement', parseInt(val) || 0)}
                  showSublabelInTrigger={false}
                  placeholder="Enh..."
                />
              </div>
            </div>

            {/* Ranged Weapon Special Qualities */}
            {hasRanged && (
              <QualitySelector
                title="Ranged Weapon Special Qualities"
                qualities={rangedQualities}
                available={getAvailableWeaponQualities(true)}
                onAdd={q => handleAddQuality('rangedWeaponQualities', q)}
                onRemove={q => handleRemoveQuality('rangedWeaponQualities', q)}
                enhancementBonus={rangedEnhancement}
                itemType="weapon"
                onOpenGuide={() => setShowQualitiesGuide(true)}
              />
            )}

            {rangedWpnObj && (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-300">{rangedWpnObj.name}</span>
                    {rangedSpecialDmg.summaryLabels.length > 0 && (
                      <span className="text-[10px] text-orange-300 font-semibold">
                        ({rangedSpecialDmg.summaryLabels.join(', ')})
                      </span>
                    )}
                    {rangedHasKeen && (
                      <span className="text-[10px] text-amber-300 font-semibold">
                        (Keen {rangedThreat}-20)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => rollAttack(rangedTotalAtk, `${rangedWpnObj.name} Ranged Attack`, rangedWpnObj, { threatMin: rangedThreat })}
                      className="font-mono text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30 font-bold transition flex items-center gap-1 cursor-pointer"
                      title={`Click to roll ${rangedWpnObj.name} Ranged Attack`}
                    >
                      <i className="fa-solid fa-dice-d20 text-[10px]"></i>
                      <span>{rangedTotalAtk >= 0 ? '+' : ''}{rangedTotalAtk} Ranged</span>
                    </button>
                    {rangedBaneAtk && (
                      <button
                        onClick={() => rollAttack(rangedBaneAtk.atkBonus, rangedBaneAtk.label, rangedWpnObj, { threatMin: rangedThreat })}
                        className="font-mono text-red-400 hover:text-red-300 hover:bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                        title={`Click to roll ${rangedBaneAtk.label}`}
                      >
                        <i className="fa-solid fa-bullseye text-[10px] text-red-400"></i>
                        <span>{rangedBaneAtk.atkBonus >= 0 ? '+' : ''}{rangedBaneAtk.atkBonus} Ranged (vs Foe)</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-800/80">
                  {rangedRollOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => rollDamage(opt.rollFormula, `${rangedWpnObj.name} ${opt.label}`, {
                        weapon: rangedWpnObj,
                        damagePools: opt.damagePools,
                        isNonlethal: opt.isNonlethal
                      })}
                      className={`px-2 py-0.5 rounded text-xs font-mono font-bold border transition flex items-center gap-1 cursor-pointer shadow-xs ${
                        opt.type === 'merciful'
                          ? 'bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border-teal-500/40'
                          : opt.type === 'base'
                          ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                          : opt.type === 'bane'
                          ? 'bg-red-500/15 hover:bg-red-500/25 text-red-300 border-red-500/40'
                          : opt.type === 'vicious'
                          ? 'bg-rose-900/25 hover:bg-rose-900/35 text-rose-300 border-rose-500/40'
                          : opt.type === 'alignment'
                          ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-500/40'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                      title={opt.buttonTitle || `Roll ${opt.label}`}
                    >
                      {opt.icon && <i className={`${opt.icon} text-[10px]`}></i>}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                  {rangedCritInfo && (
                    <button
                      onClick={() => {
                        rollDamage(rangedCritInfo.rollFormula, rangedCritInfo.label, {
                          rollType: 'damage',
                          weapon: rangedWpnObj,
                          critMultiplier: rangedWpnObj.critMultiplier || 2,
                          damagePools: rangedCritInfo.damagePools
                        });
                      }}
                      className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 hover:text-amber-300 hover:bg-slate-800 border border-slate-800 transition flex items-center gap-1 cursor-pointer"
                      title="Roll Critical Damage"
                    >
                      <i className="fa-solid fa-burst text-[10px] text-amber-400"></i>
                      <span>Crit ({rangedThreat < 20 ? `${rangedThreat}-20` : '20'}/x{rangedWpnObj.critMultiplier || 2})</span>
                    </button>
                  )}
                </div>
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
                          <div className="flex items-center justify-end gap-1">
                            {isEquippedGear ? (
                              <button
                                onClick={() => handleQuickUnequipFromInventory(item.rawItem || item.name)}
                                className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 px-2 py-0.5 rounded text-[10px] font-sans font-semibold border border-slate-700 hover:border-rose-500/40 transition inline-flex items-center gap-1 cursor-pointer shadow-xs"
                                title={`Unequip ${item.name} (keeps item in inventory)`}
                              >
                                <i className="fa-solid fa-xmark"></i> Unequip
                              </button>
                            ) : (
                              <>
                                {getEquippableCategory(item.rawItem || item.name) === 'weapon' && (
                                  equipSlotPickerItemId === item.id ? (
                                    <div className="inline-flex items-center gap-1 bg-slate-900 border border-amber-500/50 rounded-md p-1 shadow-lg z-20">
                                      <span className="text-[9px] uppercase font-bold text-amber-400 px-0.5">Slot:</span>
                                      <button
                                        onClick={() => {
                                          const target = item.rawItem || inventory.find(i => i.id === item.id);
                                          if (target) handleEquipInventoryItem(target, 'primaryWeapon');
                                          setEquipSlotPickerItemId(null);
                                        }}
                                        className="text-slate-200 hover:text-amber-300 bg-slate-800 hover:bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px] font-sans font-bold border border-slate-700 transition cursor-pointer"
                                        title={eq.primaryWeapon && eq.primaryWeapon !== 'none' ? `Equip Primary (replaces ${eq.primaryWeapon}, keeping it in inventory)` : 'Equip as Primary Weapon'}
                                      >
                                        Primary
                                      </button>
                                      <button
                                        onClick={() => {
                                          const target = item.rawItem || inventory.find(i => i.id === item.id);
                                          if (target) handleEquipInventoryItem(target, 'secondaryWeapon');
                                          setEquipSlotPickerItemId(null);
                                        }}
                                        className="text-slate-200 hover:text-amber-300 bg-slate-800 hover:bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px] font-sans font-bold border border-slate-700 transition cursor-pointer"
                                        title={eq.secondaryWeapon && eq.secondaryWeapon !== 'none' ? `Equip Off-Hand (replaces ${eq.secondaryWeapon}, keeping it in inventory)` : 'Equip as Off-Hand Weapon'}
                                      >
                                        Off-Hand
                                      </button>
                                      <button
                                        onClick={() => {
                                          const target = item.rawItem || inventory.find(i => i.id === item.id);
                                          if (target) handleEquipInventoryItem(target, 'rangedWeapon');
                                          setEquipSlotPickerItemId(null);
                                        }}
                                        className="text-slate-200 hover:text-amber-300 bg-slate-800 hover:bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px] font-sans font-bold border border-slate-700 transition cursor-pointer"
                                        title={eq.rangedWeapon && eq.rangedWeapon !== 'none' ? `Equip Ranged (replaces ${eq.rangedWeapon}, keeping it in inventory)` : 'Equip as Ranged Weapon'}
                                      >
                                        Ranged
                                      </button>
                                      <button
                                        onClick={() => setEquipSlotPickerItemId(null)}
                                        className="text-slate-400 hover:text-slate-200 px-1 text-xs cursor-pointer"
                                        title="Cancel"
                                      >
                                        <i className="fa-solid fa-xmark"></i>
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setEquipSlotPickerItemId(item.id)}
                                      className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 px-2 py-0.5 rounded text-[10px] font-sans font-bold border border-amber-500/30 transition inline-flex items-center gap-1 cursor-pointer shadow-xs"
                                      title={`Choose slot to equip ${item.name}`}
                                    >
                                      <i className="fa-solid fa-hand-holding"></i> Equip <i className="fa-solid fa-chevron-down text-[8px] opacity-70"></i>
                                    </button>
                                  )
                                )}
                                {getEquippableCategory(item.rawItem || item.name) === 'armor' && (
                                  <button
                                    onClick={() => {
                                      const target = item.rawItem || inventory.find(i => i.id === item.id);
                                      if (target) handleEquipInventoryItem(target, 'armor');
                                    }}
                                    className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 px-2 py-0.5 rounded text-[10px] font-sans font-bold border border-amber-500/30 transition inline-flex items-center gap-1 cursor-pointer shadow-xs"
                                    title={eq.armor && eq.armor !== 'none' ? `Equip Armor (replaces ${eq.armor}, keeping it in inventory)` : `Equip ${item.name} as Armor`}
                                  >
                                    <i className="fa-solid fa-shield-halved"></i> Equip
                                  </button>
                                )}
                                {getEquippableCategory(item.rawItem || item.name) === 'shield' && (
                                  <button
                                    onClick={() => {
                                      const target = item.rawItem || inventory.find(i => i.id === item.id);
                                      if (target) handleEquipInventoryItem(target, 'shield');
                                    }}
                                    className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 px-2 py-0.5 rounded text-[10px] font-sans font-bold border border-amber-500/30 transition inline-flex items-center gap-1 cursor-pointer shadow-xs"
                                    title={eq.shield && eq.shield !== 'none' ? `Equip Shield (replaces ${eq.shield}, keeping it in inventory)` : `Equip ${item.name} as Shield`}
                                  >
                                    <i className="fa-solid fa-shield"></i> Equip
                                  </button>
                                )}
                              </>
                            )}
                            <button
                              onClick={() => handleRemoveInventoryItem(item.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 text-xs cursor-pointer"
                              title="Delete Item"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </div>
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

      {/* 3.5e Magic Item Special Qualities Guide Modal */}
      {showQualitiesGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <i className="fa-solid fa-wand-magic-sparkles text-sm"></i>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 font-heading">
                    3.5e Magic Item Special Qualities Guide
                  </h3>
                  <p className="text-xs text-slate-400">
                    Reference compendium for weapon, armor, and shield enchantments (DMG Chapter 7).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQualitiesGuide(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                title="Close Guide"
              >
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setQualitiesGuideFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    qualitiesGuideFilter === 'all'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Qualities ({WEAPON_SPECIAL_QUALITIES.length + ARMOR_SHIELD_SPECIAL_QUALITIES.length})
                </button>
                <button
                  type="button"
                  onClick={() => setQualitiesGuideFilter('weapon')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    qualitiesGuideFilter === 'weapon'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Weapons ({WEAPON_SPECIAL_QUALITIES.length})
                </button>
                <button
                  type="button"
                  onClick={() => setQualitiesGuideFilter('armor')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    qualitiesGuideFilter === 'armor'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Armor & Shields ({ARMOR_SHIELD_SPECIAL_QUALITIES.length})
                </button>
              </div>

              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                <input
                  type="text"
                  value={qualitiesGuideSearch}
                  onChange={e => setQualitiesGuideSearch(e.target.value)}
                  placeholder="Search name, effect, cost, damage..."
                  className="input-field text-xs pl-8 pr-7 py-1.5 w-full bg-slate-950/90 text-amber-300 placeholder-slate-500 font-medium"
                />
                {qualitiesGuideSearch && (
                  <button
                    type="button"
                    onClick={() => setQualitiesGuideSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>

            {/* Qualities Grid Body */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1 scrollbar-thin">
              {filteredGuideQualities.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <i className="fa-solid fa-ban text-2xl mb-2 text-slate-600 block"></i>
                  <p className="text-sm font-medium">No matching special qualities found.</p>
                  <p className="text-xs text-slate-500 mt-1">Try broadening your search term or filter category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredGuideQualities.map(q => {
                    const costBadge = q.costType === 'bonus' ? `+${q.costValue} Bonus Equiv` : `+${q.costValue.toLocaleString()} gp`;
                    let targetLabel = 'Weapon';
                    let targetIcon = 'fa-wand-magic-sparkles';
                    if (q.target === 'melee') { targetLabel = 'Melee Only'; targetIcon = 'fa-burst'; }
                    else if (q.target === 'ranged') { targetLabel = 'Ranged Only'; targetIcon = 'fa-crosshairs'; }
                    else if (q.target === 'armor') { targetLabel = 'Armor Only'; targetIcon = 'fa-shield'; }
                    else if (q.target === 'shield') { targetLabel = 'Shield Only'; targetIcon = 'fa-shield-halved'; }
                    else if (q.target === 'armor_or_shield') { targetLabel = 'Armor or Shield'; targetIcon = 'fa-shield-halved'; }

                    return (
                      <div
                        key={q.id}
                        className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-2.5 group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-slate-100 group-hover:text-amber-300 transition text-sm flex items-center gap-1.5">
                                <span>{q.name}</span>
                              </h4>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
                                  {costBadge}
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center gap-1">
                                  <i className={`fa-solid ${targetIcon} text-[9px] text-slate-400`}></i>
                                  {targetLabel}
                                </span>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed mt-2.5">
                            {q.description}
                          </p>
                        </div>

                        {/* Special tags / mechanics badges */}
                        <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-slate-900 text-[10px] font-mono">
                          {q.damageBonus && (
                            <span className="px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/30">
                              +{q.damageBonus.dice} {q.damageBonus.type}
                            </span>
                          )}
                          {q.threatMultiplier && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              Double Threat Range (Keen)
                            </span>
                          )}
                          {q.extraAttacks && (
                            <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                              +{q.extraAttacks} Full-Attack Attack
                            </span>
                          )}
                          {q.fortificationPercent && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                              {q.fortificationPercent}% Negate Sneak/Crit
                            </span>
                          )}
                          {q.skillBonus && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              +{q.skillBonus.bonus} {q.skillBonus.skill}
                            </span>
                          )}
                          {q.drGrant && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                              DR {q.drGrant.value}/{q.drGrant.bypass}
                            </span>
                          )}
                          {q.srGrant && (
                            <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                              SR {q.srGrant}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-2 text-slate-400">
                <i className="fa-solid fa-circle-info text-amber-400 text-xs"></i>
                <span>
                  <strong>3.5e Crafting Rule:</strong> Items must have at least a +1 enhancement bonus before special qualities can be added. Pre-epic maximum effective bonus is +10.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowQualitiesGuide(false)}
                className="btn btn-secondary text-xs px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
