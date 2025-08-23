import { sm2, initializeCard } from './sm2';
import type { ReviewState } from '../types';

// Test utilities
const NOW = Date.now();
const mins = (ms: number) => Math.round(ms / 60_000);
const days = (ms: number) => Math.round(ms / (24 * 60 * 60_000));

// Helper function to create a learning card at a specific step
function createLearningCard(stepIndex: number): ReviewState {
  const card = initializeCard();
  if (stepIndex === 0) return card;
  
  // Advance through steps to reach desired stepIndex
  let current = card;
  for (let i = 0; i < stepIndex; i++) {
    current = sm2(current, 'good', NOW);
  }
  return current;
}

// Helper function to create a graduating card
function createGraduatingCard(): ReviewState {
  const card = createLearningCard(2); // At 1d step
  return sm2(card, 'good', NOW); // Graduate to graduating phase
}

describe('SM-2 Algorithm Tests', () => {
  describe('Learning phase — new cards (steps: 1m, 10m, 1d)', () => {
    test('From first step (1m): Again → 1m', () => {
      const s0 = createLearningCard(0);
      const s1 = sm2(s0, 'again', NOW);

      expect(s1.phase).toBe('learning');
      expect(s1.stepIndex).toBe(0); // reset
      expect(mins(s1.due - NOW)).toBe(1);
    });

    test('From first step (1m): Hard → ~6m (midpoint of 1m & 10m)', () => {
      const s0 = createLearningCard(0);
      const s1 = sm2(s0, 'hard', NOW);

      expect(s1.phase).toBe('learning');
      expect(s1.stepIndex).toBe(0); // stays on same step
      // Progressive Hard intervals: 1.5min, 3min, 5min
      const nextMins = mins(s1.due - NOW);
      expect(nextMins).toBeGreaterThanOrEqual(1);
      expect(nextMins).toBeLessThanOrEqual(6);
    });

    test('From first step (1m): Good → 10m (advance to next step)', () => {
      const s0 = createLearningCard(0);
      const s1 = sm2(s0, 'good', NOW);

      expect(s1.phase).toBe('learning');
      expect(s1.stepIndex).toBe(1);
      expect(mins(s1.due - NOW)).toBe(10);
    });

    test('From first step (1m): Easy → graduation review phase', () => {
      const s0 = createLearningCard(0);
      const s1 = sm2(s0, 'easy', NOW);

      expect(s1.phase).toBe('graduating'); // NEW: goes to graduation, not review
      expect(days(s1.due - NOW)).toBe(4); // easyGraduatingIntervalDays
    });

    test('From second step (10m): Again → reset to 1m', () => {
      const s0 = createLearningCard(1); // At 10m step
      const s1 = sm2(s0, 'again', NOW);

      expect(s1.phase).toBe('learning');
      expect(s1.stepIndex).toBe(0);
      expect(mins(s1.due - NOW)).toBe(1);
    });

    test('From second step (10m): Hard → progressive intervals', () => {
      const s0 = createLearningCard(1); // At 10m step
      const s1 = sm2(s0, 'hard', NOW);

      expect(s1.phase).toBe('learning');
      expect(s1.stepIndex).toBe(1); // stays on same step
      // Progressive Hard intervals for 10m step
      const nextMins = mins(s1.due - NOW);
      expect(nextMins).toBeGreaterThanOrEqual(1);
      expect(nextMins).toBeLessThanOrEqual(6);
    });

    test('From second step (10m): Good → 1d (final step)', () => {
      const s0 = createLearningCard(1); // At 10m step
      const s1 = sm2(s0, 'good', NOW);

      expect(s1.phase).toBe('learning');
      expect(s1.stepIndex).toBe(2);
      expect(days(s1.due - NOW)).toBe(1);
    });

    test('From final step (1d): Good → graduation review phase', () => {
      const s0 = createLearningCard(2); // At 1d step
      const s1 = sm2(s0, 'good', NOW);

      expect(s1.phase).toBe('graduating'); // NEW: goes to graduation, not review
      expect(days(s1.due - NOW)).toBe(1); // graduatingIntervalDays
    });

    test('From final step (1d): Easy → graduation review phase with longer interval', () => {
      const s0 = createLearningCard(2); // At 1d step
      const s1 = sm2(s0, 'easy', NOW);

      expect(s1.phase).toBe('graduating'); // NEW: goes to graduation, not review
      expect(days(s1.due - NOW)).toBe(4); // easyGraduatingIntervalDays
    });
  });

  describe('Graduation Review Phase — NEW PHASE', () => {
    test('Graduation review: Again → back to learning phase', () => {
      const s0 = createGraduatingCard();
      const s1 = sm2(s0, 'again', NOW);

      expect(s1.phase).toBe('learning');
      expect(s1.stepIndex).toBe(0);
      expect(s1.lapses).toBe(1); // lapse counted
      expect(mins(s1.due - NOW)).toBe(1);
    });

          test('Graduation review: Hard → extend graduation interval', () => {
        const s0 = createGraduatingCard();
        const s1 = sm2(s0, 'hard', NOW);

      expect(s1.phase).toBe('graduating');
      expect(days(s1.due - NOW)).toBeGreaterThan(1); // extended interval
    });

          test('Graduation review: Good → enter review phase', () => {
        const s0 = createGraduatingCard();
        const s1 = sm2(s0, 'good', NOW);

      expect(s1.phase).toBe('review'); // Finally enters review phase
      expect(days(s1.due - NOW)).toBe(1);
    });

    test('Graduation review: Easy → enter review phase with bonus', () => {
      const s0 = createGraduatingCard();
      const s1 = sm2(s0, 'easy', NOW);

      expect(s1.phase).toBe('review'); // Finally enters review phase
      expect(days(s1.due - NOW)).toBeGreaterThan(1); // bonus applied
    });
  });

  describe('Review phase — graduated cards', () => {
    test('Review: Again → relearning phase', () => {
      const s0 = createGraduatingCard();
      const s1 = sm2(s0, 'good', NOW); // Pass graduation
      const s2 = sm2(s1, 'again', s1.due); // Fail review

      expect(s2.phase).toBe('relearning');
      expect(s2.stepIndex).toBe(0);
      expect(mins(s2.due - s1.due)).toBe(1); // 1 minute relearning step
    });

    test('Review: Hard → reduce interval', () => {
      const s0 = createGraduatingCard();
      const s1 = sm2(s0, 'good', NOW); // Pass graduation
      const s2 = sm2(s1, 'hard', s1.due); // Hard review

      expect(s2.phase).toBe('review');
      expect(days(s2.due - s1.due)).toBeGreaterThan(0);
    });

    test('Review: Good → normal interval progression', () => {
      const s0 = createGraduatingCard();
      const s1 = sm2(s0, 'good', NOW); // Pass graduation
      const s2 = sm2(s1, 'good', s1.due); // Good review

      expect(s2.phase).toBe('review');
      expect(days(s2.due - s1.due)).toBeGreaterThan(1); // interval increased
    });

    test('Review: Easy → bonus interval', () => {
      const s0 = createGraduatingCard();
      const s1 = sm2(s0, 'good', NOW); // Pass graduation
      const s2 = sm2(s1, 'easy', s1.due); // Easy review

      expect(s2.phase).toBe('review');
      expect(days(s2.due - s1.due)).toBeGreaterThan(1); // bonus applied
    });
  });

  describe('Relearning phase — lapsed cards', () => {
    test('Relearning: Again → reset to first step', () => {
      const s0 = createGraduatingCard();
      const s1 = sm2(s0, 'good', NOW); // Pass graduation
      const s2 = sm2(s1, 'again', s1.due); // Fail review → relearning
      const s3 = sm2(s2, 'again', s2.due); // Fail relearning

      expect(s3.phase).toBe('relearning');
      expect(s3.stepIndex).toBe(0);
      expect(mins(s3.due - s2.due)).toBe(1);
    });

    test('Relearning: Good → return to review phase', () => {
      const s0 = createGraduatingCard();
      const s1 = sm2(s0, 'good', NOW); // Pass graduation
      const s2 = sm2(s1, 'again', s1.due); // Fail review → relearning
      const s3 = sm2(s2, 'good', s2.due); // Pass relearning

      expect(s3.phase).toBe('review');
      expect(days(s3.due - s2.due)).toBe(1); // safety interval
    });
  });

  describe('Edge cases and initialization', () => {
    test('New card initialization', () => {
      const card = initializeCard();
      
      expect(card.phase).toBe('learning');
      expect(card.stepIndex).toBe(0);
      expect(card.ef).toBe(2.5);
      expect(card.reps).toBe(0);
      expect(card.lapses).toBe(0);
    });

    test('Fallback for missing phase', () => {
      const card: ReviewState = {
        ef: 2.5,
        intervalDays: 0,
        reps: 0,
        lapses: 0,
        due: NOW,
        phase: 'invalid-phase' as any, // Force invalid phase
        stepIndex: undefined
      };
      
      const result = sm2(card, 'good', NOW);
      expect(result.phase).toBe('learning');
      expect(result.stepIndex).toBe(0);
    });
  });
});
