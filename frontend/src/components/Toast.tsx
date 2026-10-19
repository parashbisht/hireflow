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
            className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${
              toast.type === 'error'
                ? 'border-rose-200 border-l-4 border-l-rose-500 bg-rose-50 text-rose-900 dark:border-rose-900 dark:border-l-rose-400 dark:bg-rose-950 dark:text-rose-100'
                : 'border-emerald-200 border-l-4 border-l-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:border-l-emerald-400 dark:bg-emerald-950 dark:text-emerald-100'
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
