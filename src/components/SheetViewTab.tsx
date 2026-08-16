import React from 'react';
import { CharacterState, RaceData, ClassData, WeaponData, Equipment, TraitData, FlawData, TemplateData, DomainData, DeityData } from '../types/character';
import {
  calculateTotalScore,
  getAbilityMod,
  parseRaceMods,
  calculateTraitFlawStatMods,
  calculateTraitFlawSaveMods,
  calculateTraitFlawHpPerLevel,
  calculateTraitFlawAcMod,
  calculateTraitFlawInitiativeMod,
  calculateTotalSpeed,
  calculateTraitFlawSkillMods
} from '../engine/stats';
import { calculateBAB, calculateBaseSave, calculateTotalHP } from '../engine/classes';
import {
  resolveWeapon, resolveArmor, resolveShield, calculateFeatCombatBonuses,
  calculateCarryingCapacity, calculateCoinWeight, calculateTotalNetWorthGP,
  calculateTotalCarriedWeight, getEncumbranceStatus
} from '../engine/equipment';
import {
  getAvailableSkills,
  isClassSkillForCharacter,
  calculatePerceptionStats
} from '../engine/skills';
import { TacticalCombatWidget } from './TacticalCombatWidget';
import {
  getTacticalCombatState,
  calculateTacticalCombatModifiers,
  generateFullAttackSequence,
  calculateGrappleModifier,
  getGrappleAttackEntry,
  getActiveCombatModifiers,
  isTwoHandedWeapon
} from '../engine/combat';
import { calculateTotalDR } from '../engine/dr';
import { calculateTotalSR } from '../engine/sr';

interface SheetViewTabProps {
  character: CharacterState;
  racesData: RaceData[];
  classesData: ClassData[];
  weaponsData: WeaponData[];
  templatesData?: TemplateData[];
  traitsData?: TraitData[];
  flawsData?: FlawData[];
  domainsData?: DomainData[];
  deitiesData?: DeityData[];
  onChange?: (updated: Partial<CharacterState>) => void;
}

export const SheetViewTab: React.FC<SheetViewTabProps> = ({
  character,
  racesData,
  classesData,
  weaponsData,
  templatesData = [],
  traitsData = [],
  flawsData = [],
  domainsData = [],
  deitiesData = [],
  onChange
}) => {
  const raceObj: Partial<RaceData> = racesData.find(r => r.name === character.selectedRace) || {};
  const templateObj: Partial<TemplateData> | undefined = templatesData.find(t => t.name === character.selectedTemplate || t.id === character.selectedTemplate);
  const raceMods = parseRaceMods(raceObj);

  const selectedTraits = character.selectedTraits || [];
  const selectedFlaws = character.selectedFlaws || [];

  const traitFlawStatMods = calculateTraitFlawStatMods(selectedTraits, selectedFlaws, traitsData, flawsData);
  const traitFlawSaveMods = calculateTraitFlawSaveMods(selectedTraits, selectedFlaws, traitsData, flawsData);
  const traitFlawHpMod = calculateTraitFlawHpPerLevel(selectedTraits, selectedFlaws, traitsData, flawsData);
  const traitFlawAcMod = calculateTraitFlawAcMod(selectedTraits, selectedFlaws, traitsData, flawsData);
  const traitFlawInitMod = calculateTraitFlawInitiativeMod(selectedTraits, selectedFlaws, traitsData, flawsData);

  const speedData = calculateTotalSpeed(character, raceObj, templateObj, traitsData, flawsData);
  const drSummary = calculateTotalDR(character, raceObj, templateObj, [], classesData);
  const srSummary = calculateTotalSR(character, raceObj, templateObj, [], classesData);

  const totalLevel = character.levelProgression.filter(l => l.primaryClass).length || 1;
  const strScore = calculateTotalScore('str', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel, traitFlawStatMods);
  const dexScore = calculateTotalScore('dex', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel, traitFlawStatMods);
  const conScore = calculateTotalScore('con', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel, traitFlawStatMods);
  const intScore = calculateTotalScore('int', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel, traitFlawStatMods);
  const wisScore = calculateTotalScore('wis', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel, traitFlawStatMods);
  const chaScore = calculateTotalScore('cha', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel, traitFlawStatMods);

  const strMod = getAbilityMod(strScore);
  const dexMod = getAbilityMod(dexScore);
  const conMod = getAbilityMod(conScore);
  const intMod = getAbilityMod(intScore);
  const wisMod = getAbilityMod(wisScore);
  const chaMod = getAbilityMod(chaScore);

  const bab = calculateBAB(character.levelProgression, classesData);
  const tcState = getTacticalCombatState(character, bab);
  const generalTcMods = calculateTacticalCombatModifiers(tcState);
  const activeCombatMods = getActiveCombatModifiers(tcState, totalLevel);

  const effectiveStrScore = strScore + (generalTcMods.strBonus || 0);
  const effectiveConScore = conScore + (generalTcMods.conBonus || 0);

  const effectiveStrMod = getAbilityMod(effectiveStrScore);
  const effectiveConMod = getAbilityMod(effectiveConScore);

  const hp = calculateTotalHP(character.levelProgression, classesData, effectiveConMod, traitFlawHpMod);

  const baseFort = calculateBaseSave('fort', character.levelProgression, classesData);
  const baseRef = calculateBaseSave('ref', character.levelProgression, classesData);
  const baseWill = calculateBaseSave('will', character.levelProgression, classesData);

  const totalFort = baseFort + effectiveConMod + traitFlawSaveMods.fort + generalTcMods.fortSaveMod;
  const totalRef = baseRef + dexMod + traitFlawSaveMods.ref + generalTcMods.refSaveMod;
  const totalWill = baseWill + wisMod + traitFlawSaveMods.will + generalTcMods.willSaveMod;

  const totalInitiative = dexMod + traitFlawInitMod;

  const finalSpeed = speedData.land + generalTcMods.speedMod;

  const eq: Equipment = character.equipment || {
    armor: 'chainshirt', armorEnhancement: 1, shield: 'heavy_shield', shieldEnhancement: 1,
    deflection: 0, natural: 0, dodge: 0, primaryWeapon: 'Longsword'
  };

  const funds = character.funds || { cp: 0, sp: 0, gp: 0, pp: 0, otherValuables: 0 };
  const inventory = character.inventory || [];

  const carryingCapacity = calculateCarryingCapacity(strScore + generalTcMods.strBonus, raceObj.size || 'Medium');
  const totalCarriedWeight = calculateTotalCarriedWeight(character, weaponsData);
  const coinWeight = calculateCoinWeight(funds);
  const netWorthGP = calculateTotalNetWorthGP(funds);
  const encumbrance = getEncumbranceStatus(totalCarriedWeight, carryingCapacity);

  const customWeapons = character.customWeapons || [];
  const customArmors = character.customArmors || [];

  const usePathfinder = !!character.usePathfinderPerception;
  const traitFlawSkillMods = calculateTraitFlawSkillMods(selectedTraits, selectedFlaws, traitsData, flawsData, usePathfinder);
  const activeSkills = getAvailableSkills(usePathfinder);

  const calculatedSkills = activeSkills.map(skill => {
    const isClass = isClassSkillForCharacter(skill.name, character.levelProgression, classesData);
    const ranks = (character.skillRanks || {})[skill.name] || 0;
    const abilityScore = calculateTotalScore(skill.keyAbility, character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel, traitFlawStatMods);
    const abMod = getAbilityMod(abilityScore) + (skill.keyAbility === 'str' ? Math.floor(generalTcMods.strBonus / 2) : (skill.keyAbility === 'con' ? Math.floor(generalTcMods.conBonus / 2) : 0));
    const tfSkillMod = traitFlawSkillMods[skill.name] || 0;

    let totalMod = Math.floor(ranks) + abMod + tfSkillMod;
    if (skill.name === 'Perception') {
      const percStats = calculatePerceptionStats(character, classesData, abMod);
      totalMod = percStats.totalBonus + tfSkillMod;
    }

    return {
      name: skill.name,
      keyAbility: skill.keyAbility.toUpperCase(),
      isClass,
      ranks,
      totalMod
    };
  });

  const halfIndex = Math.ceil(calculatedSkills.length / 2);
  const leftSkills = calculatedSkills.slice(0, halfIndex);
  const rightSkills = calculatedSkills.slice(halfIndex);

  const armorObj = resolveArmor(eq.armor, customArmors);
  const shieldObj = resolveShield(eq.shield, customArmors);

  const armorAc = armorObj.acBonus + (eq.armorEnhancement || 0);
  const shieldAc = shieldObj.acBonus + (eq.shieldEnhancement || 0);

  const totalAc = 10 + armorAc + shieldAc + dexMod + (eq.deflection || 0) + (eq.natural || 0) + (eq.dodge || 0) + traitFlawAcMod + generalTcMods.acNetMod;
  const touchAc = 10 + dexMod + (eq.deflection || 0) + (eq.dodge || 0) + traitFlawAcMod + generalTcMods.touchAcMod;
  const flatAc = 10 + armorAc + shieldAc + (eq.deflection || 0) + (eq.natural || 0) + traitFlawAcMod + generalTcMods.flatAcMod;

  // Weapon Resolutions & Feat Combat Bonuses
  const activeWeaponsList: Array<{
    label: string;
    weapon: WeaponData;
    attackBonus: number;
    fullSeq: string;
    damageStr: string;
    critStr: string;
    type: string;
    featAtkBonus: number;
    featDmgBonus: number;
    tacticalNote?: string;
  }> = [];

  // 1. Primary Weapon
  if (eq.primaryWeapon) {
    const primaryWpn = resolveWeapon(eq.primaryWeapon, customWeapons, weaponsData);
    const featBonuses = calculateFeatCombatBonuses(character, primaryWpn);
    const wMods = calculateTacticalCombatModifiers(tcState, primaryWpn, false, false);
    const enh = eq.primaryWeaponEnhancement || 0;
    const netAtkBonus = effectiveStrMod + enh + featBonuses.attackBonus + wMods.attackMod;
    const totalAtk = bab + netAtkBonus;
    const fullSeq = generateFullAttackSequence(bab, netAtkBonus, tcState.haste, tcState.flurryOfBlows, tcState.whirlingFrenzy);
    const dmgVal = effectiveStrMod + enh + featBonuses.damageBonus + wMods.damageMod;

    const primaryNote = (() => {
      const notes: string[] = [];
      if (tcState.whirlingFrenzy) { notes.push('Whirling Frenzy: +2 Str, -2 Flurry, +1 Extra Atk'); }
      else if (tcState.rage) { notes.push('Barbarian Rage: +2 Str'); }
      if (tcState.flurryOfBlows && !tcState.whirlingFrenzy) { notes.push('Flurry: -2 Atk, +1 Extra Atk'); }
      if (tcState.haste) { notes.push('Haste: +1 Atk, +1 Extra Atk'); }
      if (tcState.powerAttack > 0) {
        const is2H = isTwoHandedWeapon(primaryWpn);
        notes.push(`Power Attack (-${tcState.powerAttack}): +${is2H ? tcState.powerAttack * 2 : tcState.powerAttack} Dmg`);
      }
      if (tcState.combatExpertise > 0) { notes.push(`Combat Exp: -${tcState.combatExpertise} Atk`); }
      if (tcState.fightingDefensively) { notes.push('Fight Defensively: -4 Atk'); }
      return notes.length > 0 ? `(${notes.join(' • ')})` : '';
    })();

    activeWeaponsList.push({
      label: 'Primary',
      weapon: primaryWpn,
      attackBonus: totalAtk,
      fullSeq,
      damageStr: `${primaryWpn.damageM}${dmgVal >= 0 ? `+${dmgVal}` : dmgVal}`,
      critStr: `${primaryWpn.threat < 20 ? `${primaryWpn.threat}-20` : '20'}/x${primaryWpn.critMultiplier || 2}`,
      type: primaryWpn.type || 'Slashing',
      featAtkBonus: featBonuses.attackBonus,
      featDmgBonus: featBonuses.damageBonus,
      tacticalNote: primaryNote
    });
  }

  // 2. Secondary Weapon
  if (eq.secondaryWeapon && eq.secondaryWeapon !== 'none') {
    const secWpn = resolveWeapon(eq.secondaryWeapon, customWeapons, weaponsData);
    const featBonuses = calculateFeatCombatBonuses(character, secWpn);
    const wMods = calculateTacticalCombatModifiers(tcState, secWpn, true, false);
    const enh = eq.secondaryWeaponEnhancement || 0;
    const netAtkBonus = effectiveStrMod + enh + featBonuses.attackBonus + wMods.attackMod;
    const totalAtk = bab + netAtkBonus;
    const fullSeq = generateFullAttackSequence(bab, netAtkBonus, tcState.haste, tcState.flurryOfBlows, tcState.whirlingFrenzy);
    const dmgVal = Math.floor(effectiveStrMod / 2) + enh + featBonuses.damageBonus + wMods.damageMod;

    const secNote = (() => {
      const notes: string[] = [];
      if (tcState.whirlingFrenzy) { notes.push('Whirling Frenzy: +2 Str, -2 Flurry, +1 Extra Atk'); }
      else if (tcState.rage) { notes.push('Barbarian Rage: +2 Str'); }
      if (tcState.flurryOfBlows && !tcState.whirlingFrenzy) { notes.push('Flurry: -2 Atk, +1 Extra Atk'); }
      if (tcState.haste) { notes.push('Haste: +1 Atk, +1 Extra Atk'); }
      if (tcState.powerAttack > 0) { notes.push(`Power Attack: -${tcState.powerAttack} Atk`); }
      if (tcState.combatExpertise > 0) { notes.push(`Combat Exp: -${tcState.combatExpertise} Atk`); }
      if (tcState.fightingDefensively) { notes.push('Fight Defensively: -4 Atk'); }
      return notes.length > 0 ? `(${notes.join(' • ')})` : '';
    })();

    activeWeaponsList.push({
      label: 'Off-Hand',
      weapon: secWpn,
      attackBonus: totalAtk,
      fullSeq,
      damageStr: `${secWpn.damageM}${dmgVal >= 0 ? `+${dmgVal}` : dmgVal}`,
      critStr: `${secWpn.threat < 20 ? `${secWpn.threat}-20` : '20'}/x${secWpn.critMultiplier || 2}`,
      type: secWpn.type || 'Slashing',
      featAtkBonus: featBonuses.attackBonus,
      featDmgBonus: featBonuses.damageBonus,
      tacticalNote: secNote
    });
  }

  // 3. Ranged Weapon
  if (eq.rangedWeapon && eq.rangedWeapon !== 'none') {
    const rngWpn = resolveWeapon(eq.rangedWeapon, customWeapons, weaponsData);
    const featBonuses = calculateFeatCombatBonuses(character, rngWpn);
    const wMods = calculateTacticalCombatModifiers(tcState, rngWpn, false, true);
    const enh = eq.rangedWeaponEnhancement || 0;
    const netAtkBonus = dexMod + enh + featBonuses.attackBonus + wMods.attackMod;
    const totalAtk = bab + netAtkBonus;
    const fullSeq = generateFullAttackSequence(bab, netAtkBonus, tcState.haste, tcState.flurryOfBlows, tcState.whirlingFrenzy);
    const dmgVal = enh + wMods.damageMod;

    const rngNote = (() => {
      const notes: string[] = [];
      if (tcState.whirlingFrenzy) { notes.push('Whirling Frenzy: -2 Flurry, +1 Extra Atk'); }
      if (tcState.flurryOfBlows && !tcState.whirlingFrenzy) { notes.push('Flurry: -2 Atk, +1 Extra Atk'); }
      if (tcState.haste) { notes.push('Haste: +1 Atk, +1 Extra Atk'); }
      if (tcState.combatExpertise > 0) { notes.push(`Combat Exp: -${tcState.combatExpertise} Atk`); }
      if (tcState.fightingDefensively) { notes.push('Fight Defensively: -4 Atk'); }
      return notes.length > 0 ? `(${notes.join(' • ')})` : '';
    })();

    activeWeaponsList.push({
      label: 'Ranged',
      weapon: rngWpn,
      attackBonus: totalAtk,
      fullSeq,
      damageStr: `${rngWpn.damageM}${dmgVal > 0 ? `+${dmgVal}` : (dmgVal < 0 ? `${dmgVal}` : '')}`,
      critStr: `${rngWpn.threat < 20 ? `${rngWpn.threat}-20` : '20'}/x${rngWpn.critMultiplier || 2}`,
      type: rngWpn.type || 'Piercing',
      featAtkBonus: featBonuses.attackBonus,
      featDmgBonus: featBonuses.damageBonus,
      tacticalNote: rngNote
    });
  }

  // 4. Special Maneuver: Grapple
  const grappleCalc = calculateGrappleModifier(character, bab, effectiveStrMod, raceObj, templateObj);
  const grappleEntry = getGrappleAttackEntry(character, bab, effectiveStrMod, tcState, raceObj, templateObj);
  activeWeaponsList.push(grappleEntry);

  const classMap: Record<string, number> = {};
  character.levelProgression.forEach(l => {
    if (l.primaryClass) classMap[l.primaryClass] = (classMap[l.primaryClass] || 0) + 1;
  });
  const classSummary = Object.entries(classMap).map(([c, count]) => `${c} ${count}`).join(' / ') || 'None 1';

  const renderHeader = () => (
    <div className="border-b-2 border-slate-900 pb-3 print:pb-1.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3.5 print:gap-2.5">
        {character.portraitUrl ? (
          <div className="w-14 h-14 min-w-[3.5rem] min-h-[3.5rem] max-w-[3.5rem] max-h-[3.5rem] print:w-11 print:h-11 print:min-w-[2.75rem] print:min-h-[2.75rem] print:max-w-[2.75rem] print:max-h-[2.75rem] rounded-xl border-2 border-slate-900 overflow-hidden shrink-0 shadow bg-slate-100">
            <img
              src={character.portraitUrl}
              alt={character.name}
              className="w-full h-full object-cover object-top"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        ) : (
          <div className="w-14 h-14 min-w-[3.5rem] min-h-[3.5rem] max-w-[3.5rem] max-h-[3.5rem] print:w-11 print:h-11 print:min-w-[2.75rem] print:min-h-[2.75rem] print:max-w-[2.75rem] print:max-h-[2.75rem] rounded-xl border-2 border-slate-300 bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
            <i className="fa-solid fa-user-shield text-2xl print:text-lg"></i>
          </div>
        )}
        <div>
          <h1 className="text-2xl print:text-xl font-extrabold font-heading text-slate-900 leading-tight">{character.name || 'Unnamed Hero'}</h1>
          <p className="text-xs print:text-[10px] text-slate-600 font-semibold uppercase tracking-wider">
            {character.raceOverride?.trim() || character.selectedRace || 'Human'} &bull; {classSummary} &bull; Level {totalLevel}
          </p>
        </div>
      </div>
      <div className="text-right text-xs print:text-[10.5px] text-slate-600 shrink-0 leading-tight">
        <p><span className="font-bold">Player:</span> {character.player || 'Shadow'}</p>
        <p><span className="font-bold">Alignment:</span> {character.alignment || 'True Neutral'}</p>
        <p><span className="font-bold">Deity:</span> {character.deity || 'Pelor'}</p>
      </div>
    </div>
  );

  return (
    <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-4 print:bg-transparent print:backdrop-blur-none print:border-none print:shadow-none print:p-0 print:space-y-0">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 print:hidden">
        <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
          <i className="fa-solid fa-scroll text-amber-500"></i> Printable Character Sheet View
        </h2>
        <button onClick={() => window.print()} className="btn btn-primary text-xs">
          <i className="fa-solid fa-print"></i> Print / Export PDF
        </button>
      </div>

      {onChange && (
        <div className="print:hidden">
          <TacticalCombatWidget character={character} bab={bab} onChange={onChange} />
        </div>
      )}

      <div id="printable-character-sheet" className="bg-white text-slate-900 p-8 rounded-xl shadow-2xl space-y-4 font-sans print:p-0 print:shadow-none print:rounded-none print:border-none print:space-y-2.5">
        {/* Page 1 Header */}
        {renderHeader()}

        {/* Vitals Banner - strictly 1 row of 6 columns */}
        <div className="grid grid-cols-6 gap-2 print:gap-1.5 text-center font-mono py-2.5 print:py-1.5 bg-slate-100 rounded-lg border border-slate-300 print:break-inside-avoid">
          <div>
            <span className="text-[10px] print:text-[9.5px] text-slate-500 block uppercase font-sans font-bold">Hit Points</span>
            <span className="text-xl print:text-lg font-bold text-slate-900">{hp}</span>
            {generalTcMods.hpBonusPerLevel > 0 && (
              <span className="text-[9px] print:text-[8px] text-rose-700 block font-sans font-semibold leading-tight">
                +{generalTcMods.hpBonusPerLevel * totalLevel} HP (Rage)
              </span>
            )}
          </div>
          <div>
            <span className="text-[10px] print:text-[9.5px] text-slate-500 block uppercase font-sans font-bold">Armor Class</span>
            <span className="text-xl print:text-lg font-bold text-slate-900">{totalAc}</span>
            <span className="text-[10px] print:text-[8.5px] text-slate-500 block leading-tight">Touch {touchAc} / FF {flatAc}</span>
            {generalTcMods.acNetMod !== 0 && (
              <span className={`text-[9px] print:text-[8px] block font-sans font-semibold leading-tight ${generalTcMods.acNetMod > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {generalTcMods.acNetMod > 0 ? `+${generalTcMods.acNetMod}` : generalTcMods.acNetMod} AC ({[
                  tcState.whirlingFrenzy ? '+2 Frenzy' : '',
                  tcState.haste ? '+1 Haste' : '',
                  tcState.combatExpertise > 0 ? `+${tcState.combatExpertise} CE` : '',
                  tcState.fightingDefensively ? '+2 Def' : '',
                  tcState.rage ? '-2 Rage' : ''
                ].filter(Boolean).join(', ')})
              </span>
            )}
          </div>
          <div>
            <span className="text-[10px] print:text-[9.5px] text-slate-500 block uppercase font-sans font-bold">Damage Red.</span>
            <span className="text-xl print:text-lg font-bold text-amber-700">{drSummary.bestDRString}</span>
            <span className="text-[10px] print:text-[8.5px] text-slate-500 block leading-tight">{srSummary.hasSR ? srSummary.bestSRString : 'SR None'}</span>
          </div>
          <div>
            <span className="text-[10px] print:text-[9.5px] text-slate-500 block uppercase font-sans font-bold">Initiative</span>
            <span className="text-xl print:text-lg font-bold text-slate-900">{totalInitiative >= 0 ? '+' : ''}{totalInitiative}</span>
          </div>
          <div>
            <span className="text-[10px] print:text-[9.5px] text-slate-500 block uppercase font-sans font-bold">Base Attack</span>
            <span className="text-xl print:text-lg font-bold text-slate-900">+{bab}</span>
            <span className="text-[10px] print:text-[8.5px] text-slate-500 block leading-tight">
              Grapple {grappleCalc.total >= 0 ? `+${grappleCalc.total}` : grappleCalc.total}
              {generalTcMods.strBonus > 0 && <span className="text-rose-700 text-[8.5px] ml-0.5">(+{Math.floor(generalTcMods.strBonus / 2)} Str)</span>}
            </span>
          </div>
          <div>
            <span className="text-[10px] print:text-[9.5px] text-slate-500 block uppercase font-sans font-bold">Speed</span>
            <span className="text-xl print:text-lg font-bold text-slate-900">{finalSpeed} ft</span>
            {generalTcMods.speedMod > 0 && (
              <span className="text-[9px] print:text-[8px] text-cyan-700 block font-sans font-semibold leading-tight">
                +{generalTcMods.speedMod} ft (Haste)
              </span>
            )}
          </div>
        </div>

        {/* Active Combat Stances & Tactical Modifiers Section */}
        {activeCombatMods.length > 0 && (
          <div className="border-2 border-amber-500/40 rounded-lg p-2.5 print:p-2 bg-amber-50/70 print:bg-slate-50 space-y-1.5 print:space-y-1 print:break-inside-avoid shadow-xs">
            <div className="flex items-center justify-between border-b border-amber-300/80 print:border-slate-300 pb-1 print:pb-0.5">
              <h3 className="text-xs print:text-[10.5px] font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5 font-heading">
                <i className="fa-solid fa-crosshairs text-amber-600"></i> Active Combat Modifiers & Tactical Stances
              </h3>
              <span className="text-[10px] print:text-[9px] font-mono font-bold bg-amber-200/90 text-amber-950 border border-amber-400/60 px-1.5 py-0.2 rounded">
                {activeCombatMods.length} Active Modifier{activeCombatMods.length > 1 ? 's' : ''} Applied
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 print:grid-cols-2 print:gap-1.5">
              {activeCombatMods.map(mod => (
                <div key={mod.id} className="p-2 print:p-1.5 bg-white rounded border border-amber-200 print:border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs print:text-[10px] flex items-center gap-1.5">
                      <i className={`${mod.icon} text-amber-600 print:text-slate-700`}></i> {mod.name}
                    </span>
                    {onChange && (
                      <button
                        onClick={() => {
                          if (mod.id === 'whirlingFrenzy') onChange({ tacticalCombat: { ...tcState, whirlingFrenzy: false } });
                          else if (mod.id === 'rage') onChange({ tacticalCombat: { ...tcState, rage: false } });
                          else if (mod.id === 'haste') onChange({ tacticalCombat: { ...tcState, haste: false } });
                          else if (mod.id === 'powerAttack') onChange({ tacticalCombat: { ...tcState, powerAttack: 0 } });
                          else if (mod.id === 'combatExpertise') onChange({ tacticalCombat: { ...tcState, combatExpertise: 0 } });
                          else if (mod.id === 'fightingDefensively') onChange({ tacticalCombat: { ...tcState, fightingDefensively: false } });
                          else if (mod.id === 'flurryOfBlows') onChange({ tacticalCombat: { ...tcState, flurryOfBlows: false } });
                        }}
                        className="print:hidden text-[10px] text-slate-400 hover:text-rose-600 transition px-1"
                        title={`Turn off ${mod.name}`}
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    )}
                  </div>
                  <ul className="text-[10px] print:text-[9px] text-slate-700 font-mono space-y-0.5 list-disc list-inside">
                    {mod.effects.map((eff, i) => (
                      <li key={i} className="leading-tight">{eff}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Primary Attacks & Weapons Section */}
        <div className="border border-slate-300 rounded-lg p-2.5 print:p-2 bg-slate-50 space-y-1 print:space-y-0.5 print:break-inside-avoid">
          <h3 className="text-xs print:text-[10.5px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 print:pb-0.5">Attacks & Weapon Arsenal</h3>
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-slate-600 uppercase font-mono text-[10px] print:text-[9.5px]">
                <th className="py-0.5">Slot / Weapon</th>
                <th className="py-0.5 text-center">Attack Bonus</th>
                <th className="py-0.5 text-center">Damage</th>
                <th className="py-0.5 text-center">Critical</th>
                <th className="py-0.5 text-center">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px] print:text-[10px]">
              {activeWeaponsList.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-0.5 font-bold text-slate-900">
                    <span className="text-[9.5px] font-sans font-semibold text-slate-500 uppercase mr-1">[{item.label}]</span>
                    {item.weapon.name}
                  </td>
                  <td className="py-0.5 text-center font-bold text-slate-900">
                    <div>{item.fullSeq || (item.attackBonus >= 0 ? `+${item.attackBonus}` : `${item.attackBonus}`)}</div>
                    {item.tacticalNote && (
                      <div className="text-[8.5px] text-slate-500 font-sans font-normal leading-none">{item.tacticalNote}</div>
                    )}
                  </td>
                  <td className="py-0.5 text-center text-slate-800">{item.damageStr}</td>
                  <td className="py-0.5 text-center text-slate-800">{item.critStr}</td>
                  <td className="py-0.5 text-center text-slate-800">{item.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Armor & Defenses Row (2 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 print:grid-cols-2 print:gap-2 print:break-inside-avoid">
          {/* Armor & Protective Gear */}
          <div className="border border-slate-300 rounded-lg p-2.5 print:p-2 bg-slate-50 space-y-1.5 print:space-y-1">
            <h3 className="text-xs print:text-[10.5px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 print:pb-0.5">Armor & Protective Gear</h3>
            <div className="space-y-1 text-xs font-mono print:text-[10px]">
              <div className="p-1.5 bg-white rounded border border-slate-200 space-y-0.5">
                <span className="font-bold block text-slate-900">
                  Armor: {armorObj.name} {eq.armorEnhancement ? `+${eq.armorEnhancement}` : ''}
                </span>
                <p className="text-slate-600 text-[11px] print:text-[9.5px]">AC: +{armorAc} | Max Dex: +{armorObj.maxDex} | Check: {armorObj.checkPenalty}</p>
              </div>
              <div className="p-1.5 bg-white rounded border border-slate-200 space-y-0.5">
                <span className="font-bold block text-slate-900">
                  Shield: {shieldObj.name} {eq.shieldEnhancement ? `+${eq.shieldEnhancement}` : ''}
                </span>
                <p className="text-slate-600 text-[11px] print:text-[9.5px]">AC: +{shieldAc} | Check: {shieldObj.checkPenalty}</p>
              </div>
            </div>
          </div>

          {/* Defenses & Resistances (DR / SR) */}
          <div className="border border-slate-300 rounded-lg p-2.5 print:p-2 bg-slate-50 space-y-1.5 print:space-y-1">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1 print:pb-0.5">
              <h3 className="text-xs print:text-[10.5px] font-bold uppercase tracking-wider text-slate-800">
                Defenses & Resistances (DR / SR)
              </h3>
              <div className="flex items-center gap-1 font-mono text-[11px] print:text-[9.5px]">
                <span className={`font-bold px-1.5 py-0.2 rounded border ${drSummary.hasDR ? 'text-amber-900 bg-amber-100 border-amber-300' : 'text-slate-600 bg-slate-200 border-slate-300'}`}>
                  {drSummary.hasDR ? drSummary.bestDRString : 'DR: None'}
                </span>
                <span className={`font-bold px-1.5 py-0.2 rounded border ${srSummary.hasSR ? 'text-indigo-800 bg-indigo-100 border-indigo-300' : 'text-slate-600 bg-slate-200 border-slate-300'}`}>
                  {srSummary.hasSR ? srSummary.bestSRString : 'SR: None'}
                </span>
              </div>
            </div>
            {drSummary.hasDR || srSummary.hasSR ? (
              <div className="space-y-1 text-xs font-mono print:text-[10px]">
                {drSummary.hasDR && (
                  <div className="p-1.5 bg-white rounded border border-slate-200">
                    <span className="text-[9.5px] font-sans font-bold text-amber-800 block uppercase">Damage Reduction</span>
                    <span className="font-bold text-slate-900">{drSummary.fullDRString}</span>
                    {drSummary.baselineStackingDR > 0 && (
                      <p className="text-[9px] text-emerald-700 font-sans font-semibold">
                        Baseline Stacking DR: +{drSummary.baselineStackingDR}/-
                      </p>
                    )}
                  </div>
                )}
                {srSummary.hasSR && (
                  <div className="p-1.5 bg-white rounded border border-slate-200">
                    <span className="text-[9.5px] font-sans font-bold text-indigo-800 block uppercase">Spell Resistance</span>
                    <span className="font-bold text-slate-900">{srSummary.bestSRString}</span>
                    {srSummary.bonusSR > 0 && (
                      <p className="text-[9px] text-emerald-700 font-sans font-semibold">
                        +{srSummary.bonusSR} feat bonus applied
                      </p>
                    )}
                  </div>
                )}
                <div className="text-[10px] print:text-[9px] text-slate-600 font-sans leading-tight">
                  <span className="font-bold text-slate-700">Sources: </span>
                  {[...drSummary.sources.map(s => `${s.name} (${s.value}/${s.bypass})`), ...srSummary.sources.map(s => `${s.name} (SR ${s.value})`)].join(', ')}
                </div>
              </div>
            ) : (
              <div className="p-3 print:p-2 bg-white rounded border border-slate-200 flex items-center justify-center min-h-[64px] print:min-h-[56px] text-center">
                <p className="text-[11px] print:text-[9.5px] text-slate-500 italic font-mono">
                  No active Damage Reduction (DR) or Spell Resistance (SR) sources detected.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Wondrous Items & Magic Gear Section */}
        {(eq.wondrousItems || []).length > 0 && (
          <div className="border border-slate-300 rounded-lg p-2.5 print:p-2 bg-slate-50 space-y-1 print:space-y-0.5 print:break-inside-avoid">
            <h3 className="text-xs print:text-[10.5px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 print:pb-0.5">Wondrous Items & Magic Gear</h3>
            <div className="grid grid-cols-2 gap-2 print:gap-1 text-xs font-mono print:text-[10px]">
              {eq.wondrousItems!.map(w => (
                <div key={w.id} className="p-1.5 bg-white rounded border border-slate-200">
                  <span className="font-bold text-slate-900 block">{w.name} <span className="text-[9px] text-purple-700 uppercase font-sans">({w.slot})</span></span>
                  {w.effect && <p className="text-slate-600 text-[10px] print:text-[9px] leading-tight">{w.effect}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Page 1 Lower Split Grid: Left (Stats & Saves) | Right (Feats & Auras) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 print:grid-cols-2 print:gap-2 print:break-inside-avoid">
          {/* Left Column Card: Ability Scores & Saving Throws */}
          <div className="border border-slate-300 rounded-lg p-2.5 print:p-2 bg-slate-50 space-y-2 print:space-y-1.5">
            <div>
              <h3 className="text-xs print:text-[10.5px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-0.5 mb-1">Ability Scores</h3>
              <table className="w-full text-xs print:text-[10.5px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-500 uppercase">
                    <th className="py-0.5">Stat</th>
                    <th className="py-0.5 text-center">Score</th>
                    <th className="py-0.5 text-center">Mod</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  <tr className={generalTcMods.strBonus > 0 ? 'bg-amber-100/80' : ''}>
                    <td className="py-0.5 font-bold flex items-center gap-1">
                      STR
                      {generalTcMods.strBonus > 0 && (
                        <span className="text-[8.5px] text-amber-900 bg-amber-200/90 px-1 rounded uppercase font-sans font-bold" title={tcState.whirlingFrenzy ? 'Whirling Frenzy' : 'Barbarian Rage'}>
                          +{generalTcMods.strBonus} ({tcState.whirlingFrenzy ? 'Frenzy' : 'Rage'})
                        </span>
                      )}
                    </td>
                    <td className="py-0.5 text-center font-bold">
                      {effectiveStrScore}
                      {generalTcMods.strBonus > 0 && <span className="text-[10px] text-slate-500 font-normal ml-0.5">(Base {strScore})</span>}
                    </td>
                    <td className="py-0.5 text-center font-bold">
                      {effectiveStrMod >= 0 ? `+${effectiveStrMod}` : effectiveStrMod}
                    </td>
                  </tr>
                  <tr><td className="py-0.5 font-bold">DEX</td><td className="py-0.5 text-center">{dexScore}</td><td className="py-0.5 text-center font-bold">{dexMod >= 0 ? '+' : ''}{dexMod}</td></tr>
                  <tr className={generalTcMods.conBonus > 0 ? 'bg-amber-100/80' : ''}>
                    <td className="py-0.5 font-bold flex items-center gap-1">
                      CON
                      {generalTcMods.conBonus > 0 && (
                        <span className="text-[8.5px] text-amber-900 bg-amber-200/90 px-1 rounded uppercase font-sans font-bold" title="Barbarian Rage">
                          +{generalTcMods.conBonus} (Rage)
                        </span>
                      )}
                    </td>
                    <td className="py-0.5 text-center font-bold">
                      {effectiveConScore}
                      {generalTcMods.conBonus > 0 && <span className="text-[10px] text-slate-500 font-normal ml-0.5">(Base {conScore})</span>}
                    </td>
                    <td className="py-0.5 text-center font-bold">
                      {effectiveConMod >= 0 ? `+${effectiveConMod}` : effectiveConMod}
                    </td>
                  </tr>
                  <tr><td className="py-0.5 font-bold">INT</td><td className="py-0.5 text-center">{intScore}</td><td className="py-0.5 text-center font-bold">{intMod >= 0 ? '+' : ''}{intMod}</td></tr>
                  <tr><td className="py-0.5 font-bold">WIS</td><td className="py-0.5 text-center">{wisScore}</td><td className="py-0.5 text-center font-bold">{wisMod >= 0 ? '+' : ''}{wisMod}</td></tr>
                  <tr><td className="py-0.5 font-bold">CHA</td><td className="py-0.5 text-center">{chaScore}</td><td className="py-0.5 text-center font-bold">{chaMod >= 0 ? '+' : ''}{chaMod}</td></tr>
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="text-xs print:text-[10.5px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-0.5 mb-1">Saving Throws</h3>
              <table className="w-full text-xs print:text-[10.5px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-500 uppercase text-[10px] print:text-[9.5px]">
                    <th className="py-0.5">Save</th>
                    <th className="py-0.5 text-center">Total</th>
                    <th className="py-0.5 text-center">Base</th>
                    <th className="py-0.5 text-center">Ability</th>
                    <th className="py-0.5 text-center">Tactical / Misc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px] print:text-[10px]">
                  <tr>
                    <td className="py-0.5 font-bold">FORTITUDE (Con)</td>
                    <td className="py-0.5 text-center font-bold text-xs print:text-[10.5px]">{totalFort >= 0 ? '+' : ''}{totalFort}</td>
                    <td className="py-0.5 text-center">{baseFort}</td>
                    <td className="py-0.5 text-center">{effectiveConMod >= 0 ? '+' : ''}{effectiveConMod}</td>
                    <td className="py-0.5 text-center text-[10px] print:text-[9px] text-slate-600">
                      {traitFlawSaveMods.fort !== 0 || generalTcMods.fortSaveMod !== 0 ? (
                        <span>
                          {generalTcMods.fortSaveMod > 0 ? `+${generalTcMods.fortSaveMod} (Rage)` : ''}
                          {traitFlawSaveMods.fort !== 0 ? ` ${traitFlawSaveMods.fort > 0 ? `+${traitFlawSaveMods.fort}` : traitFlawSaveMods.fort} (Trait/Flaw)` : ''}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 font-bold">REFLEX (Dex)</td>
                    <td className="py-0.5 text-center font-bold text-xs print:text-[10.5px]">{totalRef >= 0 ? '+' : ''}{totalRef}</td>
                    <td className="py-0.5 text-center">{baseRef}</td>
                    <td className="py-0.5 text-center">{dexMod >= 0 ? '+' : ''}{dexMod}</td>
                    <td className="py-0.5 text-center text-[10px] print:text-[9px] text-slate-600">
                      {traitFlawSaveMods.ref !== 0 || generalTcMods.refSaveMod !== 0 ? (
                        <span>
                          {generalTcMods.refSaveMod > 0 ? (
                            tcState.whirlingFrenzy && tcState.haste ? '+3 (+2 Frenzy, +1 Haste)' :
                            tcState.whirlingFrenzy ? '+2 (Frenzy)' : '+1 (Haste)'
                          ) : ''}
                          {traitFlawSaveMods.ref !== 0 ? ` ${traitFlawSaveMods.ref > 0 ? `+${traitFlawSaveMods.ref}` : traitFlawSaveMods.ref} (Trait/Flaw)` : ''}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 font-bold">WILL (Wis)</td>
                    <td className="py-0.5 text-center font-bold text-xs print:text-[10.5px]">{totalWill >= 0 ? '+' : ''}{totalWill}</td>
                    <td className="py-0.5 text-center">{baseWill}</td>
                    <td className="py-0.5 text-center">{wisMod >= 0 ? '+' : ''}{wisMod}</td>
                    <td className="py-0.5 text-center text-[10px] print:text-[9px] text-slate-600">
                      {traitFlawSaveMods.will !== 0 || generalTcMods.willSaveMod !== 0 ? (
                        <span>
                          {generalTcMods.willSaveMod > 0 ? `+${generalTcMods.willSaveMod} (Rage)` : ''}
                          {traitFlawSaveMods.will !== 0 ? ` ${traitFlawSaveMods.will > 0 ? `+${traitFlawSaveMods.will}` : traitFlawSaveMods.will} (Trait/Flaw)` : ''}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column Card: Feats & Special Abilities + Active Auras */}
          <div className="border border-slate-300 rounded-lg p-2.5 print:p-2 bg-slate-50 space-y-2 print:space-y-1.5">
            <div>
              <h3 className="text-xs print:text-[10.5px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-0.5 mb-1">Feats & Special Abilities</h3>
              <div className="space-y-0.5 text-[11px] print:text-[10px] text-slate-800 font-medium leading-tight font-mono">
                {raceObj.spellLikeAbilities && (
                  <p><span className="font-bold text-slate-900 font-sans">Spell-Likes:</span> {raceObj.spellLikeAbilities}</p>
                )}
                {raceObj.psionicAbilities && (
                  <p><span className="font-bold text-slate-900 font-sans">Psionics:</span> {raceObj.psionicAbilities}</p>
                )}
                {raceObj.specialAbilities && (
                  <p><span className="font-bold text-slate-900 font-sans">Racial:</span> {raceObj.specialAbilities}</p>
                )}
                {raceObj.racialSkills && (
                  <p><span className="font-bold text-slate-900 font-sans">Skill Bonus:</span> {raceObj.racialSkills}</p>
                )}
                {selectedTraits.length > 0 && (
                  <p><span className="font-bold text-slate-900 font-sans">Traits:</span> {selectedTraits.join(', ')}</p>
                )}
                {selectedFlaws.length > 0 && (
                  <p><span className="font-bold text-slate-900 font-sans">Flaws:</span> {selectedFlaws.join(', ')} (+{selectedFlaws.length} Feat)</p>
                )}
                {(character.selectedDomains || []).filter(Boolean).length > 0 && (
                  <div className="pt-1 space-y-1 border-t border-slate-200 mt-1">
                    <p><span className="font-bold text-slate-900 font-sans">Divine Domains:</span> {(character.selectedDomains || []).filter(Boolean).join(', ')}</p>
                    {(character.selectedDomains || []).filter(Boolean).map(domName => {
                      const domObj = domainsData.find(d => d.name.toLowerCase() === domName.toLowerCase() || d.id === domName.toLowerCase());
                      if (!domObj) return null;
                      return (
                        <div key={domObj.id} className="text-[10px] print:text-[9px] bg-slate-100 p-1 rounded border border-slate-200">
                          <span className="font-bold text-slate-900">{domObj.name} Domain Power:</span>{' '}
                          <span className="text-slate-700">{domObj.power}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <p><span className="font-bold text-slate-900 font-sans">Feats:</span> {(character.selectedFeats || []).join(', ') || 'None selected.'}</p>
              </div>
            </div>

            {(character.auras || []).filter(a => a.active).length > 0 && (
              <div className="space-y-1">
                <h3 className="text-xs print:text-[10.5px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-0.5 mb-1">
                  Active Projected Auras
                </h3>
                <div className="space-y-1 text-xs print:text-[10px]">
                  {character.auras!.filter(a => a.active).map(aura => (
                    <div key={aura.id} className="p-1.5 bg-white rounded border border-slate-200 font-sans space-y-0.5">
                      <div className="flex items-center justify-between font-bold text-slate-900 text-[10px] print:text-[9.5px]">
                        <span>{aura.name}</span>
                        <span className="text-[9px] px-1 py-0.2 bg-slate-100 border border-slate-300 text-slate-700 rounded font-mono">
                          {aura.radius} ft &bull; {aura.target}
                        </span>
                      </div>
                      <p className="text-slate-700 text-[10px] print:text-[9px] font-mono leading-tight">{aura.effect}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Page 2: Character Skills & Skill Tricks Section */}
        <div className="space-y-3 print-page-break-before">
          <div className="hidden print:block">
            {renderHeader()}
          </div>

          <div className="border border-slate-300 rounded-lg p-3.5 bg-slate-50 space-y-3 print:break-inside-avoid">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Skills & Skill Modifiers
              </h3>
              {usePathfinder && (
                <span className="text-[10px] text-amber-700 font-sans font-semibold uppercase">
                  Pathfinder Perception Active
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4 text-xs">
              {/* Left Skills Table */}
              <table className="w-full text-left border-collapse font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-500 uppercase font-sans font-bold text-[10px]">
                    <th className="py-1 px-1 text-center w-8">Type</th>
                    <th className="py-1 px-1">Skill Name</th>
                    <th className="py-1 px-1 text-center w-8">Key</th>
                    <th className="py-1 px-1 text-center w-12">Ranks</th>
                    <th className="py-1 px-1 text-right w-12">Mod</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {leftSkills.map(sk => (
                    <tr key={sk.name}>
                      <td className="py-0.5 px-1 text-center">
                        {sk.isClass ? (
                          <span className="font-bold text-[9px] text-slate-900 bg-slate-200 px-1 rounded">C</span>
                        ) : (
                          <span className="text-[9px] text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-0.5 px-1 font-sans font-semibold text-slate-900">{sk.name}</td>
                      <td className="py-0.5 px-1 text-center text-slate-600 text-[10px]">{sk.keyAbility}</td>
                      <td className="py-0.5 px-1 text-center text-slate-700">{sk.ranks > 0 ? sk.ranks : '-'}</td>
                      <td className="py-0.5 px-1 text-right font-bold text-slate-900">
                        {sk.totalMod >= 0 ? `+${sk.totalMod}` : sk.totalMod}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Right Skills Table */}
              <table className="w-full text-left border-collapse font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-500 uppercase font-sans font-bold text-[10px]">
                    <th className="py-1 px-1 text-center w-8">Type</th>
                    <th className="py-1 px-1">Skill Name</th>
                    <th className="py-1 px-1 text-center w-8">Key</th>
                    <th className="py-1 px-1 text-center w-12">Ranks</th>
                    <th className="py-1 px-1 text-right w-12">Mod</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rightSkills.map(sk => (
                    <tr key={sk.name}>
                      <td className="py-0.5 px-1 text-center">
                        {sk.isClass ? (
                          <span className="font-bold text-[9px] text-slate-900 bg-slate-200 px-1 rounded">C</span>
                        ) : (
                          <span className="text-[9px] text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-0.5 px-1 font-sans font-semibold text-slate-900">{sk.name}</td>
                      <td className="py-0.5 px-1 text-center text-slate-600 text-[10px]">{sk.keyAbility}</td>
                      <td className="py-0.5 px-1 text-center text-slate-700">{sk.ranks > 0 ? sk.ranks : '-'}</td>
                      <td className="py-0.5 px-1 text-right font-bold text-slate-900">
                        {sk.totalMod >= 0 ? `+${sk.totalMod}` : sk.totalMod}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Selected Skill Tricks Sub-block */}
            {(character.selectedSkillTricks || []).length > 0 && (
              <div className="pt-2 border-t border-slate-300 text-xs font-mono space-y-1">
                <span className="font-bold text-slate-900 font-sans block">Acquired Skill Tricks:</span>
                <p className="text-slate-700 text-[11px]">{character.selectedSkillTricks.join(', ')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Page 3: Inventory, Currency & Carrying Capacity Section */}
        <div className="space-y-3 print-page-break-before">
          <div className="hidden print:block">
            {renderHeader()}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-300 rounded-lg p-3.5 bg-slate-50 print:grid-cols-3 print:break-inside-avoid">
            {/* General Inventory Table (2 cols) */}
            <div className="col-span-2 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">Possessions & Adventuring Gear</h3>
              {inventory.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No general inventory recorded.</p>
              ) : (
                <div className="w-full">
                  <table className="w-full text-[11px] text-left border-collapse font-mono">
                    <thead>
                      <tr className="border-b border-slate-300 text-slate-500 uppercase font-sans font-bold">
                        <th className="py-1">Item</th>
                        <th className="py-1 text-center">Container</th>
                        <th className="py-1 text-center">Qty</th>
                        <th className="py-1 text-right">Weight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {inventory.map(item => {
                        const totalWeight = item.quantity * item.weight;
                        return (
                          <tr key={item.id}>
                            <td className="py-1 font-semibold text-slate-900">{item.name}</td>
                            <td className="py-1 text-center text-slate-600 text-[10px]">{item.location || 'Carried'}</td>
                            <td className="py-1 text-center text-slate-800 font-bold">{item.quantity}</td>
                            <td className="py-1 text-right text-slate-800">{totalWeight > 0 ? `${totalWeight.toFixed(1)} lb` : '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Currency & Load Limits (1 col) */}
            <div className="space-y-4 border-l border-slate-300 pl-4 font-mono text-xs">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2 font-sans">Currency & Wealth</h3>
                <div className="space-y-1 text-slate-800 text-[11px]">
                  <div className="flex justify-between"><span>CP:</span> <span className="font-bold">{funds.cp || 0}</span></div>
                  <div className="flex justify-between"><span>SP:</span> <span className="font-bold">{funds.sp || 0}</span></div>
                  <div className="flex justify-between"><span>GP:</span> <span className="font-bold">{funds.gp || 0}</span></div>
                  <div className="flex justify-between"><span>PP:</span> <span className="font-bold">{funds.pp || 0}</span></div>
                  {funds.otherValuables ? (
                    <div className="flex justify-between text-purple-700"><span>Gems/Art:</span> <span className="font-bold">{funds.otherValuables} GP</span></div>
                  ) : null}
                  <div className="border-t border-slate-300 pt-1 flex justify-between font-bold text-slate-900 text-xs font-sans">
                    <span>Net Worth:</span>
                    <span>{netWorthGP.toLocaleString()} GP</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2 font-sans">Carrying Capacity</h3>
                <div className="space-y-1 text-[11px] text-slate-700">
                  <div className="flex justify-between"><span>Total Weight:</span> <span className="font-bold text-slate-900">{totalCarriedWeight} lbs</span></div>
                  <div className="flex justify-between"><span>Status:</span> <span className="font-bold uppercase text-slate-900">{encumbrance.label}</span></div>
                  <div className="border-t border-slate-200 pt-1 text-[10px] space-y-0.5">
                    <div className="flex justify-between"><span>Light:</span> <span>Up to {carryingCapacity.light} lbs</span></div>
                    <div className="flex justify-between"><span>Medium:</span> <span>Up to {carryingCapacity.medium} lbs</span></div>
                    <div className="flex justify-between"><span>Heavy:</span> <span>Up to {carryingCapacity.heavy} lbs</span></div>
                    <div className="flex justify-between"><span>Coin Weight:</span> <span>{coinWeight} lbs</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page 4: Backstory & Campaign Notes Section */}
        {character.notes && (character.notes.backstory || character.notes.appearance || (character.notes.quests || []).length > 0) && (
          <div className="space-y-3 print-page-break-before">
            <div className="hidden print:block">
              {renderHeader()}
            </div>

            <div className="border border-slate-300 rounded-lg p-3.5 bg-slate-50 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">Backstory & Active Quests</h3>
              {character.notes.backstory && (
                <div className="text-xs space-y-1">
                  <span className="font-bold text-slate-900 block">Backstory:</span>
                  <p className="text-slate-700 font-mono text-[11px] print:text-[10.5px] leading-relaxed print:leading-normal whitespace-pre-wrap">{character.notes.backstory}</p>
                </div>
              )}
              {(character.notes.quests || []).filter(q => q.status === 'active').length > 0 && (
                <div className="text-xs space-y-1 border-t border-slate-200 pt-2">
                  <span className="font-bold text-slate-900 block">Active Quests:</span>
                  <ul className="list-disc list-inside text-slate-700 font-mono text-[11px] print:text-[10.5px] space-y-0.5">
                    {character.notes.quests!.filter(q => q.status === 'active').map(q => (
                      <li key={q.id}>
                        <span className="font-bold">{q.title}</span> {q.location ? `(${q.location})` : ''} - {q.objectives || 'No objectives listed.'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
