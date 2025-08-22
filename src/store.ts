import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Card, Deck } from './types.ts';
import { ReviewQuality } from './types.ts';

interface FlashcardStore {
  // Data
  cards: Card[];
  decks: Deck[];

  // UI State
  currentCardIndex: number;
  isShowingAnswer: boolean;
  isReviewing: boolean;
  selectedDeckId?: string;
  reviewAll?: boolean;

  // Actions
  // Card management
  addCard: (card: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  getCard: (id: string) => Card | undefined;

  // Deck management
  addDeck: (deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt' | 'cards'>) => void;
  updateDeck: (id: string, updates: Partial<Deck>) => void;
  deleteDeck: (id: string) => void;
  getDeck: (id: string) => Deck | undefined;
  addCardToDeck: (deckId: string, cardId: string) => void;
  removeCardFromDeck: (deckId: string, cardId: string) => void;

  // Review logic
  startReview: (deckId?: string, reviewAll?: boolean) => void;
  stopReview: () => void;
  showAnswer: () => void;
  hideAnswer: () => void;
  reviewCard: (quality: ReviewQuality) => void;
  getNextCard: () => Card | null;
  getDueCards: (deckId?: string) => Card[];
  getAllCards: (deckId?: string) => Card[];
  getTodaysReviewCount: () => number;

  // UI Actions
  setCurrentCardIndex: (index: number) => void;
  setSelectedDeckId: (deckId: string | undefined) => void;
  nextCard: () => void;
  previousCard: () => void;
}

// Spaced repetition algorithm constants
const INITIAL_EASE = 2.5;
const MIN_EASE = 1.3;


export const useFlashcardStore = create<FlashcardStore>()(
  persist(
    (set, get) => ({
      // Initial state
      cards: [
        {
          id: 'sample-1',
          hanzi: '你好',
          pinyin: 'nǐ hǎo',
          english: 'hello',
          due: Date.now() - 1000, // 1 second ago to ensure it's due
          interval: 1,
          ease: 2.5,
          reps: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'sample-2',
          hanzi: '谢谢',
          pinyin: 'xiè xiè',
          english: 'thank you',
          due: Date.now() - 1000, // 1 second ago to ensure it's due
          interval: 1,
          ease: 2.5,
          reps: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'sample-3',
          hanzi: '再见',
          pinyin: 'zài jiàn',
          english: 'goodbye',
          due: Date.now() - 1000, // 1 second ago to ensure it's due
          interval: 1,
          ease: 2.5,
          reps: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      decks: [],
      currentCardIndex: 0,
      isShowingAnswer: false,
      isReviewing: false,
      selectedDeckId: undefined,
      reviewAll: false,

      // Card management
      addCard: (cardData) => {
        const now = Date.now();
        const newCard: Card = {
          ...cardData,
          id: crypto.randomUUID(),
          due: cardData.due || now, // Use provided due date or current time
          interval: cardData.interval || 1,
          ease: cardData.ease || INITIAL_EASE,
          reps: cardData.reps || 0,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          cards: [...state.cards, newCard],
        }));
      },

      updateCard: (id, updates) => {
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === id
              ? { ...card, ...updates, updatedAt: Date.now() }
              : card
          ),
        }));
      },

      deleteCard: (id) => {
        set((state) => ({
          cards: state.cards.filter((card) => card.id !== id),
          // Also remove from decks
          decks: state.decks.map((deck) => ({
            ...deck,
            cards: deck.cards.filter((card) => card.id !== id),
            updatedAt: Date.now(),
          })),
        }));
      },

      getCard: (id) => {
        return get().cards.find((card) => card.id === id);
      },

      // Deck management
      addDeck: (deckData) => {
        const now = Date.now();
        const newDeck: Deck = {
          ...deckData,
          id: crypto.randomUUID(),
          cards: [],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          decks: [...state.decks, newDeck],
        }));
      },

      updateDeck: (id, updates) => {
        set((state) => ({
          decks: state.decks.map((deck) =>
            deck.id === id
              ? { ...deck, ...updates, updatedAt: Date.now() }
              : deck
          ),
        }));
      },

      deleteDeck: (id) => {
        set((state) => ({
          decks: state.decks.filter((deck) => deck.id !== id),
        }));
      },

      getDeck: (id) => {
        return get().decks.find((deck) => deck.id === id);
      },

      addCardToDeck: (deckId, cardId) => {
        const card = get().getCard(cardId);
        if (!card) return;

        set((state) => ({
          decks: state.decks.map((deck) =>
            deck.id === deckId
              ? {
                  ...deck,
                  cards: [...deck.cards, card],
                  updatedAt: Date.now(),
                }
              : deck
          ),
        }));
      },

      removeCardFromDeck: (deckId, cardId) => {
        set((state) => ({
          decks: state.decks.map((deck) =>
            deck.id === deckId
              ? {
                  ...deck,
                  cards: deck.cards.filter((card) => card.id !== cardId),
                  updatedAt: Date.now(),
                }
              : deck
          ),
        }));
      },

      // Review logic
      startReview: (deckId, reviewAll = false) => {
        set({
          selectedDeckId: deckId,
          isReviewing: true,
          currentCardIndex: 0,
          isShowingAnswer: false,
          reviewAll: reviewAll,
        });
      },

      stopReview: () => {
        set({
          isReviewing: false,
          selectedDeckId: undefined,
          currentCardIndex: 0,
          isShowingAnswer: false,
          reviewAll: false,
        });
      },

      showAnswer: () => {
        set({ isShowingAnswer: true });
      },

      hideAnswer: () => {
        set({ isShowingAnswer: false });
      },

      reviewCard: (quality) => {
        const { currentCardIndex, selectedDeckId, getDueCards, getAllCards, reviewAll } = get();
        const cardsToReview = reviewAll 
          ? (selectedDeckId ? getAllCards(selectedDeckId) : getAllCards())
          : (selectedDeckId ? getDueCards(selectedDeckId) : getDueCards());
        const currentCard = cardsToReview[currentCardIndex];

        if (!currentCard) return;

        const now = Date.now();
        let { interval, ease, reps } = currentCard;

        // Update ease factor
        ease = Math.max(MIN_EASE, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

        // Calculate new interval and due date based on quality
        let due: number;
        
        if (quality === ReviewQuality.AGAIN) {
          // Show again immediately (no time delay)
          due = now;
          reps = Math.max(0, reps - 1);
        } else if (quality === ReviewQuality.HARD) {
          // Show again in 5 minutes
          due = now + (5 * 60 * 1000);
          reps += 1;
        } else if (quality === ReviewQuality.GOOD) {
          // Show again in 10 minutes
          due = now + (10 * 60 * 1000);
          reps += 1;
        } else if (quality === ReviewQuality.EASY) {
          // Show again in 1 day
          due = now + (1 * 24 * 60 * 60 * 1000);
          reps += 1;
        } else {
          // Fallback
          due = now + (interval * 24 * 60 * 60 * 1000);
        }

        // Update card
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === currentCard.id
              ? {
                  ...card,
                  interval,
                  ease,
                  reps,
                  due,
                  updatedAt: now,
                }
              : card
          ),
        }));

        // Move to next card
        get().nextCard();
      },

      getNextCard: () => {
        const { selectedDeckId, getDueCards, getAllCards, reviewAll } = get();
        const cardsToReview = reviewAll 
          ? (selectedDeckId ? getAllCards(selectedDeckId) : getAllCards())
          : (selectedDeckId ? getDueCards(selectedDeckId) : getDueCards());
        return cardsToReview.length > 0 ? cardsToReview[0] : null;
      },

      getDueCards: (deckId) => {
        const now = Date.now();
        const allCards = get().cards;

        let cardsToFilter = allCards;
        if (deckId) {
          const deck = get().getDeck(deckId);
          cardsToFilter = deck ? deck.cards : [];
        }

        return cardsToFilter.filter((card) => card.due <= now);
      },

      getAllCards: (deckId) => {
        const allCards = get().cards;

        let cardsToFilter = allCards;
        if (deckId) {
          const deck = get().getDeck(deckId);
          cardsToFilter = deck ? deck.cards : [];
        }

        return cardsToFilter;
      },

      getTodaysReviewCount: () => {
        const now = Date.now();
        const startOfDay = new Date(now).setHours(0, 0, 0, 0);
        const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

        return get().cards.filter((card) => card.due >= startOfDay && card.due <= endOfDay).length;
      },

      // UI Actions
      setCurrentCardIndex: (index) => {
        set({ currentCardIndex: index, isShowingAnswer: false });
      },

      setSelectedDeckId: (deckId) => {
        set({ selectedDeckId: deckId });
      },

      nextCard: () => {
        const { selectedDeckId, getDueCards, getAllCards, reviewAll } = get();
        const cardsToReview = reviewAll 
          ? (selectedDeckId ? getAllCards(selectedDeckId) : getAllCards())
          : (selectedDeckId ? getDueCards(selectedDeckId) : getDueCards());

        set((state) => ({
          currentCardIndex: Math.min(state.currentCardIndex + 1, cardsToReview.length - 1),
          isShowingAnswer: false,
        }));
      },

      previousCard: () => {
        set((state) => ({
          currentCardIndex: Math.max(state.currentCardIndex - 1, 0),
          isShowingAnswer: false,
        }));
      },
    }),
    {
      name: 'flashcard-storage',
      partialize: (state) => ({
        cards: state.cards,
        decks: state.decks,
      }),
    }
  )
);