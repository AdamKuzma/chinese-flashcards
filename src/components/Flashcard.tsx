import React, { useState, useEffect, useCallback } from 'react';
import type { Card } from '../types.ts';
import { ReviewQuality } from '../types.ts';
//import { getCardDebugInfo } from '../utils';
import Button from './Button';
import { DictationModal } from './DictationModal';
import { useFlashcardStore } from '../store';
import SoundIcon from '../assets/Sound.svg';
import BookIcon from '../assets/book.svg';
import RefreshIcon from '../assets/Refresh.svg';
import BookmarkIcon from '../assets/Bookmark.svg';
import MicIcon from '../assets/Mic.svg';
import { audioCache } from '../utils/audioCache';
import { generateSentence } from '../utils/sentenceGenerator';

interface FlashcardProps {
  card: Card;
  isShowingAnswer: boolean;
  onShowAnswer: () => void;
  onReview: (quality: ReviewQuality) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  showNavigation?: boolean;
  onFlipCard?: number;
}

export const Flashcard: React.FC<FlashcardProps> = ({
  card,
  isShowingAnswer,
  onShowAnswer,
  onReview,
  onFlipCard,
}) => {
  //const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  //const debugInfo = getCardDebugInfo(card);
  const [displayBack, setDisplayBack] = useState(false);
  const [enterRotationX, setEnterRotationX] = useState(0);
  const [lastCardId, setLastCardId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSentence, setShowSentence] = useState(false);
  const [sentenceData, setSentenceData] = useState<{chinese: string, english: string} | null>(null);
  const [isLoadingSentence, setIsLoadingSentence] = useState(false);
  const [isPlayingSentence, setIsPlayingSentence] = useState(false);
  const [showPracticeModal, setShowPracticeModal] = useState(false);

  // Get review session state from store
  const { isReviewing, reviewAll, currentCardFlipped, toggleCardFlip, setCardFlip } = useFlashcardStore();

  // No need for cleanup since we're using global audio cache

  // Handle external card flip trigger
  const handleExternalFlip = useCallback(() => {
    if (isShowingAnswer) {
      toggleCardFlip();
    }
  }, [isShowingAnswer, toggleCardFlip]);

  useEffect(() => {
    if (onFlipCard) {
      handleExternalFlip();
    }
  }, [onFlipCard, handleExternalFlip]);

  // When answer is revealed, start by showing the back; allow toggling back/forth thereafter
  useEffect(() => {
    if (isTransitioning || lastCardId !== card.id) return; // Don't change displayBack during transitions or when card is changing
    // Only allow showing back if we're not in a transition and the card hasn't changed
    if (isShowingAnswer && !isTransitioning && lastCardId === card.id) {
      // When answer is shown, always show the back side initially
      setDisplayBack(true);
      setCardFlip(true); // Set flip state to true when answer is shown
    } else if (!isShowingAnswer && !isTransitioning && lastCardId === card.id) {
      setDisplayBack(false);
      setCardFlip(false); // Reset flip state when answer is hidden
    }
  }, [isShowingAnswer, isTransitioning, lastCardId, card.id, setCardFlip]);

  // Additional safeguard: force front side during transitions
  useEffect(() => {
    if (isTransitioning) {
      setDisplayBack(false);
    }
  }, [isTransitioning]);

  // Sync displayBack with currentCardFlipped when user manually toggles flip
  useEffect(() => {
    if (isShowingAnswer && !isTransitioning && lastCardId === card.id) {
      setDisplayBack(currentCardFlipped);
    }
  }, [currentCardFlipped, isShowingAnswer, isTransitioning, lastCardId, card.id]);

  // On card change, run an X-axis enter animation (top -> bottom flip)
  useEffect(() => {
    if (lastCardId !== null && lastCardId !== card.id) {
      // INSTANTLY disable all transitions and reset card
      setIsTransitioning(true);
      setEnterRotationX(0);
      setDisplayBack(false);
      // Reset sentence when card changes
      setShowSentence(false);
      setSentenceData(null);
      setIsLoadingSentence(false);
      setIsPlayingSentence(false);
      // Force immediate state update with longer delay to ensure state settles
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100); // Increased from 0 to 100ms
    }
    if (lastCardId !== card.id) {
      setLastCardId(card.id);
      // Always reset to front side when card changes
      setDisplayBack(false);
      setCardFlip(false); // Reset flip state in store
    }
  }, [card.id, lastCardId, setCardFlip]);

  // Only reset displayBack when starting a completely new review session
  useEffect(() => {
    const currentSessionId = `${isReviewing}-${reviewAll}`;
    if (sessionId !== currentSessionId) {
      setSessionId(currentSessionId);
      setDisplayBack(false);
      setCardFlip(false); // Reset flip state in store
    }
  }, [isReviewing, reviewAll, sessionId, setCardFlip]);

  const playAudio = async () => {
    if (isPlaying) return;
    
    // Check cache first - if we have this character cached at this speed, try to play it
    const currentSpeed = useFlashcardStore.getState().ttsSettings.speakingRate;
    const cacheKey = `${card.hanzi}_${currentSpeed}`;
    const cachedUrl = audioCache.get(cacheKey);
    if (cachedUrl) {
      const audio = new Audio(cachedUrl);
      setIsPlaying(true);
      
      audio.onended = () => {
        setIsPlaying(false);
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        console.error('Error playing cached audio, will refetch');
        // Remove the invalid URL from cache and refetch
        audioCache.delete(cacheKey);
        // Retry by calling playAudio again
        setTimeout(() => playAudio(), 100);
        return;
      };
      
      try {
        await audio.play();
        return;
      } catch (error) {
        setIsPlaying(false);
        console.error('Error playing cached audio, will refetch:', error);
        // Remove the invalid URL from cache and refetch
        audioCache.delete(cacheKey);
        // Retry by calling playAudio again
        setTimeout(() => playAudio(), 100);
        return;
      }
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
        body: JSON.stringify({ 
          text: card.hanzi,
          speakingRate: useFlashcardStore.getState().ttsSettings.speakingRate
        }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Cache the audio URL for future use with speed-specific key
        audioCache.set(cacheKey, audioUrl);
        
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

  const playSentenceAudio = async () => {
    if (isPlayingSentence || !sentenceData) return;
    
    setIsPlayingSentence(true);
    try {
      const response = await fetch('https://chinese-flashcards-alpha.vercel.app/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: sentenceData.chinese,
          speakingRate: useFlashcardStore.getState().ttsSettings.speakingRate
        }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsPlayingSentence(false);
          URL.revokeObjectURL(audioUrl); // Clean up the blob URL
        };
        
        audio.onerror = () => {
          setIsPlayingSentence(false);
          URL.revokeObjectURL(audioUrl);
          console.error('Error playing sentence audio');
        };
        
        await audio.play();
      } else {
        console.error('Failed to generate sentence speech');
        setIsPlayingSentence(false);
      }
    } catch (error) {
      console.error('Error playing sentence audio:', error);
      setIsPlayingSentence(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-16">
      {/* Card Display */}
      <div className="mb-6 perspective-1000">
        <div className={`${isTransitioning ? '!transition-none !transform-none' : 'transition-transform duration-300'}`} style={{ transform: isTransitioning ? 'none' : `rotateX(${enterRotationX}deg)` }}>
          <div className={`relative w-[272px] h-[325px] mx-auto rounded-2xl preserve-3d cursor-pointer ${isTransitioning ? '!transition-none !transform-none' : 'transition-transform duration-300'}`}
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
              <div 
                className="text-6xl font-medium text-light-custom text-center px-4 cursor-text"
                onClick={(e) => e.stopPropagation()} // Prevent card flip when clicking on text
              >
                {card.hanzi}
              </div>
            </div>
            {/* Back of card */}
            <div className="absolute inset-0 bg-granite-custom rounded-2xl flex items-center justify-center backface-hidden" style={{ transform: 'rotateY(180deg)' }}>
              <div 
                className="text-2xl text-light-custom font-medium text-center px-4 cursor-text"
                onClick={(e) => e.stopPropagation()} // Prevent card flip when clicking on text
              >
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
          
          {/* Sentence Card */}
          {showSentence && (
            <div className={`mt-12 p-4 py-3 border border-granite-custom rounded-xl ${isLoadingSentence ? 'bg-white sentence-loading' : 'bg-granite-custom/50'}`}>
              {isLoadingSentence ? (
                <div className="flex justify-between items-middle">
                  <div className="flex-1 text-left pl-2">
                    <div className="text-lg text-light-custom leading-7 min-h-[1.75rem]"></div>
                    <div className="text-sm text-gray-custom leading-5 min-h-[1.25rem]"></div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <div className="w-8 h-8"></div>
                    <div className="w-8 h-8"></div>
                    <div className="w-8 h-8"></div>
                  </div>
                </div>
              ) : sentenceData ? (
                <div className="flex justify-between items-middle">
                  <div className="flex-1 text-left pl-2">
                    <div className="text-lg text-light-custom">
                      {sentenceData.chinese}
                    </div>
                    <div className="text-sm text-gray-custom">
                      {sentenceData.english}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={playSentenceAudio}
                      disabled={isPlayingSentence}
                      className="group relative w-8 h-8 flex items-center justify-center text-silver-custom hover:text-light-custom hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <img src={SoundIcon} alt="Sound" className="w-4 h-4" />
                      <div className={`pointer-events-none absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 rounded-lg bg-black/80 text-light-custom text-xs transition-opacity whitespace-nowrap ${isPlayingSentence ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                        Read aloud
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Save sentence
                        console.log('Bookmark');
                      }}
                      className="group relative w-8 h-8 flex items-center justify-center text-silver-custom hover:text-light-custom hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <img src={BookmarkIcon} alt="Save" className="w-5 h-5 icon-silver" />
                      <div className="pointer-events-none absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 rounded-lg bg-black/80 text-light-custom text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Bookmark
                      </div>
                    </button>
                    <button
                      onClick={async () => {
                        if (isLoadingSentence) return; // Prevent multiple requests
                        
                        setIsLoadingSentence(true);
                        try {
                          const data = await generateSentence(card.hanzi, card.english);
                          setSentenceData(data);
                        } catch (error) {
                          console.error('Error regenerating sentence:', error);
                          // Fallback to mock data on error
                          setSentenceData({
                            chinese: `${card.hanzi}是一个很好的词。`,
                            english: `${card.english} is a good word.`
                          });
                        } finally {
                          setIsLoadingSentence(false);
                        }
                      }}
                      disabled={isLoadingSentence}
                      className="group relative w-8 h-8 flex items-center justify-center text-silver-custom hover:text-light-custom hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <img src={RefreshIcon} alt="Refresh" className="w-5 h-5 icon-silver" />
                      <div className={`pointer-events-none absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 rounded-lg bg-black/80 text-light-custom text-xs transition-opacity whitespace-nowrap ${isLoadingSentence ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                        New sentence
                      </div>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
          
          {/* Practice and Sentence Buttons */}
          <div className="flex justify-center gap-1 mt-8">
            <Button
              onClick={() => setShowPracticeModal(true)}
              size="sm"
              variant="secondary"
              className="flex items-center gap-1.5"
            >
              <img src={MicIcon} alt="Mic" className="w-5 h-5" />
              Practice
            </Button>
            <Button
              onClick={async () => {
                if (showSentence) {
                  setShowSentence(false);
                  setIsLoadingSentence(false);
                } else {
                  setIsLoadingSentence(true);
                  setShowSentence(true);
                  
                  // Generate sentence using OpenAI API
                  try {
                    const data = await generateSentence(card.hanzi, card.english);
                    setSentenceData(data);
                  } catch (error) {
                    console.error('Error generating sentence:', error);
                    // Fallback to mock data on error
                    setSentenceData({
                      chinese: `${card.hanzi}是一个很好的词。`,
                      english: `${card.english} is a good word.`
                    });
                  } finally {
                    setIsLoadingSentence(false);
                  }
                }
              }}
              size="sm"
              variant="secondary"
              className="flex items-center gap-1.5"
            >
              <img src={BookIcon} alt="Book" className="w-4.5 h-4.5" />
              Sentence
            </Button>
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

      {/* Practice Modal */}
      <DictationModal
        isOpen={showPracticeModal}
        onClose={() => setShowPracticeModal(false)}
        chineseWord={card.hanzi}
      />
    </div>
  );
};
