// Loading Overlay Component - Provides visual feedback for async operations

import React from 'react';
import type { LoadingSpinnerProps } from '../../types/components';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string | null;
  transparent?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message,
  transparent = false
}) => {
  if (!isLoading) return null;

  return (
    <div className={`
      fixed inset-0 z-50 flex items-center justify-center
      ${transparent ? 'bg-black bg-opacity-20' : 'bg-white bg-opacity-90'}
    `}>
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
        <div className="flex flex-col items-center">
          <LoadingSpinner size="lg" />
          {message && (
            <p className="mt-4 text-sm text-gray-600 text-center">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Reusable loading spinner component
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'blue',
  message,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const colorClasses = {
    blue: 'text-blue-600',
    gray: 'text-gray-600',
    white: 'text-white',
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg 
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color] || colorClasses.blue}`}
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {message && (
        <p className="mt-2 text-sm text-gray-600 text-center">
          {message}
        </p>
      )}
    </div>
  );
};

// Inline loading component for smaller areas
export const InlineLoading: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center py-8">
    <LoadingSpinner size="sm" />
    <span className="ml-2 text-sm text-gray-600">{message}</span>
  </div>
);

// Loading skeleton components
export const LoadingSkeleton: React.FC<{ 
  lines?: number; 
  className?: string 
}> = ({ 
  lines = 3, 
  className = '' 
}) => (
  <div className={`animate-pulse ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div 
        key={i} 
        className={`h-4 bg-gray-200 rounded mb-2 ${
          i === lines - 1 ? 'w-3/4' : 'w-full'
        }`} 
      />
    ))}
  </div>
);

export const LoadingCard: React.FC = () => (
  <div className="border rounded-lg p-4 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
    <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
    <div className="h-3 bg-gray-200 rounded w-1/4" />
  </div>
);

export const LoadingTable: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 4 
}) => (
  <div className="animate-pulse">
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-3 border-b flex space-x-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4 border-b flex space-x-4">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div 
              key={colIndex} 
              className={`h-4 bg-gray-200 rounded ${
                colIndex === 0 ? 'w-1/4' : 'flex-1'
              }`} 
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);