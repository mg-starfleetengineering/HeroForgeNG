import React, { useState } from 'react';
import { CharacterState, ActiveCombatBuff } from '../types/character';
import { STANDARD_SRD_BUFFS, resolveActiveBuffs } from '../engine/combat';

interface TacticalPanelProps {
  character: CharacterState;
  onChange: (updated: Partial<CharacterState>) => void;
  className?: string;
}

export const TacticalPanel: React.FC<TacticalPanelProps> = ({
  character,
  onChange,
  className = ''
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBuff, setNewBuff] = useState<Partial<ActiveCombatBuff>>({
    name: '',
    category: 'spell',
    bonusType: 'untyped',
    abilityBonuses: {},
    attackBonus: 0,
    damageBonus: 0,
    acBonus: { value: 0, type: 'dodge' },
    saveBonuses: { fort: 0, ref: 0, will: 0, all: 0 },
    speedBonus: 0,
    extraAttacks: 0,
    notes: ''
  });

  const tc = character.tacticalCombat || {
    powerAttack: 0,
    combatExpertise: 0,
    fightingDefensively: false,
    haste: false,
    rage: false,
    whirlingFrenzy: false,
    flurryOfBlows: false
  };

  // Resolve all buffs, bridging legacy tacticalCombat flags
  const activeBuffsList = resolveActiveBuffs(tc, character.activeBuffs || []);

  const isBuffActive = (id: string): boolean => {
    const found = activeBuffsList.find(b => b.id === id);
    return !!found?.active;
  };

  const handleToggleBuff = (buffId: string) => {
    let nextBuffs = [...activeBuffsList];
    const existingIdx = nextBuffs.findIndex(b => b.id === buffId);

    let willBeActive = false;
    if (existingIdx >= 0) {
      willBeActive = !nextBuffs[existingIdx].active;
      nextBuffs[existingIdx] = { ...nextBuffs[existingIdx], active: willBeActive };
    } else {
      const srdTemplate = STANDARD_SRD_BUFFS.find(b => b.id === buffId);
      if (srdTemplate) {
        willBeActive = true;
        nextBuffs.push({ ...srdTemplate, active: true });
      }
    }

    // Keep legacy tacticalCombat booleans synchronized
    const nextTc = { ...tc };
    if (buffId === 'haste') nextTc.haste = willBeActive;
    if (buffId === 'rage') nextTc.rage = willBeActive;
    if (buffId === 'whirling_frenzy') nextTc.whirlingFrenzy = willBeActive;

    onChange({
      activeBuffs: nextBuffs,
      tacticalCombat: nextTc
    });
  };

  const handleDeleteBuff = (buffId: string) => {
    const nextBuffs = activeBuffsList.filter(b => b.id !== buffId);
    const nextTc = { ...tc };
    if (buffId === 'haste') nextTc.haste = false;
    if (buffId === 'rage') nextTc.rage = false;
    if (buffId === 'whirling_frenzy') nextTc.whirlingFrenzy = false;

    onChange({
      activeBuffs: nextBuffs,
      tacticalCombat: nextTc
    });
  };

  const handleCreateCustomBuff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuff.name?.trim()) return;

    const customId = 'custom_' + Date.now();
    const createdBuff: ActiveCombatBuff = {
      id: customId,
      name: newBuff.name.trim(),
      category: newBuff.category || 'spell',
      active: true,
      bonusType: newBuff.bonusType || 'untyped',
      abilityBonuses: newBuff.abilityBonuses && Object.keys(newBuff.abilityBonuses).length > 0 ? newBuff.abilityBonuses : undefined,
      attackBonus: Number(newBuff.attackBonus) || undefined,
      damageBonus: Number(newBuff.damageBonus) || undefined,
      acBonus: newBuff.acBonus?.value ? { value: Number(newBuff.acBonus.value), type: newBuff.acBonus.type || 'dodge' } : undefined,
      saveBonuses: (newBuff.saveBonuses?.fort || newBuff.saveBonuses?.ref || newBuff.saveBonuses?.will || newBuff.saveBonuses?.all)
        ? {
            fort: Number(newBuff.saveBonuses.fort) || undefined,
            ref: Number(newBuff.saveBonuses.ref) || undefined,
            will: Number(newBuff.saveBonuses.will) || undefined,
            all: Number(newBuff.saveBonuses.all) || undefined
          }
        : undefined,
      speedBonus: Number(newBuff.speedBonus) || undefined,
      extraAttacks: Number(newBuff.extraAttacks) || undefined,
      notes: newBuff.notes?.trim() || undefined
    };

    const nextBuffs = [...activeBuffsList, createdBuff];
    onChange({ activeBuffs: nextBuffs });

    // Reset form
    setNewBuff({
      name: '',
      category: 'spell',
      bonusType: 'untyped',
      abilityBonuses: {},
      attackBonus: 0,
      damageBonus: 0,
      acBonus: { value: 0, type: 'dodge' },
      saveBonuses: { fort: 0, ref: 0, will: 0, all: 0 },
      speedBonus: 0,
      extraAttacks: 0,
      notes: ''
    });
    setShowAddModal(false);
  };

  const activeCount = activeBuffsList.filter(b => b.active).length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header and Add Custom Action */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <i className="fa-solid fa-wand-magic-sparkles text-xs"></i>
          </div>
          <div>
            <h4 className="text-xs font-bold font-heading text-slate-200 flex items-center gap-2">
              Active Combat Buffs & Stances
              {activeCount > 0 && (
                <span className="badge bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] font-mono px-1.5 py-0.2">
                  {activeCount} Active
                </span>
              )}
            </h4>
            <p className="text-[10px] text-slate-400">
              1-click toggles for standard spells & stances with automatic D&D 3.5e stacking.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="text-xs text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg px-2.5 py-1 flex items-center gap-1.5 transition font-semibold cursor-pointer"
        >
          <i className="fa-solid fa-plus text-[10px]"></i>
          <span>Add Custom Buff</span>
        </button>
      </div>

      {/* Standard SRD Presets Quick-Toggle Grid */}
      <div>
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
          Standard SRD Spells & Features
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs">
          {STANDARD_SRD_BUFFS.map(buff => {
            const active = isBuffActive(buff.id);
            const isSpell = buff.category === 'spell';
            const isStance = buff.category === 'stance';

            let activeCardClass = 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700';
            let activeBadgeClass = 'bg-slate-800 text-slate-400';
            let iconClass = 'text-slate-500';

            if (active) {
              if (isStance) {
                activeCardClass = 'bg-teal-950/50 border-teal-400/60 text-teal-200 shadow-md';
                activeBadgeClass = 'bg-teal-400 text-slate-950';
                iconClass = 'text-teal-400';
              } else if (buff.category === 'class_feature') {
                activeCardClass = 'bg-rose-950/50 border-rose-500/60 text-rose-200 shadow-md';
                activeBadgeClass = 'bg-rose-500 text-slate-950';
                iconClass = 'text-rose-400';
              } else {
                activeCardClass = 'bg-purple-950/50 border-purple-400/60 text-purple-200 shadow-md';
                activeBadgeClass = 'bg-purple-400 text-slate-950';
                iconClass = 'text-purple-400';
              }
            }

            return (
              <button
                key={buff.id}
                type="button"
                onClick={() => handleToggleBuff(buff.id)}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer group ${activeCardClass}`}
                title={buff.notes || buff.name}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold flex items-center gap-1.5 truncate text-[11px]">
                    <i
                      className={`${
                        buff.id === 'haste'
                          ? 'fa-solid fa-bolt-lightning'
                          : buff.id === 'rage'
                          ? 'fa-solid fa-fire-flame-curved'
                          : buff.id === 'whirling_frenzy'
                          ? 'fa-solid fa-tornado'
                          : isSpell
                          ? 'fa-solid fa-wand-magic-sparkles'
                          : 'fa-solid fa-shield-halved'
                      } ${iconClass}`}
                    ></i>
                    {buff.name}
                  </span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded shrink-0 ${activeBadgeClass}`}>
                    {active ? 'ON' : 'OFF'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  {buff.notes || `${buff.category}`}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Custom Buffs List (if any custom buffs exist) */}
      {activeBuffsList.some(b => !STANDARD_SRD_BUFFS.some(s => s.id === b.id)) && (
        <div className="pt-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
            Custom Buffs
          </span>
          <div className="space-y-2">
            {activeBuffsList
              .filter(b => !STANDARD_SRD_BUFFS.some(s => s.id === b.id))
              .map(buff => (
                <div
                  key={buff.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition ${
                    buff.active
                      ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleBuff(buff.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold transition cursor-pointer shrink-0 ${
                        buff.active
                          ? 'bg-purple-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                      title={buff.active ? 'Click to deactivate' : 'Click to activate'}
                    >
                      {buff.active ? <i className="fa-solid fa-check"></i> : <i className="fa-solid fa-power-off"></i>}
                    </button>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200 text-xs truncate">{buff.name}</span>
                        <span className="badge bg-slate-800 text-slate-400 text-[9px] uppercase font-mono px-1">
                          {buff.category}
                        </span>
                        {buff.bonusType && (
                          <span className="badge bg-purple-500/10 text-purple-300 border-purple-500/20 text-[9px] font-mono px-1">
                            {buff.bonusType}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {buff.notes || 'Custom combat modifier'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteBuff(buff.id)}
                    className="text-slate-500 hover:text-rose-400 transition p-1 text-xs cursor-pointer shrink-0"
                    title="Delete custom buff"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Modal: Add Custom Buff */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold font-heading text-slate-100 flex items-center gap-2">
                <i className="fa-solid fa-wand-magic-sparkles text-purple-400"></i>
                Create Custom Combat Buff or Stance
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleCreateCustomBuff} className="space-y-3.5 text-xs">
              {/* Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Buff / Stance Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBuff.name || ''}
                    onChange={e => setNewBuff({ ...newBuff, name: e.target.value })}
                    placeholder="e.g. Divine Power, Heroism, Dragon Stance"
                    className="input-field w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newBuff.category || 'spell'}
                    onChange={e => setNewBuff({ ...newBuff, category: e.target.value as any })}
                    className="input-field w-full text-xs"
                  >
                    <option value="spell">Spell</option>
                    <option value="stance">Stance</option>
                    <option value="class_feature">Class Feature</option>
                    <option value="item">Item / Wondrous</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Bonus Type */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Bonus Stacking Type
                </label>
                <select
                  value={newBuff.bonusType || 'untyped'}
                  onChange={e => setNewBuff({ ...newBuff, bonusType: e.target.value as any })}
                  className="input-field w-full text-xs"
                >
                  <option value="untyped">Untyped (Stacks with everything)</option>
                  <option value="morale">Morale (Highest applies)</option>
                  <option value="luck">Luck (Highest applies)</option>
                  <option value="insight">Insight (Highest applies)</option>
                  <option value="sacred">Sacred (Highest applies)</option>
                  <option value="profane">Profane (Highest applies)</option>
                  <option value="enhancement">Enhancement (Highest applies)</option>
                  <option value="size">Size (Highest applies)</option>
                  <option value="dodge">Dodge (Stacks with all dodge bonuses)</option>
                  <option value="deflection">Deflection (Highest applies)</option>
                </select>
              </div>

              {/* Ability Modifiers */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Ability Score Bonuses
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 font-mono">
                  {(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const).map(stat => (
                    <div key={stat}>
                      <span className="block text-[10px] text-slate-400 font-bold mb-0.5">{stat}</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={newBuff.abilityBonuses?.[stat] ?? ''}
                        onChange={e => {
                          const val = e.target.value === '' ? undefined : parseInt(e.target.value);
                          setNewBuff({
                            ...newBuff,
                            abilityBonuses: {
                              ...newBuff.abilityBonuses,
                              [stat]: val
                            }
                          });
                        }}
                        className="input-field w-full text-xs text-center font-mono py-1 px-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Attack & Damage Bonuses */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Attack Bonus
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newBuff.attackBonus ?? ''}
                    onChange={e => setNewBuff({ ...newBuff, attackBonus: parseInt(e.target.value) || 0 })}
                    className="input-field w-full text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Damage Bonus
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newBuff.damageBonus ?? ''}
                    onChange={e => setNewBuff({ ...newBuff, damageBonus: parseInt(e.target.value) || 0 })}
                    className="input-field w-full text-xs font-mono"
                  />
                </div>
              </div>

              {/* AC Bonus */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    AC Bonus Value
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newBuff.acBonus?.value ?? ''}
                    onChange={e =>
                      setNewBuff({
                        ...newBuff,
                        acBonus: {
                          value: parseInt(e.target.value) || 0,
                          type: newBuff.acBonus?.type || 'dodge'
                        }
                      })
                    }
                    className="input-field w-full text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    AC Bonus Type
                  </label>
                  <select
                    value={newBuff.acBonus?.type || 'dodge'}
                    onChange={e =>
                      setNewBuff({
                        ...newBuff,
                        acBonus: {
                          value: newBuff.acBonus?.value || 0,
                          type: e.target.value as any
                        }
                      })
                    }
                    className="input-field w-full text-xs"
                  >
                    <option value="dodge">Dodge (Stacks)</option>
                    <option value="deflection">Deflection (Highest)</option>
                    <option value="morale">Morale (Highest)</option>
                    <option value="insight">Insight (Highest)</option>
                    <option value="sacred">Sacred (Highest)</option>
                    <option value="untyped">Untyped / Penalty</option>
                  </select>
                </div>
              </div>

              {/* Save Bonuses */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Save Bonuses
                </label>
                <div className="grid grid-cols-4 gap-2 font-mono">
                  <div>
                    <span className="block text-[10px] text-slate-400 mb-0.5">All</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={newBuff.saveBonuses?.all ?? ''}
                      onChange={e =>
                        setNewBuff({
                          ...newBuff,
                          saveBonuses: { ...newBuff.saveBonuses, all: parseInt(e.target.value) || 0 }
                        })
                      }
                      className="input-field w-full text-xs text-center font-mono py-1 px-1"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 mb-0.5">Fort</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={newBuff.saveBonuses?.fort ?? ''}
                      onChange={e =>
                        setNewBuff({
                          ...newBuff,
                          saveBonuses: { ...newBuff.saveBonuses, fort: parseInt(e.target.value) || 0 }
                        })
                      }
                      className="input-field w-full text-xs text-center font-mono py-1 px-1"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 mb-0.5">Ref</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={newBuff.saveBonuses?.ref ?? ''}
                      onChange={e =>
                        setNewBuff({
                          ...newBuff,
                          saveBonuses: { ...newBuff.saveBonuses, ref: parseInt(e.target.value) || 0 }
                        })
                      }
                      className="input-field w-full text-xs text-center font-mono py-1 px-1"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 mb-0.5">Will</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={newBuff.saveBonuses?.will ?? ''}
                      onChange={e =>
                        setNewBuff({
                          ...newBuff,
                          saveBonuses: { ...newBuff.saveBonuses, will: parseInt(e.target.value) || 0 }
                        })
                      }
                      className="input-field w-full text-xs text-center font-mono py-1 px-1"
                    />
                  </div>
                </div>
              </div>

              {/* Speed & Extra Attacks */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Speed Bonus (ft)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newBuff.speedBonus ?? ''}
                    onChange={e => setNewBuff({ ...newBuff, speedBonus: parseInt(e.target.value) || 0 })}
                    className="input-field w-full text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Extra Attacks at Full BAB
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newBuff.extraAttacks ?? ''}
                    onChange={e => setNewBuff({ ...newBuff, extraAttacks: parseInt(e.target.value) || 0 })}
                    className="input-field w-full text-xs font-mono"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Description / Notes
                </label>
                <input
                  type="text"
                  value={newBuff.notes || ''}
                  onChange={e => setNewBuff({ ...newBuff, notes: e.target.value })}
                  placeholder="e.g. +2 luck bonus to attack and damage rolls"
                  className="input-field w-full text-xs"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 transition text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition text-xs shadow-lg cursor-pointer"
                >
                  Save & Activate Buff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default TacticalPanel;
