import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createHistory,
  pushState,
  undo,
  redo,
  canUndo,
  canRedo,
  shouldDebounce,
  areKeysContinuous,
  isTextInputActive,
  MAX_HISTORY_STATES,
  DEFAULT_DEBOUNCE_MS
} from '../history';

describe('Character History Engine', () => {
  interface SimpleChar {
    id: string;
    hp: number;
    gold: number;
    name: string;
    alignment?: string;
  }

  const initialChar: SimpleChar = {
    id: 'char_1',
    hp: 38,
    gold: 100,
    name: 'Valerius'
  };

  describe('createHistory', () => {
    it('initializes empty past and future with current present state', () => {
      const history = createHistory(initialChar);
      expect(history.past).toEqual([]);
      expect(history.present.state).toEqual(initialChar);
      expect(history.future).toEqual([]);
      expect(canUndo(history)).toBe(false);
      expect(canRedo(history)).toBe(false);
    });
  });

  describe('undo and redo transitions', () => {
    it('moves present to future on undo and restores previous past state', () => {
      let history = createHistory(initialChar);
      const state1 = { ...initialChar, hp: 35 };
      history = pushState(history, state1, ['currentHp']);

      expect(canUndo(history)).toBe(true);
      expect(canRedo(history)).toBe(false);
      expect(history.present.state.hp).toBe(35);

      // Undo
      history = undo(history);
      expect(history.present.state.hp).toBe(38);
      expect(canUndo(history)).toBe(false);
      expect(canRedo(history)).toBe(true);
      expect(history.future.length).toBe(1);

      // Redo
      history = redo(history);
      expect(history.present.state.hp).toBe(35);
      expect(canUndo(history)).toBe(true);
      expect(canRedo(history)).toBe(false);
    });

    it('returns same history if undo called with empty past', () => {
      const history = createHistory(initialChar);
      const undone = undo(history);
      expect(undone).toBe(history);
    });

    it('returns same history if redo called with empty future', () => {
      const history = createHistory(initialChar);
      const redone = redo(history);
      expect(redone).toBe(history);
    });

    it('clears future stack when a new edit is pushed after undo', () => {
      let history = createHistory(initialChar);
      history = pushState(history, { ...initialChar, hp: 30 }, ['currentHp']);
      history = undo(history);
      expect(canRedo(history)).toBe(true);

      // New branch of history
      history = pushState(history, { ...initialChar, hp: 40 }, ['currentHp']);
      expect(history.present.state.hp).toBe(40);
      expect(canRedo(history)).toBe(false);
      expect(history.future).toEqual([]);
    });
  });

  describe('Stack boundaries (Max 50 states)', () => {
    it('limits past stack to MAX_HISTORY_STATES (50) and evicts oldest entries', () => {
      let history = createHistory(initialChar);

      // Push 60 distinct states (forcing new step to bypass debounce)
      for (let i = 1; i <= 60; i++) {
        history = pushState(
          history,
          { ...initialChar, hp: i },
          ['currentHp'],
          { forceNewStep: true }
        );
      }

      // Past stack must be capped at 50
      expect(history.past.length).toBe(MAX_HISTORY_STATES);
      expect(history.present.state.hp).toBe(60);

      // Oldest states (1-10) should have been evicted; past[0] should be hp: 10
      expect(history.past[0].state.hp).toBe(10);
      expect(history.past[history.past.length - 1].state.hp).toBe(59);
    });

    it('respects custom maxDepth option', () => {
      let history = createHistory(initialChar);
      for (let i = 1; i <= 10; i++) {
        history = pushState(
          history,
          { ...initialChar, hp: i },
          ['currentHp'],
          { forceNewStep: true, maxDepth: 5 }
        );
      }
      expect(history.past.length).toBe(5);
      expect(history.past[0].state.hp).toBe(5);
      expect(history.present.state.hp).toBe(10);
    });
  });

  describe('Continuous Numeric Edit Debouncing', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('identifies continuous keys correctly', () => {
      expect(areKeysContinuous(['currentHp'])).toBe(true);
      expect(areKeysContinuous(['tempHp', 'nonlethalDamage'])).toBe(true);
      expect(areKeysContinuous(['funds'])).toBe(true);
      expect(areKeysContinuous(['skillRanks'])).toBe(true);
      expect(areKeysContinuous(['baseStats'])).toBe(true);
      expect(areKeysContinuous(['tacticalCombat'])).toBe(true);
      expect(areKeysContinuous(['selectedRace'])).toBe(false);
      expect(areKeysContinuous([])).toBe(false);
    });

    it('preserves initial state on the very first edit so user can undo back to initial state', () => {
      let history = createHistory(initialChar);

      // First click on HP spinner (-1)
      history = pushState(history, { ...initialChar, hp: 37 }, ['currentHp']);
      expect(history.past.length).toBe(1);
      expect(history.past[0].state.hp).toBe(38);
      expect(history.present.state.hp).toBe(37);

      // Can undo back to initial state 38
      const undone = undo(history);
      expect(undone.present.state.hp).toBe(38);
    });

    it('groups rapid sequential clicks on HP spinner into a single undo step', () => {
      let history = createHistory(initialChar);

      // Initial edit (-1) at t=100
      vi.setSystemTime(100);
      history = pushState(history, { ...initialChar, hp: 37 }, ['currentHp']);
      expect(history.past.length).toBe(1);
      expect(history.past[0].state.hp).toBe(38);

      // Rapid clicks within 800ms debounce window
      vi.setSystemTime(300);
      history = pushState(history, { ...initialChar, hp: 36 }, ['currentHp']);
      expect(history.past.length).toBe(1); // Coalesced!
      expect(history.present.state.hp).toBe(36);

      vi.setSystemTime(500);
      history = pushState(history, { ...initialChar, hp: 35 }, ['currentHp']);
      expect(history.past.length).toBe(1); // Coalesced!
      expect(history.present.state.hp).toBe(35);

      vi.setSystemTime(700);
      history = pushState(history, { ...initialChar, hp: 34 }, ['currentHp']);
      expect(history.past.length).toBe(1); // Coalesced!
      expect(history.present.state.hp).toBe(34);

      // One single undo reverts the entire burst back to initial 38!
      const undone = undo(history);
      expect(undone.present.state.hp).toBe(38);
      expect(undone.past.length).toBe(0);

      // Redo restores the final value of the burst (34)
      const redone = redo(undone);
      expect(redone.present.state.hp).toBe(34);
    });

    it('creates distinct undo steps when debounce timer expires', () => {
      let history = createHistory(initialChar);

      // Edit 1 at t=1000
      vi.setSystemTime(1000);
      history = pushState(history, { ...initialChar, hp: 37 }, ['currentHp']);
      expect(history.past.length).toBe(1);

      // Rapid click at t=1200 (within 800ms)
      vi.setSystemTime(1200);
      history = pushState(history, { ...initialChar, hp: 36 }, ['currentHp']);
      expect(history.past.length).toBe(1);

      // Wait 1500ms (debounce window expires)
      vi.setSystemTime(2700);
      // Next edit creates a new undo step
      history = pushState(history, { ...initialChar, hp: 35 }, ['currentHp']);
      expect(history.past.length).toBe(2);
      expect(history.past[1].state.hp).toBe(36);
      expect(history.present.state.hp).toBe(35);

      // First undo reverts to 36
      history = undo(history);
      expect(history.present.state.hp).toBe(36);

      // Second undo reverts to 38
      history = undo(history);
      expect(history.present.state.hp).toBe(38);
    });

    it('creates separate undo steps when different non-continuous keys are edited', () => {
      let history = createHistory(initialChar);

      vi.setSystemTime(1000);
      history = pushState(history, { ...initialChar, hp: 37 }, ['currentHp']);

      vi.setSystemTime(1200);
      // Non-continuous change (e.g. alignment change)
      history = pushState(history, { ...initialChar, hp: 37, alignment: 'Chaotic Good' as any }, ['alignment']);
      expect(history.past.length).toBe(2);
      expect(history.past[1].state.hp).toBe(37);
    });
  });

  describe('isTextInputActive safeguard', () => {
    it('returns false when active element is null, undefined, or button', () => {
      expect(isTextInputActive(null)).toBe(false);
      expect(isTextInputActive(undefined)).toBe(false);
      expect(isTextInputActive({ tagName: 'BUTTON' })).toBe(false);
      expect(isTextInputActive({ tagName: 'DIV' })).toBe(false);
    });

    it('returns true when a text input element is active', () => {
      expect(isTextInputActive({ tagName: 'INPUT', type: 'text' })).toBe(true);
      expect(isTextInputActive({ tagName: 'INPUT', type: 'search' })).toBe(true);
      expect(isTextInputActive({ tagName: 'INPUT', type: 'number' })).toBe(true);
    });

    it('returns false for checkbox or radio inputs', () => {
      expect(isTextInputActive({ tagName: 'INPUT', type: 'checkbox' })).toBe(false);
      expect(isTextInputActive({ tagName: 'INPUT', type: 'radio' })).toBe(false);
    });

    it('returns true when a textarea element is active', () => {
      expect(isTextInputActive({ tagName: 'TEXTAREA' })).toBe(true);
    });

    it('returns true when a content-editable element is active', () => {
      expect(isTextInputActive({ tagName: 'DIV', isContentEditable: true })).toBe(true);
    });
  });
});
