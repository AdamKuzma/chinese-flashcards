import type { Card, Deck } from './types';

// Database operations
export const dbOperations = {
  async initializeSampleData(): Promise<void> {
    try {
      const existingData = localStorage.getItem('flashcardStore');
      if (existingData) {
        console.log('Data already exists, skipping initialization');
        return;
      }

      const sampleCards: Card[] = [
        {
          id: '1',
          hanzi: '你好',
          pinyin: 'nǐ hǎo',
          english: 'hello',
          ef: 2.5,
          intervalDays: 0,
          reps: 0,
          lapses: 0,
          due: Date.now(),
          phase: 'learning',
          stepIndex: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          suspended: false,
        },
        {
          id: '2',
          hanzi: '谢谢',
          pinyin: 'xiè xie',
          english: 'thank you',
          ef: 2.5,
          intervalDays: 0,
          reps: 0,
          lapses: 0,
          due: Date.now(),
          phase: 'learning',
          stepIndex: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          suspended: false,
        },
      ];

      const sampleDecks: Deck[] = [
        {
          id: '1',
          name: 'Basic Greetings',
          description: 'Essential Chinese greetings and expressions',
          cardIds: ['1', '2'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const sampleData = {
        cards: sampleCards,
        decks: sampleDecks,
      };

      localStorage.setItem('flashcardStore', JSON.stringify(sampleData));
      console.log('Sample data initialized');
    } catch (error) {
      console.error('Error initializing sample data:', error);
    }
  },
};