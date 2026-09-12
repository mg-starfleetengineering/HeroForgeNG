import { WeaponData } from '../types/character';

export type RollType =
  | 'attack'
  | 'damage'
  | 'save'
  | 'skill'
  | 'ability'
  | 'grapple'
  | 'initiative'
  | 'check'
  | 'custom';

export type RollStatus = 'normal' | 'crit_threat' | 'nat20' | 'nat1';

export interface DiceTerm {
  type: 'dice';
  count: number;
  sides: number;
  results: number[];
  subtotal: number;
  sign: '+' | '-';
}

export interface ModifierTerm {
  type: 'modifier';
  value: number;
  sign: '+' | '-';
}

export type ParsedTerm = DiceTerm | ModifierTerm;

export interface RollComponent {
  label: string;
  value: number;
}

export interface DamagePoolInput {
  label: string;
  damageType: string;
  formula: string; // e.g. "1d8+3", "2d6", "1d6"
  condition?: string; // e.g. "vs Evil", "vs Designated Foe"
  isRecoil?: boolean; // true for Vicious recoil to wielder
  isNonlethal?: boolean; // true for Merciful
}

export interface DamagePoolResult {
  label: string;
  damageType: string;
  dice: string;
  total: number;
  results?: number[];
  isRecoil?: boolean;
  condition?: string;
  isNonlethal?: boolean;
}

export interface RollOptions {
  threatMin?: number; // Minimum roll on d20 to trigger critical threat (e.g. 19 for 19-20, 18 for 18-20, default 20)
  critMultiplier?: number; // Critical damage multiplier (e.g. 2 for x2, 3 for x3, default 2)
  rollType?: RollType;
  weapon?: Partial<WeaponData>;
  customRng?: (sides: number) => number; // Custom deterministic RNG provider: returns integer in [1, sides]
  autoConfirmCrit?: boolean; // Default true: automatically roll confirmation if crit threat
  isConfirmationRoll?: boolean; // Internal flag to avoid infinite loops on confirmation
  components?: RollComponent[]; // Itemized modifier components (e.g. BAB: 5, Str: 3, Enh: 1)
  detailedBreakdown?: string;
  metadata?: Record<string, unknown>;
  damagePools?: DamagePoolInput[];
  isNonlethal?: boolean;
}

export interface RollResult {
  id: string;
  timestamp: number;
  formula: string;
  label: string;
  terms: ParsedTerm[];
  total: number;
  d20Result?: number; // The natural value of the primary d20 rolled, if any
  isNatural20: boolean;
  isNatural1: boolean;
  isCritThreat: boolean;
  threatMin: number;
  critMultiplier: number;
  confirmationRoll?: RollResult;
  breakdown: string;
  detailedBreakdown: string; // e.g. "d20 (17) + BAB (5) + Str (3) + Enh (1) = 26"
  rollType: RollType;
  status: RollStatus;
  summary: string;
  components?: RollComponent[];
  notes?: string[];
  damagePools?: DamagePoolResult[];
  recoilTotal?: number;
  targetDamageTotal?: number;
  isNonlethal?: boolean;
  weapon?: Partial<WeaponData>;
}

/**
 * Generates a unique identifier for a roll.
 */
function generateRollId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `roll_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
}

/**
 * Standard uniform die roller (1 to sides inclusive).
 */
export function defaultRng(sides: number): number {
  if (sides <= 0) return 0;
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Parses a standard tabletop dice formula (e.g. "1d20+7", "2d6+5", "1d8+1d6-2", "+4", "d20").
 */
export function parseDiceFormula(formula: string): Array<{
  type: 'dice' | 'modifier';
  sign: '+' | '-';
  count?: number;
  sides?: number;
  value?: number;
}> {
  const cleaned = formula.trim().replace(/\s+/g, '');
  if (!cleaned) return [];

  // Match expressions: optional sign, then either XdY or pure numeric modifier
  const tokenRegex = /([+-]?)(?:(?:(\d*)d(\d+))|(\d+))/gi;
  const terms: Array<{
    type: 'dice' | 'modifier';
    sign: '+' | '-';
    count?: number;
    sides?: number;
    value?: number;
  }> = [];

  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(cleaned)) !== null) {
    const signStr = match[1] || '+';
    const sign: '+' | '-' = signStr === '-' ? '-' : '+';
    const countStr = match[2];
    const sidesStr = match[3];
    const modStr = match[4];

    if (sidesStr !== undefined) {
      const count = countStr ? parseInt(countStr, 10) : 1;
      const sides = parseInt(sidesStr, 10);
      if (count > 0 && sides > 0) {
        terms.push({
          type: 'dice',
          sign,
          count,
          sides
        });
      }
    } else if (modStr !== undefined) {
      const val = parseInt(modStr, 10);
      terms.push({
        type: 'modifier',
        sign,
        value: val
      });
    }
  }

  return terms;
}

/**
 * Resolves threat range minimum from weapon or options.
 * In D&D 3.5e, weapon.threat is the minimum d20 number needed (e.g. 19 for 19-20, 18 for 18-20, 20 for 20).
 */
export function getThreatMin(options?: RollOptions): number {
  if (options?.threatMin !== undefined && options.threatMin >= 1 && options.threatMin <= 20) {
    return options.threatMin;
  }
  if (options?.weapon?.threat !== undefined && options.weapon.threat >= 1 && options.weapon.threat <= 20) {
    return options.weapon.threat;
  }
  return 20;
}

/**
 * Resolves critical multiplier from weapon or options.
 */
export function getCritMultiplier(options?: RollOptions): number {
  if (options?.critMultiplier !== undefined && options.critMultiplier >= 1) {
    return options.critMultiplier;
  }
  if (options?.weapon?.critMultiplier !== undefined && options.weapon.critMultiplier >= 1) {
    return options.weapon.critMultiplier;
  }
  return 2;
}

/**
 * Formats terms into a readable calculation breakdown (e.g., "[19] + 7 = 26" or "[4, 6] + 5 = 15").
 */
export function formatBreakdown(terms: ParsedTerm[], total: number): string {
  if (terms.length === 0) return `${total}`;

  const parts: string[] = [];

  for (let i = 0; i < terms.length; i++) {
    const term = terms[i];
    const prefix = i === 0 ? (term.sign === '-' ? '-' : '') : ` ${term.sign} `;

    if (term.type === 'dice') {
      const diceStr = `[${term.results.join(', ')}]`;
      parts.push(`${prefix}${diceStr}`);
    } else {
      parts.push(`${prefix}${term.value}`);
    }
  }

  return `${parts.join('')} = ${total}`;
}

/**
 * Formats rich itemized math breakdown (e.g. "d20 (17) + BAB (5) + Str (3) + Enh (1) = 26").
 */
export function formatDetailedBreakdown(
  terms: ParsedTerm[],
  total: number,
  components?: RollComponent[],
  primaryD20Result?: number
): string {
  if (components && components.length > 0) {
    const parts: string[] = [];

    // First, represent the primary roll
    if (primaryD20Result !== undefined) {
      parts.push(`d20 (${primaryD20Result})`);
    } else {
      // Multiple/other dice
      const diceTerms = terms.filter((t): t is DiceTerm => t.type === 'dice');
      if (diceTerms.length > 0) {
        diceTerms.forEach((dt, idx) => {
          const prefix = idx > 0 ? (dt.sign === '-' ? ' - ' : ' + ') : (dt.sign === '-' ? '-' : '');
          parts.push(`${prefix}${dt.count}d${dt.sides} (${dt.results.join(' + ')})`);
        });
      }
    }

    // Append each non-zero component
    for (const comp of components) {
      if (comp.value === 0) continue;
      const sign = comp.value >= 0 ? '+' : '-';
      const absVal = Math.abs(comp.value);
      parts.push(`${sign} ${comp.label} (${absVal})`);
    }

    return `${parts.join(' ')} = ${total}`;
  }

  // Fallback to standard breakdown
  return formatBreakdown(terms, total);
}

/**
 * Evaluates a dice roll formula and returns a complete RollResult with threat, fumble,
 * and optional automatic critical confirmation roll detection.
 */
export function rollDice(
  formula: string,
  label: string = '',
  options: RollOptions = {}
): RollResult {
  const rng = options.customRng || defaultRng;
  const evaluatedTerms: ParsedTerm[] = [];
  let total = 0;
  let primaryD20Result: number | undefined = undefined;
  let evaluatedPools: DamagePoolResult[] | undefined = undefined;
  let recoilTotal: number | undefined = undefined;
  let targetDamageTotal: number | undefined = undefined;

  if (options.damagePools && options.damagePools.length > 0) {
    evaluatedPools = [];
    let recSum = 0;
    let targetSum = 0;
    let hasRecoil = false;

    for (const poolInput of options.damagePools) {
      const poolParsed = parseDiceFormula(poolInput.formula);
      let poolSubtotal = 0;
      const poolResults: number[] = [];
      const poolTerms: ParsedTerm[] = [];

      for (const term of poolParsed) {
        if (term.type === 'dice') {
          const count = term.count || 1;
          const sides = term.sides || 20;
          const results: number[] = [];
          let subtotal = 0;

          for (let i = 0; i < count; i++) {
            const roll = Math.max(1, Math.min(sides, rng(sides)));
            results.push(roll);
            poolResults.push(roll);
            subtotal += roll;
          }

          const signedSubtotal = term.sign === '-' ? -subtotal : subtotal;
          poolSubtotal += signedSubtotal;

          poolTerms.push({
            type: 'dice',
            count,
            sides,
            results,
            subtotal,
            sign: term.sign
          });
        } else if (term.type === 'modifier') {
          const val = term.value || 0;
          const signedVal = term.sign === '-' ? -val : val;
          poolSubtotal += signedVal;

          poolTerms.push({
            type: 'modifier',
            value: val,
            sign: term.sign
          });
        }
      }

      const poolResult: DamagePoolResult = {
        label: poolInput.label,
        damageType: poolInput.damageType,
        dice: poolInput.formula,
        total: poolSubtotal,
        results: poolResults,
        isRecoil: poolInput.isRecoil,
        condition: poolInput.condition,
        isNonlethal: poolInput.isNonlethal ?? options.isNonlethal
      };

      evaluatedPools.push(poolResult);

      if (poolInput.isRecoil) {
        hasRecoil = true;
        recSum += poolSubtotal;
      } else {
        targetSum += poolSubtotal;
        evaluatedTerms.push(...poolTerms);
      }
    }

    total = targetSum;
    targetDamageTotal = targetSum;
    if (hasRecoil) {
      recoilTotal = recSum;
    }
  } else {
    const parsed = parseDiceFormula(formula);

    for (const term of parsed) {
      if (term.type === 'dice') {
        const count = term.count || 1;
        const sides = term.sides || 20;
        const results: number[] = [];
        let subtotal = 0;

        for (let i = 0; i < count; i++) {
          const roll = Math.max(1, Math.min(sides, rng(sides)));
          results.push(roll);
          subtotal += roll;
        }

        if (sides === 20 && primaryD20Result === undefined && results.length > 0) {
          primaryD20Result = results[0];
        }

        const signedSubtotal = term.sign === '-' ? -subtotal : subtotal;
        total += signedSubtotal;

        evaluatedTerms.push({
          type: 'dice',
          count,
          sides,
          results,
          subtotal,
          sign: term.sign
        });
      } else if (term.type === 'modifier') {
        const val = term.value || 0;
        const signedVal = term.sign === '-' ? -val : val;
        total += signedVal;

        evaluatedTerms.push({
          type: 'modifier',
          value: val,
          sign: term.sign
        });
      }
    }
  }

  const threatMin = getThreatMin(options);
  const critMultiplier = getCritMultiplier(options);
  const rollType = options.rollType || (primaryD20Result !== undefined ? 'check' : 'damage');

  const isNatural20 = primaryD20Result === 20;
  const isNatural1 = primaryD20Result === 1;

  // In D&D 3.5e, any attack roll meeting or exceeding threatMin is a threat (Nat 20 is always a threat)
  const isThreatEligible = rollType === 'attack' || options.threatMin !== undefined || options.weapon !== undefined;
  const isCritThreat =
    !isNatural1 &&
    primaryD20Result !== undefined &&
    (isNatural20 || (isThreatEligible && primaryD20Result >= threatMin));

  let status: RollStatus = 'normal';
  if (isNatural1) {
    status = 'nat1';
  } else if (isNatural20) {
    status = 'nat20';
  } else if (isCritThreat) {
    status = 'crit_threat';
  }

  const breakdown = formatBreakdown(evaluatedTerms, total);

  let detailedBreakdown = options.detailedBreakdown;
  if (!detailedBreakdown) {
    if (evaluatedPools && evaluatedPools.length > 0) {
      const targetPools = evaluatedPools.filter(p => !p.isRecoil);
      const recPools = evaluatedPools.filter(p => p.isRecoil);
      const targetParts = targetPools.map(p => {
        const resStr = p.results && p.results.length > 0 ? ` (${p.results.join(' + ')})` : '';
        const condStr = p.condition && !p.label.includes(p.condition) ? ` (${p.condition})` : '';
        return `${p.label}${condStr} [${p.total}${resStr}]`;
      });
      let poolBreakdown = `${targetParts.join(' + ')} = ${total}`;
      if (recoilTotal !== undefined) {
        poolBreakdown += ` | ⚠️ Wielder Takes: ${recoilTotal} (${recPools.map(p => p.dice).join(', ')})`;
      }
      detailedBreakdown = poolBreakdown;
    } else {
      detailedBreakdown = formatDetailedBreakdown(evaluatedTerms, total, options.components, primaryD20Result);
    }
  }

  // Automatic Critical Confirmation Roll on Threat
  let confirmationRoll: RollResult | undefined = undefined;
  const autoConfirm = options.autoConfirmCrit !== false && !options.isConfirmationRoll;

  if (isCritThreat && autoConfirm && (rollType === 'attack' || isThreatEligible)) {
    confirmationRoll = rollDice(formula, label ? `${label} (Crit Confirm)` : 'Crit Confirmation', {
      ...options,
      isConfirmationRoll: true,
      autoConfirmCrit: false
    });
  }

  // Construct readable summary text
  const labelPrefix = label ? `${label}: ` : '';
  let summary = `${labelPrefix}${total} (${detailedBreakdown})`;

  if (isNatural1) {
    summary += ' 💀 NATURAL 1 (Fumble!)';
  } else if (isNatural20) {
    summary += ' 💥 NATURAL 20!';
    if (confirmationRoll) {
      summary += ` Confirmation: ${confirmationRoll.total} (${confirmationRoll.detailedBreakdown})`;
    }
  } else if (isCritThreat) {
    const rangeStr = threatMin < 20 ? `${threatMin}-20` : '20';
    summary += ` ⚡ CRITICAL THREAT (${rangeStr})!`;
    if (confirmationRoll) {
      summary += ` Confirmation: ${confirmationRoll.total} (${confirmationRoll.detailedBreakdown})`;
    }
  }

  if (options.isNonlethal) {
    summary += ' 🕊️ [NONLETHAL]';
  }
  if (recoilTotal !== undefined) {
    summary += ` [Wielder Recoil: ${recoilTotal}]`;
  }

  const result: RollResult = {
    id: generateRollId(),
    timestamp: Date.now(),
    formula,
    label,
    terms: evaluatedTerms,
    total,
    d20Result: primaryD20Result,
    isNatural20,
    isNatural1,
    isCritThreat,
    threatMin,
    critMultiplier,
    confirmationRoll,
    breakdown,
    detailedBreakdown,
    rollType,
    status,
    summary,
    components: options.components,
    damagePools: evaluatedPools,
    recoilTotal,
    targetDamageTotal,
    isNonlethal: options.isNonlethal,
    weapon: options.weapon
  };

  // Add to in-memory history
  if (!options.isConfirmationRoll) {
    addRollToHistory(result);
  }

  return result;
}

/**
 * Standard D&D 3.5e Attack Roll helper.
 * Supports attack bonuses like 7, "+7", "-2", etc. and detailed math components.
 */
export function rollAttack(
  attackBonus: number | string,
  label: string = 'Attack',
  weapon?: Partial<WeaponData>,
  options: RollOptions = {}
): RollResult {
  let bonusNum = 0;
  if (typeof attackBonus === 'number') {
    bonusNum = attackBonus;
  } else if (typeof attackBonus === 'string') {
    bonusNum = parseInt(attackBonus.replace(/^\+/, ''), 10) || 0;
  }

  const formula = bonusNum >= 0 ? `1d20+${bonusNum}` : `1d20-${Math.abs(bonusNum)}`;
  return rollDice(formula, label, {
    ...options,
    rollType: 'attack',
    weapon: weapon || options.weapon
  });
}

/**
 * Rolls an entire full-attack iterative sequence (e.g. "+11/+11/+6/+1").
 */
export function rollAttackSequence(
  sequence: string,
  label: string = 'Full Attack',
  weapon?: Partial<WeaponData>,
  options: RollOptions = {}
): RollResult[] {
  const bonuses = sequence.split('/').map(s => s.trim()).filter(Boolean);
  return bonuses.map((bonus, idx) => {
    const attackLabel = bonuses.length > 1 ? `${label} #${idx + 1} (${bonus})` : label;
    return rollAttack(bonus, attackLabel, weapon, options);
  });
}

/**
 * Standard D&D 3.5e Damage Roll helper.
 */
export function rollDamage(
  damageFormula: string,
  label: string = 'Damage',
  options: RollOptions = {}
): RollResult {
  return rollDice(damageFormula, label, {
    ...options,
    rollType: 'damage'
  });
}

/**
 * Standard D&D 3.5e Saving Throw helper.
 */
export function rollSavingThrow(
  saveBonus: number,
  saveType: 'Fortitude' | 'Reflex' | 'Will' | string,
  options: RollOptions = {}
): RollResult {
  const formula = saveBonus >= 0 ? `1d20+${saveBonus}` : `1d20-${Math.abs(saveBonus)}`;
  const label = `${saveType} Save`;
  return rollDice(formula, label, {
    ...options,
    rollType: 'save'
  });
}

/**
 * Standard D&D 3.5e Skill Check helper.
 */
export function rollSkillCheck(
  skillBonus: number,
  skillName: string,
  options: RollOptions = {}
): RollResult {
  const formula = skillBonus >= 0 ? `1d20+${skillBonus}` : `1d20-${Math.abs(skillBonus)}`;
  const label = `${skillName} Check`;
  return rollDice(formula, label, {
    ...options,
    rollType: 'skill'
  });
}

/**
 * Standard D&D 3.5e Ability Check helper.
 */
export function rollAbilityCheck(
  statBonus: number,
  statName: string,
  options: RollOptions = {}
): RollResult {
  const formula = statBonus >= 0 ? `1d20+${statBonus}` : `1d20-${Math.abs(statBonus)}`;
  const label = `${statName.toUpperCase()} Check`;
  return rollDice(formula, label, {
    ...options,
    rollType: 'ability'
  });
}

/**
 * Standard D&D 3.5e Grapple Check helper.
 */
export function rollGrappleCheck(
  grappleBonus: number,
  options: RollOptions = {}
): RollResult {
  const formula = grappleBonus >= 0 ? `1d20+${grappleBonus}` : `1d20-${Math.abs(grappleBonus)}`;
  return rollDice(formula, 'Grapple Check', {
    ...options,
    rollType: 'grapple'
  });
}

/**
 * Standard D&D 3.5e Initiative Check helper.
 */
export function rollInitiative(
  initiativeBonus: number,
  options: RollOptions = {}
): RollResult {
  const formula = initiativeBonus >= 0 ? `1d20+${initiativeBonus}` : `1d20-${Math.abs(initiativeBonus)}`;
  return rollDice(formula, 'Initiative Check', {
    ...options,
    rollType: 'initiative'
  });
}

// ---------------------------------------------------------------------------
// Roll History & Event Subscription Pub/Sub
// ---------------------------------------------------------------------------

const MAX_ROLL_HISTORY = 100;
let rollHistoryList: RollResult[] = [];
const rollSubscribers = new Set<(result: RollResult) => void>();

export function addRollToHistory(result: RollResult): void {
  rollHistoryList.unshift(result);
  if (rollHistoryList.length > MAX_ROLL_HISTORY) {
    rollHistoryList.pop();
  }
  rollSubscribers.forEach(listener => {
    try {
      listener(result);
    } catch (err) {
      console.error('Error in dice roll subscriber:', err);
    }
  });
}

export function getRollHistory(): RollResult[] {
  return [...rollHistoryList];
}

export function clearRollHistory(): void {
  rollHistoryList = [];
  rollSubscribers.forEach(listener => {
    try {
      // Notify with null/dummy event if needed
    } catch {
      // ignore
    }
  });
}

export function subscribeRolls(listener: (result: RollResult) => void): () => void {
  rollSubscribers.add(listener);
  return () => {
    rollSubscribers.delete(listener);
  };
}
