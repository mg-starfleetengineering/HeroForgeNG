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
  if (['DMG', 'DUNGEON MASTER\'S GUIDE', 'D20SRD', 'D20SRD.ORG', 'SRD'].includes(clean)) return 'DMG';
  if (['MM', 'MONSTER MANUAL'].includes(clean)) return 'MM';

  // Map known alternate tags from dataset
  const aliasMap: Record<string, string> = {
    'PH1': 'PHB',
    'FB': 'Frost',
    'SW': 'Sto',
    'MIC': 'Mag',
    'FC2': 'FCII',
    'CUST': 'Custom',
    'CUST`': 'Custom',
    'CUSTOM': 'Custom',
    'CUSTOM MAGIC': 'Custom',
    'BACKPACK': 'Custom',
    'INVENTORY': 'Custom',
    'SH': 'CS',
    'MAG': 'Mag',
    'RVL': 'RCS',
    'CR': 'RCS',
    'D20SRD.ORG': 'DMG',
    'D20SRD': 'DMG',
    'SRD': 'DMG',
    'MAGIC ITEM COMPENDIUM': 'Mag',
    'COMPLETE ARCANE': 'CAr',
    'RACES OF DESTINY': 'RoD'
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
  
  // Custom, backpack, or non-tagged items default to allowed
  if (!itemSource || itemSource === 'Custom' || itemSource === 'Core' || itemSource === 'Backpack' || itemSource === 'Inventory' || itemSource.toLowerCase().includes('custom') || normalized === 'Custom') return true;

  // If the normalized source is in the allowed list, return true
  if (currentAllowed.includes(normalized) || currentAllowed.some(a => normalizeSourceCode(a) === normalized)) return true;

  return false;
}

/**
 * Checks whether an item with either a single source or multiple aggregated sources is allowed.
 * Returns true if ANY of the item's sources is allowed.
 */
export function isItemSourceAllowed(
  item: { source?: string; sources?: string[] },
  allowedSources?: string[]
): boolean {
  if (item.sources && item.sources.length > 0) {
    return item.sources.some(src => isSourceAllowed(src, allowedSources));
  }
  return isSourceAllowed(item.source, allowedSources);
}

/**
 * Get detailed source badge metadata for UI display
 */
export function getSourceBadgeInfo(itemSource?: string, allowedSources?: string[]) {
  const normalized = normalizeSourceCode(itemSource);
  const sourceBook = ALL_SOURCES.find(s => s.id === normalized);
  const isAllowed = isSourceAllowed(itemSource, allowedSources);

  return {
    sourceCode: sourceBook ? sourceBook.abbr : normalized,
    sourceName: sourceBook ? sourceBook.name : normalized,
    isCore: sourceBook ? sourceBook.isCore : (normalized === 'PHB' || normalized === 'DMG' || normalized === 'MM'),
    isAllowed
  };
}

/**
 * Gets detailed badge info for all sources of an item (e.g. for reprinted/multi-source feats).
 */
export function getAllSourceBadges(
  item: { source?: string; sources?: string[] },
  allowedSources?: string[]
) {
  const rawList = item.sources && item.sources.length > 0 ? item.sources : [item.source || 'PHB'];
  // Deduplicate normalized codes
  const seen = new Set<string>();
  const badges = [];

  for (const src of rawList) {
    const info = getSourceBadgeInfo(src, allowedSources);
    if (!seen.has(info.sourceCode)) {
      seen.add(info.sourceCode);
      badges.push(info);
    }
  }

  const isAllowed = badges.some(b => b.isAllowed);
  return {
    badges,
    isAllowed
  };
}

/**
 * Sorts an array of items (like races, classes, weapons, feats) alphabetically by name,
 * with items allowed by the current selected sources grouped at the top.
 */
export function sortDropdownItems<T extends { name?: string; source?: string; sources?: string[] }>(
  items: T[],
  allowedSources?: string[],
  getName?: (item: T) => string
): T[] {
  const getItemName = getName || ((item: T) => item.name || '');
  return [...items].sort((a, b) => {
    const allowedA = isItemSourceAllowed(a, allowedSources);
    const allowedB = isItemSourceAllowed(b, allowedSources);

    if (allowedA !== allowedB) {
      return allowedA ? -1 : 1; // Allowed items grouped at top
    }

    return getItemName(a).localeCompare(getItemName(b), undefined, { sensitivity: 'base' });
  });
}


