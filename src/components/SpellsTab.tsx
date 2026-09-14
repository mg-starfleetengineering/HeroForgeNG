import React, { useState, useMemo, useEffect } from 'react';
import {
  CharacterState,
  ClassData,
  RaceData,
  DomainData,
  DeityData,
  SpellData,
  SupplementalDomainSpellData,
  PreparedSpellSlot,
  StatType
} from '../types/character';
import { toCanonicalClassId, toCanonicalDomainId } from '../engine/classes';
import { calculateTotalScore, getAbilityMod, parseRaceMods, getCharacterLevel } from '../engine/stats';
import {
  SPELLCASTING_CLASSES,
  getSpellSlotsForClass,
  isSpellcastingClassName,
  isPreparedCaster,
  getPreparedSlotsStructure,
  syncPreparedSlotsForCharacter,
  assignPreparedSpellSlot,
  clearPreparedSpellSlot,
  togglePreparedSpellSlotCast,
  clearAllPreparedSlots,
  resetAllPreparedSlotsCast,
  addSpellToSpellbook,
  removeSpellFromSpellbook,
  getStarterWizardCantripIds,
  getAvailableSpellsForPreparation,
  getAvailableSpellsForSlot,
  getSpellLevelForClass,
  calculateSpellSaveDc,
  getSpellSlotUsageKey,
  getExpendedSpellSlotsCount,
  getRemainingSpellSlotsCount,
  expendSpellSlot,
  restoreSpellSlot,
  setExpendedSpellSlots,
  resetExpendedSpellSlotsForClass
} from '../engine/spells';
import { getSourceBadgeInfo, isSourceAllowed } from '../utils/sourceFilter';

interface SpellsTabProps {
  character: CharacterState;
  classesData: ClassData[];
  racesData?: RaceData[];
  domainsData?: DomainData[];
  deitiesData?: DeityData[];
  spellsData?: SpellData[];
  supplementalSpellsData?: SupplementalDomainSpellData[];
  onChange?: (updated: Partial<CharacterState>) => void;
}

const MAGIC_SCHOOLS = [
  'Abjuration',
  'Conjuration',
  'Divination',
  'Enchantment',
  'Evocation',
  'Illusion',
  'Necromancy',
  'Transmutation',
  'Universal'
];

const STANDARD_CLASSES = [
  'Bard',
  'Cleric',
  'Druid',
  'Paladin',
  'Ranger',
  'Sorcerer',
  'Wizard'
];

const SAVE_TYPES = [
  { label: 'All Saves', value: 'all' },
  { label: 'Fortitude', value: 'fortitude' },
  { label: 'Reflex', value: 'reflex' },
  { label: 'Will', value: 'will' },
  { label: 'None / No Save', value: 'none' }
];

export const SpellsTab: React.FC<SpellsTabProps> = ({
  character,
  classesData,
  racesData = [],
  domainsData = [],
  deitiesData = [],
  spellsData = [],
  supplementalSpellsData = [],
  onChange
}) => {
  const raceObj: Partial<RaceData> = racesData.find(r => r.name === character.selectedRace) || {};
  const raceMods = parseRaceMods(raceObj);
  const totalLevel = getCharacterLevel(character.levelProgression);

  // Count levels for each active class
  const classLevelsMap: Record<string, number> = {};
  (character.levelProgression || []).forEach(l => {
    if (l.primaryClass) {
      classLevelsMap[l.primaryClass] = (classLevelsMap[l.primaryClass] || 0) + 1;
    }
    if (l.secondaryClass) {
      classLevelsMap[l.secondaryClass] = (classLevelsMap[l.secondaryClass] || 0) + 1;
    }
  });

  const activeCasterClassNames = Object.keys(classLevelsMap).filter(clsName => {
    const clsObj = classesData.find(c => c.id === clsName || c.name.toLowerCase() === clsName.toLowerCase());
    return isSpellcastingClassName(clsName, clsObj);
  });

  const casterEntries = Object.entries(classLevelsMap).filter(([clsName]) => {
    const clsObj = classesData.find(c => c.id === clsName || c.name.toLowerCase() === clsName.toLowerCase());
    return isSpellcastingClassName(clsName, clsObj);
  });

  const preparedCasterEntries = casterEntries.filter(([clsName]) => isPreparedCaster(clsName));

  // Navigation sub-tab state (Default to Preparation if prepared caster, else Slots/Compendium)
  const [activeSubTab, setActiveSubTab] = useState<'preparation' | 'spellbook' | 'compendium' | 'slots' | 'domains'>(
    preparedCasterEntries.length > 0 ? 'preparation' : casterEntries.length > 0 ? 'slots' : 'compendium'
  );

  // Active prepared class in Daily Workshop
  const [selectedPrepClass, setSelectedPrepClass] = useState<string>(
    preparedCasterEntries[0]?.[0] || casterEntries[0]?.[0] || ''
  );

  // Update selected prep class when prepared caster entries change
  useEffect(() => {
    if (preparedCasterEntries.length > 0) {
      if (!preparedCasterEntries.some(([c]) => c === selectedPrepClass)) {
        setSelectedPrepClass(preparedCasterEntries[0][0]);
      }
    } else if (casterEntries.length > 0) {
      if (!casterEntries.some(([c]) => c === selectedPrepClass)) {
        setSelectedPrepClass(casterEntries[0][0]);
      }
    }
  }, [character.levelProgression]);

  // Slot assignment modal/drawer state
  const [activeAssignSlot, setActiveAssignSlot] = useState<PreparedSpellSlot | null>(null);
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [assignSchoolFilter, setAssignSchoolFilter] = useState('all');
  const [assignSourceFilter, setAssignSourceFilter] = useState<'all' | 'spellbook'>('all');

  // Spellbook tab filter states
  const [spellbookSearchQuery, setSpellbookSearchQuery] = useState('');
  const [spellbookLevelFilter, setSpellbookLevelFilter] = useState('all');
  const [spellbookSchoolFilter, setSpellbookSchoolFilter] = useState('all');

  // Add Spell to Spellbook Modal
  const [isAddSpellbookModalOpen, setIsAddSpellbookModalOpen] = useState(false);
  const [addSpellbookSearch, setAddSpellbookSearch] = useState('');
  const [addSpellbookLevel, setAddSpellbookLevel] = useState('all');
  const [addSpellbookSchool, setAddSpellbookSchool] = useState('all');

  // Compendium Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [selectedSave, setSelectedSave] = useState<string>('all');
  const [onlyAllowedSources, setOnlyAllowedSources] = useState<boolean>(true);
  const [selectedSpellModal, setSelectedSpellModal] = useState<SpellData | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination for Compendium
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 24;

  const selectedDomainsList = (character.selectedDomains || []).filter(Boolean);
  const resolvedDomains = selectedDomainsList.map(domName => {
    return (
      domainsData.find(d => d.id === domName || d.name.toLowerCase() === domName.toLowerCase()) || {
        id: toCanonicalDomainId(domName),
        name: domName,
        power: 'Custom domain power.',
        spells: []
      }
    );
  });

  // Calculate Divine Caster Wisdom modifier for general DC reference
  const wisScore = calculateTotalScore(
    'wis',
    character.baseStats,
    raceMods,
    character.levelBumps || {},
    character.enhancementMods || {},
    totalLevel
  );
  const wisMod = getAbilityMod(wisScore);

  // Active preparation class stats & calculation
  const currentPrepClassName = selectedPrepClass || preparedCasterEntries[0]?.[0] || casterEntries[0]?.[0] || '';
  const currentPrepClassLevel = classLevelsMap[currentPrepClassName] || 0;
  const currentPrepClassObj = classesData.find(c => c.id === currentPrepClassName || c.name.toLowerCase() === currentPrepClassName.toLowerCase());
  const currentPrepClassKey = toCanonicalClassId(currentPrepClassName);
  const currentPrepClassInfo = SPELLCASTING_CLASSES[currentPrepClassKey] || {
    name: currentPrepClassObj?.name || currentPrepClassName,
    keyAbility: 'int' as StatType,
    type: 'Arcane' as const,
    method: 'Prepared' as const,
    maxSpellLevel: 9
  };

  const currentPrepScore = calculateTotalScore(
    currentPrepClassInfo.keyAbility,
    character.baseStats,
    raceMods,
    character.levelBumps || {},
    character.enhancementMods || {},
    totalLevel
  );
  const currentPrepMod = getAbilityMod(currentPrepScore);

  // Synced Prepared Slots for current character
  const syncedPreparedSlots = useMemo(() => {
    if (!currentPrepClassName || currentPrepClassLevel <= 0) return [];
    return syncPreparedSlotsForCharacter(
      currentPrepClassName,
      currentPrepClassLevel,
      currentPrepMod,
      character.selectedDomains || [],
      character.preparedSpells || []
    );
  }, [
    currentPrepClassName,
    currentPrepClassLevel,
    currentPrepMod,
    character.selectedDomains,
    character.preparedSpells
  ]);

  // Slots structure (levels, counts, save DCs)
  const prepSlotsStructure = useMemo(() => {
    if (!currentPrepClassName || currentPrepClassLevel <= 0) return [];
    return getPreparedSlotsStructure(
      currentPrepClassName,
      currentPrepClassLevel,
      currentPrepMod,
      character.selectedDomains || []
    );
  }, [currentPrepClassName, currentPrepClassLevel, currentPrepMod, character.selectedDomains]);

  // Total prepared count vs capacity
  const currentClassPreparedSlots = syncedPreparedSlots.filter(
    s => s.className === currentPrepClassName || s.className === currentPrepClassKey
  );
  const totalSlotsCapacity = currentClassPreparedSlots.length;
  const totalSlotsFilled = currentClassPreparedSlots.filter(s => !!s.spellId).length;
  const totalSlotsCast = currentClassPreparedSlots.filter(s => !!s.spellId && s.isCast).length;

  // Spellbook Spells Resolution
  const spellbookSpellIds = character.spellbookSpells || [];
  const spellbookSpellObjects = useMemo(() => {
    const map = new Map<string, SpellData>();
    spellsData.forEach(s => map.set(s.id, s));
    return spellbookSpellIds
      .map(id => map.get(id))
      .filter((s): s is SpellData => !!s);
  }, [spellbookSpellIds, spellsData]);

  // Calculate estimated spellbook page count (3.5e rule: cantrip = 1 page, level N = N pages)
  const spellbookTotalPages = useMemo(() => {
    return spellbookSpellObjects.reduce((sum, s) => {
      const lvl = getSpellLevelForClass(s, currentPrepClassName) ?? getSpellLevelForClass(s, 'Wizard') ?? s.levels?.['Wizard'] ?? 1;
      return sum + Math.max(1, lvl);
    }, 0);
  }, [spellbookSpellObjects, currentPrepClassName]);

  // Filtered Spells for Compendium
  const filteredSpells = useMemo(() => {
    return spellsData.filter(spell => {
      // 1. Text Search (name, description, descriptors)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = spell.name.toLowerCase().includes(q);
        const matchesDesc = spell.description.toLowerCase().includes(q);
        const matchesDescriptors = (spell.descriptors || []).some(d => d.toLowerCase().includes(q));
        const matchesSubschool = spell.subschool ? spell.subschool.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesDesc && !matchesDescriptors && !matchesSubschool) {
          return false;
        }
      }

      // 2. Class Filter
      if (selectedClass !== 'all') {
        if (selectedClass === 'my_classes') {
          const hasAnyMyClass = activeCasterClassNames.some(myCls => {
            return spell.levels[myCls] !== undefined;
          });
          if (!hasAnyMyClass) return false;
        } else {
          const lvl = spell.levels[selectedClass];
          if (lvl === undefined) return false;
        }
      }

      // 3. Level Filter
      if (selectedLevel !== 'all') {
        const targetLvl = parseInt(selectedLevel, 10);
        if (selectedClass !== 'all' && selectedClass !== 'my_classes') {
          if (spell.levels[selectedClass] !== targetLvl) return false;
        } else if (selectedClass === 'my_classes') {
          const matchesAnyMyClassLevel = activeCasterClassNames.some(
            myCls => spell.levels[myCls] === targetLvl
          );
          if (!matchesAnyMyClassLevel) return false;
        } else {
          const hasLevel = Object.values(spell.levels).includes(targetLvl);
          if (!hasLevel) return false;
        }
      }

      // 4. Magic School Filter
      if (selectedSchool !== 'all') {
        if (spell.school.toLowerCase() !== selectedSchool.toLowerCase()) {
          return false;
        }
      }

      // 5. Save Type Filter
      if (selectedSave !== 'all') {
        const saveLower = (spell.savingThrow || '').toLowerCase();
        if (selectedSave === 'none') {
          if (!saveLower.includes('none') && saveLower !== '') return false;
        } else {
          if (!saveLower.includes(selectedSave)) return false;
        }
      }

      // 6. Allowed Sources Filter
      if (onlyAllowedSources) {
        if (!isSourceAllowed(spell.source, character.allowedSources)) {
          return false;
        }
      }

      return true;
    });
  }, [
    spellsData,
    searchQuery,
    selectedClass,
    selectedLevel,
    selectedSchool,
    selectedSave,
    onlyAllowedSources,
    activeCasterClassNames,
    character.allowedSources
  ]);

  // Pagination for Compendium
  const totalPages = Math.ceil(filteredSpells.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedSpells = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredSpells.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSpells, safeCurrentPage]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedClass !== 'all' ||
    selectedLevel !== 'all' ||
    selectedSchool !== 'all' ||
    selectedSave !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedClass('all');
    setSelectedLevel('all');
    setSelectedSchool('all');
    setSelectedSave('all');
    setCurrentPage(1);
  };

  const getSchoolColor = (school: string) => {
    switch (school.toLowerCase()) {
      case 'abjuration':
        return 'bg-sky-950/80 text-sky-300 border-sky-500/30';
      case 'conjuration':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30';
      case 'divination':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/30';
      case 'enchantment':
        return 'bg-pink-950/80 text-pink-300 border-pink-500/30';
      case 'evocation':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/30';
      case 'illusion':
        return 'bg-purple-950/80 text-purple-300 border-purple-500/30';
      case 'necromancy':
        return 'bg-slate-900 text-indigo-300 border-indigo-500/30';
      case 'transmutation':
        return 'bg-teal-950/80 text-teal-300 border-teal-500/30';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  const handleCopySpell = (spell: SpellData) => {
    const text = `${spell.name} (${spell.school})\nLevel: ${Object.entries(spell.levels).map(([c, l]) => `${c} ${l}`).join(', ')}\nCasting Time: ${spell.castingTime}\nRange: ${spell.range}\nDuration: ${spell.duration}\nSaving Throw: ${spell.savingThrow} | Spell Resistance: ${spell.spellResistance}\n\n${spell.description}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(spell.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Open slot prepare modal with clean filters
  const handleOpenAssignModal = (slot: PreparedSpellSlot) => {
    setActiveAssignSlot(slot);
    setAssignSearchQuery('');
    setAssignSchoolFilter('all');
    setAssignSourceFilter('all');
  };

  // -----------------------------------------------------------------------------
  // PREPARATION WORKSHOP ACTIONS
  // -----------------------------------------------------------------------------
  const handleAssignSpellToSlot = (slotId: string, spell: SpellData) => {
    const updated = assignPreparedSpellSlot(syncedPreparedSlots, slotId, {
      id: spell.id,
      name: spell.name
    });

    // Auto-record to spellbook if not yet present
    let updatedSpellbook = character.spellbookSpells || [];
    if (!updatedSpellbook.includes(spell.id)) {
      updatedSpellbook = [...updatedSpellbook, spell.id];
    }

    onChange?.({
      preparedSpells: updated,
      spellbookSpells: updatedSpellbook
    });
    setActiveAssignSlot(null);
  };

  const handleClearSlot = (slotId: string) => {
    const updated = clearPreparedSpellSlot(syncedPreparedSlots, slotId);
    onChange?.({ preparedSpells: updated });
  };

  const handleToggleCastSlot = (slotId: string) => {
    const targetSlot = syncedPreparedSlots.find(s => s.id === slotId);
    const updated = togglePreparedSpellSlotCast(syncedPreparedSlots, slotId);
    if (!targetSlot) {
      onChange?.({ preparedSpells: updated });
      return;
    }

    const clsName = targetSlot.className || currentPrepClassName;
    const spellLevel = targetSlot.spellLevel;
    const cKey = toCanonicalClassId(clsName);

    // Count how many prepared spells will be cast for this class and level
    const classLevelPrepared = updated.filter(
      s => (s.className === clsName || s.className === cKey) &&
           s.spellLevel === spellLevel &&
           !!s.spellId
    );
    const newCastCount = classLevelPrepared.filter(s => s.isCast).length;

    const levelSlots = prepSlotsStructure.find(ps => ps.spellLevel === spellLevel);
    const maxSlots = levelSlots ? levelSlots.totalSlots : 99;

    const updatedExpended = setExpendedSpellSlots(
      character.expendedSpellSlots,
      clsName,
      spellLevel,
      newCastCount,
      maxSlots
    );

    onChange?.({
      preparedSpells: updated,
      expendedSpellSlots: updatedExpended
    });
  };

  const handleClearAllSlots = () => {
    const updated = clearAllPreparedSlots(syncedPreparedSlots, currentPrepClassName);
    onChange?.({ preparedSpells: updated });
  };

  const handleResetAllCast = () => {
    const updatedPrepared = resetAllPreparedSlotsCast(syncedPreparedSlots, currentPrepClassName);
    const updatedExpended = resetExpendedSpellSlotsForClass(character.expendedSpellSlots, currentPrepClassName);
    onChange?.({
      preparedSpells: updatedPrepared,
      expendedSpellSlots: updatedExpended
    });
  };

  // -----------------------------------------------------------------------------
  // ACTIVE SPELL SLOT CAST TRACKING ACTIONS
  // -----------------------------------------------------------------------------
  const handleSlotBubbleClick = (
    className: string,
    spellLevel: number,
    bubbleIndex: number,
    maxSlots: number,
    remaining: number
  ) => {
    let newExpended = 0;
    if (bubbleIndex <= remaining) {
      // Spend down to bubbleIndex - 1 available (i.e. expended = maxSlots - bubbleIndex + 1)
      newExpended = maxSlots - bubbleIndex + 1;
    } else {
      // Restore up to bubbleIndex available (i.e. expended = maxSlots - bubbleIndex)
      newExpended = maxSlots - bubbleIndex;
    }
    const updatedExpended = setExpendedSpellSlots(
      character.expendedSpellSlots,
      className,
      spellLevel,
      newExpended,
      maxSlots
    );
    onChange?.({ expendedSpellSlots: updatedExpended });
  };

  const handleExpendSlot = (className: string, spellLevel: number, maxSlots: number) => {
    const key = getSpellSlotUsageKey(className, spellLevel);
    const hasKey = character.expendedSpellSlots && character.expendedSpellSlots[key] !== undefined;
    const cKey = toCanonicalClassId(className);
    const currentExp = hasKey
      ? getExpendedSpellSlotsCount(character.expendedSpellSlots, className, spellLevel)
      : syncedPreparedSlots.filter(
          s => ((s.className || currentPrepClassName) === className || (s.className || currentPrepClassName) === cKey) &&
               s.spellLevel === spellLevel &&
               s.isCast &&
               !!s.spellId
        ).length;
    const newExpended = Math.min(maxSlots, currentExp + 1);
    const updatedExpended = setExpendedSpellSlots(character.expendedSpellSlots, className, spellLevel, newExpended, maxSlots);
    onChange?.({ expendedSpellSlots: updatedExpended });
  };

  const handleRestoreSlot = (className: string, spellLevel: number, maxSlots: number) => {
    const key = getSpellSlotUsageKey(className, spellLevel);
    const hasKey = character.expendedSpellSlots && character.expendedSpellSlots[key] !== undefined;
    const cKey = toCanonicalClassId(className);
    const currentExp = hasKey
      ? getExpendedSpellSlotsCount(character.expendedSpellSlots, className, spellLevel)
      : syncedPreparedSlots.filter(
          s => ((s.className || currentPrepClassName) === className || (s.className || currentPrepClassName) === cKey) &&
               s.spellLevel === spellLevel &&
               s.isCast &&
               !!s.spellId
        ).length;
    const newExpended = Math.max(0, currentExp - 1);
    const updatedExpended = setExpendedSpellSlots(character.expendedSpellSlots, className, spellLevel, newExpended, maxSlots);
    onChange?.({ expendedSpellSlots: updatedExpended });
  };

  const handleResetClassSlots = (className: string) => {
    const updatedExpended = resetExpendedSpellSlotsForClass(character.expendedSpellSlots, className);
    const updatedPrepared = resetAllPreparedSlotsCast(character.preparedSpells || [], className);
    onChange?.({
      expendedSpellSlots: updatedExpended,
      preparedSpells: updatedPrepared
    });
  };

  // -----------------------------------------------------------------------------
  // SPELLBOOK MANAGEMENT ACTIONS
  // -----------------------------------------------------------------------------
  const handleAddToSpellbook = (spellId: string) => {
    const updated = addSpellToSpellbook(character.spellbookSpells || [], spellId);
    onChange?.({ spellbookSpells: updated });
  };

  const handleRemoveFromSpellbook = (spellId: string) => {
    const updated = removeSpellFromSpellbook(character.spellbookSpells || [], spellId);
    // Also clear any prepared slots referencing this spell if from spellbook
    const updatedPrepared = (character.preparedSpells || []).map(slot => {
      if (slot.spellId === spellId) {
        return { ...slot, spellId: null, spellName: undefined, isCast: false };
      }
      return slot;
    });
    onChange?.({ spellbookSpells: updated, preparedSpells: updatedPrepared });
  };

  const handleAddAllStarterCantrips = () => {
    const cantripIds = getStarterWizardCantripIds(spellsData);
    let current = [...(character.spellbookSpells || [])];
    for (const cid of cantripIds) {
      if (!current.includes(cid)) {
        current.push(cid);
      }
    }
    onChange?.({ spellbookSpells: current });
  };

  // Quick auto-assign to first empty slot of that level
  const handleQuickPrepareFromSpellbook = (spell: SpellData) => {
    const spellLevel = getSpellLevelForClass(spell, currentPrepClassName) ?? getSpellLevelForClass(spell, 'Wizard') ?? 0;
    const emptySlot = currentClassPreparedSlots.find(
      s => s.spellLevel === spellLevel && !s.spellId && !s.isDomain
    );
    if (emptySlot) {
      handleAssignSpellToSlot(emptySlot.id, spell);
    } else {
      // Find any slot for this level or open assignment modal
      const anySlot = currentClassPreparedSlots.find(s => s.spellLevel === spellLevel);
      if (anySlot) {
        handleOpenAssignModal(anySlot);
      }
    }
  };

  // Raw base spells for active slot (without search query applied yet)
  const baseSpellsForActiveSlot = useMemo(() => {
    if (!activeAssignSlot) return [];
    return getAvailableSpellsForSlot(
      activeAssignSlot,
      character,
      spellsData,
      domainsData,
      false // fetch all eligible class spells, filter via UI
    );
  }, [activeAssignSlot, character, spellsData, domainsData]);

  // Filtered spells for active slot in assignment modal
  const availableSpellsForActiveSlot = useMemo(() => {
    return baseSpellsForActiveSlot.filter(s => {
      if (assignSourceFilter === 'spellbook') {
        if (!spellbookSpellIds.includes(s.id)) return false;
      }
      if (assignSearchQuery.trim()) {
        const q = assignSearchQuery.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchDesc = s.description.toLowerCase().includes(q);
        const matchSchool = s.school.toLowerCase().includes(q);
        const matchDescriptors = (s.descriptors || []).some(d => d.toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchSchool && !matchDescriptors) {
          return false;
        }
      }
      if (assignSchoolFilter !== 'all') {
        if (s.school.toLowerCase() !== assignSchoolFilter.toLowerCase()) {
          return false;
        }
      }
      return true;
    });
  }, [
    baseSpellsForActiveSlot,
    assignSearchQuery,
    assignSchoolFilter,
    assignSourceFilter,
    spellbookSpellIds
  ]);

  // Spells for "Add to Spellbook" compendium picker
  const eligibleSpellsForSpellbookAdd = useMemo(() => {
    return spellsData.filter(s => {
      // Filter by class (Wizard or other arcane/divine)
      const isWizard = s.levels['Wizard'] !== undefined;
      if (!isWizard && selectedClass !== 'all' && s.levels[selectedClass] === undefined) {
        return false;
      }
      if (addSpellbookSearch.trim()) {
        const q = addSpellbookSearch.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (addSpellbookLevel !== 'all') {
        const lvl = parseInt(addSpellbookLevel, 10);
        if (s.levels['Wizard'] !== lvl) return false;
      }
      if (addSpellbookSchool !== 'all') {
        if (s.school.toLowerCase() !== addSpellbookSchool.toLowerCase()) {
          return false;
        }
      }
      return true;
    });
  }, [spellsData, addSpellbookSearch, addSpellbookLevel, addSpellbookSchool, selectedClass]);

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Tab Navigation Bar */}
      <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
              D&D 3.5e Live Spellbook & Daily Preparation Workshop
            </h2>
            <p className="text-xs text-slate-400">
              Prepare daily spell slots with 1-click assignment, maintain your recorded spellbook, and search {spellsData.length} core spells.
            </p>
          </div>
        </div>

        {/* Sub-Navigation Buttons */}
        <div className="flex flex-wrap items-center bg-slate-950/90 p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold gap-1">
          <button
            onClick={() => setActiveSubTab('preparation')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeSubTab === 'preparation'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-calendar-check"></i> Daily Preparation
            {totalSlotsCapacity > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-slate-900 text-amber-300 font-mono font-bold">
                {totalSlotsFilled}/{totalSlotsCapacity}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('spellbook')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeSubTab === 'spellbook'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-book-bookmark"></i> Live Spellbook
            {spellbookSpellIds.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-slate-900 text-amber-300 font-mono font-bold">
                {spellbookSpellIds.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('compendium')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeSubTab === 'compendium'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-book-open"></i> Compendium
          </button>

          <button
            onClick={() => setActiveSubTab('slots')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeSubTab === 'slots'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-hat-wizard"></i> Slots & DCs
          </button>

          <button
            onClick={() => setActiveSubTab('domains')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeSubTab === 'domains'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-ankh"></i> Domains & SLAs
            {selectedDomainsList.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-slate-900 text-amber-300 font-mono font-bold">
                {selectedDomainsList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: DAILY PREPARATION WORKSHOP                                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'preparation' && (
        <div className="space-y-6">
          {preparedCasterEntries.length === 0 ? (
            <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-8 rounded-2xl text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto text-2xl">
                <i className="fa-solid fa-wand-magic-sparkles"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-100 font-heading">Daily Preparation Workshop</h3>
              <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                Prepared casters in D&D 3.5e (such as <strong>Wizard</strong>, <strong>Cleric</strong>, <strong>Druid</strong>, <strong>Paladin</strong>, and <strong>Ranger</strong>) prepare specific spells each morning into their available spell slots per level.
              </p>
              <div className="p-4 bg-slate-950/80 rounded-xl text-slate-400 text-xs border border-slate-800 font-mono max-w-md mx-auto">
                No prepared spellcasting class active on current character. Select a prepared caster in the Race & Class tab, or explore the Spell Compendium.
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveSubTab('compendium')}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-2"
                >
                  <i className="fa-solid fa-book-open"></i> Browse Spell Compendium
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Class Switcher Toolbar (if multiclass prepared caster) */}
              {preparedCasterEntries.length > 1 && (
                <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-semibold px-2">Caster Class:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {preparedCasterEntries.map(([clsName, clsLvl]) => {
                      const clsObj = classesData.find(c => c.id === clsName || c.name.toLowerCase() === clsName.toLowerCase());
                      const info = SPELLCASTING_CLASSES[toCanonicalClassId(clsName)];
                      const displayName = clsObj?.name || info?.name || clsName;
                      return (
                        <button
                          key={clsName}
                          onClick={() => setSelectedPrepClass(clsName)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            currentPrepClassName === clsName
                              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                              : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-slate-100'
                          }`}
                        >
                          <i className="fa-solid fa-hat-wizard"></i> {displayName} {clsLvl}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Class Summary Banner & Quick Actions */}
              <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
                        <i className="fa-solid fa-hat-wizard text-amber-400"></i> {currentPrepClassObj?.name || currentPrepClassInfo.name || currentPrepClassName} Preparation Workshop
                      </h3>
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-500/30">
                        Level {currentPrepClassLevel} (CL {currentPrepClassLevel})
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {currentPrepClassInfo.type} • {currentPrepClassInfo.method} Caster • Key Ability:{' '}
                      <span className="font-mono text-amber-400 font-bold uppercase">{currentPrepClassInfo.keyAbility}</span>{' '}
                      ({currentPrepScore} / {currentPrepMod >= 0 ? `+${currentPrepMod}` : currentPrepMod})
                    </p>
                  </div>

                  {/* Prepared Progress Pill & Quick Rest/Clear Actions */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
                      <span className="text-slate-400">Prepared:</span>
                      <span className="text-amber-400 font-bold">
                        {totalSlotsFilled} / {totalSlotsCapacity}
                      </span>
                      {totalSlotsCast > 0 && (
                        <span className="text-rose-400 text-[11px] font-bold">
                          ({totalSlotsCast} Cast)
                        </span>
                      )}
                    </div>

                    <button
                      onClick={handleResetAllCast}
                      className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                      title="Reset all cast prepared spells back to ready"
                    >
                      <i className="fa-solid fa-rotate text-xs"></i> Rest / Ready All
                    </button>

                    <button
                      onClick={handleClearAllSlots}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500/30 text-slate-300 hover:text-rose-300 font-semibold text-xs transition flex items-center gap-1.5"
                      title="Clear all assigned prepared spells for this class"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i> Clear All
                    </button>

                    {currentPrepClassKey === 'wizard' && spellbookSpellIds.length === 0 && (
                      <button
                        onClick={handleAddAllStarterCantrips}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-500/10"
                      >
                        <i className="fa-solid fa-wand-magic-sparkles"></i> Add Starter Cantrips
                      </button>
                    )}
                  </div>
                </div>

                {/* Spell Level Containers Grid */}
                <div className="space-y-6">
                  {prepSlotsStructure.filter(lvlGroup => lvlGroup.canCast).map(lvlGroup => {
                    const levelSlots = currentClassPreparedSlots.filter(
                      s => s.spellLevel === lvlGroup.spellLevel
                    );
                    const filledCount = levelSlots.filter(s => !!s.spellId).length;

                    return (
                      <div
                        key={lvlGroup.spellLevel}
                        className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3.5 shadow-md"
                      >
                        {/* Spell Level Header & Individual Save DC */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm font-bold font-mono text-amber-300 flex items-center gap-1.5">
                              <i className="fa-solid fa-sparkles text-amber-400 text-xs"></i>
                              {lvlGroup.spellLevel === 0 ? 'Cantrips (0th Level)' : `Level ${lvlGroup.spellLevel} Spells`}
                            </span>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-semibold">
                              {filledCount} / {lvlGroup.totalSlots} Prepared
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5">
                            {/* Individual Spell Save DC Badge */}
                            <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 rounded-xl text-xs font-mono font-bold text-emerald-300 shadow-sm">
                              <i className="fa-solid fa-shield-halved text-[11px]"></i>
                              <span>Save DC {lvlGroup.saveDc}</span>
                              <span className="text-[10px] text-emerald-400/80 font-normal">
                                (10 + {lvlGroup.spellLevel} + {currentPrepMod})
                              </span>
                            </div>

                            {lvlGroup.domainSlots > 0 && (
                              <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-xl bg-amber-950/80 text-amber-300 border border-amber-500/40">
                                +1 Domain Slot
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Slots Container Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {levelSlots.map((slot, idx) => {
                            const assignedSpellObj = slot.spellId
                              ? spellsData.find(s => s.id === slot.spellId)
                              : null;

                            return (
                              <div
                                key={slot.id}
                                className={`relative p-3.5 rounded-xl border transition duration-200 flex flex-col justify-between space-y-2.5 ${
                                  slot.isDomain
                                    ? slot.spellId
                                      ? slot.isCast
                                        ? 'bg-slate-950/60 border-amber-500/30 opacity-60'
                                        : 'bg-amber-950/20 border-amber-500/50 shadow-md shadow-amber-500/5'
                                      : 'bg-amber-950/10 border-amber-500/30 border-dashed hover:border-amber-400'
                                    : slot.spellId
                                    ? slot.isCast
                                      ? 'bg-slate-950/60 border-slate-800 opacity-60'
                                      : 'bg-slate-900/80 border-slate-700/80 hover:border-amber-500/40 shadow-sm'
                                    : 'bg-slate-950/40 border-slate-800 border-dashed hover:border-slate-700'
                                }`}
                              >
                                {/* Slot Title / Domain Indicator */}
                                <div className="flex items-center justify-between text-xs">
                                  <span
                                    className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                      slot.isDomain
                                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                                        : 'bg-slate-950 text-slate-400 border-slate-800'
                                    }`}
                                  >
                                    {slot.isDomain ? '★ Domain Slot' : `Slot #${idx + 1}`}
                                  </span>

                                  {slot.spellId && (
                                    <div className="flex items-center gap-1.5">
                                      {/* Cast / Ready Toggle */}
                                      <button
                                        onClick={() => handleToggleCastSlot(slot.id)}
                                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border transition ${
                                          slot.isCast
                                            ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                                            : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900'
                                        }`}
                                        title={slot.isCast ? 'Click to mark as prepared (ready)' : 'Click to expend slot (cast)'}
                                      >
                                        <i className={`fa-solid ${slot.isCast ? 'fa-hourglass-end' : 'fa-wand-magic-sparkles'} mr-1`}></i>
                                        {slot.isCast ? 'Expended' : 'Cast'}
                                      </button>

                                      {/* Clear Slot Button */}
                                      <button
                                        onClick={() => handleClearSlot(slot.id)}
                                        className="text-slate-500 hover:text-rose-400 transition p-1 text-xs"
                                        title="Clear spell from this slot"
                                      >
                                        <i className="fa-solid fa-xmark"></i>
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Slot Content */}
                                {slot.spellId ? (
                                  <div className="space-y-2">
                                    <div className="space-y-1">
                                      <h4
                                        onClick={() => assignedSpellObj && setSelectedSpellModal(assignedSpellObj)}
                                        className={`text-xs font-bold font-heading cursor-pointer hover:text-amber-300 transition line-clamp-1 ${
                                          slot.isCast ? 'line-through text-slate-400' : 'text-slate-100'
                                        }`}
                                        title={slot.spellName || assignedSpellObj?.name}
                                      >
                                        {slot.spellName || assignedSpellObj?.name || slot.spellId}
                                      </h4>

                                      {assignedSpellObj && (
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span
                                            className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${getSchoolColor(
                                              assignedSpellObj.school
                                            )}`}
                                          >
                                            {assignedSpellObj.school}
                                          </span>
                                          <span className="text-[9px] font-mono text-emerald-400 font-bold">
                                            DC {lvlGroup.saveDc}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Parameters snippet */}
                                    {assignedSpellObj && (
                                      <div className="text-[10px] font-mono text-slate-400 bg-slate-950/80 p-1.5 rounded border border-slate-800/60 truncate">
                                        <span>{assignedSpellObj.castingTime}</span> • <span>{assignedSpellObj.range}</span>
                                      </div>
                                    )}

                                    {/* Action Links */}
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                                      <button
                                        onClick={() => assignedSpellObj && setSelectedSpellModal(assignedSpellObj)}
                                        className="text-amber-400/90 hover:text-amber-300 font-semibold flex items-center gap-1"
                                      >
                                        <i className="fa-solid fa-eye text-[9px]"></i> Details
                                      </button>

                                      <button
                                        onClick={() => handleOpenAssignModal(slot)}
                                        className="text-slate-400 hover:text-slate-200 font-semibold flex items-center gap-1"
                                      >
                                        <i className="fa-solid fa-arrow-right-arrow-left text-[9px]"></i> Change
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="py-2 text-center space-y-2">
                                    <p className="text-[11px] text-slate-500 font-medium">Empty Slot</p>
                                    <button
                                      onClick={() => handleOpenAssignModal(slot)}
                                      className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                        slot.isDomain
                                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm'
                                          : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700/80'
                                      }`}
                                    >
                                      <i className="fa-solid fa-plus text-xs"></i> Prepare Spell
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: LIVE SPELLBOOK & KNOWN SPELLS                                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'spellbook' && (
        <div className="space-y-6">
          {/* Spellbook Header & Management Toolbar */}
          <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
                  <i className="fa-solid fa-book-bookmark text-amber-400"></i> Recorded Spellbook & Spells Known
                </h3>
                <p className="text-xs text-slate-400">
                  Manage your recorded spells. Wizards prepare daily spells exclusively from their live spellbook.
                </p>
              </div>

              {/* Spellbook Statistics & Quick Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
                  <span className="text-slate-400">Total Recorded:</span>
                  <span className="text-amber-400 font-bold">{spellbookSpellObjects.length} Spells</span>
                  <span className="text-slate-500">({spellbookTotalPages} Pages Used)</span>
                </div>

                <button
                  onClick={handleAddAllStarterCantrips}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-amber-300 font-bold text-xs transition flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-wand-sparkles"></i> Add All Cantrips
                </button>

                <button
                  onClick={() => setIsAddSpellbookModalOpen(true)}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-500/10"
                >
                  <i className="fa-solid fa-plus"></i> Add New Spell
                </button>
              </div>
            </div>

            {/* Spellbook Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label-text">Search Spellbook</label>
                <input
                  type="text"
                  value={spellbookSearchQuery}
                  onChange={e => setSpellbookSearchQuery(e.target.value)}
                  placeholder="Search recorded spells..."
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="label-text">Spell Level</label>
                <select
                  value={spellbookLevelFilter}
                  onChange={e => setSpellbookLevelFilter(e.target.value)}
                  className="input-field text-xs font-mono"
                >
                  <option value="all">All Recorded Levels</option>
                  <option value="0">Cantrips (0th Level)</option>
                  {Array.from({ length: 9 }, (_, i) => i + 1).map(lvl => (
                    <option key={lvl} value={lvl.toString()}>
                      Level {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-text">Magic School</label>
                <select
                  value={spellbookSchoolFilter}
                  onChange={e => setSpellbookSchoolFilter(e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="all">All Schools</option>
                  {MAGIC_SCHOOLS.map(sch => (
                    <option key={sch} value={sch}>
                      {sch}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Spellbook Spell Cards grouped by Level */}
          {spellbookSpellObjects.length === 0 ? (
            <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-8 rounded-2xl text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto text-2xl">
                <i className="fa-solid fa-book-open"></i>
              </div>
              <h3 className="text-md font-bold text-slate-200">Your Spellbook is Currently Empty</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Populate your spellbook with starter wizard cantrips or browse the 3.5e compendium to record new spells into your book.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={handleAddAllStarterCantrips}
                  className="px-4 py-2 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-300 font-bold text-xs hover:bg-slate-900 transition flex items-center gap-2"
                >
                  <i className="fa-solid fa-wand-sparkles"></i> Add All 0th Cantrips
                </button>
                <button
                  onClick={() => setIsAddSpellbookModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-2"
                >
                  <i className="fa-solid fa-plus"></i> Browse & Add Spells
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {Array.from({ length: 10 }, (_, i) => i).map(lvl => {
                const spellsAtLevel = spellbookSpellObjects.filter(spell => {
                  const spellLvl = getSpellLevelForClass(spell, currentPrepClassName) ?? getSpellLevelForClass(spell, 'Wizard') ?? 0;
                  if (spellLvl !== lvl) return false;

                  if (spellbookSearchQuery.trim()) {
                    const q = spellbookSearchQuery.toLowerCase();
                    if (!spell.name.toLowerCase().includes(q) && !spell.description.toLowerCase().includes(q)) {
                      return false;
                    }
                  }
                  if (spellbookLevelFilter !== 'all') {
                    if (parseInt(spellbookLevelFilter, 10) !== lvl) return false;
                  }
                  if (spellbookSchoolFilter !== 'all') {
                    if (spell.school.toLowerCase() !== spellbookSchoolFilter.toLowerCase()) return false;
                  }
                  return true;
                });

                if (spellsAtLevel.length === 0) return null;

                const saveDc = calculateSpellSaveDc(lvl, currentPrepMod);

                return (
                  <div
                    key={lvl}
                    className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 shadow-md"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-amber-400">
                          {lvl === 0 ? 'Cantrips (0th Level)' : `Level ${lvl} Spells`}
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-semibold">
                          {spellsAtLevel.length} {spellsAtLevel.length === 1 ? 'Spell' : 'Spells'}
                        </span>
                      </div>

                      <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
                        DC {saveDc}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                      {spellsAtLevel.map(spell => {
                        const schoolColorClass = getSchoolColor(spell.school);

                        return (
                          <div
                            key={spell.id}
                            className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition duration-200 flex flex-col justify-between space-y-2.5 shadow-sm"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <h4
                                  onClick={() => setSelectedSpellModal(spell)}
                                  className="text-xs font-bold text-slate-100 hover:text-amber-300 transition cursor-pointer leading-snug line-clamp-1"
                                >
                                  {spell.name}
                                </h4>
                                <span
                                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border shrink-0 ${schoolColorClass}`}
                                >
                                  {spell.school}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-400 bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
                                <div className="truncate">Time: {spell.castingTime}</div>
                                <div className="truncate">Range: {spell.range}</div>
                              </div>

                              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                                {spell.description}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px]">
                              {/* Quick Prepare Button */}
                              <button
                                onClick={() => handleQuickPrepareFromSpellbook(spell)}
                                className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold transition flex items-center gap-1"
                                title="Quick prepare into an available slot"
                              >
                                <i className="fa-solid fa-plus text-[9px]"></i> Prepare
                              </button>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setSelectedSpellModal(spell)}
                                  className="p-1 text-slate-400 hover:text-slate-200 transition"
                                  title="View full spell details"
                                >
                                  <i className="fa-solid fa-circle-info"></i>
                                </button>
                                <button
                                  onClick={() => handleRemoveFromSpellbook(spell.id)}
                                  className="p-1 text-slate-500 hover:text-rose-400 transition"
                                  title="Remove from live spellbook"
                                >
                                  <i className="fa-solid fa-trash-can"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: SEARCHABLE COMPENDIUM                                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'compendium' && (
        <div className="space-y-6">
          {/* Search & Multi-Filter Control Panel */}
          <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-filter"></i> Search & Filter Compendium
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-bold">
                  {filteredSpells.length} {filteredSpells.length === 1 ? 'Spell' : 'Spells'} Found
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Source Filter Toggle */}
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800/80 hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={onlyAllowedSources}
                    onChange={e => setOnlyAllowedSources(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500/20 bg-slate-900"
                  />
                  <span>Respect Allowed Sources</span>
                </label>

                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-xs px-2.5 py-1 rounded-lg bg-rose-950/80 text-rose-300 hover:bg-rose-900 border border-rose-500/30 transition flex items-center gap-1"
                  >
                    <i className="fa-solid fa-xmark"></i> Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Filter Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* 1. Name & Keyword Search */}
              <div className="lg:col-span-2">
                <label className="label-text flex items-center gap-1">
                  <i className="fa-solid fa-magnifying-glass text-amber-400"></i> Spell Name / Keyword
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search Fireball, Cure, Teleport..."
                    className="input-field pr-8 text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                    >
                      <i className="fa-solid fa-circle-xmark"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Class Filter */}
              <div>
                <label className="label-text">Class</label>
                <select
                  value={selectedClass}
                  onChange={e => {
                    setSelectedClass(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="input-field text-xs"
                >
                  <option value="all">All Classes</option>
                  {activeCasterClassNames.length > 0 && (
                    <option value="my_classes">★ My Classes ({activeCasterClassNames.join(', ')})</option>
                  )}
                  <optgroup label="Standard Spellcasting Classes">
                    {STANDARD_CLASSES.map(cls => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Cleric Domains">
                    {Object.keys(
                      spellsData.reduce((acc, sp) => {
                        Object.keys(sp.levels).forEach(k => {
                          if (!STANDARD_CLASSES.includes(k)) acc[k] = true;
                        });
                        return acc;
                      }, {} as Record<string, boolean>)
                    )
                      .sort()
                      .map(dom => (
                        <option key={dom} value={dom}>
                          Domain: {dom}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              {/* 3. Level Filter */}
              <div>
                <label className="label-text">Spell Level</label>
                <select
                  value={selectedLevel}
                  onChange={e => {
                    setSelectedLevel(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="input-field text-xs font-mono"
                >
                  <option value="all">All Levels (0 - 9)</option>
                  <option value="0">Level 0 (Cantrips / Orisons)</option>
                  {Array.from({ length: 9 }, (_, i) => i + 1).map(lvl => (
                    <option key={lvl} value={lvl.toString()}>
                      Level {lvl}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Magic School Filter */}
              <div>
                <label className="label-text">Magic School</label>
                <select
                  value={selectedSchool}
                  onChange={e => {
                    setSelectedSchool(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="input-field text-xs"
                >
                  <option value="all">All Schools</option>
                  {MAGIC_SCHOOLS.map(sch => (
                    <option key={sch} value={sch}>
                      {sch}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Saving Throw Filter */}
              <div>
                <label className="label-text">Saving Throw</label>
                <select
                  value={selectedSave}
                  onChange={e => {
                    setSelectedSave(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="input-field text-xs"
                >
                  {SAVE_TYPES.map(st => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Spell Results Cards Grid */}
          {filteredSpells.length === 0 ? (
            <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-10 rounded-2xl text-center space-y-3">
              <i className="fa-solid fa-magnifying-glass-chart text-3xl text-slate-500"></i>
              <h3 className="text-md font-bold text-slate-200">No Spells Match Your Filters</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Try broadening your search term, resetting magic school or saving throw filters, or enabling non-core sources.
              </p>
              <button
                onClick={resetFilters}
                className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedSpells.map(spell => {
                  const badge = getSourceBadgeInfo(spell.source, character.allowedSources);
                  const schoolColorClass = getSchoolColor(spell.school);
                  const inSpellbook = spellbookSpellIds.includes(spell.id);

                  // Extract class level string
                  const classLevelBadges = Object.entries(spell.levels)
                    .map(([clsName, lvl]) => {
                      const shortCls =
                        clsName === 'Sorcerer'
                          ? 'Sor'
                          : clsName === 'Wizard'
                          ? 'Wiz'
                          : clsName === 'Cleric'
                          ? 'Clr'
                          : clsName === 'Druid'
                          ? 'Drd'
                          : clsName === 'Paladin'
                          ? 'Pal'
                          : clsName === 'Ranger'
                          ? 'Rgr'
                          : clsName === 'Bard'
                          ? 'Brd'
                          : clsName;
                      return `${shortCls} ${lvl}`;
                    })
                    .slice(0, 4);

                  return (
                    <div
                      key={spell.id}
                      className="group p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-amber-500/50 transition duration-200 space-y-3 flex flex-col justify-between shadow-md hover:shadow-amber-500/5"
                    >
                      {/* Card Header */}
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            onClick={() => setSelectedSpellModal(spell)}
                            className="font-bold text-slate-100 group-hover:text-amber-300 transition text-sm flex-1 leading-snug cursor-pointer"
                          >
                            {spell.name}
                          </h3>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold shrink-0 ${schoolColorClass}`}
                          >
                            {spell.school}
                          </span>
                        </div>

                        {/* Class Level Tags */}
                        <div className="flex flex-wrap gap-1">
                          {classLevelBadges.map((badgeStr, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-amber-300/90 font-medium"
                            >
                              {badgeStr}
                            </span>
                          ))}
                          {Object.keys(spell.levels).length > 4 && (
                            <span className="text-[10px] font-mono px-1 py-0.2 text-slate-500">
                              +{Object.keys(spell.levels).length - 4} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Spell Quick Attributes Grid */}
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/50 font-mono">
                        <div className="truncate text-slate-300">
                          <span className="text-slate-500 text-[10px] block">CASTING TIME</span>
                          <span className="truncate block" title={spell.castingTime}>
                            {spell.castingTime}
                          </span>
                        </div>
                        <div className="truncate text-slate-300">
                          <span className="text-slate-500 text-[10px] block">RANGE</span>
                          <span className="truncate block" title={spell.range}>
                            {spell.range}
                          </span>
                        </div>
                        <div className="truncate text-slate-300 col-span-2">
                          <span className="text-slate-500 text-[10px] block">SAVE / SR</span>
                          <span className="text-emerald-300 font-medium truncate block">
                            {spell.savingThrow} • SR: {spell.spellResistance}
                          </span>
                        </div>
                      </div>

                      {/* Description Preview & Footer */}
                      <div className="space-y-2">
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {spell.description}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.2 rounded font-mono font-bold border ${
                                badge.isAllowed
                                  ? badge.isCore
                                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                                    : 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                                  : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                              }`}
                            >
                              {badge.sourceCode}
                            </span>

                            {/* 1-Click Add/Remove Spellbook Toggle */}
                            <button
                              onClick={() => {
                                if (inSpellbook) {
                                  handleRemoveFromSpellbook(spell.id);
                                } else {
                                  handleAddToSpellbook(spell.id);
                                }
                              }}
                              className={`px-2 py-0.5 rounded-lg border font-mono font-bold transition flex items-center gap-1 ${
                                inSpellbook
                                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-500/40'
                                  : 'bg-slate-900 text-slate-400 hover:text-amber-300 border-slate-800'
                              }`}
                              title={inSpellbook ? 'In spellbook (click to remove)' : 'Add to live spellbook'}
                            >
                              <i className={`fa-solid ${inSpellbook ? 'fa-book-bookmark' : 'fa-plus'} text-[9px]`}></i>
                              <span>{inSpellbook ? 'In Spellbook' : '+ Spellbook'}</span>
                            </button>
                          </div>

                          <button
                            onClick={() => setSelectedSpellModal(spell)}
                            className="text-amber-400/80 group-hover:text-amber-300 font-semibold flex items-center gap-1"
                          >
                            Details <i className="fa-solid fa-chevron-right text-[9px]"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Bar */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <div className="text-xs text-slate-400">
                    Showing <span className="font-mono text-slate-200">{(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                    <span className="font-mono text-slate-200">
                      {Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredSpells.length)}
                    </span>{' '}
                    of <span className="font-mono text-slate-200">{filteredSpells.length}</span> spells
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={safeCurrentPage === 1}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <i className="fa-solid fa-chevron-left mr-1"></i> Prev
                    </button>

                    <div className="text-xs font-mono text-slate-300 px-2">
                      Page <span className="text-amber-400 font-bold">{safeCurrentPage}</span> of {totalPages}
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={safeCurrentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Next <i className="fa-solid fa-chevron-right ml-1"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: CLASS SPELLCASTING SLOTS TRACKER                               */}
      {/* ========================================================================= */}
      {activeSubTab === 'slots' && (
        <div className="space-y-6">
          {casterEntries.length === 0 ? (
            <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-4">
              <h2 className="text-lg font-bold font-heading text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
                <i className="fa-solid fa-hat-wizard text-amber-500"></i> Spellcasting & Special Features
              </h2>

              <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-3">
                <i className="fa-solid fa-wand-sparkles text-3xl text-amber-500"></i>
                <h3 className="text-md font-bold text-slate-200">Spellcasting Engine Ready</h3>
                <p className="text-xs text-slate-400 max-w-lg mx-auto">
                  Spells per day, bonus spells from high ability scores, and spell save DCs are automatically calculated for your spellcasting classes.
                </p>
                <div className="p-4 bg-slate-900/60 rounded-xl text-slate-400 text-xs text-center border border-slate-800 font-mono w-full mt-4">
                  No spellcasting or manifesting classes selected. Select Bard, Cleric, Druid, Paladin, Ranger, Sorcerer, Wizard, etc. in the Race/Class tab to view spell slots.
                </div>
              </div>
            </div>
          ) : (
            casterEntries.map(([clsName, clsLvl]) => {
              const key = toCanonicalClassId(clsName);
              const clsObj = classesData.find(c => c.id === clsName || c.name.toLowerCase() === clsName.toLowerCase());
              const info = SPELLCASTING_CLASSES[key] || {
                name: clsObj?.name || clsName,
                keyAbility: 'int' as const,
                type: 'Arcane' as const,
                method: 'Prepared' as const,
                maxSpellLevel: 9
              };
              const displayName = clsObj?.name || info.name || clsName;

              const abilityScore = calculateTotalScore(
                info.keyAbility,
                character.baseStats,
                raceMods,
                character.levelBumps || {},
                character.enhancementMods || {},
                totalLevel
              );
              const abilityMod = getAbilityMod(abilityScore);
              const spellSlotsData = getSpellSlotsForClass(clsName, clsLvl, abilityMod);

              return (
                <div
                  key={clsName}
                  className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
                        <i className="fa-solid fa-hat-wizard text-amber-500"></i> {displayName} Spellcasting & Slot Tracker
                      </h2>
                      <p className="text-xs text-slate-400">
                        {info.type} • {info.method} Caster • Level {clsLvl} (Caster Level {clsLvl})
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                        <span className="text-slate-400">Key Ability:</span>
                        <span className="font-mono text-amber-400 font-bold uppercase">{info.keyAbility}</span>
                        <span className="font-mono text-slate-200 font-bold">
                          {abilityScore} ({abilityMod >= 0 ? `+${abilityMod}` : abilityMod})
                        </span>
                      </div>

                      <button
                        onClick={() => handleResetClassSlots(clsName)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                        title="Restore all spell slots for this class back to full capacity"
                      >
                        <i className="fa-solid fa-rotate text-xs"></i> Rest / Restore All Slots
                      </button>
                    </div>
                  </div>

                  {/* Spell Slots Grid with Interactive Usage Bubbles */}
                  {spellSlotsData && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <i className="fa-solid fa-battery-half text-amber-400"></i> Spells Per Day, Save DCs & Active Cast Bubbles
                        </h3>
                        <span className="text-[11px] text-amber-400 font-mono">
                          Base Slots + Bonus ({info.keyAbility.toUpperCase()} Mod {abilityMod >= 0 ? `+${abilityMod}` : abilityMod})
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                        {spellSlotsData.slots.map(slot => {
                          const isPrep = isPreparedCaster(clsName);
                          const classPrep = (character.preparedSpells || []).filter(
                            s => (s.className === clsName || s.className === key) && s.spellLevel === slot.spellLevel && !!s.spellId
                          );
                          const castPreparedCount = isPrep ? classPrep.filter(s => s.isCast).length : 0;
                          const mapExpended = getExpendedSpellSlotsCount(character.expendedSpellSlots, clsName, slot.spellLevel);
                          const expended = Math.max(mapExpended, castPreparedCount);
                          const remaining = Math.max(0, slot.total - expended);
                          const hasSlots = slot.canCast && slot.total > 0;

                          return (
                            <div
                              key={slot.spellLevel}
                              className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                                hasSlots
                                  ? remaining === 0
                                    ? 'bg-slate-950/90 border-rose-500/30 shadow-sm'
                                    : 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50 shadow-sm'
                                  : 'bg-slate-950/30 border-slate-900 opacity-50'
                              }`}
                            >
                              {/* Header & DC */}
                              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                                <div className="text-xs font-bold font-mono text-slate-200">
                                  {slot.spellLevel === 0 ? 'Cantrips (0th)' : `Level ${slot.spellLevel}`}
                                </div>
                                <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                                  DC {slot.saveDc}
                                </span>
                              </div>

                              {/* Slot Capacity & Remaining Count */}
                              <div className="flex items-center justify-between text-xs font-mono">
                                <div>
                                  <span className="text-[10px] text-slate-400 block uppercase">Capacity</span>
                                  <span className="text-slate-300 font-semibold">{slot.total} Total</span>
                                  <span className="text-[10px] text-slate-500 block">
                                    ({slot.base}b {slot.bonus > 0 ? `+ ${slot.bonus}` : ''})
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 block uppercase">Available</span>
                                  <span
                                    className={`text-base font-bold ${
                                      remaining === 0
                                        ? 'text-rose-400'
                                        : remaining < slot.total
                                        ? 'text-amber-400'
                                        : 'text-emerald-400'
                                    }`}
                                  >
                                    {remaining} / {slot.total}
                                  </span>
                                </div>
                              </div>

                              {/* Interactive Spell Slot Usage Bubbles [O][O][X] */}
                              {hasSlots && (
                                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                                  <div className="flex flex-wrap items-center justify-center gap-1.5 py-1">
                                    {Array.from({ length: slot.total }, (_, i) => {
                                      const bubbleIndex = i + 1;
                                      const isAvailable = bubbleIndex <= remaining;

                                      return (
                                        <button
                                          key={i}
                                          type="button"
                                          onClick={() =>
                                            handleSlotBubbleClick(
                                              clsName,
                                              slot.spellLevel,
                                              bubbleIndex,
                                              slot.total,
                                              remaining
                                            )
                                          }
                                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer select-none group ${
                                            isAvailable
                                              ? 'bg-amber-500/20 border-2 border-amber-400 text-amber-300 shadow-xs hover:scale-110 active:scale-95'
                                              : 'bg-slate-950/70 border-2 border-slate-800 text-slate-600 hover:border-slate-600 hover:text-slate-400'
                                          }`}
                                          title={
                                            isAvailable
                                              ? `Slot #${bubbleIndex} is Available (Click to expend)`
                                              : `Slot #${bubbleIndex} has been Spent (Click to restore)`
                                          }
                                        >
                                          {isAvailable ? (
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs"></span>
                                          ) : (
                                            <i className="fa-solid fa-xmark text-[10px] text-slate-600 group-hover:text-slate-400"></i>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Quick Stepper Buttons */}
                                  <div className="flex items-center justify-between pt-1 text-xs font-mono">
                                    <button
                                      onClick={() => handleExpendSlot(clsName, slot.spellLevel, slot.total)}
                                      disabled={remaining <= 0}
                                      className="px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900 disabled:opacity-30 disabled:cursor-not-allowed border border-rose-800/60 text-rose-300 text-[10px] font-bold transition flex items-center gap-1"
                                      title="Cast / Expend 1 slot"
                                    >
                                      <i className="fa-solid fa-minus text-[8px]"></i> Spend
                                    </button>

                                    <button
                                      onClick={() => handleRestoreSlot(clsName, slot.spellLevel, slot.total)}
                                      disabled={expended <= 0}
                                      className="px-2 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900 disabled:opacity-30 disabled:cursor-not-allowed border border-emerald-800/60 text-emerald-300 text-[10px] font-bold transition flex items-center gap-1"
                                      title="Restore 1 slot"
                                    >
                                      <i className="fa-solid fa-plus text-[8px]"></i> Restore
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: DIVINE DOMAINS & RACIAL SPELL-LIKE TRAITS                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'domains' && (
        <div className="space-y-6">
          {/* Racial Spell-Like & Psionic Abilities */}
          {raceObj && (raceObj.spellLikeAbilities || raceObj.psionicAbilities) && (
            <div className="card bg-slate-900/60 backdrop-blur border border-emerald-500/30 p-6 rounded-2xl space-y-3">
              <h2 className="text-lg font-bold font-heading text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
                <i className="fa-solid fa-wand-magic-sparkles text-emerald-400"></i> Racial Spell-Like & Psionic Traits
              </h2>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 text-sm">{raceObj.name} Traits</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                    Innate Racial Ability
                  </span>
                </div>
                {raceObj.spellLikeAbilities && (
                  <div className="text-xs text-slate-200">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
                      Spell-Like Abilities:
                    </span>
                    <span className="font-mono text-emerald-300 text-sm font-bold">
                      {raceObj.spellLikeAbilities}
                    </span>
                  </div>
                )}
                {raceObj.psionicAbilities && (
                  <div className="text-xs text-slate-200 pt-1">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
                      Psionic Abilities:
                    </span>
                    <span className="font-mono text-purple-300 text-sm font-bold">
                      {raceObj.psionicAbilities}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Granted Divine Domains & Domain Spell Lists */}
          {selectedDomainsList.length > 0 ? (
            <div className="card bg-slate-900/60 backdrop-blur border border-amber-500/30 p-6 rounded-2xl space-y-6">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-4">
                <div>
                  <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
                    <i className="fa-solid fa-ankh text-amber-400"></i> Divine Domains & Domain Spell Lists
                  </h2>
                  <p className="text-xs text-slate-400">
                    Granted domain powers and 1st - 9th level domain spell choices from your selected domains (
                    {selectedDomainsList.join(', ')}).
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs text-amber-300 font-mono">
                  <i className="fa-solid fa-sun"></i> Deity: <span className="font-bold">{character.deity || 'Pelor'}</span>
                </div>
              </div>

              {/* Domain Powers Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resolvedDomains.map(dom => {
                  const badge = getSourceBadgeInfo(dom.source, character.allowedSources);
                  return (
                    <div
                      key={dom.id}
                      className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/20 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                          <i className="fa-solid fa-star text-amber-400 text-xs"></i> {dom.name} Domain Power
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                            badge.isAllowed
                              ? badge.isCore
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                              : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                          }`}
                        >
                          {badge.sourceCode}
                        </span>
                      </div>
                      <p className="text-slate-200 font-mono text-[11px] leading-relaxed bg-slate-900/90 p-2.5 rounded border border-slate-800">
                        {dom.power}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Appended Domain Spells per Spell Level Grid (Levels 1 - 9) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <i className="fa-solid fa-book-bookmark text-amber-400"></i> Appended Domain Spell Slots (Levels 1 - 9)
                  </h3>
                  <span className="text-[11px] text-amber-400 font-mono">
                    +1 Domain Spell Slot per level (Cleric rule)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
                  {Array.from({ length: 9 }, (_, i) => i + 1).map(spellLvl => {
                    const saveDc = 10 + spellLvl + wisMod;

                    return (
                      <div
                        key={spellLvl}
                        className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                          <span className="font-bold font-mono text-amber-400 text-xs">
                            Level {spellLvl} Domain Spells
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold">
                            DC {saveDc}
                          </span>
                        </div>

                        <div className="space-y-1 font-mono text-[11px]">
                          {resolvedDomains.map(dom => {
                            const spellName = dom.spells[spellLvl - 1] || 'None listed';
                            return (
                              <div
                                key={dom.id}
                                className="flex justify-between items-center py-1 px-2 rounded bg-slate-900/60 border border-slate-800/50"
                              >
                                <span className="text-slate-300 truncate max-w-[170px]" title={spellName}>
                                  {spellName}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30 shrink-0 font-sans">
                                  {dom.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl text-center space-y-3">
              <i className="fa-solid fa-ankh text-3xl text-slate-500"></i>
              <h3 className="text-md font-bold text-slate-200">No Domains Selected</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Select a Deity and Divine Domains in the Race/Class tab to view granted domain powers and level 1–9 domain spell choices.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1-CLICK SPELL ASSIGNMENT MODAL / DRAWER                                   */}
      {/* ========================================================================= */}
      {activeAssignSlot && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/50">
              <div>
                <h3 className="text-base font-bold font-heading text-slate-100 flex items-center gap-2">
                  <i className="fa-solid fa-wand-magic-sparkles text-amber-400"></i>
                  Prepare Spell: {activeAssignSlot.className}{' '}
                  {activeAssignSlot.spellLevel === 0 ? 'Cantrip (0th Level)' : `Level ${activeAssignSlot.spellLevel}`}
                  {activeAssignSlot.isDomain ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                      ★ Domain Slot
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 font-mono">
                      Slot #{activeAssignSlot.slotIndex + 1}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">
                  {activeAssignSlot.isDomain
                    ? 'Select a granted spell from your divine domains.'
                    : 'Select a spell to prepare into this slot. Search any spell for your class at this level.'}
                </p>
              </div>

              <button
                onClick={() => setActiveAssignSlot(null)}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Filter Toolbar */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-950/30 flex flex-wrap items-center gap-3">
              {/* Search input */}
              <div className="flex-1 min-w-[200px] relative">
                <input
                  type="text"
                  autoFocus
                  value={assignSearchQuery}
                  onChange={e => setAssignSearchQuery(e.target.value)}
                  placeholder={`Search Level ${activeAssignSlot.spellLevel} ${activeAssignSlot.className} spells...`}
                  className="input-field text-xs pr-8"
                />
                {assignSearchQuery && (
                  <button
                    onClick={() => setAssignSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                  >
                    <i className="fa-solid fa-circle-xmark"></i>
                  </button>
                )}
              </div>

              {/* Source scope switcher (All vs Spellbook) */}
              {!activeAssignSlot.isDomain && currentPrepClassKey === 'wizard' && (
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                  <button
                    onClick={() => setAssignSourceFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      assignSourceFilter === 'all'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All Spells ({baseSpellsForActiveSlot.length})
                  </button>
                  <button
                    onClick={() => setAssignSourceFilter('spellbook')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      assignSourceFilter === 'spellbook'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    In Spellbook ({baseSpellsForActiveSlot.filter(s => spellbookSpellIds.includes(s.id)).length})
                  </button>
                </div>
              )}

              {/* School Filter */}
              <select
                value={assignSchoolFilter}
                onChange={e => setAssignSchoolFilter(e.target.value)}
                className="input-field text-xs w-36"
              >
                <option value="all">All Schools</option>
                {MAGIC_SCHOOLS.map(sch => (
                  <option key={sch} value={sch}>
                    {sch}
                  </option>
                ))}
              </select>
            </div>

            {/* Spells List */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {availableSpellsForActiveSlot.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <i className="fa-solid fa-book-open-reader text-3xl text-slate-600"></i>
                  <h4 className="text-sm font-bold text-slate-300">No Spells Match Your Search</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {assignSourceFilter === 'spellbook'
                      ? 'No recorded spells in your spellbook match this filter. Switch to "All Spells" to browse all class spells!'
                      : 'No spells found matching your search term or school filter.'}
                  </p>
                  {assignSourceFilter === 'spellbook' && (
                    <button
                      onClick={() => setAssignSourceFilter('all')}
                      className="mt-2 px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
                    >
                      Show All Class Spells
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {availableSpellsForActiveSlot.map(spell => {
                    const schoolColorClass = getSchoolColor(spell.school);
                    const isCurrentlySelected = activeAssignSlot.spellId === spell.id;
                    const inSpellbook = spellbookSpellIds.includes(spell.id);

                    return (
                      <div
                        key={spell.id}
                        onClick={() => handleAssignSpellToSlot(activeAssignSlot.id, spell)}
                        className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-2.5 ${
                          isCurrentlySelected
                            ? 'bg-amber-500/20 border-amber-500 text-slate-100 shadow-md shadow-amber-500/10'
                            : 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-slate-100'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-xs truncate leading-snug" title={spell.name}>
                              {spell.name}
                            </h4>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${schoolColorClass}`}>
                                {spell.school}
                              </span>
                              {inSpellbook && (
                                <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                                  Book
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-[10px] font-mono text-slate-400 truncate">
                            {spell.castingTime} • {spell.range} • {spell.savingThrow}
                          </div>

                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-sans">
                            {spell.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-[10px]">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedSpellModal(spell);
                            }}
                            className="text-slate-400 hover:text-amber-300 transition flex items-center gap-1"
                          >
                            <i className="fa-solid fa-circle-info"></i> Full Details
                          </button>

                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleAssignSpellToSlot(activeAssignSlot.id, spell);
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition shrink-0 ${
                              isCurrentlySelected
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-900 text-amber-300 border border-slate-700 hover:bg-amber-500 hover:text-slate-950'
                            }`}
                          >
                            {isCurrentlySelected ? 'Assigned' : '1-Click Assign'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">
                Showing {availableSpellsForActiveSlot.length} of {baseSpellsForActiveSlot.length} spells
              </span>
              <button
                onClick={() => setActiveAssignSlot(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD SPELL TO SPELLBOOK MODAL                                              */}
      {/* ========================================================================= */}
      {isAddSpellbookModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/50">
              <div>
                <h3 className="text-base font-bold font-heading text-slate-100 flex items-center gap-2">
                  <i className="fa-solid fa-book-bookmark text-amber-400"></i> Record New Spells in Spellbook
                </h3>
                <p className="text-xs text-slate-400">
                  Search and record spells from the compendium into your live spellbook.
                </p>
              </div>
              <button
                onClick={() => setIsAddSpellbookModalOpen(false)}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-950/30 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={addSpellbookSearch}
                  onChange={e => setAddSpellbookSearch(e.target.value)}
                  placeholder="Search spells to add..."
                  className="input-field text-xs pr-8"
                />
                {addSpellbookSearch && (
                  <button
                    onClick={() => setAddSpellbookSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                  >
                    <i className="fa-solid fa-circle-xmark"></i>
                  </button>
                )}
              </div>

              <select
                value={addSpellbookLevel}
                onChange={e => setAddSpellbookLevel(e.target.value)}
                className="input-field text-xs font-mono"
              >
                <option value="all">All Levels</option>
                <option value="0">Cantrips (0th Level)</option>
                {Array.from({ length: 9 }, (_, i) => i + 1).map(lvl => (
                  <option key={lvl} value={lvl.toString()}>
                    Level {lvl}
                  </option>
                ))}
              </select>

              <select
                value={addSpellbookSchool}
                onChange={e => setAddSpellbookSchool(e.target.value)}
                className="input-field text-xs"
              >
                <option value="all">All Schools</option>
                {MAGIC_SCHOOLS.map(sch => (
                  <option key={sch} value={sch}>
                    {sch}
                  </option>
                ))}
              </select>
            </div>

            {/* Spell List */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {eligibleSpellsForSpellbookAdd.slice(0, 100).map(spell => {
                  const inSpellbook = spellbookSpellIds.includes(spell.id);
                  const schoolColorClass = getSchoolColor(spell.school);

                  return (
                    <div
                      key={spell.id}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-100 truncate" title={spell.name}>
                            {spell.name}
                          </span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${schoolColorClass}`}>
                            {spell.school}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          Level: {Object.entries(spell.levels).slice(0, 2).map(([c, l]) => `${c} ${l}`).join(', ')}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (inSpellbook) {
                            handleRemoveFromSpellbook(spell.id);
                          } else {
                            handleAddToSpellbook(spell.id);
                          }
                        }}
                        className={`px-3 py-1 rounded-lg font-bold font-mono transition text-xs shrink-0 flex items-center gap-1.5 ${
                          inSpellbook
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 hover:bg-rose-950 hover:text-rose-300'
                            : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-sm'
                        }`}
                      >
                        <i className={`fa-solid ${inSpellbook ? 'fa-check' : 'fa-plus'} text-[10px]`}></i>
                        <span>{inSpellbook ? 'In Book' : 'Add'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">
                {spellbookSpellIds.length} recorded spells in live spellbook
              </span>
              <button
                onClick={() => setIsAddSpellbookModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL-DETAIL SPELL MODAL POPUP                                             */}
      {/* ========================================================================= */}
      {selectedSpellModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/40">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded border font-bold ${getSchoolColor(
                      selectedSpellModal.school
                    )}`}
                  >
                    {selectedSpellModal.school}
                    {selectedSpellModal.subschool ? ` (${selectedSpellModal.subschool})` : ''}
                  </span>
                  {(selectedSpellModal.descriptors || []).map((desc, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-400"
                    >
                      [{desc}]
                    </span>
                  ))}
                </div>
                <h2 className="text-xl font-bold font-heading text-slate-100">{selectedSpellModal.name}</h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopySpell(selectedSpellModal)}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500 text-slate-300 hover:text-amber-400 transition text-xs flex items-center gap-1.5"
                  title="Copy full spell text to clipboard"
                >
                  <i className={`fa-solid ${copiedId === selectedSpellModal.id ? 'fa-check text-emerald-400' : 'fa-copy'}`}></i>
                  <span>{copiedId === selectedSpellModal.id ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => setSelectedSpellModal(null)}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition text-xs"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Level Assignments */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Level & Classes
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(selectedSpellModal.levels).map(([cls, lvl]) => (
                    <span
                      key={cls}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-300 font-mono font-bold"
                    >
                      {cls} {lvl}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stat Properties Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">CASTING TIME</span>
                  <span className="text-slate-200 font-semibold">{selectedSpellModal.castingTime}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">COMPONENTS</span>
                  <span className="text-slate-200 font-semibold">{selectedSpellModal.components || 'V, S'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">RANGE</span>
                  <span className="text-slate-200 font-semibold">{selectedSpellModal.range}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">TARGET / AREA / EFFECT</span>
                  <span className="text-slate-200 font-semibold">{selectedSpellModal.targetArea || 'See description'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">DURATION</span>
                  <span className="text-slate-200 font-semibold">{selectedSpellModal.duration}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">SAVING THROW & SR</span>
                  <span className="text-emerald-300 font-semibold">
                    {selectedSpellModal.savingThrow} • SR: {selectedSpellModal.spellResistance}
                  </span>
                </div>
              </div>

              {/* Description Body */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Description & Mechanics
                </span>
                <div className="space-y-3 text-slate-200 text-xs leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 font-sans">
                  {selectedSpellModal.description.split('\n\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">
                Source: <span className="text-amber-400 font-bold">{selectedSpellModal.source}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const inSpellbook = spellbookSpellIds.includes(selectedSpellModal.id);
                    if (inSpellbook) {
                      handleRemoveFromSpellbook(selectedSpellModal.id);
                    } else {
                      handleAddToSpellbook(selectedSpellModal.id);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    spellbookSpellIds.includes(selectedSpellModal.id)
                      ? 'bg-slate-900 text-rose-300 border border-slate-700 hover:border-rose-500'
                      : 'bg-slate-900 text-amber-300 border border-slate-700 hover:border-amber-500'
                  }`}
                >
                  <i
                    className={`fa-solid ${
                      spellbookSpellIds.includes(selectedSpellModal.id) ? 'fa-trash-can' : 'fa-book-bookmark'
                    }`}
                  ></i>
                  <span>
                    {spellbookSpellIds.includes(selectedSpellModal.id)
                      ? 'Remove from Spellbook'
                      : 'Add to Spellbook'}
                  </span>
                </button>
                <button
                  onClick={() => setSelectedSpellModal(null)}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
