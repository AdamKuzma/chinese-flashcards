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
                    {/* Bottom card */}
                    <div className={`absolute inset-0 bg-granite-custom rounded-2xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] shadow-[0px_12px_20px_0px_rgba(10,18,36,0.05)] group-hover:shadow-[0px_16px_28px_0px_rgba(10,18,36,0.08)] -z-20 transition-all ${
                      idx % 2 === 0 
                        ? '-rotate-[5deg] translate-y-[8px] group-hover:-rotate-[7deg] group-hover:translate-y-[10px] group-hover:-translate-x-[3px]' 
                        : 'rotate-[6deg] -translate-y-[6px] group-hover:rotate-[8deg] group-hover:translate-y-[2px] group-hover:translate-x-[0px]'
                    }`} />
                    
                    {/* Mid card */}
                    <div className={`absolute inset-0 bg-granite-custom rounded-2xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] shadow-[0px_12px_20px_0px_rgba(10,18,36,0.05)] group-hover:shadow-[0px_16px_28px_0px_rgba(10,18,36,0.08)] -z-10 transition-all ${
                      idx % 2 === 0 
                        ? 'rotate-[2deg] -translate-y-[8px] group-hover:rotate-[4deg] group-hover:-translate-y-[15px] group-hover:-translate-x-[3px]' 
                        : '-rotate-[4deg] -translate-y-[6px] group-hover:-rotate-[6deg] group-hover:-translate-y-[13px] group-hover:-translate-x-[3px]'
                    }`} />
                    
                    {/* Front card */}
                    <div className={`relative w-full h-full bg-granite-custom rounded-2xl shadow-[0px_12px_20px_0px_rgba(10,18,36,0.05)] group-hover:shadow-[0px_16px_28px_0px_rgba(10,18,36,0.08)] transition-all overflow-hidden flex items-center justify-center group-hover:-translate-y-[6px] group-hover:scale-100 after:absolute after:inset-0 after:rounded-2xl after:border after:border-white/5 after:pointer-events-none`}>
                      {deck.image ? (
                        <img src={deck.image} alt="Deck" className="w-full h-full object-cover rounded-xl" draggable="false" />
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
                <div className="w-12 h-12 rounded-full plus-button-circle flex items-center justify-center">
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
