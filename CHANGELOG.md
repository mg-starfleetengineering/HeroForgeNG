# HeroForge Anew Change Log
All notable changes to the project will be documented in this file.

From version 7.4.0.0 onwards, the following versioning convention applies:

Given a version number MAJOR.SOURCE.MINOR.BUGFIX, increment the:

1. MAJOR version for large overhauls of functionality or design,
2. SOURCE version for when new material (primarily a new sourcebook) is added in a manner that breaks backwards-compatibility,
3. MINOR version for when functionality is added in a backwards-compatible manner,
4. BUGFIX version for backwards-compatible bugfixes.

Prior to version 7.4.0.0, the difference between SOURCE and MINOR, and between MINOR and BUGFIX updates, was highly subjective.

## [2.1.0] - 2026-09-06
### Added
- **Complete Feat Deduplication & Canonical Resolution**: Aggregates all cross-reference dashed feat records (`-- Feat Name --`) and edition aliases into singular canonical entries, reducing library clutter across all 103 dashed entries.
- **3.0e & Variant Edition Alias Support**: Automatically resolves older edition/variant feat names (*Ki Shout* -> *Kiai Shout*, *Remain Conscious* -> *Diehard*, *Superior Expertise* -> *Improved Combat Expertise*, *Longstrider Elite* -> *Longstride Elite*, *Tunnel Fighter* -> *Tunnel Fighting*) to modern 3.5e equivalents.
- **Multi-Sourcebook Feat Inclusions & Badging**: Feats existing in multiple sourcebooks (e.g. *MM4* and *PHB*) aggregate all sources (`sources: string[]`), qualify as Allowed if any source is enabled in Allowed Sources settings, and render multi-source badge indicators.
- **Smart Description Merging**: Intelligently evaluates description variations to preserve specific tactical rules, timings (e.g. *Clinging Breath* extra damage 1 round later), action economy, and penalty mechanics (e.g. *Fling Enemy* -20 grapple check), while stripping generic pointer stubs.
- **Base Save Prerequisite Validation**: Prerequisite engine natively parses and evaluates `Base Fortitude save bonus +X`, `Base Will save +X`, and `Base Reflex save +X` directly against calculated class progression base saves.
- **Interactive Visual Feat Dependency Tree Modal**: Directed acyclic graph viewer visualizing complex feat trees (e.g. *Power Attack* -> *Cleave* -> *Great Cleave*) with color-coded Learned (Green), Available/Eligible (Blue), and Locked (Amber/Red) states, full-canvas pan/zoom, live search, and slide-out inspection drawer.
- **Live Feat Prerequisite Validator Engine**: Multi-dimensional prerequisite evaluation checking BAB, base saves, ability scores, class levels, skill ranks, caster levels, and active feat lineages with "Available / Qualified" and "Missing Prerequisites" UI filters.
- **Interactive Click-to-Roll Dice Engine**: Full tabletop dice mechanics supporting standard notation (`1d20+8`, `3d6+STR`), weapon critical threat ranges (e.g. 18-20/x2), automated critical confirmation rolls, and Natural 20 / Natural 1 detection.
- **Dockable Dice Tray HUD Widget**: Virtual 3D/flat polyhedral dice tray dockable at the bottom of the screen with quick d4-d100 buttons, custom formula input, and timestamped roll history with 1-click clipboard copy and clear.
- **Click-to-Roll Sheet Integration**: 1-click rolling across Character Sheet and Equipment views for attacks, damage, saves, ability checks, skill checks, initiative, and grapple.

### Fixed
- **Search Bar Magnifying Glass Icon Overlap**: Corrected input field padding and icon absolute positioning across Feats, Feat Tree, Skills, and Traits/Flaws search bars to ensure typed text never overlaps search icons.
- **Tunnel Fighting Description Correction**: Corrected dataset copy-paste anomaly where *PH* table had errant *Goad* description, restoring authentic *Dungeonscape* squeezing mechanics.

## [2.0.0] - 2026-08-23
### Added
- **Active Spell Slot Cast Tracking & Long Rest Sync**: Dynamic active spell slot tracking engine with interactive usage bubbles `[●][●][○]`, spend/restore steppers, and class-level restore.
- **Daily Class Resources & Usage Tracking HUD**: Unified combat tracking section housing active ability usages (Rage, Lay on Hands, Smite, Turn Undead, Wild Shape, etc.), resource pools, and spell slots directly on the Character Sheet view.
- **Prepared Spell Cast Synchronization**: Dedicated `[Cast]` / `[Expended]` buttons per prepared spell that automatically deduct and restore available slot capacity and usage bubbles in real-time.
- **8-Hour Long Rest Automation**: Synchronized long rest action automatically restores character HP, daily class resource usages, point pools, expended spell slots, and marks all prepared spells ready.
- **Live Spellbook & Daily Preparation Workshop**: Daily preparation workshop with class level slot formulas, bonus spells from high ability scores (PHB Table 1-1), domain bonus slots, and wizard specialist slots.
- **3.5e Core Spells Database & Searchable Compendium**: 600+ official PHB/SRD spells searchable by school, level, casting time, and component with detailed spell inspector card.
- **In-Play Vitals Tracker & Conditions Engine**: Dynamic current/max/temp HP tracker with nonlethal damage calculations, dynamic health status badges (Healthy, Bloodied, Disabled, Dying, Dead), and 19 standard D&D 3.5e conditions with automated stat penalties.
- **Wild Shape Form Manager & Forms Dataset**: Full Druid Wild Shape engine featuring 100+ animal/plant/elemental forms, progression scaling (uses/day, sizes Small-Huge, elemental forms), physical ability score overrides, natural armor, speeds, and natural attack routines.
- **Clean Static Printable Sheet View**: Separated live combat HUD from printable `#printable-character-sheet` layout, providing a clean non-interactive layout with paper-friendly checkboxes for PDF/print export.

## [1.4.0] - 2026-08-16
### Added
- **Active Combat Modifiers & Tactical Stances Display**: Comprehensive active combat modifiers engine tracking and banner across character sheet and equipment views. Displays active stances (Whirling Frenzy, Barbarian Rage, Haste, Power Attack, Combat Expertise, Fighting Defensively, Flurry of Blows) with icons, bonus/penalty breakdowns, and inline dismissal buttons.
- **Stat Cause Breakdowns**: Explicit source annotations next to modified Ability Scores (e.g. `+4 (Frenzy)`, `+4 (Rage)` alongside base score), Saving Throws (dedicated Tactical/Misc column for Fortitude, Reflex, and Will), Vitals (HP, AC, Speed, Grapple), and Attacks arsenal.
- **Zen Writing Mode Font Size Controls**: Compact text sizing default with Small (12px), Default (14px), and Large (16px) controls in fullscreen Zen writing mode.

### Changed
- **Character Sheet Possessions Table**: Removed fixed max-height and scrollbar constraints from the Possessions & Adventuring Gear section so inventory expands naturally to fit all rows in both on-screen and print views.

## [1.3.0] - 2026-08-10
### Added
- **Multi-Character Management System**: 100% local-first, client-side character management powered by IndexedDB with `localStorage` failover.
- **Character Quick Switcher & Roster Dashboard**: Clickable character summary pill dropdown with search filtering, and a full dashboard modal with character cards grid.
- **Export All & Import All (Roster Backup)**: Complete roster backup package export/import functionality alongside per-character JSON export/import.
- **Legacy Migration & URL Query Sync**: Automatic boot migration for legacy single-character local state and live synchronization of active character context via `?characterId=<uuid>`.

## [1.2.0] - 2026-08-09
### Added
- **Animal Companion Tab**: Built complete Animal Companion tab for Druids and Rangers with 106 extracted base companion species, Effective Druid Level (EDL) calculation engine (factoring Ranger levels, Beastmaster, prestige classes, and Natural Bond feat), companion HD/HP/AC/Save scaling, natural attacks, carrying capacity calculator (Light/Medium/Heavy loads, Lift & Drag), companion feat assignment, skill rank distribution, bonus tricks controls, and custom companion creation.
- **Dynamic DR Calculator**: Advanced Damage Reduction engine with multi-source stacking and prioritization.
- **Familiars Tab**: Arcane familiar stat scaling, master level calculation, and custom familiar support.
- **Deity & Domain Selection**: Domain powers and spell progression integration.
- **Auras & Emanations**: Aura radius, target tracking, and active toggles.

### Changed
- Navigation bar optimized to flex-wrap without requiring horizontal scrolling across responsive viewport widths.

## [8.0.0.0.alpha] - 2017-05-02
### N.B.: THIS IS AN ALPHA RELEASE. NOT ALL PLANNED V8.0 FEATURES HAVE BEEN IMPLEMENTED.
### Bugfix
- Familiar carry weights have been fixed
- Death Dragon buff no longer linked to Cloak of Chaos
- Dragonborn of Bahamut now keeps your original Type, instead of setting it to Humanoid
- Animal companions should now be working properly. Carry weights have been fixed. Skill ranks are not assigned, and must be done manually. Feats are not calculated, and feats other than bonus feats are not tracked.
- Carry weight formula tweaked - should no longer be adding phantom weight (see [Issue #45](https://github.com/Heliomance/HeroForge-Anew/issues/45))
- Legend of the Five Rings logo should no longer stick around on the character sheet through resets. Hopefully. (see [Issue #46](https://github.com/Heliomance/HeroForge-Anew/issues/46))
- Rangers now properly get Endurance as a free feat at level 3 again, without also having to be a second level Dwarven Chanter. (see [Issue #54](https://github.com/Heliomance/HeroForge-Anew/issues/54))
- Kobold Dwarven Chanters (don't ask) will now receive Kobold Endurance as a bonus feat at Dwarven Chanter 2, not Dwarven Chanter 1.
- Elf Ranger Racial Substitution Levels should now properly grant Servant of Lolth as an available Favoured Enemy at level 1. (see [Issue #60](https://github.com/Heliomance/HeroForge-Anew/issues/60))
- Assorted minor template fixes. Ogre Titan will no longer cause cascading errors. (see [Issue 63](https://github.com/Heliomance/HeroForge-Anew/issues/63))
- The Languages tab now properly resets with the rest of the sheet. (see [Issue #65](https://github.com/Heliomance/HeroForge-Anew/issues/65))
- The Evolved template no longer stacks geometrically. (see [Issue #76](https://github.com/Heliomance/HeroForge-Anew/issues/76)) More generally, templates that can be selected multiple times will no longer list multiple copies of their SLAs.
- Natural Bond now affects the level of animal companion you can choose (see [Issue #98](https://github.com/Heliomance/HeroForge-Anew/issues/98)) Companion choice level is now hard capped at character level - if you know of anything that can raise effective Druid level above character level for the purpose of animal companions, please let me know.

### Changes
- Major overhaul of the sheet. 
- Data tables have been moved to separate sheets where possible, for modularity and change control purposes.
- Format changed from .XLS to .XLSM.

### Removed
- Living Greyhawk prestige classes
- Savage Species monster class functionality has been temporarily removed due to changes in how races are stored. This functionality should return in a later update.

### Deprecated
- The data tables on the RaceInfo and CreatureInfo tabs have been deprecated in favour of the CreatureInfo .csv in the data folder. The tabs will remain until I'm certain that all remaining references to them have been updated.
- The .hfg save format is being deprecated. It is still the format used by the alpha release. The full release of v8.0 will have support for loading legacy .hfg files, but will only allow saving in a new format (extension TBD)

## [7.4.0.1] - 2015-06-11
### Bugfix
- Prestige classes with the prerequisite of "Human" now require the Human *subtype*, not the Human *race*, as per Races of Destiny p150.

## [7.4.0.0] - 2015-06-04
### Bugfixes
- Tashalatora now properly contributes to Flurry of Blows.
- Monk bonus feats work again.
- Draconic Heritage now properly grants you the appropriate Sorcerer class skill.
- The Trophy Collector feat now properly requires 6 ranks in Craft (taxidermy), not 4.
- Cleaned up some obsolete cell references.
- Diamond Dragon no longer breaks everything forever.
- The Template Information form now gives accurate information.
- Favoured Enemies work properly again.
- Buffs which grant temporary HP will no longer grant their HP unless the buff is active.
- Unwildshaping will now clear all natural attacks you had selected, rather than spewing errors everywhere.
- Point Blank Shot now properly grants the damage bonus within 30ft.
- Dweomerkeeper no longer grants bonus feats, can now select 5 mantles.
- Increased width of Character Sheet II ability display by 4 pixels to help fix word wrap issues.
- Templates that modify speed don't break horribly anymore.
- Templates that modify alignment don't break horribly anymore.
- Renegade Mastermakers now get their DR.
- Sand Shapers now only require you to be a 5th level arcane caster, not to be able to cast 5th level spells.

### Added
- Oriental Adventures. Note: Feats are taken from the sourcebook, not the 3.5 update.

### Changed
- Modified Changelog to use Markdown format
- Changed version compatibility verification code

### Deprecated
- Living Greyhawk support is deprecated and will be removed at some point in the future.

## [7.3.2.4]
### Bugfix
- Fixed some problems with Mind's Eye Psion variants.

## [7.3.2.3]
### Bugfix
- You can now select Eberron Campaign Setting again. My bad.

## [7.3.2.2]
### Bugfix
- Repaired broken race selection dropdown and character summary on Stats & Character Details tab.

## [7.3.2.1]
### Bugfix
- Mind's Eye Psion variants actually implemented. Because I broke it.

### Added
- Added Valarian to the available deities


## [7.3.2.0]
### Bugfixes
- The Great Intelligence feat now only gives 1 Int instead of 3
- Epic level Monk unarmed strike damage no longer breaks things.
- Fist of the Forest unarmed strike damage corrected.
- Ordained Champion now properly gives access to the War domain.
- Added assorted missing Epic skill synergies

### Added
- Wild Shape is now a thing that you can do. It may be buggy due to incomplete animal stats. Expect future releases to gradually add more things you can turn into.
- Animal Companions have been implemented. Note: They don't calculate racial skill bonuses. Enter them manually.
- Mind's Eye Psion variants implemented (with thanks to torrasque666)
- Complete Divine Dweomerkeeper

### Changed
- Familiar damage calculations have been overhauled

### Removed
- Faiths and Pantheons Dweomerkeeper

## [7.3.1.2]
### Bugfix
- Lycanthrope skills work properly now.

## [7.3.1.1]
### Bugfix
- Feats tab was breaking something. Now it isn't.

## [7.3.1.0]
### Bugfixes
- Feats tab now properly resets with the rest of the sheet again.
- You can now be a dragonblooded meldshaper without horribly breaking things.
- Martial Study (White Raven) now properly grants Diplomacy as a class skill.
- Custom familiars work again.
- Cleaned up and fixed several vestige abilities

### Added
- Online prestige classes - Dwarven Chanter, Halfling Whistler, Swiftblade
- Zceryll vestige
- Mindsight feat
- Pseudonatural template


## [7.3.0.1]
### Bugfix
- Repaired broken source selection checkboxes.

## [7.3.0.0]
### Bugfixes
- Made enhancement bonuses affect damage on weapons other than 1st.
- Evereskan Tomb Guardians now properly have Knowledge (Western Heartlands) as a class skill
- Whisper gnomes now have their proper allotment of spell-like abilities.
- Lycanthropes can now actually use Control Shape
- Elemental Scions have their graft numbers calculated properly now.
- Skill tricks now require Complete Scoundrel to be selected for all classes
- Tattooed Monk's monkey tattoo now properly provides a competence bonus.
- Holy Strike now only replaces Ki Strike (magic), not the whole ability.
- Paladins, Rangers, and other similar classes have no caster level below level 4.
- Initiate of Pistis Sophia 10 now properly turns you into an Outsider.
- Conditional formatting on Feats tab repaired.
- Various multiple selection feats now display properly.
- Gestalt skill points properly calculated.
- Assorted minor quality of life and housekeeping changes.
- Assorted corrections to BoED classes.

### Added
- Starting ages for Incarnate, Soulborn, and Totemist.
- Prestige classes from the Player's Guide to Faerun appendix.
- Vampires now have undead immunities and vampire weaknesses.

### Changed
- Changed some behind-the-scenes code relating to lycanthropy and monstrous HD.
- Improved recognition of smite abilities for prereqs.

### Reverted
- Race selection method changes from [7.2.0.0] reverted

## [7.2.0.1]
### Bugfix
- Repaired source references. Oops.

## [7.2.0.0]
### Bugfixes
- Size modifiers now properly apply to grapple checks.
- The Quick trait now properly affects your base land speed.
- Swim speeds from templates now properly calculated.

### Added
- MM1 Devils as races.
- Implemented Fiendish Codex II.
- Note: Only Devil stats are implemented. Racial abilities are not.

### Changed
- Changed how race selection works, to enable races with brackets to not break the sheet.

## [7.1.1.2]
### Bugfix
- Fixed some cell references in the SoulmeldAbilities sheet.

## [7.1.1.1]
### Bugfix
- Disenchanter Mask no longer thinks it's a Diadem of Pure Light bound to your Crown chakra.

## [7.1.1.0]
### Bugfixes
- Made Spinemeld Warrior show available soulmelds properly.
- Skarns can now use their spines.
- Soulborns get the right number of smites per day now.
- Soultouched Spellcasting is no longer pretending to be Soulsight if you select it as a bonus feat.
- Elemental Savants can now pick an element.

### Added
- Magic of Incarnum Racial Substitution Levels
- Soul Manifester and psionic soulmelds

### Changed
- Renamed "Race & Stats" sheet to "Stats & Character Details"
- Alphabetised Racial Substitution Level entries.


## [7.1.0.0]
### Added
- Made Necrocarnate play nicely with the Soulmelds sheet
- Healing Soul feat
- Incarnum abilities calculation for non-soulmeld essentia receptacles.

## [7.0.0.1]
### Bugfix
- Changed calculation of availability of draconic soulmelds to refer to the right source

## [7.0.0.0]
- HeroForge Anew first release. Too many changes from previous versions to summarise.


