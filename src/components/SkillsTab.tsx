import React from 'react';
import { CharacterState, RaceData, ClassData } from '../types/character';
import { ALL_SKILLS, calculateTotalSkillPoints, isClassSkillForCharacter } from '../engine/skills';
import { calculateTotalScore, getAbilityMod } from '../engine/stats';

interface SkillsTabProps {
  character: CharacterState;
  racesData: RaceData[];
  classesData: ClassData[];
  onChange: (updated: Partial<CharacterState>) => void;
}

export const SkillsTab: React.FC<SkillsTabProps> = ({ character, racesData, classesData, onChange }) => {
  const raceObj: Partial<RaceData> = racesData.find(r => r.name === character.selectedRace) || {};
  const raceMods = {
    str: raceObj.strAdj || 0, dex: raceObj.dexAdj || 0, con: raceObj.conAdj || 0,
    int: raceObj.intAdj || 0, wis: raceObj.wisAdj || 0, cha: raceObj.chaAdj || 0
  };

  const intScore = calculateTotalScore('int', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {});
  const intMod = getAbilityMod(intScore);
  const isHuman = character.selectedRace === 'Human';

  const totalBudget = calculateTotalSkillPoints(character.levelProgression, classesData, intMod, isHuman);

  let spentPts = 0;
  for (const [sName, ranks] of Object.entries(character.skillRanks || {})) {
    spentPts += ranks;
  }

  const handleRankChange = (skillName: string, ranks: number) => {
    const updatedRanks = { ...character.skillRanks, [skillName]: ranks };
    onChange({ skillRanks: updatedRanks });
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

        <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400">Total Skill Points Available:</span>
          <span className="badge badge-amber font-mono text-sm">{spentPts} / {totalBudget}</span>
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
            {ALL_SKILLS.map(skill => {
              const isClass = isClassSkillForCharacter(skill.name, character.levelProgression, classesData);
              const ranks = (character.skillRanks || {})[skill.name] || 0;

              const abilityScore = calculateTotalScore(skill.keyAbility, character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {});
              const abMod = getAbilityMod(abilityScore);
              const totalMod = Math.floor(ranks) + abMod;
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
                  <td className="py-2 px-2 font-semibold text-slate-200">{skill.name}</td>
                  <td className="py-2 px-2 text-center uppercase font-mono text-amber-400 font-bold">{skill.keyAbility}</td>
                  <td className="py-2 px-2 text-center font-mono text-slate-300">{abMod >= 0 ? '+' + abMod : abMod}</td>
                  <td className="py-2 px-2 text-center">
                    <input
                      type="number"
                      step="0.5"
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
