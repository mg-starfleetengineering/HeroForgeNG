// HeroForge Anew 3.5 - Character Store

const STORAGE_KEY = 'heroforge_active_character_v1';

export const DEFAULT_CHARACTER = {
  name: 'Valerius the Brave',
  player: 'Shadow',
  alignment: 'True Neutral',
  deity: 'Pelor',
  pointBuyTarget: '32',
  baseStats: {
    str: 14,
    dex: 12,
    con: 14,
    int: 10,
    wis: 10,
    cha: 14
  },
  enhancementMods: {
    str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0
  },
  levelBumps: {
    4: 'str',
    8: 'str',
    12: 'str',
    16: 'str',
    20: 'str'
  },
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
  equipment: {
    armor: 'chainshirt',
    armorEnhancement: 1,
    shield: 'heavy_shield',
    shieldEnhancement: 1,
    deflection: 0,
    natural: 0,
    dodge: 0,
    primaryWeapon: 'Longsword'
  }
};

class CharacterStore {
  constructor() {
    this.character = this.loadFromStorage() || JSON.parse(JSON.stringify(DEFAULT_CHARACTER));
    this.listeners = [];
  }

  get() {
    return this.character;
  }

  set(newChar) {
    this.character = { ...this.character, ...newChar };
    this.saveToStorage();
    this.notify();
  }

  update(path, value) {
    const keys = path.split('.');
    let obj = this.character;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    this.saveToStorage();
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.character));
  }

  reset() {
    this.character = JSON.parse(JSON.stringify(DEFAULT_CHARACTER));
    this.saveToStorage();
    this.notify();
  }

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.character));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  exportJSON() {
    const jsonStr = JSON.stringify(this.character, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.character.name.replace(/\s+/g, '_')}_3.5_HeroForge.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importJSON(jsonText) {
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed && typeof parsed === 'object') {
        this.set(parsed);
        return true;
      }
    } catch (e) {
      alert('Invalid HeroForge JSON file.');
    }
    return false;
  }
}

export const store = new CharacterStore();
