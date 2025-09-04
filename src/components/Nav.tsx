import React from 'react';
import DecksIcon from '../assets/Decks.svg';
import LibraryIcon from '../assets/library.svg';
import StatsIcon from '../assets/Stats.svg';
import ProfileIcon from '../assets/Profile.svg';

type Tab = 'dashboard' | 'review' | 'browse' | 'add-card' | 'deck-detail' | 'profile' | 'stats';

interface NavProps {
  onNavigate: (tab: Tab) => void;
}

export const Nav: React.FC<NavProps> = ({ onNavigate }) => {
  return (
    <div className="nav-container flex items-center z-40">
      <button
        onClick={() => onNavigate('dashboard')}
        className="nav-icon-btn group"
        title="Decks"
        aria-label="Decks"
      >
        <div className="nav-icon-wrapper">
          <img src={DecksIcon} alt="Decks" className="w-7 h-7" />
        </div>
        <div className="pointer-events-none absolute right-full px-2 py-1 rounded bg-black/20 text-light-custom text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Decks
        </div>
      </button>
      <button
        onClick={() => onNavigate('browse')}
        className="nav-icon-btn group"
        title="Library"
        aria-label="Library"
      >
        <div className="nav-icon-wrapper">
          <img src={LibraryIcon} alt="Library" className="w-7 h-7" />
        </div>
        <div className="pointer-events-none absolute right-full px-2 py-1 rounded bg-black/20 text-light-custom text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Library
        </div>
      </button>
      <button
        onClick={() => onNavigate('stats')}
        className="nav-icon-btn group"
        title="Stats"
        aria-label="Stats"
      >
        <div className="nav-icon-wrapper">
          <img src={StatsIcon} alt="Stats" className="w-7 h-7" />
        </div>
        <div className="pointer-events-none absolute right-full px-2 py-1 rounded bg-black/20 text-light-custom text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Stats
        </div>
      </button>
      <button
        onClick={() => onNavigate('profile')}
        className="nav-icon-btn group"
        title="Profile"
        aria-label="Profile"
      >
        <div className="nav-icon-wrapper">
          <img src={ProfileIcon} alt="Profile" className="w-5.5 h-5.5" />
        </div>
        <div className="pointer-events-none absolute right-full px-2 py-1 rounded bg-black/20 text-light-custom text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Profile
        </div>
      </button>
    </div>
  );
};

export default Nav;


