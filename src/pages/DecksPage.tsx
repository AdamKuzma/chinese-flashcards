import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlashcardStore } from '../store';
import Button from '../components/Button';
import CardIcon from '../assets/Card.svg';
import PlusIcon from '../assets/Plus.svg';

interface DecksPageProps {
  onCreateDeck?: () => void;
}

export const DecksPage: React.FC<DecksPageProps> = ({ onCreateDeck }) => {
  const navigate = useNavigate();
  const { decks, cards, setSelectedDeckId } = useFlashcardStore();

  const handleDeckClick = (deckId: string) => {
    setSelectedDeckId(deckId);
    navigate(`/deck/${deckId}`);
  };

  const handleCreateDeck = () => {
    if (onCreateDeck) {
      onCreateDeck();
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-left">Decks</h1>
      </div>
      
      <div className="space-y-6 flex-1 min-h-0 overflow-y-auto -mr-8 pr-8">
        {decks.length === 0 ? (
          <div className="mt-24 text-center">
            <h3 className="text-lg text-light-custom mb-2">No Decks Created</h3>
            <p className="text-sm text-silver-custom mb-6">Create a new deck to start adding cards and learning.</p>
            <Button onClick={handleCreateDeck} size="md">Create deck</Button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 place-items-center gap-6 decks-grid-3">
            {decks.map((deck, idx) => (
              <div key={deck.id} className="text-left">
                <button
                  className="deck-card-btn group"
                  onClick={() => handleDeckClick(deck.id)}
                >
                  <div className="relative w-[164px] h-[196px]">
                    <div className={`absolute inset-0 bg-granite-custom rounded-2xl -z-10 transition-transform ${idx % 2 === 0 ? 'rotate-[2deg] group-hover:rotate-[4deg]' : 'rotate-[-2deg] group-hover:rotate-[-4deg]'}`} />
                    <div className={`relative w-full h-full bg-granite-custom rounded-2xl transition-transform transition-colors overflow-hidden flex items-center justify-center ${idx % 2 === 0 ? 'rotate-[-4deg] group-hover:rotate-[-6deg]' : 'rotate-[4deg] group-hover:rotate-[6deg]'} group-hover:scale-102 group-hover:bg-granite-custom/80`}>
                      {deck.image ? (
                        <img src={deck.image} alt="Deck" className="w-full h-full object-cover" draggable="false" />
                      ) : null}
                    </div>
                  </div>
                </button>
                <div className="mt-6 text-silver-custom text-sm truncate w-[164px] text-center">
                  <div>{deck.name}</div>
                  <div className="mt-1.5 text-gray-custom text-xs flex items-center justify-center">
                    <img src={CardIcon} alt="Card" className="w-4 h-4 mr-0.5" />
                    {cards.filter(card => deck.cardIds.includes(card.id)).length}
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={handleCreateDeck}
              className="text-left"
              title="Create deck"
              aria-label="Create deck"
            >
              <div className="w-[164px] h-[196px] flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-semidark-custom hover:bg-granite-custom transition-colors flex items-center justify-center">
                  <img src={PlusIcon} alt="Create deck" className="w-6 h-6" />
                </div>
              </div>
            </button>
          </div>
        )}
      </div>
    </>
  );
};
