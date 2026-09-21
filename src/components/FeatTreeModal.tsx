import React, { useState, useMemo, useEffect } from 'react';
import {
  CharacterState,
  CharacterFeat,
  FeatData,
  ClassData,
  RaceData,
  TemplateData,
  TraitData,
  FlawData
} from '../types/character';
import {
  CharacterPrereqContext,
  buildCharacterPrereqContext,
  evaluateFeatPrerequisitesWithContext,
  normalizeFeatName,
  aggregateAndDeduplicateFeats,
  featNameToId
} from '../engine/featPrereqs';
import { getSourceBadgeInfo, getAllSourceBadges } from '../utils/sourceFilter';

export interface FeatTreeNode {
  id: string; // Base name or ID matching featsData
  name: string;
  shortSummary?: string;
  children?: FeatTreeNode[];
}

export interface FeatChainDefinition {
  id: string;
  name: string;
  icon: string;
  badgeColor: string;
  description: string;
  roots: FeatTreeNode[];
}

// Major 3.5e Feat Chains
export const FEAT_CHAINS: FeatChainDefinition[] = [
  {
    id: 'power_attack',
    name: 'Power Attack Chain',
    icon: 'fa-hand-fist',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    description: 'Heavy melee combat feats focused on devastating power, cleaving through foes, and bull rushing defenses.',
    roots: [
      {
        id: 'power_attack',
        name: 'Power Attack',
        shortSummary: 'Trade BAB for damage bonus (+1/+2)',
        children: [
          {
            id: 'cleave',
            name: 'Cleave',
            shortSummary: 'Immediate extra attack after dropping an enemy',
            children: [
              {
                id: 'great_cleave',
                name: 'Great Cleave',
                shortSummary: 'No limit on Cleave attacks per round'
              }
            ]
          },
          {
            id: 'improved_bull_rush',
            name: 'Improved Bull Rush',
            shortSummary: '+4 on bull rush, no attack of opportunity',
            children: [
              {
                id: 'shock_trooper',
                name: 'Shock Trooper',
                shortSummary: 'Directed Bull Rush & Heedless Charge (penalty to AC)'
              }
            ]
          },
          {
            id: 'improved_sunder',
            name: 'Improved Sunder',
            shortSummary: '+4 on sunder attempts, no attack of opportunity',
            children: [
              {
                id: 'combat_brute',
                name: 'Combat Brute',
                shortSummary: 'Advancing Blow, Sundering Cleave, Momentum Swing'
              }
            ]
          },
          {
            id: 'improved_overrun',
            name: 'Improved Overrun',
            shortSummary: '+4 on overrun, target cannot avoid you'
          },
          {
            id: 'leap_attack',
            name: 'Leap Attack',
            shortSummary: 'Jump during a charge to double Power Attack damage'
          }
        ]
      }
    ]
  },
  {
    id: 'dodge_mobility',
    name: 'Dodge, Mobility & Spring Attack',
    icon: 'fa-person-running',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    description: 'Agile skirmishing, hit-and-run tactics, defensive positioning, and area attacks.',
    roots: [
      {
        id: 'dodge',
        name: 'Dodge',
        shortSummary: '+1 dodge bonus to AC against designated opponent',
        children: [
          {
            id: 'mobility',
            name: 'Mobility',
            shortSummary: '+4 AC against attacks of opportunity from movement',
            children: [
              {
                id: 'spring_attack',
                name: 'Spring Attack',
                shortSummary: 'Move before and after a melee attack without AoO',
                children: [
                  {
                    id: 'bounding_assault',
                    name: 'Bounding Assault',
                    shortSummary: 'Make a second melee attack during Spring Attack'
                  },
                  {
                    id: 'whirlwind_attack',
                    name: 'Whirlwind Attack',
                    shortSummary: 'Make one melee attack against each adjacent foe'
                  }
                ]
              },
              {
                id: 'elusive_target',
                name: 'Elusive Target',
                shortSummary: 'Negate Power Attack, Diverting Defense, Cause Overrun'
              },
              {
                id: 'shot_on_the_run',
                name: 'Shot on the Run',
                shortSummary: 'Move before and after a ranged attack without AoO'
              }
            ]
          }
        ]
      },
      {
        id: 'combat_expertise',
        name: 'Combat Expertise',
        shortSummary: 'Trade attack bonus for dodge AC bonus',
        children: [
          {
            id: 'improved_trip',
            name: 'Improved Trip',
            shortSummary: '+4 on trip checks; immediate melee attack on success'
          },
          {
            id: 'improved_disarm',
            name: 'Improved Disarm',
            shortSummary: '+4 on disarm checks, no attack of opportunity'
          },
          {
            id: 'improved_feint',
            name: 'Improved Feint',
            shortSummary: 'Feint in combat as a move action rather than standard'
          }
        ]
      }
    ]
  },
  {
    id: 'archery',
    name: 'Point Blank Shot & Archery',
    icon: 'fa-bullseye',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description: 'Ranged precision feats, volley fire, mobile archery, and heavy crossbow mastery.',
    roots: [
      {
        id: 'point_blank_shot',
        name: 'Point Blank Shot',
        shortSummary: '+1 attack and damage on ranged attacks within 30 ft',
        children: [
          {
            id: 'precise_shot',
            name: 'Precise Shot',
            shortSummary: 'No -4 penalty for shooting into melee',
            children: [
              {
                id: 'improved_precise_shot',
                name: 'Improved Precise Shot',
                shortSummary: 'Ignore less than total cover and concealment'
              },
              {
                id: 'sharp-shooting',
                name: 'Sharp-Shooting',
                shortSummary: 'Halve cover AC bonus of targets'
              },
              {
                id: 'deadeye_shot',
                name: 'Deadeye Shot',
                shortSummary: 'Target is flat-footed against your ranged attack'
              },
              {
                id: 'penetrating_shot',
                name: 'Penetrating Shot',
                shortSummary: 'Ranged attack pierces all targets in a 60-ft line'
              }
            ]
          },
          {
            id: 'rapid_shot',
            name: 'Rapid Shot',
            shortSummary: 'Extra ranged attack per round with -2 on all attacks',
            children: [
              {
                id: 'manyshot',
                name: 'Manyshot',
                shortSummary: 'Fire multiple arrows simultaneously as a standard action',
                children: [
                  {
                    id: 'greater_manyshot',
                    name: 'Greater Manyshot',
                    shortSummary: 'Apply precision damage (sneak attack) to all arrows'
                  }
                ]
              },
              {
                id: 'improved_rapid_shot',
                name: 'Improved Rapid Shot',
                shortSummary: 'Ignore the -2 penalty on Rapid Shot attacks'
              }
            ]
          },
          {
            id: 'far_shot',
            name: 'Far Shot',
            shortSummary: 'Increase range increments by 1.5x (bows) or 2x (thrown)'
          },
          {
            id: 'crossbow_sniper',
            name: 'Crossbow Sniper',
            shortSummary: 'Add 1/2 Dex modifier to crossbow damage; extend sneak attack'
          },
          {
            id: 'woodland_archer',
            name: 'Woodland Archer',
            shortSummary: 'Adjust for Miss, Pierce the Foliage, Moving Sniper'
          }
        ]
      }
    ]
  },
  {
    id: 'two_weapon',
    name: 'Two-Weapon Fighting Chain',
    icon: 'fa-shield-halved',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: 'Dual-wielding mastery for light and one-handed weapons, off-hand defenses, and multi-attack rending.',
    roots: [
      {
        id: 'two-weapon_fighting',
        name: 'Two-Weapon Fighting',
        shortSummary: 'Reduce dual-wielding attack penalties to -2/-2',
        children: [
          {
            id: 'improved_two-weapon_fighting',
            name: 'Improved Two-Weapon Fighting',
            shortSummary: 'Gain a second off-hand attack with a -5 penalty',
            children: [
              {
                id: 'greater_two-weapon_fighting',
                name: 'Greater Two-Weapon Fighting',
                shortSummary: 'Gain a third off-hand attack with a -10 penalty',
                children: [
                  {
                    id: 'perfect_two-weapon_fighting',
                    name: 'Perfect Two-Weapon Fighting',
                    shortSummary: 'Off-hand attacks equal full main-hand attack sequence'
                  }
                ]
              },
              {
                id: 'two-weapon_rend',
                name: 'Two-Weapon Rend',
                shortSummary: 'Deal 1d6 + 1.5x Str bonus damage when hitting with both weapons'
              },
              {
                id: 'dual_strike',
                name: 'Dual Strike',
                shortSummary: 'Attack with two weapons as a single standard action'
              }
            ]
          },
          {
            id: 'two-weapon_defense',
            name: 'Two-Weapon Defense',
            shortSummary: '+1 shield bonus to AC when wielding two weapons',
            children: [
              {
                id: 'improved_two-weapon_defense',
                name: 'Improved Two-Weapon Defense',
                shortSummary: '+2 shield bonus to AC when wielding two weapons',
                children: [
                  {
                    id: 'greater_two-weapon_defense',
                    name: 'Greater Two-Weapon Defense',
                    shortSummary: '+3 shield bonus to AC when wielding two weapons'
                  }
                ]
              }
            ]
          },
          {
            id: 'oversized_two-weapon_fighting',
            name: 'Oversized Two-Weapon Fighting',
            shortSummary: 'Wield one-handed weapon in off-hand as if it were a light weapon'
          },
          {
            id: 'two-weapon_pounce',
            name: 'Two-Weapon Pounce',
            shortSummary: 'Attack with both weapons at the end of a charge'
          }
        ]
      }
    ]
  },
  {
    id: 'metamagic',
    name: 'Metamagic & Spell Mastery',
    icon: 'fa-wand-magic-sparkles',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    description: 'Spell alteration, duration extension, energy substitution, and metamagic compounding for arcane and divine casters.',
    roots: [
      {
        id: 'extend_spell',
        name: 'Extend Spell',
        shortSummary: 'Double spell duration (+1 spell level)',
        children: [
          {
            id: 'persistent_spell',
            name: 'Persistent Spell',
            shortSummary: 'Extend spell duration to 24 hours (+6 spell level)'
          }
        ]
      },
      {
        id: 'empower_spell',
        name: 'Empower Spell',
        shortSummary: 'Increase spell variable numeric effects by 50% (+2 spell level)',
        children: [
          {
            id: 'maximize_spell',
            name: 'Maximize Spell',
            shortSummary: 'Maximize all variable numeric spell effects (+3 spell level)',
            children: [
              {
                id: 'twin_spell',
                name: 'Twin Spell',
                shortSummary: 'Cast spell simultaneously twice (+4 spell level)'
              }
            ]
          }
        ]
      },
      {
        id: 'enlarge_spell',
        name: 'Enlarge Spell',
        shortSummary: 'Double spell range (+1 spell level)',
        children: [
          {
            id: 'widen_spell',
            name: 'Widen Spell',
            shortSummary: 'Double spell area of effect (+3 spell level)'
          }
        ]
      },
      {
        id: 'energy_substitution',
        name: 'Energy Substitution',
        shortSummary: 'Change energy type of any spell to your chosen energy (+0 level)',
        children: [
          {
            id: 'energy_admixture',
            name: 'Energy Admixture',
            shortSummary: 'Add equal damage of your chosen energy type (+4 level)',
            children: [
              {
                id: 'born_of_the_three_thunders',
                name: 'Born of the Three Thunders',
                shortSummary: 'Split energy into Electricity/Sonic; stun and knock prone'
              }
            ]
          }
        ]
      },
      {
        id: 'quicken_spell',
        name: 'Quicken Spell',
        shortSummary: 'Cast spell as a swift action (+4 spell level)'
      },
      {
        id: 'sculpt_spell',
        name: 'Sculpt Spell',
        shortSummary: 'Alter area shape (cylinder, cone, 4 cubes, ball, line) (+1 level)'
      },
      {
        id: 'split_ray',
        name: 'Split Ray',
        shortSummary: 'Ray spell fires a second ray at a target within 30 ft (+2 level)'
      },
      {
        id: 'chain_spell',
        name: 'Chain Spell',
        shortSummary: 'Spell arcs to secondary targets up to your caster level (+3 level)'
      }
    ]
  },
  {
    id: 'weapon_mastery',
    name: 'Weapon Focus & Specialization',
    icon: 'fa-award',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: 'Fighter training and martial specialization for mastery of specific weapon disciplines.',
    roots: [
      {
        id: 'weapon_focus',
        name: 'Weapon Focus',
        shortSummary: '+1 attack bonus with chosen weapon discipline',
        children: [
          {
            id: 'weapon_specialization',
            name: 'Weapon Specialization',
            shortSummary: '+2 damage bonus with chosen weapon (Fighter 4th)',
            children: [
              {
                id: 'greater_weapon_specialization',
                name: 'Greater Weapon Specialization',
                shortSummary: '+4 total damage bonus with chosen weapon (Fighter 12th)'
              },
              {
                id: 'melee_weapon_mastery',
                name: 'Melee Weapon Mastery',
                shortSummary: '+2 attack and +2 damage with entire weapon group'
              }
            ]
          },
          {
            id: 'greater_weapon_focus',
            name: 'Greater Weapon Focus',
            shortSummary: '+2 total attack bonus with chosen weapon (Fighter 8th)'
          },
          {
            id: 'improved_critical',
            name: 'Improved Critical',
            shortSummary: 'Double the threat range of chosen weapon (BAB +8)'
          }
        ]
      }
    ]
  },
  {
    id: 'unarmed_combat',
    name: 'Unarmed & Grapple Mastery',
    icon: 'fa-hand-back-fist',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    description: 'Monk and brawler techniques for unarmed strikes, arrow deflection, stunning blows, and grappling.',
    roots: [
      {
        id: 'improved_unarmed_strike',
        name: 'Improved Unarmed Strike',
        shortSummary: 'Unarmed attacks deal lethal damage and provoke no AoO',
        children: [
          {
            id: 'deflect_arrows',
            name: 'Deflect Arrows',
            shortSummary: 'Deflect one ranged weapon attack per round',
            children: [
              {
                id: 'snatch_arrows',
                name: 'Snatch Arrows',
                shortSummary: 'Catch and immediately throw back deflected missiles'
              }
            ]
          },
          {
            id: 'stunning_fist',
            name: 'Stunning Fist',
            shortSummary: 'Force Fortitude save or stun target for 1 round'
          },
          {
            id: 'improved_grapple',
            name: 'Improved Grapple',
            shortSummary: '+4 bonus on grapple checks and no attack of opportunity'
          }
        ]
      }
    ]
  },
  {
    id: 'mounted_combat',
    name: 'Mounted Combat Chain',
    icon: 'fa-horse',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description: 'Cavalry warfare, ride-by charges, lance damage multiplication, and trampling opponents.',
    roots: [
      {
        id: 'mounted_combat',
        name: 'Mounted Combat',
        shortSummary: 'Negate hits on your mount with Ride check 1/round',
        children: [
          {
            id: 'ride-by_attack',
            name: 'Ride-By Attack',
            shortSummary: 'Move before and after a mounted charge attack',
            children: [
              {
                id: 'spirited_charge',
                name: 'Spirited Charge',
                shortSummary: 'Deal double damage (triple with lance) on mounted charge'
              }
            ]
          },
          {
            id: 'trample',
            name: 'Trample',
            shortSummary: 'Mount can overrun targets without target ability to avoid'
          },
          {
            id: 'mounted_archery',
            name: 'Mounted Archery',
            shortSummary: 'Halve penalty for ranged attacks while mounted'
          }
        ]
      }
    ]
  }
];

interface FeatTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterState;
  featsData: FeatData[];
  classesData?: ClassData[];
  racesData?: RaceData[];
  templatesData?: TemplateData[];
  traitsData?: TraitData[];
  flawsData?: FlawData[];
  onChange: (updated: Partial<CharacterState>) => void;
}

export const FeatTreeModal: React.FC<FeatTreeModalProps> = ({
  isOpen,
  onClose,
  character,
  featsData,
  classesData = [],
  racesData = [],
  templatesData = [],
  traitsData = [],
  flawsData = [],
  onChange
}) => {
  const [activeChainId, setActiveChainId] = useState<string>('power_attack');
  const [selectedFeatId, setSelectedFeatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Context for prerequisite validation
  const prereqContext = useMemo<CharacterPrereqContext>(
    () =>
      buildCharacterPrereqContext(
        character,
        classesData,
        racesData,
        traitsData,
        flawsData,
        templatesData
      ),
    [character, classesData, racesData, traitsData, flawsData, templatesData]
  );

  const activeChain = useMemo(
    () => FEAT_CHAINS.find(c => c.id === activeChainId) || FEAT_CHAINS[0],
    [activeChainId]
  );

  const dedupedFeats = useMemo(
    () => aggregateAndDeduplicateFeats(featsData),
    [featsData]
  );

  const selectedFeatEntities = character.selectedFeatEntities || [];

  // Find feat object from database
  const getFeatData = (nodeName: string): FeatData => {
    const norm = normalizeFeatName(nodeName);
    const found = dedupedFeats.find(
      f =>
        f.name.toLowerCase() === nodeName.toLowerCase() ||
        normalizeFeatName(f.name) === norm ||
        f.id.toLowerCase() === nodeName.toLowerCase().replace(/[^a-z0-9]+/g, '_')
    );
    if (found) return found;
    return {
      id: nodeName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      name: nodeName,
      description: 'Feat information in library.'
    };
  };

  const getFeatStatus = (featName: string): 'owned' | 'qualified' | 'unmet' => {
    const featId = featNameToId(featName);
    const isOwned = selectedFeatEntities.some(
      e => e.featId === featId || featNameToId(e.featId) === featId
    );
    if (isOwned) return 'owned';

    const featObj = getFeatData(featName);
    const validation = evaluateFeatPrerequisitesWithContext(featObj, prereqContext);
    return validation.isQualified ? 'qualified' : 'unmet';
  };

  const handleToggleFeat = (featName: string) => {
    const featId = featNameToId(featName);
    const isOwned = selectedFeatEntities.some(
      e => e.featId === featId || featNameToId(e.featId) === featId
    );
    if (isOwned) {
      const updated = selectedFeatEntities.filter(
        e => e.featId !== featId && featNameToId(e.featId) !== featId
      );
      onChange({ selectedFeatEntities: updated });
    } else {
      const newEntity: CharacterFeat = {
        id: featId,
        featId,
        notes: featName
      };
      onChange({ selectedFeatEntities: [...selectedFeatEntities, newEntity] });
    }
  };

  // Stats calculation for the active chain
  const chainCounts = useMemo(() => {
    let owned = 0;
    let qualified = 0;
    let unmet = 0;

    const countNodes = (nodes: FeatTreeNode[]) => {
      nodes.forEach(n => {
        const st = getFeatStatus(n.name);
        if (st === 'owned') owned++;
        else if (st === 'qualified') qualified++;
        else unmet++;

        if (n.children) countNodes(n.children);
      });
    };

    if (activeChain && activeChain.roots) {
      countNodes(activeChain.roots);
    }

    return { owned, qualified, unmet, total: owned + qualified + unmet };
  }, [activeChain, selectedFeatEntities, prereqContext]);

  if (!isOpen) return null;

  // Render a recursive visual node and its children
  const renderTreeNode = (node: FeatTreeNode, depth: number = 0, isLast: boolean = true) => {
    const featObj = getFeatData(node.name);
    const status = getFeatStatus(node.name);
    const validation = evaluateFeatPrerequisitesWithContext(featObj, prereqContext);
    const isSelected = selectedFeatId === node.name;
    const isMatchSearch =
      searchQuery &&
      (node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (featObj.description && featObj.description.toLowerCase().includes(searchQuery.toLowerCase())));

    return (
      <div key={node.name} className="flex flex-col items-start relative group/node my-2">
        <div className="flex items-start gap-3 w-full">
          {/* Node Card */}
          <div
            onClick={() => setSelectedFeatId(node.name)}
            className={`cursor-pointer select-none transition-all p-3.5 rounded-2xl border flex flex-col gap-2 min-w-[240px] max-w-[320px] shadow-lg ${
              isSelected
                ? 'ring-2 ring-amber-400 border-amber-400 scale-[1.02]'
                : isMatchSearch
                ? 'ring-2 ring-cyan-400 border-cyan-400'
                : ''
            } ${
              status === 'owned'
                ? 'bg-amber-500/15 border-amber-500/60 text-amber-200 shadow-amber-950/40 hover:border-amber-400'
                : status === 'qualified'
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200 shadow-emerald-950/40 hover:border-emerald-400 hover:bg-emerald-900/60'
                : 'bg-slate-950/80 border-slate-800 text-slate-400 shadow-slate-950/50 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`font-bold text-xs truncate ${
                  status === 'owned'
                    ? 'text-amber-300'
                    : status === 'qualified'
                    ? 'text-emerald-300'
                    : 'text-slate-200'
                }`}
              >
                {node.name}
              </span>

              {/* Status Badge */}
              {status === 'owned' ? (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shrink-0">
                  <i className="fa-solid fa-check text-amber-400"></i> Active
                </span>
              ) : status === 'qualified' ? (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shrink-0">
                  <i className="fa-solid fa-circle-check text-emerald-400"></i> Qualified
                </span>
              ) : (
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950/60 text-amber-400 border border-amber-500/30 flex items-center gap-1 shrink-0 cursor-help"
                  title={validation.unmetPrereqs.join(' • ')}
                >
                  <i className="fa-solid fa-lock text-amber-400 text-[8px]"></i> Unmet
                </span>
              )}
            </div>

            {/* Quick summary */}
            <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
              {node.shortSummary || featObj.description}
            </p>

            {/* Prerequisite preview tag if unmet */}
            {status === 'unmet' && validation.unmetPrereqs.length > 0 && (
              <div className="text-[10px] text-amber-400/90 font-mono truncate bg-amber-950/40 border border-amber-500/20 rounded px-1.5 py-0.5">
                <i className="fa-solid fa-triangle-exclamation mr-1 text-[9px]"></i>
                {validation.unmetPrereqs[0]}
              </div>
            )}
          </div>

          {/* Quick Add / Remove inline button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                handleToggleFeat(node.name);
              }}
              className={`btn text-[11px] py-1 px-2.5 rounded-xl transition-all shadow-md ${
                status === 'owned'
                  ? 'btn-secondary text-rose-300 hover:bg-rose-950 hover:text-rose-200 border-rose-500/30'
                  : status === 'qualified'
                  ? 'btn-primary text-white font-semibold'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border-slate-700'
              }`}
              title={status === 'owned' ? 'Remove from character' : 'Add to character'}
            >
              {status === 'owned' ? (
                <i className="fa-solid fa-trash-can"></i>
              ) : (
                <i className="fa-solid fa-plus"></i>
              )}
            </button>
          </div>
        </div>

        {/* Children Branches */}
        {node.children && node.children.length > 0 && (
          <div className="pl-6 border-l-2 border-slate-800/80 ml-5 my-1 space-y-2 relative">
            {node.children.map((child, idx) =>
              renderTreeNode(child, depth + 1, idx === node.children!.length - 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const selectedFeatData = selectedFeatId ? getFeatData(selectedFeatId) : null;
  const selectedFeatValidation = selectedFeatData
    ? evaluateFeatPrerequisitesWithContext(selectedFeatData, prereqContext)
    : null;
  const selectedFeatStatus = selectedFeatId ? getFeatStatus(selectedFeatId) : null;
  const selectedSourceBadges = selectedFeatData
    ? getAllSourceBadges(selectedFeatData, character.allowedSources)
    : null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 z-50">
      <div className="card bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-lg shadow-inner">
              <i className="fa-solid fa-diagram-project"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
                Interactive Feat Dependency Trees
              </h2>
              <p className="text-xs text-slate-400">
                Visualize multi-tier prerequisite trees and check qualification status for your build
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input in Tree */}
            <div className="relative min-w-[200px]">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Highlight feat..."
                className="input-field !pl-9 py-1.5 text-xs"
              />
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700 flex items-center justify-center transition-colors"
              title="Close modal (Esc)"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
        </div>

        {/* Chain Selector Tabs & Legend Bar */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/30 flex flex-wrap items-center justify-between gap-3">
          {/* Chain Navigation Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {FEAT_CHAINS.map(chain => {
              const isActive = chain.id === activeChainId;
              return (
                <button
                  key={chain.id}
                  onClick={() => {
                    setActiveChainId(chain.id);
                    setSelectedFeatId(null);
                  }}
                  className={`btn text-xs py-1 px-3 rounded-xl flex items-center gap-2 font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50'
                  }`}
                >
                  <i className={`fa-solid ${chain.icon}`}></i>
                  <span>{chain.name}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Legend & Status Summary */}
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30">
              <i className="fa-solid fa-check text-[10px]"></i> Owned ({chainCounts.owned})
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
              <i className="fa-solid fa-circle-check text-[10px]"></i> Qualified ({chainCounts.qualified})
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-800/80 text-slate-400 border border-slate-700">
              <i className="fa-solid fa-lock text-[10px]"></i> Missing ({chainCounts.unmet})
            </span>
          </div>
        </div>

        {/* Main Body: Tree Viewer Grid + Detail Inspector */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-0">
          {/* Tree Node Canvas (2 Cols) */}
          <div className="lg:col-span-2 p-6 overflow-y-auto max-h-[calc(92vh-180px)] scrollbar-thin space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 mb-2">
                <span className="font-bold text-amber-400 text-sm flex items-center gap-2">
                  <i className={`fa-solid ${activeChain.icon}`}></i> {activeChain.name}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {chainCounts.total} Total Feats in Tree
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{activeChain.description}</p>
            </div>

            {/* Render Tree Roots */}
            <div className="pt-2">
              {activeChain.roots.map((root, idx) =>
                renderTreeNode(root, 0, idx === activeChain.roots.length - 1)
              )}
            </div>
          </div>

          {/* Feat Details Inspector Panel (1 Col) */}
          <div className="border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950/60 p-6 overflow-y-auto max-h-[calc(92vh-180px)] scrollbar-thin flex flex-col justify-between">
            {selectedFeatData && selectedFeatValidation ? (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 font-heading">
                      {selectedFeatData.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {selectedFeatStatus === 'owned' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <i className="fa-solid fa-check text-amber-400"></i> Active On Character
                        </span>
                      ) : selectedFeatStatus === 'qualified' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <i className="fa-solid fa-circle-check text-emerald-400"></i> Qualified to Take
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <i className="fa-solid fa-triangle-exclamation text-amber-400"></i> Missing Prerequisites
                        </span>
                      )}

                      <div className="flex items-center gap-1 flex-wrap">
                        {selectedSourceBadges?.badges.map(b => (
                          <span
                            key={b.sourceCode}
                            className={`badge font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                              b.isAllowed
                                ? 'bg-slate-800 text-slate-300 border-slate-700'
                                : 'bg-rose-950/40 text-rose-400 border-rose-500/30'
                            }`}
                            title={`${b.sourceName}${b.isAllowed ? ' (Allowed)' : ' (Not Selected)'}`}
                          >
                            {b.sourceCode}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prerequisites Breakdown */}
                {selectedFeatData.prerequisites && (
                  <div className="space-y-2 bg-slate-900/90 border border-slate-800/80 p-3.5 rounded-2xl">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                      Prerequisites:
                    </span>
                    <p className="text-xs text-slate-300 font-mono">{selectedFeatData.prerequisites}</p>

                    {selectedFeatValidation.unmetPrereqs.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1">
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                          Unmet Requirements:
                        </span>
                        <ul className="text-xs text-amber-300/90 space-y-1 list-disc list-inside font-mono">
                          {selectedFeatValidation.unmetPrereqs.map((u, i) => (
                            <li key={i}>{u}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedFeatValidation.satisfiedPrereqs.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                          Met Requirements:
                        </span>
                        <ul className="text-xs text-emerald-300/90 space-y-1 list-disc list-inside font-mono">
                          {selectedFeatValidation.satisfiedPrereqs.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Benefit & Rules:
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800/60">
                    {selectedFeatData.description}
                  </p>
                </div>

                {/* Action button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleToggleFeat(selectedFeatData.name)}
                    className={`btn text-xs py-2.5 px-4 w-full flex items-center justify-center gap-2 rounded-xl font-bold shadow-lg transition-all ${
                      selectedFeatStatus === 'owned'
                        ? 'btn-secondary text-rose-300 border-rose-500/40 hover:bg-rose-950'
                        : 'btn-primary text-slate-950'
                    }`}
                  >
                    {selectedFeatStatus === 'owned' ? (
                      <>
                        <i className="fa-solid fa-trash-can"></i> Remove Feat from Sheet
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-plus"></i> Add Feat to Sheet
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 text-xl">
                  <i className="fa-solid fa-arrow-pointer"></i>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-300">No Feat Selected</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                    Click any node in the tree diagram to inspect prerequisites and manage active feats.
                  </p>
                </div>
              </div>
            )}

            {/* Close modal footer */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button onClick={onClose} className="btn btn-secondary text-xs px-4 py-1.5">
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
