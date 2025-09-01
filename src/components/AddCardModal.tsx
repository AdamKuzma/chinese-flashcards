import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useFlashcardStore } from '../store';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (card: { hanzi: string; pinyin?: string; english: string }) => void;
}

export const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [hanzi, setHanzi] = useState('');
  const [english, setEnglish] = useState('');
  const [errors, setErrors] = useState<{ hanzi?: string; english?: string }>({});
  
  // Get cards from store when needed to ensure we have the latest state

  // Check for duplicates when hanzi or english changes
  useEffect(() => {
    const nextErrors: { hanzi?: string; english?: string } = {};
    
    if (hanzi.trim()) {
      const currentCards = useFlashcardStore.getState().cards;
      const isDuplicate = currentCards.some(card => 
        card.hanzi.toLowerCase() === hanzi.trim().toLowerCase() ||
        card.english.toLowerCase() === hanzi.trim().toLowerCase()
      );
      if (isDuplicate) {
        nextErrors.hanzi = 'Card already exists';
      }
    }
    
    if (english.trim()) {
      const currentCards = useFlashcardStore.getState().cards;
      const isDuplicate = currentCards.some(card => 
        card.hanzi.toLowerCase() === english.trim().toLowerCase() ||
        card.english.toLowerCase() === english.trim().toLowerCase()
      );
      if (isDuplicate) {
        nextErrors.english = 'Card already exists';
      }
    }
    
    setErrors(nextErrors);
  }, [hanzi, english]);

  const handleAdd = () => {
    const nextErrors: { hanzi?: string; english?: string } = {};
    if (!hanzi.trim()) nextErrors.hanzi = 'Front is required';
    if (!english.trim()) nextErrors.english = 'Back is required';
    
    // Check for duplicates again before adding
    if (hanzi.trim() && english.trim()) {
      const currentCards = useFlashcardStore.getState().cards;
      const isDuplicate = currentCards.some(card => 
        card.hanzi.toLowerCase() === hanzi.trim().toLowerCase() ||
        card.english.toLowerCase() === english.trim().toLowerCase()
      );
      if (isDuplicate) {
        nextErrors.hanzi = 'Card already exists';
        nextErrors.english = 'Card already exists';
      }
    }
    
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onAdd({ hanzi: hanzi.trim(), english: english.trim() });
    // Keep modal open; clear form for next add
    setHanzi('');
    setEnglish('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add card"
      maxWidthClassName="max-w-xl"
      actions={[
        { label: 'Cancel', variant: 'cancel', size: 'md', onClick: onClose },
        { label: 'Add', size: 'md', onClick: handleAdd }
      ]}
    >
      <div className="flex justify-center py-6 gap-6">
        {/* Front field */}
        <div className="flex flex-col items-center">
          <label className="block text-xs text-silver-custom mb-2 text-center w-full">Front</label>
          <div className={`w-[206px] h-[246px] bg-granite-custom rounded-2xl flex items-center justify-center ${errors.hanzi ? 'ring-1 ring-red-500' : ''}`}>
            <input
              value={hanzi}
              onChange={(e) => {
                setHanzi(e.target.value);
                if (errors.hanzi) setErrors((prev) => ({ ...prev, hanzi: undefined }));
              }}
              className="bg-transparent text-xl text-light-custom placeholder:text-gray-custom text-center w-[90%] focus:outline-none"
              placeholder="你好"
              autoFocus
            />
          </div>
          <div className="h-8 flex items-center justify-center w-full">
            {errors.hanzi && <p className="text-red-400 text-xs text-center">{errors.hanzi}</p>}
          </div>
        </div>

        {/* Back field */}
        <div className="flex flex-col items-center">
          <label className="block text-xs text-silver-custom mb-2 text-center w-full">Back</label>
          <div className={`w-[206px] h-[246px] bg-granite-custom rounded-2xl flex items-center justify-center ${errors.english ? 'ring-1 ring-red-500' : ''}`}>
            <input
              value={english}
              onChange={(e) => {
                setEnglish(e.target.value);
                if (errors.english) setErrors((prev) => ({ ...prev, english: undefined }));
              }}
              className="bg-transparent text-xl text-light-custom placeholder:text-gray-custom text-center w-[90%] focus:outline-none"
              placeholder="hello"
            />
          </div>
          <div className="h-8 flex items-center justify-center w-full">
            {errors.english && <p className="text-red-400 text-xs text-center">{errors.english}</p>}
          </div>
        </div>
      </div>
    </Modal>
  );
};


