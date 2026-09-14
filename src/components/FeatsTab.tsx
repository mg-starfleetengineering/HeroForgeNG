import React, { useState, useMemo } from 'react';
import {
  CharacterState,
  CharacterFeat,
  FeatData,
  ClassData,
  RaceData,
  TemplateData,
  TraitData,
  FlawData,
  parseLegacyFeatString,
  migrateLegacyFeatStrings
} from '../types/character';
import { getSourceBadgeInfo, getAllSourceBadges, sortDropdownItems } from '../utils/sourceFilter';
import { calculateBonusFeatsFromFlaws, calculateTotalFeatSlots } from '../engine/stats';
import {
  buildCharacterPrereqContext,
  evaluateFeatPrerequisitesWithContext,
  aggregateAndDeduplicateFeats,
  featNameToId
} from '../engine/featPrereqs';
import { FeatTreeModal } from './FeatTreeModal';

interface FeatsTabProps {
  character: CharacterState;
  featsData: FeatData[];
  classesData?: ClassData[];
  racesData?: RaceData[];
  templatesData?: TemplateData[];
  traitsData?: TraitData[];
  flawsData?: FlawData[];
  onChange: (updated: Partial<CharacterState>) => void;
}

// Feats that typically take a target weapon, skill, or spell school
const PARAMETERIZED_FEAT_BASES = [
  'Weapon Focus',
  'Greater Weapon Focus',
  'Weapon Specialization',
  'Greater Weapon Specialization',
  'Exotic Weapon Proficiency',
  'Improved Critical',
  'Skill Focus',
  'Spell Focus',
  'Greater Spell Focus',
  'Weapon Finesse'
];

const KNOWN_SPELL_SCHOOLS = new Set([
  'abjuration',
  'conjuration',
  'divination',
  'enchantment',
  'evocation',
  'illusion',
  'necromancy',
  'transmutation',
  'universal'
]);

const KNOWN_ENERGY_TYPES = new Set([
  'acid',
  'cold',
  'electricity',
  'fire',
  'sonic'
]);

function formatFeatIdToTitle(featId: string): string {
  if (featId.startsWith('armor_proficiency_')) {
    const type = featId.replace('armor_proficiency_', '');
    return `Armor Proficiency (${type.charAt(0).toUpperCase() + type.slice(1)})`;
  }
  return featId
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getFeatDisplayName(entity: CharacterFeat, featData?: FeatData): string {
  if (entity.notes) return entity.notes;
  const baseName = featData ? featData.name.replace(/\s*\(.+?\)/, '').trim() : formatFeatIdToTitle(entity.featId);
  if (entity.targetId) {
    const targetDisplay = entity.targetId.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return `${baseName} (${targetDisplay})`;
  }
  return baseName;
}

export const FeatsTab: React.FC<FeatsTabProps> = ({
  character,
  featsData,
  classesData = [],
  racesData = [],
  templatesData = [],
  traitsData = [],
  flawsData = [],
  onChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customFeatInput, setCustomFeatInput] = useState('');
  const [onlyQualified, setOnlyQualified] = useState(false);
  const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);

  // Parameter modal state
  const [paramModalFeat, setParamModalFeat] = useState<FeatData | null>(null);
  const [paramTarget, setParamTarget] = useState('');

  const selectedFeatEntities: CharacterFeat[] = useMemo(() => {
    if (Array.isArray(character.selectedFeatEntities) && character.selectedFeatEntities.length > 0) {
      return character.selectedFeatEntities;
    }
    if (Array.isArray(character.selectedFeats) && character.selectedFeats.length > 0) {
      return migrateLegacyFeatStrings(character.selectedFeats);
    }
    return [];
  }, [character.selectedFeatEntities, character.selectedFeats]);

  const selectedFlaws = character.selectedFlaws || [];
  const flawBonusFeatCount = calculateBonusFeatsFromFlaws(selectedFlaws);
  const featSlotInfo = calculateTotalFeatSlots(character, classesData, racesData);

  // Build character prerequisite context once for high-performance batch validation
  const prereqContext = useMemo(
    () =>
      buildCharacterPrereqContext(
        character,
        classesData,
        racesData,
        traitsData,
        flawsData,
        templatesData
      ),
    [character, classesData, racesData, traitsData, flawsData, templatesData]
  );

  const deduplicatedFeatsData = useMemo(
    () => aggregateAndDeduplicateFeats(featsData),
    [featsData]
  );

  const sortedFeatsData = useMemo(
    () => sortDropdownItems(deduplicatedFeatsData, character.allowedSources),
    [deduplicatedFeatsData, character.allowedSources]
  );

  const handleRemoveFeat = (entityId: string) => {
    const updated = selectedFeatEntities.filter(e => e.id !== entityId);
    onChange({ selectedFeatEntities: updated });
  };

  const handleSelectLibraryFeat = (feat: FeatData) => {
    // Check if feat is parameterized or has (choose) in name/description
    const isParam =
      PARAMETERIZED_FEAT_BASES.some(base => feat.name.toLowerCase().includes(base.toLowerCase())) ||
      feat.name.includes('(') ||
      (feat.description && feat.description.toLowerCase().includes('choose a'));

    if (isParam) {
      setParamModalFeat(feat);
      // Pre-fill target with primary weapon if available
      const primaryWpn = character.equipment?.primaryWeapon || 'Nodachi';
      setParamTarget(primaryWpn.replace(/\s*\(.+?\)/, '')); // e.g. Nodachi
    } else {
      const featId = feat.id || featNameToId(feat.name);
      if (selectedFeatEntities.some(e => e.featId === featId && !e.targetId)) {
        return;
      }
      const newEntity: CharacterFeat = {
        id: featId,
        featId,
        notes: feat.name
      };
      onChange({ selectedFeatEntities: [...selectedFeatEntities, newEntity] });
    }
  };

  const handleConfirmParamFeat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paramModalFeat || !paramTarget.trim()) return;

    const baseName = paramModalFeat.name.replace(/\s*\(.+?\)/, '').trim();
    const target = paramTarget.trim();
    const cleanTarget = target.toLowerCase();
    const targetSlug = cleanTarget.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

    const baseId = paramModalFeat.id
      ? paramModalFeat.id.replace(/_choose.*$/, '').replace(/_target.*$/, '')
      : featNameToId(baseName);

    let targetType: 'weapon' | 'school' | 'skill' | 'energy' = 'weapon';
    const lowerBase = baseName.toLowerCase();
    if (lowerBase.includes('spell') || KNOWN_SPELL_SCHOOLS.has(cleanTarget)) {
      targetType = 'school';
    } else if (lowerBase.includes('energy') || KNOWN_ENERGY_TYPES.has(cleanTarget)) {
      targetType = 'energy';
    } else if (lowerBase.includes('skill')) {
      targetType = 'skill';
    } else if (lowerBase.includes('weapon') || lowerBase.includes('critical') || lowerBase.includes('proficiency')) {
      targetType = 'weapon';
    }

    const newEntity: CharacterFeat = {
      id: `${baseId}_${targetSlug}`,
      featId: baseId,
      targetId: cleanTarget,
      targetType,
      notes: `${baseName} (${target})`
    };

    if (!selectedFeatEntities.some(e => e.featId === newEntity.featId && e.targetId === newEntity.targetId)) {
      onChange({ selectedFeatEntities: [...selectedFeatEntities, newEntity] });
    }

    setParamModalFeat(null);
    setParamTarget('');
  };

  const handleAddCustomFeatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customFeatInput.trim();
    if (!clean) return;

    const parsed = parseLegacyFeatString(clean, selectedFeatEntities.length);
    if (parsed) {
      const exists = selectedFeatEntities.some(
        e => e.featId === parsed.featId && (e.targetId || '') === (parsed.targetId || '')
      );
      if (!exists) {
        parsed.notes = clean;
        onChange({ selectedFeatEntities: [...selectedFeatEntities, parsed] });
      }
    }
    setCustomFeatInput('');
  };

  const isFeatSelectedInLibrary = (feat: FeatData) => {
    const featId = feat.id || featNameToId(feat.name);
    return selectedFeatEntities.some(
      e => e.featId === featId || featNameToId(e.featId) === featNameToId(feat.name)
    );
  };

  const handleRemoveLibraryFeat = (feat: FeatData) => {
    const featId = feat.id || featNameToId(feat.name);
    const updated = selectedFeatEntities.filter(
      e => e.featId !== featId && featNameToId(e.featId) !== featNameToId(feat.name)
    );
    onChange({ selectedFeatEntities: updated });
  };

  const filtered = useMemo(() => {
    return sortedFeatsData
      .filter(f => {
        // Qualified-only filter
        if (onlyQualified) {
          const validation = evaluateFeatPrerequisitesWithContext(f, prereqContext);
          if (!validation.isQualified) return false;
        }

        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          f.name.toLowerCase().includes(q) ||
          (f.prerequisites && f.prerequisites.toLowerCase().includes(q)) ||
          (f.description && f.description.toLowerCase().includes(q))
        );
      })
      .slice(0, 100);
  }, [sortedFeatsData, searchQuery, onlyQualified, prereqContext]);

  // Quick suggestions for parameter modal
  const weaponSuggestions = [
    character.equipment?.primaryWeapon,
    character.equipment?.secondaryWeapon,
    character.equipment?.rangedWeapon,
    'Nodachi',
    'Greatsword',
    'Longsword',
    'Bastard Sword',
    'Scimitar',
    'Shortsword',
    'Composite Longbow',
    'Heavy Crossbow',
    'Ray',
    'Touch'
  ].filter((v, idx, self) => v && v !== 'none' && self.indexOf(v) === idx) as string[];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Selected Feats Slots & Custom Add Bar */}
      <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-4">
        <h2 className="text-lg font-bold font-heading text-slate-100 border-b border-slate-800 pb-3 flex items-center justify-between flex-wrap gap-2">
          <span className="flex items-center gap-2">
            <i className="fa-solid fa-award text-amber-500"></i> Active Feats ({selectedFeatEntities.length} / {featSlotInfo.totalSlots})
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
              selectedFeatEntities.length <= featSlotInfo.totalSlots
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
            }`}
          >
            {selectedFeatEntities.length} / {featSlotInfo.totalSlots} Slots
          </span>
        </h2>

        {/* Flaw Bonus Feat Banner */}
        {flawBonusFeatCount > 0 && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2 font-mono">
            <i className="fa-solid fa-circle-check text-emerald-400 text-sm shrink-0"></i>
            <div>
              <span className="font-bold block">
                +{flawBonusFeatCount} Extra Feat Slot{flawBonusFeatCount > 1 ? 's' : ''} Active
              </span>
              <span className="text-[10px] text-emerald-400/80">
                Granted by selected Flaw{flawBonusFeatCount > 1 ? 's' : ''}: {selectedFlaws.join(', ')}
              </span>
            </div>
          </div>
        )}

        {/* Free-Text Custom Feat Entry */}
        <form onSubmit={handleAddCustomFeatSubmit} className="space-y-2">
          <label className="label-text">Add Custom or Parameterized Feat</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customFeatInput}
              onChange={e => setCustomFeatInput(e.target.value)}
              placeholder="e.g. Weapon Focus (Nodachi)"
              className="input-field text-xs flex-1 font-semibold text-amber-300"
            />
            <button type="submit" className="btn btn-primary text-xs shrink-0 px-3">
              <i className="fa-solid fa-plus"></i> Add
            </button>
          </div>
          <p className="text-[10px] text-slate-400">
            Type any feat name, e.g. <span className="font-mono text-amber-400">Weapon Focus (Nodachi)</span>
          </p>
        </form>

        {/* Active Feats List */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          {selectedFeatEntities.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-3 text-center bg-slate-950/40 rounded-xl">
              No feats selected yet. Add custom feats above or select from the library.
            </p>
          ) : (
            selectedFeatEntities.map(entity => {
              const featObj: FeatData = deduplicatedFeatsData.find(
                f => f.id === entity.featId || featNameToId(f.name) === entity.featId
              ) || {
                id: entity.featId,
                name: entity.notes || getFeatDisplayName(entity),
                description: entity.targetId ? `Specialized feat for ${entity.targetId}.` : 'Active character feat.'
              };

              const validation = evaluateFeatPrerequisitesWithContext(featObj, prereqContext, entity.targetId);
              const displayName = getFeatDisplayName(entity, featObj);

              return (
                <div
                  key={entity.id}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-amber-400 block truncate">{displayName}</span>
                      {featObj.prerequisites && (
                        validation.isQualified ? (
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1"
                            title="Prerequisites met"
                          >
                            <i className="fa-solid fa-check text-emerald-400"></i> Qualified
                          </span>
                        ) : (
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1 cursor-help"
                            title={`Missing prerequisites:\n• ${validation.unmetPrereqs.join('\n• ')}`}
                          >
                            <i className="fa-solid fa-triangle-exclamation text-amber-400"></i> Prereq Unmet
                          </span>
                        )
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveFeat(entity.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors shrink-0"
                      title="Remove Feat"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{featObj.description || 'No description'}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Searchable Feats Database */}
      <div className="lg:col-span-2 card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
              <i className="fa-solid fa-book-bookmark text-amber-500"></i> D&D 3.5 Feat Library ({deduplicatedFeatsData.length.toLocaleString()} Feats)
            </h2>
            <p className="text-xs text-slate-400">Search by feat name, prerequisite, or description</p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Feat Tree Viewer Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsTreeModalOpen(true)}
              className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 font-semibold rounded-xl border border-amber-500/40 text-amber-300 hover:bg-amber-500/15 hover:border-amber-400 transition-all shadow-sm shadow-amber-950/40"
              title="Open Interactive Visual Feat Dependency Tree Viewer"
            >
              <i className="fa-solid fa-diagram-project text-amber-400"></i>
              <span>Feat Tree Viewer</span>
            </button>

            {/* Qualified Only Toggle Button */}
            <button
              type="button"
              onClick={() => setOnlyQualified(!onlyQualified)}
              className={`btn text-xs py-1.5 px-3 flex items-center gap-1.5 font-medium transition-all rounded-xl border ${
                onlyQualified
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-950'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title={
                onlyQualified
                  ? 'Showing only feats you currently qualify for (Click to show all feats)'
                  : 'Filter list to only show feats you qualify for'
              }
            >
              <i
                className={`fa-solid ${
                  onlyQualified ? 'fa-filter-circle-check text-emerald-400' : 'fa-filter text-slate-400'
                }`}
              ></i>
              <span>Qualified Only</span>
            </button>

            <div className="relative min-w-[220px]">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search feats..."
                className="input-field !pl-9 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-950/40 rounded-xl space-y-2">
              <i className="fa-solid fa-book-open text-2xl text-slate-600 block"></i>
              <p className="text-xs font-medium">No feats match your search criteria.</p>
              {onlyQualified && (
                <button
                  type="button"
                  onClick={() => setOnlyQualified(false)}
                  className="btn btn-secondary text-xs mt-2"
                >
                  Turn off "Qualified Only" filter
                </button>
              )}
            </div>
          ) : (
            filtered.map(feat => {
              const isSelected = isFeatSelectedInLibrary(feat);
              const sourceBadgeResult = getAllSourceBadges(feat, character.allowedSources);
              const validation = evaluateFeatPrerequisitesWithContext(feat, prereqContext);

              return (
                <div
                  key={feat.id || feat.name}
                  className={`p-4 rounded-xl border transition-all text-xs space-y-2.5 ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : !sourceBadgeResult.isAllowed
                      ? 'bg-slate-950/40 border-rose-500/20 hover:border-rose-500/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-100">{feat.name}</span>

                      {/* Qualification Status Badge */}
                      {validation.isQualified ? (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-sm shadow-emerald-950/50"
                          title="✓ Qualified: You meet all prerequisites for this feat"
                        >
                          <i className="fa-solid fa-check text-emerald-400"></i> Qualified
                        </span>
                      ) : (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1 cursor-help shadow-sm shadow-amber-950/50"
                          title={`⚠️ Prerequisites Unmet:\n• ${validation.unmetPrereqs.join('\n• ')}`}
                        >
                          <i className="fa-solid fa-triangle-exclamation text-amber-400"></i> Prereq Unmet
                        </span>
                      )}

                      {!sourceBadgeResult.isAllowed && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-500/40"
                          title="Restricted Sourcebook: None of this feat's sourcebooks are enabled in Allowed Sources"
                        >
                          ⚠️ Restricted
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 flex-wrap">
                        {sourceBadgeResult.badges.map(b => (
                          <span
                            key={b.sourceCode}
                            className={`badge font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                              b.isAllowed
                                ? 'bg-slate-800 text-slate-300 border-slate-700'
                                : 'bg-rose-950/40 text-rose-400 border-rose-500/30'
                            }`}
                            title={`${b.sourceName}${b.isAllowed ? ' (Allowed)' : ' (Not Selected)'}`}
                          >
                            {b.sourceCode}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() =>
                          isSelected ? handleRemoveLibraryFeat(feat) : handleSelectLibraryFeat(feat)
                        }
                        className={`btn text-[11px] py-1 px-3 ${
                          isSelected ? 'btn-secondary text-rose-400' : 'btn-primary'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <i className="fa-solid fa-check"></i> Added
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-plus"></i> Select
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Prerequisites Line with Unmet Details */}
                  {feat.prerequisites && (
                    <div className="space-y-1.5">
                      <p className="text-amber-400/90 text-[11px]">
                        <span className="font-bold">Prereq:</span> {feat.prerequisites}
                      </p>
                      {!validation.isQualified && validation.unmetPrereqs.length > 0 && (
                        <div className="text-[10.5px] text-amber-300/90 bg-amber-950/40 border border-amber-500/30 rounded-lg px-2.5 py-1.5 flex items-start gap-2 font-mono">
                          <i className="fa-solid fa-circle-exclamation text-amber-400 mt-0.5 shrink-0 text-xs"></i>
                          <span>
                            <span className="font-bold text-amber-200">Missing criteria:</span>{' '}
                            {validation.unmetPrereqs.join(' • ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-slate-300 text-[11px] leading-relaxed">{feat.description}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: Parameterize Feat Target */}
      {paramModalFeat && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleConfirmParamFeat}
            className="card bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4"
          >
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <i className="fa-solid fa-crosshairs"></i> Select Target for {paramModalFeat.name}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">{paramModalFeat.description}</p>

            <div>
              <label className="label-text">Specified Weapon / Target</label>
              <input
                type="text"
                required
                value={paramTarget}
                onChange={e => setParamTarget(e.target.value)}
                placeholder="e.g. Nodachi, Greatsword, Longsword"
                className="input-field text-xs font-semibold text-amber-300"
              />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">Quick Suggestions:</label>
              <div className="flex flex-wrap gap-1.5">
                {weaponSuggestions.map(wSug => (
                  <button
                    key={wSug}
                    type="button"
                    onClick={() => setParamTarget(wSug)}
                    className={`btn text-[10px] py-0.5 px-2 font-mono ${
                      paramTarget.toLowerCase() === wSug.toLowerCase()
                        ? 'btn-primary'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {wSug}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setParamModalFeat(null)}
                className="btn btn-secondary text-xs"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary text-xs">
                Add Feat: {paramModalFeat.name} ({paramTarget || '...'})
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Interactive Feat Dependency Tree Modal */}
      <FeatTreeModal
        isOpen={isTreeModalOpen}
        onClose={() => setIsTreeModalOpen(false)}
        character={character}
        featsData={deduplicatedFeatsData}
        classesData={classesData}
        racesData={racesData}
        templatesData={templatesData}
        traitsData={traitsData}
        flawsData={flawsData}
        onChange={onChange}
      />
    </div>
  );
};
