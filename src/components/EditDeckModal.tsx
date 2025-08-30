import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import ImageIcon from '../assets/Image.svg';

interface EditDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName: string;
  initialDescription?: string;
  initialImage?: string;
  onSave: (deck: { name: string; description?: string; image?: string }) => void;
}

export const EditDeckModal: React.FC<EditDeckModalProps> = ({ isOpen, onClose, initialName, initialDescription, initialImage, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState<string | undefined>(undefined);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName || '');
      setDescription(initialDescription || '');
      setError(null);
      setImage(initialImage);
    }
  }, [isOpen, initialName, initialDescription, initialImage]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    onSave({ name: name.trim(), description: description.trim() || undefined, image });
  };

  const handlePick = () => fileInputRef.current?.click();

  const handleFiles = (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];
    if (!/^image\/(png|jpe?g)$/.test(file.type)) return;
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Deck"
      maxWidthClassName="max-w-xl"
      actions={[
        { label: 'Cancel', variant: 'cancel', size: 'md', onClick: onClose },
        { label: 'Save', size: 'md', onClick: handleSave }
      ]}
    >
      <div className="flex pt-3 pb-8 gap-6">
        {/* Image placeholder */}
        <div
          className={`w-[145px] h-[174px] rounded-xl border ${dragActive ? 'border-blue-400 bg-blue-50/10' : 'border-granite-custom'} overflow-hidden flex items-center justify-center cursor-pointer`}
          onClick={handlePick}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          title="Change cover image"
        >
          {image ? (
            <img src={image} alt="Deck cover" className="w-full h-full object-cover" />
          ) : (
            <img src={ImageIcon} alt="Placeholder" className="w-6 h-6 opacity-70" />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Fields */}
        <div className="flex-1 space-y-4">
          <div>
            <label className="block text-xs text-silver-custom mb-1 text-left">Name</label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); if (error) setError(null); }}
              className={`input-custom focus-ring-gray-custom w-full px-3 py-2 bg-granite-custom text-light-custom rounded-lg focus:outline-none ${error ? 'ring-1 ring-red-500' : ''}`}
              placeholder="My Deck"
              autoFocus
            />
            {error && <p className="text-red-400 text-xs mt-1 text-left">{error}</p>}
          </div>
          <div>
            <label className="block text-xs text-silver-custom mb-1 text-left">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-custom focus-ring-gray-custom w-full px-3 py-2 bg-granite-custom text-light-custom rounded-lg focus:outline-none h-24"
              placeholder="Optional description"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};


