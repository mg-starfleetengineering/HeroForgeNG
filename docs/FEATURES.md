# HeroForgeNG Feature & Engine Specification (v2.1.0)

This document provides a technical overview of the core calculation engines, state storage models, and architecture of **HeroForgeNG**.

---

## 1. Character Roster & Storage Engine (`src/storage/characterStore.ts`)

HeroForgeNG implements a local-first, multi-character storage architecture powered by IndexedDB with automatic fallback to `localStorage`.

### Architecture Highlights
- **IndexedDB Database**: Database `HeroForgeDB` (version 1), Object Store `characters` indexed by `id` and `updatedAt`.
- **Active Character URL Query Sync**: Active character selection persists live in the URL query string (`?characterId=<uuid>`).
- **Legacy Migration (`migration.ts`)**: Automatically upgrades single-character local storage state into the multi-character IndexedDB schema on application boot.
- **Roster Export Package**: Full roster exports create a unified JSON payload (`HeroForgeNG_All_Characters_<date>.json`) supporting batch restoration across devices.

---

## 2. Stat & Math Engine (`src/engine/stats.ts`)

The Stat Engine aggregates all base parameters, racial modifiers, level bumps, item enhancement mods, traits, and flaws into final ability scores, saving throws, hit points, and armor class.

### Key Calculation Functions
- `calculateTotalScore(stat, baseStats, raceMods, levelBumps, enhancementMods, totalLevel, traitFlawStatMods)`: Computes final ability score for a given stat.
- `getAbilityMod(score)`: Returns `Math.floor((score - 10) / 2)`.
- `parseRaceMods(race)`: Parses racial ability score adjustments, size category, land speed, special movement modes, and bonus feats.
- `calculateTraitFlawStatMods(selectedTraits, selectedFlaws, traitsData, flawsData)`: Calculates net stat adjustments from selected traits and flaws.

---

## 3. Dynamic Damage Reduction Engine (`src/engine/dr.ts`)

The DR Engine calculates total effective Damage Reduction from character traits, Barbarian class levels, armor/shield enchantments, feats, spells, and templates.

### Rules Enforcement
- **Non-Stacking Bypasses**: Per D&D 3.5e rules, DR instances with identical bypass conditions (e.g. `DR 2/—` vs `DR 4/—`) do not stack; the highest value applies.
- **Distinct Bypasses**: Distinct bypass conditions (e.g. `DR 5/Magic`, `DR 3/Adamantine`, `DR 5/Evil`, `DR 5/Slashing`) are preserved separately.
- **Header & Widget Summary**: Returns both `bestDRString` for condensed UI badges and `fullDRString` for complete combat tooltips.

---

## 4. Spell Resistance Engine (`src/engine/sr.ts`)

The SR Engine calculates Spell Resistance across racial traits, class features, templates, feats, and active items.

### Key Calculation Logic (`calculateSpellResistance`)
- **Racial SR**: Drow (11 + Total Level), Svirfneblin (11 + Total Level), Elan (9 + Level).
- **Class Features**: Monk *Diamond Soul* (11 + Monk Level).
- **Templates**: Celestial / Fiendish SR (Level + 5 up to template cap).
- **Feats & Items**: *Indomitable Soul*, Mantle of Spell Resistance.
- **Prioritization**: Returns the maximum non-stacking SR value along with source breakdown strings for UI display.

---

## 5. Tactical Combat & Grapple Engine (`src/engine/combat.ts`)

The Tactical Combat Engine computes real-time attack roll bonuses, damage modifiers, AC adjustments, Grapple math, and active stance banner breakdowns.

### Tactical Modifiers
- **Power Attack**:
  - Primary 1-Handed Weapon: -N attack, +N damage.
  - Primary 2-Handed Weapon: -N attack, **+2N damage**.
  - Off-Hand Weapon: -N attack, +0 damage.
- **Fighting Defensively**: -4 attack bonus, +2 Dodge AC (+3 Dodge AC with 5+ ranks in Tumble).
- **Combat Expertise**: -N attack bonus, +N Dodge AC (up to -5/+5 max).
- **Haste**: +1 attack bonus, +1 Dodge AC, +1 Reflex save, +1 extra attack at highest BAB on full attack.
- **Flanking**: +2 melee attack bonus.
- **Charge**: +2 attack bonus, -2 AC penalty.
- **Barbarian Rage**: +4 STR, +4 CON (+2 HP/level), +2 Will saves, -2 AC.
- **Whirling Frenzy**: +4 STR, +2 Dodge AC, +2 Reflex saves, +1 extra attack.
- **Flurry of Blows**: Monk extra attack iteration with flurry penalty scaling.

### Grapple Modifier Calculation (`calculateGrappleMod`)
$$\text{Grapple Mod} = \text{BAB} + \text{STR Mod} + \text{Size Grapple Mod} + \text{Misc Mods}$$
- **Size Grapple Modifiers**: Fine (-16), Diminutive (-12), Tiny (-8), Small (-4), Medium (+0), Large (+4), Huge (+8), Gargantuan (+12), Colossal (+16).

---

## 6. Animal Companion Engine (`src/engine/animal_companion.ts`)

Computes Druid and Ranger Animal Companion statistics, Effective Druid Level (EDL), hit dice scaling, natural armor, bonus tricks, and carrying capacities.

### EDL Formula
$$\text{EDL} = \text{Druid Level} + \lfloor \frac{\text{Ranger Level}}{2} \rfloor + \text{Beastmaster Level} + \text{Natural Bond Feat Mod}$$
- Hard capped at character total level.

---

## 7. Arcane Familiar Engine (`src/engine/familiars.ts`)

Computes familiar stat scaling for Wizards and Sorcerers.

### Master Scaling Rules
- **Hit Points**: Exactly $\lfloor \frac{\text{Master Total HP}}{2} \rfloor$.
- **Natural Armor & INT**: Scales monotonically with Master Level (up to +10 Natural Armor and 15 INT at Level 20).
- **Base Attack & Saves**: Matches Master's base values using familiar's ability modifiers.

---

## 8. Roll20 Export Engine (`src/engine/roll20Export.ts`)

Serializes HeroForgeNG character sheet data into Roll20 D&D 3.5e character sheet JSON format.

---

## 9. Wild Shape Engine (`src/engine/wildshape.ts`)

Computes Druid Wild Shape progression, form database filtering, physical stat overrides, natural armor adjustments, and natural attack routines.

### Progression Math (`getWildShapeProgression`)
- **Daily Uses**: 1/day at 5th level, scaling by +1 every 3 levels (+2 additional uses per *Extra Wild Shape* feat):
  $$\text{Wild Shape Uses} = \begin{cases} 0 & \text{Level} < 5 \\ 1 + \lfloor \frac{\text{Level} - 5}{3} \rfloor + 2 \times \text{Extra Wild Shape Feats} & 5 \le \text{Level} \le 20 \end{cases}$$
- **Size Unlocks**: Small & Medium (5th), Large (8th), Tiny (11th), Huge (15th).
- **Form Types**: Animal forms (5th), Plant forms (12th), Elemental forms (16th), Huge Elemental (20th).
- **Duration**: Exactly $\text{Druid Level}$ hours per wild shape transformation.

### Stat Transformation (`resolveActiveWildShape`)
- **Physical Ability Overrides**: Character STR, DEX, and CON scores are replaced by the chosen creature's base scores. HP recalculates based on the new CON modifier. Mental scores (INT, WIS, CHA) remain unchanged.
- **Natural Armor & Size**: Form's natural armor bonus and size modifier override character base values.
- **Movement Modes**: Overrides Land, Fly (with maneuverability rating), Swim, and Burrow speeds.
- **Natural Attacks (`calculateWildShapeAttacks`)**: Builds the full natural attack routine:
  - **Primary Natural Attack**: Rolled at full BAB + Form STR Modifier + Size Mod + Tactical Modifiers. Deals full STR damage (or $1.5 \times \text{STR}$ if single natural weapon).
  - **Secondary Natural Attacks**: Rolled at $\text{BAB} - 5$ (or $\text{BAB} - 2$ with *Multiattack* feat) + Form STR Modifier + Size Mod. Deals $0.5 \times \text{STR}$ damage.
- **Custom Forms**: Supports user-defined custom wild shape creature profiles with customizable stats, natural attacks, speeds, and special traits.

---

## 10. In-Play Vitals Tracker & Conditions Engine (`src/engine/conditions.ts`)

Tracks dynamic in-play combat vitals, health status thresholds, temporary hit points, nonlethal damage, and 19 standard D&D 3.5e combat conditions with real-time stat deductions.

### Vitals Health Status Model
$$\text{Effective Health Ratio} = \frac{\text{Current HP}}{\text{Max HP}}$$
- **Healthy**: $\text{Current HP} > 50\% \text{ Max HP}$.
- **Bloodied**: $0 < \text{Current HP} \le 50\% \text{ Max HP}$.
- **Disabled**: $\text{Current HP} = 0$ (limited to a single move or standard action per round; strenuous activity deals 1 damage).
- **Dying**: $-1 \ge \text{Current HP} \ge -9$ (unconscious; loses 1 HP each round unless stabilized).
- **Dead**: $\text{Current HP} \le -10$.

### Nonlethal Damage & Temporary HP Mechanics
- **Nonlethal Staggered**: When Nonlethal Damage equals Current HP, the character immediately becomes **Staggered**.
- **Nonlethal Unconscious**: When Nonlethal Damage exceeds Current HP, the character immediately falls **Unconscious**.
- **Temporary HP Buffer**: Incoming damage is first deducted from Temporary HP before depleting Current HP.

### Condition Penalty Aggregation (`calculateConditionPenalties`)
Evaluates 19 standard D&D 3.5e conditions and applies non-stacking rules and cumulative penalties:
- **Fear Hierarchy (Non-Stacking)**: *Shaken* (-2 attacks/saves/checks), *Frightened* (-2 + flee), and *Panicked* (-2 + drop items + flee). The highest active fear condition determines penalties.
- **Physical Impairments**:
  - *Blinded*: -2 AC, loses DEX bonus to AC, -4 penalty on Search and Strength/Dexterity-based skill checks, movement speed halved.
  - *Entangled*: -2 attack bonus, -4 effective DEX, movement speed halved, cannot run or charge.
  - *Exhausted*: -6 effective STR and DEX, movement speed halved.
  - *Fatigued*: -2 effective STR and DEX, cannot run or charge.
  - *Grappled*: -4 effective DEX, cannot move, standard weapon and spell restrictions.
  - *Helpless / Paralyzed*: Effective DEX of 0 (-5 modifier), melee attacks against gain +4 bonus.
  - *Nauseated*: Restricted to a single move action per turn.
  - *Pinned*: Helpless, -4 AC against attacks from outside foes.
  - *Prone*: -4 penalty on melee attack rolls, -4 AC against melee attacks, +4 AC bonus against ranged attacks.
  - *Sickened*: -2 penalty on attack rolls, weapon damage rolls, saving throws, skill checks, and ability checks.
  - *Stunned*: -2 AC, loses DEX bonus to AC, drops held items, takes no actions.

---

## 11. Daily Class Resources & Long Rest Engine (`src/engine/resources.ts`)

Tracks per-day uses and pools for core class abilities, integrates feat bonuses, and powers 1-click 8-Hour Long Rest recovery.

### Resource Calculation Formulas
- **Barbarian Rage / Whirling Frenzy**:
  $$\text{Uses} = 1 + \lfloor \frac{\text{Barbarian Level}}{4} \rfloor + 2 \times \text{Extra Rage Feats}$$
- **Paladin Lay on Hands Pool**:
  $$\text{Healing Pool} = \text{Paladin Level} \times \max(1, \text{CHA Modifier})$$
- **Paladin Smite Evil**:
  $$\text{Uses} = 1 + \lfloor \frac{\text{Paladin Level} - 1}{5} \rfloor + 2 \times \text{Extra Smiting Feats}$$
- **Cleric Turn Undead**:
  $$\text{Uses} = 3 + \text{CHA Modifier} + 4 \times \text{Extra Turning Feats}$$
- **Bard Bardic Music**:
  $$\text{Uses} = \text{Bard Level} + 4 \times \text{Extra Music Feats}$$
- **Monk Stunning Fist**:
  $$\text{Uses} = \text{Monk Level} + 3 \times \text{Extra Stunning Feats}$$
- **Custom Resource Pools**: User-created resource definitions support both per-day use counters (`[●][●][○]`) and point pools with custom recharge intervals.

### 8-Hour Long Rest Automation (`executeLongRest`)
A single click executes the full D&D 3.5e rest recovery routine:
1. Restores Current HP to Max HP.
2. Clears all Nonlethal Damage and Temporary HP.
3. Resets all Daily Class Resource usages to 0 (refilling all pools).
4. Restores all expended spell slots across all spell levels.
5. Re-arms all prepared spells (`cast: false`).
6. Automatically removes transient physical and mental conditions (*Fatigued*, *Exhausted*, *Shaken*).

---

## 12. 3.5e Core Spells Database, Preparation Workshop & Slot Engine (`src/engine/spells.ts`)

Provides a 600+ spell database, multi-class caster progressions, high ability score bonus spells, daily spell preparation, and active cast tracking.

### High Ability Score Bonus Spells (PHB Table 1-1)
$$\text{Bonus Spells}(L) = \max\left(0, \left\lfloor \frac{\text{Ability Modifier} - L}{4} \right\rfloor + 1\right) \quad (\text{if Ability Modifier} \ge L)$$
- Calculated per class using the class's key casting ability: Intelligence (Wizard, Beguiler, Duskblade, Archivist), Wisdom (Cleric, Druid, Ranger, Paladin, Healer), or Charisma (Sorcerer, Bard, Favored Soul, Warmage).

### Spell Save DC Formula
$$\text{Save DC} = 10 + \text{Spell Level} + \text{Key Casting Ability Modifier}$$

### Daily Preparation Workshop & Slot Tracking
- **Preparation Workshop**: Computes available base slots, high ability bonus slots, Cleric domain slots (+1 per spell level), and Wizard specialist school bonus slots (+1 per spell level). Assigns prepared spells from the character's known spellbook.
- **Live Cast Tracking**: Interactive slot usage bubbles `[●][●][○]` directly inside the sheet view combat HUD. Clicking `[Cast]` or `[Expended]` decrements slot capacity in real-time.
- **Multi-Class Support**: Supports up to 23 standard and supplement casting classes simultaneously with distinct caster levels, save DCs, and slot progressions.

---

## 13. Interactive Click-to-Roll Dice Engine (`src/engine/dice.ts`)

Implements client-side dice rolling, formula evaluation, critical threat detection, auto-confirmation rolls, and dockable HUD controls.

### Dice Notation Parsing & Mechanics (`rollDiceFormula`)
- Supports complex dice expressions: `1d20+8`, `3d6+4`, `1d8+2d6+STR`, `2d4-1`.
- **Critical Threat Evaluation**: Compares natural d20 rolls against weapon threat ranges (e.g. 19-20 for Longsword, 18-20 for Rapier, 20 for Greataxe).
- **Auto-Confirming Criticals**: When a critical threat is rolled, the engine automatically rolls a confirmation attack roll (`isConfirmationRoll`) with identical modifiers.
- **Natural 20 & Natural 1 Logic**: Detects automatic hits (Nat 20) and automatic misses/fumbles (Nat 1) on attack rolls and saving throws.
- **Critical Damage Multiplication**: Multiplies weapon base damage dice and flat bonuses according to weapon critical multiplier ($\times 2, \times 3, \times 4$), omitting precision damage per 3.5e rules.

### Click-to-Roll Sheet Integration
- **Attack Routines**: 1-click rolls for main-hand and off-hand attacks, full attack iterations, and damage rolls factoring active stances.
- **Saving Throws**: 1-click Fortitude, Reflex, and Will rolls with tactical breakdowns.
- **Ability Checks & Skills**: 1-click rolls for initiative, grapple checks, ability checks, and skill checks.
- **Dockable Dice Tray HUD Widget (`DiceTrayWidget.tsx`)**: Virtual 3D/flat dice roller tray dockable at the bottom of the screen with quick d4, d6, d8, d10, d12, d20, d100 buttons, custom formula input bar, and timestamped roll history log with copy and clear tools.

---

## 14. Feat Prerequisite Validator & Visual Dependency Tree (`src/engine/featPrereqs.ts`)

Evaluates multi-dimensional prerequisite trees and renders interactive visual dependency graphs.

### Prerequisite Evaluation Pipeline (`validateFeatPrerequisites`)
Validates candidate feats against live character state:
- **Base Attack Bonus (BAB)**: Evaluates minimum required BAB (e.g. BAB +1, BAB +6).
- **Base Saving Throws**: Evaluates Base Fortitude, Reflex, and Will save requirements directly against calculated class progression base saves (e.g. *Great Fortitude*, *Base Fort save +4*).
- **Ability Scores**: Checks minimum raw scores (e.g. Str 13 for *Power Attack*, Dex 15 for *Two-Weapon Fighting*, Int 13 for *Combat Expertise*).
- **Class & Caster Levels**: Evaluates minimum character level, Fighter bonus feat level, arcane/divine caster level, and max spell level castable.
- **Skill Ranks**: Compares invested skill ranks against requirements (e.g. Tumble 5 ranks for *Mobility*).
- **Feat Lineages**: Checks learned feats and resolves alias/canonical variations (e.g. *Point Blank Shot* $\rightarrow$ *Precise Shot* $\rightarrow$ *Shot on the Run*).
- **Special Features & Proficiencies**: Checks Turn Undead, Wild Shape, Sneak Attack, Flurry of Blows, Evasion, and armor/weapon proficiency flags.

### Visual Feat Dependency Tree Modal (`FeatTreeModal.tsx`)
- **Directed Dependency Graph**: Visualizes feat trees with ancestor and child dependency arrows.
- **Live Status Coloring**:
  - **Learned (Green)**: Already acquired by the character.
  - **Available / Qualified (Blue)**: All prerequisites satisfied; eligible for selection.
  - **Locked / Missing Prerequisites (Amber/Red)**: Prerequisites not yet met, displaying missing requirements in red.
- **Interactive Controls**: Pan, zoom, search filtering, feat category filters (General, Fighter, Metamagic, Item Creation, Divine, Wild), and inspection drawer.

---

## 15. Canonical Feat Deduplication, Edition Aliases & Source Filtering (`src/utils/sourceFilter.ts`)

Resolves historical catalog fragmentation, pointer stubs, edition variations, and multi-source publications into a unified, authoritative feat library.

### Canonical Resolution & Stub Stripping
- **103 Cross-Reference Stubs Resolved**: Aggregates all dashed pointer records (`-- Feat Name --`) pointing to primary sourcebooks into singular canonical records.
- **Description Merging**: Selectively preserves specific tactical errata, save DC formulas, action economy types, and penalty modifiers while eliminating redundant pointer text.

### 3.0e & Variant Edition Aliases
Automatically maps legacy 3.0e and campaign variant feat names to their modern 3.5e equivalents:
- *Ki Shout* $\rightarrow$ *Kiai Shout*
- *Remain Conscious* $\rightarrow$ *Diehard*
- *Superior Expertise* $\rightarrow$ *Improved Combat Expertise*
- *Longstrider Elite* $\rightarrow$ *Longstride Elite*
- *Tunnel Fighter* $\rightarrow$ *Tunnel Fighting*

### Multi-Source Inclusions & Allowed Sources Filter
- **Multi-Source Badging**: Feats printed across multiple sourcebooks (e.g. *Complete Warrior* and *Player's Handbook*) retain all source citations in `sources: string[]`.
- **Inclusion Rule**: A feat is allowed and visible if **any** of its published sourcebooks is enabled in the user's Allowed Sources settings.

