import React from 'react';
import { helpContent } from '../help-content';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEscapeKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleEscapeKey}
      tabIndex={-1}
    >
      <div className="bg-granite-custom rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6">
          <h2 className="text-xl font-medium text-light-custom">{helpContent.title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-custom hover:text-light-custom hover:bg-gray-600 rounded transition-colors"
            aria-label="Close help"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-12 text-left">
            {helpContent.sections.map((section, index) => (
              <div key={index} className="space-y-3">
                <h3 className="text-md font-medium text-light-custom text-left">
                  {section.title}
                </h3>
                <div className="text-silver-custom text-sm leading-relaxed whitespace-pre-line text-left">
                  {section.content.trim()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
