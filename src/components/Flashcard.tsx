import React, { useState, useEffect } from 'react';
import type { Card } from '../types.ts';
import { ReviewQuality } from '../types.ts';
import { getCardDebugInfo } from '../utils';
import Button from './Button';
import { useFlashcardStore } from '../store';
import SoundIcon from '../assets/Sound.svg';

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
  const [displayBack, setDisplayBack] = useState(false);
  const [enterRotationX, setEnterRotationX] = useState(0);
  const [lastCardId, setLastCardId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Get review session state from store
  const { isReviewing, reviewAll } = useFlashcardStore();

  // Cleanup audio URLs when component unmounts
  useEffect(() => {
    return () => {
      // Clean up all cached audio URLs to prevent memory leaks
      Object.values(audioCache).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [audioCache]);

  // When answer is revealed, start by showing the back; allow toggling back/forth thereafter
  useEffect(() => {
    if (isTransitioning || lastCardId !== card.id) return; // Don't change displayBack during transitions or when card is changing
    if (isShowingAnswer) {
      setDisplayBack(true);
    } else {
      setDisplayBack(false);
    }
  }, [isShowingAnswer, isTransitioning, lastCardId, card.id]);

  // On card change, run an X-axis enter animation (top -> bottom flip)
  useEffect(() => {
    if (lastCardId !== null && lastCardId !== card.id) {
      // INSTANTLY disable all transitions and reset card
      setIsTransitioning(true);
      setEnterRotationX(0);
      setDisplayBack(false);
      // Force immediate state update
      setTimeout(() => {
        setIsTransitioning(false);
      }, 0);
    }
    if (lastCardId !== card.id) setLastCardId(card.id);
  }, [card.id, lastCardId]);

  // Only reset displayBack when starting a completely new review session
  useEffect(() => {
    const currentSessionId = `${isReviewing}-${reviewAll}`;
    if (sessionId !== currentSessionId) {
      setSessionId(currentSessionId);
      setDisplayBack(false);
    }
  }, [isReviewing, reviewAll, sessionId]);

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
      <div className="mb-6 perspective-1000">
        <div className={`${isTransitioning ? '!transition-none !transform-none' : 'transition-transform duration-300'}`} style={{ transform: isTransitioning ? 'none' : `rotateX(${enterRotationX}deg)` }}>
          <div className={`relative w-[272px] h-[325px] mx-auto rounded-2xl preserve-3d ${isTransitioning ? '!transition-none !transform-none' : 'transition-transform duration-300'}`}
               style={{ transform: isTransitioning ? 'none' : (displayBack ? 'rotateY(180deg)' : 'rotateY(0deg)') }}
               onClick={() => { if (isShowingAnswer) setDisplayBack(prev => !prev); }}>
            {/* Front of card */}
            <div className="absolute inset-0 bg-granite-custom rounded-2xl flex items-center justify-center backface-hidden">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card flip when clicking sound button
                  playAudio();
                }}
                disabled={isPlaying}
                className="absolute bottom-3 right-3 w-9 h-9 hover:bg-gray-custom disabled:opacity-50 disabled:cursor-not-allowed text-light-custom rounded-full flex items-center justify-center transition-colors"
                title={isPlaying ? 'Playing...' : 'Listen to pronunciation'}
              >
                <img src={SoundIcon} alt="Sound" className="w-5 h-5" />
              </button>
              <div className="text-6xl font-medium text-light-custom text-center px-4">
                {card.hanzi}
              </div>
            </div>
            {/* Back of card */}
            <div className="absolute inset-0 bg-granite-custom rounded-2xl flex items-center justify-center backface-hidden" style={{ transform: 'rotateY(180deg)' }}>
              <div className="text-2xl text-light-custom font-medium text-center px-4">
                {card.english}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Show Answer Button */}
      {!isShowingAnswer && (
        <div className="flex justify-center mb-6">
          <Button
            onClick={onShowAnswer}
            size="lg"
          >
            Show Answer
          </Button>
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
            <Button
              onClick={() => onReview(ReviewQuality.AGAIN)}
              size="lg"
            >
              Again
            </Button>
            <Button
              onClick={() => onReview(ReviewQuality.HARD)}
              size="lg"
            >
              Hard
            </Button>
            <Button
              onClick={() => onReview(ReviewQuality.GOOD)}
              size="lg"
            >
              Good
            </Button>
            <Button
              onClick={() => onReview(ReviewQuality.EASY)}
              size="lg"
            >
              Easy
            </Button>
          </div>
        </div>
      )}

      {/* Debug Info Toggle */}
      <div className="flex justify-center mt-6 mb-4">
        <Button
          onClick={() => setShowDebugInfo(!showDebugInfo)}
          variant="cancel"
          size="sm"
          className="text-xs"
        >
          {showDebugInfo ? '▲ Hide' : '▼ Show'} Algorithm Details
        </Button>
      </div>

      {/* Debug Information */}
      {showDebugInfo && (
        <div className="bg-granite-custom rounded-lg p-4 mb-6 text-left">
          <h4 className="text-sm font-medium text-light-custom mb-3">Scheduling Details (FSRS)</h4>
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
              <span className="text-silver-custom">FSRS Stability:</span>
              <div className="text-light-custom font-medium">{debugInfo.stability ?? '—'}</div>
            </div>
            <div>
              <span className="text-silver-custom">FSRS Difficulty:</span>
              <div className="text-light-custom font-medium">{debugInfo.difficulty ?? '—'}</div>
            </div>
            <div>
              <span className="text-silver-custom">FSRS State:</span>
              <div className="text-light-custom font-medium">{debugInfo.fsrsState ?? '—'}</div>
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
