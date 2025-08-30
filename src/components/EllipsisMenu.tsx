import React from 'react';
import { PopoverMenu } from './PopoverMenu';

interface EllipsisMenuProps {
  onExport: () => void;
  onImport: () => void;
}

export const EllipsisMenu: React.FC<EllipsisMenuProps> = ({ onExport, onImport }) => {
  return (
    <PopoverMenu
      className="fixed bottom-20 right-6 z-40"
      placement="top-right"
      trigger={({ onClick, ref }) => (
        <div className="relative">
          <button
            onClick={onClick}
            ref={ref as React.RefObject<HTMLButtonElement>}
            className="w-8 h-8 bg-granite-custom hover:bg-gray-600 text-light-custom rounded-full shadow-lg flex items-center justify-center transition-colors"
            aria-label="More options"
            title="More options"
          >
            <span className="text-md font-medium">⋯</span>
          </button>
        </div>
      )}
      actions={[
        { key: 'export', label: 'Export Data', onClick: onExport },
        { key: 'import', label: 'Import Data', onClick: onImport },
      ]}
    />
  );
};
