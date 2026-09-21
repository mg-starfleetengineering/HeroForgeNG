import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchCoreCompendiumData,
  fetchDeferredCompendiumData,
  fetchCompendiumData
} from '../../context/GameDataContext';

describe('Phase 5C: Compendium Dataset Streaming & Progressive Hydration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchCoreCompendiumData should successfully fetch all 8 Tier 1 core datasets', async () => {
    const mockCoreData: Record<string, any[]> = {
      './data/races.json': [{ id: 'human', name: 'Human' }],
      './data/classes.json': [{ id: 'fighter', name: 'Fighter' }],
      './data/weapons.json': [{ id: 'longsword', name: 'Longsword' }],
      './data/traits.json': [{ id: 'quick', name: 'Quick' }],
      './data/flaws.json': [{ id: 'shaky', name: 'Shaky' }],
      './data/templates.json': [{ id: 'fiendish', name: 'Fiendish' }],
      './data/domains.json': [{ id: 'sun', name: 'Sun' }],
      './data/deities.json': [{ id: 'pelor', name: 'Pelor' }]
    };

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (mockCoreData[url]) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCoreData[url])
        });
      }
      return Promise.reject(new Error(`Unknown mock endpoint: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);

    const core = await fetchCoreCompendiumData();

    expect(core.racesData).toHaveLength(1);
    expect(core.racesData[0].name).toBe('Human');
    expect(core.classesData).toHaveLength(1);
    expect(core.classesData[0].name).toBe('Fighter');
    expect(core.weaponsData).toHaveLength(1);
    expect(core.weaponsData[0].name).toBe('Longsword');
    expect(core.traitsData).toHaveLength(1);
    expect(core.flawsData).toHaveLength(1);
    expect(core.templatesData).toHaveLength(1);
    expect(core.domainsData).toHaveLength(1);
    expect(core.deitiesData).toHaveLength(1);
  });

  it('fetchDeferredCompendiumData should successfully fetch all 7 Tier 2 secondary datasets', async () => {
    const mockDeferredData: Record<string, any[]> = {
      './data/feats.json': [{ id: 'power_attack', name: 'Power Attack' }],
      './data/skill_tricks.json': [{ id: 'extreme_leap', name: 'Extreme Leap' }],
      './data/familiars.json': [{ id: 'raven', name: 'Raven' }],
      './data/animal_companions.json': [{ id: 'wolf', name: 'Wolf' }],
      './data/wildshape_forms.json': [{ id: 'dire_bear', name: 'Dire Bear' }],
      './data/spells.json': [{ id: 'fireball', name: 'Fireball' }],
      './data/supplemental_domain_spells.json': [{ id: 'sunburst', name: 'Sunburst' }]
    };

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (mockDeferredData[url]) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDeferredData[url])
        });
      }
      return Promise.reject(new Error(`Unknown mock endpoint: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);

    const deferred = await fetchDeferredCompendiumData();

    expect(deferred.featsData).toHaveLength(1);
    expect(deferred.featsData[0].name).toBe('Power Attack');
    expect(deferred.skillTricksData).toHaveLength(1);
    expect(deferred.familiarsData).toHaveLength(1);
    expect(deferred.animalCompanionsData).toHaveLength(1);
    expect(deferred.wildShapeFormsData).toHaveLength(1);
    expect(deferred.spellsData).toHaveLength(1);
    expect(deferred.spellsData[0].name).toBe('Fireball');
    expect(deferred.supplementalSpellsData).toHaveLength(1);
  });

  it('fetchCompendiumData should merge both core and deferred datasets concurrently', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: 'test_entry', url }])
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const allData = await fetchCompendiumData();

    expect(allData.racesData).toHaveLength(1);
    expect(allData.classesData).toHaveLength(1);
    expect(allData.weaponsData).toHaveLength(1);
    expect(allData.featsData).toHaveLength(1);
    expect(allData.spellsData).toHaveLength(1);
    expect(allData.animalCompanionsData).toHaveLength(1);
    expect(allData.familiarsData).toHaveLength(1);
  });

  it('fetchDeferredCompendiumData should gracefully handle network errors without rejecting', async () => {
    // Simulate failing fetch for spells.json but succeeding for feats.json
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === './data/spells.json') {
        return Promise.reject(new Error('Network error 500'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: 'ok' }])
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const deferred = await fetchDeferredCompendiumData();

    expect(deferred.featsData).toHaveLength(1);
    expect(deferred.spellsData).toEqual([]); // Fallback to empty array
    expect(deferred.animalCompanionsData).toHaveLength(1);
  });
});
