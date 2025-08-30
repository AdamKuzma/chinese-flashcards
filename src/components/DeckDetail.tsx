import React, { useState, useRef, useEffect } from 'react';
import { useFlashcardStore } from '../store';
import Button from './Button';
import { AddCardModal } from './AddCardModal';
import { EditDeckModal } from './EditDeckModal';
import { EditCardModal } from './EditCardModal';

interface DeckDetailProps {
  deckId: string;
  onStartReview: (reviewAll: boolean) => void;
  onAddCard: () => void;
  onDeleteDeck: () => void;
  onToast: (message: string) => void;
}

export const DeckDetail: React.FC<DeckDetailProps> = ({ deckId, onStartReview: _onStartReview, onAddCard: _onAddCard, onDeleteDeck, onToast }) => {
  const { getDeck, cards } = useFlashcardStore();
  const deck = getDeck(deckId);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'lessons' | 'cards'>('lessons');
  const [showAddCard, setShowAddCard] = useState(false);
  const [showEditDeck, setShowEditDeck] = useState(false);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  if (!deck) {
    return <div className="text-gray-custom">Deck not found.</div>;
  }

  const deckCards = cards.filter((c) => deck.cardIds.includes(c.id));

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-left">{deck.name}</h1>
          {deck.description && (
            <div className="text-xs text-silver-custom mt-1">{deck.description}</div>
          )}
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-8 h-8 rounded-full hover:bg-granite-custom flex items-center justify-center"
              aria-label="Deck options"
              title="Deck options"
            >
              <span className="text-lg">⋯</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 bg-granite-custom rounded-lg shadow-lg border border-gray-600 z-50 min-w-36">
                <div className="py-1">
                  <button onClick={() => setShowAddCard(true)} className="w-full px-4 py-2 text-left text-light-custom hover:bg-gray-600 transition-colors">Add cards</button>
                  <button onClick={() => setShowEditDeck(true)} className="w-full px-4 py-2 text-left text-light-custom hover:bg-gray-600 transition-colors">Edit deck</button>
                  <button onClick={() => { onDeleteDeck(); setMenuOpen(false); }} className="w-full px-4 py-2 text-left text-red-300 hover:bg-gray-600 transition-colors">Delete deck</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-granite-custom">
        <nav className="flex gap-6">
          <button
            className={`py-2 ${activeTab === 'lessons' ? 'text-light-custom border-b-2 border-light-custom' : 'text-gray-custom'}`}
            onClick={() => setActiveTab('lessons')}
          >
            Lessons
          </button>
          <button
            className={`py-2 ${activeTab === 'cards' ? 'text-light-custom border-b-2 border-light-custom' : 'text-gray-custom'}`}
            onClick={() => setActiveTab('cards')}
          >
            Cards
          </button>
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'cards' ? (
        <CardsGrid deckId={deckId} onToast={onToast} />
      ) : (
        (() => {
          const lessonSize = 10;
          // Build lessons by chunking to avoid rounding issues
          const lessons: { num: number }[] = [];
          for (let i = 0; i < deckCards.length; i += lessonSize) {
            lessons.push({ num: Math.floor(i / lessonSize) + 1 });
          }
          if (lessons.length === 0) {
            return (
              <div className="py-8">
                <p className="text-gray-custom mb-4">No cards in this deck yet. Add your first card.</p>
                <Button onClick={() => setShowAddCard(true)} size="sm">Add cards</Button>
              </div>
            );
          }
          return (
            <div className="mt-6 grid grid-cols-4 gap-6">
              {lessons.map(({ num }) => {
                const start = (num - 1) * lessonSize;
                const end = start + lessonSize;
                const slice = deckCards.slice(start, end);
                const now = Date.now();
                const learned = slice.filter((c) => ((c as any).fsrsState === 'Review' || (c as any).fsrsState === 'Relearning') && c.due > now).length;
                const total = slice.length || 1;
                const pct = Math.max(0, Math.min(100, Math.round((learned / total) * 100)));

                return (
                  <button
                    key={num}
                    className="text-center"
                    onClick={() => {
                      const ids = slice.map((c) => c.id);
                      useFlashcardStore.getState().startReviewWithCardIds(ids);
                      const evt = new CustomEvent('navigate-review');
                      window.dispatchEvent(evt);
                    }}
                  >
                    <div className="w-[164px] h-[196px] bg-granite-custom rounded-2xl flex items-center justify-center relative overflow-hidden">
                      <span className="text-2xl text-light-custom font-medium">{num}</span>
                      <div className="absolute left-5 right-5 bottom-5 h-3 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-progress-custom rounded-full" style={{ width: pct + '%' }} />
                      </div>
                    </div>
                    <div className="mt-3 text-silver-custom text-xs">Lesson {num} ({pct}%)</div>
                  </button>
                );
              })}
            </div>
          );
        })()
      )}

      <AddCardModal
        isOpen={showAddCard}
        onClose={() => setShowAddCard(false)}
        onAdd={({ hanzi, pinyin, english }) => {
          const { addCard, selectedDeckId, setSelectedDeckId } = useFlashcardStore.getState();
          if (!selectedDeckId) setSelectedDeckId(deckId);
          addCard({ hanzi, pinyin: pinyin || '', english });
        }}
      />

      <EditDeckModal
        isOpen={showEditDeck}
        onClose={() => setShowEditDeck(false)}
        initialName={deck.name}
        initialDescription={deck.description}
        initialImage={(deck as any).image}
        onSave={({ name, description, image }) => {
          useFlashcardStore.getState().updateDeck(deckId, { name, description, image });
          setShowEditDeck(false);
          onToast('Deck saved');
        }}
      />
    </div>
  );
};

const CardsGrid: React.FC<{ deckId: string; onToast: (m: string) => void }> = ({ deckId, onToast }) => {
  const { getDeck, cards } = useFlashcardStore();
  const deck = getDeck(deckId);
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('[data-card-menu]')) return; // clicks inside menu
      setMenuOpenId(null);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  if (!deck) return null;
  const deckCards = cards.filter((c) => deck.cardIds.includes(c.id));

  if (deckCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8">
        <p className="text-gray-custom mb-4">No cards in this deck yet. Add your first card.</p>
      </div>
    );
  }

  const handleToggle = (id: string) => {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleRemove = (id: string) => {
    useFlashcardStore.getState().deleteCard(id);
    setMenuOpenId(null);
    onToast('Card removed');
  };

  const handleSave = (id: string, values: { hanzi: string; pinyin?: string; english: string }) => {
    useFlashcardStore.getState().updateCard(id, { hanzi: values.hanzi, pinyin: values.pinyin || '', english: values.english });
    setEditId(null);
    onToast('Card saved');
  };

  return (
    <div className="mt-6 grid grid-cols-4 gap-6">
      {deckCards.map((card) => {
        const isFlipped = flipped.has(card.id);
        return (
          <div key={card.id} className="relative group">
            <button
              onClick={() => handleToggle(card.id)}
              className="w-[164px] h-[196px] bg-granite-custom rounded-2xl flex items-center justify-center text-center px-3"
              title="Toggle card text"
            >
              <span className="text-light-custom text-sm leading-snug break-words w-full">
                {isFlipped ? card.english : card.hanzi}
              </span>
            </button>
            {/* Ellipsis visible on hover */}
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpenId((v) => v === card.id ? null : card.id); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full hidden group-hover:flex items-center justify-center hover:bg-gray-600 text-light-custom"
              aria-label="Card options"
            >
              ⋯
            </button>
            {menuOpenId === card.id && (
              <div data-card-menu className="absolute top-10 right-2 bg-granite-custom rounded-lg shadow-lg border border-gray-600 z-50 min-w-32">
                <div className="py-1">
                  <button onClick={() => { setEditId(card.id); setMenuOpenId(null); }} className="w-full px-4 py-2 text-left text-light-custom hover:bg-gray-600 transition-colors">Edit</button>
                  <button onClick={() => handleRemove(card.id)} className="w-full px-4 py-2 text-left text-red-300 hover:bg-gray-600 transition-colors">Remove</button>
                </div>
              </div>
            )}

            {editId === card.id && (
              <EditCardModal
                isOpen={true}
                onClose={() => setEditId(null)}
                initialHanzi={card.hanzi}
                initialPinyin={card.pinyin}
                initialEnglish={card.english}
                onSave={(vals) => handleSave(card.id, vals)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};


