import React, { useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useFlashcardStore } from '../store';
import { DeckDetail } from '../components/DeckDetail';
import { Modal } from '../components/Modal';

export const DeckDetailPage: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { decks, setSelectedDeckId } = useFlashcardStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    <>
      <DeckDetail
        deckId={deckId!}
        onStartLesson={(cardIds) => {
          useFlashcardStore.getState().startReviewWithCardIds(cardIds);
          navigate('/review');
        }}
        onDeleteDeck={() => {
          setShowDeleteConfirm(true);
        }}
        onToast={(m) => {
          // Toast handling will be managed by the parent
          // We could emit a custom event or use a global state manager
          window.dispatchEvent(new CustomEvent('show-toast', { detail: m }));
        }}
      />
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        hideHeader={true}
        actions={[
          {
            key: 'cancel',
            label: 'Cancel',
            variant: 'cancel',
            onClick: () => setShowDeleteConfirm(false)
          },
          {
            key: 'delete',
            label: 'Delete',
            variant: 'primary',
            className: 'bg-red-600 hover:bg-red-700 text-white',
            onClick: () => {
              useFlashcardStore.getState().deleteDeck(deckId!);
              setShowDeleteConfirm(false);
              navigate('/');
              window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Deck deleted' }));
            }
          }
        ]}
      >
        <div className="text-light-custom">
          <p className="mb-2 mt-8">Are you sure you want to delete this deck?</p>
          <p className="text-gray-custom text-sm pb-8">Deleting a deck will remove all its cards.</p>
        </div>
      </Modal>
    </>
  );
};
