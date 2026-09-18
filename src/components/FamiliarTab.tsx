import React, { useState } from 'react';
import { CharacterState, ClassData, FamiliarData, FamiliarState, CustomFamiliarData } from '../types/character';
import { computeFamiliarStats } from '../engine/familiars';

interface FamiliarTabProps {
  character: CharacterState;
  classesData: ClassData[];
  familiarsData: FamiliarData[];
  onChange: (updated: Partial<CharacterState>) => void;
}

const DEFAULT_CUSTOM_FAMILIAR: CustomFamiliarData = {
  name: 'Custom Familiar',
  size: 'Tiny',
  creatureType: 'Magical Beast',
  str: 3,
  dex: 15,
  con: 10,
  int: 2,
  wis: 12,
  cha: 6,
  naturalArmor: 0,
  dr: 'None',
  sr: 0,
  speedLand: 20,
  speedFly: 40,
  speedFlyManeuverability: 'good',
  baseFort: 2,
  baseRef: 2,
  baseWill: 0,
  baseBab: 0,
  masterBonus: '+3 bonus on Concentration checks',
  specialAbilities: 'Low-light vision; Darkvision 60 ft.',
  feats: 'Weapon Finesse',
  attack1Name: 'Bite',
  attack1Damage: '1d3-4',
  notes: ''
};

export const FamiliarTab: React.FC<FamiliarTabProps> = ({
  character,
  classesData,
  familiarsData,
  onChange
}) => {
  const familiarState: FamiliarState = character.familiar || {
    hasFamiliar: false,
    selectedFamiliarId: 'bat',
    customFamiliar: DEFAULT_CUSTOM_FAMILIAR,
    overrideName: '',
    notes: ''
  };

  const prepareCustomDraft = (raw?: CustomFamiliarData): CustomFamiliarData => {
    const base = raw || familiarState.customFamiliar || DEFAULT_CUSTOM_FAMILIAR;
    return {
      ...base,
      attack1Name: base.attack1Name || (base.attacks && base.attacks[0]?.name) || 'Bite',
      attack1Damage: base.attack1Damage || (base.attacks && base.attacks[0]?.damage) || '1d3-4',
      attack2Name: base.attack2Name || (base.attacks && base.attacks[1]?.name) || '',
      attack2Damage: base.attack2Damage || (base.attacks && base.attacks[1]?.damage) || '',
      speedLand: base.speedLand ?? base.speed?.land ?? 20,
      speedFly: base.speedFly ?? base.speed?.fly,
      speedFlyManeuverability: base.speedFlyManeuverability || base.speed?.flyManeuverability,
      speedSwim: base.speedSwim ?? base.speed?.swim,
      speedClimb: base.speedClimb ?? base.speed?.climb,
      speedBurrow: base.speedBurrow ?? base.speed?.burrow,
      specialAbilities: Array.isArray(base.specialAbilities)
        ? base.specialAbilities.join('; ')
        : (base.specialAbilities || ''),
      feats: Array.isArray(base.feats)
        ? base.feats.join('; ')
        : (base.feats || '')
    };
  };

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customDraft, setCustomDraft] = useState<CustomFamiliarData>(
    prepareCustomDraft(familiarState.customFamiliar)
  );

  const stats = computeFamiliarStats(character, classesData, familiarsData, familiarState);

  const updateFamiliarState = (patch: Partial<FamiliarState>) => {
    onChange({
      familiar: {
        ...familiarState,
        ...patch
      }
    });
  };

  const openCustomModal = () => {
    setCustomDraft(prepareCustomDraft(familiarState.customFamiliar));
    setShowCustomModal(true);
  };

  const saveCustomFamiliar = () => {
    const speed = {
      land: customDraft.speedLand ?? 20,
      ...(customDraft.speedFly !== undefined ? { fly: customDraft.speedFly } : {}),
      ...(customDraft.speedFlyManeuverability ? { flyManeuverability: customDraft.speedFlyManeuverability } : {}),
      ...(customDraft.speedSwim !== undefined ? { swim: customDraft.speedSwim } : {}),
      ...(customDraft.speedClimb !== undefined ? { climb: customDraft.speedClimb } : {}),
      ...(customDraft.speedBurrow !== undefined ? { burrow: customDraft.speedBurrow } : {})
    };
    const attacks = [
      { name: customDraft.attack1Name || 'Bite', damage: customDraft.attack1Damage || '1d3-4' },
      ...(customDraft.attack2Name ? [{ name: customDraft.attack2Name, damage: customDraft.attack2Damage || '1d2' }] : [])
    ];
    const specialAbilities = typeof customDraft.specialAbilities === 'string'
      ? customDraft.specialAbilities.split(/[;,]/).map(s => s.trim()).filter(Boolean)
      : (customDraft.specialAbilities || []);
    const feats = typeof customDraft.feats === 'string'
      ? customDraft.feats.split(/[;,]/).map(s => s.trim()).filter(Boolean)
      : (customDraft.feats || []);

    const updatedCustom: CustomFamiliarData = {
      ...customDraft,
      speed,
      attacks,
      specialAbilities,
      feats
    };

    updateFamiliarState({
      selectedFamiliarId: 'custom',
      customFamiliar: updatedCustom
    });
    setShowCustomModal(false);
  };

  const standardFamiliars = familiarsData.filter(f => f.type === 'standard');
  const improvedFamiliars = familiarsData.filter(f => f.type === 'improved');

  // List of standard skills to show in Familiar Skills table
  const SKILL_LIST = [
    { name: 'Appraise', key: 'Appraise', stat: 'int' },
    { name: 'Balance', key: 'Balance', stat: 'dex' },
    { name: 'Bluff', key: 'Bluff', stat: 'cha' },
    { name: 'Climb', key: 'Climb', stat: 'str' },
    { name: 'Concentration', key: 'Concentration', stat: 'con' },
    { name: 'Diplomacy', key: 'Diplomacy', stat: 'cha' },
    { name: 'Escape Artist', key: 'Escape Artist', stat: 'dex' },
    { name: 'Hide', key: 'Hide', stat: 'dex' },
    { name: 'Intimidate', key: 'Intimidate', stat: 'cha' },
    { name: 'Jump', key: 'Jump', stat: 'str' },
    { name: 'Listen', key: 'Listen', stat: 'wis' },
    { name: 'Move Silently', key: 'Move Silently', stat: 'dex' },
    { name: 'Search', key: 'Search', stat: 'int' },
    { name: 'Sense Motive', key: 'Sense Motive', stat: 'wis' },
    { name: 'Spellcraft', key: 'Spellcraft', stat: 'int' },
    { name: 'Spot', key: 'Spot', stat: 'wis' },
    { name: 'Survival', key: 'Survival', stat: 'wis' },
    { name: 'Swim', key: 'Swim', stat: 'str' },
    { name: 'Tumble', key: 'Tumble', stat: 'dex' },
    { name: 'Use Magic Device', key: 'Use Magic Device', stat: 'cha' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Toggle Card */}
      <div className="card bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold text-2xl shadow-lg shadow-amber-900/30">
            <i className="fa-solid fa-paw"></i>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-3">
              Arcane Familiar & Companion
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                D&D 3.5e Engine
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Familiars scale hit points, natural armor, Intelligence, and saving throws with Master Level.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer bg-slate-950/60 hover:bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl transition">
            <input
              type="checkbox"
              checked={familiarState.hasFamiliar}
              onChange={e => updateFamiliarState({ hasFamiliar: e.target.checked })}
              className="checkbox-amber"
            />
            <span className="text-sm font-semibold text-amber-300">
              {familiarState.hasFamiliar ? 'Familiar Active' : 'Enable Familiar'}
            </span>
          </label>
        </div>
      </div>

      {!familiarState.hasFamiliar ? (
        <div className="card bg-slate-900/40 border border-dashed border-slate-800 p-12 text-center rounded-2xl space-y-4">
          <i className="fa-solid fa-cat text-5xl text-slate-600"></i>
          <h3 className="text-lg font-bold text-slate-300">No Familiar Currently Selected</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Check "Enable Familiar" above to select a standard familiar (Bat, Cat, Toad, Raven...), an improved familiar (Imp, Pseudodragon, Celestial Hawk...), or build a custom familiar.
          </p>
          <button
            onClick={() => updateFamiliarState({ hasFamiliar: true })}
            className="btn btn-primary text-xs px-5 py-2.5"
          >
            <i className="fa-solid fa-plus"></i> Select Familiar
          </button>
        </div>
      ) : (
        <>
          {/* Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Familiar Selection */}
            <div className="card bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2">
              <label className="label-text">Select Familiar</label>
              <select
                value={familiarState.selectedFamiliarId}
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'custom') {
                    updateFamiliarState({ selectedFamiliarId: 'custom' });
                    openCustomModal();
                  } else {
                    updateFamiliarState({ selectedFamiliarId: val });
                  }
                }}
                className="input-field font-semibold text-amber-300"
              >
                <optgroup label="Standard Familiars (Level 1+)">
                  {standardFamiliars.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.masterBonus})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Improved Familiars (Feat Required)">
                  {improvedFamiliars.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} (Req Lvl {f.prereqLevel}+, {f.alignmentReq})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Custom Options">
                  <option value="custom">✨ Custom Familiar (User Input Stats)</option>
                </optgroup>
              </select>
            </div>

            {/* Familiar Nickname / Custom Name */}
            <div className="card bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2">
              <label className="label-text">Familiar Name / Nickname</label>
              <input
                type="text"
                value={familiarState.overrideName || ''}
                onChange={e => updateFamiliarState({ overrideName: e.target.value })}
                className="input-field text-amber-200"
                placeholder="e.g. Shadow, Barnaby, Ignis"
              />
            </div>

            {/* Custom HP Override & Actions */}
            <div className="card bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-3">
              <div>
                <label className="label-text block">Custom HP Override</label>
                <input
                  type="number"
                  value={familiarState.customHp || ''}
                  onChange={e => updateFamiliarState({ customHp: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="input-field w-28 text-center font-mono font-bold text-emerald-400"
                  placeholder="Auto (50%)"
                />
              </div>

              {familiarState.selectedFamiliarId === 'custom' && (
                <button
                  onClick={openCustomModal}
                  className="btn btn-secondary text-xs px-3 py-2 flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-sliders text-amber-400"></i> Edit Custom Stats
                </button>
              )}
            </div>
          </div>

          {/* Granted Bonus Banner */}
          {stats && (
            <div className="card bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                  <i className="fa-solid fa-gift"></i>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-amber-400 font-bold block">
                    Granted Master Bonus
                  </span>
                  <span className="text-sm font-semibold text-slate-100">{stats.masterBonus}</span>
                </div>
              </div>
              <div className="text-right font-mono text-xs text-slate-400">
                Master Caster Level: <span className="text-amber-400 font-bold text-sm">{stats.masterLevel}</span>
              </div>
            </div>
          )}

          {/* Primary Stats Grid */}
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Card 1: Vital Stats & AC */}
              <div className="card bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4">
                <h3 className="text-base font-bold text-amber-400 border-b border-slate-800 pb-2 flex items-center justify-between">
                  <span><i className="fa-solid fa-shield-heart mr-2"></i> Defense & Health</span>
                  <span className="text-xs text-slate-400 font-mono">{stats.size} {stats.creatureType}</span>
                </h3>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Hit Points</span>
                    <span className="text-2xl font-bold font-mono text-emerald-400">{stats.hp}</span>
                    <span className="text-[10px] text-slate-500 block">50% Master Max HP</span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Armor Class</span>
                    <span className="text-2xl font-bold font-mono text-cyan-400">{stats.totalAc}</span>
                    <span className="text-[10px] text-slate-500 block">Touch {stats.touchAc} | FF {stats.flatFootedAc}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Natural Armor:</span>
                    <span className="text-slate-200">+{stats.totalNatArmor} (Base +{stats.baseNatArmor}, Master +{stats.scaledNatArmor})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Size AC Mod:</span>
                    <span className="text-slate-200">+{stats.sizeMod}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Damage Reduction:</span>
                    <span className="text-amber-300 font-bold">{stats.dr}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Spell Resistance:</span>
                    <span className="text-purple-300 font-bold">{stats.sr > 0 ? stats.sr : 'None'}</span>
                  </div>
                </div>

                {/* Saving Throws */}
                <div className="pt-2 border-t border-slate-800">
                  <h4 className="text-xs uppercase font-bold text-slate-400 mb-2">Saving Throws (Fort / Ref / Will)</h4>
                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">FORT</span>
                      <span className="text-sm font-bold text-purple-300">{stats.fort >= 0 ? '+' : ''}{stats.fort}</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">REF</span>
                      <span className="text-sm font-bold text-purple-300">{stats.ref >= 0 ? '+' : ''}{stats.ref}</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">WILL</span>
                      <span className="text-sm font-bold text-purple-300">{stats.will >= 0 ? '+' : ''}{stats.will}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Ability Scores & Movement */}
              <div className="card bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4">
                <h3 className="text-base font-bold text-amber-400 border-b border-slate-800 pb-2">
                  <i className="fa-solid fa-chart-column mr-2"></i> Ability Scores & Movement
                </h3>

                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">STR</span>
                    <span className="text-base font-bold text-slate-100">{stats.str}</span>
                    <span className="text-[10px] text-amber-400 block">({stats.strMod >= 0 ? '+' : ''}{stats.strMod})</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">DEX</span>
                    <span className="text-base font-bold text-slate-100">{stats.dex}</span>
                    <span className="text-[10px] text-amber-400 block">({stats.dexMod >= 0 ? '+' : ''}{stats.dexMod})</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">CON</span>
                    <span className="text-base font-bold text-slate-100">{stats.con}</span>
                    <span className="text-[10px] text-amber-400 block">({stats.conMod >= 0 ? '+' : ''}{stats.conMod})</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-amber-500/40 relative">
                    <span className="text-[10px] text-amber-400 font-bold block">INT ★</span>
                    <span className="text-base font-bold text-amber-300">{stats.int}</span>
                    <span className="text-[10px] text-amber-400 block">({stats.intMod >= 0 ? '+' : ''}{stats.intMod})</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">WIS</span>
                    <span className="text-base font-bold text-slate-100">{stats.wis}</span>
                    <span className="text-[10px] text-amber-400 block">({stats.wisMod >= 0 ? '+' : ''}{stats.wisMod})</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">CHA</span>
                    <span className="text-base font-bold text-slate-100">{stats.cha}</span>
                    <span className="text-[10px] text-amber-400 block">({stats.chaMod >= 0 ? '+' : ''}{stats.chaMod})</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                  ★ Intelligence scales automatically with Master Level (Min INT {stats.int} at Level {stats.masterLevel}).
                </div>

                {/* Speed Rates */}
                <div className="space-y-2 text-xs">
                  <h4 className="text-xs uppercase font-bold text-slate-400">Movement Rates</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge bg-slate-950 border border-slate-800 px-3 py-1 text-slate-200 font-mono">
                      Land: {stats.speed.land} ft.
                    </span>
                    {stats.speed.fly && (
                      <span className="badge bg-slate-950 border border-slate-800 px-3 py-1 text-cyan-300 font-mono">
                        Fly: {stats.speed.fly} ft. ({stats.speed.flyManeuverability || 'average'})
                      </span>
                    )}
                    {stats.speed.climb && (
                      <span className="badge bg-slate-950 border border-slate-800 px-3 py-1 text-amber-300 font-mono">
                        Climb: {stats.speed.climb} ft.
                      </span>
                    )}
                    {stats.speed.swim && (
                      <span className="badge bg-slate-950 border border-slate-800 px-3 py-1 text-blue-300 font-mono">
                        Swim: {stats.speed.swim} ft.
                      </span>
                    )}
                    {stats.speed.burrow && (
                      <span className="badge bg-slate-950 border border-slate-800 px-3 py-1 text-yellow-500 font-mono">
                        Burrow: {stats.speed.burrow} ft.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 3: Attacks & Combat Reference */}
              <div className="card bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4">
                <h3 className="text-base font-bold text-amber-400 border-b border-slate-800 pb-2">
                  <i className="fa-solid fa-crosshairs mr-2"></i> Attacks & Feats
                </h3>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Master BAB:</span>
                    <span className="text-amber-300 font-bold">+{stats.bab}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Melee Attack Bonus:</span>
                    <span className="text-emerald-400 font-bold">+{stats.meleeAttackBonus}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Ranged Attack Bonus:</span>
                    <span className="text-cyan-400 font-bold">+{stats.rangedAttackBonus}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-bold text-slate-400">Familiar Attacks</h4>
                  <div className="space-y-1.5">
                    {stats.attacks.map((atk, i) => (
                      <div key={i} className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{atk.name}</span>
                        <div className="font-mono text-right">
                          <span className="text-amber-400 font-bold mr-2">+{atk.attackBonus}</span>
                          <span className="text-slate-300">({atk.damage})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {stats.feats.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-xs uppercase font-bold text-slate-400">Feats</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {stats.feats.map((feat, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-[11px] text-slate-300 rounded-md">
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Familiar Unlocked Abilities Timeline */}
          {stats && (
            <div className="card bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-base font-bold text-amber-400 border-b border-slate-800 pb-3 flex items-center justify-between">
                <span><i className="fa-solid fa-wand-magic-sparkles mr-2"></i> Special Familiar Abilities (Unlocked by Master Level)</span>
                <span className="text-xs text-slate-400 font-mono">Master Level: {stats.masterLevel}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {stats.unlockedAbilities.map((ab, i) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-xl border transition ${
                      ab.unlocked
                        ? 'bg-slate-950/80 border-amber-500/30 text-slate-200'
                        : 'bg-slate-950/30 border-slate-800/40 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <i className={`fa-solid ${ab.unlocked ? 'fa-circle-check text-emerald-400' : 'fa-lock text-slate-600'}`}></i>
                        {ab.name}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        ab.unlocked ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-500'
                      }`}>
                        Level {ab.minLevel}+
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400">{ab.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Familiar Skills Table */}
          {stats && (
            <div className="card bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-amber-400">
                    <i className="fa-solid fa-brain mr-2"></i> Familiar Skill Modifiers
                  </h3>
                  <p className="text-xs text-slate-400">
                    Familiars use their own skill ranks or master's skill ranks (whichever is higher) plus familiar ability modifiers & racial bonuses.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
                      <th className="py-2.5 px-3">Skill Name</th>
                      <th className="py-2.5 px-3 text-center">Ability</th>
                      <th className="py-2.5 px-3 text-center">Master Ranks</th>
                      <th className="py-2.5 px-3 text-center">Fam Ability Mod</th>
                      <th className="py-2.5 px-3 text-center">Fam Racial Bonus</th>
                      <th className="py-2.5 px-3 text-right">Total Mod</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {SKILL_LIST.map((sk) => {
                      const masterRanks = character.skillRanks[sk.key] || 0;
                      const abilityMod =
                        sk.stat === 'str' ? stats.strMod :
                        sk.stat === 'dex' ? stats.dexMod :
                        sk.stat === 'con' ? stats.conMod :
                        sk.stat === 'int' ? stats.intMod :
                        sk.stat === 'wis' ? stats.wisMod : stats.chaMod;

                      const racialBonus = stats.skillBonus[sk.key] || 0;
                      const totalMod = masterRanks + abilityMod + racialBonus;

                      return (
                        <tr key={sk.key} className="hover:bg-slate-800/30 transition">
                          <td className="py-2 px-3 font-semibold text-slate-200">{sk.name}</td>
                          <td className="py-2 px-3 text-center uppercase font-mono text-slate-400">{sk.stat}</td>
                          <td className="py-2 px-3 text-center font-mono text-amber-300">{masterRanks}</td>
                          <td className="py-2 px-3 text-center font-mono text-slate-300">{abilityMod >= 0 ? `+${abilityMod}` : abilityMod}</td>
                          <td className="py-2 px-3 text-center font-mono text-purple-300">{racialBonus > 0 ? `+${racialBonus}` : '-'}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400 text-sm">{totalMod >= 0 ? `+${totalMod}` : totalMod}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes Section */}
          <div className="card bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
            <label className="label-text">Familiar Notes & Personality</label>
            <textarea
              rows={3}
              value={familiarState.notes || ''}
              onChange={e => updateFamiliarState({ notes: e.target.value })}
              className="input-field text-xs text-slate-300"
              placeholder="Record familiar history, personality traits, tricks, or specific spell interaction notes..."
            ></textarea>
          </div>
        </>
      )}

      {/* Custom Familiar Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="card bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <i className="fa-solid fa-sliders"></i> Create Custom Familiar
              </h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="label-text">Familiar Name</label>
                <input
                  type="text"
                  value={customDraft.name}
                  onChange={e => setCustomDraft({ ...customDraft, name: e.target.value })}
                  className="input-field font-semibold"
                />
              </div>
              <div>
                <label className="label-text">Size</label>
                <select
                  value={customDraft.size}
                  onChange={e => setCustomDraft({ ...customDraft, size: e.target.value })}
                  className="input-field"
                >
                  <option value="Fine">Fine (+8 AC/Att)</option>
                  <option value="Diminutive">Diminutive (+4 AC/Att)</option>
                  <option value="Tiny">Tiny (+2 AC/Att)</option>
                  <option value="Small">Small (+1 AC/Att)</option>
                  <option value="Medium">Medium (+0 AC/Att)</option>
                  <option value="Large">Large (-1 AC/Att)</option>
                </select>
              </div>
              <div>
                <label className="label-text">Creature Type</label>
                <input
                  type="text"
                  value={customDraft.creatureType}
                  onChange={e => setCustomDraft({ ...customDraft, creatureType: e.target.value })}
                  className="input-field"
                  placeholder="Magical Beast, Animal, etc."
                />
              </div>

              {/* Base Stats */}
              <div>
                <label className="label-text">Base STR</label>
                <input
                  type="number"
                  value={customDraft.str}
                  onChange={e => setCustomDraft({ ...customDraft, str: parseInt(e.target.value) || 1 })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-text">Base DEX</label>
                <input
                  type="number"
                  value={customDraft.dex}
                  onChange={e => setCustomDraft({ ...customDraft, dex: parseInt(e.target.value) || 10 })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-text">Base CON</label>
                <input
                  type="number"
                  value={customDraft.con}
                  onChange={e => setCustomDraft({ ...customDraft, con: parseInt(e.target.value) || 10 })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-text">Base INT (Before Scaling)</label>
                <input
                  type="number"
                  value={customDraft.int}
                  onChange={e => setCustomDraft({ ...customDraft, int: parseInt(e.target.value) || 2 })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-text">Base WIS</label>
                <input
                  type="number"
                  value={customDraft.wis}
                  onChange={e => setCustomDraft({ ...customDraft, wis: parseInt(e.target.value) || 10 })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-text">Base CHA</label>
                <input
                  type="number"
                  value={customDraft.cha}
                  onChange={e => setCustomDraft({ ...customDraft, cha: parseInt(e.target.value) || 6 })}
                  className="input-field"
                />
              </div>

              {/* Defense & Speeds */}
              <div>
                <label className="label-text">Base Natural Armor</label>
                <input
                  type="number"
                  value={customDraft.naturalArmor}
                  onChange={e => setCustomDraft({ ...customDraft, naturalArmor: parseInt(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-text">Damage Reduction (DR)</label>
                <input
                  type="text"
                  value={customDraft.dr}
                  onChange={e => setCustomDraft({ ...customDraft, dr: e.target.value })}
                  className="input-field"
                  placeholder="e.g. 5/magic or None"
                />
              </div>
              <div>
                <label className="label-text">Land Speed (ft)</label>
                <input
                  type="number"
                  value={customDraft.speedLand}
                  onChange={e => setCustomDraft({ ...customDraft, speedLand: parseInt(e.target.value) || 20 })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-text">Fly Speed (ft)</label>
                <input
                  type="number"
                  value={customDraft.speedFly || ''}
                  onChange={e => setCustomDraft({ ...customDraft, speedFly: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="input-field"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="label-text">Climb / Swim Speed (ft)</label>
                <input
                  type="number"
                  value={customDraft.speedClimb || customDraft.speedSwim || ''}
                  onChange={e => setCustomDraft({ ...customDraft, speedClimb: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="input-field"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="label-text">Granted Bonus to Master</label>
                <input
                  type="text"
                  value={customDraft.masterBonus}
                  onChange={e => setCustomDraft({ ...customDraft, masterBonus: e.target.value })}
                  className="input-field"
                  placeholder="e.g. +3 on Listen checks"
                />
              </div>

              {/* Attacks */}
              <div>
                <label className="label-text">Primary Attack Name</label>
                <input
                  type="text"
                  value={customDraft.attack1Name}
                  onChange={e => setCustomDraft({ ...customDraft, attack1Name: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Bite"
                />
              </div>
              <div>
                <label className="label-text">Primary Attack Damage</label>
                <input
                  type="text"
                  value={customDraft.attack1Damage}
                  onChange={e => setCustomDraft({ ...customDraft, attack1Damage: e.target.value })}
                  className="input-field"
                  placeholder="e.g. 1d4-2"
                />
              </div>
              <div>
                <label className="label-text">Feats (semicolon separated)</label>
                <input
                  type="text"
                  value={customDraft.feats}
                  onChange={e => setCustomDraft({ ...customDraft, feats: e.target.value })}
                  className="input-field"
                  placeholder="Weapon Finesse; Alertness"
                />
              </div>
            </div>

            <div>
              <label className="label-text">Special Qualities & Abilities (semicolon separated)</label>
              <textarea
                rows={2}
                value={customDraft.specialAbilities}
                onChange={e => setCustomDraft({ ...customDraft, specialAbilities: e.target.value })}
                className="input-field text-xs"
                placeholder="Low-light vision; Darkvision 60 ft; Scent"
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowCustomModal(false)}
                className="btn btn-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={saveCustomFamiliar}
                className="btn btn-primary text-xs px-5 py-2"
              >
                <i className="fa-solid fa-check mr-1"></i> Save Custom Familiar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
