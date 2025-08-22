import Dexie, { type Table } from 'dexie';
import type { Card, Deck, CardReview } from './types.ts';

export class FlashcardDatabase extends Dexie {
  cards!: Table<Card>;
  decks!: Table<Deck>;
  reviews!: Table<CardReview>;

  constructor() {
    super('FlashcardDB');

    this.version(1).stores({
      cards: 'id, hanzi, pinyin, english, due, interval, ease, reps, createdAt, updatedAt',
      decks: 'id, name, description, createdAt, updatedAt',
      reviews: 'cardId, quality, timestamp',
    });

    // Add hooks for automatic timestamp updates
    this.cards.hook('creating', (_, obj) => {
      (obj as any).createdAt = Date.now();
      (obj as any).updatedAt = Date.now();
    });

    this.cards.hook('updating', (modifications) => {
      (modifications as any).updatedAt = Date.now();
    });

    this.decks.hook('creating', (_, obj) => {
      (obj as any).createdAt = Date.now();
      (obj as any).updatedAt = Date.now();
    });

    this.decks.hook('updating', (modifications) => {
      (modifications as any).updatedAt = Date.now();
    });
  }
}

export const db = new FlashcardDatabase();

// Database operations
export const dbOperations = {
  // Initialize with sample data
  async initializeSampleData(): Promise<void> {
    const cardCount = await db.cards.count();
    if (cardCount > 0) return; // Already has data

    const sampleCards: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        hanzi: '你好',
        pinyin: 'nǐ hǎo',
        english: 'hello',
        due: Date.now() - 1000, // 1 second ago to ensure it's due
        interval: 1,
        ease: 2.5,
        reps: 0,
      },
      {
        hanzi: '谢谢',
        pinyin: 'xiè xiè',
        english: 'thank you',
        due: Date.now() - 1000, // 1 second ago to ensure it's due
        interval: 1,
        ease: 2.5,
        reps: 0,
      },
      {
        hanzi: '再见',
        pinyin: 'zài jiàn',
        english: 'goodbye',
        due: Date.now() - 1000, // 1 second ago to ensure it's due
        interval: 1,
        ease: 2.5,
        reps: 0,
      },
    ];

    for (const card of sampleCards) {
      await dbOperations.addCard(card);
    }
  },

  // Card operations
  async addCard(card: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = crypto.randomUUID();
    await db.cards.add({
      ...card,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return id;
  },

  async getAllCards(): Promise<Card[]> {
    return await db.cards.toArray();
  },

  async getDueCards(): Promise<Card[]> {
    const now = Date.now();
    return await db.cards.where('due').belowOrEqual(now).toArray();
  },
};