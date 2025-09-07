import React, { useState, useMemo } from 'react';
import { useFlashcardStore } from '../store';
import { formatTimeUntilDue } from '../utils';
import { Button, SearchBar } from '../components';

type SortField = 'hanzi' | 'english' | 'due' | null;
type SortDirection = 'asc' | 'desc' | null;

export const LibraryPage: React.FC = () => {
  const { getAllCards } = useFlashcardStore();
  const [editingCard, setEditingCard] = useState<{id: string, field: 'hanzi' | 'english'} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const allCards = getAllCards();

  // Filter and sort cards
  const filteredCards = useMemo(() => {
    let cards = allCards;
    
    // Filter based on search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      cards = cards.filter(card => 
        card.hanzi.toLowerCase().includes(query) ||
        card.english.toLowerCase().includes(query) ||
        card.pinyin.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    if (sortField && sortDirection) {
      const chineseCollator = new Intl.Collator('zh-u-co-pinyin');
      
      cards = [...cards].sort((a, b) => {
        let comparison = 0;
        
        if (sortField === 'hanzi') {
          comparison = chineseCollator.compare(a.hanzi, b.hanzi);
        } else if (sortField === 'english') {
          comparison = a.english.localeCompare(b.english);
        } else if (sortField === 'due') {
          comparison = a.due - b.due;
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    return cards;
  }, [allCards, searchQuery, sortField, sortDirection]);

  const handleSort = (field: 'hanzi' | 'english' | 'due') => {
    if (sortField === field) {
      // Same field clicked - cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      // Different field clicked - start with asc
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDeleteCard = (cardId: string) => {
    useFlashcardStore.getState().deleteCard(cardId);
  };

  const handleStartEdit = (cardId: string, field: 'hanzi' | 'english', currentValue: string) => {
    setEditingCard({ id: cardId, field });
    setEditValue(currentValue);
  };

  const handleSaveEdit = () => {
    if (editingCard && editValue.trim()) {
      useFlashcardStore.getState().updateCard(editingCard.id, { [editingCard.field]: editValue.trim() });
    }
    setEditingCard(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
    setEditValue('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-left">Library</h1>
        <div className="text-gray-custom text-sm">
          {searchQuery ? `${filteredCards.length} of ${allCards.length} cards` : `${allCards.length} total cards`}
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search"
        />
      </div>
      
      {/* Column Headers */}
      {filteredCards.length > 0 && (
        <div className="flex justify-between items-center py-3 border-b-1 border-granite-custom">
          <div className="flex items-center flex-1">
            <div className="w-24 text-left">
              <button
                onClick={() => handleSort('hanzi')}
                className="column-header-button flex items-center gap-1 text-xs text-silver-custom font-medium px-2 py-1 rounded"
              >
                FRONT
                {sortField === 'hanzi' && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={sortDirection === 'asc' ? 'rotate-180' : ''}
                  >
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                )}
              </button>
            </div>
            <div className="flex-1 text-left">
              <button
                onClick={() => handleSort('english')}
                className="column-header-button flex items-center gap-1 text-xs text-silver-custom font-medium px-2 py-1 rounded"
              >
                BACK
                {sortField === 'english' && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={sortDirection === 'asc' ? 'rotate-180' : ''}
                  >
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="w-30 text-right">
            <button
              onClick={() => handleSort('due')}
              className="column-header-button flex items-center justify-end gap-1 text-xs text-silver-custom font-medium px-2 py-1 rounded text-right"
            >
              NEXT REVIEW
              {sortField === 'due' && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={sortDirection === 'asc' ? 'rotate-180' : ''}
                >
                  <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
              )}
            </button>
          </div>
          <div className="w-8"></div>
        </div>
      )}
      
      <div className="space-y-0 flex-1 min-h-0 overflow-y-auto -mr-8 pr-8">
        {filteredCards.length === 0 ? (
          <p className="text-gray-custom">
            {searchQuery ? `No cards found matching "${searchQuery}"` : "No cards yet. Add your first card to get started!"}
          </p>
        ) : (
          filteredCards.map((card, index) => (
            <div key={card.id} className={`flex justify-between items-center py-4 ${index < filteredCards.length - 1 ? 'border-b border-granite-custom' : ''}`}>
              <div className="flex items-center flex-1">
                <div className="w-24 text-left">
                  {editingCard?.id === card.id && editingCard?.field === 'hanzi' ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleSaveEdit}
                      onKeyDown={handleEditKeyDown}
                      className="input-edit w-full px-2 py-1 bg-granite-custom rounded"
                      autoFocus
                    />
                  ) : (
                    <span 
                      className="font-medium text-light-custom cursor-pointer hover:bg-granite-custom px-2 py-1 rounded"
                      onDoubleClick={() => handleStartEdit(card.id, 'hanzi', card.hanzi)}
                    >
                      {card.hanzi}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  {editingCard?.id === card.id && editingCard?.field === 'english' ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleSaveEdit}
                      onKeyDown={handleEditKeyDown}
                      className="input-edit w-full px-2 py-1 bg-granite-custom rounded"
                      autoFocus
                    />
                  ) : (
                    <span 
                      className="text-gray-custom cursor-pointer hover:bg-granite-custom px-2 py-1 rounded"
                      onDoubleClick={() => handleStartEdit(card.id, 'english', card.english)}
                    >
                      {card.english}
                    </span>
                  )}
                </div>
              </div>
              <div className="w-64 text-right mr-8">
                <span className={`text-sm ${card.due <= Date.now() ? 'text-silver-custom' : 'text-gray-custom'}`}>
                  {formatTimeUntilDue(card.due)}
                </span>
              </div>
              <Button
                onClick={() => handleDeleteCard(card.id)}
                variant="cancel"
                size="sm"
                className="w-8 h-8 flex items-center justify-center text-gray-custom hover:text-light-custom hover:bg-granite-custom rounded"
                title="Delete card"
              >
                ×
              </Button>
            </div>
          ))
        )}
      </div>
    </>
  );
};
