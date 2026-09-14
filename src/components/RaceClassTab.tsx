import React, { useMemo } from 'react';
import { CharacterState, RaceData, ClassData, LevelProgression, TraitData, FlawData, TemplateData, DeityData, DomainData, WildShapeFormData } from '../types/character';
import { getSourceBadgeInfo, isSourceAllowed, sortDropdownItems } from '../utils/sourceFilter';
import { SearchableSelect, SearchableOption } from './SearchableSelect';
import { TraitsFlawsSection } from './TraitsFlawsSection';
import { WildShapeManager } from './WildShapeManager';
import { getEffectiveRaceMods, getEffectiveLevelAdj, getEffectiveRaceType, getEffectiveSpeed } from '../engine/stats';
import { toCanonicalClassId, toCanonicalDomainId } from '../engine/classes';

interface RaceClassTabProps {
  character: CharacterState;
  racesData: RaceData[];
  classesData: ClassData[];
  templatesData?: TemplateData[];
  traitsData: TraitData[];
  flawsData: FlawData[];
  deitiesData?: DeityData[];
  domainsData?: DomainData[];
  wildShapeFormsData?: WildShapeFormData[];
  onChange: (updated: Partial<CharacterState>) => void;
}

export const RaceClassTab: React.FC<RaceClassTabProps> = ({
  character,
  racesData,
  classesData,
  templatesData = [],
  traitsData,
  flawsData,
  deitiesData = [],
  domainsData = [],
  wildShapeFormsData = [],
  onChange
}) => {
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
          value: c.id || toCanonicalClassId(c.name),
          label: c.name,
          sublabel: `(d${c.hitDie})`,
          badge: badge.sourceCode,
          isAllowed: badge.isAllowed
        };
      })
    ];
  }, [sortedClasses, character.allowedSources]);

  const deityOptions: SearchableOption[] = useMemo(() => {
    return [
      { value: '', label: '-- None / Philosophy / Custom --', isAllowed: true },
      ...deitiesData.map(d => ({
        value: d.name,
        label: d.name,
        sublabel: `(${d.alignment}) • Wpn: ${d.favoredWeapon}`,
        isAllowed: true
      }))
    ];
  }, [deitiesData]);

  const activeDeityObj = useMemo(() => {
    if (!character.deity) return null;
    return deitiesData.find(d => d.name.toLowerCase() === character.deity.toLowerCase() || d.id === character.deity.toLowerCase());
  }, [character.deity, deitiesData]);

  const domainOptions: SearchableOption[] = useMemo(() => {
    const deityDomainSet = new Set((activeDeityObj?.domains || []).map(d => toCanonicalDomainId(d)));
    
    const sorted = [...domainsData].sort((a, b) => {
      const aId = a.id || toCanonicalDomainId(a.name);
      const bId = b.id || toCanonicalDomainId(b.name);
      const aIsDeity = deityDomainSet.has(aId);
      const bIsDeity = deityDomainSet.has(bId);
      if (aIsDeity && !bIsDeity) return -1;
      if (!aIsDeity && bIsDeity) return 1;
      return a.name.localeCompare(b.name);
    });

    return [
      { value: '', label: '-- None --', isAllowed: true },
      ...sorted.map(d => {
        const canonicalId = d.id || toCanonicalDomainId(d.name);
        const isDeityDomain = deityDomainSet.has(canonicalId);
        const badge = getSourceBadgeInfo(d.source, character.allowedSources);
        return {
          value: canonicalId,
          label: isDeityDomain ? `⭐ ${d.name} (Deity Domain)` : d.name,
          sublabel: `(L1: ${d.spells[0] || 'N/A'})`,
          badge: badge.sourceCode,
          isAllowed: badge.isAllowed
        };
      })
    ];
  }, [domainsData, activeDeityObj, character.allowedSources]);

  const selectedDomainsList = character.selectedDomains || [];

  const handleDeityChange = (deityName: string) => {
    const foundDeity = deitiesData.find(d => d.name === deityName);
    let updatedDomains = [...selectedDomainsList];
    
    // Automatically pre-populate default domains if choosing a deity with known domains
    if (foundDeity && foundDeity.domains && foundDeity.domains.length >= 2) {
      updatedDomains = [
        toCanonicalDomainId(foundDeity.domains[0]),
        toCanonicalDomainId(foundDeity.domains[1])
      ];
    }

    onChange({
      deity: deityName,
      selectedDomains: updatedDomains
    });
  };

  const handleDomainChange = (index: number, domainName: string) => {
    let updated = [...selectedDomainsList];
    while (updated.length <= index) {
      updated.push('');
    }
    updated[index] = domainName;
    // Filter trailing empty values but keep array length clean
    onChange({ selectedDomains: updated });
  };

  const handleAddDomainSlot = () => {
    onChange({ selectedDomains: [...selectedDomainsList, ''] });
  };

  const handleRemoveDomainSlot = (index: number) => {
    const updated = selectedDomainsList.filter((_, i) => i !== index);
    onChange({ selectedDomains: updated });
  };

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

  // Check if character has barbarian levels
  const barbLevel = (character.levelProgression || []).filter(l => {
    const c1 = (l.primaryClass || '').toLowerCase().trim();
    const c2 = (l.secondaryClass || '').toLowerCase().trim();
    return c1 === 'barbarian' || c2 === 'barbarian';
  }).length;

  // Check if character has cleric or divine levels
  const isClericOrDivine = (character.levelProgression || []).some(l => {
    const c1 = l.primaryClass.toLowerCase();
    const c2 = l.secondaryClass?.toLowerCase() || '';
    return c1.includes('cleric') || c2.includes('cleric') || c1.includes('favored') || c2.includes('favored') || c1.includes('paladin') || c1.includes('inquisitor');
  });

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
              <label className="label-text flex items-center justify-between">
                <span>Racial Override / Display Name (Optional)</span>
                {character.raceOverride && (
                  <button
                    type="button"
                    onClick={() => onChange({ raceOverride: '' })}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-normal cursor-pointer"
                    title="Clear racial override"
                  >
                    Clear Override
                  </button>
                )}
              </label>
              <input
                type="text"
                value={character.raceOverride || ''}
                onChange={e => onChange({ raceOverride: e.target.value })}
                placeholder={`e.g. Catfolk (reflavored from ${character.selectedRace})`}
                className="input-field text-xs py-2 px-3 w-full"
              />
              <p className="text-[11px] text-slate-400 mt-1 italic leading-tight">
                Overrides display race on sheet, roster, headers & exports while keeping all stats and traits from <strong>{character.selectedRace}</strong>.
              </p>
            </div>
          </div>

          {raceObj && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between items-start text-amber-400 font-bold gap-2">
                <div>
                  {character.raceOverride?.trim() ? (
                    <div>
                      <span className="text-amber-300 text-sm font-bold flex items-center gap-1.5">
                        <i className="fa-solid fa-masks-theater text-amber-400 text-xs"></i>
                        {character.raceOverride.trim()}
                      </span>
                      <span className="text-slate-400 text-[11px] font-normal block font-sans mt-0.5">
                        Base Race Mechanics: <strong className="text-amber-200/90">{templateObj ? `${templateObj.name} ${raceObj.name}` : raceObj.name}</strong>
                      </span>
                    </div>
                  ) : (
                    <span>{templateObj ? `${templateObj.name} ${raceObj.name}` : raceObj.name}</span>
                  )}
                </div>
                <span className="text-slate-400 font-normal shrink-0">
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
                  const primaryClsObj = classesData.find(c => c.id === lvlData.primaryClass || c.name.toLowerCase() === (lvlData.primaryClass || '').toLowerCase());
                  const secondaryClsObj = classesData.find(c => c.id === lvlData.secondaryClass || c.name.toLowerCase() === (lvlData.secondaryClass || '').toLowerCase());

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

          {/* Barbarian Alternative Class Feature Variant (Whirling Frenzy vs Standard Rage) */}
          {barbLevel >= 1 && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-rose-500/30 space-y-3 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <i className={character.barbarianVariant === 'whirling_frenzy' ? 'fa-solid fa-tornado' : 'fa-solid fa-fire'}></i>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold font-heading text-slate-100 flex items-center gap-2">
                      Barbarian Class Variant (Level {barbLevel})
                      <span className="badge bg-rose-500/20 text-rose-300 border-rose-500/30 text-[9px] uppercase font-mono px-1.5 py-0.2 rounded">
                        Alternative Class Feature
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Choose whether this character uses standard PHB Barbarian Rage or the Unearthed Arcana Whirling Frenzy variant.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                {/* Option 1: Standard Rage */}
                <button
                  type="button"
                  onClick={() => onChange({ barbarianVariant: 'rage' })}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                    character.barbarianVariant !== 'whirling_frenzy'
                      ? 'bg-rose-950/50 border-rose-500/70 text-rose-100 shadow-md ring-1 ring-rose-500/50'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <i className="fa-solid fa-fire text-rose-400"></i> Standard Barbarian Rage
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        character.barbarianVariant !== 'whirling_frenzy' ? 'bg-rose-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {character.barbarianVariant !== 'whirling_frenzy' ? 'SELECTED' : 'SELECT'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    <strong className="text-rose-300">+4 Str, +4 Con, +2 Morale Will saves, -2 AC</strong>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                    Standard PHB rage. Grants +2 HP/level, melee attack/damage bonus, and Will saves against spells. Cannot cast spells.
                  </p>
                </button>

                {/* Option 2: Whirling Frenzy */}
                <button
                  type="button"
                  onClick={() => onChange({ barbarianVariant: 'whirling_frenzy' })}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                    character.barbarianVariant === 'whirling_frenzy'
                      ? 'bg-teal-950/50 border-teal-500/70 text-teal-100 shadow-md ring-1 ring-teal-500/50'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <i className="fa-solid fa-tornado text-teal-400"></i> Whirling Frenzy (UA)
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        character.barbarianVariant === 'whirling_frenzy' ? 'bg-teal-400 text-slate-950' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {character.barbarianVariant === 'whirling_frenzy' ? 'SELECTED' : 'SELECT'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    <strong className="text-teal-300">+4 Str (+2 Atk/Dmg), +2 Dodge AC, +2 Ref, -2 Flurry (+1 Extra Attack)</strong>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                    Unearthed Arcana alternative. Grants an extra attack at highest BAB during a full attack and defensive Dodge bonus instead of Con/HP bonus.
                  </p>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deity & Divine Domains Selection Card */}
      <div className="card bg-slate-900/60 backdrop-blur border border-amber-500/30 p-6 rounded-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3">
          <div>
            <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
              <i className="fa-solid fa-ankh text-amber-400"></i> Deity & Divine Domains Selection
            </h2>
            <p className="text-xs text-slate-400">
              Choose your patron deity and divine domains. Clerics receive 2 domains by default. Granted domain powers & spell lists update automatically.
            </p>
          </div>
          {isClericOrDivine && (
            <span className="px-3 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/30 font-mono font-bold text-xs">
              <i className="fa-solid fa-sparkles mr-1"></i> Cleric / Divine Caster Active
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Deity Selector */}
          <div className="space-y-3">
            <label className="label-text flex items-center gap-1.5 text-amber-300">
              <i className="fa-solid fa-sun"></i> Patron Deity
            </label>
            <SearchableSelect
              value={character.deity || ''}
              options={deityOptions}
              onChange={handleDeityChange}
              placeholder="Search deity (e.g. Pelor, Boccob, Heironeous)..."
            />

            {/* Custom Deity Name override if not in list */}
            {!activeDeityObj && character.deity && (
              <div className="text-xs text-slate-400 italic">
                Custom Deity: <span className="font-semibold text-amber-300">{character.deity}</span>
              </div>
            )}

            {activeDeityObj && (
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 text-sm">{activeDeityObj.name}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono text-[10px]">
                    {activeDeityObj.alignment}
                  </span>
                </div>

                <p className="text-slate-300">
                  <span className="text-slate-400">Favored Weapon:</span>{' '}
                  <span className="font-mono text-amber-200 font-bold">{activeDeityObj.favoredWeapon}</span>
                </p>

                <div>
                  <span className="text-slate-400 block mb-1 text-[11px]">Deity Granted Domains:</span>
                  <div className="flex flex-wrap gap-1">
                    {activeDeityObj.domains.map(d => (
                      <span
                        key={d}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                          selectedDomainsList.includes(d)
                            ? 'bg-amber-950 text-amber-300 border-amber-500/40 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Domain Selection Inputs */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <label className="label-text text-amber-300 flex items-center gap-1.5">
                <i className="fa-solid fa-hand-holding-hand"></i> Chosen Divine Domains
              </label>
              <button
                onClick={handleAddDomainSlot}
                className="btn btn-secondary text-xs py-1 px-2.5 flex items-center gap-1 text-amber-400 hover:text-amber-300"
              >
                <i className="fa-solid fa-plus text-[10px]"></i> Add Domain Slot
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(selectedDomainsList.length > 0 ? selectedDomainsList : ['', '']).map((domName, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Domain {idx + 1}</span>
                    {idx >= 2 && (
                      <button
                        onClick={() => handleRemoveDomainSlot(idx)}
                        className="text-rose-400 hover:text-rose-300 text-[11px]"
                        title="Remove extra domain slot"
                      >
                        <i className="fa-solid fa-xmark"></i> Remove
                      </button>
                    )}
                  </div>
                  <SearchableSelect
                    value={domName}
                    options={domainOptions}
                    onChange={val => handleDomainChange(idx, val)}
                    placeholder={`Select Domain ${idx + 1}...`}
                  />
                </div>
              ))}
            </div>

            {/* Granted Powers Cards */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-shield-halved text-amber-400"></i> Active Domain Powers & Spell Lists
              </h3>

              {selectedDomainsList.filter(Boolean).length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                  No divine domains selected. Select domains above to display domain powers and spell lists.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedDomainsList.filter(Boolean).map(domName => {
                    const domObj = domainsData.find(d => d.name.toLowerCase() === domName.toLowerCase() || d.id === domName.toLowerCase());
                    if (!domObj) {
                      return (
                        <div key={domName} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                          <span className="font-bold text-amber-400">{domName}</span>
                          <p className="text-slate-400 text-[11px]">Custom / Custom Domain</p>
                        </div>
                      );
                    }

                    const badge = getSourceBadgeInfo(domObj.source, character.allowedSources);

                    return (
                      <div key={domObj.id} className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/20 space-y-2 text-xs shadow-md">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                            <i className="fa-solid fa-star text-amber-400 text-xs"></i> {domObj.name} Domain
                          </span>
                          <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                            badge.isAllowed
                              ? badge.isCore ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30' : 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                              : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                          }`}>
                            {badge.sourceCode}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Granted Power:</span>
                          <p className="text-slate-200 text-[11px] leading-relaxed font-mono bg-slate-900/90 p-2 rounded border border-slate-800 mt-0.5">
                            {domObj.power}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Domain Spells (1st - 9th):</span>
                          <div className="grid grid-cols-1 gap-1 text-[11px] font-mono">
                            {domObj.spells.map((sp, sIdx) => (
                              <div key={sIdx} className="flex justify-between items-center py-0.5 border-b border-slate-800/40 last:border-none">
                                <span className="text-amber-400 font-bold text-[10px] w-6">L{sIdx + 1}:</span>
                                <span className="text-slate-200 flex-1">{sp}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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

      {/* Wild Shape Form Manager Section */}
      <WildShapeManager
        character={character}
        formsData={wildShapeFormsData}
        onChange={onChange}
      />
    </div>
  );
};



