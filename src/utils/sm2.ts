import type { Grade, ReviewState } from '../types';

const learningStepsMs = [60_000, 10 * 60_000, 24 * 60 * 60_000]; // 1m, 10m, 1d
const graduatingIntervalDays = 1;
const easyGraduatingIntervalDays = 4;
const hardMultiplier = 1.2;
const easyBonus = 1.3;
const minEase = 1.3;

const gradeToQ: Record<Grade, number> = { 
  again: 0, 
  hard: 3, 
  good: 4, 
  easy: 5 
};

export function sm2(state: ReviewState, grade: Grade, now = Date.now()): ReviewState {
  let { ef = 2.5, reps = 0, intervalDays = 0, lapses = 0, phase, stepIndex = 0 } = state;
  const q = gradeToQ[grade];

  // Update ease factor (SM-2 style)
  ef = Math.max(minEase, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  // === PHASE: LEARNING ===
  if (phase === 'learning') {
    const next = learningStepsMs[stepIndex + 1];

    if (grade === 'again') {
      // Reset to first step, due soon (minutes)
      stepIndex = 0;
      return { ...state, ef, reps, lapses, phase, stepIndex, due: now + learningStepsMs[0] };
    }

    if (grade === 'hard') {
      // Hard: stays on current step but gives progressively longer intervals
      // Anki behavior: <6 minutes for new cards, with some progression
      
      // Progressive Hard intervals: 1.5min, 3min, 5min (under 6min limit)
      // Use reps to track how many times Hard was pressed on this step
      const hardMultipliers = [1.5, 3, 5]; // minutes
      const hardPresses = Math.min(reps, hardMultipliers.length - 1);
      const hardMs = Math.min(hardMultipliers[hardPresses] * 60_000, 6 * 60_000 - 1); // <6min
      
      return { 
        ...state, 
        ef, 
        reps: reps + 1, // Track hard presses for progression
        lapses, 
        phase, 
        stepIndex, 
        due: now + hardMs 
      };
    }

    if (grade === 'good') {
      if (next != null) {
        // Advance to next learning step
        return { ...state, ef, reps, lapses, phase, stepIndex: stepIndex + 1, due: now + next };
      } else {
        // Graduate to review
        return {
          ...state,
          ef,
          reps: 1,
          lapses,
          phase: 'review',
          intervalDays: graduatingIntervalDays,
          due: now + graduatingIntervalDays * 86_400_000,
          stepIndex: undefined,
        };
      }
    }

    // EASY: skip remaining steps and graduate with a larger first interval
    return {
      ...state,
      ef,
      reps: 1,
      lapses,
      phase: 'review',
      intervalDays: easyGraduatingIntervalDays,
      due: now + easyGraduatingIntervalDays * 86_400_000,
      stepIndex: undefined,
    };
  }

  // === PHASE: REVIEW ===
  if (phase === 'review') {
    if (grade === 'again') {
      // Lapse → relearning (short step)
      lapses += 1;
      const firstRelearnMs = learningStepsMs[0] ?? 10 * 60_000;
      return { ...state, ef, reps, lapses, phase: 'relearning', stepIndex: 0, due: now + firstRelearnMs };
    }

    if (grade === 'hard') {
      intervalDays = Math.max(1, Math.ceil(intervalDays * hardMultiplier));
      reps += 1;
    } else if (grade === 'good') {
      intervalDays = Math.max(1, Math.ceil(intervalDays * ef));
      reps += 1;
    } else if (grade === 'easy') {
      ef += 0.15;
      intervalDays = Math.max(1, Math.ceil(intervalDays * ef * easyBonus));
      reps += 1;
    }

    // Optional small jitter in days (keep non-negative)
    const jitter = Math.max(0, Math.round(intervalDays * 0.05 * Math.random()));
    return { ...state, ef, intervalDays, reps, lapses, phase, due: now + (intervalDays + jitter) * 86_400_000 };
  }

  // === PHASE: RELEARNING === (like learning steps, then return to review)
  if (phase === 'relearning') {
    // Treat similarly to learning: Again resets, Hard short repeat, Good advances, Easy graduates early
    // For brevity, reuse the first one or two learning steps and on Good/Easy, return to review with a short interval.
    const ms = grade === 'again' ? learningStepsMs[0]
             : grade === 'hard'  ? Math.max(60_000, learningStepsMs[0] * 1.2)
             : /* good/easy */     learningStepsMs[1] ?? 10 * 60_000;

    if (grade === 'good' || grade === 'easy') {
      // Back to review with a small safety interval (e.g., 1 day)
      return { ...state, ef, reps, lapses, phase: 'review', intervalDays: 1, due: now + 86_400_000, stepIndex: undefined };
    }
    return { ...state, ef, reps, lapses, phase: 'relearning', stepIndex: 0, due: now + ms };
  }

  // Fallback: if phase missing, start in learning
  return { ...state, ef, reps, lapses, phase: 'learning', stepIndex: 0, due: now + learningStepsMs[0] };
}

// Leech detection - suspend cards that have too many lapses
export function isLeech(state: ReviewState, threshold = 8): boolean {
  return state.lapses >= threshold;
}

// Initialize a new card with default values for learning phase
export function initializeCard(): ReviewState {
  return {
    ef: 2.5,
    intervalDays: 0,
    reps: 0,
    lapses: 0,
    due: Date.now(), // Due immediately for new cards
    phase: 'learning',
    stepIndex: 0
  };
}