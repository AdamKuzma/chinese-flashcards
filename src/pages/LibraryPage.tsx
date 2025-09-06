import React, { useState } from 'react';
import { useFlashcardStore } from '../store';
import { formatTimeUntilDue } from '../utils';
import Button from '../components/Button';

export const LibraryPage: React.FC = () => {
  const { getAllCards } = useFlashcardStore();
  const [editingCard, setEditingCard] = useState<{id: string, field: 'hanzi' | 'english'} | null>(null);
  const [editValue, setEditValue] = useState('');

  const allCards = getAllCards();

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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-left">Library</h1>
        <div className="text-gray-custom text-sm">
          {allCards.length} total cards
        </div>
      </div>
      
      {/* Column Headers */}
      {allCards.length > 0 && (
        <div className="flex justify-between items-center py-3 border-b-1 border-granite-custom">
          <div className="flex items-center flex-1">
            <div className="w-20 text-left">
              <span className="text-xs text-silver-custom font-medium">FRONT</span>
            </div>
            <div className="flex-1 text-left">
              <span className="text-xs text-silver-custom font-medium">BACK</span>
            </div>
          </div>
          <div className="w-42 text-right mr-8">
            <span className="text-xs text-silver-custom font-medium">NEXT REVIEW</span>
          </div>
          <div className="w-8"></div>
        </div>
      )}
      
      <div className="space-y-0 flex-1 min-h-0 overflow-y-auto -mr-8 pr-8">
        {allCards.length === 0 ? (
          <p className="text-gray-custom">No cards yet. Add your first card to get started!</p>
        ) : (
          allCards.map((card, index) => (
            <div key={card.id} className={`flex justify-between items-center py-4 ${index < allCards.length - 1 ? 'border-b border-granite-custom' : ''}`}>
              <div className="flex items-center flex-1">
                <div className="w-20 text-left">
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
              <div className="w-42 text-right mr-8">
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
