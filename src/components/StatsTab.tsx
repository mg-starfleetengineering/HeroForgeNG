import React from 'react';
import { CharacterState, RaceData, StatType, TemplateData } from '../types/character';
import { ABILITY_NAMES, getAbilityMod, getPointBuyCost, getTotalPointBuySpent, calculateTotalScore, parseRaceMods, parseTemplateMods, calculateTraitFlawStatMods } from '../engine/stats';
import { useGameData } from '../context/GameDataContext';
import { useCharacter, useCharacterDispatch } from '../context/CharacterContext';

interface StatsTabProps {
  character?: CharacterState;
  racesData?: RaceData[];
  templatesData?: TemplateData[];
  onChange?: (updated: Partial<CharacterState>) => void;
}

export const StatsTab: React.FC<StatsTabProps> = (props) => {
  const contextCharacter = useCharacter();
  const { updateCharacter } = useCharacterDispatch();
  const gameData = useGameData();

  const character = props.character ?? contextCharacter;
  const racesData = props.racesData ?? gameData.racesData;
  const templatesData = props.templatesData ?? gameData.templatesData;
  const onChange = props.onChange ?? updateCharacter;
  const raceObj: Partial<RaceData> = racesData.find(r => r.name === character.selectedRace) || {};
  const templateObj = templatesData.find(t => t.name === character.selectedTemplate || t.id === character.selectedTemplate);
  
  const raceMods = parseRaceMods(raceObj);
  const templateMods = parseTemplateMods(templateObj);
  const traitFlawMods = calculateTraitFlawStatMods(character.selectedTraits, character.selectedFlaws);

  const spent = getTotalPointBuySpent(character.baseStats);
  const target = character.pointBuyTarget;
  const totalLevel = character.levelProgression?.filter(l => l.primaryClass).length || 1;

  const handleBaseChange = (stat: StatType, val: number) => {
    const newBase = { ...character.baseStats, [stat]: val };
    onChange({ baseStats: newBase });
  };

  const handleEnhChange = (stat: StatType, val: number) => {
    const newEnh = { ...character.enhancementMods, [stat]: val };
    onChange({ enhancementMods: newEnh });
  };

  const handleBumpChange = (lvl: number, stat: StatType) => {
    const newBumps = { ...character.levelBumps, [lvl]: stat };
    onChange({ levelBumps: newBumps });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Ability Score Table */}
      <div className="lg:col-span-2 card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
              <i className="fa-solid fa-chart-simple text-amber-500"></i> Ability Scores & Modifiers
            </h2>
            <p className="text-xs text-slate-400">Configure base stats via Point Buy or manual entry</p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Point Buy:</span>
            <select
              value={target}
              onChange={e => onChange({ pointBuyTarget: e.target.value })}
              className="bg-slate-900 text-amber-400 text-xs font-mono font-bold rounded px-2 py-1 border border-slate-700"
            >
              <option value="28">28 Points (Standard)</option>
              <option value="32">32 Points (High Fantasy)</option>
              <option value="36">36 Points (Super Heroic)</option>
              <option value="custom">Custom / Manual</option>
            </select>
            <span className={`badge font-mono text-xs ${target !== 'custom' && spent > parseInt(target) ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'badge-amber'}`}>
              {spent} / {target} pts
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <th className="py-3 px-2">Attribute</th>
                <th className="py-3 px-2 text-center">Base Score</th>
                <th className="py-3 px-2 text-center">Cost</th>
                <th className="py-3 px-2 text-center">Racial/Tmpl</th>
                <th className="py-3 px-2 text-center">Level Bumps</th>
                <th className="py-3 px-2 text-center">Enhancement</th>
                <th className="py-3 px-2 text-center">Total Score</th>
                <th className="py-3 px-2 text-center">Modifier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {ABILITY_NAMES.map(stat => {
                const baseVal = character.baseStats[stat] || 10;
                const cost = getPointBuyCost(baseVal);
                const raceVal = raceMods[stat] || 0;
                const tmplVal = templateMods[stat] || 0;
                const combinedRaceTmpl = raceVal + tmplVal;
                const bumpCount = Object.entries(character.levelBumps || {}).filter(([lvlStr, s]) => s === stat && totalLevel >= Number(lvlStr)).length;
                const enhVal = character.enhancementMods[stat] || 0;

                const totalScore = calculateTotalScore(stat, character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel, traitFlawMods, templateMods);
                const mod = getAbilityMod(totalScore);
                const modStr = mod >= 0 ? `+${mod}` : `${mod}`;

                return (
                  <tr key={stat} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-2 font-bold uppercase text-xs text-amber-400 font-mono">{stat}</td>
                    <td className="py-3 px-2 text-center">
                      <input
                        type="number"
                        min="8"
                        max="18"
                        value={baseVal}
                        onChange={e => handleBaseChange(stat, parseInt(e.target.value) || 8)}
                        className="input-field w-16 text-center font-mono font-bold text-amber-300"
                      />
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-slate-400 text-xs">{cost} pt</td>
                    <td className="py-3 px-2 text-center font-mono text-slate-300 text-xs" title={tmplVal ? `Race: ${raceVal >= 0 ? '+' + raceVal : raceVal}, Template: ${tmplVal >= 0 ? '+' + tmplVal : tmplVal}` : undefined}>
                      {combinedRaceTmpl >= 0 ? '+' + combinedRaceTmpl : combinedRaceTmpl}
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-slate-300 text-xs">+{bumpCount}</td>
                    <td className="py-3 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={enhVal}
                        onChange={e => handleEnhChange(stat, parseInt(e.target.value) || 0)}
                        className="input-field w-16 text-center font-mono text-xs"
                      />
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-bold text-base text-slate-100">{totalScore}</td>
                    <td className={`py-3 px-2 text-center font-mono font-bold text-base ${mod >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{modStr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stat Bumps Panel */}
      <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-6">
        <h3 className="text-md font-bold font-heading text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
          <i className="fa-solid fa-arrow-up-right-dots text-amber-500"></i> Level Ability Bumps
        </h3>
        <p className="text-xs text-slate-400">
          In D&D 3.5, you gain +1 to any ability score at levels 4, 8, 12, 16, and 20.
        </p>

        <div className="space-y-3">
          {[4, 8, 12, 16, 20].map(lvl => {
            const isUnlocked = totalLevel >= lvl;
            return (
              <div key={lvl} className={`flex items-center justify-between text-xs p-2 rounded-lg border ${isUnlocked ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-950/30 border-slate-800/40 opacity-60'}`}>
                <span className="text-slate-300 font-semibold font-mono flex items-center gap-1.5">
                  Level {lvl} Bump:
                  {!isUnlocked && <span className="text-[10px] text-amber-500/80 font-normal italic">(Active at Lvl {lvl})</span>}
                </span>
                <select
                  value={character.levelBumps[lvl] || 'str'}
                  onChange={e => handleBumpChange(lvl, e.target.value as StatType)}
                  className="bg-slate-900 text-amber-400 font-mono font-bold rounded px-2 py-1 border border-slate-700"
                >
                  {ABILITY_NAMES.map(s => (
                    <option key={s} value={s}>{s.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
