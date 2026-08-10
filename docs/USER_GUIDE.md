# HeroForgeNG User Guide

Welcome to the **HeroForgeNG User Guide**. HeroForgeNG is a modern, high-performance web application designed for creating, customizing, and managing D&D 3.5e character sheets.

---

## Table of Contents
1. [Getting Started & Character Roster](#1-getting-started--character-roster)
2. [Race, Class & Level Progression](#2-race-class--level-progression)
3. [Ability Scores & Point Buy Math](#3-ability-scores--point-buy-math)
4. [Feats, Skill Tricks & Traits/Flaws](#4-feats-skill-tricks--traitsflaws)
5. [Skills & Synergy Bonuses](#5-skills--synergy-bonuses)
6. [Equipment, Magic Items & Encumbrance](#6-equipment-magic-items--encumbrance)
7. [Tactical Combat Widget & Damage Reduction](#7-tactical-combat-widget--damage-reduction)
8. [Animal Companions & Familiars](#8-animal-companions--familiars)
9. [Spells & Active/Passive Auras](#9-spells--activepassive-auras)
10. [Character Sheet View, Printing & Roll20 Export](#10-character-sheet-view-printing--roll20-export)

---

## 1. Getting Started & Character Roster

HeroForgeNG stores all character sheets **100% locally** inside your web browser using IndexedDB with fallback to `localStorage`. No server registration or cloud login is required.

### Navigating the Interface
- **Header Bar**: Displays your active character's summary badge: Level, Hit Points (HP), Armor Class (AC), Damage Reduction (DR), Base Attack Bonus (BAB), and Saving Throws (Fortitude, Reflex, Will).
- **Roster Switcher Dropdown**: Click the header summary badge to open the quick-switcher dropdown. Type in the search box to immediately find and switch between saved characters.
- **Roster Dashboard Modal**: Click **Manage Roster** or **View All Cards** to open the full roster dashboard:
  - **New Character**: Initialize a default level 1 character sheet.
  - **Duplicate**: Clone any existing character sheet instantly.
  - **Delete**: Safely remove older or unneeded character sheets.
  - **Export Character**: Save an individual `.json` file for your character.
  - **Export All Roster Backup**: Download a complete single-file backup containing all characters in your roster.
  - **Import**: Restore character JSON files or entire roster backups.
- **URL Synchronization**: Bookmarking or sharing the site URL with `?characterId=<uuid>` automatically loads that exact character upon page load.

---

## 2. Race, Class & Level Progression

Navigate to the **Race & Class** tab to configure your character's race, stacked templates, classes, and divine patron options.

### Selecting Base Race & Racial Overrides
- **Base Race**: Select from over 100+ D&D 3.5e base races (Core, Races of Stone/Destiny/Wild, Eberron, Faerûn, Monster Manual).
- **Racial Override**: Enter custom sub-race titles (e.g. *Catfolk*, *Wild Elf*, *Snow Dwarf*) in the override field without breaking mechanical attribute calculations.
- **Dynamic Stats**: Racial ability adjustments, movement speeds (base, fly, swim, burrow), size categories, and bonus feats automatically update.

### Applying Templates & Level Adjustment (LA)
- Apply official templates such as **Half-Dragon**, **Vampire**, **Celestial**, **Fiendish**, or **Draconic**.
- Template stat bonuses, natural armor additions, alignment changes, and **Level Adjustment (LA)** automatically apply to your totals.

### Class & Level Progression (Up to 4 Classes)
- Distribute up to 20 character levels across up to 4 primary or prestige classes.
- Real-time calculations for:
  - **Base Attack Bonus (BAB)** (Good +1/lvl, Average +0.75/lvl, Poor +0.5/lvl).
  - **Base Saving Throws** (Fortitude, Reflex, Will).
  - **Hit Points (HP)** per level with Constitution modifier scaling.

### Deities, Domains & Pathfinder Skill Toggles
- **Deity & Domain Selection**: Choose your deity and select domain pairs (e.g. *War*, *Sun*, *Good*, *Strength*, *Trickery*) to grant domain powers and domain spell slots.
- **Pathfinder Perception Toggle**: Check the *Use Pathfinder Perception* option to merge Spot, Listen, and Search into a single consolidated Perception skill.

---

## 3. Ability Scores & Point Buy Math

Navigate to the **Stats** tab to manage your character's ability scores (STR, DEX, CON, INT, WIS, CHA).

### Final Ability Score Formula
$$\text{Total Score} = \text{Base} + \text{Racial Mod} + \text{Level Increases} + \text{Enhancement Mod} + \text{Trait/Flaw Mod}$$

### Point Buy & Direct Input Modes
- **Point Buy System**: Choose from 15, 25, 28, 32 (Standard), or 36 point buy budgets. Point costs scale according to standard 3.5 rules (8=0pt, 14=6pt, 18=16pt).
- **4th Level Stat Increments**: Assign point increases awarded at levels 4, 8, 12, 16, and 20 directly in the level bump selectors.
- **Enhancement Bonuses**: Enter enhancement modifiers from items (e.g. *Belt of Giant Strength*, *Headband of Intellect*) to automatically update derived HP, AC, Saves, and Skill modifiers.

---

## 4. Feats, Skill Tricks & Traits/Flaws

Navigate to the **Feats** tab to select feats, skill tricks, traits, and flaws.

### Feat Selection & Prerequisites
- Search hundreds of feats across official sourcebooks (Player's Handbook, Complete Series, Races of..., etc.).
- **Feat Slots Tracker**: Calculates available general feats (Level 1, 3, 6, 9, 12, 15, 18), class bonus feats (Fighter, Monk, Wizard), and racial bonus feats (Human).
- **Prerequisite Validation**: Displays whether your character meets BAB, ability score, or predecessor feat entry requirements.

### Complete Scoundrel Skill Tricks
- Select Skill Tricks (e.g. *Collector of Stories*, *Nimble Stand*, *Point It Out*) costing 2 skill points per trick with rank requirements.

### Unearthed Arcana Traits & Flaws
- Choose character Traits (e.g. *Quick*, *Polite*, *Relentless*) and Flaws (e.g. *Shaky*, *Meager Fortitude*, *Inattentive*) located in the **Race & Class** tab.
- Flaws award additional feat slots while adjusting saving throws, HP, or attack penalties.

---

## 5. Skills & Synergy Bonuses

Navigate to the **Skills** tab to manage skill point allocations.

### Skill Points Calculation
$$\text{Skill Points} = (\text{Base Class Points} + \text{INT Mod}) \times 4 \quad [\text{at Level 1}] + (\text{Base Class Points} + \text{INT Mod}) \quad [\text{per level}]$$
- Humans receive +1 extra skill point per level (+4 at level 1).

### Class vs Cross-Class Ranks
- **Class Skills**: Cost 1 skill point per rank. Maximum rank cap = $\text{Total Level} + 3$.
- **Cross-Class Skills**: Cost 2 skill points per rank. Maximum rank cap = $(\text{Total Level} + 3) / 2$.
- **Synergy Bonuses**: Having 5 or more ranks in specific key skills automatically awards +2 synergy bonuses to related skills (e.g., Tumble $\rightarrow$ Balance & Dodge AC).

---

## 6. Equipment, Magic Items & Encumbrance

Navigate to the **Equipment** tab to equip armor, shields, weapons, and manage inventory.

### Armor & Shield AC Breakdown
- Equip armor (Padded, Leather, Studded Leather, Chain Shirt, Breastplate, Full Plate) and shields (Buckler, Light Wooden, Heavy Shield, Tower Shield).
- Assign enhancement bonuses (+1 to +5). Maximum DEX Caps and Armor Check Penalties (ACP) automatically apply to skill checks and AC.

### Equipment & Inventory Synchronization
- When an item is unequipped, it transitions to **Carried** status in your inventory list rather than being deleted.
- Add custom magic items, potions, scrolls, containers, and coin balances (CP, SP, GP, PP, Gems).

### Encumbrance & Load Limits
- Calculates total carried item weight against STR-based **Light**, **Medium**, and **Heavy** carrying thresholds:
  - **Medium Load**: -2 ACP, Max DEX +3, Speed reduced.
  - **Heavy Load**: -6 ACP, Max DEX +1, Speed reduced.

---

## 7. Tactical Combat Widget & Damage Reduction

The **Tactical Combat Widget** provides interactive real-time combat toggles during play.

### Real-Time Combat Toggles
- **Power Attack Slider**: Set your Power Attack penalty (-1 to -BAB). When wielding a two-handed primary weapon, Power Attack awards **+2 damage per -1 attack penalty**.
- **Fighting Defensively**: Grants +2 Dodge AC (-4 attack penalty), increasing to +3 Dodge AC if you possess 5+ ranks in Tumble.
- **Combat Expertise**: Trade up to -5 attack penalty for +5 Dodge AC.
- **Haste Toggle**: Grants +1 attack bonus, +1 Dodge AC, +1 Reflex save, and +1 extra attack on full attack.
- **Flanking Toggle**: Adds +2 bonus to melee attack rolls.
- **Charge Toggle**: Adds +2 bonus to attack rolls and -2 penalty to AC.

### Dynamic Damage Reduction (DR) Engine
- HeroForgeNG aggregates DR from all active sources (Racial traits, Barbarian class features, Armor enchantments, Feats, and Spells).
- Identical bypass conditions prioritize the highest value. Distinct bypasses (e.g. `DR 5/Magic`, `DR 3/Adamantine`, `DR 5/Evil`) are displayed in the header pill and combat widget.

---

## 8. Animal Companions & Familiars

HeroForgeNG includes dedicated tabs for Druid/Ranger Animal Companions and Wizard/Sorcerer Familiars.

### Animal Companion Tab
- **Effective Druid Level (EDL)**: Calculated automatically using Ranger level halving, Beastmaster prestige levels, and the *Natural Bond* feat up to character level cap.
- **106 Base Species**: Select from wolves, bears, big cats, eagles, dire animals, and exotic companion options.
- **Automatic Scaling**: HD increases, hit points, natural armor, bonus tricks, feat assignment, and skill rank spending.
- **Carrying Capacity**: Calculates Light, Medium, Heavy, Lift, and Drag load limits adjusted for quadruped size multipliers.
- **Custom Companions**: Build custom companion stats directly in the tab.

### Familiars Tab
- **Master Level Scaling**: Familiar natural armor, Intelligence, and Hit Points (half master's total HP) scale with caster level.
- **Master Bonuses**: Automatically grants bonuses to master (e.g. Bat +3 Listen, Cat +3 Stealth, Toad +3 HP).
- **Special Abilities**: Deliver Touch Spells, Speak with Master, and Spell Resistance tracking.

---

## 9. Spells & Active/Passive Auras

### Spells Tab
- Manage spellcasting progression across spellcasting classes.
- Track prepared spells per day, domain bonus slots, and spell save DCs ($10 + \text{Spell Level} + \text{Caster Ability Mod}$).

### Active & Passive Auras Tab
- Manage emanations (Paladin *Aura of Courage*, Marshal Auras, Bardic Music, Draconic Auras, Devotion feats).
- Set aura radius (10 ft, 30 ft, 60 ft) and target types (Self, Allies, Enemies) with active toggles.

---

## 10. Character Sheet View, Printing & Roll20 Export

### Printable Character Sheet View
- Click **Sheet View** or **Print Sheet** in the top header bar.
- Renders a complete high-contrast D&D 3.5e character sheet optimized for physical printing or PDF generation.

### Roll20 VTT JSON Export
- Open the **Export** dropdown in the header and select **Roll20 3.5e Sheet JSON**.
- Generates a formatted JSON file compatible with Roll20 Virtual Tabletop character sheet importers.
