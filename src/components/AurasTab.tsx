import React, { useState } from 'react';
import { CharacterState, Aura } from '../types/character';
import { PRESET_AURAS, createAuraFromPreset, getActiveAuras, getMaxAuraRadius } from '../engine/auras';
import { useCharacter, useCharacterDispatch } from '../context/CharacterContext';

interface AurasTabProps {
  character?: CharacterState;
  onChange?: (updated: Partial<CharacterState>) => void;
}

export const AurasTab: React.FC<AurasTabProps> = (props) => {
  const contextCharacter = useCharacter();
  const { updateCharacter } = useCharacterDispatch();

  const character = props.character ?? contextCharacter;
  const onChange = props.onChange ?? updateCharacter;
  const auras = character.auras || [];
  const activeAuras = getActiveAuras(auras);
  const maxRadius = getMaxAuraRadius(auras);

  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number | ''>('');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [editingAura, setEditingAura] = useState<Aura | null>(null);

  // Custom Form state
  const [formData, setFormData] = useState<{
    name: string;
    type: Aura['type'];
    radius: number;
    target: Aura['target'];
    effect: string;
    saveDc: string;
    source: string;
    notes: string;
  }>({
    name: '',
    type: 'Class Feature',
    radius: 10,
    target: 'Allies',
    effect: '',
    saveDc: '',
    source: '',
    notes: ''
  });

  const handleToggleActive = (id: string) => {
    const updated = auras.map(a => a.id === id ? { ...a, active: !a.active } : a);
    onChange({ auras: updated });
  };

  const handleToggleAll = (activeState: boolean) => {
    const updated = auras.map(a => ({ ...a, active: activeState }));
    onChange({ auras: updated });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this aura?')) {
      onChange({ auras: auras.filter(a => a.id !== id) });
    }
  };

  const handleAddPreset = () => {
    if (selectedPresetIndex === '') return;
    const template = PRESET_AURAS[Number(selectedPresetIndex)];
    if (!template) return;

    const newAura = createAuraFromPreset(template);
    onChange({ auras: [...auras, newAura] });
    setSelectedPresetIndex('');
  };

  const handleOpenEdit = (aura: Aura) => {
    setEditingAura(aura);
    setFormData({
      name: aura.name,
      type: aura.type,
      radius: aura.radius,
      target: aura.target,
      effect: aura.effect,
      saveDc: aura.saveDc ? String(aura.saveDc) : '',
      source: aura.source || '',
      notes: aura.notes || ''
    });
    setShowCustomModal(true);
  };

  const handleOpenNewCustom = () => {
    setEditingAura(null);
    setFormData({
      name: '',
      type: 'Custom',
      radius: 10,
      target: 'Allies',
      effect: '',
      saveDc: '',
      source: '',
      notes: ''
    });
    setShowCustomModal(true);
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.effect.trim()) {
      alert('Please provide an Aura name and effect description.');
      return;
    }

    if (editingAura) {
      const updated = auras.map(a => a.id === editingAura.id ? {
        ...a,
        name: formData.name.trim(),
        type: formData.type,
        radius: Number(formData.radius) || 10,
        target: formData.target,
        effect: formData.effect.trim(),
        saveDc: formData.saveDc ? formData.saveDc.trim() : undefined,
        source: formData.source ? formData.source.trim() : undefined,
        notes: formData.notes ? formData.notes.trim() : undefined
      } : a);
      onChange({ auras: updated });
    } else {
      const newAura: Aura = {
        id: `aura_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: formData.name.trim(),
        type: formData.type,
        radius: Number(formData.radius) || 10,
        target: formData.target,
        effect: formData.effect.trim(),
        active: true,
        saveDc: formData.saveDc ? formData.saveDc.trim() : undefined,
        source: formData.source ? formData.source.trim() : undefined,
        notes: formData.notes ? formData.notes.trim() : undefined
      };
      onChange({ auras: [...auras, newAura] });
    }

    setShowCustomModal(false);
  };

  const getTargetBadgeStyle = (target: Aura['target']) => {
    switch (target) {
      case 'Allies':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Enemies':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'Self & Allies':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'All Creatures':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getTypeBadgeStyle = (type: Aura['type']) => {
    switch (type) {
      case 'Class Feature':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20';
      case 'Feat':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      case 'Spell/Power':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
      case 'Item/Equipment':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
      case 'Racial':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <section className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl shadow-lg shadow-amber-500/5">
              <i className="fa-solid fa-sun fa-spin-pulse"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading text-slate-100 flex items-center gap-2">
                Aura Tracker & Emanations
              </h2>
              <p className="text-xs text-slate-400">
                Manage, project, and visualize passive & active aura effects centered on {character.name || 'your hero'}.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleToggleAll(true)}
              className="btn btn-secondary text-xs"
              title="Activate all configured auras"
            >
              <i className="fa-solid fa-power-off text-emerald-400 mr-1"></i> Activate All
            </button>
            <button
              onClick={() => handleToggleAll(false)}
              className="btn btn-secondary text-xs"
              title="Deactivate all configured auras"
            >
              <i className="fa-solid fa-power-off text-slate-500 mr-1"></i> Deactivate All
            </button>
            <button
              onClick={handleOpenNewCustom}
              className="btn btn-primary text-xs"
            >
              <i className="fa-solid fa-plus mr-1"></i> Custom Aura
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Active Auras</span>
              <span className="text-2xl font-bold font-mono text-emerald-400">{activeAuras.length} <span className="text-xs text-slate-500 font-normal">/ {auras.length} configured</span></span>
            </div>
            <i className="fa-solid fa-bolt text-2xl text-emerald-500/30"></i>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Max Active Radius</span>
              <span className="text-2xl font-bold font-mono text-amber-400">{maxRadius} <span className="text-xs text-slate-500 font-normal">feet</span></span>
            </div>
            <i className="fa-solid fa-ruler-combined text-2xl text-amber-500/30"></i>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Aura Presets</span>
              <span className="text-2xl font-bold font-mono text-cyan-400">{PRESET_AURAS.length} <span className="text-xs text-slate-500 font-normal">in library</span></span>
            </div>
            <i className="fa-solid fa-book-bookmark text-2xl text-cyan-500/30"></i>
          </div>
        </div>
      </section>

      {/* Preset Library Quick Add & Range Radar Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preset Library Card (1 col) */}
        <section className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl space-y-4 flex flex-col">
          <h3 className="text-sm font-bold font-heading text-slate-200 flex items-center gap-2">
            <i className="fa-solid fa-wand-magic-sparkles text-amber-400"></i> Add Preset Aura
          </h3>
          <p className="text-xs text-slate-400">
            Select a standard 3.5e aura from the library to quickly add it to your character sheet.
          </p>

          <div className="space-y-3 flex-1">
            <div>
              <label className="label-text">Select Preset Template</label>
              <select
                value={selectedPresetIndex}
                onChange={e => setSelectedPresetIndex(e.target.value === '' ? '' : Number(e.target.value))}
                className="input-field text-xs"
              >
                <option value="">-- Choose an Aura Preset --</option>
                {PRESET_AURAS.map((preset, idx) => (
                  <option key={idx} value={idx}>
                    {preset.name} ({preset.radius} ft &bull; {preset.type})
                  </option>
                ))}
              </select>
            </div>

            {selectedPresetIndex !== '' && PRESET_AURAS[Number(selectedPresetIndex)] && (
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-amber-300">{PRESET_AURAS[Number(selectedPresetIndex)].name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded border bg-slate-900 border-slate-700 text-slate-300">
                    {PRESET_AURAS[Number(selectedPresetIndex)].radius} ft
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {PRESET_AURAS[Number(selectedPresetIndex)].effect}
                </p>
                <div className="text-[10px] text-slate-500 font-mono">
                  Source: {PRESET_AURAS[Number(selectedPresetIndex)].source}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleAddPreset}
            disabled={selectedPresetIndex === ''}
            className="btn btn-primary text-xs w-full disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
          >
            <i className="fa-solid fa-plus-circle mr-1"></i> Add Selected Preset
          </button>
        </section>

        {/* Visual Aura Range Radar Graphic (2 cols) */}
        <section className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold font-heading text-slate-200 flex items-center gap-2">
              <i className="fa-solid fa-radar text-cyan-400"></i> Visual Aura Range Radar
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Center: {character.name || 'Hero'}
            </span>
          </div>

          <div className="relative w-full h-64 sm:h-72 bg-slate-950 rounded-2xl border border-slate-800/80 flex items-center justify-center overflow-hidden p-4">
            {/* Grid Crosshairs */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
              <div className="w-full h-px bg-slate-500"></div>
              <div className="h-full w-px bg-slate-500"></div>
            </div>

            {/* Concentric Distance Rings (10 ft, 20 ft, 30 ft, 60 ft) */}
            <div className="absolute w-[35%] h-[35%] rounded-full border border-slate-800 flex items-start justify-center pt-1 pointer-events-none">
              <span className="text-[9px] font-mono text-slate-600 bg-slate-950 px-1 rounded">10 ft</span>
            </div>
            <div className="absolute w-[55%] h-[55%] rounded-full border border-slate-800/80 flex items-start justify-center pt-1 pointer-events-none">
              <span className="text-[9px] font-mono text-slate-600 bg-slate-950 px-1 rounded">20 ft</span>
            </div>
            <div className="absolute w-[75%] h-[75%] rounded-full border border-slate-800/60 flex items-start justify-center pt-1 pointer-events-none">
              <span className="text-[9px] font-mono text-slate-600 bg-slate-950 px-1 rounded">30 ft</span>
            </div>
            <div className="absolute w-[95%] h-[95%] rounded-full border border-slate-800/40 flex items-start justify-center pt-1 pointer-events-none">
              <span className="text-[9px] font-mono text-slate-600 bg-slate-950 px-1 rounded">60 ft</span>
            </div>

            {/* Render Active Aura Rings */}
            {activeAuras.length === 0 ? (
              <div className="text-center space-y-1 z-10">
                <i className="fa-solid fa-moon text-slate-700 text-3xl"></i>
                <p className="text-xs text-slate-500 font-mono">No active auras projected.</p>
              </div>
            ) : (
              activeAuras.map((aura) => {
                // Scale radius into percentage (10ft = 35%, 20ft = 55%, 30ft = 75%, 60ft+ = 95%)
                let sizePct = 35;
                if (aura.radius >= 60) sizePct = 95;
                else if (aura.radius >= 30) sizePct = 75;
                else if (aura.radius >= 20) sizePct = 55;
                else sizePct = 35;

                let ringColorClass = 'border-amber-500/50 bg-amber-500/5 shadow-amber-500/20';
                if (aura.target === 'Enemies') ringColorClass = 'border-rose-500/50 bg-rose-500/5 shadow-rose-500/20';
                else if (aura.target === 'Allies') ringColorClass = 'border-emerald-500/50 bg-emerald-500/5 shadow-emerald-500/20';
                else if (aura.target === 'All Creatures') ringColorClass = 'border-purple-500/50 bg-purple-500/5 shadow-purple-500/20';

                return (
                  <div
                    key={aura.id}
                    style={{ width: `${sizePct}%`, height: `${sizePct}%` }}
                    className={`absolute rounded-full border-2 ${ringColorClass} transition-all duration-500 animate-pulse flex items-center justify-center shadow-lg`}
                    title={`${aura.name} (${aura.radius} ft)`}
                  >
                    <span className="text-[10px] font-bold font-mono bg-slate-950/90 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 truncate max-w-[80%] shadow">
                      {aura.name}
                    </span>
                  </div>
                );
              })
            )}

            {/* Character Center Token */}
            <div className="z-20 w-12 h-12 rounded-full border-2 border-amber-400 bg-slate-900 flex items-center justify-center shadow-xl shadow-amber-500/20">
              {character.portraitUrl ? (
                <img src={character.portraitUrl} alt="Hero" className="w-full h-full rounded-full object-cover" />
              ) : (
                <i className="fa-solid fa-user-shield text-amber-400 text-lg"></i>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Configured Auras List */}
      <section className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold font-heading text-slate-200 flex items-center gap-2">
            <i className="fa-solid fa-layer-group text-amber-400"></i> Configured Auras ({auras.length})
          </h3>
          <button onClick={handleOpenNewCustom} className="btn btn-secondary text-xs">
            <i className="fa-solid fa-plus mr-1"></i> Add Custom
          </button>
        </div>

        {auras.length === 0 ? (
          <div className="text-center py-10 space-y-3 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            <i className="fa-solid fa-sun text-4xl text-slate-700"></i>
            <p className="text-sm text-slate-400">No auras currently configured on this character.</p>
            <p className="text-xs text-slate-500">Choose a preset from above or create a custom aura.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {auras.map((aura) => (
              <div
                key={aura.id}
                className={`p-4 rounded-xl border transition duration-200 space-y-3 relative ${
                  aura.active
                    ? 'bg-slate-900/90 border-amber-500/40 shadow-lg shadow-amber-950/20'
                    : 'bg-slate-950/40 border-slate-800 opacity-70'
                }`}
              >
                {/* Header & Toggle */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-amber-300 text-sm">{aura.name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTargetBadgeStyle(aura.target)}`}>
                        {aura.target}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getTypeBadgeStyle(aura.type)}`}>
                        {aura.type}
                      </span>
                    </div>
                    {aura.source && (
                      <p className="text-[11px] text-slate-400 font-mono">Source: {aura.source}</p>
                    )}
                  </div>

                  {/* Active Toggle Switch */}
                  <button
                    onClick={() => handleToggleActive(aura.id)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      aura.active ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                    title={aura.active ? 'Click to deactivate aura' : 'Click to activate aura'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        aura.active ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Effect Details */}
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 font-sans">
                  {aura.effect}
                </p>

                {/* Footer Metrics & Actions */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                    <span><i className="fa-solid fa-ruler-combined text-amber-400/80 mr-1"></i>{aura.radius} ft</span>
                    {aura.saveDc && <span><i className="fa-solid fa-shield-halved text-cyan-400/80 mr-1"></i>DC {aura.saveDc}</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(aura)}
                      className="text-slate-400 hover:text-amber-400 text-xs px-2 py-1 rounded bg-slate-950 border border-slate-800 hover:border-amber-500/30 transition"
                      title="Edit Aura"
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(aura.id)}
                      className="text-slate-400 hover:text-rose-400 text-xs px-2 py-1 rounded bg-slate-950 border border-slate-800 hover:border-rose-500/30 transition"
                      title="Delete Aura"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Custom/Edit Aura Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold font-heading text-amber-300 flex items-center gap-2">
                <i className="fa-solid fa-sun"></i> {editingAura ? 'Edit Aura' : 'Create Custom Aura'}
              </h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveCustom} className="space-y-4 text-xs">
              <div>
                <label className="label-text">Aura Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="input-field font-semibold text-amber-300"
                  placeholder="e.g. Aura of Courage, Beacon of Hope"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Aura Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as Aura['type'] })}
                    className="input-field"
                  >
                    <option value="Class Feature">Class Feature</option>
                    <option value="Feat">Feat</option>
                    <option value="Spell/Power">Spell/Power</option>
                    <option value="Item/Equipment">Item/Equipment</option>
                    <option value="Racial">Racial</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="label-text">Radius (Feet)</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={formData.radius}
                    onChange={e => setFormData({ ...formData, radius: Number(e.target.value) || 10 })}
                    className="input-field font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Target Scope</label>
                  <select
                    value={formData.target}
                    onChange={e => setFormData({ ...formData, target: e.target.value as Aura['target'] })}
                    className="input-field"
                  >
                    <option value="Allies">Allies</option>
                    <option value="Enemies">Enemies</option>
                    <option value="Self & Allies">Self & Allies</option>
                    <option value="All Creatures">All Creatures</option>
                  </select>
                </div>

                <div>
                  <label className="label-text">Save DC (Optional)</label>
                  <input
                    type="text"
                    value={formData.saveDc}
                    onChange={e => setFormData({ ...formData, saveDc: e.target.value })}
                    className="input-field font-mono"
                    placeholder="e.g. 15, Will DC 18"
                  />
                </div>
              </div>

              <div>
                <label className="label-text">Source / Class (Optional)</label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={e => setFormData({ ...formData, source: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Paladin 2nd, Ring of Auras"
                />
              </div>

              <div>
                <label className="label-text">Effect Description *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.effect}
                  onChange={e => setFormData({ ...formData, effect: e.target.value })}
                  className="input-field font-sans"
                  placeholder="Describe bonuses, penalties, damage, or saving throw modifications provided by this aura..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs"
                >
                  <i className="fa-solid fa-floppy-disk mr-1"></i> {editingAura ? 'Save Changes' : 'Create Aura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
