import { CharacterSheetData, CharacterState, CharacterSummary, LevelProgression } from '../types/character';
import { normalizeCharacterOnLoad, migrateDefenses, migrateCompanionsAndWildShape } from './migration';
import { safeValidateCharacter, safeValidateRosterPackage } from '../types/schemas';

export { normalizeCharacterOnLoad, migrateDefenses, migrateCompanionsAndWildShape, safeValidateCharacter, safeValidateRosterPackage };

const DB_NAME = 'HeroForgeDB';
const DB_VERSION = 1;
const STORE_NAME = 'characters';
const ACTIVE_ID_KEY = 'heroforge_active_character_id';
const FALLBACK_STORE_KEY = 'heroforge_multi_characters_fallback';

let memoryFallbackStore: Record<string, CharacterSheetData> = {};

/**
 * Format a canonical class ID or class name into a title-cased display name.
 * e.g. 'fighter' -> 'Fighter', 'dragon_shaman' -> 'Dragon Shaman'
 */
export function formatClassNameToTitle(classIdOrName: string): string {
  if (!classIdOrName) return '';
  return classIdOrName
    .trim()
    .split(/[\s_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format level progression into a readable class summary string.
 * e.g., [{primaryClass: 'fighter'}, {primaryClass: 'fighter'}, {primaryClass: 'wizard'}] => "Fighter 2 / Wizard 1"
 */
export function formatClassesSummary(levelProgression: LevelProgression[]): string {
  if (!levelProgression || levelProgression.length === 0) {
    return 'Unclassed';
  }

  const counts: Record<string, number> = {};
  for (const entry of levelProgression) {
    if (entry.primaryClass) {
      const displayName = formatClassNameToTitle(entry.primaryClass);
      if (displayName) {
        counts[displayName] = (counts[displayName] || 0) + 1;
      }
    }
  }

  const parts = Object.entries(counts).map(([className, count]) => `${className} ${count}`);
  return parts.length > 0 ? parts.join(' / ') : 'Unclassed';
}

/**
 * Generate a concise CharacterSummary object from full CharacterSheetData.
 */
export function createCharacterSummary(character: CharacterSheetData): CharacterSummary {
  const level = character.levelProgression?.filter(l => l.primaryClass)?.length || 1;
  const classes = formatClassesSummary(character.levelProgression || []);
  const raceDisplay = character.raceOverride?.trim() || character.selectedRace || 'Human';
  return {
    id: character.id,
    name: character.name || 'Unnamed Character',
    race: raceDisplay,
    classes: classes,
    level: level,
    updatedAt: character.updatedAt || Date.now(),
    portraitUrl: character.portraitUrl
  };
}

/**
 * Helper to generate unique string IDs.
 */
export function generateCharacterId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'char_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

// Helper to open IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// LocalStorage / In-memory Fallback helpers
function getFallbackStore(): Record<string, CharacterSheetData> {
  if (typeof localStorage === 'undefined') {
    return memoryFallbackStore;
  }
  try {
    const data = localStorage.getItem(FALLBACK_STORE_KEY);
    return data ? JSON.parse(data) : memoryFallbackStore;
  } catch {
    return memoryFallbackStore;
  }
}

function saveFallbackStore(store: Record<string, CharacterSheetData>): void {
  memoryFallbackStore = store;
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(FALLBACK_STORE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('LocalStorage fallback save failed:', e);
  }
}

/**
 * Get all character sheets from IndexedDB (or localStorage fallback).
 */
export async function getAllCharacters(): Promise<Record<string, CharacterSheetData>> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const result: CharacterSheetData[] = request.result || [];
        const map: Record<string, CharacterSheetData> = {};
        for (const char of result) {
          if (char && char.id) {
            map[char.id] = normalizeCharacterOnLoad(char);
          }
        }
        // Sync to fallback store for extra safety
        saveFallbackStore(map);
        resolve(map);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (e) {
    console.warn('IndexedDB read failed, using localStorage fallback:', e);
    const rawMap = getFallbackStore();
    const map: Record<string, CharacterSheetData> = {};
    for (const [id, char] of Object.entries(rawMap)) {
      if (char && id) {
        map[id] = normalizeCharacterOnLoad(char);
      }
    }
    return map;
  }
}

/**
 * Get all character summaries sorted by updatedAt desc.
 */
export async function getAllCharacterSummaries(): Promise<CharacterSummary[]> {
  const charactersMap = await getAllCharacters();
  const summaries = Object.values(charactersMap).map(createCharacterSummary);
  return summaries.sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Get a single character sheet by ID.
 */
export async function getCharacter(id: string): Promise<CharacterSheetData | null> {
  if (!id) return null;
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const char = request.result || null;
        resolve(char ? normalizeCharacterOnLoad(char) : null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch {
    const fallback = getFallbackStore();
    const char = fallback[id] || null;
    return char ? normalizeCharacterOnLoad(char) : null;
  }
}

/**
 * Save or update a character sheet in storage.
 */
export async function saveCharacter(character: CharacterSheetData): Promise<CharacterSheetData> {
  const updatedChar: CharacterSheetData = {
    ...character,
    id: character.id || generateCharacterId(),
    updatedAt: Date.now()
  };

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(updatedChar);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('IndexedDB write failed, using localStorage fallback:', e);
  }

  // Always update fallback store too
  const fallback = getFallbackStore();
  fallback[updatedChar.id] = updatedChar;
  saveFallbackStore(fallback);

  return updatedChar;
}

/**
 * Delete a character by ID.
 */
export async function deleteCharacter(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('IndexedDB delete failed:', e);
  }

  const fallback = getFallbackStore();
  delete fallback[id];
  saveFallbackStore(fallback);
}

/**
 * Clone an existing character and save as new.
 */
export async function duplicateCharacter(id: string): Promise<CharacterSheetData | null> {
  const existing = await getCharacter(id);
  if (!existing) return null;

  const cloned: CharacterSheetData = {
    ...JSON.parse(JSON.stringify(existing)),
    id: generateCharacterId(),
    name: `${existing.name || 'Character'} (Copy)`,
    updatedAt: Date.now()
  };

  return await saveCharacter(cloned);
}

/**
 * Create a new character sheet initialized with base values and save it.
 */
export async function createNewCharacter(defaultBase: CharacterState, nameOverride?: string): Promise<CharacterSheetData> {
  const newSheet: CharacterSheetData = {
    ...JSON.parse(JSON.stringify(defaultBase)),
    id: generateCharacterId(),
    name: nameOverride || 'New Adventurer',
    updatedAt: Date.now()
  };

  return await saveCharacter(newSheet);
}

/**
 * Get active character ID from URL Search Params or localStorage.
 */
export function getActiveCharacterId(): string | null {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const urlId = urlParams.get('characterId');
    if (urlId) return urlId;

    try {
      return localStorage.getItem(ACTIVE_ID_KEY);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Set active character ID in localStorage and sync to URL query params.
 */
export function setActiveCharacterId(id: string | null): void {
  if (typeof window !== 'undefined') {
    try {
      if (id) {
        localStorage.setItem(ACTIVE_ID_KEY, id);
      } else {
        localStorage.removeItem(ACTIVE_ID_KEY);
      }
    } catch (e) {
      console.warn('Failed to set active character ID in localStorage:', e);
    }

    try {
      const url = new URL(window.location.href);
      if (id) {
        url.searchParams.set('characterId', id);
      } else {
        url.searchParams.delete('characterId');
      }
      window.history.replaceState({}, '', url.toString());
    } catch (e) {
      console.warn('Failed to update URL search params:', e);
    }
  }
}

export interface RosterBackupPackage {
  version: string;
  exportType: 'heroforge_roster_backup';
  exportedAt: number;
  activeCharacterId: string | null;
  characters: CharacterSheetData[];
}

/**
 * Creates a complete roster export package object containing all saved characters.
 */
export async function exportAllRosterPackage(): Promise<RosterBackupPackage> {
  const charactersMap = await getAllCharacters();
  const characterList = Object.values(charactersMap);
  const activeId = getActiveCharacterId();

  return {
    version: '1.0',
    exportType: 'heroforge_roster_backup',
    exportedAt: Date.now(),
    activeCharacterId: activeId,
    characters: characterList
  };
}

/**
 * Parses and imports characters from a single character JSON, array of JSONs, or full roster backup JSON package.
 * Validation runs AFTER normalizeCharacterOnLoad, preserving backwards compatibility with legacy formats
 * while filtering out genuinely corrupted character entries.
 */
export async function importRosterPackage(parsed: any): Promise<{ importedCount: number; lastImportedId: string | null }> {
  if (!parsed || typeof parsed !== 'object') {
    return { importedCount: 0, lastImportedId: null };
  }

  let characterArray: any[] = [];

  if (parsed.exportType === 'heroforge_roster_backup') {
    const pkgValidation = safeValidateRosterPackage(parsed);
    if (!pkgValidation.success) {
      console.warn('Roster package failed schema validation:', pkgValidation.error);
      return { importedCount: 0, lastImportedId: null };
    }
    if (Array.isArray(parsed.characters)) {
      characterArray = parsed.characters;
    } else if (parsed.characters && typeof parsed.characters === 'object') {
      characterArray = Object.values(parsed.characters);
    }
  } else if (Array.isArray(parsed)) {
    characterArray = parsed;
  } else if (parsed.name || parsed.levelProgression || parsed.baseStats || parsed.selectedRace) {
    characterArray = [parsed];
  }

  let importedCount = 0;
  let lastImportedId: string | null = null;

  for (const item of characterArray) {
    if (item && typeof item === 'object') {
      // 1. Normalize first: execute all migration logic
      const normalized = normalizeCharacterOnLoad(item);

      // 2. Validate with Zod: ensures required structure while .passthrough() preserves all unknown fields
      const validation = safeValidateCharacter(normalized);
      if (!validation.success) {
        console.warn('Skipping corrupted character entry during import:', validation.error);
        continue;
      }

      const validChar = validation.data;
      const charToSave: CharacterSheetData = {
        ...validChar,
        id: validChar.id || generateCharacterId(),
        updatedAt: Date.now()
      };
      const saved = await saveCharacter(charToSave);
      importedCount++;
      lastImportedId = saved.id;
    }
  }

  return { importedCount, lastImportedId };
}

/**
 * Parses and imports a single character JSON (as a string or object), normalizing and validating safely.
 * Returns the saved CharacterSheetData, or null if corrupted or invalid.
 */
export async function importCharacterJSON(input: string | object): Promise<CharacterSheetData | null> {
  if (!input) return null;

  let parsed: any;
  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input);
    } catch (err) {
      console.error('Failed to parse JSON string in importCharacterJSON:', err);
      return null;
    }
  } else {
    parsed = input;
  }

  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  // If input is a roster backup package or array, delegate to importRosterPackage
  if (parsed.exportType === 'heroforge_roster_backup' || Array.isArray(parsed)) {
    const res = await importRosterPackage(parsed);
    if (res.lastImportedId) {
      return await getCharacter(res.lastImportedId);
    }
    return null;
  }

  // Normalize first
  const normalized = normalizeCharacterOnLoad(parsed);

  // Validate with Zod
  const validation = safeValidateCharacter(normalized);
  if (!validation.success) {
    console.warn('Character JSON failed schema validation:', validation.error);
    return null;
  }

  const validChar = validation.data;
  const charToSave: CharacterSheetData = {
    ...validChar,
    id: validChar.id || generateCharacterId(),
    updatedAt: Date.now()
  };

  return await saveCharacter(charToSave);
}


