# HeroForge Data Extraction Pipeline & JSON Schemas

This document explains how D&D 3.5e content is extracted from the source Excel workbook (`HeroForge Anew 3.5 v7.4.0.1.xlsm`) into structured JSON datasets in `src/data/` and `public/data/`.

---

## 1. Overview & Extraction Tooling

HeroForgeNG utilizes Python scripts executed via a virtual environment (`.venv`) to parse macro-enabled Excel sheets, extract creature stats, feat lists, class progression tables, and weapons, and output clean JSON data for the web app.

### Running Data Extraction

On Windows, run the extraction script via Python:
```powershell
.venv\Scripts\python.exe scripts/extract_heroforge_data.py
```

Outputs are automatically placed into:
- `src/data/` (for Vite bundle importing)
- `public/data/` (for runtime fetch calls)

---

## 2. Extracted Dataset Overview

| File | Content | Key Fields |
| :--- | :--- | :--- |
| `races.json` | 100+ Base Races & Sub-races | `name`, `str`, `dex`, `con`, `int`, `wis`, `cha`, `speed`, `flySpeed`, `swimSpeed`, `size`, `bonusFeats`, `source` |
| `classes.json` | Core & Prestige Classes | `name`, `hitDie`, `babProgression`, `fortSave`, `refSave`, `willSave`, `skillPoints`, `classSkills`, `spellcasting` |
| `feats.json` | Feats Database | `name`, `type`, `prereqs`, `description`, `source`, `benefit` |
| `weapons.json` | Weapons Table | `name`, `category`, `damage`, `critical`, `weight`, `type`, `rangeIncrement` |
| `animal_companions.json` | 106 Base Companions | `name`, `minDruidLevel`, `str`, `dex`, `con`, `int`, `wis`, `cha`, `hd`, `naturalArmor`, `attacks` |
| `familiars.json` | Standard & Improved Familiars | `name`, `masterBonus`, `type`, `str`, `dex`, `con`, `int`, `wis`, `cha`, `naturalArmor` |
| `templates.json` | Racial Templates | `name`, `str`, `dex`, `con`, `int`, `wis`, `cha`, `levelAdjustment`, `naturalArmor`, `speedMod` |
| `deities.json` | Deities List | `name`, `alignment`, `domains`, `pantheon`, `favoredWeapon` |
| `domains.json` | Divine Domains | `name`, `grantedPower`, `spells` |
| `skill_tricks.json` | Skill Tricks | `name`, `category`, `prereqRanks`, `description` |
| `traits.json` | Character Traits | `name`, `benefit`, `drawback` |
| `flaws.json` | Character Flaws | `name`, `effect`, `bonusFeatGranted` |
| `sources.json` | Sourcebook List | `code`, `name`, `category` |
