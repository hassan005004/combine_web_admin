import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((type, message) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, type, message }]);
    window.setTimeout(() => removeToast(id), 3500);
  }, [removeToast]);

  useEffect(() => {
    function handleToast(event) {
      showToast(event.detail?.type || 'success', event.detail?.message || 'Saved successfully.');
    }

    window.addEventListener('admin-toast', handleToast);
    return () => window.removeEventListener('admin-toast', handleToast);
  }, [showToast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-5 top-5 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}

function ToastItem({ toast, onClose }) {
  const isSuccess = toast.type === 'success';

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${
        isSuccess
          ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-500/15 dark:text-green-200'
          : 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-200'
      }`}
      role="status"
    >
      <span className={`mt-0.5 h-2.5 w-2.5 rounded-full ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`} />
      <div className="min-w-0 flex-1 text-sm font-medium">{toast.message}</div>
      <button type="button" onClick={onClose} className="text-current opacity-70 hover:opacity-100" aria-label="Close toast">
        x
      </button>
    </div>
  );
}
