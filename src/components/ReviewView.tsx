import React, { useState, useEffect } from 'react';
import { useFlashcardStore } from '../store';
import { Flashcard, Button, Modal } from './index';
import catImage from '../assets/cat.png';

export const ReviewView: React.FC = () => {
  const [lastCompletedDeckId, setLastCompletedDeckId] = useState<string | null>(null);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [completedSessionCount, setCompletedSessionCount] = useState<number>(0);
  const [showCompletionState, setShowCompletionState] = useState(false);

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

  // Track the session count when it's active
  useEffect(() => {
    if (sessionInitialCount > 0) {
      setCompletedSessionCount(sessionInitialCount);
    }
  }, [sessionInitialCount]);

  // Check if review session is completed
  useEffect(() => {
    if (!isReviewing && completedSessionCount > 0 && total === 0) {
      setShowCompletionState(true);
    }
  }, [isReviewing, completedSessionCount, total]);

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

  // Show completion state when review is finished
  if (showCompletionState) {
    return (
      <>
        {/* Keep the header with progress bar */}
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
              <div className="h-full bg-progress-custom rounded-full transition-all duration-300 ease-out" style={{ width: '100%' }} />
            </div>
          </div>
          <div className="text-gray-custom text-sm text-right w-16">
            {completedSessionCount} of {completedSessionCount}
          </div>
        </div>

        {/* Success state with cat image */}
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="mb-8">
            <img src={catImage} alt="Success!" className="w-32 h-32 mx-auto mb-6" />
            <h2 className="text-xl text-light-custom mb-2">Review Complete!</h2>
            <p className="text-gray-custom text-sm">
              You've completed {completedSessionCount} card{completedSessionCount !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="flex gap-4">
            <Button
              onClick={handleBackToDeck}
              variant="primary"
              size="md"
            >
              Back to Deck
            </Button>
          </div>
        </div>

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
  }

  if (!isReviewing) {
    // Not reviewing - don't show anything
    console.log('ReviewView: Not reviewing, returning null');
    console.log('Debug state:', { isReviewing, cardsToReviewLength: cardsToReview.length, currentCard: !!currentCard });
    return null;
  }

  // Debug what's happening with the review state
  console.log('ReviewView: isReviewing is true, but checking cards...');
  console.log('Debug state:', { 
    isReviewing, 
    cardsToReviewLength: cardsToReview.length, 
    currentCard: !!currentCard,
    sessionInitialCount,
    total,
    effectiveDeckId
  });

  // If we're reviewing but don't have cards yet, just show the review interface anyway
  // The cards should load shortly
  console.log('ReviewView: Showing review interface (cards may still be loading)');

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
          {(sessionInitialCount > 0 ? sessionInitialCount : completedSessionCount) > 0 
            ? `${(sessionInitialCount > 0 ? sessionInitialCount - total + 1 : completedSessionCount - total + 1)} of ${sessionInitialCount > 0 ? sessionInitialCount : completedSessionCount}` 
            : '0 of 0'}
        </div>
      </div>

      <Flashcard
        card={currentCard!}
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