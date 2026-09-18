/**
 * 3.5e Standard Wondrous Items & Magic Gear Catalog
 * Sources: Dungeon Master's Guide (DMG Ch. 7),
 * Magic Item Compendium (MIC), Complete Arcane (CAr), Races of Destiny (RoD).
 */

import { BodySlotId, WondrousItem, InventoryItem } from '../types/character';
import { isSourceAllowed } from '../utils/sourceFilter';

export interface PredefinedWondrousItem {
  id: string;
  name: string;
  slot: BodySlotId;
  effect: string;
  cost?: string;
  weight?: number;
  source: string;
  category?: string;
}

export const STANDARD_WONDROUS_ITEMS: PredefinedWondrousItem[] = [
  // =========================================================================
  // HEAD (Helms / Hats / Masks)
  // =========================================================================
  {
    id: 'circlet_of_persuasion',
    name: 'Circlet of Persuasion',
    slot: 'head',
    effect: 'Grants a +3 competence bonus on all Charisma-based checks (skills and ability checks).',
    cost: '4,500 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'hat_of_disguise',
    name: 'Hat of Disguise',
    slot: 'head',
    effect: 'Allows wearer to alter appearance as the disguise self spell at will.',
    cost: '1,800 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'helm_of_telepathy',
    name: 'Helm of Telepathy',
    slot: 'head',
    effect: 'Wearer can use detect thoughts at will. Can also send telepathic messages and cast suggestion (DC 14) 1/day.',
    cost: '27,000 gp',
    weight: 3,
    source: 'DMG'
  },
  {
    id: 'helm_of_teleportation',
    name: 'Helm of Teleportation',
    slot: 'head',
    effect: 'Wearer can cast teleport up to 3 times per day (caster level 9th).',
    cost: '73,500 gp',
    weight: 3,
    source: 'DMG'
  },
  {
    id: 'helm_of_comprehend_languages_and_read_magic',
    name: 'Helm of Comprehend Languages and Read Magic',
    slot: 'head',
    effect: 'Grants continuous ability to understand spoken languages and read magical inscriptions.',
    cost: '5,200 gp',
    weight: 3,
    source: 'DMG'
  },
  {
    id: 'helm_of_brilliance',
    name: 'Helm of Brilliance',
    slot: 'head',
    effect: 'Radiates light, provides fire resistance 30, grants light-emitting bane effects vs undead, and can cast prismatic spray, wall of fire, or fireball using set gems.',
    cost: '125,000 gp',
    weight: 3,
    source: 'DMG'
  },
  {
    id: 'cap_of_water_breathing',
    name: 'Cap of Water Breathing',
    slot: 'head',
    effect: 'Grants the wearer continuous ability to breathe underwater as per the water breathing spell.',
    cost: '1,500 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'mask_of_the_skull',
    name: 'Mask of the Skull',
    slot: 'head',
    effect: 'Once per day, animates and flies at a designated target within 50 ft to deliver a finger of death effect (DC 20 Fortitude save).',
    cost: '43,200 gp',
    weight: 2,
    source: 'DMG'
  },
  {
    id: 'helm_of_underwater_action',
    name: 'Helm of Underwater Action',
    slot: 'head',
    effect: 'Grants underwater breathing, 30 ft vision in water, and unobstructed movement as if with freedom of movement.',
    cost: '57,000 gp',
    weight: 3,
    source: 'DMG'
  },
  {
    id: 'circlet_of_blasting_minor',
    name: 'Circlet of Blasting, Minor',
    slot: 'head',
    effect: 'Once per day on command, projects a searing blast of light dealing 3d8 points of damage (no save).',
    cost: '6,480 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'circlet_of_blasting_major',
    name: 'Circlet of Blasting, Major',
    slot: 'head',
    effect: 'Once per day on command, projects a searing blast of light dealing 5d8 points of damage (maximizes to 40 vs undead).',
    cost: '23,760 gp',
    weight: 0,
    source: 'DMG'
  },

  // =========================================================================
  // HEADBAND / EYES (Phylacteries / Headbands / Lenses / Goggles)
  // =========================================================================
  {
    id: 'headband_of_intellect_2',
    name: 'Headband of Intellect (+2)',
    slot: 'headband',
    effect: 'Grants a +2 enhancement bonus to Intelligence.',
    cost: '4,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'headband_of_intellect_4',
    name: 'Headband of Intellect (+4)',
    slot: 'headband',
    effect: 'Grants a +4 enhancement bonus to Intelligence.',
    cost: '16,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'headband_of_intellect_6',
    name: 'Headband of Intellect (+6)',
    slot: 'headband',
    effect: 'Grants a +6 enhancement bonus to Intelligence.',
    cost: '36,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'phylactery_of_undead_turning',
    name: 'Phylactery of Undead Turning',
    slot: 'headband',
    effect: 'Increases effective cleric or paladin level by +4 for turning checks and turn damage.',
    cost: '11,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'phylactery_of_faithfulness',
    name: 'Phylactery of Faithfulness',
    slot: 'headband',
    effect: 'Warns the wearer anytime an intended action would adversely affect alignment or deity standing.',
    cost: '1,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'goggles_of_night',
    name: 'Goggles of Night',
    slot: 'headband',
    effect: 'Grants darkvision 60 ft (or extends existing darkvision by an additional 60 ft).',
    cost: '12,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'goggles_of_minute_seeing',
    name: 'Goggles of Minute Seeing',
    slot: 'headband',
    effect: 'Grants a +5 competence bonus on Search checks to locate secret doors, traps, and concealed objects within 1 foot.',
    cost: '1,250 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'eyes_of_the_eagle',
    name: 'Eyes of the Eagle',
    slot: 'headband',
    effect: 'Grants a +5 competence bonus on Spot checks. When both lenses are worn, magnification provides visual clarity up to 100x.',
    cost: '2,500 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'eyes_of_charming',
    name: 'Eyes of Charming',
    slot: 'headband',
    effect: 'Wearer can cast charm person (DC 16 Will save) up to twice per day simply by meeting target gaze.',
    cost: '56,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'eyes_of_petrification',
    name: 'Eyes of Petrification',
    slot: 'headband',
    effect: 'Once per day on command, delivers a petrifying gaze turning a target within 30 ft into stone as flesh to stone (DC 19).',
    cost: '56,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'eyes_of_doom',
    name: 'Eyes of Doom',
    slot: 'headband',
    effect: 'Deliver gaze attack casting doom at will (DC 11). Once per day can project a death ray as finger of death (DC 17).',
    cost: '25,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'lens_of_detection',
    name: 'Lens of Detection',
    slot: 'headband',
    effect: 'Grants a +5 competence bonus on Search checks and a +5 competence bonus on Survival checks made to track.',
    cost: '3,500 gp',
    weight: 1,
    source: 'DMG'
  },

  // =========================================================================
  // NECK (Amulets / Necklaces / Periapts / Brooches)
  // =========================================================================
  {
    id: 'amulet_of_health_2',
    name: 'Amulet of Health (+2)',
    slot: 'neck',
    effect: 'Grants a +2 enhancement bonus to Constitution.',
    cost: '4,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'amulet_of_health_4',
    name: 'Amulet of Health (+4)',
    slot: 'neck',
    effect: 'Grants a +4 enhancement bonus to Constitution.',
    cost: '16,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'amulet_of_health_6',
    name: 'Amulet of Health (+6)',
    slot: 'neck',
    effect: 'Grants a +6 enhancement bonus to Constitution.',
    cost: '36,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'amulet_of_natural_armor_1',
    name: 'Amulet of Natural Armor (+1)',
    slot: 'neck',
    effect: 'Grants a +1 enhancement bonus to natural armor.',
    cost: '2,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'amulet_of_natural_armor_2',
    name: 'Amulet of Natural Armor (+2)',
    slot: 'neck',
    effect: 'Grants a +2 enhancement bonus to natural armor.',
    cost: '8,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'amulet_of_natural_armor_3',
    name: 'Amulet of Natural Armor (+3)',
    slot: 'neck',
    effect: 'Grants a +3 enhancement bonus to natural armor.',
    cost: '18,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'amulet_of_natural_armor_4',
    name: 'Amulet of Natural Armor (+4)',
    slot: 'neck',
    effect: 'Grants a +4 enhancement bonus to natural armor.',
    cost: '32,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'amulet_of_natural_armor_5',
    name: 'Amulet of Natural Armor (+5)',
    slot: 'neck',
    effect: 'Grants a +5 enhancement bonus to natural armor.',
    cost: '50,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'amulet_of_mighty_fists_1_5',
    name: 'Amulet of Mighty Fists (+1 to +5)',
    slot: 'neck',
    effect: 'Grants an enhancement bonus of +1 to +5 on attack rolls and damage rolls with unarmed strikes and natural weapons.',
    cost: '6,000 to 150,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'amulet_of_the_planes',
    name: 'Amulet of the Planes',
    slot: 'neck',
    effect: 'Enables wearer to travel between planes as plane shift upon making a DC 15 Intelligence check.',
    cost: '120,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'periapt_of_wisdom_2',
    name: 'Periapt of Wisdom (+2)',
    slot: 'neck',
    effect: 'Grants a +2 enhancement bonus to Wisdom.',
    cost: '4,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'periapt_of_wisdom_4',
    name: 'Periapt of Wisdom (+4)',
    slot: 'neck',
    effect: 'Grants a +4 enhancement bonus to Wisdom.',
    cost: '16,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'periapt_of_wisdom_6',
    name: 'Periapt of Wisdom (+6)',
    slot: 'neck',
    effect: 'Grants a +6 enhancement bonus to Wisdom.',
    cost: '36,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'periapt_of_proof_against_poison',
    name: 'Periapt of Proof against Poison',
    slot: 'neck',
    effect: 'Provides complete immunity to all poison effects.',
    cost: '27,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'periapt_of_wound_closure',
    name: 'Periapt of Wound Closure',
    slot: 'neck',
    effect: 'Wearer automatically stabilizes if dying, doubles natural hit point healing rate, and heals ability damage twice as fast.',
    cost: '15,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'periapt_of_health',
    name: 'Periapt of Health',
    slot: 'neck',
    effect: 'Provides complete immunity to all forms of disease, including magical diseases like mummy rot and lycanthropy.',
    cost: '7,500 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'necklace_of_adaptation',
    name: 'Necklace of Adaptation',
    slot: 'neck',
    effect: 'Wraps wearer in a shell of fresh air, granting immunity to harmful gases, dust, vapors, suffocation, drowning, and vacuum.',
    cost: '9,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'necklace_of_fireballs_type_1',
    name: 'Necklace of Fireballs (Type I)',
    slot: 'neck',
    effect: 'Detachable fiery spheres: 1x 5d6, 2x 3d6 fireballs (DC 14 Reflex save).',
    cost: '1,650 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'necklace_of_fireballs_type_2',
    name: 'Necklace of Fireballs (Type II)',
    slot: 'neck',
    effect: 'Detachable fiery spheres: 1x 6d6, 2x 4d6, 2x 2d6 fireballs (DC 14 Reflex save).',
    cost: '2,700 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'necklace_of_fireballs_type_3',
    name: 'Necklace of Fireballs (Type III)',
    slot: 'neck',
    effect: 'Detachable fiery spheres: 1x 7d6, 2x 5d6, 2x 3d6 fireballs (DC 14 Reflex save).',
    cost: '4,350 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'necklace_of_fireballs_type_4',
    name: 'Necklace of Fireballs (Type IV)',
    slot: 'neck',
    effect: 'Detachable fiery spheres: 1x 8d6, 2x 6d6, 2x 4d6, 4x 2d6 fireballs (DC 14 Reflex save).',
    cost: '5,400 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'necklace_of_fireballs_type_5',
    name: 'Necklace of Fireballs (Type V)',
    slot: 'neck',
    effect: 'Detachable fiery spheres: 1x 9d6, 2x 7d6, 2x 5d6, 2x 3d6 fireballs (DC 14 Reflex save).',
    cost: '6,150 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'necklace_of_fireballs_type_6',
    name: 'Necklace of Fireballs (Type VI)',
    slot: 'neck',
    effect: 'Detachable fiery spheres: 1x 10d6, 2x 8d6, 2x 6d6, 4x 4d6 fireballs (DC 14 Reflex save).',
    cost: '8,100 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'necklace_of_fireballs_type_7',
    name: 'Necklace of Fireballs (Type VII)',
    slot: 'neck',
    effect: 'Detachable fiery spheres: 1x 10d6, 2x 9d6, 2x 7d6, 2x 5d6, 2x 3d6 fireballs (DC 14 Reflex save).',
    cost: '8,700 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'medallion_of_thoughts',
    name: 'Medallion of Thoughts',
    slot: 'neck',
    effect: 'Allows wearer to cast detect thoughts (DC 13 Will save) up to 3 times per day (CL 5th).',
    cost: '12,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'brooch_of_shielding',
    name: 'Brooch of Shielding',
    slot: 'neck',
    effect: 'Absorbs magic missile damage directed at the wearer, up to 101 points of total damage before dissolving.',
    cost: '1,500 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'scarab_of_protection',
    name: 'Scarab of Protection',
    slot: 'neck',
    effect: 'Grants Spell Resistance 20. Also absorbs up to 12 energy-draining or death effect attacks before turning to powder.',
    cost: '38,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'scarab_golembane',
    name: 'Scarab, Golembane',
    slot: 'neck',
    effect: 'Enables wearer to detect any golem within 60 ft, and allows weapon or natural attacks to bypass golem Damage Reduction entirely.',
    cost: '2,500 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'hand_of_glory',
    name: 'Hand of Glory',
    slot: 'neck',
    effect: 'Can wear a third magic ring upon this dried hand and gain its benefits. Also casts daylight and see invisibility 1/day.',
    cost: '7,200 gp',
    weight: 2,
    source: 'DMG'
  },

  // =========================================================================
  // SHOULDERS (Cloaks / Capes / Mantles)
  // =========================================================================
  {
    id: 'cloak_of_resistance_1',
    name: 'Cloak of Resistance (+1)',
    slot: 'shoulders',
    effect: 'Grants a +1 resistance bonus on all saving throws.',
    cost: '1,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'cloak_of_resistance_2',
    name: 'Cloak of Resistance (+2)',
    slot: 'shoulders',
    effect: 'Grants a +2 resistance bonus on all saving throws.',
    cost: '4,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'cloak_of_resistance_3',
    name: 'Cloak of Resistance (+3)',
    slot: 'shoulders',
    effect: 'Grants a +3 resistance bonus on all saving throws.',
    cost: '9,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'cloak_of_resistance_4',
    name: 'Cloak of Resistance (+4)',
    slot: 'shoulders',
    effect: 'Grants a +4 resistance bonus on all saving throws.',
    cost: '16,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'cloak_of_resistance_5',
    name: 'Cloak of Resistance (+5)',
    slot: 'shoulders',
    effect: 'Grants a +5 resistance bonus on all saving throws.',
    cost: '25,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'cloak_of_charisma_2',
    name: 'Cloak of Charisma (+2)',
    slot: 'shoulders',
    effect: 'Grants a +2 enhancement bonus to Charisma.',
    cost: '4,000 gp',
    weight: 2,
    source: 'DMG'
  },
  {
    id: 'cloak_of_charisma_4',
    name: 'Cloak of Charisma (+4)',
    slot: 'shoulders',
    effect: 'Grants a +4 enhancement bonus to Charisma.',
    cost: '16,000 gp',
    weight: 2,
    source: 'DMG'
  },
  {
    id: 'cloak_of_charisma_6',
    name: 'Cloak of Charisma (+6)',
    slot: 'shoulders',
    effect: 'Grants a +6 enhancement bonus to Charisma.',
    cost: '36,000 gp',
    weight: 2,
    source: 'DMG'
  },
  {
    id: 'cloak_of_elvenkind',
    name: 'Cloak of Elvenkind',
    slot: 'shoulders',
    effect: 'Grants a +5 competence bonus on Hide checks.',
    cost: '2,500 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'cloak_of_the_bat',
    name: 'Cloak of the Bat',
    slot: 'shoulders',
    effect: 'Grants a +5 competence bonus on Hide checks. In darkness, wearer can fly (speed 40 ft) or transform into an ordinary vampire bat.',
    cost: '26,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'cloak_of_arachnida',
    name: 'Cloak of Arachnida',
    slot: 'shoulders',
    effect: 'Continuous spider climb, immunity to entanglement in webs, +2 luck bonus on Fortitude saves vs spider poison, and cast web 1/day.',
    cost: '14,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'cloak_of_the_manta_ray',
    name: 'Cloak of the Manta Ray',
    slot: 'shoulders',
    effect: 'In saltwater, transforms wearer into a manta ray with swim speed 60 ft, underwater breathing, +3 natural armor, and tail spine attack (1d6 damage).',
    cost: '7,200 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'minor_cloak_of_displacement',
    name: 'Minor Cloak of Displacement',
    slot: 'shoulders',
    effect: 'Creates a continuous blur effect granting a 20% miss chance against direct weapon attacks.',
    cost: '24,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'major_cloak_of_displacement',
    name: 'Major Cloak of Displacement',
    slot: 'shoulders',
    effect: 'Projects optical displacement granting a 50% miss chance against attacks as displacement for up to 15 rounds per day.',
    cost: '50,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'cape_of_the_mountebank',
    name: 'Cape of the Mountebank',
    slot: 'shoulders',
    effect: 'On command once per day, casts dimension door (CL 9th) leaving behind a cloud of smoke.',
    cost: '10,080 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'wings_of_flying',
    name: 'Wings of Flying',
    slot: 'shoulders',
    effect: 'Transforms cloak into bat or bird wings granting a fly speed of 60 ft with good maneuverability.',
    cost: '54,000 gp',
    weight: 2,
    source: 'DMG'
  },

  // =========================================================================
  // CHEST (Vests / Mantles / Shirts)
  // =========================================================================
  {
    id: 'vest_of_escape',
    name: 'Vest of Escape',
    slot: 'chest',
    effect: 'Grants a +4 competence bonus on Open Lock checks and a +10 competence bonus on Escape Artist checks.',
    cost: '5,200 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'vestment_of_many_styles',
    name: 'Vestment of Many Styles',
    slot: 'chest',
    effect: 'On command, transforms instantly into any normal set of clothing or garb imaginable.',
    cost: '500 gp',
    weight: 0,
    source: 'RoD'
  },
  {
    id: 'druids_vestment',
    name: "Druid's Vestment",
    slot: 'chest',
    effect: 'Grants the wearer one additional use per day of the wild shape ability (CL 10th).',
    cost: '10,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'mantle_of_faith',
    name: 'Mantle of Faith',
    slot: 'chest',
    effect: 'Grants damage reduction 5/evil to the wearer.',
    cost: '76,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'mantle_of_spell_resistance',
    name: 'Mantle of Spell Resistance',
    slot: 'chest',
    effect: 'Grants the wearer continuous Spell Resistance 21.',
    cost: '90,000 gp',
    weight: 0,
    source: 'DMG'
  },

  // =========================================================================
  // BODY (Robes / Vestments)
  // =========================================================================
  {
    id: 'robe_of_the_archmagi',
    name: 'Robe of the Archmagi',
    slot: 'body',
    effect: 'Grants +5 armor bonus to AC, Spell Resistance 18, +4 resistance bonus on all saves, and +2 enhancement bonus on CL checks to overcome spell resistance.',
    cost: '75,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'robe_of_useful_items',
    name: 'Robe of Useful Items',
    slot: 'body',
    effect: 'Appears as ordinary robe adorned with small cloth patches; detaching a patch transforms it into the physical item depicted.',
    cost: '7,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'robe_of_scintillating_colors',
    name: 'Robe of Scintillating Colors',
    slot: 'body',
    effect: 'Projects shifting rainbows of hypnotic light: dazes creatures within 30 ft and grants wearer concealment against attacks.',
    cost: '27,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'robe_of_blending',
    name: 'Robe of Blending',
    slot: 'body',
    effect: 'Blends into surroundings as disguise self (+10 competence on Hide checks) and enables wearer to speak matching languages.',
    cost: '30,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'robe_of_eyes',
    name: 'Robe of Eyes',
    slot: 'body',
    effect: 'Grants 360-degree vision, darkvision 120 ft, see invisible/ethereal 120 ft, +10 Spot, +5 Search, and immunity to being flanked.',
    cost: '120,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'robe_of_bones',
    name: 'Robe of Bones',
    slot: 'body',
    effect: 'Detachable skeletal patches animate into controlled Medium skeletons and zombies on command.',
    cost: '2,400 gp',
    weight: 1,
    source: 'DMG'
  },

  // =========================================================================
  // ARMOR (Suit of Armor / Magical Armor)
  // =========================================================================
  {
    id: 'celestial_armor',
    name: 'Celestial Armor',
    slot: 'armor',
    effect: '+5 chainmail (light armor, max Dex +8, ACP -2, ASF 15%), allows wearer to fly 1/day on command.',
    cost: '22,400 gp',
    weight: 20,
    source: 'DMG'
  },
  {
    id: 'demon_armor',
    name: 'Demon Armor',
    slot: 'armor',
    effect: '+4 full plate (allows wearer to infect struck foes with contagion DC 14, claw attacks deal 1d10 damage).',
    cost: '52,290 gp',
    weight: 50,
    source: 'DMG'
  },
  {
    id: 'elven_chain',
    name: 'Elven Chain',
    slot: 'armor',
    effect: 'Extremely light +2 mithral chain shirt (light armor, max Dex +4, ACP -2, ASF 20%). Can be worn without armor proficiency penalty.',
    cost: '5,150 gp',
    weight: 20,
    source: 'DMG'
  },

  // =========================================================================
  // HANDS (Gauntlets / Gloves)
  // =========================================================================
  {
    id: 'gloves_of_dexterity_2',
    name: 'Gloves of Dexterity (+2)',
    slot: 'hands',
    effect: 'Grants a +2 enhancement bonus to Dexterity.',
    cost: '4,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'gloves_of_dexterity_4',
    name: 'Gloves of Dexterity (+4)',
    slot: 'hands',
    effect: 'Grants a +4 enhancement bonus to Dexterity.',
    cost: '16,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'gloves_of_dexterity_6',
    name: 'Gloves of Dexterity (+6)',
    slot: 'hands',
    effect: 'Grants a +6 enhancement bonus to Dexterity.',
    cost: '36,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'gauntlets_of_ogre_power',
    name: 'Gauntlets of Ogre Power',
    slot: 'hands',
    effect: 'Grants a +2 enhancement bonus to Strength.',
    cost: '4,000 gp',
    weight: 4,
    source: 'DMG'
  },
  {
    id: 'gloves_of_arrow_snaring',
    name: 'Gloves of Arrow Snaring',
    slot: 'hands',
    effect: 'Twice per day, the wearer can snatch a missile weapon from the air as if using the Snatch Arrows feat without having a free hand.',
    cost: '4,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'gloves_of_swimming_and_climbing',
    name: 'Gloves of Swimming and Climbing',
    slot: 'hands',
    effect: 'Grants a +5 competence bonus on Swim checks and Climb checks.',
    cost: '6,250 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'gauntlet_of_rust',
    name: 'Gauntlet of Rust',
    slot: 'hands',
    effect: 'Once per day on command, delivers a rusting touch as the rusting grasp spell. Also protects wearer against all rusting effects.',
    cost: '11,500 gp',
    weight: 2,
    source: 'DMG'
  },
  {
    id: 'glove_of_storing',
    name: 'Glove of Storing',
    slot: 'hands',
    effect: 'On a snap of the fingers, stores or retrieves one handheld item weighing up to 20 lbs as a free action.',
    cost: '10,000 gp',
    weight: 0,
    source: 'DMG'
  },

  // =========================================================================
  // ARMS (Bracers / Armbands)
  // =========================================================================
  {
    id: 'bracers_of_armor_1',
    name: 'Bracers of Armor (+1)',
    slot: 'arms',
    effect: 'Surrounds wearer with invisible force armor granting a +1 armor bonus to AC (applies against incorporeal touch attacks).',
    cost: '1,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'bracers_of_armor_2',
    name: 'Bracers of Armor (+2)',
    slot: 'arms',
    effect: 'Surrounds wearer with invisible force armor granting a +2 armor bonus to AC (applies against incorporeal touch attacks).',
    cost: '4,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'bracers_of_armor_3',
    name: 'Bracers of Armor (+3)',
    slot: 'arms',
    effect: 'Surrounds wearer with invisible force armor granting a +3 armor bonus to AC (applies against incorporeal touch attacks).',
    cost: '9,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'bracers_of_armor_4',
    name: 'Bracers of Armor (+4)',
    slot: 'arms',
    effect: 'Surrounds wearer with invisible force armor granting a +4 armor bonus to AC (applies against incorporeal touch attacks).',
    cost: '16,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'bracers_of_armor_5',
    name: 'Bracers of Armor (+5)',
    slot: 'arms',
    effect: 'Surrounds wearer with invisible force armor granting a +5 armor bonus to AC (applies against incorporeal touch attacks).',
    cost: '25,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'bracers_of_armor_6',
    name: 'Bracers of Armor (+6)',
    slot: 'arms',
    effect: 'Surrounds wearer with invisible force armor granting a +6 armor bonus to AC (applies against incorporeal touch attacks).',
    cost: '36,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'bracers_of_armor_7',
    name: 'Bracers of Armor (+7)',
    slot: 'arms',
    effect: 'Surrounds wearer with invisible force armor granting a +7 armor bonus to AC (applies against incorporeal touch attacks).',
    cost: '49,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'bracers_of_armor_8',
    name: 'Bracers of Armor (+8)',
    slot: 'arms',
    effect: 'Surrounds wearer with invisible force armor granting a +8 armor bonus to AC (applies against incorporeal touch attacks).',
    cost: '64,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'lesser_bracers_of_archery',
    name: 'Lesser Bracers of Archery',
    slot: 'arms',
    effect: 'Grants proficiency with all bows. If already proficient, grants a +1 competence bonus on attack rolls with bows.',
    cost: '5,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'greater_bracers_of_archery',
    name: 'Greater Bracers of Archery',
    slot: 'arms',
    effect: 'Grants proficiency with all bows, a +2 competence bonus on attack rolls, and a +1 competence bonus on damage rolls with bows.',
    cost: '25,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'armbands_of_might',
    name: 'Armbands of Might',
    slot: 'arms',
    effect: 'Grants a +2 competence bonus on Strength checks and Str-based skill checks. When using Power Attack for at least a -2 attack penalty, gain +2 extra damage.',
    cost: '4,100 gp',
    weight: 1,
    source: 'MIC'
  },

  // =========================================================================
  // WAIST (Belts / Girdles)
  // =========================================================================
  {
    id: 'belt_of_giant_strength_2',
    name: 'Belt of Giant Strength (+2)',
    slot: 'waist',
    effect: 'Grants a +2 enhancement bonus to Strength.',
    cost: '4,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'belt_of_giant_strength_4',
    name: 'Belt of Giant Strength (+4)',
    slot: 'waist',
    effect: 'Grants a +4 enhancement bonus to Strength.',
    cost: '16,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'belt_of_giant_strength_6',
    name: 'Belt of Giant Strength (+6)',
    slot: 'waist',
    effect: 'Grants a +6 enhancement bonus to Strength.',
    cost: '36,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'belt_of_battle',
    name: 'Belt of Battle',
    slot: 'waist',
    effect: 'Grants a +2 competence bonus to initiative. 3 charges/day: 1 charge = move action, 2 charges = standard action, 3 charges = full-round action.',
    cost: '12,000 gp',
    weight: 1,
    source: 'MIC'
  },
  {
    id: 'healing_belt',
    name: 'Healing Belt',
    slot: 'waist',
    effect: 'Grants a +2 competence bonus on Heal checks. 3 charges/day: 1 charge = heal 2d8, 2 charges = heal 3d8, 3 charges = heal 4d8.',
    cost: '750 gp',
    weight: 1,
    source: 'MIC'
  },
  {
    id: 'monks_belt',
    name: "Monk's Belt",
    slot: 'waist',
    effect: 'Grants AC bonus (+Wis mod and +1 unarmored) and unarmed damage of a 5th-level monk (or +5 effective levels if already a monk).',
    cost: '13,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'girdle_of_many_pouches',
    name: 'Girdle of Many Pouches',
    slot: 'waist',
    effect: 'Features 8 visible and 64 extradimensional hidden pouches (each holding up to 1 cubic foot or 10 lbs). Total belt weight is only 1 lb.',
    cost: '3,800 gp',
    weight: 1,
    source: 'CAr'
  },

  // =========================================================================
  // FEET (Boots / Shoes / Slippers)
  // =========================================================================
  {
    id: 'boots_of_speed',
    name: 'Boots of Speed',
    slot: 'feet',
    effect: 'Click heels to gain haste effects (CL 10th: +1 attack, +1 dodge AC, +30 ft speed, extra attack on full attack) for up to 10 rounds/day.',
    cost: '12,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'boots_of_striding_and_springing',
    name: 'Boots of Striding and Springing',
    slot: 'feet',
    effect: 'Grants a +10 ft enhancement bonus to base land speed and a +5 competence bonus on Jump checks.',
    cost: '5,500 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'boots_of_elvenkind',
    name: 'Boots of Elvenkind',
    slot: 'feet',
    effect: 'Grants a +5 competence bonus on Move Silently checks.',
    cost: '2,500 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'slippers_of_spider_climbing',
    name: 'Slippers of Spider Climbing',
    slot: 'feet',
    effect: 'Allows movement on vertical surfaces and ceilings as spider climb (speed 20 ft) for up to 10 minutes per day.',
    cost: '4,800 gp',
    weight: 0.5,
    source: 'DMG'
  },
  {
    id: 'winged_boots',
    name: 'Winged Boots',
    slot: 'feet',
    effect: 'Allows wearer to fly as per the fly spell (speed 60 ft, good maneuverability) up to 3 times per day for up to 2 hours per use.',
    cost: '16,000 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'boots_of_levitation',
    name: 'Boots of Levitation',
    slot: 'feet',
    effect: 'Allows the wearer to levitate at will as per the levitate spell on command (CL 3rd).',
    cost: '7,500 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'boots_of_the_winterlands',
    name: 'Boots of the Winterlands',
    slot: 'feet',
    effect: 'Unobstructed movement across snow and ice without slipping, warmth down to -50°F, and endure elements against cold.',
    cost: '2,500 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'boots_of_teleportation',
    name: 'Boots of Teleportation',
    slot: 'feet',
    effect: 'Allows the wearer to cast teleport (CL 9th) up to 3 times per day on command.',
    cost: '49,000 gp',
    weight: 3,
    source: 'DMG'
  },

  // =========================================================================
  // RINGS (Ring Slot 1 / Ring Slot 2)
  // =========================================================================
  {
    id: 'ring_of_protection_1',
    name: 'Ring of Protection (+1)',
    slot: 'ring1',
    effect: 'Grants a +1 deflection bonus to Armor Class.',
    cost: '2,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ring_of_protection_2',
    name: 'Ring of Protection (+2)',
    slot: 'ring1',
    effect: 'Grants a +2 deflection bonus to Armor Class.',
    cost: '8,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ring_of_protection_3',
    name: 'Ring of Protection (+3)',
    slot: 'ring1',
    effect: 'Grants a +3 deflection bonus to Armor Class.',
    cost: '18,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ring_of_protection_4',
    name: 'Ring of Protection (+4)',
    slot: 'ring1',
    effect: 'Grants a +4 deflection bonus to Armor Class.',
    cost: '32,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ring_of_protection_5',
    name: 'Ring of Protection (+5)',
    slot: 'ring1',
    effect: 'Grants a +5 deflection bonus to Armor Class.',
    cost: '50,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ring_of_sustenance',
    name: 'Ring of Sustenance',
    slot: 'ring1',
    effect: 'Continually provides life-sustaining nourishment without food or drink. Wearer only requires 2 hours of sleep per night for a full night rest.',
    cost: '2,500 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ring_of_invisibility',
    name: 'Ring of Invisibility',
    slot: 'ring1',
    effect: 'Activates invisibility (CL 3rd) on command at will.',
    cost: '20,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ring_of_feather_falling',
    name: 'Ring of Feather Falling',
    slot: 'ring1',
    effect: 'Activates feather fall automatically whenever wearer falls more than 5 feet.',
    cost: '2,200 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ring_of_wizardry_1',
    name: 'Ring of Wizardry (I)',
    slot: 'ring1',
    effect: "Doubles the wearer's daily 1st-level arcane spell slots.",
    cost: '20,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ring_of_wizardry_2',
    name: 'Ring of Wizardry (II)',
    slot: 'ring1',
    effect: "Doubles the wearer's daily 2nd-level arcane spell slots.",
    cost: '40,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ring_of_wizardry_3',
    name: 'Ring of Wizardry (III)',
    slot: 'ring1',
    effect: "Doubles the wearer's daily 3rd-level arcane spell slots.",
    cost: '70,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ring_of_wizardry_4',
    name: 'Ring of Wizardry (IV)',
    slot: 'ring1',
    effect: "Doubles the wearer's daily 4th-level arcane spell slots.",
    cost: '100,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ring_of_evasion',
    name: 'Ring of Evasion',
    slot: 'ring1',
    effect: 'Grants the wearer the Evasion ability (taking no damage on successful Reflex saves against half-damage effects).',
    cost: '25,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ring_of_freedom_of_movement',
    name: 'Ring of Freedom of Movement',
    slot: 'ring1',
    effect: 'Grants continuous freedom of movement as per spell: cannot be paralyzed, held, entangled, and moves freely in water.',
    cost: '40,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ring_of_counterspells',
    name: 'Ring of Counterspells',
    slot: 'ring1',
    effect: 'Can store one 1st-to-6th-level spell; automatically counters that exact spell when cast at the wearer without requiring an action.',
    cost: '4,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ring_of_force_shield',
    name: 'Ring of Force Shield',
    slot: 'ring1',
    effect: 'Generates a weightless +2 shield bonus to AC on command (force effect, no armor check penalty or arcane spell failure).',
    cost: '8,500 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'minor_ring_of_energy_resistance',
    name: 'Minor Ring of Energy Resistance',
    slot: 'ring1',
    effect: 'Grants continuous resistance 10 against one designated energy type (acid, cold, electricity, fire, or sonic).',
    cost: '12,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'major_ring_of_energy_resistance',
    name: 'Major Ring of Energy Resistance',
    slot: 'ring1',
    effect: 'Grants continuous resistance 20 against one designated energy type (acid, cold, electricity, fire, or sonic).',
    cost: '28,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ring_of_mind_shielding',
    name: 'Ring of Mind Shielding',
    slot: 'ring1',
    effect: 'Grants complete immunity to detect thoughts, discern lies, and any attempt to magically discern alignment.',
    cost: '8,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ring_of_regeneration',
    name: 'Ring of Regeneration',
    slot: 'ring1',
    effect: 'Continually heals 1 point of damage per level every hour, and regrows severed body parts and organs.',
    cost: '90,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ring_of_spell_turning',
    name: 'Ring of Spell Turning',
    slot: 'ring1',
    effect: 'Can turn back up to 9 spell levels targeted directly at the wearer per day as per the spell turning spell.',
    cost: '98,280 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ring_of_blinking',
    name: 'Ring of Blinking',
    slot: 'ring1',
    effect: 'Activates the blink spell effect on command at will.',
    cost: '27,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ring_of_jumping',
    name: 'Ring of Jumping',
    slot: 'ring1',
    effect: 'Grants a +5 competence bonus on Jump checks.',
    cost: '2,500 gp',
    weight: 0,
    source: 'DMG'
  },

  // =========================================================================
  // SLOTLESS / WONDROUS ITEMS (Containers / Stones / Instruments)
  // =========================================================================
  {
    id: 'bag_of_holding_type_1',
    name: 'Bag of Holding (Type I)',
    slot: 'slotless',
    effect: 'Holds up to 250 lbs or 30 cubic feet in an extradimensional pocket. Weight is always 15 lbs.',
    cost: '2,500 gp',
    weight: 15,
    source: 'DMG'
  },
  {
    id: 'bag_of_holding_type_2',
    name: 'Bag of Holding (Type II)',
    slot: 'slotless',
    effect: 'Holds up to 500 lbs or 70 cubic feet in an extradimensional pocket. Weight is always 25 lbs.',
    cost: '5,000 gp',
    weight: 25,
    source: 'DMG'
  },
  {
    id: 'bag_of_holding_type_3',
    name: 'Bag of Holding (Type III)',
    slot: 'slotless',
    effect: 'Holds up to 1,000 lbs or 150 cubic feet in an extradimensional pocket. Weight is always 35 lbs.',
    cost: '7,400 gp',
    weight: 35,
    source: 'DMG'
  },
  {
    id: 'bag_of_holding_type_4',
    name: 'Bag of Holding (Type IV)',
    slot: 'slotless',
    effect: 'Holds up to 1,500 lbs or 250 cubic feet in an extradimensional pocket. Weight is always 60 lbs.',
    cost: '10,000 gp',
    weight: 60,
    source: 'DMG'
  },
  {
    id: 'hewards_handy_haversack',
    name: "Heward's Handy Haversack",
    slot: 'slotless',
    effect: 'Holds 20 lbs per side pocket and 80 lbs in main pouch; always weighs 5 lbs. Retrieving any item is a move action that does not provoke attacks of opportunity.',
    cost: '2,000 gp',
    weight: 5,
    source: 'DMG'
  },
  {
    id: 'portable_hole',
    name: 'Portable Hole',
    slot: 'slotless',
    effect: 'Opens a 6-foot diameter extradimensional circular hole 10 feet deep (volume 282 cu ft). Folds into pocket handkerchief.',
    cost: '20,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'quiver_of_ehlonna',
    name: 'Quiver of Ehlonna',
    slot: 'slotless',
    effect: 'Three extradimensional compartments store up to 60 arrows, 18 javelins, and 6 bows/spears. Weight is always 2 lbs.',
    cost: '1,800 gp',
    weight: 2,
    source: 'DMG'
  },
  {
    id: 'stone_of_good_luck',
    name: 'Stone of Good Luck',
    slot: 'slotless',
    effect: 'Grants a +1 luck bonus on saving throws, ability checks, and skill checks.',
    cost: '20,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'pearl_of_power_1st_level',
    name: 'Pearl of Power (1st level)',
    slot: 'slotless',
    effect: 'Once per day on command, recalls any prepared 1st-level spell that has been cast.',
    cost: '1,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'pearl_of_power_2nd_level',
    name: 'Pearl of Power (2nd level)',
    slot: 'slotless',
    effect: 'Once per day on command, recalls any prepared 2nd-level spell that has been cast.',
    cost: '4,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'pearl_of_power_3rd_level',
    name: 'Pearl of Power (3rd level)',
    slot: 'slotless',
    effect: 'Once per day on command, recalls any prepared 3rd-level spell that has been cast.',
    cost: '9,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'pearl_of_power_4th_level',
    name: 'Pearl of Power (4th level)',
    slot: 'slotless',
    effect: 'Once per day on command, recalls any prepared 4th-level spell that has been cast.',
    cost: '16,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'pearl_of_power_5th_level',
    name: 'Pearl of Power (5th level)',
    slot: 'slotless',
    effect: 'Once per day on command, recalls any prepared 5th-level spell that has been cast.',
    cost: '25,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'pearl_of_power_6th_level',
    name: 'Pearl of Power (6th level)',
    slot: 'slotless',
    effect: 'Once per day on command, recalls any prepared 6th-level spell that has been cast.',
    cost: '36,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'pearl_of_power_7th_level',
    name: 'Pearl of Power (7th level)',
    slot: 'slotless',
    effect: 'Once per day on command, recalls any prepared 7th-level spell that has been cast.',
    cost: '49,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'pearl_of_power_8th_level',
    name: 'Pearl of Power (8th level)',
    slot: 'slotless',
    effect: 'Once per day on command, recalls any prepared 8th-level spell that has been cast.',
    cost: '64,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'pearl_of_power_9th_level',
    name: 'Pearl of Power (9th level)',
    slot: 'slotless',
    effect: 'Once per day on command, recalls any prepared 9th-level spell that has been cast.',
    cost: '81,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ioun_stone_dusty_rose',
    name: 'Ioun Stone (Dusty Rose)',
    slot: 'slotless',
    effect: 'Orbits head: grants a +1 insight bonus to Armor Class.',
    cost: '5,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ioun_stone_pale_green',
    name: 'Ioun Stone (Pale Green)',
    slot: 'slotless',
    effect: 'Orbits head: grants a +1 competence bonus on attack rolls, saves, skill checks, and ability checks.',
    cost: '30,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ioun_stone_orange',
    name: 'Ioun Stone (Orange)',
    slot: 'slotless',
    effect: 'Orbits head: grants a +1 caster level bonus to all spells and spell-like abilities.',
    cost: '30,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ioun_stone_clear_spindle',
    name: 'Ioun Stone (Clear Spindle)',
    slot: 'slotless',
    effect: 'Orbits head: sustains the wearer without need for food or water.',
    cost: '4,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ioun_stone_incandescent_blue',
    name: 'Ioun Stone (Incandescent Blue)',
    slot: 'slotless',
    effect: 'Orbits head: grants a +2 enhancement bonus to Wisdom.',
    cost: '8,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ioun_stone_deep_red',
    name: 'Ioun Stone (Deep Red)',
    slot: 'slotless',
    effect: 'Orbits head: grants a +2 enhancement bonus to Dexterity.',
    cost: '8,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ioun_stone_pink_and_green',
    name: 'Ioun Stone (Pink & Green)',
    slot: 'slotless',
    effect: 'Orbits head: grants a +2 enhancement bonus to Charisma.',
    cost: '8,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ioun_stone_pink',
    name: 'Ioun Stone (Pink)',
    slot: 'slotless',
    effect: 'Orbits head: grants a +2 enhancement bonus to Constitution.',
    cost: '8,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ioun_stone_scarlet_and_blue',
    name: 'Ioun Stone (Scarlet & Blue)',
    slot: 'slotless',
    effect: 'Orbits head: grants a +2 enhancement bonus to Intelligence.',
    cost: '8,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ioun_stone_pearly_white',
    name: 'Ioun Stone (Pearly White)',
    slot: 'slotless',
    effect: 'Orbits head: regenerates 1 point of damage per hour.',
    cost: '20,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'ioun_stone_dark_blue',
    name: 'Ioun Stone (Dark Blue)',
    slot: 'slotless',
    effect: 'Orbits head: grants the Alertness feat (+2 competence bonus on Listen and Spot checks).',
    cost: '10,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'decanter_of_endless_water',
    name: 'Decanter of Endless Water',
    slot: 'slotless',
    effect: 'Produces fresh or salt water on command: stream (1 gal/round), fountain (5 gal/round), or geyser (20 gal/round, 1d4 damage, DC 12 Str or knocked down).',
    cost: '9,000 gp',
    weight: 2,
    source: 'DMG'
  },
  {
    id: 'eversmoking_bottle',
    name: 'Eversmoking Bottle',
    slot: 'slotless',
    effect: 'When unstoppered, emits cloud of smoke expanding 50 ft per round up to 100 ft radius, granting total concealment.',
    cost: '5,400 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'horseshoes_of_speed',
    name: 'Horseshoes of Speed',
    slot: 'slotless',
    effect: "Increases mount's base land speed by +30 feet.",
    cost: '3,000 gp',
    weight: 12,
    source: 'DMG'
  },
  {
    id: 'horseshoes_of_a_zephyr',
    name: 'Horseshoes of a Zephyr',
    slot: 'slotless',
    effect: 'Allows mount to run or walk 4 inches above the ground or water without leaving tracks or stirring mud.',
    cost: '6,000 gp',
    weight: 4,
    source: 'DMG'
  },
  {
    id: 'chime_of_opening',
    name: 'Chime of Opening',
    slot: 'slotless',
    effect: 'Vibrations open magical or mundane locks, bars, and seals as a knock spell (10 uses total).',
    cost: '3,100 gp',
    weight: 1,
    source: 'DMG'
  },
  {
    id: 'gem_of_seeing',
    name: 'Gem of Seeing',
    slot: 'slotless',
    effect: 'Looking through the prism grants true seeing (CL 10th) for up to 30 minutes each day.',
    cost: '75,000 gp',
    weight: 0,
    source: 'DMG'
  },
  {
    id: 'strand_of_prayer_beads',
    name: 'Strand of Prayer Beads',
    slot: 'slotless',
    effect: 'Holy beads grant divine spellcasters powerful effects: Bead of Bless (bless 1/day), Bead of Healing (cure serious wounds 1/day), Bead of Karma (+4 CL for 10 min 1/day).',
    cost: '25,800 gp',
    weight: 0.5,
    source: 'DMG'
  },
  {
    id: 'cube_of_force',
    name: 'Cube of Force',
    slot: 'slotless',
    effect: 'Has 36 charges/day. Generates a 10-ft cubic force barrier around wearer blocking gases, nonliving matter, living matter, spells, or all.',
    cost: '62,000 gp',
    weight: 0.5,
    source: 'DMG'
  },
  {
    id: 'sustaining_spoon',
    name: 'Sustaining Spoon',
    slot: 'slotless',
    effect: 'When placed in an empty container, produces thick warm cereal nourishing up to 4 humans each day.',
    cost: '5,400 gp',
    weight: 0,
    source: 'DMG'
  }
];

/**
 * Filter predefined wondrous items by slot or search text.
 */
export function getPredefinedWondrousItems(
  slotFilter?: BodySlotId | 'all',
  searchQuery?: string,
  allowedSources?: string[],
  includeDisallowedSources: boolean = true
): PredefinedWondrousItem[] {
  let items = STANDARD_WONDROUS_ITEMS;

  if (slotFilter && slotFilter !== 'all') {
    if (slotFilter === 'ring1' || slotFilter === 'ring2') {
      items = items.filter(i => i.slot === 'ring1' || i.slot === 'ring2');
    } else {
      items = items.filter(i => i.slot === slotFilter);
    }
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    items = items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.effect.toLowerCase().includes(q) ||
      i.source.toLowerCase().includes(q) ||
      i.slot.toLowerCase().includes(q)
    );
  }

  if (allowedSources && allowedSources.length > 0 && !includeDisallowedSources) {
    items = items.filter(i => isSourceAllowed(i.source, allowedSources));
  }

  return items;
}

/**
 * Creates both a WondrousItem entry and a matching InventoryItem entry
 * from a predefined wondrous item definition.
 */
export function createWondrousItemFromPredefined(
  predefined: PredefinedWondrousItem,
  targetSlotOverride?: BodySlotId
): { wondrousItem: WondrousItem; inventoryItem: InventoryItem } {
  const invId = `inv_wondrous_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const wondrousId = `wondrous_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const finalSlot = targetSlotOverride || predefined.slot;

  const wondrousItem: WondrousItem = {
    id: wondrousId,
    name: predefined.name,
    slot: finalSlot,
    effect: predefined.effect,
    weight: predefined.weight,
    source: predefined.source,
    inventoryItemId: invId
  };

  const inventoryItem: InventoryItem = {
    id: invId,
    name: predefined.name,
    quantity: 1,
    weight: predefined.weight ?? 0,
    location: 'Carried',
    value: predefined.cost,
    notes: predefined.effect,
    itemType: 'wondrous',
    bodySlot: finalSlot,
    source: predefined.source
  };

  return { wondrousItem, inventoryItem };
}
