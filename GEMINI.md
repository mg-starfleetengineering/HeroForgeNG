# Project Environment & WSL Guidelines: HeroForge-Anew

This project is a Vite + React + TypeScript + Tailwind CSS web application located on Windows at:
`C:\Users\shado\.git\HeroForge-Anew` (which maps inside WSL Ubuntu to `/mnt/c/Users/shado/.git/HeroForge-Anew`).

### 1. Execute All Node/npm/Vite Tooling Inside WSL Ubuntu
Do NOT attempt to run `npm`, `npx`, or `node` natively on Windows shell. All Node/Vite/npm commands MUST be run via WSL Ubuntu (`wsl -d Ubuntu`).

Examples:
- Install packages:
  `wsl -d Ubuntu bash -c "cd /mnt/c/Users/shado/.git/HeroForge-Anew && npm install"`

- Build production static bundle:
  `wsl -d Ubuntu bash -c "cd /mnt/c/Users/shado/.git/HeroForge-Anew && npm run build"`

- Launch Vite dev server:
  `wsl -d Ubuntu bash -c "cd /mnt/c/Users/shado/.git/HeroForge-Anew && npx vite --host 0.0.0.0 --port 5173"`

---

### 2. WSL 2 File Watching Configuration
In WSL 2, editing files on mounted Windows paths (`/mnt/c/...`) does not automatically emit Linux inotify events. 
Restart the dev server if currently running after making changes.

---

### 3. Port Conflicts & Server Management
- Always check if an existing Vite server is running before launching a new one to prevent port fallback (e.g. falling back to port 5174).
- The default dev server URL is http://localhost:5173.

---

### 4. Python Environment & Data Extraction
- Python data extraction scripts operate on Windows via `.venv`:
  `.venv\Scripts\python.exe scripts/extract_heroforge_data.py`
- Data JSON outputs are generated into `src/data/` and `public/data/` (`classes.json`, `races.json`, `weapons.json`, `feats.json`, `tables.json`).

---

### 5. Deployment Output
- Running `npm run build` generates the complete static SPA build into `dist/`.
- The `dist/` directory is 100% static and configured for drag-and-drop or GitHub integration on Cloudflare Pages.
