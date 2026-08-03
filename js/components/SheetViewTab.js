import { store } from '../store.js';
import { calculateBAB, calculateBaseSave, calculateTotalHP } from '../engine/classes.js';
import { getAbilityMod, calculateTotalScore } from '../engine/stats.js';

export function initSheetViewTab(racesData, classesData, weaponsData) {
  const container = document.getElementById('printable-character-sheet');

  function render() {
    const char = store.get();
    const raceObj = racesData.find(r => r.name === char.selectedRace) || {};
    
    const raceMods = {
      str: raceObj.strAdj || 0, dex: raceObj.dexAdj || 0, con: raceObj.conAdj || 0,
      int: raceObj.intAdj || 0, wis: raceObj.wisAdj || 0, cha: raceObj.chaAdj || 0
    };

    const strScore = calculateTotalScore('str', char.baseStats, raceMods, char.levelBumps || {}, char.enhancementMods || {});
    const dexScore = calculateTotalScore('dex', char.baseStats, raceMods, char.levelBumps || {}, char.enhancementMods || {});
    const conScore = calculateTotalScore('con', char.baseStats, raceMods, char.levelBumps || {}, char.enhancementMods || {});
    const intScore = calculateTotalScore('int', char.baseStats, raceMods, char.levelBumps || {}, char.enhancementMods || {});
    const wisScore = calculateTotalScore('wis', char.baseStats, raceMods, char.levelBumps || {}, char.enhancementMods || {});
    const chaScore = calculateTotalScore('cha', char.baseStats, raceMods, char.levelBumps || {}, char.enhancementMods || {});

    const strMod = getAbilityMod(strScore);
    const dexMod = getAbilityMod(dexScore);
    const conMod = getAbilityMod(conScore);
    const intMod = getAbilityMod(intScore);
    const wisMod = getAbilityMod(wisScore);
    const chaMod = getAbilityMod(chaScore);

    const bab = calculateBAB(char.levelProgression, classesData);
    const hp = calculateTotalHP(char.levelProgression, classesData, conMod);

    const baseFort = calculateBaseSave('fort', char.levelProgression, classesData);
    const baseRef = calculateBaseSave('ref', char.levelProgression, classesData);
    const baseWill = calculateBaseSave('will', char.levelProgression, classesData);

    const totalFort = baseFort + conMod;
    const totalRef = baseRef + dexMod;
    const totalWill = baseWill + wisMod;

    // AC Calculations
    const eq = char.equipment || {};
    const armorBonusMap = { none: 0, padded: 1, leather: 2, studded: 3, chainshirt: 4, breastplate: 5, fullplate: 8 };
    const shieldBonusMap = { none: 0, buckler: 1, light_wooden: 1, heavy_shield: 2, tower_shield: 4 };

    const armorAc = (armorBonusMap[eq.armor] || 0) + (eq.armorEnhancement || 0);
    const shieldAc = (shieldBonusMap[eq.shield] || 0) + (eq.shieldEnhancement || 0);
    const totalAc = 10 + armorAc + shieldAc + dexMod + (eq.deflection || 0) + (eq.natural || 0) + (eq.dodge || 0);
    const touchAc = 10 + dexMod + (eq.deflection || 0) + (eq.dodge || 0);
    const flatAc = 10 + armorAc + shieldAc + (eq.deflection || 0) + (eq.natural || 0);

    // Class Summary
    const classMap = {};
    char.levelProgression.forEach(l => {
      if (l.primaryClass) classMap[l.primaryClass] = (classMap[l.primaryClass] || 0) + 1;
    });
    const classSummary = Object.entries(classMap).map(([c, count]) => `${c} ${count}`).join(' / ') || 'None 1';
    const totalLevel = char.levelProgression.filter(l => l.primaryClass).length || 1;

    container.innerHTML = `
      <!-- Character Sheet Header -->
      <div class="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-extrabold font-heading text-slate-900">${char.name || 'Unnamed Hero'}</h1>
          <p class="text-xs text-slate-600 font-semibold uppercase tracking-wider">
            ${char.selectedRace || 'Human'} &bull; ${classSummary} &bull; Level ${totalLevel}
          </p>
        </div>
        <div class="text-right text-xs text-slate-600">
          <p><span class="font-bold">Player:</span> ${char.player || 'Shadow'}</p>
          <p><span class="font-bold">Alignment:</span> ${char.alignment || 'True Neutral'}</p>
          <p><span class="font-bold">Deity:</span> ${char.deity || 'Pelor'}</p>
        </div>
      </div>

      <!-- Core Vitals Banner -->
      <div class="grid grid-cols-5 gap-3 text-center font-mono py-2 bg-slate-100 rounded-lg border border-slate-300">
        <div>
          <span class="text-[10px] text-slate-500 block uppercase font-sans font-bold">Hit Points</span>
          <span class="text-2xl font-bold text-slate-900">${hp}</span>
        </div>
        <div>
          <span class="text-[10px] text-slate-500 block uppercase font-sans font-bold">Armor Class</span>
          <span class="text-2xl font-bold text-slate-900">${totalAc}</span>
          <span class="text-[9px] text-slate-500 block">Touch ${touchAc} / FF ${flatAc}</span>
        </div>
        <div>
          <span class="text-[10px] text-slate-500 block uppercase font-sans font-bold">Initiative</span>
          <span class="text-2xl font-bold text-slate-900">${dexMod >= 0 ? '+' : ''}${dexMod}</span>
        </div>
        <div>
          <span class="text-[10px] text-slate-500 block uppercase font-sans font-bold">Base Attack (BAB)</span>
          <span class="text-2xl font-bold text-slate-900">+${bab}</span>
        </div>
        <div>
          <span class="text-[10px] text-slate-500 block uppercase font-sans font-bold">Speed</span>
          <span class="text-2xl font-bold text-slate-900">${raceObj.speed ? raceObj.speed.land : 30} ft</span>
        </div>
      </div>

      <!-- Stats & Saves Grid -->
      <div class="grid grid-cols-2 gap-6">
        
        <!-- Ability Scores Table -->
        <div>
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-300 pb-1 mb-2">Ability Scores</h3>
          <table class="w-full text-xs text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-300 text-slate-500 uppercase">
                <th class="py-1">Stat</th>
                <th class="py-1 text-center">Score</th>
                <th class="py-1 text-center">Mod</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 font-mono">
              <tr><td class="py-1.5 font-bold">STR</td><td class="py-1.5 text-center">${strScore}</td><td class="py-1.5 text-center font-bold">${strMod >= 0 ? '+' : ''}${strMod}</td></tr>
              <tr><td class="py-1.5 font-bold">DEX</td><td class="py-1.5 text-center">${dexScore}</td><td class="py-1.5 text-center font-bold">${dexMod >= 0 ? '+' : ''}${dexMod}</td></tr>
              <tr><td class="py-1.5 font-bold">CON</td><td class="py-1.5 text-center">${conScore}</td><td class="py-1.5 text-center font-bold">${conMod >= 0 ? '+' : ''}${conMod}</td></tr>
              <tr><td class="py-1.5 font-bold">INT</td><td class="py-1.5 text-center">${intScore}</td><td class="py-1.5 text-center font-bold">${intMod >= 0 ? '+' : ''}${intMod}</td></tr>
              <tr><td class="py-1.5 font-bold">WIS</td><td class="py-1.5 text-center">${wisScore}</td><td class="py-1.5 text-center font-bold">${wisMod >= 0 ? '+' : ''}${wisMod}</td></tr>
              <tr><td class="py-1.5 font-bold">CHA</td><td class="py-1.5 text-center">${chaScore}</td><td class="py-1.5 text-center font-bold">${chaMod >= 0 ? '+' : ''}${chaMod}</td></tr>
            </tbody>
          </table>
        </div>

        <!-- Saving Throws Table -->
        <div>
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-300 pb-1 mb-2">Saving Throws</h3>
          <table class="w-full text-xs text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-300 text-slate-500 uppercase">
                <th class="py-1">Save</th>
                <th class="py-1 text-center">Total</th>
                <th class="py-1 text-center">Base</th>
                <th class="py-1 text-center">Ability</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 font-mono">
              <tr>
                <td class="py-1.5 font-bold">FORTITUDE (Con)</td>
                <td class="py-1.5 text-center font-bold text-sm">${totalFort >= 0 ? '+' : ''}${totalFort}</td>
                <td class="py-1.5 text-center">${baseFort}</td>
                <td class="py-1.5 text-center">${conMod >= 0 ? '+' : ''}${conMod}</td>
              </tr>
              <tr>
                <td class="py-1.5 font-bold">REFLEX (Dex)</td>
                <td class="py-1.5 text-center font-bold text-sm">${totalRef >= 0 ? '+' : ''}${totalRef}</td>
                <td class="py-1.5 text-center">${baseRef}</td>
                <td class="py-1.5 text-center">${dexMod >= 0 ? '+' : ''}${dexMod}</td>
              </tr>
              <tr>
                <td class="py-1.5 font-bold">WILL (Wis)</td>
                <td class="py-1.5 text-center font-bold text-sm">${totalWill >= 0 ? '+' : ''}${totalWill}</td>
                <td class="py-1.5 text-center">${baseWill}</td>
                <td class="py-1.5 text-center">${wisMod >= 0 ? '+' : ''}${wisMod}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Feats List -->
      <div>
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-300 pb-1 mb-2">Feats & Special Abilities</h3>
        <p class="text-xs text-slate-800 font-medium">
          ${(char.selectedFeats || []).join(', ') || 'None selected.'}
        </p>
      </div>
    `;
  }

  store.subscribe(render);
  render();
}
