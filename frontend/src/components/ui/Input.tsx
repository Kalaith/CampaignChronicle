// Input Component - Reusable input with validation and consistent styling

import React, { forwardRef, useState } from 'react';
import type { InputProps } from '../../types/components';

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  error,
  label,
  required = false,
  maxLength,
  autoFocus = false,
  className = '',
  testId,
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  const baseClasses = 'block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed sm:text-sm';
  const errorClasses = error ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500' : '';
  
  const inputClasses = [
    baseClasses,
    errorClasses,
    className
  ].filter(Boolean).join(' ');

  const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-1">
      {label && (
        <label 
          htmlFor={inputId}
          className={`block text-sm font-medium ${error ? 'text-red-700' : 'text-gray-700'}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          autoFocus={autoFocus}
          className={inputClasses}
          data-testid={testId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        
        {type === 'password' && (
          <PasswordToggle />
        )}
        
        {maxLength && (
          <CharacterCount 
            current={value?.length || 0} 
            max={maxLength} 
            visible={focused}
          />
        )}
      </div>
      
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Password toggle component
const PasswordToggle: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <button
      type="button"
      className="absolute inset-y-0 right-0 flex items-center pr-3"
      onClick={() => setShowPassword(!showPassword)}
    >
      {showPassword ? (
        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
        </svg>
      ) : (
        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );
};

// Character count indicator
const CharacterCount: React.FC<{
  current: number;
  max: number;
  visible: boolean;
}> = ({ current, max, visible }) => {
  if (!visible) return null;

  const percentage = (current / max) * 100;
  const color = percentage > 90 ? 'text-red-500' : percentage > 75 ? 'text-yellow-500' : 'text-gray-400';

  return (
    <div className="absolute -bottom-5 right-0">
      <span className={`text-xs ${color}`}>
        {current}/{max}
      </span>
    </div>
  );
};

// Search input with icon
export const SearchInput: React.FC<Omit<InputProps, 'type'> & {
  onClear?: () => void;
}> = ({ value, onChange, onClear, placeholder = 'Search...', ...props }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
    <Input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="pl-10 pr-10"
      {...props}
    />
    {value && onClear && (
      <button
        type="button"
        onClick={onClear}
        className="absolute inset-y-0 right-0 pr-3 flex items-center"
      >
        <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
  </div>
);

// Number input with increment/decrement buttons
export const NumberInput: React.FC<Omit<InputProps, 'type' | 'value' | 'onChange'> & {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}> = ({ value, onChange, min, max, step = 1, ...props }) => {
  const handleIncrement = () => {
    const newValue = value + step;
    if (max === undefined || newValue <= max) {
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = value - step;
    if (min === undefined || newValue >= min) {
      onChange(newValue);
    }
  };

  const handleInputChange = (inputValue: string) => {
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      onChange(numValue);
    }
  };

  return (
    <div className="relative">
      <Input
        type="number"
        value={value.toString()}
        onChange={handleInputChange}
        min={min}
        max={max}
        step={step}
        className="pr-16"
        {...props}
      />
      <div className="absolute inset-y-0 right-0 flex flex-col">
        <button
          type="button"
          onClick={handleIncrement}
          disabled={max !== undefined && value >= max}
          className="flex-1 px-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleDecrement}
          disabled={min !== undefined && value <= min}
          className="flex-1 px-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
};