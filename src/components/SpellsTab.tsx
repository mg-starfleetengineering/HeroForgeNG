import React, { useState, useMemo } from 'react';
import {
  CharacterState,
  ClassData,
  RaceData,
  DomainData,
  DeityData,
  SpellData,
  SupplementalDomainSpellData
} from '../types/character';
import { calculateTotalScore, getAbilityMod, parseRaceMods, getCharacterLevel } from '../engine/stats';
import { SPELLCASTING_CLASSES, getSpellSlotsForClass, isSpellcastingClassName } from '../engine/spells';
import { getSourceBadgeInfo, isSourceAllowed } from '../utils/sourceFilter';

interface SpellsTabProps {
  character: CharacterState;
  classesData: ClassData[];
  racesData?: RaceData[];
  domainsData?: DomainData[];
  deitiesData?: DeityData[];
  spellsData?: SpellData[];
  supplementalSpellsData?: SupplementalDomainSpellData[];
  onChange?: (updated: Partial<CharacterState>) => void;
}

const MAGIC_SCHOOLS = [
  'Abjuration',
  'Conjuration',
  'Divination',
  'Enchantment',
  'Evocation',
  'Illusion',
  'Necromancy',
  'Transmutation',
  'Universal'
];

const STANDARD_CLASSES = [
  'Bard',
  'Cleric',
  'Druid',
  'Paladin',
  'Ranger',
  'Sorcerer',
  'Wizard'
];

const SAVE_TYPES = [
  { label: 'All Saves', value: 'all' },
  { label: 'Fortitude', value: 'fortitude' },
  { label: 'Reflex', value: 'reflex' },
  { label: 'Will', value: 'will' },
  { label: 'None / No Save', value: 'none' }
];

export const SpellsTab: React.FC<SpellsTabProps> = ({
  character,
  classesData,
  racesData = [],
  domainsData = [],
  deitiesData = [],
  spellsData = [],
  supplementalSpellsData = [],
  onChange
}) => {
  // Navigation sub-tab state (Default to Class Spell Slots)
  const [activeSubTab, setActiveSubTab] = useState<'compendium' | 'slots' | 'domains'>('slots');

  // Search and Filter States for Compendium
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [selectedSave, setSelectedSave] = useState<string>('all');
  const [onlyAllowedSources, setOnlyAllowedSources] = useState<boolean>(true);
  const [selectedSpellModal, setSelectedSpellModal] = useState<SpellData | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 24;

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

  const activeCasterClassNames = Object.keys(classLevelsMap).filter(clsName => {
    const clsObj = classesData.find(c => c.name === clsName);
    return isSpellcastingClassName(clsName, clsObj);
  });

  const casterEntries = Object.entries(classLevelsMap).filter(([clsName]) => {
    const clsObj = classesData.find(c => c.name === clsName);
    return isSpellcastingClassName(clsName, clsObj);
  });

  const selectedDomainsList = (character.selectedDomains || []).filter(Boolean);
  const resolvedDomains = selectedDomainsList.map(domName => {
    return (
      domainsData.find(d => d.name.toLowerCase() === domName.toLowerCase() || d.id === domName.toLowerCase()) || {
        id: domName.toLowerCase().replace(/\s+/g, '_'),
        name: domName,
        power: 'Custom domain power.',
        spells: []
      }
    );
  });

  // Calculate Divine Caster Wisdom modifier for DC calculations if applicable
  const wisScore = calculateTotalScore(
    'wis',
    character.baseStats,
    raceMods,
    character.levelBumps || {},
    character.enhancementMods || {},
    totalLevel
  );
  const wisMod = getAbilityMod(wisScore);

  // Filtered Spells
  const filteredSpells = useMemo(() => {
    return spellsData.filter(spell => {
      // 1. Text Search (name, description, descriptors)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = spell.name.toLowerCase().includes(q);
        const matchesDesc = spell.description.toLowerCase().includes(q);
        const matchesDescriptors = (spell.descriptors || []).some(d => d.toLowerCase().includes(q));
        const matchesSubschool = spell.subschool ? spell.subschool.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesDesc && !matchesDescriptors && !matchesSubschool) {
          return false;
        }
      }

      // 2. Class Filter
      if (selectedClass !== 'all') {
        if (selectedClass === 'my_classes') {
          const hasAnyMyClass = activeCasterClassNames.some(myCls => {
            return spell.levels[myCls] !== undefined;
          });
          if (!hasAnyMyClass) return false;
        } else {
          // Check standard class or domain key
          const lvl = spell.levels[selectedClass];
          if (lvl === undefined) return false;
        }
      }

      // 3. Level Filter
      if (selectedLevel !== 'all') {
        const targetLvl = parseInt(selectedLevel, 10);
        if (selectedClass !== 'all' && selectedClass !== 'my_classes') {
          if (spell.levels[selectedClass] !== targetLvl) return false;
        } else if (selectedClass === 'my_classes') {
          const matchesAnyMyClassLevel = activeCasterClassNames.some(
            myCls => spell.levels[myCls] === targetLvl
          );
          if (!matchesAnyMyClassLevel) return false;
        } else {
          const hasLevel = Object.values(spell.levels).includes(targetLvl);
          if (!hasLevel) return false;
        }
      }

      // 4. Magic School Filter
      if (selectedSchool !== 'all') {
        if (spell.school.toLowerCase() !== selectedSchool.toLowerCase()) {
          return false;
        }
      }

      // 5. Save Type Filter
      if (selectedSave !== 'all') {
        const saveLower = (spell.savingThrow || '').toLowerCase();
        if (selectedSave === 'none') {
          if (!saveLower.includes('none') && saveLower !== '') return false;
        } else {
          if (!saveLower.includes(selectedSave)) return false;
        }
      }

      // 6. Allowed Sources Filter
      if (onlyAllowedSources) {
        if (!isSourceAllowed(spell.source, character.allowedSources)) {
          return false;
        }
      }

      return true;
    });
  }, [
    spellsData,
    searchQuery,
    selectedClass,
    selectedLevel,
    selectedSchool,
    selectedSave,
    onlyAllowedSources,
    activeCasterClassNames,
    character.allowedSources
  ]);

  // Reset pagination on filter changes
  const totalPages = Math.ceil(filteredSpells.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedSpells = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredSpells.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSpells, safeCurrentPage]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedClass !== 'all' ||
    selectedLevel !== 'all' ||
    selectedSchool !== 'all' ||
    selectedSave !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedClass('all');
    setSelectedLevel('all');
    setSelectedSchool('all');
    setSelectedSave('all');
    setCurrentPage(1);
  };

  const getSchoolColor = (school: string) => {
    switch (school.toLowerCase()) {
      case 'abjuration':
        return 'bg-sky-950/80 text-sky-300 border-sky-500/30';
      case 'conjuration':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30';
      case 'divination':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/30';
      case 'enchantment':
        return 'bg-pink-950/80 text-pink-300 border-pink-500/30';
      case 'evocation':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/30';
      case 'illusion':
        return 'bg-purple-950/80 text-purple-300 border-purple-500/30';
      case 'necromancy':
        return 'bg-slate-900 text-indigo-300 border-indigo-500/30';
      case 'transmutation':
        return 'bg-teal-950/80 text-teal-300 border-teal-500/30';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  const handleCopySpell = (spell: SpellData) => {
    const text = `${spell.name} (${spell.school})\nLevel: ${Object.entries(spell.levels).map(([c, l]) => `${c} ${l}`).join(', ')}\nCasting Time: ${spell.castingTime}\nRange: ${spell.range}\nDuration: ${spell.duration}\nSaving Throw: ${spell.savingThrow} | Spell Resistance: ${spell.spellResistance}\n\n${spell.description}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(spell.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Tab Navigation Bar */}
      <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <i className="fa-solid fa-wand-magic-sparkles text-lg"></i>
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
              D&D 3.5e Spellcasting & Compendium
            </h2>
            <p className="text-xs text-slate-400">
              Search the 3.5e core spell compendium ({spellsData.length} spells), track class spell slots per day, and review divine domains.
            </p>
          </div>
        </div>

        {/* Sub-Navigation Buttons */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('compendium')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeSubTab === 'compendium'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-book-open"></i> Spell Compendium
          </button>
          <button
            onClick={() => setActiveSubTab('slots')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeSubTab === 'slots'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-hat-wizard"></i> Class Spell Slots
            {casterEntries.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-slate-900 text-amber-300 font-mono">
                {casterEntries.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('domains')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeSubTab === 'domains'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-ankh"></i> Domains & Racial SLAs
            {selectedDomainsList.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-slate-900 text-amber-300 font-mono">
                {selectedDomainsList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: 3.5e SEARCHABLE SPELL COMPENDIUM                               */}
      {/* ========================================================================= */}
      {activeSubTab === 'compendium' && (
        <div className="space-y-6">
          {/* Search & Multi-Filter Control Panel */}
          <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl space-y-4 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-filter"></i> Search & Filter Compendium
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-bold">
                  {filteredSpells.length} {filteredSpells.length === 1 ? 'Spell' : 'Spells'} Found
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Source Filter Toggle */}
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800/80 hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={onlyAllowedSources}
                    onChange={e => setOnlyAllowedSources(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500/20 bg-slate-900"
                  />
                  <span>Respect Allowed Sources</span>
                </label>

                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-xs px-2.5 py-1 rounded-lg bg-rose-950/80 text-rose-300 hover:bg-rose-900 border border-rose-500/30 transition flex items-center gap-1"
                  >
                    <i className="fa-solid fa-xmark"></i> Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Filter Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* 1. Name & Keyword Search */}
              <div className="lg:col-span-2">
                <label className="label-text flex items-center gap-1">
                  <i className="fa-solid fa-magnifying-glass text-amber-400"></i> Spell Name / Keyword
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search Fireball, Cure, Teleport..."
                    className="input-field pr-8 text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                    >
                      <i className="fa-solid fa-circle-xmark"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Class Filter */}
              <div>
                <label className="label-text">Class</label>
                <select
                  value={selectedClass}
                  onChange={e => {
                    setSelectedClass(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="input-field text-xs"
                >
                  <option value="all">All Classes</option>
                  {activeCasterClassNames.length > 0 && (
                    <option value="my_classes">★ My Classes ({activeCasterClassNames.join(', ')})</option>
                  )}
                  <optgroup label="Standard Spellcasting Classes">
                    {STANDARD_CLASSES.map(cls => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Cleric Domains">
                    {Object.keys(
                      spellsData.reduce((acc, sp) => {
                        Object.keys(sp.levels).forEach(k => {
                          if (!STANDARD_CLASSES.includes(k)) acc[k] = true;
                        });
                        return acc;
                      }, {} as Record<string, boolean>)
                    )
                      .sort()
                      .map(dom => (
                        <option key={dom} value={dom}>
                          Domain: {dom}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              {/* 3. Level Filter */}
              <div>
                <label className="label-text">Spell Level</label>
                <select
                  value={selectedLevel}
                  onChange={e => {
                    setSelectedLevel(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="input-field text-xs font-mono"
                >
                  <option value="all">All Levels (0 - 9)</option>
                  <option value="0">Level 0 (Cantrips / Orisons)</option>
                  {Array.from({ length: 9 }, (_, i) => i + 1).map(lvl => (
                    <option key={lvl} value={lvl.toString()}>
                      Level {lvl}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Magic School Filter */}
              <div>
                <label className="label-text">Magic School</label>
                <select
                  value={selectedSchool}
                  onChange={e => {
                    setSelectedSchool(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="input-field text-xs"
                >
                  <option value="all">All Schools</option>
                  {MAGIC_SCHOOLS.map(sch => (
                    <option key={sch} value={sch}>
                      {sch}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Saving Throw Filter */}
              <div>
                <label className="label-text">Saving Throw</label>
                <select
                  value={selectedSave}
                  onChange={e => {
                    setSelectedSave(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="input-field text-xs"
                >
                  {SAVE_TYPES.map(st => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Spell Results Cards Grid */}
          {filteredSpells.length === 0 ? (
            <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-10 rounded-2xl text-center space-y-3">
              <i className="fa-solid fa-magnifying-glass-chart text-3xl text-slate-500"></i>
              <h3 className="text-md font-bold text-slate-200">No Spells Match Your Filters</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Try broadening your search term, resetting magic school or saving throw filters, or enabling non-core sources.
              </p>
              <button
                onClick={resetFilters}
                className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedSpells.map(spell => {
                  const badge = getSourceBadgeInfo(spell.source, character.allowedSources);
                  const schoolColorClass = getSchoolColor(spell.school);

                  // Extract class level string
                  const classLevelBadges = Object.entries(spell.levels)
                    .map(([clsName, lvl]) => {
                      const shortCls =
                        clsName === 'Sorcerer'
                          ? 'Sor'
                          : clsName === 'Wizard'
                          ? 'Wiz'
                          : clsName === 'Cleric'
                          ? 'Clr'
                          : clsName === 'Druid'
                          ? 'Drd'
                          : clsName === 'Paladin'
                          ? 'Pal'
                          : clsName === 'Ranger'
                          ? 'Rgr'
                          : clsName === 'Bard'
                          ? 'Brd'
                          : clsName;
                      return `${shortCls} ${lvl}`;
                    })
                    .slice(0, 4);

                  return (
                    <div
                      key={spell.id}
                      onClick={() => setSelectedSpellModal(spell)}
                      className="group p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-amber-500/50 transition duration-200 cursor-pointer space-y-3 flex flex-col justify-between shadow-md hover:shadow-amber-500/5"
                    >
                      {/* Card Header */}
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-slate-100 group-hover:text-amber-300 transition text-sm flex-1 leading-snug">
                            {spell.name}
                          </h3>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold shrink-0 ${schoolColorClass}`}
                          >
                            {spell.school}
                          </span>
                        </div>

                        {/* Class Level Tags */}
                        <div className="flex flex-wrap gap-1">
                          {classLevelBadges.map((badgeStr, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-amber-300/90 font-medium"
                            >
                              {badgeStr}
                            </span>
                          ))}
                          {Object.keys(spell.levels).length > 4 && (
                            <span className="text-[10px] font-mono px-1 py-0.2 text-slate-500">
                              +{Object.keys(spell.levels).length - 4} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Spell Quick Attributes Grid */}
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/50 font-mono">
                        <div className="truncate text-slate-300">
                          <span className="text-slate-500 text-[10px] block">CASTING TIME</span>
                          <span className="truncate block" title={spell.castingTime}>
                            {spell.castingTime}
                          </span>
                        </div>
                        <div className="truncate text-slate-300">
                          <span className="text-slate-500 text-[10px] block">RANGE</span>
                          <span className="truncate block" title={spell.range}>
                            {spell.range}
                          </span>
                        </div>
                        <div className="truncate text-slate-300 col-span-2">
                          <span className="text-slate-500 text-[10px] block">SAVE / SR</span>
                          <span className="text-emerald-300 font-medium truncate block">
                            {spell.savingThrow} • SR: {spell.spellResistance}
                          </span>
                        </div>
                      </div>

                      {/* Description Preview & Footer */}
                      <div className="space-y-2">
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {spell.description}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px]">
                          <span
                            className={`px-1.5 py-0.2 rounded font-mono font-bold border ${
                              badge.isAllowed
                                ? badge.isCore
                                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                                  : 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                                : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                            }`}
                          >
                            {badge.sourceCode}
                          </span>

                          <span className="text-amber-400/80 group-hover:text-amber-300 font-semibold flex items-center gap-1">
                            Details <i className="fa-solid fa-chevron-right text-[9px]"></i>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Bar */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <div className="text-xs text-slate-400">
                    Showing <span className="font-mono text-slate-200">{(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                    <span className="font-mono text-slate-200">
                      {Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredSpells.length)}
                    </span>{' '}
                    of <span className="font-mono text-slate-200">{filteredSpells.length}</span> spells
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={safeCurrentPage === 1}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <i className="fa-solid fa-chevron-left mr-1"></i> Prev
                    </button>

                    <div className="text-xs font-mono text-slate-300 px-2">
                      Page <span className="text-amber-400 font-bold">{safeCurrentPage}</span> of {totalPages}
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={safeCurrentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Next <i className="fa-solid fa-chevron-right ml-1"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: CLASS SPELLCASTING SLOTS TRACKER                               */}
      {/* ========================================================================= */}
      {activeSubTab === 'slots' && (
        <div className="space-y-6">
          {casterEntries.length === 0 ? (
            <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-4">
              <h2 className="text-lg font-bold font-heading text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
                <i className="fa-solid fa-hat-wizard text-amber-500"></i> Spellcasting & Special Features
              </h2>

              <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-3">
                <i className="fa-solid fa-wand-sparkles text-3xl text-amber-500"></i>
                <h3 className="text-md font-bold text-slate-200">Spellcasting Engine Ready</h3>
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
                <div
                  key={clsName}
                  className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-6"
                >
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
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Spells Per Day & Save DCs
                        </h3>
                        <span className="text-[11px] text-amber-400 font-mono">
                          Base Slots + Bonus ({info.keyAbility.toUpperCase()} Mod {abilityMod >= 0 ? `+${abilityMod}` : abilityMod})
                        </span>
                      </div>
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
                              <span
                                className={`font-mono text-2xl font-bold ${
                                  slot.canCast ? 'text-amber-400' : 'text-slate-600'
                                }`}
                              >
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
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: DIVINE DOMAINS & RACIAL SPELL-LIKE TRAITS                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'domains' && (
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
                    <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
                      Spell-Like Abilities:
                    </span>
                    <span className="font-mono text-emerald-300 text-sm font-bold">
                      {raceObj.spellLikeAbilities}
                    </span>
                  </div>
                )}
                {raceObj.psionicAbilities && (
                  <div className="text-xs text-slate-200 pt-1">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
                      Psionic Abilities:
                    </span>
                    <span className="font-mono text-purple-300 text-sm font-bold">
                      {raceObj.psionicAbilities}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Granted Divine Domains & Domain Spell Lists */}
          {selectedDomainsList.length > 0 ? (
            <div className="card bg-slate-900/60 backdrop-blur border border-amber-500/30 p-6 rounded-2xl space-y-6">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-4">
                <div>
                  <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
                    <i className="fa-solid fa-ankh text-amber-400"></i> Divine Domains & Domain Spell Lists
                  </h2>
                  <p className="text-xs text-slate-400">
                    Granted domain powers and 1st - 9th level domain spell choices from your selected domains (
                    {selectedDomainsList.join(', ')}).
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
                    <div
                      key={dom.id}
                      className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/20 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                          <i className="fa-solid fa-star text-amber-400 text-xs"></i> {dom.name} Domain Power
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                            badge.isAllowed
                              ? badge.isCore
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                              : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                          }`}
                        >
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
                      <div
                        key={spellLvl}
                        className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs"
                      >
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
                              <div
                                key={dom.id}
                                className="flex justify-between items-center py-1 px-2 rounded bg-slate-900/60 border border-slate-800/50"
                              >
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
          ) : (
            <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl text-center space-y-3">
              <i className="fa-solid fa-ankh text-3xl text-slate-500"></i>
              <h3 className="text-md font-bold text-slate-200">No Domains Selected</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Select a Deity and Divine Domains in the Race/Class tab to view granted domain powers and level 1–9 domain spell choices.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL-DETAIL SPELL MODAL POPUP                                             */}
      {/* ========================================================================= */}
      {selectedSpellModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/40">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded border font-bold ${getSchoolColor(
                      selectedSpellModal.school
                    )}`}
                  >
                    {selectedSpellModal.school}
                    {selectedSpellModal.subschool ? ` (${selectedSpellModal.subschool})` : ''}
                  </span>
                  {(selectedSpellModal.descriptors || []).map((desc, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-400"
                    >
                      [{desc}]
                    </span>
                  ))}
                </div>
                <h2 className="text-xl font-bold font-heading text-slate-100">{selectedSpellModal.name}</h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopySpell(selectedSpellModal)}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500 text-slate-300 hover:text-amber-400 transition text-xs flex items-center gap-1.5"
                  title="Copy full spell text to clipboard"
                >
                  <i className={`fa-solid ${copiedId === selectedSpellModal.id ? 'fa-check text-emerald-400' : 'fa-copy'}`}></i>
                  <span>{copiedId === selectedSpellModal.id ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => setSelectedSpellModal(null)}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition text-xs"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Level Assignments */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Level & Classes
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(selectedSpellModal.levels).map(([cls, lvl]) => (
                    <span
                      key={cls}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-300 font-mono font-bold"
                    >
                      {cls} {lvl}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stat Properties Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">CASTING TIME</span>
                  <span className="text-slate-200 font-semibold">{selectedSpellModal.castingTime}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">COMPONENTS</span>
                  <span className="text-slate-200 font-semibold">{selectedSpellModal.components || 'V, S'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">RANGE</span>
                  <span className="text-slate-200 font-semibold">{selectedSpellModal.range}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">TARGET / AREA / EFFECT</span>
                  <span className="text-slate-200 font-semibold">{selectedSpellModal.targetArea || 'See description'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">DURATION</span>
                  <span className="text-slate-200 font-semibold">{selectedSpellModal.duration}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">SAVING THROW & SR</span>
                  <span className="text-emerald-300 font-semibold">
                    {selectedSpellModal.savingThrow} • SR: {selectedSpellModal.spellResistance}
                  </span>
                </div>
              </div>

              {/* Description Body */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Description & Mechanics
                </span>
                <div className="space-y-3 text-slate-200 text-xs leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 font-sans">
                  {selectedSpellModal.description.split('\n\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">
                Source: <span className="text-amber-400 font-bold">{selectedSpellModal.source}</span>
              </span>
              <button
                onClick={() => setSelectedSpellModal(null)}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


