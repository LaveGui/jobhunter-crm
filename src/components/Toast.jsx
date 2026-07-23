import React, { useEffect } from 'react';

export const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Se oculta automáticamente a los 5 segundos

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm animate-bounce-in">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl text-white text-sm font-medium ${
        isError ? 'bg-red-600' : 'bg-slate-900 dark:bg-slate-100 dark:text-slate-900 border border-slate-700'
      }`}>
        <span>{toast.message}</span>
        <button 
          onClick={onClose}
          className="ml-auto text-xs opacity-70 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
};