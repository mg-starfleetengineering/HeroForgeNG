import { store } from '../store.js';
import { ABILITY_NAMES, getAbilityMod, getPointBuyCost, getTotalPointBuySpent, calculateTotalScore } from '../engine/stats.js';

export function initStatsTab(racesData) {
  const tbody = document.getElementById('stats-tbody');
  const bumpsContainer = document.getElementById('stat-bumps-container');
  const pbTargetSelect = document.getElementById('pb-target');
  const pbSpentBadge = document.getElementById('pb-spent-badge');

  function render() {
    const char = store.get();
    const raceObj = racesData.find(r => r.name === char.selectedRace) || {};
    
    const raceMods = {
      str: raceObj.strAdj || 0,
      dex: raceObj.dexAdj || 0,
      con: raceObj.conAdj || 0,
      int: raceObj.intAdj || 0,
      wis: raceObj.wisAdj || 0,
      cha: raceObj.chaAdj || 0
    };

    // Render Stats Table
    tbody.innerHTML = '';
    ABILITY_NAMES.forEach(stat => {
      const baseVal = char.baseStats[stat] || 10;
      const cost = getPointBuyCost(baseVal);
      const raceVal = raceMods[stat] || 0;
      const bumpCount = Object.values(char.levelBumps || {}).filter(s => s === stat).length;
      const enhVal = char.enhancementMods[stat] || 0;

      const totalScore = calculateTotalScore(stat, char.baseStats, raceMods, char.levelBumps || {}, char.enhancementMods || {});
      const mod = getAbilityMod(totalScore);
      const modStr = mod >= 0 ? `+${mod}` : `${mod}`;

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-800/40 transition-colors';
      tr.innerHTML = `
        <td class="py-3 px-2 font-bold uppercase text-xs text-amber-400 font-mono">${stat}</td>
        <td class="py-3 px-2 text-center">
          <input type="number" data-stat="${stat}" class="stat-base-input input-field w-16 text-center font-mono font-bold text-amber-300" value="${baseVal}" min="8" max="18">
        </td>
        <td class="py-3 px-2 text-center font-mono text-slate-400 text-xs">${cost} pt</td>
        <td class="py-3 px-2 text-center font-mono text-slate-300 text-xs">${raceVal >= 0 ? '+' + raceVal : raceVal}</td>
        <td class="py-3 px-2 text-center font-mono text-slate-300 text-xs">+${bumpCount}</td>
        <td class="py-3 px-2 text-center">
          <input type="number" data-stat="${stat}" class="stat-enh-input input-field w-16 text-center font-mono text-xs" value="${enhVal}" min="0" max="10">
        </td>
        <td class="py-3 px-2 text-center font-mono font-bold text-base text-slate-100">${totalScore}</td>
        <td class="py-3 px-2 text-center font-mono font-bold text-base ${mod >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${modStr}</td>
      `;
      tbody.appendChild(tr);
    });

    // Render Point Buy Badge
    const spent = getTotalPointBuySpent(char.baseStats);
    const target = char.pointBuyTarget;
    pbSpentBadge.textContent = `${spent} / ${target} pts`;
    if (target !== 'custom' && spent > parseInt(target)) {
      pbSpentBadge.className = 'badge bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono text-xs';
    } else {
      pbSpentBadge.className = 'badge badge-amber font-mono text-xs';
    }

    // Render Stat Bumps Selectors
    bumpsContainer.innerHTML = '';
    [4, 8, 12, 16, 20].forEach(lvl => {
      const selectedStat = (char.levelBumps || {})[lvl] || 'str';
      const div = document.createElement('div');
      div.className = 'flex items-center justify-between text-xs bg-slate-950/60 p-2 rounded-lg border border-slate-800';
      div.innerHTML = `
        <span class="text-slate-300 font-semibold font-mono">Level ${lvl} Bump:</span>
        <select data-bump-lvl="${lvl}" class="bump-select bg-slate-900 text-amber-400 font-mono font-bold rounded px-2 py-1 border border-slate-700">
          ${ABILITY_NAMES.map(s => `<option value="${s}" ${s === selectedStat ? 'selected' : ''}>${s.toUpperCase()}</option>`).join('')}
        </select>
      `;
      bumpsContainer.appendChild(div);
    });
  }

  // Event Listeners
  tbody.addEventListener('change', e => {
    if (e.target.classList.contains('stat-base-input')) {
      const stat = e.target.dataset.stat;
      const val = parseInt(e.target.value) || 8;
      const char = store.get();
      char.baseStats[stat] = val;
      store.set({ baseStats: char.baseStats });
    } else if (e.target.classList.contains('stat-enh-input')) {
      const stat = e.target.dataset.stat;
      const val = parseInt(e.target.value) || 0;
      const char = store.get();
      char.enhancementMods[stat] = val;
      store.set({ enhancementMods: char.enhancementMods });
    }
  });

  bumpsContainer.addEventListener('change', e => {
    if (e.target.classList.contains('bump-select')) {
      const lvl = e.target.dataset.bumpLvl;
      const val = e.target.value;
      const char = store.get();
      char.levelBumps[lvl] = val;
      store.set({ levelBumps: char.levelBumps });
    }
  });

  pbTargetSelect.addEventListener('change', e => {
    store.set({ pointBuyTarget: e.target.value });
  });

  store.subscribe(render);
  render();
}
