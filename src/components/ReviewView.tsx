import React from 'react';
import { useFlashcardStore } from '../store';
import { Flashcard, Button } from './index';

export const ReviewView: React.FC = () => {
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
  } = useFlashcardStore();

  const currentCard = getCurrentCard();
  const { index, total } = getSessionPosition();
  const dueCards = getDueCards();
  const allCards = getAllCards();
  const cardsToReview = reviewAll ? allCards : dueCards;

  if (!(isReviewing && cardsToReview.length > 0 && currentCard)) {
    return (
      <div className="text-center py-12">
        {dueCards.length > 0 ? (
          <>
            <img src="/assets/coffee.png" alt="Coffee" className="w-24 h-24 mx-auto mb-4" />
            <h3 className="text-xl text-light-custom mb-2">Ready to review!</h3>
            <p className="text-sm text-silver-custom mb-12">You have {dueCards.length} card{dueCards.length !== 1 ? 's' : ''} due for review.</p>
            <Button onClick={() => useFlashcardStore.getState().startReview(undefined, false)} size="sm">Start Review</Button>
          </>
        ) : (
          <>
            <img src="/assets/cat.png" alt="Cat" className="w-24 h-24 mx-auto mb-4" />
            <h3 className="text-xl text-light-custom mb-2">No cards due</h3>
            <p className="text-sm text-silver-custom mb-12">All caught up! Check back later for more reviews.</p>
            <div className="flex justify-center gap-4">
              {allCards.length > 0 && (
                <Button onClick={() => useFlashcardStore.getState().startReview(undefined, true)} size="sm">Review Cards</Button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1>Review</h1>
        <div className="text-gray-custom text-sm">
          {reviewAll ? 'All cards' : 'Due cards'} - {index + 1} of {total}
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
    </>
  );
};

export default ReviewView;


