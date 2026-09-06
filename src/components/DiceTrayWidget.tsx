import React, { useState, useEffect, useRef } from 'react';
import {
  RollResult,
  getRollHistory,
  clearRollHistory,
  subscribeRolls,
  rollDice
} from '../engine/dice';

const QUICK_DICE = [
  { label: 'd4', sides: 4, icon: 'fa-solid fa-dice-d6' },
  { label: 'd6', sides: 6, icon: 'fa-solid fa-dice-d6' },
  { label: 'd8', sides: 8, icon: 'fa-solid fa-dice-d6' },
  { label: 'd10', sides: 10, icon: 'fa-solid fa-dice-d6' },
  { label: 'd12', sides: 12, icon: 'fa-solid fa-dice-d6' },
  { label: 'd20', sides: 20, icon: 'fa-solid fa-dice-d20' },
  { label: 'd100', sides: 100, icon: 'fa-solid fa-dice' }
];

export const DiceTrayWidget: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [history, setHistory] = useState<RollResult[]>([]);
  const [customFormula, setCustomFormula] = useState<string>('');
  const [lastRoll, setLastRoll] = useState<RollResult | null>(null);
  const [justRolledId, setJustRolledId] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial load
    setHistory(getRollHistory());
    const initialList = getRollHistory();
    if (initialList.length > 0) {
      setLastRoll(initialList[0]);
    }

    // Subscribe to all rolls globally
    const unsubscribe = subscribeRolls((newRoll) => {
      setHistory(getRollHistory());
      setLastRoll(newRoll);
      setJustRolledId(newRoll.id);

      // Flash highlight for 1.5s
      setTimeout(() => {
        setJustRolledId(null);
      }, 1500);

      // Auto-scroll to top of list if expanded
      if (logContainerRef.current) {
        logContainerRef.current.scrollTop = 0;
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleQuickRoll = (sides: number, label: string) => {
    rollDice(`1d${sides}`, `Quick ${label} Roll`);
  };

  const handleCustomRoll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customFormula.trim()) return;
    rollDice(customFormula.trim(), 'Custom Roll');
    setCustomFormula('');
  };

  const handleClearHistory = () => {
    clearRollHistory();
    setHistory([]);
    setLastRoll(null);
  };

  const handleReroll = (roll: RollResult) => {
    rollDice(roll.formula, roll.label, {
      threatMin: roll.threatMin,
      critMultiplier: roll.critMultiplier,
      rollType: roll.rollType,
      components: roll.components
    });
  };

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getRollTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'attack':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'damage':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'save':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'skill':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'ability':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'grapple':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'initiative':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 print:hidden transition-all duration-300">
      {/* Expanded Roll History Drawer */}
      {isExpanded && (
        <div className="bg-slate-950/95 backdrop-blur-md border-t-2 border-amber-500/50 shadow-2xl max-h-[380px] sm:max-h-[440px] flex flex-col transition-all">
          {/* Drawer Header Controls */}
          <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-inner">
                <i className="fa-solid fa-dice-d20 text-lg animate-pulse"></i>
              </span>
              <div>
                <h3 className="font-heading font-bold text-sm text-slate-100 flex items-center gap-2">
                  Dice Tray & Roll History Log
                  <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full">
                    {history.length} {history.length === 1 ? 'roll' : 'rolls'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Click any stat or attack to roll automatically</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="px-2.5 py-1 text-xs rounded-lg font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-slate-700/60 transition flex items-center gap-1.5 cursor-pointer"
                  title="Clear all recorded rolls"
                >
                  <i className="fa-solid fa-trash-can text-[11px]"></i> Clear History
                </button>
              )}
              <button
                onClick={() => setIsExpanded(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center border border-slate-700 transition cursor-pointer"
                title="Collapse Dice Tray"
              >
                <i className="fa-solid fa-chevron-down text-xs"></i>
              </button>
            </div>
          </div>

          {/* Roll History List */}
          <div
            ref={logContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900"
          >
            {history.length === 0 ? (
              <div className="text-center py-8 text-slate-500 space-y-2">
                <i className="fa-solid fa-dice text-3xl text-slate-600 block"></i>
                <p className="text-sm font-medium">No rolls recorded yet in this session.</p>
                <p className="text-xs text-slate-400">
                  Click any weapon attack, damage value, saving throw, or skill modifier on your character sheet to roll!
                </p>
              </div>
            ) : (
              history.map((roll) => {
                const isJustRolled = roll.id === justRolledId;

                return (
                  <div
                    key={roll.id}
                    className={`p-3 rounded-xl border transition-all duration-300 space-y-1.5 ${
                      roll.status === 'nat20'
                        ? 'bg-gradient-to-r from-emerald-950/40 via-amber-950/20 to-slate-900/90 border-amber-500/60 shadow-lg shadow-amber-500/10'
                        : roll.status === 'crit_threat'
                        ? 'bg-gradient-to-r from-amber-950/40 via-slate-900/80 to-slate-900/90 border-amber-400/50 shadow-md shadow-amber-500/10'
                        : roll.status === 'nat1'
                        ? 'bg-gradient-to-r from-rose-950/40 via-slate-900/80 to-slate-900/90 border-rose-500/50 shadow-md shadow-rose-500/10'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    } ${isJustRolled ? 'ring-2 ring-amber-400 scale-[1.01]' : ''}`}
                  >
                    {/* Card Top Row: Label, Type, Timestamp, Reroll */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${getRollTypeBadgeClass(roll.rollType)}`}>
                          {roll.rollType}
                        </span>
                        <span className="font-bold text-sm text-slate-100 truncate">{roll.label || roll.formula}</span>
                        <span className="text-[11px] font-mono text-slate-400 bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800">
                          {roll.formula}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono text-slate-500">{formatTimestamp(roll.timestamp)}</span>
                        <button
                          onClick={() => handleReroll(roll)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 text-xs transition border border-slate-700 flex items-center gap-1 cursor-pointer"
                          title="Re-roll this formula"
                        >
                          <i className="fa-solid fa-arrow-rotate-right text-[10px]"></i> Re-roll
                        </button>
                      </div>
                    </div>

                    {/* Middle Row: Big Total & Math Breakdown */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
                      <div className="flex items-baseline gap-3">
                        <span
                          className={`text-2xl font-black font-mono tracking-tight ${
                            roll.status === 'nat20'
                              ? 'text-amber-300'
                              : roll.status === 'crit_threat'
                              ? 'text-amber-400'
                              : roll.status === 'nat1'
                              ? 'text-rose-400'
                              : 'text-slate-100'
                          }`}
                        >
                          {roll.total}
                        </span>

                        {/* Breakdown String */}
                        <span className="text-xs font-mono text-slate-300 break-all">
                          {roll.detailedBreakdown || roll.breakdown}
                        </span>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {roll.status === 'nat20' && (
                          <span className="text-xs font-bold font-sans px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            💥 NATURAL 20!
                          </span>
                        )}
                        {roll.status === 'crit_threat' && (
                          <span className="text-xs font-bold font-sans px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                            ⚡ CRITICAL THREAT ({roll.threatMin < 20 ? `${roll.threatMin}-20` : '20'})!
                          </span>
                        )}
                        {roll.status === 'nat1' && (
                          <span className="text-xs font-bold font-sans px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                            💀 NATURAL 1 (Fumble!)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Automatic Critical Confirmation Roll Card (if present) */}
                    {roll.confirmationRoll && (
                      <div className="mt-1.5 ml-3 pl-3 border-l-2 border-amber-500/60 bg-amber-950/20 rounded-r-lg p-2 text-xs font-mono flex flex-wrap items-center justify-between gap-2 border border-amber-500/30">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-300 flex items-center gap-1">
                            <i className="fa-solid fa-shield-halved text-amber-400"></i> Crit Confirmation:
                          </span>
                          <span className="text-base font-black text-slate-100">{roll.confirmationRoll.total}</span>
                          <span className="text-slate-400 text-[11px]">
                            ({roll.confirmationRoll.detailedBreakdown || roll.confirmationRoll.breakdown})
                          </span>
                        </div>

                        {roll.confirmationRoll.status === 'nat20' && (
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/40">
                            💥 Nat 20 Confirmed!
                          </span>
                        )}
                        {roll.confirmationRoll.status === 'nat1' && (
                          <span className="text-[10px] font-bold text-rose-300 bg-rose-500/20 px-1.5 py-0.2 rounded border border-rose-500/40">
                            💀 Nat 1 Confirmation
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Docked HUD Bottom Bar */}
      <div className="bg-slate-950/90 backdrop-blur-md border-t border-slate-800 px-3 sm:px-6 py-2 shadow-2xl flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        {/* Left Section: Last Roll Snapshot / Toggle Trigger */}
        <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-700/80 text-left transition group cursor-pointer shadow-md"
            title={isExpanded ? 'Collapse Dice Tray' : 'Open Dice Tray & Roll History'}
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 group-hover:scale-105 transition">
              <i className="fa-solid fa-dice-d20 text-base"></i>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-bold text-xs text-slate-100 group-hover:text-amber-400 transition">
                  Dice Tray
                </span>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 rounded-full">
                  {history.length}
                </span>
                <i className={`fa-solid fa-chevron-${isExpanded ? 'down' : 'up'} text-[10px] text-slate-400 transition-transform`}></i>
              </div>
              {lastRoll ? (
                <p className="text-[10.5px] font-mono text-slate-400 truncate max-w-[200px] sm:max-w-[280px]">
                  Latest: <strong className="text-amber-300">{lastRoll.total}</strong> ({lastRoll.label || lastRoll.formula})
                </p>
              ) : (
                <p className="text-[10.5px] text-slate-500">Ready to roll</p>
              )}
            </div>
          </button>

          {/* Quick Roll Pill Notification if recent roll */}
          {lastRoll && !isExpanded && (
            <div
              onClick={() => setIsExpanded(true)}
              className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-xl border text-xs font-mono cursor-pointer transition ${
                lastRoll.status === 'nat20'
                  ? 'bg-amber-950/40 border-amber-500/60 text-amber-300'
                  : lastRoll.status === 'crit_threat'
                  ? 'bg-amber-950/30 border-amber-400/50 text-amber-300'
                  : lastRoll.status === 'nat1'
                  ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300'
              }`}
            >
              <span className="font-bold text-sm text-slate-100">{lastRoll.total}</span>
              <span className="text-slate-400 text-[11px] truncate max-w-[180px]">{lastRoll.detailedBreakdown || lastRoll.breakdown}</span>
              {lastRoll.status === 'nat20' && <span className="font-bold text-[10px] text-amber-300">💥 NAT 20</span>}
              {lastRoll.status === 'crit_threat' && <span className="font-bold text-[10px] text-amber-400">⚡ THREAT</span>}
              {lastRoll.status === 'nat1' && <span className="font-bold text-[10px] text-rose-400">💀 FUMBLE</span>}
            </div>
          )}
        </div>

        {/* Center Section: Quick Die Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {QUICK_DICE.map(die => (
            <button
              key={die.label}
              onClick={() => handleQuickRoll(die.sides, die.label)}
              className="px-2 sm:px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
              title={`Roll 1${die.label}`}
            >
              <i className={`${die.icon} text-[10px] text-amber-400/80`}></i>
              <span>{die.label}</span>
            </button>
          ))}
        </div>

        {/* Right Section: Expression Input Form */}
        <form onSubmit={handleCustomRoll} className="flex items-center gap-1.5 shrink-0">
          <div className="relative">
            <input
              type="text"
              value={customFormula}
              onChange={e => setCustomFormula(e.target.value)}
              placeholder="e.g. 2d6+5, 1d20+12"
              className="w-32 sm:w-44 px-2.5 py-1 text-xs font-mono bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
            {customFormula && (
              <button
                type="button"
                onClick={() => setCustomFormula('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-slate-300"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!customFormula.trim()}
            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs transition cursor-pointer shadow flex items-center gap-1 disabled:cursor-not-allowed"
          >
            <i className="fa-solid fa-dice-d20"></i> Roll
          </button>
        </form>
      </div>
    </div>
  );
};
