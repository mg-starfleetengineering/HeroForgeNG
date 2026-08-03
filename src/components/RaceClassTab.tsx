import React, { useMemo } from 'react';
import { CharacterState, RaceData, ClassData, LevelProgression } from '../types/character';
import { getSourceBadgeInfo, isSourceAllowed, sortDropdownItems } from '../utils/sourceFilter';
import { SearchableSelect, SearchableOption } from './SearchableSelect';

interface RaceClassTabProps {
  character: CharacterState;
  racesData: RaceData[];
  classesData: ClassData[];
  onChange: (updated: Partial<CharacterState>) => void;
}

export const RaceClassTab: React.FC<RaceClassTabProps> = ({ character, racesData, classesData, onChange }) => {
  const sortedRaces = useMemo(
    () => sortDropdownItems(racesData, character.allowedSources),
    [racesData, character.allowedSources]
  );

  const sortedClasses = useMemo(
    () => sortDropdownItems(classesData, character.allowedSources),
    [classesData, character.allowedSources]
  );

  const raceOptions: SearchableOption[] = useMemo(() => {
    return sortedRaces.map(r => {
      const badge = getSourceBadgeInfo(r.source, character.allowedSources);
      return {
        value: r.name,
        label: r.name,
        sublabel: `(${r.type || 'Humanoid'})`,
        badge: badge.sourceCode,
        isAllowed: badge.isAllowed
      };
    });
  }, [sortedRaces, character.allowedSources]);

  const classOptions: SearchableOption[] = useMemo(() => {
    return [
      { value: '', label: '-- None --', isAllowed: true },
      ...sortedClasses.map(c => {
        const badge = getSourceBadgeInfo(c.source, character.allowedSources);
        return {
          value: c.name,
          label: c.name,
          sublabel: `(d${c.hitDie})`,
          badge: badge.sourceCode,
          isAllowed: badge.isAllowed
        };
      })
    ];
  }, [sortedClasses, character.allowedSources]);

  const raceObj = racesData.find(r => r.name === character.selectedRace) || racesData[0];
  const selectedRaceBadge = getSourceBadgeInfo(raceObj?.source, character.allowedSources);

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
          <SearchableSelect
            value={character.selectedRace}
            options={raceOptions}
            onChange={val => onChange({ selectedRace: val })}
            placeholder="Search base race..."
          />
        </div>

        {raceObj && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
            <div className="flex justify-between items-center text-amber-400 font-bold">
              <span>{raceObj.name}</span>
              <span className="text-slate-400 font-normal">{raceObj.size || 'Medium'} {raceObj.type || 'Humanoid'}</span>
            </div>
            
            {/* Sourcebook Badge */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-slate-400 text-[11px]">Source:</span>
              <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                selectedRaceBadge.isAllowed
                  ? selectedRaceBadge.isCore
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                  : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
              }`}>
                {!selectedRaceBadge.isAllowed && '⚠️ '}
                {selectedRaceBadge.sourceName} ({selectedRaceBadge.sourceCode})
              </span>
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
                      <SearchableSelect
                        value={lvlData.primaryClass || ''}
                        options={classOptions}
                        onChange={val => handleLevelChange(l, 'primaryClass', val)}
                        placeholder="-- None --"
                      />
                    </td>
                    {character.isGestalt && (
                      <td className="py-2 px-2">
                        <SearchableSelect
                          value={lvlData.secondaryClass || ''}
                          options={classOptions}
                          onChange={val => handleLevelChange(l, 'secondaryClass', val)}
                          placeholder="-- None --"
                        />
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

