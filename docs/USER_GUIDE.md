# HeroForgeNG User Guide (v2.0.0)

Welcome to the **HeroForgeNG User Guide**. HeroForgeNG is a modern, high-performance web application designed for creating, customizing, and managing D&D 3.5e character sheets.

---

## Table of Contents
1. [Getting Started & Character Roster](#1-getting-started--character-roster)
2. [Race, Class & Level Progression](#2-race-class--level-progression)
3. [Ability Scores, SR & Derived Vitals](#3-ability-scores-sr--derived-vitals)
4. [Feats, Skill Tricks & Traits/Flaws](#4-feats-skill-tricks--traitsflaws)
5. [Skills & Synergy Bonuses](#5-skills--synergy-bonuses)
6. [Equipment, Magic Items & Encumbrance](#6-equipment-magic-items--encumbrance)
7. [Tactical Combat Banner & Cause Breakdowns](#7-tactical-combat-banner--cause-breakdowns)
8. [Animal Companions & Familiars](#8-animal-companions--familiars)
9. [Spells & Active/Passive Auras](#9-spells--activepassive-auras)
10. [Artwork Showcase, Backstory & Zen Writing Mode](#10-artwork-showcase-backstory--zen-writing-mode)
11. [Character Sheet View, Printing & Roll20 Export](#11-character-sheet-view-printing--roll20-export)

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

---

## 2. Race, Class & Level Progression

Navigate to the **Race & Class** tab to configure your character's race, stacked templates, classes, and divine patron options.

### Selecting Base Race & Racial Overrides
- **Base Race**: Select from over 100+ D&D 3.5e base races (Core, Races of Stone/Destiny/Wild, Eberron, Faerûn, Monster Manual).
- **Racial Override**: Enter custom sub-race titles (e.g. *Catfolk*, *Wild Elf*, *Snow Dwarf*) in the override field without breaking mechanical attribute calculations.
- **Dynamic Stats**: Racial ability adjustments, movement speeds (base, fly, swim, burrow), size categories, and bonus feats automatically update.

### Applying Templates & Level Adjustment (LA)
- Apply official templates such as **Half-Dragon**, **Vampire**, **Celestial**, **Fiendish**, or **Draconic**.
- Template stat bonuses, natural armor additions, alignment changes, Spell Resistance, and **Level Adjustment (LA)** automatically apply to your totals.

### Class & Level Progression (Up to 4 Classes)
- Distribute up to 20 character levels across up to 4 primary or prestige classes.
- Real-time calculations for:
  - **Base Attack Bonus (BAB)** (Good +1/lvl, Average +0.75/lvl, Poor +0.5/lvl).
  - **Base Saving Throws** (Fortitude, Reflex, Will).
  - **Hit Points (HP)** per level with Constitution modifier scaling.

---

## 3. Ability Scores, SR & Derived Vitals

Navigate to the **Stats** tab to manage your character's ability scores (STR, DEX, CON, INT, WIS, CHA).

### Final Ability Score Formula
$$\text{Total Score} = \text{Base} + \text{Racial Mod} + \text{Level Increases} + \text{Enhancement Mod} + \text{Stance Mod} + \text{Trait/Flaw Mod}$$

### Spell Resistance (SR) Engine
- HeroForgeNG evaluates all passive and active sources of Spell Resistance:
  - **Racial SR**: Drow (11 + Level), Svirfneblin (11 + Level), Elan, Spellscale.
  - **Class Features**: Monk *Diamond Soul* (11 + Monk Level).
  - **Templates**: Celestial / Fiendish SR (Level + 5 up to cap).
  - **Feats & Items**: *Indomitable Soul*, Mantle of Spell Resistance.
- Displays maximum active SR in the header pill badge and sheet vitals block.

### Grapple Modifier Calculation
$$\text{Grapple Mod} = \text{BAB} + \text{STR Mod} + \text{Size Grapple Mod} + \text{Misc Mods (Improved Grapple +4)}$$
- **Size Grapple Modifiers**: Fine (-16), Diminutive (-12), Tiny (-8), Small (-4), Medium (+0), Large (+4), Huge (+8), Gargantuan (+12), Colossal (+16).

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
- The inventory table auto-expands naturally without fixed height scrollbars.

---

## 7. Tactical Combat Banner & Cause Breakdowns

The **Active Combat Modifiers Banner** provides interactive real-time combat toggles across Sheet View and Equipment tabs.

### Real-Time Combat Stances
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

---

## 8. Animal Companions & Familiars

HeroForgeNG includes dedicated tabs for Druid/Ranger Animal Companions and Wizard/Sorcerer Familiars.

### Animal Companion Tab
- **Effective Druid Level (EDL)**: Calculated automatically using Ranger level halving, Beastmaster prestige levels, and the *Natural Bond* feat up to character level cap.
- **106 Base Species**: Select from wolves, bears, big cats, eagles, dire animals, and exotic companion options.
- **Automatic Scaling**: HD increases, hit points, natural armor, bonus tricks, feat assignment, and skill rank spending.
- **Carrying Capacity**: Calculates Light, Medium, Heavy, Lift, and Drag load limits adjusted for quadruped size multipliers.

### Familiars Tab
- **Master Level Scaling**: Familiar natural armor, Intelligence, and Hit Points (half master's total HP) scale with caster level.
- **Master Bonuses**: Automatically grants bonuses to master (e.g. Bat +3 Listen, Cat +3 Stealth, Toad +3 HP).

---

## 9. Spells & Active/Passive Auras

### Spells Tab
- Manage spellcasting progression across spellcasting classes.
- Track prepared spells per day, domain bonus slots, and spell save DCs ($10 + \text{Spell Level} + \text{Caster Ability Mod}$).

### Active & Passive Auras Tab
- Manage emanations (Paladin *Aura of Courage*, Marshal Auras, Bardic Music, Draconic Auras, Devotion feats).

---

## 10. Artwork Showcase, Backstory & Zen Writing Mode

Navigate to the **Notes** tab to manage backstory, artwork, and session logs.

### Character Artwork Showcase & Lightbox Modal
- Displays character portrait artwork in a high-resolution presentation frame.
- Click the portrait thumbnail to launch the **Lightbox View Modal** for full-screen artwork inspection.

### Full-Width Backstory Canvas & Zen Mode Text Size Controls
- Click the Zen Mode button on the Backstory canvas for a distraction-free writing environment.
- Toggle text size controls (**Small 12px**, **Default 14px**, **Large 16px**) for comfortable editing.

---

## 11. Character Sheet View, Printing & Roll20 Export

### Printable Character Sheet View & Auto-Expanding Inventory
- Click **Sheet View** or **Print Sheet** in the top header bar.
- Possessions & Adventuring Gear section auto-expands naturally to fit all inventory rows without scrollbar truncation in both on-screen view and printed PDF output.

### Roll20 VTT JSON Export
- Open the **Export** dropdown in the header and select **Roll20 3.5e Sheet JSON**.
