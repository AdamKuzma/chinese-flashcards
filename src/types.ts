// Flashcard data types and interfaces

export interface Card {
  id: string;
  hanzi: string;        // Chinese characters
  pinyin: string;       // Romanization
  english: string;      // English translation
  due: number;          // Timestamp for next review
  interval: number;     // Current interval in days
  ease: number;         // Ease factor (typically 2.5)
  reps: number;         // Number of repetitions
  createdAt: number;    // When the card was created
  updatedAt: number;    // When the card was last updated
}

export interface CardReview {
  cardId: string;
  quality: ReviewQuality;
  timestamp: number;
}

export const ReviewQuality = {
  AGAIN: 0,     // Complete failure - reset progress
  HARD: 1,      // Struggled but remembered
  GOOD: 2,      // Remembered with some effort
  EASY: 3       // Perfect recall
} as const;

export type ReviewQuality = typeof ReviewQuality[keyof typeof ReviewQuality];

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
