# HeroForgeNG User Guide (v3.0.0)

Welcome to the **HeroForgeNG User Guide**. HeroForgeNG is a modern, high-performance web application designed for creating, customizing, and managing D&D 3.5e character sheets.

---

## Table of Contents
1. [Getting Started & Character Roster](#1-getting-started--character-roster)
2. [Race, Class, Templates & Wild Shape](#2-race-class-templates--wild-shape)
3. [Ability Scores, Spell Resistance & Derived Vitals](#3-ability-scores-spell-resistance--derived-vitals)
4. [Feats, Traits, Flaws & Prerequisite Tree](#4-feats-traits-flaws--prerequisite-tree)
5. [Skills & Skill Tricks](#5-skills--skill-tricks)
6. [Weapons, Armor, Ammunition & Magic Item Slots](#6-weapons-armor-ammunition--magic-item-slots)
7. [Wondrous Items, Possessions & Encumbrance](#7-wondrous-items-possessions--encumbrance)
8. [Tactical Combat Stances, Vitals & Conditions](#8-tactical-combat-stances-vitals--conditions)
9. [Daily Class Resources & Long Rest Automation](#9-daily-class-resources--long-rest-automation)
10. [Spells Compendium, Spellbook & Daily Preparation](#10-spells-compendium-spellbook--daily-preparation)
11. [Click-to-Roll Dice Engine & Virtual Dice Tray](#11-click-to-roll-dice-engine--virtual-dice-tray)
12. [Animal Companions & Arcane Familiars](#12-animal-companions--arcane-familiars)
13. [Auras, Character Artwork & Backstory](#13-auras-character-artwork--backstory)
14. [Character Sheet View, Printing & Roll20 Export](#14-character-sheet-view-printing--roll20-export)

---

## 1. Getting Started & Character Roster

HeroForgeNG stores all character sheets **100% locally** inside your web browser using IndexedDB with fallback to `localStorage`. No server registration or cloud login is required.

### Navigating the Interface
- **Header Bar**: Displays your active character's summary badge: Level, Hit Points (HP), Armor Class (AC), Damage Reduction (DR), Spell Resistance (SR), Base Attack Bonus (BAB), and Saving Throws (Fortitude, Reflex, Will).
- **Roster Switcher Dropdown**: Click the header summary badge to open the quick-switcher dropdown. Type in the search box to immediately find and switch between saved characters.
- **Roster Dashboard Modal**: Click **Manage Roster** or **View All Cards** to open the full roster dashboard:
  - **New Character**: Initialize a default level 1 character sheet.
  - **Duplicate**: Clone any existing character sheet instantly.
  - **Delete**: Safely remove older or unneeded character sheets.
  - **Export Character**: Save an individual `.json` file for your character.
  - **Export All Roster Backup**: Download a complete single-file backup containing all characters in your roster.
  - **Import**: Restore character JSON files or entire roster backups.
- **URL Synchronization**: Bookmarking or sharing the site URL with `?characterId=<uuid>` automatically loads that exact character upon page load.

### Universal Command Palette (`Ctrl+K`)
Press `Ctrl+K` (or `Cmd+K` on macOS) anywhere or click the search icon in the top header to launch the Command Palette:
- **Instant Search**: Rapidly find and jump to navigation tabs, character roster cards, spells, feats, weapons, armor, shields, adventuring gear, and wondrous items.
- **Direct Actions**: Quickly execute actions including *Create New Character*, *Export Active Character JSON*, *Print / Save PDF Character Sheet*, or *Open Help & Documentation*.
- **Keyboard Navigation**: Use Up/Down arrow keys to cycle through matched results, Enter to jump or execute, and category chips (`All`, `Navigation`, `Roster`, `Spells`, `Feats`, `Equipment`, `Actions`) to filter results.

### Undo & Redo History
HeroForgeNG provides full linear state snapshot history for character adjustments:
- **Keyboard Shortcuts**:
  - `Ctrl+Z` (or `Cmd+Z`): Undo the previous change.
  - `Ctrl+Y` or `Ctrl+Shift+Z` (or `Cmd+Shift+Z`): Redo the undone change.
- **Header Controls**: Visual Undo and Redo curved arrow buttons in the top header display tooltips with the specific property modified (e.g. `Undo HP edit`, `Undo Feat selection`).
- **Debounced Editing**: Continuous changes (such as typing notes, dragging sliders, or clicking HP steppers) are automatically debounced (800ms) to avoid cluttering your history stack with single-character steps.
- **History Depth**: Maintains up to 50 historical character states in memory.

---

## 2. Race, Class, Templates & Wild Shape

Navigate to the **Race & Class** tab to configure your character's race, stacked templates, classes, and divine patron options.

### Selecting Base Race & Racial Overrides
- **Base Race**: Select from over 100+ D&D 3.5e base races across Core, Races of Stone/Destiny/Wild, Eberron, Faerûn, and Monster Manual.
- **Racial Override**: Enter custom sub-race titles (e.g. *Catfolk*, *Wild Elf*, *Snow Dwarf*) in the override field without breaking mechanical attribute calculations.
- **Dynamic Stats**: Racial ability adjustments, movement speeds (base, fly, swim, burrow), size categories, and bonus feats automatically update.

### Applying Templates & Level Adjustment (LA)
- Apply official templates such as **Half-Dragon**, **Vampire**, **Celestial**, **Fiendish**, or **Draconic**.
- Template stat bonuses, natural armor additions, alignment changes, Spell Resistance, and **Level Adjustment (LA)** automatically apply to your totals.

### Class & Level Progression (Up to 4 Classes)
- Distribute up to 20 character levels across up to 4 primary or prestige classes.
- Real-time calculations for:
  - **Base Attack Bonus (BAB)**: Good (+1/level), Average (+0.75/level), Poor (+0.5/level).
  - **Base Saving Throws**: Fortitude, Reflex, and Will bonuses computed per class progression table.
  - **Hit Points (HP)**: Scaled per level with Constitution modifier integration.

### Deities, Domains & Pathfinder Skill Toggles
- **Patron Deity & Domains**: Select your deity and divine domains (War, Sun, Healing, Strength) to unlock domain granted powers and domain spell slots.
- **Pathfinder Perception Toggle**: Optional toggle to consolidate Spot, Listen, and Search into a unified *Perception* skill.

### Druid Wild Shape Form Manager
For characters with Druid levels (5th level and higher), the **Wild Shape Manager** unlocks comprehensive transformation controls directly on the Character Sheet and Daily Resources tracking panels:
- **Form Browser & Filtering**: Browse over 100+ animal, plant, and elemental creature profiles filtered by size (Small, Medium, Large, Tiny, Huge) and creature type.
- **Dynamic Stat Transformation**: Activating a wild shape instantly updates your character sheet:
  - Physical ability scores (STR, DEX, CON) are replaced with the creature's scores while mental attributes (INT, WIS, CHA) are preserved.
  - CON adjustments dynamically recompute maximum Hit Points and Fortitude saves.
  - Natural Armor bonuses, creature size categories, space/reach, and speeds (Land, Fly, Swim, Burrow) override base statistics.
- **Natural Attack Routine Generator**: Computes the creature's full natural attack sequence (e.g. Bite + Claws + Rake), applying proper primary (full STR modifier) and secondary (BAB - 5 with half STR modifier, or BAB - 2 with *Multiattack*) attack penalties and damage formulas.
- **Custom Form Creator**: Define homebrew or monstrous wild shape forms with tailored ability scores, natural armor, speeds, and multi-attack sets.

---

## 3. Ability Scores, Spell Resistance & Derived Vitals

Navigate to the **Stats** tab to manage your character's ability scores (STR, DEX, CON, INT, WIS, CHA).

### Ability Scores & Modifiers
- **Score Calculation**:
  $$\text{Total Score} = \text{Base} + \text{Racial Mod} + \text{Level Increases} + \text{Enhancement Mod} + \text{Stance Mod} + \text{Trait/Flaw Mod}$$
- **Ability Modifiers**: Computed as `(Score - 10) / 2 rounded down`.
- **Point Buy Calculator**: Real-time Point Buy cost tracker validating standard 3.5e point buy limits (e.g. 28-point or 32-point buy).

### Spell Resistance (SR)
HeroForgeNG evaluates all passive and active sources of Spell Resistance across your character build:
- **Racial SR**: Drow (11 + Level), Svirfneblin (11 + Level), Elan, Spellscale.
- **Class Features**: Monk *Diamond Soul* (11 + Monk Level).
- **Templates**: Celestial / Fiendish SR (Level + 5 up to cap).
- **Feats & Items**: *Indomitable Soul*, Mantle of Spell Resistance.
- **Header Badge & Breakdown**: Displays maximum active non-stacking SR in the header pill badge and sheet vitals block with source cause tooltip.

### Tabletop Grapple Checks
Calculates full tabletop Grapple modifiers with official size categories and tactical bonuses:
$$\text{Grapple Modifier} = \text{BAB} + \text{STR Mod} + \text{Size Mod} + \text{Misc Mods}$$
- **Size Grapple Modifiers**: Fine (-16), Diminutive (-12), Tiny (-8), Small (-4), Medium (+0), Large (+4), Huge (+8), Gargantuan (+12), Colossal (+16).
- **Misc Modifiers**: Automatically incorporates feats like *Improved Grapple* (+4).
- **1-Click Rolling**: Grapple modifier is directly clickable in the Sheet View for instant d20 rolling.

---

## 4. Feats, Traits, Flaws & Prerequisite Tree

Navigate to the **Feats** tab to configure your character's feats, traits, flaws, and sourcebook visibility.

### Feats Catalog & Allowed Sources Filtering
- **Canonical Database & Deduplication**: All historical dashed pointer records (`-- Feat Name --`) and 3.0e/variant aliases (*Ki Shout* → *Kiai Shout*, *Remain Conscious* → *Diehard*, *Superior Expertise* → *Improved Combat Expertise*) have been resolved into clean canonical records.
- **Multi-Sourcebook Badging**: Feats existing in multiple sourcebooks (e.g. *MM4* and *PHB*) display badges for all citations. If any listed source is enabled in your Allowed Sources preferences, the feat is accessible.
- **Feat Slots Tracker**: Real-time counter tracks and allocates general feat slots (1st, 3rd, 6th, 9th, 12th, 15th, 18th level), class bonus feats (Fighter, Monk, Wizard), racial bonus feats (Human bonus feat), and bonus feats granted by Flaws.

### Live Feat Prerequisite Validator
The prerequisite validator evaluates your character's live stats, BAB, base saving throws (Fortitude, Reflex, and Will bonuses directly from class level tables), class levels, caster levels, and skill ranks:
- **Available / Qualified Filter**: Filter the feat catalog to show only feats your character currently qualifies to select.
- **Missing Prerequisites Filter**: View feats you do not yet qualify for, with specific unmet prerequisites highlighted in red.
- **Inline Prerequisite Badges**: Every feat card clearly indicates satisfied criteria with green checkmarks and missing criteria with red warning markers.

### Interactive Feat Dependency Tree Modal
Click the **Feat Tree** button in the Feats tab to open a full-screen, interactive visual dependency viewer:
- **Directed Graph View**: Renders complex feat progression trees (e.g. *Power Attack* → *Cleave* → *Great Cleave*; *Point Blank Shot* → *Precise Shot* → *Shot on the Run*; *Dodge* → *Mobility* → *Spring Attack*).
- **Interactive Navigation**: Drag to pan across large trees, mouse wheel to zoom in/out, and click any node to center and inspect.
- **Status Coloring**:
  - 🟢 **Green (Learned)**: Feats currently acquired on your character sheet.
  - 🔵 **Blue (Available)**: Feats for which you meet all prerequisites and are eligible to pick.
  - 🟠 **Amber / Red (Locked)**: Feats where one or more prerequisites are missing.
- **Inspection Drawer**: Clicking any feat node opens a detailed sidebar displaying prerequisite breakdowns, rules benefits, normal restrictions, special notes, and sourcebooks.

### Unearthed Arcana Traits & Flaws
- **Character Traits**: Choose up to 2 traits (e.g. *Quick*, *Polite*, *Relentless*, *Abrasive*) providing balanced minor bonuses and penalties.
- **Character Flaws**: Choose up to 2 flaws (e.g. *Shaky*, *Meager Fortitude*, *Inattentive*, *Vulnerable*). Each selected flaw awards 1 additional general feat slot at 1st level.

---

## 5. Skills & Skill Tricks

Navigate to the **Skills** tab to manage skill point allocations and skill tricks.

### Skill Points Calculation
$$\text{Skill Points} = (\text{Base Class Points} + \text{INT Mod}) \times 4 \quad [\text{at 1st Level}] + (\text{Base Class Points} + \text{INT Mod}) \quad [\text{per level}]$$
- Humans receive +1 extra skill point per level (+4 at 1st level).

### Class vs Cross-Class Ranks
- **Class Skills**: Cost 1 skill point per rank. Maximum rank cap = character level + 3.
- **Cross-Class Skills**: Cost 2 skill points per rank. Maximum rank cap = (character level + 3) / 2.
- **Synergy Bonuses**: Having 5 or more ranks in specific key skills automatically awards +2 synergy bonuses to related skills (e.g. Tumble → Balance & Dodge AC).

### Complete Scoundrel Skill Tricks
- **Skill Tricks Catalog**: Browse tricks from *Complete Scoundrel* (e.g. *Collector of Stories*, *Nimble Stand*, *Point It Out*, *Spot the Weak Point*).
- **Point Cost & Prerequisites**: Each trick costs 2 skill points with specific minimum rank prerequisites. Maximum skill tricks allowed equals half your character level (rounded down).

---

## 6. Weapons, Armor, Ammunition & Magic Item Slots

Navigate to the **Equipment** tab to equip primary weapons, armor, shields, and manage magic item body slots.

### Weapons, Armor & Shield Defense
- Equip armor (Padded, Leather, Studded Leather, Chain Shirt, Breastplate, Full Plate) and shields (Buckler, Light Wooden, Heavy Shield, Tower Shield).
- Assign enhancement bonuses (+1 to +5) and special materials (Mithral, Adamantine, Darkwood). Maximum DEX Caps and Armor Check Penalties (ACP) automatically apply to skill checks and AC.

### Weapon Special Qualities & Bane Weapons
- Equip melee and ranged weapons from the standard 3.5e arsenal or configure custom weapons.
- Configure weapon special qualities such as **Bane**. When Bane is active, select the designated target creature type (e.g. *Aberrations*, *Undead*, *Dragons*, *Evil Outsiders*). Combat attack rolls automatically receive a +2 attack bonus and add an extra +2d6 damage to structured damage pools against that foe.

### Ammunition Tracking & Quiver Management
- Ranged weapons automatically identify linked ammunition in your inventory (arrows, crossbow bolts, sling bullets, shuriken).
- Direct spend and recover steppers on both the Equipment tab and Character Sheet combat HUD allow 1-click ammunition expenditure during tabletop battle with low-stock warnings.

### Magic Item Body Slots & Conflict Detection
HeroForgeNG implements the official 14 D&D 3.5e magic item body slots architecture:
- **Slots**: Head, Headband/Eyes, Neck, Shoulders, Armor, Body/Robe, Chest/Vest, Hands, Arms/Bracers, Waist, Feet, Ring 1, Ring 2, and Slotless.
- **Slot Affinities**: Each slot lists standard magical affinities (e.g. Neck for natural armor and defensive wards; Waist for Strength and physical attribute buffs).
- **Dual-Item Slot Conflict Alerts**: Equipping two items to the same slot triggers an amber warning indicator identifying the conflicting items.

---

## 7. Wondrous Items, Possessions & Encumbrance

### Wondrous Items Compendium
- Browse and search an extensive compendium of over 1,000 wondrous items from *DMG*, *Magic Item Compendium*, *Complete Arcane*, and *Races of Destiny*.
- Filter by body slot or free-form text search. Clicking **Equip** instantly binds the item to the appropriate body slot and synchronizes it into your active inventory.

### Possessions, Encumbrance & Currency
- When an item is unequipped, it transitions to **Carried** status in your inventory rather than being deleted.
- Add custom adventuring gear, potions, scrolls, containers, and coin balances (CP, SP, GP, PP, Gems).
- Total carried weight is evaluated against Strength-based Light, Medium, and Heavy load thresholds, adjusting speed penalties and max DEX caps.
- The inventory possessions table auto-expands naturally without fixed height scrollbars.

---

## 8. Tactical Combat Stances, Vitals & Conditions

The **Active Combat Modifiers Banner** provides real-time tactical combat management across Sheet View and Equipment tabs.

### Tactical Combat Stances & Active Modifiers
- **Power Attack Slider**: Set your Power Attack penalty (-1 to -BAB). When wielding a two-handed primary weapon, Power Attack awards **+2 damage per -1 attack penalty**.
- **Fighting Defensively**: Grants +2 Dodge AC (-4 attack penalty), increasing to +3 Dodge AC if you possess 5+ ranks in Tumble.
- **Combat Expertise**: Trade up to -5 attack penalty for +5 Dodge AC.
- **Haste**: Grants +1 attack bonus, +1 Dodge AC, +1 Reflex save, and +1 extra attack on full attack.
- **Flanking**: Adds +2 bonus to melee attack rolls.
- **Charge**: Adds +2 bonus to attack rolls and -2 penalty to AC.
- **Barbarian Rage**: Grants +4 STR, +4 CON (+2 HP/level), +2 Will saves, and -2 AC.
- **Whirling Frenzy**: Grants +4 STR, +2 Dodge AC, +2 Reflex saves, and 1 extra attack.
- **Flurry of Blows**: Grants extra monk attack iteration with flurry penalty math.

### 1-Click Stance Dismissal & Inline Stat Cause Breakdowns
- **Inline Dismissal (`x`)**: Active stances display color-coded badges in the Active Combat Modifiers banner with an `x` button to turn off any stance instantly.
- **Stat Cause Breakdowns**: Displays explicit cause annotations inline across the character sheet:
  - **Ability Scores**: Shows active stance modifiers next to base score (e.g. `18 (+4 Frenzy)`).
  - **Saving Throws**: Dedicated *Tactical/Misc* column breaks down Fortitude, Reflex, and Will stance adjustments.
  - **Vitals & Attacks**: Attack penalties, damage multipliers, AC dodge bonuses, and speed changes update dynamically.

### In-Play Vitals Tracker & Health States
Manage real-time health and damage thresholds during encounters:
- **Hit Points Management**: Steppers and direct inputs for **Current HP**, **Temporary HP**, and **Nonlethal Damage**.
- **Dynamic Health Status Badges**:
  - 🟢 **Healthy**: Current HP > 50% Max HP.
  - 🟡 **Bloodied**: Current HP <= 50% Max HP.
  - 🟠 **Disabled**: Current HP = 0 (or nonlethal damage equals current HP).
  - 🔴 **Dying**: Current HP between -1 and -9.
  - ⚫ **Dead**: Current HP <= -10.
- **Damage Buffering**: Damage is automatically deducted from Temporary HP before Current HP.

### Conditions & Status Effects
Toggle standard D&D 3.5e conditions (*Shaken*, *Frightened*, *Panicked*, *Blinded*, *Entangled*, *Exhausted*, *Fatigued*, *Grappled*, *Helpless*, *Nauseated*, *Pinned*, *Prone*, *Sickened*, *Stunned*, *Unconscious*) with 1 click:
- Automatically deducts attack penalties, AC dodge losses, DEX/STR reductions, saving throw penalties, and movement penalties across the character sheet.
- Fear conditions follow official non-stacking hierarchy (only the highest fear penalty applies).

---

## 9. Daily Class Resources & Long Rest Automation

Manage consumable class powers and point pools directly on the Character Sheet view.

### Daily Class Resources
- **Barbarian Rage / Whirling Frenzy**: Daily uses calculated from class level and *Extra Rage* feats.
- **Paladin Lay on Hands**: Pool capacity calculated from Paladin level × Charisma modifier.
- **Paladin Smite Evil**: Daily uses scaled by level and *Extra Smiting* feats.
- **Cleric Turn Undead**: Daily uses (3 + CHA modifier) scaled by *Extra Turning* feats.
- **Druid Wild Shape**: Daily uses and unlocked forms scaled by Druid level and *Extra Wild Shape*.
- **Bardic Music & Monk Stunning Fist**: Usages scaled by level and bonus feats.
- **Interactive Usage Bubbles**: Click bubble indicators (`[●][●][○]`) or step buttons to spend and recover daily charges during encounters.
- **Custom Resource Pools**: Create custom resource definitions (e.g., Ki Points, Action Points, Wand charges) with custom maximums and reset policies.

### Long Rest Automation
Click the **Long Rest (8 Hours)** button in the combat header to execute a complete rest reset:
- Restores character HP to maximum capacity.
- Clears all Nonlethal Damage and Temporary HP.
- Refills all Daily Class Resource tracks and custom pools to full.
- Restores all expended spell slots across all spell levels.
- Re-arms all prepared spells (`[Cast]` → Ready).
- Automatically clears transient fatigue, exhaustion, and shaken conditions.

---

## 10. Spells Compendium, Spellbook & Daily Preparation

### 3.5e Spells Compendium & Search
- Filter over 600 official spells by **Class**, **Spell Level (0–9)**, **School of Magic**, **Casting Time**, **Saving Throw**, and **Spell Resistance (Yes/No)**.
- Full-text search across spell names and descriptive text.
- Detailed spell inspection drawer displaying components, target/area/effect, duration, and complete rules descriptions.

### Spellbook & Daily Preparation Workshop
- **Spellbook & Known Spells Manager**: Add spells directly from the Compendium into your character's personal Spellbook or Known Spells list with 1 click.
- **Daily Preparation Workshop**:
  - Computes daily spell slot maximums based on class level and high ability score bonus spells (PHB Table 1-1).
  - Integrates Cleric **Domain Bonus Slots** (+1 slot per spell level) and Wizard **Specialist School Bonus Slots** (+1 slot per spell level).
  - Assign prepared spells into designated spell slots for the adventuring day.

### In-Play Spell Slot Cast Tracking
- Interactive slot usage bubbles (`[●][●][○]`) displayed on both the Spells tab and Sheet View combat HUD.
- Click `[Cast]` on any prepared spell to expend that slot; click `[Expended]` to restore it.
- Long Rest automatically restores all slots and marks prepared spells ready.

---

## 11. Click-to-Roll Dice Engine & Virtual Dice Tray

Roll attacks, damage, saves, skills, and custom formulas with full tabletop physics logic directly from sheet targets.

### One-Click Dice Rolling
- **Attacks & Arsenal**: Click any weapon or unarmed strike on the Character Sheet or Equipment tab to roll your attack.
- **Critical Threats & Auto-Confirmation**: If your attack roll falls within your weapon's threat range (e.g. 18–20 for Rapier), the dice engine automatically triggers and displays a critical confirmation roll.
- **Damage Rolls**: Click to roll base weapon damage, factoring Strength modifiers, two-handed bonuses, and active stances (Power Attack, Frenzy).
- **Saving Throws, Checks & Initiative**: Click Fortitude, Reflex, Will, Initiative, Grapple, or any Skill to instantly roll d20 + total modifier with cause breakdown tooltips.

### Virtual Dice Tray
Located in the bottom corner of your screen, click the dice icon to expand the floating/docked **Dice Tray**:
- **Quick Polyhedral Dice Buttons**: Click `d4`, `d6`, `d8`, `d10`, `d12`, `d20`, or `d100` to roll single or multiple dice.
- **Custom Expression Bar**: Type arbitrary expressions such as `2d6+5`, `1d20+12`, or `4d8-2` and press Enter to roll.
- **Roll History Log**: Review a timestamped list of all recent rolls, natural 20 criticals, natural 1 fumbles, and itemized modifier breakdowns.
- **Copy & Clear**: Copy roll results to your clipboard or clear the log between encounters.

---

## 12. Animal Companions & Arcane Familiars

### Druid & Ranger Animal Companions
- **Effective Druid Level (EDL)**: Calculated automatically using Ranger level halving, Beastmaster prestige levels, and the *Natural Bond* feat up to character level cap.
- **100+ Base Species**: Select from wolves, bears, big cats, eagles, dire animals, and exotic companion options.
- **Automatic Scaling**: HD increases, hit points, natural armor, bonus tricks, feat assignment, and skill rank spending.
- **Carrying Capacity**: Calculates Light, Medium, Heavy, Lift, and Drag load limits adjusted for quadruped size multipliers.

### Wizard & Sorcerer Familiars
- **Master Level Scaling**: Familiar natural armor, Intelligence, and Hit Points (half master's total HP) scale with caster level.
- **Master Bonuses**: Automatically grants bonuses to master (e.g. Bat +3 Listen, Cat +3 Stealth, Toad +3 HP).
- **Special Abilities**: Tracks Deliver Touch Spells, Speak with Master, and Spell Resistance.

---

## 13. Auras, Character Artwork & Backstory

### Active & Passive Auras
Manage emanations (Paladin *Aura of Courage*, Marshal Auras, Bardic Music, Draconic Auras, Devotion feats):
- Toggle active vs passive aura states.
- Set aura radius (e.g. 10 ft, 30 ft, 60 ft) and target types (Self, Allies, Enemies).
- Create custom aura effects to share with party members.

### Character Artwork & Lightbox
- Displays character portrait artwork in a high-resolution presentation frame in the Notes tab.
- Click the portrait thumbnail to launch the **Lightbox View Modal** for full-screen artwork inspection.

### Backstory, Campaign Journal & Zen Writing Mode
- Click the Zen Mode button on the Backstory canvas for a distraction-free writing environment.
- Toggle text size controls (**Small 12px**, **Default 14px**, **Large 16px**) for comfortable editing.
- Manage campaign notes, quest logs, and character journal entries.

---

## 14. Character Sheet View, Printing & Roll20 Export

### Printable Character Sheet View
- Click **Sheet View** or **Print Sheet** in the top header bar.
- The layout renders a clean, high-contrast D&D 3.5e character sheet styled specifically for physical printing or PDF export via browser print dialog.
- Possessions & Adventuring Gear section auto-expands naturally to fit all inventory rows without scrollbar truncation in both on-screen view and printed PDF output.

### Roll20 VTT JSON Export
- Open the **Export** dropdown in the header and select **Roll20 3.5e Sheet JSON**.
- Generates a formatted JSON payload tailored for 1-click import into Roll20 D&D 3.5e campaign character sheets.
