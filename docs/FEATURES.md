# HeroForgeNG Feature & Engine Specification (v2.0.0)

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
