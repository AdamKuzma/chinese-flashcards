import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import Button from './Button';

interface EditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialHanzi: string;
  initialPinyin?: string;
  initialEnglish: string;
  onSave: (values: { hanzi: string; pinyin?: string; english: string }) => void;
}

export const EditCardModal: React.FC<EditCardModalProps> = ({
  isOpen,
  onClose,
  initialHanzi,
  initialPinyin,
  initialEnglish,
  onSave,
}) => {
  const [hanzi, setHanzi] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [english, setEnglish] = useState('');
  const [errors, setErrors] = useState<{ hanzi?: string; english?: string }>({});

  useEffect(() => {
    if (isOpen) {
      setHanzi(initialHanzi || '');
      setPinyin(initialPinyin || '');
      setEnglish(initialEnglish || '');
      setErrors({});
    }
  }, [isOpen, initialHanzi, initialPinyin, initialEnglish]);

  const handleSave = () => {
    const nextErrors: { hanzi?: string; english?: string } = {};
    if (!hanzi.trim()) nextErrors.hanzi = 'Front is required';
    if (!english.trim()) nextErrors.english = 'Back is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSave({ hanzi: hanzi.trim(), pinyin: pinyin.trim() || undefined, english: english.trim() });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit card" maxWidthClassName="max-w-md">
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-silver-custom mb-1 text-left">Front</label>
          <input
            value={hanzi}
            onChange={(e) => { setHanzi(e.target.value); if (errors.hanzi) setErrors((p) => ({ ...p, hanzi: undefined })); }}
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
            onChange={(e) => { setEnglish(e.target.value); if (errors.english) setErrors((p) => ({ ...p, english: undefined })); }}
            className={`input-custom focus-ring-gray-custom w-full px-3 py-2 bg-granite-custom rounded-lg focus:outline-none ${errors.english ? 'ring-1 ring-red-500' : ''}`}
            placeholder="hello"
          />
          {errors.english && <p className="text-red-400 text-xs mt-1 text-left">{errors.english}</p>}
        </div>
      </div>

      <div className="border-t border-granite-custom mt-6 pt-4 flex justify-end gap-3">
        <Button onClick={onClose} variant="cancel" size="md">Cancel</Button>
        <Button onClick={handleSave} size="md">Save</Button>
      </div>
    </Modal>
  );
};


