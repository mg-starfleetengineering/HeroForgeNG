import React from 'react';
import { CharacterState, TacticalCombatState } from '../types/character';
import {
  DEFAULT_TACTICAL_COMBAT,
  getTacticalCombatState,
  calculateTacticalCombatModifiers
} from '../engine/combat';

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
  const maxPa = Math.max(0, bab);
  const maxCe = Math.max(0, Math.min(bab, 5));

  const updateTc = (updates: Partial<TacticalCombatState>) => {
    const updatedState: TacticalCombatState = { ...tc, ...updates };
    onChange({ tacticalCombat: updatedState });
  };

  const handleReset = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange({ tacticalCombat: DEFAULT_TACTICAL_COMBAT });
  };

  const hasAnyActive =
    tc.powerAttack > 0 ||
    tc.combatExpertise > 0 ||
    tc.fightingDefensively ||
    tc.haste ||
    tc.rage ||
    tc.whirlingFrenzy ||
    tc.flurryOfBlows;

  const mods = calculateTacticalCombatModifiers(tc);

  return (
    <div className={`card bg-slate-900/80 backdrop-blur border border-amber-500/20 p-4 rounded-2xl shadow-xl transition-all ${className}`}>
      {/* Widget Header */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 text-xs select-none ${!tc.isCollapsed ? 'border-b border-slate-800 pb-3' : ''}`}
      >
        <div
          className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-[240px]"
          onClick={() => updateTc({ isCollapsed: !tc.isCollapsed })}
          title={tc.isCollapsed ? "Click to expand combat toggles" : "Click to collapse combat toggles"}
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
                ? "Click to expand active combat stances & sliders"
                : "Adjust combat stances to dynamically recalculate Attacks, AC, Speed, Damage, and Saves."}
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
            {tc.rage && <span className="badge bg-rose-500/20 text-rose-300 border-rose-500/30">Rage</span>}
            {tc.whirlingFrenzy && <span className="badge bg-teal-500/20 text-teal-300 border-teal-500/30">Frenzy</span>}
            {character.wildShape?.isActive && (
              <span className="badge bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                🌿 Wild Shape
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {hasAnyActive && (
            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 font-mono transition bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700"
              title="Reset all tactical combat toggles"
            >
              <i className="fa-solid fa-rotate-left"></i> Reset
            </button>
          )}
          <button
            onClick={() => updateTc({ isCollapsed: !tc.isCollapsed })}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 font-semibold transition bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30"
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
            {/* 1. Power Attack Slider */}
            <div className={`p-3 rounded-xl border transition ${tc.powerAttack > 0 ? 'bg-amber-950/40 border-amber-500/50 shadow-md' : 'bg-slate-950/50 border-slate-800'}`}>
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

            {/* 2. Combat Expertise Slider */}
            <div className={`p-3 rounded-xl border transition ${tc.combatExpertise > 0 ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md' : 'bg-slate-950/50 border-slate-800'}`}>
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

            {/* 3. Fighting Defensively Toggle */}
            <button
              onClick={() => updateTc({ fightingDefensively: !tc.fightingDefensively })}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition group ${
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

            {/* 4. Haste Toggle */}
            <button
              onClick={() => updateTc({ haste: !tc.haste })}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition group ${
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

            {/* 5. Barbarian Rage Toggle */}
            <button
              onClick={() => updateTc({ rage: !tc.rage, whirlingFrenzy: false })}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition group ${
                tc.rage
                  ? 'bg-rose-950/60 border-rose-500/70 text-rose-200 shadow-md'
                  : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-bold flex items-center gap-1.5">
                  <i className={`fa-solid fa-fire-flame-curved ${tc.rage ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}></i> Barbarian Rage
                </span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${tc.rage ? 'bg-rose-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  {tc.rage ? 'ON' : 'OFF'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                <span className="text-rose-400 font-mono font-bold">+4 Str / +4 Con</span> &bull; <span className="text-purple-300 font-mono font-bold">+2 Will</span> &bull; <span className="text-amber-400 font-mono font-bold">-2 AC</span>
              </p>
            </button>

            {/* 6. Whirling Frenzy Toggle */}
            <button
              onClick={() => updateTc({ whirlingFrenzy: !tc.whirlingFrenzy, rage: false })}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition group ${
                tc.whirlingFrenzy
                  ? 'bg-teal-950/60 border-teal-400/70 text-teal-200 shadow-md'
                  : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-bold flex items-center gap-1.5">
                  <i className={`fa-solid fa-tornado ${tc.whirlingFrenzy ? 'text-teal-400 animate-spin' : 'text-slate-400'}`}></i> Whirling Frenzy
                </span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${tc.whirlingFrenzy ? 'bg-teal-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  {tc.whirlingFrenzy ? 'ON' : 'OFF'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                <span className="text-rose-400 font-mono font-bold">+4 Str (+2 Atk)</span> &bull; <span className="text-emerald-400 font-mono font-bold">+2 Dodge AC</span> &bull; <span className="text-teal-300 font-mono font-bold">+2 Ref</span> &bull; <span className="text-indigo-300 font-mono font-bold">-2 Flurry (+1 Extra Atk)</span>
              </p>
            </button>

            {/* 7. Monk Flurry of Blows Toggle */}
            <button
              onClick={() => updateTc({ flurryOfBlows: !tc.flurryOfBlows })}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition group ${
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
          </div>

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
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
