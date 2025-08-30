import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'cancel';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  title?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  title,
}) => {
  const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none';
  
  const variantClasses = {
    primary: 'btn-add bg-granite-custom text-light-custom hover:bg-granite-custom hover:opacity-90',
    secondary: 'bg-granite-custom text-light-custom hover:bg-granite-custom hover:opacity-90',
    cancel: 'btn-cancel text-silver-custom hover:text-gray-custom'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  return (
    <button
      type={type}
      onClick={onClick}
      className={classes}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
};

export default Button;
