import React, { createContext, useContext, useMemo, useState } from 'react';

interface SelectContextValue {
  value: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onValueChange?: (value: string) => void;
}

const SelectContext = createContext<SelectContextValue | null>(null);

interface SelectProps {
  value: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [open, setOpen] = useState(false);
  const context = useMemo(
    () => ({ value, onValueChange, open, setOpen }),
    [value, onValueChange, open]
  );

  return (
    <SelectContext.Provider value={context}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
};

interface SelectTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ className = '', children }) => {
  const context = useContext(SelectContext);
  if (!context) return null;

  return (
    <button
      type="button"
      className={`inline-flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ${className}`.trim()}
      onClick={() => context.setOpen(!context.open)}
    >
      {children}
      <span className="ml-2 text-xs text-gray-500">v</span>
    </button>
  );
};

interface SelectValueProps {
  placeholder?: string;
}

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const context = useContext(SelectContext);
  if (!context) return null;
  return <span>{context.value || placeholder || 'Select'}</span>;
};

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const SelectContent: React.FC<SelectContentProps> = ({ className = '', children }) => {
  const context = useContext(SelectContext);
  if (!context || !context.open) return null;

  return (
    <div className={`absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg ${className}`.trim()}>
      {children}
    </div>
  );
};

interface SelectItemProps extends React.HTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
}

export const SelectItem: React.FC<SelectItemProps> = ({ value, className = '', children }) => {
  const context = useContext(SelectContext);
  if (!context) return null;

  const isActive = context.value === value;

  return (
    <button
      type="button"
      className={`block w-full px-3 py-2 text-left text-sm ${
        isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
      } ${className}`.trim()}
      onClick={() => {
        context.onValueChange?.(value);
        context.setOpen(false);
      }}
    >
      {children}
    </button>
  );
};

