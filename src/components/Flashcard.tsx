import React, { useState, useEffect } from 'react';
import type { Card } from '../types.ts';
import { ReviewQuality } from '../types.ts';
import { getCardDebugInfo } from '../utils';

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
}) => {
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCache, setAudioCache] = useState<Record<string, string>>({});
  const debugInfo = getCardDebugInfo(card);

  // Cleanup audio URLs when component unmounts
  useEffect(() => {
    return () => {
      // Clean up all cached audio URLs to prevent memory leaks
      Object.values(audioCache).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [audioCache]);

  const playAudio = async () => {
    if (isPlaying) return;
    
    // Check cache first - if we have this character cached, play it immediately
    if (audioCache[card.hanzi]) {
      const audio = new Audio(audioCache[card.hanzi]);
      setIsPlaying(true);
      
      audio.onended = () => {
        setIsPlaying(false);
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        console.error('Error playing cached audio');
      };
      
      await audio.play();
      return;
    }
    
    // Not in cache, fetch from API
    setIsPlaying(true);
    try {
      // Your Vercel URL
      const response = await fetch('https://chinese-flashcards-alpha.vercel.app/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: card.hanzi }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Cache the audio URL for future use
        setAudioCache(prev => ({ ...prev, [card.hanzi]: audioUrl }));
        
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsPlaying(false);
        };
        
        audio.onerror = () => {
          setIsPlaying(false);
          console.error('Error playing audio');
        };
        
        await audio.play();
      } else {
        console.error('Failed to generate speech');
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-16">
      {/* Card Display */}
      <div className="bg-granite-custom rounded-lg shadow-lg p-8 min-h-96 flex flex-col justify-center items-center text-center mb-6 relative">
        {/* Speaker icon in bottom-right corner */}
        <button
          onClick={playAudio}
          disabled={isPlaying}
          className="absolute bottom-4 right-4 w-10 h-10 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-light-custom rounded-full flex items-center justify-center transition-colors shadow-lg"
          title={isPlaying ? "Playing..." : "Listen to pronunciation"}
        >
          {isPlaying ? (
            <span className="text-sm">⏸️</span>
          ) : (
            <span className="text-sm">🔊</span>
          )}
        </button>

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

      {/* Debug Info Toggle */}
      <div className="flex justify-center mt-6 mb-4">
        <button
          onClick={() => setShowDebugInfo(!showDebugInfo)}
          className="text-xs text-silver-custom hover:text-light-custom"
        >
          {showDebugInfo ? '▲ Hide' : '▼ Show'} Algorithm Details
        </button>
      </div>

      {/* Debug Information */}
      {showDebugInfo && (
        <div className="bg-granite-custom rounded-lg p-4 mb-6 text-left">
          <h4 className="text-sm font-medium text-light-custom mb-3">SM-2 Algorithm Details</h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-silver-custom">Next Review:</span>
              <div className="text-light-custom font-medium">{debugInfo.nextReview}</div>
            </div>
            <div>
              <span className="text-silver-custom">Phase:</span>
              <div className="text-light-custom font-medium capitalize">{debugInfo.phase}</div>
            </div>
            <div>
              <span className="text-silver-custom">Ease Factor:</span>
              <div className="text-light-custom font-medium">{debugInfo.easeFactor}</div>
            </div>
            <div>
              <span className="text-silver-custom">Interval:</span>
              <div className="text-light-custom font-medium">
                {debugInfo.phase === 'learning' || debugInfo.phase === 'relearning' 
                  ? `Step ${(debugInfo.stepIndex ?? 0) + 1}`
                  : `${debugInfo.intervalDays} day${debugInfo.intervalDays !== 1 ? 's' : ''}`
                }
              </div>
            </div>
            <div>
              <span className="text-silver-custom">Consecutive Correct:</span>
              <div className="text-light-custom font-medium">{debugInfo.consecutiveCorrect}</div>
            </div>
            <div>
              <span className="text-silver-custom">Total Lapses:</span>
              <div className="text-light-custom font-medium">{debugInfo.lapses}</div>
            </div>
            <div>
              <span className="text-silver-custom">Audio Cached:</span>
              <div className="text-light-custom font-medium">
                {audioCache[card.hanzi] ? '✅ Yes' : '❌ No'}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-silver-custom text-xs">Exact due time:</span>
            <div className="text-light-custom text-xs font-mono">{debugInfo.exactDueTime}</div>
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
