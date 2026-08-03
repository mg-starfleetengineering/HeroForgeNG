import sourcesData from '../data/sources.json';

export interface SourceBook {
  id: string;
  name: string;
  abbr: string;
  category: string;
  isCore: boolean;
}

export const ALL_SOURCES: SourceBook[] = sourcesData as SourceBook[];

export const CORE_SOURCES: string[] = ALL_SOURCES.filter(s => s.isCore).map(s => s.id);

/**
 * Returns default allowed sources: Core Only (PHB, DMG, MM)
 */
export function getDefaultAllowedSources(): string[] {
  return [...CORE_SOURCES];
}

/**
 * Normalize source abbreviations / aliases to match standard source IDs
 */
export function normalizeSourceCode(rawSource?: string): string {
  if (!rawSource || rawSource.trim() === '') return 'PHB';
  const clean = rawSource.trim().toUpperCase();

  if (['PH', 'PHB', 'PLAYERS HANDBOOK', 'PLAYER\'S HANDBOOK', 'CORE'].includes(clean)) return 'PHB';
  if (['DMG', 'DUNGEON MASTER\'S GUIDE'].includes(clean)) return 'DMG';
  if (['MM', 'MONSTER MANUAL'].includes(clean)) return 'MM';

  // Map known alternate tags from dataset
  const aliasMap: Record<string, string> = {
    'PH1': 'PHB',
    'FB': 'Frost',
    'SW': 'Sto',
    'MIC': 'Mag',
    'FC2': 'FCII',
    'CUST': 'PHB',
    'CUST`': 'PHB',
    'SH': 'CS',
    'MAG': 'Mag',
    'RVL': 'RCS',
    'CR': 'RCS'
  };

  if (aliasMap[clean]) return aliasMap[clean];

  // Try matching directly in ALL_SOURCES
  const found = ALL_SOURCES.find(s => s.id.toUpperCase() === clean || s.abbr.toUpperCase() === clean);
  if (found) return found.id;

  return clean;
}

/**
 * Check if an item's source is included in the allowed sources list.
 * Default allowedSources to Core Only if undefined.
 */
export function isSourceAllowed(itemSource?: string, allowedSources?: string[]): boolean {
  const currentAllowed = (allowedSources && allowedSources.length > 0) ? allowedSources : CORE_SOURCES;
  const normalized = normalizeSourceCode(itemSource);
  
  // If the normalized source is in the allowed list, return true
  if (currentAllowed.includes(normalized)) return true;

  // Custom or non-tagged items default to allowed
  if (!itemSource || itemSource === 'Custom' || itemSource === 'Core') return true;

  return false;
}

/**
 * Get detailed source badge metadata for UI display
 */
export function getSourceBadgeInfo(itemSource?: string, allowedSources?: string[]) {
  const normalized = normalizeSourceCode(itemSource);
  const sourceBook = ALL_SOURCES.find(s => s.id === normalized);
  const isAllowed = isSourceAllowed(itemSource, allowedSources);

  return {
    sourceCode: normalized,
    sourceName: sourceBook ? sourceBook.name : normalized,
    isCore: sourceBook ? sourceBook.isCore : (normalized === 'PHB' || normalized === 'DMG' || normalized === 'MM'),
    isAllowed
  };
}
