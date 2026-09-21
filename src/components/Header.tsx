import React, { useState, useRef, useEffect } from 'react';
import { CharacterSheetData, CharacterSummary, RaceData, ClassData, Equipment, TraitData, FlawData } from '../types/character';
import {
  calculateTotalScore,
  getAbilityMod,
  parseRaceMods,
  calculateTraitFlawStatMods,
  calculateTraitFlawSaveMods,
  calculateTraitFlawHpPerLevel,
  calculateTraitFlawAcMod
} from '../engine/stats';
import { calculateBAB, calculateBaseSave, calculateTotalHP } from '../engine/classes';
import { calculateTotalDR } from '../engine/dr';
import { calculateConditionPenalties } from '../engine/conditions';
import { useGameData } from '../context/GameDataContext';
import { useCharacter, useCharacterDispatch } from '../context/CharacterContext';

interface HeaderProps {
  character?: CharacterSheetData;
  summaries: CharacterSummary[];
  racesData?: RaceData[];
  classesData?: ClassData[];
  traitsData?: TraitData[];
  flawsData?: FlawData[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSelectCharacter: (id: string) => void;
  onOpenRoster: () => void;
  onCreateNew: () => void;
  onExport: () => void;
  onExportAll?: () => void;
  onExportRoll20: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenDocs?: () => void;
  onOpenCommandPalette?: () => void;
}

export const Header: React.FC<HeaderProps> = (props) => {
  const contextCharacter = useCharacter();
  const { undo, redo, canUndo = false, canRedo = false } = useCharacterDispatch();
  const gameData = useGameData();

  const character = props.character ?? contextCharacter;
  const racesData = props.racesData ?? gameData.racesData;
  const classesData = props.classesData ?? gameData.classesData;
  const traitsData = props.traitsData ?? gameData.traitsData;
  const flawsData = props.flawsData ?? gameData.flawsData;
  const {
    summaries,
    activeTab,
    setActiveTab,
    onSelectCharacter,
    onOpenRoster,
    onCreateNew,
    onExport,
    onExportAll,
    onExportRoll20,
    onImport,
    onOpenDocs,
    onOpenCommandPalette
  } = props;
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showCharacterDropdown, setShowCharacterDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const characterDropdownRef = useRef<HTMLDivElement>(null);
  const actionsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (characterDropdownRef.current && !characterDropdownRef.current.contains(event.target as Node)) {
        setShowCharacterDropdown(false);
      }
      if (actionsDropdownRef.current && !actionsDropdownRef.current.contains(event.target as Node)) {
        setShowActionsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const raceObj: Partial<RaceData> = racesData.find(r => r.name === character.selectedRace) || {};
  const raceMods = parseRaceMods(raceObj);

  const selectedTraits = character.selectedTraits || [];
  const selectedFlaws = character.selectedFlaws || [];

  const traitFlawStatMods = calculateTraitFlawStatMods(selectedTraits, selectedFlaws, traitsData, flawsData);
  const traitFlawSaveMods = calculateTraitFlawSaveMods(selectedTraits, selectedFlaws, traitsData, flawsData);
  const traitFlawHpMod = calculateTraitFlawHpPerLevel(selectedTraits, selectedFlaws, traitsData, flawsData);
  const traitFlawAcMod = calculateTraitFlawAcMod(selectedTraits, selectedFlaws, traitsData, flawsData);

  const activeConditions = character.activeConditions || [];
  const conditionPenalties = calculateConditionPenalties(activeConditions);

  const totalLevel = character.levelProgression.filter(l => l.primaryClass).length || 1;
  const rawCon = calculateTotalScore('con', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel, traitFlawStatMods);
  const rawDex = calculateTotalScore('dex', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel, traitFlawStatMods);
  const wisScore = calculateTotalScore('wis', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel, traitFlawStatMods);

  const effectiveCon = Math.max(0, rawCon);
  const effectiveDex = conditionPenalties.dexPenalty === -99 ? 0 : Math.max(0, rawDex + conditionPenalties.dexPenalty);

  const conMod = getAbilityMod(effectiveCon);
  const dexMod = getAbilityMod(effectiveDex);
  const wisMod = getAbilityMod(wisScore);

  const maxHp = calculateTotalHP(character.levelProgression, classesData, conMod, traitFlawHpMod);
  const currentHp = character.currentHp !== undefined ? character.currentHp : maxHp;
  const tempHp = character.tempHp || 0;

  const bab = calculateBAB(character.levelProgression, classesData);

  const baseFort = calculateBaseSave('fort', character.levelProgression, classesData);
  const baseRef = calculateBaseSave('ref', character.levelProgression, classesData);
  const baseWill = calculateBaseSave('will', character.levelProgression, classesData);

  const totalFort = baseFort + conMod + traitFlawSaveMods.fort + conditionPenalties.fortPenalty;
  const totalRef = baseRef + dexMod + traitFlawSaveMods.ref + conditionPenalties.refPenalty;
  const totalWill = baseWill + wisMod + traitFlawSaveMods.will + conditionPenalties.willPenalty;

  const eq: Equipment = character.equipment || {
    armor: 'chainshirt', armorEnhancement: 1, shield: 'heavy_shield', shieldEnhancement: 1,
    deflection: 0, natural: 0, dodge: 0, primaryWeapon: 'Longsword'
  };
  const armorBonusMap: Record<string, number> = { none: 0, padded: 1, leather: 2, studded: 3, chainshirt: 4, breastplate: 5, fullplate: 8 };
  const shieldBonusMap: Record<string, number> = { none: 0, buckler: 1, light_wooden: 1, heavy_shield: 2, tower_shield: 4 };
  const finalDexToAc = conditionPenalties.loseDexToAc ? Math.min(0, dexMod) : dexMod;
  const totalAc = 10 + (armorBonusMap[eq.armor] || 0) + (eq.armorEnhancement || 0) + (shieldBonusMap[eq.shield] || 0) + (eq.shieldEnhancement || 0) + finalDexToAc + (eq.deflection || 0) + (eq.natural || 0) + (eq.dodge || 0) + traitFlawAcMod + conditionPenalties.acPenalty;

  const drSummary = calculateTotalDR(character, raceObj, undefined, [], classesData);

  const filteredSummaries = summaries.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.race.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.classes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'stats', label: 'Stats', icon: 'fa-chart-simple' },
    { id: 'race-class', label: 'Race & Class', icon: 'fa-shield-halved' },
    { id: 'skills', label: 'Skills', icon: 'fa-hand-sparkles' },
    { id: 'feats', label: 'Feats', icon: 'fa-award' },
    { id: 'equipment', label: 'Equipment', icon: 'fa-boxes-packing' },
    { id: 'spells', label: 'Spells', icon: 'fa-hat-wizard' },
    { id: 'familiar', label: 'Familiar', icon: 'fa-cat' },
    { id: 'companion', label: 'Companion', icon: 'fa-paw' },
    { id: 'auras', label: 'Auras', icon: 'fa-sun' },
    { id: 'sources', label: 'Sources', icon: 'fa-book-atlas' },
    { id: 'notes', label: 'Notes', icon: 'fa-book-bookmark' },
    { id: 'sheet', label: 'Sheet View', icon: 'fa-scroll' }
  ];

  return (
    <header className="app-header bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-3 py-2 flex items-center justify-between gap-1.5 sm:gap-2.5">
        {/* Left Group: Brand + Search (Ctrl+K) + Undo/Redo */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-red-700 flex items-center justify-center shadow-md shadow-amber-900/30 text-slate-950 font-extrabold text-base sm:text-lg shrink-0">
              <i className="fa-solid fa-dice-d20"></i>
            </div>
            <div>
              <div className="flex items-center gap-1 leading-none">
                <h1 className="text-base sm:text-lg font-bold font-heading bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent tracking-wide">
                  HeroForgeNG
                </h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-semibold">
                  v3.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden xl:block leading-none mt-1">D&D 3.5 Character Engine</p>
            </div>
          </div>

          {/* Quick Search Button (Ctrl+K) */}
          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 transition text-xs shadow-inner cursor-pointer shrink-0"
              title="Quick Search & Command Palette (Ctrl+K)"
              aria-label="Quick Search"
            >
              <i className="fa-solid fa-magnifying-glass text-amber-400 text-xs"></i>
              <span className="hidden sm:inline text-slate-400 text-xs font-medium">Search...</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-slate-900 border border-slate-700 rounded text-slate-400">
                Ctrl+K
              </kbd>
            </button>
          )}

          {/* Character History Undo / Redo (Mobile only) */}
          <div className="flex md:hidden items-center bg-slate-950/60 p-0.5 rounded-xl border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition ${
                canUndo
                  ? 'text-slate-200 hover:text-amber-300 hover:bg-slate-800 cursor-pointer'
                  : 'text-slate-600 cursor-not-allowed opacity-30'
              }`}
              title="Undo Character Edit (Ctrl+Z)"
              aria-label="Undo"
            >
              <i className="fa-solid fa-rotate-left text-[11px]"></i>
            </button>
            <div className="h-3.5 w-px bg-slate-800"></div>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition ${
                canRedo
                  ? 'text-slate-200 hover:text-amber-300 hover:bg-slate-800 cursor-pointer'
                  : 'text-slate-600 cursor-not-allowed opacity-30'
              }`}
              title="Redo Character Edit (Ctrl+Y)"
              aria-label="Redo"
            >
              <i className="fa-solid fa-rotate-right text-[11px]"></i>
            </button>
          </div>
        </div>

        {/* Center: Quick Summary Bar with Character Switcher Dropdown (hidden on screens < 768px) */}
        <div className="hidden md:flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="relative" ref={characterDropdownRef}>
            <button
              type="button"
              onClick={() => setShowCharacterDropdown(!showCharacterDropdown)}
              className="flex items-center gap-1.5 sm:gap-2 bg-slate-950/60 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900/60 px-2.5 sm:px-3 py-1 rounded-xl text-xs transition group cursor-pointer shadow-inner"
              title="Click to switch active character or manage roster"
            >
              {/* Active Character Identity */}
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-lg border border-amber-500/40 bg-slate-900 overflow-hidden shrink-0 shadow-sm group-hover:border-amber-400 transition flex items-center justify-center">
                  {character.portraitUrl ? (
                    <img src={character.portraitUrl} alt={character.name} className="w-full h-full object-cover" />
                  ) : (
                    <i className="fa-solid fa-user-shield text-amber-400 text-xs"></i>
                  )}
                </div>
                <div className="text-left hidden lg:block max-w-[85px] xl:max-w-[120px] truncate leading-tight">
                  <div className="font-bold text-amber-300 truncate text-xs">{character.name || 'Hero'}</div>
                  <div className="text-[10px] text-slate-400 truncate">Lvl {totalLevel} {character.selectedRace || ''}</div>
                </div>
              </div>

              <div className="h-6 w-px bg-slate-800"></div>

              <div className="text-center">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Level</span>
                <span className="font-mono font-bold text-amber-400 text-sm">{totalLevel}</span>
              </div>
              <div className="h-6 w-px bg-slate-800"></div>
              <div className="text-center">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">HP</span>
                <span className={`font-mono font-bold text-sm ${currentHp <= 0 ? 'text-rose-400 font-extrabold' : currentHp < maxHp / 2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {currentHp}/{maxHp}
                  {tempHp > 0 && <span className="text-cyan-300 text-[10px] ml-0.5">+{tempHp}</span>}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-800"></div>
              <div className="text-center">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">AC</span>
                <span className="font-mono font-bold text-cyan-400 text-sm">{totalAc}</span>
              </div>
              <div className="h-6 w-px bg-slate-800"></div>
              <div className="text-center">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">DR</span>
                <span className="font-mono font-bold text-orange-400 text-sm" title={drSummary.fullDRString}>
                  {drSummary.bestDRString}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-800"></div>
              <div className="text-center">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">BAB</span>
                <span className="font-mono font-bold text-amber-300 text-sm">+{bab}</span>
              </div>
              <div className="h-6 w-px bg-slate-800 hidden lg:block"></div>
              <div className="text-center hidden lg:block leading-tight">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Saves</span>
                <span className="text-slate-500 block text-[9px] -mt-0.5">(F/R/W)</span>
                <span className="font-mono font-bold text-purple-300 text-sm block">
                  {totalFort >= 0 ? '+' : ''}{totalFort}/{totalRef >= 0 ? '+' : ''}{totalRef}/{totalWill >= 0 ? '+' : ''}{totalWill}
                </span>
              </div>

              <div className="h-6 w-px bg-slate-800"></div>
              <i className={`fa-solid fa-chevron-down text-slate-400 group-hover:text-amber-400 text-xs transition-transform ${showCharacterDropdown ? 'rotate-180' : ''}`}></i>
            </button>

            {/* Roster Switcher Dropdown Menu - rendered directly beneath the pill */}
            {showCharacterDropdown && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-fadeIn">
                <div className="p-3 border-b border-slate-800 bg-slate-950/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-heading">
                      Switch Character ({summaries.length})
                    </span>
                    <button
                      onClick={() => { setShowCharacterDropdown(false); onOpenRoster(); }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <i className="fa-solid fa-users-viewfinder text-xs"></i> Manage Roster
                    </button>
                  </div>

                  <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 text-xs text-slate-500"></i>
                    <input
                      type="text"
                      placeholder="Search roster..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto p-1.5 space-y-1 divide-y divide-slate-800/40">
                  {filteredSummaries.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">No matching characters found</div>
                  ) : (
                    filteredSummaries.map(s => {
                      const isActive = s.id === character.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            onSelectCharacter(s.id);
                            setShowCharacterDropdown(false);
                          }}
                          className={`w-full text-left p-2 rounded-xl flex items-center justify-between gap-3 transition ${
                            isActive
                              ? 'bg-amber-500/15 border border-amber-500/40 text-amber-200'
                              : 'hover:bg-slate-800/70 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-8 h-8 rounded-lg border border-slate-700 bg-slate-950 overflow-hidden shrink-0 flex items-center justify-center">
                              {s.portraitUrl ? (
                                <img src={s.portraitUrl} alt={s.name} className="w-full h-full object-cover" />
                              ) : (
                                <i className="fa-solid fa-user-shield text-slate-400 text-xs"></i>
                              )}
                            </div>
                            <div className="truncate leading-tight">
                              <div className={`text-xs font-semibold truncate ${isActive ? 'text-amber-300 font-bold' : 'text-slate-200'}`}>
                                {s.name}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                Lvl {s.level} {s.race} &bull; {s.classes}
                              </div>
                            </div>
                          </div>

                          {isActive && (
                            <span className="shrink-0 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-md font-mono font-bold">
                              Active
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="p-2 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setShowCharacterDropdown(false);
                      onCreateNew();
                    }}
                    className="w-full btn btn-secondary text-xs py-1.5 flex items-center justify-center gap-1.5"
                  >
                    <i className="fa-solid fa-plus text-amber-400"></i> New Character
                  </button>
                  <button
                    onClick={() => {
                      setShowCharacterDropdown(false);
                      onOpenRoster();
                    }}
                    className="w-full btn btn-primary text-xs py-1.5 flex items-center justify-center gap-1.5"
                  >
                    <i className="fa-solid fa-table-cells"></i> View All Cards
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Character History Undo / Redo (Desktop: positioned to the right of the summary pill) */}
          <div className="flex items-center bg-slate-950/60 p-0.5 rounded-xl border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition ${
                canUndo
                  ? 'text-slate-200 hover:text-amber-300 hover:bg-slate-800 cursor-pointer'
                  : 'text-slate-600 cursor-not-allowed opacity-30'
              }`}
              title="Undo Character Edit (Ctrl+Z)"
              aria-label="Undo"
            >
              <i className="fa-solid fa-rotate-left text-[11px]"></i>
            </button>
            <div className="h-3.5 w-px bg-slate-800"></div>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition ${
                canRedo
                  ? 'text-slate-200 hover:text-amber-300 hover:bg-slate-800 cursor-pointer'
                  : 'text-slate-600 cursor-not-allowed opacity-30'
              }`}
              title="Redo Character Edit (Ctrl+Y)"
              aria-label="Redo"
            >
              <i className="fa-solid fa-rotate-right text-[11px]"></i>
            </button>
          </div>
        </div>

        {/* Consolidated Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            onClick={onCreateNew}
            className="btn btn-secondary text-xs flex items-center gap-1.5 px-2.5 sm:px-3"
            title="Create New Character"
          >
            <i className="fa-solid fa-plus text-amber-400"></i>
            <span className="hidden sm:inline">New</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('sheet');
              setTimeout(() => window.print(), 200);
            }}
            className="btn btn-primary text-xs flex items-center gap-1.5 px-2.5 sm:px-3"
            title="Print Character Sheet"
          >
            <i className="fa-solid fa-print"></i>
            <span className="hidden sm:inline">Print</span>
          </button>

          {/* More Actions Dropdown (Roster, Export, Import, Docs) */}
          <div className="relative" ref={actionsDropdownRef}>
            <button
              type="button"
              onClick={() => setShowActionsDropdown(!showActionsDropdown)}
              className={`btn btn-secondary text-xs flex items-center gap-1 px-2.5 ${showActionsDropdown ? 'bg-slate-800 border-amber-500/50 text-amber-300' : ''}`}
              title="More Actions (Roster, Export, Import, Guide)"
              aria-label="More Actions"
              aria-expanded={showActionsDropdown}
            >
              <i className="fa-solid fa-ellipsis-vertical text-slate-300"></i>
            </button>

            {showActionsDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-1.5 text-xs overflow-hidden divide-y divide-slate-800/60 animate-in fade-in zoom-in-95 duration-100">
                {/* Character Roster */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowActionsDropdown(false);
                      onOpenRoster();
                    }}
                    className="w-full px-3.5 py-2 text-left text-slate-200 hover:bg-slate-800 hover:text-amber-300 flex items-center gap-2.5 transition group"
                  >
                    <i className="fa-solid fa-table-cells text-amber-400 w-4 text-center group-hover:scale-110 transition-transform"></i>
                    <div>
                      <div className="font-medium">Manage Character Roster</div>
                      <div className="text-[10px] text-slate-400">View and manage all saved heroes</div>
                    </div>
                  </button>
                </div>

                {/* Export & Import */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowActionsDropdown(false);
                      onExport();
                    }}
                    className="w-full px-3.5 py-2 text-left text-slate-200 hover:bg-slate-800 hover:text-amber-300 flex items-center gap-2.5 transition group"
                  >
                    <i className="fa-solid fa-file-arrow-down text-emerald-400 w-4 text-center group-hover:scale-110 transition-transform"></i>
                    <div>
                      <div className="font-medium">Export Active Character</div>
                      <div className="text-[10px] text-slate-400">Save current character JSON file</div>
                    </div>
                  </button>

                  {onExportAll && (
                    <button
                      onClick={() => {
                        setShowActionsDropdown(false);
                        onExportAll();
                      }}
                      className="w-full px-3.5 py-2 text-left text-slate-200 hover:bg-slate-800 hover:text-amber-300 flex items-center gap-2.5 transition group"
                    >
                      <i className="fa-solid fa-file-zipper text-cyan-400 w-4 text-center group-hover:scale-110 transition-transform"></i>
                      <div>
                        <div className="font-medium">Backup All Roster</div>
                        <div className="text-[10px] text-slate-400">Export complete character roster</div>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowActionsDropdown(false);
                      onExportRoll20();
                    }}
                    className="w-full px-3.5 py-2 text-left text-slate-200 hover:bg-slate-800 hover:text-red-300 flex items-center gap-2.5 transition group"
                  >
                    <i className="fa-solid fa-dice-d20 text-rose-400 w-4 text-center group-hover:scale-110 transition-transform"></i>
                    <div>
                      <div className="font-medium">Export for Roll20</div>
                      <div className="text-[10px] text-slate-400">Compatible with Roll20 3.5e sheet</div>
                    </div>
                  </button>

                  <label className="w-full px-3.5 py-2 text-left text-slate-200 hover:bg-slate-800 hover:text-amber-300 flex items-center gap-2.5 transition group cursor-pointer">
                    <i className="fa-solid fa-file-arrow-up text-amber-400 w-4 text-center group-hover:scale-110 transition-transform"></i>
                    <div>
                      <div className="font-medium">Import JSON File</div>
                      <div className="text-[10px] text-slate-400">Load hero from a saved JSON</div>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".json"
                      onChange={(e) => {
                        setShowActionsDropdown(false);
                        onImport(e);
                      }}
                    />
                  </label>
                </div>

                {/* Documentation & Help */}
                {onOpenDocs && (
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowActionsDropdown(false);
                        onOpenDocs();
                      }}
                      className="w-full px-3.5 py-2 text-left text-slate-200 hover:bg-slate-800 hover:text-amber-300 flex items-center gap-2.5 transition group"
                    >
                      <i className="fa-solid fa-circle-question text-amber-400 w-4 text-center group-hover:scale-110 transition-transform"></i>
                      <div>
                        <div className="font-medium">Documentation &amp; Guide</div>
                        <div className="text-[10px] text-slate-400">Help, hotkeys, and release notes</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="border-t border-slate-800/80 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center justify-start md:justify-center gap-1 sm:gap-1.5 py-1.5 overflow-x-auto no-scrollbar flex-nowrap md:flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-tab shrink-0 ${activeTab === tab.id ? 'active' : ''}`}
            >
              <i className={`fa-solid ${tab.icon}`}></i> {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
};
