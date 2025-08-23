// Flashcard data types and interfaces

export interface Card {
  id: string;
  hanzi: string;        // Chinese characters
  pinyin: string;       // Romanization
  english: string;      // English translation
  
  // SM-2 Algorithm fields
  ef: number;           // ease factor (start 2.5)
  intervalDays: number; // days (only for review/relearning)
  reps: number;         // consecutive correct reviews
  lapses: number;       // number of lapses/failures
  due: number;          // ms epoch for next review
  phase: Phase;         // learning phase
  stepIndex?: number;   // index into learningSteps
  
  createdAt: number;    // When the card was created
  updatedAt: number;    // When the card was last updated
  suspended?: boolean;  // For leech management
}

export interface CardReview {
  cardId: string;
  quality: ReviewQuality;
  timestamp: number;
}

export const ReviewQuality = {
  AGAIN: 'again',    // Complete failure - reset progress
  HARD: 'hard',      // Struggled, guessed, or hesitated
  GOOD: 'good',      // Remembered with normal effort
  EASY: 'easy'       // Perfect recall, too easy
} as const;

export type ReviewQuality = typeof ReviewQuality[keyof typeof ReviewQuality];

// SM-2 Algorithm types
export type Grade = "again" | "hard" | "good" | "easy";
export type Phase = 'learning' | 'graduating' | 'review' | 'relearning';

export type ReviewState = {
  ef: number;           // ease factor (start 2.5)
  intervalDays: number; // only for review/relearning
  reps: number;         // consecutive correct reviews
  lapses: number;       // number of times the card was forgotten
  due: number;          // ms epoch
  phase: Phase;         // learning phase
  stepIndex?: number;   // index into learningSteps
};

export interface Deck {
  id: string;
  name: string;
  description?: string;
  cards: Card[];
  createdAt: number;
  updatedAt: number;
}

export interface StudySession {
  id: string;
  deckId: string;
  cardsReviewed: number;
  correctAnswers: number;
  startTime: number;
  endTime?: number;
}

// Utility types for UI state
export interface UIState {
  currentCardIndex: number;
  isShowingAnswer: boolean;
  isReviewing: boolean;
  selectedDeckId?: string;
}
