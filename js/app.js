import { store } from './store.js';
import { calculateBAB, calculateBaseSave, calculateTotalHP } from './engine/classes.js';
import { getAbilityMod, calculateTotalScore, parseRaceMods } from './engine/stats.js';

import { initStatsTab } from './components/StatsTab.js';
import { initRaceClassTab } from './components/RaceClassTab.js';
import { initSkillsTab } from './components/SkillsTab.js';
import { initFeatsTab } from './components/FeatsTab.js';
import { initEquipmentTab } from './components/EquipmentTab.js';
import { initSpellsTab } from './components/SpellsTab.js';
import { initSheetViewTab } from './components/SheetViewTab.js';

async function initApp() {
  console.log('Initializing HeroForge Anew 3.5 Web Application...');

  // Fetch extracted JSON data
  const [racesRes, classesRes, weaponsRes, featsRes] = await Promise.all([
    fetch('./src/data/races.json'),
    fetch('./src/data/classes.json'),
    fetch('./src/data/weapons.json'),
    fetch('./src/data/feats.json')
  ]);

  const racesData = await racesRes.json();
  const classesData = await classesRes.json();
  const weaponsData = await weaponsRes.json();
  const featsData = await featsRes.json();

  console.log(`Loaded ${racesData.length} races, ${classesData.length} classes, ${weaponsData.length} weapons, ${featsData.length} feats.`);

  // Initialize Tab Components
  initStatsTab(racesData);
  initRaceClassTab(racesData, classesData);
  initSkillsTab(racesData, classesData);
  initFeatsTab(featsData);
  initEquipmentTab(weaponsData, racesData, classesData);
  initSpellsTab(classesData);
  initSheetViewTab(racesData, classesData, weaponsData);

  // Tab Navigation Handling
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  navTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTabId = tab.dataset.tab;

      navTabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => {
        c.classList.remove('active');
        c.classList.add('hidden');
      });

      tab.classList.add('active');
      const targetContent = document.getElementById(targetTabId);
      if (targetContent) {
        targetContent.classList.remove('hidden');
        targetContent.classList.add('active');
      }
    });
  });

  // Header Details Bindings
  const charName = document.getElementById('char-name');
  const charPlayer = document.getElementById('char-player');
  const charAlignment = document.getElementById('char-alignment');
  const charDeity = document.getElementById('char-deity');

  function updateHeaderInputs() {
    const char = store.get();
    if (document.activeElement !== charName) charName.value = char.name || '';
    if (document.activeElement !== charPlayer) charPlayer.value = char.player || '';
    if (document.activeElement !== charAlignment) charAlignment.value = char.alignment || 'True Neutral';
    if (document.activeElement !== charDeity) charDeity.value = char.deity || '';

    // Quick Summary Bar Updates
    const raceObj = racesData.find(r => r.name === char.selectedRace) || {};
    const raceMods = parseRaceMods(raceObj);

    const conScore = calculateTotalScore('con', char.baseStats, raceMods, char.levelBumps || {}, char.enhancementMods || {});
    const dexScore = calculateTotalScore('dex', char.baseStats, raceMods, char.levelBumps || {}, char.enhancementMods || {});
    const wisScore = calculateTotalScore('wis', char.baseStats, raceMods, char.levelBumps || {}, char.enhancementMods || {});
    
    const conMod = getAbilityMod(conScore);
    const dexMod = getAbilityMod(dexScore);
    const wisMod = getAbilityMod(wisScore);

    const totalLevel = char.levelProgression.filter(l => l.primaryClass).length || 1;
    const hp = calculateTotalHP(char.levelProgression, classesData, conMod);
    const bab = calculateBAB(char.levelProgression, classesData);

    const baseFort = calculateBaseSave('fort', char.levelProgression, classesData);
    const baseRef = calculateBaseSave('ref', char.levelProgression, classesData);
    const baseWill = calculateBaseSave('will', char.levelProgression, classesData);

    const totalFort = baseFort + conMod;
    const totalRef = baseRef + dexMod;
    const totalWill = baseWill + wisMod;

    const eq = char.equipment || {};
    const armorBonusMap = { none: 0, padded: 1, leather: 2, studded: 3, chainshirt: 4, breastplate: 5, fullplate: 8 };
    const shieldBonusMap = { none: 0, buckler: 1, light_wooden: 1, heavy_shield: 2, tower_shield: 4 };
    const totalAc = 10 + (armorBonusMap[eq.armor] || 0) + (eq.armorEnhancement || 0) + (shieldBonusMap[eq.shield] || 0) + (eq.shieldEnhancement || 0) + dexMod + (eq.deflection || 0) + (eq.natural || 0) + (eq.dodge || 0);

    document.getElementById('qs-level').textContent = totalLevel;
    document.getElementById('qs-hp').textContent = hp;
    document.getElementById('qs-ac').textContent = totalAc;
    document.getElementById('qs-bab').textContent = `+${bab}`;
    document.getElementById('qs-saves').textContent = `${totalFort >= 0 ? '+' : ''}${totalFort}/${totalRef >= 0 ? '+' : ''}${totalRef}/${totalWill >= 0 ? '+' : ''}${totalWill}`;
  }

  charName.addEventListener('input', e => store.set({ name: e.target.value }));
  charPlayer.addEventListener('input', e => store.set({ player: e.target.value }));
  charAlignment.addEventListener('change', e => store.set({ alignment: e.target.value }));
  charDeity.addEventListener('input', e => store.set({ deity: e.target.value }));

  // Header Actions
  document.getElementById('btn-new').addEventListener('click', () => {
    if (confirm('Create a new character? Current changes will be reset.')) {
      store.reset();
    }
  });

  document.getElementById('btn-save').addEventListener('click', () => {
    store.exportJSON();
  });

  document.getElementById('btn-load-file').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = evt => {
        store.importJSON(evt.target.result);
      };
      reader.readAsText(file);
    }
  });

  document.getElementById('btn-print').addEventListener('click', () => {
    const sheetTab = document.querySelector('[data-tab="tab-sheet"]');
    if (sheetTab) sheetTab.click();
    setTimeout(() => window.print(), 200);
  });

  store.subscribe(updateHeaderInputs);
  updateHeaderInputs();
}

window.addEventListener('DOMContentLoaded', initApp);
