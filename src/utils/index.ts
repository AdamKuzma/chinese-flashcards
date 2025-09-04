export * from './sm2';
export * from './fsrsAdapter';
export * from './audioCache';

/**
 * Format time remaining until a card is due for review
 * @param dueTime - Due time in milliseconds (epoch)
 * @returns Formatted string like "3 days, 4 hours" or "Due now" or "Overdue by 2 hours"
 */
export function formatTimeUntilDue(dueTime: number): string {
  const now = Date.now();
  const diffMs = dueTime - now;
  const isOverdue = diffMs < 0;
  const absDiffMs = Math.abs(diffMs);

  // If due within next minute, show "Due now"
  if (absDiffMs < 60 * 1000) {
    return "Due now";
  }

  const minutes = Math.floor(absDiffMs / (1000 * 60));
  const hours = Math.floor(absDiffMs / (1000 * 60 * 60));
  const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(absDiffMs / (1000 * 60 * 60 * 24 * 7));
  const months = Math.floor(absDiffMs / (1000 * 60 * 60 * 24 * 30));

  let result = "";

  if (months > 0) {
    result = `${months} month${months !== 1 ? 's' : ''}`;
    const remainingDays = days % 30;
    if (remainingDays > 0) {
      result += `, ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
    }
  } else if (weeks > 0) {
    result = `${weeks} week${weeks !== 1 ? 's' : ''}`;
    const remainingDays = days % 7;
    if (remainingDays > 0) {
      result += `, ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
    }
  } else if (days > 0) {
    result = `${days} day${days !== 1 ? 's' : ''}`;
    const remainingHours = hours % 24;
    if (remainingHours > 0) {
      result += `, ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
    }
  } else if (hours > 0) {
    result = `${hours} hour${hours !== 1 ? 's' : ''}`;
    const remainingMinutes = minutes % 60;
    if (remainingMinutes > 0) {
      result += `, ${remainingMinutes} min${remainingMinutes !== 1 ? 's' : ''}`;
    }
  } else {
    result = `${minutes} min${minutes !== 1 ? 's' : ''}`;
  }

  if (isOverdue) {
    // Show "Due now" for cards overdue by less than 1 day
    if (days === 0) {
      return "Due now";
    }
    // Show "Overdue" for cards overdue by 1 day or more
    return `Overdue by ${result}`;
  }
  
  return `In ${result}`;
}

/**
 * Get debug information about a card's SM-2 scheduling
 * @param card - The flashcard with SM-2 data
 * @returns Object with debug information
 */
export function getCardDebugInfo(card: { ef: number; intervalDays: number; reps: number; lapses: number; due: number; phase: string; stepIndex?: number; stability?: number; difficulty?: number; fsrsState?: string }) {
  const dueTimeFormatted = formatTimeUntilDue(card.due);
  const dueDate = new Date(card.due);
  const stability = Number.isFinite(card.stability ?? NaN) ? card.stability : undefined;
  const difficulty = Number.isFinite(card.difficulty ?? NaN) ? card.difficulty : undefined;
  
  return {
    intervalDays: card.intervalDays,
    consecutiveCorrect: card.reps,
    lapses: card.lapses,
    nextReview: dueTimeFormatted,
    exactDueTime: dueDate.toLocaleString(),
    isDue: card.due <= Date.now(),
    phase: card.phase,
    stepIndex: card.stepIndex,
    stability,
    difficulty,
    fsrsState: card.fsrsState,
  };
}
