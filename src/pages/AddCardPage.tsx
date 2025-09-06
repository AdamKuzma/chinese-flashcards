import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlashcardStore } from '../store';
import Button from '../components/Button';

export const AddCardPage: React.FC = () => {
  const navigate = useNavigate();
  const { cards, decks, addCard, setSelectedDeckId } = useFlashcardStore();
  
  const [newCardForm, setNewCardForm] = useState({
    hanzi: '',
    pinyin: '',
    english: '',
  });
  const [validationErrors, setValidationErrors] = useState({
    hanzi: '',
    english: '',
  });

  // Validation functions
  const checkForDuplicateCard = (field: 'hanzi' | 'english', value: string) => {
    if (!value.trim()) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
      return;
    }

    const isDuplicate = cards.some(card => 
      card[field].toLowerCase().trim() === value.toLowerCase().trim()
    );

    if (isDuplicate) {
      const fieldName = field === 'hanzi' ? 'Front' : 'Back';
      setValidationErrors(prev => ({ 
        ...prev, 
        [field]: `This ${fieldName} text already exists in another card` 
      }));
    } else {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleInputBlur = (field: 'hanzi' | 'english', value: string) => {
    checkForDuplicateCard(field, value);
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardForm.hanzi || !newCardForm.english) return;
    
    if (decks.length === 0) {
      // Navigate to create deck page or show modal
      navigate('/create-deck');
      return;
    }
    
    if (!useFlashcardStore.getState().selectedDeckId && decks.length > 0) {
      setSelectedDeckId(decks[0].id);
    }
    
    // Check for duplicates before submitting
    const hanziExists = cards.some(card => 
      card.hanzi.toLowerCase().trim() === newCardForm.hanzi.toLowerCase().trim()
    );
    const englishExists = cards.some(card => 
      card.english.toLowerCase().trim() === newCardForm.english.toLowerCase().trim()
    );

    if (hanziExists || englishExists) {
      if (hanziExists) {
        setValidationErrors(prev => ({ 
          ...prev, 
          hanzi: 'This Front text already exists in another card' 
        }));
      }
      if (englishExists) {
        setValidationErrors(prev => ({ 
          ...prev, 
          english: 'This Back text already exists in another card' 
        }));
      }
      return;
    }

    addCard({
      hanzi: newCardForm.hanzi,
      pinyin: newCardForm.pinyin || '',
      english: newCardForm.english,
    });
    setNewCardForm({ hanzi: '', pinyin: '', english: '' });
    setValidationErrors({ hanzi: '', english: '' });
    
    // Navigate back to decks or current deck
    const selectedDeckId = useFlashcardStore.getState().selectedDeckId;
    if (selectedDeckId) {
      navigate(`/deck/${selectedDeckId}`);
    } else {
      navigate('/');
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-left">Add Card</h1>
      </div>
      
      <div className="">
        <form onSubmit={handleAddCard} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-silver-custom mb-1 text-left">
                Front
              </label>
              <input
                type="text"
                value={newCardForm.hanzi}
                onChange={(e) => {
                  setNewCardForm({ ...newCardForm, hanzi: e.target.value });
                  if (validationErrors.hanzi) {
                    setValidationErrors(prev => ({ ...prev, hanzi: '' }));
                  }
                }}
                onBlur={(e) => handleInputBlur('hanzi', e.target.value)}
                className={`input-custom focus-ring-gray-custom w-full px-3 py-2 bg-granite-custom rounded-lg focus:outline-none ${
                  validationErrors.hanzi ? 'ring-1 ring-red-500' : ''
                }`}
                placeholder="你好"
                required
              />
              {validationErrors.hanzi && (
                <p className="text-red-400 text-xs mt-1 text-left">{validationErrors.hanzi}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-silver-custom mb-1 text-left">
                Back
              </label>
              <input
                type="text"
                value={newCardForm.english}
                onChange={(e) => {
                  setNewCardForm({ ...newCardForm, english: e.target.value });
                  if (validationErrors.english) {
                    setValidationErrors(prev => ({ ...prev, english: '' }));
                  }
                }}
                onBlur={(e) => handleInputBlur('english', e.target.value)}
                className={`input-custom focus-ring-gray-custom w-full px-3 py-2 bg-granite-custom rounded-lg focus:outline-none ${
                  validationErrors.english ? 'ring-1 ring-red-500' : ''
                }`}
                placeholder="hello"
                required
              />
              {validationErrors.english && (
                <p className="text-red-400 text-xs mt-1 text-left">{validationErrors.english}</p>
              )}
            </div>
          </div>
          <div className="border-t border-granite-custom mt-12 pt-6">
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                onClick={() => navigate(-1)}
                variant="cancel"
                size="md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="md"
              >
                Add
              </Button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};
