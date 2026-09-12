import { CharacterSheetData, CharacterState } from '../types/character';
import { migrateCharacterBuffs } from '../engine/combat';
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
          const migratedChar: CharacterSheetData = {
            ...parsedLegacy,
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

    const savedDefault = await saveCharacter(defaultChar);
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
    activeCharacter: migrateCharacterBuffs(activeCharacter) as CharacterSheetData,
    allCharacters: existingCharactersMap
  };
}
