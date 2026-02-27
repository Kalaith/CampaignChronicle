import React from 'react';

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export const Card: React.FC<DivProps> = ({ className = '', ...props }) => (
  <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`.trim()} {...props} />
);

export const CardHeader: React.FC<DivProps> = ({ className = '', ...props }) => (
  <div className={`border-b border-gray-100 p-4 ${className}`.trim()} {...props} />
);

export const CardContent: React.FC<DivProps> = ({ className = '', ...props }) => (
  <div className={`p-4 ${className}`.trim()} {...props} />
);

export const CardTitle: React.FC<DivProps> = ({ className = '', ...props }) => (
  <div className={`text-base font-semibold text-gray-900 ${className}`.trim()} {...props} />
);

