import React, { useState } from 'react';
import { Modal } from './Modal';
import Button from './Button';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (card: { hanzi: string; pinyin?: string; english: string }) => void;
}

export const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [hanzi, setHanzi] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [english, setEnglish] = useState('');
  const [errors, setErrors] = useState<{ hanzi?: string; english?: string }>({});

  const handleAdd = () => {
    const nextErrors: { hanzi?: string; english?: string } = {};
    if (!hanzi.trim()) nextErrors.hanzi = 'Front is required';
    if (!english.trim()) nextErrors.english = 'Back is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onAdd({ hanzi: hanzi.trim(), pinyin: pinyin.trim() || undefined, english: english.trim() });
    // Keep modal open; clear form for next add
    setHanzi('');
    setPinyin('');
    setEnglish('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add card" maxWidthClassName="max-w-md">
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-silver-custom mb-1 text-left">Front</label>
          <input
            value={hanzi}
            onChange={(e) => {
              setHanzi(e.target.value);
              if (errors.hanzi) setErrors((prev) => ({ ...prev, hanzi: undefined }));
            }}
            className={`input-custom focus-ring-gray-custom w-full px-3 py-2 bg-granite-custom rounded-lg focus:outline-none ${errors.hanzi ? 'ring-1 ring-red-500' : ''}`}
            placeholder="你好"
            autoFocus
          />
          {errors.hanzi && <p className="text-red-400 text-xs mt-1 text-left">{errors.hanzi}</p>}
        </div>
        <div>
          <label className="block text-xs text-silver-custom mb-1 text-left">Pinyin (optional)</label>
          <input
            value={pinyin}
            onChange={(e) => setPinyin(e.target.value)}
            className="input-custom focus-ring-gray-custom w-full px-3 py-2 bg-granite-custom rounded-lg focus:outline-none"
            placeholder="nǐ hǎo"
          />
        </div>
        <div>
          <label className="block text-xs text-silver-custom mb-1 text-left">Back</label>
          <input
            value={english}
            onChange={(e) => {
              setEnglish(e.target.value);
              if (errors.english) setErrors((prev) => ({ ...prev, english: undefined }));
            }}
            className={`input-custom focus-ring-gray-custom w-full px-3 py-2 bg-granite-custom rounded-lg focus:outline-none ${errors.english ? 'ring-1 ring-red-500' : ''}`}
            placeholder="hello"
          />
          {errors.english && <p className="text-red-400 text-xs mt-1 text-left">{errors.english}</p>}
        </div>
      </div>

      <div className="border-t border-granite-custom mt-6 pt-4 flex justify-end gap-3">
        <Button onClick={onClose} variant="cancel" size="md">Cancel</Button>
        <Button onClick={handleAdd} size="md">Add</Button>
      </div>
    </Modal>
  );
};


