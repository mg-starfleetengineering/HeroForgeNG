import { store } from '../store.js';

export function initRaceClassTab(racesData, classesData) {
  const selectRace = document.getElementById('select-race');
  const rdName = document.getElementById('rd-name');
  const rdType = document.getElementById('rd-type');
  const rdSpeed = document.getElementById('rd-speed');
  const rdMods = document.getElementById('rd-mods');
  const rdLa = document.getElementById('rd-la');
  const rdAbilities = document.getElementById('rd-abilities');
  const chkGestalt = document.getElementById('chk-gestalt');
  const levelsTbody = document.getElementById('levels-tbody');

  // Populate Race Options
  selectRace.innerHTML = racesData.map(r => `<option value="${r.name}">${r.name} (${r.type || 'Humanoid'})</option>`).join('');

  function render() {
    const char = store.get();

    // Update Race Selector value & Details Box
    selectRace.value = char.selectedRace;
    const raceObj = racesData.find(r => r.name === char.selectedRace) || racesData[0];
    if (raceObj) {
      rdName.textContent = raceObj.name;
      rdType.textContent = `${raceObj.size || 'Medium'} ${raceObj.type || 'Humanoid'}`;
      rdSpeed.textContent = `Base Speed: ${raceObj.speed ? raceObj.speed.land : 30} ft.`;
      
      const modsStr = [
        raceObj.strAdj ? `STR ${raceObj.strAdj > 0 ? '+' : ''}${raceObj.strAdj}` : null,
        raceObj.dexAdj ? `DEX ${raceObj.dexAdj > 0 ? '+' : ''}${raceObj.dexAdj}` : null,
        raceObj.conAdj ? `CON ${raceObj.conAdj > 0 ? '+' : ''}${raceObj.conAdj}` : null,
        raceObj.intAdj ? `INT ${raceObj.intAdj > 0 ? '+' : ''}${raceObj.intAdj}` : null,
        raceObj.wisAdj ? `WIS ${raceObj.wisAdj > 0 ? '+' : ''}${raceObj.wisAdj}` : null,
        raceObj.chaAdj ? `CHA ${raceObj.chaAdj > 0 ? '+' : ''}${raceObj.chaAdj}` : null
      ].filter(Boolean).join(', ') || 'None';

      rdMods.textContent = `Stat Adjustments: ${modsStr}`;
      rdLa.textContent = `Level Adjustment: +${raceObj.levelAdj || 0}`;
      rdAbilities.textContent = raceObj.specialAbilities || raceObj.automaticLanguages || 'Racial Traits Active.';
    }

    // Toggle Gestalt UI
    chkGestalt.checked = char.isGestalt;
    document.querySelectorAll('.gestalt-col').forEach(el => {
      if (char.isGestalt) el.classList.remove('hidden');
      else el.classList.add('hidden');
    });

    // Render Levels 1 - 20
    levelsTbody.innerHTML = '';
    for (let l = 1; l <= 20; l++) {
      const lvlData = char.levelProgression.find(item => item.level === l) || { level: l, primaryClass: '', secondaryClass: '', hpRoll: 0 };
      const primaryClsObj = classesData.find(c => c.name === lvlData.primaryClass);
      const secondaryClsObj = classesData.find(c => c.name === lvlData.secondaryClass);

      let hd = primaryClsObj ? primaryClsObj.hitDie : 6;
      if (char.isGestalt && secondaryClsObj) hd = Math.max(hd, secondaryClsObj.hitDie);

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-800/40 transition-colors';
      tr.innerHTML = `
        <td class="py-2 px-2 text-center text-amber-400 font-bold">${l}</td>
        <td class="py-2 px-2">
          <select data-lvl="${l}" data-field="primaryClass" class="lvl-class-select input-field text-xs py-1">
            <option value="">-- None --</option>
            ${classesData.map(c => `<option value="${c.name}" ${c.name === lvlData.primaryClass ? 'selected' : ''}>${c.name} (d${c.hitDie})</option>`).join('')}
          </select>
        </td>
        <td class="py-2 px-2 gestalt-col ${char.isGestalt ? '' : 'hidden'}">
          <select data-lvl="${l}" data-field="secondaryClass" class="lvl-class-select input-field text-xs py-1">
            <option value="">-- None --</option>
            ${classesData.map(c => `<option value="${c.name}" ${c.name === lvlData.secondaryClass ? 'selected' : ''}>${c.name} (d${c.hitDie})</option>`).join('')}
          </select>
        </td>
        <td class="py-2 px-2 text-center text-slate-300">d${hd}</td>
        <td class="py-2 px-2 text-center">
          <input type="number" data-lvl="${l}" data-field="hpRoll" class="lvl-hp-input input-field text-xs py-1 text-center font-mono w-14" value="${lvlData.hpRoll || (l === 1 ? hd : Math.floor(hd/2)+1)}">
        </td>
        <td class="py-2 px-2 text-center text-slate-400">--</td>
        <td class="py-2 px-2 text-center text-slate-400">--</td>
      `;
      levelsTbody.appendChild(tr);
    }
  }

  // Event Listeners
  selectRace.addEventListener('change', e => {
    store.set({ selectedRace: e.target.value });
  });

  chkGestalt.addEventListener('change', e => {
    store.set({ isGestalt: e.target.checked });
  });

  levelsTbody.addEventListener('change', e => {
    const lvl = parseInt(e.target.dataset.lvl);
    const field = e.target.dataset.field;
    let val = e.target.value;
    if (field === 'hpRoll') val = parseInt(val) || 0;

    const char = store.get();
    let prog = [...char.levelProgression];
    let idx = prog.findIndex(p => p.level === lvl);
    if (idx === -1) {
      prog.push({ level: lvl, primaryClass: '', secondaryClass: '', hpRoll: 0 });
      idx = prog.length - 1;
    }
    prog[idx][field] = val;
    store.set({ levelProgression: prog });
  });

  store.subscribe(render);
  render();
}
