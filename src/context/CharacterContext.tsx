import React, { createContext, use, useMemo } from 'react';
import { CharacterSheetData, CharacterState } from '../types/character';

export const CharacterStateContext = createContext<CharacterSheetData | null>(null);

export interface CharacterDispatchContextValue {
  updateCharacter: (updated: Partial<CharacterState>) => void;
  setCharacter?: (action: CharacterSheetData | null | ((prev: CharacterSheetData | null) => CharacterSheetData | null)) => void;
  undo?: () => void;
  redo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const CharacterDispatchContext = createContext<CharacterDispatchContextValue | null>(null);

export interface CharacterProviderProps {
  character: CharacterSheetData | null;
  onUpdateCharacter: (updated: Partial<CharacterState>) => void;
  onSetCharacter?: (action: CharacterSheetData | null | ((prev: CharacterSheetData | null) => CharacterSheetData | null)) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  children: React.ReactNode;
}

export const CharacterProvider: React.FC<CharacterProviderProps> = ({
  character,
  onUpdateCharacter,
  onSetCharacter,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  children
}) => {
  const dispatchValue = useMemo<CharacterDispatchContextValue>(() => ({
    updateCharacter: onUpdateCharacter,
    setCharacter: onSetCharacter,
    undo: onUndo,
    redo: onRedo,
    canUndo,
    canRedo
  }), [onUpdateCharacter, onSetCharacter, onUndo, onRedo, canUndo, canRedo]);

  return (
    <CharacterStateContext.Provider value={character}>
      <CharacterDispatchContext.Provider value={dispatchValue}>
        {children}
      </CharacterDispatchContext.Provider>
    </CharacterStateContext.Provider>
  );
};

/**
 * Access character state data. Automatically re-renders when character values change.
 * Leverages React 19's use() hook.
 */
export function useCharacter(): CharacterSheetData {
  const context = use(CharacterStateContext);
  if (!context) {
    throw new Error('useCharacter must be used within a CharacterProvider with an active character');
  }
  return context;
}

/**
 * Access character state data optionally without throwing if null.
 */
export function useCharacterOptional(): CharacterSheetData | null {
  return use(CharacterStateContext);
}

/**
 * Access character mutation actions. Reference remains stable across character state changes,
 * preventing re-render cascades in action-only components.
 * Leverages React 19's use() hook.
 */
export function useCharacterDispatch(): CharacterDispatchContextValue {
  const context = use(CharacterDispatchContext);
  if (!context) {
    throw new Error('useCharacterDispatch must be used within a CharacterProvider');
  }
  return context;
}
