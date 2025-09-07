import React, { useState, useRef } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className = ""
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className={`relative flex justify-end ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            ${isFocused || value ? 'w-70' : 'w-23'} pl-8 pr-2 py-2
            bg-dark-custom border border-granite-custom rounded-3xl text-sm
            text-light-custom placeholder-gray-custom
            focus:outline-none focus:ring-1 focus:ring-neutral-700 focus:border-transparent
            transition-all duration-300 ease-in-out
            ${isFocused ? 'bg-neutral-700' : ''}
          `}
        />
        
        {/* Clear button */}
        {value && (
          <button
            onClick={handleClear}
            className="
              absolute right-3 top-1/2 transform -translate-y-1/2
              w-6 h-6 flex items-center justify-center
              text-gray-custom hover:text-light-custom
              hover:bg-neutral-700 rounded-full
              transition-colors duration-200
            "
            title="Clear search"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
        
        {/* Search icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-custom">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </div>
      </div>
    </div>
  );
};

export default SearchBar;
