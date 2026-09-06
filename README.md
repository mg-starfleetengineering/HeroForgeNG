# HeroForgeNG (HeroForge-Anew Web Edition v2.1.0)

> **HeroForgeNG** is a modern, high-performance web application designed for **Dungeons & Dragons 3.5e** character creation, tactical combat management, and multi-character roster storage.

Built with **React 18**, **Vite**, **TypeScript**, and **Tailwind CSS**, HeroForgeNG ports and vastly expands upon the classic D&D 3.5e HeroForge Anew spreadsheet into a 100% local-first web application.

---

## 🌟 Key Features & Capabilities (v2.1.0)

- 📜 **Complete Feat Deduplication & Multi-Source Filtering**: 100% resolution of dashed/pointer feats and 3.0e/variant aliases into canonical records, multi-sourcebook filtering (enabled if any sourcebook is allowed), smart gameplay description merging, and Base Save prerequisite evaluation.
- 🌳 **Interactive Feat Dependency Tree & Prerequisite Validator**: Visual node-based prerequisite graph modal with live search, dependency lineage inspection, and prerequisite validation (BAB, base saves, ability scores, class levels, skill ranks, caster levels).
- 🎲 **Interactive Click-to-Roll Dice Engine & Dockable Dice Tray HUD**: 1-click rolling for attacks, damage, saves, skills, ability checks, and grapple directly from character sheet and equipment views; critical threat & auto-confirmation math, nat 20/1 detection, customizable virtual dice tray with formula parsing (`1d20+8`, `3d6+STR`) and roll history log.
- 📖 **3.5e Core Spells Compendium, Live Spellbook & Daily Preparation Workshop**: 600+ official PHB/SRD spells searchable by school, level, casting time, and component; daily preparation workshop with class level slot formulas, bonus spells from high ability scores (PHB Table 1-1), domain slots, and wizard specialist slots.
- ✨ **Active Spell Slot Cast Tracking & Long Rest Sync**: Dynamic active spell slot tracking engine with interactive usage bubbles `[●][●][○]`, 1-click `[Cast]` toggles, spend/restore steppers, and automated Long Rest sync.
- ⚡ **Daily Class Resources & Usage Tracking HUD**: Unified combat tracking section housing active ability usages (Rage, Lay on Hands, Smite, Turn Undead, Wild Shape, Stunning Fist, etc.), resource pools, and spell slots directly on the Character Sheet view.
- ❤️ **In-Play Vitals Tracker & Conditions Engine**: Real-time current/max/temp HP tracker with nonlethal damage calculations, dynamic health status badges (Healthy, Bloodied, Disabled, Dying, Dead), and 19 standard D&D 3.5e conditions with automated stat penalties.
- 🐾 **Wild Shape Form Manager**: Full Druid Wild Shape engine featuring 100+ animal/plant/elemental forms, progression scaling (uses/day, sizes Small-Huge, elemental forms), physical ability score overrides, natural armor, speeds, and natural attack routines.
- ⚔️ **Active Combat Stances Banner & Stat Cause Breakdowns**: Real-time active combat modifiers banner (Power Attack, Fighting Defensively, Combat Expertise, Haste, Whirling Frenzy, Barbarian Rage, Flurry of Blows, Flanking, Charge) with color-coded stance badges and 1-click inline stance dismissal (`x`). Explicit cause breakdowns displayed inline across Ability Scores, Saves, Vitals, and Attacks.
- 🔮 **Spell Resistance (SR) & Grapple Engines**: Comprehensive SR engine aggregating racial traits (Drow SR 11+Lvl, Svirfneblin, Elan), templates, feats (*Diamond Soul*, *Indomitable Soul*), and spell effects. Full D&D 3.5e Grapple modifier calculation with size category scaling (-16 Fine to +16 Colossal).
- 🎨 **Character Artwork Showcase & Zen Writing Mode**: High-res portrait presentation panel in Notes tab with 1-click **Lightbox view modal** for full-screen inspection. Fullscreen Zen writing mode with font size controls (Small 12px, Default 14px, Large 16px).
- 🛡️ **Multi-Character Roster System**: Client-side IndexedDB storage with `localStorage` fallback. Switch characters via the header summary badge or dashboard modal. Full single-file roster backup export/import.
- 🧬 **Race, Multi-Classing & Stacked Templates**: 100+ base races, custom Racial Overrides, up to 4 main/prestige classes, stacked templates (Half-Dragon, Vampire, Celestial, Draconic), deity & domain selection, and Pathfinder Perception toggle.
- 🐾 **Animal Companions & Familiars**: Dedicated Animal Companion tab for Druids/Rangers with Effective Druid Level (EDL) math, 106 species, companion carrying capacity loads (Light/Medium/Heavy/Lift/Drag), and Arcane Familiar tab with master scaling.
- 📜 **Complete Scoundrel Skill Tricks & Traits/Flaws**: Skill tricks rank validator, Unearthed Arcana traits and flaws.
- 🖨️ **Printable Sheet View & Roll20 VTT Export**: High-contrast printable D&D 3.5e character sheet with auto-expanding possessions inventory table and Roll20 3.5e sheet JSON exporter.
- ❓ **In-App Help & Manual**: Built-in interactive documentation modal accessible via the `?` icon in the top header.

---

## 📚 Documentation Suite

Comprehensive documentation is available in both the app's `?` Help menu and the repository [`docs/`](./docs) folder:

- **[User Guide](./docs/USER_GUIDE.md)**: Full step-by-step user guide for character creation, equipment, companions, active combat stances, and printing.
- **[Features & Core Engines](./docs/FEATURES.md)**: Technical reference for stat math, DR calculation, tactical combat formulas, SR engine, Grapple math, EDL math, and storage.
- **[Data Extraction Pipeline](./docs/DATA_EXTRACTION.md)**: Guide to Python scripts extracting D&D 3.5 content from Excel into `src/data/` JSONs.
- **[Developer Guide](./docs/DEVELOPMENT.md)**: Development setup, WSL 2 rules, building, and running Vitest unit tests.

---

## 🚀 Quickstart & WSL 2 Setup

Per project rules, execute all Node/npm/Vite commands inside **WSL Ubuntu**:

```bash
# Clone or navigate to the repository inside WSL Ubuntu
cd /mnt/c/Users/shado/.git/HeroForge-Anew

# Install dependencies
wsl -d Ubuntu bash -c "cd /mnt/c/Users/shado/.git/HeroForge-Anew && npm install"

# Start dev server
wsl -d Ubuntu bash -c "cd /mnt/c/Users/shado/.git/HeroForge-Anew && npx vite --host 0.0.0.0 --port 5173"
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing & Production Build

```bash
# Run unit tests
wsl -d Ubuntu bash -c "cd /mnt/c/Users/shado/.git/HeroForge-Anew && npm run test"

# Build static production bundle into dist/
wsl -d Ubuntu bash -c "cd /mnt/c/Users/shado/.git/HeroForge-Anew && npm run build"
```

---

## 📜 License & Credits

- Based on the original **HeroForge Anew** project by Heliomance.
- Dungeons & Dragons is a trademark of Wizards of the Coast LLC.
