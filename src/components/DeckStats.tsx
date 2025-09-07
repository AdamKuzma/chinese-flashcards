import React from 'react';
import LockIcon from '../assets/Lock.svg';
import ClockIcon from '../assets/Clock.svg';
import FlowerIcon from '../assets/Flower.png';
import type { Card } from '../types';

interface DeckStatsProps {
  cards: Card[];
}

export const DeckStats: React.FC<DeckStatsProps> = ({ cards }) => {
  const now = Date.now();
  
  const newCount = cards.filter((c) => {
    const card = c as Card & { fsrsState?: string };
    return card.fsrsState === 'New' || (!('fsrsState' in card) && c.reps === 0);
  }).length;
  
  const dueCount = cards.filter((c) => {
    const card = c as Card & { fsrsState?: string };
    return c.due <= now && !c.suspended && (card.fsrsState !== 'New' && ('fsrsState' in card || c.reps > 0));
  }).length;
  
  const learnedCount = cards.filter((c) => {
    const card = c as Card & { fsrsState?: string };
    return (card.fsrsState === 'Review' || card.fsrsState === 'Relearning') && c.due > now;
  }).length;

  return (
    <div className="text-sm text-left text-silver-custom mt-2 flex items-center gap-2.5">
      <span className="flex items-center gap-1 relative group cursor-default">
        <img src={LockIcon} alt="New" className="w-4 h-4" />
        {newCount}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black/20 text-light-custom text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          New
        </div>
      </span>
      <span className="text-granite-custom cursor-default">|</span>
      <span className="flex items-center gap-1 relative group cursor-default">
        <img src={ClockIcon} alt="Due" className="w-4 h-4" />
        {dueCount}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black/20 text-light-custom text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Due
        </div>
      </span>
      <span className="text-granite-custom cursor-default">|</span>
      <span className="flex items-center gap-1 relative group cursor-default">
        <img src={FlowerIcon} alt="Learned" className="w-4.5 h-4.5 rotate-180" />
        {learnedCount}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black/20 text-light-custom text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Learned
        </div>
      </span>
    </div>
  );
};

export default DeckStats;
