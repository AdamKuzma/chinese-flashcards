import React from 'react';
import { helpContent } from '../help-content';
import { Modal } from './Modal';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={helpContent.title} maxWidthClassName="max-w-2xl">
      <div className="overflow-y-auto max-h-[70vh]">
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
    </Modal>
  );
};
