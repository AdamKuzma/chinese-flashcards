import React from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useFlashcardStore } from '../store';
import { DeckDetail } from '../components/DeckDetail';

export const DeckDetailPage: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { decks, setSelectedDeckId } = useFlashcardStore();

  // Set the selected deck in the store
  React.useEffect(() => {
    setSelectedDeckId(deckId!);
  }, [deckId, setSelectedDeckId]);

  // Check if deck exists (after hooks to satisfy rules-of-hooks)
  const deck = decks.find(d => d.id === deckId);
  if (!deck) {
    return <Navigate to="/" replace />;
  }

  return (
    <DeckDetail
      deckId={deckId!}
      onStartLesson={(cardIds) => {
        useFlashcardStore.getState().startReviewWithCardIds(cardIds);
        navigate('/review');
      }}
      onDeleteDeck={() => {
        useFlashcardStore.getState().deleteDeck(deckId!);
        navigate('/');
      }}
      onToast={(m) => {
        // Toast handling will be managed by the parent
        // We could emit a custom event or use a global state manager
        window.dispatchEvent(new CustomEvent('show-toast', { detail: m }));
      }}
    />
  );
};
