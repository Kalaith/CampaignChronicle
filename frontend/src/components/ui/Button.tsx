// Button Component - Reusable button with consistent styling and behavior

import React, { forwardRef } from 'react';
import { LoadingSpinner } from './LoadingOverlay';
import type { ButtonProps } from '../../types/components';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  icon,
  fullWidth = false,
  children,
  className = '',
  testId,
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const widthClass = fullWidth ? 'w-full' : '';
  
  const buttonClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClass,
    className
  ].filter(Boolean).join(' ');

  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      className={buttonClasses}
      data-testid={testId}
      {...props}
    >
      {loading && (
        <LoadingSpinner 
          size="sm" 
          color={variant === 'ghost' ? 'gray' : 'white'} 
          className="mr-2" 
        />
      )}
      {icon && !loading && (
        <span className={children ? 'mr-2' : ''}>{icon}</span>
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

// Button group component for related actions
export const ButtonGroup: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`inline-flex rounded-md shadow-sm ${className}`} role="group">
    {React.Children.map(children, (child, index) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {
          className: `${child.props.className || ''} ${
            index === 0 ? 'rounded-r-none' : 
            index === React.Children.count(children) - 1 ? 'rounded-l-none border-l-0' :
            'rounded-none border-l-0'
          }`.trim()
        });
      }
      return child;
    })}
  </div>
);

// Icon button for actions without text
export const IconButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'children'> & {
  icon: React.ReactNode;
  'aria-label': string;
}>(({ icon, ...props }, ref) => (
  <Button ref={ref} {...props}>
    {icon}
  </Button>
));

IconButton.displayName = 'IconButton';