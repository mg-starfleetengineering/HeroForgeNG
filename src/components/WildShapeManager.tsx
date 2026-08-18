import React, { useState, useMemo } from 'react';
import {
  CharacterState,
  WildShapeFormData,
  CustomWildShapeData,
  WildShapeState
} from '../types/character';
import {
  getEffectiveDruidLevel,
  getWildShapeProgression,
  resolveActiveWildShape,
  DEFAULT_CUSTOM_WILDSHAPE,
  getSizeAttackModifier,
  getSizeAcModifier
} from '../engine/wildshape';
import { getAbilityMod } from '../engine/stats';

interface WildShapeManagerProps {
  character: CharacterState;
  formsData: WildShapeFormData[];
  onChange: (updated: Partial<CharacterState>) => void;
  compact?: boolean;
}

export const WildShapeManager: React.FC<WildShapeManagerProps> = ({
  character,
  formsData = [],
  onChange,
  compact = false
}) => {
  const druidLevel = getEffectiveDruidLevel(character);
  const progression = getWildShapeProgression(druidLevel);
  const activeForm = resolveActiveWildShape(character, formsData);

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customDraft, setCustomDraft] = useState<CustomWildShapeData>(
    character.wildShape?.customForm || DEFAULT_CUSTOM_WILDSHAPE
  );
  const isCapable = druidLevel >= 5 || Boolean(character.wildShape?.isActive);
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);

  const handleToggleWildShape = (formId: string) => {
    if (activeForm && character.wildShape?.selectedFormId === formId && character.wildShape?.isActive) {
      // Deactivate
      onChange({
        wildShape: {
          ...character.wildShape,
          isActive: false
        }
      });
    } else {
      // Activate
      onChange({
        wildShape: {
          ...(character.wildShape || { isActive: true }),
          isActive: true,
          selectedFormId: formId
        }
      });
    }
  };

  const handleRevert = () => {
    onChange({
      wildShape: {
        ...(character.wildShape || { isActive: false }),
        isActive: false
      }
    });
  };

  const handleSaveCustomForm = () => {
    onChange({
      wildShape: {
        ...(character.wildShape || { isActive: true }),
        isActive: true,
        selectedFormId: 'custom',
        customForm: customDraft
      }
    });
    setShowCustomModal(false);
  };

  // Filtered forms list
  const filteredForms = useMemo(() => {
    return formsData.filter(form => {
      if (categoryFilter !== 'all' && form.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
      if (sizeFilter !== 'all' && form.size.toLowerCase() !== sizeFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName = form.name.toLowerCase().includes(q);
        const matchesType = form.creatureType.toLowerCase().includes(q);
        const matchesSource = (form.source || '').toLowerCase().includes(q);
        const matchesSpecials = (form.specialQualities || []).some(s => s.toLowerCase().includes(q));
        const matchesAttacks = (form.attacks || []).some(a => a.name.toLowerCase().includes(q) || (a.special || '').toLowerCase().includes(q));
        if (!matchesName && !matchesType && !matchesSource && !matchesSpecials && !matchesAttacks) {
          return false;
        }
      }
      return true;
    });
  }, [formsData, categoryFilter, sizeFilter, searchQuery]);

  if (!isCapable && !isManuallyExpanded) {
    return (
      <div className="card bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-500 text-sm shrink-0">
            <i className="fa-solid fa-paw"></i>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 flex items-center gap-2">
              <span>Wild Shape Form Manager</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                Locked &bull; Unlocks at Druid Level 5
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Character does not meet class requirements (requires 5+ levels in Druid or Wild Shape prestige classes).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsManuallyExpanded(true)}
          className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-slate-400 hover:text-slate-200 self-start sm:self-center"
          title="Click to manually expand Wild Shape Form Manager"
        >
          <i className="fa-solid fa-chevron-down text-xs"></i>
          <span>Show Manager</span>
        </button>
      </div>
    );
  }

  return (
    <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-6">
      {/* Header with Druid Wild Shape summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
            <i className="fa-solid fa-paw text-emerald-400"></i> Wild Shape Form Manager
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            D&D 3.5e Wild Shape transforms physical ability scores, natural armor, speeds, size, and natural attacks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-slate-400 uppercase text-[10px] font-bold">Druid Level</span>
            <span className={`font-mono font-bold ${druidLevel >= 5 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {druidLevel}
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-slate-400 uppercase text-[10px] font-bold">Daily Uses</span>
            <span className="font-mono font-bold text-amber-400">
              {progression.dailyUses}/day
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowCustomModal(true)}
            className="btn btn-secondary text-xs flex items-center gap-1.5"
          >
            <i className="fa-solid fa-plus text-emerald-400"></i> Custom Form
          </button>

          {!isCapable && isManuallyExpanded && (
            <button
              type="button"
              onClick={() => setIsManuallyExpanded(false)}
              className="btn btn-secondary text-xs py-1.5 px-2.5 text-slate-400 hover:text-slate-200"
              title="Collapse Wild Shape Form Manager"
            >
              <i className="fa-solid fa-chevron-up"></i>
            </button>
          )}
        </div>
      </div>

      {/* Active Form Stance Banner */}
      {activeForm ? (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-emerald-950/60 border-2 border-emerald-500/50 shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/30 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 text-2xl shrink-0 shadow-inner">
                <i className="fa-solid fa-paw"></i>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                    🌿 Active Wild Shape
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold uppercase">
                    {activeForm.size} {activeForm.creatureType}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold font-heading text-slate-100">
                  {activeForm.name}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRevert}
              className="btn btn-secondary text-xs border-rose-500/40 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 flex items-center gap-1.5 self-start sm:self-center"
            >
              <i className="fa-solid fa-arrow-rotate-left text-rose-400"></i> Revert to Humanoid Form
            </button>
          </div>

          {/* Form Quick Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs font-mono">
            <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-sans">Strength</span>
              <span className="text-base font-bold text-emerald-300">{activeForm.str}</span>
              <span className="text-[10px] text-slate-500 block">({getAbilityMod(activeForm.str) >= 0 ? '+' : ''}{getAbilityMod(activeForm.str)})</span>
            </div>

            <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-sans">Dexterity</span>
              <span className="text-base font-bold text-cyan-300">{activeForm.dex}</span>
              <span className="text-[10px] text-slate-500 block">({getAbilityMod(activeForm.dex) >= 0 ? '+' : ''}{getAbilityMod(activeForm.dex)})</span>
            </div>

            <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-sans">Constitution</span>
              <span className="text-base font-bold text-amber-300">{activeForm.con}</span>
              <span className="text-[10px] text-slate-500 block">({getAbilityMod(activeForm.con) >= 0 ? '+' : ''}{getAbilityMod(activeForm.con)})</span>
            </div>

            <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-sans">Natural Armor</span>
              <span className="text-base font-bold text-orange-300">+{activeForm.naturalArmor}</span>
              <span className="text-[10px] text-slate-500 block">AC Bonus</span>
            </div>

            <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-sans">Size Mod (AC/Atk)</span>
              <span className="text-base font-bold text-purple-300">
                {getSizeAcModifier(activeForm.size) >= 0 ? `+${getSizeAcModifier(activeForm.size)}` : getSizeAcModifier(activeForm.size)}
              </span>
              <span className="text-[10px] text-slate-500 block">{activeForm.size}</span>
            </div>

            <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-sans">Movement</span>
              <span className="text-base font-bold text-slate-200">
                {activeForm.speed.land} ft
              </span>
              <span className="text-[10px] text-slate-500 block">
                {[
                  activeForm.speed.fly ? `Fly ${activeForm.speed.fly}ft` : '',
                  activeForm.speed.swim ? `Swim ${activeForm.speed.swim}ft` : '',
                  activeForm.speed.burrow ? `Burrow ${activeForm.speed.burrow}ft` : '',
                  activeForm.speed.climb ? `Climb ${activeForm.speed.climb}ft` : ''
                ].filter(Boolean).join(', ') || 'Land'}
              </span>
            </div>
          </div>

          {/* Form Attacks & Special Qualities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block font-sans">
                Natural Attack Routine
              </span>
              <ul className="space-y-1 font-mono text-slate-300">
                {(activeForm.attacks || []).map((atk, idx) => (
                  <li key={idx} className="flex items-center justify-between">
                    <span>
                      <strong>{atk.name}</strong> {atk.attackCount && atk.attackCount > 1 ? `(${atk.attackCount}x)` : ''}
                      <span className="text-slate-500 ml-1">({atk.isPrimary ? 'Primary' : 'Secondary'})</span>
                    </span>
                    <span className="text-amber-400 font-bold">
                      {atk.damage} {atk.special ? `• ${atk.special}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block font-sans">
                Special Qualities & Stances
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(activeForm.specialQualities || []).map((sq, idx) => (
                  <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-emerald-500/30 text-emerald-300 font-mono">
                    {sq}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-1">
          <p className="text-sm font-semibold text-slate-300">
            <i className="fa-solid fa-person text-amber-400 mr-2"></i> Normal Humanoid Form Active
          </p>
          <p className="text-xs text-slate-500">
            Select a wild shape form below to substitute physical ability scores, natural armor, speeds, and natural attacks.
          </p>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {[
              { id: 'all', label: 'All Forms' },
              { id: 'animal', label: 'Animals' },
              { id: 'dinosaur', label: 'Dinosaurs' },
              { id: 'plant', label: 'Plants' },
              { id: 'elemental', label: 'Elementals' }
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/30'
                    : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-xs text-slate-500"></i>
            <input
              type="text"
              placeholder="Search forms, attacks, traits..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
            />
          </div>
        </div>

        {/* Size Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 mr-1 shrink-0">Size:</span>
          {['all', 'Tiny', 'Small', 'Medium', 'Large', 'Huge'].map(sz => (
            <button
              key={sz}
              type="button"
              onClick={() => setSizeFilter(sz)}
              className={`px-2.5 py-0.5 rounded-lg font-mono text-[11px] transition shrink-0 ${
                sizeFilter === sz
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'bg-slate-950/40 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              {sz === 'all' ? 'All Sizes' : sz}
            </button>
          ))}
        </div>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredForms.map(form => {
          const isSelected = character.wildShape?.isActive && (
            character.wildShape?.selectedFormId?.toLowerCase() === form.id.toLowerCase() ||
            character.wildShape?.selectedFormId?.toLowerCase() === form.name.toLowerCase()
          );

          const isEligible = druidLevel >= form.minDruidLevel;

          return (
            <div
              key={form.id}
              className={`p-4 rounded-xl border transition flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'bg-emerald-950/30 border-emerald-500 shadow-md shadow-emerald-950/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-100 text-sm font-heading leading-tight flex items-center gap-1.5">
                      {form.name}
                      {isSelected && (
                        <span className="text-[9px] bg-emerald-500 text-slate-950 font-mono font-bold px-1.5 py-0.2 rounded-full uppercase">
                          Active
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {form.size} {form.creatureType} &bull; <span className={isEligible ? 'text-emerald-400' : 'text-amber-400'}>Min Lvl {form.minDruidLevel}</span>
                    </p>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono uppercase bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                    {form.category}
                  </span>
                </div>

                {/* Stat pills */}
                <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[11px]">
                  <div className="p-1 rounded bg-slate-900 border border-slate-800/80">
                    <span className="text-[9px] text-slate-500 block uppercase font-sans">Str</span>
                    <span className="font-bold text-emerald-300">{form.str}</span>
                  </div>
                  <div className="p-1 rounded bg-slate-900 border border-slate-800/80">
                    <span className="text-[9px] text-slate-500 block uppercase font-sans">Dex</span>
                    <span className="font-bold text-cyan-300">{form.dex}</span>
                  </div>
                  <div className="p-1 rounded bg-slate-900 border border-slate-800/80">
                    <span className="text-[9px] text-slate-500 block uppercase font-sans">Con</span>
                    <span className="font-bold text-amber-300">{form.con}</span>
                  </div>
                  <div className="p-1 rounded bg-slate-900 border border-slate-800/80">
                    <span className="text-[9px] text-slate-500 block uppercase font-sans">Nat AC</span>
                    <span className="font-bold text-orange-300">+{form.naturalArmor}</span>
                  </div>
                </div>

                {/* Speeds & Attacks */}
                <div className="text-[11px] font-mono space-y-1 text-slate-300">
                  <div className="flex items-center gap-1 text-slate-400">
                    <i className="fa-solid fa-person-running text-[10px] text-emerald-400"></i>
                    <span>
                      Speed: {form.speed.land} ft
                      {form.speed.fly ? `, Fly ${form.speed.fly} ft (${form.speed.flyManeuverability || 'avg'})` : ''}
                      {form.speed.swim ? `, Swim ${form.speed.swim} ft` : ''}
                      {form.speed.burrow ? `, Burrow ${form.speed.burrow} ft` : ''}
                      {form.speed.climb ? `, Climb ${form.speed.climb} ft` : ''}
                    </span>
                  </div>

                  <div className="text-slate-300">
                    <span className="text-slate-500 text-[10px] uppercase font-sans font-bold">Attacks: </span>
                    {(form.attacks || []).map(a => `${a.name} ${a.attackCount && a.attackCount > 1 ? `(${a.attackCount}x) ` : ''}${a.damage}`).join(', ') || 'None'}
                  </div>

                  {form.specialQualities && form.specialQualities.length > 0 && (
                    <div className="text-[10px] text-slate-400 line-clamp-1">
                      <span className="text-slate-500 font-sans font-bold uppercase">Traits: </span>
                      {form.specialQualities.join(', ')}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500 italic truncate" title={form.source}>
                  {form.source || 'Monster Manual'}
                </span>

                <button
                  type="button"
                  onClick={() => handleToggleWildShape(form.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                      : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold shadow'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <i className="fa-solid fa-arrow-rotate-left"></i> Revert
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paw"></i> Wild Shape
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Form Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 font-heading flex items-center gap-2">
                <i className="fa-solid fa-wand-magic-sparkles text-emerald-400"></i> Custom Wild Shape Form Builder
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="label-text">Form Name</label>
                <input
                  type="text"
                  value={customDraft.name}
                  onChange={e => setCustomDraft({ ...customDraft, name: e.target.value })}
                  placeholder="e.g. Dire Lion / Celestial Leopard"
                  className="input-field text-xs py-1.5 px-3 w-full"
                />
              </div>

              <div>
                <label className="label-text">Creature Category</label>
                <select
                  value={customDraft.category}
                  onChange={e => setCustomDraft({ ...customDraft, category: e.target.value })}
                  className="input-field text-xs py-1.5 px-3 w-full"
                >
                  <option value="animal">Animal</option>
                  <option value="dinosaur">Dinosaur</option>
                  <option value="plant">Plant</option>
                  <option value="elemental">Elemental</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="label-text">Size Category</label>
                <select
                  value={customDraft.size}
                  onChange={e => setCustomDraft({ ...customDraft, size: e.target.value })}
                  className="input-field text-xs py-1.5 px-3 w-full"
                >
                  <option value="Diminutive">Diminutive</option>
                  <option value="Tiny">Tiny</option>
                  <option value="Small">Small</option>
                  <option value="Medium">Medium</option>
                  <option value="Large">Large</option>
                  <option value="Huge">Huge</option>
                  <option value="Gargantuan">Gargantuan</option>
                </select>
              </div>

              <div>
                <label className="label-text">Min Druid Level</label>
                <input
                  type="number"
                  value={customDraft.minDruidLevel}
                  onChange={e => setCustomDraft({ ...customDraft, minDruidLevel: parseInt(e.target.value) || 5 })}
                  className="input-field text-xs py-1.5 px-3 w-full"
                />
              </div>
            </div>

            {/* Base Physical Stats */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <label className="label-text">Strength</label>
                <input
                  type="number"
                  value={customDraft.str}
                  onChange={e => setCustomDraft({ ...customDraft, str: parseInt(e.target.value) || 10 })}
                  className="input-field text-xs py-1.5 px-3 w-full"
                />
              </div>
              <div>
                <label className="label-text">Dexterity</label>
                <input
                  type="number"
                  value={customDraft.dex}
                  onChange={e => setCustomDraft({ ...customDraft, dex: parseInt(e.target.value) || 10 })}
                  className="input-field text-xs py-1.5 px-3 w-full"
                />
              </div>
              <div>
                <label className="label-text">Constitution</label>
                <input
                  type="number"
                  value={customDraft.con}
                  onChange={e => setCustomDraft({ ...customDraft, con: parseInt(e.target.value) || 10 })}
                  className="input-field text-xs py-1.5 px-3 w-full"
                />
              </div>
              <div>
                <label className="label-text">Nat Armor</label>
                <input
                  type="number"
                  value={customDraft.naturalArmor}
                  onChange={e => setCustomDraft({ ...customDraft, naturalArmor: parseInt(e.target.value) || 0 })}
                  className="input-field text-xs py-1.5 px-3 w-full"
                />
              </div>
            </div>

            {/* Speeds */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="label-text">Land Speed (ft)</label>
                <input
                  type="number"
                  value={customDraft.speedLand}
                  onChange={e => setCustomDraft({ ...customDraft, speedLand: parseInt(e.target.value) || 30 })}
                  className="input-field text-xs py-1.5 px-3 w-full"
                />
              </div>
              <div>
                <label className="label-text">Fly Speed (ft)</label>
                <input
                  type="number"
                  value={customDraft.speedFly || 0}
                  onChange={e => setCustomDraft({ ...customDraft, speedFly: parseInt(e.target.value) || undefined })}
                  className="input-field text-xs py-1.5 px-3 w-full"
                />
              </div>
              <div>
                <label className="label-text">Swim Speed (ft)</label>
                <input
                  type="number"
                  value={customDraft.speedSwim || 0}
                  onChange={e => setCustomDraft({ ...customDraft, speedSwim: parseInt(e.target.value) || undefined })}
                  className="input-field text-xs py-1.5 px-3 w-full"
                />
              </div>
            </div>

            {/* Attacks */}
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-slate-300 block">Primary Natural Attack</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Attack Name (e.g. Bite)"
                    value={customDraft.attack1Name}
                    onChange={e => setCustomDraft({ ...customDraft, attack1Name: e.target.value })}
                    className="input-field text-xs py-1 px-2.5"
                  />
                  <input
                    type="text"
                    placeholder="Damage (e.g. 1d8)"
                    value={customDraft.attack1Damage}
                    onChange={e => setCustomDraft({ ...customDraft, attack1Damage: e.target.value })}
                    className="input-field text-xs py-1 px-2.5"
                  />
                  <input
                    type="text"
                    placeholder="Special (e.g. Trip, Grab)"
                    value={customDraft.attack1Special || ''}
                    onChange={e => setCustomDraft({ ...customDraft, attack1Special: e.target.value })}
                    className="input-field text-xs py-1 px-2.5"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-slate-300 block">Secondary Natural Attack</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Attack Name (e.g. Claws)"
                    value={customDraft.attack2Name || ''}
                    onChange={e => setCustomDraft({ ...customDraft, attack2Name: e.target.value })}
                    className="input-field text-xs py-1 px-2.5"
                  />
                  <input
                    type="text"
                    placeholder="Damage (e.g. 1d6)"
                    value={customDraft.attack2Damage || ''}
                    onChange={e => setCustomDraft({ ...customDraft, attack2Damage: e.target.value })}
                    className="input-field text-xs py-1 px-2.5"
                  />
                  <input
                    type="text"
                    placeholder="Special (e.g. Rake)"
                    value={customDraft.attack2Special || ''}
                    onChange={e => setCustomDraft({ ...customDraft, attack2Special: e.target.value })}
                    className="input-field text-xs py-1 px-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="label-text">Special Qualities & Traits (semicolon-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Pounce; Scent; Low-Light Vision"
                  value={customDraft.specialQualities || ''}
                  onChange={e => setCustomDraft({ ...customDraft, specialQualities: e.target.value })}
                  className="input-field text-xs py-1.5 px-3 w-full"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="btn btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomForm}
                className="btn btn-primary text-xs"
              >
                Save & Transform
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
