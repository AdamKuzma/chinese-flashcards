import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlashcardStore } from '../store';
import { ReviewView } from '../components/ReviewView';

export const ReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { isReviewing, sessionQueue, selectedDeckId, clearSession, sessionInitialCount } = useFlashcardStore();
  const [isShowingCompletion, setIsShowingCompletion] = useState(false);
  const justCompleted = !isReviewing && sessionInitialCount > 0;

  // Check if there's an active session when the page loads
  useEffect(() => {
    // If there's no active session or no cards in the queue, redirect to decks
    // But only if we're not showing the completion screen or a session just completed
    if ((!isReviewing || sessionQueue.length === 0) && !isShowingCompletion && !justCompleted) {
      if (selectedDeckId) {
        navigate(`/deck/${selectedDeckId}`);
      } else {
        navigate('/');
      }
    }
  }, [isReviewing, sessionQueue.length, selectedDeckId, navigate, isShowingCompletion, justCompleted]);

  // If a session just completed, immediately show completion state to block redirects
  useEffect(() => {
    if (justCompleted) {
      setIsShowingCompletion(true);
    }
  }, [justCompleted]);

  // Note: We don't automatically clear the session here to allow for page refreshes
  // The session will be cleared when the user completes the review or navigates away explicitly

  const handleBackToDeck = () => {
    clearSession(); // Clear session when user explicitly navigates away
    setIsShowingCompletion(false); // Reset completion state
    if (selectedDeckId) {
      navigate(`/deck/${selectedDeckId}`);
    } else {
      navigate('/');
    }
  };

  const handleCompletionStateChange = (isShowingCompletion: boolean) => {
    setIsShowingCompletion(isShowingCompletion);
  };

  // Don't render anything if there's no active session and not showing completion (or just completed)
  if ((!isReviewing || sessionQueue.length === 0) && !isShowingCompletion && !justCompleted) {
    return null;
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto -mr-8 pr-8">
      <div className="space-y-6">
        <ReviewView 
          onBackToDeck={handleBackToDeck} 
          onCompletionStateChange={handleCompletionStateChange}
        />
      </div>
    </div>
  );
};
