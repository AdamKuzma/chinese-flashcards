import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Card, Deck } from './types.ts';
import { ReviewQuality } from './types.ts';
import { scheduleWithFsrs, isLeechFsrs, initializeFsrsForNewCard, normalizeFsrsFields } from './utils/fsrsAdapter';

interface FlashcardStore {
  // Data
  cards: Card[];
  decks: Deck[];

  // UI State
  // Session state (queue-based)
  sessionActive: boolean;
  sessionQueue: string[]; // card IDs
  currentId?: string;
  sessionInitialCount: number;
  isShowingAnswer: boolean;
  isReviewing: boolean; // alias of sessionActive for UI compatibility
  selectedDeckId?: string;
  reviewAll?: boolean;

  // Actions
  // Card management
  addCard: (card: Omit<Card, 'id' | 'createdAt' | 'updatedAt' | 'ef' | 'intervalDays' | 'reps' | 'lapses' | 'due' | 'phase' | 'stepIndex' | 'suspended'>) => string;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  getCard: (id: string) => Card | undefined;

  // Deck management
  addDeck: (deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt' | 'cardIds'>) => string;
  updateDeck: (id: string, updates: Partial<Deck>) => void;
  deleteDeck: (id: string) => void;
  getDeck: (id: string) => Deck | undefined;
  addCardToDeck: (deckId: string, cardId: string) => void;
  removeCardFromDeck: (deckId: string, cardId: string) => void;

  // Review logic
  startReview: (deckId?: string, reviewAll?: boolean) => void;
  startReviewWithCardIds: (cardIds: string[]) => void;
  stopReview: () => void;
  showAnswer: () => void;
  hideAnswer: () => void;
  reviewCard: (quality: ReviewQuality) => void;
  getNextCard: () => Card | null;
  getDueCards: (deckId?: string) => Card[];
  getAllCards: (deckId?: string) => Card[];
  getTodaysReviewCount: () => number;
  // Session helpers
  getCurrentCard: () => Card | null;
  getSessionPosition: () => { index: number; total: number };

  // UI Actions
  setCurrentCardIndex: (index: number) => void;
  setSelectedDeckId: (deckId: string | undefined) => void;
  nextCard: () => void;
  previousCard: () => void;
  
  // Import/Export
  exportData: () => void;
  importData: (data: { cards: Card[]; decks: Deck[] }) => void;
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
      sessionActive: false,
      sessionQueue: [],
      currentId: undefined,
      sessionInitialCount: 0,
      isShowingAnswer: false,
      isReviewing: false,
      selectedDeckId: undefined,
      reviewAll: false,
      

      // Card management
      addCard: (cardData) => {
        const now = Date.now();
        const fsrsState = initializeFsrsForNewCard(now);
        const cardId = crypto.randomUUID();
        
        const newCard: Card = {
          ...cardData,
          id: cardId,
          ef: fsrsState.ef,
          intervalDays: fsrsState.intervalDays,
          reps: fsrsState.reps,
          lapses: fsrsState.lapses,
          due: fsrsState.due,
          phase: fsrsState.phase,
          stepIndex: fsrsState.stepIndex,
          // FSRS fields
          stability: fsrsState.stability,
          difficulty: fsrsState.difficulty,
          fsrsState: fsrsState.fsrsState,
          fsrsLastReview: fsrsState.fsrsLastReview,
          fsrsLearningSteps: fsrsState.fsrsLearningSteps,
          fsrsScheduledDays: fsrsState.fsrsScheduledDays,
          fsrsElapsedDays: fsrsState.fsrsElapsedDays,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => {
          const updates: Partial<FlashcardStore> & { cards: Card[]; decks?: Deck[] } = {
            cards: [...state.cards, newCard],
          };
          if (state.selectedDeckId) {
            updates.decks = state.decks.map((deck) =>
              deck.id === state.selectedDeckId
                ? { ...deck, cardIds: [...deck.cardIds, newCard.id], updatedAt: now }
                : deck
            );
          }
          return updates;
        });
        
        return cardId;
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
        const id = crypto.randomUUID();
        const newDeck: Deck = {
          ...deckData,
          id,
          cardIds: [],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          decks: [...state.decks, newDeck],
        }));
        return id;
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
        const now = Date.now();
        const allCards = get().cards;
        let source = allCards;
        if (deckId) {
          const deck = get().getDeck(deckId);
          source = deck ? allCards.filter((c) => deck.cardIds.includes(c.id)) : [];
        }
        const ids = (reviewAll ? source : source.filter((c) => c.due <= now && !c.suspended)).map((c) => c.id);
        // Shuffle
        for (let i = ids.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [ids[i], ids[j]] = [ids[j], ids[i]];
        }
        set({
          selectedDeckId: deckId,
          isReviewing: ids.length > 0,
          sessionActive: ids.length > 0,
          sessionQueue: ids,
          currentId: ids[0],
          sessionInitialCount: ids.length,
          isShowingAnswer: false,
          reviewAll: reviewAll,
        });
      },

      startReviewWithCardIds: (cardIds) => {
        const ids = [...cardIds];
        // Shuffle
        for (let i = ids.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [ids[i], ids[j]] = [ids[j], ids[i]];
        }
        set({
          isReviewing: ids.length > 0,
          sessionActive: ids.length > 0,
          sessionQueue: ids,
          currentId: ids[0],
          sessionInitialCount: ids.length,
          isShowingAnswer: false,
        });
      },

      stopReview: () => {
        set({
          isReviewing: false,
          sessionActive: false,
          selectedDeckId: undefined,
          sessionQueue: [],
          currentId: undefined,
          sessionInitialCount: 0,
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
        const { currentId } = get();
        if (!currentId) return;
        const currentCard = get().getCard(currentId);
        if (!currentCard) return;

        const now = Date.now();
        const { updates } = scheduleWithFsrs(currentCard, quality, now);
        const suspended = isLeechFsrs({ ...currentCard, ...updates });

        // Persist card
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === currentCard.id
              ? { ...card, ...updates, suspended, updatedAt: now }
              : card
          ),
        }));

        // Advance session queue
        const q = [...get().sessionQueue];
        // Ensure current is at head; if not, remove it from wherever it is
        const idx = q.indexOf(currentId);
        if (idx >= 0) q.splice(idx, 1);

        if (quality === 'again' && ((updates.phase === 'learning') || (updates.phase === 'relearning'))) {
          const insertAt = Math.min(10, q.length);
          q.splice(insertAt, 0, currentId);
        }

        const nextId = q[0];
        set({ sessionQueue: q, currentId: nextId, isShowingAnswer: false, isReviewing: !!nextId, sessionActive: !!nextId });
        if (!nextId) {
          get().stopReview();
        }
      },

      getNextCard: () => {
        const nextId = get().sessionQueue[0];
        return nextId ? get().getCard(nextId) || null : null;
      },

      getDueCards: (deckId) => {
        const now = Date.now();
        const allCards = get().cards.map((c) => normalizeFsrsFields(c));

        let cardsToFilter = allCards;
        if (deckId) {
          const deck = get().getDeck(deckId);
          cardsToFilter = deck ? allCards.filter(card => deck.cardIds.includes(card.id)) : [];
        }

        return cardsToFilter.filter((card) => card.due <= now && !card.suspended);
      },

      getAllCards: (deckId) => {
        const allCards = get().cards.map((c) => normalizeFsrsFields(c));

        let cardsToFilter = allCards;
        if (deckId) {
          const deck = get().getDeck(deckId);
          cardsToFilter = deck ? allCards.filter(card => deck.cardIds.includes(card.id)) : [];
        }

        return cardsToFilter;
      },

      getTodaysReviewCount: () => {
        const now = Date.now();
        const startOfDay = new Date(now).setHours(0, 0, 0, 0);
        const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

        return get().cards.filter((card) => card.due >= startOfDay && card.due <= endOfDay).length;
      },

      // Session helpers
      getCurrentCard: () => {
        const id = get().currentId;
        return id ? get().getCard(id) || null : null;
      },
      getSessionPosition: () => {
        const { sessionQueue, currentId } = get();
        const index = currentId ? Math.max(0, sessionQueue.indexOf(currentId)) : -1;
        return { index, total: sessionQueue.length };
      },

      // UI Actions
      setCurrentCardIndex: () => {
        // deprecated in queue model
      },

      setSelectedDeckId: (deckId) => {
        set({ selectedDeckId: deckId });
      },

      nextCard: () => {
        // Optional manual navigation within queue (does not pop)
        const { sessionQueue, currentId } = get();
        const idx = currentId ? sessionQueue.indexOf(currentId) : -1;
        const nextId = idx >= 0 && idx + 1 < sessionQueue.length ? sessionQueue[idx + 1] : currentId;
        set({ currentId: nextId, isShowingAnswer: false });
      },

      previousCard: () => {
        const { sessionQueue, currentId } = get();
        const idx = currentId ? sessionQueue.indexOf(currentId) : -1;
        const prevId = idx > 0 ? sessionQueue[idx - 1] : currentId;
        set({ currentId: prevId, isShowingAnswer: false });
      },

      // Import/Export
      exportData: () => {
        const { cards, decks } = get();
        const data = { cards, decks };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chinese-flashcards-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },

      importData: (data: { cards: Card[]; decks: Deck[] }) => {
        try {
          set({
            cards: data.cards,
            decks: data.decks,
          });
        } catch (error) {
          console.error('Error importing data:', error);
        }
      },
    }),
    {
      name: 'flashcard-storage',
      partialize: (state) => ({
        cards: state.cards,
        decks: state.decks,
        selectedDeckId: state.selectedDeckId,
      }),
    }
  )
);