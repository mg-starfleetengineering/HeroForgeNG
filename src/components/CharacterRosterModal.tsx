import React, { useState } from 'react';
import { CharacterSheetData, CharacterSummary } from '../types/character';

interface CharacterRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCharacterId: string;
  summaries: CharacterSummary[];
  onSelectCharacter: (id: string) => void;
  onDuplicateCharacter: (id: string) => void;
  onDeleteCharacter: (id: string) => void;
  onExportCharacter: (id: string) => void;
  onExportAllCharacters: () => void;
  onCreateNewCharacter: () => void;
  onImportCharacterJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CharacterRosterModal: React.FC<CharacterRosterModalProps> = ({
  isOpen,
  onClose,
  activeCharacterId,
  summaries,
  onSelectCharacter,
  onDuplicateCharacter,
  onDeleteCharacter,
  onExportCharacter,
  onExportAllCharacters,
  onCreateNewCharacter,
  onImportCharacterJSON
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredSummaries = summaries.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.race.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.classes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg">
              <i className="fa-solid fa-users-viewfinder"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading text-amber-300 tracking-wide">
                Character Roster Dashboard
              </h2>
              <p className="text-xs text-slate-400">
                Manage all your local D&D 3.5e characters ({summaries.length} saved)
              </p>
            </div>
          </div>

          {/* Action Header Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onExportAllCharacters}
              className="btn btn-secondary text-xs flex items-center gap-1.5"
              title="Export complete roster backup JSON file containing all characters"
            >
              <i className="fa-solid fa-file-export text-amber-400"></i>
              <span>Export Roster Backup</span>
            </button>

            <label className="btn btn-secondary text-xs cursor-pointer flex items-center gap-1.5" title="Import Character JSON File(s) or Roster Backup">
              <i className="fa-solid fa-file-import text-amber-400"></i>
              <span>Import JSON / Backup</span>
              <input type="file" className="hidden" accept=".json" multiple onChange={onImportCharacterJSON} />
            </label>

            <button
              onClick={onCreateNewCharacter}
              className="btn btn-primary text-xs flex items-center gap-1.5 shadow-lg shadow-amber-900/30"
            >
              <i className="fa-solid fa-user-plus"></i>
              <span>Create New</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              title="Close Roster"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
        </div>

        {/* Search / Filter Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center gap-3">
          <div className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-slate-500"></i>
            <input
              type="text"
              placeholder="Search roster by character name, race, or class..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-300"
              >
                <i className="fa-solid fa-circle-xmark"></i>
              </button>
            )}
          </div>
        </div>

        {/* Character Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredSummaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-800/60 flex items-center justify-center text-slate-500 text-2xl">
                <i className="fa-solid fa-user-slash"></i>
              </div>
              <h3 className="text-base font-semibold text-slate-300">No characters found</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                {searchTerm ? 'Try adjusting your search criteria.' : 'Click "Create New Character" or "Import JSON" to add characters to your roster.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSummaries.map(s => {
                const isActive = s.id === activeCharacterId;
                return (
                  <div
                    key={s.id}
                    className={`relative rounded-2xl border p-4 flex flex-col justify-between transition-all duration-200 ${
                      isActive
                        ? 'bg-slate-900 border-amber-500/60 shadow-xl shadow-amber-950/20 ring-1 ring-amber-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    {/* Active Ribbon Badge */}
                    {isActive && (
                      <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow">
                        Active Context
                      </div>
                    )}

                    <div>
                      {/* Top Card Info */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl border border-slate-700 bg-slate-950 overflow-hidden shrink-0 flex items-center justify-center shadow">
                          {s.portraitUrl ? (
                            <img src={s.portraitUrl} alt={s.name} className="w-full h-full object-cover" />
                          ) : (
                            <i className="fa-solid fa-user-shield text-slate-500 text-lg"></i>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-slate-100 truncate group-hover:text-amber-300">
                            {s.name || 'Unnamed Character'}
                          </h3>
                          <div className="text-xs text-amber-400 font-medium truncate mt-0.5">
                            Level {s.level} {s.race}
                          </div>
                          <div className="text-xs text-slate-400 truncate">
                            {s.classes}
                          </div>
                        </div>
                      </div>

                      {/* Card Details / Metadata */}
                      <div className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-2.5 mb-4 flex items-center justify-between">
                        <span>Last modified:</span>
                        <span className="font-mono text-slate-400">{formatDate(s.updatedAt)}</span>
                      </div>
                    </div>

                    {/* Card Action Controls */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                      {isActive ? (
                        <button
                          disabled
                          className="flex-1 btn bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs py-1.5 font-bold cursor-default"
                        >
                          <i className="fa-solid fa-check"></i> Active
                        </button>
                      ) : (
                        <button
                          onClick={() => onSelectCharacter(s.id)}
                          className="flex-1 btn btn-primary text-xs py-1.5 font-semibold"
                        >
                          Select
                        </button>
                      )}

                      <button
                        onClick={() => onDuplicateCharacter(s.id)}
                        className="btn btn-secondary text-xs p-1.5 w-8 h-8 flex items-center justify-center shrink-0"
                        title="Duplicate Sheet"
                      >
                        <i className="fa-solid fa-copy text-slate-300"></i>
                      </button>

                      <button
                        onClick={() => onExportCharacter(s.id)}
                        className="btn btn-secondary text-xs p-1.5 w-8 h-8 flex items-center justify-center shrink-0"
                        title="Export Native JSON"
                      >
                        <i className="fa-solid fa-download text-amber-400"></i>
                      </button>

                      <button
                        onClick={() => onDeleteCharacter(s.id)}
                        className="btn bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-xs p-1.5 w-8 h-8 flex items-center justify-center shrink-0"
                        title="Delete Sheet"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing {filteredSummaries.length} of {summaries.length} characters
          </div>
          <button onClick={onClose} className="btn btn-secondary text-xs">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
