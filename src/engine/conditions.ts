import {
  ConditionDefinition,
  ConditionPenalties,
  ConditionType,
  VitalsHealthStatus
} from '../types/character';

/**
 * Standard D&D 3.5e Condition Registry.
 */
export const DND_CONDITIONS: ConditionDefinition[] = [
  // --- Mental / Fear ---
  {
    id: 'shaken',
    name: 'Shaken',
    category: 'mental',
    icon: 'fa-solid fa-ghost',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    summary: '-2 attack rolls, saving throws, skill checks, ability checks',
    description: 'A shaken character takes a -2 penalty on attack rolls, saving throws, skill checks, and ability checks.',
    effects: [
      '-2 penalty on all attack rolls',
      '-2 penalty on all saving throws (Fortitude, Reflex, Will)',
      '-2 penalty on all skill checks and ability checks'
    ]
  },
  {
    id: 'frightened',
    name: 'Frightened',
    category: 'mental',
    icon: 'fa-solid fa-person-running',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    summary: '-2 attacks/saves/checks, must flee source of fear',
    description: 'A frightened creature takes a -2 penalty on attack rolls, saving throws, skill checks, and ability checks, and must flee as best it can.',
    effects: [
      '-2 penalty on all attack rolls',
      '-2 penalty on all saving throws',
      '-2 penalty on skill checks and ability checks',
      'Must flee from the source of its fear as best it can'
    ]
  },
  {
    id: 'panicked',
    name: 'Panicked',
    category: 'mental',
    icon: 'fa-solid fa-person-falling-burst',
    badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
    summary: '-2 saves/checks, drops items, flees at top speed',
    description: 'A panicked creature drops whatever it holds and flees at top speed, taking -2 on saves, skill checks, and ability checks.',
    effects: [
      '-2 penalty on saving throws, skill checks, and ability checks',
      'Drops all held items and flees away from danger at maximum speed',
      'Can take no other actions other than fleeing'
    ]
  },
  {
    id: 'cowering',
    name: 'Cowering',
    category: 'mental',
    icon: 'fa-solid fa-shield-cat',
    badgeColor: 'bg-purple-600/20 text-purple-400 border-purple-600/30',
    summary: '-2 AC, loses Dex bonus to AC, can take no actions',
    description: 'The character is frozen in fear and can take no actions. A cowering character takes a -2 penalty to Armor Class and loses their Dexterity bonus.',
    effects: [
      '-2 penalty to Armor Class',
      'Loses Dexterity bonus to Armor Class',
      'Cannot take any actions'
    ]
  },
  {
    id: 'fascinated',
    name: 'Fascinated',
    category: 'mental',
    icon: 'fa-solid fa-wand-magic-sparkles',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    summary: '-4 reaction skill checks (Listen, Spot), enticed by display',
    description: 'A fascinated creature is entranced by a supernatural or spell effect and takes -4 on reaction skill checks.',
    effects: [
      '-4 penalty on skill checks made as reactions (such as Listen and Spot)',
      'Stands or sits quietly, taking no actions other than paying attention'
    ]
  },

  // --- Physical / Mobility ---
  {
    id: 'fatigued',
    name: 'Fatigued',
    category: 'physical',
    icon: 'fa-solid fa-battery-quarter',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    summary: '-2 Str (-1 mod), -2 Dex (-1 mod), cannot run or charge',
    description: 'A fatigued character cannot run or charge and takes a penalty of -2 to Strength and Dexterity.',
    effects: [
      '-2 penalty to effective Strength (-1 melee attack & damage, Fort checks)',
      '-2 penalty to effective Dexterity (-1 ranged attack, AC, Reflex, Dex skills)',
      'Cannot run or charge'
    ]
  },
  {
    id: 'exhausted',
    name: 'Exhausted',
    category: 'physical',
    icon: 'fa-solid fa-battery-empty',
    badgeColor: 'bg-orange-600/20 text-orange-400 border-orange-600/30',
    summary: '-6 Str (-3 mod), -6 Dex (-3 mod), half speed, cannot run/charge',
    description: 'An exhausted character moves at half speed, cannot run or charge, and takes a -6 penalty to Strength and Dexterity.',
    effects: [
      '-6 penalty to effective Strength (-3 melee attack & damage)',
      '-6 penalty to effective Dexterity (-3 ranged attack, AC, Reflex, Dex skills)',
      'Movement speed is halved',
      'Cannot run or charge'
    ]
  },
  {
    id: 'sickened',
    name: 'Sickened',
    category: 'physical',
    icon: 'fa-solid fa-face-grimace',
    badgeColor: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
    summary: '-2 attack rolls, weapon damage, saves, skill/ability checks',
    description: 'The character takes a -2 penalty on all attack rolls, weapon damage rolls, saving throws, skill checks, and ability checks.',
    effects: [
      '-2 penalty on all attack rolls',
      '-2 penalty on weapon damage rolls',
      '-2 penalty on all saving throws',
      '-2 penalty on skill checks and ability checks'
    ]
  },
  {
    id: 'nauseated',
    name: 'Nauseated',
    category: 'physical',
    icon: 'fa-solid fa-biohazard',
    badgeColor: 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30',
    summary: 'Stomach distress; only 1 move action per turn (no attack/cast)',
    description: 'Experiencing stomach distress. Nauseated creatures are unable to attack, cast spells, concentrate, or take standard actions; only a single move action per turn is allowed.',
    effects: [
      'Cannot make attacks, cast spells, or concentrate',
      'Can only take a single move action per turn'
    ]
  },
  {
    id: 'entangled',
    name: 'Entangled',
    category: 'physical',
    icon: 'fa-solid fa-link',
    badgeColor: 'bg-teal-600/20 text-teal-300 border-teal-600/30',
    summary: '-2 attack rolls, -4 Dex (-2 mod), half speed, DC 15+lvl Concentration',
    description: 'Being ensnared. An entangled creature takes a -2 penalty on attack rolls, -4 penalty to Dexterity, moves at half speed, and cannot run or charge.',
    effects: [
      '-2 penalty on all attack rolls',
      '-4 penalty to effective Dexterity (-2 to AC, Reflex, Dex checks)',
      'Moves at half speed and cannot run or charge',
      'DC 15 + spell level Concentration check required to cast spells'
    ]
  },

  // --- Positional ---
  {
    id: 'prone',
    name: 'Prone',
    category: 'positional',
    icon: 'fa-solid fa-person-falling',
    badgeColor: 'bg-amber-600/20 text-amber-400 border-amber-600/30',
    summary: '-4 melee attacks, +4 AC vs ranged, -4 AC vs melee',
    description: 'The character is on the ground. A prone attacker takes a -4 penalty on melee attack rolls. Opponents gain +4 on melee attacks against the prone character, but ranged attacks suffer a -4 penalty (+4 AC).',
    effects: [
      '-4 penalty on melee attack rolls',
      'Cannot use ranged weapons (except crossbows)',
      '+4 AC bonus against ranged attacks',
      '-4 AC penalty against melee attacks',
      'Standing up is a move action that provokes attacks of opportunity'
    ]
  },
  {
    id: 'flat_footed',
    name: 'Flat-Footed',
    category: 'positional',
    icon: 'fa-solid fa-hourglass-start',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    summary: 'Loses Dex bonus to AC, cannot make Attacks of Opportunity',
    description: 'A character who has not yet acted during combat is flat-footed. A flat-footed character loses their Dexterity bonus to AC and cannot make attacks of opportunity.',
    effects: [
      'Loses Dexterity bonus to Armor Class',
      'Cannot make attacks of opportunity'
    ]
  },
  {
    id: 'grappled',
    name: 'Grappled',
    category: 'positional',
    icon: 'fa-solid fa-hands-holding-circle',
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    summary: '-4 Dex (-2 mod), -2 attack rolls (except grapple/light), cannot move',
    description: 'Engaged in wrestling. Grappled characters take -4 Dex, -2 on attacks (except grapple and light weapons), and cannot move freely or make AoOs.',
    effects: [
      '-4 penalty to effective Dexterity (-2 AC, Reflex)',
      '-2 penalty on attack rolls (except grapple checks and light weapons against grappler)',
      'Cannot move freely or make attacks of opportunity'
    ]
  },
  {
    id: 'pinned',
    name: 'Pinned',
    category: 'positional',
    icon: 'fa-solid fa-handcuffs',
    badgeColor: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
    summary: 'Helpless, loses Dex to AC, -4 AC vs other opponents',
    description: 'Held immobile in a grapple. A pinned character is helpless, loses Dex to AC, and takes -4 AC vs foes other than the grappler.',
    effects: [
      'Helpless (cannot move or take physical actions except escape grapple)',
      'Loses Dexterity bonus to AC',
      '-4 penalty to AC against opponents other than the pinning creature'
    ]
  },

  // --- Sensory ---
  {
    id: 'blinded',
    name: 'Blinded',
    category: 'sensory',
    icon: 'fa-solid fa-eye-slash',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    summary: '-2 AC, loses Dex to AC, half speed, -4 Search/Str/Dex skills, 50% miss',
    description: 'The character cannot see. Takes a -2 penalty to Armor Class, loses Dexterity bonus to AC, moves at half speed, takes -4 on Search and Str/Dex skills, and opponents have total concealment (50% miss chance).',
    effects: [
      '-2 penalty to Armor Class',
      'Loses Dexterity bonus to Armor Class',
      'Movement speed is halved',
      '-4 penalty on Search checks and Strength- and Dexterity-based skill checks',
      'All opponents have total concealment (50% miss chance on attacks)'
    ]
  },
  {
    id: 'dazzled',
    name: 'Dazzled',
    category: 'sensory',
    icon: 'fa-solid fa-sun',
    badgeColor: 'bg-amber-400/20 text-amber-200 border-amber-400/30',
    summary: '-1 attack rolls, Search checks, Spot checks',
    description: 'Unable to see well due to overstimulation of the eyes. Takes a -1 penalty on attack rolls, Search checks, and Spot checks.',
    effects: [
      '-1 penalty on all attack rolls',
      '-1 penalty on Search checks and Spot checks'
    ]
  },
  {
    id: 'deafened',
    name: 'Deafened',
    category: 'sensory',
    icon: 'fa-solid fa-ear-deaf',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    summary: '-4 initiative, auto-fails Listen checks, 20% verbal spell failure',
    description: 'The character cannot hear. Takes a -4 penalty on initiative checks, automatically fails Listen checks, and has a 20% chance of verbal spell failure.',
    effects: [
      '-4 penalty on initiative checks',
      'Automatically fails all Listen checks',
      '20% chance of spell failure for spells with verbal components'
    ]
  },

  // --- Incapacitated ---
  {
    id: 'stunned',
    name: 'Stunned',
    category: 'incapacitated',
    icon: 'fa-solid fa-bolt',
    badgeColor: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
    summary: 'Drops items, no actions, -2 AC, loses Dex to AC',
    description: 'A stunned creature drops everything held, can take no actions, takes a -2 penalty to AC, and loses its Dexterity bonus to AC.',
    effects: [
      'Drops all held items immediately',
      'Can take no actions',
      '-2 penalty to Armor Class',
      'Loses Dexterity bonus to Armor Class'
    ]
  },
  {
    id: 'dazed',
    name: 'Dazed',
    category: 'incapacitated',
    icon: 'fa-solid fa-dizzy',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    summary: 'Can take no actions; no AC penalty',
    description: 'The creature is unable to act normally. A dazed creature can take no actions, but has no penalty to AC.',
    effects: [
      'Unable to take any actions',
      'No Armor Class penalty'
    ]
  },
  {
    id: 'paralyzed',
    name: 'Paralyzed',
    category: 'incapacitated',
    icon: 'fa-solid fa-icicles',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    summary: 'Effective Str/Dex 0 (-5 mod), helpless, cannot move/act',
    description: 'Frozen in place and cannot move or act. Effective Strength and Dexterity scores are 0 (-5 modifier). The character is helpless.',
    effects: [
      'Effective Strength score is 0 (-5 modifier)',
      'Effective Dexterity score is 0 (-5 modifier)',
      'Loses Dexterity bonus to AC',
      'Helpless (vulnerable to coup de grace and sneak attacks)'
    ]
  },
  {
    id: 'helpless',
    name: 'Helpless',
    category: 'incapacitated',
    icon: 'fa-solid fa-bed',
    badgeColor: 'bg-rose-600/20 text-rose-400 border-rose-600/30',
    summary: 'Effective Dex 0 (-5 mod), +4 melee attack against, sneak/coup de grace',
    description: 'Paralyzed, sleeping, bound, or unconscious. Effective Dexterity is 0 (-5 mod). Melee attacks gain a +4 bonus against a helpless defender.',
    effects: [
      'Effective Dexterity score is 0 (-5 modifier)',
      'Loses Dexterity bonus to AC',
      'Melee attacks against character gain a +4 attack bonus',
      'Vulnerable to sneak attacks and coup de grace'
    ]
  },
  {
    id: 'staggered',
    name: 'Staggered',
    category: 'incapacitated',
    icon: 'fa-solid fa-person-walking-with-cane',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    summary: 'Nonlethal damage = HP; only 1 move or standard action per turn',
    description: 'A character whose nonlethal damage equals their current hit points is staggered. Can take only a single standard action or move action each round.',
    effects: [
      'Nonlethal damage equals current HP',
      'Can take only a single standard action or move action each round'
    ]
  },
  {
    id: 'unconscious',
    name: 'Unconscious',
    category: 'incapacitated',
    icon: 'fa-solid fa-skull-crossbones',
    badgeColor: 'bg-rose-700/20 text-rose-400 border-rose-700/30',
    summary: 'Knocked out and helpless; nonlethal > HP or HP < 0',
    description: 'Knocked out and helpless. Unconsciousness results when current HP is below 0 or nonlethal damage exceeds current HP.',
    effects: [
      'Knocked out and completely helpless',
      'Effective Dexterity score is 0 (-5 modifier)',
      'Loses Dexterity bonus to AC',
      'Cannot take any actions'
    ]
  },
  {
    id: 'disabled',
    name: 'Disabled',
    category: 'incapacitated',
    icon: 'fa-solid fa-heart-crack',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    summary: 'At 0 HP; 1 standard or move action; standard action deals 1 dmg',
    description: 'At exactly 0 HP. A disabled character may take only a single standard or move action per turn. Taking a standard action deals 1 damage.',
    effects: [
      'At exactly 0 HP',
      'May take only 1 standard or move action per round',
      'Strenuous standard actions inflict 1 point of damage'
    ]
  },
  {
    id: 'dying',
    name: 'Dying',
    category: 'incapacitated',
    icon: 'fa-solid fa-heart-pulse',
    badgeColor: 'bg-rose-600/20 text-rose-300 border-rose-600/30',
    summary: '-1 to -9 HP; unconscious, losing 1 HP per round unless stabilized',
    description: 'Between -1 and -9 HP. Unconscious and near death, losing 1 HP per round.',
    effects: [
      'Current HP is between -1 and -9',
      'Unconscious and helpless',
      'Loses 1 HP each round unless stabilized'
    ]
  }
];

export const CONDITION_MAP: Record<string, ConditionDefinition> = DND_CONDITIONS.reduce((acc, cond) => {
  acc[cond.id] = cond;
  return acc;
}, {} as Record<string, ConditionDefinition>);

/**
 * Calculates aggregated stat penalties and special flags from a list of active conditions.
 */
export function calculateConditionPenalties(conditions: string[] = []): ConditionPenalties {
  const activeSet = new Set(conditions.map(c => c.toLowerCase()));

  const penalties: ConditionPenalties = {
    strPenalty: 0,
    dexPenalty: 0,
    attackPenalty: 0,
    meleeAttackPenalty: 0,
    rangedAttackPenalty: 0,
    damagePenalty: 0,
    fortPenalty: 0,
    refPenalty: 0,
    willPenalty: 0,
    allSavesPenalty: 0,
    acPenalty: 0,
    meleeAcPenalty: 0,
    rangedAcPenalty: 0,
    loseDexToAc: false,
    speedMultiplier: 1.0,
    initiativePenalty: 0,
    skillCheckPenalty: 0,
    searchPenalty: 0,
    spotPenalty: 0,
    listenPenalty: 0,
    specialNotes: []
  };

  // 1. Shaken / Frightened / Panicked (Fear conditions - D&D 3.5e fear penalties don't stack with each other)
  if (activeSet.has('shaken') || activeSet.has('frightened') || activeSet.has('panicked')) {
    penalties.attackPenalty -= 2;
    penalties.allSavesPenalty -= 2;
    penalties.skillCheckPenalty -= 2;

    if (activeSet.has('panicked')) {
      penalties.specialNotes.push('Panicked: Drops held items, flees at top speed');
    } else if (activeSet.has('frightened')) {
      penalties.specialNotes.push('Frightened: Must flee from source of fear');
    } else {
      penalties.specialNotes.push('Shaken: -2 on attack rolls, saves, skill & ability checks');
    }
  }

  // 2. Cowering
  if (activeSet.has('cowering')) {
    penalties.acPenalty -= 2;
    penalties.loseDexToAc = true;
    penalties.specialNotes.push('Cowering: -2 AC, lose Dex to AC, no actions');
  }

  // 3. Fascinated
  if (activeSet.has('fascinated')) {
    penalties.spotPenalty -= 4;
    penalties.listenPenalty -= 4;
    penalties.specialNotes.push('Fascinated: -4 on reaction skill checks (Listen/Spot)');
  }

  // 4. Fatigue & Exhaustion (Exhaustion supersedes Fatigue)
  if (activeSet.has('exhausted')) {
    penalties.strPenalty -= 6;
    penalties.dexPenalty -= 6;
    penalties.speedMultiplier = Math.min(penalties.speedMultiplier, 0.5);
    penalties.specialNotes.push('Exhausted: -6 Str, -6 Dex, half speed, cannot run/charge');
  } else if (activeSet.has('fatigued')) {
    penalties.strPenalty -= 2;
    penalties.dexPenalty -= 2;
    penalties.specialNotes.push('Fatigued: -2 Str, -2 Dex, cannot run or charge');
  }

  // 5. Sickened
  if (activeSet.has('sickened')) {
    penalties.attackPenalty -= 2;
    penalties.damagePenalty -= 2;
    penalties.allSavesPenalty -= 2;
    penalties.skillCheckPenalty -= 2;
    penalties.specialNotes.push('Sickened: -2 on attacks, weapon damage, saves, skill & ability checks');
  }

  // 6. Nauseated
  if (activeSet.has('nauseated')) {
    penalties.specialNotes.push('Nauseated: Can only take a single move action per turn (no attack/casting)');
  }

  // 7. Entangled
  if (activeSet.has('entangled')) {
    penalties.attackPenalty -= 2;
    penalties.dexPenalty -= 4;
    penalties.speedMultiplier = Math.min(penalties.speedMultiplier, 0.5);
    penalties.specialNotes.push('Entangled: -2 attack, -4 Dex, half speed, DC 15+lvl Concentration');
  }

  // 8. Prone
  if (activeSet.has('prone')) {
    penalties.meleeAttackPenalty -= 4;
    penalties.meleeAcPenalty -= 4;
    penalties.rangedAcPenalty += 4;
    penalties.specialNotes.push('Prone: -4 melee attacks, +4 AC vs ranged, -4 AC vs melee');
  }

  // 9. Flat-Footed
  if (activeSet.has('flat_footed')) {
    penalties.loseDexToAc = true;
    penalties.specialNotes.push('Flat-Footed: Loses Dexterity bonus to AC, no AoOs');
  }

  // 10. Grappled
  if (activeSet.has('grappled')) {
    penalties.dexPenalty -= 4;
    penalties.attackPenalty -= 2;
    penalties.specialNotes.push('Grappled: -4 Dex, -2 attack (except grapple/light weapons), no AoOs');
  }

  // 11. Pinned
  if (activeSet.has('pinned')) {
    penalties.acPenalty -= 4;
    penalties.loseDexToAc = true;
    penalties.specialNotes.push('Pinned: Helpless, lose Dex to AC, -4 AC vs other foes');
  }

  // 12. Blinded
  if (activeSet.has('blinded')) {
    penalties.acPenalty -= 2;
    penalties.loseDexToAc = true;
    penalties.speedMultiplier = Math.min(penalties.speedMultiplier, 0.5);
    penalties.searchPenalty -= 4;
    penalties.specialNotes.push('Blinded: -2 AC, lose Dex to AC, half speed, -4 Search/Str/Dex skills, 50% miss chance');
  }

  // 13. Dazzled
  if (activeSet.has('dazzled')) {
    penalties.attackPenalty -= 1;
    penalties.searchPenalty -= 1;
    penalties.spotPenalty -= 1;
    penalties.specialNotes.push('Dazzled: -1 on attack rolls, Search checks, and Spot checks');
  }

  // 14. Deafened
  if (activeSet.has('deafened')) {
    penalties.initiativePenalty -= 4;
    penalties.listenPenalty -= 99; // Auto-fails
    penalties.specialNotes.push('Deafened: -4 initiative, auto-fails Listen, 20% verbal spell failure');
  }

  // 15. Stunned
  if (activeSet.has('stunned')) {
    penalties.acPenalty -= 2;
    penalties.loseDexToAc = true;
    penalties.specialNotes.push('Stunned: Drops held items, no actions, -2 AC, loses Dex to AC');
  }

  // 16. Dazed
  if (activeSet.has('dazed')) {
    penalties.specialNotes.push('Dazed: Can take no actions');
  }

  // 17. Paralyzed
  if (activeSet.has('paralyzed')) {
    penalties.loseDexToAc = true;
    penalties.specialNotes.push('Paralyzed: Effective Str/Dex 0 (-5 mod), helpless');
  }

  // 18. Helpless
  if (activeSet.has('helpless')) {
    penalties.loseDexToAc = true;
    penalties.specialNotes.push('Helpless: Effective Dex 0 (-5 mod), melee attacks gain +4 attack against');
  }

  // 19. Staggered
  if (activeSet.has('staggered')) {
    penalties.specialNotes.push('Staggered: Only 1 standard or move action per turn');
  }

  // 20. Unconscious
  if (activeSet.has('unconscious')) {
    penalties.loseDexToAc = true;
    penalties.specialNotes.push('Unconscious: Knocked out and helpless');
  }

  // 21. Disabled
  if (activeSet.has('disabled')) {
    penalties.specialNotes.push('Disabled: At 0 HP, 1 standard/move action per turn (standard deals 1 dmg)');
  }

  // 22. Dying
  if (activeSet.has('dying')) {
    penalties.loseDexToAc = true;
    penalties.specialNotes.push('Dying: -1 to -9 HP, unconscious and bleeding 1 HP/round');
  }

  // Aggregate save penalties
  penalties.fortPenalty += penalties.allSavesPenalty;
  penalties.refPenalty += penalties.allSavesPenalty;
  penalties.willPenalty += penalties.allSavesPenalty;

  return penalties;
}

export interface HealthStatusResult {
  status: VitalsHealthStatus;
  label: string;
  badgeClass: string;
  barColorClass: string;
  percent: number;
  isUnconsciousOrDead: boolean;
  alertMessage?: string;
}

/**
 * Computes health status info, badge classes, health percentage, and alerts from HP values.
 */
export function getHealthStatus(
  currentHp: number,
  maxHp: number,
  tempHp: number = 0,
  nonlethalDamage: number = 0
): HealthStatusResult {
  const safeMax = Math.max(1, maxHp);
  const percent = Math.min(100, Math.max(0, Math.round((currentHp / safeMax) * 100)));

  // 1. Dead (at or below -10 HP in D&D 3.5e standard rules)
  if (currentHp <= -10) {
    return {
      status: 'dead',
      label: 'Dead',
      badgeClass: 'bg-slate-900 text-rose-400 border-slate-700 shadow-rose-950/50',
      barColorClass: 'bg-slate-800',
      percent: 0,
      isUnconsciousOrDead: true,
      alertMessage: 'Character is Dead (HP <= -10)'
    };
  }

  // 2. Dying (-1 to -9 HP)
  if (currentHp < 0) {
    return {
      status: 'dying',
      label: 'Dying',
      badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-500/60 animate-pulse',
      barColorClass: 'bg-rose-700',
      percent: 0,
      isUnconsciousOrDead: true,
      alertMessage: `Dying (${currentHp} HP): Unconscious, losing 1 HP/round until stabilized`
    };
  }

  // 3. Disabled (exactly 0 HP)
  if (currentHp === 0) {
    return {
      status: 'disabled',
      label: 'Disabled',
      badgeClass: 'bg-orange-950/80 text-orange-300 border-orange-500/60',
      barColorClass: 'bg-orange-600',
      percent: 0,
      isUnconsciousOrDead: false,
      alertMessage: 'Disabled (0 HP): Can only take 1 standard or move action; standard action deals 1 damage'
    };
  }

  // 4. Nonlethal damage exceeds current HP -> Unconscious
  if (nonlethalDamage > currentHp) {
    return {
      status: 'unconscious',
      label: 'Unconscious (Nonlethal)',
      badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-500/60 animate-pulse',
      barColorClass: 'bg-purple-600',
      percent,
      isUnconsciousOrDead: true,
      alertMessage: `Unconscious: Nonlethal damage (${nonlethalDamage}) exceeds Current HP (${currentHp})`
    };
  }

  // 5. Nonlethal damage equals current HP -> Staggered
  if (nonlethalDamage === currentHp && nonlethalDamage > 0) {
    return {
      status: 'staggered',
      label: 'Staggered (Nonlethal)',
      badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-500/60',
      barColorClass: 'bg-amber-500',
      percent,
      isUnconsciousOrDead: false,
      alertMessage: `Staggered: Nonlethal damage (${nonlethalDamage}) equals Current HP (${currentHp}) — 1 action/turn`
    };
  }

  // 6. Bloodied (HP < 50% max)
  if (percent < 50) {
    return {
      status: 'bloodied',
      label: 'Bloodied',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      barColorClass: 'bg-rose-500',
      percent,
      isUnconsciousOrDead: false
    };
  }

  // 7. Injured (50% <= HP < 100%)
  if (percent < 100) {
    return {
      status: 'injured',
      label: 'Injured',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      barColorClass: 'bg-amber-500',
      percent,
      isUnconsciousOrDead: false
    };
  }

  // 8. Healthy (100% HP)
  return {
    status: 'healthy',
    label: tempHp > 0 ? `Healthy (+${tempHp} Temp)` : 'Healthy',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    barColorClass: 'bg-emerald-500',
    percent: 100,
    isUnconsciousOrDead: false
  };
}

/**
 * Applies incoming damage to a character, absorbing from temporary hit points first
 * before reducing current hit points, or accumulating nonlethal damage.
 */
export function applyDamage(
  currentHp: number,
  maxHp: number,
  tempHp: number = 0,
  damageAmount: number,
  isNonlethal: boolean = false,
  currentNonlethal: number = 0
): { currentHp: number; tempHp: number; nonlethalDamage: number } {
  const amount = Math.max(0, Math.floor(damageAmount));
  if (amount === 0) return { currentHp, tempHp, nonlethalDamage: currentNonlethal };

  if (isNonlethal) {
    // Nonlethal damage accumulates without reducing current HP directly
    return {
      currentHp,
      tempHp,
      nonlethalDamage: Math.max(0, currentNonlethal + amount)
    };
  }

  // Lethal damage: absorbs from temp HP first
  let remainingDamage = amount;
  let newTempHp = tempHp;

  if (newTempHp > 0) {
    if (remainingDamage <= newTempHp) {
      newTempHp -= remainingDamage;
      remainingDamage = 0;
    } else {
      remainingDamage -= newTempHp;
      newTempHp = 0;
    }
  }

  const newCurrentHp = currentHp - remainingDamage;

  return {
    currentHp: newCurrentHp,
    tempHp: newTempHp,
    nonlethalDamage: currentNonlethal
  };
}

/**
 * Applies healing to a character: heals current hit points up to max HP
 * and heals nonlethal damage simultaneously (as per D&D 3.5e rules, magical healing
 * cures both lethal and nonlethal damage equally).
 */
export function applyHeal(
  currentHp: number,
  maxHp: number,
  nonlethalDamage: number = 0,
  healAmount: number
): { currentHp: number; nonlethalDamage: number } {
  const amount = Math.max(0, Math.floor(healAmount));
  if (amount === 0) return { currentHp, nonlethalDamage };

  const newCurrentHp = Math.min(maxHp, currentHp + amount);
  const newNonlethal = Math.max(0, nonlethalDamage - amount);

  return {
    currentHp: newCurrentHp,
    nonlethalDamage: newNonlethal
  };
}

/**
 * Helper to toggle an active condition in the character's condition array.
 */
export function toggleCondition(activeConditions: string[] = [], conditionId: string): string[] {
  const lowerId = conditionId.toLowerCase();
  const exists = activeConditions.some(c => c.toLowerCase() === lowerId);

  if (exists) {
    return activeConditions.filter(c => c.toLowerCase() !== lowerId);
  } else {
    return [...activeConditions, lowerId];
  }
}
