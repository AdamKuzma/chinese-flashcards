import React from 'react';
import DecksIcon from '../assets/Decks.svg';
import LibraryIcon from '../assets/Library.svg';
import StatsIcon from '../assets/Stats.svg';
import ProfileIcon from '../assets/Profile.svg';

type Tab = 'dashboard' | 'review' | 'browse' | 'add-card' | 'deck-detail';

interface NavProps {
  onNavigate: (tab: Tab) => void;
}

export const Nav: React.FC<NavProps> = ({ onNavigate }) => {
  return (
    <div className="absolute left-0 top-1 -translate-x-full transform z-40 flex flex-col items-center">
      <button
        onClick={() => onNavigate('dashboard')}
        className="relative group w-16 h-15 rounded-full hover:bg-granite-custom flex items-center justify-center"
        title="Decks"
        aria-label="Decks"
      >
        <img src={DecksIcon} alt="Decks" className="w-7 h-7" />
        <div className="pointer-events-none absolute right-full px-2 py-1 rounded bg-black/20 text-light-custom text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Decks
        </div>
      </button>
      <button
        onClick={() => onNavigate('browse')}
        className="relative group w-16 h-15 rounded-full hover:bg-granite-custom flex items-center justify-center"
        title="Library"
        aria-label="Library"
      >
        <img src={LibraryIcon} alt="Library" className="w-7 h-7" />
        <div className="pointer-events-none absolute right-full px-2 py-1 rounded bg-black/20 text-light-custom text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Library
        </div>
      </button>
      <button
        className="relative group w-16 h-15 rounded-full hover:bg-granite-custom flex items-center justify-center"
        title="Stats"
        aria-label="Stats"
      >
        <img src={StatsIcon} alt="Stats" className="w-7 h-7" />
        <div className="pointer-events-none absolute right-full px-2 py-1 rounded bg-black/20 text-light-custom text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Stats
        </div>
      </button>
      <button
        className="relative group w-16 h-15 rounded-full hover:bg-granite-custom flex items-center justify-center"
        title="Profile"
        aria-label="Profile"
      >
        <img src={ProfileIcon} alt="Profile" className="w-5.5 h-5.5" />
        <div className="pointer-events-none absolute right-full px-2 py-1 rounded bg-black/20 text-light-custom text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Profile
        </div>
      </button>
    </div>
  );
};

export default Nav;


