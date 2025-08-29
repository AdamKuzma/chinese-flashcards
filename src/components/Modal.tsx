import React from 'react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClassName?: string; // e.g., 'max-w-md'
}

export const Modal: React.FC<ModalProps> = ({ isOpen, title, onClose, children, maxWidthClassName = 'max-w-md' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`bg-granite-custom rounded-lg shadow-lg p-6 w-full ${maxWidthClassName} mx-4`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-light-custom">{title}</h2>
          <Button
            onClick={onClose}
            variant="cancel"
            size="sm"
            className="text-gray-400 hover:text-light-custom"
          >
            ✕
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
};


