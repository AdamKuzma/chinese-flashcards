import React, { useEffect, useState } from 'react';
import { useFlashcardStore } from './store';
import { Flashcard } from './components';
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
    getTodaysReviewCount,
  } = useFlashcardStore();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'review' | 'add-card'>('dashboard');
  const [newCardForm, setNewCardForm] = useState({
    hanzi: '',
    pinyin: '',
    english: '',
  });

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
    if (!newCardForm.hanzi || !newCardForm.pinyin || !newCardForm.english) return;

    addCard({
      ...newCardForm,
      due: Date.now() - 1000, // 1 second ago to ensure it's immediately due for review
      interval: 1,
      ease: 2.5,
      reps: 0,
    });
    setNewCardForm({ hanzi: '', pinyin: '', english: '' });
    setActiveTab('dashboard');
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

  const handleReview = (quality: ReviewQuality) => {
    if (currentCard) {
      reviewCard(quality);
    }
  };

  return (
    <div className="h-screen overflow-hidden">

      {/* Tabs */}

      <header className="">
        <div className="w-[620px] mx-auto px-4 py-4">
          <nav className="mt-4 flex space-x-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'dashboard'
                  ? '!bg-[#212121] text-white'
                  : '!bg-[#212121] text-white hover:!bg-[#2a2a2a]'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'review'
                  ? '!bg-[#212121] text-white'
                  : '!bg-[#212121] text-white hover:!bg-[#2a2a2a]'
              }`}
            >
              Review 
            </button>
            <button
              onClick={() => setActiveTab('add-card')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'add-card'
                  ? '!bg-[#212121] text-white'
                  : '!bg-[#212121] text-white hover:!bg-[#2a2a2a]'
              }`}
            >
              Add
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}

      <main className="w-[620px] bg-[#212121] mx-auto px-4 py-8">
        <div className="w-full">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#181818] p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-white">Total Cards</h3>
                <p className="text-3xl font-bold text-blue-600">{cards.length}</p>
              </div>
              <div className="bg-[#181818] p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-white">Due Today</h3>
                <p className="text-3xl font-bold text-orange-600">{dueCards.length}</p>
              </div>
              <div className="bg-[#181818] p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-white">Reviews Today</h3>
                <p className="text-3xl font-bold text-green-600">{todaysReviews}</p>
              </div>
            </div>



            <div className="bg-[#181818] p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Cards</h3>
              {cards.length === 0 ? (
                <p className="text-gray-500">No cards yet. Add your first card to get started!</p>
              ) : (
                <div className="space-y-2">
                  {cards.slice(0, 5).map((card) => (
                    <div key={card.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <span className="font-bold text-lg">{card.hanzi}</span>
                        <span className="text-blue-600 ml-2">{card.pinyin}</span>
                        <span className="text-gray-600 ml-2">• {card.english}</span>
                      </div>
                      <div className="text-sm text-gray-500">
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
            <div className="space-y-6">
            {isReviewing && cardsToReview.length > 0 && currentCard ? (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Review Session</h2>
                  <button
                    onClick={handleStopReview}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    End Review
                  </button>
                </div>

                <div className="text-center text-gray-600 mb-4">
                  Card {currentCardIndex + 1} of {cardsToReview.length} {reviewAll ? '(all cards)' : '(due cards)'}
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
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Ready to Review!</h3>
                    <p className="text-gray-600 mb-4">You have {dueCards.length} card{dueCards.length !== 1 ? 's' : ''} due for review.</p>
                    <button
                      onClick={() => handleStartReview(false)}
                      className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Start Review ({dueCards.length} cards)
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No cards due</h3>
                    <p className="text-gray-600 mb-4">All caught up! Check back later for more reviews.</p>
                    <div className="flex justify-center gap-4">
                      {allCards.length > 0 && (
                        <button
                          onClick={() => handleStartReview(true)}
                          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        >
                          Review All Cards ({allCards.length})
                        </button>
                      )}
                      <button
                        onClick={() => setActiveTab('dashboard')}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        Back to Dashboard
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

          {activeTab === 'add-card' && (
            <div className="max-w-md mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Add New Card</h2>
              <form onSubmit={handleAddCard} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chinese Characters (Hanzi)
                  </label>
                  <input
                    type="text"
                    value={newCardForm.hanzi}
                    onChange={(e) => setNewCardForm({ ...newCardForm, hanzi: e.target.value })}
                    className="text-gray-800 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="你好"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pinyin
                  </label>
                  <input
                    type="text"
                    value={newCardForm.pinyin}
                    onChange={(e) => setNewCardForm({ ...newCardForm, pinyin: e.target.value })}
                    className="text-gray-800 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="nǐ hǎo"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    English Translation
                  </label>
                  <input
                    type="text"
                    value={newCardForm.english}
                    onChange={(e) => setNewCardForm({ ...newCardForm, english: e.target.value })}
                    className="text-gray-800 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="hello"
                    required
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Add Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;