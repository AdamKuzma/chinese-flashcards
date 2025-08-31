import React, { useState, useEffect } from 'react';
import { useFlashcardStore } from '../store';
import { Flashcard, Button, Modal } from './index';

export const ReviewView: React.FC = () => {
  const [lastCompletedDeckId, setLastCompletedDeckId] = useState<string | null>(null);
  const [showQuitModal, setShowQuitModal] = useState(false);

  const {
    isReviewing,
    reviewAll,
    getCurrentCard,
    getSessionPosition,
    showAnswer,
    reviewCard,
    nextCard,
    previousCard,
    getDueCards,
    getAllCards,
    sessionInitialCount,
    selectedDeckId,
  } = useFlashcardStore();

  const currentCard = getCurrentCard();
  const { total } = getSessionPosition();
  const dueCards = getDueCards();
  const allCards = getAllCards();
  const cardsToReview = reviewAll ? allCards : dueCards;

  // Track the deck ID when a session is active
  useEffect(() => {
    if (isReviewing && selectedDeckId) {
      setLastCompletedDeckId(selectedDeckId);
    }
  }, [isReviewing, selectedDeckId]);

  // Use the last known deck ID if selectedDeckId is not available
  const effectiveDeckId = selectedDeckId || lastCompletedDeckId;

  const handleBackToDeck = () => {
    console.log('handleBackToDeck called');
    
    // Restore the deck ID so the deck detail view can display properly
    if (lastCompletedDeckId) {
      useFlashcardStore.getState().setSelectedDeckId(lastCompletedDeckId);
    }
    
    // Navigate back to deck detail view
    const evt = new CustomEvent('navigate-deck-detail');
    window.dispatchEvent(evt);
    console.log('Navigate to deck detail event dispatched');
  };

  const handleShowQuitModal = () => {
    setShowQuitModal(true);
  };

  const handleCancelQuit = () => {
    setShowQuitModal(false);
  };

  const handleConfirmQuit = () => {
    setShowQuitModal(false);
    handleBackToDeck();
  };

  if (!(isReviewing && cardsToReview.length > 0 && currentCard)) {
    // Not actively reviewing - always show completion state
    
    // Always show completion state when not actively reviewing
    return (
      <>
        <div className="flex justify-between items-center mb-16">
          <button 
            onClick={handleBackToDeck}
            className="w-8 h-8 flex text-lg items-center justify-center text-silver-custom hover:bg-white/10 rounded-lg transition-colors"
            title="Back to deck"
          >
            ✕
          </button>
          <div className="flex-1 px-16">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-progress-custom rounded-full transition-all duration-300 ease-out" style={{ width: '100%' }} />
            </div>
          </div>
          <div className="text-gray-custom text-sm text-right w-16">
            {effectiveDeckId ? (() => {
              const lessonSize = 10;
              const deckCards = getAllCards(effectiveDeckId);
              const lessonCards = deckCards.slice(0, lessonSize);
              return `${lessonCards.length} of ${lessonCards.length}`;
            })() : '0 of 0'}
          </div>
        </div>
        
        <div className="text-center py-12">
          <img src="/assets/cat.png" alt="Cat" className="w-24 h-24 mx-auto mb-4" />
          <h3 className="text-xl text-light-custom mb-2">Session Complete!</h3>
          <p className="text-sm text-silver-custom mb-12">
            You've finished this lesson
          </p>
          <div className="flex justify-center">
            <Button onClick={handleBackToDeck} variant="primary" size="sm">Back to deck</Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-16">
        <button 
          onClick={handleShowQuitModal}
          className="w-8 h-8 flex text-lg items-center justify-center text-silver-custom hover:bg-white/10 rounded-lg transition-colors"
          title="Back to deck"
        >
          ✕
        </button>
        <div className="flex-1 px-16">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-progress-custom rounded-full transition-all duration-300 ease-out" style={{ width: `${Math.max(0, Math.min(100, Math.round(((sessionInitialCount - total) / Math.max(1, sessionInitialCount)) * 100)))}%` }} />
          </div>
        </div>
        <div className="text-gray-custom text-sm text-right w-16">
          {effectiveDeckId ? (() => {
            const lessonSize = 10;
            const deckCards = getAllCards(effectiveDeckId);
            const lessonCards = deckCards.slice(0, lessonSize);
            return `${lessonCards.length} of ${lessonCards.length}`;
          })() : '0 of 0'}
        </div>
      </div>

      <Flashcard
        card={currentCard}
        isShowingAnswer={useFlashcardStore.getState().isShowingAnswer}
        onShowAnswer={showAnswer}
        onReview={reviewCard}
        onNext={nextCard}
        onPrevious={previousCard}
        showNavigation={total > 1}
      />

      {/* Quit confirmation modal */}
      <Modal
        isOpen={showQuitModal}
        onClose={handleCancelQuit}
        maxWidthClassName="max-w-sm"
        hideHeader={true}
        actions={[
          {
            label: "Cancel",
            onClick: handleCancelQuit,
            variant: "secondary",
            size: "sm"
          },
          {
            label: "Quit",
            onClick: handleConfirmQuit,
            size: "sm"
          }
        ]}
      >
        <p className="text-light-custom text-center mt-6 mb-10">
          Are you sure you want to quit?
        </p>
      </Modal>
    </>
  );
};

export default ReviewView;