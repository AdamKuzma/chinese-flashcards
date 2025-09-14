import React, { useState, useEffect } from 'react';
import { useFlashcardStore } from '../store';
import { Flashcard, Button, Modal, DictationModal } from './index';
import { ReviewQuality } from '../types';
import catImage from '../assets/cat.png';
import { generateSentence } from '../utils/sentenceGenerator';
import BookIcon from '../assets/book.svg';
import MicIcon from '../assets/Mic.svg';
import SoundIcon from '../assets/Sound.svg';
import BookmarkIcon from '../assets/Bookmark.svg';
import RefreshIcon from '../assets/Refresh.svg';

interface ReviewViewProps {
  onBackToDeck?: () => void;
  onCompletionStateChange?: (isShowingCompletion: boolean) => void;
}

export const ReviewView: React.FC<ReviewViewProps> = ({ onBackToDeck, onCompletionStateChange }) => {
  const [lastCompletedDeckId, setLastCompletedDeckId] = useState<string | null>(null);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [completedSessionCount, setCompletedSessionCount] = useState<number>(0);
  const [showCompletionState, setShowCompletionState] = useState(false);
  const [flipCardTrigger, setFlipCardTrigger] = useState<number>(0);
  const [showSentence, setShowSentence] = useState(false);
  const [sentenceData, setSentenceData] = useState<{chinese: string, english: string} | null>(null);
  const [isLoadingSentence, setIsLoadingSentence] = useState(false);
  const [isPlayingSentence, setIsPlayingSentence] = useState(false);
  const [showPracticeModal, setShowPracticeModal] = useState(false);

  const {
    isReviewing,
    reviewAll,
    getCurrentCard,
    getSessionPosition,
    showAnswer,
    hideAnswer,
    reviewCard,
    nextCard,
    previousCard,
    getDueCards,
    getAllCards,
    sessionInitialCount,
    selectedDeckId,
    isShowingAnswer,
    clearSession,
    isAnyModalOpen,
  } = useFlashcardStore();

  const currentCard = getCurrentCard();
  const { total } = getSessionPosition();
  const dueCards = getDueCards();
  const allCards = getAllCards();
  const cardsToReview = reviewAll ? allCards : dueCards;

  // Debug modal state
  console.log('ReviewView: Modal state:', isAnyModalOpen);

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

  // Check if review session is completed - minimal dependencies
  useEffect(() => {
    // Show completion when we're not reviewing but we had cards to review
    if (!isReviewing && completedSessionCount > 0) {
      setShowCompletionState(true);
      onCompletionStateChange?.(true);
    }
  }, [isReviewing, completedSessionCount, onCompletionStateChange]);

  // Note: Session clearing is now handled explicitly when review completes or user navigates away

  
  // Keyboard shortcuts for review
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      console.log('Key pressed:', event.key, { isReviewing, currentCard: !!currentCard, isAnyModalOpen });
      // Only handle keyboard shortcuts when actively reviewing and no modal is open
      if (!isReviewing || !currentCard || isAnyModalOpen) {
        console.log('Keyboard shortcut blocked:', { isReviewing, currentCard: !!currentCard, isAnyModalOpen });
        return;
      }
      
      // Prevent default behavior for our custom keys
      if (['Enter', '1', '2', '3', '4'].includes(event.key)) {
        event.preventDefault();
      }
      
      // For S key, only prevent default if no modifier keys are pressed
      if ((event.key === 's' || event.key === 'S') && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        event.preventDefault();
      }

      switch (event.key) {
        case 'Enter':
          // Show answer if not showing, or flip the card if answer is showing
          if (!isShowingAnswer) {
            showAnswer();
          } else {
            // Trigger card flip by updating the trigger state
            setFlipCardTrigger(prev => prev + 1);
          }
          break;
        case '1':
          // Again - only if answer is showing
          if (isShowingAnswer) {
            reviewCard(ReviewQuality.AGAIN);
          }
          break;
        case '2':
          // Hard - only if answer is showing
          if (isShowingAnswer) {
            reviewCard(ReviewQuality.HARD);
          }
          break;
        case '3':
          // Good - only if answer is showing
          if (isShowingAnswer) {
            reviewCard(ReviewQuality.GOOD);
          }
          break;
        case '4':
          // Easy - only if answer is showing
          if (isShowingAnswer) {
            reviewCard(ReviewQuality.EASY);
          }
          break;
        case 's':
        case 'S':
          // Play card sound - but not if modifier keys are pressed (like Cmd+S)
          if (!event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
            const soundButton = document.querySelector('button[title*="Listen to pronunciation"], button[title*="Playing"]');
            if (soundButton) {
              (soundButton as HTMLButtonElement).click();
            }
          }
          break;
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isReviewing, currentCard, isShowingAnswer, showAnswer, hideAnswer, reviewCard, setFlipCardTrigger, isAnyModalOpen]);

  // Use the last known deck ID if selectedDeckId is not available
  const effectiveDeckId = selectedDeckId || lastCompletedDeckId;

  const handleBackToDeck = () => {
    console.log('handleBackToDeck called');
    
    // Clear the session when navigating back to deck
    clearSession();
    
    // Restore the deck ID so the deck detail view can display properly
    if (lastCompletedDeckId) {
      useFlashcardStore.getState().setSelectedDeckId(lastCompletedDeckId);
    }
    
    // Use the callback if provided, otherwise fall back to custom event
    if (onBackToDeck) {
      onBackToDeck();
    } else {
      const evt = new CustomEvent('navigate-deck-detail');
      window.dispatchEvent(evt);
    }
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

  const handleSentenceClick = async () => {
    if (!currentCard) return;
    
    if (showSentence) {
      setShowSentence(false);
      setIsLoadingSentence(false);
    } else {
      setIsLoadingSentence(true);
      setShowSentence(true);
      
      // Generate sentence using OpenAI API
      try {
        const data = await generateSentence(currentCard.hanzi, currentCard.english);
        setSentenceData(data);
      } catch (error) {
        console.error('Error generating sentence:', error);
        // Fallback to mock data on error
        setSentenceData({
          chinese: `${currentCard.hanzi}是一个很好的词。`,
          english: `${currentCard.english} is a good word.`
        });
      } finally {
        setIsLoadingSentence(false);
      }
    }
  };

  const handlePracticeClick = () => {
    setShowPracticeModal(true);
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

  if (!isReviewing && !showCompletionState) {
    // Not reviewing and not showing completion - don't show anything
    console.log('ReviewView: Not reviewing and not showing completion, returning null');
    console.log('Debug state:', { isReviewing, showCompletionState, cardsToReviewLength: cardsToReview.length, currentCard: !!currentCard });
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

      {/* Keyboard shortcuts hint */}
      {/* <div className="text-center mb-4">
        <div className="text-xs text-gray-custom">
          {!isShowingAnswer ? (
            <span>Press <kbd className="px-1 py-0.5 bg-granite-custom rounded text-xs">Enter</kbd> to show answer</span>
          ) : (
            <span>Press <kbd className="px-1 py-0.5 bg-granite-custom rounded text-xs">1</kbd> Again, <kbd className="px-1 py-0.5 bg-granite-custom rounded text-xs">2</kbd> Hard, <kbd className="px-1 py-0.5 bg-granite-custom rounded text-xs">3</kbd> Good, <kbd className="px-1 py-0.5 bg-granite-custom rounded text-xs">4</kbd> Easy</span>
          )}
        </div>
      </div> */}

      <Flashcard
        card={currentCard!}
        isShowingAnswer={useFlashcardStore.getState().isShowingAnswer}
        onShowAnswer={showAnswer}
        onReview={reviewCard}
        onNext={nextCard}
        onPrevious={previousCard}
        showNavigation={total > 1}
        onFlipCard={flipCardTrigger}
      />

      {/* Sentence and Practice Buttons Container */}
      {isShowingAnswer && (
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 mb-6">
          <div className="bg-granite-custom rounded-full flex px-1 py-1 items-center shadow-sm">
            <Button
              onClick={handleSentenceClick}
              size="sm"
              variant="secondary"
              className="flex items-center gap-1.5 bg-transparent px-4 py-2 hover:bg-black/20 border-0 review-button-light !rounded-full"
            >
              <img src={BookIcon} alt="Book" className="w-4.5 h-4.5" style={{ filter: 'brightness(0) saturate(100%) invert(90%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%)' }} />
              Example
            </Button>
            <Button
              onClick={handlePracticeClick}
              size="sm"
              variant="secondary"
              className="flex items-center gap-1.5 bg-transparent px-4 py-2 hover:bg-black/20 border-0 review-button-light !rounded-full"
            >
              <img src={MicIcon} alt="Mic" className="w-5 h-5" style={{ filter: 'brightness(0) saturate(100%) invert(90%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%)' }} />
              Practice
            </Button>
          </div>
        </div>
      )}

      {/* Sentence Card */}
      {showSentence && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 max-w-md w-full mx-4">
          <div className={`p-4 py-3 border border-granite-custom rounded-xl ${isLoadingSentence ? 'bg-white sentence-loading' : 'bg-granite-custom/50'}`}>
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
                        const data = await generateSentence(currentCard!.hanzi, currentCard!.english);
                        setSentenceData(data);
                      } catch (error) {
                        console.error('Error regenerating sentence:', error);
                        // Fallback to mock data on error
                        setSentenceData({
                          chinese: `${currentCard!.hanzi}是一个很好的词。`,
                          english: `${currentCard!.english} is a good word.`
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
        </div>
      )}

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

      {/* Practice Modal */}
      <DictationModal
        isOpen={showPracticeModal}
        onClose={() => setShowPracticeModal(false)}
        chineseWord={currentCard?.hanzi || ''}
      />
    </>
  );
};

export default ReviewView;