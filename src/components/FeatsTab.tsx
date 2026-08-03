import React, { useState } from 'react';
import { CharacterState, FeatData } from '../types/character';

interface FeatsTabProps {
  character: CharacterState;
  featsData: FeatData[];
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

export const FeatsTab: React.FC<FeatsTabProps> = ({ character, featsData, onChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customFeatInput, setCustomFeatInput] = useState('');

  // Parameter modal state
  const [paramModalFeat, setParamModalFeat] = useState<FeatData | null>(null);
  const [paramTarget, setParamTarget] = useState('');

  const selectedFeats = character.selectedFeats || [];

  const handleRemoveFeat = (featName: string) => {
    const updated = selectedFeats.filter(f => f !== featName);
    onChange({ selectedFeats: updated });
  };

  const handleAddFeatString = (featStr: string) => {
    if (!featStr.trim()) return;
    const clean = featStr.trim();
    if (!selectedFeats.includes(clean)) {
      onChange({ selectedFeats: [...selectedFeats, clean] });
    }
  };

  const handleSelectLibraryFeat = (feat: FeatData) => {
    // Check if feat is parameterized or has (choose) in name/description
    const isParam = PARAMETERIZED_FEAT_BASES.some(base => feat.name.toLowerCase().includes(base.toLowerCase())) ||
                    feat.name.includes('(') ||
                    (feat.description && feat.description.toLowerCase().includes('choose a'));

    if (isParam) {
      setParamModalFeat(feat);
      // Pre-fill target with primary weapon if available
      const primaryWpn = character.equipment?.primaryWeapon || 'Nodachi';
      setParamTarget(primaryWpn.replace(/\s*\(.+?\)/, '')); // e.g. Nodachi
    } else {
      handleAddFeatString(feat.name);
    }
  };

  const handleConfirmParamFeat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paramModalFeat || !paramTarget.trim()) return;

    const baseName = paramModalFeat.name.replace(/\s*\(.+?\)/, '');
    const fullFeatStr = `${baseName} (${paramTarget.trim()})`;
    handleAddFeatString(fullFeatStr);

    setParamModalFeat(null);
    setParamTarget('');
  };

  const handleAddCustomFeatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customFeatInput.trim()) {
      handleAddFeatString(customFeatInput.trim());
      setCustomFeatInput('');
    }
  };

  const filtered = featsData.filter(f => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return f.name.toLowerCase().includes(q) || 
           (f.prerequisites && f.prerequisites.toLowerCase().includes(q)) || 
           (f.description && f.description.toLowerCase().includes(q));
  }).slice(0, 80);

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
        <h2 className="text-lg font-bold font-heading text-slate-100 border-b border-slate-800 pb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <i className="fa-solid fa-award text-amber-500"></i> Active Feats ({selectedFeats.length})
          </span>
        </h2>

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
            <button
              type="submit"
              className="btn btn-primary text-xs shrink-0 px-3"
            >
              <i className="fa-solid fa-plus"></i> Add
            </button>
          </div>
          <p className="text-[10px] text-slate-400">Type any feat name, e.g. <span className="font-mono text-amber-400">Weapon Focus (Nodachi)</span></p>
        </form>

        {/* Active Feats List */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          {selectedFeats.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-3 text-center bg-slate-950/40 rounded-xl">No feats selected yet. Add custom feats above or select from the library.</p>
          ) : (
            selectedFeats.map(featName => {
              // Try match base feat or exact
              const aliasMatch = featName.match(/^(.+?)\s*\((.+?)\)$/);
              const baseFeatName = aliasMatch ? aliasMatch[1].trim() : featName;
              const featObj = featsData.find(f => f.name.toLowerCase() === baseFeatName.toLowerCase() || f.name.toLowerCase() === featName.toLowerCase()) || {
                name: featName,
                description: aliasMatch ? `Specialized feat for ${aliasMatch[2]}.` : 'Active character feat.'
              };

              return (
                <div key={featName} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-amber-400 block truncate">{featName}</span>
                    <p className="text-[11px] text-slate-400 truncate">{featObj.description || 'No description'}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveFeat(featName)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                    title="Remove Feat"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
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
              <i className="fa-solid fa-book-bookmark text-amber-500"></i> D&D 3.5 Feat Library ({featsData.length}+ Feats)
            </h2>
            <p className="text-xs text-slate-400">Search by feat name, prerequisite, or description</p>
          </div>

          <div className="relative min-w-[240px]">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-500 text-xs"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search feats..."
              className="input-field pl-8 text-xs"
            />
          </div>
        </div>

        <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
          {filtered.map(feat => {
            const isSelected = selectedFeats.some(sf => sf === feat.name || sf.startsWith(`${feat.name} (`));
            return (
              <div
                key={feat.id || feat.name}
                className={`p-4 rounded-xl border transition-all text-xs space-y-2 ${isSelected ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-slate-100">{feat.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="badge bg-slate-800 text-slate-400 font-mono text-[10px]">{feat.source || 'PH'}</span>
                    <button
                      onClick={() => isSelected ? handleRemoveFeat(feat.name) : handleSelectLibraryFeat(feat)}
                      className={`btn text-[11px] py-1 px-3 ${isSelected ? 'btn-secondary text-rose-400' : 'btn-primary'}`}
                    >
                      {isSelected ? <><i className="fa-solid fa-check"></i> Added</> : <><i className="fa-solid fa-plus"></i> Select</>}
                    </button>
                  </div>
                </div>
                {feat.prerequisites && (
                  <p className="text-amber-400/90 text-[11px]"><span className="font-bold">Prereq:</span> {feat.prerequisites}</p>
                )}
                <p className="text-slate-300 text-[11px] leading-relaxed">{feat.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Parameterize Feat Target */}
      {paramModalFeat && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleConfirmParamFeat} className="card bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <i className="fa-solid fa-crosshairs"></i> Select Target for {paramModalFeat.name}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              {paramModalFeat.description}
            </p>

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
                    className={`btn text-[10px] py-0.5 px-2 font-mono ${paramTarget.toLowerCase() === wSug.toLowerCase() ? 'btn-primary' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
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
              <button
                type="submit"
                className="btn btn-primary text-xs"
              >
                Add Feat: {paramModalFeat.name} ({paramTarget || '...'})
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
