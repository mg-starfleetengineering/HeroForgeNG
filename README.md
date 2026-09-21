# HeroForgeNG (HeroForge-Anew Web Edition v3.0.0)

> **HeroForgeNG** is a modern web application designed for **Dungeons & Dragons 3.5e** character creation, tactical combat management, and multi-character roster storage.

Built with **React 19**, **Vite 8**, **TypeScript**, **Tailwind CSS v4**, **Vitest 5**, and **Zod**, HeroForgeNG ports the classic D&D 3.5e HeroForge Anew spreadsheet into a local-first web application.

---

## 🌟 Key Features & Capabilities (v3.0.0)

- ⌨️ **Universal Command Palette (`Ctrl+K` / `Cmd+K`)**: Jump quickly to tabs, character roster entries, compendium items, spells, and feats with fuzzy search and keyboard navigation.
- ↩️ **Undo & Redo History (`Ctrl+Z`, `Ctrl+Y`)**: Character snapshot history with automatic debouncing on sliders and steppers, complete with header controls.
- 🎒 **Wondrous Items Compendium (1,050+ items) & 14 Magic Item Body Slots**: Catalog of magic items from official 3.5e supplements with slot filtering, 1-click equipping, and slot conflict warnings.
- ⚔️ **Weapon Special Qualities (Bane) & Ammunition Tracking**: Configure Bane weapons with targeted creature bonuses (+2 attack, +2d6 damage) and track ammunition counts with quick spend/restore steppers.
- ⚡ **Progressive Data Streaming & Code-Split React 19 Architecture**: Core rules load immediately while secondary datasets stream in the background, paired with code-split views for responsive performance.
- 🌳 **Robust Feats Compendium, Live Prerequisite Validator & Graph Tree**: Feat database with real-time requirement checks (BAB, saves, abilities, skills) and an interactive visual dependency graph.
- 📖 **Core Spells Compendium, Spellbook & Daily Preparation Workshop**: Browse 600+ PHB/SRD spells, calculate slot allotments (including bonus and specialist slots), and track prepared and cast spells.
- 🎲 **Click-to-Roll Dice Engine & Dockable Dice Tray HUD**: 1-click rolls for attacks, damage, saves, and skills with automatic critical threat confirmation, plus a dockable virtual dice tray for custom formulas.
- 🛡️ **Tactical Combat Banner, 19 Conditions & Health States**: Real-time combat stance toggles (Power Attack, Fighting Defensively, Rage), automatic stat recalculations, and tracking for 19 standard D&D 3.5e conditions.
- 🐾 **Druid Wild Shape, Animal Companions & Arcane Familiars**: Choose from 100+ Wild Shape forms with stat overrides, manage companion progression with Effective Druid Level math, and configure familiar bonuses.
- 🖨️ **Printable Sheet View & Roll20 VTT Exporter**: High-contrast, paper-friendly sheet layout formatted for PDF export or printing, alongside a 1-click JSON exporter for Roll20 3.5e sheets.
- 💾 **100% Local-First Storage & Multi-Character Roster**: Client-side storage powered by IndexedDB with `localStorage` fallback, supporting multiple characters, quick-switching, and full roster backup imports and exports.

---

## 📚 Documentation Suite

Comprehensive documentation is available in both the app's `?` Help menu and the repository [`docs/`](./docs) folder:

- **[User Guide](./docs/USER_GUIDE.md)**: Full step-by-step user guide for character creation, equipment, companions, active combat stances, and printing.
- **[Features & Core Engines](./docs/FEATURES.md)**: Technical reference for stat math, DR calculation, tactical combat formulas, SR engine, Grapple math, EDL math, and storage.
- **[Data Extraction Pipeline](./docs/DATA_EXTRACTION.md)**: Guide to Python scripts extracting D&D 3.5 content from Excel into `src/data/` JSONs.
- **[Developer Guide](./docs/DEVELOPMENT.md)**: Development setup, WSL 2 rules, building, and running Vitest unit tests.

---

## 🚀 Quickstart

```bash
# Clone the repository
git clone https://github.com/mg-starfleetengineering/HeroForgeNG.git
cd HeroForgeNG

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing & Production Build

```bash
# Run unit tests
npm test

# Build static production bundle into dist/
npm run build
```

---

## 📜 License & Credits

- Based on the original **HeroForge Anew** project by Heliomance.
- Dungeons & Dragons is a trademark of Wizards of the Coast LLC.
