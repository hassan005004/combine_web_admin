import { createContext, useContext, useState } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  function confirmDelete({ title = 'Delete record', message = 'This action cannot be undone.', confirmLabel = 'Delete' } = {}) {
    return new Promise((resolve) => {
      setDialog({ title, message, confirmLabel, resolve });
    });
  }

  function close(value) {
    dialog?.resolve(value);
    setDialog(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirmDelete }}>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{dialog.title}</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{dialog.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => close(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100"
              >
                Cancel
              </button>
              <button type="button" onClick={() => close(true)} className="px-4 py-2 rounded-lg bg-red-600 text-white">
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used inside ConfirmProvider');
  }
  return context;
}
