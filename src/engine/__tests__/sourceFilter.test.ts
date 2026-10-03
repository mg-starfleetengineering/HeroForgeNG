import { describe, it, expect } from 'vitest';
import { normalizeSourceCode, isSourceAllowed, getSourceBadgeInfo, ALL_SOURCES } from '../../utils/sourceFilter';
import racesData from '../../data/races.json';
import classesData from '../../data/classes.json';

describe('Source Filtering & Dragon Compendium Integration', () => {
  it('should include DrComp in ALL_SOURCES list', () => {
    const drComp = ALL_SOURCES.find(s => s.id === 'DrComp');
    expect(drComp).toBeDefined();
    expect(drComp?.name).toBe('Dragon Compendium');
    expect(drComp?.abbr).toBe('DrComp');
    expect(drComp?.isCore).toBe(false);
  });

  it('should normalize various Dragon Compendium alias strings to DrComp', () => {
    expect(normalizeSourceCode('DrComp')).toBe('DrComp');
    expect(normalizeSourceCode('drcomp')).toBe('DrComp');
    expect(normalizeSourceCode('DC')).toBe('DrComp');
    expect(normalizeSourceCode('dc')).toBe('DrComp');
    expect(normalizeSourceCode('DRC')).toBe('DrComp');
    expect(normalizeSourceCode('Dragon Compendium')).toBe('DrComp');
  });

  it('should validate isSourceAllowed when DrComp is in allowedSources', () => {
    const allowed = ['PHB', 'DMG', 'MM', 'DrComp'];
    expect(isSourceAllowed('DrComp', allowed)).toBe(true);
    expect(isSourceAllowed('DC', allowed)).toBe(true);
    expect(isSourceAllowed('DRC', allowed)).toBe(true);
    expect(isSourceAllowed('Dragon Compendium', allowed)).toBe(true);
    expect(isSourceAllowed('Frost', allowed)).toBe(false);
  });

  it('should return correct badge metadata for Dragon Compendium and aliases', () => {
    const badgeDC = getSourceBadgeInfo('DC', ['DrComp']);
    expect(badgeDC.sourceCode).toBe('DrComp');
    expect(badgeDC.sourceName).toBe('Dragon Compendium');
    expect(badgeDC.isCore).toBe(false);
    expect(badgeDC.isAllowed).toBe(true);

    const badgeDrComp = getSourceBadgeInfo('DrComp', ['DrComp']);
    expect(badgeDrComp.sourceCode).toBe('DrComp');
    expect(badgeDrComp.sourceName).toBe('Dragon Compendium');
    expect(badgeDrComp.isAllowed).toBe(true);
  });

  it('should confirm Dvati and Tibbit have DrComp source in races.json', () => {
    const dvati = racesData.find((r: { id: string }) => r.id === 'dvati');
    expect(dvati).toBeDefined();
    expect(dvati?.source).toBe('DrComp');

    const tibbit = racesData.find((r: { id: string }) => r.id === 'tibbit');
    expect(tibbit).toBeDefined();
    expect(tibbit?.source).toBe('DrComp');
  });

  it('should confirm Dragon Compendium prestige classes have DrComp source in classes.json', () => {
    const targetClasses = [
      'osteomancer',
      'urban_savant',
      'crimson_scourge',
      'heartwarder',
      'spellguard_of_silverymoon'
    ];

    for (const cid of targetClasses) {
      const cls = classesData.find((c: { id: string }) => c.id === cid);
      expect(cls).toBeDefined();
      expect(cls?.source).toBe('DrComp');
    }
  });
});
