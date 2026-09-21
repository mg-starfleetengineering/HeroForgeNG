import React, { useMemo } from 'react';
import { CharacterState } from '../types/character';
import { ALL_SOURCES, CORE_SOURCES, SourceBook } from '../utils/sourceFilter';
import { BookOpen, SquareCheck, Square, ShieldAlert, Sparkles, RefreshCw, CircleCheck, SlidersHorizontal } from 'lucide-react';
import { useCharacter, useCharacterDispatch } from '../context/CharacterContext';

interface SourceBooksTabProps {
  character?: CharacterState;
  onChange?: (updated: CharacterState) => void;
}

export const SourceBooksTab: React.FC<SourceBooksTabProps> = (props) => {
  const contextCharacter = useCharacter();
  const { updateCharacter } = useCharacterDispatch();

  const character = props.character ?? contextCharacter;
  const onChange = props.onChange ?? updateCharacter;
  const allowedSources = useMemo(() => {
    return character.allowedSources && character.allowedSources.length > 0
      ? character.allowedSources
      : CORE_SOURCES;
  }, [character.allowedSources]);

  // Group sources by category
  const categories = useMemo(() => {
    const cats: Record<string, SourceBook[]> = {};
    ALL_SOURCES.forEach(source => {
      if (!cats[source.category]) {
        cats[source.category] = [];
      }
      cats[source.category].push(source);
    });
    return cats;
  }, []);

  const handleToggleSource = (sourceId: string) => {
    let nextAllowed: string[];
    if (allowedSources.includes(sourceId)) {
      nextAllowed = allowedSources.filter(id => id !== sourceId);
    } else {
      nextAllowed = [...allowedSources, sourceId];
    }
    onChange({
      ...character,
      allowedSources: nextAllowed
    });
  };

  const handleSetPreset = (preset: 'core' | 'complete' | 'all' | 'none') => {
    let nextAllowed: string[];
    if (preset === 'core') {
      nextAllowed = [...CORE_SOURCES];
    } else if (preset === 'complete') {
      const completeIds = ALL_SOURCES.filter(s => s.isCore || s.category === 'Complete Series').map(s => s.id);
      nextAllowed = Array.from(new Set([...CORE_SOURCES, ...completeIds]));
    } else if (preset === 'all') {
      nextAllowed = ALL_SOURCES.map(s => s.id);
    } else {
      // Keep at least PHB enabled
      nextAllowed = ['PHB'];
    }

    onChange({
      ...character,
      allowedSources: nextAllowed
    });
  };

  const handleToggleCategory = (categoryName: string) => {
    const categorySourceIds = categories[categoryName].map(s => s.id);
    const allCategoryEnabled = categorySourceIds.every(id => allowedSources.includes(id));

    let nextAllowed: string[];
    if (allCategoryEnabled) {
      nextAllowed = allowedSources.filter(id => !categorySourceIds.includes(id));
    } else {
      nextAllowed = Array.from(new Set([...allowedSources, ...categorySourceIds]));
    }

    onChange({
      ...character,
      allowedSources: nextAllowed
    });
  };

  const totalAllowed = allowedSources.length;
  const totalSources = ALL_SOURCES.length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/30 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <BookOpen className="w-48 h-48 text-amber-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
                <BookOpen className="w-6 h-6" />
              </span>
              <h2 className="text-2xl font-bold text-slate-100 font-serif tracking-wide">
                Campaign Source Books
              </h2>
            </div>
            <p className="text-slate-400 text-sm max-w-2xl">
              Configure allowed D&D 3.5e sourcebooks for <strong className="text-amber-300">{character.name || 'this character'}</strong>. 
              Items from disabled sourcebooks will display with a <span className="text-amber-400 font-semibold">warning badge</span> in selectors across race, class, feat, and equipment tabs.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 min-w-[200px] text-center shadow-inner">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
              Active Sourcebooks
            </div>
            <div className="text-3xl font-extrabold text-amber-400 font-mono">
              {totalAllowed} <span className="text-lg text-slate-500 font-normal">/ {totalSources}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {totalAllowed === 3 ? 'Core Only (Default)' : totalAllowed === totalSources ? 'All 3.5e Sources Active' : 'Custom Ruleset'}
            </div>
          </div>
        </div>

        {/* Preset Quick Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-slate-300">Quick Presets:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSetPreset('core')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                totalAllowed === 3 && allowedSources.includes('PHB') && allowedSources.includes('DMG') && allowedSources.includes('MM')
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <CircleCheck className="w-3.5 h-3.5" />
              Core Only (PHB / DMG / MM)
            </button>

            <button
              onClick={() => handleSetPreset('complete')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Core + Complete Series
            </button>

            <button
              onClick={() => handleSetPreset('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                totalAllowed === totalSources
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <SquareCheck className="w-3.5 h-3.5 text-emerald-400" />
              Enable All 3.5e Sources
            </button>

            <button
              onClick={() => handleSetPreset('none')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset to Minimal
            </button>
          </div>
        </div>
      </div>

      {/* Warning Mode Banner */}
      <div className="bg-amber-950/30 border border-amber-500/20 rounded-lg p-3.5 flex items-start gap-3 text-xs text-amber-200">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300 font-semibold">Warning Badge Mode Active: </strong> 
          Disabling a sourcebook does not delete items from your character sheet. Instead, races, classes, feats, or equipment from disabled books will display a 
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-400 border border-amber-500/30 mx-1">Restricted Source</span>
          warning badge when chosen, giving you full visibility and flexibility for DM exceptions.
        </div>
      </div>

      {/* Sourcebook Categories Grid */}
      <div className="space-y-6">
        {Object.entries(categories).map(([categoryName, sourceList]) => {
          const categoryAllowedCount = sourceList.filter(s => allowedSources.includes(s.id)).length;
          const allCategoryEnabled = categoryAllowedCount === sourceList.length;

          return (
            <div 
              key={categoryName}
              className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-md"
            >
              {/* Category Header */}
              <div className="bg-slate-950/80 px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-slate-200 text-sm tracking-wide">
                    {categoryName}
                  </h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    {categoryAllowedCount} / {sourceList.length} Active
                  </span>
                </div>

                <button
                  onClick={() => handleToggleCategory(categoryName)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors flex items-center gap-1"
                >
                  {allCategoryEnabled ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Sourcebooks Cards */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {sourceList.map(source => {
                  const isAllowed = allowedSources.includes(source.id);
                  return (
                    <div
                      key={source.id}
                      onClick={() => handleToggleSource(source.id)}
                      className={`cursor-pointer rounded-lg p-3 border transition-all flex items-start justify-between gap-3 ${
                        isAllowed
                          ? 'bg-amber-950/20 border-amber-500/40 text-slate-200 shadow-sm hover:border-amber-400'
                          : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
                            isAllowed
                              ? source.isCore
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-600 border border-slate-700'
                          }`}>
                            {source.abbr || source.id}
                          </span>
                          {source.isCore && (
                            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                              Core
                            </span>
                          )}
                        </div>
                        <div className={`text-xs font-medium leading-snug truncate ${isAllowed ? 'text-slate-200' : 'text-slate-400'}`}>
                          {source.name}
                        </div>
                      </div>

                      <div className="shrink-0 mt-0.5">
                        {isAllowed ? (
                          <SquareCheck className="w-5 h-5 text-amber-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-700" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
