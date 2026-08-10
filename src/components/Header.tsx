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

interface HeaderProps {
  character: CharacterSheetData;
  summaries: CharacterSummary[];
  racesData: RaceData[];
  classesData: ClassData[];
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
}

export const Header: React.FC<HeaderProps> = ({
  character,
  summaries,
  racesData,
  classesData,
  traitsData = [],
  flawsData = [],
  activeTab,
  setActiveTab,
  onSelectCharacter,
  onOpenRoster,
  onCreateNew,
  onExport,
  onExportAll,
  onExportRoll20,
  onImport,
  onOpenDocs
}) => {
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showCharacterDropdown, setShowCharacterDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const characterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (characterDropdownRef.current && !characterDropdownRef.current.contains(event.target as Node)) {
        setShowCharacterDropdown(false);
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

  const totalLevel = character.levelProgression.filter(l => l.primaryClass).length || 1;
  const conScore = calculateTotalScore('con', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel, traitFlawStatMods);
  const dexScore = calculateTotalScore('dex', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel, traitFlawStatMods);
  const wisScore = calculateTotalScore('wis', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel, traitFlawStatMods);

  const conMod = getAbilityMod(conScore);
  const dexMod = getAbilityMod(dexScore);
  const wisMod = getAbilityMod(wisScore);
  const hp = calculateTotalHP(character.levelProgression, classesData, conMod, traitFlawHpMod);
  const bab = calculateBAB(character.levelProgression, classesData);

  const baseFort = calculateBaseSave('fort', character.levelProgression, classesData);
  const baseRef = calculateBaseSave('ref', character.levelProgression, classesData);
  const baseWill = calculateBaseSave('will', character.levelProgression, classesData);

  const totalFort = baseFort + conMod + traitFlawSaveMods.fort;
  const totalRef = baseRef + dexMod + traitFlawSaveMods.ref;
  const totalWill = baseWill + wisMod + traitFlawSaveMods.will;

  const eq: Equipment = character.equipment || {
    armor: 'chainshirt', armorEnhancement: 1, shield: 'heavy_shield', shieldEnhancement: 1,
    deflection: 0, natural: 0, dodge: 0, primaryWeapon: 'Longsword'
  };
  const armorBonusMap: Record<string, number> = { none: 0, padded: 1, leather: 2, studded: 3, chainshirt: 4, breastplate: 5, fullplate: 8 };
  const shieldBonusMap: Record<string, number> = { none: 0, buckler: 1, light_wooden: 1, heavy_shield: 2, tower_shield: 4 };
  const totalAc = 10 + (armorBonusMap[eq.armor] || 0) + (eq.armorEnhancement || 0) + (shieldBonusMap[eq.shield] || 0) + (eq.shieldEnhancement || 0) + dexMod + (eq.deflection || 0) + (eq.natural || 0) + (eq.dodge || 0) + traitFlawAcMod;

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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 sm:gap-4 flex-nowrap overflow-x-auto sm:overflow-visible">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-red-700 flex items-center justify-center shadow-lg shadow-amber-900/30 text-slate-950 font-extrabold text-xl">
            <i className="fa-solid fa-dice-d20"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent tracking-wide">
              HeroForgeNG <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">v1.3</span>
            </h1>
            <p className="text-xs text-slate-400">D&D 3.5 Character Generator & Sheet Engine</p>
          </div>
        </div>

        {/* Quick Summary Bar with Integrated Character Switcher Dropdown */}
        <div className="relative" ref={characterDropdownRef}>
          <button
            type="button"
            onClick={() => setShowCharacterDropdown(!showCharacterDropdown)}
            className="hidden lg:flex items-center gap-2.5 sm:gap-3 bg-slate-950/60 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900/60 px-3 py-1.5 rounded-xl text-xs transition group cursor-pointer shadow-inner shrink-0"
            title="Click to switch active character or manage roster"
          >
            {/* Portrait Thumbnail */}
            <div className="relative w-8 h-8 rounded-lg border border-amber-500/40 bg-slate-900 overflow-hidden shrink-0 shadow-md group-hover:border-amber-400 transition flex items-center justify-center">
              {character.portraitUrl ? (
                <img src={character.portraitUrl} alt={character.name} className="w-full h-full object-cover" />
              ) : (
                <i className="fa-solid fa-user-shield text-amber-400 text-sm"></i>
              )}
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <i className="fa-solid fa-arrows-rotate text-amber-300 text-[10px]"></i>
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
              <span className="font-mono font-bold text-emerald-400 text-sm">{hp}</span>
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
            <div className="h-6 w-px bg-slate-800"></div>
            <div className="text-center">
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Saves (F/R/W)</span>
              <span className="font-mono font-bold text-purple-300 text-sm">{totalFort >= 0 ? '+' : ''}{totalFort}/{totalRef >= 0 ? '+' : ''}{totalRef}/{totalWill >= 0 ? '+' : ''}{totalWill}</span>
            </div>

            <div className="h-6 w-px bg-slate-800"></div>
            <i className={`fa-solid fa-chevron-down text-slate-400 group-hover:text-amber-400 text-xs transition-transform ${showCharacterDropdown ? 'rotate-180' : ''}`}></i>
          </button>

          {/* Roster Switcher Dropdown Menu */}
          {showCharacterDropdown && (
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-80 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-fadeIn">
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

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button onClick={onCreateNew} className="btn btn-secondary text-xs" title="New Character">
            <i className="fa-solid fa-file-circle-plus"></i> <span className="hidden sm:inline">New</span>
          </button>
          
          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="btn btn-secondary text-xs flex items-center gap-1.5"
              title="Export Options"
            >
              <i className="fa-solid fa-download"></i>
              <span className="hidden sm:inline">Export</span>
              <i className="fa-solid fa-chevron-down text-[10px] opacity-70"></i>
            </button>

            {showExportDropdown && (
              <div
                className="absolute right-0 mt-2 w-60 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-1.5 text-xs overflow-hidden"
                onMouseLeave={() => setShowExportDropdown(false)}
              >
                <button
                  onClick={() => { onExport(); setShowExportDropdown(false); }}
                  className="w-full px-4 py-2 text-left text-slate-200 hover:bg-slate-800 hover:text-amber-300 flex items-center gap-2 transition"
                >
                  <i className="fa-solid fa-file-code text-amber-400 w-4"></i>
                  <div>
                    <div className="font-medium">Active Character JSON</div>
                    <div className="text-[10px] text-slate-400">Save active character sheet</div>
                  </div>
                </button>

                {onExportAll && (
                  <button
                    onClick={() => { onExportAll(); setShowExportDropdown(false); }}
                    className="w-full px-4 py-2 text-left text-slate-200 hover:bg-slate-800 hover:text-amber-300 flex items-center gap-2 transition border-t border-slate-800"
                  >
                    <i className="fa-solid fa-file-zipper text-amber-400 w-4"></i>
                    <div>
                      <div className="font-medium">Export All Roster Backup</div>
                      <div className="text-[10px] text-slate-400">Backup all saved characters</div>
                    </div>
                  </button>
                )}
                
                <button
                  onClick={() => { onExportRoll20(); setShowExportDropdown(false); }}
                  className="w-full px-4 py-2 text-left text-slate-200 hover:bg-slate-800 hover:text-red-300 flex items-center gap-2 transition border-t border-slate-800"
                >
                  <i className="fa-solid fa-dice-d20 text-red-400 w-4"></i>
                  <div>
                    <div className="font-medium">Roll20 3.5e Sheet JSON</div>
                    <div className="text-[10px] text-slate-400">Import into Roll20 VTT sheets</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <label className="btn btn-secondary text-xs cursor-pointer" title="Load JSON">
            <i className="fa-solid fa-upload"></i> <span className="hidden sm:inline">Import</span>
            <input type="file" className="hidden" accept=".json" onChange={onImport} />
          </label>

          <button onClick={() => { setActiveTab('sheet'); setTimeout(() => window.print(), 200); }} className="btn btn-primary text-xs">
            <i className="fa-solid fa-print"></i> <span className="hidden sm:inline">Print Sheet</span>
          </button>

          {onOpenDocs && (
            <button
              onClick={onOpenDocs}
              className="btn btn-secondary text-xs w-8 h-8 p-0 flex items-center justify-center text-amber-400 hover:text-amber-300 border-amber-500/30 hover:border-amber-400 shrink-0"
              title="User Guide & Feature Documentation"
            >
              <i className="fa-solid fa-circle-question text-sm"></i>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="border-t border-slate-800/80 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 py-1.5">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <i className={`fa-solid ${tab.icon}`}></i> {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
};
