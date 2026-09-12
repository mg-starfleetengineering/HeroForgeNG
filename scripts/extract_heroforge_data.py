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

def extract_traits():
    print("Extracting Traits...")
    df = pd.read_excel("HeroForge Anew 3.5 v7.4.0.1.xlsm", sheet_name="Traits")
    
    TRAIT_MODIFIERS = {
        "abrasive": {"skillMods": {"Intimidate": 1, "Diplomacy": -1, "Bluff": -1}},
        "absent_minded": {"skillMods": {"Knowledge (Arcana)": 1, "Knowledge (Dungeoneering)": 1, "Knowledge (Local)": 1, "Knowledge (Nature)": 1, "Knowledge (Religion)": 1, "Knowledge (The Planes)": 1, "Spot": -1, "Listen": -1}},
        "aggressive": {"initiativeMod": 2, "acMod": -1},
        "detached": {"saveMods": {"will": 1, "ref": -1}},
        "dishonest": {"skillMods": {"Bluff": 1, "Diplomacy": -2}},
        "distinctive": {"skillMods": {"Disguise": -1}},
        "easygoing": {"skillMods": {"Gather Information": 1, "Intimidate": -1}},
        "farsighted": {"skillMods": {"Spot": 1, "Search": -1}},
        "focused": {"skillMods": {"Concentration": 1, "Spot": -1, "Listen": -1}},
        "hard_of_hearing": {"skillMods": {"Spot": 1, "Listen": -2}},
        "hardy": {"saveMods": {"fort": 1, "ref": -1}},
        "honest": {"skillMods": {"Diplomacy": 1, "Bluff": -1, "Sense Motive": -1}},
        "musclebound": {"skillMods": {"Climb": 1, "Jump": 1, "Swim": 1, "Balance": -2, "Escape Artist": -2, "Hide": -2, "Move Silently": -2, "Open Lock": -2, "Ride": -2, "Sleight of Hand": -2, "Tumble": -2, "Use Rope": -2}},
        "nearsighted": {"skillMods": {"Search": 1, "Spot": -1}},
        "nightsighted": {"skillMods": {"Spot": -1}},
        "passionate": {"saveMods": {"fort": 1, "will": -1}},
        "plucky": {"saveMods": {"will": 1, "fort": -1}},
        "polite": {"skillMods": {"Diplomacy": 1, "Intimidate": -2}},
        "quick": {"speedMod": 10, "hpPerLevelMod": -1},
        "saddleborn": {"skillMods": {"Ride": 1, "Handle Animal": -1}},
        "skinny": {"skillMods": {"Escape Artist": 1}},
        "slippery": {"skillMods": {"Escape Artist": 1}},
        "slow": {"hpPerLevelMod": 1, "speedMod": -0.5},
        "stout": {"skillMods": {"Escape Artist": -1}},
        "suspicious": {"skillMods": {"Sense Motive": 1, "Diplomacy": -1, "Intimidate": -1}},
        "torpid": {"initiativeMod": -2},
        "uncivilized": {"skillMods": {"Handle Animal": 1, "Bluff": -1, "Gather Information": -1}}
    }
    
    traits = []
    seen = set()
    for row_idx in range(len(df)):
        name = clean_val(df.iloc[row_idx, 2])
        if not name or name in seen or name in ["Trait", "Item Reset", "Selected"]:
            continue
        
        src_raw = clean_val(df.iloc[row_idx, 8]) or "(UA"
        pg_raw = clean_val(df.iloc[row_idx, 9]) or ""
        desc_raw = clean_val(df.iloc[row_idx, 11]) or ""
        if isinstance(desc_raw, str) and desc_raw.startswith(" : "):
            desc_raw = desc_raw[3:]
        
        source = f"UA {pg_raw}".strip() if pg_raw else "UA"
        trait_id = str(name).lower().replace(" ", "_").replace("-", "_").replace("'", "").replace("(", "").replace(")", "")
        seen.add(name)
        
        item = {
            "id": trait_id,
            "name": str(name),
            "description": desc_raw or "No description available.",
            "source": source
        }
        if trait_id in TRAIT_MODIFIERS:
            item.update(TRAIT_MODIFIERS[trait_id])
            
        traits.append(item)
        
    with open(os.path.join(OUTPUT_DIR, "traits.json"), "w", encoding="utf-8") as f:
        json.dump(traits, f, indent=2)
    with open(os.path.join(PUBLIC_DATA_DIR, "traits.json"), "w", encoding="utf-8") as f:
        json.dump(traits, f, indent=2)
    print(f"Extracted {len(traits)} traits -> src/data/traits.json & public/data/traits.json")

def extract_flaws():
    print("Extracting Flaws...")
    df = pd.read_excel("HeroForge Anew 3.5 v7.4.0.1.xlsm", sheet_name="Flaws")
    
    FLAW_MODIFIERS = {
        "feeble": {"skillMods": {"Climb": -2, "Jump": -2, "Swim": -2, "Balance": -2, "Escape Artist": -2, "Hide": -2, "Move Silently": -2, "Open Lock": -2, "Ride": -2, "Sleight of Hand": -2, "Tumble": -2, "Use Rope": -2, "Concentration": -2}},
        "frail": {"hpPerLevelMod": -1},
        "inattentive": {"skillMods": {"Listen": -4, "Spot": -4}},
        "meager_fortitude": {"saveMods": {"fort": -3}},
        "poor_reflexes": {"saveMods": {"ref": -3}},
        "slow": {"speedMod": -0.5},
        "unreactive": {"initiativeMod": -6},
        "vulnerable": {"acMod": -1},
        "weak_will": {"saveMods": {"will": -3}}
    }
    
    flaws = []
    seen = set()
    for row_idx in range(len(df)):
        name = clean_val(df.iloc[row_idx, 2])
        if not name or name in seen or name in ["Available Flaws", "Bonus Flaws", "Flaw", "Selected"]:
            continue
        
        src_raw = clean_val(df.iloc[row_idx, 6]) or "(UA"
        pg_raw = clean_val(df.iloc[row_idx, 7]) or ""
        desc_raw = clean_val(df.iloc[row_idx, 8]) or ""
        if isinstance(desc_raw, str) and desc_raw.startswith(" : "):
            desc_raw = desc_raw[3:]
        
        source = f"UA {pg_raw}".strip() if pg_raw else "UA"
        flaw_id = str(name).lower().replace(" ", "_").replace("-", "_").replace("'", "").replace("(", "").replace(")", "")
        seen.add(name)
        
        item = {
            "id": flaw_id,
            "name": str(name),
            "description": desc_raw or "No description available.",
            "source": source
        }
        if flaw_id in FLAW_MODIFIERS:
            item.update(FLAW_MODIFIERS[flaw_id])
            
        flaws.append(item)
        
    with open(os.path.join(OUTPUT_DIR, "flaws.json"), "w", encoding="utf-8") as f:
        json.dump(flaws, f, indent=2)
    with open(os.path.join(PUBLIC_DATA_DIR, "flaws.json"), "w", encoding="utf-8") as f:
        json.dump(flaws, f, indent=2)
    print(f"Extracted {len(flaws)} flaws -> src/data/flaws.json & public/data/flaws.json")

def extract_skill_tricks():
    print("Extracting Skill Tricks...")
    import re
    df = pd.read_excel("HeroForge Anew 3.5 v7.4.0.1.xlsm", sheet_name="Skill Tricks", header=None)
    tricks = []
    seen = set()

    for idx in range(len(df)):
        name = df.iloc[idx, 2]
        if pd.isna(name):
            continue
        name_str = str(name).strip()
        if name_str in ['Skill Trick', 'Avaliable Tricks', 'Bonus Tricks', 'Interaction', 'Manipulation', 'Mental', 'Movement'] or name_str in seen:
            continue
        
        prereq = df.iloc[idx, 3]
        desc = df.iloc[idx, 4]
        cat = df.iloc[idx, 5]
        page = df.iloc[idx, 12]
        
        desc_str = str(desc).strip() if pd.notna(desc) else "No description available."
        if desc_str.startswith(':'):
            desc_str = desc_str[1:].strip()
            
        page_str = f"CS p.{int(page)}" if pd.notna(page) and str(page).replace('.','').isdigit() else "CS"
        prereq_str = str(prereq).strip() if pd.notna(prereq) else ""
        
        ranks = {}
        feats = []
        if prereq_str:
            parts = [p.strip() for p in prereq_str.split(',')]
            for part in parts:
                match = re.search(r'([A-Za-z\s\(\)]+?)\s+(\d+)\s+ranks?', part, re.IGNORECASE)
                if match:
                    skill = match.group(1).strip()
                    num = int(match.group(2))
                    if 'knowledge' in skill.lower() and 'any' in skill.lower():
                        skill = 'Knowledge (any)'
                    elif 'bluff or sleight of hand' in skill.lower():
                        ranks['Bluff/Sleight of Hand'] = num
                    else:
                        skill_clean = skill.title()
                        if 'Of' in skill_clean:
                            skill_clean = skill_clean.replace('Of', 'of')
                        if 'To' in skill_clean:
                            skill_clean = skill_clean.replace('To', 'to')
                        if 'The' in skill_clean:
                            skill_clean = skill_clean.replace('The', 'the')
                        ranks[skill_clean] = num
                elif 'quick draw' in part.lower():
                    feats.append('Quick Draw')
                    
        trick_id = name_str.lower().replace(' ', '_').replace('-', '_').replace("'", "").replace('(', '').replace(')', '')
        seen.add(name_str)
        
        item = {
            "id": trick_id,
            "name": name_str,
            "category": str(cat).strip() if pd.notna(cat) else "General",
            "description": desc_str,
            "prerequisites": prereq_str,
            "prereqRanks": ranks,
            "prereqFeats": feats,
            "source": page_str
        }
        tricks.append(item)

    with open(os.path.join(OUTPUT_DIR, "skill_tricks.json"), "w", encoding="utf-8") as f:
        json.dump(tricks, f, indent=2)
    with open(os.path.join(PUBLIC_DATA_DIR, "skill_tricks.json"), "w", encoding="utf-8") as f:
        json.dump(tricks, f, indent=2)
    print(f"Extracted {len(tricks)} skill tricks -> src/data/skill_tricks.json & public/data/skill_tricks.json")

def extract_templates():
    print("Extracting Templates...")
    df = pd.read_excel("HeroForge Anew 3.5 v7.4.0.1.xlsm", sheet_name="Template Info", header=13)
    templates = []
    seen = set()

    for idx, row in df.iterrows():
        name = clean_val(row.get("Template*"))
        if not name or str(name).startswith("ref:") or str(name) in ["Custom Template", "Template*"]:
            continue
        name_str = str(name).strip()
        if name_str in seen:
            continue
        seen.add(name_str)

        template_id = name_str.lower().replace(" ", "_").replace("/", "_").replace("-", "_").replace("'", "").replace("(", "").replace(")", "")
        
        speed = {}
        for spd_key, col_name in [("land", "Land"), ("fly", "Fly"), ("swim", "Swim"), ("burrow", "Burrow"), ("climb", "Climb")]:
            val = clean_val(row.get(col_name))
            if val is not None and str(val) != "0":
                try:
                    speed[spd_key] = int(val)
                except (ValueError, TypeError):
                    pass
        maneuver = clean_val(row.get("Maneuver"))
        if maneuver and "fly" in speed:
            speed["flyManeuverability"] = str(maneuver)

        str_adj = clean_val(row.get("Str"))
        dex_adj = clean_val(row.get("Dex"))
        con_adj = clean_val(row.get("Con"))
        int_adj = clean_val(row.get("Int"))
        wis_adj = clean_val(row.get("Wis"))
        cha_adj = clean_val(row.get("Cha"))
        nat_arm = clean_val(row.get("Natural Armor"))
        la_val = clean_val(row.get("Level Adj."))

        templates.append({
            "id": template_id,
            "name": name_str,
            "shortDescription": clean_val(row.get("Short description")),
            "size": clean_val(row.get("Size")),
            "type": clean_val(row.get("Type")),
            "subtype": clean_val(row.get("Subtype")),
            "strAdj": int(str_adj) if isinstance(str_adj, (int, float)) and not pd.isna(str_adj) else 0,
            "dexAdj": int(dex_adj) if isinstance(dex_adj, (int, float)) and not pd.isna(dex_adj) else 0,
            "conAdj": int(con_adj) if isinstance(con_adj, (int, float)) and not pd.isna(con_adj) else 0,
            "intAdj": int(int_adj) if isinstance(int_adj, (int, float)) and not pd.isna(int_adj) else 0,
            "wisAdj": int(wis_adj) if isinstance(wis_adj, (int, float)) and not pd.isna(wis_adj) else 0,
            "chaAdj": int(cha_adj) if isinstance(cha_adj, (int, float)) and not pd.isna(cha_adj) else 0,
            "naturalArmor": int(nat_arm) if isinstance(nat_arm, (int, float)) and not pd.isna(nat_arm) else 0,
            "levelAdj": float(la_val) if isinstance(la_val, (int, float)) and not pd.isna(la_val) else 0,
            "speed": speed if speed else None,
            "specialAbilities": clean_val(row.get("Other Special Abilities")),
            "source": clean_val(row.get("Src")) or "Core"
        })

    extra_templates = [
        {
            "id": "dragonborn_of_bahamut",
            "name": "Dragonborn of Bahamut",
            "shortDescription": "Acquired template applied to any humanoid. Gains Dragonblood subtype and Draconic Aspect.",
            "type": "Humanoid",
            "subtype": "Dragonblood",
            "strAdj": 0,
            "dexAdj": -2,
            "conAdj": 2,
            "intAdj": 0,
            "wisAdj": 0,
            "chaAdj": 0,
            "naturalArmor": 0,
            "levelAdj": 0,
            "specialAbilities": "Draconic Aspect (Heart, Wings, or Mind), Low-Light Vision, +2 to Listen, Spot, and Search.",
            "source": "RotD"
        },
        {
            "id": "phaerimm",
            "name": "Phaerimm",
            "shortDescription": "Aberration template granting innate magic, fly speed, and telepathy.",
            "type": "Aberration",
            "subtype": "Extraplanar",
            "strAdj": 2,
            "dexAdj": 2,
            "conAdj": 2,
            "intAdj": 4,
            "wisAdj": 4,
            "chaAdj": 4,
            "naturalArmor": 2,
            "levelAdj": 2,
            "speed": {"land": 10, "fly": 30, "flyManeuverability": "good"},
            "specialAbilities": "Telepathy 100 ft., Full Caster Spellcasting progression, Natural Weapons (4 Claws, 1 Stinger).",
            "source": "LEoF"
        }
    ]

    for extra in extra_templates:
        if extra["id"] not in [t["id"] for t in templates] and extra["name"] not in seen:
            templates.append(extra)
            seen.add(extra["name"])

    with open(os.path.join(OUTPUT_DIR, "templates.json"), "w", encoding="utf-8") as f:
        json.dump(templates, f, indent=2)
    with open(os.path.join(PUBLIC_DATA_DIR, "templates.json"), "w", encoding="utf-8") as f:
        json.dump(templates, f, indent=2)
    print(f"Extracted {len(templates)} templates -> src/data/templates.json & public/data/templates.json")

def extract_domains():
    import re
    print("Extracting Domains...")
    df_dom = pd.read_excel("HeroForge Anew 3.5 v7.4.0.1.xlsm", sheet_name="Domains", header=None)

    domains = []
    seen_ids = set()
    current_source = "PHB"

    for idx, row in df_dom.iterrows():
        raw_name = row[0]
        if pd.isna(raw_name):
            continue
        s = str(raw_name).strip()
        if s.startswith("-") and s.endswith("-"):
            src_tag = s.strip("- ").replace(" Domains", "").strip()
            current_source = src_tag
            continue
        if s.startswith("-") or s.lower() in ["no", "select domain", "nan"]:
            continue
        
        clean_name = re.sub(r"^xx-|-xx$", "", s).strip()
        if not clean_name:
            continue
        
        dom_id = clean_name.lower().replace(" ", "_").replace("-", "_").replace("(", "").replace(")", "")
        base_id = dom_id
        counter = 1
        while dom_id in seen_ids:
            counter += 1
            dom_id = f"{base_id}_{counter}"
        seen_ids.add(dom_id)
        
        power = str(row[1]).strip() if pd.notna(row[1]) and str(row[1]).strip().lower() != "nan" else "No domain power listed."
        spells = []
        for i in range(2, 11):
            sp_val = row[i]
            if pd.notna(sp_val) and str(sp_val).strip().lower() != "nan":
                sp_name = str(sp_val).strip()
                sp_name = sp_name.replace("’", "'").replace("‘", "'")
                spells.append(sp_name)
                
        domains.append({
            "id": dom_id,
            "name": clean_name,
            "power": power,
            "spells": spells,
            "source": current_source
        })

    with open(os.path.join(OUTPUT_DIR, "domains.json"), "w", encoding="utf-8") as f:
        json.dump(domains, f, indent=2)
    with open(os.path.join(PUBLIC_DATA_DIR, "domains.json"), "w", encoding="utf-8") as f:
        json.dump(domains, f, indent=2)
    print(f"Extracted {len(domains)} domains -> src/data/domains.json & public/data/domains.json")
    return domains

def extract_deities(domains=None):
    print("Extracting Deities...")
    if domains is None:
        if os.path.exists(os.path.join(OUTPUT_DIR, "domains.json")):
            with open(os.path.join(OUTPUT_DIR, "domains.json"), "r", encoding="utf-8") as f:
                domains = json.load(f)
        else:
            domains = []

    df_deity = pd.read_excel("HeroForge Anew 3.5 v7.4.0.1.xlsm", sheet_name="Deities", header=None)
    deities = []
    seen_deity_names = set()

    typo_map = {
        "comunity": "Community",
        "halfllng": "Halfling",
        "inquistion": "Inquisition",
        "strenght": "Strength"
    }

    domain_name_map = {d["name"].lower(): d["name"] for d in domains}
    for d in domains:
        domain_name_map[d["id"]] = d["name"]
        domain_name_map[d["name"].lower().replace(" ", "")] = d["name"]

    for idx in range(4, len(df_deity)):
        r = df_deity.iloc[idx]
        dname = r[0]
        if pd.isna(dname) or str(dname).startswith("ref:") or str(dname) in ["Select A Deity", "Deity"]:
            continue
        name_str = str(dname).strip()
        if name_str in seen_deity_names:
            continue
        seen_deity_names.add(name_str)
        
        alignment = str(r[1]).strip() if pd.notna(r[1]) else "Neutral"
        weapon = str(r[9]).strip() if pd.notna(r[9]) and str(r[9]).strip().lower() != "nan" else "None"
        
        doms_set = set()
        for col_idx in [8] + list(range(12, 27)):
            v = r[col_idx]
            if pd.notna(v):
                for part in str(v).split(","):
                    p_clean = part.strip().replace("*", "")
                    if not p_clean or p_clean.startswith("--") or p_clean.startswith(",--") or p_clean in ["False", "9", "1", "2", "3", "4", "5", "6", "7", "8", "No", "Select A Domain Spell", "Domain Display", "Spell 7"]:
                        continue
                    p_lower = p_clean.lower()
                    if p_lower in typo_map:
                        p_clean = typo_map[p_lower]
                    
                    if p_clean in domain_name_map.values():
                        doms_set.add(p_clean)
                    elif p_lower in domain_name_map:
                        doms_set.add(domain_name_map[p_lower])
                    elif p_lower.replace(" ", "") in domain_name_map:
                        doms_set.add(domain_name_map[p_lower.replace(" ", "")])

        deities.append({
            "id": name_str.lower().replace(" ", "_").replace("-", "_").replace("'", "").replace("(", "").replace(")", ""),
            "name": name_str,
            "alignment": alignment,
            "favoredWeapon": weapon,
            "domains": sorted(list(doms_set))
        })

    with open(os.path.join(OUTPUT_DIR, "deities.json"), "w", encoding="utf-8") as f:
        json.dump(deities, f, indent=2)
    with open(os.path.join(PUBLIC_DATA_DIR, "deities.json"), "w", encoding="utf-8") as f:
        json.dump(deities, f, indent=2)
    print(f"Extracted {len(deities)} deities -> src/data/deities.json & public/data/deities.json")
    return deities

def extract_spells():
    import urllib.request
    import re
    print("Extracting 3.5e Core Spells & Supplemental Domain Spells...")
    
    # 1. Fetch official 3.5e core spells (Player's Handbook / SRD)
    url = "https://raw.githubusercontent.com/eriq-augustine/dnd-spell-cards/master/data/clean-full.json"
    req = urllib.request.Request(url, headers={"User-Agent": "HeroForgeNG-DataExtractor/1.0"})
    with urllib.request.urlopen(req) as res:
        raw_spells = json.loads(res.read().decode("utf-8"))
        
    core_spells = []
    core_names_set = set()
    
    for sp in raw_spells:
        name = sp.get("name") or sp.get("raw_name")
        if not name:
            continue
            
        sp_id = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
        core_names_set.add(name.strip().lower())
        if sp.get("raw_name"):
            core_names_set.add(sp.get("raw_name").strip().lower())
            
        school = sp.get("school") or "Universal"
        subschool = sp.get("subschool") or None
        descriptors = sp.get("descriptors") or []
        
        # Levels mapping
        levels = {}
        lvl_raw = sp.get("level", {})
        if isinstance(lvl_raw, dict):
            if "__structured__" in lvl_raw:
                for cls_k, lvl_v in lvl_raw["__structured__"].items():
                    try:
                        levels[cls_k] = int(lvl_v)
                    except (ValueError, TypeError):
                        pass
        
        # Casting Time
        ct_raw = sp.get("casting_time")
        if isinstance(ct_raw, dict):
            casting_time = ct_raw.get("__raw__") or ct_raw.get("__structured__", {}).get("casting_time", "1 standard action")
        else:
            casting_time = str(ct_raw or "1 standard action")
            
        # Range
        r_raw = sp.get("range")
        if isinstance(r_raw, dict):
            range_val = r_raw.get("__raw__") or r_raw.get("__structured__", {}).get("range", "Touch")
        else:
            range_val = str(r_raw or "Touch")
            
        # Target / Area / Effect
        target_area = (
            sp.get("target") or 
            sp.get("area_or_target") or 
            sp.get("target_or_area") or 
            sp.get("target_or_targets") or 
            sp.get("target,_effect,_or_area") or 
            sp.get("target/effect") or 
            sp.get("effect") or 
            ""
        )
        
        # Duration
        dur_raw = sp.get("duration")
        if isinstance(dur_raw, dict):
            duration = dur_raw.get("__raw__") or dur_raw.get("__structured__", {}).get("duration", "Instantaneous")
        else:
            duration = str(dur_raw or "Instantaneous")
            
        saving_throw = sp.get("saving_throw") or "None"
        spell_resistance = sp.get("spell_resistance") or "No"
        
        # Description
        desc_raw = sp.get("description")
        if isinstance(desc_raw, list):
            description = "\n\n".join(desc_raw)
        else:
            description = str(desc_raw or "")
            
        # Components
        comp_raw = sp.get("components")
        components = ""
        if isinstance(comp_raw, dict):
            components = comp_raw.get("__raw__", "")
        elif comp_raw:
            components = str(comp_raw)
            
        class_levels = {}
        domain_levels = {}
        standard_classes = {
            "wizard", "sorcerer", "cleric", "druid", "bard", "ranger", "paladin",
            "warmage", "beguiler", "duskblade", "dread necromancer", "hexblade",
            "spellthief", "favored soul", "archivist", "healer", "shugenja", "wu jen"
        }
        for k_cls, v_lvl in levels.items():
            if k_cls.strip().lower() in standard_classes:
                class_levels[k_cls.strip()] = v_lvl
            else:
                domain_levels[k_cls.strip()] = v_lvl

        core_spells.append({
            "id": sp_id,
            "name": name,
            "school": school,
            "subschool": subschool,
            "descriptors": descriptors,
            "levels": levels,
            "classLevels": class_levels,
            "domainLevels": domain_levels,
            "components": components,
            "castingTime": casting_time,
            "range": range_val,
            "targetArea": target_area,
            "duration": duration,
            "savingThrow": saving_throw,
            "spellResistance": spell_resistance,
            "description": description,
            "source": "PHB"
        })
        
    with open(os.path.join(OUTPUT_DIR, "spells.json"), "w", encoding="utf-8") as f:
        json.dump(core_spells, f, indent=2)
    with open(os.path.join(PUBLIC_DATA_DIR, "spells.json"), "w", encoding="utf-8") as f:
        json.dump(core_spells, f, indent=2)
    print(f"Extracted {len(core_spells)} 3.5e core spells -> src/data/spells.json & public/data/spells.json")
    
    # 2. Extract supplemental domain spells from Excel workbook not in core PHB
    df_dom = pd.read_excel("HeroForge Anew 3.5 v7.4.0.1.xlsm", sheet_name="Domains", header=None)
    supp_spells_map = {}
    current_source = "PHB"
    
    for row_idx, row in df_dom.iterrows():
        raw_name = row[0]
        if pd.isna(raw_name):
            continue
        s_val = str(raw_name).strip()
        if s_val.startswith("-") and s_val.endswith("-"):
            src_tag = s_val.strip("- ").replace(" Domains", "").strip()
            current_source = src_tag
            continue
        if s_val.startswith("-") or s_val.lower() in ["no", "select domain", "nan"]:
            continue
            
        clean_domain_name = re.sub(r"^xx-|-xx$", "", s_val).strip()
        if not clean_domain_name:
            continue
            
        power = str(row[1]).strip() if pd.notna(row[1]) and str(row[1]).strip().lower() != "nan" else "No domain power listed."
        
        for lvl_idx in range(1, 10):
            col_val = row[lvl_idx + 1]
            if pd.notna(col_val) and str(col_val).strip().lower() not in ["nan", "none", ""]:
                sp_name = str(col_val).strip().replace("’", "'").replace("‘", "'")
                sp_lower = sp_name.lower()
                
                # Check if in core list
                if sp_lower not in core_names_set:
                    sp_id = re.sub(r"[^a-z0-9]+", "_", sp_lower).strip("_")
                    if sp_id not in supp_spells_map:
                        supp_spells_map[sp_id] = {
                            "id": sp_id,
                            "name": sp_name,
                            "source": current_source,
                            "excelOrigin": {
                                "sheet": "Domains",
                                "row": row_idx + 1
                            },
                            "domains": [],
                            "levels": {},
                            "classLevels": {},
                            "domainLevels": {}
                        }
                    
                    supp_spells_map[sp_id]["domains"].append({
                        "domain": clean_domain_name,
                        "level": lvl_idx,
                        "domainPower": power,
                        "source": current_source
                    })
                    supp_spells_map[sp_id]["levels"][clean_domain_name] = lvl_idx
                    supp_spells_map[sp_id]["domainLevels"][clean_domain_name] = lvl_idx
                    
    supp_spells_list = list(supp_spells_map.values())
    with open(os.path.join(OUTPUT_DIR, "supplemental_domain_spells.json"), "w", encoding="utf-8") as f:
        json.dump(supp_spells_list, f, indent=2)
    with open(os.path.join(PUBLIC_DATA_DIR, "supplemental_domain_spells.json"), "w", encoding="utf-8") as f:
        json.dump(supp_spells_list, f, indent=2)
    print(f"Extracted {len(supp_spells_list)} supplemental domain spells -> src/data/supplemental_domain_spells.json & public/data/supplemental_domain_spells.json")
    
    return core_spells, supp_spells_list

if __name__ == "__main__":
    extract_classes()
    extract_races()
    extract_weapons()
    extract_feats()
    extract_traits()
    extract_flaws()
    extract_skill_tricks()
    extract_templates()
    doms = extract_domains()
    extract_deities(doms)
    extract_tables()
    extract_spells()
    print("Data extraction complete!")




