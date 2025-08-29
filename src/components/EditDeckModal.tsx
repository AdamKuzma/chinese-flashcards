import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import Button from './Button';

interface EditDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName: string;
  initialDescription?: string;
  onSave: (deck: { name: string; description?: string }) => void;
}

export const EditDeckModal: React.FC<EditDeckModalProps> = ({ isOpen, onClose, initialName, initialDescription, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName || '');
      setDescription(initialDescription || '');
      setError(null);
    }
  }, [isOpen, initialName, initialDescription]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    onSave({ name: name.trim(), description: description.trim() || undefined });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Deck">
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-silver-custom mb-1 text-left">Name</label>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); if (error) setError(null); }}
            className={`input-custom focus-ring-gray-custom w-full px-3 py-2 bg-gray-custom/10 text-light-custom rounded-lg focus:outline-none ${error ? 'ring-1 ring-red-500' : ''}`}
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
            className="input-custom focus-ring-gray-custom w-full px-3 py-2 bg-gray-custom/10 text-light-custom rounded-lg focus:outline-none h-24"
            placeholder="Optional description"
          />
        </div>
      </div>

      <div className="border-t border-granite-custom mt-6 pt-4 flex justify-end gap-3">
        <Button onClick={onClose} variant="cancel" size="md">Cancel</Button>
        <Button onClick={handleSave} size="md">Save</Button>
      </div>
    </Modal>
  );
};


