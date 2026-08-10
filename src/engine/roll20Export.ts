import { CharacterState, RaceData, ClassData, WeaponData, FeatData, Equipment } from '../types/character';
import { calculateTotalScore, getAbilityMod, parseRaceMods, getCharacterLevel } from './stats';
import { calculateBAB, calculateBaseSave, calculateTotalHP } from './classes';
import { ALL_SKILLS, getAvailableSkills } from './skills';

export interface Roll20Attribute {
  name: string;
  current: string | number;
  max?: string | number;
}

export interface Roll20CharacterPayload {
  schema_version: number;
  name: string;
  attribs: Roll20Attribute[];
}

export function generateRoll20JSON(
  character: CharacterState,
  racesData: RaceData[] = [],
  classesData: ClassData[] = [],
  weaponsData: WeaponData[] = [],
  featsData: FeatData[] = []
): Roll20CharacterPayload {
  const raceObj: Partial<RaceData> = racesData.find(r => r.name === character.selectedRace) || {};
  const raceMods = parseRaceMods(raceObj);
  const totalLevel = getCharacterLevel(character.levelProgression);

  // Ability Scores
  const strScore = calculateTotalScore('str', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel);
  const dexScore = calculateTotalScore('dex', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel);
  const conScore = calculateTotalScore('con', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel);
  const intScore = calculateTotalScore('int', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel);
  const wisScore = calculateTotalScore('wis', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel);
  const chaScore = calculateTotalScore('cha', character.baseStats, raceMods, character.levelBumps || {}, character.enhancementMods || {}, totalLevel);

  const strMod = getAbilityMod(strScore);
  const dexMod = getAbilityMod(dexScore);
  const conMod = getAbilityMod(conScore);
  const intMod = getAbilityMod(intScore);
  const wisMod = getAbilityMod(wisScore);
  const chaMod = getAbilityMod(chaScore);

  // Class Summary String
  const classCounts: Record<string, number> = {};
  character.levelProgression.forEach(l => {
    if (l.primaryClass) {
      classCounts[l.primaryClass] = (classCounts[l.primaryClass] || 0) + 1;
    }
    if (l.secondaryClass) {
      classCounts[l.secondaryClass] = (classCounts[l.secondaryClass] || 0) + 1;
    }
  });
  const classSummary = Object.entries(classCounts)
    .map(([cls, lvl]) => `${cls} ${lvl}`)
    .join(' / ') || 'Adventurer 1';

  // Combat Stats
  const hpTotal = calculateTotalHP(character.levelProgression, classesData, conMod);
  const bab = calculateBAB(character.levelProgression, classesData);
  const grapple = bab + strMod;

  const baseFort = calculateBaseSave('fort', character.levelProgression, classesData);
  const baseRef = calculateBaseSave('ref', character.levelProgression, classesData);
  const baseWill = calculateBaseSave('will', character.levelProgression, classesData);

  const totalFort = baseFort + conMod;
  const totalRef = baseRef + dexMod;
  const totalWill = baseWill + wisMod;

  // Equipment & AC
  const eq: Equipment = character.equipment || {
    armor: 'none', armorEnhancement: 0, shield: 'none', shieldEnhancement: 0,
    deflection: 0, natural: 0, dodge: 0, primaryWeapon: 'Unarmed'
  };

  const armorBonusMap: Record<string, number> = { none: 0, padded: 1, leather: 2, studded: 3, chainshirt: 4, breastplate: 5, fullplate: 8 };
  const shieldBonusMap: Record<string, number> = { none: 0, buckler: 1, light_wooden: 1, heavy_shield: 2, tower_shield: 4 };

  const armorBonus = (armorBonusMap[eq.armor] || 0) + (eq.armorEnhancement || 0);
  const shieldBonus = (shieldBonusMap[eq.shield] || 0) + (eq.shieldEnhancement || 0);
  const totalAc = 10 + armorBonus + shieldBonus + dexMod + (eq.deflection || 0) + (eq.natural || 0) + (eq.dodge || 0);
  const touchAc = 10 + dexMod + (eq.deflection || 0) + (eq.dodge || 0);
  const flatFootedAc = 10 + armorBonus + shieldBonus + (eq.deflection || 0) + (eq.natural || 0);

  const attribs: Roll20Attribute[] = [
    // Header & Meta
    { name: 'character_name', current: character.name },
    { name: 'player_name', current: character.player || '' },
    { name: 'race', current: character.raceOverride?.trim() || character.selectedRace || '' },
    { name: 'base_race', current: character.selectedRace || '' },
    { name: 'alignment', current: character.alignment || '' },
    { name: 'deity', current: character.deity || '' },
    { name: 'class', current: classSummary },
    { name: 'level', current: totalLevel },

    // Ability Scores
    { name: 'STR', current: strScore },
    { name: 'STR-base', current: character.baseStats.str },
    { name: 'STR-mod', current: strMod },
    { name: 'strength', current: strScore },

    { name: 'DEX', current: dexScore },
    { name: 'DEX-base', current: character.baseStats.dex },
    { name: 'DEX-mod', current: dexMod },
    { name: 'dexterity', current: dexScore },

    { name: 'CON', current: conScore },
    { name: 'CON-base', current: character.baseStats.con },
    { name: 'CON-mod', current: conMod },
    { name: 'constitution', current: conScore },

    { name: 'INT', current: intScore },
    { name: 'INT-base', current: character.baseStats.int },
    { name: 'INT-mod', current: intMod },
    { name: 'intelligence', current: intScore },

    { name: 'WIS', current: wisScore },
    { name: 'WIS-base', current: character.baseStats.wis },
    { name: 'WIS-mod', current: wisMod },
    { name: 'wisdom', current: wisScore },

    { name: 'CHA', current: chaScore },
    { name: 'CHA-base', current: character.baseStats.cha },
    { name: 'CHA-mod', current: chaMod },
    { name: 'charisma', current: chaScore },

    // Health & Combat
    { name: 'hp', current: hpTotal, max: hpTotal },
    { name: 'hp_max', current: hpTotal },
    { name: 'bab', current: bab >= 0 ? `+${bab}` : `${bab}` },
    { name: 'grapple', current: grapple >= 0 ? `+${grapple}` : `${grapple}` },
    { name: 'initiative', current: dexMod >= 0 ? `+${dexMod}` : `${dexMod}` },
    { name: 'initmod', current: dexMod },

    // Saves
    { name: 'fortitude', current: totalFort },
    { name: 'fortitudebase', current: baseFort },
    { name: 'fortitudeability', current: conMod },
    { name: 'reflex', current: totalRef },
    { name: 'reflexbase', current: baseRef },
    { name: 'reflexability', current: dexMod },
    { name: 'will', current: totalWill },
    { name: 'willbase', current: baseWill },
    { name: 'willability', current: wisMod },

    // Defense & Armor Class
    { name: 'ac', current: totalAc },
    { name: 'touchac', current: touchAc },
    { name: 'flatfootedac', current: flatFootedAc },
    { name: 'armorbonus', current: armorBonus },
    { name: 'shieldbonus', current: shieldBonus },
    { name: 'dexmod', current: dexMod },
    { name: 'naturalarmor', current: eq.natural || 0 },
    { name: 'deflectionmod', current: eq.deflection || 0 },
    { name: 'dodgemod', current: eq.dodge || 0 },

    // Currency / Funds
    { name: 'currency_cp', current: character.funds?.cp || 0 },
    { name: 'currency_sp', current: character.funds?.sp || 0 },
    { name: 'currency_gp', current: character.funds?.gp || 0 },
    { name: 'currency_pp', current: character.funds?.pp || 0 },
    { name: 'currency_valuables', current: character.funds?.otherValuables || 0 },

    // Primary Weapon
    { name: 'primary_weapon', current: eq.primaryWeapon },
    { name: 'primary_weapon_enh', current: eq.primaryWeaponEnhancement || 0 },
    { name: 'armor_type', current: eq.armor },
    { name: 'shield_type', current: eq.shield }
  ];

  // Skill Ranks Mapping
  const exportSkills = getAvailableSkills(character.usePathfinderPerception);
  exportSkills.forEach(skill => {
    const ranks = character.skillRanks[skill.name] || 0;
    const cleanKey = skill.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    attribs.push({ name: `skill_ranks_${cleanKey}`, current: ranks });
    attribs.push({ name: `${skill.name}-ranks`, current: ranks });
    attribs.push({ name: `${skill.name}`, current: ranks });
  });

  // Selected Feats Mapping
  (character.selectedFeats || []).forEach((featName, idx) => {
    const featObj = featsData.find(f => f.name === featName);
    const desc = featObj ? featObj.description : '3.5e Feat';
    attribs.push({ name: `repeating_feats_$${idx}_featname`, current: featName });
    attribs.push({ name: `repeating_feats_$${idx}_featnotes`, current: desc });
  });

  // Auras & Emanations Mapping (into repeating abilities)
  (character.auras || []).forEach((aura, idx) => {
    attribs.push({ name: `repeating_abilities_$${idx}_abilityname`, current: `[AURA ${aura.radius}ft] ${aura.name}` });
    attribs.push({
      name: `repeating_abilities_$${idx}_abilitydescription`,
      current: `Type: ${aura.type} | Target: ${aura.target} | Radius: ${aura.radius}ft\nEffect: ${aura.effect}${aura.saveDc ? ` (DC ${aura.saveDc})` : ''}`
    });
  });

  // Inventory Items Mapping
  (character.inventory || []).forEach((item, idx) => {
    attribs.push({ name: `repeating_inventory_$${idx}_itemname`, current: item.name });
    attribs.push({ name: `repeating_inventory_$${idx}_itemcount`, current: item.quantity });
    attribs.push({ name: `repeating_inventory_$${idx}_itemweight`, current: item.weight });
    attribs.push({ name: `repeating_inventory_$${idx}_itemlocation`, current: item.location || 'Carried' });
    if (item.notes || item.value) {
      attribs.push({ name: `repeating_inventory_$${idx}_itemnotes`, current: `${item.value ? `Value: ${item.value}. ` : ''}${item.notes || ''}` });
    }
  });

  // Notes & Journal Mapping
  const notesObj = character.notes || {};
  let formattedNotes = '';

  if (notesObj.backstory) formattedNotes += `=== Backstory ===\n${notesObj.backstory}\n\n`;
  if (notesObj.appearance) formattedNotes += `=== Appearance ===\n${notesObj.appearance}\n\n`;
  if (notesObj.personality) formattedNotes += `=== Personality ===\n${notesObj.personality}\n\n`;
  if (notesObj.alliesAndOrganizations) formattedNotes += `=== Allies & Orgs ===\n${notesObj.alliesAndOrganizations}\n\n`;

  if (notesObj.quests && notesObj.quests.length > 0) {
    formattedNotes += `=== Quests ===\n`;
    notesObj.quests.forEach(q => {
      formattedNotes += `• [${q.status.toUpperCase()}] ${q.title} (${q.location || 'Unknown'}) - ${q.objectives || ''}\n`;
    });
    formattedNotes += `\n`;
  }

  if (notesObj.npcs && notesObj.npcs.length > 0) {
    formattedNotes += `=== NPCs ===\n`;
    notesObj.npcs.forEach(n => {
      formattedNotes += `• ${n.name} (${n.attitude}, ${n.faction || 'N/A'}): ${n.notes || ''}\n`;
    });
    formattedNotes += `\n`;
  }

  if (notesObj.sessions && notesObj.sessions.length > 0) {
    formattedNotes += `=== Session Log ===\n`;
    notesObj.sessions.forEach(s => {
      formattedNotes += `• Session ${s.sessionNumber} (${s.date}): ${s.title} - ${s.summary}\n`;
    });
  }

  attribs.push({ name: 'notes', current: formattedNotes });
  attribs.push({ name: 'backstory', current: notesObj.backstory || '' });
  attribs.push({ name: 'appearance', current: notesObj.appearance || '' });
  attribs.push({ name: 'personality', current: notesObj.personality || '' });

  return {
    schema_version: 1,
    name: character.name || 'HeroForge Character',
    attribs
  };
}
