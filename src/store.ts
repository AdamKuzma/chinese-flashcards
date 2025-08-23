import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Card, Deck } from './types.ts';
import { ReviewQuality } from './types.ts';
import { sm2, isLeech, initializeCard } from './utils/sm2';

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
  requeuedCards: string[]; // Card IDs that need to be reviewed again in current session
  reviewedRequeuedCards: Set<string>; // Track which requeued cards have been reviewed

  // Actions
  // Card management
  addCard: (card: Omit<Card, 'id' | 'createdAt' | 'updatedAt' | 'ef' | 'intervalDays' | 'reps' | 'lapses' | 'due' | 'phase' | 'stepIndex' | 'suspended'>) => void;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  getCard: (id: string) => Card | undefined;

  // Deck management
  addDeck: (deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt' | 'cardIds'>) => void;
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

// SM-2 Algorithm is now handled in utils/sm2.ts


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
          ef: 2.5,
          intervalDays: 0,
          reps: 0,
          lapses: 0,
          due: Date.now() - 1000,
          phase: 'learning' as const,
          stepIndex: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'sample-2',
          hanzi: '谢谢',
          pinyin: 'xiè xiè',
          english: 'thank you',
          ef: 2.5,
          intervalDays: 0,
          reps: 0,
          lapses: 0,
          due: Date.now() - 1000,
          phase: 'learning' as const,
          stepIndex: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'sample-3',
          hanzi: '再见',
          pinyin: 'zài jiàn',
          english: 'goodbye',
          ef: 2.5,
          intervalDays: 0,
          reps: 0,
          lapses: 0,
          due: Date.now() - 1000,
          phase: 'learning' as const,
          stepIndex: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      decks: [
        {
          id: 'default-deck',
          name: 'Default Deck',
          description: 'Your main collection of Chinese flashcards',
          cardIds: ['sample-1', 'sample-2', 'sample-3'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      currentCardIndex: 0,
      isShowingAnswer: false,
      isReviewing: false,
      selectedDeckId: undefined,
      reviewAll: false,
      requeuedCards: [],
      reviewedRequeuedCards: new Set<string>(),

      // Card management
      addCard: (cardData) => {
        const now = Date.now();
        const sm2State = initializeCard();
        
        const newCard: Card = {
          ...cardData,
          id: crypto.randomUUID(),
          ef: sm2State.ef,
          intervalDays: sm2State.intervalDays,
          reps: sm2State.reps,
          lapses: sm2State.lapses,
          due: sm2State.due,
          phase: sm2State.phase,
          stepIndex: sm2State.stepIndex,
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
            cardIds: deck.cardIds.filter((cardId) => cardId !== id),
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
          cardIds: [],
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
                  cardIds: [...deck.cardIds, cardId],
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
                  cardIds: deck.cardIds.filter((id) => id !== cardId),
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
          requeuedCards: [],
          reviewedRequeuedCards: new Set<string>(),
        });
      },

      stopReview: () => {
        set({
          isReviewing: false,
          selectedDeckId: undefined,
          currentCardIndex: 0,
          isShowingAnswer: false,
          reviewAll: false,
          requeuedCards: [],
          reviewedRequeuedCards: new Set<string>(),
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
        
        // Create current review state
        const currentState = {
          ef: currentCard.ef,
          intervalDays: currentCard.intervalDays,
          reps: currentCard.reps,
          lapses: currentCard.lapses,
          due: currentCard.due,
          phase: currentCard.phase,
          stepIndex: currentCard.stepIndex
        };

        // Calculate new state using SM-2
        const newState = sm2(currentState, quality, now);
        
        // Check for leech
        const suspended = isLeech(newState);

        // Update card
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === currentCard.id
              ? {
                  ...card,
                  ef: newState.ef,
                  intervalDays: newState.intervalDays,
                  reps: newState.reps,
                  lapses: newState.lapses,
                  due: newState.due,
                  phase: newState.phase,
                  stepIndex: newState.stepIndex,
                  suspended,
                  updatedAt: now,
                }
              : card
          ),
        }));

        // Handle "again" cards - add them to the end of current session for immediate retry
        if (quality === 'again' && (newState.phase === 'learning' || newState.phase === 'relearning')) {
          // Add the card to requeuedCards so it appears at the end of current session
          set((state) => ({
            requeuedCards: [...state.requeuedCards, currentCard.id]
          }));
        }

        // Mark this card as reviewed if it was a requeued card
        if (get().requeuedCards.includes(currentCard.id)) {
          set((state) => ({
            reviewedRequeuedCards: new Set([...state.reviewedRequeuedCards, currentCard.id])
          }));
        }

        // Check if this was the last card in the current queue (including requeued cards)
        const totalCardsInSession = cardsToReview.length + get().requeuedCards.length;
        if (currentCardIndex >= totalCardsInSession - 1) {
          // End the review session and clear requeued cards
          get().stopReview();
        } else {
          // Move to next card
          get().nextCard();
        }
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
        const { requeuedCards, reviewedRequeuedCards } = get();

        let cardsToFilter = allCards;
        if (deckId) {
          const deck = get().getDeck(deckId);
          cardsToFilter = deck ? allCards.filter(card => deck.cardIds.includes(card.id)) : [];
        }

        const dueCards = cardsToFilter.filter((card) => card.due <= now && !card.suspended);
        
        // Merge requeued cards with due cards for the current session
        if (requeuedCards.length > 0) {
          // Filter out already-reviewed requeued cards
          const unreviewedRequeuedCards = requeuedCards.filter(id => !reviewedRequeuedCards.has(id));
          const requeuedCardObjects = unreviewedRequeuedCards.map(id => allCards.find(card => card.id === id)).filter(Boolean) as Card[];
          // Return due cards first, then unreviewed requeued cards
          return [...dueCards, ...requeuedCardObjects];
        }
        
        return dueCards;
      },

      getAllCards: (deckId) => {
        const allCards = get().cards;
        const { requeuedCards, reviewedRequeuedCards } = get();

        let cardsToFilter = allCards;
        if (deckId) {
          const deck = get().getDeck(deckId);
          cardsToFilter = deck ? allCards.filter(card => deck.cardIds.includes(card.id)) : [];
        }

        // Merge requeued cards with all cards for the current session
        if (requeuedCards.length > 0) {
          // Filter out already-reviewed requeued cards
          const unreviewedRequeuedCards = requeuedCards.filter(id => !reviewedRequeuedCards.has(id));
          const requeuedCardObjects = unreviewedRequeuedCards.map(id => allCards.find(card => card.id === id)).filter(Boolean) as Card[];
          // Return all cards first, then unreviewed requeued cards
          return [...cardsToFilter, ...requeuedCardObjects];
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