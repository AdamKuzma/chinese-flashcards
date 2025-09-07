import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Tooltip } from './Tooltip';
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
      <Tooltip content="Decks" position="left" distance={-2}>
        <Link
          to="/"
          className={`nav-icon-btn ${isActive('/') ? 'active' : ''}`}
          title="Decks"
          aria-label="Decks"
        >
          <div className="nav-icon-wrapper">
            <img src={isActive('/') ? DecksActiveIcon : DecksIcon} alt="Decks" className="w-7 h-7" />
          </div>
        </Link>
      </Tooltip>
      <Tooltip content="Library" position="left" distance={-2}>
        <Link
          to="/library"
          className={`nav-icon-btn ${isActive('/library') ? 'active' : ''}`}
          title="Library"
          aria-label="Library"
        >
          <div className="nav-icon-wrapper">
            <img src={isActive('/library') ? LibraryActiveIcon : LibraryIcon} alt="Library" className="w-7 h-7" />
          </div>
        </Link>
      </Tooltip>
      <Tooltip content="Stats" position="left" distance={-2}>
        <Link
          to="/stats"
          className={`nav-icon-btn ${isActive('/stats') ? 'active' : ''}`}
          title="Stats"
          aria-label="Stats"
        >
          <div className="nav-icon-wrapper">
            <img src={isActive('/stats') ? StatsActiveIcon : StatsIcon} alt="Stats" className="w-7 h-7" />
          </div>
        </Link>
      </Tooltip>
      <Tooltip content="Profile" position="left" distance={-2}>
        <Link
          to="/profile"
          className={`nav-icon-btn ${isActive('/profile') ? 'active' : ''}`}
          title="Profile"
          aria-label="Profile"
        >
          <div className="nav-icon-wrapper">
            <img src={ProfileIcon} alt="Profile" className="w-5.5 h-5.5" />
          </div>
        </Link>
      </Tooltip>
    </div>
  );
};

export default Nav;


