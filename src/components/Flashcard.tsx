import React, { useState, useEffect, useCallback } from 'react';
import type { Card } from '../types.ts';
import { ReviewQuality } from '../types.ts';
import { getCardDebugInfo } from '../utils';
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
import { motion, AnimatePresence } from 'framer-motion';

interface FlashcardProps {
  card: Card;
  isShowingAnswer: boolean;
  onShowAnswer: () => void;
  onReview: (quality: ReviewQuality) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  showNavigation?: boolean;
  onFlipCard?: number;
  onPracticeClick?: () => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({
  card,
  isShowingAnswer,
  onShowAnswer,
  onReview,
  onFlipCard,
  onPracticeClick,
}) => {
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const debugInfo = getCardDebugInfo(card);
  const [displayBack, setDisplayBack] = useState(false);
  const [enterRotationX, setEnterRotationX] = useState(0);
  const [lastCardId, setLastCardId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSentence, setShowSentence] = useState(false);
  const [showSentenceContainer, setShowSentenceContainer] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sentenceData, setSentenceData] = useState<{chinese: string, english: string} | null>(null);
  const [isLoadingSentence, setIsLoadingSentence] = useState(false);
  const [isPlayingSentence, setIsPlayingSentence] = useState(false);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [displayedChinese, setDisplayedChinese] = useState('');
  const [showEnglishAndActions, setShowEnglishAndActions] = useState(false);
  const [showIcons, setShowIcons] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(true);

  // Get review session state from store
  const { isReviewing, reviewAll, currentCardFlipped, toggleCardFlip, setCardFlip, showAlgorithmDetails } = useFlashcardStore();

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
      setShowSentenceContainer(false);
      setIsExpanded(false);
      setSentenceData(null);
      setIsLoadingSentence(false);
      setIsPlayingSentence(false);
      setDisplayedChinese('');
      setShowEnglishAndActions(false);
      setShowIcons(false);
      setIsContentVisible(true);
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

  const typewriterEffect = (text: string, speed: number = 50) => {
    setDisplayedChinese('');
    setShowEnglishAndActions(false);
    setShowIcons(false);
    setIsContentVisible(true);
    
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedChinese(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
        // After typewriter completes, show English text
        setTimeout(() => {
          setShowEnglishAndActions(true);
          // After English text transition completes, show icons
          setTimeout(() => {
            setShowIcons(true);
          }, 300); // Wait for English text transition (0.3s)
        }, 500);
      }
    }, speed);
  };

  const handleSentenceClick = async () => {
    if (!card) return;
    
    if (showSentence) {
      // First fade out content
      setIsContentVisible(false);
      
      // Then scale down container
      setTimeout(() => {
        setIsExpanded(false);
      }, 200); // Wait for content fade out
      
      // Finally move up and fade out
      setTimeout(() => {
        setShowSentence(false);
        setShowSentenceContainer(false);
        setIsLoadingSentence(false);
        setDisplayedChinese('');
        setShowEnglishAndActions(false);
        setShowIcons(false);
        setIsContentVisible(true); // Reset for next time
      }, 400); // Wait for scale down animation
    } else {
      // Start the animation sequence
      setShowSentenceContainer(true);
      setShowSentence(true);
      
      // After initial animation (opacity + y), expand the container
      setTimeout(() => {
        setIsExpanded(true);
        
        // After expansion completes, start loading
        setTimeout(() => {
          setIsLoadingSentence(true);
          
          // Generate sentence using OpenAI API
          generateSentence(card.hanzi, card.english)
            .then((data) => {
              setSentenceData(data);
              setIsLoadingSentence(false);
              // Start typewriter effect
              typewriterEffect(data.chinese);
            })
            .catch((error) => {
              console.error('Error generating sentence:', error);
              // Fallback to mock data on error
              const fallbackData = {
                chinese: `${card.hanzi}是一个很好的词。`,
                english: `${card.english} is a good word.`
              };
              setSentenceData(fallbackData);
              setIsLoadingSentence(false);
              // Start typewriter effect
              typewriterEffect(fallbackData.chinese);
            });
        }, 400); // Wait for expansion animation to complete
      }, 100); // Wait for initial animation to complete
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
      <div className="mb-8 perspective-1000">
        <div className={`${isTransitioning ? '!transition-none !transform-none' : 'transition-transform duration-300'}`} style={{ transform: isTransitioning ? 'none' : `rotateX(${enterRotationX}deg)` }}>
          <div className={`relative w-[300px] h-[354px] mx-auto preserve-3d cursor-pointer ${isTransitioning ? '!transition-none !transform-none' : 'transition-transform duration-300'}`}
               style={{ 
                 borderRadius: '24px',
                 transform: isTransitioning ? 'none' : (displayBack ? 'rotateY(180deg)' : 'rotateY(0deg)')
               }}
               onClick={() => { if (isShowingAnswer) setDisplayBack(prev => !prev); }}>
            {/* Front of card */}
            <div className="absolute inset-0 bg-granite-custom flex items-center justify-center backface-hidden" style={{ borderRadius: '24px' }}>
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
            <div className="absolute inset-0 bg-granite-custom flex items-center justify-center backface-hidden" style={{ transform: 'rotateY(180deg)', borderRadius: '24px' }}>
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
          
          {/* Example and Practice Buttons */}
          <div className="flex justify-center gap-0 mt-14">
            <Button
              onClick={handleSentenceClick}
              size="sm"
              variant="secondary"
              className="flex items-center gap-1.5 bg-transparent px-4 py-2 hover:bg-white/5 border-0 !rounded-full"
            >
              <img src={BookIcon} alt="Book" className="w-4.5 h-4.5" style={{ filter: 'brightness(0) saturate(100%) invert(90%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%)' }} />
              Example
            </Button>
            <Button
              onClick={onPracticeClick}
              size="sm"
              variant="secondary"
              className="flex items-center gap-1.5 bg-transparent px-4 py-2 hover:bg-white/5 border-0 !rounded-full"
            >
              <img src={MicIcon} alt="Mic" className="w-5 h-5" style={{ filter: 'brightness(0) saturate(100%) invert(90%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%)' }} />
              Practice
            </Button>
          </div>
          
          {/* Sentence Card */}
          <AnimatePresence>
            {showSentenceContainer && (
              <motion.div
                initial={{
                  opacity: 0,
                  width: 220,
                  height: 34,
                  y: 0
                }}
                animate={{
                  opacity: 1,
                  y: 20,
                  width: isExpanded ? 544 : 220,
                  height: isExpanded ? 72 : 34
                }}
                transition={{
                  opacity: { duration: 0.2 },
                  y: { duration: 0.2 },
                  width: { 
                    delay: 0.01, 
                    duration: 0.4, 
                    type: "spring", 
                    stiffness: 200, 
                    damping: 20 
                  },
                  height: { 
                    delay: 0.01, 
                    duration: 0.4, 
                    type: "spring", 
                    stiffness: 200, 
                    damping: 20 
                  }
                }}
                exit={{
                  opacity: 0,
                  y: -20,
                  width: 220,
                  height: 34
                }}
                className={`mt-2 mx-auto border border-granite-custom rounded-xl bg-white/2 ${sentenceData ? 'bg-granite-custom/50' : ''}`}
                style={{ width: isExpanded ? 544 : 220 }}
              >
                <motion.div 
                  className="p-4 py-3"
                  animate={{ opacity: isContentVisible ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {isLoadingSentence ? (
                    <div className="flex items-center justify-start h-full">
                      <motion.div
                        className="w-2.5 h-2.5 bg-white rounded-full ml-1.5 mt-2"
                        animate={{
                          scale: [1, 1.3, 1],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </div>
                  ) : sentenceData ? (
                    <div className="flex justify-between items-middle">
                      <div className="flex-1 text-left pl-2">
                        <div className="text-lg text-light-custom">
                          {displayedChinese}
                          {displayedChinese.length < sentenceData.chinese.length && (
                            <span className="animate-pulse">|</span>
                          )}
                        </div>
                        {showEnglishAndActions && (
                          <motion.div 
                            className="text-sm text-gray-custom"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                          >
                            {sentenceData.english}
                          </motion.div>
                        )}
                      </div>
                      {showIcons && (
                        <motion.div 
                          className="flex items-center gap-2 ml-4"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        >
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
                              setDisplayedChinese('');
                              setShowEnglishAndActions(false);
                              setShowIcons(false);
                              setIsContentVisible(true);
                              try {
                                const data = await generateSentence(card.hanzi, card.english);
                                setSentenceData(data);
                                setIsLoadingSentence(false);
                                typewriterEffect(data.chinese);
                              } catch (error) {
                                console.error('Error regenerating sentence:', error);
                                // Fallback to mock data on error
                                const fallbackData = {
                                  chinese: `${card.hanzi}是一个很好的词。`,
                                  english: `${card.english} is a good word.`
                                };
                                setSentenceData(fallbackData);
                                setIsLoadingSentence(false);
                                typewriterEffect(fallbackData.chinese);
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
                        </motion.div>
                      )}
                    </div>
                  ) : null}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
        </div>
      )}

      {/* Algorithm Details Link */}
      {isShowingAnswer && showAlgorithmDetails && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="text-sm text-gray-custom hover:text-light-custom transition-colors underline"
          >
            {showDebugInfo ? 'Hide' : 'Show'} algorithm details
          </button>
        </div>
      )}

      {/* Debug Info Display */}
      {isShowingAnswer && showAlgorithmDetails && showDebugInfo && (
        <div className="mt-4 p-4 bg-granite-custom/50 rounded-lg border border-granite-custom">
          <div className="text-sm text-light-custom space-y-1">
            <div><strong>Phase:</strong> {debugInfo.phase}</div>
            <div><strong>Interval:</strong> {debugInfo.intervalDays} day{debugInfo.intervalDays !== 1 ? 's' : ''}</div>
            <div><strong>Consecutive Correct:</strong> {debugInfo.consecutiveCorrect}</div>
            <div><strong>Lapses:</strong> {debugInfo.lapses}</div>
            <div><strong>Next Review:</strong> {debugInfo.nextReview}</div>
            <div><strong>Exact Due Time:</strong> {debugInfo.exactDueTime}</div>
            {debugInfo.stability !== undefined && (
              <div><strong>Stability:</strong> {debugInfo.stability.toFixed(2)}</div>
            )}
            {debugInfo.difficulty !== undefined && (
              <div><strong>Difficulty:</strong> {debugInfo.difficulty.toFixed(2)}</div>
            )}
            {debugInfo.fsrsState && (
              <div><strong>FSRS State:</strong> {debugInfo.fsrsState}</div>
            )}
            {debugInfo.stepIndex !== undefined && (
              <div><strong>Step Index:</strong> {debugInfo.stepIndex}</div>
            )}
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
