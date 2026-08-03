import { store } from '../store.js';

export function initSpellsTab(classesData) {
  const slotsGrid = document.getElementById('spells-slots-grid');

  function render() {
    const char = store.get();
    
    // Check if character has spellcasting classes
    const activeClasses = char.levelProgression.map(l => l.primaryClass).filter(Boolean);
    const hasCaster = activeClasses.some(clsName => {
      const cls = classesData.find(c => c.name === clsName);
      return cls && cls.bonusCaster;
    });

    slotsGrid.innerHTML = '';

    if (!hasCaster) {
      slotsGrid.innerHTML = `
        <div class="p-4 bg-slate-900/60 rounded-xl text-slate-400 text-xs text-center border border-slate-800 font-mono w-full">
          No spellcasting or manifesting classes selected. Select Cleric, Wizard, Sorcerer, Druid, etc. to view spell slots.
        </div>
      `;
      return;
    }

    // Render spell slots 0 to 9
    for (let lvl = 0; lvl <= 9; lvl++) {
      const div = document.createElement('div');
      div.className = 'p-3 rounded-xl bg-slate-900 border border-slate-800 text-center w-24 space-y-1';
      div.innerHTML = `
        <span class="text-[10px] text-slate-400 uppercase font-mono block">Level ${lvl}</span>
        <span class="font-mono text-lg font-bold text-amber-400">${lvl === 0 ? '3' : (10 - lvl)}</span>
        <span class="text-[10px] text-slate-500 block">per day</span>
      `;
      slotsGrid.appendChild(div);
    }
  }

  store.subscribe(render);
  render();
}
