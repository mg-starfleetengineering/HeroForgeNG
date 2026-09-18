import {
  CharacterSheetData,
  CharacterState,
  migrateLegacyFeatStrings,
  Equipment,
  InventoryItem,
  ItemArmorData,
  DREntry,
  SREntry,
  FamiliarAttack,
  AnimalCompanionAttack,
  WildShapeAttack
} from '../types/character';
import { toCanonicalClassId, toCanonicalDomainId } from '../engine/classes';
import { parseDRText } from '../engine/dr';
import { parseSRText } from '../engine/sr';
import { migrateCharacterBuffs } from '../engine/combat';
import {
  resolveArmor,
  resolveShield,
  resolveWeapon,
  createInventoryArmor,
  createInventoryShield,
  createInventoryWeapon,
  applyMaterialToArmorData,
  applyMaterialToWeight,
  matchesItemName,
  ARMOR_WEIGHT_MAP,
  SHIELD_WEIGHT_MAP
} from '../engine/equipment';
import { parseMagicItemName } from '../engine/magicItems';
import {
  getAllCharacters,
  saveCharacter,
  getActiveCharacterId,
  setActiveCharacterId,
  generateCharacterId,
  getAllCharacterSummaries
} from './characterStore';

const LEGACY_V2_KEY = 'heroforge_active_character_v2';
const LEGACY_V1_KEY = 'heroforge_active_character';

/**
 * Migrates legacy equipment string names into structured InventoryItem entities in character.inventory
 * with typed material, enhancementBonus, specialQualities, baseItemId, and itemType.
 * Binds equipment.*ItemId pointers and preserves equipment.armorMaterial / item.material.
 */
export function migrateLegacyEquipmentToInventory(char: CharacterSheetData): CharacterSheetData {
  if (!char || typeof char !== 'object') {
    return char;
  }

  // Ensure inventory is an array
  const inventory: InventoryItem[] = Array.isArray(char.inventory) ? [...char.inventory] : [];
  const customArmors = char.customArmors || [];
  const customWeapons = char.customWeapons || [];

  if (!char.equipment) {
    return {
      ...char,
      inventory
    };
  }

  const equipment: Equipment = { ...char.equipment };

  const isValidName = (name: string | undefined): boolean => {
    if (!name) return false;
    const clean = name.trim();
    return clean !== '' && clean.toLowerCase() !== 'none' && clean !== '__CUSTOM__';
  };

  // 1. Armor
  if (isValidName(equipment.armor)) {
    const rawName = equipment.armor.trim();
    const parsed = parseMagicItemName(rawName, 'armor');
    const isMwk = Boolean(
      parsed.isMasterwork ||
      equipment.armorMasterwork ||
      /\b(?:masterwork|mwk\.?)\b/i.test(rawName)
    );
    const mat = (parsed.material && parsed.material !== 'standard' ? parsed.material : undefined) ||
      equipment.armorMaterial ||
      'standard';
    const enh = parsed.enhancementBonus || equipment.armorEnhancement || 0;
    const qualities = parsed.qualities.length > 0 ? parsed.qualities : (equipment.armorQualities || []);
    const resolved = resolveArmor(parsed.baseName || rawName, customArmors);
    const baseId = resolved.baseArmorId || parsed.baseName.toLowerCase().replace(/\s+/g, '_');

    let item: InventoryItem | undefined;
    if (equipment.armorItemId) {
      item = inventory.find(i => i.id === equipment.armorItemId);
    }
    if (!item) {
      item = inventory.find(i =>
        i.id !== equipment.shieldItemId &&
        (i.itemType === 'armor' || i.armorData?.type !== 'shield' || !i.itemType) &&
        (matchesItemName(i.name, rawName) || matchesItemName(i.name, resolved.name))
      );
    }

    if (item) {
      item.itemType = 'armor';
      item.material = item.material && item.material !== 'standard' ? item.material : mat;
      item.baseItemId = item.baseItemId || baseId;
      if (item.enhancementBonus === undefined) item.enhancementBonus = enh;
      if (!item.specialQualities || item.specialQualities.length === 0) item.specialQualities = [...qualities];
      if (item.isMasterwork === undefined) item.isMasterwork = isMwk;
      if (!item.armorData) {
        const baseArmorData: ItemArmorData = {
          type: (resolved.type as any) || 'medium',
          acBonus: resolved.acBonus,
          maxDex: resolved.maxDex ?? 99,
          armorCheckPenalty: resolved.checkPenalty ?? 0,
          spellFailure: resolved.spellFailure ?? 0,
          speedPenalty: resolved.speedPenalty ?? (resolved.type === 'heavy' || resolved.type === 'medium')
        };
        item.armorData = applyMaterialToArmorData(baseArmorData, item.material, item.isMasterwork);
      }
      if (item.weight === undefined) {
        const stdWeight = resolved.weight ?? (ARMOR_WEIGHT_MAP[resolved.name.toLowerCase()] ?? 20);
        item.weight = applyMaterialToWeight(stdWeight, item.material);
      }
      equipment.armorItemId = item.id;
      equipment.armorMaterial = item.material;
      equipment.armorEnhancement = item.enhancementBonus || 0;
      equipment.armorQualities = item.specialQualities || [];
      equipment.armorMasterwork = item.isMasterwork ?? isMwk;
    } else {
      const newItem = createInventoryArmor(rawName, customArmors, {
        name: rawName,
        enhancementBonus: enh,
        specialQualities: qualities,
        material: mat,
        baseItemId: baseId,
        isMasterwork: isMwk
      });
      inventory.push(newItem);
      equipment.armorItemId = newItem.id;
      equipment.armorMaterial = newItem.material;
      equipment.armorEnhancement = newItem.enhancementBonus || 0;
      equipment.armorQualities = newItem.specialQualities || [];
      equipment.armorMasterwork = newItem.isMasterwork;
    }
  } else if (equipment.armor === 'none') {
    equipment.armorItemId = null;
  }

  // 2. Shield
  if (isValidName(equipment.shield)) {
    const rawName = equipment.shield.trim();
    const parsed = parseMagicItemName(rawName, 'shield');
    const isMwk = Boolean(
      parsed.isMasterwork ||
      equipment.shieldMasterwork ||
      /\b(?:masterwork|mwk\.?)\b/i.test(rawName)
    );
    const mat = (parsed.material && parsed.material !== 'standard' ? parsed.material : undefined) ||
      equipment.shieldMaterial ||
      'standard';
    const enh = parsed.enhancementBonus || equipment.shieldEnhancement || 0;
    const qualities = parsed.qualities.length > 0 ? parsed.qualities : (equipment.shieldQualities || []);
    const resolved = resolveShield(parsed.baseName || rawName, customArmors);
    const baseId = resolved.baseArmorId || parsed.baseName.toLowerCase().replace(/\s+/g, '_');

    let item: InventoryItem | undefined;
    if (equipment.shieldItemId) {
      item = inventory.find(i => i.id === equipment.shieldItemId);
    }
    if (!item) {
      item = inventory.find(i =>
        i.id !== equipment.armorItemId &&
        (i.itemType === 'shield' || i.armorData?.type === 'shield' || !i.itemType) &&
        (matchesItemName(i.name, rawName) || matchesItemName(i.name, resolved.name))
      );
    }

    if (item) {
      item.itemType = 'shield';
      item.material = item.material && item.material !== 'standard' ? item.material : mat;
      item.baseItemId = item.baseItemId || baseId;
      if (item.enhancementBonus === undefined) item.enhancementBonus = enh;
      if (!item.specialQualities || item.specialQualities.length === 0) item.specialQualities = [...qualities];
      if (item.isMasterwork === undefined) item.isMasterwork = isMwk;
      if (!item.armorData) {
        const baseArmorData: ItemArmorData = {
          type: 'shield',
          acBonus: resolved.acBonus,
          maxDex: 99,
          armorCheckPenalty: resolved.checkPenalty ?? 0,
          spellFailure: resolved.spellFailure ?? 0,
          speedPenalty: false
        };
        item.armorData = applyMaterialToArmorData(baseArmorData, item.material, item.isMasterwork);
      }
      if (item.weight === undefined) {
        const stdWeight = resolved.weight ?? (SHIELD_WEIGHT_MAP[resolved.name.toLowerCase()] ?? 10);
        item.weight = applyMaterialToWeight(stdWeight, item.material);
      }
      equipment.shieldItemId = item.id;
      equipment.shieldMaterial = item.material;
      equipment.shieldEnhancement = item.enhancementBonus || 0;
      equipment.shieldQualities = item.specialQualities || [];
      equipment.shieldMasterwork = item.isMasterwork ?? isMwk;
    } else {
      const newItem = createInventoryShield(rawName, customArmors, {
        name: rawName,
        enhancementBonus: enh,
        specialQualities: qualities,
        material: mat,
        baseItemId: baseId,
        isMasterwork: isMwk
      });
      inventory.push(newItem);
      equipment.shieldItemId = newItem.id;
      equipment.shieldMaterial = newItem.material;
      equipment.shieldEnhancement = newItem.enhancementBonus || 0;
      equipment.shieldQualities = newItem.specialQualities || [];
      equipment.shieldMasterwork = newItem.isMasterwork;
    }
  } else if (equipment.shield === 'none') {
    equipment.shieldItemId = null;
  }

  // 3. Helper for Weapons (primary, secondary, ranged)
  const migrateWeaponSlot = (
    slot: 'primaryWeapon' | 'secondaryWeapon' | 'rangedWeapon',
    isRangedSlot: boolean = false
  ) => {
    const slotName = equipment[slot];
    const idKey = `${slot}ItemId` as keyof Equipment;
    const enhKey = `${slot}Enhancement` as keyof Equipment;
    const qKey = `${slot}Qualities` as keyof Equipment;
    const baneKey = `${slot}BaneTarget` as keyof Equipment;
    const mwkKey = `${slot}Masterwork` as keyof Equipment;

    if (isValidName(slotName)) {
      const rawName = slotName!.trim();
      const parsed = parseMagicItemName(rawName, 'weapon');
      const isMwk = Boolean(
        parsed.isMasterwork ||
        equipment[mwkKey] ||
        /\b(?:masterwork|mwk\.?)\b/i.test(rawName)
      );
      const mat = parsed.material || 'standard';
      const enh = parsed.enhancementBonus || (equipment[enhKey] as number) || 0;
      const qualities = parsed.qualities.length > 0 ? parsed.qualities : ((equipment[qKey] as string[]) || []);
      const bane = equipment[baneKey] as string | undefined;
      const resolved = resolveWeapon(parsed.baseName || rawName, customWeapons);
      const baseId = resolved.id;

      let item: InventoryItem | undefined;
      const currentId = equipment[idKey] as string | undefined;
      if (currentId) {
        item = inventory.find(i => i.id === currentId);
      }
      if (!item) {
        // Exclude items already assigned to other equipped weapon slots
        const otherIds = [
          slot !== 'primaryWeapon' ? equipment.primaryWeaponItemId : null,
          slot !== 'secondaryWeapon' ? equipment.secondaryWeaponItemId : null,
          slot !== 'rangedWeapon' ? equipment.rangedWeaponItemId : null
        ].filter(Boolean);

        item = inventory.find(i =>
          !otherIds.includes(i.id) &&
          (i.itemType === 'weapon' || Boolean(i.weaponData) || !i.itemType) &&
          (matchesItemName(i.name, rawName) || matchesItemName(i.name, resolved.name))
        );
      }

      if (item) {
        item.itemType = 'weapon';
        item.material = item.material && item.material !== 'standard' ? item.material : mat;
        item.baseItemId = item.baseItemId || baseId;
        if (item.enhancementBonus === undefined) item.enhancementBonus = enh;
        if (!item.specialQualities || item.specialQualities.length === 0) item.specialQualities = [...qualities];
        if (bane && !item.baneTarget) item.baneTarget = bane;
        if (item.isMasterwork === undefined) item.isMasterwork = isMwk;
        if (!item.weaponData) {
          item.weaponData = {
            category: resolved.category,
            size: resolved.size,
            damageM: resolved.damageM,
            damageS: resolved.damageS,
            threat: resolved.threat ?? 20,
            critMultiplier: resolved.critMultiplier ?? 2,
            damageType: resolved.type,
            rangeIncrement: resolved.rangeIncrement,
            isRanged: isRangedSlot || resolved.category === 'Ranged' || resolved.size === 'Ranged',
            baneTarget: item.baneTarget || bane,
            isMasterwork: item.isMasterwork
          };
        }
        const matKey = `${slot}Material` as keyof Equipment;
        (equipment as any)[idKey] = item.id;
        (equipment as any)[enhKey] = item.enhancementBonus || 0;
        (equipment as any)[qKey] = item.specialQualities || [];
        (equipment as any)[matKey] = item.material || 'standard';
        (equipment as any)[mwkKey] = item.isMasterwork ?? isMwk;
        if (item.baneTarget || item.weaponData?.baneTarget) {
          (equipment as any)[baneKey] = item.baneTarget || item.weaponData?.baneTarget;
        }
      } else {
        const newItem = createInventoryWeapon(resolved, {
          name: rawName,
          enhancementBonus: enh,
          specialQualities: qualities,
          baneTarget: bane,
          material: mat,
          baseItemId: baseId,
          isMasterwork: isMwk
        });
        if (isRangedSlot && newItem.weaponData) {
          newItem.weaponData.isRanged = true;
        }
        inventory.push(newItem);
        const matKey = `${slot}Material` as keyof Equipment;
        (equipment as any)[idKey] = newItem.id;
        (equipment as any)[enhKey] = newItem.enhancementBonus || 0;
        (equipment as any)[qKey] = newItem.specialQualities || [];
        (equipment as any)[matKey] = newItem.material || 'standard';
        (equipment as any)[mwkKey] = newItem.isMasterwork;
        if (newItem.baneTarget || newItem.weaponData?.baneTarget) {
          (equipment as any)[baneKey] = newItem.baneTarget || newItem.weaponData?.baneTarget;
        }
      }
    } else if (slotName === 'none') {
      (equipment as any)[idKey] = null;
    }
  };

  migrateWeaponSlot('primaryWeapon', false);
  migrateWeaponSlot('secondaryWeapon', false);
  migrateWeaponSlot('rangedWeapon', true);

  // 4. Normalize remaining unequipped inventory items
  for (const invItem of inventory) {
    if (invItem.isMasterwork === undefined) {
      const p = parseMagicItemName(invItem.name);
      if (p.isMasterwork || /\b(?:masterwork|mwk\.?)\b/i.test(invItem.name)) {
        invItem.isMasterwork = true;
      }
    }
    if (!invItem.material) {
      const p = parseMagicItemName(invItem.name);
      invItem.material = p.material || 'standard';
      if (invItem.enhancementBonus === undefined && p.enhancementBonus > 0) {
        invItem.enhancementBonus = p.enhancementBonus;
      }
      if ((!invItem.specialQualities || invItem.specialQualities.length === 0) && p.qualities.length > 0) {
        invItem.specialQualities = [...p.qualities];
      }
    }
    if (!invItem.itemType) {
      if (invItem.weaponData) {
        invItem.itemType = 'weapon';
      } else if (invItem.armorData) {
        invItem.itemType = invItem.armorData.type === 'shield' ? 'shield' : 'armor';
      }
    }
    if (!invItem.baseItemId) {
      if (invItem.itemType === 'weapon' || invItem.weaponData) {
        invItem.baseItemId = resolveWeapon(invItem.name, customWeapons).id;
      } else if (invItem.itemType === 'armor') {
        invItem.baseItemId = resolveArmor(invItem.name, customArmors).baseArmorId || parseMagicItemName(invItem.name, 'armor').baseName.toLowerCase().replace(/\s+/g, '_');
      } else if (invItem.itemType === 'shield') {
        invItem.baseItemId = resolveShield(invItem.name, customArmors).baseArmorId || parseMagicItemName(invItem.name, 'shield').baseName.toLowerCase().replace(/\s+/g, '_');
      }
    }
  }

  return {
    ...char,
    equipment,
    inventory
  };
}

/**
 * Normalizes all class and domain identifiers in character state to canonical snake_case IDs.
 * - char.levelProgression: primaryClass & secondaryClass normalized via toCanonicalClassId
 * - char.preparedSpells: className & classId normalized to canonical class ID, domainId normalized via toCanonicalDomainId, slot.id reconciled with canonical class prefix
 * - char.selectedDomains: domain IDs normalized via toCanonicalDomainId
 * - char.expendedSpellSlots: keys normalized to canonical IDs (e.g. 'Wizard_lvl1' -> 'wizard_lvl1')
 */
export function migrateCanonicalIdentifiers(char: CharacterSheetData): CharacterSheetData {
  if (!char || typeof char !== 'object') {
    return char;
  }

  const updated: CharacterSheetData = { ...char };

  // 1. Normalize levelProgression classes
  if (Array.isArray(updated.levelProgression)) {
    updated.levelProgression = updated.levelProgression.map(lvl => {
      if (!lvl || typeof lvl !== 'object') return lvl;
      const primary = lvl.primaryClass ? toCanonicalClassId(lvl.primaryClass) : '';
      const secondary = lvl.secondaryClass ? toCanonicalClassId(lvl.secondaryClass) : (lvl.secondaryClass === '' ? '' : undefined);
      return {
        ...lvl,
        primaryClass: primary,
        ...(secondary !== undefined ? { secondaryClass: secondary } : {})
      };
    });
  }

  // 2. Normalize preparedSpells
  if (Array.isArray(updated.preparedSpells)) {
    updated.preparedSpells = updated.preparedSpells.map(slot => {
      if (!slot || typeof slot !== 'object') return slot;
      const canonicalClass = toCanonicalClassId(slot.className || slot.classId || '');
      const domainId = slot.domainId ? toCanonicalDomainId(slot.domainId) : undefined;
      let slotId = slot.id || '';
      if (slotId) {
        slotId = slotId.replace(/^.*?(?=_lvl\d+)/i, canonicalClass);
      } else if (slot.spellLevel !== undefined && slot.slotIndex !== undefined) {
        slotId = `${canonicalClass}_lvl${slot.spellLevel}_${slot.isDomain ? 'domain_' : 'slot_'}${slot.slotIndex}`;
      }

      return {
        ...slot,
        id: slotId,
        className: canonicalClass,
        classId: canonicalClass,
        ...(slot.isDomain ? { domainId } : (domainId ? { domainId } : {}))
      };
    });
  }

  // 3. Normalize selectedDomains
  if (Array.isArray(updated.selectedDomains)) {
    updated.selectedDomains = updated.selectedDomains
      .map(d => toCanonicalDomainId(d))
      .filter(Boolean);
  }

  // 4. Normalize expendedSpellSlots keys
  if (updated.expendedSpellSlots && typeof updated.expendedSpellSlots === 'object') {
    const normalizedExpended: Record<string, number> = {};
    for (const [key, count] of Object.entries(updated.expendedSpellSlots)) {
      const match = key.match(/^(.*)_lvl(\d+)$/);
      if (match) {
        const canonicalKey = `${toCanonicalClassId(match[1])}_lvl${match[2]}`;
        normalizedExpended[canonicalKey] = count;
      } else {
        normalizedExpended[key] = count;
      }
    }
    updated.expendedSpellSlots = normalizedExpended;
  }

  return updated;
}

function splitDelimitedStrings(val: string | string[] | undefined | null): string[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map(s => String(s).trim()).filter(Boolean);
  }
  if (typeof val === 'string') {
    const sep = val.includes(';') ? ';' : ',';
    return val.split(sep).map(s => s.trim()).filter(Boolean);
  }
  return [];
}

export function toCanonicalCompanionId(id: string | undefined | null): string {
  if (!id) return '';
  return id
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Normalizes legacy DR strings ((char as any).dr or damageReduction as string) and
 * legacy SR ((char as any).sr or spellResistance as string/number) into canonical
 * structured arrays damageReduction: DREntry[] and spellResistance: SREntry[].
 * Ensures damageReduction and spellResistance are arrays and purges legacy dr/sr properties.
 */
export function migrateDefenses(char: CharacterSheetData): CharacterSheetData {
  if (!char || typeof char !== 'object') {
    return char;
  }

  const updated: CharacterSheetData = { ...char };

  // 1. Damage Reduction (DR)
  let damageReduction: DREntry[] = [];
  if (Array.isArray(updated.damageReduction)) {
    damageReduction = [...updated.damageReduction];
  } else if (typeof (updated as any).damageReduction === 'string' && (updated as any).damageReduction.trim()) {
    damageReduction = parseDRText((updated as any).damageReduction);
  }

  const rawDr = (updated as any).dr;
  if (rawDr !== undefined && rawDr !== null) {
    if (typeof rawDr === 'string' && rawDr.trim() && rawDr.trim().toLowerCase() !== 'none') {
      const parsed = parseDRText(rawDr);
      for (const entry of parsed) {
        if (!damageReduction.some(d => d.value === entry.value && d.bypass.toLowerCase() === entry.bypass.toLowerCase())) {
          damageReduction.push(entry);
        }
      }
    } else if (typeof rawDr === 'number' && rawDr > 0) {
      if (!damageReduction.some(d => d.value === rawDr && d.bypass === '-')) {
        damageReduction.push({ value: rawDr, bypass: '-', abilityType: 'Ex' });
      }
    }
  }

  updated.damageReduction = damageReduction;
  delete (updated as any).dr;

  // 2. Spell Resistance (SR)
  let spellResistance: SREntry[] = [];
  const charLevel = Array.isArray(updated.levelProgression) ? updated.levelProgression.length : 1;

  if (Array.isArray(updated.spellResistance)) {
    spellResistance = [...updated.spellResistance];
  } else if (typeof (updated as any).spellResistance === 'number' && (updated as any).spellResistance > 0) {
    spellResistance.push({ value: (updated as any).spellResistance });
  } else if (typeof (updated as any).spellResistance === 'string' && (updated as any).spellResistance.trim()) {
    const val = parseSRText((updated as any).spellResistance, charLevel);
    if (val > 0) {
      spellResistance.push({ value: val });
    }
  }

  const rawSr = (updated as any).sr;
  if (rawSr !== undefined && rawSr !== null) {
    if (typeof rawSr === 'number' && rawSr > 0) {
      if (!spellResistance.some(s => s.value === rawSr)) {
        spellResistance.push({ value: rawSr });
      }
    } else if (typeof rawSr === 'string' && rawSr.trim() && rawSr.trim().toLowerCase() !== 'none') {
      const val = parseSRText(rawSr, charLevel);
      if (val > 0 && !spellResistance.some(s => s.value === val)) {
        spellResistance.push({ value: val });
      }
    }
  }

  updated.spellResistance = spellResistance;
  delete (updated as any).sr;

  return updated;
}

/**
 * Modernizes familiar, animal companion, and wild shape custom models:
 * - Familiar: Synthesizes structured attacks, speed, specialAbilities: string[], and feats: string[].
 *   Normalizes selectedFamiliarId to canonical snake_case.
 * - Animal Companion: Synthesizes structured attacks, speed, specialAbilities: string[], and feats: string[].
 *   Normalizes selectedCompanionId to canonical snake_case.
 * - Wild Shape: Synthesizes structured attacks, speed, and specialQualities: string[].
 *   Normalizes selectedFormId to canonical snake_case.
 */
export function migrateCompanionsAndWildShape(char: CharacterSheetData): CharacterSheetData {
  if (!char || typeof char !== 'object') {
    return char;
  }

  const updated: CharacterSheetData = { ...char };

  // 1. Familiar
  if (updated.familiar) {
    const familiar = { ...updated.familiar };
    if (familiar.selectedFamiliarId) {
      familiar.selectedFamiliarId = toCanonicalCompanionId(familiar.selectedFamiliarId);
    }

    if (familiar.customFamiliar) {
      const cf = { ...familiar.customFamiliar };

      // Attacks
      if (!Array.isArray(cf.attacks) || cf.attacks.length === 0) {
        const attacks: FamiliarAttack[] = [];
        if (cf.attack1Name) {
          attacks.push({
            name: cf.attack1Name,
            damage: cf.attack1Damage || '1d3-4'
          });
        }
        if (cf.attack2Name) {
          attacks.push({
            name: cf.attack2Name,
            damage: cf.attack2Damage || '1d2'
          });
        }
        cf.attacks = attacks;
      }

      // Speed
      if (!cf.speed || typeof cf.speed !== 'object' || cf.speed.land === undefined) {
        cf.speed = {
          land: cf.speedLand ?? 30,
          ...(cf.speedFly !== undefined ? { fly: cf.speedFly } : {}),
          ...(cf.speedFlyManeuverability ? { flyManeuverability: cf.speedFlyManeuverability } : {}),
          ...(cf.speedSwim !== undefined ? { swim: cf.speedSwim } : {}),
          ...(cf.speedClimb !== undefined ? { climb: cf.speedClimb } : {}),
          ...(cf.speedBurrow !== undefined ? { burrow: cf.speedBurrow } : {})
        };
      }

      // Special Abilities & Feats
      cf.specialAbilities = splitDelimitedStrings(cf.specialAbilities);
      cf.feats = splitDelimitedStrings(cf.feats);

      familiar.customFamiliar = cf;
    }

    updated.familiar = familiar;
  }

  // 2. Animal Companion
  if (updated.animalCompanion) {
    const ac = { ...updated.animalCompanion };
    if (ac.selectedCompanionId) {
      ac.selectedCompanionId = toCanonicalCompanionId(ac.selectedCompanionId);
    }

    if (ac.customCompanion) {
      const cc = { ...ac.customCompanion };

      // Attacks
      if (!Array.isArray(cc.attacks) || cc.attacks.length === 0) {
        const attacks: AnimalCompanionAttack[] = [];
        if (cc.attack1Name) {
          attacks.push({
            name: cc.attack1Name,
            damage: cc.attack1Damage || '1d6'
          });
        }
        if (cc.attack2Name) {
          attacks.push({
            name: cc.attack2Name,
            damage: cc.attack2Damage || '1d4'
          });
        }
        cc.attacks = attacks;
      }

      // Speed
      if (!cc.speed || typeof cc.speed !== 'object' || cc.speed.land === undefined) {
        cc.speed = {
          land: cc.speedLand ?? 30,
          ...(cc.speedFly !== undefined ? { fly: cc.speedFly } : {}),
          ...(cc.speedFlyManeuverability ? { flyManeuverability: cc.speedFlyManeuverability } : {}),
          ...(cc.speedSwim !== undefined ? { swim: cc.speedSwim } : {}),
          ...(cc.speedClimb !== undefined ? { climb: cc.speedClimb } : {}),
          ...(cc.speedBurrow !== undefined ? { burrow: cc.speedBurrow } : {})
        };
      }

      // Special Abilities & Feats
      cc.specialAbilities = splitDelimitedStrings(cc.specialAbilities);
      cc.feats = splitDelimitedStrings(cc.feats);

      ac.customCompanion = cc;
    }

    updated.animalCompanion = ac;
  }

  // 3. Wild Shape
  if (updated.wildShape) {
    const ws = { ...updated.wildShape };
    if (ws.selectedFormId) {
      ws.selectedFormId = toCanonicalCompanionId(ws.selectedFormId);
    }

    if (ws.customForm) {
      const form = { ...ws.customForm };

      // Attacks
      if (!Array.isArray(form.attacks) || form.attacks.length === 0) {
        const attacks: WildShapeAttack[] = [];
        if (form.attack1Name) {
          attacks.push({
            name: form.attack1Name,
            damage: form.attack1Damage || '1d6',
            attackCount: form.attack1Count || 1,
            isPrimary: form.attack1IsPrimary ?? true,
            strMultiplier: form.attack1IsPrimary ?? true ? 1.0 : 0.5,
            special: form.attack1Special
          });
        }
        if (form.attack2Name) {
          attacks.push({
            name: form.attack2Name,
            damage: form.attack2Damage || '1d4',
            attackCount: form.attack2Count || 1,
            isPrimary: form.attack2IsPrimary ?? false,
            strMultiplier: form.attack2IsPrimary ? 1.0 : 0.5,
            special: form.attack2Special
          });
        }
        form.attacks = attacks;
      }

      // Speed
      if (!form.speed || typeof form.speed !== 'object' || form.speed.land === undefined) {
        form.speed = {
          land: form.speedLand || 30,
          ...(form.speedFly !== undefined ? { fly: form.speedFly } : {}),
          ...(form.speedFlyManeuverability ? { flyManeuverability: form.speedFlyManeuverability } : {}),
          ...(form.speedSwim !== undefined ? { swim: form.speedSwim } : {}),
          ...(form.speedClimb !== undefined ? { climb: form.speedClimb } : {}),
          ...(form.speedBurrow !== undefined ? { burrow: form.speedBurrow } : {})
        };
      }

      // Special Qualities
      form.specialQualities = splitDelimitedStrings(form.specialQualities);

      ws.customForm = form;
    }

    updated.wildShape = ws;
  }

  return updated;
}

/**
 * Centralized backwards compatibility normalizer for character data.
 * Normalizes legacy data structures into canonical models on load / import:
 * - Migrates tactical combat booleans to structured activeBuffs.
 * - Migrates legacy feat strings to structured selectedFeatEntities.
 * - Migrates legacy equipment strings into structured InventoryItem entries.
 * - Migrates legacy class and domain identifiers to canonical snake_case IDs.
 * - Migrates legacy DR/SR properties into structured arrays damageReduction and spellResistance.
 * - Migrates custom companion and wild shape flat models into structured entities.
 */
export function normalizeCharacterOnLoad(raw: any): CharacterSheetData {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  // Clone raw to avoid direct unexpected mutations
  const char: CharacterSheetData = { ...raw };

  // a) Tactical combat booleans -> activeBuffs: ActiveCombatBuff[]
  const withBuffs = migrateCharacterBuffs(char) as CharacterSheetData;

  // b) Feat strings -> selectedFeatEntities: CharacterFeat[]
  // If selectedFeatEntities is missing or empty, populate from legacy selectedFeats
  if (!Array.isArray(withBuffs.selectedFeatEntities) || withBuffs.selectedFeatEntities.length === 0) {
    if (Array.isArray(withBuffs.selectedFeats) && withBuffs.selectedFeats.length > 0) {
      withBuffs.selectedFeatEntities = migrateLegacyFeatStrings(withBuffs.selectedFeats);
    } else {
      withBuffs.selectedFeatEntities = [];
    }
  } else {
    // If selectedFeatEntities exists, but selectedFeats has extra unmigrated entries, merge them
    if (Array.isArray(withBuffs.selectedFeats) && withBuffs.selectedFeats.length > 0) {
      const existingKeys = new Set(withBuffs.selectedFeatEntities.map(e => `${e.featId}::${e.targetId || ''}`));
      const migrated = migrateLegacyFeatStrings(withBuffs.selectedFeats);
      for (const entity of migrated) {
        const key = `${entity.featId}::${entity.targetId || ''}`;
        if (!existingKeys.has(key)) {
          existingKeys.add(key);
          withBuffs.selectedFeatEntities.push(entity);
        }
      }
    }
  }

  // Purge selectedFeats completely so loaded characters never have selectedFeats
  delete (withBuffs as any).selectedFeats;

  // Migrate legacy equipment strings (armor, shield, weapons) into structured InventoryItem entries
  const withEquipment = migrateLegacyEquipmentToInventory(withBuffs);

  // Phase 3: Migrate canonical identifiers for classes, domains, prepared spells, and expended slots
  const withCanonical = migrateCanonicalIdentifiers(withEquipment);

  // Phase 4: Migrate defenses (DR/SR) and companion/wild shape models
  const withDefenses = migrateDefenses(withCanonical);
  const withCompanions = migrateCompanionsAndWildShape(withDefenses);

  return withCompanions;
}

export async function runLegacyMigrationIfNeeded(
  defaultBaseCharacter: CharacterState
): Promise<{ activeCharacter: CharacterSheetData; allCharacters: Record<string, CharacterSheetData> }> {
  let existingCharactersMap = await getAllCharacters();
  const existingIds = Object.keys(existingCharactersMap);

  // Case 1: Database is completely empty, check for legacy single-character key in localStorage
  if (existingIds.length === 0) {
    let legacyRaw: string | null = null;
    try {
      legacyRaw = localStorage.getItem(LEGACY_V2_KEY) || localStorage.getItem(LEGACY_V1_KEY);
    } catch (e) {
      console.warn('LocalStorage legacy check failed:', e);
    }

    if (legacyRaw) {
      try {
        const parsedLegacy: CharacterState = JSON.parse(legacyRaw);
        if (parsedLegacy && typeof parsedLegacy === 'object' && parsedLegacy.name) {
          const normalized = normalizeCharacterOnLoad(parsedLegacy);
          const migratedChar: CharacterSheetData = {
            ...normalized,
            id: generateCharacterId(),
            updatedAt: Date.now()
          };

          const savedMigrated = await saveCharacter(migratedChar);

          // Clean up legacy keys
          try {
            localStorage.removeItem(LEGACY_V2_KEY);
            localStorage.removeItem(LEGACY_V1_KEY);
          } catch {
            // Ignore cleanup failure
          }

          setActiveCharacterId(savedMigrated.id);
          return {
            activeCharacter: savedMigrated,
            allCharacters: { [savedMigrated.id]: savedMigrated }
          };
        }
      } catch (err) {
        console.error('Failed to parse legacy character JSON:', err);
      }
    }

    // Case 2: Database empty & no valid legacy character -> initialize default character
    const defaultChar: CharacterSheetData = {
      ...defaultBaseCharacter,
      id: generateCharacterId(),
      updatedAt: Date.now()
    };

    const normalizedDefault = normalizeCharacterOnLoad(defaultChar);
    const savedDefault = await saveCharacter(normalizedDefault);
    setActiveCharacterId(savedDefault.id);

    return {
      activeCharacter: savedDefault,
      allCharacters: { [savedDefault.id]: savedDefault }
    };
  }

  // Case 3: DB has characters already. Resolve active character ID
  let activeId = getActiveCharacterId();
  let activeCharacter = activeId ? existingCharactersMap[activeId] : null;

  if (!activeCharacter) {
    const summaries = await getAllCharacterSummaries();
    if (summaries.length > 0) {
      activeId = summaries[0].id;
      activeCharacter = existingCharactersMap[activeId];
    }
  }

  if (!activeCharacter) {
    // Safety fallback
    const firstKey = Object.keys(existingCharactersMap)[0];
    activeCharacter = existingCharactersMap[firstKey];
    activeId = firstKey;
  }

  setActiveCharacterId(activeId);

  return {
    activeCharacter: normalizeCharacterOnLoad(activeCharacter),
    allCharacters: existingCharactersMap
  };
}
