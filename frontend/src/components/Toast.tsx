import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type ToastType = 'success' | 'error';
type ToastMessage = { type: ToastType; message: string };
type ToastContextValue = (type: ToastType, message: string) => void;

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  return (
    <ToastContext.Provider value={(type, message) => setToast({ type, message })}>
      {children}
      {toast && (
        <div className="fixed left-4 right-4 top-4 z-[70] sm:left-auto sm:w-full sm:max-w-sm" aria-live="polite">
          <div
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={`flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm shadow-lg ${
              toast.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-green-200 bg-green-50 text-green-800'
            }`}
          >
            <p>{toast.message}</p>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Dismiss notification"
              className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const showToast = useContext(ToastContext);
  if (!showToast) throw new Error('useToast must be used within a ToastProvider');
  return showToast;
};
