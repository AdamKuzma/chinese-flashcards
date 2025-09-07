import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import DecksIcon from '../assets/Decks.svg';
import DecksActiveIcon from '../assets/DecksActive.svg';
import LibraryIcon from '../assets/library.svg';
import LibraryActiveIcon from '../assets/LibraryActive.svg';
import StatsIcon from '../assets/Stats.svg';
import StatsActiveIcon from '../assets/StatsActive.svg';
import ProfileIcon from '../assets/Profile.svg';

export const Nav: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="nav-container flex items-center z-40">
      <Link
        to="/"
        className={`nav-icon-btn group ${isActive('/') ? 'active' : ''}`}
        title="Decks"
        aria-label="Decks"
      >
        <div className="nav-icon-wrapper">
          <img src={isActive('/') ? DecksActiveIcon : DecksIcon} alt="Decks" className="w-7 h-7" />
        </div>
        <div className="pointer-events-none absolute right-full px-2 py-1 rounded-lg bg-black/50 text-light-custom text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Decks
        </div>
      </Link>
      <Link
        to="/library"
        className={`nav-icon-btn group ${isActive('/library') ? 'active' : ''}`}
        title="Library"
        aria-label="Library"
      >
        <div className="nav-icon-wrapper">
          <img src={isActive('/library') ? LibraryActiveIcon : LibraryIcon} alt="Library" className="w-7 h-7" />
        </div>
        <div className="pointer-events-none absolute right-full px-2 py-1 rounded-lg bg-black/50 text-light-custom text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Library
        </div>
      </Link>
      <Link
        to="/stats"
        className={`nav-icon-btn group ${isActive('/stats') ? 'active' : ''}`}
        title="Stats"
        aria-label="Stats"
      >
        <div className="nav-icon-wrapper">
          <img src={isActive('/stats') ? StatsActiveIcon : StatsIcon} alt="Stats" className="w-7 h-7" />
        </div>
        <div className="pointer-events-none absolute right-full px-2 py-1 rounded-lg bg-black/50 text-light-custom text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Stats
        </div>
      </Link>
      <Link
        to="/profile"
        className={`nav-icon-btn group ${isActive('/profile') ? 'active' : ''}`}
        title="Profile"
        aria-label="Profile"
      >
        <div className="nav-icon-wrapper">
          <img src={ProfileIcon} alt="Profile" className="w-5.5 h-5.5" />
        </div>
        <div className="pointer-events-none absolute right-full px-2 py-1 rounded-lg bg-black/50 text-light-custom text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Profile
        </div>
      </Link>
    </div>
  );
};

export default Nav;


