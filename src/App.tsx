import React, { useState, useEffect, useCallback } from 'react';
import { CharacterSheetData, CharacterSummary, CharacterState } from './types/character';

import { Header } from './components/Header';
import { StatsTab } from './components/StatsTab';
import { RaceClassTab } from './components/RaceClassTab';
import { DiceTrayWidget } from './components/DiceTrayWidget';
import { TabLoadingSkeleton } from './components/TabLoadingSkeleton';

// Code-split heavy tabs with React.lazy
const SheetViewTab = React.lazy(() => import('./components/SheetViewTab').then(m => ({ default: m.SheetViewTab })));
const SkillsTab = React.lazy(() => import('./components/SkillsTab').then(m => ({ default: m.SkillsTab })));
const FeatsTab = React.lazy(() => import('./components/FeatsTab').then(m => ({ default: m.FeatsTab })));
const EquipmentTab = React.lazy(() => import('./components/EquipmentTab').then(m => ({ default: m.EquipmentTab })));
const SpellsTab = React.lazy(() => import('./components/SpellsTab').then(m => ({ default: m.SpellsTab })));
const FamiliarTab = React.lazy(() => import('./components/FamiliarTab').then(m => ({ default: m.FamiliarTab })));
const AnimalCompanionTab = React.lazy(() => import('./components/AnimalCompanionTab').then(m => ({ default: m.AnimalCompanionTab })));
const AurasTab = React.lazy(() => import('./components/AurasTab').then(m => ({ default: m.AurasTab })));
const SourceBooksTab = React.lazy(() => import('./components/SourceBooksTab').then(m => ({ default: m.SourceBooksTab })));
const NotesTab = React.lazy(() => import('./components/NotesTab').then(m => ({ default: m.NotesTab })));

// Code-split heavy modals with React.lazy
const PortraitModal = React.lazy(() => import('./components/PortraitModal').then(m => ({ default: m.PortraitModal })));
const CharacterRosterModal = React.lazy(() => import('./components/CharacterRosterModal').then(m => ({ default: m.CharacterRosterModal })));
const DocumentationModal = React.lazy(() => import('./components/DocumentationModal').then(m => ({ default: m.DocumentationModal })));

// Dynamic loaders array for background idle prefetching
const TAB_PRELOADERS = [
  () => import('./components/SheetViewTab'),
  () => import('./components/EquipmentTab'),
  () => import('./components/SpellsTab'),
  () => import('./components/AnimalCompanionTab'),
  () => import('./components/FamiliarTab'),
  () => import('./components/NotesTab'),
  () => import('./components/AurasTab'),
  () => import('./components/SourceBooksTab'),
  () => import('./components/SkillsTab'),
  () => import('./components/FeatsTab'),
  () => import('./components/DocumentationModal'),
  () => import('./components/CharacterRosterModal'),
  () => import('./components/PortraitModal'),
  () => import('./components/FeatTreeModal')
];
import { CORE_SOURCES } from './utils/sourceFilter';
import { generateRoll20JSON } from './engine/roll20Export';
import { syncEquippedItemsToInventory } from './engine/equipment';
import {
  getAllCharacterSummaries,
  getCharacter,
  saveCharacter,
  deleteCharacter,
  duplicateCharacter,
  createNewCharacter,
  setActiveCharacterId,
  exportAllRosterPackage,
  importRosterPackage
} from './storage/characterStore';
import { runLegacyMigrationIfNeeded } from './storage/migration';
import { GameDataProvider, useGameData } from './context/GameDataContext';
import { CharacterProvider } from './context/CharacterContext';
import { CommandPalette } from './components/CommandPalette';
import {
  createHistory,
  pushState,
  undo,
  redo,
  canUndo,
  canRedo,
  isTextInputActive,
  HistoryState
} from './engine/history';

const DEFAULT_CHARACTER: CharacterState = {
  name: 'Valerius the Brave',
  player: 'Shadow',
  alignment: 'True Neutral',
  deity: 'Pelor',
  selectedDomains: ['Good', 'Sun'],
  pointBuyTarget: '32',
  baseStats: { str: 14, dex: 12, con: 14, int: 10, wis: 10, cha: 14 },
  enhancementMods: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
  levelBumps: { 4: 'str', 8: 'str', 12: 'str', 16: 'str', 20: 'str' },
  selectedRace: 'Human',
  isGestalt: false,
  levelProgression: [
    { level: 1, primaryClass: 'Fighter', secondaryClass: '', hpRoll: 10 },
    { level: 2, primaryClass: 'Fighter', secondaryClass: '', hpRoll: 6 },
    { level: 3, primaryClass: 'Fighter', secondaryClass: '', hpRoll: 6 },
    { level: 4, primaryClass: 'Fighter', secondaryClass: '', hpRoll: 6 },
    { level: 5, primaryClass: 'Fighter', secondaryClass: '', hpRoll: 6 }
  ],
  skillRanks: {},
  selectedFeatEntities: [
    { id: 'power_attack', featId: 'power_attack', notes: 'Power Attack' },
    { id: 'weapon_focus_longsword', featId: 'weapon_focus', targetId: 'longsword', targetType: 'weapon', notes: 'Weapon Focus (Longsword)' },
    { id: 'cleave', featId: 'cleave', notes: 'Cleave' }
  ],
  selectedTraits: [],
  selectedFlaws: [],
  equipment: {
    armor: 'chainshirt',
    armorEnhancement: 1,
    shield: 'heavy_shield',
    shieldEnhancement: 1,
    deflection: 0,
    natural: 0,
    dodge: 0,
    primaryWeapon: 'Longsword'
  },
  funds: {
    cp: 25,
    sp: 40,
    gp: 185,
    pp: 5,
    otherValuables: 100
  },
  inventory: [
    { id: 'inv_eq_armor', name: 'Chain Shirt', quantity: 1, weight: 25, location: 'Carried', value: '100 gp' },
    { id: 'inv_eq_shield', name: 'Heavy Shield', quantity: 1, weight: 15, location: 'Carried', value: '20 gp' },
    { id: 'inv_eq_wpn', name: 'Longsword', quantity: 1, weight: 4, location: 'Carried', value: '15 gp' },
    { id: 'inv_1', name: "Explorer's Backpack", quantity: 1, weight: 2, location: 'Carried', value: '2 gp', notes: 'Capacity 2 cu. ft.' },
    { id: 'inv_2', name: 'Bedroll', quantity: 1, weight: 5, location: 'Backpack', value: '1 sp' },
    { id: 'inv_3', name: 'Trail Rations (1 day)', quantity: 5, weight: 1, location: 'Backpack', value: '5 sp/day' },
    { id: 'inv_4', name: 'Waterskin', quantity: 1, weight: 4, location: 'Carried', value: '1 gp', notes: 'Full' },
    { id: 'inv_5', name: 'Flint and Steel', quantity: 1, weight: 0, location: 'Belt Pouch', value: '1 gp' },
    { id: 'inv_6', name: 'Torches', quantity: 5, weight: 1, location: 'Backpack', value: '5 cp' },
    { id: 'inv_7', name: 'Hempen Rope (50 ft)', quantity: 1, weight: 10, location: 'Backpack', value: '1 gp' },
    { id: 'inv_8', name: 'Potion of Cure Light Wounds', quantity: 2, weight: 0.1, location: 'Belt Pouch', value: '50 gp', notes: 'Heals 1d8+1 HP' }
  ],
  allowedSources: [...CORE_SOURCES],
  tacticalCombat: {
    powerAttack: 0,
    combatExpertise: 0,
    fightingDefensively: false,
    haste: false,
    rage: false,
    whirlingFrenzy: false,
    flurryOfBlows: false,
    isCollapsed: false
  },
  activeBuffs: [],
  currentHp: 38,
  tempHp: 0,
  nonlethalDamage: 0,
  activeConditions: [],
  auras: [
    {
      id: 'aura_def_1',
      name: 'Aura of Courage',
      type: 'Class Feature',
      radius: 10,
      target: 'Allies',
      effect: 'Immune to fear (self). Allies within 10 ft gain a +4 morale bonus on saving throws against fear effects.',
      active: true,
      source: 'Paladin 2nd level'
    },
    {
      id: 'aura_def_2',
      name: 'Draconic Aura: Power',
      type: 'Feat',
      radius: 30,
      target: 'Self & Allies',
      effect: 'Grants +1 bonus on melee damage rolls to all recipients.',
      active: true,
      source: 'Dragon Magic'
    }
  ],
  notes: {
    backstory: 'Valerius was raised in the borderlands of Oakhaven. After a band of goblins raided his village, he pledged himself to Pelor to protect the innocent and uphold justice across the continent.',
    appearance: 'Tall, broad-shouldered warrior with short dark hair and a faint scar along his left jaw line. Wears polished steel plate over chainmail with a crimson cloak.',
    personality: 'Stalwart, honorable, but sometimes overly optimistic. Believes in second chances for those willing to repent.',
    alliesAndOrganizations: 'Member in good standing of the Order of the Radiant Sun.',
    scratchpad: 'Combat Reminder: Remember Power Attack -2/+2 with 2-handed weapons.\nCheck with Captain Valerie at the Red Larch guard station about the goblin cave location.',
    quests: [
      { id: 'q_1', title: 'Clear the Oakhaven Goblin Den', status: 'active', location: 'Oakhaven Hills', objectives: 'Locate the chief warlock and recover stolen supplies.', rewards: '500 GP + Order Favor', notes: 'Village Elder promised bonus for safe return of the stolen heirloom.' }
    ],
    npcs: [
      { id: 'npc_1', name: 'Captain Valerie', attitude: 'friendly', faction: 'Town Guard', location: 'Red Larch Barracks', notes: 'Provides bounties and tactical intel on local monster dens.' }
    ],
    sessions: [
      { id: 's_1', sessionNumber: 1, date: '2026-08-01', title: 'Arrival at Red Larch', summary: 'The party met at the tavern, accepted the quest to investigate goblin raids, and purchased supplies.', lootOrXP: '+300 XP, 50 GP reward advances' }
    ]
  }
};

const AppContent: React.FC = () => {
  const gameData = useGameData();
  const [historyState, setHistoryState] = useState<HistoryState<CharacterSheetData>>(() =>
    createHistory<CharacterSheetData>(DEFAULT_CHARACTER as CharacterSheetData)
  );
  const character = historyState.present.state;
  const [summaries, setSummaries] = useState<CharacterSummary[]>([]);
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('stats');
  const [showPortraitModal, setShowPortraitModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshSummaries = useCallback(async () => {
    const list = await getAllCharacterSummaries();
    setSummaries(list);
  }, []);

  useEffect(() => {
    if (gameData.loading) return;

    runLegacyMigrationIfNeeded(DEFAULT_CHARACTER).then(({ activeCharacter }) => {
      const synced = syncEquippedItemsToInventory(activeCharacter, gameData.weaponsData);
      setHistoryState(createHistory(synced));
      refreshSummaries();
      setLoading(false);
    }).catch(err => {
      console.error('Failed to initialize character:', err);
      setLoading(false);
    });
  }, [gameData.loading, gameData.weaponsData, refreshSummaries]);

  // Background idle prefetching: 2 seconds after initial mount, silently preload all remaining tab & modal chunks
  useEffect(() => {
    const timer = setTimeout(() => {
      const runIdlePrefetch = () => {
        TAB_PRELOADERS.forEach(preload => {
          preload().catch(() => {});
        });
      };

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(runIdlePrefetch, { timeout: 4000 });
      } else {
        setTimeout(runIdlePrefetch, 200);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Preserve Print View (Ctrl+P): eagerly preload SheetViewTab and listen to print lifecycle events
  useEffect(() => {
    // Eagerly initiate SheetViewTab load so it is cached well before any print action
    import('./components/SheetViewTab').catch(() => {});

    const handlePrint = () => {
      import('./components/SheetViewTab').catch(() => {});
    };
    window.addEventListener('beforeprint', handlePrint);
    const mediaQuery = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('print') : null;
    if (mediaQuery && mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handlePrint);
    }
    return () => {
      window.removeEventListener('beforeprint', handlePrint);
      if (mediaQuery && mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handlePrint);
      }
    };
  }, []);

  const updateCharacter = useCallback((updated: Partial<CharacterState>) => {
    setHistoryState(prev => {
      const current = prev.present.state;
      const updatedChar: CharacterSheetData = {
        ...current,
        ...updated,
        updatedAt: Date.now()
      };
      const modifiedKeys = Object.keys(updated);
      const nextHistory = pushState(prev, updatedChar, modifiedKeys);
      saveCharacter(updatedChar).then(() => {
        refreshSummaries();
      });
      return nextHistory;
    });
  }, [refreshSummaries]);

  const handleUndo = useCallback(() => {
    setHistoryState(prev => {
      if (!canUndo(prev)) return prev;
      const nextHistory = undo(prev);
      const restored = nextHistory.present.state;
      saveCharacter(restored).then(() => {
        refreshSummaries();
      });
      return nextHistory;
    });
  }, [refreshSummaries]);

  const handleRedo = useCallback(() => {
    setHistoryState(prev => {
      if (!canRedo(prev)) return prev;
      const nextHistory = redo(prev);
      const restored = nextHistory.present.state;
      saveCharacter(restored).then(() => {
        refreshSummaries();
      });
      return nextHistory;
    });
  }, [refreshSummaries]);

  const handleSetCharacter = useCallback((action: CharacterSheetData | null | ((prev: CharacterSheetData | null) => CharacterSheetData | null)) => {
    setHistoryState(prev => {
      const prevChar = prev.present.state;
      const nextChar = typeof action === 'function' ? action(prevChar) : action;
      if (!nextChar) return prev;
      const nextHistory = pushState(prev, nextChar, undefined, { forceNewStep: true });
      saveCharacter(nextChar).then(() => {
        refreshSummaries();
      });
      return nextHistory;
    });
  }, [refreshSummaries]);

  // Global Keyboard Shortcuts for Command Palette (Ctrl+K) and Undo/Redo (Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. Browser Shortcut Hijacking Safeguard (Ctrl+K / Cmd+K):
      // Intercept with e.preventDefault() on keydown to stop Chrome/Edge from focusing browser address bar
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      // 2. Native Text Input Collision Safeguard:
      // Global Ctrl+Z / Ctrl+Y must NEVER hijack native text undo inside active <input>, <textarea>, or content-editable
      if (isTextInputActive()) {
        return;
      }

      // 3. Undo / Redo Shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handleRedo();
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleUndo, handleRedo]);

  const handleSelectCharacter = async (id: string) => {
    const char = await getCharacter(id);
    if (char) {
      const synced = syncEquippedItemsToInventory(char, gameData.weaponsData);
      setHistoryState(createHistory(synced));
      setActiveCharacterId(id);
      await refreshSummaries();
    }
  };

  const handleDuplicateCharacter = async (id: string) => {
    const cloned = await duplicateCharacter(id);
    if (cloned) {
      await refreshSummaries();
      await handleSelectCharacter(cloned.id);
    }
  };

  const handleDeleteCharacter = async (id: string) => {
    const charToDelete = summaries.find(s => s.id === id);
    const charName = charToDelete ? charToDelete.name : 'this character';

    if (summaries.length <= 1) {
      alert('Cannot delete the only character sheet. Create a new character first.');
      return;
    }

    if (confirm(`Are you sure you want to delete "${charName}"? This action cannot be undone.`)) {
      await deleteCharacter(id);
      const remainingSummaries = await getAllCharacterSummaries();
      setSummaries(remainingSummaries);

      if (character?.id === id) {
        const nextId = remainingSummaries[0]?.id;
        if (nextId) {
          await handleSelectCharacter(nextId);
        } else {
          await handleCreateNewCharacter();
        }
      }
    }
  };

  const handleCreateNewCharacter = async () => {
    const newChar = await createNewCharacter(DEFAULT_CHARACTER);
    const synced = syncEquippedItemsToInventory(newChar, gameData.weaponsData);
    setHistoryState(createHistory(synced));
    setActiveCharacterId(synced.id);
    await refreshSummaries();
    setIsRosterOpen(false);
  };

  const handleExport = () => {
    if (!character) return;
    handleExportCharacter(character.id);
  };

  const handleExportCharacter = async (id: string) => {
    const charToExport = (id === character?.id) ? character : await getCharacter(id);
    if (!charToExport) return;

    const jsonStr = JSON.stringify(charToExport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(charToExport.name || 'Character').replace(/\s+/g, '_')}_3.5_HeroForgeNG.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAllRoster = async () => {
    const pkg = await exportAllRosterPackage();
    const jsonStr = JSON.stringify(pkg, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `HeroForgeNG_All_Characters_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportRoll20 = () => {
    if (!character) return;
    const roll20Data = generateRoll20JSON(
      character,
      gameData.racesData,
      gameData.classesData,
      gameData.weaponsData,
      gameData.featsData
    );
    const jsonStr = JSON.stringify(roll20Data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${character.name.replace(/\s+/g, '_')}_Roll20_3.5e.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let totalImported = 0;
    let lastImportId: string | null = null;

    const readPromises = Array.from(files).map(file => {
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = async (evt) => {
          try {
            const parsed = JSON.parse(evt.target?.result as string);
            const { importedCount, lastImportedId } = await importRosterPackage(parsed);
            totalImported += importedCount;
            if (lastImportedId) lastImportId = lastImportedId;
          } catch (err) {
            console.error('Failed to parse JSON file:', file.name, err);
          }
          resolve();
        };
        reader.readAsText(file);
      });
    });

    Promise.all(readPromises).then(async () => {
      if (totalImported > 0) {
        await refreshSummaries();
        if (lastImportId) {
          await handleSelectCharacter(lastImportId);
        }
      } else {
        alert('No valid HeroForgeNG JSON files or roster backups could be imported.');
      }
    });
  };

  if (loading || !character || gameData.loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-amber-400">
        <i className="fa-solid fa-dice-d20 fa-spin text-4xl"></i>
        <p className="font-heading font-bold text-lg">Loading HeroForgeNG 3.5 Engine...</p>
      </div>
    );
  }

  return (
    <CharacterProvider
      character={character}
      onUpdateCharacter={updateCharacter}
      onSetCharacter={handleSetCharacter}
      onUndo={handleUndo}
      onRedo={handleRedo}
      canUndo={canUndo(historyState)}
      canRedo={canRedo(historyState)}
    >
      <div className="min-h-screen flex flex-col">
        <Header
          summaries={summaries}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onSelectCharacter={handleSelectCharacter}
          onOpenRoster={() => setIsRosterOpen(true)}
          onCreateNew={handleCreateNewCharacter}
          onExport={handleExport}
          onExportAll={handleExportAllRoster}
          onExportRoll20={handleExportRoll20}
          onImport={handleImport}
          onOpenDocs={() => setShowDocsModal(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
          {/* Character Basic Info Bar */}
          <section className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center gap-4 print:hidden">
            {/* Portrait Thumbnail / Trigger */}
            <div className="flex items-center shrink-0">
              <button
                onClick={() => setShowPortraitModal(true)}
                className="relative w-14 h-14 rounded-2xl border-2 border-amber-500/40 hover:border-amber-400 bg-slate-950 overflow-hidden flex items-center justify-center group shadow-md transition"
                title="Click to change character portrait"
              >
                {character.portraitUrl ? (
                  <img src={character.portraitUrl} alt={character.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                ) : (
                  <i className="fa-solid fa-user-shield text-2xl text-slate-500 group-hover:text-amber-400 transition"></i>
                )}
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <i className="fa-solid fa-camera text-amber-300 text-xs"></i>
                </div>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 flex-1 min-w-[280px]">
              <div>
                <label className="label-text">Character Name</label>
                <input
                  type="text"
                  value={character.name}
                  onChange={e => updateCharacter({ name: e.target.value })}
                  className="input-field font-semibold text-amber-300"
                  placeholder="e.g. Valerius the Brave"
                />
              </div>
              <div>
                <label className="label-text">Player Name / Campaign</label>
                <input
                  type="text"
                  value={character.player}
                  onChange={e => updateCharacter({ player: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Shadow / Greyhawk"
                />
              </div>
              <div>
                <label className="label-text">Alignment</label>
                <select
                  value={character.alignment}
                  onChange={e => updateCharacter({ alignment: e.target.value })}
                  className="input-field"
                >
                  <option value="Chaotic Evil">Chaotic Evil</option>
                  <option value="Chaotic Good">Chaotic Good</option>
                  <option value="Chaotic Neutral">Chaotic Neutral</option>
                  <option value="Lawful Evil">Lawful Evil</option>
                  <option value="Lawful Good">Lawful Good</option>
                  <option value="Lawful Neutral">Lawful Neutral</option>
                  <option value="Neutral Evil">Neutral Evil</option>
                  <option value="Neutral Good">Neutral Good</option>
                  <option value="True Neutral">True Neutral</option>
                </select>
              </div>
              <div>
                <label className="label-text">Deity</label>
                <input
                  type="text"
                  value={character.deity}
                  onChange={e => updateCharacter({ deity: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Pelor, Kord, Boccob"
                />
              </div>
            </div>
          </section>

          {/* Tab Views */}
          <div className="print:hidden">
            <React.Suspense fallback={<TabLoadingSkeleton />}>
              {activeTab === 'stats' && <StatsTab />}
              {activeTab === 'race-class' && <RaceClassTab />}
              {activeTab === 'skills' && <SkillsTab />}
              {activeTab === 'feats' && <FeatsTab />}
              {activeTab === 'equipment' && <EquipmentTab />}
              {activeTab === 'spells' && <SpellsTab />}
              {activeTab === 'familiar' && <FamiliarTab />}
              {activeTab === 'companion' && <AnimalCompanionTab />}
              {activeTab === 'auras' && <AurasTab />}
              {activeTab === 'sources' && <SourceBooksTab />}
              {activeTab === 'notes' && <NotesTab />}
            </React.Suspense>
          </div>
          <div className={activeTab === 'sheet' ? 'block' : 'hidden print:block'}>
            <React.Suspense fallback={<TabLoadingSkeleton />}>
              <SheetViewTab />
            </React.Suspense>
          </div>
        </main>

        <footer className="mt-auto border-t border-slate-800/80 bg-slate-900/40 text-slate-400 text-xs py-4 pb-16 px-4 text-center space-y-1 print:hidden">
          <p>HeroForgeNG 3.5 Web Edition v3.0.0 &copy; 2026. Built with React, Vite & TypeScript.</p>
          <p className="text-[11px] text-slate-500">
            Based on the original <a href="https://github.com/Heliomance/HeroForge-Anew" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline font-medium">HeroForge Anew project by Heliomance</a>.
          </p>
        </footer>

        {/* Global Bottom Dockable Dice Tray HUD */}
        <DiceTrayWidget />

        {/* Global Quick-Command Palette (Ctrl+K) */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          summaries={summaries}
          onSelectCharacter={handleSelectCharacter}
          onCreateNew={handleCreateNewCharacter}
          onExport={handleExport}
          onOpenDocs={() => setShowDocsModal(true)}
        />

        {/* Global Portrait Upload Modal */}
        {showPortraitModal && (
          <React.Suspense fallback={null}>
            <PortraitModal
              currentPortraitUrl={character.portraitUrl}
              isOpen={showPortraitModal}
              onClose={() => setShowPortraitModal(false)}
              onSelectPortrait={(url) => updateCharacter({ portraitUrl: url })}
            />
          </React.Suspense>
        )}

        {/* Global Multi-Character Roster Dashboard Modal */}
        {isRosterOpen && (
          <React.Suspense fallback={null}>
            <CharacterRosterModal
              isOpen={isRosterOpen}
              onClose={() => setIsRosterOpen(false)}
              activeCharacterId={character.id}
              summaries={summaries}
              onSelectCharacter={(id) => {
                handleSelectCharacter(id);
                setIsRosterOpen(false);
              }}
              onDuplicateCharacter={handleDuplicateCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onExportCharacter={handleExportCharacter}
              onExportAllCharacters={handleExportAllRoster}
              onCreateNewCharacter={handleCreateNewCharacter}
              onImportCharacterJSON={handleImport}
            />
          </React.Suspense>
        )}

        {/* In-App Help & Documentation Modal */}
        {showDocsModal && (
          <React.Suspense fallback={null}>
            <DocumentationModal
              isOpen={showDocsModal}
              onClose={() => setShowDocsModal(false)}
            />
          </React.Suspense>
        )}
      </div>
    </CharacterProvider>
  );
};

export const App: React.FC = () => {
  return (
    <GameDataProvider>
      <AppContent />
    </GameDataProvider>
  );
};
