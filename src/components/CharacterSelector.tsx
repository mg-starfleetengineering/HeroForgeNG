import React, { useState, useRef, useEffect } from 'react';
import { CharacterSheetData, CharacterSummary } from '../types/character';
import { formatClassesSummary } from '../storage/characterStore';

interface CharacterSelectorProps {
  activeCharacter: CharacterSheetData;
  summaries: CharacterSummary[];
  onSelectCharacter: (id: string) => void;
  onOpenRoster: () => void;
  onCreateNew: () => void;
}

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  activeCharacter,
  summaries,
  onSelectCharacter,
  onOpenRoster,
  onCreateNew
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLevel = activeCharacter.levelProgression?.filter(l => l.primaryClass)?.length || 1;
  const activeClassStr = formatClassesSummary(activeCharacter.levelProgression || []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSummaries = summaries.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.race.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.classes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Active Character Selector Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 text-left transition group shadow-inner"
        title="Switch active character or manage roster"
      >
        <div className="w-8 h-8 rounded-lg border border-amber-500/40 bg-slate-900 overflow-hidden shrink-0 flex items-center justify-center">
          {activeCharacter.portraitUrl ? (
            <img src={activeCharacter.portraitUrl} alt={activeCharacter.name} className="w-full h-full object-cover" />
          ) : (
            <i className="fa-solid fa-user-shield text-amber-400 text-sm"></i>
          )}
        </div>

        <div className="hidden sm:block leading-tight max-w-[150px] md:max-w-[200px] truncate">
          <div className="text-xs font-bold text-amber-300 truncate group-hover:text-amber-200">
            {activeCharacter.name || 'Unnamed Character'}
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            Lvl {activeLevel} {activeCharacter.selectedRace} &bull; {activeClassStr}
          </div>
        </div>

        <i className={`fa-solid fa-chevron-down text-xs text-slate-400 group-hover:text-amber-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-fadeIn">
          {/* Header & Quick Filter */}
          <div className="p-3 border-b border-slate-800 bg-slate-950/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-heading">
                Roster ({summaries.length})
              </span>
              <button
                onClick={() => { setIsOpen(false); onOpenRoster(); }}
                className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 font-semibold"
              >
                <i className="fa-solid fa-users text-xs"></i> Manage Roster
              </button>
            </div>

            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 text-xs text-slate-500"></i>
              <input
                type="text"
                placeholder="Filter characters..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          {/* Character Roster List */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-1 divide-y divide-slate-800/40">
            {filteredSummaries.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">No matching characters found</div>
            ) : (
              filteredSummaries.map(s => {
                const isActive = s.id === activeCharacter.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectCharacter(s.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl flex items-center justify-between gap-3 transition ${
                      isActive
                        ? 'bg-amber-500/15 border border-amber-500/40 text-amber-200'
                        : 'hover:bg-slate-800/70 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg border border-slate-700 bg-slate-950 overflow-hidden shrink-0 flex items-center justify-center">
                        {s.portraitUrl ? (
                          <img src={s.portraitUrl} alt={s.name} className="w-full h-full object-cover" />
                        ) : (
                          <i className="fa-solid fa-user-shield text-slate-400 text-xs"></i>
                        )}
                      </div>
                      <div className="truncate leading-tight">
                        <div className={`text-xs font-semibold truncate ${isActive ? 'text-amber-300 font-bold' : 'text-slate-200'}`}>
                          {s.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          Lvl {s.level} {s.race} &bull; {s.classes}
                        </div>
                      </div>
                    </div>

                    {isActive && (
                      <span className="shrink-0 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-md font-mono font-bold">
                        Active
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-2 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2">
            <button
              onClick={() => {
                setIsOpen(false);
                onCreateNew();
              }}
              className="w-full btn btn-secondary text-xs py-1.5 flex items-center justify-center gap-1.5"
            >
              <i className="fa-solid fa-plus text-amber-400"></i> New Character
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenRoster();
              }}
              className="w-full btn btn-primary text-xs py-1.5 flex items-center justify-center gap-1.5"
            >
              <i className="fa-solid fa-table-cells"></i> View All Cards
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
