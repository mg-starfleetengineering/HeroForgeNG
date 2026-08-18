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
          <h3 className="text-lg font-bold text-amber-300 font-heading">Getting Started with HeroForgeNG v1.4.0</h3>
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
      title: 'Feats, Skill Tricks & Traits',
      icon: 'fa-award',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-amber-300 font-heading">Feats, Skill Tricks, Traits & Flaws</h3>

          <div className="space-y-3">
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-award text-xs"></i> Feats Database & Prerequisites
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Filter hundreds of official 3.5e feats across Core, Complete Warrior/Divine/Arcane/Adventurer/Scoundrel, Races of..., and Campaign Settings.
              </p>
              <ul className="text-slate-400 text-xs list-disc list-inside space-y-0.5">
                <li>Automatic tracking of available feat slots based on Level, Class bonus feats (Fighter, Monk, Wizard), and Human racial bonus feats.</li>
                <li>Prerequisite indicators show whether your BAB, ability scores, or predecessor feats meet entry criteria.</li>
              </ul>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-bolt text-xs"></i> Complete Scoundrel Skill Tricks
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Unlock tactical maneuver tricks (such as <em>Collector of Stories</em>, <em>Nimble Stand</em>, or <em>Point it Out</em>) costing 2 skill points per trick with rank requirements.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-scale-unbalanced text-xs"></i> Unearthed Arcana Traits & Flaws
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Select character Traits (e.g. <em>Quick</em>, <em>Polite</em>, <em>Relentless</em>) and Flaws (e.g. <em>Shaky</em>, <em>Meager Fortitude</em>, <em>Inattentive</em>) that award extra feat slots while adjusting movement speed, saving throws, HP, or attack rolls.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-hand-sparkles text-xs"></i> Skills & Synergy Bonuses
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Distribute class skill ranks (1 point/rank) and cross-class ranks (2 points/rank). Synergy bonuses (e.g. 5+ ranks in Tumble granting +2 to Balance and Dodge AC during defensive fighting) auto-calculate.
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
      title: 'Tactical Combat & Stances',
      icon: 'fa-swords',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-amber-300 font-heading">Tactical Combat Stances, Active Banner & Cause Breakdowns</h3>

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
              <i className="fa-solid fa-tag text-xs"></i> Stat Cause Breakdowns Across Character Sheet
            </h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              When stances or active buffs modify character statistics, explicit cause annotations display inline across the sheet:
            </p>
            <ul className="text-slate-400 text-xs list-disc list-inside space-y-1">
              <li><strong>Ability Scores</strong>: Displays active modifier source next to score (e.g. <code>18 (+4 Frenzy)</code>, <code>18 (+4 Rage)</code>).</li>
              <li><strong>Saving Throws</strong>: Dedicated <em>Tactical/Misc</em> column breaks down Fortitude, Reflex, and Will stance adjustments.</li>
              <li><strong>Vitals & Attacks</strong>: Inline attack penalties, damage multipliers, AC dodge modifiers, and movement speed adjustments update dynamically.</li>
            </ul>
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
      id: 'spells-auras',
      title: 'Spells & Active Auras',
      icon: 'fa-hat-wizard',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-amber-300 font-heading">Spells, Spellbook & Active Auras</h3>

          <div className="space-y-3">
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-hat-wizard text-xs"></i> Spells Tab & Caster Progression
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Track spellcasting progression across spellcasting classes (Cleric, Druid, Wizard, Sorcerer, Bard, Paladin, Ranger). Select prepared spells per day, domain bonus spell slots, and spell saves DC math (10 + Spell Level + Key Ability Mod).
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h4 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                <i className="fa-solid fa-sun text-xs"></i> Active & Passive Auras Tab
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Manage aura emanations (Paladin <em>Aura of Courage</em>, Marshal Auras, Bardic Music, Draconic Auras, Devotion feats):
              </p>
              <ul className="text-slate-400 text-xs list-disc list-inside space-y-0.5">
                <li>Toggle active vs passive aura states.</li>
                <li>Set aura radius (e.g. 10 ft, 30 ft, 60 ft) and target types (Self, Allies, Enemies).</li>
                <li>Create custom aura effects to share with party members.</li>
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
              <p className="text-xs text-slate-400">Complete manual for features, capabilities, and character management (v1.4.0)</p>
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
