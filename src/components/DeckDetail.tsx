import React, { useState, useEffect } from 'react';
import { useFlashcardStore } from '../store';
import Button from './Button';
import { AddCardModal } from './AddCardModal';
import { EditDeckModal } from './EditDeckModal';
import { EditCardModal } from './EditCardModal';
import { PopoverMenu } from './PopoverMenu';
import PlusIcon from '../assets/Plus.svg';
import LockIcon from '../assets/Lock.svg';
import { ImportModal } from './ImportModal';
import type { Card } from '../types';
import type { Deck } from '../types';

interface DeckDetailProps {
  deckId: string;
  onStartLesson: (cardIds: string[]) => void;
  onDeleteDeck: () => void;
  onToast: (message: string) => void;
}

export const DeckDetail: React.FC<DeckDetailProps> = ({ deckId, onStartLesson, onDeleteDeck, onToast }) => {
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
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-6">
          <div 
            className="relative w-[64px] h-[76px] flex-shrink-0 group cursor-pointer"
            onClick={() => setShowEditDeck(true)}
          >
            <div className="absolute inset-0 bg-granite-custom rounded-lg -z-10 transition-transform rotate-[2deg] group-hover:rotate-[4deg]" />
            <div className="relative w-full h-full bg-granite-custom rounded-lg transition-transform transition-colors overflow-hidden flex items-center justify-center rotate-[-4deg] group-hover:rotate-[-6deg] group-hover:scale-102 group-hover:bg-granite-custom/80">
              {deck.image ? (
                <img src={deck.image} alt="Deck" className="w-full h-full object-cover" />
              ) : null}
            </div>
          </div>
          <div>
            <h2 className="text-left text-lg">{deck.name}</h2>
            {deck.description && (
              <p className="text-left text-sm text-gray-custom mt-1">{deck.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-3 items-start">
          {/* Review Button */}
          {deckCards.length > 0 && (
            <Button
              onClick={() => {
                const prioritizedIds = useFlashcardStore.getState().getPrioritizedDueCards(deckId, 20);
                if (prioritizedIds.length > 0) {
                  onStartLesson(prioritizedIds);
                } else {
                  onToast('No cards available for review');
                }
              }}
              size="md"
            >
              Review
            </Button>
          )}
          
          <button
            onClick={() => setShowAddCard(true)}
            className="deck-option-btn self-start add-cards-btn"
            aria-label="Add cards"
            title="Add cards"
          >
            <img src={PlusIcon} alt="Add cards" className="w-4 h-4 add-cards-icon" />
          </button>
          <PopoverMenu
            placement="bottom-right"
            trigger={({ onClick, ref }) => (
              <button
                onClick={onClick}
                ref={ref as React.RefObject<HTMLButtonElement>}
                className="deck-option-btn self-start"
                aria-label="Deck options"
                title="Deck options"
              >
                <span className="text-lg">⋯</span>
              </button>
            )}
            actions={[
              { key: 'edit', label: 'Edit deck', onClick: () => setShowEditDeck(true) },
              { key: 'export', label: 'Export deck', onClick: () => handleExportDeck() },
              { key: 'import', label: 'Import cards', onClick: () => setShowImportModal(true) },
              { key: 'delete', label: 'Delete deck', onClick: () => onDeleteDeck(), className: 'text-red-300' },
            ]}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-granite-custom">
        <nav className="flex gap-2">
          <button
            className={`py-2 text-md w-[130px] border-b-2 transition-colors duration-200 ${
              activeTab === 'lessons' 
                ? 'text-light-custom border-light-custom' 
                : 'text-gray-custom border-transparent hover:opacity-80'
            }`}
            onClick={() => setActiveTab('lessons')}
          >
            Lessons
          </button>
          <button
            className={`py-2.5 w-[130px] border-b-2 transition-colors duration-200 ${
              activeTab === 'cards' 
                ? 'text-light-custom border-light-custom' 
                : 'text-gray-custom border-transparent hover:opacity-80'
            }`}
            onClick={() => setActiveTab('cards')}
          >
            Cards ({deckCards.length})
          </button>
        </nav>
      </div>

      <div className="flex-1 pb-8 min-h-0 !overflow-y-auto overflow-x-visible -mr-8 pr-8">
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
              <div className="mt-8 -mx-8 px-8">
                <div className="grid grid-cols-4 gap-6 deck-detail-grid">
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

                  // Determine if lesson is locked
                  const isLocked = num > 1 && lessons.some(({ num: prevNum }) => {
                    if (prevNum >= num) return false;
                    const prevStart = (prevNum - 1) * lessonSize;
                    const prevEnd = prevStart + lessonSize;
                    const prevSlice = deckCards.slice(prevStart, prevEnd);
                    const prevReviewed = prevSlice.filter((c) => c.reps > 0).length;
                    return prevReviewed < prevSlice.length;
                  });

                  return (
                    <div key={num} className="relative">
                      <button
                        className="w-[160px] h-[190px] transition-transform duration-200 hover:scale-[1.02] disabled:hover:scale-100"
                        onClick={() => {
                          if (!isLocked) {
                            const ids = slice.map((c) => c.id);
                            onStartLesson(ids);
                          }
                        }}
                        disabled={isLocked}
                      >
                        <div className={`w-full h-full rounded-2xl flex items-center justify-center relative overflow-hidden ${isLocked ? 'bg-granite-custom opacity-50 cursor-default' : 'bg-granite-custom'}`}>
                          {isLocked ? (
                            <img src={LockIcon} alt="Locked" className="w-10 h-10 text-gray-custom" />
                          ) : (
                            <span className="text-2xl text-light-custom font-medium">{num}</span>
                          )}
                          {!isLocked && (
                            <div className="absolute left-5 right-5 bottom-5 h-2.5 bg-white/10 rounded-full">
                              <div 
                                className="h-full rounded-full" 
                                style={{ 
                                  width: pct + '%',
                                  backgroundColor: pct === 100 ? undefined : 'var(--color-progress)',
                                  background: pct === 100 ? 'linear-gradient(90deg, #F0CAAF 0%, #FF98FC 100%)' : 'var(--color-progress)',
                                  boxShadow: pct === 100 ? '0 0 4px rgba(240, 202, 175, 0.3), 0 0 8px rgba(255, 152, 252, 0.2)' : undefined
                                }} 
                              />
                            </div>
                          )}
                        </div>
                      </button>
                    </div>
                  );
                  })}
                </div>
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
          onToast('Card added');
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

  const handleSave = (id: string, values: { hanzi: string; english: string }) => {
    useFlashcardStore.getState().updateCard(id, { hanzi: values.hanzi, pinyin: '', english: values.english });
    setEditId(null);
    onToast('Card saved');
  };

  return (
    <div className="mt-8 -mx-8 px-8">
      <div className="grid grid-cols-4 gap-6 deck-detail-grid">
        {deckCards.map((card) => {
        const isFlipped = flipped.has(card.id);
        return (
          <div key={card.id} className="relative group h-[190px]">
            <button
              onClick={() => handleToggle(card.id)}
              className="w-[160px] h-[190px]"
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
                initialEnglish={card.english}
                onSave={(vals) => handleSave(card.id, vals)}
              />
            )}
          </div>
        );
        })}
      </div>
    </div>
  );
};


