import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  show: boolean;
  onHide: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  show, 
  onHide, 
  duration = 3000 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      // Small delay to ensure the element is rendered before starting transition
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show]);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Wait for transition to complete before calling onHide
        setTimeout(onHide, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onHide]);

  if (!show && !isVisible) return null;

  return (
    <div 
      className={`toast-container ${isVisible ? 'toast-show' : 'toast-hide'}`}
    >
      {message}
    </div>
  );
};
