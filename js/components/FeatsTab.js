import { store } from '../store.js';

export function initFeatsTab(featsData) {
  const slotsContainer = document.getElementById('feat-slots-container');
  const featsListContainer = document.getElementById('feats-list-container');
  const searchInput = document.getElementById('feat-search-input');

  let searchQuery = '';

  function renderActiveFeats() {
    const char = store.get();
    slotsContainer.innerHTML = '';

    if (!char.selectedFeats || char.selectedFeats.length === 0) {
      slotsContainer.innerHTML = `<p class="text-xs text-slate-500 italic p-3 text-center bg-slate-950/40 rounded-xl">No feats selected yet. Select feats from the library.</p>`;
      return;
    }

    char.selectedFeats.forEach(featName => {
      const featObj = featsData.find(f => f.name === featName) || { name: featName, description: 'Selected feat.' };

      const card = document.createElement('div');
      card.className = 'p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs gap-3';
      card.innerHTML = `
        <div class="flex-1 min-w-0">
          <span class="font-bold text-amber-400 block truncate">${featObj.name}</span>
          <p class="text-[11px] text-slate-400 truncate">${featObj.description || 'No description'}</p>
        </div>
        <button data-remove-feat="${featObj.name}" class="btn-remove-feat text-slate-500 hover:text-rose-400 p-1">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      `;
      slotsContainer.appendChild(card);
    });
  }

  function renderLibrary() {
    const char = store.get();
    featsListContainer.innerHTML = '';

    const filtered = featsData.filter(f => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return f.name.toLowerCase().includes(q) || 
             (f.prerequisites && f.prerequisites.toLowerCase().includes(q)) || 
             (f.description && f.description.toLowerCase().includes(q));
    }).slice(0, 80); // Paginate first 80 matches for performance

    filtered.forEach(feat => {
      const isSelected = (char.selectedFeats || []).includes(feat.name);

      const div = document.createElement('div');
      div.className = `p-4 rounded-xl border transition-all text-xs space-y-2 ${isSelected ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'}`;
      div.innerHTML = `
        <div class="flex items-center justify-between gap-2">
          <span class="font-bold text-sm text-slate-100">${feat.name}</span>
          <div class="flex items-center gap-2">
            <span class="badge bg-slate-800 text-slate-400 font-mono text-[10px]">${feat.source || 'PH'}</span>
            <button data-add-feat="${feat.name}" class="btn-add-feat btn ${isSelected ? 'btn-secondary text-rose-400' : 'btn-primary'} text-[11px] py-1 px-3">
              ${isSelected ? '<i class="fa-solid fa-check"></i> Added' : '<i class="fa-solid fa-plus"></i> Select'}
            </button>
          </div>
        </div>
        ${feat.prerequisites ? `<p class="text-amber-400/90 text-[11px]"><span class="font-bold">Prereq:</span> ${feat.prerequisites}</p>` : ''}
        <p class="text-slate-300 text-[11px] leading-relaxed">${feat.description}</p>
      `;
      featsListContainer.appendChild(div);
    });
  }

  // Event Listeners
  searchInput.addEventListener('input', e => {
    searchQuery = e.target.value;
    renderLibrary();
  });

  slotsContainer.addEventListener('click', e => {
    const btn = e.target.closest('.btn-remove-feat');
    if (btn) {
      const featName = btn.dataset.removeFeat;
      const char = store.get();
      const updated = (char.selectedFeats || []).filter(f => f !== featName);
      store.set({ selectedFeats: updated });
    }
  });

  featsListContainer.addEventListener('click', e => {
    const btn = e.target.closest('.btn-add-feat');
    if (btn) {
      const featName = btn.dataset.addFeat;
      const char = store.get();
      let updated = [...(char.selectedFeats || [])];
      if (updated.includes(featName)) {
        updated = updated.filter(f => f !== featName);
      } else {
        updated.push(featName);
      }
      store.set({ selectedFeats: updated });
    }
  });

  store.subscribe(() => {
    renderActiveFeats();
    renderLibrary();
  });

  renderActiveFeats();
  renderLibrary();
}
