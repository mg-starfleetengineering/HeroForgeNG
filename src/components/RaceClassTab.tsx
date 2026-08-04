import React, { useMemo } from 'react';
import { CharacterState, RaceData, ClassData, LevelProgression, TraitData, FlawData, TemplateData } from '../types/character';
import { getSourceBadgeInfo, isSourceAllowed, sortDropdownItems } from '../utils/sourceFilter';
import { SearchableSelect, SearchableOption } from './SearchableSelect';
import { TraitsFlawsSection } from './TraitsFlawsSection';
import { getEffectiveRaceMods, getEffectiveLevelAdj, getEffectiveRaceType, getEffectiveSpeed } from '../engine/stats';

interface RaceClassTabProps {
  character: CharacterState;
  racesData: RaceData[];
  classesData: ClassData[];
  templatesData?: TemplateData[];
  traitsData: TraitData[];
  flawsData: FlawData[];
  onChange: (updated: Partial<CharacterState>) => void;
}

export const RaceClassTab: React.FC<RaceClassTabProps> = ({ character, racesData, classesData, templatesData = [], traitsData, flawsData, onChange }) => {
  const sortedRaces = useMemo(
    () => sortDropdownItems(racesData, character.allowedSources),
    [racesData, character.allowedSources]
  );

  const sortedClasses = useMemo(
    () => sortDropdownItems(classesData, character.allowedSources),
    [classesData, character.allowedSources]
  );

  const sortedTemplates = useMemo(
    () => sortDropdownItems(templatesData, character.allowedSources),
    [templatesData, character.allowedSources]
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

  const templateOptions: SearchableOption[] = useMemo(() => {
    return [
      { value: '', label: '-- None (Base Race Only) --', isAllowed: true },
      ...sortedTemplates.map(t => {
        const badge = getSourceBadgeInfo(t.source, character.allowedSources);
        const laStr = t.levelAdj ? ` +${t.levelAdj} LA` : '';
        return {
          value: t.name,
          label: t.name,
          sublabel: `(${t.type || t.subtype || 'Template'}${laStr})`,
          badge: badge.sourceCode,
          isAllowed: badge.isAllowed
        };
      })
    ];
  }, [sortedTemplates, character.allowedSources]);

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
  const templateObj = templatesData.find(t => t.name === character.selectedTemplate || t.id === character.selectedTemplate);
  const selectedRaceBadge = getSourceBadgeInfo(raceObj?.source, character.allowedSources);
  const selectedTemplateBadge = templateObj ? getSourceBadgeInfo(templateObj.source, character.allowedSources) : null;

  const effectiveTypeInfo = getEffectiveRaceType(raceObj, templateObj);
  const totalLA = getEffectiveLevelAdj(raceObj, templateObj);
  const effectiveSpeed = getEffectiveSpeed(raceObj, templateObj);
  const effectiveMods = getEffectiveRaceMods(raceObj, templateObj);

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
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Race & Template Selector */}
        <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <i className="fa-solid fa-dna text-amber-500"></i> Race & Template Selection
          </h2>

          <div className="space-y-3">
            <div>
              <label className="label-text">Base Race</label>
              <SearchableSelect
                value={character.selectedRace}
                options={raceOptions}
                onChange={val => onChange({ selectedRace: val })}
                placeholder="Search base race..."
              />
            </div>

            <div>
              <label className="label-text">Racial Template (Optional)</label>
              <SearchableSelect
                value={character.selectedTemplate || ''}
                options={templateOptions}
                onChange={val => onChange({ selectedTemplate: val })}
                placeholder="Search template (e.g. Half-Celestial, Vampire)..."
              />
            </div>
          </div>

          {raceObj && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between items-center text-amber-400 font-bold">
                <span>{templateObj ? `${templateObj.name} ${raceObj.name}` : raceObj.name}</span>
                <span className="text-slate-400 font-normal">
                  {raceObj.size || 'Medium'} {effectiveTypeInfo.type}
                  {effectiveTypeInfo.subtype ? ` (${effectiveTypeInfo.subtype})` : ''}
                </span>
              </div>
              
              {/* Sourcebook Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-slate-400 text-[11px]">Race Src:</span>
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

                {templateObj && selectedTemplateBadge && (
                  <>
                    <span className="text-slate-400 text-[11px] ml-1">Template Src:</span>
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                      selectedTemplateBadge.isAllowed
                        ? selectedTemplateBadge.isCore
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                        : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                    }`}>
                      {!selectedTemplateBadge.isAllowed && '⚠️ '}
                      {selectedTemplateBadge.sourceName} ({selectedTemplateBadge.sourceCode})
                    </span>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-slate-300">
                <p>Speed: <span className="font-mono text-amber-300">{effectiveSpeed.land} ft.</span>{effectiveSpeed.fly ? `, Fly ${effectiveSpeed.fly} ft. (${effectiveSpeed.flyManeuverability || 'good'})` : ''}</p>
                <p className="text-amber-400 font-semibold">Total LA: <span className="font-mono">+{totalLA}</span></p>
              </div>

              {/* Stat Adjustments Summary */}
              <div className="text-[11px] font-mono text-slate-300 bg-slate-900/80 p-2 rounded border border-slate-800 flex flex-wrap gap-2">
                <span className="text-slate-400 font-sans">Combined Modifiers:</span>
                {Object.entries(effectiveMods).map(([stat, mod]) => (
                  <span key={stat} className={mod > 0 ? 'text-emerald-400' : mod < 0 ? 'text-rose-400' : 'text-slate-500'}>
                    {stat.toUpperCase()} {mod >= 0 ? `+${mod}` : mod}
                  </span>
                ))}
              </div>

              {templateObj?.shortDescription && (
                <p className="text-amber-200/90 text-[11px]">
                  <i className="fa-solid fa-sparkles text-amber-400 mr-1"></i>
                  {templateObj.shortDescription}
                </p>
              )}

              {templateObj?.specialAbilities && (
                <p className="text-emerald-300 text-[11px]">
                  <i className="fa-solid fa-shield-halved mr-1"></i>
                  Template Traits: <span className="font-mono">{templateObj.specialAbilities}</span>
                </p>
              )}

              {raceObj.spellLikeAbilities && (
                <p className="text-emerald-400 font-semibold">
                  <i className="fa-solid fa-wand-magic-sparkles mr-1"></i>
                  Spell-Like: <span className="font-mono text-emerald-300">{raceObj.spellLikeAbilities}</span>
                </p>
              )}
              {raceObj.psionicAbilities && (
                <p className="text-purple-400 font-semibold">
                  <i className="fa-solid fa-brain mr-1"></i>
                  Psionics: <span className="font-mono text-purple-300">{raceObj.psionicAbilities}</span>
                </p>
              )}
              {raceObj.racialSkills && (
                <p className="text-sky-300">
                  <i className="fa-solid fa-bullseye mr-1"></i>
                  Racial Skills: <span className="font-mono">{raceObj.racialSkills}</span>
                </p>
              )}
              {raceObj.bonusFeats && (
                <p className="text-amber-300">
                  <i className="fa-solid fa-award mr-1"></i>
                  Bonus Feats: <span className="font-mono">{raceObj.bonusFeats}</span>
                </p>
              )}
              <p className="text-slate-400 text-[11px] italic">
                {raceObj.specialAbilities || (!raceObj.spellLikeAbilities && raceObj.automaticLanguages ? `Languages: ${raceObj.automaticLanguages}` : 'Racial Traits Active.')}
              </p>
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

      {/* Traits & Flaws Selection Section */}
      <TraitsFlawsSection
        character={character}
        traitsData={traitsData}
        flawsData={flawsData}
        onChange={onChange}
      />
    </div>
  );
};


