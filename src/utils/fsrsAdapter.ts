import type { Card as AppCard, ReviewQuality } from '../types';
import { fsrs as createFsrs, createEmptyCard, Rating, State, type Card as FsrsCard } from '../../fsrs';

// Map UI quality to FSRS Rating
const qualityToRating = (quality: ReviewQuality): Rating => {
  switch (quality) {
    case 'again':
      return Rating.Again;
    case 'hard':
      return Rating.Hard;
    case 'good':
      return Rating.Good;
    case 'easy':
      return Rating.Easy;
  }
};

// Map FSRS State to app phase string
const fsrsStateToPhase = (state: State): AppCard['phase'] => {
  switch (state) {
    case State.New:
    case State.Learning:
      return 'learning';
    case State.Review:
      return 'review';
    case State.Relearning:
      return 'relearning';
  }
};

// Map app phase string to FSRS State (best-effort for legacy data)
const phaseToFsrsState = (phase?: AppCard['phase']): State => {
  switch (phase) {
    case 'review':
      return State.Review;
    case 'relearning':
      return State.Relearning;
    case 'learning':
    case 'graduating':
    default:
      return State.Learning;
  }
};

// Convert AppCard (legacy SM-2 fields) into FSRS Card structure
export const toFsrsCard = (card: AppCard): FsrsCard => {
  // Prefer persisted FSRS fields if present; otherwise initialize as empty
  const base = createEmptyCard(new Date(card.createdAt || Date.now()));

  const due = new Date(card.due || Date.now());
  const lastReview = card as unknown as { fsrsLastReview?: number };
  const rawStability = (card as unknown as { stability?: number }).stability;
  const rawDifficulty = (card as unknown as { difficulty?: number }).difficulty;
  const rawLearningSteps = (card as unknown as { fsrsLearningSteps?: number }).fsrsLearningSteps;
  const rawScheduledDays = (card as unknown as { fsrsScheduledDays?: number }).fsrsScheduledDays;
  const rawElapsedDays = (card as unknown as { fsrsElapsedDays?: number }).fsrsElapsedDays;

  const stability = Number.isFinite(rawStability) ? (rawStability as number) : base.stability;
  const difficulty = Number.isFinite(rawDifficulty) ? (rawDifficulty as number) : base.difficulty;
  const learning_steps = Number.isFinite(rawLearningSteps) ? (rawLearningSteps as number) : 0;
  const scheduled_days = Number.isFinite(rawScheduledDays) ? (rawScheduledDays as number) : 0;
  const elapsed_days = Number.isFinite(rawElapsedDays) ? (rawElapsedDays as number) : 0;
  const fsrsState = (card as unknown as { fsrsState?: 'New' | 'Learning' | 'Review' | 'Relearning' }).fsrsState;

  return {
    due,
    stability,
    difficulty,
    elapsed_days,
    scheduled_days,
    learning_steps,
    reps: card.reps ?? 0,
    lapses: card.lapses ?? 0,
    state: fsrsState
      ? State[fsrsState as keyof typeof State]
      : phaseToFsrsState(card.phase),
    last_review: lastReview.fsrsLastReview ? new Date(lastReview.fsrsLastReview) : undefined,
  };
};

// Apply FSRS result back to AppCard shape (keeping legacy compatibility fields in sync)
export const applyFsrsResult = (card: AppCard, fsrsCard: FsrsCard, opts?: { scheduled_days?: number; learning_steps?: number }) => {
  const nextDueMs = fsrsCard.due.getTime();
  const fsrsStateString = State[fsrsCard.state] as unknown as 'New' | 'Learning' | 'Review' | 'Relearning';
  const scheduledDays = opts?.scheduled_days ?? (card as AppCard & { fsrsScheduledDays?: number }).fsrsScheduledDays ?? 0;
  const learningSteps = opts?.learning_steps ?? (card as AppCard & { fsrsLearningSteps?: number }).fsrsLearningSteps ?? fsrsCard.learning_steps ?? 0;

  // FIXED: Use scheduled_days from FSRS log, not calculated from current time
  const intervalDays = scheduledDays;

  const updated: Partial<AppCard> & {
    stability?: number;
    difficulty?: number;
    fsrsState?: 'New' | 'Learning' | 'Review' | 'Relearning';
    fsrsLastReview?: number | undefined;
    fsrsLearningSteps?: number;
    fsrsScheduledDays?: number;
    fsrsElapsedDays?: number;
  } = {
    due: nextDueMs,
    reps: fsrsCard.reps,
    lapses: fsrsCard.lapses,
    // Legacy compat fields
    intervalDays,
    phase: fsrsStateToPhase(fsrsCard.state),
    stepIndex: learningSteps > 0 ? Math.max(0, learningSteps - 1) : undefined,
    // FSRS fields persisted on card
    stability: fsrsCard.stability,
    difficulty: fsrsCard.difficulty,
    fsrsState: fsrsStateString,
    fsrsLastReview: fsrsCard.last_review ? fsrsCard.last_review.getTime() : undefined,
    fsrsLearningSteps: learningSteps,
    fsrsScheduledDays: scheduledDays,
    fsrsElapsedDays: fsrsCard.elapsed_days ?? 0,
  };

  return updated;
};

export const initializeFsrsForNewCard = (now = Date.now()) => {
  const empty = createEmptyCard(new Date(now));
  return {
    // Legacy compat
    ef: 2.5,
    intervalDays: 0,
    reps: 0,
    lapses: 0,
    due: now,
    phase: 'learning' as const,
    stepIndex: 0,
    // FSRS persisted fields
    stability: empty.stability,
    difficulty: empty.difficulty,
    fsrsState: 'New' as const,
    fsrsLastReview: undefined as number | undefined,
    fsrsLearningSteps: 0,
    fsrsScheduledDays: 0,
    fsrsElapsedDays: 0,
  };
};

// Ensure existing cards have valid FSRS fields without changing due/state
export const normalizeFsrsFields = (card: AppCard): AppCard => {
  const normalized: Partial<AppCard> & {
    stability?: number;
    difficulty?: number;
    fsrsState?: 'New' | 'Learning' | 'Review' | 'Relearning';
    fsrsLastReview?: number | undefined;
    fsrsLearningSteps?: number;
    fsrsScheduledDays?: number;
    fsrsElapsedDays?: number;
  } = {};

  const cardWithFsrs = card as AppCard & {
    stability?: number;
    difficulty?: number;
    fsrsLearningSteps?: number;
    fsrsScheduledDays?: number;
    fsrsElapsedDays?: number;
    fsrsLastReview?: number;
    fsrsState?: string;
  };

  if (!Number.isFinite(cardWithFsrs.stability)) normalized.stability = 0;
  if (!Number.isFinite(cardWithFsrs.difficulty)) normalized.difficulty = 0;
  if (!Number.isFinite(cardWithFsrs.fsrsLearningSteps)) normalized.fsrsLearningSteps = card.stepIndex != null ? Math.max(0, (card.stepIndex as number) + 1) : 0;
  // FIXED: Don't recalculate fsrsScheduledDays based on current time - this was causing the overdue issue
  if (!Number.isFinite(cardWithFsrs.fsrsScheduledDays)) normalized.fsrsScheduledDays = 0;
  if (!Number.isFinite(cardWithFsrs.fsrsElapsedDays)) normalized.fsrsElapsedDays = 0;
  if (cardWithFsrs.fsrsLastReview === undefined) normalized.fsrsLastReview = undefined;
  if (!cardWithFsrs.fsrsState) {
    // Map legacy phase to FSRS state label string via reverse index on enum
    const s = phaseToFsrsState(card.phase);
    const reverse = State as unknown as Record<number, string>;
    const label = reverse[s] as 'New' | 'Learning' | 'Review' | 'Relearning';
    normalized.fsrsState = label || 'Learning';
  }

  return { ...card, ...normalized } as AppCard;
};

export const scheduleWithFsrs = (card: AppCard, quality: ReviewQuality, now = Date.now()) => {
  const f = createFsrs();
  const rating = qualityToRating(quality) as Exclude<Rating, Rating.Manual>;
  const fsrsCard = toFsrsCard(card);
  const { card: nextFsrsCard, log } = f.next(fsrsCard, new Date(now), rating);

  // Apply back to app card fields
  const updates = applyFsrsResult(card, nextFsrsCard, {
    scheduled_days: log.scheduled_days,
    learning_steps: log.learning_steps,
  });

  return { updates, log, nextFsrsCard };
};

export const isLeechFsrs = (card: AppCard, threshold = 8) => {
  return (card.lapses ?? 0) >= threshold;
};