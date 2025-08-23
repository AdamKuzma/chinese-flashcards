import React, { useEffect, useState } from 'react';
import { useFlashcardStore } from './store';
import { Flashcard, Toast } from './components';
import { dbOperations } from './database.ts';
import { ReviewQuality } from './types.ts';
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
    stopReview,
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

  const [activeTab, setActiveTab] = useState<'dashboard' | 'review' | 'browse' | 'add-card'>('dashboard');
  const [newCardForm, setNewCardForm] = useState({
    hanzi: '',
    pinyin: '',
    english: '',
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [editingCard, setEditingCard] = useState<{id: string, field: 'hanzi' | 'english'} | null>(null);
  const [editValue, setEditValue] = useState('');

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

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardForm.hanzi || !newCardForm.english) return;

    addCard({
      hanzi: newCardForm.hanzi,
      pinyin: newCardForm.pinyin || '', // Optional field, default to empty string
      english: newCardForm.english,
      due: Date.now() - 1000, // 1 second ago to ensure it's immediately due for review
      interval: 1,
      ease: 2.5,
      reps: 0,
    });
    setNewCardForm({ hanzi: '', pinyin: '', english: '' });
    
    // Show toast notification
    showToastMessage('Card added');
  };

  const handleStartReview = (reviewAllCards = false) => {
    const cardsAvailable = reviewAllCards ? allCards.length > 0 : dueCards.length > 0;
    if (cardsAvailable) {
      startReview(undefined, reviewAllCards);
      setActiveTab('review');
    }
  };

  const handleStopReview = () => {
    stopReview();
    setActiveTab('dashboard');
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
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
              onClick={() => setActiveTab('dashboard')}
              className={`px-12 py-2 rounded-t-lg border-b-1 ${
                activeTab === 'dashboard'
                  ? 'text-light-custom border-light-custom'
                  : 'text-gray-custom border-transparent'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`px-12 py-2 rounded-t-lg border-b-1 ${
                activeTab === 'review'
                  ? 'text-light-custom border-light-custom'
                  : 'text-gray-custom border-transparent'
              }`}
            >
              Review 
            </button>
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-12 py-2 rounded-t-lg border-b-1 ${
                activeTab === 'browse'
                  ? 'text-light-custom border-light-custom'
                  : 'text-gray-custom border-transparent'
              }`}
            >
              Browse
            </button>
            <button
              onClick={() => setActiveTab('add-card')}
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

      <main className="w-[700px] mx-auto px-4 py-8">
        <div className="w-full">
          {activeTab === 'dashboard' && (
            <div className="flex justify-between items-center">
              <h1 className="text-left">Profile</h1>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <span className="text-md text-silver-custom">Total Cards</span>
                  <span className="text-md text-light-custom font-medium">{cards.length}</span>
                </div>
                <div className="w-px h-4 border-granite-custom border-l"></div>
                <div className="flex items-center space-x-2">
                  <span className="text-md text-silver-custom">Due Today</span>
                  <span className="text-md text-light-custom font-medium">{dueCards.length}</span>
                </div>
                <div className="w-px h-4 border-granite-custom border-l"></div>
                <div className="flex items-center space-x-2">
                  <span className="text-md text-silver-custom">Reviews Today</span>
                  <span className="text-md text-light-custom font-medium">{todaysReviews}</span>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'dashboard' && (
              <div className="space-y-6">



            <div className="mt-24">
              <h3 className="text-md text-silver-custom text-left mb-4">Recent cards</h3>
              {cards.length === 0 ? (
                <p className="text-gray-500">No cards yet. Add your first card to get started!</p>
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
            <>
              <div className="space-y-6">
            {isReviewing && cardsToReview.length > 0 && currentCard ? (
              <>
                <div className="flex justify-between items-center mb-8">
                  <h1>Review</h1>
                  <div className="text-gray-custom">
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

                {currentCardIndex >= cardsToReview.length && (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">All caught up!</h3>
                    <p className="text-gray-600 mb-4">
                      {reviewAll ? 'You\'ve reviewed all cards!' : 'No more cards due for review today.'}
                    </p>
                    <button
                      onClick={handleStopReview}
                      className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                {dueCards.length > 0 ? (
                  <>
                    <h3 className="text-xl text-light-custom mb-2">Ready to Review!</h3>
                    <p className="text-sm text-silver-custom mb-12">You have {dueCards.length} card{dueCards.length !== 1 ? 's' : ''} due for review.</p>
                    <button
                      onClick={() => handleStartReview(false)}
                      className="btn-add px-4 py-1 bg-granite-custom text-light-custom font-medium rounded-lg"
                    >
                      Start Review
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl text-light-custom mb-2">No cards due</h3>
                    <p className="text-sm text-silver-custom mb-12">All caught up! Check back later for more reviews.</p>
                    <div className="flex justify-center gap-4">
                      {allCards.length > 0 && (
                        <button
                          onClick={() => handleStartReview(true)}
                          className="btn-add px-4 py-1 bg-granite-custom text-light-custom font-medium rounded-lg"
                        >
                          Review All Cards
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
              </div>
            </>
          )}

          {activeTab === 'browse' && (
            <>
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-left">Browse</h1>
                <div className="text-gray-custom">
                  {allCards.length} total cards
                </div>
              </div>
              <div className="space-y-0">
                {allCards.length === 0 ? (
                  <p className="text-gray-500">No cards yet. Add your first card to get started!</p>
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
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="w-8 h-8 flex items-center justify-center text-gray-custom hover:text-light-custom hover:bg-granite-custom rounded"
                        title="Delete card"
                      >
                        ×
                      </button>
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
                        onChange={(e) => setNewCardForm({ ...newCardForm, hanzi: e.target.value })}
                        className="input-custom focus-ring-gray-custom w-full px-3 py-2 bg-granite-custom rounded-lg focus:outline-none"
                        placeholder="你好"
                        required
                      />
                  </div>
                  <div>
                    <label className="block text-xs text-silver-custom mb-1 text-left">
                      Back
                    </label>
                      <input
                        type="text"
                        value={newCardForm.english}
                        onChange={(e) => setNewCardForm({ ...newCardForm, english: e.target.value })}
                        className="input-custom focus-ring-gray-custom w-full px-3 py-2 bg-granite-custom rounded-lg focus:outline-none"
                        placeholder="hello"
                        required
                      />
                  </div>
                </div>
                <div className="border-t border-granite-custom mt-12 pt-6">
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('dashboard')}
                      className="btn-cancel px-4 py-1.5 text-light-custom rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-add px-4 py-1.5 bg-granite-custom text-light-custom rounded-lg font-medium"
                    >
                      Add
                    </button>
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
    </div>
  );
}

export default App;