# HeroForgeNG Developer Guide

This guide details developer workflows, environment setup, testing, and production builds for **HeroForgeNG**.

---

## 1. WSL 2 Environment & Execution Rules

> **CRITICAL**: Per project configuration (`GEMINI.md`), all Node.js, `npm`, `npx`, and Vite tooling **MUST** be executed inside **WSL Ubuntu** (`wsl -d Ubuntu`). Do not run `npm` natively in Windows PowerShell/CMD.

### Environment Mapping
- **Windows Workspace Path**: `C:\Users\shado\.git\HeroForge-Anew`
- **WSL Ubuntu Path**: `/mnt/c/Users/shado/.git/HeroForge-Anew`

---

## 2. Common Developer Commands

Run all Node/npm commands via WSL Ubuntu bash invocations:

### Install Dependencies
```bash
wsl -d Ubuntu bash -c "cd /mnt/c/Users/shado/.git/HeroForge-Anew && npm install"
```

### Launch Development Server
```bash
wsl -d Ubuntu bash -c "cd /mnt/c/Users/shado/.git/HeroForge-Anew && npx vite --host 0.0.0.0 --port 5173"
```
- App URL: [http://localhost:5173](http://localhost:5173)

### Run Unit Test Suite
```bash
wsl -d Ubuntu bash -c "cd /mnt/c/Users/shado/.git/HeroForge-Anew && npm run test"
```

### Build Production Bundle
```bash
wsl -d Ubuntu bash -c "cd /mnt/c/Users/shado/.git/HeroForge-Anew && npm run build"
```
- Static output generated into `dist/` ready for Cloudflare Pages or GitHub Pages deployment.

---

## 3. Directory Structure

```
HeroForge-Anew/
├── public/                 # Static assets & public data JSONs
├── src/
│   ├── components/         # React UI tab components & modals
│   ├── data/               # Extracted D&D 3.5e datasets
│   ├── engine/             # Math engines (stats, DR, combat, familiars, companions)
│   │   └── __tests__/      # Vitest unit test suite
│   ├── storage/            # IndexedDB character storage & migration
│   ├── types/              # TypeScript interfaces
│   ├── utils/              # Helper utilities
│   ├── App.tsx             # Root application component
│   └── index.css           # Tailwind CSS & custom design rules
├── scripts/                # Python data extraction scripts
├── docs/                   # Repository documentation suite
└── package.json            # Vite, React 18, Tailwind CSS, Vitest configuration
```
