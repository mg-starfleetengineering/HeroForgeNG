import React, { useState, useMemo } from 'react';
import { CharacterState, TraitData, FlawData } from '../types/character';
import { getSourceBadgeInfo, sortDropdownItems } from '../utils/sourceFilter';

interface TraitsFlawsSectionProps {
  character: CharacterState;
  traitsData: TraitData[];
  flawsData: FlawData[];
  onChange: (updated: Partial<CharacterState>) => void;
}

export const TraitsFlawsSection: React.FC<TraitsFlawsSectionProps> = ({
  character,
  traitsData,
  flawsData,
  onChange
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'traits' | 'flaws'>('traits');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedTraits = character.selectedTraits || [];
  const selectedFlaws = character.selectedFlaws || [];

  const sortedTraits = useMemo(
    () => sortDropdownItems(traitsData, character.allowedSources),
    [traitsData, character.allowedSources]
  );

  const sortedFlaws = useMemo(
    () => sortDropdownItems(flawsData, character.allowedSources),
    [flawsData, character.allowedSources]
  );

  const handleToggleTrait = (traitName: string) => {
    if (selectedTraits.includes(traitName)) {
      onChange({ selectedTraits: selectedTraits.filter(t => t !== traitName) });
    } else {
      if (selectedTraits.length >= 2) {
        // Replace or allow max 2 traits recommended
        onChange({ selectedTraits: [...selectedTraits, traitName] });
      } else {
        onChange({ selectedTraits: [...selectedTraits, traitName] });
      }
    }
  };

  const handleToggleFlaw = (flawName: string) => {
    if (selectedFlaws.includes(flawName)) {
      onChange({ selectedFlaws: selectedFlaws.filter(f => f !== flawName) });
    } else {
      if (selectedFlaws.length >= 2) {
        alert('Maximum 2 Flaws allowed per Unearthed Arcana rules (+1 bonus feat per flaw).');
        return;
      }
      onChange({ selectedFlaws: [...selectedFlaws, flawName] });
    }
  };

  const filteredTraits = useMemo(() => {
    return sortedTraits.filter(t => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    });
  }, [sortedTraits, searchQuery]);

  const filteredFlaws = useMemo(() => {
    return sortedFlaws.filter(f => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q);
    });
  }, [sortedFlaws, searchQuery]);

  return (
    <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-5">
      {/* Header & Counters */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
            <i className="fa-solid fa-masks-theater text-amber-500"></i> Unearthed Arcana Traits & Flaws
          </h2>
          <p className="text-xs text-slate-400">
            Customize character personality and backstory. Each flaw selected (max 2) grants +1 bonus feat slot.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${
            selectedTraits.length > 0
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}>
            <span className="font-sans text-[11px]">Traits:</span>
            <span className="font-bold text-sm">{selectedTraits.length}/2</span>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${
            selectedFlaws.length > 0
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}>
            <span className="font-sans text-[11px]">Flaws:</span>
            <span className="font-bold text-sm">{selectedFlaws.length}/2</span>
            {selectedFlaws.length > 0 && (
              <span className="text-[10px] font-sans font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                +{selectedFlaws.length} Feat Slot{selectedFlaws.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Selected Items Summary Bar */}
      {(selectedTraits.length > 0 || selectedFlaws.length > 0) && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <i className="fa-solid fa-list-check text-amber-400"></i> Active Character Traits & Flaws
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Selected Traits */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Active Traits</span>
              {selectedTraits.length === 0 ? (
                <p className="text-slate-500 italic text-[11px]">No traits selected.</p>
              ) : (
                selectedTraits.map(tName => {
                  const tObj = traitsData.find(t => t.name.toLowerCase() === tName.toLowerCase() || t.id === tName);
                  return (
                    <div key={tName} className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <div>
                        <span className="font-bold text-amber-200 block">{tObj?.name || tName}</span>
                        <p className="text-[10px] text-slate-300 truncate max-w-[200px]">{tObj?.description}</p>
                      </div>
                      <button
                        onClick={() => handleToggleTrait(tName)}
                        className="text-slate-400 hover:text-rose-400 p-1 transition"
                        title="Remove Trait"
                      >
                        <i className="fa-solid fa-xmark text-sm"></i>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Flaws */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Active Flaws (+1 Feat each)</span>
              {selectedFlaws.length === 0 ? (
                <p className="text-slate-500 italic text-[11px]">No flaws selected.</p>
              ) : (
                selectedFlaws.map(fName => {
                  const fObj = flawsData.find(f => f.name.toLowerCase() === fName.toLowerCase() || f.id === fName);
                  return (
                    <div key={fName} className="flex items-center justify-between p-2 rounded-lg bg-rose-500/10 border border-rose-500/30">
                      <div>
                        <span className="font-bold text-rose-200 block">{fObj?.name || fName}</span>
                        <p className="text-[10px] text-slate-300 truncate max-w-[200px]">{fObj?.description}</p>
                      </div>
                      <button
                        onClick={() => handleToggleFlaw(fName)}
                        className="text-slate-400 hover:text-rose-400 p-1 transition"
                        title="Remove Flaw"
                      >
                        <i className="fa-solid fa-xmark text-sm"></i>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('traits')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'traits'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Traits ({traitsData.length})
          </button>
          <button
            onClick={() => setActiveSubTab('flaws')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'flaws'
                ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Flaws ({flawsData.length})
          </button>
        </div>

        <div className="relative min-w-[220px]">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-500 text-xs"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeSubTab}...`}
            className="input-field pl-8 text-xs w-full"
          />
        </div>
      </div>

      {/* Library Grid / List */}
      <div className="max-h-[420px] overflow-y-auto space-y-2.5 pr-2 scrollbar-thin">
        {activeSubTab === 'traits' ? (
          filteredTraits.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center p-4">No traits match search query.</p>
          ) : (
            filteredTraits.map(trait => {
              const isSelected = selectedTraits.includes(trait.name) || selectedTraits.includes(trait.id);
              const badge = getSourceBadgeInfo(trait.source, character.allowedSources);

              return (
                <div
                  key={trait.id}
                  className={`p-3.5 rounded-xl border transition-all text-xs space-y-1.5 ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-sm">{trait.name}</span>
                      <span className="badge bg-slate-800 text-slate-400 font-mono text-[10px]">
                        {trait.source || 'UA'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleTrait(trait.name)}
                      className={`btn text-[11px] py-1 px-3 ${
                        isSelected ? 'btn-secondary text-rose-400' : 'btn-primary'
                      }`}
                    >
                      {isSelected ? (
                        <><i className="fa-solid fa-check mr-1"></i> Active</>
                      ) : (
                        <><i className="fa-solid fa-plus mr-1"></i> Select</>
                      )}
                    </button>
                  </div>

                  <p className="text-slate-300 text-[11px] leading-relaxed">{trait.description}</p>
                </div>
              );
            })
          )
        ) : (
          filteredFlaws.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center p-4">No flaws match search query.</p>
          ) : (
            filteredFlaws.map(flaw => {
              const isSelected = selectedFlaws.includes(flaw.name) || selectedFlaws.includes(flaw.id);
              const badge = getSourceBadgeInfo(flaw.source, character.allowedSources);

              return (
                <div
                  key={flaw.id}
                  className={`p-3.5 rounded-xl border transition-all text-xs space-y-1.5 ${
                    isSelected
                      ? 'bg-rose-500/10 border-rose-500/40 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-sm">{flaw.name}</span>
                      <span className="badge bg-rose-950/40 text-rose-300 border border-rose-500/30 font-mono text-[10px]">
                        +1 Feat
                      </span>
                      <span className="badge bg-slate-800 text-slate-400 font-mono text-[10px]">
                        {flaw.source || 'UA'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleFlaw(flaw.name)}
                      className={`btn text-[11px] py-1 px-3 ${
                        isSelected ? 'btn-secondary text-rose-400' : 'btn-primary'
                      }`}
                    >
                      {isSelected ? (
                        <><i className="fa-solid fa-check mr-1"></i> Active</>
                      ) : (
                        <><i className="fa-solid fa-plus mr-1"></i> Select</>
                      )}
                    </button>
                  </div>

                  <p className="text-slate-300 text-[11px] leading-relaxed">{flaw.description}</p>
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
};
