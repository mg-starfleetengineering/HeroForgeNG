import React from 'react';
import { CharacterState, RaceData, ClassData, Equipment, TraitData, FlawData } from '../types/character';
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
  character: CharacterState;
  racesData: RaceData[];
  classesData: ClassData[];
  traitsData?: TraitData[];
  flawsData?: FlawData[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onReset: () => void;
  onExport: () => void;
  onExportRoll20: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Header: React.FC<HeaderProps> = ({
  character,
  racesData,
  classesData,
  traitsData = [],
  flawsData = [],
  activeTab,
  setActiveTab,
  onReset,
  onExport,
  onExportRoll20,
  onImport
}) => {
  const [showExportDropdown, setShowExportDropdown] = React.useState(false);
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

  const tabs = [
    { id: 'stats', label: 'Ability Scores', icon: 'fa-chart-simple' },
    { id: 'race-class', label: 'Race & Classes', icon: 'fa-shield-halved' },
    { id: 'skills', label: 'Skills', icon: 'fa-hand-sparkles' },
    { id: 'feats', label: 'Feats', icon: 'fa-award' },
    { id: 'equipment', label: 'Equipment', icon: 'fa-boxes-packing' },
    { id: 'spells', label: 'Spells & Powers', icon: 'fa-hat-wizard' },
    { id: 'auras', label: 'Auras & Emanations', icon: 'fa-sun' },
    { id: 'sources', label: 'Source Books', icon: 'fa-book-atlas' },
    { id: 'notes', label: 'Notes & Journal', icon: 'fa-book-bookmark' },
    { id: 'sheet', label: 'Character Sheet', icon: 'fa-scroll' }
  ];

  return (
    <header className="app-header bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-red-700 flex items-center justify-center shadow-lg shadow-amber-900/30 text-slate-950 font-extrabold text-xl">
            <i className="fa-solid fa-dice-d20"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent tracking-wide">
              HeroForgeNG <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">v1.1</span>
            </h1>
            <p className="text-xs text-slate-400">D&D 3.5 Character Generator & Sheet Engine</p>
          </div>
        </div>

        {/* Quick Summary Bar */}
        <div className="hidden md:flex items-center gap-5 bg-slate-950/60 border border-slate-800 px-4 py-2 rounded-xl text-xs">
          {character.portraitUrl && (
            <>
              <div className="w-8 h-8 rounded-lg border border-amber-500/40 overflow-hidden shrink-0 shadow-md">
                <img src={character.portraitUrl} alt={character.name} className="w-full h-full object-cover" />
              </div>
              <div className="h-6 w-px bg-slate-800"></div>
            </>
          )}
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
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button onClick={onReset} className="btn btn-secondary text-xs" title="New Character">
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
                className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-1.5 text-xs overflow-hidden"
                onMouseLeave={() => setShowExportDropdown(false)}
              >
                <button
                  onClick={() => { onExport(); setShowExportDropdown(false); }}
                  className="w-full px-4 py-2 text-left text-slate-200 hover:bg-slate-800 hover:text-amber-300 flex items-center gap-2 transition"
                >
                  <i className="fa-solid fa-file-code text-amber-400 w-4"></i>
                  <div>
                    <div className="font-medium">HeroForge Native JSON</div>
                    <div className="text-[10px] text-slate-400">Save for re-importing into app</div>
                  </div>
                </button>
                
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
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="border-t border-slate-800/80 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap lg:flex-nowrap gap-1 overflow-x-auto no-scrollbar py-1">
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
