import React from 'react';
import { CharacterState, RaceData, ClassData, WeaponData, Equipment, TraitData, FlawData, TemplateData, DomainData, DeityData, WildShapeFormData, SpellData } from '../types/character';
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
import { calculateBAB, calculateBaseSave, calculateTotalHP, toCanonicalClassId } from '../engine/classes';
import {
  resolveWeapon, resolveArmor, resolveShield, calculateFeatCombatBonuses,
  calculateCarryingCapacity, calculateCoinWeight, calculateTotalNetWorthGP,
  calculateTotalCarriedWeight, getEncumbranceStatus,
  resolveEquippedArmor, resolveEquippedShield, resolveEquippedWeapon,
  getWeaponEffectiveAttackEnhancement, getWeaponMaterialDamageMod, getWeaponMaterialTraits,
  decrementEquippedAmmunition, validateBodySlots, BODY_SLOT_MAP, getCharacterAmmunition,
  getMatchingAmmoTypeForWeapon
} from '../engine/equipment';
import {
  getAvailableSkills,
  isClassSkillForCharacter,
  calculatePerceptionStats
} from '../engine/skills';
import {
  SPELLCASTING_CLASSES,
  getSpellSlotsForClass,
  isSpellcastingClassName,
  isPreparedCaster
} from '../engine/spells';
import { TacticalCombatWidget } from './TacticalCombatWidget';
import { VitalsCombatTracker } from './VitalsCombatTracker';
import {
  getTacticalCombatState,
  calculateTacticalCombatModifiers,
  generateFullAttackSequence,
  calculateGrappleModifier,
  getGrappleAttackEntry,
  getActiveCombatModifiers,
  isTwoHandedWeapon
} from '../engine/combat';
import {
  calculateKeenThreat,
  hasKeenQuality,
  hasSpeedQuality,
  getWeaponSpecialDamage,
  getWeaponRollOptions,
  calculateCritDamagePools,
  getBaneAttackOption,
  WeaponRollOption,
  DamagePoolInput,
  getArmorSkillBonus,
  getFortificationSummary,
  getQualityById
} from '../engine/magicItems';
import { calculateConditionPenalties, CONDITION_MAP } from '../engine/conditions';
import { calculateTotalDR } from '../engine/dr';
import { calculateTotalSR } from '../engine/sr';
import { resolveActiveWildShape, calculateWildShapeAttacks, getSizeAcModifier } from '../engine/wildshape';
import {
  rollAttack,
  rollAttackSequence,
  rollDamage,
  rollSavingThrow,
  rollSkillCheck,
  rollAbilityCheck,
  rollGrappleCheck,
  rollInitiative
} from '../engine/dice';
import { useGameData } from '../context/GameDataContext';
import { useCharacter, useCharacterDispatch } from '../context/CharacterContext';

interface SheetViewTabProps {
  character?: CharacterState;
  racesData?: RaceData[];
  classesData?: ClassData[];
  weaponsData?: WeaponData[];
  templatesData?: TemplateData[];
  traitsData?: TraitData[];
  flawsData?: FlawData[];
  domainsData?: DomainData[];
  deitiesData?: DeityData[];
  wildShapeFormsData?: WildShapeFormData[];
  spellsData?: SpellData[];
  onChange?: (updated: Partial<CharacterState>) => void;
}

export const SheetViewTab: React.FC<SheetViewTabProps> = (props) => {
  const contextCharacter = useCharacter();
  const { updateCharacter } = useCharacterDispatch();
  const gameData = useGameData();

  const character = props.character ?? contextCharacter;
  const racesData = props.racesData ?? gameData.racesData;
  const classesData = props.classesData ?? gameData.classesData;
  const weaponsData = props.weaponsData ?? gameData.weaponsData;
  const templatesData = props.templatesData ?? gameData.templatesData;
  const traitsData = props.traitsData ?? gameData.traitsData;
  const flawsData = props.flawsData ?? gameData.flawsData;
  const domainsData = props.domainsData ?? gameData.domainsData;
  const deitiesData = props.deitiesData ?? gameData.deitiesData;
  const wildShapeFormsData = props.wildShapeFormsData ?? gameData.wildShapeFormsData;
  const spellsData = props.spellsData ?? gameData.spellsData;
  const onChange = props.onChange ?? updateCharacter;
  // Spellcasting Classes & Active Slot Tracking
  const sheetClassLevelsMap: Record<string, number> = {};
  (character.levelProgression || []).forEach(l => {
    if (l.primaryClass) {
      sheetClassLevelsMap[l.primaryClass] = (sheetClassLevelsMap[l.primaryClass] || 0) + 1;
    }
    if (l.secondaryClass) {
      sheetClassLevelsMap[l.secondaryClass] = (sheetClassLevelsMap[l.secondaryClass] || 0) + 1;
    }
  });

  const sheetCasterEntries = Object.entries(sheetClassLevelsMap).filter(([clsName]) => {
    const clsObj = classesData.find(c => c.name === clsName);
    return isSpellcastingClassName(clsName, clsObj);
  });

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

  const activeConditions = character.activeConditions || [];
  const conditionPenalties = calculateConditionPenalties(activeConditions);

  const speedData = calculateTotalSpeed(character, raceObj, templateObj, traitsData, flawsData);
  const drSummary = calculateTotalDR(character, raceObj, templateObj, [], classesData);
  const srSummary = calculateTotalSR(character, raceObj, templateObj, [], classesData);
  const activeWildShape = resolveActiveWildShape(character, wildShapeFormsData);

  const totalLevel = character.levelProgression.filter(l => l.primaryClass).length || 1;
  const baseStrScore = calculateTotalScore('str', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel, traitFlawStatMods);
  const baseDexScore = calculateTotalScore('dex', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel, traitFlawStatMods);
  const baseConScore = calculateTotalScore('con', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel, traitFlawStatMods);
  const intScore = calculateTotalScore('int', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel, traitFlawStatMods);
  const wisScore = calculateTotalScore('wis', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel, traitFlawStatMods);
  const chaScore = calculateTotalScore('cha', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel, traitFlawStatMods);

  // Substitute physical ability scores with form's base stats when Wild Shape is active
  const strScore = activeWildShape ? activeWildShape.str : baseStrScore;
  const dexScore = activeWildShape ? activeWildShape.dex : baseDexScore;
  const conScore = baseConScore;
  const bab = calculateBAB(character.levelProgression, classesData);
  const tcState = getTacticalCombatState(character, bab);
  const generalTcMods = calculateTacticalCombatModifiers(tcState, undefined, false, false, character.activeBuffs);
  const activeCombatMods = getActiveCombatModifiers(tcState, totalLevel, character.activeBuffs);

  // Apply Tactical Modifiers & Condition Penalties to Effective Stats
  const rawEffectiveStr = strScore + (generalTcMods.strBonus || 0) + conditionPenalties.strPenalty;
  const effectiveStrScore = conditionPenalties.strPenalty === -99 ? 0 : Math.max(0, rawEffectiveStr);

  const rawEffectiveDex = dexScore + (generalTcMods.dexBonus || 0) + conditionPenalties.dexPenalty;
  const effectiveDexScore = conditionPenalties.dexPenalty === -99 ? 0 : Math.max(0, rawEffectiveDex);

  const effectiveConScore = conScore + (generalTcMods.conBonus || 0);
  const effectiveIntScore = intScore + (generalTcMods.intBonus || 0);
  const effectiveWisScore = wisScore + (generalTcMods.wisBonus || 0);
  const effectiveChaScore = chaScore + (generalTcMods.chaBonus || 0);

  const strMod = getAbilityMod(strScore);
  const dexMod = getAbilityMod(dexScore);
  const conMod = getAbilityMod(conScore);
  const baseIntMod = getAbilityMod(intScore);
  const baseWisMod = getAbilityMod(wisScore);
  const baseChaMod = getAbilityMod(chaScore);

  const effectiveStrMod = getAbilityMod(effectiveStrScore);
  const effectiveDexMod = getAbilityMod(effectiveDexScore);
  const effectiveConMod = getAbilityMod(effectiveConScore);
  const effectiveIntMod = getAbilityMod(effectiveIntScore);
  const effectiveWisMod = getAbilityMod(effectiveWisScore);
  const effectiveChaMod = getAbilityMod(effectiveChaScore);

  const intMod = effectiveIntMod;
  const wisMod = effectiveWisMod;
  const chaMod = effectiveChaMod;

  // HP retains character's base Constitution modifier + Rage bonus
  const baseConMod = getAbilityMod(baseConScore);
  const maxHp = calculateTotalHP(character.levelProgression, classesData, baseConMod, traitFlawHpMod) + (generalTcMods.hpBonusPerLevel * totalLevel);
  const currentHp = character.currentHp !== undefined ? character.currentHp : maxHp;
  const tempHp = character.tempHp || 0;
  const nonlethalDamage = character.nonlethalDamage || 0;

  const baseFort = calculateBaseSave('fort', character.levelProgression, classesData);
  const baseRef = calculateBaseSave('ref', character.levelProgression, classesData);
  const baseWill = calculateBaseSave('will', character.levelProgression, classesData);

  const totalFort = baseFort + conMod + traitFlawSaveMods.fort + generalTcMods.fortSaveMod + conditionPenalties.fortPenalty;
  const totalRef = baseRef + dexMod + traitFlawSaveMods.ref + generalTcMods.refSaveMod + conditionPenalties.refPenalty;
  const totalWill = baseWill + baseWisMod + traitFlawSaveMods.will + generalTcMods.willSaveMod + conditionPenalties.willPenalty;

  const totalInitiative = effectiveDexMod + traitFlawInitMod + conditionPenalties.initiativePenalty;

  const activeSize = activeWildShape ? activeWildShape.size : (templateObj?.size || raceObj.size || 'Medium');
  const sizeAcMod = getSizeAcModifier(activeSize);
  const wildShapeNatArmor = activeWildShape ? activeWildShape.naturalArmor : 0;

  const baseSpeed = (activeWildShape ? activeWildShape.speed.land : speedData.land) + generalTcMods.speedMod;
  const finalSpeed = Math.max(5, Math.floor(baseSpeed * conditionPenalties.speedMultiplier));

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

  const armorObj = resolveEquippedArmor(character, customArmors);
  const shieldObj = resolveEquippedShield(character, customArmors);
  const armorEnhancement = eq.armorEnhancement ?? armorObj.enhancementBonus ?? 0;
  const shieldEnhancement = eq.shieldEnhancement ?? shieldObj.enhancementBonus ?? 0;
  const armorQualities = (eq.armorQualities && eq.armorQualities.length > 0) ? eq.armorQualities : (armorObj.specialQualities || []);
  const shieldQualities = (eq.shieldQualities && eq.shieldQualities.length > 0) ? eq.shieldQualities : (shieldObj.specialQualities || []);
  const sheetBodySlotReport = validateBodySlots(eq, customArmors);

  const effectiveAbilityMods: Record<string, number> = {
    str: effectiveStrMod,
    dex: effectiveDexMod,
    con: effectiveConMod,
    int: effectiveIntMod,
    wis: effectiveWisMod,
    cha: effectiveChaMod
  };

  const calculatedSkills = activeSkills.map(skill => {
    const isClass = isClassSkillForCharacter(skill.name, character.levelProgression, classesData);
    const ranks = (character.skillRanks || {})[skill.name] || 0;
    const abMod = effectiveAbilityMods[skill.keyAbility.toLowerCase()] ?? 0;
    const tfSkillMod = traitFlawSkillMods[skill.name] || 0;

    let skillSpecificPenalty = conditionPenalties.skillCheckPenalty;
    if (skill.name === 'Search') skillSpecificPenalty += conditionPenalties.searchPenalty;
    if (skill.name === 'Spot') skillSpecificPenalty += conditionPenalties.spotPenalty;
    if (skill.name === 'Listen') skillSpecificPenalty += conditionPenalties.listenPenalty;

    const armorSkillBonus = getArmorSkillBonus(armorQualities, shieldQualities, skill.name);
    let totalMod = Math.floor(ranks) + abMod + tfSkillMod + skillSpecificPenalty + armorSkillBonus;
    if (skill.name === 'Perception') {
      const percStats = calculatePerceptionStats(character, classesData, abMod);
      totalMod = percStats.totalBonus + tfSkillMod + skillSpecificPenalty + armorSkillBonus;
    }

    return {
      name: skill.name,
      keyAbility: skill.keyAbility.toUpperCase(),
      isClass,
      ranks,
      totalMod,
      abMod,
      tfSkillMod,
      skillSpecificPenalty,
      armorSkillBonus
    };
  });

  const halfIndex = Math.ceil(calculatedSkills.length / 2);
  const leftSkills = calculatedSkills.slice(0, halfIndex);
  const rightSkills = calculatedSkills.slice(halfIndex);

  const armorAc = armorObj.acBonus + armorEnhancement;
  const shieldAc = shieldObj.acBonus + shieldEnhancement;

  const finalDexToAc = conditionPenalties.loseDexToAc ? Math.min(0, effectiveDexMod) : effectiveDexMod;
  const totalAc = 10 + armorAc + shieldAc + finalDexToAc + (eq.deflection || 0) + (eq.natural || 0) + wildShapeNatArmor + sizeAcMod + (eq.dodge || 0) + traitFlawAcMod + generalTcMods.acNetMod + conditionPenalties.acPenalty;
  const touchAc = 10 + finalDexToAc + (eq.deflection || 0) + sizeAcMod + (eq.dodge || 0) + traitFlawAcMod + generalTcMods.touchAcMod + conditionPenalties.acPenalty;
  const flatAc = 10 + armorAc + shieldAc + Math.min(0, effectiveDexMod) + (eq.deflection || 0) + (eq.natural || 0) + wildShapeNatArmor + sizeAcMod + traitFlawAcMod + generalTcMods.flatAcMod + conditionPenalties.acPenalty;

  const fortificationSummary = getFortificationSummary(armorQualities, shieldQualities);

  // Weapon Resolutions & Feat Combat Bonuses
  const activeWeaponsList: Array<{
    label: string;
    weapon: WeaponData;
    attackBonus: number;
    fullSeq: string;
    damageStr: string;
    damageFormula?: string;
    damageBonus?: number;
    threatMin?: number;
    critStr: string;
    type: string;
    featAtkBonus: number;
    featDmgBonus: number;
    tacticalNote?: string;
    rollOptions?: WeaponRollOption[];
    critInfo?: { rollFormula: string; damagePools: DamagePoolInput[]; label: string };
    baneAtk?: { atkBonus: number; label: string; condition: string } | null;
  }> = [];

  // 0. Active Wild Shape Natural Attacks (rendered first in weapon table)
  if (activeWildShape) {
    const wsAttacks = calculateWildShapeAttacks(character, activeWildShape, bab, effectiveStrMod, effectiveDexMod, tcState);
    activeWeaponsList.push(...wsAttacks);
  }

  const paladinLevel = (character.levelProgression || []).filter(l => {
    const c1 = (l.primaryClass || '').toLowerCase().trim();
    const c2 = (l.secondaryClass || '').toLowerCase().trim();
    return c1 === 'paladin' || c2 === 'paladin';
  }).length;
  const smiteAtkBonus = tcState.smiteEvil ? Math.max(0, chaMod) : 0;
  const smiteDmgBonus = tcState.smiteEvil ? Math.max(1, paladinLevel) : 0;

  // 1. Primary Weapon
  if (eq.primaryWeapon && eq.primaryWeapon !== 'none') {
    const primaryWpn = resolveEquippedWeapon(character, 'primaryWeapon', weaponsData, customWeapons);
    const primaryQualities = (eq.primaryWeaponQualities && eq.primaryWeaponQualities.length > 0) ? eq.primaryWeaponQualities : (primaryWpn.specialQualities || []);
    const primaryBaneTarget = eq.primaryWeaponBaneTarget || primaryWpn.baneTarget;
    const primarySpecialDmg = getWeaponSpecialDamage(primaryQualities, primaryBaneTarget);
    const primaryHasKeen = hasKeenQuality(primaryQualities);
    const primaryHasSpeed = hasSpeedQuality(primaryQualities);
    const primaryThreat = primaryHasKeen ? calculateKeenThreat(primaryWpn.threat) : primaryWpn.threat;
    const featBonuses = calculateFeatCombatBonuses(character, primaryWpn);
    const wMods = calculateTacticalCombatModifiers(tcState, primaryWpn, false, false, character.activeBuffs);
    const enh = eq.primaryWeaponEnhancement ?? primaryWpn.enhancementBonus ?? 0;
    const isMelee = !primaryWpn.category?.toLowerCase().includes('ranged');
    const netSmiteAtk = isMelee ? smiteAtkBonus : 0;
    const netSmiteDmg = isMelee ? smiteDmgBonus : 0;
    const isMwk = Boolean(primaryWpn.isMasterwork || eq.primaryWeaponMasterwork);
    const effectiveAtkEnh = getWeaponEffectiveAttackEnhancement(primaryWpn.material || eq.primaryWeaponMaterial, enh, isMwk);
    const matDmgMod = getWeaponMaterialDamageMod(primaryWpn.material || eq.primaryWeaponMaterial);
    const netAtkBonus = effectiveStrMod + effectiveAtkEnh + featBonuses.attackBonus + wMods.attackMod + netSmiteAtk + conditionPenalties.attackPenalty + conditionPenalties.meleeAttackPenalty;
    const totalAtk = bab + netAtkBonus;
    const fullSeq = generateFullAttackSequence(bab, netAtkBonus, tcState.haste || (generalTcMods.extraAttacks || 0) > 0, tcState.flurryOfBlows, tcState.whirlingFrenzy, primaryHasSpeed);
    const primaryStrDmg = (isTwoHandedWeapon(primaryWpn) && effectiveStrMod > 0) ? Math.floor(effectiveStrMod * 1.5) : effectiveStrMod;
    const dmgVal = primaryStrDmg + enh + featBonuses.damageBonus + wMods.damageMod + netSmiteDmg + conditionPenalties.damagePenalty + matDmgMod;
    const baseDmgStr = `${primaryWpn.damageM}${dmgVal >= 0 ? `+${dmgVal}` : dmgVal}`;
    const damageStr = `${baseDmgStr}${primarySpecialDmg.damageDiceString}`;
    const damageFormula = `${baseDmgStr}${primarySpecialDmg.damageDiceFormula}`;

    const primaryRollOptions = getWeaponRollOptions(primaryWpn, baseDmgStr, dmgVal, totalAtk, primaryQualities, primaryBaneTarget);
    const primaryBaneAtk = primarySpecialDmg.hasBane ? getBaneAttackOption(totalAtk, primaryWpn.name, primaryBaneTarget) : null;
    const primaryCritInfo = calculateCritDamagePools(primaryWpn, dmgVal, primaryQualities, primaryBaneTarget);

    const primaryNote = (() => {
      const notes: string[] = [];
      const matTraits = getWeaponMaterialTraits(primaryWpn.material || eq.primaryWeaponMaterial, isMwk);
      matTraits.forEach(t => notes.push(t));
      if (primaryHasSpeed) { notes.push('Speed: +1 Extra Atk'); }
      if (primarySpecialDmg.summaryLabels.length > 0) { notes.push(`Magic: ${primarySpecialDmg.summaryLabels.join(', ')}`); }
      if (tcState.whirlingFrenzy) { notes.push('Whirling Frenzy: +2 Str, -2 Flurry, +1 Extra Atk'); }
      else if (tcState.rage) { notes.push('Barbarian Rage: +2 Str'); }
      if (tcState.flurryOfBlows && !tcState.whirlingFrenzy) { notes.push('Flurry: -2 Atk, +1 Extra Atk'); }
      if (tcState.haste) { notes.push('Haste: +1 Atk, +1 Extra Atk'); }
      if (tcState.smiteEvil && isMelee) { notes.push(`Smite Evil: +${smiteAtkBonus} Atk, +${smiteDmgBonus} Dmg vs Evil`); }
      if (tcState.stunningFist) { notes.push(`Stunning Fist: Fort DC ${10 + Math.floor(totalLevel / 2) + wisMod}`); }
      if (tcState.powerAttack > 0) {
        const is2H = isTwoHandedWeapon(primaryWpn);
        notes.push(`Power Attack (-${tcState.powerAttack}): +${is2H ? tcState.powerAttack * 2 : tcState.powerAttack} Dmg`);
      }
      if (tcState.combatExpertise > 0) { notes.push(`Combat Exp: -${tcState.combatExpertise} Atk`); }
      if (tcState.fightingDefensively) { notes.push('Fight Defensively: -4 Atk'); }
      if (conditionPenalties.attackPenalty !== 0) { notes.push(`Condition: ${conditionPenalties.attackPenalty} Atk`); }
      if (conditionPenalties.meleeAttackPenalty !== 0) { notes.push(`Prone: ${conditionPenalties.meleeAttackPenalty} Melee Atk`); }
      return notes.length > 0 ? `(${notes.join(' • ')})` : '';
    })();

    activeWeaponsList.push({
      label: 'Primary',
      weapon: { ...primaryWpn, threat: primaryThreat },
      attackBonus: totalAtk,
      fullSeq,
      damageStr,
      damageFormula,
      damageBonus: dmgVal,
      threatMin: primaryThreat,
      critStr: `${primaryThreat < 20 ? `${primaryThreat}-20` : '20'}/x${primaryWpn.critMultiplier || 2}${primaryHasKeen ? ' (Keen)' : ''}`,
      type: primaryWpn.type || 'Slashing',
      featAtkBonus: featBonuses.attackBonus,
      featDmgBonus: featBonuses.damageBonus,
      tacticalNote: primaryNote,
      rollOptions: primaryRollOptions,
      critInfo: primaryCritInfo,
      baneAtk: primaryBaneAtk
    });
  }

  // 2. Secondary Weapon
  if (eq.secondaryWeapon && eq.secondaryWeapon !== 'none') {
    const secWpn = resolveEquippedWeapon(character, 'secondaryWeapon', weaponsData, customWeapons);
    const secondaryQualities = (eq.secondaryWeaponQualities && eq.secondaryWeaponQualities.length > 0) ? eq.secondaryWeaponQualities : (secWpn.specialQualities || []);
    const secBaneTarget = eq.secondaryWeaponBaneTarget || secWpn.baneTarget;
    const secondarySpecialDmg = getWeaponSpecialDamage(secondaryQualities, secBaneTarget);
    const secondaryHasKeen = hasKeenQuality(secondaryQualities);
    const secondaryHasSpeed = hasSpeedQuality(secondaryQualities);
    const secThreat = secondaryHasKeen ? calculateKeenThreat(secWpn.threat) : secWpn.threat;
    const featBonuses = calculateFeatCombatBonuses(character, secWpn);
    const wMods = calculateTacticalCombatModifiers(tcState, secWpn, true, false, character.activeBuffs);
    const enh = eq.secondaryWeaponEnhancement ?? secWpn.enhancementBonus ?? 0;
    const isMelee = !secWpn.category?.toLowerCase().includes('ranged');
    const netSmiteAtk = isMelee ? smiteAtkBonus : 0;
    const netSmiteDmg = isMelee ? smiteDmgBonus : 0;
    const isMwk = Boolean(secWpn.isMasterwork || eq.secondaryWeaponMasterwork);
    const effectiveAtkEnh = getWeaponEffectiveAttackEnhancement(secWpn.material || eq.secondaryWeaponMaterial, enh, isMwk);
    const matDmgMod = getWeaponMaterialDamageMod(secWpn.material || eq.secondaryWeaponMaterial);
    const netAtkBonus = effectiveStrMod + effectiveAtkEnh + featBonuses.attackBonus + wMods.attackMod + netSmiteAtk + conditionPenalties.attackPenalty + conditionPenalties.meleeAttackPenalty;
    const totalAtk = bab + netAtkBonus;
    const fullSeq = generateFullAttackSequence(bab, netAtkBonus, tcState.haste || (generalTcMods.extraAttacks || 0) > 0, tcState.flurryOfBlows, tcState.whirlingFrenzy, secondaryHasSpeed);
    const secondaryStrDmg = effectiveStrMod < 0 ? effectiveStrMod : Math.floor(effectiveStrMod / 2);
    const dmgVal = secondaryStrDmg + enh + featBonuses.damageBonus + wMods.damageMod + netSmiteDmg + conditionPenalties.damagePenalty + matDmgMod;
    const baseDmgStr = `${secWpn.damageM}${dmgVal >= 0 ? `+${dmgVal}` : dmgVal}`;
    const damageStr = `${baseDmgStr}${secondarySpecialDmg.damageDiceString}`;
    const damageFormula = `${baseDmgStr}${secondarySpecialDmg.damageDiceFormula}`;

    const secRollOptions = getWeaponRollOptions(secWpn, baseDmgStr, dmgVal, totalAtk, secondaryQualities, secBaneTarget);
    const secBaneAtk = secondarySpecialDmg.hasBane ? getBaneAttackOption(totalAtk, secWpn.name, secBaneTarget) : null;
    const secCritInfo = calculateCritDamagePools(secWpn, dmgVal, secondaryQualities, secBaneTarget);

    const secNote = (() => {
      const notes: string[] = [];
      const matTraits = getWeaponMaterialTraits(secWpn.material || eq.secondaryWeaponMaterial, isMwk);
      matTraits.forEach(t => notes.push(t));
      if (secondaryHasSpeed) { notes.push('Speed: +1 Extra Atk'); }
      if (secondarySpecialDmg.summaryLabels.length > 0) { notes.push(`Magic: ${secondarySpecialDmg.summaryLabels.join(', ')}`); }
      if (tcState.whirlingFrenzy) { notes.push('Whirling Frenzy: +2 Str, -2 Flurry, +1 Extra Atk'); }
      else if (tcState.rage) { notes.push('Barbarian Rage: +2 Str'); }
      if (tcState.flurryOfBlows && !tcState.whirlingFrenzy) { notes.push('Flurry: -2 Atk, +1 Extra Atk'); }
      if (tcState.haste) { notes.push('Haste: +1 Atk, +1 Extra Atk'); }
      if (tcState.smiteEvil && isMelee) { notes.push(`Smite Evil: +${smiteAtkBonus} Atk, +${smiteDmgBonus} Dmg vs Evil`); }
      if (tcState.stunningFist) { notes.push(`Stunning Fist: Fort DC ${10 + Math.floor(totalLevel / 2) + wisMod}`); }
      if (tcState.powerAttack > 0) { notes.push(`Power Attack: -${tcState.powerAttack} Atk`); }
      if (tcState.combatExpertise > 0) { notes.push(`Combat Exp: -${tcState.combatExpertise} Atk`); }
      if (tcState.fightingDefensively) { notes.push('Fight Defensively: -4 Atk'); }
      if (conditionPenalties.attackPenalty !== 0) { notes.push(`Condition: ${conditionPenalties.attackPenalty} Atk`); }
      if (conditionPenalties.meleeAttackPenalty !== 0) { notes.push(`Prone: ${conditionPenalties.meleeAttackPenalty} Melee Atk`); }
      return notes.length > 0 ? `(${notes.join(' • ')})` : '';
    })();

    activeWeaponsList.push({
      label: 'Off-Hand',
      weapon: { ...secWpn, threat: secThreat },
      attackBonus: totalAtk,
      fullSeq,
      damageStr,
      damageFormula,
      damageBonus: dmgVal,
      threatMin: secThreat,
      critStr: `${secThreat < 20 ? `${secThreat}-20` : '20'}/x${secWpn.critMultiplier || 2}${secondaryHasKeen ? ' (Keen)' : ''}`,
      type: secWpn.type || 'Slashing',
      featAtkBonus: featBonuses.attackBonus,
      featDmgBonus: featBonuses.damageBonus,
      tacticalNote: secNote,
      rollOptions: secRollOptions,
      critInfo: secCritInfo,
      baneAtk: secBaneAtk
    });
  }

  // 3. Ranged Weapon
  if (eq.rangedWeapon && eq.rangedWeapon !== 'none') {
    const rngWpn = resolveEquippedWeapon(character, 'rangedWeapon', weaponsData, customWeapons);
    const rangedQualities = (eq.rangedWeaponQualities && eq.rangedWeaponQualities.length > 0) ? eq.rangedWeaponQualities : (rngWpn.specialQualities || []);
    const rngBaneTarget = eq.rangedWeaponBaneTarget || rngWpn.baneTarget;
    const rangedSpecialDmg = getWeaponSpecialDamage(rangedQualities, rngBaneTarget);
    const rangedHasKeen = hasKeenQuality(rangedQualities);
    const rangedHasSpeed = hasSpeedQuality(rangedQualities);
    const rngThreat = rangedHasKeen ? calculateKeenThreat(rngWpn.threat) : rngWpn.threat;
    const featBonuses = calculateFeatCombatBonuses(character, rngWpn);
    const wMods = calculateTacticalCombatModifiers(tcState, rngWpn, false, true, character.activeBuffs);
    const enh = eq.rangedWeaponEnhancement ?? rngWpn.enhancementBonus ?? 0;
    const isMwk = Boolean(rngWpn.isMasterwork || eq.rangedWeaponMasterwork);
    const effectiveAtkEnh = getWeaponEffectiveAttackEnhancement(rngWpn.material || eq.rangedWeaponMaterial, enh, isMwk);
    const matDmgMod = getWeaponMaterialDamageMod(rngWpn.material || eq.rangedWeaponMaterial);
    const netAtkBonus = effectiveDexMod + effectiveAtkEnh + featBonuses.attackBonus + wMods.attackMod + conditionPenalties.attackPenalty + conditionPenalties.rangedAttackPenalty;
    const totalAtk = bab + netAtkBonus;
    const fullSeq = generateFullAttackSequence(bab, netAtkBonus, tcState.haste || (generalTcMods.extraAttacks || 0) > 0, tcState.flurryOfBlows, tcState.whirlingFrenzy, rangedHasSpeed);
    const dmgVal = enh + featBonuses.damageBonus + wMods.damageMod + conditionPenalties.damagePenalty + matDmgMod;
    const baseDmgStr = `${rngWpn.damageM}${dmgVal > 0 ? `+${dmgVal}` : (dmgVal < 0 ? `${dmgVal}` : '')}`;
    const damageStr = `${baseDmgStr}${rangedSpecialDmg.damageDiceString}`;
    const damageFormula = `${baseDmgStr}${rangedSpecialDmg.damageDiceFormula}`;

    const rngRollOptions = getWeaponRollOptions(rngWpn, baseDmgStr, dmgVal, totalAtk, rangedQualities, rngBaneTarget);
    const rngBaneAtk = rangedSpecialDmg.hasBane ? getBaneAttackOption(totalAtk, rngWpn.name, rngBaneTarget) : null;
    const rngCritInfo = calculateCritDamagePools(rngWpn, dmgVal, rangedQualities, rngBaneTarget);

    const rngNote = (() => {
      const notes: string[] = [];
      const matTraits = getWeaponMaterialTraits(rngWpn.material || eq.rangedWeaponMaterial, isMwk);
      matTraits.forEach(t => notes.push(t));
      if (rangedHasSpeed) { notes.push('Speed: +1 Extra Atk'); }
      if (rangedSpecialDmg.summaryLabels.length > 0) { notes.push(`Magic: ${rangedSpecialDmg.summaryLabels.join(', ')}`); }
      if (tcState.whirlingFrenzy) { notes.push('Whirling Frenzy: -2 Flurry, +1 Extra Atk'); }
      if (tcState.flurryOfBlows && !tcState.whirlingFrenzy) { notes.push('Flurry: -2 Atk, +1 Extra Atk'); }
      if (tcState.haste) { notes.push('Haste: +1 Atk, +1 Extra Atk'); }
      if (tcState.combatExpertise > 0) { notes.push(`Combat Exp: -${tcState.combatExpertise} Atk`); }
      if (tcState.fightingDefensively) { notes.push('Fight Defensively: -4 Atk'); }
      if (conditionPenalties.attackPenalty !== 0) { notes.push(`Condition: ${conditionPenalties.attackPenalty} Atk`); }
      const activeAmmo = (() => {
        if (eq.equippedAmmoId) {
          return (character.inventory || []).find(i => i.id === eq.equippedAmmoId);
        }
        const ammos = getCharacterAmmunition(character);
        const matchType = getMatchingAmmoTypeForWeapon(rngWpn.name);
        return ammos.find(a => a.ammoType === matchType && (a.quantity || 0) > 0) || ammos.find(a => (a.quantity || 0) > 0);
      })();
      if (activeAmmo) {
        notes.push(`Ammo: ${activeAmmo.name} [${activeAmmo.quantity || 0}]`);
      }
      return notes.length > 0 ? `(${notes.join(' • ')})` : '';
    })();

    activeWeaponsList.push({
      label: 'Ranged',
      weapon: { ...rngWpn, threat: rngThreat },
      attackBonus: totalAtk,
      fullSeq,
      damageStr,
      damageFormula,
      damageBonus: dmgVal,
      threatMin: rngThreat,
      critStr: `${rngThreat < 20 ? `${rngThreat}-20` : '20'}/x${rngWpn.critMultiplier || 2}${rangedHasKeen ? ' (Keen)' : ''}`,
      type: rngWpn.type || 'Piercing',
      featAtkBonus: featBonuses.attackBonus,
      featDmgBonus: featBonuses.damageBonus,
      tacticalNote: rngNote,
      rollOptions: rngRollOptions,
      critInfo: rngCritInfo,
      baneAtk: rngBaneAtk
    });
  }

  // 4. Special Maneuver: Grapple
  const grappleCalc = calculateGrappleModifier(
    character,
    bab,
    effectiveStrMod,
    activeWildShape ? { size: activeWildShape.size, name: activeWildShape.name } : raceObj,
    activeWildShape ? undefined : templateObj
  );
  const grappleEntry = getGrappleAttackEntry(
    character,
    bab,
    effectiveStrMod,
    tcState,
    activeWildShape ? { size: activeWildShape.size, name: activeWildShape.name } : raceObj,
    activeWildShape ? undefined : templateObj
  );
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
        <div className="print:hidden space-y-4">
          <VitalsCombatTracker
            character={character}
            maxHp={maxHp}
            racesData={racesData}
            classesData={classesData}
            templatesData={templatesData}
            traitsData={traitsData}
            flawsData={flawsData}
            onChange={onChange}
          />
          <TacticalCombatWidget character={character} bab={bab} onChange={onChange} />
        </div>
      )}

      <div id="printable-character-sheet" className="bg-white text-slate-900 p-8 rounded-xl shadow-2xl space-y-4 font-sans print:p-0 print:shadow-none print:rounded-none print:border-none print:space-y-2.5">
        {/* Page 1 Header */}
        {renderHeader()}

        {/* Active Wild Shape Banner */}
        {activeWildShape && (
          <div className="border-2 border-emerald-600/60 rounded-lg p-2.5 print:p-2 bg-emerald-50 print:bg-slate-50 space-y-1.5 print:space-y-1 print:break-inside-avoid shadow-xs">
            <div className="flex items-center justify-between border-b border-emerald-300/80 print:border-slate-300 pb-1">
              <h3 className="text-xs print:text-[10.5px] font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5 font-heading">
                <i className="fa-solid fa-paw text-emerald-700"></i> Active Wild Shape: {activeWildShape.name} ({activeWildShape.size} {activeWildShape.creatureType})
              </h3>
              {onChange && (
                <button
                  onClick={() => onChange({ wildShape: { ...(character.wildShape || { isActive: false }), isActive: false } })}
                  className="print:hidden text-[11px] font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer"
                  title="Revert to humanoid form"
                >
                  <i className="fa-solid fa-arrow-rotate-left"></i> Revert to Humanoid
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] print:text-[9.5px] font-mono text-emerald-950">
              <span><strong>Str {strScore}</strong> ({strMod >= 0 ? `+${strMod}` : strMod})</span>
              <span>&bull;</span>
              <span><strong>Dex {dexScore}</strong> ({dexMod >= 0 ? `+${dexMod}` : dexMod})</span>
              <span>&bull;</span>
              <span><strong>Con {conScore}</strong> ({conMod >= 0 ? `+${conMod}` : conMod})</span>
              <span>&bull;</span>
              <span><strong>Nat Armor:</strong> +{activeWildShape.naturalArmor}</span>
              <span>&bull;</span>
              <span>
                <strong>Speed:</strong> {activeWildShape.speed.land} ft
                {activeWildShape.speed.fly ? ` (Fly ${activeWildShape.speed.fly} ft ${activeWildShape.speed.flyManeuverability || ''})` : ''}
                {activeWildShape.speed.swim ? ` (Swim ${activeWildShape.speed.swim} ft)` : ''}
                {activeWildShape.speed.burrow ? ` (Burrow ${activeWildShape.speed.burrow} ft)` : ''}
                {activeWildShape.speed.climb ? ` (Climb ${activeWildShape.speed.climb} ft)` : ''}
              </span>
              {activeWildShape.specialQualities && activeWildShape.specialQualities.length > 0 && (
                <>
                  <span>&bull;</span>
                  <span><strong>Traits:</strong> {activeWildShape.specialQualities.join(', ')}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Vitals Banner - strictly 1 row of 6 columns */}
        <div className="grid grid-cols-6 gap-2 print:gap-1.5 text-center font-mono py-2.5 print:py-1.5 bg-slate-100 rounded-lg border border-slate-300 print:break-inside-avoid">
          <div>
            <span className="text-[10px] print:text-[9.5px] text-slate-500 block uppercase font-sans font-bold">Hit Points</span>
            <span className={`text-xl print:text-lg font-bold ${currentHp <= 0 ? 'text-rose-700' : 'text-slate-900'}`}>
              {currentHp}
            </span>
            {tempHp > 0 && (
              <span className="text-[9px] print:text-[8px] text-cyan-700 block font-sans font-semibold leading-tight">
                +{tempHp} Temp HP
              </span>
            )}
            {nonlethalDamage > 0 && (
              <span className="text-[9px] print:text-[8px] text-amber-700 block font-sans font-semibold leading-tight">
                {nonlethalDamage} Nonlethal
              </span>
            )}
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
            {conditionPenalties.acPenalty !== 0 && (
              <span className="text-[9px] print:text-[8px] text-rose-700 block font-sans font-semibold leading-tight">
                {conditionPenalties.acPenalty} AC (Condition)
              </span>
            )}
            {conditionPenalties.loseDexToAc && (
              <span className="text-[9px] print:text-[8px] text-purple-700 block font-sans font-semibold leading-tight">
                No Dex to AC
              </span>
            )}
          </div>
          <div>
            <span className="text-[10px] print:text-[9.5px] text-slate-500 block uppercase font-sans font-bold">Damage Red.</span>
            <span className="text-xl print:text-lg font-bold text-amber-700">{drSummary.bestDRString}</span>
            <span className="text-[10px] print:text-[8.5px] text-slate-500 block leading-tight">{srSummary.hasSR ? srSummary.bestSRString : 'SR None'}</span>
          </div>
          <div
            onClick={() => rollInitiative(totalInitiative, {
              components: [
                { label: 'Dex', value: effectiveDexMod },
                ...(traitFlawInitMod !== 0 ? [{ label: 'Trait/Flaw', value: traitFlawInitMod }] : []),
                ...(conditionPenalties.initiativePenalty !== 0 ? [{ label: 'Condition', value: conditionPenalties.initiativePenalty }] : [])
              ]
            })}
            className="cursor-pointer hover:bg-slate-200/80 rounded transition p-0.5 group"
            title="Click to roll Initiative (1d20 + Init)"
          >
            <span className="text-[10px] print:text-[9.5px] text-slate-500 block uppercase font-sans font-bold group-hover:text-amber-800 flex items-center justify-center gap-1">
              Initiative <i className="fa-solid fa-dice-d20 text-[9px] text-amber-600 opacity-0 group-hover:opacity-100 transition"></i>
            </span>
            <span className="text-xl print:text-lg font-bold text-slate-900 group-hover:text-amber-800">
              {totalInitiative >= 0 ? '+' : ''}{totalInitiative}
            </span>
          </div>
          <div>
            <span className="text-[10px] print:text-[9.5px] text-slate-500 block uppercase font-sans font-bold">Base Attack</span>
            <span className="text-xl print:text-lg font-bold text-slate-900">+{bab}</span>
            <div
              onClick={() => rollGrappleCheck(grappleCalc.total, {
                components: [
                  { label: 'BAB', value: grappleCalc.bab },
                  { label: 'Str', value: grappleCalc.strMod },
                  ...(grappleCalc.sizeMod !== 0 ? [{ label: 'Size', value: grappleCalc.sizeMod }] : []),
                  ...(grappleCalc.featBonus !== 0 ? [{ label: 'Feats', value: grappleCalc.featBonus }] : [])
                ]
              })}
              className="text-[10px] print:text-[8.5px] text-slate-600 block leading-tight cursor-pointer hover:text-amber-800 transition"
              title="Click to roll Grapple Check"
            >
              <span className="font-semibold underline decoration-dotted">Grapple {grappleCalc.total >= 0 ? `+${grappleCalc.total}` : grappleCalc.total}</span>
              {generalTcMods.strBonus > 0 && <span className="text-rose-700 text-[8.5px] ml-0.5">(+{Math.floor(generalTcMods.strBonus / 2)} Str)</span>}
            </div>
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

        {/* Active Conditions & Penalties Banner */}
        {activeConditions.length > 0 && (
          <div className="border-2 border-rose-500/40 rounded-lg p-2.5 print:p-2 bg-rose-50/70 print:bg-slate-50 space-y-1.5 print:space-y-1 print:break-inside-avoid shadow-xs">
            <div className="flex items-center justify-between border-b border-rose-300/80 print:border-slate-300 pb-1 print:pb-0.5">
              <h3 className="text-xs print:text-[10.5px] font-bold uppercase tracking-wider text-rose-950 flex items-center gap-1.5 font-heading">
                <i className="fa-solid fa-masks-theater text-rose-600"></i> Active Conditions & Penalties
              </h3>
              <span className="text-[10px] print:text-[9px] font-mono font-bold bg-rose-200/90 text-rose-950 border border-rose-400/60 px-1.5 py-0.2 rounded">
                {activeConditions.length} Condition{activeConditions.length > 1 ? 's' : ''} Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 print:grid-cols-2 print:gap-1.5">
              {activeConditions.map(condId => {
                const def = CONDITION_MAP[condId];
                return (
                  <div key={condId} className="p-2 print:p-1.5 bg-white rounded border border-rose-200 print:border-slate-200 shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs print:text-[10px] flex items-center gap-1.5">
                        <i className={`${def?.icon || 'fa-solid fa-circle-exclamation'} text-rose-600 print:text-slate-700`}></i> {def?.name || condId}
                      </span>
                      {onChange && (
                        <button
                          onClick={() => onChange({ activeConditions: activeConditions.filter(c => c !== condId) })}
                          className="print:hidden text-[10px] text-slate-400 hover:text-rose-600 transition px-1 cursor-pointer"
                          title={`Remove ${def?.name || condId}`}
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      )}
                    </div>
                    <ul className="text-[10px] print:text-[9px] text-slate-700 font-mono space-y-0.5 list-disc list-inside">
                      {def ? (
                        def.effects.map((eff, i) => (
                          <li key={i} className="leading-tight">{eff}</li>
                        ))
                      ) : (
                        <li className="leading-tight">{condId}</li>
                      )}
                    </ul>
                  </div>
                );
              })}
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
                <tr key={idx} className="hover:bg-slate-100/80 transition-colors">
                  <td className="py-1 font-bold text-slate-900">
                    <div
                      onClick={() => {
                        const attackRollOpts = {
                          threatMin: item.threatMin ?? item.weapon.threat ?? 20,
                          damageBonus: item.damageBonus,
                          damageFormula: item.damageFormula || item.damageStr
                        };
                        if (item.label === 'Ranged' && character.equipment?.autoDecrementAmmo && onChange) {
                          const res = decrementEquippedAmmunition(character, 1);
                          if (res.ammoItem) {
                            onChange(res.updatedCharacter);
                          }
                        }
                        if (item.weapon.id === 'grapple_maneuver') {
                          rollGrappleCheck(item.attackBonus);
                        } else if (item.fullSeq && item.fullSeq.includes('/')) {
                          rollAttackSequence(item.fullSeq, `${item.weapon.name} Attack`, item.weapon, attackRollOpts);
                        } else {
                          rollAttack(item.attackBonus, `${item.weapon.name} Attack`, item.weapon, attackRollOpts);
                        }
                      }}
                      className="cursor-pointer hover:text-amber-800 transition inline-flex items-center gap-1 group"
                      title={`Click to roll ${item.weapon.name}`}
                    >
                      <span className="text-[9.5px] font-sans font-semibold text-slate-500 uppercase mr-1">[{item.label}]</span>
                      <span>{item.weapon.name}</span>
                      <i className="fa-solid fa-dice-d20 text-[10px] text-amber-600 opacity-0 group-hover:opacity-100 transition"></i>
                    </div>
                  </td>
                  <td className="py-1 text-center font-bold text-slate-900">
                    <div
                      onClick={() => {
                        const attackRollOpts = {
                          threatMin: item.threatMin ?? item.weapon.threat ?? 20,
                          damageBonus: item.damageBonus,
                          damageFormula: item.damageFormula || item.damageStr
                        };
                        if (item.label === 'Ranged' && character.equipment?.autoDecrementAmmo && onChange) {
                          const count = item.fullSeq && item.fullSeq.includes('/') ? item.fullSeq.split('/').length : 1;
                          const res = decrementEquippedAmmunition(character, count);
                          if (res.ammoItem) {
                            onChange(res.updatedCharacter);
                          }
                        }
                        if (item.weapon.id === 'grapple_maneuver') {
                          rollGrappleCheck(item.attackBonus);
                        } else if (item.fullSeq && item.fullSeq.includes('/')) {
                          rollAttackSequence(item.fullSeq, `${item.weapon.name} Attack`, item.weapon, attackRollOpts);
                        } else {
                          rollAttack(item.attackBonus, `${item.weapon.name} Attack`, item.weapon, attackRollOpts);
                        }
                      }}
                      className="cursor-pointer hover:bg-slate-200/80 px-1.5 py-0.5 rounded transition inline-block group"
                      title="Click to roll Attack sequence"
                    >
                      <span className="group-hover:text-amber-800 group-hover:underline">
                        {item.fullSeq || (item.attackBonus >= 0 ? `+${item.attackBonus}` : `${item.attackBonus}`)}
                      </span>
                      {item.tacticalNote && (
                        <div className="text-[8.5px] text-slate-500 font-sans font-normal leading-none">{item.tacticalNote}</div>
                      )}
                    </div>
                    {item.baneAtk && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.label === 'Ranged' && character.equipment?.autoDecrementAmmo && onChange) {
                            const res = decrementEquippedAmmunition(character, 1);
                            if (res.ammoItem) {
                              onChange(res.updatedCharacter);
                            }
                          }
                          rollAttack(item.baneAtk!.atkBonus, item.baneAtk!.label, item.weapon, {
                            threatMin: item.threatMin ?? item.weapon.threat ?? 20,
                            damageBonus: item.damageBonus,
                            damageFormula: item.damageFormula || item.damageStr
                          });
                        }}
                        className="mt-0.5 text-[9px] text-red-600 hover:text-red-800 hover:underline cursor-pointer flex items-center justify-center gap-0.5"
                        title={`Click to roll ${item.baneAtk.label}`}
                      >
                        <i className="fa-solid fa-bullseye text-[8px]"></i>
                        <span>{item.baneAtk.atkBonus >= 0 ? `+${item.baneAtk.atkBonus}` : item.baneAtk.atkBonus} ({item.baneAtk.condition})</span>
                      </div>
                    )}
                  </td>
                  <td className="py-1 text-center text-slate-800">
                    <div
                      onClick={() => {
                        if (item.rollOptions && item.rollOptions.length > 0) {
                          const baseOpt = item.rollOptions[0];
                          rollDamage(baseOpt.rollFormula, `${item.weapon.name} Damage`, {
                            weapon: item.weapon,
                            damagePools: baseOpt.damagePools,
                            isNonlethal: baseOpt.isNonlethal
                          });
                        } else {
                          const rollFormula = item.damageFormula || (item.damageStr || '').split(' ')[0];
                          if (rollFormula) {
                            rollDamage(rollFormula, `${item.weapon.name} Damage`);
                          }
                        }
                      }}
                      className="cursor-pointer hover:bg-slate-200/80 px-1.5 py-0.5 rounded transition inline-block group"
                      title="Click to roll Damage"
                    >
                      <span className="group-hover:text-amber-800 group-hover:underline font-bold">
                        {item.damageStr}
                      </span>
                    </div>
                    {item.rollOptions && item.rollOptions.length > 1 && (
                      <div className="flex flex-wrap items-center justify-center gap-1 mt-0.5">
                        {item.rollOptions.slice(1).map((opt) => (
                          <button
                            key={opt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              rollDamage(opt.rollFormula, `${item.weapon.name} ${opt.label}`, {
                                weapon: item.weapon,
                                damagePools: opt.damagePools,
                                isNonlethal: opt.isNonlethal
                              });
                            }}
                            className={`px-1 py-0.2 rounded text-[9px] font-mono font-semibold border transition cursor-pointer ${
                              opt.type === 'merciful'
                                ? 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-300'
                                : opt.type === 'bane'
                                ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-300'
                                : opt.type === 'vicious'
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                                : opt.type === 'alignment'
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                            }`}
                            title={opt.buttonTitle || `Roll ${opt.label}`}
                          >
                            {opt.icon && <i className={`${opt.icon} text-[8px] mr-0.5`}></i>}
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-1 text-center text-slate-800">
                    {item.critInfo ? (
                      <div
                        onClick={() => {
                          rollDamage(item.critInfo!.rollFormula, item.critInfo!.label, {
                            rollType: 'damage',
                            weapon: item.weapon,
                            critMultiplier: item.weapon.critMultiplier || 2,
                            damagePools: item.critInfo!.damagePools
                          });
                        }}
                        className="cursor-pointer hover:bg-slate-200/80 px-1.5 py-0.5 rounded transition inline-block group"
                        title="Click to roll Critical Damage"
                      >
                        <span className="group-hover:text-amber-800 group-hover:underline font-bold text-amber-900">
                          {item.critStr}
                        </span>
                        <i className="fa-solid fa-burst text-[9px] text-amber-600 opacity-0 group-hover:opacity-100 ml-1 transition"></i>
                      </div>
                    ) : (
                      item.critStr
                    )}
                  </td>
                  <td className="py-1 text-center text-slate-800">{item.type}</td>
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
                  Armor: {armorObj.name} {armorEnhancement ? `+${armorEnhancement}` : ''}
                  {armorQualities.length > 0 && (
                    <span className="text-[10px] text-indigo-700 font-sans font-normal ml-1">
                      ({armorQualities.map(q => getQualityById(q)?.name || q).join(', ')})
                    </span>
                  )}
                </span>
                <p className="text-slate-600 text-[11px] print:text-[9.5px]">AC: +{armorAc} | Max Dex: +{armorObj.maxDex} | Check: {armorObj.checkPenalty}</p>
              </div>
              <div className="p-1.5 bg-white rounded border border-slate-200 space-y-0.5">
                <span className="font-bold block text-slate-900">
                  Shield: {shieldObj.name} {shieldEnhancement ? `+${shieldEnhancement}` : ''}
                  {shieldQualities.length > 0 && (
                    <span className="text-[10px] text-indigo-700 font-sans font-normal ml-1">
                      ({shieldQualities.map(q => getQualityById(q)?.name || q).join(', ')})
                    </span>
                  )}
                </span>
                <p className="text-slate-600 text-[11px] print:text-[9.5px]">AC: +{shieldAc} | Check: {shieldObj.checkPenalty}</p>
              </div>
            </div>
          </div>

          {/* Defenses & Resistances (DR / SR / Fortification) */}
          <div className="border border-slate-300 rounded-lg p-2.5 print:p-2 bg-slate-50 space-y-1.5 print:space-y-1">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1 print:pb-0.5">
              <h3 className="text-xs print:text-[10.5px] font-bold uppercase tracking-wider text-slate-800">
                Defenses & Resistances (DR / SR / Fort)
              </h3>
              <div className="flex items-center gap-1 font-mono text-[11px] print:text-[9.5px]">
                {fortificationSummary.hasFortification && (
                  <span className="font-bold px-1.5 py-0.2 rounded border text-amber-950 bg-amber-200 border-amber-400">
                    Fort {fortificationSummary.percentage}%
                  </span>
                )}
                <span className={`font-bold px-1.5 py-0.2 rounded border ${drSummary.hasDR ? 'text-amber-900 bg-amber-100 border-amber-300' : 'text-slate-600 bg-slate-200 border-slate-300'}`}>
                  {drSummary.hasDR ? drSummary.bestDRString : 'DR: None'}
                </span>
                <span className={`font-bold px-1.5 py-0.2 rounded border ${srSummary.hasSR ? 'text-indigo-800 bg-indigo-100 border-indigo-300' : 'text-slate-600 bg-slate-200 border-slate-300'}`}>
                  {srSummary.hasSR ? srSummary.bestSRString : 'SR: None'}
                </span>
              </div>
            </div>
            {drSummary.hasDR || srSummary.hasSR || fortificationSummary.hasFortification ? (
              <div className="space-y-1 text-xs font-mono print:text-[10px]">
                {fortificationSummary.hasFortification && (
                  <div className="p-1.5 bg-white rounded border border-slate-200">
                    <span className="text-[9.5px] font-sans font-bold text-amber-800 block uppercase">Fortification</span>
                    <span className="font-bold text-slate-900">{fortificationSummary.percentage}% Chance to Negate Criticals & Sneak Attacks</span>
                    <div className="text-[10px] print:text-[9px] text-slate-600 font-sans leading-tight mt-0.5">
                      <span className="font-bold text-slate-700">Source: </span>
                      {fortificationSummary.source}
                    </div>
                  </div>
                )}
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
                  {[
                    ...(fortificationSummary.hasFortification ? [`${fortificationSummary.source} (${fortificationSummary.percentage}% Fortification)`] : []),
                    ...drSummary.sources.map(s =>
                      s.name.includes(`(${s.value}/${s.bypass})`) || s.name.includes(`/${s.bypass}`)
                        ? s.name
                        : `${s.name} (${s.value}/${s.bypass})`
                    ),
                    ...srSummary.sources.map(s =>
                      s.name.includes(`SR ${s.value}`) || s.name.includes(`(${s.value})`)
                        ? s.name
                        : `${s.name} (SR ${s.value})`
                    )
                  ].join(', ')}
                </div>
              </div>
            ) : (
              <div className="p-3 print:p-2 bg-white rounded border border-slate-200 flex items-center justify-center min-h-[64px] print:min-h-[56px] text-center">
                <p className="text-[11px] print:text-[9.5px] text-slate-500 italic font-mono">
                  No active Damage Reduction (DR), Spell Resistance (SR), or Fortification defenses detected.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Wondrous Items & Magic Gear Section */}
        {((eq.wondrousItems || []).length > 0 || sheetBodySlotReport.totalConflicts > 0) && (
          <div className="border border-slate-300 rounded-lg p-2.5 print:p-2 bg-slate-50 space-y-1.5 print:space-y-1 print:break-inside-avoid">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1 print:pb-0.5">
              <h3 className="text-xs print:text-[10.5px] font-bold uppercase tracking-wider text-slate-800">
                Wondrous Items & Magic Gear ({eq.wondrousItems?.length || 0} Equipped)
              </h3>
              {sheetBodySlotReport.totalConflicts > 0 && (
                <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded border border-red-300 animate-pulse">
                  ⚠ {sheetBodySlotReport.totalConflicts} Slot Conflict{sheetBodySlotReport.totalConflicts > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {sheetBodySlotReport.totalConflicts > 0 && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-[11px] print:text-[9.5px] p-2 rounded leading-tight">
                <span className="font-bold">Slot Conflict Alert:</span> Multiple items occupy the same body slot ({sheetBodySlotReport.conflicts.map(c => c.slot.name).join(', ')}). Under D&D 3.5e rules (MIC p.218 / DMG p.214), excess items provide no magical benefits until unequipped.
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 print:gap-1 text-xs font-mono print:text-[10px]">
              {(eq.wondrousItems || []).map(w => {
                const isConflict = sheetBodySlotReport.conflicts.some(c => c.equippedItems.some(i => i.id === w.id));
                const slotDef = BODY_SLOT_MAP[w.slot];
                return (
                  <div
                    key={w.id}
                    className={`p-1.5 bg-white rounded border ${
                      isConflict ? 'border-red-400 bg-red-50/50' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-bold text-slate-900 block leading-tight">
                        {w.name}{' '}
                        <span className="text-[9px] text-purple-700 uppercase font-sans font-medium">
                          ({slotDef?.name || w.slot})
                        </span>
                      </span>
                      {isConflict && (
                        <span className="text-[8.5px] font-bold text-red-600 bg-red-100 px-1 py-0.5 rounded border border-red-200 shrink-0">
                          Conflict
                        </span>
                      )}
                    </div>
                    {w.effect && <p className="text-slate-600 text-[10px] print:text-[9px] leading-tight mt-0.5">{w.effect}</p>}
                  </div>
                );
              })}
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
                  <tr
                    onClick={() => rollAbilityCheck(effectiveStrMod, 'Strength')}
                    className={`cursor-pointer hover:bg-slate-200/80 transition-colors group ${activeWildShape ? 'bg-emerald-50' : (generalTcMods.strBonus > 0 ? 'bg-amber-100/80' : '')}`}
                    title="Click to roll Strength check (1d20 + Str)"
                  >
                    <td className="py-0.5 font-bold flex items-center gap-1 group-hover:text-amber-800">
                      STR
                      <i className="fa-solid fa-dice-d20 text-[9px] text-amber-600 opacity-0 group-hover:opacity-100 transition"></i>
                      {activeWildShape && (
                        <span className="text-[8px] text-emerald-800 bg-emerald-100 border border-emerald-300 px-1 rounded uppercase font-sans font-bold">
                          {activeWildShape.name}
                        </span>
                      )}
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
                    <td className="py-0.5 text-center font-bold group-hover:text-amber-800">
                      {effectiveStrMod >= 0 ? `+${effectiveStrMod}` : effectiveStrMod}
                    </td>
                  </tr>
                  <tr
                    onClick={() => rollAbilityCheck(effectiveDexMod, 'Dexterity')}
                    className={`cursor-pointer hover:bg-slate-200/80 transition-colors group ${activeWildShape ? 'bg-emerald-50' : ((generalTcMods.dexBonus || 0) > 0 ? 'bg-amber-100/80' : '')}`}
                    title="Click to roll Dexterity check (1d20 + Dex)"
                  >
                    <td className="py-0.5 font-bold flex items-center gap-1 group-hover:text-amber-800">
                      DEX
                      <i className="fa-solid fa-dice-d20 text-[9px] text-amber-600 opacity-0 group-hover:opacity-100 transition"></i>
                      {activeWildShape && (
                        <span className="text-[8px] text-emerald-800 bg-emerald-100 border border-emerald-300 px-1 rounded uppercase font-sans font-bold">
                          {activeWildShape.name}
                        </span>
                      )}
                      {(generalTcMods.dexBonus || 0) > 0 && (
                        <span className="text-[8.5px] text-amber-900 bg-amber-200/90 px-1 rounded uppercase font-sans font-bold" title="Dexterity Buff">
                          +{generalTcMods.dexBonus} (Buff)
                        </span>
                      )}
                    </td>
                    <td className="py-0.5 text-center font-bold">
                      {effectiveDexScore}
                      {(generalTcMods.dexBonus || 0) > 0 && <span className="text-[10px] text-slate-500 font-normal ml-0.5">(Base {dexScore})</span>}
                    </td>
                    <td className="py-0.5 text-center font-bold group-hover:text-amber-800">{effectiveDexMod >= 0 ? '+' : ''}{effectiveDexMod}</td>
                  </tr>
                  <tr
                    onClick={() => rollAbilityCheck(effectiveConMod, 'Constitution')}
                    className={`cursor-pointer hover:bg-slate-200/80 transition-colors group ${activeWildShape ? 'bg-emerald-50' : (generalTcMods.conBonus > 0 ? 'bg-amber-100/80' : '')}`}
                    title="Click to roll Constitution check (1d20 + Con)"
                  >
                    <td className="py-0.5 font-bold flex items-center gap-1 group-hover:text-amber-800">
                      CON
                      <i className="fa-solid fa-dice-d20 text-[9px] text-amber-600 opacity-0 group-hover:opacity-100 transition"></i>
                      {activeWildShape && (
                        <span className="text-[8px] text-emerald-800 bg-emerald-100 border border-emerald-300 px-1 rounded uppercase font-sans font-bold">
                          {activeWildShape.name}
                        </span>
                      )}
                      {generalTcMods.conBonus > 0 && (
                        <span className="text-[8.5px] text-amber-900 bg-amber-200/90 px-1 rounded uppercase font-sans font-bold" title={tcState.rage ? 'Barbarian Rage' : 'Constitution Buff'}>
                          +{generalTcMods.conBonus} ({tcState.rage ? 'Rage' : 'Buff'})
                        </span>
                      )}
                    </td>
                    <td className="py-0.5 text-center font-bold">
                      {effectiveConScore}
                      {generalTcMods.conBonus > 0 && <span className="text-[10px] text-slate-500 font-normal ml-0.5">(Base {conScore})</span>}
                    </td>
                    <td className="py-0.5 text-center font-bold group-hover:text-amber-800">
                      {effectiveConMod >= 0 ? `+${effectiveConMod}` : effectiveConMod}
                    </td>
                  </tr>
                  <tr
                    onClick={() => rollAbilityCheck(effectiveIntMod, 'Intelligence')}
                    className={`cursor-pointer hover:bg-slate-200/80 transition-colors group ${(generalTcMods.intBonus || 0) > 0 ? 'bg-amber-100/80' : ''}`}
                    title="Click to roll Intelligence check (1d20 + Int)"
                  >
                    <td className="py-0.5 font-bold flex items-center gap-1 group-hover:text-amber-800">
                      INT
                      <i className="fa-solid fa-dice-d20 text-[9px] text-amber-600 opacity-0 group-hover:opacity-100 transition"></i>
                      {(generalTcMods.intBonus || 0) > 0 && (
                        <span className="text-[8.5px] text-amber-900 bg-amber-200/90 px-1 rounded uppercase font-sans font-bold" title="Intelligence Buff">
                          +{generalTcMods.intBonus} (Buff)
                        </span>
                      )}
                    </td>
                    <td className="py-0.5 text-center font-bold">
                      {effectiveIntScore}
                      {(generalTcMods.intBonus || 0) > 0 && <span className="text-[10px] text-slate-500 font-normal ml-0.5">(Base {intScore})</span>}
                    </td>
                    <td className="py-0.5 text-center font-bold group-hover:text-amber-800">{effectiveIntMod >= 0 ? '+' : ''}{effectiveIntMod}</td>
                  </tr>
                  <tr
                    onClick={() => rollAbilityCheck(effectiveWisMod, 'Wisdom')}
                    className={`cursor-pointer hover:bg-slate-200/80 transition-colors group ${(generalTcMods.wisBonus || 0) > 0 ? 'bg-amber-100/80' : ''}`}
                    title="Click to roll Wisdom check (1d20 + Wis)"
                  >
                    <td className="py-0.5 font-bold flex items-center gap-1 group-hover:text-amber-800">
                      WIS
                      <i className="fa-solid fa-dice-d20 text-[9px] text-amber-600 opacity-0 group-hover:opacity-100 transition"></i>
                      {(generalTcMods.wisBonus || 0) > 0 && (
                        <span className="text-[8.5px] text-amber-900 bg-amber-200/90 px-1 rounded uppercase font-sans font-bold" title="Wisdom Buff">
                          +{generalTcMods.wisBonus} (Buff)
                        </span>
                      )}
                    </td>
                    <td className="py-0.5 text-center font-bold">
                      {effectiveWisScore}
                      {(generalTcMods.wisBonus || 0) > 0 && <span className="text-[10px] text-slate-500 font-normal ml-0.5">(Base {wisScore})</span>}
                    </td>
                    <td className="py-0.5 text-center font-bold group-hover:text-amber-800">{effectiveWisMod >= 0 ? '+' : ''}{effectiveWisMod}</td>
                  </tr>
                  <tr
                    onClick={() => rollAbilityCheck(effectiveChaMod, 'Charisma')}
                    className={`cursor-pointer hover:bg-slate-200/80 transition-colors group ${(generalTcMods.chaBonus || 0) > 0 ? 'bg-amber-100/80' : ''}`}
                    title="Click to roll Charisma check (1d20 + Cha)"
                  >
                    <td className="py-0.5 font-bold flex items-center gap-1 group-hover:text-amber-800">
                      CHA
                      <i className="fa-solid fa-dice-d20 text-[9px] text-amber-600 opacity-0 group-hover:opacity-100 transition"></i>
                      {(generalTcMods.chaBonus || 0) > 0 && (
                        <span className="text-[8.5px] text-amber-900 bg-amber-200/90 px-1 rounded uppercase font-sans font-bold" title="Charisma Buff">
                          +{generalTcMods.chaBonus} (Buff)
                        </span>
                      )}
                    </td>
                    <td className="py-0.5 text-center font-bold">
                      {effectiveChaScore}
                      {(generalTcMods.chaBonus || 0) > 0 && <span className="text-[10px] text-slate-500 font-normal ml-0.5">(Base {chaScore})</span>}
                    </td>
                    <td className="py-0.5 text-center font-bold group-hover:text-amber-800">{effectiveChaMod >= 0 ? '+' : ''}{effectiveChaMod}</td>
                  </tr>
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
                  <tr
                    onClick={() => rollSavingThrow(totalFort, 'Fortitude', {
                      components: [
                        { label: 'Base Fort', value: baseFort },
                        { label: 'Con', value: conMod },
                        ...(generalTcMods.fortSaveMod !== 0 ? [{ label: 'Tactical', value: generalTcMods.fortSaveMod }] : []),
                        ...(traitFlawSaveMods.fort !== 0 ? [{ label: 'Trait/Flaw', value: traitFlawSaveMods.fort }] : [])
                      ]
                    })}
                    className="cursor-pointer hover:bg-slate-200/80 transition-colors group"
                    title="Click to roll Fortitude Save"
                  >
                    <td className="py-0.5 font-bold flex items-center gap-1 group-hover:text-amber-800">
                      FORTITUDE (Con)
                      <i className="fa-solid fa-dice-d20 text-[9px] text-amber-600 opacity-0 group-hover:opacity-100 transition"></i>
                    </td>
                    <td className="py-0.5 text-center font-bold text-xs print:text-[10.5px] group-hover:text-amber-800">{totalFort >= 0 ? '+' : ''}{totalFort}</td>
                    <td className="py-0.5 text-center">{baseFort}</td>
                    <td className="py-0.5 text-center">{conMod >= 0 ? '+' : ''}{conMod}</td>
                    <td className="py-0.5 text-center text-[10px] print:text-[9px] text-slate-600">
                      {traitFlawSaveMods.fort !== 0 || generalTcMods.fortSaveMod !== 0 ? (
                        <span>
                          {generalTcMods.fortSaveMod > 0 ? `+${generalTcMods.fortSaveMod} (${tcState.rage ? 'Rage' : 'Tactical/Buff'})` : ''}
                          {traitFlawSaveMods.fort !== 0 ? ` ${traitFlawSaveMods.fort > 0 ? `+${traitFlawSaveMods.fort}` : traitFlawSaveMods.fort} (Trait/Flaw)` : ''}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                  <tr
                    onClick={() => rollSavingThrow(totalRef, 'Reflex', {
                      components: [
                        { label: 'Base Ref', value: baseRef },
                        { label: 'Dex', value: dexMod },
                        ...(generalTcMods.refSaveMod !== 0 ? [{ label: 'Tactical', value: generalTcMods.refSaveMod }] : []),
                        ...(traitFlawSaveMods.ref !== 0 ? [{ label: 'Trait/Flaw', value: traitFlawSaveMods.ref }] : [])
                      ]
                    })}
                    className="cursor-pointer hover:bg-slate-200/80 transition-colors group"
                    title="Click to roll Reflex Save"
                  >
                    <td className="py-0.5 font-bold flex items-center gap-1 group-hover:text-amber-800">
                      REFLEX (Dex)
                      <i className="fa-solid fa-dice-d20 text-[9px] text-amber-600 opacity-0 group-hover:opacity-100 transition"></i>
                    </td>
                    <td className="py-0.5 text-center font-bold text-xs print:text-[10.5px] group-hover:text-amber-800">{totalRef >= 0 ? '+' : ''}{totalRef}</td>
                    <td className="py-0.5 text-center">{baseRef}</td>
                    <td className="py-0.5 text-center">{dexMod >= 0 ? '+' : ''}{dexMod}</td>
                    <td className="py-0.5 text-center text-[10px] print:text-[9px] text-slate-600">
                      {traitFlawSaveMods.ref !== 0 || generalTcMods.refSaveMod !== 0 ? (
                        <span>
                          {generalTcMods.refSaveMod > 0 ? (
                            tcState.whirlingFrenzy && tcState.haste ? '+3 (+2 Frenzy, +1 Haste)' :
                            tcState.whirlingFrenzy ? '+2 (Frenzy)' :
                            tcState.haste ? '+1 (Haste)' :
                            `+${generalTcMods.refSaveMod} (Tactical/Buff)`
                          ) : ''}
                          {traitFlawSaveMods.ref !== 0 ? ` ${traitFlawSaveMods.ref > 0 ? `+${traitFlawSaveMods.ref}` : traitFlawSaveMods.ref} (Trait/Flaw)` : ''}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                  <tr
                    onClick={() => rollSavingThrow(totalWill, 'Will', {
                      components: [
                        { label: 'Base Will', value: baseWill },
                        { label: 'Wis', value: baseWisMod },
                        ...(generalTcMods.willSaveMod !== 0 ? [{ label: 'Tactical', value: generalTcMods.willSaveMod }] : []),
                        ...(traitFlawSaveMods.will !== 0 ? [{ label: 'Trait/Flaw', value: traitFlawSaveMods.will }] : [])
                      ]
                    })}
                    className="cursor-pointer hover:bg-slate-200/80 transition-colors group"
                    title="Click to roll Will Save"
                  >
                    <td className="py-0.5 font-bold flex items-center gap-1 group-hover:text-amber-800">
                      WILL (Wis)
                      <i className="fa-solid fa-dice-d20 text-[9px] text-amber-600 opacity-0 group-hover:opacity-100 transition"></i>
                    </td>
                    <td className="py-0.5 text-center font-bold text-xs print:text-[10.5px] group-hover:text-amber-800">{totalWill >= 0 ? '+' : ''}{totalWill}</td>
                    <td className="py-0.5 text-center">{baseWill}</td>
                    <td className="py-0.5 text-center">{baseWisMod >= 0 ? '+' : ''}{baseWisMod}</td>
                    <td className="py-0.5 text-center text-[10px] print:text-[9px] text-slate-600">
                      {traitFlawSaveMods.will !== 0 || generalTcMods.willSaveMod !== 0 ? (
                        <span>
                          {generalTcMods.willSaveMod > 0 ? `+${generalTcMods.willSaveMod} (${tcState.rage ? 'Rage' : 'Tactical/Buff'})` : ''}
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
                <p><span className="font-bold text-slate-900 font-sans">Feats:</span> {(character.selectedFeatEntities || []).map(f => f.notes || (f.targetId ? `${f.featId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} (${f.targetId.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')})` : f.featId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))).join(', ') || 'None selected.'}</p>
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

        {/* Printable Spellcasting & Spells Known/Prepared Section (Static & Non-interactive for Paper/PDF) */}
        {sheetCasterEntries.length > 0 && (
          <div className="space-y-3 print:space-y-2 print:break-inside-avoid">
            {sheetCasterEntries.map(([clsName, clsLvl]) => {
              const key = toCanonicalClassId(clsName);
              const clsObj = classesData.find(c => c.id === clsName || c.name.toLowerCase() === clsName.toLowerCase());
              const info = SPELLCASTING_CLASSES[key] || {
                name: clsObj?.name || clsName,
                keyAbility: 'int' as const,
                type: 'Arcane' as const,
                method: 'Prepared' as const,
                maxSpellLevel: 9
              };
              const displayName = clsObj?.name || info.name || clsName;
              const abilityScore = calculateTotalScore(
                info.keyAbility,
                character.baseStats,
                raceMods,
                character.levelBumps || {},
                character.enhancementMods || {},
                totalLevel,
                traitFlawStatMods
              );
              const abilityMod = getAbilityMod(abilityScore);
              const spellSlotsData = getSpellSlotsForClass(clsName, clsLvl, abilityMod);
              if (!spellSlotsData) return null;

              const isPrepared = isPreparedCaster(clsName);
              const classPreparedSlots = (character.preparedSpells || []).filter(
                s => s.className === key || s.className === clsName
              );

              return (
                <div
                  key={clsName}
                  className="border border-slate-300 rounded-lg p-3 print:p-2 bg-slate-50 space-y-2.5 print:space-y-1.5 shadow-xs"
                >
                  {/* Caster Header */}
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-300 pb-1.5 print:pb-1 gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs print:text-[11px] font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5 font-heading">
                        <i className="fa-solid fa-wand-magic-sparkles text-amber-600"></i> {displayName} Spellcasting & Spells
                      </h3>
                      <span className="text-[10px] print:text-[9px] font-mono font-bold bg-slate-200 text-slate-800 border border-slate-300 px-1.5 py-0.2 rounded">
                        CL {clsLvl} &bull; {info.type} ({info.method})
                      </span>
                    </div>

                    <div className="text-xs print:text-[10px] font-mono text-slate-700">
                      Key Ability: <strong className="text-slate-900">{info.keyAbility.toUpperCase()} {abilityScore}</strong> ({abilityMod >= 0 ? `+${abilityMod}` : abilityMod})
                    </div>
                  </div>

                  {/* Spell Level Slots Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 print:grid-cols-5 print:gap-1.5">
                    {spellSlotsData.slots.filter(s => s.canCast && s.total > 0).map(slot => {
                      const levelPreparedSpells = classPreparedSlots.filter(s => s.spellLevel === slot.spellLevel && !!s.spellId);

                      return (
                        <div
                          key={slot.spellLevel}
                          className="p-2 bg-white rounded border border-slate-300 shadow-xs space-y-1.5 print:space-y-1 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                            <span className="font-bold text-slate-900 text-xs print:text-[10px] font-mono">
                              {slot.spellLevel === 0 ? 'Cantrips (0th)' : `Level ${slot.spellLevel}`}
                            </span>
                            <span className="text-[10px] print:text-[9px] font-mono font-bold text-slate-800 bg-slate-100 border border-slate-300 px-1.5 py-0.2 rounded">
                              DC {slot.saveDc}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10.5px] print:text-[9px] font-mono">
                            <span className="text-slate-600">
                              Slots/Day: <strong className="text-slate-900">{slot.total}</strong>
                            </span>
                            <span className="text-slate-500 text-[10px] print:text-[8.5px]">
                              ({slot.base}b{slot.bonus > 0 ? `+${slot.bonus}` : ''})
                            </span>
                          </div>

                          {/* Printable Slot Bubbles (Static circles for pencil marking) */}
                          <div className="flex flex-wrap items-center gap-1 py-0.5">
                            <span className="text-[9px] print:text-[8px] uppercase font-bold text-slate-400 mr-0.5">Slots:</span>
                            {Array.from({ length: slot.total }, (_, i) => (
                              <span
                                key={i}
                                className="w-3.5 h-3.5 print:w-3 print:h-3 rounded-full border border-slate-600 bg-white inline-block"
                                title={`Slot ${i + 1}`}
                              />
                            ))}
                          </div>

                          {/* Assigned Prepared Spells list (if prepared caster) */}
                          {isPrepared && levelPreparedSpells.length > 0 && (
                            <div className="pt-1 border-t border-slate-200 space-y-1">
                              <span className="text-[9px] print:text-[8px] uppercase font-bold text-slate-500 block font-sans">
                                Prepared Spells:
                              </span>
                              <div className="space-y-0.5 font-mono text-[10px] print:text-[9px]">
                                {levelPreparedSpells.map(prepSlot => (
                                  <div
                                    key={prepSlot.id}
                                    className="flex items-center gap-1.5 p-0.5 rounded border border-slate-200 bg-slate-50/50"
                                  >
                                    <span className="w-2.5 h-2.5 rounded border border-slate-400 bg-white inline-block shrink-0" />
                                    <span className="truncate font-medium text-slate-800" title={prepSlot.spellName || 'Prepared Spell'}>
                                      {prepSlot.spellName || 'Spell'}
                                      {prepSlot.isDomain ? ' ★' : ''}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

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
                    <tr
                      key={sk.name}
                      onClick={() => rollSkillCheck(sk.totalMod, sk.name, {
                        components: [
                          ...(sk.ranks > 0 ? [{ label: 'Ranks', value: Math.floor(sk.ranks) }] : []),
                          { label: sk.keyAbility, value: sk.abMod },
                          ...(sk.tfSkillMod !== 0 ? [{ label: 'Trait/Flaw', value: sk.tfSkillMod }] : []),
                          ...(sk.armorSkillBonus !== 0 ? [{ label: 'Armor Quality', value: sk.armorSkillBonus }] : []),
                          ...(sk.skillSpecificPenalty !== 0 ? [{ label: 'Penalty', value: sk.skillSpecificPenalty }] : [])
                        ]
                      })}
                      className="hover:bg-slate-200/80 cursor-pointer transition-colors group"
                      title={`Click to roll ${sk.name} Check`}
                    >
                      <td className="py-0.5 px-1 text-center">
                        {sk.isClass ? (
                          <span className="font-bold text-[9px] text-slate-900 bg-slate-200 px-1 rounded">C</span>
                        ) : (
                          <span className="text-[9px] text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-0.5 px-1 font-sans font-semibold text-slate-900 group-hover:text-amber-800">
                        <span className="flex items-center justify-between">
                          <span>{sk.name}</span>
                          <i className="fa-solid fa-dice-d20 text-[9px] text-amber-600 opacity-0 group-hover:opacity-100 transition mr-1"></i>
                        </span>
                      </td>
                      <td className="py-0.5 px-1 text-center text-slate-600 text-[10px]">{sk.keyAbility}</td>
                      <td className="py-0.5 px-1 text-center text-slate-700">{sk.ranks > 0 ? sk.ranks : '-'}</td>
                      <td className="py-0.5 px-1 text-right font-bold text-slate-900 group-hover:text-amber-800">
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
                    <tr
                      key={sk.name}
                      onClick={() => rollSkillCheck(sk.totalMod, sk.name, {
                        components: [
                          ...(sk.ranks > 0 ? [{ label: 'Ranks', value: Math.floor(sk.ranks) }] : []),
                          { label: sk.keyAbility, value: sk.abMod },
                          ...(sk.tfSkillMod !== 0 ? [{ label: 'Trait/Flaw', value: sk.tfSkillMod }] : []),
                          ...(sk.armorSkillBonus !== 0 ? [{ label: 'Armor Quality', value: sk.armorSkillBonus }] : []),
                          ...(sk.skillSpecificPenalty !== 0 ? [{ label: 'Penalty', value: sk.skillSpecificPenalty }] : [])
                        ]
                      })}
                      className="hover:bg-slate-200/80 cursor-pointer transition-colors group"
                      title={`Click to roll ${sk.name} Check`}
                    >
                      <td className="py-0.5 px-1 text-center">
                        {sk.isClass ? (
                          <span className="font-bold text-[9px] text-slate-900 bg-slate-200 px-1 rounded">C</span>
                        ) : (
                          <span className="text-[9px] text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-0.5 px-1 font-sans font-semibold text-slate-900 group-hover:text-amber-800">
                        <span className="flex items-center justify-between">
                          <span>{sk.name}</span>
                          <i className="fa-solid fa-dice-d20 text-[9px] text-amber-600 opacity-0 group-hover:opacity-100 transition mr-1"></i>
                        </span>
                      </td>
                      <td className="py-0.5 px-1 text-center text-slate-600 text-[10px]">{sk.keyAbility}</td>
                      <td className="py-0.5 px-1 text-center text-slate-700">{sk.ranks > 0 ? sk.ranks : '-'}</td>
                      <td className="py-0.5 px-1 text-right font-bold text-slate-900 group-hover:text-amber-800">
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
                  <p className="text-slate-700 font-sans text-[11px] print:text-[10.5px] leading-relaxed print:leading-normal whitespace-pre-wrap">{character.notes.backstory}</p>
                </div>
              )}
              {(character.notes.quests || []).filter(q => q.status === 'active').length > 0 && (
                <div className="text-xs space-y-1 border-t border-slate-200 pt-2">
                  <span className="font-bold text-slate-900 block">Active Quests:</span>
                  <ul className="list-disc list-inside text-slate-700 font-sans text-[11px] print:text-[10.5px] space-y-0.5">
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
