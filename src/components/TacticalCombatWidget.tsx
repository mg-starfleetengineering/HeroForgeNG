import React from 'react';
import { CharacterState, TacticalCombatState } from '../types/character';
import {
  DEFAULT_TACTICAL_COMBAT,
  getTacticalCombatState,
  calculateTacticalCombatModifiers
} from '../engine/combat';
import { TacticalPanel } from './TacticalPanel';
import {
  getClassLevel,
  calculateBarbarianRageUses,
  calculateSmiteEvilUses,
  calculateStunningFistUses,
  calculateWildShapeUses,
  useResource,
  setResourceUsed
} from '../engine/resources';

interface TacticalCombatWidgetProps {
  character: CharacterState;
  bab: number;
  onChange: (updated: Partial<CharacterState>) => void;
  className?: string;
  isCompact?: boolean;
}

export const TacticalCombatWidget: React.FC<TacticalCombatWidgetProps> = ({
  character,
  bab,
  onChange,
  className = '',
  isCompact = false
}) => {
  const tc = getTacticalCombatState(character, bab);
  const resourceUsages = character.resourceUsages || {};

  const maxPa = Math.max(0, bab);
  const maxCe = Math.max(0, Math.min(bab, 5));

  // Determine what features the character possesses
  const selectedFeats = character.selectedFeats || [];
  const hasPowerAttack = selectedFeats.some(f => f.toLowerCase().includes('power attack')) || bab >= 1;
  const hasCombatExpertise = selectedFeats.some(f => f.toLowerCase().includes('combat expertise')) || (character.baseStats.int >= 13 && bab >= 1);

  const barbLevel = getClassLevel(character, 'barbarian');
  const rageMax = calculateBarbarianRageUses(character);
  const hasBarbarianRageOrFrenzy = barbLevel >= 1 || rageMax > 0;
  const isWhirlingFrenzy = character.barbarianVariant === 'whirling_frenzy';

  const monkLevel = getClassLevel(character, 'monk');
  const hasFlurryOfBlows = monkLevel >= 1;

  const paladinLevel = getClassLevel(character, 'paladin');
  const smiteMax = calculateSmiteEvilUses(character);
  const hasSmiteEvil = paladinLevel >= 1 || smiteMax > 0;

  const stunningMax = calculateStunningFistUses(character);
  const hasStunningFist = stunningMax > 0;

  const wsInfo = calculateWildShapeUses(character);
  const hasWildShape = wsInfo.hasWildShape;

  // Resource remaining counts
  const usedRage = resourceUsages['barbarian_rage'] || 0;
  const remainingRage = Math.max(0, rageMax - usedRage);

  const usedSmite = resourceUsages['smite_evil'] || 0;
  const remainingSmite = Math.max(0, smiteMax - usedSmite);

  const usedStunning = resourceUsages['stunning_fist'] || 0;
  const remainingStunning = Math.max(0, stunningMax - usedStunning);

  const usedWildShape = resourceUsages['wild_shape'] || 0;
  const remainingWildShape = Math.max(0, wsInfo.standardUses - usedWildShape);

  const updateTc = (updates: Partial<TacticalCombatState>) => {
    const updatedState: TacticalCombatState = { ...tc, ...updates };
    onChange({ tacticalCombat: updatedState });
  };

  const handleReset = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange({
      tacticalCombat: DEFAULT_TACTICAL_COMBAT,
      activeBuffs: (character.activeBuffs || []).map(b => ({ ...b, active: false }))
    });
  };

  // Toggle Rage / Whirling Frenzy with 1-click automatic daily use tracking
  const handleToggleRageOrFrenzy = () => {
    if (isWhirlingFrenzy) {
      const willBeActive = !tc.whirlingFrenzy;
      let nextUsages = { ...resourceUsages };

      // If turning ON and has available uses, expend 1 use
      if (willBeActive && remainingRage > 0) {
        nextUsages = useResource(resourceUsages, 'barbarian_rage', 1, rageMax);
      }

      onChange({
        tacticalCombat: { ...tc, whirlingFrenzy: willBeActive, rage: false },
        resourceUsages: nextUsages
      });
    } else {
      const willBeActive = !tc.rage;
      let nextUsages = { ...resourceUsages };

      // If turning ON and has available uses, expend 1 use
      if (willBeActive && remainingRage > 0) {
        nextUsages = useResource(resourceUsages, 'barbarian_rage', 1, rageMax);
      }

      onChange({
        tacticalCombat: { ...tc, rage: willBeActive, whirlingFrenzy: false },
        resourceUsages: nextUsages
      });
    }
  };

  // Toggle Smite Evil with 1-click automatic daily use tracking
  const handleToggleSmiteEvil = () => {
    const willBeActive = !tc.smiteEvil;
    let nextUsages = { ...resourceUsages };

    if (willBeActive && remainingSmite > 0) {
      nextUsages = useResource(resourceUsages, 'smite_evil', 1, smiteMax);
    }

    onChange({
      tacticalCombat: { ...tc, smiteEvil: willBeActive },
      resourceUsages: nextUsages
    });
  };

  // Toggle Stunning Fist with 1-click automatic daily use tracking
  const handleToggleStunningFist = () => {
    const willBeActive = !tc.stunningFist;
    let nextUsages = { ...resourceUsages };

    if (willBeActive && remainingStunning > 0) {
      nextUsages = useResource(resourceUsages, 'stunning_fist', 1, stunningMax);
    }

    onChange({
      tacticalCombat: { ...tc, stunningFist: willBeActive },
      resourceUsages: nextUsages
    });
  };

  // Direct bubble click helper
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

  const hasAnyActive =
    tc.powerAttack > 0 ||
    tc.combatExpertise > 0 ||
    tc.fightingDefensively ||
    tc.haste ||
    tc.rage ||
    tc.whirlingFrenzy ||
    tc.flurryOfBlows ||
    !!tc.smiteEvil ||
    !!tc.stunningFist ||
    (character.activeBuffs || []).some(b => b.active);

  const mods = calculateTacticalCombatModifiers(tc, undefined, false, false, character.activeBuffs);

  return (
    <div className={`card bg-slate-900/80 backdrop-blur border border-amber-500/20 p-4 rounded-2xl shadow-xl transition-all ${className}`}>
      {/* Widget Header */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 text-xs select-none ${!tc.isCollapsed ? 'border-b border-slate-800 pb-3' : ''}`}
      >
        <div
          className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-[240px]"
          onClick={() => updateTc({ isCollapsed: !tc.isCollapsed })}
          title={tc.isCollapsed ? 'Click to expand combat toggles' : 'Click to collapse combat toggles'}
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <i className="fa-solid fa-crosshairs text-sm"></i>
          </div>
          <div>
            <h3 className="text-sm font-bold font-heading text-slate-100 flex items-center gap-2">
              Tactical Combat Toggles
              {hasAnyActive && (
                <span className="badge bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] uppercase font-mono px-1.5 py-0.5">
                  Active
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              {tc.isCollapsed
                ? 'Click to expand active combat stances, sliders, and resource toggles'
                : 'Manage combat stances, power sliders, and 1-click class features with live daily use tracking.'}
            </p>
          </div>
        </div>

        {/* Collapsed Mode Active Summary Strip */}
        {tc.isCollapsed && hasAnyActive && (
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
            {mods.attackMod !== 0 && (
              <span className={`badge ${mods.attackMod > 0 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                Atk: {mods.attackMod > 0 ? `+${mods.attackMod}` : mods.attackMod}
              </span>
            )}
            {mods.acNetMod !== 0 && (
              <span className={`badge ${mods.acNetMod > 0 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                AC: {mods.acNetMod > 0 ? `+${mods.acNetMod}` : mods.acNetMod}
              </span>
            )}
            {tc.haste && <span className="badge bg-cyan-500/20 text-cyan-300 border-cyan-500/30">Haste</span>}
            {tc.rage && <span className="badge bg-rose-500/20 text-rose-300 border-rose-500/30">Rage ({remainingRage}/{rageMax})</span>}
            {tc.whirlingFrenzy && <span className="badge bg-teal-500/20 text-teal-300 border-teal-500/30">Frenzy ({remainingRage}/{rageMax})</span>}
            {tc.smiteEvil && <span className="badge bg-blue-500/20 text-blue-300 border-blue-500/30">Smite Evil ({remainingSmite}/{smiteMax})</span>}
            {tc.stunningFist && <span className="badge bg-orange-500/20 text-orange-300 border-orange-500/30">Stunning Fist ({remainingStunning}/{stunningMax})</span>}
            {tc.flurryOfBlows && <span className="badge bg-indigo-500/20 text-indigo-300 border-indigo-500/30">Flurry</span>}
            {(character.activeBuffs || [])
              .filter(b => b.active && b.id !== 'haste' && b.id !== 'rage' && b.id !== 'whirling_frenzy')
              .map(b => (
                <span key={b.id} className="badge bg-purple-500/20 text-purple-300 border-purple-500/30">
                  {b.name}
                </span>
              ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {hasAnyActive && (
            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 font-mono transition bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 cursor-pointer"
              title="Reset all tactical combat toggles"
            >
              <i className="fa-solid fa-rotate-left"></i> Reset
            </button>
          )}
          <button
            onClick={() => updateTc({ isCollapsed: !tc.isCollapsed })}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 font-semibold transition bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1.5 rounded-lg border border-amber-500/30 cursor-pointer"
          >
            <i className={`fa-solid ${tc.isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'}`}></i>
            <span>{tc.isCollapsed ? 'Expand' : 'Collapse'}</span>
          </button>
        </div>
      </div>

      {/* Expanded Controls Section */}
      {!tc.isCollapsed && (
        <div className="space-y-4 pt-1">
          {/* Grid Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
            {/* 1. Power Attack Slider (Shown if has feat or BAB >= 1) */}
            {hasPowerAttack && (
              <div className={`p-3 rounded-xl border transition flex flex-col justify-between ${tc.powerAttack > 0 ? 'bg-amber-950/40 border-amber-500/50 shadow-md' : 'bg-slate-950/50 border-slate-800'}`}>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-200 flex items-center gap-1.5">
                      <i className="fa-solid fa-gavel text-amber-400"></i> Power Attack
                    </label>
                    <span className="font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[11px]">
                      -{tc.powerAttack} Atk / +{tc.powerAttack} Dmg ({tc.powerAttack * 2} 2H)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={maxPa}
                    value={tc.powerAttack}
                    onChange={e => updateTc({ powerAttack: parseInt(e.target.value) || 0 })}
                    disabled={maxPa <= 0}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>0</span>
                    <span>Max BAB ({maxPa})</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Combat Expertise Slider (Shown if has feat or Int >= 13 & BAB >= 1) */}
            {hasCombatExpertise && (
              <div className={`p-3 rounded-xl border transition flex flex-col justify-between ${tc.combatExpertise > 0 ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md' : 'bg-slate-950/50 border-slate-800'}`}>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-200 flex items-center gap-1.5">
                      <i className="fa-solid fa-user-shield text-emerald-400"></i> Combat Expertise
                    </label>
                    <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px]">
                      -{tc.combatExpertise} Atk / +{tc.combatExpertise} Dodge AC
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={maxCe}
                    value={tc.combatExpertise}
                    onChange={e => updateTc({ combatExpertise: parseInt(e.target.value) || 0 })}
                    disabled={maxCe <= 0}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>0</span>
                    <span>Max ({maxCe})</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Fighting Defensively Toggle (Universal) */}
            <button
              onClick={() => updateTc({ fightingDefensively: !tc.fightingDefensively })}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer group ${
                tc.fightingDefensively
                  ? 'bg-sky-950/50 border-sky-400/60 text-sky-200 shadow-md'
                  : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-bold flex items-center gap-1.5">
                  <i className={`fa-solid fa-shield-halved ${tc.fightingDefensively ? 'text-sky-400' : 'text-slate-400'}`}></i> Fighting Defensively
                </span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${tc.fightingDefensively ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  {tc.fightingDefensively ? 'ON' : 'OFF'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                <span className="text-rose-400 font-mono font-bold">-4 Attack</span> &bull; <span className="text-emerald-400 font-mono font-bold">+2 Dodge AC</span>
              </p>
            </button>

            {/* 4. Haste Toggle (Universal Spell/Buff) */}
            <button
              onClick={() => updateTc({ haste: !tc.haste })}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer group ${
                tc.haste
                  ? 'bg-cyan-950/50 border-cyan-400/60 text-cyan-200 shadow-md'
                  : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-bold flex items-center gap-1.5">
                  <i className={`fa-solid fa-bolt-lightning ${tc.haste ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`}></i> Haste Spell / Effect
                </span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${tc.haste ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  {tc.haste ? 'ON' : 'OFF'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                <span className="text-emerald-400 font-mono font-bold">+1 Atk / +1 AC</span> &bull; <span className="text-amber-300 font-mono font-bold">+30ft Speed</span> &bull; <span className="text-cyan-300 font-mono font-bold">+1 Extra Attack</span>
              </p>
            </button>

            {/* 5. Barbarian Rage OR Whirling Frenzy (Conditioned on Barbarian Class) */}
            {hasBarbarianRageOrFrenzy && (
              <div
                className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 transition ${
                  (isWhirlingFrenzy ? tc.whirlingFrenzy : tc.rage)
                    ? isWhirlingFrenzy
                      ? 'bg-teal-950/60 border-teal-400/70 text-teal-200 shadow-md'
                      : 'bg-rose-950/60 border-rose-500/70 text-rose-200 shadow-md'
                    : 'bg-slate-950/50 border-slate-800 text-slate-300'
                }`}
              >
                {/* 1-Click Stance Toggle */}
                <div
                  onClick={handleToggleRageOrFrenzy}
                  className="flex items-center justify-between cursor-pointer group select-none"
                  title={
                    (isWhirlingFrenzy ? tc.whirlingFrenzy : tc.rage)
                      ? 'Click to end stance'
                      : remainingRage > 0
                      ? 'Click to activate stance & spend 1 daily use'
                      : 'No daily uses remaining (click to toggle stance anyway)'
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <i
                      className={`${
                        isWhirlingFrenzy
                          ? `fa-solid fa-tornado ${tc.whirlingFrenzy ? 'text-teal-400 animate-spin' : 'text-slate-400'}`
                          : `fa-solid fa-fire-flame-curved ${tc.rage ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`
                      }`}
                    ></i>
                    <span className="font-bold">
                      {isWhirlingFrenzy ? 'Whirling Frenzy' : 'Barbarian Rage'}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      (isWhirlingFrenzy ? tc.whirlingFrenzy : tc.rage)
                        ? isWhirlingFrenzy
                          ? 'bg-teal-400 text-slate-950'
                          : 'bg-rose-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {(isWhirlingFrenzy ? tc.whirlingFrenzy : tc.rage) ? 'ACTIVE' : 'READY'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-tight">
                  {isWhirlingFrenzy ? (
                    <>
                      <span className="text-rose-400 font-mono font-bold">+4 Str (+2 Atk)</span> &bull;{' '}
                      <span className="text-emerald-400 font-mono font-bold">+2 Dodge AC</span> &bull;{' '}
                      <span className="text-teal-300 font-mono font-bold">+2 Ref</span> &bull;{' '}
                      <span className="text-indigo-300 font-mono font-bold">+1 Extra Attack</span>
                    </>
                  ) : (
                    <>
                      <span className="text-rose-400 font-mono font-bold">+4 Str / +4 Con</span> &bull;{' '}
                      <span className="text-purple-300 font-mono font-bold">+2 Will</span> &bull;{' '}
                      <span className="text-amber-400 font-mono font-bold">-2 AC</span>
                    </>
                  )}
                </p>

                {/* Embedded Use Tracking & Bubbles */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] font-mono">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 text-[9px] uppercase font-bold">Uses:</span>
                    {Array.from({ length: rageMax }, (_, i) => {
                      const bubbleIndex = i + 1;
                      const isAvailable = bubbleIndex <= remainingRage;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBubbleClick('barbarian_rage', bubbleIndex, rageMax, remainingRage);
                          }}
                          className={`w-4 h-4 rounded-full flex items-center justify-center transition cursor-pointer ${
                            isAvailable
                              ? isWhirlingFrenzy
                                ? 'bg-teal-400 border border-teal-300'
                                : 'bg-rose-500 border border-rose-400'
                              : 'bg-slate-900 border border-slate-700'
                          }`}
                          title={`Use #${bubbleIndex}: ${isAvailable ? 'Available' : 'Spent'}`}
                        >
                          <span className={`w-1 h-1 rounded-full ${isAvailable ? 'bg-slate-950' : 'bg-slate-700'}`}></span>
                        </button>
                      );
                    })}
                  </div>
                  <span className={`font-bold ${remainingRage === 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {remainingRage}/{rageMax} left
                  </span>
                </div>
              </div>
            )}

            {/* 6. Paladin Smite Evil (Conditioned on Paladin Class) */}
            {hasSmiteEvil && (
              <div
                className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 transition ${
                  tc.smiteEvil
                    ? 'bg-blue-950/60 border-blue-400/70 text-blue-200 shadow-md'
                    : 'bg-slate-950/50 border-slate-800 text-slate-300'
                }`}
              >
                <div
                  onClick={handleToggleSmiteEvil}
                  className="flex items-center justify-between cursor-pointer group select-none"
                  title={
                    tc.smiteEvil
                      ? 'Click to cancel Smite Evil'
                      : remainingSmite > 0
                      ? 'Click to empower next attack with Smite Evil & spend 1 use'
                      : 'No daily uses remaining (click to toggle anyway)'
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <i className={`fa-solid fa-gavel ${tc.smiteEvil ? 'text-blue-400 animate-pulse' : 'text-slate-400'}`}></i>
                    <span className="font-bold">Paladin Smite Evil</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      tc.smiteEvil ? 'bg-blue-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tc.smiteEvil ? 'ACTIVE' : 'READY'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-tight">
                  <span className="text-blue-300 font-mono font-bold">+Cha Attack</span> &bull;{' '}
                  <span className="text-amber-300 font-mono font-bold">+{paladinLevel || 1} Damage vs Evil</span>
                </p>

                {/* Embedded Use Tracking & Bubbles */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] font-mono">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 text-[9px] uppercase font-bold">Uses:</span>
                    {Array.from({ length: smiteMax }, (_, i) => {
                      const bubbleIndex = i + 1;
                      const isAvailable = bubbleIndex <= remainingSmite;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBubbleClick('smite_evil', bubbleIndex, smiteMax, remainingSmite);
                          }}
                          className={`w-4 h-4 rounded-full flex items-center justify-center transition cursor-pointer ${
                            isAvailable
                              ? 'bg-blue-400 border border-blue-300'
                              : 'bg-slate-900 border border-slate-700'
                          }`}
                          title={`Smite #${bubbleIndex}: ${isAvailable ? 'Available' : 'Spent'}`}
                        >
                          <span className={`w-1 h-1 rounded-full ${isAvailable ? 'bg-slate-950' : 'bg-slate-700'}`}></span>
                        </button>
                      );
                    })}
                  </div>
                  <span className={`font-bold ${remainingSmite === 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {remainingSmite}/{smiteMax} left
                  </span>
                </div>
              </div>
            )}

            {/* 7. Stunning Fist (Conditioned on Monk Level or Feat) */}
            {hasStunningFist && (
              <div
                className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 transition ${
                  tc.stunningFist
                    ? 'bg-orange-950/60 border-orange-400/70 text-orange-200 shadow-md'
                    : 'bg-slate-950/50 border-slate-800 text-slate-300'
                }`}
              >
                <div
                  onClick={handleToggleStunningFist}
                  className="flex items-center justify-between cursor-pointer group select-none"
                  title={
                    tc.stunningFist
                      ? 'Click to cancel Stunning Fist'
                      : remainingStunning > 0
                      ? 'Click to empower next attack with Stunning Fist & spend 1 use'
                      : 'No daily uses remaining (click to toggle anyway)'
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <i className={`fa-solid fa-hand-back-fist ${tc.stunningFist ? 'text-orange-400 animate-pulse' : 'text-slate-400'}`}></i>
                    <span className="font-bold">Stunning Fist</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      tc.stunningFist ? 'bg-orange-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tc.stunningFist ? 'ACTIVE' : 'READY'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-tight">
                  <span className="text-orange-300 font-mono font-bold">Fort DC 10 + 1/2 lvl + Wis</span> &bull; Stunned 1 round
                </p>

                {/* Embedded Use Tracking & Bubbles */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] font-mono">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 text-[9px] uppercase font-bold">Uses:</span>
                    {Array.from({ length: stunningMax }, (_, i) => {
                      const bubbleIndex = i + 1;
                      const isAvailable = bubbleIndex <= remainingStunning;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBubbleClick('stunning_fist', bubbleIndex, stunningMax, remainingStunning);
                          }}
                          className={`w-4 h-4 rounded-full flex items-center justify-center transition cursor-pointer ${
                            isAvailable
                              ? 'bg-orange-400 border border-orange-300'
                              : 'bg-slate-900 border border-slate-700'
                          }`}
                          title={`Stunning Fist #${bubbleIndex}: ${isAvailable ? 'Available' : 'Spent'}`}
                        >
                          <span className={`w-1 h-1 rounded-full ${isAvailable ? 'bg-slate-950' : 'bg-slate-700'}`}></span>
                        </button>
                      );
                    })}
                  </div>
                  <span className={`font-bold ${remainingStunning === 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {remainingStunning}/{stunningMax} left
                  </span>
                </div>
              </div>
            )}

            {/* 8. Monk Flurry of Blows Toggle (Conditioned on Monk Class) */}
            {hasFlurryOfBlows && (
              <button
                onClick={() => updateTc({ flurryOfBlows: !tc.flurryOfBlows })}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer group ${
                  tc.flurryOfBlows
                    ? 'bg-indigo-950/50 border-indigo-400/60 text-indigo-200 shadow-md'
                    : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <i className={`fa-solid fa-hand-fist ${tc.flurryOfBlows ? 'text-indigo-400' : 'text-slate-400'}`}></i> Monk Flurry of Blows
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${tc.flurryOfBlows ? 'bg-indigo-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    {tc.flurryOfBlows ? 'ON' : 'OFF'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  <span className="text-rose-400 font-mono font-bold">-2 All Attacks</span> &bull; <span className="text-indigo-300 font-mono font-bold">+1 Extra Attack at Full BAB</span>
                </p>
              </button>
            )}
          </div>

          {/* Active Buffs & Stances Management Panel */}
          <TacticalPanel character={character} onChange={onChange} />

          {/* Active Modifiers Summary Bar */}
          {hasAnyActive && (
            <div className="bg-slate-950/80 rounded-xl p-3 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-amber-400 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                  <i className="fa-solid fa-calculator"></i> Active Modifiers:
                </span>

                {/* Stance Attack Penalty / Bonus */}
                {mods.attackMod !== 0 && (
                  <span className={`badge font-mono ${mods.attackMod > 0 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                    Attack: {mods.attackMod > 0 ? `+${mods.attackMod}` : mods.attackMod}
                  </span>
                )}

                {/* Power Attack Damage Bonus */}
                {tc.powerAttack > 0 && (
                  <span className="badge bg-amber-500/20 text-amber-300 border-amber-500/30 font-mono">
                    Damage: +{tc.powerAttack} (+{tc.powerAttack * 2} 2H)
                  </span>
                )}

                {/* Net AC Modifier */}
                {mods.acNetMod !== 0 && (
                  <span className={`badge font-mono ${mods.acNetMod > 0 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                    AC: {mods.acNetMod > 0 ? `+${mods.acNetMod}` : mods.acNetMod}
                  </span>
                )}

                {/* Net Speed Modifier */}
                {mods.speedMod > 0 && (
                  <span className="badge bg-cyan-500/20 text-cyan-300 border-cyan-500/30 font-mono">
                    Speed: +{mods.speedMod}ft
                  </span>
                )}

                {/* Reflex Save Modifier */}
                {mods.refSaveMod > 0 && (
                  <span className="badge bg-teal-500/20 text-teal-300 border-teal-500/30 font-mono">
                    Reflex: +{mods.refSaveMod}
                  </span>
                )}

                {/* Will Save Modifier */}
                {mods.willSaveMod > 0 && (
                  <span className="badge bg-purple-500/20 text-purple-300 border-purple-500/30 font-mono">
                    Will: +{mods.willSaveMod}
                  </span>
                )}

                {/* Fortitude Save Modifier */}
                {mods.fortSaveMod > 0 && (
                  <span className="badge bg-amber-500/20 text-amber-300 border-amber-500/30 font-mono">
                    Fortitude: +{mods.fortSaveMod}
                  </span>
                )}

                {/* Strength Bonus */}
                {mods.strBonus > 0 && (
                  <span className="badge bg-rose-500/20 text-rose-300 border-rose-500/30 font-mono">
                    Str: +{mods.strBonus} (+{Math.floor(mods.strBonus / 2)} Mod)
                  </span>
                )}

                {/* Constitution Bonus */}
                {mods.conBonus > 0 && (
                  <span className="badge bg-rose-500/20 text-rose-300 border-rose-500/30 font-mono">
                    Con: +{mods.conBonus} (+{Math.floor(mods.conBonus / 2)} Mod / +{mods.hpBonusPerLevel} HP/lvl)
                  </span>
                )}

                {/* Extra Attack Indicator */}
                {(tc.haste || tc.flurryOfBlows || tc.whirlingFrenzy) && (
                  <span className="badge bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-mono">
                    Extra Attack: +1 at highest BAB
                  </span>
                )}

                {/* Smite Evil Indicator */}
                {tc.smiteEvil && (
                  <span className="badge bg-blue-500/20 text-blue-300 border-blue-500/30 font-mono">
                    Smite Evil: Empowered
                  </span>
                )}

                {/* Stunning Fist Indicator */}
                {tc.stunningFist && (
                  <span className="badge bg-orange-500/20 text-orange-300 border-orange-500/30 font-mono">
                    Stunning Fist: Empowered
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
