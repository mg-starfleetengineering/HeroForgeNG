import { store } from '../store.js';
import { calculateBAB } from '../engine/classes.js';
import { getAbilityMod, calculateTotalScore } from '../engine/stats.js';

export function initEquipmentTab(weaponsData, racesData, classesData) {
  const selectPrimaryWeapon = document.getElementById('select-primary-weapon');
  const wpnName = document.getElementById('wpn-name');
  const wpnAttackBonus = document.getElementById('wpn-attack-bonus');
  const wpnDmg = document.getElementById('wpn-dmg');
  const wpnCrit = document.getElementById('wpn-crit');
  const wpnType = document.getElementById('wpn-type');

  const selectArmor = document.getElementById('select-armor');
  const armorEnh = document.getElementById('armor-enhancement');
  const selectShield = document.getElementById('select-shield');
  const shieldEnh = document.getElementById('shield-enhancement');

  const acDeflection = document.getElementById('ac-deflection');
  const acNatural = document.getElementById('ac-natural');
  const acDodge = document.getElementById('ac-dodge');

  // Populate Weapon Dropdown
  selectPrimaryWeapon.innerHTML = weaponsData.map(w => `<option value="${w.name}">${w.name} (${w.damageM}, ${w.type})</option>`).join('');

  function render() {
    const char = store.get();
    const eq = char.equipment || {};

    selectPrimaryWeapon.value = eq.primaryWeapon || 'Longsword';
    selectArmor.value = eq.armor || 'chainshirt';
    armorEnh.value = eq.armorEnhancement || 0;
    selectShield.value = eq.shield || 'heavy_shield';
    shieldEnh.value = eq.shieldEnhancement || 0;
    acDeflection.value = eq.deflection || 0;
    acNatural.value = eq.natural || 0;
    acDodge.value = eq.dodge || 0;

    // Calculate Attack Routine
    const raceObj = racesData.find(r => r.name === char.selectedRace) || {};
    const raceMods = {
      str: raceObj.strAdj || 0, dex: raceObj.dexAdj || 0, con: raceObj.conAdj || 0,
      int: raceObj.intAdj || 0, wis: raceObj.wisAdj || 0, cha: raceObj.chaAdj || 0
    };

    const strScore = calculateTotalScore('str', char.baseStats, raceMods, char.levelBumps || {}, char.enhancementMods || {});
    const strMod = getAbilityMod(strScore);
    const bab = calculateBAB(char.levelProgression, classesData);

    const wpnObj = weaponsData.find(w => w.name === (eq.primaryWeapon || 'Longsword')) || weaponsData[0];
    if (wpnObj) {
      wpnName.textContent = wpnObj.name;
      
      const totalMeleeAtk = bab + strMod;
      wpnAttackBonus.textContent = `${totalMeleeAtk >= 0 ? '+' : ''}${totalMeleeAtk} Melee`;
      
      const dmgBonus = strMod >= 0 ? `+${strMod}` : `${strMod}`;
      wpnDmg.textContent = `${wpnObj.damageM}${strMod !== 0 ? dmgBonus : ''}`;
      
      const threatStr = wpnObj.threat < 20 ? `${wpnObj.threat}-20` : '20';
      wpnCrit.textContent = `${threatStr}/x${wpnObj.critMultiplier || 2}`;
      wpnType.textContent = wpnObj.type || 'Slashing';
    }
  }

  // Event Listeners
  selectPrimaryWeapon.addEventListener('change', e => {
    store.update('equipment.primaryWeapon', e.target.value);
  });

  selectArmor.addEventListener('change', e => {
    store.update('equipment.armor', e.target.value);
  });

  armorEnh.addEventListener('change', e => {
    store.update('equipment.armorEnhancement', parseInt(e.target.value) || 0);
  });

  selectShield.addEventListener('change', e => {
    store.update('equipment.shield', e.target.value);
  });

  shieldEnh.addEventListener('change', e => {
    store.update('equipment.shieldEnhancement', parseInt(e.target.value) || 0);
  });

  acDeflection.addEventListener('change', e => {
    store.update('equipment.deflection', parseInt(e.target.value) || 0);
  });

  acNatural.addEventListener('change', e => {
    store.update('equipment.natural', parseInt(e.target.value) || 0);
  });

  acDodge.addEventListener('change', e => {
    store.update('equipment.dodge', parseInt(e.target.value) || 0);
  });

  store.subscribe(render);
  render();
}
