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
}

export interface WondrousItem {
  id: string;
  name: string;
  slot: 'head' | 'headband' | 'neck' | 'shoulders' | 'chest' | 'body' | 'armor' | 'hands' | 'arms' | 'waist' | 'feet' | 'ring1' | 'ring2' | 'slotless';
  effect: string;
  weight?: number;
}

export interface Equipment {
  armor: string;
  armorEnhancement: number;
  shield: string;
  shieldEnhancement: number;
  deflection: number;
  natural: number;
  dodge: number;
  primaryWeapon: string;
  primaryWeaponEnhancement?: number;
  secondaryWeapon?: string;
  secondaryWeaponEnhancement?: number;
  rangedWeapon?: string;
  rangedWeaponEnhancement?: number;
  wondrousItems?: WondrousItem[];
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  weight: number; // Weight per item in lbs
  location?: 'Carried' | 'Backpack' | 'Belt Pouch' | 'Haversack' | 'Mount' | 'Stash' | string;
  value?: string;
  notes?: string;
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

export interface TacticalCombatState {
  powerAttack: number;
  combatExpertise: number;
  fightingDefensively: boolean;
  haste: boolean;
  rage: boolean;
  whirlingFrenzy: boolean;
  flurryOfBlows: boolean;
  isCollapsed?: boolean;
}

export interface CharacterState {
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
  isGestalt: boolean;
  levelProgression: LevelProgression[];
  skillRanks: Record<string, number>;
  selectedFeats: string[];
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
}

export interface RaceData {
  id: string;
  name: string;
  category?: string;
  size?: string;
  type?: string;
  subtype?: string;
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
  threat: number;
  critMultiplier: number;
  range?: string;
  weight: number;
  type: string;
  special?: string;
  source?: string;
}

export interface FeatData {
  id: string;
  name: string;
  prerequisites?: string;
  description: string;
  source?: string;
}

export interface DomainData {
  id: string;
  name: string;
  power: string;
  spells: string[];
  source?: string;
}

export interface DeityData {
  id: string;
  name: string;
  alignment: string;
  favoredWeapon: string;
  domains: string[];
}

