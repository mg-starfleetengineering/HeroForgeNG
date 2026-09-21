import React, { useState } from 'react';
import {
  CharacterState,
  AnimalCompanionData,
  AnimalCompanionState,
  CustomAnimalCompanionData
} from '../types/character';
import {
  computeAnimalCompanionStats,
  getEffectiveDruidLevel,
  STANDARD_COMPANION_SKILLS,
  STANDARD_COMPANION_TRICKS
} from '../engine/animal_companion';
import { getAbilityMod } from '../engine/stats';
import { useGameData } from '../context/GameDataContext';
import { useCharacter, useCharacterDispatch } from '../context/CharacterContext';

interface AnimalCompanionTabProps {
  character?: CharacterState;
  companionsData?: AnimalCompanionData[];
  onChange?: (updatedCharacter: CharacterState) => void;
}

const DEFAULT_CUSTOM_COMPANION: CustomAnimalCompanionData = {
  name: 'Custom Companion',
  minLevel: 1,
  size: 'Medium',
  creatureType: 'Animal',
  hd: 2,
  str: 13,
  dex: 15,
  con: 15,
  int: 2,
  wis: 12,
  cha: 6,
  naturalArmor: 2,
  speedLand: 40,
  attack1Name: 'Bite',
  attack1Damage: '1d6',
  specialAbilities: 'Scent; Low-Light Vision',
  feats: 'Alertness',
  isQuadruped: true
};

export const AnimalCompanionTab: React.FC<AnimalCompanionTabProps> = (props) => {
  const contextCharacter = useCharacter();
  const { updateCharacter } = useCharacterDispatch();
  const gameData = useGameData();

  const character = props.character ?? contextCharacter;
  const companionsData = props.companionsData ?? gameData.animalCompanionsData;
  const onChange = props.onChange ?? updateCharacter;
  const companionState: AnimalCompanionState = character.animalCompanion || {
    hasCompanion: false,
    selectedCompanionId: 'wolf',
    customCompanion: DEFAULT_CUSTOM_COMPANION,
    assignedFeats: [],
    assignedSkillRanks: {},
    selectedTricks: ['Attack', 'Come', 'Defend'],
    hasNaturalBondFeat: false
  };

  const prepareCustomDraft = (raw?: CustomAnimalCompanionData): CustomAnimalCompanionData => {
    const base = raw || companionState.customCompanion || DEFAULT_CUSTOM_COMPANION;
    return {
      ...base,
      attack1Name: base.attack1Name || (base.attacks && base.attacks[0]?.name) || 'Bite',
      attack1Damage: base.attack1Damage || (base.attacks && base.attacks[0]?.damage) || '1d6',
      attack2Name: base.attack2Name || (base.attacks && base.attacks[1]?.name) || '',
      attack2Damage: base.attack2Damage || (base.attacks && base.attacks[1]?.damage) || '',
      speedLand: base.speedLand ?? base.speed?.land ?? 40,
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

  const [minLevelFilter, setMinLevelFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customDraft, setCustomDraft] = useState<CustomAnimalCompanionData>(
    prepareCustomDraft(companionState.customCompanion)
  );
  const [newFeatInput, setNewFeatInput] = useState('');

  const stats = computeAnimalCompanionStats(character, companionsData, companionState);
  const effectiveDruidLevel = getEffectiveDruidLevel(character, companionState.hasNaturalBondFeat);

  const updateCompanionState = (patch: Partial<AnimalCompanionState>) => {
    onChange({
      ...character,
      animalCompanion: {
        ...companionState,
        ...patch
      }
    });
  };

  const openCustomModal = () => {
    setCustomDraft(prepareCustomDraft(companionState.customCompanion));
    setShowCustomModal(true);
  };

  const saveCustomCompanion = () => {
    const speed = {
      land: customDraft.speedLand ?? 40,
      ...(customDraft.speedFly !== undefined ? { fly: customDraft.speedFly } : {}),
      ...(customDraft.speedFlyManeuverability ? { flyManeuverability: customDraft.speedFlyManeuverability } : {}),
      ...(customDraft.speedSwim !== undefined ? { swim: customDraft.speedSwim } : {}),
      ...(customDraft.speedClimb !== undefined ? { climb: customDraft.speedClimb } : {}),
      ...(customDraft.speedBurrow !== undefined ? { burrow: customDraft.speedBurrow } : {})
    };
    const attacks = [
      { name: customDraft.attack1Name || 'Bite', damage: customDraft.attack1Damage || '1d6' },
      ...(customDraft.attack2Name ? [{ name: customDraft.attack2Name, damage: customDraft.attack2Damage || '1d4' }] : [])
    ];
    const specialAbilities = typeof customDraft.specialAbilities === 'string'
      ? customDraft.specialAbilities.split(/[;,]/).map(s => s.trim()).filter(Boolean)
      : (customDraft.specialAbilities || []);
    const feats = typeof customDraft.feats === 'string'
      ? customDraft.feats.split(/[;,]/).map(s => s.trim()).filter(Boolean)
      : (customDraft.feats || []);

    const updatedCustom: CustomAnimalCompanionData = {
      ...customDraft,
      speed,
      attacks,
      specialAbilities,
      feats
    };

    updateCompanionState({
      selectedCompanionId: 'custom',
      customCompanion: updatedCustom
    });
    setShowCustomModal(false);
  };

  // Filter companions
  const filteredCompanions = companionsData.filter(c => {
    if (minLevelFilter !== 'all' && c.minLevel !== minLevelFilter) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.creatureType.toLowerCase().includes(q) ||
        c.size.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const levelTiers = [1, 4, 7, 10, 13, 16];

  // Companion skill helper
  const handleSkillRankChange = (skillName: string, delta: number) => {
    if (!stats) return;
    const currentRanks = companionState.assignedSkillRanks?.[skillName] || 0;
    const newRanks = Math.max(0, currentRanks + delta);

    // Calculate total spent skill points
    const currentSpent = Object.values(companionState.assignedSkillRanks || {}).reduce((a, b) => a + b, 0);
    const totalNewSpent = currentSpent - currentRanks + newRanks;

    if (delta > 0 && totalNewSpent > stats.maxSkillPoints) {
      return; // exceed max skill points
    }

    updateCompanionState({
      assignedSkillRanks: {
        ...companionState.assignedSkillRanks,
        [skillName]: newRanks
      }
    });
  };

  // Companion feat helper
  const handleAddFeat = () => {
    if (!stats || !newFeatInput.trim()) return;
    const currentFeats = companionState.assignedFeats || [];
    if (currentFeats.length >= stats.maxFeatsAllowed) return;

    updateCompanionState({
      assignedFeats: [...currentFeats, newFeatInput.trim()]
    });
    setNewFeatInput('');
  };

  const handleRemoveFeat = (index: number) => {
    const currentFeats = companionState.assignedFeats || [];
    updateCompanionState({
      assignedFeats: currentFeats.filter((_, i) => i !== index)
    });
  };

  // Trick toggle helper
  const handleToggleTrick = (trick: string) => {
    const currentTricks = companionState.selectedTricks || [];
    if (currentTricks.includes(trick)) {
      updateCompanionState({
        selectedTricks: currentTricks.filter(t => t !== trick)
      });
    } else {
      if (stats && currentTricks.length >= stats.maxTricksAllowed) return;
      updateCompanionState({
        selectedTricks: [...currentTricks, trick]
      });
    }
  };

  const totalSpentSkillPoints = Object.values(companionState.assignedSkillRanks || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Active Toggle */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 text-2xl">
                <i className="fa-solid fa-paw"></i>
              </span>
              <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
                Animal Companion
              </h2>
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Druid & Ranger Feature
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Manage your animal companion stats, hit dice bonuses, natural armor adjustments, carrying capacity, tricks, feats, and skill ranks based on Effective Druid Level.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-3 cursor-pointer bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition">
              <input
                type="checkbox"
                checked={companionState.hasCompanion}
                onChange={e => updateCompanionState({ hasCompanion: e.target.checked })}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
              <span className="font-semibold text-slate-200 text-sm">
                {companionState.hasCompanion ? 'Companion Active' : 'Enable Companion'}
              </span>
            </label>
          </div>
        </div>

        {/* Effective Level Breakdown Bar */}
        {companionState.hasCompanion && (
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span className="font-bold text-slate-400 uppercase tracking-wider">EDL Breakdown:</span>
              <span className="bg-slate-800 px-2.5 py-1 rounded-md text-emerald-400 font-mono font-bold">
                EDL {effectiveDruidLevel}
              </span>
              <span className="text-slate-500">|</span>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-800/60 px-2.5 py-1 rounded-md hover:bg-slate-800 transition">
                <input
                  type="checkbox"
                  checked={companionState.hasNaturalBondFeat || false}
                  onChange={e => updateCompanionState({ hasNaturalBondFeat: e.target.checked })}
                  className="w-3.5 h-3.5 accent-emerald-500 rounded"
                />
                <span className="text-slate-300">Natural Bond Feat (+3 EDL)</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={openCustomModal}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/50 transition flex items-center gap-1.5"
              >
                <i className="fa-solid fa-plus text-xs"></i> Create Custom Companion
              </button>
            </div>
          </div>
        )}
      </div>

      {!companionState.hasCompanion ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
            <i className="fa-solid fa-paw"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-200">No Active Animal Companion</h3>
          <p className="text-slate-400 text-sm">
            Check "Enable Companion" above to select a base companion species (Wolf, Badger, Bear, Tiger, Hawk...) or define a custom homebrew companion.
          </p>
          <button
            onClick={() => updateCompanionState({ hasCompanion: true })}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-emerald-600/20 inline-flex items-center gap-2"
          >
            <i className="fa-solid fa-check"></i> Enable Animal Companion
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Species Selector & Quick Settings (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Companion Species Selection Card */}
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-5 shadow-lg backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <i className="fa-solid fa-dog text-emerald-400"></i> Select Species
                </h3>
                <span className="text-xs text-slate-400">
                  {filteredCompanions.length} species
                </span>
              </div>

              {/* Tier Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs">
                <button
                  onClick={() => setMinLevelFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition whitespace-nowrap ${
                    minLevelFilter === 'all'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  All
                </button>
                {levelTiers.map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setMinLevelFilter(lvl)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition whitespace-nowrap ${
                      minLevelFilter === lvl
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    Lvl {lvl}+
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-xs text-slate-500"></i>
                <input
                  type="text"
                  placeholder="Search species..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Species Select Dropdown */}
              <div className="space-y-2">
                <select
                  value={companionState.selectedCompanionId}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'custom') {
                      updateCompanionState({ selectedCompanionId: 'custom' });
                      openCustomModal();
                    } else {
                      updateCompanionState({ selectedCompanionId: val });
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <optgroup label="Custom Companion">
                    <option value="custom">
                      ✨ Custom Companion ({companionState.customCompanion?.name || 'Custom'})
                    </option>
                  </optgroup>
                  <optgroup label="Standard & Tier Companions">
                    {filteredCompanions.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Lvl {c.minLevel}+, {c.size} {c.creatureType})
                      </option>
                    ))}
                  </optgroup>
                </select>

                {companionState.selectedCompanionId === 'custom' && (
                  <button
                    onClick={openCustomModal}
                    className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30 transition flex items-center justify-center gap-1.5"
                  >
                    <i className="fa-solid fa-sliders text-emerald-400"></i> Edit Custom Companion Stats
                  </button>
                )}
              </div>

              {/* Name Override & Custom HP */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Custom Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fang"
                    value={companionState.overrideName || ''}
                    onChange={e => updateCompanionState({ overrideName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    HP Override
                  </label>
                  <input
                    type="number"
                    placeholder={`Avg: ${stats?.hp || 0}`}
                    value={companionState.customHp || ''}
                    onChange={e =>
                      updateCompanionState({
                        customHp: e.target.value ? parseInt(e.target.value) : undefined
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Carrying Capacity Card */}
            {stats && (
              <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-5 shadow-lg backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <i className="fa-solid fa-weight-hanging text-amber-400"></i> Carrying Capacity
                  </h3>
                  <span className="text-xs font-medium text-slate-400">
                    {stats.isQuadruped ? 'Quadruped' : 'Biped'} ({stats.size})
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 font-medium">Light Load</span>
                    <span className="text-emerald-400 font-bold font-mono">
                      Up to {stats.carryingCapacity.lightLoad} lbs.
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 font-medium">Medium Load</span>
                    <span className="text-amber-400 font-bold font-mono">
                      {stats.carryingCapacity.mediumLoadMin}–{stats.carryingCapacity.mediumLoadMax} lbs.
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 font-medium">Heavy Load</span>
                    <span className="text-rose-400 font-bold font-mono">
                      {stats.carryingCapacity.heavyLoadMin}–{stats.carryingCapacity.heavyLoadMax} lbs.
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Lift Overhead</div>
                    <div className="text-slate-200 font-mono font-bold mt-0.5">
                      {stats.carryingCapacity.liftOverHead} lbs
                    </div>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Lift Off Ground</div>
                    <div className="text-slate-200 font-mono font-bold mt-0.5">
                      {stats.carryingCapacity.liftOffGround} lbs
                    </div>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Push / Drag</div>
                    <div className="text-slate-200 font-mono font-bold mt-0.5">
                      {stats.carryingCapacity.pushOrDrag} lbs
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Computed Stat Sheet & Management Tabs (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {stats && (
              <>
                {/* Primary Stats Grid Header */}
                <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-5 shadow-lg backdrop-blur-sm space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <h3 className="text-xl font-black text-slate-100 flex items-center gap-2">
                        {stats.name}
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {stats.size} {stats.creatureType}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Min Lvl: {stats.minLevelReq} | Effective Druid Level: {stats.effectiveDruidLevel}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* HP Card */}
                      <div className="bg-slate-950/90 border border-slate-800 px-4 py-2 rounded-xl text-center">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Hit Points</div>
                        <div className="text-xl font-extrabold text-emerald-400 font-mono">
                          {stats.hp}
                        </div>
                      </div>

                      {/* Total HD */}
                      <div className="bg-slate-950/90 border border-slate-800 px-4 py-2 rounded-xl text-center">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Total HD</div>
                        <div className="text-xl font-extrabold text-slate-200 font-mono">
                          {stats.totalHD} d8
                          {stats.bonusHD > 0 && (
                            <span className="text-xs text-emerald-400 font-normal ml-1">
                              (+{stats.bonusHD})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Defense & Speed Stats Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {/* AC */}
                    <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg">
                      <div className="text-slate-400 font-medium">Armor Class</div>
                      <div className="text-lg font-bold text-slate-100 font-mono mt-0.5">
                        {stats.totalAc}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Touch {stats.touchAc} | Flat {stats.flatFootedAc}
                      </div>
                      <div className="text-[10px] text-emerald-400/80 mt-0.5">
                        Nat Armor +{stats.totalNatArmor} ({stats.baseNatArmor}+{stats.bonusNatArmor})
                      </div>
                    </div>

                    {/* BAB & Grapple */}
                    <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg">
                      <div className="text-slate-400 font-medium">BAB / Grapple</div>
                      <div className="text-lg font-bold text-slate-100 font-mono mt-0.5">
                        +{stats.bab} / {stats.grapple >= 0 ? `+${stats.grapple}` : stats.grapple}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Melee +{stats.meleeAttackBonus} | Ranged +{stats.rangedAttackBonus}
                      </div>
                    </div>

                    {/* Saving Throws */}
                    <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg">
                      <div className="text-slate-400 font-medium">Saving Throws</div>
                      <div className="font-mono text-xs font-bold text-slate-200 mt-1 space-y-0.5">
                        <div>FORT: <span className="text-emerald-400">+{stats.fort}</span></div>
                        <div>REF: <span className="text-sky-400">+{stats.ref}</span></div>
                        <div>WILL: <span className="text-purple-400">+{stats.will}</span></div>
                      </div>
                    </div>

                    {/* Speed Badges */}
                    <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg">
                      <div className="text-slate-400 font-medium">Movement</div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-200 rounded text-[11px] font-mono">
                          Land {stats.speed.land} ft.
                        </span>
                        {stats.speed.fly && (
                          <span className="px-2 py-0.5 bg-sky-950 text-sky-300 rounded text-[11px] font-mono">
                            Fly {stats.speed.fly} ft. ({stats.speed.flyManeuverability || 'avg'})
                          </span>
                        )}
                        {stats.speed.swim && (
                          <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 rounded text-[11px] font-mono">
                            Swim {stats.speed.swim} ft.
                          </span>
                        )}
                        {stats.speed.climb && (
                          <span className="px-2 py-0.5 bg-amber-950 text-amber-300 rounded text-[11px] font-mono">
                            Climb {stats.speed.climb} ft.
                          </span>
                        )}
                        {stats.speed.burrow && (
                          <span className="px-2 py-0.5 bg-stone-900 text-stone-300 rounded text-[11px] font-mono">
                            Burrow {stats.speed.burrow} ft.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ability Scores Grid */}
                  <div className="grid grid-cols-6 gap-2 text-center pt-2">
                    {[
                      { label: 'STR', val: stats.str, mod: stats.strMod },
                      { label: 'DEX', val: stats.dex, mod: stats.dexMod },
                      { label: 'CON', val: stats.con, mod: stats.conMod },
                      { label: 'INT', val: stats.int, mod: stats.intMod },
                      { label: 'WIS', val: stats.wis, mod: stats.wisMod },
                      { label: 'CHA', val: stats.cha, mod: stats.chaMod }
                    ].map(st => (
                      <div key={st.label} className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">{st.label}</div>
                        <div className="text-base font-extrabold text-slate-100 font-mono mt-0.5">
                          {st.val}
                        </div>
                        <div className="text-xs font-semibold text-emerald-400 font-mono">
                          {st.mod >= 0 ? `+${st.mod}` : st.mod}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Natural Attacks & Combat */}
                <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-5 shadow-lg backdrop-blur-sm space-y-3">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <i className="fa-solid fa-hand-fist text-rose-400"></i> Natural Attacks
                  </h3>

                  {stats.attacks.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No specific natural attack defined.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {stats.attacks.map((atk, i) => (
                        <div
                          key={i}
                          className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg flex items-center justify-between"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-200">{atk.name}</div>
                            {atk.damage && (
                              <div className="text-xs text-slate-400 font-mono mt-0.5">
                                Damage: {atk.damage}
                              </div>
                            )}
                          </div>
                          <span className="px-3 py-1 bg-rose-500/20 text-rose-300 font-mono font-bold text-xs rounded-md border border-rose-500/30">
                            +{atk.attackBonus}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Special Abilities & Features */}
                <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-5 shadow-lg backdrop-blur-sm space-y-3">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <i className="fa-solid fa-wand-magic-sparkles text-purple-400"></i> Special Abilities
                  </h3>

                  {stats.specialAbilities.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No special abilities unlocked yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {stats.specialAbilities.map((sa, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 bg-purple-950/60 border border-purple-800/60 text-purple-200 rounded-lg text-xs font-medium flex items-center gap-1.5"
                        >
                          <i className="fa-solid fa-star text-[10px] text-purple-400"></i>
                          {sa}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Feats & Tricks Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Companion Feats Card */}
                  <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-5 shadow-lg backdrop-blur-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <i className="fa-solid fa-award text-amber-400"></i> Companion Feats
                      </h3>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {stats.assignedFeats.length} / {stats.maxFeatsAllowed} Feats
                      </span>
                    </div>

                    {/* Assigned Feats Pills */}
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                      {stats.assignedFeats.length === 0 ? (
                        <span className="text-xs text-slate-500 italic self-center">No companion feats assigned.</span>
                      ) : (
                        stats.assignedFeats.map((ft, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md text-xs font-semibold flex items-center gap-2"
                          >
                            {ft}
                            <button
                              onClick={() => handleRemoveFeat(idx)}
                              className="text-amber-400 hover:text-rose-400 text-xs"
                            >
                              &times;
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    {/* Add Feat Control */}
                    {stats.assignedFeats.length < stats.maxFeatsAllowed && (
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Add feat (e.g. Toughness, Armor Proficiency)"
                          value={newFeatInput}
                          onChange={e => setNewFeatInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddFeat()}
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                        <button
                          onClick={handleAddFeat}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-lg transition"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bonus Tricks Card */}
                  <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-5 shadow-lg backdrop-blur-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <i className="fa-solid fa-bone text-emerald-400"></i> Bonus Tricks
                      </h3>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {stats.selectedTricks.length} / {stats.maxTricksAllowed} Tricks
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {STANDARD_COMPANION_TRICKS.map(trick => {
                        const isSelected = stats.selectedTricks.includes(trick);
                        return (
                          <button
                            key={trick}
                            onClick={() => handleToggleTrick(trick)}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
                              isSelected
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                            }`}
                          >
                            {isSelected ? '✓ ' : ''}{trick}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Skill Rank Allocation Card */}
                <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-5 shadow-lg backdrop-blur-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <i className="fa-solid fa-[#10b981] fa-bullseye text-sky-400"></i> Companion Skill Allocation
                    </h3>
                    <span className="text-xs font-mono font-bold text-sky-400">
                      Spent {totalSpentSkillPoints} / {stats.maxSkillPoints} Skill Points
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                          <th className="py-2 px-3">Skill Name</th>
                          <th className="py-2 px-3 text-center">Ability</th>
                          <th className="py-2 px-3 text-center">Ranks</th>
                          <th className="py-2 px-3 text-center">Mod</th>
                          <th className="py-2 px-3 text-right">Total Mod</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {STANDARD_COMPANION_SKILLS.map(skillName => {
                          const ranks = companionState.assignedSkillRanks?.[skillName] || 0;
                          
                          // Determine key ability
                          let keyAbility = 'STR';
                          let abilMod = stats.strMod;
                          if (['Hide', 'Move Silently', 'Balance'].includes(skillName)) {
                            keyAbility = 'DEX';
                            abilMod = stats.dexMod;
                          } else if (['Listen', 'Spot', 'Survival'].includes(skillName)) {
                            keyAbility = 'WIS';
                            abilMod = stats.wisMod;
                          } else if (skillName === 'Concentration') {
                            keyAbility = 'CON';
                            abilMod = stats.conMod;
                          }

                          const totalMod = ranks + abilMod;

                          return (
                            <tr key={skillName} className="hover:bg-slate-950/40 transition">
                              <td className="py-2 px-3 font-semibold text-slate-200">
                                {skillName}
                              </td>
                              <td className="py-2 px-3 text-center font-mono text-slate-400">
                                {keyAbility} ({abilMod >= 0 ? `+${abilMod}` : abilMod})
                              </td>
                              <td className="py-2 px-3 text-center">
                                <div className="inline-flex items-center gap-2 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                                  <button
                                    onClick={() => handleSkillRankChange(skillName, -1)}
                                    disabled={ranks <= 0}
                                    className="text-slate-400 hover:text-rose-400 disabled:opacity-30 font-bold px-1"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono font-bold text-slate-200 w-4 text-center">
                                    {ranks}
                                  </span>
                                  <button
                                    onClick={() => handleSkillRankChange(skillName, 1)}
                                    disabled={totalSpentSkillPoints >= stats.maxSkillPoints}
                                    className="text-slate-400 hover:text-emerald-400 disabled:opacity-30 font-bold px-1"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="py-2 px-3 text-center font-mono text-slate-400">
                                {abilMod >= 0 ? `+${abilMod}` : abilMod}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-extrabold text-sky-400 text-sm">
                                {totalMod >= 0 ? `+${totalMod}` : totalMod}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Custom Companion Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <i className="fa-solid fa-wand-magic-sparkles text-emerald-400"></i> Create Custom Animal Companion
              </h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-slate-400 hover:text-slate-200 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Companion Name</label>
                <input
                  type="text"
                  value={customDraft.name}
                  onChange={e => setCustomDraft({ ...customDraft, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Min Level Requirement</label>
                <select
                  value={customDraft.minLevel}
                  onChange={e => setCustomDraft({ ...customDraft, minLevel: parseInt(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value={1}>Level 1 (+0)</option>
                  <option value={4}>Level 4 (-3)</option>
                  <option value={7}>Level 7 (-6)</option>
                  <option value={10}>Level 10 (-9)</option>
                  <option value={13}>Level 13 (-12)</option>
                  <option value={16}>Level 16 (-15)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Size</label>
                <select
                  value={customDraft.size}
                  onChange={e => setCustomDraft({ ...customDraft, size: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Base HD</label>
                <input
                  type="number"
                  value={customDraft.hd}
                  onChange={e => setCustomDraft({ ...customDraft, hd: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Base Natural Armor</label>
                <input
                  type="number"
                  value={customDraft.naturalArmor}
                  onChange={e => setCustomDraft({ ...customDraft, naturalArmor: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Land Speed (ft)</label>
                <input
                  type="number"
                  value={customDraft.speedLand}
                  onChange={e => setCustomDraft({ ...customDraft, speedLand: parseInt(e.target.value) || 30 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Base Ability Scores */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">Base Ability Scores</label>
              <div className="grid grid-cols-6 gap-2 text-center text-xs">
                {[
                  { key: 'str', label: 'STR' },
                  { key: 'dex', label: 'DEX' },
                  { key: 'con', label: 'CON' },
                  { key: 'int', label: 'INT' },
                  { key: 'wis', label: 'WIS' },
                  { key: 'cha', label: 'CHA' }
                ].map(st => (
                  <div key={st.key}>
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">{st.label}</span>
                    <input
                      type="number"
                      value={(customDraft as any)[st.key]}
                      onChange={e => setCustomDraft({ ...customDraft, [st.key]: parseInt(e.target.value) || 10 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg py-1.5 text-center text-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Natural Attack Inputs */}
            <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Attack 1 Name & Dmg</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Bite"
                    value={customDraft.attack1Name}
                    onChange={e => setCustomDraft({ ...customDraft, attack1Name: e.target.value })}
                    className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="1d6"
                    value={customDraft.attack1Damage}
                    onChange={e => setCustomDraft({ ...customDraft, attack1Damage: e.target.value })}
                    className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Attack 2 Name & Dmg (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Claw"
                    value={customDraft.attack2Name || ''}
                    onChange={e => setCustomDraft({ ...customDraft, attack2Name: e.target.value })}
                    className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="1d4"
                    value={customDraft.attack2Damage || ''}
                    onChange={e => setCustomDraft({ ...customDraft, attack2Damage: e.target.value })}
                    className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={saveCustomCompanion}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-emerald-600/20"
              >
                Save & Select Custom Companion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
