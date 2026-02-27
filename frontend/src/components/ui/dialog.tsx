import React, { createContext, useContext } from 'react';

interface DialogContextValue {
  onOpenChange?: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue>({});

interface DialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  return <DialogContext.Provider value={{ onOpenChange }}>{children}</DialogContext.Provider>;
};

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export const DialogContent: React.FC<DivProps> = ({ className = '', children, ...props }) => {
  const { onOpenChange } = useContext(DialogContext);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => onOpenChange?.(false)}
    >
      <div
        className={`w-full rounded-lg bg-white shadow-xl ${className}`.trim()}
        onClick={(event) => event.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    </div>
  );
};

export const DialogHeader: React.FC<DivProps> = ({ className = '', ...props }) => (
  <div className={`border-b border-gray-100 px-6 py-4 ${className}`.trim()} {...props} />
);

export const DialogTitle: React.FC<DivProps> = ({ className = '', ...props }) => (
  <h2 className={`text-lg font-semibold text-gray-900 ${className}`.trim()} {...props} />
);
