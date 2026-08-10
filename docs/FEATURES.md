# HeroForgeNG Feature & Engine Specification

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

## 4. Tactical Combat Engine (`src/engine/combat.ts`)

The Tactical Combat Engine computes real-time attack roll bonuses, damage modifiers, AC adjustments, and extra attack iterations.

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

---

## 5. Animal Companion Engine (`src/engine/animal_companion.ts`)

Computes Druid and Ranger Animal Companion statistics, Effective Druid Level (EDL), hit dice scaling, natural armor, bonus tricks, and carrying capacities.

### EDL Formula
$$\text{EDL} = \text{Druid Level} + \lfloor \frac{\text{Ranger Level}}{2} \rfloor + \text{Beastmaster Level} + \text{Natural Bond Feat Mod}$$
- Hard capped at character total level.

### Carrying Capacity Math
- Uses standard D&D 3.5 STR-to-carrying capacity table.
- Multiplies capacity based on size category and posture:
  - **Medium Biped**: 1.0x, **Medium Quadruped**: 1.5x
  - **Large Biped**: 2.0x, **Large Quadruped**: 3.0x
  - **Huge Biped**: 4.0x, **Huge Quadruped**: 6.0x
  - **Gargantuan Biped**: 8.0x, **Gargantuan Quadruped**: 12.0x

---

## 6. Arcane Familiar Engine (`src/engine/familiars.ts`)

Computes familiar stat scaling for Wizards and Sorcerers.

### Master Scaling Rules
- **Hit Points**: Exactly $\lfloor \frac{\text{Master Total HP}}{2} \rfloor$.
- **Natural Armor & INT**: Scales monotonically with Master Level (up to +10 Natural Armor and 15 INT at Level 20).
- **Base Attack & Saves**: Matches Master's base values using familiar's ability modifiers.

---

## 7. Roll20 Export Engine (`src/engine/roll20Export.ts`)

Serializes HeroForgeNG character sheet data into Roll20 D&D 3.5e character sheet JSON format.

### Mapped Attributes
- Ability scores, base saves, hit points, speed, armor class components.
- Skill ranks and total skill modifiers.
- Weapon attack sequences, damage formulas, and critical ranges.
- Spell slots per level and class features.
