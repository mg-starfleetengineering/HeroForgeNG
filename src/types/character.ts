export type StatType = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export interface BaseStats {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface LevelProgression {
  level: number;
  primaryClass: string;
  secondaryClass?: string;
  hpRoll: number;
}

export interface CustomArmorData {
  id: string;
  name: string;
  acBonus: number;
  maxDex?: number;
  armorCheckPenalty?: number;
  type: 'light' | 'medium' | 'heavy' | 'shield' | 'other';
  weight?: number;
  description?: string;
  enhancementBonus?: number;
  specialQualities?: string[];
  baseArmorId?: string;
  material?: 'adamantine' | 'mithral' | 'dragonhide' | 'darkwood' | 'cold_iron' | 'alchemical_silver' | 'standard' | string;
  cost?: string;
  isMasterwork?: boolean;
}

export interface WondrousItem {
  id: string;
  name: string;
  slot: 'head' | 'headband' | 'neck' | 'shoulders' | 'chest' | 'body' | 'armor' | 'hands' | 'arms' | 'waist' | 'feet' | 'ring1' | 'ring2' | 'slotless';
  effect: string;
  weight?: number;
  inventoryItemId?: string;
}

export interface ItemArmorData {
  type: 'light' | 'medium' | 'heavy' | 'shield';
  acBonus: number;
  maxDex: number;
  armorCheckPenalty: number;
  spellFailure?: number;
  speedPenalty?: boolean;
  isMasterwork?: boolean;
}

export interface ItemWeaponData {
  category?: string;
  size?: 'L' | 'M' | 'T' | string;
  damageM?: string;
  damageS?: string;
  threat?: number;
  critMultiplier?: number;
  damageType?: string;
  rangeIncrement?: number;
  isRanged?: boolean;
  baneTarget?: string;
  isMasterwork?: boolean;
}

export type EquipmentMaterial = 'adamantine' | 'mithral' | 'dragonhide' | 'darkwood' | 'cold_iron' | 'alchemical_silver' | 'standard';

export interface Equipment {
  armor: string;
  armorEnhancement: number;
  armorMaterial?: EquipmentMaterial | string;
  armorMasterwork?: boolean;
  shield: string;
  shieldEnhancement: number;
  shieldMaterial?: EquipmentMaterial | string;
  shieldMasterwork?: boolean;
  deflection: number;
  natural: number;
  dodge: number;
  primaryWeapon: string;
  primaryWeaponEnhancement?: number;
  primaryWeaponQualities?: string[];
  primaryWeaponBaneTarget?: string;
  primaryWeaponMaterial?: EquipmentMaterial | string;
  primaryWeaponMasterwork?: boolean;
  secondaryWeapon?: string;
  secondaryWeaponEnhancement?: number;
  secondaryWeaponQualities?: string[];
  secondaryWeaponBaneTarget?: string;
  secondaryWeaponMaterial?: EquipmentMaterial | string;
  secondaryWeaponMasterwork?: boolean;
  rangedWeapon?: string;
  rangedWeaponEnhancement?: number;
  rangedWeaponQualities?: string[];
  rangedWeaponBaneTarget?: string;
  rangedWeaponMaterial?: EquipmentMaterial | string;
  rangedWeaponMasterwork?: boolean;
  armorQualities?: string[];
  shieldQualities?: string[];
  wondrousItems?: WondrousItem[];

  // Entity item ID pointers into character.inventory
  armorItemId?: string | null;
  shieldItemId?: string | null;
  primaryWeaponItemId?: string | null;
  secondaryWeaponItemId?: string | null;
  rangedWeaponItemId?: string | null;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  weight: number; // Weight per item in lbs
  location?: 'Carried' | 'Backpack' | 'Belt Pouch' | 'Haversack' | 'Mount' | 'Stash' | string;
  value?: string;
  notes?: string;
  material?: EquipmentMaterial | string;
  baseItemId?: string;
  enhancementBonus?: number;
  specialQualities?: string[];
  baneTarget?: string;
  isMasterwork?: boolean;

  itemType?: 'weapon' | 'armor' | 'shield' | 'wondrous' | 'gear' | 'consumable';
  armorData?: ItemArmorData;
  weaponData?: ItemWeaponData;
}

export interface Funds {
  cp: number;
  sp: number;
  gp: number;
  pp: number;
  otherValuables?: number; // Value in GP for gems, trade goods, art objects
}

export interface QuestEntry {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'failed';
  location?: string;
  objectives?: string;
  rewards?: string;
  notes?: string;
}

export interface NpcEntry {
  id: string;
  name: string;
  attitude: 'friendly' | 'neutral' | 'hostile' | 'unknown';
  faction?: string;
  location?: string;
  notes?: string;
}

export interface SessionLog {
  id: string;
  sessionNumber: number;
  date: string;
  title: string;
  summary: string;
  lootOrXP?: string;
}

export interface CharacterNotes {
  backstory?: string;
  appearance?: string;
  personality?: string;
  alliesAndOrganizations?: string;
  scratchpad?: string;
  quests?: QuestEntry[];
  npcs?: NpcEntry[];
  sessions?: SessionLog[];
}

export interface Aura {
  id: string;
  name: string;
  type: 'Class Feature' | 'Feat' | 'Spell/Power' | 'Item/Equipment' | 'Racial' | 'Custom';
  radius: number; // radius in feet (e.g. 10, 20, 30, 60)
  target: 'Allies' | 'Enemies' | 'Self & Allies' | 'All Creatures';
  effect: string;
  active: boolean;
  saveDc?: string | number;
  source?: string;
  notes?: string;
}
export interface ActiveCombatBuff {
  id: string;
  name: string;
  category: 'stance' | 'spell' | 'class_feature' | 'item' | 'other';
  active: boolean;
  bonusType?: 'untyped' | 'morale' | 'luck' | 'insight' | 'sacred' | 'profane' | 'enhancement' | 'size' | 'dodge' | 'deflection';
  abilityBonuses?: Partial<Record<'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA', number>>;
  attackBonus?: number;
  damageBonus?: number;
  acBonus?: { value: number; type: 'dodge' | 'deflection' | 'morale' | 'insight' | 'sacred' | 'untyped' };
  saveBonuses?: { fort?: number; ref?: number; will?: number; all?: number; type?: 'untyped' | 'morale' | 'luck' | 'insight' | 'sacred' | 'resistance' | 'dodge' };
  speedBonus?: number;
  extraAttacks?: number;
  notes?: string;
}

export interface TacticalCombatState {
  powerAttack: number;
  combatExpertise: number;
  fightingDefensively: boolean;
  haste: boolean;
  rage: boolean;
  whirlingFrenzy: boolean;
  flurryOfBlows: boolean;
  smiteEvil?: boolean;
  stunningFist?: boolean;
  isCollapsed?: boolean;
}

export type ConditionCategory = 'mental' | 'physical' | 'sensory' | 'positional' | 'incapacitated';

export type ConditionType =
  | 'blinded'
  | 'cowering'
  | 'dazed'
  | 'dazzled'
  | 'deafened'
  | 'disabled'
  | 'dying'
  | 'entangled'
  | 'exhausted'
  | 'fascinated'
  | 'fatigued'
  | 'flat_footed'
  | 'frightened'
  | 'grappled'
  | 'helpless'
  | 'nauseated'
  | 'panicked'
  | 'paralyzed'
  | 'pinned'
  | 'prone'
  | 'shaken'
  | 'sickened'
  | 'staggered'
  | 'stunned'
  | 'unconscious';

export interface ConditionDefinition {
  id: ConditionType;
  name: string;
  category: ConditionCategory;
  description: string;
  summary: string;
  effects: string[];
  icon: string;
  badgeColor: string;
}

export interface ConditionPenalties {
  strPenalty: number;
  dexPenalty: number;
  attackPenalty: number;
  meleeAttackPenalty: number;
  rangedAttackPenalty: number;
  damagePenalty: number;
  fortPenalty: number;
  refPenalty: number;
  willPenalty: number;
  allSavesPenalty: number;
  acPenalty: number;
  meleeAcPenalty: number;
  rangedAcPenalty: number;
  loseDexToAc: boolean;
  speedMultiplier: number;
  initiativePenalty: number;
  skillCheckPenalty: number;
  searchPenalty: number;
  spotPenalty: number;
  listenPenalty: number;
  specialNotes: string[];
}

export type VitalsHealthStatus =
  | 'healthy'
  | 'injured'
  | 'bloodied'
  | 'disabled'
  | 'dying'
  | 'dead'
  | 'staggered'
  | 'unconscious';

export interface DREntry {
  value: number;
  bypass: string;
  abilityType?: 'Ex' | 'Su';
  source?: string;
  notes?: string;
  stacks?: boolean;
}

export interface SREntry {
  value: number;
  source?: string;
  notes?: string;
  stacks?: boolean;
}

export interface CharacterState {
  id?: string;
  updatedAt?: number;
  name: string;
  player: string;
  alignment: string;
  deity: string;
  portraitUrl?: string;
  pointBuyTarget: string;
  baseStats: BaseStats;
  enhancementMods: BaseStats;
  levelBumps: Record<number, StatType>;
  selectedRace: string;
  raceOverride?: string;
  isGestalt: boolean;
  levelProgression: LevelProgression[];
  skillRanks: Record<string, number>;
  selectedFeats?: string[];
  selectedFeatEntities?: CharacterFeat[];
  equipment: Equipment;
  inventory?: InventoryItem[];
  funds?: Funds;
  customWeapons?: WeaponData[];
  customArmors?: CustomArmorData[];
  auras?: Aura[];
  notes?: CharacterNotes;
  allowedSources?: string[];
  usePathfinderPerception?: boolean;
  prePerceptionSkillsCache?: {
    spotRanks: number;
    listenRanks: number;
    searchRanks: number;
  };
  selectedTraits?: string[];
  selectedFlaws?: string[];
  selectedSkillTricks?: string[];
  selectedTemplate?: string;
  selectedDomains?: string[];
  tacticalCombat?: TacticalCombatState;
  activeBuffs?: ActiveCombatBuff[];
  familiar?: FamiliarState;
  animalCompanion?: AnimalCompanionState;
  wildShape?: WildShapeState;
  currentHp?: number;
  tempHp?: number;
  nonlethalDamage?: number;
  activeConditions?: string[];
  resourceUsages?: Record<string, number>;
  customResources?: CustomResourceDefinition[];
  barbarianVariant?: 'rage' | 'whirling_frenzy';
  spellbookSpells?: string[];
  preparedSpells?: PreparedSpellSlot[];
  expendedSpellSlots?: Record<string, number>;
  damageReduction?: DREntry[];
  spellResistance?: SREntry[];
}

export interface DailyResourceTrack {
  id: string;
  name: string;
  category: 'class' | 'feat' | 'pool' | 'custom';
  maxUses: number;
  usedUses: number;
  isPool?: boolean;
  unit?: string;
  source: string;
  description?: string;
  icon?: string;
  badgeColor?: string;
}

export interface CustomResourceDefinition {
  id: string;
  name: string;
  maxUses: number;
  unit?: string;
  isPool?: boolean;
  description?: string;
  icon?: string;
}

export interface TemplateData {
  id: string;
  name: string;
  shortDescription?: string;
  size?: string;
  type?: string;
  subtype?: string;
  strAdj?: number;
  dexAdj?: number;
  conAdj?: number;
  intAdj?: number;
  wisAdj?: number;
  chaAdj?: number;
  naturalArmor?: number;
  levelAdj?: number;
  speed?: {
    land?: number;
    fly?: number;
    flyManeuverability?: string;
    swim?: number;
    burrow?: number;
    climb?: number;
  };
  specialAbilities?: string;
  source?: string;
  prerequisites?: string;
}

export interface SkillTrickData {
  id: string;
  name: string;
  category: string;
  description: string;
  prerequisites?: string;
  prereqRanks?: Record<string, number>;
  prereqFeats?: string[];
  source?: string;
}

export interface TraitData {
  id: string;
  name: string;
  description: string;
  source?: string;
  statMods?: Partial<BaseStats>;
  saveMods?: { fort?: number; ref?: number; will?: number };
  skillMods?: Record<string, number>;
  initiativeMod?: number;
  acMod?: number;
  hpPerLevelMod?: number;
  speedMod?: number;
  prerequisites?: string;
}

export interface FlawData {
  id: string;
  name: string;
  description: string;
  source?: string;
  statMods?: Partial<BaseStats>;
  saveMods?: { fort?: number; ref?: number; will?: number };
  skillMods?: Record<string, number>;
  initiativeMod?: number;
  acMod?: number;
  hpPerLevelMod?: number;
  speedMod?: number;
  prerequisites?: string;
}

export interface ClassData {
  id: string;
  name: string;
  abbr: string;
  maxLevels: number;
  hitDie: number;
  skillPoints: number;
  babFactor: number;
  fortFactor: number;
  refFactor: number;
  willFactor: number;
  bonusCaster?: string;
  source?: string;
  proficiencies: {
    lightArmor: boolean;
    mediumArmor: boolean;
    heavyArmor: boolean;
    shield: boolean;
    towerShield: boolean;
    simpleWeapons: boolean;
    martialWeapons: boolean;
  };
  classSkills: string[];
  features?: string[];
}

export interface RaceData {
  id: string;
  name: string;
  category?: string;
  size?: string;
  type?: string;
  subtype?: string;
  subtypes?: string[];
  traits?: string[];
  hd?: number;
  speed?: {
    land: number;
    fly?: number;
    swim?: number;
    burrow?: number;
    climb?: number;
  };
  strAdj?: number;
  dexAdj?: number;
  conAdj?: number;
  intAdj?: number;
  wisAdj?: number;
  chaAdj?: number;
  naturalArmor?: number;
  levelAdj?: number;
  favoredClass?: string;
  automaticLanguages?: string;
  bonusLanguages?: string;
  bonusFeats?: string;
  specialAbilities?: string;
  spellLikeAbilities?: string;
  psionicAbilities?: string;
  racialSkills?: string;
  source?: string;
}

export interface WeaponData {
  id: string;
  name: string;
  category: string;
  size: string;
  damageM: string;
  damageS?: string;
  threat: number;
  critMultiplier: number;
  range?: string;
  rangeIncrement?: number;
  weight: number;
  type: string;
  special?: string;
  source?: string;
  enhancementBonus?: number;
  specialQualities?: string[];
  baneTarget?: string;
  baseWeaponId?: string;
  material?: EquipmentMaterial | string;
  cost?: string;
  isMasterwork?: boolean;
}

export interface FeatData {
  id: string;
  name: string;
  prerequisites?: string;
  description: string;
  source?: string;
  sources?: string[];
  compiledPrerequisites?: CompiledFeatPrerequisites;
}

export type FeatPrereqRuleType =
  | 'ability_score'
  | 'bab'
  | 'base_save'
  | 'character_level'
  | 'first_level_only'
  | 'class_level'
  | 'caster_level'
  | 'manifester_level'
  | 'spell_level'
  | 'spellcasting_type'
  | 'skill_rank'
  | 'feat'
  | 'proficiency'
  | 'race'
  | 'subtype'
  | 'alignment'
  | 'size'
  | 'special_feature'
  | 'metamagic_count'
  | 'item_creation_count'
  | 'editorial';

export interface FeatPrereqRule {
  type: FeatPrereqRuleType;
  stat?: StatType;
  minValue?: number;
  saveType?: 'fort' | 'ref' | 'will';
  className?: string;
  spellType?: 'arcane' | 'divine' | 'psionic' | 'any';
  skillName?: string;
  featId?: string;
  targetId?: string;
  targetCandidates?: string[];
  requiresSameTarget?: boolean;
  proficiencyType?: string;
  raceName?: string;
  subtypeName?: string;
  alignmentValue?: string;
  sizeValue?: string;
  featureName?: string;
  rawText: string;
}

export interface FeatPrereqClauseAST {
  operator: 'AND' | 'OR';
  rules: FeatPrereqRule[];
  rawClause: string;
}

export interface CompiledFeatPrerequisites {
  clauses: FeatPrereqClauseAST[];
  raw: string;
}

export interface CharacterFeat {
  id: string;
  featId: string;
  targetId?: string;
  targetType?: 'weapon' | 'school' | 'skill' | 'energy';
  notes?: string;
}

const KNOWN_SPELL_SCHOOLS = new Set([
  'abjuration',
  'conjuration',
  'divination',
  'enchantment',
  'evocation',
  'illusion',
  'necromancy',
  'transmutation',
  'universal'
]);

const KNOWN_ENERGY_TYPES = new Set([
  'acid',
  'cold',
  'electricity',
  'fire',
  'sonic'
]);

/**
 * Parses a legacy feat string (e.g. "Weapon Focus (Longsword)", "Spell Focus: Evocation") into a structured CharacterFeat.
 */
export function parseLegacyFeatString(featStr: string, index = 0): CharacterFeat | null {
  const clean = featStr.trim();
  if (!clean) return null;

  // Match parameterized feats: "Feat Name (Target)" or "Feat Name: Target"
  const match = clean.match(/^(.+?)(?:\s*[\(:])\s*(.+?)\)?$/);
  if (match) {
    const rawBase = match[1].trim();
    const rawTarget = match[2].trim();
    const lowerBase = rawBase.toLowerCase();
    const lowerTarget = rawTarget.toLowerCase();

    // Special case for Armor Proficiency (Light / Medium / Heavy)
    if (lowerBase === 'armor proficiency') {
      const featId = `armor_proficiency_${lowerTarget.replace(/[^a-z0-9]+/g, '_')}`;
      return {
        id: `${featId}_${index}`,
        featId
      };
    }

    const featId = lowerBase.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const targetId = lowerTarget;

    let targetType: 'weapon' | 'school' | 'skill' | 'energy' = 'weapon';
    if (lowerBase.includes('spell') || KNOWN_SPELL_SCHOOLS.has(lowerTarget)) {
      targetType = 'school';
    } else if (lowerBase.includes('energy') || KNOWN_ENERGY_TYPES.has(lowerTarget)) {
      targetType = 'energy';
    } else if (lowerBase.includes('skill')) {
      targetType = 'skill';
    } else if (lowerBase.includes('weapon') || lowerBase.includes('critical') || lowerBase.includes('proficiency')) {
      targetType = 'weapon';
    }

    const cleanTargetSlug = targetId.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return {
      id: `${featId}_${cleanTargetSlug || index}`,
      featId,
      targetId,
      targetType
    };
  }

  // Non-parameterized feat (e.g. "Power Attack", "Cleave")
  const featId = clean.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return {
    id: featId || `feat_${index}`,
    featId
  };
}

/**
 * Automated migration helper to parse legacy feat strings into structured CharacterFeat entities.
 * Supports Partial<CharacterState> or string[].
 */
export function migrateLegacyFeatStrings(
  characterOrFeats: Partial<CharacterState> | string[]
): CharacterFeat[] {
  if (Array.isArray(characterOrFeats)) {
    const seenIds = new Set<string>();
    return characterOrFeats
      .map((str, idx) => parseLegacyFeatString(str, idx))
      .filter((f): f is CharacterFeat => f !== null)
      .map(entity => {
        let finalId = entity.id;
        let counter = 1;
        while (seenIds.has(finalId)) {
          finalId = `${entity.id}_${counter++}`;
        }
        seenIds.add(finalId);
        return { ...entity, id: finalId };
      });
  }

  const char = characterOrFeats || {};
  const existingEntities = Array.isArray(char.selectedFeatEntities) ? [...char.selectedFeatEntities] : [];
  const legacyStrings = Array.isArray(char.selectedFeats) ? char.selectedFeats : [];

  if (existingEntities.length > 0 && legacyStrings.length === 0) {
    return existingEntities;
  }

  const migratedFromStrings = migrateLegacyFeatStrings(legacyStrings);
  const seenKeys = new Set(existingEntities.map(e => `${e.featId}::${e.targetId || ''}`));
  const combined = [...existingEntities];

  for (const entity of migratedFromStrings) {
    const key = `${entity.featId}::${entity.targetId || ''}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      combined.push(entity);
    }
  }

  if (char && typeof char === 'object') {
    char.selectedFeatEntities = combined;
  }

  return combined;
}

export interface DomainData {
  id: string;
  name: string;
  power: string;
  spells: string[];
  spellIds?: string[];
  source?: string;
}

export interface SpellData {
  id: string;
  name: string;
  school: string;
  subschool?: string | null;
  descriptors?: string[];
  levels: Record<string, number>;
  classLevels?: Record<string, number>;
  domainLevels?: Record<string, number>;
  components?: string;
  castingTime: string;
  range: string;
  targetArea: string;
  duration: string;
  savingThrow: string;
  spellResistance: string;
  description: string;
  source: string;
}

export interface PreparedSpellSlot {
  id: string; // unique slot identifier (e.g. "Wizard_1_0" or "Cleric_domain_2_0")
  className: string; // e.g. "Wizard", "Cleric", "Druid", "Paladin", "Ranger"
  classId?: string; // canonical class ID (e.g. "cleric", "wizard", "druid")
  domainId?: string; // canonical domain ID (e.g. "water", "sun") if domain slot
  spellLevel: number; // 0 to 9
  slotIndex: number; // 0-based index of slot at this level
  spellId: string | null; // spell ID or null if unassigned
  spellName?: string; // friendly spell name
  isDomain?: boolean; // true if dedicated Cleric domain slot
  isCast?: boolean; // expended/cast tracker in-play
}


export interface SupplementalDomainGrant {
  domain: string;
  level: number;
  domainPower: string;
  source: string;
}

export interface SupplementalDomainSpellData {
  id: string;
  name: string;
  source: string;
  excelOrigin: {
    sheet: string;
    row: number;
  };
  domains: SupplementalDomainGrant[];
  levels: Record<string, number>;
  classLevels?: Record<string, number>;
  domainLevels?: Record<string, number>;
}


export interface DeityData {
  id: string;
  name: string;
  alignment: string;
  favoredWeapon: string;
  domains: string[];
}

export interface FamiliarAttack {
  name: string;
  damage: string;
  strMultiplier?: number;
}

export interface FamiliarData {
  id: string;
  name: string;
  type: 'standard' | 'improved';
  prereqLevel: number;
  alignmentReq?: string;
  size: string;
  creatureType: string;
  hd: number;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  naturalArmor: number;
  dr: string;
  sr: number;
  speed: {
    land: number;
    fly?: number;
    flyManeuverability?: string;
    swim?: number;
    climb?: number;
    burrow?: number;
  };
  baseFort: number;
  baseRef: number;
  baseWill: number;
  baseBab: number;
  masterBonus: string;
  specialAbilities: string[];
  feats: string[];
  attacks: FamiliarAttack[];
  skillBonus?: Record<string, number>;
  source?: string;
}

export interface CustomFamiliarData {
  name: string;
  size: string;
  creatureType: string;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  naturalArmor: number;
  dr?: string;
  sr?: number;
  attacks?: FamiliarAttack[];
  speed?: {
    land: number;
    fly?: number;
    flyManeuverability?: string;
    swim?: number;
    climb?: number;
    burrow?: number;
  };
  specialAbilities?: string[] | string;
  feats?: string[] | string;
  speedLand?: number;
  speedFly?: number;
  speedFlyManeuverability?: string;
  speedSwim?: number;
  speedClimb?: number;
  speedBurrow?: number;
  baseFort?: number;
  baseRef?: number;
  baseWill?: number;
  baseBab?: number;
  masterBonus?: string;
  attack1Name?: string;
  attack1Damage?: string;
  attack2Name?: string;
  attack2Damage?: string;
  skillBonus?: Record<string, number>;
  notes?: string;
}

export interface FamiliarState {
  hasFamiliar: boolean;
  selectedFamiliarId: string; // 'bat', 'cat', ..., or 'custom'
  customFamiliar?: CustomFamiliarData;
  overrideName?: string;
  customHp?: number;
  notes?: string;
}

export interface AnimalCompanionAttack {
  name: string;
  damage: string;
  strMultiplier?: number;
}

export interface AnimalCompanionData {
  id: string;
  name: string;
  minLevel: number;
  size: string;
  creatureType: string;
  hd: number;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  naturalArmor: number;
  speed: {
    land: number;
    fly?: number;
    flyManeuverability?: string;
    swim?: number;
    climb?: number;
    burrow?: number;
  };
  attacks: AnimalCompanionAttack[];
  specialAbilities: string[];
  feats: string[];
  source?: string;
  isQuadruped?: boolean;
}

export interface CustomAnimalCompanionData {
  name: string;
  minLevel?: number;
  size: string;
  creatureType: string;
  hd?: number;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  naturalArmor: number;
  attacks?: AnimalCompanionAttack[];
  speed?: {
    land: number;
    fly?: number;
    flyManeuverability?: string;
    swim?: number;
    climb?: number;
    burrow?: number;
  };
  specialAbilities?: string[] | string;
  feats?: string[] | string;
  isQuadruped?: boolean;
  notes?: string;
  speedLand?: number;
  speedFly?: number;
  speedFlyManeuverability?: string;
  speedSwim?: number;
  speedClimb?: number;
  speedBurrow?: number;
  attack1Name?: string;
  attack1Damage?: string;
  attack2Name?: string;
  attack2Damage?: string;
}

export interface AnimalCompanionState {
  hasCompanion: boolean;
  selectedCompanionId: string; // species slug or 'custom'
  customCompanion?: CustomAnimalCompanionData;
  overrideName?: string;
  customHp?: number;
  assignedFeats?: string[];
  assignedSkillRanks?: Record<string, number>;
  selectedTricks?: string[];
  hasNaturalBondFeat?: boolean; // toggle/override for Natural Bond feat
  notes?: string;
}

export interface WildShapeAttack {
  name: string;
  damage: string;
  strMultiplier?: number;
  isPrimary?: boolean;
  attackCount?: number;
  special?: string;
  damageType?: string;
}

export interface WildShapeFormData {
  id: string;
  name: string;
  category: 'animal' | 'dinosaur' | 'plant' | 'elemental' | 'custom' | string;
  size: string;
  creatureType: string;
  minDruidLevel: number;
  str: number;
  dex: number;
  con: number;
  naturalArmor: number;
  space?: number;
  reach?: number;
  speed: {
    land: number;
    fly?: number;
    flyManeuverability?: string;
    swim?: number;
    climb?: number;
    burrow?: number;
  };
  attacks: WildShapeAttack[];
  specialQualities?: string[];
  source?: string;
  description?: string;
}

export interface CustomWildShapeData {
  name: string;
  category: string;
  size: string;
  creatureType: string;
  minDruidLevel?: number;
  str: number;
  dex: number;
  con: number;
  naturalArmor: number;
  space?: number;
  reach?: number;
  attacks?: WildShapeAttack[];
  speed?: {
    land: number;
    fly?: number;
    flyManeuverability?: string;
    swim?: number;
    climb?: number;
    burrow?: number;
  };
  specialQualities?: string[] | string;
  notes?: string;
  speedLand?: number;
  speedFly?: number;
  speedFlyManeuverability?: string;
  speedSwim?: number;
  speedClimb?: number;
  speedBurrow?: number;
  attack1Name?: string;
  attack1Damage?: string;
  attack1Count?: number;
  attack1IsPrimary?: boolean;
  attack1Special?: string;
  attack2Name?: string;
  attack2Damage?: string;
  attack2Count?: number;
  attack2IsPrimary?: boolean;
  attack2Special?: string;
}

export interface WildShapeState {
  isActive: boolean;
  selectedFormId?: string; // form ID or 'custom'
  customForm?: CustomWildShapeData;
  overrideName?: string;
  hasNaturalSpell?: boolean;
  notes?: string;
}

export interface CharacterSummary {
  id: string; // crypto.randomUUID()
  name: string;
  race: string;
  classes: string; // e.g. "Fighter 3 / Wizard 2"
  level: number;
  updatedAt: number; // Date.now() timestamp
  portraitUrl?: string;
}

export interface CharacterSheetData extends CharacterState {
  id: string;
  updatedAt: number;
  damageReduction?: DREntry[];
  spellResistance?: SREntry[];
}

export interface MultiCharacterStore {
  activeCharacterId: string | null;
  characters: Record<string, CharacterSheetData>;
}

export type {
  RollType,
  RollStatus,
  DiceTerm,
  ModifierTerm,
  ParsedTerm,
  RollOptions,
  RollResult
} from '../engine/dice';

