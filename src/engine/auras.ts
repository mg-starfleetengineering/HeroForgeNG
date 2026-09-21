import { Aura } from '../types/character';

export interface PresetAuraTemplate {
  name: string;
  type: Aura['type'];
  radius: number;
  target: Aura['target'];
  effect: string;
  source: string;
  saveDc?: string;
  notes?: string;
}

export const PRESET_AURAS: PresetAuraTemplate[] = [
  {
    name: 'Aura of Courage',
    type: 'Class Feature',
    radius: 10,
    target: 'Allies',
    effect: 'Immune to fear (self). Allies within 10 ft gain a +4 morale bonus on saving throws against fear effects.',
    source: 'Paladin 2nd level'
  },
  {
    name: 'Aura of Despair',
    type: 'Class Feature',
    radius: 10,
    target: 'Enemies',
    effect: 'Enemies within 10 ft take a -2 penalty on all saving throws.',
    source: 'Blackguard 3rd level'
  },
  {
    name: 'Draconic Aura: Power',
    type: 'Feat',
    radius: 30,
    target: 'Self & Allies',
    effect: 'Grants +1 (or higher based on bonus) bonus on melee damage rolls.',
    source: 'Dragon Shaman / Dragon Magic / Feat'
  },
  {
    name: 'Draconic Aura: Energy Shield',
    type: 'Feat',
    radius: 30,
    target: 'Self & Allies',
    effect: 'Any opponent striking recipient with a non-reach melee weapon takes 2 points of energy damage (Acid, Cold, Elec, or Fire).',
    source: 'Dragon Shaman / Dragon Magic'
  },
  {
    name: 'Draconic Aura: Vigor',
    type: 'Feat',
    radius: 30,
    target: 'Self & Allies',
    effect: 'Grants Fast Healing 1 (up to half of maximum HP) to recipient creatures.',
    source: 'Dragon Shaman / Dragon Magic'
  },
  {
    name: 'Draconic Aura: Presence',
    type: 'Feat',
    radius: 30,
    target: 'Self & Allies',
    effect: 'Grants +1 bonus on Bluff, Diplomacy, and Intimidate skill checks.',
    source: 'Dragon Shaman / Dragon Magic'
  },
  {
    name: 'Draconic Aura: Resistance',
    type: 'Feat',
    radius: 30,
    target: 'Self & Allies',
    effect: 'Grants Resistance 5 to Acid, Cold, Electricity, or Fire.',
    source: 'Dragon Shaman / Dragon Magic'
  },
  {
    name: 'Ironheart Aura',
    type: 'Feat',
    radius: 10,
    target: 'Allies',
    effect: 'Allies within 10 ft gain a +2 morale bonus on saving throws while you are in an Iron Heart stance.',
    source: 'Tome of Battle'
  },
  {
    name: 'Aura of Menace',
    type: 'Racial',
    radius: 20,
    target: 'Enemies',
    effect: 'Hostile creatures taking action against you take a -2 penalty on attack rolls, AC, and saves for 24 hours (Will DC 15 negates).',
    source: 'Archon / Angel / Planar',
    saveDc: '15'
  },
  {
    name: 'Holy Aura',
    type: 'Spell/Power',
    radius: 20,
    target: 'Allies',
    effect: '+4 deflection bonus to AC, +4 resistance bonus to saves, SR 25 vs evil spells. Evil attackers must make Fort save or be blinded.',
    source: 'Cleric 8th level spell',
    saveDc: 'CL 15'
  },
  {
    name: 'Unholy Aura',
    type: 'Spell/Power',
    radius: 20,
    target: 'Allies',
    effect: '+4 deflection bonus to AC, +4 resistance bonus to saves, SR 25 vs good spells. Good attackers take 1d6 Strength damage on hit.',
    source: 'Cleric 8th level spell',
    saveDc: 'CL 15'
  },
  {
    name: 'Positive Energy Aura',
    type: 'Feat',
    radius: 10,
    target: 'All Creatures',
    effect: 'Undead within 10 ft take 1d6 positive energy damage per round; living creatures gain Fast Healing 1.',
    source: 'Planar Handbook'
  },
  {
    name: 'Aura of Alignment (Good/Evil/Law/Chaos)',
    type: 'Class Feature',
    radius: 30,
    target: 'All Creatures',
    effect: 'Emits a powerful divine alignment aura detectable by magic.',
    source: 'Cleric 1st / Paladin 1st'
  }
];

export function getActiveAuras(auras: Aura[] = []): Aura[] {
  return auras.filter(a => a.active);
}

export function getMaxAuraRadius(auras: Aura[] = []): number {
  const active = getActiveAuras(auras);
  if (active.length === 0) return 0;
  return Math.max(...active.map(a => a.radius));
}

export function createAuraFromPreset(template: PresetAuraTemplate): Aura {
  return {
    id: `aura_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: template.name,
    type: template.type,
    radius: template.radius,
    target: template.target,
    effect: template.effect,
    active: true,
    saveDc: template.saveDc,
    source: template.source,
    notes: template.notes
  };
}
