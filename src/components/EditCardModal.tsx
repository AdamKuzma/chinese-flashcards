import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';

interface EditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialHanzi: string;
  initialEnglish: string;
  onSave: (values: { hanzi: string; english: string }) => void;
}

export const EditCardModal: React.FC<EditCardModalProps> = ({
  isOpen,
  onClose,
  initialHanzi,
  initialEnglish,
  onSave,
}) => {
  const [hanzi, setHanzi] = useState('');
  const [english, setEnglish] = useState('');
  const [errors, setErrors] = useState<{ hanzi?: string; english?: string }>({});

  useEffect(() => {
    if (isOpen) {
      setHanzi(initialHanzi || '');
      setEnglish(initialEnglish || '');
      setErrors({});
    }
  }, [isOpen, initialHanzi, initialEnglish]);

  const handleSave = () => {
    const nextErrors: { hanzi?: string; english?: string } = {};
    if (!hanzi.trim()) nextErrors.hanzi = 'Front is required';
    if (!english.trim()) nextErrors.english = 'Back is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSave({ hanzi: hanzi.trim(), english: english.trim() });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit card"
      maxWidthClassName="max-w-xl"
      actions={[
        { label: 'Cancel', variant: 'cancel', size: 'md', onClick: onClose },
        { label: 'Save', size: 'md', onClick: handleSave }
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


