import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  CharacterState,
  WeaponData,
  RaceData,
  ClassData,
  Equipment,
  CustomArmorData,
  WondrousItem,
  InventoryItem,
  Funds,
  EquipmentMaterial,
  ItemArmorData,
  BodySlotId,
  BodySlotDefinition,
  AmmoCategory
} from '../types/character';
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
  resolveEquippedArmor, resolveEquippedShield, resolveEquippedWeapon,
  applyMaterialToArmorData, applyMaterialToWeight,
  getWeaponEffectiveAttackEnhancement, getWeaponMaterialDamageMod, getWeaponMaterialTraits,
  CANONICAL_BODY_SLOTS, BODY_SLOT_MAP, validateBodySlots, SlotItem, SlotValidationReport, BodySlotReport,
  STANDARD_AMMO_PRESETS, createInventoryAmmo, getCharacterAmmunition, decrementEquippedAmmunition,
  getMatchingAmmoTypeForWeapon, AmmoPreset,
  STANDARD_WONDROUS_ITEMS, getPredefinedWondrousItems, createWondrousItemFromPredefined, PredefinedWondrousItem,
  COMMON_ITEM_PRESETS
} from '../engine/equipment';
import {
  getTacticalCombatState,
  calculateTacticalCombatModifiers,
  generateFullAttackSequence,
  getActiveCombatModifiers,
  isTwoHandedWeapon,
  calculateEquippedWeaponCombatProfile,
  EquippedWeaponCombatContext
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
  ARMOR_SHIELD_SPECIAL_QUALITIES,
  BANE_CREATURE_TYPES
} from '../engine/magicItems';
import { useGameData } from '../context/GameDataContext';
import { useCharacter, useCharacterDispatch } from '../context/CharacterContext';

interface EquipmentTabProps {
  character?: CharacterState;
  weaponsData?: WeaponData[];
  racesData?: RaceData[];
  classesData?: ClassData[];
  onChange?: (updated: Partial<CharacterState>) => void;
}



const ARMOR_MATERIAL_OPTIONS: SearchableOption[] = [
  { value: 'standard', label: 'Standard', sublabel: 'Standard material', isAllowed: true },
  { value: 'mithral', label: 'Mithral', sublabel: 'Weight halved, Max Dex +2, ACP -3, ASF -10%', isAllowed: true },
  { value: 'adamantine', label: 'Adamantine', sublabel: 'Grants Damage Reduction (DR 1/-, 2/-, or 3/-)', isAllowed: true },
  { value: 'dragonhide', label: 'Dragonhide', sublabel: 'Non-metal, usable by Druids', isAllowed: true }
];

const SHIELD_MATERIAL_OPTIONS: SearchableOption[] = [
  { value: 'standard', label: 'Standard', sublabel: 'Standard material', isAllowed: true },
  { value: 'darkwood', label: 'Darkwood', sublabel: 'Weight halved, ACP -2', isAllowed: true },
  { value: 'mithral', label: 'Mithral', sublabel: 'Weight halved, ACP -3, ASF -10%', isAllowed: true },
  { value: 'adamantine', label: 'Adamantine', sublabel: 'Hardness 20, +1/3 hp', isAllowed: true },
  { value: 'dragonhide', label: 'Dragonhide', sublabel: 'Non-metal, usable by Druids', isAllowed: true }
];

const WEAPON_MATERIAL_OPTIONS: SearchableOption[] = [
  { value: 'standard', label: 'Standard', sublabel: 'Standard material', isAllowed: true },
  { value: 'adamantine', label: 'Adamantine', sublabel: 'Bypasses Adamantine DR & Hardness < 20', isAllowed: true },
  { value: 'mithral', label: 'Mithral', sublabel: 'Weight halved, bypasses Silver DR', isAllowed: true },
  { value: 'cold_iron', label: 'Cold Iron', sublabel: 'Bypasses Cold Iron DR', isAllowed: true },
  { value: 'alchemical_silver', label: 'Alchemical Silver', sublabel: 'Bypasses Silver DR (-1 damage)', isAllowed: true },
  { value: 'darkwood', label: 'Darkwood', sublabel: 'Weight halved for wooden weapons', isAllowed: true }
];

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
  baneTarget?: string;
  onEditBaneTarget?: () => void;
}> = ({
  title,
  qualities,
  available,
  onAdd,
  onRemove,
  enhancementBonus = 0,
  itemType = 'weapon',
  onOpenGuide,
  baneTarget,
  onEditBaneTarget
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
          const isBane = qId === 'bane';
          const badgeLabel = isBane ? `Bane (${baneTarget || 'Designated Foe'})` : q.name;
          return (
            <span
              key={qId}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium shadow-xs ${
                isBane
                  ? 'bg-red-500/15 border-red-500/40 text-red-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
              title={isBane ? `${q.description} (Click to change designated foe)` : q.description}
            >
              {isBane && onEditBaneTarget ? (
                <button
                  type="button"
                  onClick={onEditBaneTarget}
                  className="hover:underline hover:text-red-200 cursor-pointer flex items-center gap-1 text-left"
                  title="Click to change designated foe"
                >
                  <i className="fa-solid fa-bullseye text-[10px] text-red-400"></i>
                  <span>{badgeLabel}</span>
                </button>
              ) : (
                <span>{badgeLabel}</span>
              )}
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

const BaneTargetModal: React.FC<{
  isOpen: boolean;
  weaponName?: string;
  currentTarget?: string;
  onSave: (target: string) => void;
  onClose: () => void;
}> = ({ isOpen, weaponName, currentTarget = '', onSave, onClose }) => {
  const [selectedType, setSelectedType] = useState(currentTarget);
  const [customText, setCustomText] = useState(
    currentTarget && !BANE_CREATURE_TYPES.includes(currentTarget) ? currentTarget : ''
  );
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      const isPreset = BANE_CREATURE_TYPES.includes(currentTarget);
      setSelectedType(isPreset ? currentTarget : '');
      setCustomText(!isPreset ? currentTarget : '');
      setSearch('');
    }
  }, [isOpen, currentTarget]);

  if (!isOpen) return null;

  const filteredTypes = BANE_CREATURE_TYPES.filter(t =>
    t.toLowerCase().includes(search.toLowerCase())
  );

  const effectiveTarget = customText.trim() || selectedType || 'Designated Foe';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
              <i className="fa-solid fa-bullseye text-base"></i>
            </span>
            <div>
              <h3 className="font-heading font-bold text-slate-100 text-base flex items-center gap-2">
                Select Bane Designated Foe
              </h3>
              {weaponName && (
                <span className="text-xs text-amber-400 font-mono font-medium">{weaponName}</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg transition p-1 cursor-pointer"
            title="Cancel"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300">
          <p className="text-slate-400 leading-relaxed">
            In D&D 3.5e, a <strong className="text-red-400">Bane</strong> weapon excels against a designated creature type. Against its designated foe, its effective enhancement bonus is +2 higher (+2 to Attack and +2 to Base Damage) and it deals an extra +2d6 Bane damage.
          </p>

          {/* Quick Filter Search */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <i className="fa-solid fa-magnifying-glass text-slate-400 text-[11px]"></i>
              Canonical 3.5e Creature Types (DMG Table 7-14):
            </label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search creature type (e.g. Undead, Dragons, Giants)..."
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-red-500/60"
            />
          </div>

          {/* Creature Type Chips Grid */}
          <div className="max-h-48 overflow-y-auto p-2 bg-slate-950/80 rounded-lg border border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-1.5 scrollbar-thin">
            {filteredTypes.map(type => {
              const isSelected = selectedType === type && !customText.trim();
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setSelectedType(type);
                    setCustomText('');
                  }}
                  className={`px-2.5 py-1.5 rounded text-left text-xs font-medium transition cursor-pointer flex items-center justify-between border ${
                    isSelected
                      ? 'bg-red-500/20 text-red-200 border-red-500/50 shadow-xs'
                      : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="truncate">{type}</span>
                  {isSelected && <i className="fa-solid fa-check text-[10px] text-red-400 ml-1"></i>}
                </button>
              );
            })}
            {filteredTypes.length === 0 && (
              <div className="col-span-full py-4 text-center text-slate-500 italic">
                No matching preset types. Use the custom input below.
              </div>
            )}
          </div>

          {/* Custom Foe Text Input */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
              <span>Or Specify Custom Foe / Subtype:</span>
              {customText.trim() && (
                <span className="text-[10px] text-red-400 font-mono">Custom Active</span>
              )}
            </label>
            <input
              type="text"
              value={customText}
              onChange={e => {
                setCustomText(e.target.value);
                if (e.target.value.trim()) {
                  setSelectedType('');
                }
              }}
              placeholder="e.g. Drow, Mind Flayers, Fire Outsiders, Red Dragons..."
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-red-500/60 font-mono"
            />
          </div>

          {/* Preview Banner */}
          <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-red-400 block tracking-wider">
                Active Bane Selection:
              </span>
              <span className="text-sm font-bold text-slate-100 font-mono">
                Bane ({effectiveTarget})
              </span>
            </div>
            <span className="text-[11px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              +2 Atk / +2 Dmg / +2d6 Bane
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 flex justify-end gap-2 bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition text-xs font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(effectiveTarget)}
            className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-950"
          >
            <i className="fa-solid fa-check text-[11px]"></i>
            Save Designated Foe
          </button>
        </div>
      </div>
    </div>
  );
};

export const EquipmentTab: React.FC<EquipmentTabProps> = (props) => {
  const contextCharacter = useCharacter();
  const { updateCharacter } = useCharacterDispatch();
  const gameData = useGameData();

  const character = props.character ?? contextCharacter;
  const weaponsData = props.weaponsData ?? gameData.weaponsData;
  const racesData = props.racesData ?? gameData.racesData;
  const classesData = props.classesData ?? gameData.classesData;
  const onChange = props.onChange ?? updateCharacter;
  const [showCustomWpnModal, setShowCustomWpnModal] = useState(false);
  const [showCustomArmorModal, setShowCustomArmorModal] = useState(false);
  const [showWondrousModal, setShowWondrousModal] = useState(false);
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [showQualitiesGuide, setShowQualitiesGuide] = useState(false);
  const [qualitiesGuideFilter, setQualitiesGuideFilter] = useState<'all' | 'weapon' | 'armor'>('all');
  const [qualitiesGuideSearch, setQualitiesGuideSearch] = useState('');
  const [baneModalConfig, setBaneModalConfig] = useState<{
    isOpen: boolean;
    field: 'primaryWeaponQualities' | 'secondaryWeaponQualities' | 'rangedWeaponQualities';
    currentTarget?: string;
    weaponName?: string;
  } | null>(null);

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

  // Wondrous Item Form & Predefined Catalog State
  const [wondrousModalTab, setWondrousModalTab] = useState<'predefined' | 'custom'>('predefined');
  const [wondrousPredefinedSearch, setWondrousPredefinedSearch] = useState('');
  const [wondrousPredefinedSlotFilter, setWondrousPredefinedSlotFilter] = useState<BodySlotId | 'all'>('all');
  const [wondrousOnlyAllowedSources, setWondrousOnlyAllowedSources] = useState<boolean>(false);
  const [selectedPredefinedId, setSelectedPredefinedId] = useState<string | null>(null);
  const [wondrousTargetSlot, setWondrousTargetSlot] = useState<BodySlotId>('shoulders');
  const [wondrousName, setWondrousName] = useState('');
  const [wondrousSlot, setWondrousSlot] = useState<BodySlotId>('shoulders');
  const [wondrousEffect, setWondrousEffect] = useState('');
  const [wondrousWeight, setWondrousWeight] = useState<number | ''>('');
  const [wondrousCost, setWondrousCost] = useState('');

  const openWondrousModal = useCallback((slotId?: BodySlotId, initialTab: 'predefined' | 'custom' = 'predefined') => {
    const target = slotId || 'shoulders';
    setWondrousSlot(target);
    setWondrousTargetSlot(target);
    setWondrousPredefinedSlotFilter(slotId ? slotId : 'all');
    setWondrousModalTab(initialTab);
    setSelectedPredefinedId(null);
    setWondrousPredefinedSearch('');
    setShowWondrousModal(true);
  }, []);

  const filteredPredefinedItems = useMemo(() => {
    const items = getPredefinedWondrousItems(
      wondrousPredefinedSlotFilter,
      wondrousPredefinedSearch,
      character.allowedSources,
      !wondrousOnlyAllowedSources
    );
    return sortDropdownItems(items, character.allowedSources);
  }, [wondrousPredefinedSlotFilter, wondrousPredefinedSearch, character.allowedSources, wondrousOnlyAllowedSources]);

  const selectedPredefinedItem = useMemo(() => {
    if (!selectedPredefinedId) return null;
    return STANDARD_WONDROUS_ITEMS.find(i => i.id === selectedPredefinedId) || null;
  }, [selectedPredefinedId]);

  // 12 Body Slot Validator View State
  const [bodySlotViewMode, setBodySlotViewMode] = useState<'grid' | 'doll'>('grid');
  const [bodySlotEquipPickerSlot, setBodySlotEquipPickerSlot] = useState<BodySlotId | null>(null);

  // Ammunition State
  const [showCustomAmmoModal, setShowCustomAmmoModal] = useState(false);
  const [ammoPresetDropdownOpen, setAmmoPresetDropdownOpen] = useState(false);
  const [ammoRollFeedback, setAmmoRollFeedback] = useState<string | null>(null);

  // Custom Ammo Form State
  const [customAmmoName, setCustomAmmoName] = useState('');
  const [customAmmoType, setCustomAmmoType] = useState<AmmoCategory>('arrow');
  const [customAmmoQuantity, setCustomAmmoQuantity] = useState(20);
  const [customAmmoEnhancement, setCustomAmmoEnhancement] = useState(0);
  const [customAmmoMaterial, setCustomAmmoMaterial] = useState<EquipmentMaterial | 'standard'>('standard');
  const [customAmmoQualities, setCustomAmmoQualities] = useState<string[]>([]);
  const [customAmmoWeight, setCustomAmmoWeight] = useState(3);
  const [customAmmoValue, setCustomAmmoValue] = useState('1 gp');
  const [customAmmoLocation, setCustomAmmoLocation] = useState('Quiver');
  const [customAmmoNotes, setCustomAmmoNotes] = useState('');
  const [customAmmoMasterwork, setCustomAmmoMasterwork] = useState(false);

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

  const bodySlotReport: BodySlotReport = useMemo(() => {
    return validateBodySlots(eq, customArmors);
  }, [eq, customArmors]);

  const characterAmmunition: InventoryItem[] = useMemo(() => {
    return getCharacterAmmunition(character);
  }, [character.inventory]);

  const activeAmmoItem: InventoryItem | undefined = useMemo(() => {
    if (eq.equippedAmmoId) {
      return inventory.find(i => i.id === eq.equippedAmmoId);
    }
    if (eq.rangedWeapon && eq.rangedWeapon !== 'none') {
      const matchType = getMatchingAmmoTypeForWeapon(eq.rangedWeapon);
      const match = characterAmmunition.find(a => a.ammoType === matchType && (a.quantity || 0) > 0);
      if (match) return match;
    }
    return characterAmmunition.find(a => (a.quantity || 0) > 0);
  }, [eq.equippedAmmoId, eq.rangedWeapon, inventory, characterAmmunition]);

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
        newEq.primaryWeaponBaneTarget = undefined;
        newEq.primaryWeaponMaterial = undefined;
        newEq.primaryWeaponMasterwork = false;
      } else if (val === '__CUSTOM__') {
        newEq.primaryWeapon = '__CUSTOM__';
        newEq.primaryWeaponItemId = undefined;
        newEq.primaryWeaponBaneTarget = undefined;
        newEq.primaryWeaponMaterial = undefined;
        newEq.primaryWeaponMasterwork = false;
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
        newEq.primaryWeaponBaneTarget = invItem.baneTarget || invItem.weaponData?.baneTarget;
        newEq.primaryWeaponMaterial = invItem.material || 'standard';
        newEq.primaryWeaponMasterwork = invItem.isMasterwork || false;

        // Transfer weapon from other weapon slots if already equipped there
        if (newEq.secondaryWeaponItemId === invItem.id) {
          newEq.secondaryWeapon = 'none';
          newEq.secondaryWeaponItemId = undefined;
          newEq.secondaryWeaponEnhancement = 0;
          newEq.secondaryWeaponQualities = [];
          newEq.secondaryWeaponBaneTarget = undefined;
          newEq.secondaryWeaponMaterial = undefined;
          newEq.secondaryWeaponMasterwork = false;
        }
        if (newEq.rangedWeaponItemId === invItem.id) {
          newEq.rangedWeapon = 'none';
          newEq.rangedWeaponItemId = undefined;
          newEq.rangedWeaponEnhancement = 0;
          newEq.rangedWeaponQualities = [];
          newEq.rangedWeaponBaneTarget = undefined;
          newEq.rangedWeaponMaterial = undefined;
          newEq.rangedWeaponMasterwork = false;
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
            newEq.secondaryWeaponBaneTarget = undefined;
            newEq.secondaryWeaponMaterial = undefined;
            newEq.secondaryWeaponMasterwork = false;
          }
          if (newEq.shield && newEq.shield !== 'none' && !newEq.shield.toLowerCase().includes('buckler')) {
            newEq.shield = 'none';
            newEq.shieldItemId = undefined;
            newEq.shieldEnhancement = 0;
            newEq.shieldQualities = [];
            newEq.shieldMaterial = undefined;
            newEq.shieldMasterwork = false;
          }
        }
      }
    } else if (field === 'secondaryWeapon') {
      if (val === 'none') {
        newEq.secondaryWeapon = 'none';
        newEq.secondaryWeaponItemId = undefined;
        newEq.secondaryWeaponEnhancement = 0;
        newEq.secondaryWeaponQualities = [];
        newEq.secondaryWeaponBaneTarget = undefined;
        newEq.secondaryWeaponMaterial = undefined;
        newEq.secondaryWeaponMasterwork = false;
      } else if (val === '__CUSTOM__') {
        newEq.secondaryWeapon = '__CUSTOM__';
        newEq.secondaryWeaponItemId = undefined;
        newEq.secondaryWeaponBaneTarget = undefined;
        newEq.secondaryWeaponMaterial = undefined;
        newEq.secondaryWeaponMasterwork = false;
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
        newEq.secondaryWeaponBaneTarget = invItem.baneTarget || invItem.weaponData?.baneTarget;
        newEq.secondaryWeaponMaterial = invItem.material || 'standard';
        newEq.secondaryWeaponMasterwork = invItem.isMasterwork || false;

        // Transfer weapon from other weapon slots if already equipped there
        if (newEq.primaryWeaponItemId === invItem.id) {
          newEq.primaryWeapon = 'none';
          newEq.primaryWeaponItemId = undefined;
          newEq.primaryWeaponEnhancement = 0;
          newEq.primaryWeaponQualities = [];
          newEq.primaryWeaponBaneTarget = undefined;
          newEq.primaryWeaponMaterial = undefined;
          newEq.primaryWeaponMasterwork = false;
        }
        if (newEq.rangedWeaponItemId === invItem.id) {
          newEq.rangedWeapon = 'none';
          newEq.rangedWeaponItemId = undefined;
          newEq.rangedWeaponEnhancement = 0;
          newEq.rangedWeaponQualities = [];
          newEq.rangedWeaponBaneTarget = undefined;
          newEq.rangedWeaponMaterial = undefined;
          newEq.rangedWeaponMasterwork = false;
        }

        if (newEq.primaryWeapon && newEq.primaryWeapon !== 'none') {
          const primaryObj = resolveEquippedWeapon({ ...character, equipment: newEq }, 'primaryWeapon', weaponsData, updatedCustoms);
          if (primaryObj.size === 'T' || primaryObj.category === 'Two-Handed') {
            newEq.primaryWeapon = 'none';
            newEq.primaryWeaponItemId = undefined;
            newEq.primaryWeaponEnhancement = 0;
            newEq.primaryWeaponQualities = [];
            newEq.primaryWeaponBaneTarget = undefined;
            newEq.primaryWeaponMaterial = undefined;
            newEq.primaryWeaponMasterwork = false;
          }
        }
        if (newEq.shield && newEq.shield !== 'none' && !newEq.shield.toLowerCase().includes('buckler')) {
          newEq.shield = 'none';
          newEq.shieldItemId = undefined;
          newEq.shieldEnhancement = 0;
          newEq.shieldQualities = [];
          newEq.shieldMaterial = undefined;
          newEq.shieldMasterwork = false;
        }
      }
    } else if (field === 'rangedWeapon') {
      if (val === 'none') {
        newEq.rangedWeapon = 'none';
        newEq.rangedWeaponItemId = undefined;
        newEq.rangedWeaponEnhancement = 0;
        newEq.rangedWeaponQualities = [];
        newEq.rangedWeaponBaneTarget = undefined;
        newEq.rangedWeaponMaterial = undefined;
        newEq.rangedWeaponMasterwork = false;
      } else if (val === '__CUSTOM__') {
        newEq.rangedWeapon = '__CUSTOM__';
        newEq.rangedWeaponItemId = undefined;
        newEq.rangedWeaponBaneTarget = undefined;
        newEq.rangedWeaponMaterial = undefined;
        newEq.rangedWeaponMasterwork = false;
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
        newEq.rangedWeaponBaneTarget = invItem.baneTarget || invItem.weaponData?.baneTarget;
        newEq.rangedWeaponMaterial = invItem.material || 'standard';
        newEq.rangedWeaponMasterwork = invItem.isMasterwork || false;

        // Transfer weapon from other weapon slots if already equipped there
        if (newEq.primaryWeaponItemId === invItem.id) {
          newEq.primaryWeapon = 'none';
          newEq.primaryWeaponItemId = undefined;
          newEq.primaryWeaponEnhancement = 0;
          newEq.primaryWeaponQualities = [];
          newEq.primaryWeaponBaneTarget = undefined;
          newEq.primaryWeaponMaterial = undefined;
          newEq.primaryWeaponMasterwork = false;
        }
        if (newEq.secondaryWeaponItemId === invItem.id) {
          newEq.secondaryWeapon = 'none';
          newEq.secondaryWeaponItemId = undefined;
          newEq.secondaryWeaponEnhancement = 0;
          newEq.secondaryWeaponQualities = [];
          newEq.secondaryWeaponBaneTarget = undefined;
          newEq.secondaryWeaponMaterial = undefined;
          newEq.secondaryWeaponMasterwork = false;
        }
      }
    } else if (field === 'armor') {
      if (val === 'none') {
        newEq.armor = 'none';
        newEq.armorItemId = undefined;
        newEq.armorEnhancement = 0;
        newEq.armorQualities = [];
        newEq.armorMaterial = undefined;
        newEq.armorMasterwork = false;
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
        newEq.armorMaterial = invItem.material || 'standard';
        newEq.armorMasterwork = invItem.isMasterwork || false;
      }
    } else if (field === 'shield') {
      if (val === 'none') {
        newEq.shield = 'none';
        newEq.shieldItemId = undefined;
        newEq.shieldEnhancement = 0;
        newEq.shieldQualities = [];
        newEq.shieldMaterial = undefined;
        newEq.shieldMasterwork = false;
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
        newEq.shieldMaterial = invItem.material || 'standard';
        newEq.shieldMasterwork = invItem.isMasterwork || false;

        if (!invItem.name.toLowerCase().includes('buckler')) {
          if (newEq.primaryWeapon && newEq.primaryWeapon !== 'none') {
            const primaryObj = resolveEquippedWeapon({ ...character, equipment: newEq }, 'primaryWeapon', weaponsData, updatedCustoms);
            if (primaryObj.size === 'T' || primaryObj.category === 'Two-Handed') {
              newEq.primaryWeapon = 'none';
              newEq.primaryWeaponItemId = undefined;
              newEq.primaryWeaponEnhancement = 0;
              newEq.primaryWeaponQualities = [];
              newEq.primaryWeaponBaneTarget = undefined;
              newEq.primaryWeaponMaterial = undefined;
              newEq.primaryWeaponMasterwork = false;
            }
          }
          if (newEq.secondaryWeapon && newEq.secondaryWeapon !== 'none') {
            newEq.secondaryWeapon = 'none';
            newEq.secondaryWeaponItemId = undefined;
            newEq.secondaryWeaponEnhancement = 0;
            newEq.secondaryWeaponQualities = [];
            newEq.secondaryWeaponBaneTarget = undefined;
            newEq.secondaryWeaponMaterial = undefined;
            newEq.secondaryWeaponMasterwork = false;
          }
        }
      }
    } else if (field === 'primaryWeaponEnhancement' || field === 'secondaryWeaponEnhancement' || field === 'rangedWeaponEnhancement') {
      const slotKey = field === 'primaryWeaponEnhancement' ? 'primaryWeapon' : (field === 'secondaryWeaponEnhancement' ? 'secondaryWeapon' : 'rangedWeapon');
      const idKey = `${slotKey}ItemId` as keyof Equipment;
      const qKey = `${slotKey}Qualities` as keyof Equipment;
      const matKey = `${slotKey}Material` as keyof Equipment;
      const mwkKey = `${slotKey}Masterwork` as keyof Equipment;
      const targetItemId = newEq[idKey] as string | undefined;
      const qualities = (newEq[qKey] as string[]) || [];

      if (targetItemId) {
        const itemIdx = updatedInv.findIndex(i => i.id === targetItemId);
        if (itemIdx >= 0) {
          const item = updatedInv[itemIdx];
          const resolved = resolveWeapon(item.baseItemId || item.name, updatedCustoms, weaponsData);
          const baseName = resolved.name;
          const mat = item.material || (newEq as any)[matKey] || 'standard';
          const isMwk = (newEq as any)[mwkKey] ?? item.isMasterwork ?? false;
          const newName = formatMagicItemName(baseName, val, qualities, mat, isMwk);
          updatedInv[itemIdx] = { ...item, name: newName, enhancementBonus: val, isMasterwork: isMwk };
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
      const matKey = `${slotKey}Material` as keyof Equipment;
      const mwkKey = `${slotKey}Masterwork` as keyof Equipment;
      const targetItemId = newEq[idKey] as string | undefined;
      const qualities = (newEq[qKey] as string[]) || [];

      if (targetItemId) {
        const itemIdx = updatedInv.findIndex(i => i.id === targetItemId);
        if (itemIdx >= 0) {
          const item = updatedInv[itemIdx];
          const resolved = slotKey === 'armor'
            ? resolveArmor(item.baseItemId || item.name, updatedArmors)
            : resolveShield(item.baseItemId || item.name, updatedArmors);
          const baseName = resolved.name;
          const mat = item.material || (newEq as any)[matKey] || 'standard';
          const isMwk = (newEq as any)[mwkKey] ?? item.isMasterwork ?? false;
          const newName = formatMagicItemName(baseName, val, qualities, mat, isMwk);
          updatedInv[itemIdx] = { ...item, name: newName, enhancementBonus: val, isMasterwork: isMwk };
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
      const matKey = `${slotKey}Material` as keyof Equipment;
      const mwkKey = `${slotKey}Masterwork` as keyof Equipment;
      const targetItemId = newEq[idKey] as string | undefined;
      const enh = (newEq[enhKey] as number) || 0;
      const qList = (val || []) as string[];

      if (targetItemId) {
        const itemIdx = updatedInv.findIndex(i => i.id === targetItemId);
        if (itemIdx >= 0) {
          const item = updatedInv[itemIdx];
          const isArmorOrShield = slotKey === 'armor' || slotKey === 'shield';
          const resolved = isArmorOrShield
            ? (slotKey === 'armor' ? resolveArmor(item.baseItemId || item.name, updatedArmors) : resolveShield(item.baseItemId || item.name, updatedArmors))
            : resolveWeapon(item.baseItemId || item.name, updatedCustoms, weaponsData);
          const baseName = resolved.name;
          const mat = item.material || (newEq as any)[matKey] || 'standard';
          const isMwk = (newEq as any)[mwkKey] ?? item.isMasterwork ?? false;
          const newName = formatMagicItemName(baseName, enh, qList, mat, isMwk);
          updatedInv[itemIdx] = { ...item, name: newName, specialQualities: [...qList], isMasterwork: isMwk };
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
    } else if (field === 'armorMaterial') {
      newEq.armorMaterial = val;
      const targetItemId = newEq.armorItemId;
      if (targetItemId) {
        const itemIdx = updatedInv.findIndex(i => i.id === targetItemId);
        if (itemIdx >= 0) {
          const item = updatedInv[itemIdx];
          const resolved = resolveArmor(item.baseItemId || item.name, updatedArmors);
          const baseName = resolved.name;
          const enh = item.enhancementBonus || 0;
          const qList = item.specialQualities || [];
          const isMwk = item.isMasterwork ?? newEq.armorMasterwork ?? false;
          const newName = formatMagicItemName(baseName, enh, qList, val, isMwk);
          const baseArmorData: ItemArmorData = {
            type: (resolved.type as any) || 'medium',
            acBonus: resolved.acBonus,
            maxDex: resolved.maxDex ?? 99,
            armorCheckPenalty: resolved.checkPenalty ?? 0,
            spellFailure: resolved.spellFailure ?? 0,
            speedPenalty: resolved.speedPenalty ?? (resolved.type === 'heavy' || resolved.type === 'medium')
          };
          const newArmorData = applyMaterialToArmorData(baseArmorData, val, isMwk);
          const stdWeight = resolved.weight ?? (ARMOR_WEIGHT_MAP[resolved.name.toLowerCase()] ?? 20);
          const newWeight = applyMaterialToWeight(stdWeight, val);

          updatedInv[itemIdx] = {
            ...item,
            name: newName,
            material: val,
            weight: newWeight,
            armorData: newArmorData,
            isMasterwork: isMwk
          };
          newEq.armor = newName;
        }
      }
    } else if (field === 'shieldMaterial') {
      newEq.shieldMaterial = val;
      const targetItemId = newEq.shieldItemId;
      if (targetItemId) {
        const itemIdx = updatedInv.findIndex(i => i.id === targetItemId);
        if (itemIdx >= 0) {
          const item = updatedInv[itemIdx];
          const resolved = resolveShield(item.baseItemId || item.name, updatedArmors);
          const baseName = resolved.name;
          const enh = item.enhancementBonus || 0;
          const qList = item.specialQualities || [];
          const isMwk = item.isMasterwork ?? newEq.shieldMasterwork ?? false;
          const newName = formatMagicItemName(baseName, enh, qList, val, isMwk);
          const baseArmorData: ItemArmorData = {
            type: 'shield',
            acBonus: resolved.acBonus,
            maxDex: 99,
            armorCheckPenalty: resolved.checkPenalty ?? 0,
            spellFailure: resolved.spellFailure ?? 0,
            speedPenalty: false
          };
          const newArmorData = applyMaterialToArmorData(baseArmorData, val, isMwk);
          const stdWeight = resolved.weight ?? (SHIELD_WEIGHT_MAP[resolved.name.toLowerCase()] ?? 10);
          const newWeight = applyMaterialToWeight(stdWeight, val);

          updatedInv[itemIdx] = {
            ...item,
            name: newName,
            material: val,
            weight: newWeight,
            armorData: newArmorData,
            isMasterwork: isMwk
          };
          newEq.shield = newName;
        }
      }
    } else if (field === 'primaryWeaponMaterial' || field === 'secondaryWeaponMaterial' || field === 'rangedWeaponMaterial') {
      const slotKey = field === 'primaryWeaponMaterial' ? 'primaryWeapon' : (field === 'secondaryWeaponMaterial' ? 'secondaryWeapon' : 'rangedWeapon');
      const idKey = `${slotKey}ItemId` as keyof Equipment;
      const enhKey = `${slotKey}Enhancement` as keyof Equipment;
      const qKey = `${slotKey}Qualities` as keyof Equipment;
      const mwkKey = `${slotKey}Masterwork` as keyof Equipment;
      const targetItemId = newEq[idKey] as string | undefined;
      const enh = (newEq[enhKey] as number) || 0;
      const qList = (newEq[qKey] as string[]) || [];
      (newEq as any)[field] = val;

      if (targetItemId) {
        const itemIdx = updatedInv.findIndex(i => i.id === targetItemId);
        if (itemIdx >= 0) {
          const item = updatedInv[itemIdx];
          const resolved = resolveWeapon(item.baseItemId || item.name, updatedCustoms, weaponsData);
          const baseName = resolved.name;
          const isMwk = item.isMasterwork ?? (newEq as any)[mwkKey] ?? false;
          const newName = formatMagicItemName(baseName, enh, qList, val, isMwk);
          const stdWeight = resolved.weight ?? 4;
          const newWeight = applyMaterialToWeight(stdWeight, val);

          updatedInv[itemIdx] = {
            ...item,
            name: newName,
            material: val,
            weight: newWeight,
            isMasterwork: isMwk
          };
          (newEq as any)[slotKey] = newName;
        }
      }
    } else if (field === 'primaryWeaponMasterwork' || field === 'secondaryWeaponMasterwork' || field === 'rangedWeaponMasterwork') {
      const slotKey = field === 'primaryWeaponMasterwork' ? 'primaryWeapon' : (field === 'secondaryWeaponMasterwork' ? 'secondaryWeapon' : 'rangedWeapon');
      const idKey = `${slotKey}ItemId` as keyof Equipment;
      const enhKey = `${slotKey}Enhancement` as keyof Equipment;
      const qKey = `${slotKey}Qualities` as keyof Equipment;
      const matKey = `${slotKey}Material` as keyof Equipment;
      const targetItemId = newEq[idKey] as string | undefined;
      const enh = (newEq[enhKey] as number) || 0;
      const qList = (newEq[qKey] as string[]) || [];
      const isMwk = Boolean(val);
      (newEq as any)[field] = isMwk;

      if (targetItemId) {
        const itemIdx = updatedInv.findIndex(i => i.id === targetItemId);
        if (itemIdx >= 0) {
          const item = updatedInv[itemIdx];
          const resolved = resolveWeapon(item.baseItemId || item.name, updatedCustoms, weaponsData);
          const baseName = resolved.name;
          const mat = item.material || (newEq as any)[matKey] || 'standard';
          const newName = formatMagicItemName(baseName, enh, qList, mat, isMwk);
          updatedInv[itemIdx] = {
            ...item,
            name: newName,
            isMasterwork: isMwk,
            weaponData: item.weaponData ? { ...item.weaponData, isMasterwork: isMwk } : undefined
          };
          (newEq as any)[slotKey] = newName;
        }
      } else {
        const currentVal = (newEq as any)[slotKey];
        if (currentVal && currentVal !== 'none') {
          const resolved = resolveWeapon(currentVal, updatedCustoms, weaponsData);
          const mat = (newEq as any)[matKey] || 'standard';
          const newName = formatMagicItemName(resolved.name, enh, qList, mat, isMwk);
          (newEq as any)[slotKey] = newName;
          const invIdx = updatedInv.findIndex(i => matchesItemName(i.name, currentVal) || matchesItemName(i.name, resolved.name));
          if (invIdx >= 0) {
            const invItem = updatedInv[invIdx];
            updatedInv[invIdx] = {
              ...invItem,
              name: newName,
              isMasterwork: isMwk,
              weaponData: invItem.weaponData ? { ...invItem.weaponData, isMasterwork: isMwk } : undefined
            };
          }
        }
      }
    } else if (field === 'armorMasterwork' || field === 'shieldMasterwork') {
      const slotKey = field === 'armorMasterwork' ? 'armor' : 'shield';
      const idKey = `${slotKey}ItemId` as keyof Equipment;
      const enhKey = `${slotKey}Enhancement` as keyof Equipment;
      const qKey = `${slotKey}Qualities` as keyof Equipment;
      const matKey = `${slotKey}Material` as keyof Equipment;
      const targetItemId = newEq[idKey] as string | undefined;
      const enh = (newEq[enhKey] as number) || 0;
      const qList = (newEq[qKey] as string[]) || [];
      const isMwk = Boolean(val);
      (newEq as any)[field] = isMwk;

      if (targetItemId) {
        const itemIdx = updatedInv.findIndex(i => i.id === targetItemId);
        if (itemIdx >= 0) {
          const item = updatedInv[itemIdx];
          const isArmor = slotKey === 'armor';
          let baseName: string;
          let baseArmorData: ItemArmorData;
          if (isArmor) {
            const resolved = resolveArmor(item.baseItemId || item.name, updatedArmors);
            baseName = resolved.name;
            baseArmorData = {
              type: (resolved.type as any) || 'medium',
              acBonus: resolved.acBonus,
              maxDex: resolved.maxDex ?? 99,
              armorCheckPenalty: resolved.checkPenalty ?? 0,
              spellFailure: resolved.spellFailure ?? 0,
              speedPenalty: resolved.speedPenalty ?? (resolved.type === 'heavy' || resolved.type === 'medium')
            };
          } else {
            const resolved = resolveShield(item.baseItemId || item.name, updatedArmors);
            baseName = resolved.name;
            baseArmorData = {
              type: 'shield',
              acBonus: resolved.acBonus,
              maxDex: 99,
              armorCheckPenalty: resolved.checkPenalty ?? 0,
              spellFailure: resolved.spellFailure ?? 0,
              speedPenalty: false
            };
          }
          const mat = item.material || (newEq as any)[matKey] || 'standard';
          const newName = formatMagicItemName(baseName, enh, qList, mat, isMwk);
          const newArmorData = applyMaterialToArmorData(baseArmorData, mat, isMwk);
          updatedInv[itemIdx] = {
            ...item,
            name: newName,
            isMasterwork: isMwk,
            armorData: newArmorData
          };
          (newEq as any)[slotKey] = newName;
        }
      } else {
        const currentVal = (newEq as any)[slotKey];
        if (currentVal && currentVal !== 'none') {
          const isArmor = slotKey === 'armor';
          const resolved = isArmor ? resolveArmor(currentVal, updatedArmors) : resolveShield(currentVal, updatedArmors);
          const mat = (newEq as any)[matKey] || 'standard';
          const newName = formatMagicItemName(resolved.name, enh, qList, mat, isMwk);
          (newEq as any)[slotKey] = newName;
          const invIdx = updatedInv.findIndex(i => matchesItemName(i.name, currentVal) || matchesItemName(i.name, resolved.name));
          if (invIdx >= 0) {
            const item = updatedInv[invIdx];
            const baseArmorData = item.armorData || {
              type: (isArmor ? (resolved as any).type || 'medium' : 'shield') as any,
              acBonus: resolved.acBonus,
              maxDex: (resolved as any).maxDex ?? 99,
              armorCheckPenalty: resolved.checkPenalty ?? 0,
              spellFailure: resolved.spellFailure ?? 0,
              speedPenalty: isArmor ? ((resolved as any).speedPenalty ?? ((resolved as any).type === 'heavy' || (resolved as any).type === 'medium')) : false
            };
            updatedInv[invIdx] = {
              ...item,
              name: newName,
              isMasterwork: isMwk,
              armorData: applyMaterialToArmorData(baseArmorData, mat, isMwk)
            };
          }
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
      newEq.primaryWeaponBaneTarget = undefined;
      newEq.primaryWeaponMaterial = undefined;
      newEq.primaryWeaponMasterwork = false;
    }
    if (newEq.secondaryWeaponItemId === equippedItem.id && slot !== 'secondaryWeapon') {
      newEq.secondaryWeapon = 'none';
      newEq.secondaryWeaponItemId = undefined;
      newEq.secondaryWeaponEnhancement = 0;
      newEq.secondaryWeaponQualities = [];
      newEq.secondaryWeaponBaneTarget = undefined;
      newEq.secondaryWeaponMaterial = undefined;
      newEq.secondaryWeaponMasterwork = false;
    }
    if (newEq.rangedWeaponItemId === equippedItem.id && slot !== 'rangedWeapon') {
      newEq.rangedWeapon = 'none';
      newEq.rangedWeaponItemId = undefined;
      newEq.rangedWeaponEnhancement = 0;
      newEq.rangedWeaponQualities = [];
      newEq.rangedWeaponBaneTarget = undefined;
      newEq.rangedWeaponMaterial = undefined;
      newEq.rangedWeaponMasterwork = false;
    }
    if (newEq.armorItemId === equippedItem.id && slot !== 'armor') {
      newEq.armor = 'none';
      newEq.armorItemId = undefined;
      newEq.armorEnhancement = 0;
      newEq.armorQualities = [];
      newEq.armorMaterial = undefined;
      newEq.armorMasterwork = false;
    }
    if (newEq.shieldItemId === equippedItem.id && slot !== 'shield') {
      newEq.shield = 'none';
      newEq.shieldItemId = undefined;
      newEq.shieldEnhancement = 0;
      newEq.shieldQualities = [];
      newEq.shieldMaterial = undefined;
      newEq.shieldMasterwork = false;
    }

    if (slot === 'primaryWeapon') {
      newEq.primaryWeapon = equippedItem.name;
      newEq.primaryWeaponItemId = equippedItem.id;
      newEq.primaryWeaponEnhancement = equippedItem.enhancementBonus || 0;
      newEq.primaryWeaponQualities = equippedItem.specialQualities ? [...equippedItem.specialQualities] : [];
      newEq.primaryWeaponBaneTarget = equippedItem.baneTarget || equippedItem.weaponData?.baneTarget;
      newEq.primaryWeaponMaterial = equippedItem.material || 'standard';
      newEq.primaryWeaponMasterwork = equippedItem.isMasterwork || false;

      const isTwoHanded = equippedItem.weaponData?.size === 'T' ||
        equippedItem.weaponData?.category === 'Two-Handed' ||
        resolveWeapon(equippedItem.name, customWeapons, weaponsData).size === 'T';

      if (isTwoHanded) {
        if (newEq.secondaryWeapon && newEq.secondaryWeapon !== 'none') {
          newEq.secondaryWeapon = 'none';
          newEq.secondaryWeaponItemId = undefined;
          newEq.secondaryWeaponEnhancement = 0;
          newEq.secondaryWeaponQualities = [];
          newEq.secondaryWeaponBaneTarget = undefined;
          newEq.secondaryWeaponMaterial = undefined;
          newEq.secondaryWeaponMasterwork = false;
        }
        if (newEq.shield && newEq.shield !== 'none' && !newEq.shield.toLowerCase().includes('buckler')) {
          newEq.shield = 'none';
          newEq.shieldItemId = undefined;
          newEq.shieldEnhancement = 0;
          newEq.shieldQualities = [];
          newEq.shieldMaterial = undefined;
          newEq.shieldMasterwork = false;
        }
      }
    } else if (slot === 'secondaryWeapon') {
      newEq.secondaryWeapon = equippedItem.name;
      newEq.secondaryWeaponItemId = equippedItem.id;
      newEq.secondaryWeaponEnhancement = equippedItem.enhancementBonus || 0;
      newEq.secondaryWeaponQualities = equippedItem.specialQualities ? [...equippedItem.specialQualities] : [];
      newEq.secondaryWeaponBaneTarget = equippedItem.baneTarget || equippedItem.weaponData?.baneTarget;
      newEq.secondaryWeaponMaterial = equippedItem.material || 'standard';
      newEq.secondaryWeaponMasterwork = equippedItem.isMasterwork || false;

      if (newEq.primaryWeapon && newEq.primaryWeapon !== 'none') {
        const primaryObj = resolveEquippedWeapon({ ...character, equipment: newEq }, 'primaryWeapon', weaponsData, customWeapons);
        if (primaryObj.size === 'T' || primaryObj.category === 'Two-Handed') {
          newEq.primaryWeapon = 'none';
          newEq.primaryWeaponItemId = undefined;
          newEq.primaryWeaponEnhancement = 0;
          newEq.primaryWeaponQualities = [];
          newEq.primaryWeaponBaneTarget = undefined;
          newEq.primaryWeaponMaterial = undefined;
          newEq.primaryWeaponMasterwork = false;
        }
      }
      if (newEq.shield && newEq.shield !== 'none' && !newEq.shield.toLowerCase().includes('buckler')) {
        newEq.shield = 'none';
        newEq.shieldItemId = undefined;
        newEq.shieldEnhancement = 0;
        newEq.shieldQualities = [];
        newEq.shieldMaterial = undefined;
        newEq.shieldMasterwork = false;
      }
    } else if (slot === 'rangedWeapon') {
      newEq.rangedWeapon = equippedItem.name;
      newEq.rangedWeaponItemId = equippedItem.id;
      newEq.rangedWeaponEnhancement = equippedItem.enhancementBonus || 0;
      newEq.rangedWeaponQualities = equippedItem.specialQualities ? [...equippedItem.specialQualities] : [];
      newEq.rangedWeaponBaneTarget = equippedItem.baneTarget || equippedItem.weaponData?.baneTarget;
      newEq.rangedWeaponMaterial = equippedItem.material || 'standard';
      newEq.rangedWeaponMasterwork = equippedItem.isMasterwork || false;
    } else if (slot === 'armor') {
      newEq.armor = equippedItem.name;
      newEq.armorItemId = equippedItem.id;
      newEq.armorEnhancement = equippedItem.enhancementBonus || 0;
      newEq.armorQualities = equippedItem.specialQualities ? [...equippedItem.specialQualities] : [];
      newEq.armorMaterial = equippedItem.material || 'standard';
      newEq.armorMasterwork = equippedItem.isMasterwork || false;
    } else if (slot === 'shield') {
      newEq.shield = equippedItem.name;
      newEq.shieldItemId = equippedItem.id;
      newEq.shieldEnhancement = equippedItem.enhancementBonus || 0;
      newEq.shieldQualities = equippedItem.specialQualities ? [...equippedItem.specialQualities] : [];
      newEq.shieldMaterial = equippedItem.material || 'standard';
      newEq.shieldMasterwork = equippedItem.isMasterwork || false;

      if (!equippedItem.name.toLowerCase().includes('buckler')) {
        if (newEq.primaryWeapon && newEq.primaryWeapon !== 'none') {
          const primaryObj = resolveEquippedWeapon({ ...character, equipment: newEq }, 'primaryWeapon', weaponsData, customWeapons);
          if (primaryObj.size === 'T' || primaryObj.category === 'Two-Handed') {
            newEq.primaryWeapon = 'none';
            newEq.primaryWeaponItemId = undefined;
            newEq.primaryWeaponEnhancement = 0;
            newEq.primaryWeaponQualities = [];
            newEq.primaryWeaponBaneTarget = undefined;
            newEq.primaryWeaponMaterial = undefined;
            newEq.primaryWeaponMasterwork = false;
          }
        }
        if (newEq.secondaryWeapon && newEq.secondaryWeapon !== 'none') {
          newEq.secondaryWeapon = 'none';
          newEq.secondaryWeaponItemId = undefined;
          newEq.secondaryWeaponEnhancement = 0;
          newEq.secondaryWeaponQualities = [];
          newEq.secondaryWeaponBaneTarget = undefined;
          newEq.secondaryWeaponMaterial = undefined;
          newEq.secondaryWeaponMasterwork = false;
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

  const openBaneModal = (field: 'primaryWeaponQualities' | 'secondaryWeaponQualities' | 'rangedWeaponQualities') => {
    const slotKey = field === 'primaryWeaponQualities' ? 'primaryWeapon' : (field === 'secondaryWeaponQualities' ? 'secondaryWeapon' : 'rangedWeapon');
    const baneKey = `${slotKey}BaneTarget` as keyof Equipment;
    const wpnName = eq[slotKey] || 'Weapon';
    setBaneModalConfig({
      isOpen: true,
      field,
      currentTarget: (eq[baneKey] as string) || '',
      weaponName: wpnName
    });
  };

  const handleSaveBaneTarget = (targetFoe: string) => {
    if (!baneModalConfig) return;
    const { field } = baneModalConfig;
    const slotKey = field === 'primaryWeaponQualities' ? 'primaryWeapon' : (field === 'secondaryWeaponQualities' ? 'secondaryWeapon' : 'rangedWeapon');
    const baneKey = `${slotKey}BaneTarget` as keyof Equipment;
    const idKey = `${slotKey}ItemId` as keyof Equipment;
    const currentQualities = eq[field] || [];
    const newQualities = currentQualities.includes('bane') ? [...currentQualities] : [...currentQualities, 'bane'];

    let updatedInv = [...inventory];
    const targetItemId = eq[idKey];
    if (targetItemId) {
      const itemIdx = updatedInv.findIndex(i => i.id === targetItemId);
      if (itemIdx >= 0) {
        const item = updatedInv[itemIdx];
        const existingQualities = item.specialQualities || [];
        const itemQualities = existingQualities.includes('bane') ? [...existingQualities] : [...existingQualities, 'bane'];
        updatedInv[itemIdx] = {
          ...item,
          specialQualities: itemQualities,
          baneTarget: targetFoe,
          weaponData: item.weaponData ? { ...item.weaponData, baneTarget: targetFoe } : undefined
        };
      }
    } else {
      const currentName = eq[slotKey];
      if (currentName && currentName !== 'none') {
        updatedInv = updatedInv.map(i => {
          if (matchesItemName(i.name, currentName)) {
            const existingQualities = i.specialQualities || [];
            const itemQualities = existingQualities.includes('bane') ? [...existingQualities] : [...existingQualities, 'bane'];
            return {
              ...i,
              specialQualities: itemQualities,
              baneTarget: targetFoe,
              weaponData: i.weaponData ? { ...i.weaponData, baneTarget: targetFoe } : undefined
            };
          }
          return i;
        });
      }
    }

    const newEq = {
      ...eq,
      [field]: newQualities,
      [baneKey]: targetFoe
    };

    onChange({
      equipment: newEq,
      inventory: updatedInv
    });

    setBaneModalConfig(null);
  };

  const handleAddQuality = (
    field: 'primaryWeaponQualities' | 'secondaryWeaponQualities' | 'rangedWeaponQualities' | 'armorQualities' | 'shieldQualities',
    qId: string
  ) => {
    if (qId === 'bane' && (field === 'primaryWeaponQualities' || field === 'secondaryWeaponQualities' || field === 'rangedWeaponQualities')) {
      openBaneModal(field);
      return;
    }
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
    const newQualities = current.filter(id => id !== qId);
    if (qId === 'bane' && (field === 'primaryWeaponQualities' || field === 'secondaryWeaponQualities' || field === 'rangedWeaponQualities')) {
      const slotKey = field === 'primaryWeaponQualities' ? 'primaryWeapon' : (field === 'secondaryWeaponQualities' ? 'secondaryWeapon' : 'rangedWeapon');
      const baneKey = `${slotKey}BaneTarget` as keyof Equipment;
      const idKey = `${slotKey}ItemId` as keyof Equipment;
      let updatedInv = [...inventory];
      const targetItemId = eq[idKey];
      if (targetItemId) {
        const itemIdx = updatedInv.findIndex(i => i.id === targetItemId);
        if (itemIdx >= 0) {
          const item = updatedInv[itemIdx];
          updatedInv[itemIdx] = {
            ...item,
            specialQualities: (item.specialQualities || []).filter(q => q !== 'bane'),
            baneTarget: undefined,
            weaponData: item.weaponData ? { ...item.weaponData, baneTarget: undefined } : undefined
          };
        }
      }
      const newEq = {
        ...eq,
        [field]: newQualities,
        [baneKey]: undefined
      };
      onChange({
        equipment: newEq,
        inventory: updatedInv
      });
      return;
    }
    handleEqChange(field, newQualities);
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

  const armorObj = resolveEquippedArmor({ ...character, equipment: eq }, customArmors);
  const shieldObj = resolveEquippedShield({ ...character, equipment: eq }, customArmors);
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
      const isWeaponType = item.itemType === 'weapon' || Boolean(item.weaponData);
      const isKnown = weaponsData.some(w => w.name.toLowerCase() === clean.toLowerCase());
      const themedBase = getThemedWeaponBase(clean, weaponsData);
      const isThemed = themedBase !== null;
      const aliasMatch = clean.match(/^(.+?)\s*\((.+?)\)$/);
      const isAliasedWeapon = aliasMatch
        ? (STANDARD_BASE_WEAPONS[aliasMatch[2].trim().toLowerCase()] !== undefined ||
           weaponsData.some(w => w.name.toLowerCase() === aliasMatch[2].trim().toLowerCase()))
        : false;
      const isMagicWeapon = (item.enhancementBonus || 0) > 0 || (item.specialQualities && item.specialQualities.length > 0);

      if (isWeaponType || isKnown || isThemed || isAliasedWeapon || isMagicWeapon) {
        const resolved = resolveWeapon(item.baseItemId || clean, customWeapons, weaponsData);
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
      const isWeaponType = invItem.itemType === 'weapon' || Boolean(invItem.weaponData);
      const isKnown = weaponsData.some(w => w.name.toLowerCase() === clean.toLowerCase());
      const isThemed = getThemedWeaponBase(clean, weaponsData) !== null;
      const isMagicWeapon = (invItem.enhancementBonus || 0) > 0 || (invItem.specialQualities && invItem.specialQualities.length > 0);

      if (isWeaponType || isKnown || isThemed || isMagicWeapon) {
        const resolved = resolveWeapon(invItem.baseItemId || clean, customWeapons, weaponsData);
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
  const generalTcMods = calculateTacticalCombatModifiers(tcState, undefined, false, false, character.activeBuffs);
  const activeCombatMods = getActiveCombatModifiers(tcState, totalLevel, character.activeBuffs);
  const effectiveStrScore = strScore + (generalTcMods.strBonus || 0);
  const effectiveStrMod = getAbilityMod(effectiveStrScore);
  const effectiveDexMod = getAbilityMod(dexScore + (generalTcMods.dexBonus || 0));

  // Armor & Shield Special Qualities & Defenses
  const armorQualities = eq.armorQualities || [];
  const shieldQualities = eq.shieldQualities || [];
  const combinedFortification = getFortificationSummary(armorQualities, shieldQualities);
  const hideQualityBonus = getArmorSkillBonus(armorQualities, shieldQualities, 'Hide');
  const moveSilentlyQualityBonus = getArmorSkillBonus(armorQualities, shieldQualities, 'Move Silently');

  // Masterwork Status & Inherency Flags
  const isArmorInherentlyMwk = (eq.armorEnhancement || 0) > 0 || eq.armorMaterial === 'adamantine' || eq.armorMaterial === 'mithral';
  const isArmorMwk = isArmorInherentlyMwk || !!eq.armorMasterwork;

  const isShieldInherentlyMwk = (eq.shieldEnhancement || 0) > 0 || eq.shieldMaterial === 'adamantine' || eq.shieldMaterial === 'mithral' || eq.shieldMaterial === 'darkwood';
  const isShieldMwk = isShieldInherentlyMwk || !!eq.shieldMasterwork;

  const isPrimaryInherentlyMwk = (eq.primaryWeaponEnhancement || 0) > 0 || eq.primaryWeaponMaterial === 'adamantine';
  const isPrimaryMwk = isPrimaryInherentlyMwk || !!eq.primaryWeaponMasterwork;

  const isSecondaryInherentlyMwk = (eq.secondaryWeaponEnhancement || 0) > 0 || eq.secondaryWeaponMaterial === 'adamantine';
  const isSecondaryMwk = isSecondaryInherentlyMwk || !!eq.secondaryWeaponMasterwork;

  const isRangedInherentlyMwk = (eq.rangedWeaponEnhancement || 0) > 0 || eq.rangedWeaponMaterial === 'adamantine';
  const isRangedMwk = isRangedInherentlyMwk || !!eq.rangedWeaponMasterwork;

  // Unified Combat Profiles for Equipped Weapons
  const combatContext: EquippedWeaponCombatContext = {
    bab,
    classesData,
    effectiveStrMod,
    effectiveDexMod,
    totalLevel,
    tcState,
    extraAttacks: (generalTcMods.extraAttacks || 0)
  };

  // Resolve Primary Weapon & Special Qualities
  const hasPrimary = Boolean(eq.primaryWeapon && eq.primaryWeapon !== 'none');
  const primaryProfile = calculateEquippedWeaponCombatProfile(character, 'primaryWeapon', weaponsData, customWeapons, combatContext);
  const primaryWpnObj = primaryProfile?.weapon || null;
  const primaryHasKeen = primaryProfile?.hasKeen || false;
  const primaryTotalAtk = primaryProfile?.totalAtk || 0;
  const primaryThreat = primaryProfile?.threatMin || 20;
  const primaryDmgVal = primaryProfile?.dmgVal || 0;
  const primaryDamageDisplay = primaryProfile?.damageDisplay || '';
  const primaryDamageFormula = primaryProfile?.damageFormula || '';
  const primaryRollOptions = primaryProfile?.rollOptions || [];
  const primaryBaneAtk = primaryProfile?.baneAtk || null;
  const primaryCritInfo = primaryProfile?.critInfo || null;
  const primaryQualities = eq.primaryWeaponQualities || [];
  const primaryEnhancement = eq.primaryWeaponEnhancement || 0;
  const primaryFeatBonuses = { attackBonus: primaryProfile?.featAtkBonus || 0, damageBonus: primaryProfile?.featDmgBonus || 0 };
  const primarySpecialDmg = primaryProfile?.specialDmg || { summaryLabels: [], hasBane: false, damageDiceString: '', damageDiceFormula: '' };
  const primaryHasSpeed = primaryProfile?.hasSpeed || false;

  // Resolve Secondary Weapon & Special Qualities
  const hasSecondary = Boolean(eq.secondaryWeapon && eq.secondaryWeapon !== 'none');
  const secondaryProfile = calculateEquippedWeaponCombatProfile(character, 'secondaryWeapon', weaponsData, customWeapons, combatContext);
  const secondaryWpnObj = secondaryProfile?.weapon || null;
  const secondaryHasKeen = secondaryProfile?.hasKeen || false;
  const secondaryTotalAtk = secondaryProfile?.totalAtk || 0;
  const secondaryThreat = secondaryProfile?.threatMin || 20;
  const secondaryDmgVal = secondaryProfile?.dmgVal || 0;
  const secondaryDamageDisplay = secondaryProfile?.damageDisplay || '';
  const secondaryDamageFormula = secondaryProfile?.damageFormula || '';
  const secondaryRollOptions = secondaryProfile?.rollOptions || [];
  const secondaryBaneAtk = secondaryProfile?.baneAtk || null;
  const secondaryCritInfo = secondaryProfile?.critInfo || null;
  const secondaryQualities = eq.secondaryWeaponQualities || [];
  const secondaryEnhancement = eq.secondaryWeaponEnhancement || 0;
  const secondarySpecialDmg = secondaryProfile?.specialDmg || { summaryLabels: [], hasBane: false, damageDiceString: '', damageDiceFormula: '' };

  // Resolve Ranged Weapon & Special Qualities
  const hasRanged = Boolean(eq.rangedWeapon && eq.rangedWeapon !== 'none');
  const rangedProfile = calculateEquippedWeaponCombatProfile(character, 'rangedWeapon', weaponsData, customWeapons, combatContext);
  const rangedWpnObj = rangedProfile?.weapon || null;
  const rangedHasKeen = rangedProfile?.hasKeen || false;
  const rangedTotalAtk = rangedProfile?.totalAtk || 0;
  const rangedThreat = rangedProfile?.threatMin || 20;
  const rangedDmgVal = rangedProfile?.dmgVal || 0;
  const rangedDamageDisplay = rangedProfile?.damageDisplay || '';
  const rangedDamageFormula = rangedProfile?.damageFormula || '';
  const rangedRollOptions = rangedProfile?.rollOptions || [];
  const rangedBaneAtk = rangedProfile?.baneAtk || null;
  const rangedCritInfo = rangedProfile?.critInfo || null;
  const rangedQualities = eq.rangedWeaponQualities || [];
  const rangedEnhancement = eq.rangedWeaponEnhancement || 0;
  const rangedSpecialDmg = rangedProfile?.specialDmg || { summaryLabels: [], hasBane: false, damageDiceString: '', damageDiceFormula: '' };

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
        newEq.primaryWeaponBaneTarget = undefined;
      }
      if (newEq.secondaryWeaponItemId === id) {
        newEq.secondaryWeapon = 'none';
        newEq.secondaryWeaponItemId = undefined;
        newEq.secondaryWeaponEnhancement = 0;
        newEq.secondaryWeaponQualities = [];
        newEq.secondaryWeaponBaneTarget = undefined;
      }
      if (newEq.rangedWeaponItemId === id) {
        newEq.rangedWeapon = 'none';
        newEq.rangedWeaponItemId = undefined;
        newEq.rangedWeaponEnhancement = 0;
        newEq.rangedWeaponQualities = [];
        newEq.rangedWeaponBaneTarget = undefined;
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
          newEq.primaryWeaponBaneTarget = undefined;
        }
        if (!newEq.secondaryWeaponItemId && eq.secondaryWeapon && (matchesItemName(resolveWeapon(eq.secondaryWeapon, customWeapons, weaponsData).name, cleanName) || matchesItemName(eq.secondaryWeapon, cleanName))) {
          newEq.secondaryWeapon = 'none';
          newEq.secondaryWeaponBaneTarget = undefined;
        }
        if (!newEq.rangedWeaponItemId && eq.rangedWeapon && (matchesItemName(resolveWeapon(eq.rangedWeapon, customWeapons, weaponsData).name, cleanName) || matchesItemName(eq.rangedWeapon, cleanName))) {
          newEq.rangedWeapon = 'none';
          newEq.rangedWeaponBaneTarget = undefined;
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

  // Equip Predefined Wondrous Item
  const handleEquipPredefinedItem = (item: PredefinedWondrousItem, overrideSlot?: BodySlotId) => {
    const targetSlot = overrideSlot || wondrousTargetSlot || item.slot;
    const { wondrousItem, inventoryItem } = createWondrousItemFromPredefined(item, targetSlot);

    const currentItems = eq.wondrousItems || [];
    onChange({
      equipment: { ...eq, wondrousItems: [...currentItems, wondrousItem] },
      inventory: [...inventory, inventoryItem]
    });

    setShowWondrousModal(false);
    setSelectedPredefinedId(null);
  };

  // Add Custom Wondrous Item
  const handleAddWondrousItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wondrousName.trim()) return;

    const invItemId = `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const parsedWeight = typeof wondrousWeight === 'number' ? wondrousWeight : 0;
    const finalSlot = wondrousTargetSlot || wondrousSlot || 'shoulders';

    const invItem: InventoryItem = {
      id: invItemId,
      name: wondrousName.trim(),
      quantity: 1,
      weight: parsedWeight,
      value: wondrousCost.trim() || undefined,
      notes: wondrousEffect.trim() || undefined,
      itemType: 'wondrous',
      bodySlot: finalSlot,
      location: 'Carried'
    };

    const newItem: WondrousItem = {
      id: `wondrous_${Date.now()}`,
      inventoryItemId: invItemId,
      name: wondrousName.trim(),
      slot: finalSlot,
      effect: wondrousEffect.trim(),
      weight: parsedWeight
    };

    const currentItems = eq.wondrousItems || [];
    onChange({
      equipment: { ...eq, wondrousItems: [...currentItems, newItem] },
      inventory: [...inventory, invItem]
    });

    setWondrousName('');
    setWondrousEffect('');
    setWondrousWeight('');
    setWondrousCost('');
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

  // Unequip item from a body slot without deleting it from inventory
  const handleUnequipSlotItem = (slotItem: SlotItem) => {
    if (slotItem.source === 'armor') {
      onChange({
        equipment: { ...eq, armor: 'none', armorItemId: undefined }
      });
      return;
    }
    const currentItems = eq.wondrousItems || [];
    const nextWondrous = currentItems.filter(i => i.id !== slotItem.id);
    onChange({
      equipment: { ...eq, wondrousItems: nextWondrous }
    });
  };

  // Equip an inventory item directly to a body slot
  const handleEquipInventoryItemToSlot = (invItem: InventoryItem, slot: BodySlotId) => {
    if (slot === 'armor') {
      handleEquipInventoryItem(invItem, 'armor');
      setBodySlotEquipPickerSlot(null);
      return;
    }

    const currentItems = eq.wondrousItems || [];
    // If the item was already equipped in another slot, remove it from that slot first
    const filteredWondrous = currentItems.filter(i => i.inventoryItemId !== invItem.id && !matchesItemName(i.name, invItem.name));
    const newWondrous: WondrousItem = {
      id: `wondrous_${Date.now()}`,
      inventoryItemId: invItem.id,
      name: invItem.name,
      slot,
      effect: invItem.notes || '',
      weight: invItem.weight || 0
    };

    const nextInv = inventory.map(i => {
      if (i.id === invItem.id) {
        return { ...i, itemType: 'wondrous' as const, bodySlot: slot };
      }
      return i;
    });

    onChange({
      equipment: { ...eq, wondrousItems: [...filteredWondrous, newWondrous] },
      inventory: nextInv
    });
    setBodySlotEquipPickerSlot(null);
  };

  // Ammunition Handlers
  const handleSetActiveAmmo = (ammoId: string) => {
    handleEqChange('equippedAmmoId', ammoId);
  };

  const handleUpdateAmmoQuantity = (ammoId: string, newQty: number) => {
    const nextInv = inventory.map(i => {
      if (i.id === ammoId) {
        return { ...i, quantity: Math.max(0, newQty) };
      }
      return i;
    });
    onChange({ inventory: nextInv });
  };

  const handleAdjustAmmoQuantity = (ammoId: string, delta: number) => {
    const item = inventory.find(i => i.id === ammoId);
    if (!item) return;
    const current = item.quantity || 0;
    handleUpdateAmmoQuantity(ammoId, current + delta);
  };

  const handleAddAmmoPreset = (preset: AmmoPreset) => {
    const newAmmo = createInventoryAmmo(preset);
    const nextInv = [...inventory, newAmmo];
    const nextEq = { ...eq };
    if (!nextEq.equippedAmmoId) {
      nextEq.equippedAmmoId = newAmmo.id;
    }
    onChange({
      inventory: nextInv,
      equipment: nextEq
    });
    setAmmoPresetDropdownOpen(false);
  };

  const handleCreateCustomAmmo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAmmoName.trim()) return;

    const newAmmo: InventoryItem = {
      id: `ammo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: customAmmoName.trim(),
      quantity: Math.max(1, customAmmoQuantity),
      weight: customAmmoWeight,
      location: customAmmoLocation || 'Quiver',
      value: customAmmoValue,
      notes: customAmmoNotes,
      material: customAmmoMaterial !== 'standard' ? customAmmoMaterial : undefined,
      enhancementBonus: customAmmoEnhancement > 0 ? customAmmoEnhancement : undefined,
      specialQualities: customAmmoQualities.length > 0 ? customAmmoQualities : undefined,
      isMasterwork: customAmmoMasterwork,
      itemType: 'ammunition',
      ammoType: customAmmoType
    };

    const nextInv = [...inventory, newAmmo];
    const nextEq = { ...eq };
    if (!nextEq.equippedAmmoId) {
      nextEq.equippedAmmoId = newAmmo.id;
    }

    onChange({
      inventory: nextInv,
      equipment: nextEq
    });

    setCustomAmmoName('');
    setCustomAmmoQuantity(20);
    setCustomAmmoEnhancement(0);
    setCustomAmmoMaterial('standard');
    setCustomAmmoQualities([]);
    setCustomAmmoWeight(3);
    setCustomAmmoValue('1 gp');
    setCustomAmmoLocation('Quiver');
    setCustomAmmoNotes('');
    setCustomAmmoMasterwork(false);
    setShowCustomAmmoModal(false);
  };

  const handleRemoveAmmo = (ammoId: string) => {
    const nextInv = inventory.filter(i => i.id !== ammoId);
    const nextEq = { ...eq };
    if (nextEq.equippedAmmoId === ammoId) {
      const remainingAmmo = nextInv.find(i => i.itemType === 'ammunition');
      nextEq.equippedAmmoId = remainingAmmo ? remainingAmmo.id : undefined;
    }
    onChange({
      inventory: nextInv,
      equipment: nextEq
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
            onClick={() => openWondrousModal()}
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

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-5">
              <label className="label-text">Equipped Armor</label>
              <SearchableSelect
                value={selectedArmorValue}
                options={armorOptions}
                onChange={val => handleEqChange('armor', val)}
                placeholder="Select equipped armor..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label-text">Enhancement</label>
              <SearchableSelect
                value={String(eq.armorEnhancement || 0)}
                options={armorEnhancementOptions}
                onChange={val => handleEqChange('armorEnhancement', parseInt(val) || 0)}
                showSublabelInTrigger={false}
                placeholder="Enh..."
              />
            </div>
            <div className="sm:col-span-3">
              <label className="label-text">Armor Material</label>
              <SearchableSelect
                value={eq.armorMaterial || 'standard'}
                options={ARMOR_MATERIAL_OPTIONS}
                onChange={val => handleEqChange('armorMaterial', val)}
                showSublabelInTrigger={false}
                placeholder="Material..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label-text">Masterwork</label>
              <label className={`flex items-center gap-2 h-[38px] px-3 rounded-xl border text-xs select-none transition ${
                !eq.armor || eq.armor === 'none'
                  ? 'bg-slate-950/40 border-slate-800/40 text-slate-600 cursor-not-allowed'
                  : isArmorInherentlyMwk
                    ? 'bg-slate-950/40 border-slate-800/60 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50 text-slate-300 cursor-pointer'
              }`}>
                <input
                  type="checkbox"
                  checked={isArmorMwk}
                  disabled={!eq.armor || eq.armor === 'none' || isArmorInherentlyMwk}
                  onChange={e => handleEqChange('armorMasterwork', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                />
                <span className="font-medium text-[11px] truncate">
                  {isArmorInherentlyMwk ? 'Mwk (Auto)' : 'Masterwork'}
                </span>
              </label>
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

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-5">
              <label className="label-text">Equipped Shield</label>
              <SearchableSelect
                value={selectedShieldValue}
                options={shieldOptions}
                onChange={val => handleEqChange('shield', val)}
                placeholder="Select equipped shield..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label-text">Enhancement</label>
              <SearchableSelect
                value={String(eq.shieldEnhancement || 0)}
                options={armorEnhancementOptions}
                onChange={val => handleEqChange('shieldEnhancement', parseInt(val) || 0)}
                showSublabelInTrigger={false}
                placeholder="Enh..."
              />
            </div>
            <div className="sm:col-span-3">
              <label className="label-text">Shield Material</label>
              <SearchableSelect
                value={eq.shieldMaterial || 'standard'}
                options={SHIELD_MATERIAL_OPTIONS}
                onChange={val => handleEqChange('shieldMaterial', val)}
                showSublabelInTrigger={false}
                placeholder="Material..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label-text">Masterwork</label>
              <label className={`flex items-center gap-2 h-[38px] px-3 rounded-xl border text-xs select-none transition ${
                !eq.shield || eq.shield === 'none'
                  ? 'bg-slate-950/40 border-slate-800/40 text-slate-600 cursor-not-allowed'
                  : isShieldInherentlyMwk
                    ? 'bg-slate-950/40 border-slate-800/60 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50 text-slate-300 cursor-pointer'
              }`}>
                <input
                  type="checkbox"
                  checked={isShieldMwk}
                  disabled={!eq.shield || eq.shield === 'none' || isShieldInherentlyMwk}
                  onChange={e => handleEqChange('shieldMasterwork', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                />
                <span className="font-medium text-[11px] truncate">
                  {isShieldInherentlyMwk ? 'Mwk (Auto)' : 'Masterwork'}
                </span>
              </label>
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

          {/* 3.5e 12-Body-Slot Affinity Validator & Equipment Doll */}
          <div className="border-t border-slate-800 pt-4 space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <i className="fa-solid fa-gem"></i> 3.5e Body Slot Affinity & Equipment Doll
                </h3>
                <p className="text-[10px] text-slate-400">
                  {bodySlotReport.totalOccupiedSlots} of 13 slots occupied
                  {bodySlotReport.totalConflicts > 0 ? (
                    <span className="text-rose-400 font-bold ml-1.5">• {bodySlotReport.totalConflicts} conflict{bodySlotReport.totalConflicts > 1 ? 's' : ''}!</span>
                  ) : (
                    <span className="text-emerald-400 font-medium ml-1.5">• All slots valid</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex items-center">
                  <button
                    type="button"
                    onClick={() => setBodySlotViewMode('grid')}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                      bodySlotViewMode === 'grid'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Card Grid View"
                  >
                    <i className="fa-solid fa-table-cells-large"></i> Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setBodySlotViewMode('doll')}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                      bodySlotViewMode === 'doll'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Paper Doll Layout"
                  >
                    <i className="fa-solid fa-child text-xs"></i> Doll
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => openWondrousModal()}
                  className="btn btn-secondary text-xs py-1 px-2.5 flex items-center gap-1.5 cursor-pointer"
                  title="Add Magic Item to Body Slots"
                >
                  <i className="fa-solid fa-plus text-purple-400"></i> Add Item
                </button>
              </div>
            </div>

            {/* Slot Conflicts Alert Banner */}
            {bodySlotReport.totalConflicts > 0 && (
              <div className="p-3 bg-rose-950/70 border border-rose-500/70 rounded-xl text-xs space-y-2 shadow-lg animate-pulse">
                <div className="flex items-center gap-2 text-rose-300 font-bold">
                  <i className="fa-solid fa-triangle-exclamation text-rose-400 text-sm"></i>
                  <span>Body Slot Conflicts Detected ({bodySlotReport.totalConflicts})</span>
                </div>
                <p className="text-rose-200/90 text-[11px] leading-relaxed">
                  In D&D 3.5e rules (DMG p. 214 & MIC Ch. 6), a character can only wear <strong>one item per body slot</strong> (and two rings). Items in conflicting slots do not function simultaneously.
                </p>
                <div className="space-y-1 pt-1">
                  {bodySlotReport.conflictSummary.map((conf, idx) => (
                    <div key={idx} className="bg-rose-900/50 px-2.5 py-1 rounded text-rose-200 font-mono text-[10.5px] border border-rose-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <i className="fa-solid fa-ban text-[10px] text-rose-400"></i>
                        <span>{conf}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CARD GRID VIEW */}
            {bodySlotViewMode === 'grid' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {CANONICAL_BODY_SLOTS.filter(s => s.id !== 'slotless').map(slotDef => {
                    const report = bodySlotReport.slots[slotDef.id];
                    const isConflict = report?.hasConflict;
                    const isOccupied = report?.isOccupied;

                    return (
                      <div
                        key={slotDef.id}
                        className={`p-2.5 rounded-xl border transition flex flex-col justify-between text-xs gap-2 ${
                          isConflict
                            ? 'bg-rose-950/40 border-rose-500/80 ring-1 ring-rose-500/50 shadow-rose-950/40'
                            : isOccupied
                            ? 'bg-slate-950/80 border-purple-500/40'
                            : 'bg-slate-950/30 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        {/* Slot Header */}
                        <div className="flex items-center justify-between gap-1.5 border-b border-slate-800/60 pb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <i className={`${slotDef.icon} ${isConflict ? 'text-rose-400' : isOccupied ? 'text-purple-400' : 'text-slate-500'} text-xs`}></i>
                            <span className="font-bold text-slate-200 text-xs truncate">{slotDef.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {isConflict ? (
                              <span className="badge bg-rose-900 text-rose-200 text-[9px] font-mono font-bold">
                                CONFLICT
                              </span>
                            ) : isOccupied ? (
                              <span className="badge bg-purple-900/60 text-purple-300 text-[9px] font-mono">
                                Equipped
                              </span>
                            ) : (
                              <span className="badge bg-slate-900 text-slate-500 text-[9px] font-mono">
                                Empty
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 3.5e Affinity Tooltip/Subtext */}
                        <div className="text-[10px] text-slate-400 italic line-clamp-1" title={`3.5e Affinity: ${slotDef.affinity}\nExamples: ${slotDef.examples.join(', ')}`}>
                          <span className="text-slate-500 not-italic mr-1">Affinity:</span>{slotDef.affinity}
                        </div>

                        {/* Slot Items / Content */}
                        <div className="space-y-1.5 min-h-[38px] flex flex-col justify-center">
                          {isOccupied ? (
                            report.equippedItems.map(item => (
                              <div
                                key={item.id}
                                className={`p-1.5 rounded-lg border flex items-center justify-between text-xs gap-2 ${
                                  isConflict
                                    ? 'bg-rose-950/60 border-rose-800/80 text-rose-200'
                                    : 'bg-slate-900/90 border-slate-800 text-slate-200'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`font-bold text-xs truncate ${item.source === 'armor' ? 'text-cyan-300' : 'text-amber-300'}`}>
                                      {item.name}
                                    </span>
                                    <span className={`badge text-[8.5px] font-mono uppercase px-1 py-0 ${
                                      item.source === 'armor' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60' : 'bg-purple-950 text-purple-300 border border-purple-800/60'
                                    }`}>
                                      {item.source === 'armor' ? 'Armor' : 'Magic'}
                                    </span>
                                  </div>
                                  {item.effect && (
                                    <p className="text-[10px] text-slate-400 truncate" title={item.effect}>{item.effect}</p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleUnequipSlotItem(item)}
                                  className="text-slate-400 hover:text-rose-400 p-1 text-xs cursor-pointer"
                                  title={`Unequip ${item.name}`}
                                >
                                  <i className="fa-solid fa-xmark"></i>
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center justify-between text-slate-500 text-xs py-0.5">
                              <span className="italic text-[11px]">No item equipped</span>
                              <button
                                type="button"
                                onClick={() => openWondrousModal(slotDef.id)}
                                className="text-[10.5px] text-purple-400 hover:text-purple-300 hover:underline font-mono flex items-center gap-1 cursor-pointer"
                              >
                                <i className="fa-solid fa-plus text-[9px]"></i> Equip
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PAPER DOLL LAYOUT VIEW */}
            {bodySlotViewMode === 'doll' && (
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center border-b border-slate-800/80 pb-2 flex items-center justify-center gap-2">
                  <i className="fa-solid fa-child text-purple-400"></i> Interactive 3.5e Anatomical Equipment Doll
                </div>

                <div className="max-w-md mx-auto space-y-2.5">
                  {/* Row 1: Head & Eyes */}
                  <div className="grid grid-cols-2 gap-2">
                    {['head', 'headband'].map(slotId => {
                      const slotDef = BODY_SLOT_MAP[slotId as BodySlotId];
                      const rep = bodySlotReport.slots[slotId as BodySlotId];
                      return (
                        <div
                          key={slotId}
                          onClick={() => {
                            if (!rep?.isOccupied) {
                              openWondrousModal(slotId as BodySlotId);
                            }
                          }}
                          className={`p-2 rounded-xl border text-center cursor-pointer transition ${
                            rep?.hasConflict
                              ? 'bg-rose-950/60 border-rose-500 ring-1 ring-rose-500'
                              : rep?.isOccupied
                              ? 'bg-slate-900 border-purple-500/50 shadow-xs'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1 text-slate-300 text-xs font-bold">
                            <i className={`${slotDef.icon} ${rep?.hasConflict ? 'text-rose-400' : rep?.isOccupied ? 'text-purple-400' : 'text-slate-500'}`}></i>
                            <span>{slotDef.name}</span>
                          </div>
                          <div className="mt-1 text-xs truncate">
                            {rep?.isOccupied ? (
                              <span className="font-bold text-amber-300 truncate block">
                                {rep.equippedItems.map(i => i.name).join(', ')}
                              </span>
                            ) : (
                              <span className="text-slate-500 italic text-[10.5px]">+ Equip</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Row 2: Shoulders & Neck */}
                  <div className="grid grid-cols-2 gap-2">
                    {['shoulders', 'neck'].map(slotId => {
                      const slotDef = BODY_SLOT_MAP[slotId as BodySlotId];
                      const rep = bodySlotReport.slots[slotId as BodySlotId];
                      return (
                        <div
                          key={slotId}
                          onClick={() => {
                            if (!rep?.isOccupied) {
                              openWondrousModal(slotId as BodySlotId);
                            }
                          }}
                          className={`p-2 rounded-xl border text-center cursor-pointer transition ${
                            rep?.hasConflict
                              ? 'bg-rose-950/60 border-rose-500 ring-1 ring-rose-500'
                              : rep?.isOccupied
                              ? 'bg-slate-900 border-purple-500/50 shadow-xs'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1 text-slate-300 text-xs font-bold">
                            <i className={`${slotDef.icon} ${rep?.hasConflict ? 'text-rose-400' : rep?.isOccupied ? 'text-purple-400' : 'text-slate-500'}`}></i>
                            <span>{slotDef.name}</span>
                          </div>
                          <div className="mt-1 text-xs truncate">
                            {rep?.isOccupied ? (
                              <span className="font-bold text-amber-300 truncate block">
                                {rep.equippedItems.map(i => i.name).join(', ')}
                              </span>
                            ) : (
                              <span className="text-slate-500 italic text-[10.5px]">+ Equip</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Row 3: Armor, Chest & Body */}
                  <div className="grid grid-cols-3 gap-2">
                    {['armor', 'chest', 'body'].map(slotId => {
                      const slotDef = BODY_SLOT_MAP[slotId as BodySlotId];
                      const rep = bodySlotReport.slots[slotId as BodySlotId];
                      return (
                        <div
                          key={slotId}
                          onClick={() => {
                            if (!rep?.isOccupied) {
                              openWondrousModal(slotId as BodySlotId);
                            }
                          }}
                          className={`p-2 rounded-xl border text-center cursor-pointer transition ${
                            rep?.hasConflict
                              ? 'bg-rose-950/60 border-rose-500 ring-1 ring-rose-500'
                              : rep?.isOccupied
                              ? 'bg-slate-900 border-purple-500/50 shadow-xs'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1 text-slate-300 text-xs font-bold">
                            <i className={`${slotDef.icon} ${rep?.hasConflict ? 'text-rose-400' : rep?.isOccupied ? 'text-purple-400' : 'text-slate-500'}`}></i>
                            <span className="truncate">{slotDef.name}</span>
                          </div>
                          <div className="mt-1 text-xs truncate">
                            {rep?.isOccupied ? (
                              <span className="font-bold text-amber-300 truncate block text-[11px]">
                                {rep.equippedItems.map(i => i.name).join(', ')}
                              </span>
                            ) : (
                              <span className="text-slate-500 italic text-[10.5px]">+ Equip</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Row 4: Arms, Hands, Ring 1, Ring 2 */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {['arms', 'hands', 'ring1', 'ring2'].map(slotId => {
                      const slotDef = BODY_SLOT_MAP[slotId as BodySlotId];
                      const rep = bodySlotReport.slots[slotId as BodySlotId];
                      return (
                        <div
                          key={slotId}
                          onClick={() => {
                            if (!rep?.isOccupied) {
                              openWondrousModal(slotId as BodySlotId);
                            }
                          }}
                          className={`p-1.5 rounded-xl border text-center cursor-pointer transition ${
                            rep?.hasConflict
                              ? 'bg-rose-950/60 border-rose-500 ring-1 ring-rose-500'
                              : rep?.isOccupied
                              ? 'bg-slate-900 border-purple-500/50 shadow-xs'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1 text-slate-300 text-[11px] font-bold">
                            <i className={`${slotDef.icon} ${rep?.hasConflict ? 'text-rose-400' : rep?.isOccupied ? 'text-purple-400' : 'text-slate-500'} text-[10px]`}></i>
                            <span className="truncate">{slotDef.name}</span>
                          </div>
                          <div className="mt-1 text-[10.5px] truncate">
                            {rep?.isOccupied ? (
                              <span className="font-bold text-amber-300 truncate block">
                                {rep.equippedItems.map(i => i.name).join(', ')}
                              </span>
                            ) : (
                              <span className="text-slate-500 italic text-[10px]">+ Equip</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Row 5: Waist */}
                  <div className="max-w-[200px] mx-auto">
                    {['waist'].map(slotId => {
                      const slotDef = BODY_SLOT_MAP[slotId as BodySlotId];
                      const rep = bodySlotReport.slots[slotId as BodySlotId];
                      return (
                        <div
                          key={slotId}
                          onClick={() => {
                            if (!rep?.isOccupied) {
                              openWondrousModal(slotId as BodySlotId);
                            }
                          }}
                          className={`p-2 rounded-xl border text-center cursor-pointer transition ${
                            rep?.hasConflict
                              ? 'bg-rose-950/60 border-rose-500 ring-1 ring-rose-500'
                              : rep?.isOccupied
                              ? 'bg-slate-900 border-purple-500/50 shadow-xs'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1 text-slate-300 text-xs font-bold">
                            <i className={`${slotDef.icon} ${rep?.hasConflict ? 'text-rose-400' : rep?.isOccupied ? 'text-purple-400' : 'text-slate-500'}`}></i>
                            <span>{slotDef.name}</span>
                          </div>
                          <div className="mt-1 text-xs truncate">
                            {rep?.isOccupied ? (
                              <span className="font-bold text-amber-300 truncate block">
                                {rep.equippedItems.map(i => i.name).join(', ')}
                              </span>
                            ) : (
                              <span className="text-slate-500 italic text-[10.5px]">+ Equip</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Row 6: Feet */}
                  <div className="max-w-[200px] mx-auto">
                    {['feet'].map(slotId => {
                      const slotDef = BODY_SLOT_MAP[slotId as BodySlotId];
                      const rep = bodySlotReport.slots[slotId as BodySlotId];
                      return (
                        <div
                          key={slotId}
                          onClick={() => {
                            if (!rep?.isOccupied) {
                              openWondrousModal(slotId as BodySlotId);
                            }
                          }}
                          className={`p-2 rounded-xl border text-center cursor-pointer transition ${
                            rep?.hasConflict
                              ? 'bg-rose-950/60 border-rose-500 ring-1 ring-rose-500'
                              : rep?.isOccupied
                              ? 'bg-slate-900 border-purple-500/50 shadow-xs'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1 text-slate-300 text-xs font-bold">
                            <i className={`${slotDef.icon} ${rep?.hasConflict ? 'text-rose-400' : rep?.isOccupied ? 'text-purple-400' : 'text-slate-500'}`}></i>
                            <span>{slotDef.name}</span>
                          </div>
                          <div className="mt-1 text-xs truncate">
                            {rep?.isOccupied ? (
                              <span className="font-bold text-amber-300 truncate block">
                                {rep.equippedItems.map(i => i.name).join(', ')}
                              </span>
                            ) : (
                              <span className="text-slate-500 italic text-[10.5px]">+ Equip</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Slotless / Wondrous Gear Section */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs pb-1.5">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <i className="fa-solid fa-wand-magic-sparkles text-purple-400"></i> Slotless Items & Wondrous Instruments
                </span>
                <button
                  type="button"
                  onClick={() => openWondrousModal('slotless')}
                  className="text-[10.5px] text-purple-400 hover:text-purple-300 font-mono flex items-center gap-1 cursor-pointer"
                >
                  <i className="fa-solid fa-plus"></i> Add Slotless
                </button>
              </div>
              {((bodySlotReport.slots.slotless?.equippedItems) || []).length === 0 ? (
                <p className="text-[11px] text-slate-500 italic p-2 text-center bg-slate-950/40 rounded-xl">
                  No slotless items (e.g. Ioun Stones, Handy Haversack, Figurines of Wondrous Power).
                </p>
              ) : (
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {bodySlotReport.slots.slotless.equippedItems.map(item => (
                    <div key={item.id} className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-amber-300 truncate block">{item.name}</span>
                        {item.effect && <p className="text-[10.5px] text-slate-400 truncate">{item.effect}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnequipSlotItem(item)}
                        className="text-slate-500 hover:text-rose-400 p-1 text-xs cursor-pointer"
                        title="Remove Item"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-5 space-y-1.5">
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
              <div className="sm:col-span-2">
                <SearchableSelect
                  value={String(eq.primaryWeaponEnhancement || 0)}
                  options={weaponEnhancementOptions}
                  onChange={val => handleEqChange('primaryWeaponEnhancement', parseInt(val) || 0)}
                  showSublabelInTrigger={false}
                  placeholder="Enh..."
                />
              </div>
              <div className="sm:col-span-3">
                <SearchableSelect
                  value={eq.primaryWeaponMaterial || 'standard'}
                  options={WEAPON_MATERIAL_OPTIONS}
                  onChange={val => handleEqChange('primaryWeaponMaterial', val)}
                  showSublabelInTrigger={false}
                  placeholder="Material..."
                />
              </div>
              <div className="sm:col-span-2">
                <label className={`flex items-center gap-2 h-[38px] px-3 rounded-xl border text-xs select-none transition ${
                  !hasPrimary
                    ? 'bg-slate-950/40 border-slate-800/40 text-slate-600 cursor-not-allowed'
                    : isPrimaryInherentlyMwk
                      ? 'bg-slate-950/40 border-slate-800/60 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50 text-slate-300 cursor-pointer'
                }`}>
                  <input
                    type="checkbox"
                    checked={isPrimaryMwk}
                    disabled={!hasPrimary || isPrimaryInherentlyMwk}
                    onChange={e => handleEqChange('primaryWeaponMasterwork', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="font-medium text-[11px] truncate">
                    {isPrimaryInherentlyMwk ? 'Mwk (Auto)' : 'Masterwork'}
                  </span>
                </label>
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
                baneTarget={eq.primaryWeaponBaneTarget}
                onEditBaneTarget={() => openBaneModal('primaryWeaponQualities')}
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
                      {getWeaponMaterialTraits(primaryWpnObj.material || eq.primaryWeaponMaterial, isPrimaryMwk || Boolean(primaryWpnObj.isMasterwork)).map(trait => (
                        <span key={trait} className="text-[10px] text-zinc-300 font-semibold">
                          • {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <button
                      onClick={() => rollAttack(primaryTotalAtk, `${primaryWpnObj.name} Attack`, primaryWpnObj, { threatMin: primaryThreat, damageBonus: primaryDmgVal, damageFormula: primaryDamageFormula })}
                      className="font-mono text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 font-bold text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title={`Click to roll ${primaryWpnObj.name} Attack`}
                    >
                      <i className="fa-solid fa-dice-d20 text-xs"></i>
                      <span>{primaryTotalAtk >= 0 ? '+' : ''}{primaryTotalAtk} Melee</span>
                    </button>
                    {primaryBaneAtk && (
                      <button
                        onClick={() => rollAttack(primaryBaneAtk.atkBonus, primaryBaneAtk.label, primaryWpnObj, { threatMin: primaryThreat, damageBonus: primaryDmgVal, damageFormula: primaryDamageFormula })}
                        className="font-mono text-red-400 hover:text-red-300 hover:bg-red-500/20 px-2 py-1 rounded-lg border border-red-500/30 font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow-xs"
                        title={`Click to roll ${primaryBaneAtk.label}`}
                      >
                        <i className="fa-solid fa-bullseye text-xs text-red-400"></i>
                        <span>{primaryBaneAtk.atkBonus >= 0 ? '+' : ''}{primaryBaneAtk.atkBonus} Melee ({primaryBaneAtk.condition})</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-5 space-y-1.5">
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
              <div className="sm:col-span-2">
                <SearchableSelect
                  value={String(eq.secondaryWeaponEnhancement || 0)}
                  options={weaponEnhancementOptions}
                  onChange={val => handleEqChange('secondaryWeaponEnhancement', parseInt(val) || 0)}
                  showSublabelInTrigger={false}
                  placeholder="Enh..."
                />
              </div>
              <div className="sm:col-span-3">
                <SearchableSelect
                  value={eq.secondaryWeaponMaterial || 'standard'}
                  options={WEAPON_MATERIAL_OPTIONS}
                  onChange={val => handleEqChange('secondaryWeaponMaterial', val)}
                  showSublabelInTrigger={false}
                  placeholder="Material..."
                />
              </div>
              <div className="sm:col-span-2">
                <label className={`flex items-center gap-2 h-[38px] px-3 rounded-xl border text-xs select-none transition ${
                  !hasSecondary
                    ? 'bg-slate-950/40 border-slate-800/40 text-slate-600 cursor-not-allowed'
                    : isSecondaryInherentlyMwk
                      ? 'bg-slate-950/40 border-slate-800/60 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50 text-slate-300 cursor-pointer'
                }`}>
                  <input
                    type="checkbox"
                    checked={isSecondaryMwk}
                    disabled={!hasSecondary || isSecondaryInherentlyMwk}
                    onChange={e => handleEqChange('secondaryWeaponMasterwork', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="font-medium text-[11px] truncate">
                    {isSecondaryInherentlyMwk ? 'Mwk (Auto)' : 'Masterwork'}
                  </span>
                </label>
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
                baneTarget={eq.secondaryWeaponBaneTarget}
                onEditBaneTarget={() => openBaneModal('secondaryWeaponQualities')}
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
                    {getWeaponMaterialTraits(secondaryWpnObj.material || eq.secondaryWeaponMaterial, isSecondaryMwk || Boolean(secondaryWpnObj.isMasterwork)).map(trait => (
                      <span key={trait} className="text-[10px] text-zinc-300 font-semibold">
                        ({trait})
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => rollAttack(secondaryTotalAtk, `${secondaryWpnObj.name} Off-Hand Attack`, secondaryWpnObj, { threatMin: secondaryThreat, damageBonus: secondaryDmgVal, damageFormula: secondaryDamageFormula })}
                      className="font-mono text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 font-bold transition flex items-center gap-1 cursor-pointer"
                      title={`Click to roll ${secondaryWpnObj.name} Off-Hand Attack`}
                    >
                      <i className="fa-solid fa-dice-d20 text-[10px]"></i>
                      <span>{secondaryTotalAtk >= 0 ? '+' : ''}{secondaryTotalAtk} Atk</span>
                    </button>
                    {secondaryBaneAtk && (
                      <button
                        onClick={() => rollAttack(secondaryBaneAtk.atkBonus, secondaryBaneAtk.label, secondaryWpnObj, { threatMin: secondaryThreat, damageBonus: secondaryDmgVal, damageFormula: secondaryDamageFormula })}
                        className="font-mono text-red-400 hover:text-red-300 hover:bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                        title={`Click to roll ${secondaryBaneAtk.label}`}
                      >
                        <i className="fa-solid fa-bullseye text-[10px] text-red-400"></i>
                        <span>{secondaryBaneAtk.atkBonus >= 0 ? '+' : ''}{secondaryBaneAtk.atkBonus} Atk ({secondaryBaneAtk.condition})</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-5 space-y-1.5">
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
              <div className="sm:col-span-2">
                <SearchableSelect
                  value={String(eq.rangedWeaponEnhancement || 0)}
                  options={weaponEnhancementOptions}
                  onChange={val => handleEqChange('rangedWeaponEnhancement', parseInt(val) || 0)}
                  showSublabelInTrigger={false}
                  placeholder="Enh..."
                />
              </div>
              <div className="sm:col-span-3">
                <SearchableSelect
                  value={eq.rangedWeaponMaterial || 'standard'}
                  options={WEAPON_MATERIAL_OPTIONS}
                  onChange={val => handleEqChange('rangedWeaponMaterial', val)}
                  showSublabelInTrigger={false}
                  placeholder="Material..."
                />
              </div>
              <div className="sm:col-span-2">
                <label className={`flex items-center gap-2 h-[38px] px-3 rounded-xl border text-xs select-none transition ${
                  !hasRanged
                    ? 'bg-slate-950/40 border-slate-800/40 text-slate-600 cursor-not-allowed'
                    : isRangedInherentlyMwk
                      ? 'bg-slate-950/40 border-slate-800/60 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50 text-slate-300 cursor-pointer'
                }`}>
                  <input
                    type="checkbox"
                    checked={isRangedMwk}
                    disabled={!hasRanged || isRangedInherentlyMwk}
                    onChange={e => handleEqChange('rangedWeaponMasterwork', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="font-medium text-[11px] truncate">
                    {isRangedInherentlyMwk ? 'Mwk (Auto)' : 'Masterwork'}
                  </span>
                </label>
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
                baneTarget={eq.rangedWeaponBaneTarget}
                onEditBaneTarget={() => openBaneModal('rangedWeaponQualities')}
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
                    {getWeaponMaterialTraits(rangedWpnObj.material || eq.rangedWeaponMaterial, isRangedMwk || Boolean(rangedWpnObj.isMasterwork)).map(trait => (
                      <span key={trait} className="text-[10px] text-zinc-300 font-semibold">
                        ({trait})
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => {
                        if (eq.autoDecrementAmmo) {
                          const result = decrementEquippedAmmunition(character, 1);
                          if (result.ammoItem) {
                            onChange(result.updatedCharacter);
                            setAmmoRollFeedback(result.message);
                            setTimeout(() => setAmmoRollFeedback(null), 4500);
                          } else {
                            setAmmoRollFeedback('⚠️ ' + result.message);
                            setTimeout(() => setAmmoRollFeedback(null), 4500);
                          }
                        }
                        rollAttack(rangedTotalAtk, `${rangedWpnObj.name} Ranged Attack`, rangedWpnObj, { threatMin: rangedThreat, damageBonus: rangedDmgVal, damageFormula: rangedDamageFormula });
                      }}
                      className="font-mono text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30 font-bold transition flex items-center gap-1 cursor-pointer"
                      title={`Click to roll ${rangedWpnObj.name} Ranged Attack`}
                    >
                      <i className="fa-solid fa-dice-d20 text-[10px]"></i>
                      <span>{rangedTotalAtk >= 0 ? '+' : ''}{rangedTotalAtk} Ranged</span>
                    </button>
                    {rangedBaneAtk && (
                      <button
                        onClick={() => {
                          if (eq.autoDecrementAmmo) {
                            const result = decrementEquippedAmmunition(character, 1);
                            if (result.ammoItem) {
                              onChange(result.updatedCharacter);
                              setAmmoRollFeedback(result.message);
                              setTimeout(() => setAmmoRollFeedback(null), 4500);
                            } else {
                              setAmmoRollFeedback('⚠️ ' + result.message);
                              setTimeout(() => setAmmoRollFeedback(null), 4500);
                            }
                          }
                          rollAttack(rangedBaneAtk.atkBonus, rangedBaneAtk.label, rangedWpnObj, { threatMin: rangedThreat, damageBonus: rangedDmgVal, damageFormula: rangedDamageFormula });
                        }}
                        className="font-mono text-red-400 hover:text-red-300 hover:bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                        title={`Click to roll ${rangedBaneAtk.label}`}
                      >
                        <i className="fa-solid fa-bullseye text-[10px] text-red-400"></i>
                        <span>{rangedBaneAtk.atkBonus >= 0 ? '+' : ''}{rangedBaneAtk.atkBonus} Ranged ({rangedBaneAtk.condition})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Auto-Decrement Feedback Alert */}
                {ammoRollFeedback && (
                  <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-500/50 text-cyan-200 text-xs flex items-center gap-2 animate-pulse">
                    <i className="fa-solid fa-arrows-rotate text-cyan-400"></i>
                    <span className="font-mono text-[11px]">{ammoRollFeedback}</span>
                  </div>
                )}

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

          {/* Ammunition Tracker & Quiver Section */}
          <div className="border-t border-slate-800 pt-5 space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <i className="fa-solid fa-bullseye text-sm"></i>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    Ammunition Tracker & Quiver
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Arrows, Crossbow Bolts, Sling Bullets ({characterAmmunition.length} tracked)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Auto-Decrement Toggle */}
                <label className="flex items-center gap-1.5 cursor-pointer bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-slate-700 transition" title="Automatically subtracts 1 ammo when executing ranged attack rolls">
                  <input
                    type="checkbox"
                    checked={Boolean(eq.autoDecrementAmmo)}
                    onChange={e => handleEqChange('autoDecrementAmmo', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500/20 text-xs"
                  />
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    <i className="fa-solid fa-arrows-rotate text-[9px] text-cyan-400"></i> Auto-Decrement
                  </span>
                </label>

                {/* Preset Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setAmmoPresetDropdownOpen(!ammoPresetDropdownOpen)}
                    className="btn btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1 cursor-pointer"
                  >
                    <i className="fa-solid fa-plus text-amber-400"></i> Standard Ammo <i className="fa-solid fa-chevron-down text-[9px] opacity-70"></i>
                  </button>
                  {ammoPresetDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 p-1.5 space-y-1 max-h-64 overflow-y-auto">
                      <div className="text-[9px] font-bold uppercase text-slate-400 px-2 py-0.5 border-b border-slate-800">
                        Select Standard Ammo Preset
                      </div>
                      {STANDARD_AMMO_PRESETS.map(preset => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleAddAmmoPreset(preset)}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-800/80 transition flex items-center justify-between text-xs cursor-pointer group"
                        >
                          <div>
                            <div className="font-bold text-slate-200 group-hover:text-amber-300 text-[11px]">{preset.name}</div>
                            <div className="text-[9.5px] text-slate-400">{preset.value} • {preset.weight} lb • {preset.location}</div>
                          </div>
                          <span className="badge bg-slate-800 text-amber-400 text-[9px] font-mono">+{preset.quantity}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Ammo Button */}
                <button
                  type="button"
                  onClick={() => setShowCustomAmmoModal(true)}
                  className="btn btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1 cursor-pointer"
                >
                  <i className="fa-solid fa-plus text-slate-400"></i> Custom
                </button>
              </div>
            </div>

            {/* List of Ammunition */}
            {characterAmmunition.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center space-y-1">
                <p className="text-xs text-slate-400 italic">No ammunition currently in inventory.</p>
                <p className="text-[10.5px] text-slate-500">Add Arrows, Crossbow Bolts, or Sling Bullets to track ammunition counts and enable auto-decrement on attack rolls.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {characterAmmunition.map(ammo => {
                  const isActive = eq.equippedAmmoId === ammo.id;
                  const qty = ammo.quantity || 0;
                  const isDepleted = qty === 0;
                  const isLow = qty > 0 && qty <= 5;

                  return (
                    <div
                      key={ammo.id}
                      className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-amber-950/25 border-amber-500/50 shadow-xs'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {/* Active Loaded Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleSetActiveAmmo(ammo.id)}
                          className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                            isActive
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-amber-400 hover:border-amber-500/40'
                          }`}
                          title={isActive ? 'Active ammunition loaded in quiver' : 'Click to set as active loaded ammunition'}
                        >
                          <i className="fa-solid fa-crosshairs"></i>
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-bold text-xs truncate ${isActive ? 'text-amber-300' : 'text-slate-200'}`}>
                              {ammo.name}
                            </span>
                            {ammo.ammoType && (
                              <span className="badge bg-slate-800 text-slate-400 text-[9px] font-mono uppercase">
                                {ammo.ammoType}
                              </span>
                            )}
                            {ammo.enhancementBonus ? (
                              <span className="badge bg-amber-900/60 text-amber-300 text-[9px] font-mono font-bold">
                                +{ammo.enhancementBonus}
                              </span>
                            ) : null}
                            {ammo.isMasterwork && !ammo.enhancementBonus && (
                              <span className="badge bg-blue-900/50 text-blue-300 text-[9px] font-mono">
                                MWK
                              </span>
                            )}
                            {ammo.material && ammo.material !== 'standard' && (
                              <span className="badge bg-zinc-800 text-zinc-300 text-[9px] font-mono">
                                {ammo.material.replace('_', ' ')}
                              </span>
                            )}
                            {isActive && (
                              <span className="badge bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold">
                                ACTIVE
                              </span>
                            )}
                            {isDepleted ? (
                              <span className="badge bg-rose-900/80 text-rose-300 text-[9px] font-bold">
                                DEPLETED
                              </span>
                            ) : isLow ? (
                              <span className="badge bg-amber-900/80 text-amber-300 text-[9px] font-bold">
                                LOW AMMO
                              </span>
                            ) : null}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>Loc: {ammo.location || 'Quiver'}</span>
                            <span>•</span>
                            <span>Weight: {(qty * (ammo.weight || 0)).toFixed(1)} lb</span>
                            {ammo.notes && (
                              <>
                                <span>•</span>
                                <span className="truncate text-slate-500">{ammo.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Stepper Controls */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAdjustAmmoQuantity(ammo.id, -5)}
                          disabled={qty === 0}
                          className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-800 text-[10px] font-bold transition flex items-center justify-center cursor-pointer"
                          title="Decrease by 5"
                        >
                          -5
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustAmmoQuantity(ammo.id, -1)}
                          disabled={qty === 0}
                          className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-800 text-xs font-bold transition flex items-center justify-center cursor-pointer"
                          title="Decrease by 1"
                        >
                          -1
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={qty}
                          onChange={e => handleUpdateAmmoQuantity(ammo.id, parseInt(e.target.value) || 0)}
                          className={`w-12 h-6 text-center font-mono font-bold text-xs rounded border bg-slate-950 px-1 ${
                            isDepleted
                              ? 'text-rose-400 border-rose-800'
                              : isLow
                              ? 'text-amber-400 border-amber-800'
                              : 'text-slate-200 border-slate-800'
                          }`}
                          title="Direct Quantity Input"
                        />
                        <button
                          type="button"
                          onClick={() => handleAdjustAmmoQuantity(ammo.id, 1)}
                          className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition flex items-center justify-center cursor-pointer"
                          title="Increase by 1"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustAmmoQuantity(ammo.id, 5)}
                          className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px] font-bold transition flex items-center justify-center cursor-pointer"
                          title="Increase by 5"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveAmmo(ammo.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 text-xs ml-1 cursor-pointer"
                          title="Remove Ammunition"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
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
                                {(item.rawItem?.itemType === 'ammunition' || (!isEquippedGear && (item.name.toLowerCase().includes('arrow') || item.name.toLowerCase().includes('bolt') || item.name.toLowerCase().includes('bullet')))) && (
                                  eq.equippedAmmoId === item.id ? (
                                    <span className="text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded text-[10px] font-sans font-bold border border-amber-500/30 inline-flex items-center gap-1">
                                      <i className="fa-solid fa-crosshairs text-[9px]"></i> Active
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleSetActiveAmmo(item.id)}
                                      className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 px-2 py-0.5 rounded text-[10px] font-sans font-bold border border-amber-500/30 transition inline-flex items-center gap-1 cursor-pointer shadow-xs"
                                      title={`Load ${item.name} as active ammunition in quiver`}
                                    >
                                      <i className="fa-solid fa-crosshairs text-[9px]"></i> Load
                                    </button>
                                  )
                                )}
                                {(item.rawItem?.itemType === 'wondrous' || item.rawItem?.bodySlot || (!isEquippedGear && !['weapon', 'armor', 'shield'].includes(getEquippableCategory(item.rawItem || item.name)) && item.rawItem?.itemType !== 'ammunition')) && (
                                  equipSlotPickerItemId === item.id ? (
                                    <div className="inline-flex items-center gap-1 bg-slate-900 border border-purple-500/50 rounded-md p-1 shadow-lg z-20">
                                      <span className="text-[9px] uppercase font-bold text-purple-400 px-0.5">Slot:</span>
                                      <select
                                        onChange={e => {
                                          const target = item.rawItem || inventory.find(i => i.id === item.id);
                                          if (target && e.target.value) {
                                            handleEquipInventoryItemToSlot(target, e.target.value as BodySlotId);
                                          }
                                          setEquipSlotPickerItemId(null);
                                        }}
                                        defaultValue=""
                                        className="bg-slate-800 text-slate-200 text-[10px] rounded px-1 py-0.5 border border-slate-700 font-sans cursor-pointer"
                                      >
                                        <option value="" disabled>Choose slot...</option>
                                        {CANONICAL_BODY_SLOTS.map(s => (
                                          <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                      </select>
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
                                      className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 px-2 py-0.5 rounded text-[10px] font-sans font-bold border border-purple-500/30 transition inline-flex items-center gap-1 cursor-pointer shadow-xs"
                                      title={`Equip ${item.name} to a body slot`}
                                    >
                                      <i className="fa-solid fa-gem text-[9px]"></i> Equip Slot
                                    </button>
                                  )
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
      {/* Modal: Add Wondrous Item & Magic Gear (Predefined Catalog + Custom) */}
      {showWondrousModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-2xl w-full space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-purple-400 flex items-center gap-2">
                  <i className="fa-solid fa-gem"></i> Add Wondrous Item & Magic Gear
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose from 176 standard 3.5e predefined items (DMG / MIC) or define custom gear.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowWondrousModal(false)}
                className="text-slate-400 hover:text-slate-200 text-lg leading-none cursor-pointer p-1"
                title="Close"
              >
                &times;
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex rounded-xl bg-slate-950/80 p-1 border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setWondrousModalTab('predefined')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  wondrousModalTab === 'predefined'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <i className="fa-solid fa-book-sparkles"></i>
                <span>3.5e Predefined Catalog ({filteredPredefinedItems.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setWondrousModalTab('custom')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  wondrousModalTab === 'custom'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <i className="fa-solid fa-pen-to-square"></i>
                <span>Custom Item</span>
              </button>
            </div>

            {/* TAB 1: PREDEFINED 3.5e ITEMS */}
            {wondrousModalTab === 'predefined' && (
              <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                {/* Search & Slot Filter Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2 relative">
                    <input
                      type="text"
                      value={wondrousPredefinedSearch}
                      onChange={e => setWondrousPredefinedSearch(e.target.value)}
                      placeholder="Search items by name, effect, or source..."
                      className="input-field text-xs w-full pl-8 pr-7"
                    />
                    <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                    {wondrousPredefinedSearch && (
                      <button
                        type="button"
                        onClick={() => setWondrousPredefinedSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                  <div>
                    <select
                      value={wondrousPredefinedSlotFilter}
                      onChange={e => setWondrousPredefinedSlotFilter(e.target.value as any)}
                      className="input-field text-xs w-full"
                    >
                      <option value="all">All Body Slots (176)</option>
                      <option value="head">Head (Helms / Hats) (11)</option>
                      <option value="headband">Headband (Phylacteries / Eyes) (12)</option>
                      <option value="neck">Neck (Amulets / Necklaces) (29)</option>
                      <option value="shoulders">Shoulders (Cloaks / Capes) (16)</option>
                      <option value="chest">Chest (Vests / Mantles) (5)</option>
                      <option value="body">Body (Robes / Vestments) (6)</option>
                      <option value="armor">Armor (Suit of Armor) (3)</option>
                      <option value="hands">Hands (Gauntlets / Gloves) (8)</option>
                      <option value="arms">Arms (Bracers / Armbands) (11)</option>
                      <option value="waist">Waist (Belts / Girdles) (7)</option>
                      <option value="feet">Feet (Boots / Shoes) (8)</option>
                      <option value="ring1">Rings (Ring 1 & Ring 2) (23)</option>
                      <option value="slotless">Slotless / Other (37)</option>
                    </select>
                  </div>
                </div>

                {/* Sourcebook Filter Control Bar */}
                <div className="flex items-center justify-between gap-2 px-1 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={wondrousOnlyAllowedSources}
                      onChange={e => setWondrousOnlyAllowedSources(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-300 flex items-center gap-1.5">
                      <i className="fa-solid fa-book-bookmark text-purple-400 text-[10px]"></i>
                      <span>Allowed sources only</span>
                    </span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Showing {filteredPredefinedItems.length} items
                  </span>
                </div>

                {/* Predefined Items List */}
                <div className="border border-slate-800 rounded-xl bg-slate-950/60 overflow-hidden">
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/60 p-1">
                    {filteredPredefinedItems.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-xs italic space-y-1">
                        <p>No predefined items match your filter criteria.</p>
                        {wondrousOnlyAllowedSources && (
                          <button
                            type="button"
                            onClick={() => setWondrousOnlyAllowedSources(false)}
                            className="text-purple-400 hover:text-purple-300 underline text-[11px] cursor-pointer"
                          >
                            Show items from all sourcebooks
                          </button>
                        )}
                      </div>
                    ) : (
                      filteredPredefinedItems.map(item => {
                        const isSelected = selectedPredefinedId === item.id;
                        const slotDef = BODY_SLOT_MAP[item.slot];
                        const sourceBadge = getSourceBadgeInfo(item.source, character.allowedSources);

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSelectedPredefinedId(item.id);
                              setWondrousTargetSlot(
                                item.slot === 'ring1' && wondrousSlot === 'ring2'
                                  ? 'ring2'
                                  : item.slot
                              );
                            }}
                            className={`p-2.5 rounded-lg cursor-pointer transition flex items-start justify-between gap-3 ${
                              isSelected
                                ? 'bg-purple-950/40 border border-purple-500/60 ring-1 ring-purple-500/40 shadow-xs'
                                : !sourceBadge.isAllowed
                                ? 'bg-slate-950/40 border border-rose-500/20 hover:border-rose-500/40'
                                : 'hover:bg-slate-900 border border-transparent'
                            }`}
                          >
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-bold text-slate-100 text-xs leading-tight">
                                  {item.name}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center gap-1">
                                  <i className={`${slotDef?.icon || 'fa-solid fa-gem'} text-[8.5px]`}></i>
                                  {slotDef?.name || item.slot}
                                </span>
                                {item.cost && (
                                  <span className="text-[10px] text-amber-400 font-mono font-medium">
                                    {item.cost}
                                  </span>
                                )}
                                {item.weight !== undefined && (
                                  <span className="text-[9.5px] text-slate-400 font-mono">
                                    {item.weight > 0 ? `${item.weight} lb` : '—'}
                                  </span>
                                )}
                                <span
                                  className={`badge font-mono text-[9px] px-1.5 py-0.2 rounded border ${
                                    sourceBadge.isAllowed
                                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                                      : 'bg-rose-950/40 text-rose-400 border-rose-500/30'
                                  }`}
                                  title={`${sourceBadge.sourceName}${sourceBadge.isAllowed ? ' (Allowed)' : ' (Not Selected in Sourcebooks)'}`}
                                >
                                  {sourceBadge.sourceCode}
                                </span>
                                {!sourceBadge.isAllowed && (
                                  <span
                                    className="px-1 py-0.2 rounded text-[8.5px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-500/40"
                                    title="Restricted Sourcebook: This item's sourcebook is not enabled in Allowed Sources"
                                  >
                                    ⚠️ Restricted
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                                {item.effect}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEquipPredefinedItem(item, wondrousTargetSlot);
                              }}
                              className="btn btn-primary text-xs py-1 px-2.5 shrink-0 self-center flex items-center gap-1"
                              title={`Equip ${item.name}`}
                            >
                              <i className="fa-solid fa-plus text-[9px]"></i> Equip
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Selected Item Details Preview & Slot Override */}
                {selectedPredefinedItem && (() => {
                  const selBadge = getSourceBadgeInfo(selectedPredefinedItem.source, character.allowedSources);
                  return (
                    <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/40 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-purple-300 text-xs">
                            {selectedPredefinedItem.name}
                          </span>
                          {selectedPredefinedItem.cost && (
                            <span className="text-[10.5px] text-amber-300 font-mono">
                              ({selectedPredefinedItem.cost})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">Source:</span>
                          <span
                            className={`badge font-mono text-[9.5px] px-1.5 py-0.5 rounded border ${
                              selBadge.isAllowed
                                ? 'bg-slate-800 text-slate-200 border-slate-700'
                                : 'bg-rose-950/50 text-rose-300 border-rose-500/40'
                            }`}
                            title={selBadge.sourceName}
                          >
                            {selBadge.sourceName} ({selBadge.sourceCode})
                          </span>
                          {!selBadge.isAllowed && (
                            <span className="text-[9.5px] text-rose-400 font-semibold">
                              (Restricted)
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-300 font-mono bg-slate-900/90 p-2 rounded-lg border border-slate-800 leading-relaxed">
                        {selectedPredefinedItem.effect}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2">
                          <label className="text-slate-400 text-[11px] font-medium whitespace-nowrap">
                            Equip into Body Slot:
                          </label>
                          <select
                            value={wondrousTargetSlot}
                            onChange={e => setWondrousTargetSlot(e.target.value as any)}
                            className="input-field text-xs py-1"
                          >
                            <option value="shoulders">Shoulders (Cloaks / Capes)</option>
                            <option value="head">Head (Helms / Hats)</option>
                            <option value="headband">Headband (Phylacteries / Eyes)</option>
                            <option value="neck">Neck (Amulets / Necklaces)</option>
                            <option value="chest">Chest (Vests / Mantles)</option>
                            <option value="body">Body (Robes / Vestments)</option>
                            <option value="armor">Armor (Suit of Armor)</option>
                            <option value="hands">Hands (Gauntlets / Gloves)</option>
                            <option value="arms">Arms (Bracers / Armbands)</option>
                            <option value="waist">Waist (Belts / Girdles)</option>
                            <option value="feet">Feet (Boots / Shoes)</option>
                            <option value="ring1">Ring Slot 1</option>
                            <option value="ring2">Ring Slot 2</option>
                            <option value="slotless">Slotless / Other</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleEquipPredefinedItem(selectedPredefinedItem, wondrousTargetSlot)}
                          className="btn btn-primary text-xs py-1 px-4 flex items-center gap-1.5"
                        >
                          <i className="fa-solid fa-shield-halved text-[10px]"></i> Equip to {BODY_SLOT_MAP[wondrousTargetSlot]?.name || wondrousTargetSlot}
                        </button>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowWondrousModal(false)}
                    className="btn btn-secondary text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: CUSTOM WONDROUS ITEM */}
            {wondrousModalTab === 'custom' && (
              <form onSubmit={handleAddWondrousItem} className="space-y-3 overflow-y-auto flex-1 pr-1">
                <div>
                  <label className="label-text">Item Name</label>
                  <input
                    type="text"
                    required
                    value={wondrousName}
                    onChange={e => setWondrousName(e.target.value)}
                    placeholder="e.g. Cloak of Resistance +2, Belt of Giant Strength +4"
                    className="input-field text-xs w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="label-text">Item Slot</label>
                    <select
                      value={wondrousTargetSlot}
                      onChange={e => setWondrousTargetSlot(e.target.value as any)}
                      className="input-field text-xs w-full"
                    >
                      <option value="shoulders">Shoulders (Cloaks / Capes)</option>
                      <option value="head">Head (Helms / Hats)</option>
                      <option value="headband">Headband (Phylacteries / Headbands)</option>
                      <option value="neck">Neck (Amulets / Neclaces)</option>
                      <option value="chest">Chest (Vests / Mantles)</option>
                      <option value="body">Body (Robes / Vestments)</option>
                      <option value="armor">Armor (Suit of Armor)</option>
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
                    <label className="label-text">Cost / Value (gp)</label>
                    <input
                      type="text"
                      value={wondrousCost}
                      onChange={e => setWondrousCost(e.target.value)}
                      placeholder="e.g. 4,000 gp"
                      className="input-field text-xs w-full"
                    />
                  </div>

                  <div>
                    <label className="label-text">Weight (lbs)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={wondrousWeight}
                      onChange={e => setWondrousWeight(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="0"
                      className="input-field text-xs w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="label-text">Effect / Property Description</label>
                  <textarea
                    rows={3}
                    value={wondrousEffect}
                    onChange={e => setWondrousEffect(e.target.value)}
                    placeholder="e.g. +2 resistance bonus on all saving throws"
                    className="input-field text-xs w-full font-mono"
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
                    Add Custom Item
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Custom Ammunition */}
      {showCustomAmmoModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateCustomAmmo} className="card bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <i className="fa-solid fa-bullseye"></i> Create Custom Ammunition
            </h3>

            <div>
              <label className="label-text">Ammunition Name</label>
              <input
                type="text"
                required
                value={customAmmoName}
                onChange={e => setCustomAmmoName(e.target.value)}
                placeholder="e.g. +1 Flaming Arrows (20), Silver Bolts (10)"
                className="input-field text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-text">Ammo Category</label>
                <select
                  value={customAmmoType}
                  onChange={e => setCustomAmmoType(e.target.value as AmmoCategory)}
                  className="input-field text-xs"
                >
                  <option value="arrow">Arrows (Bows)</option>
                  <option value="bolt">Crossbow Bolts</option>
                  <option value="bullet">Sling Bullets</option>
                  <option value="needle">Blowgun Needles</option>
                  <option value="shuriken">Shuriken</option>
                  <option value="other">Other Ammunition</option>
                </select>
              </div>
              <div>
                <label className="label-text">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={customAmmoQuantity}
                  onChange={e => setCustomAmmoQuantity(parseInt(e.target.value) || 1)}
                  className="input-field font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-text">Enhancement Bonus</label>
                <select
                  value={String(customAmmoEnhancement)}
                  onChange={e => setCustomAmmoEnhancement(parseInt(e.target.value) || 0)}
                  className="input-field font-mono text-xs"
                >
                  <option value="0">None (+0)</option>
                  <option value="1">+1 Enhancement</option>
                  <option value="2">+2 Enhancement</option>
                  <option value="3">+3 Enhancement</option>
                  <option value="4">+4 Enhancement</option>
                  <option value="5">+5 Enhancement</option>
                </select>
              </div>
              <div>
                <label className="label-text">Special Material</label>
                <select
                  value={customAmmoMaterial}
                  onChange={e => setCustomAmmoMaterial(e.target.value as any)}
                  className="input-field text-xs"
                >
                  <option value="standard">Standard</option>
                  <option value="cold_iron">Cold Iron</option>
                  <option value="alchemical_silver">Alchemical Silver</option>
                  <option value="adamantine">Adamantine</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="label-text">Weight (lbs)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={customAmmoWeight}
                  onChange={e => setCustomAmmoWeight(parseFloat(e.target.value) || 0)}
                  className="input-field font-mono text-xs"
                />
              </div>
              <div>
                <label className="label-text">Value</label>
                <input
                  type="text"
                  value={customAmmoValue}
                  onChange={e => setCustomAmmoValue(e.target.value)}
                  placeholder="e.g. 10 gp"
                  className="input-field text-xs"
                />
              </div>
              <div>
                <label className="label-text">Location</label>
                <input
                  type="text"
                  value={customAmmoLocation}
                  onChange={e => setCustomAmmoLocation(e.target.value)}
                  placeholder="Quiver"
                  className="input-field text-xs"
                />
              </div>
            </div>

            <div>
              <label className="label-text">Special Qualities / Notes</label>
              <input
                type="text"
                value={customAmmoNotes}
                onChange={e => setCustomAmmoNotes(e.target.value)}
                placeholder="e.g. Flaming, screaming, sleep save DC 11"
                className="input-field text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={customAmmoMasterwork}
                  onChange={e => setCustomAmmoMasterwork(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-amber-500"
                />
                <span>Masterwork Ammunition (+1 enhancement on attacks)</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCustomAmmoModal(false)}
                className="btn btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary text-xs"
              >
                Save Ammunition
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

      {/* Modal: Bane Designated Foe Selector */}
      {baneModalConfig && (
        <BaneTargetModal
          isOpen={baneModalConfig.isOpen}
          weaponName={baneModalConfig.weaponName}
          currentTarget={baneModalConfig.currentTarget}
          onSave={handleSaveBaneTarget}
          onClose={() => setBaneModalConfig(null)}
        />
      )}
    </div>
  );
};
