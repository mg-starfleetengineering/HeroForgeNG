import { store } from '../store.js';
import { ALL_SKILLS, calculateTotalSkillPoints, isClassSkillForCharacter } from '../engine/skills.js';
import { getAbilityMod, calculateTotalScore } from '../engine/stats.js';

export function initSkillsTab(racesData, classesData) {
  const tbody = document.getElementById('skills-tbody');
  const pointsBadge = document.getElementById('skill-points-badge');

  function render() {
    const char = store.get();
    const raceObj = racesData.find(r => r.name === char.selectedRace) || {};
    
    const raceMods = {
      str: raceObj.strAdj || 0, dex: raceObj.dexAdj || 0, con: raceObj.conAdj || 0,
      int: raceObj.intAdj || 0, wis: raceObj.wisAdj || 0, cha: raceObj.chaAdj || 0
    };

    const intScore = calculateTotalScore('int', char.baseStats, raceMods, char.levelBumps || {}, char.enhancementMods || {});
    const intMod = getAbilityMod(intScore);
    const isHuman = char.selectedRace === 'Human';

    const totalBudget = calculateTotalSkillPoints(char.levelProgression, classesData, intMod, isHuman);
    
    // Spent points
    let spentPts = 0;
    for (const [sName, ranks] of Object.entries(char.skillRanks || {})) {
      const isClass = isClassSkillForCharacter(sName, char.levelProgression, classesData);
      spentPts += isClass ? ranks : ranks * 1; // 1pt per rank
    }

    pointsBadge.textContent = `${spentPts} / ${totalBudget} pts`;

    tbody.innerHTML = '';
    ALL_SKILLS.forEach(skill => {
      const isClass = isClassSkillForCharacter(skill.name, char.levelProgression, classesData);
      const ranks = (char.skillRanks || {})[skill.name] || 0;
      
      const abilityScore = calculateTotalScore(skill.keyAbility, char.baseStats, raceMods, char.levelBumps || {}, char.enhancementMods || {});
      const abMod = getAbilityMod(abilityScore);
      const totalMod = Math.floor(ranks) + abMod;
      const modStr = totalMod >= 0 ? `+${totalMod}` : `${totalMod}`;

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-800/40 transition-colors';
      tr.innerHTML = `
        <td class="py-2 px-2 text-center">
          ${isClass ? '<span class="badge badge-amber text-[10px]">CLASS</span>' : '<span class="text-slate-600 text-[10px] uppercase font-mono">CROSS</span>'}
        </td>
        <td class="py-2 px-2 font-semibold text-slate-200">${skill.name}</td>
        <td class="py-2 px-2 text-center uppercase font-mono text-amber-400 font-bold">${skill.keyAbility}</td>
        <td class="py-2 px-2 text-center font-mono text-slate-300">${abMod >= 0 ? '+' + abMod : abMod}</td>
        <td class="py-2 px-2 text-center">
          <input type="number" data-skill="${skill.name}" class="skill-rank-input input-field w-16 text-center font-mono py-1 text-xs" value="${ranks}" min="0" step="0.5">
        </td>
        <td class="py-2 px-2 text-center font-mono text-slate-400">+0</td>
        <td class="py-2 px-2 text-center font-mono font-bold text-sm ${totalMod >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${modStr}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  tbody.addEventListener('change', e => {
    if (e.target.classList.contains('skill-rank-input')) {
      const skillName = e.target.dataset.skill;
      const ranks = parseFloat(e.target.value) || 0;
      const char = store.get();
      const updatedRanks = { ...char.skillRanks, [skillName]: ranks };
      store.set({ skillRanks: updatedRanks });
    }
  });

  store.subscribe(render);
  render();
}
