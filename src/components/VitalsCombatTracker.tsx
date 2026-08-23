import React, { useState } from 'react';
import {
  CharacterState,
  ConditionCategory,
  DailyResourceTrack,
  CustomResourceDefinition,
  RaceData,
  TemplateData,
  TraitData,
  FlawData,
  ClassData,
  PreparedSpellSlot,
  StatType
} from '../types/character';
import {
  DND_CONDITIONS,
  CONDITION_MAP,
  calculateConditionPenalties,
  getHealthStatus,
  applyDamage,
  applyHeal,
  toggleCondition
} from '../engine/conditions';
import {
  calculateDailyResources,
  performLongRest,
  useResource,
  setResourceUsed,
  resetResource
} from '../engine/resources';
import {
  calculateTotalScore,
  getAbilityMod,
  parseRaceMods,
  parseTemplateMods,
  calculateTraitFlawStatMods,
  getCharacterLevel
} from '../engine/stats';
import {
  SPELLCASTING_CLASSES,
  getSpellSlotsForClass,
  isSpellcastingClassName,
  isPreparedCaster,
  getSpellSlotUsageKey,
  getExpendedSpellSlotsCount,
  setExpendedSpellSlots,
  expendSpellSlot,
  restoreSpellSlot,
  resetExpendedSpellSlotsForClass,
  togglePreparedSpellSlotCast
} from '../engine/spells';

interface VitalsCombatTrackerProps {
  character: CharacterState;
  maxHp: number;
  onChange: (updated: Partial<CharacterState>) => void;
  className?: string;
  isCompact?: boolean;
  racesData?: RaceData[];
  classesData?: ClassData[];
  templatesData?: TemplateData[];
  traitsData?: TraitData[];
  flawsData?: FlawData[];
}

export const VitalsCombatTracker: React.FC<VitalsCombatTrackerProps> = ({
  character,
  maxHp,
  onChange,
  className = '',
  isCompact = false,
  racesData = [],
  classesData = [],
  templatesData = [],
  traitsData = [],
  flawsData = []
}) => {
  // Resolve effective current HP (default to maxHp if not set)
  const currentHp = character.currentHp !== undefined ? character.currentHp : maxHp;
  const tempHp = character.tempHp || 0;
  const nonlethalDamage = character.nonlethalDamage || 0;
  const activeConditions = character.activeConditions || [];
  const resourceUsages = character.resourceUsages || {};
  const customResources = character.customResources || [];

  const [customAmount, setCustomAmount] = useState<string>('');
  const [isNonlethalInput, setIsNonlethalInput] = useState<boolean>(false);
  const [conditionCategoryFilter, setConditionCategoryFilter] = useState<ConditionCategory | 'all'>('all');
  const [conditionSearch, setConditionSearch] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [restToast, setRestToast] = useState<string | null>(null);

  // Custom resource modal / form state
  const [showAddCustomResource, setShowAddCustomResource] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [customMaxUses, setCustomMaxUses] = useState<string>('3');
  const [customUnit, setCustomUnit] = useState<string>('uses');
  const [customIsPool, setCustomIsPool] = useState<boolean>(false);
  const [customDescription, setCustomDescription] = useState<string>('');

  // Lay on Hands pool quick input state
  const [lohAdjustAmount, setLohAdjustAmount] = useState<string>('');

  const healthStatus = getHealthStatus(currentHp, maxHp, tempHp, nonlethalDamage);
  const penalties = calculateConditionPenalties(activeConditions);
  const dailyResources = calculateDailyResources(
    character,
    undefined,
    racesData,
    templatesData,
    traitsData,
    flawsData
  );

  // Spellcasting Classes & Active Slot Tracking
  const classLevelsMap: Record<string, number> = {};
  (character.levelProgression || []).forEach(l => {
    if (l.primaryClass) {
      classLevelsMap[l.primaryClass] = (classLevelsMap[l.primaryClass] || 0) + 1;
    }
    if (l.secondaryClass) {
      classLevelsMap[l.secondaryClass] = (classLevelsMap[l.secondaryClass] || 0) + 1;
    }
  });

  const totalLevel = getCharacterLevel(character.levelProgression);
  const raceObj: Partial<RaceData> = racesData.find(r => r.name === character.selectedRace) || {};
  const templateObj: Partial<TemplateData> | undefined = templatesData.find(
    t => t.name === character.selectedTemplate || t.id === character.selectedTemplate
  );
  const raceMods = parseRaceMods(raceObj);
  const templateMods = parseTemplateMods(templateObj);
  const traitFlawMods = calculateTraitFlawStatMods(
    character.selectedTraits || [],
    character.selectedFlaws || [],
    traitsData,
    flawsData
  );

  const casterEntries = Object.entries(classLevelsMap).filter(([clsName]) => {
    const clsObj = classesData.find(c => c.name === clsName);
    return isSpellcastingClassName(clsName, clsObj);
  });

  const casterSlotTracks: Array<{
    className: string;
    classLevel: number;
    spellLevel: number;
    spellLevelName: string;
    totalSlots: number;
    expendedSlots: number;
    remainingSlots: number;
    saveDc: number;
    keyAbility: string;
    abilityMod: number;
    isPrepared: boolean;
    preparedSpells: PreparedSpellSlot[];
  }> = [];

  for (const [clsName, clsLvl] of casterEntries) {
    const key = clsName.toLowerCase().replace(/[\s\/-]+/g, '_');
    const info = SPELLCASTING_CLASSES[key] || {
      name: clsName,
      keyAbility: 'int' as StatType,
      type: 'Arcane' as const,
      method: 'Prepared' as const,
      maxSpellLevel: 9
    };
    const totalScore = calculateTotalScore(
      info.keyAbility,
      character.baseStats,
      raceMods,
      character.levelBumps || {},
      character.enhancementMods || {},
      totalLevel,
      traitFlawMods,
      templateMods
    );
    const abilityMod = getAbilityMod(totalScore);
    const slotsData = getSpellSlotsForClass(clsName, clsLvl, abilityMod);
    if (!slotsData) continue;

    const isPrepared = isPreparedCaster(clsName);
    const classPreparedSlots = (character.preparedSpells || []).filter(
      s => s.className.toLowerCase().replace(/[\s\/-]+/g, '_') === key
    );

    for (const slot of slotsData.slots) {
      if (!slot.canCast || slot.total <= 0) continue;
      const levelPreparedSpells = classPreparedSlots.filter(
        s => s.spellLevel === slot.spellLevel && !!s.spellId
      );
      const castPreparedCount = isPrepared
        ? levelPreparedSpells.filter(s => s.isCast).length
        : 0;
      const key = getSpellSlotUsageKey(clsName, slot.spellLevel);
      const hasKey = character.expendedSpellSlots && character.expendedSpellSlots[key] !== undefined;
      const expended = hasKey
        ? getExpendedSpellSlotsCount(character.expendedSpellSlots, clsName, slot.spellLevel)
        : castPreparedCount;
      const remaining = Math.max(0, slot.total - expended);

      casterSlotTracks.push({
        className: clsName,
        classLevel: clsLvl,
        spellLevel: slot.spellLevel,
        spellLevelName: slot.spellLevel === 0 ? 'Cantrips (0th Level)' : `Level ${slot.spellLevel} Spells`,
        totalSlots: slot.total,
        expendedSlots: expended,
        remainingSlots: remaining,
        saveDc: slot.saveDc,
        keyAbility: info.keyAbility.toUpperCase(),
        abilityMod,
        isPrepared,
        preparedSpells: levelPreparedSpells
      });
    }
  }

  // Quick State Updaters
  const handleApplyDamage = (amount: number, nonlethal: boolean = false) => {
    if (amount <= 0) return;
    const result = applyDamage(currentHp, maxHp, tempHp, amount, nonlethal, nonlethalDamage);
    onChange({
      currentHp: result.currentHp,
      tempHp: result.tempHp,
      nonlethalDamage: result.nonlethalDamage
    });
    setCustomAmount('');
  };

  const handleApplyHeal = (amount: number) => {
    if (amount <= 0) return;
    const result = applyHeal(currentHp, maxHp, nonlethalDamage, amount);
    onChange({
      currentHp: result.currentHp,
      nonlethalDamage: result.nonlethalDamage
    });
    setCustomAmount('');
  };

  const handleLongRest = () => {
    const updated = performLongRest(character, maxHp);
    onChange(updated);
    setRestToast('8-Hour Long Rest completed! HP restored, daily resources & spell slots refilled, and temporary fatigue/shaken conditions cleared.');
    setTimeout(() => {
      setRestToast(null);
    }, 4500);
  };

  const handleConditionToggle = (conditionId: string) => {
    const updated = toggleCondition(activeConditions, conditionId);
    onChange({ activeConditions: updated });
  };

  const handleClearAllConditions = () => {
    onChange({ activeConditions: [] });
  };

  const handleTempHpChange = (delta: number) => {
    const next = Math.max(0, tempHp + delta);
    onChange({ tempHp: next });
  };

  const handleNonlethalChange = (delta: number) => {
    const next = Math.max(0, nonlethalDamage + delta);
    onChange({ nonlethalDamage: next });
  };

  // Resource Usages Management
  const handleUseResource = (resourceId: string, delta: number, maxUses: number) => {
    const updated = useResource(resourceUsages, resourceId, delta, maxUses);
    onChange({ resourceUsages: updated });
  };

  const handleBubbleClick = (resourceId: string, bubbleIndex: number, maxUses: number, remaining: number) => {
    if (bubbleIndex <= remaining) {
      const newUsed = maxUses - bubbleIndex + 1;
      const updated = setResourceUsed(resourceUsages, resourceId, newUsed, maxUses);
      onChange({ resourceUsages: updated });
    } else {
      const newUsed = maxUses - bubbleIndex;
      const updated = setResourceUsed(resourceUsages, resourceId, newUsed, maxUses);
      onChange({ resourceUsages: updated });
    }
  };

  const handleResetResource = (resourceId: string) => {
    const updated = resetResource(resourceUsages, resourceId);
    onChange({ resourceUsages: updated });
  };

  const handleResetAllResources = () => {
    const updatedPrepared = character.preparedSpells
      ? character.preparedSpells.map(s => (s.isCast ? { ...s, isCast: false } : s))
      : undefined;
    onChange({
      resourceUsages: {},
      expendedSpellSlots: {},
      ...(updatedPrepared ? { preparedSpells: updatedPrepared } : {})
    });
  };

  // Spell Slot Usage Handlers
  const handleSpellSlotBubbleClick = (
    className: string,
    spellLevel: number,
    bubbleIndex: number,
    maxSlots: number,
    remaining: number
  ) => {
    let newExpended = 0;
    if (bubbleIndex <= remaining) {
      newExpended = maxSlots - bubbleIndex + 1;
    } else {
      newExpended = maxSlots - bubbleIndex;
    }
    const updatedExpended = setExpendedSpellSlots(
      character.expendedSpellSlots,
      className,
      spellLevel,
      newExpended,
      maxSlots
    );
    onChange({ expendedSpellSlots: updatedExpended });
  };

  const handleExpendSpellSlot = (className: string, spellLevel: number, maxSlots: number) => {
    const key = getSpellSlotUsageKey(className, spellLevel);
    const hasKey = character.expendedSpellSlots && character.expendedSpellSlots[key] !== undefined;
    const currentExp = hasKey
      ? getExpendedSpellSlotsCount(character.expendedSpellSlots, className, spellLevel)
      : (character.preparedSpells || []).filter(
          s => s.className.toLowerCase().replace(/[\s\/-]+/g, '_') === className.toLowerCase().replace(/[\s\/-]+/g, '_') &&
               s.spellLevel === spellLevel &&
               s.isCast &&
               !!s.spellId
        ).length;
    const newExpended = Math.min(maxSlots, currentExp + 1);
    const updatedExpended = setExpendedSpellSlots(character.expendedSpellSlots, className, spellLevel, newExpended, maxSlots);
    onChange({ expendedSpellSlots: updatedExpended });
  };

  const handleRestoreSpellSlot = (className: string, spellLevel: number, maxSlots: number) => {
    const key = getSpellSlotUsageKey(className, spellLevel);
    const hasKey = character.expendedSpellSlots && character.expendedSpellSlots[key] !== undefined;
    const currentExp = hasKey
      ? getExpendedSpellSlotsCount(character.expendedSpellSlots, className, spellLevel)
      : (character.preparedSpells || []).filter(
          s => s.className.toLowerCase().replace(/[\s\/-]+/g, '_') === className.toLowerCase().replace(/[\s\/-]+/g, '_') &&
               s.spellLevel === spellLevel &&
               s.isCast &&
               !!s.spellId
        ).length;
    const newExpended = Math.max(0, currentExp - 1);
    const updatedExpended = setExpendedSpellSlots(character.expendedSpellSlots, className, spellLevel, newExpended, maxSlots);
    onChange({ expendedSpellSlots: updatedExpended });
  };

  const handleResetSpellLevelSlots = (className: string, spellLevel: number, maxSlots: number) => {
    const updatedExpended = setExpendedSpellSlots(character.expendedSpellSlots, className, spellLevel, 0, maxSlots);
    const cKey = className.toLowerCase().replace(/[\s\/-]+/g, '_');
    const updatedPrepared = (character.preparedSpells || []).map(s => {
      if (s.className.toLowerCase().replace(/[\s\/-]+/g, '_') === cKey && s.spellLevel === spellLevel) {
        return { ...s, isCast: false };
      }
      return s;
    });
    onChange({
      expendedSpellSlots: updatedExpended,
      preparedSpells: updatedPrepared
    });
  };

  const handleTogglePreparedSlotCast = (slotId: string) => {
    const prepSpells = character.preparedSpells || [];
    const targetSlot = prepSpells.find(s => s.id === slotId);
    const updatedPrepared = togglePreparedSpellSlotCast(prepSpells, slotId);
    if (!targetSlot) {
      onChange({ preparedSpells: updatedPrepared });
      return;
    }

    const clsName = targetSlot.className;
    const spellLevel = targetSlot.spellLevel;
    const cKey = clsName.toLowerCase().replace(/[\s\/-]+/g, '_');

    // Count how many prepared spells will be cast for this class and level
    const classLevelPrepared = updatedPrepared.filter(
      s => s.className.toLowerCase().replace(/[\s\/-]+/g, '_') === cKey &&
           s.spellLevel === spellLevel &&
           !!s.spellId
    );
    const newCastCount = classLevelPrepared.filter(s => s.isCast).length;

    const track = casterSlotTracks.find(
      t => t.className.toLowerCase().replace(/[\s\/-]+/g, '_') === cKey && t.spellLevel === spellLevel
    );
    const maxSlots = track ? track.totalSlots : 99;

    const updatedExpended = setExpendedSpellSlots(
      character.expendedSpellSlots,
      clsName,
      spellLevel,
      newCastCount,
      maxSlots
    );

    onChange({
      preparedSpells: updatedPrepared,
      expendedSpellSlots: updatedExpended
    });
  };

  // Custom Resource Management
  const handleAddCustomResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newRes: CustomResourceDefinition = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: customName.trim(),
      maxUses: Math.max(1, parseInt(customMaxUses) || 1),
      unit: customUnit.trim() || 'uses',
      isPool: customIsPool,
      description: customDescription.trim() || undefined
    };

    onChange({
      customResources: [...customResources, newRes]
    });

    setCustomName('');
    setCustomMaxUses('3');
    setCustomUnit('uses');
    setCustomIsPool(false);
    setCustomDescription('');
    setShowAddCustomResource(false);
  };

  const handleDeleteCustomResource = (id: string) => {
    const nextCustom = customResources.filter(r => r.id !== id);
    const nextUsages = { ...resourceUsages };
    delete nextUsages[id];
    onChange({
      customResources: nextCustom,
      resourceUsages: nextUsages
    });
  };

  const filteredConditions = DND_CONDITIONS.filter(c => {
    const matchesCategory = conditionCategoryFilter === 'all' || c.category === conditionCategoryFilter;
    const matchesSearch =
      conditionSearch.trim() === '' ||
      c.name.toLowerCase().includes(conditionSearch.toLowerCase()) ||
      c.summary.toLowerCase().includes(conditionSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const hasAnyPenalties =
    penalties.attackPenalty !== 0 ||
    penalties.damagePenalty !== 0 ||
    penalties.allSavesPenalty !== 0 ||
    penalties.acPenalty !== 0 ||
    penalties.strPenalty !== 0 ||
    penalties.dexPenalty !== 0 ||
    penalties.speedMultiplier < 1.0 ||
    penalties.loseDexToAc;

  return (
    <div
      className={`card bg-slate-900/80 backdrop-blur border border-rose-500/25 p-4 rounded-2xl shadow-xl transition-all ${className}`}
    >
      {/* Toast feedback for Long Rest */}
      {restToast && (
        <div className="mb-3 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-moon text-emerald-400 text-sm"></i>
            <span className="font-semibold">{restToast}</span>
          </div>
          <button
            onClick={() => setRestToast(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {/* Widget Header */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 text-xs select-none ${
          !isCollapsed ? 'border-b border-slate-800 pb-3' : ''
        }`}
      >
        <div
          className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-[240px]"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Click to expand Vitals & Daily Resources HUD' : 'Click to collapse HUD'}
        >
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <i className="fa-solid fa-heart-pulse text-sm"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-heading text-slate-100 flex items-center gap-2">
                Live Vitals, Conditions & Daily Resources
              </h3>
              <span
                className={`badge text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${healthStatus.badgeClass}`}
              >
                {healthStatus.label}
              </span>
              {activeConditions.length > 0 && (
                <span className="badge bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] font-mono px-1.5 py-0.5">
                  {activeConditions.length} Condition{activeConditions.length > 1 ? 's' : ''}
                </span>
              )}
              {dailyResources.length + casterSlotTracks.length > 0 && (
                <span className="badge bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px] font-mono px-1.5 py-0.5">
                  {dailyResources.length + casterSlotTracks.length} Tracked Resource{dailyResources.length + casterSlotTracks.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {isCollapsed
                ? 'Click to expand live HP adjustments, daily resource & spell slot bubbles, conditions, and 8-hour long rest.'
                : 'Real-time Hit Points, interactive daily class resource & spell slot bubbles, combat conditions, and 1-click Long Rest.'}
            </p>
          </div>
        </div>

        {/* Collapsed Active Status Summary */}
        {isCollapsed && (
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="text-slate-300 font-bold">
              HP: <span className={currentHp <= 0 ? 'text-rose-400' : 'text-emerald-400'}>{currentHp}</span> / {maxHp}
            </span>
            {tempHp > 0 && (
              <span className="badge bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px]">
                +{tempHp} Temp
              </span>
            )}
            {nonlethalDamage > 0 && (
              <span className="badge bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                {nonlethalDamage} NL
              </span>
            )}
            {dailyResources.map(res => {
              const remaining = Math.max(0, res.maxUses - res.usedUses);
              return (
                <span
                  key={res.id}
                  className={`badge text-[10px] ${
                    remaining === 0
                      ? 'bg-slate-800 text-slate-500 border-slate-700'
                      : res.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                  title={`${res.name}: ${remaining}/${res.maxUses} ${res.unit || 'uses'}`}
                >
                  <i className={`${res.icon || 'fa-solid fa-bolt'} mr-1 text-[9px]`}></i>
                  {res.name.replace('Barbarian ', '').replace('Paladin ', '')}: {remaining}/{res.maxUses}
                </span>
              );
            })}
            {casterSlotTracks.map(st => (
              <span
                key={`${st.className}_lvl${st.spellLevel}`}
                className={`badge text-[10px] font-mono ${
                  st.remainingSlots === 0
                    ? 'bg-slate-800 text-slate-500 border-slate-700'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
                title={`${st.className} ${st.spellLevelName}: ${st.remainingSlots}/${st.totalSlots} slots left (DC ${st.saveDc})`}
              >
                <i className="fa-solid fa-wand-magic-sparkles mr-1 text-[9px]"></i>
                {st.className} {st.spellLevel === 0 ? 'Cantrips' : `Lvl ${st.spellLevel}`}: {st.remainingSlots}/{st.totalSlots}
              </span>
            ))}
            {activeConditions.map(condId => {
              const def = CONDITION_MAP[condId];
              return (
                <span
                  key={condId}
                  className={`badge text-[10px] ${def ? def.badgeColor : 'bg-slate-800 text-slate-300 border-slate-700'}`}
                >
                  {def?.name || condId}
                </span>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* 1-Click 8-Hour Long Rest Button */}
          <button
            onClick={handleLongRest}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 font-bold font-mono transition bg-emerald-500/15 hover:bg-emerald-500/25 px-3 py-1.5 rounded-lg border border-emerald-500/40 shadow-xs cursor-pointer active:scale-95"
            title="8-Hour Long Rest: Fully restore HP, reset daily class resource bubbles, clear nonlethal & temp HP, and remove fatigue/shaken conditions."
          >
            <i className="fa-solid fa-moon text-amber-300"></i>
            <span>Long Rest</span>
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 font-semibold transition bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1.5 rounded-lg border border-rose-500/30 cursor-pointer"
          >
            <i className={`fa-solid ${isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'}`}></i>
            <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
          </button>
        </div>
      </div>

      {/* Expanded Controls Section */}
      {!isCollapsed && (
        <div className="space-y-4 pt-1">
          {/* Top Vitals Status Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
            {/* 1. Main HP Bar & Quick Steppers (7 cols) */}
            <div className="lg:col-span-7 bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Hit Points:</span>
                  <span className={`text-2xl font-extrabold font-mono ${currentHp <= 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                    {currentHp}
                  </span>
                  <span className="text-sm font-mono text-slate-400">/ {maxHp}</span>
                  {tempHp > 0 && (
                    <span className="badge bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs font-mono px-2 py-0.5">
                      <i className="fa-solid fa-shield-halved mr-1 text-[10px]"></i>+{tempHp} Temp
                    </span>
                  )}
                  {nonlethalDamage > 0 && (
                    <span className="badge bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs font-mono px-2 py-0.5">
                      <i className="fa-solid fa-hand-fist mr-1 text-[10px]"></i>{nonlethalDamage} Nonlethal
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-slate-400 font-semibold">{healthStatus.percent}%</span>
                </div>
              </div>

              {/* Visual Health Bar */}
              <div className="w-full bg-slate-900 rounded-full h-3.5 overflow-hidden border border-slate-800 flex relative">
                <div
                  className={`h-full transition-all duration-300 ${healthStatus.barColorClass}`}
                  style={{ width: `${healthStatus.percent}%` }}
                ></div>
                {tempHp > 0 && (
                  <div
                    className="h-full bg-cyan-400/80 animate-pulse transition-all duration-300"
                    style={{ width: `${Math.min(100 - healthStatus.percent, (tempHp / maxHp) * 100)}%` }}
                    title={`+${tempHp} Temporary HP Shield`}
                  ></div>
                )}
              </div>

              {/* Quick HP Steppers */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
                <div className="flex items-center gap-1 font-mono text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Adjust:</span>
                  <button
                    onClick={() => handleApplyDamage(10, false)}
                    className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 text-xs font-bold transition cursor-pointer"
                    title="Take 10 Damage"
                  >
                    -10
                  </button>
                  <button
                    onClick={() => handleApplyDamage(5, false)}
                    className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 text-xs font-bold transition cursor-pointer"
                    title="Take 5 Damage"
                  >
                    -5
                  </button>
                  <button
                    onClick={() => handleApplyDamage(1, false)}
                    className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 text-xs font-bold transition cursor-pointer"
                    title="Take 1 Damage"
                  >
                    -1
                  </button>
                </div>

                <div className="flex items-center gap-1 font-mono text-xs">
                  <button
                    onClick={() => handleApplyHeal(1)}
                    className="px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 text-xs font-bold transition cursor-pointer"
                    title="Heal 1 HP"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => handleApplyHeal(5)}
                    className="px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 text-xs font-bold transition cursor-pointer"
                    title="Heal 5 HP"
                  >
                    +5
                  </button>
                  <button
                    onClick={() => handleApplyHeal(10)}
                    className="px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 text-xs font-bold transition cursor-pointer"
                    title="Heal 10 HP"
                  >
                    +10
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Quick Damage / Heal Custom Input (5 cols) */}
            <div className="lg:col-span-5 bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Quick Input:</span>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isNonlethalInput}
                    onChange={e => setIsNonlethalInput(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5 cursor-pointer"
                  />
                  <span>Nonlethal Dmg</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  placeholder="Amount..."
                  value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && customAmount) {
                      handleApplyDamage(parseInt(customAmount) || 0, isNonlethalInput);
                    }
                  }}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-rose-500/60"
                />
                <button
                  onClick={() => {
                    const amt = parseInt(customAmount) || 0;
                    if (amt > 0) handleApplyDamage(amt, isNonlethalInput);
                  }}
                  disabled={!customAmount || parseInt(customAmount) <= 0}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                >
                  <i className="fa-solid fa-burst text-[10px]"></i> Damage
                </button>
                <button
                  onClick={() => {
                    const amt = parseInt(customAmount) || 0;
                    if (amt > 0) handleApplyHeal(amt);
                  }}
                  disabled={!customAmount || parseInt(customAmount) <= 0}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                >
                  <i className="fa-solid fa-heart-circle-plus text-[10px]"></i> Heal
                </button>
              </div>

              {/* Temp HP & Nonlethal Sub-controls */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-900">
                {/* Temp HP */}
                <div className="flex items-center justify-between bg-slate-900/60 px-2 py-1 rounded-lg border border-cyan-500/20">
                  <span className="text-[10px] text-cyan-300 font-semibold flex items-center gap-1">
                    <i className="fa-solid fa-shield"></i> Temp HP:
                  </span>
                  <div className="flex items-center gap-1 font-mono text-xs">
                    <button
                      onClick={() => handleTempHpChange(-1)}
                      disabled={tempHp <= 0}
                      className="text-slate-400 hover:text-cyan-300 disabled:opacity-30 px-1 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-bold text-cyan-300 min-w-[16px] text-center">{tempHp}</span>
                    <button
                      onClick={() => handleTempHpChange(1)}
                      className="text-slate-400 hover:text-cyan-300 px-1 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Nonlethal */}
                <div className="flex items-center justify-between bg-slate-900/60 px-2 py-1 rounded-lg border border-amber-500/20">
                  <span className="text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                    <i className="fa-solid fa-hand-fist"></i> Nonlethal:
                  </span>
                  <div className="flex items-center gap-1 font-mono text-xs">
                    <button
                      onClick={() => handleNonlethalChange(-1)}
                      disabled={nonlethalDamage <= 0}
                      className="text-slate-400 hover:text-amber-300 disabled:opacity-30 px-1 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-bold text-amber-300 min-w-[16px] text-center">{nonlethalDamage}</span>
                    <button
                      onClick={() => handleNonlethalChange(1)}
                      className="text-slate-400 hover:text-amber-300 px-1 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vitals Health Alert (if dying, disabled, staggered, or unconscious) */}
          {healthStatus.alertMessage && (
            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs ${
                healthStatus.isUnconsciousOrDead
                  ? 'bg-rose-950/70 border-rose-500/60 text-rose-200'
                  : 'bg-amber-950/70 border-amber-500/60 text-amber-200'
              }`}
            >
              <i
                className={`fa-solid ${
                  healthStatus.isUnconsciousOrDead
                    ? 'fa-triangle-exclamation text-rose-400 text-sm animate-bounce'
                    : 'fa-circle-exclamation text-amber-400 text-sm'
                }`}
              ></i>
              <div className="flex-1">
                <span className="font-bold">{healthStatus.alertMessage}</span>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* DAILY CLASS RESOURCES & SPELL SLOT USAGE TRACKING                      */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-battery-half text-amber-400"></i> Daily Class Resources & Spell Slot Usage Tracking
                </span>
                <span className="badge bg-slate-800 text-slate-400 border-slate-700 text-[10px] font-mono px-2 py-0.5">
                  {dailyResources.length + casterSlotTracks.length} Track{dailyResources.length + casterSlotTracks.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {dailyResources.length + casterSlotTracks.length > 0 && (
                  <button
                    onClick={handleResetAllResources}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded border border-emerald-500/20 transition cursor-pointer flex items-center gap-1 font-mono"
                    title="Refill all daily class resources and spell slots to full capacity"
                  >
                    <i className="fa-solid fa-rotate-left"></i> Refill All
                  </button>
                )}
                <button
                  onClick={() => setShowAddCustomResource(!showAddCustomResource)}
                  className="text-[10px] text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded border border-amber-500/20 transition cursor-pointer flex items-center gap-1"
                >
                  <i className={`fa-solid ${showAddCustomResource ? 'fa-xmark' : 'fa-plus'}`}></i>
                  <span>{showAddCustomResource ? 'Cancel' : 'Custom Resource'}</span>
                </button>
              </div>
            </div>

            {/* Inline Custom Resource Creator */}
            {showAddCustomResource && (
              <form
                onSubmit={handleAddCustomResource}
                className="p-3 bg-slate-900/90 rounded-xl border border-amber-500/30 space-y-2.5 text-xs animate-fadeIn"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 uppercase tracking-wider text-[11px] flex items-center gap-1">
                    <i className="fa-solid fa-plus-circle"></i> Add Custom Daily Tracked Resource
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomResource(false)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">Resource Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Boots of Speed, Ki Pool"
                      value={customName}
                      onChange={e => setCustomName(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">Max Uses / Day</label>
                    <input
                      type="number"
                      min="1"
                      max="999"
                      value={customMaxUses}
                      onChange={e => setCustomMaxUses(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">Unit Label</label>
                    <input
                      type="text"
                      placeholder="uses, rds, points"
                      value={customUnit}
                      onChange={e => setCustomUnit(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Description / Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 10 rounds/day activated as a free action."
                    value={customDescription}
                    onChange={e => setCustomDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 text-[11px]">
                    <input
                      type="checkbox"
                      checked={customIsPool}
                      onChange={e => setCustomIsPool(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0 cursor-pointer"
                    />
                    <span>Large Point Pool (Progress bar with quick +/- steppers)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCustomResource(false)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Add Resource
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Active Resources Cards Grid */}
            {dailyResources.length === 0 && casterSlotTracks.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center text-xs text-slate-400 space-y-1">
                <i className="fa-solid fa-battery-empty text-slate-600 text-lg mb-1 block"></i>
                <p className="font-semibold text-slate-300">No active daily class resources or spell slots detected for this character.</p>
                <p className="text-[11px] text-slate-500">
                  Classes with spellcasting (Wizard, Sorcerer, Cleric, Druid, Bard, Paladin, Ranger, etc.) and class abilities (Barbarian Rage, Paladin Smite/Lay on Hands, Cleric Turn Undead, Druid Wild Shape, Monk Stunning Fist) automatically populate here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Daily Ability Resources */}
                {dailyResources.map(res => {
                  const remaining = Math.max(0, res.maxUses - res.usedUses);
                  const isPool = Boolean(res.isPool);
                  const percentLeft = Math.round((remaining / res.maxUses) * 100);

                  return (
                    <div
                      key={res.id}
                      className={`p-3 rounded-xl border flex flex-col justify-between space-y-2.5 transition ${
                        remaining === 0
                          ? 'bg-slate-900/40 border-slate-800/70 text-slate-400'
                          : 'bg-slate-900/80 border-slate-800 text-slate-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <i className={`${res.icon || 'fa-solid fa-bolt'} text-xs ${remaining > 0 ? 'text-amber-400' : 'text-slate-500'}`}></i>
                            <h4 className="font-bold text-xs text-slate-100 truncate">{res.name}</h4>
                            <span className={`badge text-[9px] font-mono px-1.5 py-0.2 rounded border ${res.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                              {res.source}
                            </span>
                          </div>
                          {res.description && (
                            <p className="text-[10.5px] text-slate-400 leading-tight line-clamp-2">{res.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="text-right font-mono">
                            <span className={`font-bold text-xs ${remaining === 0 ? 'text-rose-400' : remaining <= 1 && res.maxUses > 1 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {remaining}
                            </span>
                            <span className="text-[10px] text-slate-500"> / {res.maxUses} {res.unit || 'uses'}</span>
                          </div>
                          {res.usedUses > 0 && (
                            <button
                              onClick={() => handleResetResource(res.id)}
                              className="text-[10px] text-slate-400 hover:text-emerald-300 p-1 rounded hover:bg-slate-800 transition cursor-pointer"
                              title="Reset this resource to full"
                            >
                              <i className="fa-solid fa-rotate-left"></i>
                            </button>
                          )}
                          {res.category === 'custom' && (
                            <button
                              onClick={() => handleDeleteCustomResource(res.id)}
                              className="text-[10px] text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition cursor-pointer"
                              title="Remove custom resource"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          )}
                        </div>
                      </div>

                      {isPool ? (
                        <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                          <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800 flex relative">
                            <div
                              className={`h-full transition-all duration-300 ${percentLeft > 50 ? 'bg-emerald-500' : percentLeft > 25 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${percentLeft}%` }}
                            ></div>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-1 pt-1">
                            <div className="flex items-center gap-1 font-mono text-[11px]">
                              <span className="text-[9px] uppercase font-bold text-slate-500 mr-0.5">Spend:</span>
                              <button onClick={() => handleUseResource(res.id, 10, res.maxUses)} disabled={remaining < 10} className="px-1.5 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900 disabled:opacity-30 border border-rose-800/60 text-rose-300 text-[10px] font-bold transition cursor-pointer">-10</button>
                              <button onClick={() => handleUseResource(res.id, 5, res.maxUses)} disabled={remaining < 5} className="px-1.5 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900 disabled:opacity-30 border border-rose-800/60 text-rose-300 text-[10px] font-bold transition cursor-pointer">-5</button>
                              <button onClick={() => handleUseResource(res.id, 1, res.maxUses)} disabled={remaining < 1} className="px-1.5 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900 disabled:opacity-30 border border-rose-800/60 text-rose-300 text-[10px] font-bold transition cursor-pointer">-1</button>
                            </div>
                            <div className="flex items-center gap-1 font-mono text-[11px]">
                              <button onClick={() => handleUseResource(res.id, -1, res.maxUses)} disabled={res.usedUses <= 0} className="px-1.5 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900 disabled:opacity-30 border border-emerald-800/60 text-emerald-300 text-[10px] font-bold transition cursor-pointer">+1</button>
                              <button onClick={() => handleUseResource(res.id, -5, res.maxUses)} disabled={res.usedUses < 5} className="px-1.5 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900 disabled:opacity-30 border border-emerald-800/60 text-emerald-300 text-[10px] font-bold transition cursor-pointer">+5</button>
                              <button onClick={() => handleUseResource(res.id, -10, res.maxUses)} disabled={res.usedUses < 10} className="px-1.5 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900 disabled:opacity-30 border border-emerald-800/60 text-emerald-300 text-[10px] font-bold transition cursor-pointer">+10</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {Array.from({ length: res.maxUses }, (_, i) => {
                              const bubbleIndex = i + 1;
                              const isAvailable = bubbleIndex <= remaining;
                              return (
                                <button key={i} type="button" onClick={() => handleBubbleClick(res.id, bubbleIndex, res.maxUses, remaining)} className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer select-none group ${isAvailable ? 'bg-amber-500/20 border-2 border-amber-400 text-amber-300 shadow-xs hover:scale-110 active:scale-95' : 'bg-slate-950/70 border-2 border-slate-800 text-slate-600 hover:border-slate-600 hover:text-slate-400'}`}>
                                  {isAvailable ? <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs"></span> : <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex items-center gap-1 font-mono text-xs">
                            <button onClick={() => handleUseResource(res.id, 1, res.maxUses)} disabled={remaining <= 0} className="px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900 disabled:opacity-30 border border-rose-800/60 text-rose-300 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"><i className="fa-solid fa-minus text-[9px]"></i> Use</button>
                            <button onClick={() => handleUseResource(res.id, -1, res.maxUses)} disabled={res.usedUses <= 0} className="px-2 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900 disabled:opacity-30 border border-emerald-800/60 text-emerald-300 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"><i className="fa-solid fa-plus text-[9px]"></i> Restore</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 2. Active Spell Slot Tracks */}
                {casterSlotTracks.map(st => {
                  const hasSlots = st.totalSlots > 0;
                  return (
                    <div key={`${st.className}_lvl${st.spellLevel}`} className={`p-3 rounded-xl border flex flex-col justify-between space-y-2.5 transition ${st.remainingSlots === 0 ? 'bg-slate-900/40 border-rose-500/30 text-slate-400' : 'bg-slate-900/80 border-slate-800 text-slate-200 shadow-xs hover:border-amber-500/40'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <i className={`fa-solid fa-wand-magic-sparkles text-xs ${st.remainingSlots > 0 ? 'text-amber-400' : 'text-slate-500'}`}></i>
                            <h4 className="font-bold text-xs text-slate-100 truncate">{st.className} {st.spellLevelName}</h4>
                            <span className="badge text-[9px] font-mono px-1.5 py-0.2 rounded border bg-amber-500/20 text-amber-300 border-amber-500/30">{st.className} {st.classLevel}</span>
                            <span className="badge text-[9px] font-mono px-1.5 py-0.2 rounded border bg-emerald-950/80 text-emerald-300 border-emerald-500/30 font-bold">DC {st.saveDc}</span>
                          </div>
                          <p className="text-[10.5px] text-slate-400 leading-tight">Key: {st.keyAbility} ({st.abilityMod >= 0 ? `+${st.abilityMod}` : st.abilityMod}) • {st.isPrepared ? 'Prepared Slots' : 'Spontaneous Pool'}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="text-right font-mono">
                            <span className={`font-bold text-xs ${st.remainingSlots === 0 ? 'text-rose-400' : st.remainingSlots < st.totalSlots ? 'text-amber-400' : 'text-emerald-400'}`}>{st.remainingSlots}</span>
                            <span className="text-[10px] text-slate-500"> / {st.totalSlots} slots</span>
                          </div>
                          {st.expendedSlots > 0 && (
                            <button onClick={() => handleResetSpellLevelSlots(st.className, st.spellLevel, st.totalSlots)} className="text-[10px] text-slate-400 hover:text-emerald-300 p-1 rounded hover:bg-slate-800 transition cursor-pointer" title="Restore all slots at this level">
                              <i className="fa-solid fa-rotate-left"></i>
                            </button>
                          )}
                        </div>
                      </div>
                      {hasSlots && (
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {Array.from({ length: st.totalSlots }, (_, i) => {
                              const bubbleIndex = i + 1;
                              const isAvailable = bubbleIndex <= st.remainingSlots;
                              return (
                                <button key={i} type="button" onClick={() => handleSpellSlotBubbleClick(st.className, st.spellLevel, bubbleIndex, st.totalSlots, st.remainingSlots)} className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer select-none group ${isAvailable ? 'bg-amber-500/20 border-2 border-amber-400 text-amber-300 shadow-xs hover:scale-110 active:scale-95' : 'bg-slate-950/70 border-2 border-slate-800 text-slate-600 hover:border-slate-600 hover:text-slate-400'}`}>
                                  {isAvailable ? <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs"></span> : <i className="fa-solid fa-xmark text-[10px] text-slate-600 group-hover:text-slate-400"></i>}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex items-center gap-1 font-mono text-xs">
                            <button onClick={() => handleExpendSpellSlot(st.className, st.spellLevel, st.totalSlots)} disabled={st.remainingSlots <= 0} className="px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900 disabled:opacity-30 border border-rose-800/60 text-rose-300 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"><i className="fa-solid fa-minus text-[9px]"></i> Use</button>
                            <button onClick={() => handleRestoreSpellSlot(st.className, st.spellLevel, st.totalSlots)} disabled={st.expendedSlots <= 0} className="px-2 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900 disabled:opacity-30 border border-emerald-800/60 text-emerald-300 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"><i className="fa-solid fa-plus text-[9px]"></i> Restore</button>
                          </div>
                        </div>
                      )}
                      {st.isPrepared && st.preparedSpells.length > 0 && (
                        <div className="pt-1.5 border-t border-slate-800/60 space-y-1">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Prepared Spells:</span>
                          <div className="space-y-1 font-mono text-[10px]">
                            {st.preparedSpells.map(prepSlot => (
                              <div key={prepSlot.id} className={`flex items-center justify-between p-1 rounded border transition ${prepSlot.isCast ? 'bg-slate-950/40 border-slate-800 opacity-60' : 'bg-slate-950/80 border-slate-700/80'}`}>
                                <span className={`truncate ${prepSlot.isCast ? 'line-through text-slate-500' : 'font-semibold text-slate-200'}`} title={prepSlot.spellName || 'Prepared Spell'}>
                                  {prepSlot.spellName || 'Spell'}{prepSlot.isDomain ? ' ★' : ''}
                                </span>
                                <button type="button" onClick={() => handleTogglePreparedSlotCast(prepSlot.id)} className={`ml-1 text-[9px] font-bold px-1.5 py-0.2 rounded border transition cursor-pointer ${prepSlot.isCast ? 'bg-slate-900 text-slate-500 border-slate-700 hover:bg-emerald-950 hover:text-emerald-300' : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30 hover:bg-rose-950 hover:text-rose-300'}`}>
                                  {prepSlot.isCast ? 'Expended' : 'Cast'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* CONDITIONS ENGINE SECTION                                              */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-masks-theater text-amber-400"></i> Active Conditions ({activeConditions.length})
                </span>
                {activeConditions.length > 0 && (
                  <button
                    onClick={handleClearAllConditions}
                    className="text-[10px] text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/20 transition cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Search input */}
              <div className="relative min-w-[180px]">
                <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-2 text-[10px] text-slate-500"></i>
                <input
                  type="text"
                  placeholder="Filter conditions..."
                  value={conditionSearch}
                  onChange={e => setConditionSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-7 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>

            {/* Active Conditions Tray */}
            {activeConditions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-900/80 rounded-lg border border-slate-800/80">
                {activeConditions.map(condId => {
                  const def = CONDITION_MAP[condId];
                  return (
                    <span
                      key={condId}
                      className={`badge text-xs flex items-center gap-1.5 px-2 py-1 font-semibold ${
                        def ? def.badgeColor : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                      title={def?.summary || condId}
                    >
                      <i className={def?.icon || 'fa-solid fa-circle-exclamation'}></i>
                      <span>{def?.name || condId}</span>
                      <button
                        onClick={() => handleConditionToggle(condId)}
                        className="hover:opacity-75 transition ml-0.5 text-[10px] cursor-pointer"
                        title="Remove condition"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1 text-[11px]">
              {(['all', 'mental', 'physical', 'positional', 'sensory', 'incapacitated'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setConditionCategoryFilter(cat)}
                  className={`px-2.5 py-0.5 rounded-lg border transition cursor-pointer capitalize ${
                    conditionCategoryFilter === cat
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 1-Click Condition Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
              {filteredConditions.map(cond => {
                const isActive = activeConditions.includes(cond.id);
                return (
                  <button
                    key={cond.id}
                    onClick={() => handleConditionToggle(cond.id)}
                    className={`p-2 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer group ${
                      isActive
                        ? `${cond.badgeColor} shadow-md`
                        : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                    title={cond.summary}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-bold text-xs flex items-center gap-1.5 truncate">
                        <i className={`${cond.icon} text-[11px] ${isActive ? '' : 'text-slate-400'}`}></i>
                        <span className="truncate">{cond.name}</span>
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-1 py-0.2 rounded ${
                          isActive ? 'bg-black/40 text-amber-200' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isActive ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1 leading-tight">{cond.summary}</p>
                  </button>
                );
              })}
            </div>

            {/* Condition Penalties Summary Strip */}
            {hasAnyPenalties && (
              <div className="bg-slate-950 rounded-xl p-2.5 border border-rose-500/30 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-rose-400 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                    <i className="fa-solid fa-triangle-exclamation"></i> Condition Penalties:
                  </span>

                  {penalties.attackPenalty !== 0 && (
                    <span className="badge font-mono bg-rose-500/20 text-rose-300 border-rose-500/30">
                      Attack: {penalties.attackPenalty}
                    </span>
                  )}
                  {penalties.damagePenalty !== 0 && (
                    <span className="badge font-mono bg-rose-500/20 text-rose-300 border-rose-500/30">
                      Damage: {penalties.damagePenalty}
                    </span>
                  )}
                  {penalties.allSavesPenalty !== 0 && (
                    <span className="badge font-mono bg-rose-500/20 text-rose-300 border-rose-500/30">
                      Saves: {penalties.allSavesPenalty}
                    </span>
                  )}
                  {penalties.acPenalty !== 0 && (
                    <span className="badge font-mono bg-rose-500/20 text-rose-300 border-rose-500/30">
                      AC: {penalties.acPenalty}
                    </span>
                  )}
                  {penalties.strPenalty !== 0 && (
                    <span className="badge font-mono bg-amber-500/20 text-amber-300 border-amber-500/30">
                      Str: {penalties.strPenalty}
                    </span>
                  )}
                  {penalties.dexPenalty !== 0 && (
                    <span className="badge font-mono bg-amber-500/20 text-amber-300 border-amber-500/30">
                      Dex: {penalties.dexPenalty}
                    </span>
                  )}
                  {penalties.loseDexToAc && (
                    <span className="badge font-mono bg-purple-500/20 text-purple-300 border-purple-500/30">
                      Lose Dex to AC
                    </span>
                  )}
                  {penalties.speedMultiplier < 1.0 && (
                    <span className="badge font-mono bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                      Speed: x{penalties.speedMultiplier}
                    </span>
                  )}
                  {penalties.skillCheckPenalty !== 0 && (
                    <span className="badge font-mono bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                      Skills: {penalties.skillCheckPenalty}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
