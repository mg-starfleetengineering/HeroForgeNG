# HeroForgeNG User Guide (v2.1.0)

Welcome to the **HeroForgeNG User Guide**. HeroForgeNG is a modern, high-performance web application designed for creating, customizing, and managing D&D 3.5e character sheets.

---

## Table of Contents
1. [Getting Started & Character Roster](#1-getting-started--character-roster)
2. [Race, Class, Templates & Wild Shape](#2-race-class-templates--wild-shape)
3. [Ability Scores, SR & Derived Vitals](#3-ability-scores-sr--derived-vitals)
4. [Feats, Prerequisite Engine & Feat Dependency Tree](#4-feats-prerequisite-engine--feat-dependency-tree)
5. [Skills & Synergy Bonuses](#5-skills--synergy-bonuses)
6. [Equipment, Magic Items & Encumbrance](#6-equipment-magic-items--encumbrance)
7. [Tactical Combat Banner, Vitals Tracker & Conditions](#7-tactical-combat-banner-vitals-tracker--conditions)
8. [Daily Class Resources & 8-Hour Long Rest](#8-daily-class-resources--8-hour-long-rest)
9. [Spells Compendium, Spellbook & Preparation Workshop](#9-spells-compendium-spellbook--preparation-workshop)
10. [Click-to-Roll Dice Engine & Dockable Dice Tray HUD](#10-click-to-roll-dice-engine--dockable-dice-tray-hud)
11. [Animal Companions & Familiars](#11-animal-companions--familiars)
12. [Active & Passive Auras](#12-active--passive-auras)
13. [Artwork Showcase, Backstory & Zen Writing Mode](#13-artwork-showcase-backstory--zen-writing-mode)
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

---

## 2. Race, Class, Templates & Wild Shape

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

### Wild Shape Form Manager (Druids)
For characters with Druid levels (5th level and higher), the **Wild Shape Manager** unlocks comprehensive transformation controls directly on the Character Sheet and Daily Resources tracking panels:
- **Form Browser & Filtering**: Browse over 100+ animal, plant, and elemental creature profiles filtered by size (Small, Medium, Large, Tiny, Huge) and creature type.
- **Dynamic Stat Transformation**: Activating a wild shape instantly updates your character sheet:
  - Physical ability scores (STR, DEX, CON) are replaced with the creature's scores while mental attributes (INT, WIS, CHA) are preserved.
  - CON adjustments dynamically recompute maximum Hit Points and Fortitude saves.
  - Natural Armor bonuses, creature size categories, space/reach, and speeds (Land, Fly, Swim, Burrow) override base statistics.
- **Natural Attack Routine Generator**: Computes the creature's full natural attack sequence (e.g. Bite + Claws + Rake), applying proper primary ($1.0 \times \text{STR}$) and secondary ($\text{BAB} - 5$, $0.5 \times \text{STR}$, or $\text{BAB} - 2$ with *Multiattack*) attack penalties and damage formulas.
- **Custom Form Creator**: Define homebrew or monstrous wild shape forms with tailored ability scores, natural armor, speeds, and multi-attack sets.

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

## 4. Feats, Prerequisite Engine & Feat Dependency Tree

Navigate to the **Feats** tab to configure your character's feats, inspect prerequisite chains, view the interactive feat tree, and manage skill tricks, traits, and flaws.

### Canonical Feats Database & Deduplication
- **Deduplicated & Canonical**: All 103 historical dashed pointer records (`-- Feat Name --`) and 3.0e/variant aliases (*Ki Shout* -> *Kiai Shout*, *Remain Conscious* -> *Diehard*, *Superior Expertise* -> *Improved Combat Expertise*) have been resolved into clean canonical records.
- **Multi-Sourcebook Badging**: Feats existing in multiple sourcebooks (e.g. *MM4* and *PHB*) display badges for all citations. If any listed source is enabled in your Allowed Sources preferences, the feat is accessible.
- **Feat Slots Tracker**: Real-time counter tracks and allocates general feat slots (1st, 3rd, 6th, 9th, 12th, 15th, 18th level), class bonus feats (Fighter, Monk, Wizard), racial bonus feats (Human bonus feat), and bonus feats granted by Flaws.

### Live Prerequisite Validation Engine
- The prerequisite validator evaluates your character's live stats, BAB, base saving throws (Base Fortitude, Reflex, and Will bonuses directly from class level tables), class levels, caster levels, and skill ranks:
  - **Available / Qualified Filter**: Filter the feat catalog to show only feats your character currently qualifies to select.
  - **Missing Prerequisites Filter**: View feats you do not yet qualify for, with specific unmet prerequisites highlighted in red.
  - **Inline Prerequisite Badges**: Every feat card clearly indicates satisfied criteria with green checkmarks and missing criteria with red warning markers.

### Interactive Feat Dependency Tree Modal
Click the **Feat Tree** button in the Feats tab to open a full-screen, interactive visual dependency viewer:
- **Directed Graph View**: Renders complex feat progression trees (e.g., *Power Attack* $\rightarrow$ *Cleave* $\rightarrow$ *Great Cleave*; *Point Blank Shot* $\rightarrow$ *Precise Shot* $\rightarrow$ *Shot on the Run*; *Dodge* $\rightarrow$ *Mobility* $\rightarrow$ *Spring Attack*).
- **Interactive Navigation**: Drag to pan across large trees, mouse wheel to zoom in/out, and click any node to center and inspect.
- **Status Coloring**:
  - 🟢 **Green (Learned)**: Feats currently acquired on your character sheet.
  - 🔵 **Blue (Available)**: Feats for which you meet all prerequisites and are eligible to pick.
  - 🟠 **Amber / Red (Locked)**: Feats where one or more prerequisites are missing.
- **Inspection Drawer**: Clicking any feat node opens a detailed sidebar displaying prerequisite breakdowns, rules benefits, normal restrictions, special notes, and sourcebooks.

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

## 7. Tactical Combat Banner, Vitals Tracker & Conditions

The **Active Combat Modifiers Banner** and **Vitals Tracker** provide comprehensive, real-time tactical combat management across Sheet View and Equipment tabs.

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

### In-Play Vitals Tracker & Health States
- **Hit Points Management**: Steppers and direct inputs for **Current HP**, **Temporary HP**, and **Nonlethal Damage**.
- **Dynamic Health Status Badges**:
  - 🟢 **Healthy**: Current HP $> 50\%$ Max HP.
  - 🟡 **Bloodied**: Current HP $\le 50\%$ Max HP.
  - 🟠 **Disabled**: Current HP $= 0$ (or nonlethal damage equals current HP).
  - 🔴 **Dying**: Current HP between $-1$ and $-9$.
  - ⚫ **Dead**: Current HP $\le -10$.

### Active Conditions Engine
Toggle standard D&D 3.5e conditions (*Shaken*, *Frightened*, *Panicked*, *Blinded*, *Entangled*, *Exhausted*, *Fatigued*, *Grappled*, *Helpless*, *Nauseated*, *Pinned*, *Prone*, *Sickened*, *Stunned*, *Unconscious*) with 1 click:
- Automatically deducts attack penalties, AC dodge losses, DEX/STR reductions, saving throw penalties, and movement penalties across the character sheet.
- Fear conditions follow official non-stacking hierarchy (only the highest fear penalty applies).

---

## 8. Daily Class Resources & 8-Hour Long Rest

Manage consumable class powers and point pools directly on the Character Sheet view.

### Daily Class Resources HUD
- **Automatic Resource Tracking**:
  - **Barbarian Rage / Whirling Frenzy**: Daily uses calculated from class level and *Extra Rage* feats.
  - **Paladin Lay on Hands**: Pool capacity calculated from Paladin level $\times$ Charisma modifier.
  - **Paladin Smite Evil**: Daily uses scaled by level and *Extra Smiting* feats.
  - **Cleric Turn Undead**: Daily uses ($3 + \text{CHA Mod}$) scaled by *Extra Turning* feats.
  - **Druid Wild Shape**: Daily uses and unlocked forms scaled by Druid level and *Extra Wild Shape*.
  - **Bardic Music & Monk Stunning Fist**: Usages scaled by level and bonus feats.
- **Interactive Usage Bubbles**: Click bubble indicators (`[●][●][○]`) or step buttons to spend and recover daily charges during encounters.
- **Custom Resource Pools**: Create custom resource definitions (e.g., Ki Points, Action Points, Wand charges) with custom maximums and reset policies.

### 8-Hour Long Rest Automation
Click the **Long Rest (8 Hours)** button in the combat header to execute a complete rest reset:
- Restores character HP to maximum capacity.
- Clears all Nonlethal Damage and Temporary HP.
- Refills all Daily Class Resource tracks and custom pools to full.
- Restores all expended spell slots across all spell levels.
- Re-arms all prepared spells (`[Cast]` $\rightarrow$ ready).
- Automatically clears transient fatigue, exhaustion, and shaken conditions.

---

## 9. Spells Compendium, Spellbook & Preparation Workshop

HeroForgeNG includes a 600+ spell database, searchable compendium, spellbook organizer, daily preparation workshop, and live slot tracker.

### Searchable 3.5e Spell Compendium
- Filter over 600 official spells by **Class**, **Spell Level (0–9)**, **School of Magic**, **Casting Time**, **Saving Throw**, and **Spell Resistance (Yes/No)**.
- Full-text search across spell names and descriptive text.
- Detailed spell inspection drawer displaying components, target/area/effect, duration, and complete rules descriptions.

### Spellbook & Known Spells Manager
- Add spells directly from the Compendium into your character's personal Spellbook or Known Spells list with 1 click.
- Filter known spells by class and level for quick tabletop reference.

### Daily Preparation Workshop
- Computes daily spell slot maximums based on class level and high ability score bonus spells (PHB Table 1-1).
- Integrates Cleric **Domain Bonus Slots** (+1 slot per spell level) and Wizard **Specialist School Bonus Slots** (+1 slot per spell level).
- Assign prepared spells into designated spell slots for the adventuring day.

### In-Play Spell Slot Cast Tracking
- Interactive slot usage bubbles (`[●][●][○]`) displayed on both the Spells tab and Sheet View combat HUD.
- Click `[Cast]` on any prepared spell to expend that slot; click `[Expended]` to restore it.
- Long Rest automatically restores all slots and marks prepared spells ready.

---

## 10. Click-to-Roll Dice Engine & Dockable Dice Tray HUD

Roll attacks, damage, saves, skills, and custom formulas with full tabletop physics logic.

### 1-Click Sheet Rolling
- **Attacks & Arsenal**: Click any weapon or unarmed strike on the Character Sheet or Equipment tab to roll your attack.
- **Critical Threats & Auto-Confirmation**: If your attack roll falls within your weapon's threat range (e.g. 18–20 for Rapier), the dice engine automatically triggers and displays a critical confirmation roll.
- **Damage Rolls**: Click to roll base weapon damage, factoring Strength modifiers, two-handed bonuses, and active stances (Power Attack, Frenzy).
- **Saving Throws, Checks & Initiative**: Click Fortitude, Reflex, Will, Initiative, Grapple, or any Skill to instantly roll d20 + total modifier with cause breakdown tooltips.

### Dockable Dice Tray HUD Widget
- Located in the bottom corner of your screen, click the dice icon to expand the floating/docked **Dice Tray**:
  - **Quick Polyhedral Dice Buttons**: Click `d4`, `d6`, `d8`, `d10`, `d12`, `d20`, or `d100` to roll single or multiple dice.
  - **Custom Expression Bar**: Type arbitrary expressions such as `2d6+5`, `1d20+12`, or `4d8-2` and press Enter to roll.
  - **Roll History Log**: Review a timestamped list of all recent rolls, natural 20 criticals, natural 1 fumbles, and itemized modifier breakdowns.
  - **Copy & Clear**: Copy roll results to your clipboard or clear the log between encounters.

---

## 11. Animal Companions & Familiars

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

## 12. Active & Passive Auras

Manage emanations (Paladin *Aura of Courage*, Marshal Auras, Bardic Music, Draconic Auras, Devotion feats):
- Toggle active vs passive aura states.
- Set aura radius (e.g. 10 ft, 30 ft, 60 ft) and target types (Self, Allies, Enemies).
- Create custom aura effects to share with party members.

---

## 13. Artwork Showcase, Backstory & Zen Writing Mode

Navigate to the **Notes** tab to manage backstory, artwork, and session logs.

### Character Artwork Showcase & Lightbox Modal
- Displays character portrait artwork in a high-resolution presentation frame.
- Click the portrait thumbnail to launch the **Lightbox View Modal** for full-screen artwork inspection.

### Full-Width Backstory Canvas & Zen Mode Text Size Controls
- Click the Zen Mode button on the Backstory canvas for a distraction-free writing environment.
- Toggle text size controls (**Small 12px**, **Default 14px**, **Large 16px**) for comfortable editing.

---

## 14. Character Sheet View, Printing & Roll20 Export

### Printable Character Sheet View & Auto-Expanding Inventory
- Click **Sheet View** or **Print Sheet** in the top header bar.
- Possessions & Adventuring Gear section auto-expands naturally to fit all inventory rows without scrollbar truncation in both on-screen view and printed PDF output.

### Roll20 VTT JSON Export
- Open the **Export** dropdown in the header and select **Roll20 3.5e Sheet JSON**.

