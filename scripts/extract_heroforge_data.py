import os
import json
import pandas as pd
import numpy as np

OUTPUT_DIR = os.path.join("src", "data")
PUBLIC_DATA_DIR = os.path.join("public", "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(PUBLIC_DATA_DIR, exist_ok=True)

def clean_val(val):
    if pd.isna(val) or val is None:
        return None
    if isinstance(val, (float, int)):
        if np.isnan(val):
            return None
        if float(val).is_integer():
            return int(val)
        return float(val)
    val_str = str(val).strip()
    if val_str.lower() in ['nan', 'none', 'null', '']:
        return None
    if val_str.lower() == 'true':
        return True
    if val_str.lower() == 'false':
        return False
    return val_str

def extract_classes():
    print("Extracting Classes...")
    df = pd.read_excel("data/ClassInfo.xlsx", header=None)
    headers = [str(h).strip() if pd.notna(h) else f"col_{i}" for i, h in enumerate(df.iloc[1].values)]
    
    source_map = {
        "Players Handbook II": "PH2",
        "Complete Warrior": "CW",
        "Complete Divine": "CD",
        "Complete Arcane": "CAr",
        "Complete Adventurer": "CAd",
        "Complete Champion": "CC",
        "Complete Scoundrel": "CS",
        "Complete Mage": "CM",
        "Races of Stone": "RoS",
        "Races of the Wild": "RotW",
        "Races of Destiny": "RoD",
        "Races of the Dragon": "RotD",
        "Frostburn": "Frost",
        "Sandstorm": "Sand",
        "Stormwrack": "Sto",
        "Tome of Battle": "ToB",
        "Tome of Magic": "TM",
        "Magic of Incarnum": "MoI",
        "Expanded Psionics": "XPH",
        "Eberron": "ECS",
        "DragonLance": "DLCS",
        "Oriental Adventures": "OA",
        "Draconomicon": "Dr",
        "Dragon Magic": "DrM",
        "Libris Mortis": "LM",
        "Lords of Madness": "LoM",
        "Book of Vile": "BV",
        "Book of Exalted": "BoED",
        "Planar Handbook": "PlH",
        "Ravenloft": "RCS",
        "Heroes of Battle": "HB",
        "Heroes of Horror": "HH"
    }
    
    classes = []
    current_source = "PHB"
    
    for row_idx in range(3, len(df)):
        row = df.iloc[row_idx]
        class_name = clean_val(row[1])
        if not class_name or class_name == "Select Class" or class_name == "Select A Class":
            continue
        
        # Check if header row for section
        class_str = str(class_name).strip()
        if "Base Classes" in class_str or "Prestige Classes" in class_str:
            matched_src = "PHB"
            for key, val in source_map.items():
                if key.lower() in class_str.lower():
                    matched_src = val
                    break
            current_source = matched_src
            continue
            
        abbreviation = clean_val(row[2])
        max_lvl = clean_val(row[4]) or 20
        bonus_caster = clean_val(row[6])
        skill_pts = clean_val(row[10]) or 2
        hd_type = clean_val(row[11]) or 6
        
        prof_light = bool(clean_val(row[13]))
        prof_med = bool(clean_val(row[14]))
        prof_heavy = bool(clean_val(row[15]))
        prof_shield = bool(clean_val(row[16]))
        prof_tower = bool(clean_val(row[17]))
        prof_simple = bool(clean_val(row[18]))
        prof_martial = bool(clean_val(row[19]))
        
        fbab = clean_val(row[21]) or 0.5
        ffort = clean_val(row[22]) or 0.34
        fref = clean_val(row[23]) or 0.34
        fwill = clean_val(row[24]) or 0.34
        
        class_skills = []
        for col_idx in range(34, 114):
            if col_idx < len(headers):
                skill_name_raw = headers[col_idx]
                val = clean_val(row[col_idx])
                # Value 2 in HeroForge ClassInfo spreadsheet denotes a Class Skill
                if skill_name_raw and not str(skill_name_raw).startswith("col_") and val == 2:
                    import re
                    h_clean = re.sub(r'[^\x00-\x7F]+', '', str(skill_name_raw)).strip()
                    if 'Craft' in h_clean:
                        skill_clean = 'Craft'
                    elif 'Knowledge skills' in h_clean or h_clean == 'Knowledge ()':
                        skill_clean = 'Knowledge'
                    elif 'Perform' in h_clean:
                        skill_clean = 'Perform'
                    elif 'Profession' in h_clean:
                        skill_clean = 'Profession'
                    else:
                        skill_clean = h_clean
                    
                    if skill_clean and skill_clean not in class_skills:
                        class_skills.append(skill_clean)
        
        classes.append({
            "id": class_name.lower().replace(" ", "_").replace("/", "_"),
            "name": class_name,
            "abbr": abbreviation or class_name[:3],
            "maxLevels": max_lvl,
            "hitDie": hd_type,
            "skillPoints": skill_pts,
            "babFactor": fbab,
            "fortFactor": ffort,
            "refFactor": fref,
            "willFactor": fwill,
            "bonusCaster": bonus_caster,
            "source": "PHB" if class_name in ["Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer", "Wizard"] else current_source,
            "proficiencies": {
                "lightArmor": prof_light,
                "mediumArmor": prof_med,
                "heavyArmor": prof_heavy,
                "shield": prof_shield,
                "towerShield": prof_tower,
                "simpleWeapons": prof_simple,
                "martialWeapons": prof_martial
            },
            "classSkills": class_skills
        })
    
    with open(os.path.join(OUTPUT_DIR, "classes.json"), "w", encoding="utf-8") as f:
        json.dump(classes, f, indent=2)
    with open(os.path.join(PUBLIC_DATA_DIR, "classes.json"), "w", encoding="utf-8") as f:
        json.dump(classes, f, indent=2)
    print(f"Extracted {len(classes)} classes -> src/data/classes.json & public/data/classes.json")

def extract_races():
    print("Extracting Races & Creatures...")
    df = pd.read_csv("data/CreatureInfo.csv", encoding="latin1").dropna(how="all")
    races = []
    
    for _, row in df.iterrows():
        name = clean_val(row.get("Race"))
        if not name or "select" in str(name).lower() or str(name).startswith("ref:"):
            continue
        
        races.append({
            "id": name.lower().replace(" ", "_").replace("/", "_"),
            "name": name,
            "category": clean_val(row.get("Category")),
            "size": clean_val(row.get("Size")) or "Medium",
            "type": clean_val(row.get("Type")) or "Humanoid",
            "subtype": clean_val(row.get("Subtype")),
            "hd": clean_val(row.get("HD")),
            "speed": {
                "land": clean_val(row.get("Land")) or 30,
                "fly": clean_val(row.get("Fly")),
                "swim": clean_val(row.get("Swim")),
                "burrow": clean_val(row.get("Burrow")),
                "climb": clean_val(row.get("Climb"))
            },
            "strAdj": clean_val(row.get("StrAdj")) or 0,
            "dexAdj": clean_val(row.get("DexAdj")) or 0,
            "conAdj": clean_val(row.get("ConAdj")) or 0,
            "intAdj": clean_val(row.get("IntAdj")) or 0,
            "wisAdj": clean_val(row.get("WisAdj")) or 0,
            "chaAdj": clean_val(row.get("ChaAdj")) or 0,
            "naturalArmor": clean_val(row.get("Natural Armor")) or 0,
            "levelAdj": clean_val(row.get("Level Adj.")) or 0,
            "favoredClass": clean_val(row.get("Favored Class")),
            "automaticLanguages": clean_val(row.get("Automatic Languages")),
            "bonusLanguages": clean_val(row.get("Bonus Languages")),
            "bonusFeats": clean_val(row.get("Bonus Feat(s)")),
            "specialAbilities": clean_val(row.get("Other Special Abilities")),
            "spellLikeAbilities": clean_val(row.get("Spell-like abilities")),
            "psionicAbilities": clean_val(row.get("Psionic abilities")),
            "racialSkills": clean_val(row.get("Racial Skills")),
            "source": clean_val(row.get("Src"))
        })
    
    with open(os.path.join(OUTPUT_DIR, "races.json"), "w", encoding="utf-8") as f:
        json.dump(races, f, indent=2)
    with open(os.path.join(PUBLIC_DATA_DIR, "races.json"), "w", encoding="utf-8") as f:
        json.dump(races, f, indent=2)
    print(f"Extracted {len(races)} races -> src/data/races.json & public/data/races.json")

def extract_weapons():
    print("Extracting Weapons...")
    df = pd.read_csv("data/WeaponInfo.csv", encoding="latin1").dropna(how="all")
    weapons = []
    
    for _, row in df.iterrows():
        name = clean_val(row.get("Select A Weapon"))
        if not name or "select" in str(name).lower() or str(name).startswith("ref:"):
            continue
        
        weapons.append({
            "id": str(name).lower().replace(" ", "_").replace("/", "_"),
            "name": name,
            "category": clean_val(row.get("Cat")) or "Simple",
            "size": clean_val(row.get("Size")) or "M",
            "damageM": clean_val(row.get("Dmg1(M)")) or "1d6",
            "threat": clean_val(row.get("Threat")) or 20,
            "critMultiplier": clean_val(row.get("Crit1")) or 2,
            "range": clean_val(row.get("Range")),
            "weight": clean_val(row.get("Wgt")) or 1.0,
            "type": clean_val(row.get("Type")) or "Slashing",
            "special": clean_val(row.get("Special")),
            "source": clean_val(row.get("Source"))
        })
    
    with open(os.path.join(OUTPUT_DIR, "weapons.json"), "w", encoding="utf-8") as f:
        json.dump(weapons, f, indent=2)
    with open(os.path.join(PUBLIC_DATA_DIR, "weapons.json"), "w", encoding="utf-8") as f:
        json.dump(weapons, f, indent=2)
    print(f"Extracted {len(weapons)} weapons -> src/data/weapons.json & public/data/weapons.json")

def extract_feats():
    print("Extracting Feats...")
    df = pd.read_excel("HeroForge Anew 3.5 v7.4.0.1.xlsm", sheet_name="Feats")
    feats = []
    seen = set()
    
    for row_idx in range(len(df)):
        name = clean_val(df.iloc[row_idx, 3])
        if not name or name in seen or "Feats" in name or "Handbook" in name or "Additional" in name or "Free" in name or str(name).startswith("ref:"):
            continue
        
        prereq = clean_val(df.iloc[row_idx, 4])
        desc = clean_val(df.iloc[row_idx, 5])
        source = clean_val(df.iloc[row_idx, 48]) if len(df.columns) > 48 else "Core"
        
        if desc and desc.startswith(" : "):
            desc = desc[3:]
        
        seen.add(name)
        feats.append({
            "id": name.lower().replace(" ", "_").replace("/", "_").replace("(", "").replace(")", ""),
            "name": name,
            "prerequisites": prereq,
            "description": desc or "No description available.",
            "source": source or "PH"
        })
    
    with open(os.path.join(OUTPUT_DIR, "feats.json"), "w", encoding="utf-8") as f:
        json.dump(feats, f, indent=2)
    with open(os.path.join(PUBLIC_DATA_DIR, "feats.json"), "w", encoding="utf-8") as f:
        json.dump(feats, f, indent=2)
    print(f"Extracted {len(feats)} feats -> src/data/feats.json & public/data/feats.json")

def extract_tables():
    print("Extracting Tables...")
    tables_data = {
        "pointBuyCosts": {
            "8": 0, "9": 1, "10": 2, "11": 3, "12": 4, "13": 5, "14": 6, "15": 8, "16": 10, "17": 13, "18": 16
        },
        "xpPerLevel": [
            0, 0, 1000, 3000, 6000, 10000, 15000, 21000, 28000, 36000, 45000,
            55000, 66000, 78000, 91000, 105000, 120000, 136000, 153000, 171000, 190000
        ],
        "abilityModifiers": {
            str(score): (score - 10) // 2 for score in range(1, 46)
        }
    }
    with open(os.path.join(OUTPUT_DIR, "tables.json"), "w", encoding="utf-8") as f:
        json.dump(tables_data, f, indent=2)
    with open(os.path.join(PUBLIC_DATA_DIR, "tables.json"), "w", encoding="utf-8") as f:
        json.dump(tables_data, f, indent=2)
    print("Extracted game tables -> src/data/tables.json & public/data/tables.json")

if __name__ == "__main__":
    extract_classes()
    extract_races()
    extract_weapons()
    extract_feats()
    extract_tables()
    print("Data extraction complete!")
