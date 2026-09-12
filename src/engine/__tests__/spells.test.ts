import { describe, it, expect } from 'vitest';
import {
  getSpellSlotsForClass,
  getBonusSpells,
  isSpellcastingClassName,
  calculateSpellSaveDc,
  isPreparedCaster,
  getPreparedSlotsStructure,
  syncPreparedSlotsForCharacter,
  assignPreparedSpellSlot,
  clearPreparedSpellSlot,
  togglePreparedSpellSlotCast,
  clearAllPreparedSlots,
  resetAllPreparedSlotsCast,
  addSpellToSpellbook,
  removeSpellFromSpellbook,
  getStarterWizardCantripIds,
  getAvailableSpellsForPreparation,
  getAvailableSpellsForSlot,
  getSpellLevelForClass,
  getSpellLevelForDomain,
  getSpellSlotUsageKey,
  getExpendedSpellSlotsCount,
  getRemainingSpellSlotsCount,
  expendSpellSlot,
  restoreSpellSlot,
  setExpendedSpellSlots,
  resetExpendedSpellSlotsForClass,
  resetAllExpendedSpellSlots
} from '../spells';
import spellsData from '../../data/spells.json';
import suppSpellsData from '../../data/supplemental_domain_spells.json';
import domainsData from '../../data/domains.json';

describe('D&D 3.5e Spells Engine & Data Verification', () => {
  describe('Bonus Spells Calculation (PHB 3.5e Rule)', () => {
    it('should return 0 bonus spells for cantrips/level 0', () => {
      expect(getBonusSpells(5, 0)).toBe(0);
      expect(getBonusSpells(10, 0)).toBe(0);
    });

    it('should calculate correct bonus spells for 1st-4th level spells based on ability modifier', () => {
      expect(getBonusSpells(1, 1)).toBe(1);
      expect(getBonusSpells(1, 2)).toBe(0);

      expect(getBonusSpells(2, 1)).toBe(1);
      expect(getBonusSpells(2, 2)).toBe(1);
      expect(getBonusSpells(2, 3)).toBe(0);

      expect(getBonusSpells(5, 1)).toBe(2);
      expect(getBonusSpells(5, 2)).toBe(1);
      expect(getBonusSpells(5, 3)).toBe(1);
      expect(getBonusSpells(5, 4)).toBe(1);
      expect(getBonusSpells(5, 5)).toBe(1);
      expect(getBonusSpells(5, 6)).toBe(0);
    });
  });

  describe('Spell Slots Progression for Classes', () => {
    it('should return correct slots for a 5th-level Wizard with 18 INT (+4 mod)', () => {
      const wizardSlots = getSpellSlotsForClass('Wizard', 5, 4);
      expect(wizardSlots).not.toBeNull();
      expect(wizardSlots?.className).toBe('Wizard');
      expect(wizardSlots?.slots).toHaveLength(4);

      expect(wizardSlots?.slots[0].spellLevel).toBe(0);
      expect(wizardSlots?.slots[0].base).toBe(4);
      expect(wizardSlots?.slots[0].total).toBe(4);
      expect(wizardSlots?.slots[0].saveDc).toBe(14);

      expect(wizardSlots?.slots[1].spellLevel).toBe(1);
      expect(wizardSlots?.slots[1].base).toBe(3);
      expect(wizardSlots?.slots[1].bonus).toBe(1);
      expect(wizardSlots?.slots[1].total).toBe(4);
      expect(wizardSlots?.slots[1].saveDc).toBe(15);

      expect(wizardSlots?.slots[2].spellLevel).toBe(2);
      expect(wizardSlots?.slots[2].base).toBe(2);
      expect(wizardSlots?.slots[2].total).toBe(3);
      expect(wizardSlots?.slots[2].saveDc).toBe(16);

      expect(wizardSlots?.slots[3].spellLevel).toBe(3);
      expect(wizardSlots?.slots[3].base).toBe(1);
      expect(wizardSlots?.slots[3].total).toBe(2);
      expect(wizardSlots?.slots[3].saveDc).toBe(17);
    });

    it('should handle Paladin half-caster spell slots starting at level 4', () => {
      const paladinLow = getSpellSlotsForClass('Paladin', 3, 2);
      expect(paladinLow?.slots).toHaveLength(0);

      const paladinLvl4 = getSpellSlotsForClass('Paladin', 4, 2);
      expect(paladinLvl4?.slots).toHaveLength(1);
      expect(paladinLvl4?.slots[0].spellLevel).toBe(1);
      expect(paladinLvl4?.slots[0].base).toBe(0);
      expect(paladinLvl4?.slots[0].bonus).toBe(1);
      expect(paladinLvl4?.slots[0].total).toBe(1);
      expect(paladinLvl4?.slots[0].canCast).toBe(true);
    });

    it('should detect spellcasting class names correctly', () => {
      expect(isSpellcastingClassName('Wizard')).toBe(true);
      expect(isSpellcastingClassName('Cleric')).toBe(true);
      expect(isSpellcastingClassName('Bard')).toBe(true);
      expect(isSpellcastingClassName('Fighter')).toBe(false);
      expect(isSpellcastingClassName('Rogue')).toBe(false);
    });
  });

  describe('3.5e Core Spells Database Integrity', () => {
    it('should load 596 core spells with all required schema fields including separated classLevels & domainLevels', () => {
      expect(spellsData.length).toBe(596);

      spellsData.forEach(spell => {
        expect(spell.id).toBeTruthy();
        expect(spell.name).toBeTruthy();
        expect(spell.school).toBeTruthy();
        expect(spell.levels).toBeDefined();
        expect(typeof spell.levels).toBe('object');
        expect(spell.classLevels).toBeDefined();
        expect(typeof spell.classLevels).toBe('object');
        expect(spell.domainLevels).toBeDefined();
        expect(typeof spell.domainLevels).toBe('object');
        expect(spell.castingTime).toBeTruthy();
        expect(spell.range).toBeTruthy();
        expect(spell.duration).toBeTruthy();
        expect(spell.savingThrow).toBeTruthy();
        expect(spell.spellResistance).toBeTruthy();
        expect(spell.description).toBeTruthy();
        expect(spell.source).toBe('PHB');
      });
    });

    it('should contain iconic spells with accurate schools, classLevels, and domainLevels', () => {
      const fireball = spellsData.find(s => s.name === 'Fireball');
      expect(fireball).toBeDefined();
      expect(fireball?.school).toBe('Evocation');
      expect(fireball?.levels['Sorcerer']).toBe(3);
      expect(fireball?.levels['Wizard']).toBe(3);
      expect(fireball?.classLevels?.['Sorcerer']).toBe(3);
      expect(fireball?.classLevels?.['Wizard']).toBe(3);
      expect(fireball?.savingThrow).toContain('Reflex');

      const magicMissile = spellsData.find(s => s.name === 'Magic Missile');
      expect(magicMissile).toBeDefined();
      expect(magicMissile?.school).toBe('Evocation');
      expect(magicMissile?.levels['Wizard']).toBe(1);
      expect(magicMissile?.classLevels?.['Wizard']).toBe(1);

      const cureLight = spellsData.find(s => s.name === 'Cure Light Wounds');
      expect(cureLight).toBeDefined();
      expect(cureLight?.school).toBe('Conjuration');
      expect(cureLight?.levels['Cleric']).toBe(1);
      expect(cureLight?.classLevels?.['Cleric']).toBe(1);

      // Acid Fog: Wizard 6, Sorcerer 6, Water 7
      const acidFog = spellsData.find(s => s.name === 'Acid Fog');
      expect(acidFog).toBeDefined();
      expect(acidFog?.classLevels?.['Wizard']).toBe(6);
      expect(acidFog?.classLevels?.['Sorcerer']).toBe(6);
      expect(acidFog?.domainLevels?.['Water']).toBe(7);
      // Water domain must NOT leak into classLevels
      expect(acidFog?.classLevels?.['Water']).toBeUndefined();
      // Wizard/Sorcerer must NOT leak into domainLevels
      expect(acidFog?.domainLevels?.['Wizard']).toBeUndefined();
      expect(acidFog?.domainLevels?.['Sorcerer']).toBeUndefined();

      // Slime domain grants Melf's Acid Arrow at level 2
      const acidArrow = spellsData.find(s => s.name === "Melf's Acid Arrow");
      expect(acidArrow).toBeDefined();
      expect(acidArrow?.classLevels?.['Wizard']).toBe(2);
      expect(acidArrow?.domainLevels?.['Slime']).toBe(2);
    });

    it('should load 158 domains with canonical spellIds', () => {
      expect(domainsData.length).toBe(158);

      domainsData.forEach(dom => {
        expect(dom.id).toBeTruthy();
        expect(dom.name).toBeTruthy();
        expect(dom.spells).toBeDefined();
        expect(dom.spells.length).toBeGreaterThanOrEqual(8);
        expect(dom.spellIds).toBeDefined();
        expect(dom.spellIds?.length).toBe(dom.spells.length);
        // All spell IDs must be non-empty strings
        dom.spellIds?.forEach(spId => {
          expect(typeof spId).toBe('string');
          expect(spId.length).toBeGreaterThan(0);
        });
      });

      // Check iconic domains
      const air = domainsData.find(d => d.name === 'Air');
      expect(air?.spellIds?.[0]).toBe('obscuring_mist');
      expect(air?.spellIds?.[8]).toBe('elemental_swarm');

      const war = domainsData.find(d => d.name === 'War');
      expect(war?.spellIds?.[0]).toBe('magic_weapon');
      expect(war?.spellIds?.[1]).toBe('spiritual_weapon');

      const healing = domainsData.find(d => d.name === 'Healing');
      expect(healing?.spellIds?.[4]).toBe('mass_cure_light_wounds');
      expect(healing?.spellIds?.[8]).toBe('mass_heal');
    });

    it('should load supplemental domain spells from Excel workbook with classLevels & domainLevels', () => {
      expect(suppSpellsData.length).toBeGreaterThan(200);

      suppSpellsData.forEach(sp => {
        expect(sp.id).toBeTruthy();
        expect(sp.name).toBeTruthy();
        expect(sp.excelOrigin).toBeDefined();
        expect(sp.excelOrigin.sheet).toBe('Domains');
        expect(sp.domains.length).toBeGreaterThan(0);
        expect(sp.levels).toBeDefined();
        expect(sp.classLevels).toBeDefined();
        expect(sp.domainLevels).toBeDefined();
      });
    });
  });

  describe('Chunk 5.2: Live Spellbook & Daily Preparation Workshop Engine', () => {
    describe('Spell Save DC Calculation (10 + spellLevel + keyAbilityMod)', () => {
      it('should calculate accurate DCs across 0th-9th level spells', () => {
        // INT mod +4 (Wizard with 18 INT)
        expect(calculateSpellSaveDc(0, 4)).toBe(14);
        expect(calculateSpellSaveDc(1, 4)).toBe(15);
        expect(calculateSpellSaveDc(3, 4)).toBe(17);
        expect(calculateSpellSaveDc(9, 4)).toBe(23);

        // WIS mod +6 (Cleric with 22 WIS)
        expect(calculateSpellSaveDc(0, 6)).toBe(16);
        expect(calculateSpellSaveDc(1, 6)).toBe(17);
        expect(calculateSpellSaveDc(5, 6)).toBe(21);
        expect(calculateSpellSaveDc(9, 6)).toBe(25);

        // Paladin WIS mod +2 (14 WIS)
        expect(calculateSpellSaveDc(1, 2)).toBe(13);
        expect(calculateSpellSaveDc(4, 2)).toBe(16);
      });
    });

    describe('Prepared Casters Identification', () => {
      it('should identify prepared casters correctly', () => {
        expect(isPreparedCaster('Wizard')).toBe(true);
        expect(isPreparedCaster('Cleric')).toBe(true);
        expect(isPreparedCaster('Druid')).toBe(true);
        expect(isPreparedCaster('Paladin')).toBe(true);
        expect(isPreparedCaster('Ranger')).toBe(true);
        expect(isPreparedCaster('Archivist')).toBe(true);
        expect(isPreparedCaster('Wu Jen')).toBe(true);

        expect(isPreparedCaster('Sorcerer')).toBe(false);
        expect(isPreparedCaster('Bard')).toBe(false);
        expect(isPreparedCaster('Fighter')).toBe(false);
        expect(isPreparedCaster('Rogue')).toBe(false);
      });
    });

    describe('Prepared Slot Structure & Cleric Domain Slots', () => {
      it('should generate accurate slot structure for Wizard 5 (+4 INT)', () => {
        const structure = getPreparedSlotsStructure('Wizard', 5, 4);
        expect(structure).toHaveLength(4); // 0, 1, 2, 3

        // Level 0: 4 base, 0 bonus, 0 domain = 4 total, DC 14
        expect(structure[0].spellLevel).toBe(0);
        expect(structure[0].totalSlots).toBe(4);
        expect(structure[0].domainSlots).toBe(0);
        expect(structure[0].saveDc).toBe(14);

        // Level 1: 3 base + 1 bonus = 4 total, DC 15
        expect(structure[1].spellLevel).toBe(1);
        expect(structure[1].totalSlots).toBe(4);
        expect(structure[1].domainSlots).toBe(0);
        expect(structure[1].saveDc).toBe(15);

        // Level 2: 2 base + 1 bonus = 3 total, DC 16
        expect(structure[2].spellLevel).toBe(2);
        expect(structure[2].totalSlots).toBe(3);
        expect(structure[2].domainSlots).toBe(0);
        expect(structure[2].saveDc).toBe(16);

        // Level 3: 1 base + 1 bonus = 2 total, DC 17
        expect(structure[3].spellLevel).toBe(3);
        expect(structure[3].totalSlots).toBe(2);
        expect(structure[3].domainSlots).toBe(0);
        expect(structure[3].saveDc).toBe(17);
      });

      it('should append +1 domain slot per spell level 1-9 for Clerics', () => {
        const clericStruct = getPreparedSlotsStructure('Cleric', 5, 4, ['War', 'Healing']);
        expect(clericStruct).toHaveLength(4); // 0, 1, 2, 3

        // Level 0: 4 total, 0 domain slots
        expect(clericStruct[0].spellLevel).toBe(0);
        expect(clericStruct[0].regularSlots).toBe(4);
        expect(clericStruct[0].domainSlots).toBe(0);
        expect(clericStruct[0].totalSlots).toBe(4);

        // Level 1: 4 regular (3+1) + 1 domain = 5 total
        expect(clericStruct[1].spellLevel).toBe(1);
        expect(clericStruct[1].regularSlots).toBe(4);
        expect(clericStruct[1].domainSlots).toBe(1);
        expect(clericStruct[1].totalSlots).toBe(5);

        // Level 2: 3 regular (2+1) + 1 domain = 4 total
        expect(clericStruct[2].spellLevel).toBe(2);
        expect(clericStruct[2].regularSlots).toBe(3);
        expect(clericStruct[2].domainSlots).toBe(1);
        expect(clericStruct[2].totalSlots).toBe(4);

        // Level 3: 2 regular (1+1) + 1 domain = 3 total
        expect(clericStruct[3].spellLevel).toBe(3);
        expect(clericStruct[3].regularSlots).toBe(2);
        expect(clericStruct[3].domainSlots).toBe(1);
        expect(clericStruct[3].totalSlots).toBe(3);
      });
    });

    describe('Slot Synchronization, Assignment, and In-Play Cast Toggle', () => {
      it('should synchronize slots and retain assigned spells', () => {
        const initialSlots = syncPreparedSlotsForCharacter('Wizard', 5, 4);
        expect(initialSlots.length).toBe(13); // 4 + 4 + 3 + 2 = 13 slots

        // Assign Magic Missile to Wizard lvl 1 slot 0
        const assigned = assignPreparedSpellSlot(initialSlots, 'wizard_lvl1_slot_0', {
          id: 'magic_missile',
          name: 'Magic Missile'
        });

        const slot = assigned.find(s => s.id === 'wizard_lvl1_slot_0');
        expect(slot).toBeDefined();
        expect(slot?.spellId).toBe('magic_missile');
        expect(slot?.spellName).toBe('Magic Missile');
        expect(slot?.isCast).toBe(false);

        // Level up Wizard to 6 (re-sync)
        const resynced = syncPreparedSlotsForCharacter('Wizard', 6, 4, [], assigned);
        const retained = resynced.find(s => s.id === 'wizard_lvl1_slot_0');
        expect(retained?.spellId).toBe('magic_missile');
      });

      it('should toggle cast/expended state and reset on rest', () => {
        let slots = syncPreparedSlotsForCharacter('Wizard', 5, 4);
        slots = assignPreparedSpellSlot(slots, 'wizard_lvl1_slot_0', {
          id: 'magic_missile',
          name: 'Magic Missile'
        });

        // Cast the spell
        slots = togglePreparedSpellSlotCast(slots, 'wizard_lvl1_slot_0');
        expect(slots.find(s => s.id === 'wizard_lvl1_slot_0')?.isCast).toBe(true);

        // Reset after rest
        slots = resetAllPreparedSlotsCast(slots, 'Wizard');
        expect(slots.find(s => s.id === 'wizard_lvl1_slot_0')?.isCast).toBe(false);
      });

      it('should clear individual and all prepared slots', () => {
        let slots = syncPreparedSlotsForCharacter('Wizard', 5, 4);
        slots = assignPreparedSpellSlot(slots, 'wizard_lvl1_slot_0', {
          id: 'magic_missile',
          name: 'Magic Missile'
        });
        slots = assignPreparedSpellSlot(slots, 'wizard_lvl1_slot_1', {
          id: 'shield',
          name: 'Shield'
        });

        // Clear one slot
        slots = clearPreparedSpellSlot(slots, 'wizard_lvl1_slot_0');
        expect(slots.find(s => s.id === 'wizard_lvl1_slot_0')?.spellId).toBeNull();
        expect(slots.find(s => s.id === 'wizard_lvl1_slot_1')?.spellId).toBe('shield');

        // Clear all slots
        slots = clearAllPreparedSlots(slots, 'Wizard');
        expect(slots.every(s => s.spellId === null)).toBe(true);
      });
    });

    describe('Live Spellbook Management', () => {
      it('should add and remove spells from live spellbook without duplicates', () => {
        let spellbook: string[] = [];

        spellbook = addSpellToSpellbook(spellbook, 'magic_missile');
        expect(spellbook).toEqual(['magic_missile']);

        // Prevent duplicate
        spellbook = addSpellToSpellbook(spellbook, 'magic_missile');
        expect(spellbook).toHaveLength(1);

        spellbook = addSpellToSpellbook(spellbook, 'fireball');
        expect(spellbook).toEqual(['magic_missile', 'fireball']);

        spellbook = removeSpellFromSpellbook(spellbook, 'magic_missile');
        expect(spellbook).toEqual(['fireball']);
      });

      it('should return starter cantrips for wizard', () => {
        const cantripIds = getStarterWizardCantripIds(spellsData as any);
        expect(cantripIds.length).toBeGreaterThan(10);
        expect(cantripIds).toContain('detect_magic');
        expect(cantripIds).toContain('light');
        expect(cantripIds).toContain('read_magic');
      });
    });

    describe('Available Spells Resolution for Preparation', () => {
      const mockCharacter: any = {
        name: 'Elminster',
        spellbookSpells: ['magic_missile', 'shield', 'fireball'],
        selectedDomains: ['War', 'Healing']
      };

      it('should restrict Wizard preparation to spells recorded in Spellbook when onlySpellbook is true', () => {
        const level1Spells = getAvailableSpellsForPreparation(
          'Wizard',
          1,
          mockCharacter,
          spellsData as any,
          [],
          false,
          true // onlySpellbook
        );

        // Only magic_missile and shield are in spellbook
        const ids = level1Spells.map(s => s.id);
        expect(ids).toContain('magic_missile');
        expect(ids).toContain('shield');
        expect(ids).not.toContain('mage_armor'); // not in spellbook

        // When onlySpellbook is false, returns all class spells for browsing & preparation
        const allLevel1WizardSpells = getAvailableSpellsForPreparation(
          'Wizard',
          1,
          mockCharacter,
          spellsData as any,
          [],
          false,
          false
        );
        const allIds = allLevel1WizardSpells.map(s => s.id);
        expect(allIds).toContain('magic_missile');
        expect(allIds).toContain('mage_armor');
      });


      it('should allow Cleric preparation from all divine spells of that level', () => {
        const level1ClericSpells = getAvailableSpellsForPreparation(
          'Cleric',
          1,
          mockCharacter,
          spellsData as any
        );

        const ids = level1ClericSpells.map(s => s.id);
        expect(ids).toContain('cure_light_wounds');
        expect(ids).toContain('bless');
        expect(ids).toContain('sanctuary');
      });

      it('should filter domain spells for Cleric domain slots', () => {
        const mockDomains: any[] = [
          { id: 'war', name: 'War', spells: ['Magic Weapon', 'Spiritual Weapon'] },
          { id: 'healing', name: 'Healing', spells: ['Cure Light Wounds', 'Cure Moderate Wounds'] }
        ];

        const domainSpellsLvl1 = getAvailableSpellsForPreparation(
          'Cleric',
          1,
          mockCharacter,
          spellsData as any,
          mockDomains,
          true // isDomainSlot
        );

        const names = domainSpellsLvl1.map(s => s.name);
        expect(names).toContain('Magic Weapon');
        expect(names).toContain('Cure Light Wounds');
      });
    });

    describe('Active Spell Slot Cast Tracking & Clamping', () => {
      it('should generate deterministic slot keys for any class and spell level', () => {
        expect(getSpellSlotUsageKey('Sorcerer', 1)).toBe('sorcerer_lvl1');
        expect(getSpellSlotUsageKey('Wizard', 0)).toBe('wizard_lvl0');
        expect(getSpellSlotUsageKey('Favored Soul', 3)).toBe('favored_soul_lvl3');
        expect(getSpellSlotUsageKey('Cleric', 9)).toBe('cleric_lvl9');
      });

      it('should read expended count and compute remaining slots correctly', () => {
        const expendedMap = {
          sorcerer_lvl1: 2,
          sorcerer_lvl0: 0,
          cleric_lvl1: 1
        };

        expect(getExpendedSpellSlotsCount(expendedMap, 'Sorcerer', 1)).toBe(2);
        expect(getExpendedSpellSlotsCount(expendedMap, 'Sorcerer', 0)).toBe(0);
        expect(getExpendedSpellSlotsCount(expendedMap, 'Sorcerer', 2)).toBe(0);
        expect(getExpendedSpellSlotsCount(undefined, 'Sorcerer', 1)).toBe(0);

        expect(getRemainingSpellSlotsCount(expendedMap, 'Sorcerer', 1, 4)).toBe(2);
        expect(getRemainingSpellSlotsCount(expendedMap, 'Sorcerer', 1, 2)).toBe(0);
        expect(getRemainingSpellSlotsCount(expendedMap, 'Sorcerer', 2, 3)).toBe(3);
      });

      it('should expend spell slots with upper clamp to maxSlots', () => {
        let map: Record<string, number> | undefined = undefined;

        // Spend 1 slot out of 4
        map = expendSpellSlot(map, 'Sorcerer', 1, 4, 1);
        expect(map['sorcerer_lvl1']).toBe(1);

        // Spend 2 more
        map = expendSpellSlot(map, 'Sorcerer', 1, 4, 2);
        expect(map['sorcerer_lvl1']).toBe(3);

        // Spend 5 more (should clamp to maxSlots 4)
        map = expendSpellSlot(map, 'Sorcerer', 1, 4, 5);
        expect(map['sorcerer_lvl1']).toBe(4);
      });

      it('should restore spell slots with lower clamp to 0', () => {
        let map: Record<string, number> = { sorcerer_lvl1: 3 };

        // Restore 1 slot
        map = restoreSpellSlot(map, 'Sorcerer', 1, 4, 1);
        expect(map['sorcerer_lvl1']).toBe(2);

        // Restore 10 slots (should clamp to 0)
        map = restoreSpellSlot(map, 'Sorcerer', 1, 4, 10);
        expect(map['sorcerer_lvl1']).toBe(0);
      });

      it('should directly set expended slots clamped between 0 and maxSlots', () => {
        let map = setExpendedSpellSlots(undefined, 'Wizard', 2, 2, 4);
        expect(map['wizard_lvl2']).toBe(2);

        // Setting negative count clamps to 0
        map = setExpendedSpellSlots(map, 'Wizard', 2, -5, 4);
        expect(map['wizard_lvl2']).toBe(0);

        // Setting above max clamps to maxSlots
        map = setExpendedSpellSlots(map, 'Wizard', 2, 10, 4);
        expect(map['wizard_lvl2']).toBe(4);
      });

      it('should reset expended slots for a single class without affecting other classes', () => {
        const multiclassMap = {
          sorcerer_lvl0: 2,
          sorcerer_lvl1: 3,
          cleric_lvl1: 2,
          cleric_lvl2: 1
        };

        const afterSorcererReset = resetExpendedSpellSlotsForClass(multiclassMap, 'Sorcerer');
        expect(afterSorcererReset['sorcerer_lvl0']).toBeUndefined();
        expect(afterSorcererReset['sorcerer_lvl1']).toBeUndefined();
        expect(afterSorcererReset['cleric_lvl1']).toBe(2);
        expect(afterSorcererReset['cleric_lvl2']).toBe(1);
      });

      it('should reset all expended spell slots across all classes', () => {
        expect(resetAllExpendedSpellSlots()).toEqual({});
      });
    });
  });

  describe('Domain Spell Slot Resolution (getAvailableSpellsForSlot)', () => {
    const mockDomains: any[] = [
      {
        id: 'sun',
        name: 'Sun',
        power: 'Turn undead',
        spells: ['Endure Elements', 'Heat Metal'],
        spellIds: ['endure_elements', 'heat_metal']
      },
      {
        id: 'war',
        name: 'War',
        power: 'Free martial proficiency',
        spells: ['Magic Weapon', 'Spiritual Weapon'],
        spellIds: ['magic_weapon', 'spiritual_weapon']
      }
    ];

    const mockSpells: any[] = [
      {
        id: 'magic_weapon',
        name: 'Magic Weapon',
        levels: { Cleric: 1, War: 1, Paladin: 1 },
        classLevels: { Cleric: 1, Paladin: 1 },
        domainLevels: { War: 1 }
      },
      {
        id: 'warmage_edge_spell',
        name: 'Fist of Stone',
        levels: { Warmage: 1, Sorcerer: 1 },
        classLevels: { Warmage: 1, Sorcerer: 1 },
        domainLevels: {}
      },
      {
        id: 'beguiler_spell',
        name: 'Whelm',
        levels: { Beguiler: 1 },
        classLevels: { Beguiler: 1 },
        domainLevels: {}
      },
      {
        id: 'duskblade_spell',
        name: 'Blade of Blood',
        levels: { Duskblade: 1 },
        classLevels: { Duskblade: 1 },
        domainLevels: {}
      },
      {
        id: 'endure_elements',
        name: 'Endure Elements',
        levels: { Cleric: 1, Sun: 1, Druid: 1, Paladin: 1 },
        classLevels: { Cleric: 1, Druid: 1, Paladin: 1 },
        domainLevels: { Sun: 1 }
      },
      {
        id: 'entangle',
        name: 'Entangle',
        levels: { Druid: 1, Plant: 1 },
        classLevels: { Druid: 1 },
        domainLevels: { Plant: 1 }
      }
    ];

    it('returns spells matching character selected domains via getAvailableSpellsForSlot', () => {
      const char = { selectedDomains: ['War'] } as any;
      const domainSlot = {
        id: 'cleric_lvl1_domain_0',
        className: 'Cleric',
        classId: 'cleric',
        spellLevel: 1,
        slotIndex: 0,
        spellId: null,
        isDomain: true
      };

      const available = getAvailableSpellsForSlot(
        domainSlot,
        char,
        mockSpells,
        mockDomains
      );

      expect(available.some(s => s.name === 'Magic Weapon')).toBe(true);
      expect(available.some(s => s.name === 'Endure Elements')).toBe(false);
      expect(available.some(s => s.name === 'Fist of Stone')).toBe(false);
      expect(available.some(s => s.name === 'Whelm')).toBe(false);
      expect(available.some(s => s.name === 'Blade of Blood')).toBe(false);
    });

    it('does NOT treat non-core classes (Warmage, Beguiler, Duskblade) as domains in domain slot fallback', () => {
      // Character has no selected domains yet -> fallback triggers
      const char = { selectedDomains: [] } as any;
      const available = getAvailableSpellsForPreparation(
        'Cleric',
        1,
        char,
        mockSpells,
        mockDomains,
        true // isDomainSlot
      );

      // Warmage, Beguiler & Duskblade spells must NEVER be returned as domain spells
      expect(available.some(s => s.name === 'Fist of Stone')).toBe(false);
      expect(available.some(s => s.name === 'Whelm')).toBe(false);
      expect(available.some(s => s.name === 'Blade of Blood')).toBe(false);

      // Spells on true domain lists should be included
      expect(available.some(s => s.name === 'Magic Weapon')).toBe(true);
      expect(available.some(s => s.name === 'Endure Elements')).toBe(true);
    });

    it('strictly isolates class slots from domain slots for Gestalt characters (Cleric / Druid)', () => {
      const gestaltChar = {
        selectedDomains: ['War'],
        classes: [
          { name: 'Cleric', level: 3 },
          { name: 'Druid', level: 3 }
        ]
      } as any;

      const druidRegularSlot = {
        id: 'druid_lvl1_slot_0',
        className: 'Druid',
        classId: 'druid',
        spellLevel: 1,
        slotIndex: 0,
        spellId: null,
        isDomain: false
      };

      const clericRegularSlot = {
        id: 'cleric_lvl1_slot_0',
        className: 'Cleric',
        classId: 'cleric',
        spellLevel: 1,
        slotIndex: 0,
        spellId: null,
        isDomain: false
      };

      const clericDomainSlot = {
        id: 'cleric_lvl1_domain_0',
        className: 'Cleric',
        classId: 'cleric',
        spellLevel: 1,
        slotIndex: 0,
        spellId: null,
        isDomain: true
      };

      // Druid regular slot:
      // - Must contain Entangle (Druid 1) and Endure Elements (Druid 1)
      // - Must NOT contain Magic Weapon (War 1 / Cleric 1, but NOT Druid)
      const druidAvailable = getAvailableSpellsForSlot(
        druidRegularSlot,
        gestaltChar,
        mockSpells,
        mockDomains
      );
      expect(druidAvailable.some(s => s.name === 'Entangle')).toBe(true);
      expect(druidAvailable.some(s => s.name === 'Endure Elements')).toBe(true);
      expect(druidAvailable.some(s => s.name === 'Magic Weapon')).toBe(false);

      // Cleric regular slot:
      // - Must contain Magic Weapon (Cleric 1) and Endure Elements (Cleric 1)
      // - Must NOT contain Entangle (Druid only)
      const clericRegularAvailable = getAvailableSpellsForSlot(
        clericRegularSlot,
        gestaltChar,
        mockSpells,
        mockDomains
      );
      expect(clericRegularAvailable.some(s => s.name === 'Magic Weapon')).toBe(true);
      expect(clericRegularAvailable.some(s => s.name === 'Endure Elements')).toBe(true);
      expect(clericRegularAvailable.some(s => s.name === 'Entangle')).toBe(false);

      // Cleric domain slot:
      // - Must contain Magic Weapon (War domain)
      // - Must NOT contain Endure Elements (Sun domain, not selected)
      // - Must NOT contain Entangle
      const clericDomainAvailable = getAvailableSpellsForSlot(
        clericDomainSlot,
        gestaltChar,
        mockSpells,
        mockDomains
      );
      expect(clericDomainAvailable.some(s => s.name === 'Magic Weapon')).toBe(true);
      expect(clericDomainAvailable.some(s => s.name === 'Endure Elements')).toBe(false);
      expect(clericDomainAvailable.some(s => s.name === 'Entangle')).toBe(false);
    });

    it('maintains backward compatibility with legacy slot definitions without classId / domainId', () => {
      // Legacy slots created before Sprint 5 without classId or domainId
      const legacySlots = [
        {
          id: 'cleric_lvl1_slot_0',
          className: 'Cleric',
          spellLevel: 1,
          slotIndex: 0,
          spellId: 'bless',
          spellName: 'Bless',
          isDomain: false,
          isCast: false
        },
        {
          id: 'cleric_lvl1_domain_0',
          className: 'Cleric',
          spellLevel: 1,
          slotIndex: 0,
          spellId: null,
          isDomain: true,
          isCast: false
        }
      ];

      // Reconcile and synchronize
      const synced = syncPreparedSlotsForCharacter('Cleric', 1, 3, ['War'], legacySlots as any);
      const regularSlot = synced.find(s => s.id === 'cleric_lvl1_slot_0');
      const domainSlot = synced.find(s => s.id === 'cleric_lvl1_domain_0');

      expect(regularSlot).toBeDefined();
      expect(regularSlot?.classId).toBe('cleric');
      expect(regularSlot?.spellId).toBe('bless');

      expect(domainSlot).toBeDefined();
      expect(domainSlot?.classId).toBe('cleric');
      expect(domainSlot?.isDomain).toBe(true);

      // Assign spell with domainId
      const assigned = assignPreparedSpellSlot(synced, 'cleric_lvl1_domain_0', {
        id: 'magic_weapon',
        name: 'Magic Weapon',
        domainId: 'war'
      });
      const assignedDomainSlot = assigned.find(s => s.id === 'cleric_lvl1_domain_0');
      expect(assignedDomainSlot?.spellId).toBe('magic_weapon');
      expect(assignedDomainSlot?.domainId).toBe('war');

      // Clear slot
      const cleared = clearPreparedSpellSlot(assigned, 'cleric_lvl1_domain_0');
      const clearedDomainSlot = cleared.find(s => s.id === 'cleric_lvl1_domain_0');
      expect(clearedDomainSlot?.spellId).toBeNull();
      expect(clearedDomainSlot?.domainId).toBeUndefined();
    });

    it('maintains backward compatibility with legacy spells having only .levels map', () => {
      const legacySpells: any[] = [
        {
          id: 'legacy_cure',
          name: 'Legacy Cure',
          levels: { Cleric: 1, Healing: 1 }
        },
        {
          id: 'legacy_smite',
          name: 'Legacy Smite',
          levels: { Paladin: 1, Destruction: 1 }
        }
      ];

      // Resolves class level via getSpellLevelForClass fallback
      expect(getSpellLevelForClass(legacySpells[0], 'Cleric')).toBe(1);
      expect(getSpellLevelForClass(legacySpells[1], 'Paladin')).toBe(1);
      expect(getSpellLevelForClass(legacySpells[0], 'Wizard')).toBeUndefined();

      // Resolves domain level via getSpellLevelForDomain fallback
      expect(getSpellLevelForDomain(legacySpells[0], 'Healing')).toBe(1);
      expect(getSpellLevelForDomain(legacySpells[1], 'Destruction')).toBe(1);
      expect(getSpellLevelForDomain(legacySpells[0], 'War')).toBeUndefined();

      // Resolves domain slot available spells
      const char = { selectedDomains: ['Healing'] } as any;
      const domainSlot = {
        id: 'cleric_lvl1_domain_0',
        className: 'Cleric',
        spellLevel: 1,
        slotIndex: 0,
        spellId: null,
        isDomain: true
      };

      const available = getAvailableSpellsForSlot(
        domainSlot,
        char,
        legacySpells,
        [{ id: 'healing', name: 'Healing', power: '', spells: ['Legacy Cure'] } as any]
      );
      expect(available.some(s => s.name === 'Legacy Cure')).toBe(true);
      expect(available.some(s => s.name === 'Legacy Smite')).toBe(false);
    });
  });
});

