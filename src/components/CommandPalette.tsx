import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useGameData } from '../context/GameDataContext';
import { useCharacter } from '../context/CharacterContext';
import { CharacterSummary, SpellData, FeatData, WeaponData } from '../types/character';
import {
  STANDARD_ARMOR_MAP,
  STANDARD_SHIELD_MAP,
  StandardArmorEntry,
  StandardShieldEntry,
  COMMON_ITEM_PRESETS
} from '../engine/equipment';
import {
  STANDARD_WONDROUS_ITEMS,
  PredefinedWondrousItem
} from '../engine/wondrousItems';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  summaries: CharacterSummary[];
  onSelectCharacter: (id: string) => void;
  onCreateNew?: () => void;
  onExport?: () => void;
  onOpenDocs?: () => void;
}

export type CommandCategory = 'navigation' | 'character' | 'spell' | 'feat' | 'equipment' | 'action';

export interface PaletteItem {
  id: string;
  title: string;
  subtitle?: string;
  category: CommandCategory;
  categoryLabel: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
  keywords?: string[];
  action: () => void;
  data?: any;
}

const NAVIGATION_COMMANDS = [
  { id: 'stats', label: 'Stats', desc: 'Ability scores, point-buy calculator, modifiers, level bumps', icon: 'fa-chart-simple', keywords: ['scores', 'abilities', 'point buy', 'strength', 'dexterity', 'constitution', 'wisdom', 'intelligence', 'charisma'] },
  { id: 'race-class', label: 'Race & Class', desc: 'Races, templates, class progression, gestalt, hit dice', icon: 'fa-shield-halved', keywords: ['race', 'class', 'gestalt', 'level', 'hd', 'hit die', 'multiclass', 'deity', 'domains'] },
  { id: 'skills', label: 'Skills', desc: 'Skill ranks, synergies, skill tricks, armor check penalty', icon: 'fa-hand-sparkles', keywords: ['skills', 'ranks', 'tricks', 'knowledge', 'perception', 'listen', 'spot', 'tumble'] },
  { id: 'feats', label: 'Feats', desc: 'Feat selection, bonus feats, prerequisites, feat tree view', icon: 'fa-award', keywords: ['feats', 'tree', 'prerequisites', 'power attack', 'cleave', 'metamagic'] },
  { id: 'equipment', label: 'Equipment & Inventory', desc: 'Weapons, armor, wondrous items, body slots, carrying capacity', icon: 'fa-boxes-packing', keywords: ['weapons', 'armor', 'shield', 'items', 'gear', 'gold', 'inventory', 'encumbrance', 'wondrous'] },
  { id: 'spells', label: 'Spells', desc: 'Spellbook, prepared spells, spell slots per day, save DCs', icon: 'fa-hat-wizard', keywords: ['spells', 'magic', 'slots', 'cantrips', 'scrolls', 'casting', 'domains'] },
  { id: 'familiar', label: 'Familiar', desc: 'Arcane familiar stats, special abilities, touch delivery', icon: 'fa-cat', keywords: ['familiar', 'pet', 'raven', 'cat', 'toad', 'bat', 'snake'] },
  { id: 'companion', label: 'Animal Companion', desc: 'Druid/Ranger companion stats, tricks, link, evasion', icon: 'fa-paw', keywords: ['companion', 'animal', 'wolf', 'horse', 'bear', 'tricks'] },
  { id: 'auras', label: 'Auras', desc: 'Active class and draconic auras, party buffs', icon: 'fa-sun', keywords: ['auras', 'draconic', 'paladin', 'buffs', 'aura of courage'] },
  { id: 'sources', label: 'Sourcebooks', desc: 'Toggle allowed 3.5e official splatbooks and settings', icon: 'fa-book-atlas', keywords: ['sources', 'books', 'phb', 'complete', 'splatbooks', 'eborron', 'faerun'] },
  { id: 'notes', label: 'Notes & Journal', desc: 'Backstory, quests, campaign logs, scratchpad, NPCs', icon: 'fa-book-bookmark', keywords: ['notes', 'backstory', 'quests', 'journal', 'npcs', 'scratchpad'] },
  { id: 'sheet', label: 'Sheet View', desc: 'Formatted full printable character sheet', icon: 'fa-scroll', keywords: ['sheet', 'print', 'character sheet', 'summary', 'full sheet'] }
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  summaries,
  onSelectCharacter,
  onCreateNew,
  onExport,
  onOpenDocs
}) => {
  const character = useCharacter();
  const gameData = useGameData();

  const [query, setQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store active element on open to restore upon close
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      setQuery('');
      setFilterCategory('all');
      setSelectedIndex(0);

      // Focus input with slight delay to ensure modal is mounted
      const t = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(t);
    } else {
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  // Keep selected index within bounds when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, filterCategory]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement | null;
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Flattened items for fast searching
  const allItems = useMemo<PaletteItem[]>(() => {
    const items: PaletteItem[] = [];

    // 1. Navigation items
    for (const nav of NAVIGATION_COMMANDS) {
      items.push({
        id: `nav_${nav.id}`,
        title: nav.label,
        subtitle: nav.desc,
        category: 'navigation',
        categoryLabel: 'Navigation',
        icon: nav.icon,
        badge: activeTab === nav.id ? 'Active Tab' : 'Tab',
        badgeColor: activeTab === nav.id ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-slate-800 text-slate-400 border-slate-700',
        keywords: nav.keywords,
        action: () => {
          setActiveTab(nav.id);
          onClose();
        }
      });
    }

    // 2. Character Roster items
    for (const s of summaries) {
      const isCurrent = s.id === character.id;
      items.push({
        id: `char_${s.id}`,
        title: s.name,
        subtitle: `Lvl ${s.level} ${s.race} • ${s.classes}`,
        category: 'character',
        categoryLabel: 'Roster',
        icon: 'fa-user-shield',
        badge: isCurrent ? 'Active Sheet' : 'Switch',
        badgeColor: isCurrent ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        keywords: [s.race, s.classes, 'character', 'roster', 'switch'],
        action: () => {
          onSelectCharacter(s.id);
          onClose();
        },
        data: s
      });
    }

    // 3. Quick Actions
    if (onCreateNew) {
      items.push({
        id: 'action_new',
        title: 'Create New Character',
        subtitle: 'Start building a fresh 3.5e character sheet',
        category: 'action',
        categoryLabel: 'Action',
        icon: 'fa-plus',
        badge: 'New',
        badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        keywords: ['create', 'new', 'sheet', 'fresh', 'blank'],
        action: () => {
          onCreateNew();
          onClose();
        }
      });
    }
    if (onExport) {
      items.push({
        id: 'action_export',
        title: 'Export Active Character JSON',
        subtitle: 'Download the active character sheet data',
        category: 'action',
        categoryLabel: 'Action',
        icon: 'fa-download',
        badge: 'Export',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        keywords: ['save', 'json', 'export', 'download', 'backup'],
        action: () => {
          onExport();
          onClose();
        }
      });
    }
    items.push({
      id: 'action_print',
      title: 'Print / Save PDF Character Sheet',
      subtitle: 'Open the formatted character sheet in print preview',
      category: 'action',
      categoryLabel: 'Action',
      icon: 'fa-print',
      badge: 'Print',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      keywords: ['print', 'pdf', 'sheet', 'export'],
      action: () => {
        setActiveTab('sheet');
        onClose();
        setTimeout(() => window.print(), 250);
      }
    });
    if (onOpenDocs) {
      items.push({
        id: 'action_docs',
        title: 'Open Help & Documentation',
        subtitle: 'Read the comprehensive HeroForgeNG user guide and rule references',
        category: 'action',
        categoryLabel: 'Action',
        icon: 'fa-circle-question',
        badge: 'Help',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        keywords: ['help', 'docs', 'manual', 'rules', 'guide'],
        action: () => {
          onOpenDocs();
          onClose();
        }
      });
    }

    // 4. Compendium - Spells
    const spells = gameData.spellsData || [];
    for (const sp of spells) {
      const classesList = sp.levels ? Object.entries(sp.levels).map(([cls, lvl]) => `${cls} ${lvl}`).join(', ') : '';
      items.push({
        id: `spell_${sp.id}`,
        title: sp.name,
        subtitle: `${sp.school}${classesList ? ` • ${classesList}` : ''}`,
        category: 'spell',
        categoryLabel: 'Spell',
        icon: 'fa-hat-wizard',
        badge: sp.school,
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        keywords: [sp.school, ...(sp.descriptors || []), classesList, 'spell', 'magic'],
        action: () => {
          setActiveTab('spells');
          onClose();
        },
        data: sp
      });
    }

    // 5. Compendium - Feats
    const feats = gameData.featsData || [];
    for (const f of feats) {
      items.push({
        id: `feat_${f.id}`,
        title: f.name,
        subtitle: f.prerequisites ? `Req: ${f.prerequisites}` : 'General Feat',
        category: 'feat',
        categoryLabel: 'Feat',
        icon: 'fa-award',
        badge: f.source || 'Feat',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        keywords: [f.prerequisites || '', f.source || '', 'feat'],
        action: () => {
          setActiveTab('feats');
          onClose();
        },
        data: f
      });
    }

    // 6. Compendium - Equipment (Weapons, Armors, Shields, Wondrous, Common Items)
    const weapons = gameData.weaponsData || [];
    for (const w of weapons) {
      items.push({
        id: `wpn_${w.id}`,
        title: w.name,
        subtitle: `Dmg: ${w.damageM || '-'} • Crit: ${w.threat ? (w.threat < 20 ? `${w.threat}-20` : '20') : '20'}/x${w.critMultiplier || 2} • ${w.category || ''} ${w.type || ''}`,
        category: 'equipment',
        categoryLabel: 'Weapon',
        icon: 'fa-gavel',
        badge: 'Weapon',
        badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
        keywords: [w.category || '', w.type || '', 'weapon', 'melee', 'ranged'],
        action: () => {
          setActiveTab('equipment');
          onClose();
        },
        data: { ...w, itemType: 'weapon' }
      });
    }

    for (const [key, armor] of Object.entries(STANDARD_ARMOR_MAP) as [string, StandardArmorEntry][]) {
      if (key === 'none') continue;
      items.push({
        id: `armor_${key}`,
        title: armor.name,
        subtitle: `AC: +${armor.acBonus} • Max Dex: +${armor.maxDex} • ACP: ${armor.checkPenalty} • ${armor.type} armor`,
        category: 'equipment',
        categoryLabel: 'Armor',
        icon: 'fa-shield-halved',
        badge: `${armor.type} armor`,
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        keywords: [armor.type, 'armor', 'defense', 'ac'],
        action: () => {
          setActiveTab('equipment');
          onClose();
        },
        data: { ...armor, itemType: 'armor' }
      });
    }

    for (const [key, shield] of Object.entries(STANDARD_SHIELD_MAP) as [string, StandardShieldEntry][]) {
      if (key === 'none') continue;
      items.push({
        id: `shield_${key}`,
        title: shield.name,
        subtitle: `AC: +${shield.acBonus} • ACP: ${shield.checkPenalty} • ${shield.weight} lbs`,
        category: 'equipment',
        categoryLabel: 'Shield',
        icon: 'fa-shield',
        badge: 'Shield',
        badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        keywords: ['shield', 'defense', 'ac'],
        action: () => {
          setActiveTab('equipment');
          onClose();
        },
        data: { ...shield, itemType: 'shield' }
      });
    }

    for (const item of COMMON_ITEM_PRESETS) {
      items.push({
        id: `preset_${item.name.toLowerCase().replace(/\s+/g, '_')}`,
        title: item.name,
        subtitle: `Cost: ${item.value} • Weight: ${item.weight} lbs • ${item.notes || item.location}`,
        category: 'equipment',
        categoryLabel: 'Item',
        icon: 'fa-box',
        badge: 'Gear',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        keywords: ['gear', 'item', 'inventory', 'adventuring'],
        action: () => {
          setActiveTab('equipment');
          onClose();
        },
        data: { ...item, itemType: 'gear' }
      });
    }

    for (const wi of STANDARD_WONDROUS_ITEMS) {
      items.push({
        id: `wi_${wi.id}`,
        title: wi.name,
        subtitle: `Slot: ${wi.slot} • Cost: ${wi.cost || 'N/A'} • ${wi.effect || ''}`,
        category: 'equipment',
        categoryLabel: 'Wondrous',
        icon: 'fa-wand-magic-sparkles',
        badge: wi.slot,
        badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        keywords: [wi.slot, 'wondrous', 'magic item', 'artifact'],
        action: () => {
          setActiveTab('equipment');
          onClose();
        },
        data: { ...wi, itemType: 'wondrous' }
      });
    }

    return items;
  }, [
    activeTab,
    character.id,
    summaries,
    onCreateNew,
    onExport,
    onOpenDocs,
    gameData.spellsData,
    gameData.featsData,
    gameData.weaponsData,
    setActiveTab,
    onClose,
    onSelectCharacter
  ]);

  // Filter and score results
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = allItems;
    if (filterCategory !== 'all') {
      list = list.filter(item => item.category === filterCategory);
    }

    if (!q) {
      // Return default curated items when no query is typed
      return list.filter(item => item.category === 'navigation' || item.category === 'character' || item.category === 'action');
    }

    // Smart fuzzy match with scoring
    const scored: { item: PaletteItem; score: number }[] = [];

    for (const item of list) {
      const titleLower = item.title.toLowerCase();
      const subtitleLower = (item.subtitle || '').toLowerCase();
      let score = 0;

      if (titleLower === q) {
        score = 1000;
      } else if (titleLower.startsWith(q)) {
        score = 500 - titleLower.length;
      } else if (titleLower.includes(q)) {
        score = 250 - titleLower.indexOf(q);
      } else if (subtitleLower.includes(q)) {
        score = 100;
      } else if (item.keywords && item.keywords.some(k => k.toLowerCase().includes(q))) {
        score = 50;
      }

      if (score > 0) {
        scored.push({ item, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    // Limit to top 50 items to keep UI snappy
    return scored.slice(0, 50).map(s => s.item);
  }, [allItems, query, filterCategory]);

  const activeItem = filteredResults[selectedIndex] || null;

  // Keyboard navigation & trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (filteredResults.length === 0 ? 0 : (prev + 1) % filteredResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (filteredResults.length === 0 ? 0 : (prev - 1 + filteredResults.length) % filteredResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeItem) {
        activeItem.action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Tab') {
      // Focus trap within container
      const focusable = containerRef.current?.querySelectorAll<HTMLElement>('input, button:not([disabled])');
      if (focusable && focusable.length > 0) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }, [activeItem, filteredResults.length, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-start justify-center pt-10 sm:pt-20 px-3 sm:px-4 pb-4 animate-fadeIn"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Global Quick-Command Palette"
    >
      <div
        ref={containerRef}
        onKeyDown={handleKeyDown}
        className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh] transition-all"
      >
        {/* Search Input Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950/80 flex items-center gap-3">
          <i className="fa-solid fa-magnifying-glass text-amber-400 text-base shrink-0"></i>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a tab, feat, spell, item, or character name..."
            className="flex-1 bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none font-medium"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="text-slate-400 hover:text-slate-200 text-xs px-1.5 py-0.5 rounded hover:bg-slate-800 transition"
              title="Clear search"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700 rounded-md">
            Esc
          </kbd>
        </div>

        {/* Filter Category Chips */}
        <div className="px-3.5 py-2 border-b border-slate-800/80 bg-slate-900/60 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
          {[
            { id: 'all', label: 'All', icon: 'fa-globe' },
            { id: 'navigation', label: 'Tabs', icon: 'fa-compass' },
            { id: 'character', label: 'Roster', icon: 'fa-users' },
            { id: 'spell', label: 'Spells', icon: 'fa-hat-wizard' },
            { id: 'feat', label: 'Feats', icon: 'fa-award' },
            { id: 'equipment', label: 'Equipment', icon: 'fa-boxes-packing' },
            { id: 'action', label: 'Actions', icon: 'fa-bolt' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setFilterCategory(cat.id);
                inputRef.current?.focus();
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition font-medium cursor-pointer shrink-0 ${
                filterCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <i className={`fa-solid ${cat.icon} text-[11px]`}></i>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Main Body: Results List + Detail Preview Popover Pane */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* Results List Column */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[46vh] md:max-h-[56vh]">
            {filteredResults.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <i className="fa-solid fa-magnifying-glass-arrow-right text-3xl text-slate-600"></i>
                <p className="text-sm font-medium">No results found for &ldquo;{query}&rdquo;</p>
                <p className="text-xs text-slate-500">Try searching for a spell (e.g. &ldquo;Fireball&rdquo;), feat (e.g. &ldquo;Power Attack&rdquo;), or tab.</p>
              </div>
            ) : (
              filteredResults.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={item.id}
                    data-index={index}
                    onClick={() => item.action()}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between gap-3 transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border border-amber-500/40 text-amber-200'
                        : 'hover:bg-slate-800/60 text-slate-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm ${
                          isSelected ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <i className={`fa-solid ${item.icon}`}></i>
                      </div>
                      <div className="min-w-0 leading-tight">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs sm:text-sm font-semibold truncate ${isSelected ? 'text-amber-300 font-bold' : 'text-slate-200'}`}>
                            {item.title}
                          </span>
                        </div>
                        {item.subtitle && (
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.badge && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${item.badgeColor || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                          {item.badge}
                        </span>
                      )}
                      {isSelected && (
                        <span className="hidden sm:inline-flex text-[10px] text-amber-400 font-mono items-center gap-1 font-semibold">
                          <i className="fa-solid fa-arrow-turn-down text-[9px]"></i> Enter
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Quick Description Popover / Preview Pane */}
          {activeItem && (
            <div className="w-full md:w-72 lg:w-80 p-4 bg-slate-950/40 overflow-y-auto max-h-[30vh] md:max-h-[56vh] text-xs space-y-3 shrink-0">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-heading">
                  Quick Details
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${activeItem.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                  {activeItem.categoryLabel}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-amber-300 font-heading leading-snug">
                  {activeItem.title}
                </h4>
                {activeItem.subtitle && (
                  <p className="text-[11px] text-slate-400 mt-0.5">{activeItem.subtitle}</p>
                )}
              </div>

              {/* Spell Details */}
              {activeItem.category === 'spell' && activeItem.data && (
                <div className="space-y-2 text-slate-300">
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                    {activeItem.data.castingTime && (
                      <div><span className="text-slate-400 font-medium">Casting Time:</span> {activeItem.data.castingTime}</div>
                    )}
                    {activeItem.data.range && (
                      <div><span className="text-slate-400 font-medium">Range:</span> {activeItem.data.range}</div>
                    )}
                    {activeItem.data.duration && (
                      <div><span className="text-slate-400 font-medium">Duration:</span> {activeItem.data.duration}</div>
                    )}
                    {activeItem.data.savingThrow && (
                      <div><span className="text-slate-400 font-medium">Save:</span> {activeItem.data.savingThrow}</div>
                    )}
                    {activeItem.data.spellResistance && (
                      <div><span className="text-slate-400 font-medium">SR:</span> {activeItem.data.spellResistance}</div>
                    )}
                  </div>
                  {activeItem.data.description && (
                    <div className="text-slate-300 leading-relaxed text-[11px] max-h-36 overflow-y-auto whitespace-pre-wrap bg-slate-900/40 p-2 rounded-lg border border-slate-800/60">
                      {activeItem.data.description}
                    </div>
                  )}
                </div>
              )}

              {/* Feat Details */}
              {activeItem.category === 'feat' && activeItem.data && (
                <div className="space-y-2 text-slate-300">
                  {activeItem.data.prerequisites && (
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-[11px]">
                      <span className="text-amber-400 font-semibold">Prerequisites:</span> {activeItem.data.prerequisites}
                    </div>
                  )}
                  {activeItem.data.description && (
                    <div className="text-slate-300 leading-relaxed text-[11px] max-h-40 overflow-y-auto whitespace-pre-wrap bg-slate-900/40 p-2 rounded-lg border border-slate-800/60">
                      {activeItem.data.description.replace(/^:\s*/, '')}
                    </div>
                  )}
                </div>
              )}

              {/* Equipment Details */}
              {activeItem.category === 'equipment' && activeItem.data && (
                <div className="space-y-2 text-slate-300">
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 space-y-1 text-[11px]">
                    {activeItem.data.itemType === 'weapon' && (
                      <>
                        <div><span className="text-slate-400">Damage (M):</span> <span className="font-mono text-amber-300 font-bold">{activeItem.data.damageM}</span></div>
                        <div><span className="text-slate-400">Critical:</span> {activeItem.data.threat ? (activeItem.data.threat < 20 ? `${activeItem.data.threat}-20` : '20') : '20'}/x{activeItem.data.critMultiplier || 2}</div>
                        <div><span className="text-slate-400">Damage Type:</span> {activeItem.data.type}</div>
                        <div><span className="text-slate-400">Category:</span> {activeItem.data.category}</div>
                        {activeItem.data.range && <div><span className="text-slate-400">Range Increment:</span> {activeItem.data.range} ft</div>}
                        <div><span className="text-slate-400">Weight:</span> {activeItem.data.weight} lbs</div>
                      </>
                    )}
                    {activeItem.data.itemType === 'armor' && (
                      <>
                        <div><span className="text-slate-400">AC Bonus:</span> <span className="font-mono text-cyan-300 font-bold">+{activeItem.data.acBonus}</span></div>
                        <div><span className="text-slate-400">Max Dex:</span> +{activeItem.data.maxDex}</div>
                        <div><span className="text-slate-400">Armor Check:</span> {activeItem.data.checkPenalty}</div>
                        <div><span className="text-slate-400">Arcane Spell Failure:</span> {activeItem.data.spellFailure}%</div>
                        <div><span className="text-slate-400">Weight:</span> {activeItem.data.weight} lbs</div>
                      </>
                    )}
                    {activeItem.data.itemType === 'shield' && (
                      <>
                        <div><span className="text-slate-400">AC Bonus:</span> <span className="font-mono text-cyan-300 font-bold">+{activeItem.data.acBonus}</span></div>
                        <div><span className="text-slate-400">Armor Check:</span> {activeItem.data.checkPenalty}</div>
                        <div><span className="text-slate-400">Arcane Spell Failure:</span> {activeItem.data.spellFailure}%</div>
                        <div><span className="text-slate-400">Weight:</span> {activeItem.data.weight} lbs</div>
                      </>
                    )}
                    {activeItem.data.itemType === 'wondrous' && (
                      <>
                        <div><span className="text-slate-400">Body Slot:</span> <span className="text-indigo-300 font-semibold">{activeItem.data.slot}</span></div>
                        <div><span className="text-slate-400">Cost:</span> <span className="font-mono text-amber-300">{activeItem.data.cost || 'N/A'}</span></div>
                        <div className="pt-1 text-slate-300 leading-normal">{activeItem.data.effect}</div>
                      </>
                    )}
                    {activeItem.data.itemType === 'gear' && (
                      <>
                        <div><span className="text-slate-400">Cost:</span> <span className="font-mono text-amber-300">{activeItem.data.value}</span></div>
                        <div><span className="text-slate-400">Weight:</span> {activeItem.data.weight} lbs</div>
                        {activeItem.data.notes && <div className="pt-1 text-slate-300 leading-normal">{activeItem.data.notes}</div>}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Character Details */}
              {activeItem.category === 'character' && activeItem.data && (
                <div className="space-y-2 text-slate-300">
                  <div className="flex items-center gap-3 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <div className="w-10 h-10 rounded-lg border border-slate-700 bg-slate-950 overflow-hidden flex items-center justify-center shrink-0">
                      {activeItem.data.portraitUrl ? (
                        <img src={activeItem.data.portraitUrl} alt={activeItem.data.name} className="w-full h-full object-cover" />
                      ) : (
                        <i className="fa-solid fa-user-shield text-slate-400"></i>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">{activeItem.data.name}</div>
                      <div className="text-[11px] text-slate-400">Level {activeItem.data.level} {activeItem.data.race}</div>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => activeItem.action()}
                className="w-full btn btn-primary text-xs py-1.5 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <span>Select / Open</span>
                <i className="fa-solid fa-arrow-right text-[10px]"></i>
              </button>
            </div>
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/80 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-400">&uarr;</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-400">&darr;</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-400">Enter</kbd> Select</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-400">Esc</kbd> Close</span>
          </div>
          <div className="font-heading font-medium text-slate-400 flex items-center gap-1.5">
            <i className="fa-solid fa-bolt text-amber-400 text-xs"></i>
            <span>HeroForgeNG Quick Palette</span>
          </div>
        </div>
      </div>
    </div>
  );
};
