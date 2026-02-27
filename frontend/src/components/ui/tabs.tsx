import React, { createContext, useContext, useMemo, useState } from 'react';

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ value, defaultValue = '', onValueChange, className = '', children }) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeValue = value ?? internalValue;
  const setValue = (nextValue: string) => {
    if (value === undefined) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
  };

  const context = useMemo(() => ({ value: activeValue, setValue }), [activeValue]);

  return (
    <TabsContext.Provider value={context}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export const TabsList: React.FC<DivProps> = ({ className = '', ...props }) => (
  <div className={`inline-flex gap-1 rounded-md bg-gray-100 p-1 ${className}`.trim()} {...props} />
);

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, className = '', children, ...props }) => {
  const context = useContext(TabsContext);
  if (!context) return null;
  const isActive = context.value === value;

  return (
    <button
      type="button"
      className={`rounded px-3 py-1.5 text-sm transition-colors ${
        isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
      } ${className}`.trim()}
      onClick={() => context.setValue(value)}
      {...props}
    >
      {children}
    </button>
  );
};

interface TabsContentProps extends DivProps {
  value: string;
}

export const TabsContent: React.FC<TabsContentProps> = ({ value, className = '', children, ...props }) => {
  const context = useContext(TabsContext);
  if (!context || context.value !== value) return null;
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

