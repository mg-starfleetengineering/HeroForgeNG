import React from 'react';
import { CharacterState, RaceData, ClassData, LevelProgression } from '../types/character';

interface RaceClassTabProps {
  character: CharacterState;
  racesData: RaceData[];
  classesData: ClassData[];
  onChange: (updated: Partial<CharacterState>) => void;
}

export const RaceClassTab: React.FC<RaceClassTabProps> = ({ character, racesData, classesData, onChange }) => {
  const raceObj = racesData.find(r => r.name === character.selectedRace) || racesData[0];

  const handleLevelChange = (lvl: number, field: keyof LevelProgression, val: any) => {
    let prog = [...character.levelProgression];
    let idx = prog.findIndex(p => p.level === lvl);
    if (idx === -1) {
      prog.push({ level: lvl, primaryClass: '', secondaryClass: '', hpRoll: 0 });
      idx = prog.length - 1;
    }
    prog[idx] = { ...prog[idx], [field]: val };
    onChange({ levelProgression: prog });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Race Selector */}
      <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-4">
        <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
          <i className="fa-solid fa-dna text-amber-500"></i> Race & Template Selection
        </h2>

        <div>
          <label className="label-text">Base Race</label>
          <select
            value={character.selectedRace}
            onChange={e => onChange({ selectedRace: e.target.value })}
            className="input-field"
          >
            {racesData.map((r, idx) => (
              <option key={r.id || `${r.name}_${idx}`} value={r.name}>{r.name} ({r.type || 'Humanoid'})</option>
            ))}
          </select>
        </div>

        {raceObj && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
            <div className="flex justify-between items-center text-amber-400 font-bold">
              <span>{raceObj.name}</span>
              <span className="text-slate-400 font-normal">{raceObj.size || 'Medium'} {raceObj.type || 'Humanoid'}</span>
            </div>
            <p className="text-slate-300">Base Speed: {raceObj.speed ? raceObj.speed.land : 30} ft.</p>
            <p className="text-amber-400">Level Adjustment: +{raceObj.levelAdj || 0}</p>
            <p className="text-slate-400 text-[11px] italic">{raceObj.specialAbilities || raceObj.automaticLanguages || 'Racial Traits Active.'}</p>
          </div>
        )}
      </div>

      {/* Class Level Grid */}
      <div className="lg:col-span-2 card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
              <i className="fa-solid fa-layer-group text-amber-500"></i> Class Progression (Levels 1 - 20)
            </h2>
            <p className="text-xs text-slate-400">Select class per character level. Supports Gestalt option.</p>
          </div>

          <label className="text-xs text-slate-300 font-medium cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={character.isGestalt}
              onChange={e => onChange({ isGestalt: e.target.checked })}
              className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0"
            />
            Enable Gestalt Classes
          </label>
        </div>

        <div className="max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2 px-2 w-12 text-center">Lvl</th>
                <th className="py-2 px-2">Primary Class</th>
                {character.isGestalt && <th className="py-2 px-2">Secondary Class (Gestalt)</th>}
                <th className="py-2 px-2 text-center w-16">HD</th>
                <th className="py-2 px-2 text-center w-16">HP Roll</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 font-mono">
              {Array.from({ length: 20 }, (_, i) => i + 1).map(l => {
                const lvlData = character.levelProgression.find(item => item.level === l) || { level: l, primaryClass: '', secondaryClass: '', hpRoll: 0 };
                const primaryClsObj = classesData.find(c => c.name === lvlData.primaryClass);
                const secondaryClsObj = classesData.find(c => c.name === lvlData.secondaryClass);

                let hd = primaryClsObj ? primaryClsObj.hitDie : 6;
                if (character.isGestalt && secondaryClsObj) hd = Math.max(hd, secondaryClsObj.hitDie);

                return (
                  <tr key={l} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-2 text-center text-amber-400 font-bold">{l}</td>
                    <td className="py-2 px-2">
                      <select
                        value={lvlData.primaryClass || ''}
                        onChange={e => handleLevelChange(l, 'primaryClass', e.target.value)}
                        className="input-field text-xs py-1"
                      >
                        <option value="">-- None --</option>
                        {classesData.map((c, idx) => (
                          <option key={c.id || `${c.name}_${idx}`} value={c.name}>{c.name} (d{c.hitDie})</option>
                        ))}
                      </select>
                    </td>
                    {character.isGestalt && (
                      <td className="py-2 px-2">
                        <select
                          value={lvlData.secondaryClass || ''}
                          onChange={e => handleLevelChange(l, 'secondaryClass', e.target.value)}
                          className="input-field text-xs py-1"
                        >
                          <option value="">-- None --</option>
                          {classesData.map(c => (
                            <option key={c.name} value={c.name}>{c.name} (d{c.hitDie})</option>
                          ))}
                        </select>
                      </td>
                    )}
                    <td className="py-2 px-2 text-center text-slate-300">d{hd}</td>
                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        value={lvlData.hpRoll || (l === 1 ? hd : Math.floor(hd / 2) + 1)}
                        onChange={e => handleLevelChange(l, 'hpRoll', parseInt(e.target.value) || 0)}
                        className="input-field text-xs py-1 text-center font-mono w-14"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
