import React from 'react';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: TooltipPosition;
  distance?: number;
  className?: string;
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  position = 'top',
  distance = 8,
  className = '',
  disabled = false 
}) => {
  if (disabled) {
    return <>{children}</>;
  }

  const getPositionClasses = (pos: TooltipPosition) => {
    switch (pos) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2';
    }
  };

  const getPositionStyle = (pos: TooltipPosition, dist: number) => {
    switch (pos) {
      case 'top':
        return { marginBottom: `${dist}px` };
      case 'bottom':
        return { marginTop: `${dist}px` };
      case 'left':
        return { marginRight: `${dist}px` };
      case 'right':
        return { marginLeft: `${dist}px` };
      default:
        return { marginBottom: `${dist}px` };
    }
  };


  return (
    <div className={`relative group ${className}`}>
      {children}
      <div 
        className={`pointer-events-none absolute z-50 px-2 py-1 rounded-lg bg-black/50 text-light-custom text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${getPositionClasses(position)}`}
        style={getPositionStyle(position, distance)}
      >
        {content}
      </div>
    </div>
  );
};

export default Tooltip;
