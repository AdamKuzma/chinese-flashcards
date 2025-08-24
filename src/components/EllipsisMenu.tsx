import React, { useState, useRef, useEffect } from 'react';
import Button from './Button';

interface EllipsisMenuProps {
  onExport: () => void;
  onImport: () => void;
}

export const EllipsisMenu: React.FC<EllipsisMenuProps> = ({ onExport, onImport }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleExport = () => {
    onExport();
    setIsOpen(false);
  };

  const handleImport = () => {
    onImport();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleToggle}
        className="fixed bottom-20 right-6 w-8 h-8 bg-granite-custom hover:bg-gray-600 text-light-custom rounded-full shadow-lg flex items-center justify-center transition-colors z-40"
        aria-label="More options"
        title="More options"
      >
        <span className="text-md font-medium">⋯</span>
      </button>

      {isOpen && (
        <div className="fixed bottom-28 right-6 bg-granite-custom rounded-lg shadow-lg border border-gray-600 z-50 min-w-32">
          <div className="py-1">
            <button
              onClick={handleExport}
              className="w-full px-4 py-2 text-left text-light-custom hover:bg-gray-600 transition-colors rounded-t-lg"
            >
              Export Data
            </button>
            <button
              onClick={handleImport}
              className="w-full px-4 py-2 text-left text-light-custom hover:bg-gray-600 transition-colors rounded-b-lg"
            >
              Import Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
