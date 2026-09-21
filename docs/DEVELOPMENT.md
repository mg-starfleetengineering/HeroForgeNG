# HeroForgeNG Developer Guide

This guide details developer workflows, environment setup, testing, and production builds for **HeroForgeNG**.

---

## 1. Environment & Prerequisites

- **Node.js**: v20 or higher
- **Package Manager**: `npm` v10+
- **Platform**: Cross-platform (Linux, macOS, Windows). For Windows development using WSL 2, executing Node/npm tooling inside the WSL Linux environment is recommended.

---

## 2. Common Developer Commands

### Install Dependencies
```bash
npm install
```

### Launch Development Server
```bash
npm run dev
```
- App URL: [http://localhost:5173](http://localhost:5173)

### Run Unit Test Suite
```bash
npm test
```

### Build Production Bundle
```bash
npm run build
```
- Static output generated into `dist/` ready for Cloudflare Pages or GitHub Pages deployment.

---

## 3. Tech Stack & Architecture (v3.0.0)

- **Framework**: React 19 (`react`, `react-dom` 19.0.0) utilizing native `use()` context hooks.
- **Compiler**: Babel React Compiler (`babel-plugin-react-compiler`) for automatic memoization.
- **Styling**: Tailwind CSS v4 (`tailwindcss` 4.3+, `@tailwindcss/vite`).
- **Build Tool**: Vite 8 (`vite` 8.3+) with code-split dynamic imports for tabs.
- **Test Runner**: Vitest 5 (`vitest` 5.0+) running 470+ unit tests across calculation and migration engines.
- **Schema Validation**: Zod 4 (`zod` 4.6+) with lenient `.passthrough()` validation post-normalization.
- **Icons**: Lucide React (`lucide-react` 1.0+) & FontAwesome 6 Free icons.

---

## 4. Directory Structure

```
HeroForge-Anew/
├── public/                 # Static assets & public data JSONs (runtime streaming)
│   └── data/               # 18 JSON compendium datasets
├── src/
│   ├── components/         # React UI tab components, modals & CommandPalette
│   ├── context/            # React 19 contexts (CharacterContext, GameDataContext)
│   ├── data/               # Extracted D&D 3.5e datasets (bundled / fallback)
│   ├── engine/             # Math & rule engines (stats, combat, dr, wildshape, history, wondrousItems)
│   │   └── __tests__/      # Vitest unit test suite (470+ tests)
│   ├── storage/            # IndexedDB character storage, 5-phase migration & Zod validation
│   ├── types/              # TypeScript interfaces, schemas & entity models
│   ├── utils/              # Helper utilities, dice roll mechanics & source filters
│   ├── App.tsx             # Root application component with code-split tab suspense
│   └── index.css           # Tailwind CSS v4 & theme design tokens
├── scripts/                # Python data extraction scripts (.venv)
├── docs/                   # Repository documentation suite
└── package.json            # Vite 8, React 19, Tailwind CSS v4, Vitest 5 configuration
```
