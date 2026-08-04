import React, { useState } from 'react';
import { CharacterState, RaceData, ClassData, TraitData, FlawData, SkillTrickData } from '../types/character';
import {
  getAvailableSkills,
  calculateTotalSkillPoints,
  calculateSpentSkillPoints,
  isClassSkillForCharacter,
  convertSkillsToPerception,
  revertPerceptionToSkills,
  calculatePerceptionStats,
  getMaxSkillTricks,
  validateSkillTrickPrerequisites
} from '../engine/skills';
import { calculateTotalScore, getAbilityMod, parseRaceMods, calculateTraitFlawStatMods, calculateTraitFlawSkillMods } from '../engine/stats';

interface SkillsTabProps {
  character: CharacterState;
  racesData: RaceData[];
  classesData: ClassData[];
  traitsData?: TraitData[];
  flawsData?: FlawData[];
  skillTricksData?: SkillTrickData[];
  onChange: (updated: Partial<CharacterState>) => void;
}

export const SkillsTab: React.FC<SkillsTabProps> = ({
  character,
  racesData,
  classesData,
  traitsData = [],
  flawsData = [],
  skillTricksData = [],
  onChange
}) => {
  const [trickCategory, setTrickCategory] = useState<string>('All');
  const [trickSearch, setTrickSearch] = useState<string>('');

  const raceObj: Partial<RaceData> = racesData.find(r => r.name === character.selectedRace) || {};
  const raceMods = parseRaceMods(raceObj);

  const selectedTraits = character.selectedTraits || [];
  const selectedFlaws = character.selectedFlaws || [];
  const selectedSkillTricks = character.selectedSkillTricks || [];

  const traitFlawStatMods = calculateTraitFlawStatMods(selectedTraits, selectedFlaws, traitsData, flawsData);
  const usePathfinder = !!character.usePathfinderPerception;
  const traitFlawSkillMods = calculateTraitFlawSkillMods(selectedTraits, selectedFlaws, traitsData, flawsData, usePathfinder);

  const totalLevel = character.levelProgression?.filter(l => l.primaryClass).length || 1;
  const intScore = calculateTotalScore('int', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel, traitFlawStatMods);
  const intMod = getAbilityMod(intScore);
  const isHuman = !!character.selectedRace && character.selectedRace.toLowerCase().includes('human');

  const activeSkills = getAvailableSkills(usePathfinder);

  const totalBudget = calculateTotalSkillPoints(character.levelProgression, classesData, intMod, isHuman);
  const spentPts = calculateSpentSkillPoints(character.skillRanks, character.levelProgression, classesData, usePathfinder, selectedSkillTricks);
  const maxSkillTricks = getMaxSkillTricks(totalLevel);
  const remainingSkillPoints = totalBudget - spentPts;

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

  const handleToggleTrick = (trickId: string) => {
    const current = new Set(selectedSkillTricks);
    if (current.has(trickId)) {
      current.delete(trickId);
    } else {
      current.add(trickId);
    }
    onChange({ selectedSkillTricks: Array.from(current) });
  };

  const categories = ['All', 'Interaction', 'Manipulation', 'Mental', 'Movement'];

  const filteredTricks = skillTricksData.filter(trick => {
    const matchesCategory = trickCategory === 'All' || trick.category.toLowerCase() === trickCategory.toLowerCase();
    const matchesSearch =
      !trickSearch ||
      trick.name.toLowerCase().includes(trickSearch.toLowerCase()) ||
      trick.description.toLowerCase().includes(trickSearch.toLowerCase()) ||
      (trick.prerequisites && trick.prerequisites.toLowerCase().includes(trickSearch.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Skill Rank Allocation Section */}
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

      {/* Complete Scoundrel Skill Tricks Section */}
      <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
              <i className="fa-solid fa-hat-wizard text-amber-400"></i> Complete Scoundrel Skill Tricks
            </h2>
            <p className="text-xs text-slate-400">
              Skill tricks cost 2 skill points each. Maximum 1 trick per 2 character levels (Level {totalLevel} &rarr; Max {maxSkillTricks} tricks).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-950/80 px-3.5 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <span className="text-xs text-slate-400">Selected Tricks:</span>
              <span className={`badge font-mono text-xs ${selectedSkillTricks.length >= maxSkillTricks && maxSkillTricks > 0 ? 'badge-amber' : 'bg-slate-800 text-slate-200'}`}>
                {selectedSkillTricks.length} / {maxSkillTricks}
              </span>
            </div>

            <div className="bg-slate-950/80 px-3.5 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <span className="text-xs text-slate-400">Cost:</span>
              <span className="badge badge-amber font-mono text-xs">2 Pts / Trick</span>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setTrickCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  trickCategory === cat
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
            <input
              type="text"
              placeholder="Search skill tricks..."
              value={trickSearch}
              onChange={e => setTrickSearch(e.target.value)}
              className="input-field text-xs pl-8 py-1.5 w-full"
            />
          </div>
        </div>

        {/* Tricks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredTricks.map(trick => {
            const isSelected = selectedSkillTricks.includes(trick.id);
            const { valid, missing } = validateSkillTrickPrerequisites(trick, character);
            const limitReached = !isSelected && selectedSkillTricks.length >= maxSkillTricks;
            const insufficientPoints = !isSelected && remainingSkillPoints < 2;

            const isDisabled = (!isSelected && (!valid || limitReached || insufficientPoints));

            let categoryColor = 'bg-slate-800 text-slate-300';
            if (trick.category === 'Movement') categoryColor = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
            if (trick.category === 'Interaction') categoryColor = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
            if (trick.category === 'Manipulation') categoryColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
            if (trick.category === 'Mental') categoryColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';

            return (
              <div
                key={trick.id}
                className={`p-4 rounded-xl border transition flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-amber-950/20 border-amber-500/50 shadow-md shadow-amber-950/30'
                    : isDisabled
                    ? 'bg-slate-950/40 border-slate-800/80 opacity-60'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => handleToggleTrick(trick.id)}
                        className="w-4 h-4 rounded accent-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className={`font-bold text-sm ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                        {trick.name}
                      </span>
                    </label>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${categoryColor}`}>
                        {trick.category}
                      </span>
                      {trick.source && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {trick.source}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {trick.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="font-semibold text-slate-500">Prereqs:</span>
                    <span>{trick.prerequisites || 'None'}</span>
                  </div>

                  <div>
                    {valid ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <i className="fa-solid fa-circle-check text-[10px]"></i> Qualified
                      </span>
                    ) : (
                      <span className="text-rose-400 font-semibold flex items-center gap-1" title={missing.join('; ')}>
                        <i className="fa-solid fa-triangle-exclamation text-[10px]"></i> Unmet
                      </span>
                    )}
                  </div>
                </div>

                {!isSelected && isDisabled && (
                  <div className="text-[10px] text-rose-400/90 italic font-mono bg-rose-950/20 px-2 py-1 rounded border border-rose-900/30">
                    {limitReached
                      ? `Trick limit reached (${maxSkillTricks} max)`
                      : insufficientPoints
                      ? 'Insufficient skill points (costs 2 pts)'
                      : missing.join(' • ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

