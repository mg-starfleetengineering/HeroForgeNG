import React, { useState } from 'react';
import { CharacterState, CharacterNotes, QuestEntry, NpcEntry, SessionLog } from '../types/character';
import { PortraitModal } from './PortraitModal';

interface NotesTabProps {
  character: CharacterState;
  onChange: (updated: Partial<CharacterState>) => void;
}

export const NotesTab: React.FC<NotesTabProps> = ({ character, onChange }) => {
  const [activeSubTab, setActiveSubTab] = useState<'backstory' | 'quests' | 'npcs' | 'journal' | 'scratchpad'>('backstory');
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [questFilter, setQuestFilter] = useState<'all' | 'active' | 'completed' | 'failed'>('all');
  const [npcFilter, setNpcFilter] = useState<'all' | 'friendly' | 'neutral' | 'hostile' | 'unknown'>('all');

  // Modal States
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [showNpcModal, setShowNpcModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showPortraitModal, setShowPortraitModal] = useState(false);

  // Edit / Form States
  const [editingQuestId, setEditingQuestId] = useState<string | null>(null);
  const [questTitle, setQuestTitle] = useState('');
  const [questStatus, setQuestStatus] = useState<'active' | 'completed' | 'failed'>('active');
  const [questLocation, setQuestLocation] = useState('');
  const [questObjectives, setQuestObjectives] = useState('');
  const [questRewards, setQuestRewards] = useState('');
  const [questNotes, setQuestNotes] = useState('');

  const [editingNpcId, setEditingNpcId] = useState<string | null>(null);
  const [npcName, setNpcName] = useState('');
  const [npcAttitude, setNpcAttitude] = useState<'friendly' | 'neutral' | 'hostile' | 'unknown'>('friendly');
  const [npcFaction, setNpcFaction] = useState('');
  const [npcLocation, setNpcLocation] = useState('');
  const [npcNotes, setNpcNotes] = useState('');

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionNum, setSessionNum] = useState<number>(1);
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionSummary, setSessionSummary] = useState('');
  const [sessionLootXP, setSessionLootXP] = useState('');

  // Extract Notes object from character state
  const notes: CharacterNotes = character.notes || {
    backstory: '',
    appearance: '',
    personality: '',
    alliesAndOrganizations: '',
    scratchpad: '',
    quests: [],
    npcs: [],
    sessions: []
  };

  const handleNotesChange = (field: keyof CharacterNotes, value: any) => {
    onChange({
      notes: {
        ...notes,
        [field]: value
      }
    });
  };

  // --- Quest Actions ---
  const handleOpenAddQuest = () => {
    setEditingQuestId(null);
    setQuestTitle('');
    setQuestStatus('active');
    setQuestLocation('');
    setQuestObjectives('');
    setQuestRewards('');
    setQuestNotes('');
    setShowQuestModal(true);
  };

  const handleOpenEditQuest = (q: QuestEntry) => {
    setEditingQuestId(q.id);
    setQuestTitle(q.title);
    setQuestStatus(q.status);
    setQuestLocation(q.location || '');
    setQuestObjectives(q.objectives || '');
    setQuestRewards(q.rewards || '');
    setQuestNotes(q.notes || '');
    setShowQuestModal(true);
  };

  const handleSaveQuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questTitle.trim()) return;

    const currentQuests = notes.quests || [];
    if (editingQuestId) {
      const updated = currentQuests.map(q => q.id === editingQuestId ? {
        ...q,
        title: questTitle.trim(),
        status: questStatus,
        location: questLocation.trim(),
        objectives: questObjectives.trim(),
        rewards: questRewards.trim(),
        notes: questNotes.trim()
      } : q);
      handleNotesChange('quests', updated);
    } else {
      const newQuest: QuestEntry = {
        id: `quest_${Date.now()}`,
        title: questTitle.trim(),
        status: questStatus,
        location: questLocation.trim(),
        objectives: questObjectives.trim(),
        rewards: questRewards.trim(),
        notes: questNotes.trim()
      };
      handleNotesChange('quests', [...currentQuests, newQuest]);
    }

    setShowQuestModal(false);
  };

  const handleToggleQuestStatus = (id: string, currentStatus: QuestEntry['status']) => {
    const nextStatus: QuestEntry['status'] =
      currentStatus === 'active' ? 'completed' :
      currentStatus === 'completed' ? 'failed' : 'active';

    const updated = (notes.quests || []).map(q => q.id === id ? { ...q, status: nextStatus } : q);
    handleNotesChange('quests', updated);
  };

  const handleDeleteQuest = (id: string) => {
    const updated = (notes.quests || []).filter(q => q.id !== id);
    handleNotesChange('quests', updated);
  };

  // --- NPC Actions ---
  const handleOpenAddNpc = () => {
    setEditingNpcId(null);
    setNpcName('');
    setNpcAttitude('friendly');
    setNpcFaction('');
    setNpcLocation('');
    setNpcNotes('');
    setShowNpcModal(true);
  };

  const handleOpenEditNpc = (npc: NpcEntry) => {
    setEditingNpcId(npc.id);
    setNpcName(npc.name);
    setNpcAttitude(npc.attitude);
    setNpcFaction(npc.faction || '');
    setNpcLocation(npc.location || '');
    setNpcNotes(npc.notes || '');
    setShowNpcModal(true);
  };

  const handleSaveNpc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!npcName.trim()) return;

    const currentNpcs = notes.npcs || [];
    if (editingNpcId) {
      const updated = currentNpcs.map(n => n.id === editingNpcId ? {
        ...n,
        name: npcName.trim(),
        attitude: npcAttitude,
        faction: npcFaction.trim(),
        location: npcLocation.trim(),
        notes: npcNotes.trim()
      } : n);
      handleNotesChange('npcs', updated);
    } else {
      const newNpc: NpcEntry = {
        id: `npc_${Date.now()}`,
        name: npcName.trim(),
        attitude: npcAttitude,
        faction: npcFaction.trim(),
        location: npcLocation.trim(),
        notes: npcNotes.trim()
      };
      handleNotesChange('npcs', [...currentNpcs, newNpc]);
    }

    setShowNpcModal(false);
  };

  const handleDeleteNpc = (id: string) => {
    const updated = (notes.npcs || []).filter(n => n.id !== id);
    handleNotesChange('npcs', updated);
  };

  // --- Session Log Actions ---
  const handleOpenAddSession = () => {
    const currentSessions = notes.sessions || [];
    setEditingSessionId(null);
    setSessionNum(currentSessions.length + 1);
    setSessionDate(new Date().toISOString().slice(0, 10));
    setSessionTitle('');
    setSessionSummary('');
    setSessionLootXP('');
    setShowSessionModal(true);
  };

  const handleOpenEditSession = (s: SessionLog) => {
    setEditingSessionId(s.id);
    setSessionNum(s.sessionNumber);
    setSessionDate(s.date);
    setSessionTitle(s.title);
    setSessionSummary(s.summary);
    setSessionLootXP(s.lootOrXP || '');
    setShowSessionModal(true);
  };

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTitle.trim()) return;

    const currentSessions = notes.sessions || [];
    if (editingSessionId) {
      const updated = currentSessions.map(s => s.id === editingSessionId ? {
        ...s,
        sessionNumber: sessionNum,
        date: sessionDate,
        title: sessionTitle.trim(),
        summary: sessionSummary.trim(),
        lootOrXP: sessionLootXP.trim()
      } : s);
      handleNotesChange('sessions', updated);
    } else {
      const newSession: SessionLog = {
        id: `session_${Date.now()}`,
        sessionNumber: sessionNum,
        date: sessionDate,
        title: sessionTitle.trim(),
        summary: sessionSummary.trim(),
        lootOrXP: sessionLootXP.trim()
      };
      handleNotesChange('sessions', [...currentSessions, newSession]);
    }

    setShowSessionModal(false);
  };

  const handleDeleteSession = (id: string) => {
    const updated = (notes.sessions || []).filter(s => s.id !== id);
    handleNotesChange('sessions', updated);
  };

  // Filtered lists
  const filteredQuests = (notes.quests || []).filter(q => {
    const matchesStatus = questFilter === 'all' || q.status === questFilter;
    const matchesSearch = !searchQuery.trim() ||
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.location && q.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.objectives && q.objectives.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const filteredNpcs = (notes.npcs || []).filter(n => {
    const matchesAttitude = npcFilter === 'all' || n.attitude === npcFilter;
    const matchesSearch = !searchQuery.trim() ||
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.faction && n.faction.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (n.location && n.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (n.notes && n.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesAttitude && matchesSearch;
  });

  const filteredSessions = (notes.sessions || []).filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) ||
      s.summary.toLowerCase().includes(q) ||
      (s.lootOrXP && s.lootOrXP.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Tab Bar */}
      <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <i className="fa-solid fa-book-bookmark text-amber-500"></i> Notes & Campaign Journal
          </h2>
          <p className="text-xs text-slate-400">Track character backstory, active quests, NPC directory, session journal, and live scratchpad notes.</p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab('backstory')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'backstory' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-user"></i> Profile & Backstory
          </button>
          <button
            onClick={() => setActiveSubTab('quests')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'quests' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-scroll"></i> Quest Log ({(notes.quests || []).length})
          </button>
          <button
            onClick={() => setActiveSubTab('npcs')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'npcs' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-users"></i> NPC Directory ({(notes.npcs || []).length})
          </button>
          <button
            onClick={() => setActiveSubTab('journal')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'journal' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-book"></i> Sessions ({(notes.sessions || []).length})
          </button>
          <button
            onClick={() => setActiveSubTab('scratchpad')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'scratchpad' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-pen-to-square"></i> Scratchpad
          </button>
        </div>
      </div>

      {/* --- SUB-TAB 1: Profile & Backstory --- */}
      {activeSubTab === 'backstory' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Backstory */}
          <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-3">
            <h3 className="text-base font-bold font-heading text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
              <i className="fa-solid fa-feather-pointed text-amber-500"></i> Character Backstory & Origin
            </h3>
            <textarea
              rows={12}
              value={notes.backstory || ''}
              onChange={e => handleNotesChange('backstory', e.target.value)}
              placeholder="Write your character's backstory, homeland, family ties, past adventures, or major motivations here..."
              className="input-field w-full text-xs font-mono leading-relaxed bg-slate-950/80 p-3 rounded-xl resize-y"
            />
          </div>

          {/* Details & Allies Column */}
          <div className="space-y-6">
            {/* Character Portrait Card */}
            <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-base font-bold font-heading text-slate-100 flex items-center gap-2">
                  <i className="fa-solid fa-image text-amber-500"></i> Character Portrait
                </h3>
                <button
                  onClick={() => setShowPortraitModal(true)}
                  className="btn btn-secondary text-xs"
                >
                  <i className="fa-solid fa-camera font-normal"></i> Change Portrait
                </button>
              </div>

              <div className="flex items-center gap-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div
                  onClick={() => setShowPortraitModal(true)}
                  className="w-20 h-20 rounded-xl border-2 border-amber-500/40 bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 shadow-lg cursor-pointer hover:border-amber-400 group transition"
                >
                  {character.portraitUrl ? (
                    <img src={character.portraitUrl} alt={character.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  ) : (
                    <i className="fa-solid fa-user-shield text-4xl text-slate-600 group-hover:text-amber-400 transition"></i>
                  )}
                </div>
                <div className="flex-1 text-xs space-y-1">
                  <p className="font-bold text-slate-200">{character.name || 'Unnamed Hero'}</p>
                  <p className="text-slate-400 text-[11px]">
                    {character.portraitUrl ? 'Custom portrait active. Click image to upload a new file, paste a link, or select a preset.' : 'No portrait uploaded yet. Click to upload custom artwork or pick a fantasy preset.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Personality & Description */}
            <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-base font-bold font-heading text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
                <i className="fa-solid fa-masks-theater text-amber-400"></i> Appearance & Personality
              </h3>
              <div>
                <label className="label-text">Physical Appearance & Mannerisms</label>
                <textarea
                  rows={4}
                  value={notes.appearance || ''}
                  onChange={e => handleNotesChange('appearance', e.target.value)}
                  placeholder="Height, weight, eye color, hair, scars, attire, posture..."
                  className="input-field w-full text-xs font-mono bg-slate-950/80 p-2.5 rounded-xl"
                />
              </div>
              <div>
                <label className="label-text">Personality Traits, Ideals & Flaws</label>
                <textarea
                  rows={4}
                  value={notes.personality || ''}
                  onChange={e => handleNotesChange('personality', e.target.value)}
                  placeholder="Core values, quirks, phobias, speech patterns, alignment drivers..."
                  className="input-field w-full text-xs font-mono bg-slate-950/80 p-2.5 rounded-xl"
                />
              </div>
            </div>

            {/* Allies & Factions */}
            <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-3">
              <h3 className="text-base font-bold font-heading text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
                <i className="fa-solid fa-shield-halved text-cyan-400"></i> Allies & Guild Affiliations
              </h3>
              <textarea
                rows={4}
                value={notes.alliesAndOrganizations || ''}
                onChange={e => handleNotesChange('alliesAndOrganizations', e.target.value)}
                placeholder="Guild memberships, holy orders, mentor relationships, noble houses..."
                className="input-field w-full text-xs font-mono bg-slate-950/80 p-2.5 rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 2: Quest Log --- */}
      {activeSubTab === 'quests' && (
        <div className="space-y-4">
          {/* Action & Filter Bar */}
          <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-500 text-xs"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search quests by title, location, or objectives..."
                  className="input-field pl-9 text-xs w-full"
                />
              </div>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                <button
                  onClick={() => setQuestFilter('all')}
                  className={`px-2.5 py-1 rounded-lg ${questFilter === 'all' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setQuestFilter('active')}
                  className={`px-2.5 py-1 rounded-lg ${questFilter === 'active' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400'}`}
                >
                  Active
                </button>
                <button
                  onClick={() => setQuestFilter('completed')}
                  className={`px-2.5 py-1 rounded-lg ${questFilter === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400'}`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setQuestFilter('failed')}
                  className={`px-2.5 py-1 rounded-lg ${questFilter === 'failed' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400'}`}
                >
                  Failed
                </button>
              </div>
            </div>
            <button
              onClick={handleOpenAddQuest}
              className="btn btn-primary text-xs flex items-center gap-1.5"
            >
              <i className="fa-solid fa-plus"></i> Add New Quest
            </button>
          </div>

          {/* Quest Cards Grid */}
          {filteredQuests.length === 0 ? (
            <div className="card bg-slate-900/60 p-12 text-center rounded-2xl border border-slate-800 space-y-2">
              <i className="fa-solid fa-scroll text-3xl text-slate-600"></i>
              <p className="text-slate-400 text-sm font-semibold">No quests found matching current filter.</p>
              <p className="text-slate-500 text-xs">Click 'Add New Quest' to record campaign objectives.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredQuests.map(q => (
                <div key={q.id} className="card bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-bold text-slate-100 text-sm font-heading">{q.title}</h4>
                      <button
                        onClick={() => handleToggleQuestStatus(q.id, q.status)}
                        className={`badge text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-md border cursor-pointer ${
                          q.status === 'active' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/30' :
                          q.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30' :
                          'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30'
                        }`}
                        title="Click to toggle quest status"
                      >
                        <i className={`fa-solid ${q.status === 'active' ? 'fa-hourglass-half' : q.status === 'completed' ? 'fa-check' : 'fa-xmark'} mr-1`}></i>
                        {q.status}
                      </button>
                    </div>

                    {q.location && (
                      <p className="text-xs text-amber-400 flex items-center gap-1.5 font-mono">
                        <i className="fa-solid fa-location-dot"></i> {q.location}
                      </p>
                    )}

                    {q.objectives && (
                      <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-xs">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Objectives:</span>
                        <p className="text-slate-300 font-mono whitespace-pre-wrap">{q.objectives}</p>
                      </div>
                    )}

                    {q.rewards && (
                      <p className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                        <i className="fa-solid fa-gift"></i> <span className="font-bold">Rewards:</span> {q.rewards}
                      </p>
                    )}

                    {q.notes && (
                      <p className="text-xs text-slate-400 italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                        {q.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end items-center gap-2 border-t border-slate-800/80 pt-3">
                    <button
                      onClick={() => handleOpenEditQuest(q)}
                      className="text-xs text-slate-400 hover:text-amber-300 p-1.5 flex items-center gap-1"
                    >
                      <i className="fa-solid fa-pen"></i> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteQuest(q.id)}
                      className="text-xs text-slate-400 hover:text-rose-400 p-1.5 flex items-center gap-1"
                    >
                      <i className="fa-solid fa-trash-can"></i> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- SUB-TAB 3: NPC Directory --- */}
      {activeSubTab === 'npcs' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-500 text-xs"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search NPCs by name, faction, location..."
                  className="input-field pl-9 text-xs w-full"
                />
              </div>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                <button
                  onClick={() => setNpcFilter('all')}
                  className={`px-2.5 py-1 rounded-lg ${npcFilter === 'all' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setNpcFilter('friendly')}
                  className={`px-2.5 py-1 rounded-lg ${npcFilter === 'friendly' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400'}`}
                >
                  Friendly
                </button>
                <button
                  onClick={() => setNpcFilter('neutral')}
                  className={`px-2.5 py-1 rounded-lg ${npcFilter === 'neutral' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400'}`}
                >
                  Neutral
                </button>
                <button
                  onClick={() => setNpcFilter('hostile')}
                  className={`px-2.5 py-1 rounded-lg ${npcFilter === 'hostile' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400'}`}
                >
                  Hostile
                </button>
              </div>
            </div>
            <button
              onClick={handleOpenAddNpc}
              className="btn btn-primary text-xs flex items-center gap-1.5"
            >
              <i className="fa-solid fa-user-plus"></i> Add NPC Contact
            </button>
          </div>

          {/* NPC Cards Grid */}
          {filteredNpcs.length === 0 ? (
            <div className="card bg-slate-900/60 p-12 text-center rounded-2xl border border-slate-800 space-y-2">
              <i className="fa-solid fa-address-book text-3xl text-slate-600"></i>
              <p className="text-slate-400 text-sm font-semibold">No NPC contacts found matching current filter.</p>
              <p className="text-slate-500 text-xs">Click 'Add NPC Contact' to record allies, merchants, and foes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNpcs.map(npc => (
                <div key={npc.id} className="card bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-100 text-sm">{npc.name}</h4>
                      <span className={`badge text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-md border ${
                        npc.attitude === 'friendly' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        npc.attitude === 'neutral' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' :
                        npc.attitude === 'hostile' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                        'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {npc.attitude}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      {npc.faction && (
                        <span className="flex items-center gap-1 text-amber-300 font-mono">
                          <i className="fa-solid fa-flag"></i> {npc.faction}
                        </span>
                      )}
                      {npc.location && (
                        <span className="flex items-center gap-1 text-slate-300 font-mono">
                          <i className="fa-solid fa-map-pin"></i> {npc.location}
                        </span>
                      )}
                    </div>

                    {npc.notes && (
                      <p className="text-xs text-slate-300 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 font-mono whitespace-pre-wrap">
                        {npc.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end items-center gap-2 border-t border-slate-800/80 pt-2">
                    <button
                      onClick={() => handleOpenEditNpc(npc)}
                      className="text-xs text-slate-400 hover:text-amber-300 p-1.5 flex items-center gap-1"
                    >
                      <i className="fa-solid fa-pen"></i> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteNpc(npc.id)}
                      className="text-xs text-slate-400 hover:text-rose-400 p-1.5 flex items-center gap-1"
                    >
                      <i className="fa-solid fa-trash-can"></i> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- SUB-TAB 4: Session Journal --- */}
      {activeSubTab === 'journal' && (
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-500 text-xs"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search session journal summaries..."
                className="input-field pl-9 text-xs w-full"
              />
            </div>
            <button
              onClick={handleOpenAddSession}
              className="btn btn-primary text-xs flex items-center gap-1.5"
            >
              <i className="fa-solid fa-plus"></i> Add Session Log
            </button>
          </div>

          {/* Session Timeline / Logs */}
          {filteredSessions.length === 0 ? (
            <div className="card bg-slate-900/60 p-12 text-center rounded-2xl border border-slate-800 space-y-2">
              <i className="fa-solid fa-book-open text-3xl text-slate-600"></i>
              <p className="text-slate-400 text-sm font-semibold">No session logs recorded yet.</p>
              <p className="text-slate-500 text-xs">Click 'Add Session Log' to track campaign progression, story beats, and XP.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSessions.sort((a, b) => b.sessionNumber - a.sessionNumber).map(s => (
                <div key={s.id} className="card bg-slate-900/80 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-bold flex items-center justify-center text-sm">
                        #{s.sessionNumber}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-100 text-sm font-heading">{s.title}</h4>
                        <span className="text-[11px] text-slate-400 font-mono"><i className="fa-regular fa-calendar mr-1"></i>{s.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditSession(s)}
                        className="text-xs text-slate-400 hover:text-amber-300 p-1.5"
                      >
                        <i className="fa-solid fa-pen"></i> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSession(s.id)}
                        className="text-xs text-slate-400 hover:text-rose-400 p-1.5"
                      >
                        <i className="fa-solid fa-trash-can"></i> Delete
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                    {s.summary}
                  </p>

                  {s.lootOrXP && (
                    <div className="bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-xl text-xs flex items-center gap-2 text-emerald-300 font-mono">
                      <i className="fa-solid fa-coins text-amber-400"></i>
                      <div>
                        <span className="font-bold block text-[10px] uppercase">Loot & XP Earned:</span>
                        <span>{s.lootOrXP}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- SUB-TAB 5: Scratchpad --- */}
      {activeSubTab === 'scratchpad' && (
        <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold font-heading text-slate-100 flex items-center gap-2">
                <i className="fa-solid fa-pen-to-square text-amber-500"></i> Live Session Scratchpad
              </h3>
              <p className="text-xs text-slate-400">Quick freeform notes, initiative tracking, temporary spell slots, or combat notes during sessions.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const stamp = `\n--- [${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ---\n`;
                  handleNotesChange('scratchpad', (notes.scratchpad || '') + stamp);
                }}
                className="btn btn-secondary text-xs flex items-center gap-1"
              >
                <i className="fa-regular fa-clock"></i> Timestamp
              </button>
              <button
                onClick={() => handleNotesChange('scratchpad', '')}
                className="btn btn-secondary text-xs text-rose-400 hover:text-rose-300"
                title="Clear scratchpad"
              >
                <i className="fa-solid fa-eraser"></i> Clear
              </button>
            </div>
          </div>

          <textarea
            rows={16}
            value={notes.scratchpad || ''}
            onChange={e => handleNotesChange('scratchpad', e.target.value)}
            placeholder="Type quick session notes here..."
            className="input-field w-full text-xs font-mono leading-relaxed bg-slate-950/80 p-4 rounded-xl resize-y"
          />

          <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
            <span>Character Count: {(notes.scratchpad || '').length}</span>
            <span>Auto-saves to character state</span>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Quest Modal */}
      {showQuestModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card bg-slate-900 border border-slate-800 w-full max-w-lg p-6 rounded-2xl space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 font-heading">
                {editingQuestId ? 'Edit Quest' : 'Add New Quest'}
              </h3>
              <button onClick={() => setShowQuestModal(false)} className="text-slate-400 hover:text-slate-200">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSaveQuest} className="space-y-3">
              <div>
                <label className="label-text">Quest Title *</label>
                <input
                  type="text"
                  required
                  value={questTitle}
                  onChange={e => setQuestTitle(e.target.value)}
                  placeholder="e.g. Retrieve the Sunblade of Pelor"
                  className="input-field text-xs w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">Status</label>
                  <select
                    value={questStatus}
                    onChange={e => setQuestStatus(e.target.value as any)}
                    className="input-field text-xs w-full"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="label-text">Location</label>
                  <input
                    type="text"
                    value={questLocation}
                    onChange={e => setQuestLocation(e.target.value)}
                    placeholder="e.g. Sunken Ruins of Oakhaven"
                    className="input-field text-xs w-full"
                  />
                </div>
              </div>

              <div>
                <label className="label-text">Objectives</label>
                <textarea
                  rows={3}
                  value={questObjectives}
                  onChange={e => setQuestObjectives(e.target.value)}
                  placeholder="Defeat the warlock, locate the altar key..."
                  className="input-field text-xs w-full font-mono"
                />
              </div>

              <div>
                <label className="label-text">Rewards</label>
                <input
                  type="text"
                  value={questRewards}
                  onChange={e => setQuestRewards(e.target.value)}
                  placeholder="e.g. 1,000 GP, Pelor's Amulet, +500 XP"
                  className="input-field text-xs w-full font-mono"
                />
              </div>

              <div>
                <label className="label-text">Additional Notes</label>
                <textarea
                  rows={2}
                  value={questNotes}
                  onChange={e => setQuestNotes(e.target.value)}
                  placeholder="Given by Archmage Vane in Waterdeep..."
                  className="input-field text-xs w-full font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuestModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs"
                >
                  Save Quest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NPC Modal */}
      {showNpcModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card bg-slate-900 border border-slate-800 w-full max-w-lg p-6 rounded-2xl space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 font-heading">
                {editingNpcId ? 'Edit NPC Contact' : 'Add NPC Contact'}
              </h3>
              <button onClick={() => setShowNpcModal(false)} className="text-slate-400 hover:text-slate-200">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSaveNpc} className="space-y-3">
              <div>
                <label className="label-text">NPC Name *</label>
                <input
                  type="text"
                  required
                  value={npcName}
                  onChange={e => setNpcName(e.target.value)}
                  placeholder="e.g. Captain Valerie"
                  className="input-field text-xs w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">Attitude</label>
                  <select
                    value={npcAttitude}
                    onChange={e => setNpcAttitude(e.target.value as any)}
                    className="input-field text-xs w-full"
                  >
                    <option value="friendly">Friendly</option>
                    <option value="neutral">Neutral</option>
                    <option value="hostile">Hostile</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="label-text">Faction / Guild</label>
                  <input
                    type="text"
                    value={npcFaction}
                    onChange={e => setNpcFaction(e.target.value)}
                    placeholder="e.g. Harpers / Town Guard"
                    className="input-field text-xs w-full"
                  />
                </div>
              </div>

              <div>
                <label className="label-text">Location</label>
                <input
                  type="text"
                  value={npcLocation}
                  onChange={e => setNpcLocation(e.target.value)}
                  placeholder="e.g. Red Larch Tavern"
                  className="input-field text-xs w-full"
                />
              </div>

              <div>
                <label className="label-text">Notes & Details</label>
                <textarea
                  rows={3}
                  value={npcNotes}
                  onChange={e => setNpcNotes(e.target.value)}
                  placeholder="Key information, secrets learned, trade options..."
                  className="input-field text-xs w-full font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNpcModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs"
                >
                  Save NPC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card bg-slate-900 border border-slate-800 w-full max-w-lg p-6 rounded-2xl space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 font-heading">
                {editingSessionId ? 'Edit Session Log' : 'Add Session Log'}
              </h3>
              <button onClick={() => setShowSessionModal(false)} className="text-slate-400 hover:text-slate-200">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSaveSession} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">Session #</label>
                  <input
                    type="number"
                    min="1"
                    value={sessionNum}
                    onChange={e => setSessionNum(parseInt(e.target.value) || 1)}
                    className="input-field text-xs w-full font-mono"
                  />
                </div>
                <div>
                  <label className="label-text">Date</label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={e => setSessionDate(e.target.value)}
                    className="input-field text-xs w-full font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="label-text">Session Title *</label>
                <input
                  type="text"
                  required
                  value={sessionTitle}
                  onChange={e => setSessionTitle(e.target.value)}
                  placeholder="e.g. Escape from Castle Ravenloft"
                  className="input-field text-xs w-full"
                />
              </div>

              <div>
                <label className="label-text">Session Summary</label>
                <textarea
                  rows={4}
                  value={sessionSummary}
                  onChange={e => setSessionSummary(e.target.value)}
                  placeholder="Key story events, battles fought, decisions made..."
                  className="input-field text-xs w-full font-mono"
                />
              </div>

              <div>
                <label className="label-text">Loot & XP Earned</label>
                <input
                  type="text"
                  value={sessionLootXP}
                  onChange={e => setSessionLootXP(e.target.value)}
                  placeholder="e.g. +1,200 XP, Ring of Protection +1, 350 GP"
                  className="input-field text-xs w-full font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Portrait Upload Modal */}
      <PortraitModal
        currentPortraitUrl={character.portraitUrl}
        isOpen={showPortraitModal}
        onClose={() => setShowPortraitModal(false)}
        onSelectPortrait={(url) => onChange({ portraitUrl: url })}
      />
    </div>
  );
};
