import React, { useEffect, useRef, useState } from 'react';

export interface PopoverAction {
  key: string;
  label: React.ReactNode;
  onClick: () => void;
  className?: string;
}

interface PopoverMenuProps {
  trigger: (props: { onClick: () => void; ref: React.Ref<HTMLButtonElement> }) => React.ReactNode;
  actions: PopoverAction[];
  placement?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

export const PopoverMenu: React.FC<PopoverMenuProps> = ({ trigger, actions, placement = 'bottom-right', className = '' }) => {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target) && btnRef.current && !btnRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  const posClasses = {
    'bottom-right': 'top-full right-0 mt-2',
    'bottom-left': 'top-full left-0 mt-2',
    'top-right': 'bottom-full right-0 mb-2',
    'top-left': 'bottom-full left-0 mb-2',
  }[placement];

  return (
    <div className={`${className || 'relative'}`}>
      {trigger({ onClick: () => setOpen((v) => !v), ref: btnRef })}
      {mounted && (
        <div
          ref={menuRef}
          className={`absolute ${posClasses} bg-granite-custom rounded-lg shadow-2xl border border-neutral-700 z-50 min-w-40 transition-opacity duration-150 ease-in-out ${visible ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="py-1 px-1.5">
            {actions.map((action, idx) => (
              <button
                key={action.key}
                onClick={() => { action.onClick(); setOpen(false); }}
                className={`w-full px-4 py-1.5 text-left text-sm text-light-custom hover:bg-neutral-700 transition-colors my-0.5 rounded-md ${action.className || ''}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PopoverMenu;


