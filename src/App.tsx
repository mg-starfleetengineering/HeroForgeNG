import React, { useState, useEffect } from 'react';
import { CharacterState, RaceData, ClassData, WeaponData, FeatData, TraitData, FlawData, SkillTrickData, TemplateData, DomainData, DeityData } from './types/character';
import { Header } from './components/Header';
import { StatsTab } from './components/StatsTab';
import { RaceClassTab } from './components/RaceClassTab';
import { SkillsTab } from './components/SkillsTab';
import { FeatsTab } from './components/FeatsTab';
import { EquipmentTab } from './components/EquipmentTab';
import { SpellsTab } from './components/SpellsTab';
import { AurasTab } from './components/AurasTab';
import { NotesTab } from './components/NotesTab';
import { SheetViewTab } from './components/SheetViewTab';
import { PortraitModal } from './components/PortraitModal';
import { SourceBooksTab } from './components/SourceBooksTab';
import { CORE_SOURCES } from './utils/sourceFilter';
import { generateRoll20JSON } from './engine/roll20Export';
import { syncEquippedItemsToInventory } from './engine/equipment';

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
  selectedFeats: ['Power Attack', 'Weapon Focus (Longsword)', 'Cleave'],
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

export const App: React.FC = () => {
  const [character, setCharacter] = useState<CharacterState>(() => {
    try {
      const saved = localStorage.getItem('heroforge_active_character_v2');
      return saved ? JSON.parse(saved) : DEFAULT_CHARACTER;
    } catch {
      return DEFAULT_CHARACTER;
    }
  });

  const [activeTab, setActiveTab] = useState('stats');
  const [showPortraitModal, setShowPortraitModal] = useState(false);
  const [racesData, setRacesData] = useState<RaceData[]>([]);
  const [classesData, setClassesData] = useState<ClassData[]>([]);
  const [weaponsData, setWeaponsData] = useState<WeaponData[]>([]);
  const [featsData, setFeatsData] = useState<FeatData[]>([]);
  const [traitsData, setTraitsData] = useState<TraitData[]>([]);
  const [flawsData, setFlawsData] = useState<FlawData[]>([]);
  const [skillTricksData, setSkillTricksData] = useState<SkillTrickData[]>([]);
  const [templatesData, setTemplatesData] = useState<TemplateData[]>([]);
  const [domainsData, setDomainsData] = useState<DomainData[]>([]);
  const [deitiesData, setDeitiesData] = useState<DeityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('./data/races.json').then(res => res.json()),
      fetch('./data/classes.json').then(res => res.json()),
      fetch('./data/weapons.json').then(res => res.json()),
      fetch('./data/feats.json').then(res => res.json()),
      fetch('./data/traits.json').then(res => res.json()),
      fetch('./data/flaws.json').then(res => res.json()),
      fetch('./data/skill_tricks.json').then(res => res.json()),
      fetch('./data/templates.json').then(res => res.json()),
      fetch('./data/domains.json').then(res => res.json()),
      fetch('./data/deities.json').then(res => res.json())
    ]).then(([races, classes, weapons, feats, traits, flaws, tricks, templates, domains, deities]) => {
      setRacesData(races);
      setClassesData(classes);
      setWeaponsData(weapons);
      setFeatsData(feats);
      setTraitsData(traits);
      setFlawsData(flaws);
      setSkillTricksData(tricks);
      setTemplatesData(templates);
      setDomainsData(domains);
      setDeitiesData(deities);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load HeroForge JSON data:', err);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!loading) {
      setCharacter(prev => syncEquippedItemsToInventory(prev, weaponsData));
    }
  }, [loading, weaponsData]);

  useEffect(() => {
    try {
      localStorage.setItem('heroforge_active_character_v2', JSON.stringify(character));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [character]);

  const updateCharacter = (updated: Partial<CharacterState>) => {
    setCharacter(prev => ({ ...prev, ...updated }));
  };

  const handleReset = () => {
    if (confirm('Create a new character? Current changes will be reset.')) {
      setCharacter(DEFAULT_CHARACTER);
    }
  };

  const handleExport = () => {
    const jsonStr = JSON.stringify(character, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${character.name.replace(/\s+/g, '_')}_3.5_HeroForgeNG.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportRoll20 = () => {
    const roll20Data = generateRoll20JSON(character, racesData, classesData, weaponsData, featsData);
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
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = evt => {
        try {
          const parsed = JSON.parse(evt.target?.result as string);
          if (parsed && typeof parsed === 'object') {
            const synced = syncEquippedItemsToInventory(parsed, weaponsData);
            setCharacter(synced);
          }
        } catch {
          alert('Invalid HeroForgeNG JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-amber-400">
        <i className="fa-solid fa-dice-d20 fa-spin text-4xl"></i>
        <p className="font-heading font-bold text-lg">Loading HeroForgeNG 3.5 Engine...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        character={character}
        racesData={racesData}
        classesData={classesData}
        traitsData={traitsData}
        flawsData={flawsData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onReset={handleReset}
        onExport={handleExport}
        onExportRoll20={handleExportRoll20}
        onImport={handleImport}
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
          {activeTab === 'stats' && <StatsTab character={character} racesData={racesData} onChange={updateCharacter} />}
          {activeTab === 'race-class' && <RaceClassTab character={character} racesData={racesData} classesData={classesData} templatesData={templatesData} traitsData={traitsData} flawsData={flawsData} deitiesData={deitiesData} domainsData={domainsData} onChange={updateCharacter} />}
          {activeTab === 'skills' && <SkillsTab character={character} racesData={racesData} classesData={classesData} traitsData={traitsData} flawsData={flawsData} skillTricksData={skillTricksData} onChange={updateCharacter} />}
          {activeTab === 'feats' && <FeatsTab character={character} featsData={featsData} classesData={classesData} racesData={racesData} onChange={updateCharacter} />}
          {activeTab === 'equipment' && <EquipmentTab character={character} weaponsData={weaponsData} racesData={racesData} classesData={classesData} onChange={updateCharacter} />}
          {activeTab === 'spells' && <SpellsTab character={character} classesData={classesData} racesData={racesData} domainsData={domainsData} deitiesData={deitiesData} onChange={updateCharacter} />}
          {activeTab === 'auras' && <AurasTab character={character} onChange={updateCharacter} />}
          {activeTab === 'sources' && <SourceBooksTab character={character} onChange={updateCharacter} />}
          {activeTab === 'notes' && <NotesTab character={character} onChange={updateCharacter} />}
        </div>
        <div className={activeTab === 'sheet' ? 'block' : 'hidden print:block'}>
          <SheetViewTab character={character} racesData={racesData} classesData={classesData} weaponsData={weaponsData} templatesData={templatesData} traitsData={traitsData} flawsData={flawsData} domainsData={domainsData} deitiesData={deitiesData} />
        </div>
      </main>

      <footer className="mt-auto border-t border-slate-800/80 bg-slate-900/40 text-slate-400 text-xs py-4 px-4 text-center space-y-1">
        <p>HeroForgeNG 3.5 Web Edition &copy; 2026. Built with React, Vite & TypeScript.</p>
        <p className="text-[11px] text-slate-500">
          Based on the original <a href="https://github.com/Heliomance/HeroForge-Anew" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline font-medium">HeroForge Anew project by Heliomance</a>.
        </p>
      </footer>

      {/* Global Portrait Upload Modal */}
      <PortraitModal
        currentPortraitUrl={character.portraitUrl}
        isOpen={showPortraitModal}
        onClose={() => setShowPortraitModal(false)}
        onSelectPortrait={(url) => updateCharacter({ portraitUrl: url })}
      />
    </div>
  );
};
