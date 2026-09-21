/**
 * HeroForgeNG Character History Engine
 * Provides undo/redo stack management, max depth capping, continuous numeric edit debouncing,
 * and text input collision prevention.
 */

export const MAX_HISTORY_STATES = 50;
export const DEFAULT_DEBOUNCE_MS = 800;

export const CONTINUOUS_KEYS = new Set([
  'currentHp',
  'tempHp',
  'nonlethalDamage',
  'funds',
  'skillRanks',
  'baseStats',
  'enhancementMods',
  'levelBumps',
  'tacticalCombat',
  'name',
  'player',
  'deity'
]);

export interface HistoryEntry<T> {
  state: T;
  timestamp: number;
  keysModified?: string[];
}

export interface HistoryState<T> {
  past: HistoryEntry<T>[];
  present: HistoryEntry<T>;
  future: HistoryEntry<T>[];
}

export interface PushStateOptions {
  debounceMs?: number;
  maxDepth?: number;
  forceNewStep?: boolean;
}

/**
 * Creates an initial HistoryState with empty past and future stacks.
 */
export function createHistory<T>(initialState: T): HistoryState<T> {
  return {
    past: [],
    present: {
      state: initialState,
      timestamp: 0
    },
    future: []
  };
}

/**
 * Determines whether a given set of modified keys represents continuous edits
 * (e.g. numeric spinners, sliders, or rapid text modifications).
 */
export function areKeysContinuous(keys?: string[]): boolean {
  if (!keys || keys.length === 0) return false;
  return keys.every(k => CONTINUOUS_KEYS.has(k));
}

/**
 * Checks whether the incoming modification should be debounced into the current state
 * instead of pushing a new undo step.
 */
export function shouldDebounce<T>(
  prevEntry: HistoryEntry<T>,
  modifiedKeys: string[] | undefined,
  now: number,
  debounceMs: number = DEFAULT_DEBOUNCE_MS
): boolean {
  if (now - prevEntry.timestamp > debounceMs) {
    return false;
  }
  if (areKeysContinuous(modifiedKeys)) {
    return true;
  }
  if (
    modifiedKeys &&
    prevEntry.keysModified &&
    modifiedKeys.length === prevEntry.keysModified.length &&
    modifiedKeys.every((k, i) => k === prevEntry.keysModified?.[i])
  ) {
    return true;
  }
  return false;
}

/**
 * Pushes a new state into the history stack, handling debouncing and max depth truncation.
 */
export function pushState<T>(
  history: HistoryState<T>,
  nextState: T,
  modifiedKeys?: string[],
  options?: PushStateOptions
): HistoryState<T> {
  const maxDepth = options?.maxDepth ?? MAX_HISTORY_STATES;
  const debounceMs = options?.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const now = Date.now();

  // Only debounce if we already have at least one committed past state
  // to ensure the user can always undo back to the initial character state.
  const isDebounced =
    history.past.length > 0 &&
    !options?.forceNewStep &&
    shouldDebounce(history.present, modifiedKeys, now, debounceMs);

  if (isDebounced) {
    return {
      past: history.past,
      present: {
        state: nextState,
        timestamp: now,
        keysModified: modifiedKeys ?? history.present.keysModified
      },
      future: []
    };
  }

  const newPast = [...history.past, history.present];
  const trimmedPast = newPast.length > maxDepth ? newPast.slice(newPast.length - maxDepth) : newPast;

  return {
    past: trimmedPast,
    present: {
      state: nextState,
      timestamp: now,
      keysModified: modifiedKeys
    },
    future: []
  };
}

/**
 * Reverts to the previous state in the history stack.
 */
export function undo<T>(history: HistoryState<T>): HistoryState<T> {
  if (history.past.length === 0) {
    return history;
  }
  const previous = history.past[history.past.length - 1];
  const newPast = history.past.slice(0, -1);
  return {
    past: newPast,
    present: previous,
    future: [history.present, ...history.future]
  };
}

/**
 * Advances to the next state in the history stack.
 */
export function redo<T>(history: HistoryState<T>): HistoryState<T> {
  if (history.future.length === 0) {
    return history;
  }
  const next = history.future[0];
  const newFuture = history.future.slice(1);
  return {
    past: [...history.past, history.present],
    present: next,
    future: newFuture
  };
}

/**
 * Returns true if an undo operation is available.
 */
export function canUndo<T>(history: HistoryState<T>): boolean {
  return history.past.length > 0;
}

/**
 * Returns true if a redo operation is available.
 */
export function canRedo<T>(history: HistoryState<T>): boolean {
  return history.future.length > 0;
}

/**
 * Checks if the user is currently typing in an input, textarea, or content-editable element.
 * Used to safeguard against intercepting browser-native text undo/redo.
 */
export function isTextInputActive(target?: { tagName?: string; type?: string; isContentEditable?: boolean } | null): boolean {
  const active = target !== undefined ? target : (typeof document !== 'undefined' ? document.activeElement : null);
  if (!active) return false;
  const tag = active.tagName?.toLowerCase();
  if (tag === 'input') {
    const type = (active as { type?: string }).type?.toLowerCase();
    return ['text', 'search', 'url', 'tel', 'email', 'password', 'number'].includes(type || '') || !type;
  }
  if (tag === 'textarea') return true;
  if ('isContentEditable' in active && Boolean((active as HTMLElement).isContentEditable)) return true;
  return false;
}
