import React, { useState } from 'react';
import { CharacterState, ConditionCategory } from '../types/character';
import {
  DND_CONDITIONS,
  CONDITION_MAP,
  calculateConditionPenalties,
  getHealthStatus,
  applyDamage,
  applyHeal,
  toggleCondition
} from '../engine/conditions';

interface VitalsCombatTrackerProps {
  character: CharacterState;
  maxHp: number;
  onChange: (updated: Partial<CharacterState>) => void;
  className?: string;
  isCompact?: boolean;
}

export const VitalsCombatTracker: React.FC<VitalsCombatTrackerProps> = ({
  character,
  maxHp,
  onChange,
  className = '',
  isCompact = false
}) => {
  // Resolve effective current HP (default to maxHp if not set)
  const currentHp = character.currentHp !== undefined ? character.currentHp : maxHp;
  const tempHp = character.tempHp || 0;
  const nonlethalDamage = character.nonlethalDamage || 0;
  const activeConditions = character.activeConditions || [];

  const [customAmount, setCustomAmount] = useState<string>('');
  const [isNonlethalInput, setIsNonlethalInput] = useState<boolean>(false);
  const [conditionCategoryFilter, setConditionCategoryFilter] = useState<ConditionCategory | 'all'>('all');
  const [conditionSearch, setConditionSearch] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const healthStatus = getHealthStatus(currentHp, maxHp, tempHp, nonlethalDamage);
  const penalties = calculateConditionPenalties(activeConditions);

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

  const handleFullRest = () => {
    onChange({
      currentHp: maxHp,
      tempHp: 0,
      nonlethalDamage: 0,
      activeConditions: activeConditions.filter(c => c !== 'fatigued' && c !== 'exhausted')
    });
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
      {/* Widget Header */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 text-xs select-none ${
          !isCollapsed ? 'border-b border-slate-800 pb-3' : ''
        }`}
      >
        <div
          className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-[240px]"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Click to expand Vitals & Conditions HUD' : 'Click to collapse Vitals & Conditions HUD'}
        >
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <i className="fa-solid fa-heart-pulse text-sm"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-heading text-slate-100 flex items-center gap-2">
                Live Vitals & Condition Tracker
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
            </div>
            <p className="text-[11px] text-slate-400">
              {isCollapsed
                ? 'Click to expand live HP adjustments, temp HP, nonlethal damage, and condition toggles'
                : 'Manage real-time Hit Points, quick damage/healing, temporary HP, and 1-click combat conditions.'}
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
          {(currentHp < maxHp || tempHp > 0 || nonlethalDamage > 0) && (
            <button
              onClick={handleFullRest}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono transition bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 cursor-pointer"
              title="Restore full HP, clear temp HP and nonlethal damage"
            >
              <i className="fa-solid fa-bed"></i> Full Rest
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 font-semibold transition bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg border border-rose-500/30 cursor-pointer"
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
                      className="text-slate-400 hover:text-cyan-300 disabled:opacity-30 px-1"
                    >
                      -
                    </button>
                    <span className="font-bold text-cyan-300 min-w-[16px] text-center">{tempHp}</span>
                    <button
                      onClick={() => handleTempHpChange(1)}
                      className="text-slate-400 hover:text-cyan-300 px-1"
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
                      className="text-slate-400 hover:text-amber-300 disabled:opacity-30 px-1"
                    >
                      -
                    </button>
                    <span className="font-bold text-amber-300 min-w-[16px] text-center">{nonlethalDamage}</span>
                    <button
                      onClick={() => handleNonlethalChange(1)}
                      className="text-slate-400 hover:text-amber-300 px-1"
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

          {/* Conditions Engine Section */}
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
