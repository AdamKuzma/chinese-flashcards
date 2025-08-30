import React, { useEffect, useState } from 'react';
import { useFlashcardStore } from './store';
import { Toast, HelpModal, Button, EllipsisMenu, ImportModal, CreateDeckModal, DeckDetail, ReviewView, Nav } from './components';
import { dbOperations } from './database.ts';
// import { ReviewQuality } from './types.ts';
import { formatTimeUntilDue } from './utils';
// Icons are used inside Nav component
import PlusIcon from './assets/Plus.svg';
import './App.css';

function App() {
  const {
    cards,
    decks,
    // removed currentCardIndex for queue model
    // isShowingAnswer,
    // isReviewing,
    selectedDeckId,
    // reviewAll,
    startReview,
    // showAnswer,
    // reviewCard,
    // getDueCards,
    getAllCards,
    // nextCard,
    // previousCard,
    addCard,
    deleteCard,
    updateCard,
    // getTodaysReviewCount,
    exportData,
    importData,
    // new helpers
    // getCurrentCard,
    // getSessionPosition,
    setSelectedDeckId,
  } = useFlashcardStore();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'review' | 'browse' | 'add-card' | 'deck-detail'>(() => {
    const savedTab = localStorage.getItem('activeTab');
    return (savedTab as 'dashboard' | 'review' | 'browse' | 'add-card' | 'deck-detail') || 'dashboard';
  });
  const [newCardForm, setNewCardForm] = useState({
    hanzi: '',
    pinyin: '',
    english: '',
  });
  const [validationErrors, setValidationErrors] = useState({
    hanzi: '',
    english: '',
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [editingCard, setEditingCard] = useState<{id: string, field: 'hanzi' | 'english'} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCreateDeck, setShowCreateDeck] = useState(false);

  // Initialize sample data on first load
  useEffect(() => {
    const initializeData = async () => {
      try {
        await dbOperations.initializeSampleData();
        // Note: Zustand handles persistence via localStorage
        // Database is used for additional features and backup
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };

    initializeData();
    const toReview = () => handleTabChange('review');
    const toDeckDetail = () => handleTabChange('deck-detail');
    window.addEventListener('navigate-review', toReview as EventListener);
    window.addEventListener('navigate-deck-detail', toDeckDetail as EventListener);
    
    // Restore deck detail view if a deck was previously selected
    const savedTab = localStorage.getItem('activeTab');
    const savedDeckId = useFlashcardStore.getState().selectedDeckId;
    if (savedTab === 'deck-detail' && savedDeckId) {
      setActiveTab('deck-detail');
    }
    return () => {
      window.removeEventListener('navigate-review', toReview as EventListener);
      window.removeEventListener('navigate-deck-detail', toDeckDetail as EventListener);
    };
  }, []);

  const allCards = selectedDeckId ? getAllCards(selectedDeckId) : getAllCards();
  // Derived session values are handled inside ReviewView now

  // Validation functions
  const checkForDuplicateCard = (field: 'hanzi' | 'english', value: string) => {
    if (!value.trim()) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
      return;
    }

    const isDuplicate = cards.some(card => 
      card[field].toLowerCase().trim() === value.toLowerCase().trim()
    );

    if (isDuplicate) {
      const fieldName = field === 'hanzi' ? 'Front' : 'Back';
      setValidationErrors(prev => ({ 
        ...prev, 
        [field]: `This ${fieldName} text already exists in another card` 
      }));
    } else {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleInputBlur = (field: 'hanzi' | 'english', value: string) => {
    checkForDuplicateCard(field, value);
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardForm.hanzi || !newCardForm.english) return;
    if (decks.length === 0) {
      setShowCreateDeck(true);
      return;
    }
    if (!selectedDeckId && decks.length > 0) {
      setSelectedDeckId(decks[0].id);
    }
    
    // Check for duplicates before submitting
    const hanziExists = cards.some(card => 
      card.hanzi.toLowerCase().trim() === newCardForm.hanzi.toLowerCase().trim()
    );
    const englishExists = cards.some(card => 
      card.english.toLowerCase().trim() === newCardForm.english.toLowerCase().trim()
    );

    if (hanziExists || englishExists) {
      if (hanziExists) {
        setValidationErrors(prev => ({ 
          ...prev, 
          hanzi: 'This Front text already exists in another card' 
        }));
      }
      if (englishExists) {
        setValidationErrors(prev => ({ 
          ...prev, 
          english: 'This Back text already exists in another card' 
        }));
      }
      return;
    }

    addCard({
      hanzi: newCardForm.hanzi,
      pinyin: newCardForm.pinyin || '', // Optional field, default to empty string
      english: newCardForm.english,
    });
    setNewCardForm({ hanzi: '', pinyin: '', english: '' });
    setValidationErrors({ hanzi: '', english: '' });
    
    // Show toast notification
    showToastMessage('Card added');
  };

  // kept for add-card empty state actions
  // const handleStartReview = (reviewAllCards = false) => {
  //   const cardsAvailable = reviewAllCards ? allCards.length > 0 : dueCards.length > 0;
  //   if (cardsAvailable) {
  //     startReview(undefined, reviewAllCards);
  //     handleTabChange('review');
  //   }
  // };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleTabChange = (tab: 'dashboard' | 'review' | 'browse' | 'add-card' | 'deck-detail') => {
    setActiveTab(tab);
    localStorage.setItem('activeTab', tab);
  };

  const hideToast = () => {
    setShowToast(false);
  };

  const handleDeleteCard = (cardId: string) => {
    deleteCard(cardId);
    showToastMessage('Card removed');
  };

  const handleStartEdit = (cardId: string, field: 'hanzi' | 'english', currentValue: string) => {
    setEditingCard({ id: cardId, field });
    setEditValue(currentValue);
  };

  const handleSaveEdit = () => {
    if (editingCard && editValue.trim()) {
      updateCard(editingCard.id, { [editingCard.field]: editValue.trim() });
    }
    setEditingCard(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
    setEditValue('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  // const handleReview = (quality: ReviewQuality) => {
  //   if (currentCard) {
  //     reviewCard(quality);
  //   }
  // };

  const handleExport = () => {
    try {
      exportData();
      showToastMessage('Data exported successfully');
    } catch (error) {
      showToastMessage('Export failed');
    }
  };

  const handleImport = (data: any) => {
    try {
      importData(data);
      showToastMessage('Data imported successfully');
    } catch (error) {
      showToastMessage('Import failed');
    }
  };

  return (
    <div className="h-screen overflow-hidden">
      <div className="w-[780px] mx-auto h-screen border-l border-r border-granite-custom flex flex-col relative">
        <Nav onNavigate={handleTabChange} />

      <main className="px-8 pt-8 flex-1 flex flex-col min-h-0">
        <div className="w-full flex-1 min-h-0 flex flex-col">
          {activeTab === 'dashboard' && (
            <div className="flex justify-between items-center mb-12">
              <h1 className="text-left">Decks</h1>
            </div>
          )}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {decks.length === 0 ? (
                <div className="mt-24 text-center">
                  <h3 className="text-lg text-light-custom mb-2">No Decks Created</h3>
                  <p className="text-sm text-silver-custom mb-6">Create a new deck to start adding cards and learning.</p>
                  <Button onClick={() => setShowCreateDeck(true)} size="md">Create deck</Button>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-3 place-items-center gap-6">
                  {decks.map((deck, idx) => (
                    <button
                      key={deck.id}
                      className="text-left group"
                      onClick={() => {
                        setSelectedDeckId(deck.id);
                        handleTabChange('deck-detail');
                      }}
                    >
                      <div className="relative w-[164px] h-[196px]">
                        <div className={`absolute inset-0 bg-granite-custom rounded-2xl -z-10 transition-transform ${idx % 2 === 0 ? 'rotate-[2deg] group-hover:rotate-[4deg]' : 'rotate-[-2deg] group-hover:rotate-[-4deg]'}`} />
                        <div className={`relative w-full h-full bg-granite-custom rounded-2xl transition-transform transition-colors overflow-hidden flex items-center justify-center ${idx % 2 === 0 ? 'rotate-[-4deg] group-hover:rotate-[-6deg]' : 'rotate-[4deg] group-hover:rotate-[6deg]'} group-hover:scale-102 group-hover:bg-granite-custom/80`}>
                          {deck.image ? (
                            <img src={deck.image} alt="Deck" className="w-full h-full object-cover" />
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-6 text-light-custom text-sm truncate w-[164px] text-center">{deck.name}</div>
                    </button>
                  ))}
                  <button
                    onClick={() => setShowCreateDeck(true)}
                    className="text-left"
                    title="Create deck"
                    aria-label="Create deck"
                  >
                    <div className="w-[164px] h-[196px] flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-semidark-custom hover:bg-granite-custom transition-colors flex items-center justify-center">
                        <img src={PlusIcon} alt="Create deck" className="w-5 h-5" />
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'deck-detail' && selectedDeckId && (
            <DeckDetail
              deckId={selectedDeckId}
              onStartReview={(all) => { startReview(selectedDeckId, all); handleTabChange('review'); }}
              onAddCard={() => handleTabChange('add-card')}
              onDeleteDeck={() => {
                useFlashcardStore.getState().deleteDeck(selectedDeckId);
                setSelectedDeckId(undefined);
                handleTabChange('dashboard');
                setToastMessage('Deck deleted');
                setShowToast(true);
              }}
              onToast={(m) => { setToastMessage(m); setShowToast(true); }}
            />
          )}

          {activeTab === 'review' && (
            <div className="flex-1 min-h-0 overflow-y-auto -mr-8 pr-8">
              <div className="space-y-6">
                <ReviewView />
              </div>
            </div>
          )}

          {activeTab === 'browse' && (
            <>
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-left">Library</h1>
                <div className="text-gray-custom">
                  {allCards.length} total cards
                </div>
              </div>
              
              {/* Column Headers */}
              {allCards.length > 0 && (
                <div className="flex justify-between items-center py-3 border-b-1 border-granite-custom">
                  <div className="flex items-center flex-1">
                    <div className="w-20 text-left">
                      <span className="text-xs text-silver-custom font-medium">FRONT</span>
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-xs text-silver-custom font-medium">BACK</span>
                    </div>
                  </div>
                  <div className="w-42 text-right mr-8">
                    <span className="text-xs text-silver-custom font-medium">NEXT REVIEW</span>
                  </div>
                  <div className="w-8"></div>
                </div>
              )}
              
              <div className="space-y-0 max-h-140 overflow-y-auto">
                {allCards.length === 0 ? (
                  <p className="text-gray-custom">No cards yet. Add your first card to get started!</p>
                ) : (
                  allCards.map((card, index) => (
                    <div key={card.id} className={`flex justify-between items-center py-4 ${index < allCards.length - 1 ? 'border-b border-granite-custom' : ''}`}>
                      <div className="flex items-center flex-1">
                        <div className="w-20 text-left">
                          {editingCard?.id === card.id && editingCard?.field === 'hanzi' ? (
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyDown={handleEditKeyDown}
                              className="input-edit w-full px-2 py-1 bg-granite-custom rounded"
                              autoFocus
                            />
                          ) : (
                            <span 
                              className="font-medium text-light-custom cursor-pointer hover:bg-granite-custom px-2 py-1 rounded"
                              onDoubleClick={() => handleStartEdit(card.id, 'hanzi', card.hanzi)}
                            >
                              {card.hanzi}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          {editingCard?.id === card.id && editingCard?.field === 'english' ? (
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyDown={handleEditKeyDown}
                              className="input-edit w-full px-2 py-1 bg-granite-custom rounded"
                              autoFocus
                            />
                          ) : (
                            <span 
                              className="text-gray-custom cursor-pointer hover:bg-granite-custom px-2 py-1 rounded"
                              onDoubleClick={() => handleStartEdit(card.id, 'english', card.english)}
                            >
                              {card.english}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-42 text-right mr-8">
                        <span className={`text-sm ${card.due <= Date.now() ? 'text-silver-custom' : 'text-gray-custom'}`}>
                          {formatTimeUntilDue(card.due)}
                        </span>
                      </div>
                      <Button
                        onClick={() => handleDeleteCard(card.id)}
                        variant="cancel"
                        size="sm"
                        className="w-8 h-8 flex items-center justify-center text-gray-custom hover:text-light-custom hover:bg-granite-custom rounded"
                        title="Delete card"
                      >
                        ×
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === 'add-card' && (
            <>
              <div className="flex justify-between items-center mb-10">
                <h1 className="text-left">Add Card</h1>
              </div>
            <div className="">
              <form onSubmit={handleAddCard} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-silver-custom mb-1 text-left">
                      Front
                    </label>
                      <input
                        type="text"
                        value={newCardForm.hanzi}
                        onChange={(e) => {
                          setNewCardForm({ ...newCardForm, hanzi: e.target.value });
                          // Clear error when user starts typing
                          if (validationErrors.hanzi) {
                            setValidationErrors(prev => ({ ...prev, hanzi: '' }));
                          }
                        }}
                        onBlur={(e) => handleInputBlur('hanzi', e.target.value)}
                        className={`input-custom focus-ring-gray-custom w-full px-3 py-2 bg-granite-custom rounded-lg focus:outline-none ${
                          validationErrors.hanzi ? 'ring-1 ring-red-500' : ''
                        }`}
                        placeholder="你好"
                        required
                      />
                      {validationErrors.hanzi && (
                        <p className="text-red-400 text-xs mt-1 text-left">{validationErrors.hanzi}</p>
                      )}
                  </div>
                  <div>
                    <label className="block text-xs text-silver-custom mb-1 text-left">
                      Back
                    </label>
                      <input
                        type="text"
                        value={newCardForm.english}
                        onChange={(e) => {
                          setNewCardForm({ ...newCardForm, english: e.target.value });
                          // Clear error when user starts typing
                          if (validationErrors.english) {
                            setValidationErrors(prev => ({ ...prev, english: '' }));
                          }
                        }}
                        onBlur={(e) => handleInputBlur('english', e.target.value)}
                        className={`input-custom focus-ring-gray-custom w-full px-3 py-2 bg-granite-custom rounded-lg focus:outline-none ${
                          validationErrors.english ? 'ring-1 ring-red-500' : ''
                        }`}
                        placeholder="hello"
                        required
                      />
                      {validationErrors.english && (
                        <p className="text-red-400 text-xs mt-1 text-left">{validationErrors.english}</p>
                      )}
                  </div>
                </div>
                <div className="border-t border-granite-custom mt-12 pt-6">
                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      onClick={() => handleTabChange('dashboard')}
                      variant="cancel"
                      size="md"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="md"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </form>
            </div>
            </>
          )}
        </div>
      </main>
      
      {/* Toast Notification */}
      <Toast 
        message={toastMessage}
        show={showToast}
        onHide={hideToast}
      />

      {/* Help Button - Fixed position at bottom right */}
      <button
        onClick={() => setShowHelpModal(true)}
        className="fixed bottom-6 right-6 w-8 h-8 bg-granite-custom hover:bg-gray-600 text-light-custom rounded-full shadow-lg flex items-center justify-center transition-colors z-40"
        aria-label="Help"
        title="Help & Documentation"
      >
        <span className="text-md font-medium">?</span>
      </button>

      {/* Ellipsis Menu */}
      <EllipsisMenu 
        onExport={handleExport}
        onImport={() => setShowImportModal(true)}
      />

      {/* Import Modal */}
      <ImportModal 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />

      <CreateDeckModal
        isOpen={showCreateDeck}
        onClose={() => setShowCreateDeck(false)}
        onCreate={({ name, description, image }) => {
          const id = useFlashcardStore.getState().addDeck({ name, description, image });
          useFlashcardStore.getState().setSelectedDeckId(id);
          setShowCreateDeck(false);
          handleTabChange('deck-detail');
          setToastMessage('Deck created');
          setShowToast(true);
        }}
      />

      {/* Help Modal */}
      <HelpModal 
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
      </div>
    </div>
  );
}

export default App;