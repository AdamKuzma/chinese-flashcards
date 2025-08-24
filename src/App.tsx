import React, { useEffect, useState } from 'react';
import { useFlashcardStore } from './store';
import { Flashcard, Toast, HelpModal, Button } from './components';
import { dbOperations } from './database.ts';
import { ReviewQuality } from './types.ts';
import { formatTimeUntilDue } from './utils';
import './App.css';

function App() {
  const {
    cards,
    currentCardIndex,
    isShowingAnswer,
    isReviewing,
    selectedDeckId,
    reviewAll,
    startReview,
    showAnswer,
    reviewCard,
    getDueCards,
    getAllCards,
    nextCard,
    previousCard,
    addCard,
    deleteCard,
    updateCard,
    getTodaysReviewCount,
  } = useFlashcardStore();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'review' | 'browse' | 'add-card'>(() => {
    const savedTab = localStorage.getItem('activeTab');
    return (savedTab as 'dashboard' | 'review' | 'browse' | 'add-card') || 'dashboard';
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
  }, []);

  const dueCards = selectedDeckId ? getDueCards(selectedDeckId) : getDueCards();
  const allCards = selectedDeckId ? getAllCards(selectedDeckId) : getAllCards();
  const cardsToReview = reviewAll ? allCards : dueCards;
  const currentCard = cardsToReview[currentCardIndex];
  const todaysReviews = getTodaysReviewCount();

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

  const handleStartReview = (reviewAllCards = false) => {
    const cardsAvailable = reviewAllCards ? allCards.length > 0 : dueCards.length > 0;
    if (cardsAvailable) {
      startReview(undefined, reviewAllCards);
      handleTabChange('review');
    }
  };



  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleTabChange = (tab: 'dashboard' | 'review' | 'browse' | 'add-card') => {
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

  const handleReview = (quality: ReviewQuality) => {
    if (currentCard) {
      reviewCard(quality);
    }
  };

  return (
    <div className="h-screen overflow-hidden">

      {/* Tabs */}

      <header className="">
        <div className="w-[700px] mx-auto px-4 py-4">
                     <nav className="mt-4 flex justify-center border-b border-granite-custom">
            <button
              onClick={() => handleTabChange('dashboard')}
              className={`px-12 py-2 rounded-t-lg border-b-1 ${
                activeTab === 'dashboard'
                  ? 'text-light-custom border-light-custom'
                  : 'text-gray-custom border-transparent'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => handleTabChange('review')}
              className={`px-12 py-2 rounded-t-lg border-b-1 ${
                activeTab === 'review'
                  ? 'text-light-custom border-light-custom'
                  : 'text-gray-custom border-transparent'
              }`}
            >
              Review 
            </button>
            <button
              onClick={() => handleTabChange('browse')}
              className={`px-12 py-2 rounded-t-lg border-b-1 ${
                activeTab === 'browse'
                  ? 'text-light-custom border-light-custom'
                  : 'text-gray-custom border-transparent'
              }`}
            >
              Browse
            </button>
            <button
              onClick={() => handleTabChange('add-card')}
              className={`px-12 py-2 rounded-t-lg border-b-1 ${
                activeTab === 'add-card'
                  ? 'text-light-custom border-light-custom'
                  : 'text-gray-custom border-transparent'
              }`}
            >
              Add
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}

      <main className="w-[700px] mx-auto px-4 pt-8">
        <div className="w-full">
          {activeTab === 'dashboard' && (
            <div className="flex justify-between items-center">
              <h1 className="text-left">Profile</h1>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-silver-custom">Total</span>
                  <span className="text-sm text-light-custom font-medium">{cards.length}</span>
                </div>
                <div className="w-px h-4 border-granite-custom border-l"></div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-silver-custom">Due</span>
                  <span className="text-sm text-light-custom font-medium">{dueCards.length}</span>
                </div>
                <div className="w-px h-4 border-granite-custom border-l"></div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-silver-custom">Review</span>
                  <span className="text-sm text-light-custom font-medium">{todaysReviews}</span>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="mt-24">
                <h3 className="text-sm text-silver-custom text-left mb-4">Recent cards</h3>
                {cards.length === 0 ? (
                  <p className="text-gray-custom">No cards yet. Add your first card to get started!</p>
                ) : (
                    <div className="space-y-0">
                      {cards.slice(0, 5).map((card, index) => (
                        <div key={card.id} className={`flex justify-between items-center py-4 ${index < cards.slice(0, 5).length - 1 ? 'border-b border-granite-custom' : ''}`}>
                          <div className="flex items-center flex-1">
                            <div className="w-20 text-left">
                              <span className="font-medium text-light-custom">{card.hanzi}</span>
                            </div>
                            <div className="flex-1 text-left">
                              <span className="text-gray-custom">{card.english}</span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-custom w-20 text-right">
                            {card.reps} reviews
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'review' && (
            <div className="h-[calc(100vh-140px)] overflow-y-auto">
              <div className="space-y-6">
            {isReviewing && cardsToReview.length > 0 && currentCard ? (
              <>
                <div className="flex justify-between items-center mb-8">
                  <h1>Review</h1>
                  <div className="text-gray-custom text-sm">
                    {reviewAll ? 'All cards' : 'Due cards'} - {currentCardIndex + 1} of {cardsToReview.length}
                  </div>
                </div>

                <Flashcard
                  card={currentCard}
                  isShowingAnswer={isShowingAnswer}
                  onShowAnswer={showAnswer}
                  onReview={handleReview}
                  onNext={nextCard}
                  onPrevious={previousCard}
                  showNavigation={cardsToReview.length > 1}
                />


              </>
            ) : (
              <div className="text-center py-12">
                {dueCards.length > 0 ? (
                  <>
                    <img src="/src/assets/coffee.png" alt="Coffee" className="w-24 h-24 mx-auto mb-4" />
                    <h3 className="text-xl text-light-custom mb-2">Ready to review!</h3>
                    <p className="text-sm text-silver-custom mb-12">You have {dueCards.length} card{dueCards.length !== 1 ? 's' : ''} due for review.</p>
                    <Button
                      onClick={() => handleStartReview(false)}
                      size="sm"
                    >
                      Start Review
                    </Button>
                  </>
                ) : (
                  <>
                    <img src="/src/assets/cat.png" alt="Cat" className="w-24 h-24 mx-auto mb-4" />
                    <h3 className="text-xl text-light-custom mb-2">No cards due</h3>
                    <p className="text-sm text-silver-custom mb-12">All caught up! Check back later for more reviews.</p>
                    <div className="flex justify-center gap-4">
                      {allCards.length > 0 && (
                        <Button
                          onClick={() => handleStartReview(true)}
                          size="sm"
                        >
                          Review Cards
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
              </div>
            </div>
          )}

          {activeTab === 'browse' && (
            <>
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-left">Browse</h1>
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

      {/* Help Modal */}
      <HelpModal 
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </div>
  );
}

export default App;