import React from 'react';
import { CharacterState, ClassData, RaceData, DomainData, DeityData } from '../types/character';
import { calculateTotalScore, getAbilityMod, parseRaceMods, getCharacterLevel } from '../engine/stats';
import { SPELLCASTING_CLASSES, getSpellSlotsForClass, isSpellcastingClassName } from '../engine/spells';
import { getSourceBadgeInfo } from '../utils/sourceFilter';

interface SpellsTabProps {
  character: CharacterState;
  classesData: ClassData[];
  racesData?: RaceData[];
  domainsData?: DomainData[];
  deitiesData?: DeityData[];
  onChange?: (updated: Partial<CharacterState>) => void;
}

export const SpellsTab: React.FC<SpellsTabProps> = ({ character, classesData, racesData = [], domainsData = [], deitiesData = [], onChange }) => {
  const raceObj: Partial<RaceData> = racesData.find(r => r.name === character.selectedRace) || {};
  const raceMods = parseRaceMods(raceObj);
  const totalLevel = getCharacterLevel(character.levelProgression);

  // Count levels for each active class
  const classLevelsMap: Record<string, number> = {};
  (character.levelProgression || []).forEach(l => {
    if (l.primaryClass) {
      classLevelsMap[l.primaryClass] = (classLevelsMap[l.primaryClass] || 0) + 1;
    }
    if (l.secondaryClass) {
      classLevelsMap[l.secondaryClass] = (classLevelsMap[l.secondaryClass] || 0) + 1;
    }
  });

  const casterEntries = Object.entries(classLevelsMap).filter(([clsName]) => {
    const clsObj = classesData.find(c => c.name === clsName);
    return isSpellcastingClassName(clsName, clsObj);
  });

  const selectedDomainsList = (character.selectedDomains || []).filter(Boolean);
  const resolvedDomains = selectedDomainsList.map(domName => {
    return domainsData.find(d => d.name.toLowerCase() === domName.toLowerCase() || d.id === domName.toLowerCase()) || {
      id: domName.toLowerCase().replace(/\s+/g, '_'),
      name: domName,
      power: 'Custom domain power.',
      spells: []
    };
  });

  // Calculate Divine Caster Wisdom modifier for DC calculations if applicable
  const wisScore = calculateTotalScore('wis', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel);
  const wisMod = getAbilityMod(wisScore);

  return (
    <div className="space-y-6">
      {/* Racial Spell-Like & Psionic Abilities */}
      {raceObj && (raceObj.spellLikeAbilities || raceObj.psionicAbilities) && (
        <div className="card bg-slate-900/60 backdrop-blur border border-emerald-500/30 p-6 rounded-2xl space-y-3">
          <h2 className="text-lg font-bold font-heading text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
            <i className="fa-solid fa-wand-magic-sparkles text-emerald-400"></i> Racial Spell-Like & Psionic Traits
          </h2>
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 text-sm">{raceObj.name} Traits</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                Innate Racial Ability
              </span>
            </div>
            {raceObj.spellLikeAbilities && (
              <div className="text-xs text-slate-200">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">Spell-Like Abilities:</span>
                <span className="font-mono text-emerald-300 text-sm font-bold">{raceObj.spellLikeAbilities}</span>
              </div>
            )}
            {raceObj.psionicAbilities && (
              <div className="text-xs text-slate-200 pt-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">Psionic Abilities:</span>
                <span className="font-mono text-purple-300 text-sm font-bold">{raceObj.psionicAbilities}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Granted Divine Domains & Domain Spell Lists */}
      {selectedDomainsList.length > 0 && (
        <div className="card bg-slate-900/60 backdrop-blur border border-amber-500/30 p-6 rounded-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-4">
            <div>
              <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
                <i className="fa-solid fa-ankh text-amber-400"></i> Divine Domains & Domain Spell Lists
              </h2>
              <p className="text-xs text-slate-400">
                Granted domain powers and 1st - 9th level domain spell choices from your selected domains ({selectedDomainsList.join(', ')}).
              </p>
            </div>
            <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs text-amber-300 font-mono">
              <i className="fa-solid fa-sun"></i> Deity: <span className="font-bold">{character.deity || 'Pelor'}</span>
            </div>
          </div>

          {/* Domain Powers Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resolvedDomains.map(dom => {
              const badge = getSourceBadgeInfo(dom.source, character.allowedSources);
              return (
                <div key={dom.id} className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/20 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                      <i className="fa-solid fa-star text-amber-400 text-xs"></i> {dom.name} Domain Power
                    </span>
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                      badge.isAllowed
                        ? badge.isCore ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30' : 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                        : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                    }`}>
                      {badge.sourceCode}
                    </span>
                  </div>
                  <p className="text-slate-200 font-mono text-[11px] leading-relaxed bg-slate-900/90 p-2.5 rounded border border-slate-800">
                    {dom.power}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Appended Domain Spells per Spell Level Grid (Levels 1 - 9) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-book-bookmark text-amber-400"></i> Appended Domain Spell Slots (Levels 1 - 9)
              </h3>
              <span className="text-[11px] text-amber-400 font-mono">
                +1 Domain Spell Slot per level (Cleric rule)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
              {Array.from({ length: 9 }, (_, i) => i + 1).map(spellLvl => {
                const saveDc = 10 + spellLvl + wisMod;

                return (
                  <div key={spellLvl} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                      <span className="font-bold font-mono text-amber-400 text-xs">
                        Level {spellLvl} Domain Spells
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        DC {saveDc}
                      </span>
                    </div>

                    <div className="space-y-1 font-mono text-[11px]">
                      {resolvedDomains.map(dom => {
                        const spellName = dom.spells[spellLvl - 1] || 'None listed';
                        return (
                          <div key={dom.id} className="flex justify-between items-center py-1 px-2 rounded bg-slate-900/60 border border-slate-800/50">
                            <span className="text-slate-300 truncate max-w-[170px]" title={spellName}>
                              {spellName}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30 shrink-0 font-sans">
                              {dom.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Class Spellcasting Engine */}
      {casterEntries.length === 0 ? (
        <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-bold font-heading text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
            <i className="fa-solid fa-hat-wizard text-amber-500"></i> Spellcasting & Special Features
          </h2>

          <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-3">
            <i className="fa-solid fa-wand-sparkles text-3xl text-amber-500"></i>
            <h3 className="text-md font-bold text-slate-200">Spellcasting Engine Active</h3>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              Spells per day, bonus spells from high ability scores, and spell save DCs are automatically calculated for your spellcasting classes.
            </p>
            <div className="p-4 bg-slate-900/60 rounded-xl text-slate-400 text-xs text-center border border-slate-800 font-mono w-full mt-4">
              No spellcasting or manifesting classes selected. Select Bard, Cleric, Druid, Paladin, Ranger, Sorcerer, Wizard, etc. in the Race/Class tab to view spell slots.
            </div>
          </div>
        </div>
      ) : (
        casterEntries.map(([clsName, clsLvl]) => {
          const key = clsName.toLowerCase().replace(/[\s\/-]+/g, '_');
          const info = SPELLCASTING_CLASSES[key] || {
            name: clsName,
            keyAbility: 'int' as const,
            type: 'Arcane' as const,
            method: 'Prepared' as const,
            maxSpellLevel: 9
          };

          const abilityScore = calculateTotalScore(
            info.keyAbility,
            character.baseStats,
            raceMods,
            character.levelBumps || {},
            character.enhancementMods || {},
            totalLevel
          );
          const abilityMod = getAbilityMod(abilityScore);
          const spellSlotsData = getSpellSlotsForClass(clsName, clsLvl, abilityMod);

          return (
            <div key={clsName} className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
                    <i className="fa-solid fa-hat-wizard text-amber-500"></i> {clsName} Spellcasting
                  </h2>
                  <p className="text-xs text-slate-400">
                    {info.type} • {info.method} Caster • Level {clsLvl} (Caster Level {clsLvl})
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-400">Key Ability:</span>
                    <span className="font-mono text-amber-400 font-bold uppercase">{info.keyAbility}</span>
                    <span className="font-mono text-slate-200 font-bold">
                      {abilityScore} ({abilityMod >= 0 ? `+${abilityMod}` : abilityMod})
                    </span>
                  </div>
                </div>
              </div>

              {/* Spell Slots Grid */}
              {spellSlotsData && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Spells Per Day & Save DCs
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {spellSlotsData.slots.map(slot => (
                      <div
                        key={slot.spellLevel}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          slot.canCast
                            ? 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50'
                            : 'bg-slate-950/30 border-slate-900 opacity-50'
                        }`}
                      >
                        <div className="text-[10px] text-slate-400 uppercase font-mono block font-semibold">
                          {slot.spellLevel === 0 ? 'Cantrips (0)' : `Level ${slot.spellLevel}`}
                        </div>

                        <div className="py-1">
                          <span className={`font-mono text-2xl font-bold ${slot.canCast ? 'text-amber-400' : 'text-slate-600'}`}>
                            {slot.total}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {slot.base} base {slot.bonus > 0 ? `+ ${slot.bonus} bonus` : ''}
                          </span>
                        </div>

                        <div className="pt-1 border-t border-slate-800/60 mt-1">
                          <span className="text-[10px] text-emerald-400 font-mono font-bold block">
                            DC {slot.saveDc}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

