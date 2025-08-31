import React, { useState, useEffect } from 'react';
import { useFlashcardStore } from '../store';
import Button from './Button';
import { AddCardModal } from './AddCardModal';
import { EditDeckModal } from './EditDeckModal';
import { EditCardModal } from './EditCardModal';
import { PopoverMenu } from './PopoverMenu';
import ShareIcon from '../assets/Share.svg';
import { ImportModal } from './ImportModal';
import type { Card } from '../types';
import type { Deck } from '../types';

interface DeckDetailProps {
  deckId: string;
  onStartReview: (reviewAll: boolean) => void;
  onAddCard: () => void;
  onDeleteDeck: () => void;
  onToast: (message: string) => void;
}

export const DeckDetail: React.FC<DeckDetailProps> = ({ deckId, onDeleteDeck, onToast }) => {
  const { getDeck, cards } = useFlashcardStore();
  const deck = getDeck(deckId);
  // deprecated with PopoverMenu, retained if needed elsewhere
  const [activeTab, setActiveTab] = useState<'lessons' | 'cards'>('lessons');
  const [showAddCard, setShowAddCard] = useState(false);
  const [showEditDeck, setShowEditDeck] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // No-op
  useEffect(() => {}, []);

  if (!deck) {
    return <div className="text-gray-custom">Deck not found.</div>;
  }

  const deckCards = cards.filter((c) => deck.cardIds.includes(c.id));
  const now = Date.now();
  const newCount = deckCards.filter((c) => {
    const card = c as Card & { fsrsState?: string };
    return card.fsrsState === 'New' || (!('fsrsState' in card) && c.reps === 0);
  }).length;
  const dueCount = deckCards.filter((c) => {
    const card = c as Card & { fsrsState?: string };
    return c.due <= now && !c.suspended && (card.fsrsState !== 'New' && ('fsrsState' in card || c.reps > 0));
  }).length;
  const learnedCount = deckCards.filter((c) => {
    const card = c as Card & { fsrsState?: string };
    return (card.fsrsState === 'Review' || card.fsrsState === 'Relearning') && c.due > now;
  }).length;

  const handleExportDeck = () => {
    try {
      const deckData = {
        deck: deck,
        cards: deckCards
      };
      const dataStr = JSON.stringify(deckData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${deck.name}-export.json`;
      link.click();
      URL.revokeObjectURL(url);
      onToast('Deck exported successfully');
    } catch {
      onToast('Export failed');
    }
  };

  return (
    <div className="mt-[-4px] relative h-full min-h-0 flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-6">
          <div className="w-[112px] h-[134px] bg-granite-custom rounded-xl overflow-hidden flex-shrink-0">
            {deck.image && (
              <img src={deck.image} alt="Deck" className="w-full h-full object-cover" />
            )}
          </div>
          <div>
            <h2 className="text-left text-lg">{deck.name}</h2>
            <div className="text-sm text-left text-silver-custom mt-2 flex items-center gap-3">
              <span>New: {newCount}</span>
              <span className="text-gray-custom">|</span>
              <span>Due: {dueCount}</span>
              <span className="text-gray-custom">|</span>
              <span>Learned: {learnedCount}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <PopoverMenu
            placement="bottom-right"
            trigger={({ onClick, ref }) => (
              <button
                onClick={onClick}
                ref={ref as React.RefObject<HTMLButtonElement>}
                className="deck-option-btn"
                aria-label="Deck options"
                title="Deck options"
              >
                <span className="text-lg">⋯</span>
              </button>
            )}
            actions={[
              { key: 'add', label: 'Add cards', onClick: () => setShowAddCard(true) },
              { key: 'edit', label: 'Edit deck', onClick: () => setShowEditDeck(true) },
              { key: 'delete', label: 'Delete deck', onClick: () => onDeleteDeck(), className: 'text-red-300' },
            ]}
          />
          <PopoverMenu
            placement="bottom-right"
            trigger={({ onClick, ref }) => (
              <button
                onClick={onClick}
                ref={ref as React.RefObject<HTMLButtonElement>}
                className="deck-option-btn"
                aria-label="Share options"
                title="Share options"
              >
                <img src={ShareIcon} alt="Share" className="w-4 h-4" />
              </button>
            )}
            actions={[
              { key: 'export', label: 'Export deck', onClick: () => handleExportDeck() },
              { key: 'import', label: 'Import cards', onClick: () => setShowImportModal(true) },
            ]}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-granite-custom -mx-8 px-8">
        <nav className="flex gap-6">
          <button
            className={`py-2 w-[110px] border-b-2 transition-colors duration-200 ${
              activeTab === 'lessons' 
                ? 'text-light-custom border-light-custom' 
                : 'text-gray-custom border-transparent hover:opacity-80'
            }`}
            onClick={() => setActiveTab('lessons')}
          >
            Lessons
          </button>
          <button
            className={`py-2 w-[110px] border-b-2 transition-colors duration-200 ${
              activeTab === 'cards' 
                ? 'text-light-custom border-light-custom' 
                : 'text-gray-custom border-transparent hover:opacity-80'
            }`}
            onClick={() => setActiveTab('cards')}
          >
            Cards
          </button>
        </nav>
      </div>

      <div className="flex-1 pb-8 min-h-0 overflow-y-auto -mr-8 pr-8">
        {/* Tab content */}
        {activeTab === 'cards' ? (
          <CardsGrid deckId={deckId} onToast={onToast} onOpenAddCard={() => setShowAddCard(true)} />
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
              <div className="mt-8 grid grid-cols-4 gap-4">
                {lessons.map(({ num }) => {
                  const start = (num - 1) * lessonSize;
                  const end = start + lessonSize;
                  const slice = deckCards.slice(start, end);
                  const now = Date.now();
                  const learned = slice.filter((c) => {
                    const card = c as Card & { fsrsState?: string };
                    return (card.fsrsState === 'Review' || card.fsrsState === 'Relearning') && c.due > now;
                  }).length;
                  const total = slice.length || 1;
                  const pct = Math.max(0, Math.min(100, Math.round((learned / total) * 100)));

                  return (
                    <div key={num} className="relative">
                      <button
                        className="w-[164px] h-[196px]"
                        onClick={() => {
                          const ids = slice.map((c) => c.id);
                          useFlashcardStore.getState().startReviewWithCardIds(ids);
                          const evt = new CustomEvent('navigate-review');
                          window.dispatchEvent(evt);
                        }}
                      >
                        <div className="w-full h-full bg-granite-custom rounded-2xl flex items-center justify-center relative overflow-hidden">
                          <span className="text-2xl text-light-custom font-medium">{num}</span>
                          <div className="absolute left-5 right-5 bottom-5 h-2.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-progress-custom rounded-full" style={{ width: pct + '%' }} />
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })()
        )}
      </div>

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
        initialImage={(deck as Deck & { image?: string }).image}
        onSave={({ name, description, image }) => {
          useFlashcardStore.getState().updateDeck(deckId, { name, description, image });
          setShowEditDeck(false);
          onToast('Deck saved');
        }}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={(data) => {
          try {
            // Handle deck-specific import logic
            const { addCard, addCardToDeck } = useFlashcardStore.getState();
            
            if ('cards' in data && Array.isArray(data.cards)) {
              let importedCount = 0;
              
              data.cards.forEach((cardData) => {
                try {
                  // Create new card with proper structure
                  const newCardId = addCard({
                    hanzi: cardData.hanzi,
                    pinyin: cardData.pinyin || '',
                    english: cardData.english,
                  });
                  
                  // Add card to current deck
                  addCardToDeck(deckId, newCardId);
                  importedCount++;
                } catch (error) {
                  console.error('Failed to import card:', cardData, error);
                }
              });
              
              if (importedCount > 0) {
                onToast(`Successfully imported ${importedCount} card${importedCount !== 1 ? 's' : ''}`);
              } else {
                onToast('No cards were imported');
              }
            } else {
              onToast('Invalid import format. Please select a valid deck export file.');
            }
            
            setShowImportModal(false);
          } catch (error) {
            console.error('Import failed:', error);
            onToast('Import failed. Please check the file format.');
          }
        }}
      />
    </div>
  );
};

const CardsGrid: React.FC<{ deckId: string; onToast: (m: string) => void; onOpenAddCard: () => void }> = ({ deckId, onToast, onOpenAddCard }) => {
  const { getDeck, cards } = useFlashcardStore();
  const deck = getDeck(deckId);
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  // deprecated: was used for manual popover control
  const [editId, setEditId] = useState<string | null>(null);

  // No manual menu state to clear anymore
  useEffect(() => {}, []);

  if (!deck) return null;
  const deckCards = cards.filter((c) => deck.cardIds.includes(c.id));

  if (deckCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8">
        <p className="text-gray-custom mb-4">No cards in this deck yet. Add your first card.</p>
        <Button onClick={onOpenAddCard} size="sm">Add cards</Button>
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
    onToast('Card removed');
  };

  const handleSave = (id: string, values: { hanzi: string; pinyin?: string; english: string }) => {
    useFlashcardStore.getState().updateCard(id, { hanzi: values.hanzi, pinyin: values.pinyin || '', english: values.english });
    setEditId(null);
    onToast('Card saved');
  };

  return (
    <div className="mt-8 grid grid-cols-4 gap-4">
      {deckCards.map((card) => {
        const isFlipped = flipped.has(card.id);
        return (
          <div key={card.id} className="relative group h-[196px]">
            <button
              onClick={() => handleToggle(card.id)}
              className="w-[164px] h-[196px]"
              title="Toggle card text"
            >
              <div className="w-full h-full perspective-1000">
                <div className={`relative w-full h-full preserve-3d transition-transform duration-300 ${isFlipped ? 'rotate-y-180' : ''}`}>
                  {/* Front of card */}
                  <div className="absolute inset-0 bg-granite-custom rounded-2xl flex items-center justify-center text-center px-3 backface-hidden">
                    <span className="text-light-custom text-2xl leading-snug break-words w-full">
                      {card.hanzi}
                    </span>
                  </div>
                  {/* Back of card */}
                  <div className="absolute inset-0 bg-granite-custom rounded-2xl flex items-center justify-center text-center px-3 backface-hidden" style={{ transform: 'rotateY(180deg)' }}>
                    <span className="text-light-custom text-xl leading-snug break-words w-full">
                      {card.english}
                    </span>
                  </div>
                </div>
              </div>
            </button>
            {/* Ellipsis visible on hover */}
            <div className="absolute top-2 right-2">
              <PopoverMenu
                className="relative"
                placement="bottom-right"
                trigger={({ onClick, ref }) => (
                  <button
                    onClick={(e) => { e.stopPropagation(); onClick(); }}
                    ref={ref as React.RefObject<HTMLButtonElement>}
                    className="w-7 h-7 rounded-lg hidden group-hover:flex items-center justify-center hover:bg-neutral-700 text-light-custom"
                    aria-label="Card options"
                  >
                    ⋯
                  </button>
                )}
                actions={[
                  { key: 'edit', label: 'Edit', onClick: () => { setEditId(card.id); } },
                  { key: 'remove', label: 'Remove', onClick: () => handleRemove(card.id), className: 'text-red-300' },
                ]}
              />
            </div>

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


