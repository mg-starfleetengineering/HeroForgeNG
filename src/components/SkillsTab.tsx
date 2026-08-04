import React from 'react';
import { CharacterState, RaceData, ClassData, TraitData, FlawData } from '../types/character';
import {
  getAvailableSkills,
  calculateTotalSkillPoints,
  calculateSpentSkillPoints,
  isClassSkillForCharacter,
  convertSkillsToPerception,
  revertPerceptionToSkills,
  calculatePerceptionStats
} from '../engine/skills';
import { calculateTotalScore, getAbilityMod, parseRaceMods, calculateTraitFlawStatMods, calculateTraitFlawSkillMods } from '../engine/stats';

interface SkillsTabProps {
  character: CharacterState;
  racesData: RaceData[];
  classesData: ClassData[];
  traitsData?: TraitData[];
  flawsData?: FlawData[];
  onChange: (updated: Partial<CharacterState>) => void;
}

export const SkillsTab: React.FC<SkillsTabProps> = ({ character, racesData, classesData, traitsData = [], flawsData = [], onChange }) => {
  const raceObj: Partial<RaceData> = racesData.find(r => r.name === character.selectedRace) || {};
  const raceMods = parseRaceMods(raceObj);

  const selectedTraits = character.selectedTraits || [];
  const selectedFlaws = character.selectedFlaws || [];

  const traitFlawStatMods = calculateTraitFlawStatMods(selectedTraits, selectedFlaws, traitsData, flawsData);
  const usePathfinder = !!character.usePathfinderPerception;
  const traitFlawSkillMods = calculateTraitFlawSkillMods(selectedTraits, selectedFlaws, traitsData, flawsData, usePathfinder);

  const totalLevel = character.levelProgression?.filter(l => l.primaryClass).length || 1;
  const intScore = calculateTotalScore('int', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel, traitFlawStatMods);
  const intMod = getAbilityMod(intScore);
  const isHuman = !!character.selectedRace && character.selectedRace.toLowerCase().includes('human');

  const activeSkills = getAvailableSkills(usePathfinder);

  const totalBudget = calculateTotalSkillPoints(character.levelProgression, classesData, intMod, isHuman);
  const spentPts = calculateSpentSkillPoints(character.skillRanks, character.levelProgression, classesData, usePathfinder);

  const handleRankChange = (skillName: string, ranks: number) => {
    const updatedRanks = { ...character.skillRanks, [skillName]: ranks };
    onChange({ skillRanks: updatedRanks });
  };

  const handleTogglePerception = (e: React.ChangeEvent<HTMLInputElement>) => {
    const shouldEnable = e.target.checked;
    if (shouldEnable) {
      const updatedChar = convertSkillsToPerception(character);
      onChange(updatedChar);
    } else {
      const updatedChar = revertPerceptionToSkills(character);
      onChange(updatedChar);
    }
  };

  return (
    <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
            <i className="fa-solid fa-hand-sparkles text-amber-500"></i> Skill Rank Allocation
          </h2>
          <p className="text-xs text-slate-400">Class skills cost 1pt per rank (max Level + 3). Cross-class cost 1pt per 0.5 rank.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2.5 cursor-pointer bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 hover:border-amber-500/40 transition">
            <input
              type="checkbox"
              checked={usePathfinder}
              onChange={handleTogglePerception}
              className="w-4 h-4 rounded accent-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500 cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-200">
              Consolidate Spot/Listen/Search into Perception (Pathfinder Style)
            </span>
          </label>

          <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400">Total Skill Points Available:</span>
            <span className="badge badge-amber font-mono text-sm">{spentPts} / {totalBudget}</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <th className="py-2 px-2">Class Skill</th>
              <th className="py-2 px-2">Skill Name</th>
              <th className="py-2 px-2 text-center">Key Ability</th>
              <th className="py-2 px-2 text-center">Ability Mod</th>
              <th className="py-2 px-2 text-center">Ranks</th>
              <th className="py-2 px-2 text-center">Total Mod</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {activeSkills.map(skill => {
              const isClass = isClassSkillForCharacter(skill.name, character.levelProgression, classesData);
              const ranks = (character.skillRanks || {})[skill.name] || 0;

              const abilityScore = calculateTotalScore(skill.keyAbility, character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel, traitFlawStatMods);
              const abMod = getAbilityMod(abilityScore);
              const tfSkillMod = traitFlawSkillMods[skill.name] || 0;

              let totalMod = Math.floor(ranks) + abMod + tfSkillMod;
              let featBonusText = '';

              if (skill.name === 'Perception') {
                const percStats = calculatePerceptionStats(character, classesData, abMod);
                totalMod = percStats.totalBonus + tfSkillMod;
                if (percStats.alertnessBonus > 0) {
                  featBonusText = ` (includes +${percStats.alertnessBonus} Alertness)`;
                }
              }

              const modStr = totalMod >= 0 ? `+${totalMod}` : `${totalMod}`;

              return (
                <tr key={skill.name} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 px-2 text-center">
                    {isClass ? (
                      <span className="badge badge-amber text-[10px]">CLASS</span>
                    ) : (
                      <span className="text-slate-600 text-[10px] uppercase font-mono">CROSS</span>
                    )}
                  </td>
                  <td className="py-2 px-2 font-semibold text-slate-200">
                    {skill.name}
                    {skill.name === 'Perception' && (
                      <span className="ml-2 text-[10px] text-amber-400/90 font-normal italic">
                        (Pathfinder: Merged Spot/Listen/Search &bull; Wisdom{featBonusText})
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center uppercase font-mono text-amber-400 font-bold">{skill.keyAbility}</td>
                  <td className="py-2 px-2 text-center font-mono text-slate-300">{abMod >= 0 ? '+' + abMod : abMod}</td>
                  <td className="py-2 px-2 text-center">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={ranks}
                      onChange={e => handleRankChange(skill.name, parseFloat(e.target.value) || 0)}
                      className="input-field w-16 text-center font-mono py-1 text-xs"
                    />
                  </td>
                  <td className={`py-2 px-2 text-center font-mono font-bold text-sm ${totalMod >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{modStr}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
