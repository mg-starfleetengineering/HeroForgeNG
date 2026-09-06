import React, { useState } from 'react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DocSection {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<string>('quickstart');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const sections: DocSection[] = [
    {
      id: 'quickstart',
      title: 'Quick Start & Roster',
      icon: 'fa-rocket',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-amber-300 font-heading">Getting Started with HeroForgeNG v2.1.0</h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            HeroForgeNG is a high-performance web application designed for creating, customizing, and managing D&D 3.5e character sheets. All character data is saved <strong>100% locally in your browser</strong> using IndexedDB with automatic local storage fallback.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <i className="fa-solid fa-users text-xs"></i>
                <span>Roster Pill & Quick Switcher</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Click the summary badge in the header (showing Level, HP, AC, DR, SR, BAB, and Saves) to immediately switch between saved characters or search your roster.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <i className="fa-solid fa-table-cells text-xs"></i>
                <span>Character Dashboard</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Click <strong>View All Cards</strong> or the <strong>Roster</strong> button to open the dashboard. Here you can clone characters, delete outdated sheets, or export individual backup JSON files.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <i className="fa-solid fa-file-zipper text-xs"></i>
                <span>Export & Roster Backup</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Under the <strong>Export</strong> dropdown, select <strong>Export All Roster Backup</strong> to create a full single-file backup of all your characters across devices.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <i className="fa-solid fa-link text-xs"></i>
                <span>URL Character Sync</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Bookmarking or sharing your browser URL with <code>?characterId=...</code> automatically loads that specific character whenever you open the site.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'race-class',
      title: 'Race, Class & Templates',
      icon: 'fa-shield-halved',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-amber-300 font-heading">Race, Multi-Classing & Racial Overrides</h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            Configure your character&apos;s biological lineage, stacked templates, level progression across up to 4 distinct classes, and divine patron choices.
          </p>

          <div className="space-y-3">
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-dna text-xs"></i> Base Race & Racial Overrides
              </h4>
              <ul className="text-slate-300 text-xs space-y-1 list-disc list-inside">
                <li>Select from over 100+ D&D 3.5 base races (Core, Races of Stone/Destiny/Wild, Eberron, Faerûn, Monster Manual).</li>
                <li><strong>Racial Override</strong>: Specify custom sub-races or custom homebrew racial titles (e.g. Catfolk variant, Wild Elf) while preserving proper mechanical stat calculations.</li>
                <li>Racial ability score modifiers, movement speeds, size modifiers, and bonus feats automatically update all downstream calculations.</li>
              </ul>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-layer-group text-xs"></i> Stacked Templates & Level Adjustment
              </h4>
              <ul className="text-slate-300 text-xs space-y-1 list-disc list-inside">
                <li>Apply templates such as <strong>Half-Dragon</strong>, <strong>Vampire</strong>, <strong>Celestial</strong>, <strong>Fiendish</strong>, or <strong>Draconic</strong>.</li>
                <li>Template stat adjustments, speed modifications, natural armor bonuses, Spell Resistance, and <strong>Level Adjustment (LA)</strong> stack dynamically onto your character sheet.</li>
              </ul>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-hands-praying text-xs"></i> Deities, Domains & Pathfinder Skill Toggles
              </h4>
              <ul className="text-slate-300 text-xs space-y-1 list-disc list-inside">
                <li><strong>Deities & Domains</strong>: Choose your deity and select domain pairs (e.g. War, Sun, Good, Strength) to unlock domain powers and domain spell slots.</li>
                <li><strong>Pathfinder Perception Toggle</strong>: Enable the skill consolidation option to merge Spot, Listen, and Search into a single <em>Perception</em> skill.</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'stats',
      title: 'Ability Scores & Math',
      icon: 'fa-chart-simple',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-amber-300 font-heading">Ability Score & Derived Vitals Calculator</h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            HeroForgeNG calculates your character&apos;s final ability scores (STR, DEX, CON, INT, WIS, CHA), Spell Resistance (SR), and Grapple modifier by aggregating base scores, point buy costs, level increments, racial adjustments, stance modifiers, equipment enhancement bonuses, and trait/flaw modifiers.
          </p>

          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
            <h4 className="text-amber-400 font-semibold text-sm">Calculation Breakdown</h4>
            <div className="bg-slate-950 p-2.5 rounded-lg font-mono text-xs text-amber-200 border border-slate-800">
              Total Score = Base Score + Racial Mod + Level Increase + Enhancement Mod + Stance Mod + Trait/Flaw Mod
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Ability modifiers equal <code>Math.floor((Total Score - 10) / 2)</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
              <span className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                <i className="fa-solid fa-[#000] fa-hand text-xs"></i> Grapple Modifier Math
              </span>
              <div className="bg-slate-950 p-2 rounded font-mono text-[11px] text-cyan-300 border border-slate-800">
                Grapple = BAB + STR Mod + Size Grapple Mod + Misc (Improved Grapple +4)
              </div>
              <p className="text-slate-400 text-xs">
                Size Grapple Modifiers: Fine (-16), Diminutive (-12), Tiny (-8), Small (-4), Medium (+0), Large (+4), Huge (+8), Gargantuan (+12), Colossal (+16).
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
              <span className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                <i className="fa-solid fa-wand-magic-sparkles text-xs"></i> Spell Resistance (SR) Engine
              </span>
              <div className="bg-slate-950 p-2 rounded font-mono text-[11px] text-purple-300 border border-slate-800">
                SR = Max(Racial SR, Template SR, Monk Diamond Soul 11+Lvl, Feats/Items)
              </div>
              <p className="text-slate-400 text-xs">
                Evaluates Drow SR (11 + Level), Svirfneblin (11 + Level), Celestial/Fiendish templates, Elan, and active spell/item bonuses.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'feats-skills',
      title: 'Feats & Dependency Tree',
      icon: 'fa-award',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-amber-300 font-heading">Feats, Prerequisite Engine & Dependency Tree</h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            HeroForgeNG features a fully deduplicated D&D 3.5e feat catalog, multi-sourcebook badging, real-time prerequisite validation, and an interactive visual feat dependency tree modal.
          </p>

          <div className="space-y-3">
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-code-fork text-xs"></i> Canonical Deduplication & Multi-Source Filtering
              </h4>
              <ul className="text-slate-300 text-xs space-y-1 list-disc list-inside">
                <li><strong>100% Deduplicated</strong>: All 103 historical dashed pointer records (<code>-- Feat Name --</code>) and 3.0e/variant aliases (<em>Ki Shout</em> &rarr; <em>Kiai Shout</em>, <em>Remain Conscious</em> &rarr; <em>Diehard</em>, <em>Superior Expertise</em> &rarr; <em>Improved Combat Expertise</em>) resolve into canonical records.</li>
                <li><strong>Multi-Source Badges</strong>: Feats printed in multiple supplements (e.g. <em>PHB</em> and <em>MM4</em>) list all sources and are accessible if any cited sourcebook is enabled in Allowed Sources settings.</li>
                <li><strong>Feat Slots Tracker</strong>: Automatically tracks general feats (1st, 3rd, 6th, etc.), class bonus feats (Fighter, Monk, Wizard), racial bonus feats (Human), and flaw bonus feats.</li>
              </ul>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-filter text-xs"></i> Live Prerequisite Validation Engine
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Evaluates your character&apos;s live state across Base Attack Bonus, Base Saves (Fortitude, Reflex, Will directly from class progression), ability scores, class levels, skill ranks, and prerequisite feats:
              </p>
              <ul className="text-slate-400 text-xs list-disc list-inside space-y-0.5">
                <li>Filter catalog by <strong>Available / Qualified</strong> (meets all requirements) or <strong>Missing Prerequisites</strong>.</li>
                <li>Clear visual badges: green checkmarks for met prerequisites and red warnings for unmet requirements.</li>
              </ul>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-sitemap text-xs"></i> Interactive Feat Dependency Tree Modal
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Click the <strong>Feat Tree</strong> button in the Feats tab to launch the interactive dependency graph viewer:
              </p>
              <ul className="text-slate-400 text-xs list-disc list-inside space-y-0.5">
                <li>Directed dependency trees (e.g. <em>Power Attack</em> &rarr; <em>Cleave</em> &rarr; <em>Great Cleave</em>).</li>
                <li>Status-coded nodes: <strong>Learned (Green)</strong>, <strong>Available (Blue)</strong>, and <strong>Locked (Amber/Red)</strong>.</li>
                <li>Full interactive pan, zoom, search filtering, and slide-out prerequisite & benefit inspection drawer.</li>
              </ul>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-bolt text-xs"></i> Complete Scoundrel Skill Tricks & Traits/Flaws
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Select Skill Tricks costing 2 skill points per trick with rank prerequisites, or assign Unearthed Arcana Traits and Flaws to award bonus feat slots.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'equipment',
      title: 'Equipment & Inventory',
      icon: 'fa-boxes-packing',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-amber-300 font-heading">Equipment, Magic Gear & Carrying Capacity</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm">Equipped Gear Synchronization</h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Equipping armor, shields, weapons, deflection rings, or natural armor amulets automatically updates your active AC breakdown, attack routines, and inventory list.
              </p>
              <p className="font-semibold text-amber-300 text-xs">
                Unequipping gear changes status to &quot;Carried&quot; in inventory without removing the item!
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm">Encumbrance Engine</h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Total carried item weight is calculated against STR-based <strong>Light Load</strong>, <strong>Medium Load</strong>, and <strong>Heavy Load</strong> thresholds, adjusting speed penalties and max DEX caps accordingly.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
            <h4 className="text-amber-400 font-semibold text-sm">Custom Inventory & Currency Tracker</h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              Add custom adventuring gear, potions, scrolls, containers (Backpack, Belt Pouch, Saddlebags), item quantities, individual weights, and coin balances (CP, SP, GP, PP, gems). The inventory table auto-expands naturally without fixed height scrollbar truncation.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'combat-dr',
      title: 'Combat, Vitals & Conditions',
      icon: 'fa-heart-pulse',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-amber-300 font-heading">Tactical Combat Stances, Vitals Tracker & Conditions</h3>

          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
            <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
              <i className="fa-solid fa-heart-pulse text-xs"></i> In-Play Vitals Tracker & Health Status
            </h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              Track real-time combat health with direct adjusters for <strong>Current HP</strong>, <strong>Temporary HP</strong>, and <strong>Nonlethal Damage</strong>:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 font-mono text-xs">
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-2 rounded text-emerald-300 text-center font-bold">Healthy (&gt;50%)</div>
              <div className="bg-amber-950/40 border border-amber-500/30 p-2 rounded text-amber-300 text-center font-bold">Bloodied (&le;50%)</div>
              <div className="bg-orange-950/40 border border-orange-500/30 p-2 rounded text-orange-300 text-center font-bold">Disabled (0 HP)</div>
              <div className="bg-rose-950/40 border border-rose-500/30 p-2 rounded text-rose-300 text-center font-bold">Dying (-1 to -9)</div>
              <div className="bg-red-950/60 border border-red-600/40 p-2 rounded text-red-400 text-center font-bold">Dead (&le;-10)</div>
            </div>
            <p className="text-slate-400 text-xs pt-1">
              Nonlethal damage automatically triggers <em>Staggered</em> when equal to current HP, or <em>Unconscious</em> when exceeding it.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
            <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
              <i className="fa-solid fa-sliders text-xs"></i> Interactive Tactical Combat Banner
            </h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              Located at the top of Sheet View and Equipment tabs, toggle combat conditions in real time during tabletop play:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-xs">
              <div className="bg-slate-950 p-2 rounded border border-slate-800 text-amber-300">Power Attack Slider</div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 text-cyan-300">Fighting Defensively</div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 text-emerald-300">Combat Expertise</div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 text-yellow-300">Haste (+1 Attack/AC)</div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 text-red-300">Flanking (+2 Attack)</div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 text-orange-300">Charge (+2 Atk/-2 AC)</div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 text-purple-300">Barbarian Rage</div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 text-pink-300">Whirling Frenzy</div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 text-blue-300">Flurry of Blows</div>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed pt-1">
              <strong>1-Click Stance Dismissal</strong>: Active combat stances display color-coded badges in the Active Combat Modifiers banner with an <code>x</code> button to instantly turn off any stance.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
            <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
              <i className="fa-solid fa-head-side-virus text-xs"></i> 19 Standard D&D 3.5e Conditions
            </h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              Toggle conditions (<em>Shaken</em>, <em>Frightened</em>, <em>Panicked</em>, <em>Blinded</em>, <em>Entangled</em>, <em>Exhausted</em>, <em>Fatigued</em>, <em>Grappled</em>, <em>Helpless</em>, <em>Nauseated</em>, <em>Pinned</em>, <em>Prone</em>, <em>Sickened</em>, <em>Stunned</em>, <em>Unconscious</em>) with 1 click. Stat deductions automatically flow through to attacks, AC, saving throws, ability scores, and speeds with official fear non-stacking rules.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
            <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
              <i className="fa-solid fa-shield text-xs"></i> Dynamic Damage Reduction (DR) Engine
            </h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              HeroForgeNG evaluates all sources of Damage Reduction (Racial traits, Barbarian DR, Armor enchantments, Feats, Spells, and Templates).
            </p>
            <ul className="text-slate-400 text-xs list-disc list-inside space-y-1">
              <li>Per standard 3.5e rules, DR values with identical bypass conditions do not stack (the highest value applies).</li>
              <li>Distinct bypass conditions (e.g. <code>DR 5/Magic</code> vs <code>DR 3/Adamantine</code> vs <code>DR 5/Evil</code>) are prioritized and summarized clearly in your header pill and combat summary block.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'wildshape',
      title: 'Wild Shape Manager',
      icon: 'fa-paw',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-amber-300 font-heading">Druid Wild Shape Form Manager</h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            For characters with Druid levels, the Wild Shape Form Manager automates animal, plant, and elemental shapechanging with full mechanical stat transformation.
          </p>

          <div className="space-y-3">
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-clock-rotate-left text-xs"></i> Progression & Unlocks
              </h4>
              <ul className="text-slate-300 text-xs space-y-1 list-disc list-inside">
                <li><strong>Uses per Day</strong>: 1/day at 5th level, +1 every 3 levels thereafter (up to 6/day at 18th), plus +2 uses per <em>Extra Wild Shape</em> feat. Duration equals Druid level in hours.</li>
                <li><strong>Size Categories</strong>: Small & Medium at 5th, Large at 8th, Tiny at 11th, and Huge at 15th level.</li>
                <li><strong>Form Types</strong>: Animal forms (5th), Plant forms (12th), Elemental forms (16th), and Huge Elemental forms (20th).</li>
              </ul>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-arrows-rotate text-xs"></i> Dynamic Stat Overrides & Natural Attacks
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Activating any form immediately overrides your physical attributes on the character sheet:
              </p>
              <ul className="text-slate-400 text-xs list-disc list-inside space-y-1">
                <li>Physical Ability Scores: STR, DEX, and CON are replaced by the form&apos;s scores. Hit points automatically recalculate from the new CON modifier.</li>
                <li>Natural Armor bonuses, creature size categories, space/reach, and speeds (Land, Fly, Swim, Burrow) update instantly.</li>
                <li><strong>Natural Attack Routines</strong>: Generates the full attack sequence, calculating BAB, primary full STR damage, and secondary attacks (-5 penalty or -2 with <em>Multiattack</em>, half STR damage).</li>
              </ul>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-plus text-xs"></i> 100+ Built-In Forms & Custom Form Creator
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Filter over 100 official creature forms by size and type, or create custom homebrew forms with tailored stats, attacks, and movement modes.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'resources-rest',
      title: 'Daily Resources & Rest',
      icon: 'fa-hourglass-half',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-amber-300 font-heading">Daily Class Resources & 8-Hour Long Rest</h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            Manage consumable class features, point pools, and spell slots in real time during tabletop sessions.
          </p>

          <div className="space-y-3">
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-battery-half text-xs"></i> Automatic Class Resource Tracking
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950 p-2 rounded border border-slate-800 text-slate-300">
                  <strong className="text-amber-300">Barbarian Rage / Frenzy</strong>: 1 + Lvl/4 uses (+2 per Extra Rage)
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 text-slate-300">
                  <strong className="text-cyan-300">Paladin Lay on Hands</strong>: Level &times; Cha Mod healing pool
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 text-slate-300">
                  <strong className="text-emerald-300">Paladin Smite Evil</strong>: 1 + (Lvl-1)/5 uses (+2 per Extra Smiting)
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 text-slate-300">
                  <strong className="text-yellow-300">Cleric Turn Undead</strong>: 3 + Cha Mod uses (+4 per Extra Turning)
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 text-slate-300">
                  <strong className="text-purple-300">Bardic Music</strong>: Level uses (+4 per Extra Music)
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 text-slate-300">
                  <strong className="text-pink-300">Monk Stunning Fist</strong>: Monk Level uses (+3 per Extra Stunning)
                </div>
              </div>
              <p className="text-slate-400 text-xs pt-1">
                Interactive usage bubbles <code>[●][●][○]</code> allow 1-click charge expenditure directly on the Character Sheet view.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-bed text-xs"></i> 8-Hour Long Rest Automation
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Clicking the <strong>Long Rest (8 Hours)</strong> button triggers a complete tabletop rest reset:
              </p>
              <ul className="text-slate-400 text-xs list-disc list-inside space-y-0.5">
                <li>Restores Current HP to maximum capacity.</li>
                <li>Clears all Nonlethal Damage and Temporary HP.</li>
                <li>Refills all Daily Class Resource tracks and custom pools to maximum.</li>
                <li>Restores all expended spell slots across all spell levels.</li>
                <li>Re-arms all prepared spells (marks them ready for casting).</li>
                <li>Clears temporary status conditions (Fatigued, Exhausted, Shaken).</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'spells-compendium',
      title: 'Spells & Compendium',
      icon: 'fa-hat-wizard',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-amber-300 font-heading">Spells Database, Spellbook & Daily Preparation</h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            HeroForgeNG features a searchable 600+ spell database, spellbook manager, daily preparation workshop, and live slot tracking bubbles.
          </p>

          <div className="space-y-3">
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-book text-xs"></i> 600+ Spell Compendium & Full-Text Search
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Browse core 3.5e spells and supplemental domain spells. Filter by <strong>Class</strong>, <strong>Spell Level (0–9)</strong>, <strong>School</strong>, <strong>Casting Time</strong>, <strong>Saving Throw</strong>, and <strong>Spell Resistance</strong>.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-scroll text-xs"></i> Live Spellbook & Preparation Workshop
              </h4>
              <ul className="text-slate-300 text-xs space-y-1 list-disc list-inside">
                <li><strong>Known Spells</strong>: Add any spell from the compendium into your personal spellbook with 1 click.</li>
                <li><strong>Slot Capacity Math</strong>: Computes base slots by class level plus high ability score bonus spells per PHB Table 1-1.</li>
                <li><strong>Domain & Specialist Slots</strong>: Automatically adds domain bonus slots for Clerics and specialist school bonus slots for Wizards (+1 slot per spell level).</li>
              </ul>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-wand-magic-sparkles text-xs"></i> Live Slot Tracking Bubbles & Cast Buttons
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Click <code>[Cast]</code> on prepared spells to expend slots and update interactive usage bubbles (<code>[●][●][○]</code>) in real time across the Spells tab and Sheet View combat HUD.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-sun text-xs"></i> Active & Passive Auras
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Manage aura emanations (Paladin <em>Aura of Courage</em>, Marshal Auras, Bardic Music, Draconic Auras, Devotion feats) with radius and target tracking.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'dice-tray',
      title: 'Dice Roller & Tray HUD',
      icon: 'fa-dice-d20',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-amber-300 font-heading">Interactive Dice Engine & Dockable Dice Tray HUD</h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            Roll tabletop dice with 1-click sheet targets, weapon threat evaluation, critical auto-confirmation, and a dockable floating dice tray widget.
          </p>

          <div className="space-y-3">
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-hand-pointer text-xs"></i> 1-Click Sheet Rolling
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Click any roll target across the Character Sheet and Equipment views:
              </p>
              <ul className="text-slate-400 text-xs list-disc list-inside space-y-0.5">
                <li><strong>Attacks & Full Attack</strong>: Rolls attack bonus, evaluates weapon threat range, and automatically triggers critical confirmation rolls.</li>
                <li><strong>Damage Rolls</strong>: Rolls weapon damage dice, factoring STR modifiers, two-handed scaling, and active combat stances.</li>
                <li><strong>Saves, Checks & Initiative</strong>: 1-click Fortitude, Reflex, Will, Initiative, Grapple, and Skill check rolls with detailed cause tooltips.</li>
              </ul>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-dice text-xs"></i> Dockable Dice Tray Widget
              </h4>
              <ul className="text-slate-300 text-xs space-y-1 list-disc list-inside">
                <li><strong>Polyhedral Buttons</strong>: 1-click buttons for d4, d6, d8, d10, d12, d20, and d100.</li>
                <li><strong>Custom Formula Bar</strong>: Type arbitrary dice expressions (e.g. <code>2d6+5</code>, <code>1d20+14</code>, <code>4d8-2</code>) and hit Enter.</li>
                <li><strong>Roll History Log</strong>: Review timestamped rolls with natural 20 criticals, natural 1 fumbles, formula breakdowns, and 1-click clipboard copy.</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'artwork-notes',
      title: 'Artwork, Backstory & Zen Mode',
      icon: 'fa-book-bookmark',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-amber-300 font-heading">Character Artwork Showcase, Backstory & Zen Writing Mode</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-image text-xs"></i> Character Artwork Showcase & Lightbox
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                The Notes tab features a high-resolution <strong>Character Artwork Showcase</strong> panel. Click any portrait thumbnail to open the high-res <strong>Lightbox View Modal</strong> for fullscreen artwork inspection.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-expand text-xs"></i> Fullscreen Zen Writing Mode Controls
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Click the Zen Mode icon on the Backstory canvas for a distraction-free writing environment. Toggle text font size between <strong>Small (12px)</strong>, <strong>Default (14px)</strong>, and <strong>Large (16px)</strong> for comfortable writing.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'pets',
      title: 'Companions & Familiars',
      icon: 'fa-paw',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-amber-300 font-heading">Animal Companions & Arcane Familiars</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-paw text-xs"></i> Animal Companion Tab
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Full companion sheet engine for Druids and Rangers featuring:
              </p>
              <ul className="text-slate-400 text-xs list-disc list-inside space-y-0.5">
                <li><strong>Effective Druid Level (EDL)</strong> calculation (halving Ranger levels, applying Beastmaster, prestige classes, and <em>Natural Bond</em> feat up to character level cap).</li>
                <li>106+ extracted base animal companion species.</li>
                <li>Automatic HD scaling, hit points, natural armor, bonus tricks, feat assignment, and skill rank distribution.</li>
                <li><strong>Carrying Capacity Calculator</strong>: Light, Medium, Heavy, Lift, and Drag load math adjusted for Quadruped/Biped size modifiers.</li>
                <li>Custom animal companion creation.</li>
              </ul>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-cat text-xs"></i> Arcane Familiars Tab
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Familiar engine for Wizards and Sorcerers featuring:
              </p>
              <ul className="text-slate-400 text-xs list-disc list-inside space-y-0.5">
                <li>Master level stat scaling (HP equal to half master&apos;s total HP, natural armor increases, Intelligence score scaling).</li>
                <li>Standard familiars (Bat, Cat, Raven, Toad, Weasel, Viper) and Improved Familiars.</li>
                <li>Master granting bonuses (e.g. +3 Alertness, +2 Fortitude saves, +3 Stealth ranks).</li>
                <li>Deliver Touch Spells, Speak with Master, and Spell Resistance tracking.</li>
                <li>Custom familiar entry.</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'export-print',
      title: 'Sheet View & Exporting',
      icon: 'fa-scroll',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-amber-300 font-heading">Character Sheet View, Printing & Roll20 Export</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-print text-xs"></i> Printable Character Sheet View
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Click <strong>Sheet View</strong> or the <strong>Print Sheet</strong> button in the header. The layout renders a clean, high-contrast D&D 3.5e character sheet styled specifically for physical printing or PDF export via browser print dialog. The possessions table auto-expands naturally without max-height clipping.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-dice-d20 text-xs"></i> Roll20 VTT JSON Exporter
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Under the <strong>Export</strong> dropdown, select <strong>Roll20 3.5e Sheet JSON</strong> to generate a formatted character file ready for importing directly into Roll20 Virtual Tabletop character sheets.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'legal-attribution',
      title: 'Legal & OGL Attribution',
      icon: 'fa-scale-balanced',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-amber-300 font-heading">Legal Notices, Open Game License & Attributions</h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            HeroForgeNG is an open-source, client-side fan project and utility tool for tabletop Dungeons & Dragons 3.5th Edition players, provided for non-commercial personal use.
          </p>

          <div className="space-y-3">
            {/* OGL Section 15 Notice */}
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-certificate text-xs"></i> Open Game License v1.0a (OGL 1.0a)
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Portions of the rules content, spells, classes, and mechanics in this application are Open Game Content (OGC) distributed under the terms of the <strong>Open Game License Version 1.0a</strong>.
              </p>
              <div className="bg-slate-950 p-3 rounded-lg font-mono text-[11px] text-slate-300 border border-slate-800/80 space-y-1.5 leading-relaxed">
                <p className="font-bold text-amber-300">OPEN GAME LICENSE Version 1.0a Section 15 Copyright Notice:</p>
                <p>
                  <strong>Open Game License v 1.0a</strong> Copyright 2000, Wizards of the Coast, Inc.
                </p>
                <p>
                  <strong>System Reference Document</strong> Copyright 2000-2003, Wizards of the Coast, Inc.; Authors Jonathan Tweet, Monte Cook, Skip Williams, Rich Baker, Andy Collins, David Noonan, Rich Redman, Bruce R. Cordell, John D. Rateliff, Thomas Reid, James Wyatt, based on original material by E. Gary Gygax and Dave Arneson.
                </p>
              </div>
            </div>

            {/* HeroForge Anew Attribution */}
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-code-fork text-xs"></i> HeroForge Anew Project
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                HeroForgeNG is adapted from and based upon the classic <strong>HeroForge Anew 3.5</strong> spreadsheet project originally created and maintained by <strong>Heliomance</strong> and the broader HeroForge fan community.
              </p>
            </div>

            {/* 3.5e Spell Database & Open-Source Compilers */}
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-book-open text-xs"></i> 3.5e Spell Compendium Dataset Attribution
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                The 3.5e Core Spells database schema and rules descriptions are structured with assistance from open-source 3.5e SRD compiler tools created by <strong>eriq-augustine</strong> (<code>dnd-spell-cards</code>, MIT License).
              </p>
            </div>

            {/* Trademark Disclaimer */}
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-shield-halved text-xs"></i> Trademark & Fair Use Disclaimer
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                <em>Dungeons & Dragons</em>, <em>D&D</em>, <em>Player&apos;s Handbook</em>, <em>Dungeon Master&apos;s Guide</em>, <em>Monster Manual</em>, and Wizards of the Coast are trademarks of Wizards of the Coast LLC, a subsidiary of Hasbro, Inc. This application is not affiliated with, endorsed, sponsored, or approved by Wizards of the Coast LLC.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const filteredSections = sections.filter(sec => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      sec.title.toLowerCase().includes(q) ||
      sec.id.toLowerCase().includes(q)
    );
  });

  const activeContent = sections.find(s => s.id === activeSection) || sections[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg text-slate-950 text-xl font-black">
              <i className="fa-solid fa-circle-question"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-amber-300">HeroForgeNG Documentation & User Guide</h2>
              <p className="text-xs text-slate-400">Complete manual for features, capabilities, and character management (v2.1.0)</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative hidden sm:block w-48 sm:w-64">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-xs text-slate-500"></i>
              <input
                type="text"
                placeholder="Search help topics..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition"
              title="Close Manual"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 bg-slate-950/50 border-r border-slate-800/80 p-3 space-y-1 overflow-y-auto shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-3 mb-2 block">
              Documentation Topics
            </span>
            {filteredSections.map(sec => {
              const isActive = sec.id === activeSection;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 transition ${
                    isActive
                      ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <i className={`fa-solid ${sec.icon} w-4 text-center ${isActive ? 'text-amber-400' : 'text-slate-500'}`}></i>
                  <span className="truncate">{sec.title}</span>
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-y-auto bg-slate-900/40">
            {activeContent.content}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-book-open text-amber-400"></i>
            <span>Detailed Markdown docs available in <code>/docs</code> directory</span>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary text-xs py-1 px-4"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
