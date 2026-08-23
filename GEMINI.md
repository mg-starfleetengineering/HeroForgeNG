# Project Environment & WSL Guidelines: HeroForge-Anew

This project is a Vite + React + TypeScript + Tailwind CSS web application located on Windows at:
`C:\Users\shado\.git\HeroForge-Anew` (which maps inside WSL Ubuntu to `/mnt/c/Users/shado/.git/HeroForge-Anew`).

### Host Shell: Windows PowerShell (No `&&` Chaining)
All commands executed natively on Windows run in **Windows PowerShell** (not bash or cmd).
- **NEVER use `&&`** when running host commands in PowerShell (it is invalid syntax in Windows PowerShell). Use `;` or run commands as separate tool calls.
- `&&` is ONLY permitted inside WSL bash execution strings (e.g. `wsl -d Ubuntu bash -c "cd /mnt/c/... && npm run build"`).

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

---

### 6. Agent Execution & Dev Server Guidelines
1. **Git Branch & Commits**: Before writing code, ensure you are working on a fresh feature branch (`git checkout -b feature/<chunk-name> main` or `master`). Make atomic commits using Conventional Commits syntax (`feat(<chunk-id>): short description`). **Do NOT try to commit anything until I have told you to.**
2. **Dev Server & Live Preview**: After completing code edits, launch (or restart) the Vite dev server inside WSL as a background task (`wsl -d Ubuntu bash -c 'cd /mnt/c/Users/shado/.git/HeroForge-Anew && npx vite --host 0.0.0.0 --port 5173'`). Confirm when `http://localhost:5173` is ready so I can live-preview the changes in my browser. If follow-up code edits are made and polling doesn't refresh the UI, restart the server process.
3. **Build Verification**: Run `wsl -d Ubuntu bash -c "cd /mnt/c/Users/shado/.git/HeroForge-Anew && npm run build"` to verify TypeScript compilation and production bundle build succeed before declaring completion. **Do not run the build until after you have started or restarted the dev server.**
