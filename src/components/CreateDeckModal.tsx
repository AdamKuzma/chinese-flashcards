import React, { useState } from 'react';
import Button from './Button';
import { Modal } from './Modal';

interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (deck: { name: string; description?: string }) => void;
}

export const CreateDeckModal: React.FC<CreateDeckModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), description: description.trim() || undefined });
    setName('');
    setDescription('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Deck">
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-silver-custom mb-1 text-left">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-custom focus-ring-gray-custom w-full px-3 py-2 bg-gray-custom/10 text-light-custom rounded-lg focus:outline-none"
            placeholder="My Deck"
            autoFocus
          />
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
        <Button onClick={handleCreate} size="md">Create</Button>
      </div>
    </Modal>
  );
};


