import React, { useEffect, useState } from 'react';
import Button from './Button';

type ModalAction = {
  key?: string;
  label: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'cancel';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  title?: string;
};

interface ModalProps {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClassName?: string; // e.g., 'max-w-md'
  actions?: ModalAction[]; // Flexible footer actions rendered as buttons
  footer?: React.ReactNode; // Custom footer content; overrides actions if provided
  footerJustify?: 'start' | 'center' | 'end' | 'between';
  footerClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  onClose,
  children,
  maxWidthClassName = 'max-w-lg',
  actions,
  footer,
  footerJustify = 'end',
  footerClassName,
}) => {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setShow(true));
      });
    } else {
      setShow(false);
      const timer = setTimeout(() => setIsMounted(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isMounted) return null;

  const justifyClass =
    footerJustify === 'start' ? 'justify-start' :
    footerJustify === 'center' ? 'justify-center' :
    footerJustify === 'between' ? 'justify-between' :
    'justify-end';

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-200 ease-in-out ${show ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      <div
        className={`bg-dark-custom rounded-2xl shadow-lg px-6 py-4 w-full ${maxWidthClassName} mx-4 transform transition-all duration-200 ease-in-out ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[20px]'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 border-b border-granite-custom pb-4 -mx-6 pl-6 pr-4">
          <h2 className="text-md text-light-custom">{title}</h2>
          <Button
            onClick={onClose}
            variant="cancel"
            size="sm"
            className="text-gray-custom hover:text-light-custom"
          >
            ✕
          </Button>
        </div>
        {children}

        {(footer || (actions && actions.length > 0)) && (
          <div className={`border-t-1 border-granite-custom mt-6 pt-4 -mx-6 px-6 flex ${justifyClass} gap-3 ${footerClassName || ''}`}>
            {footer ? (
              footer
            ) : (
              actions!.map((action, index) => (
                <Button
                  key={action.key || index}
                  onClick={action.onClick}
                  type={action.type}
                  variant={action.variant || 'primary'}
                  size={action.size || 'md'}
                  className={action.className}
                  disabled={action.disabled}
                  title={action.title}
                >
                  {action.label}
                </Button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};


