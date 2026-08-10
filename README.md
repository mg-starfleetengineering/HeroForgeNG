# HeroForgeNG (HeroForge-Anew Web Edition)

> **HeroForgeNG** is a modern, high-performance web application designed for **Dungeons & Dragons 3.5e** character creation, tactical combat management, and multi-character roster storage.

Built with **React 18**, **Vite**, **TypeScript**, and **Tailwind CSS**, HeroForgeNG ports and vastly expands upon the classic D&D 3.5e HeroForge Anew spreadsheet into a 100% local-first web application.

---

## 🌟 Key Features & Capabilities

- 🛡️ **Multi-Character Roster System**: Client-side IndexedDB storage with `localStorage` fallback. Switch characters via the header summary badge or dashboard modal. Full single-file roster backup export/import.
- 🧬 **Race, Multi-Classing & Stacked Templates**: 100+ base races, custom Racial Overrides, up to 4 main/prestige classes, stacked templates (Half-Dragon, Vampire, Celestial, Draconic), deity & domain selection, and Pathfinder Perception toggle.
- ⚡ **Tactical Combat Widget**: Real-time combat toggles during play including Power Attack (with 2-handed multiplier math), Fighting Defensively, Combat Expertise, Flanking, Charge, and Haste.
- 🛡️ **Dynamic Damage Reduction (DR) Engine**: Prioritizes and tracks multiple DR sources (`DR/Magic`, `DR/Adamantine`, `DR/Cold Iron`, `DR/Silver`, `DR/Evil`, `DR/Slashing`) with standard 3.5e stacking rule enforcement.
- 🐾 **Animal Companions & Familiars**: Dedicated Animal Companion tab for Druids/Rangers with Effective Druid Level (EDL) math, 106 species, companion carrying capacity loads (Light/Medium/Heavy/Lift/Drag), and Arcane Familiar tab with master scaling.
- 📜 **Complete Scoundrel Skill Tricks & Traits/Flaws**: Skill tricks rank validator, Unearthed Arcana traits and flaws.
- 🖨️ **Printable Sheet View & Roll20 VTT Export**: High-contrast printable D&D 3.5e character sheet and Roll20 3.5e sheet JSON exporter.
- ❓ **In-App Help & Manual**: Built-in interactive documentation modal accessible via the `?` icon in the top header.

---

## 📚 Documentation Suite

Comprehensive documentation is available in both the app's `?` Help menu and the repository [`docs/`](./docs) folder:

- **[User Guide](./docs/USER_GUIDE.md)**: Full step-by-step user guide for character creation, equipment, companions, combat toggles, and printing.
- **[Features & Core Engines](./docs/FEATURES.md)**: Technical reference for stat math, DR calculation, tactical combat formulas, EDL math, and storage.
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
