import React from 'react';
import type { Card } from '../types.ts';
import { ReviewQuality } from '../types.ts';

interface FlashcardProps {
  card: Card;
  isShowingAnswer: boolean;
  onShowAnswer: () => void;
  onReview: (quality: ReviewQuality) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  showNavigation?: boolean;
}

export const Flashcard: React.FC<FlashcardProps> = ({
  card,
  isShowingAnswer,
  onShowAnswer,
  onReview,
  onNext,
  onPrevious,
  showNavigation = true,
}) => {
  const formatDueDate = (timestamp: number) => {
    const now = Date.now();
    const diff = timestamp - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  };

  return (
    <div className="max-w-2xl mx-auto px-16">
      {/* Card Display */}
      <div className="bg-granite-custom rounded-lg shadow-lg p-8 min-h-96 flex flex-col justify-center items-center text-center mb-6">
        {/* Hanzi (Chinese characters) */}
        <div className="text-6xl font-medium text-light-custom mb-4">
          {card.hanzi}
        </div>

        {/* Pinyin */}
        {card.pinyin && (
          <div className="text-lg text-light-custom mb-4">
            {card.pinyin}
          </div>
        )}

        {/* English translation - shown only when answer is revealed */}
        {isShowingAnswer && (
          <div className="text-2xl text-light-custom font-medium pt-4 mt-4">
            {card.english}
          </div>
        )}
      </div>

      {/* Show Answer Button */}
      {!isShowingAnswer && (
        <div className="flex justify-center mb-6">
          <button
            onClick={onShowAnswer}
            className="btn-show-answer px-4 py-1.5 bg-granite-custom text-light-custom rounded-lg font-medium"
          >
            Show Answer
          </button>
        </div>
      )}

      {/* Card Info */}
      {/* <div className="text-sm text-gray-600 mb-4 text-center">
        <div>Due: {formatDueDate(card.due)}</div>
        <div>Interval: {card.interval} day{card.interval !== 1 ? 's' : ''}</div>
        <div>Ease: {card.ease.toFixed(2)}</div>
        <div>Repetitions: {card.reps}</div>
      </div> */}

      {/* Review Buttons */}
      {isShowingAnswer && (
        <div className="space-y-3">
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => onReview(ReviewQuality.AGAIN)}
              className="btn-add px-4 py-2 bg-granite-custom text-light-custom rounded-lg"
            >
              Again
            </button>
            <button
              onClick={() => onReview(ReviewQuality.HARD)}
              className="btn-add px-4 py-2 bg-granite-custom text-light-custom rounded-lg"
            >
              Hard
            </button>
            <button
              onClick={() => onReview(ReviewQuality.GOOD)}
              className="btn-add px-4 py-2 bg-granite-custom text-light-custom rounded-lg"
            >
              Good
            </button>
            <button
              onClick={() => onReview(ReviewQuality.EASY)}
              className="btn-add px-4 py-2 bg-granite-custom text-light-custom rounded-lg"
            >
              Easy
            </button>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      {/* {showNavigation && (
        <div className="flex justify-between mt-6">
          <button
            onClick={onPrevious}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Previous
          </button>
          <button
            onClick={onNext}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Next
          </button>
        </div>
      )} */}
    </div>
  );
};
