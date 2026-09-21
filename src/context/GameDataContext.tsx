import React, { createContext, use, useState, useEffect, useMemo, useCallback } from 'react';
import {
  RaceData,
  ClassData,
  WeaponData,
  FeatData,
  TraitData,
  FlawData,
  SkillTrickData,
  TemplateData,
  DomainData,
  DeityData,
  FamiliarData,
  AnimalCompanionData,
  WildShapeFormData,
  SpellData,
  SupplementalDomainSpellData
} from '../types/character';

export interface CompendiumData {
  racesData: RaceData[];
  classesData: ClassData[];
  weaponsData: WeaponData[];
  featsData: FeatData[];
  traitsData: TraitData[];
  flawsData: FlawData[];
  skillTricksData: SkillTrickData[];
  templatesData: TemplateData[];
  domainsData: DomainData[];
  deitiesData: DeityData[];
  familiarsData: FamiliarData[];
  animalCompanionsData: AnimalCompanionData[];
  wildShapeFormsData: WildShapeFormData[];
  spellsData: SpellData[];
  supplementalSpellsData: SupplementalDomainSpellData[];
}

export type CoreCompendiumData = Pick<
  CompendiumData,
  'racesData' | 'classesData' | 'weaponsData' | 'traitsData' | 'flawsData' | 'templatesData' | 'domainsData' | 'deitiesData'
>;

export type DeferredCompendiumData = Pick<
  CompendiumData,
  'featsData' | 'spellsData' | 'supplementalSpellsData' | 'animalCompanionsData' | 'wildShapeFormsData' | 'familiarsData' | 'skillTricksData'
>;

export interface GameDataContextValue extends CompendiumData {
  loading: boolean;
  secondaryLoading: boolean;
  isDatasetLoaded: (key: keyof CompendiumData) => boolean;
  error: Error | null;
}

const EMPTY_COMPENDIUM: CompendiumData = {
  racesData: [],
  classesData: [],
  weaponsData: [],
  featsData: [],
  traitsData: [],
  flawsData: [],
  skillTricksData: [],
  templatesData: [],
  domainsData: [],
  deitiesData: [],
  familiarsData: [],
  animalCompanionsData: [],
  wildShapeFormsData: [],
  spellsData: [],
  supplementalSpellsData: []
};

export const GameDataContext = createContext<GameDataContextValue | null>(null);

/**
 * Tier 1: Core Eager Datasets (~1.2 MB)
 * Datasets required for basic character score calculation, class progression, and initial tab rendering.
 */
export async function fetchCoreCompendiumData(): Promise<CoreCompendiumData> {
  const [
    races,
    classes,
    weapons,
    traits,
    flaws,
    templates,
    domains,
    deities
  ] = await Promise.all([
    fetch('./data/races.json').then(res => res.json()).catch(() => []),
    fetch('./data/classes.json').then(res => res.json()).catch(() => []),
    fetch('./data/weapons.json').then(res => res.json()).catch(() => []),
    fetch('./data/traits.json').then(res => res.json()).catch(() => []),
    fetch('./data/flaws.json').then(res => res.json()).catch(() => []),
    fetch('./data/templates.json').then(res => res.json()).catch(() => []),
    fetch('./data/domains.json').then(res => res.json()).catch(() => []),
    fetch('./data/deities.json').then(res => res.json()).catch(() => [])
  ]);

  return {
    racesData: races || [],
    classesData: classes || [],
    weaponsData: weapons || [],
    traitsData: traits || [],
    flawsData: flaws || [],
    templatesData: templates || [],
    domainsData: domains || [],
    deitiesData: deities || []
  };
}

/**
 * Tier 2: Deferred Streaming Datasets (~2.4 MB)
 * Large compendium datasets (spells, feats, companions, forms) streamed in background after initial page display.
 */
export async function fetchDeferredCompendiumData(): Promise<DeferredCompendiumData> {
  const [
    feats,
    tricks,
    familiars,
    companions,
    wildshapeForms,
    spells,
    suppSpells
  ] = await Promise.all([
    fetch('./data/feats.json').then(res => res.json()).catch(() => []),
    fetch('./data/skill_tricks.json').then(res => res.json()).catch(() => []),
    fetch('./data/familiars.json').then(res => res.json()).catch(() => []),
    fetch('./data/animal_companions.json').then(res => res.json()).catch(() => []),
    fetch('./data/wildshape_forms.json').then(res => res.json()).catch(() => []),
    fetch('./data/spells.json').then(res => res.json()).catch(() => []),
    fetch('./data/supplemental_domain_spells.json').then(res => res.json()).catch(() => [])
  ]);

  return {
    featsData: feats || [],
    skillTricksData: tricks || [],
    familiarsData: familiars || [],
    animalCompanionsData: companions || [],
    wildShapeFormsData: wildshapeForms || [],
    spellsData: spells || [],
    supplementalSpellsData: suppSpells || []
  };
}

/**
 * Backwards-compatible compendium fetcher retrieving all 15 datasets concurrently.
 */
export async function fetchCompendiumData(): Promise<CompendiumData> {
  const [core, deferred] = await Promise.all([
    fetchCoreCompendiumData(),
    fetchDeferredCompendiumData()
  ]);

  return {
    ...core,
    ...deferred
  };
}

export interface GameDataProviderProps {
  children: React.ReactNode;
  initialData?: Partial<CompendiumData>;
}

export const GameDataProvider: React.FC<GameDataProviderProps> = ({ children, initialData }) => {
  const [state, setState] = useState<Omit<GameDataContextValue, 'isDatasetLoaded'>>(() => {
    if (initialData) {
      return {
        ...EMPTY_COMPENDIUM,
        ...initialData,
        loading: false,
        secondaryLoading: false,
        error: null
      };
    }
    return {
      ...EMPTY_COMPENDIUM,
      loading: true,
      secondaryLoading: true,
      error: null
    };
  });

  const [loadedKeys, setLoadedKeys] = useState<Set<keyof CompendiumData>>(() => {
    if (initialData) {
      return new Set(Object.keys(initialData) as (keyof CompendiumData)[]);
    }
    return new Set<keyof CompendiumData>();
  });

  useEffect(() => {
    if (initialData) return;

    let isMounted = true;

    // Step 1: Eager Core Hydration (Tier 1) - unlocks initial UI render immediately
    fetchCoreCompendiumData()
      .then(coreData => {
        if (!isMounted) return;
        setState(prev => ({
          ...prev,
          ...coreData,
          loading: false
        }));
        setLoadedKeys(prev => {
          const next = new Set(prev);
          (Object.keys(coreData) as (keyof CompendiumData)[]).forEach(k => next.add(k));
          return next;
        });

        // Step 2: Progressive Secondary Hydration (Tier 2) - streams in background
        fetchDeferredCompendiumData()
          .then(deferredData => {
            if (!isMounted) return;
            setState(prev => ({
              ...prev,
              ...deferredData,
              secondaryLoading: false
            }));
            setLoadedKeys(prev => {
              const next = new Set(prev);
              (Object.keys(deferredData) as (keyof CompendiumData)[]).forEach(k => next.add(k));
              return next;
            });
          })
          .catch(err => {
            if (!isMounted) return;
            console.error('Failed to stream deferred datasets:', err);
            setState(prev => ({
              ...prev,
              secondaryLoading: false
            }));
          });
      })
      .catch(err => {
        if (!isMounted) return;
        console.error('Failed to load core HeroForge datasets:', err);
        setState(prev => ({
          ...prev,
          loading: false,
          secondaryLoading: false,
          error: err instanceof Error ? err : new Error(String(err))
        }));
      });

    return () => {
      isMounted = false;
    };
  }, [initialData]);

  const isDatasetLoaded = useCallback((key: keyof CompendiumData) => {
    return loadedKeys.has(key);
  }, [loadedKeys]);

  const contextValue = useMemo<GameDataContextValue>(() => ({
    ...state,
    isDatasetLoaded
  }), [state, isDatasetLoaded]);

  return (
    <GameDataContext.Provider value={contextValue}>
      {children}
    </GameDataContext.Provider>
  );
};

/**
 * Hook to access static compendium datasets leveraging React 19's use() hook.
 */
export function useGameData(): GameDataContextValue {
  const context = use(GameDataContext);
  if (!context) {
    throw new Error('useGameData must be used within a GameDataProvider');
  }
  return context;
}
