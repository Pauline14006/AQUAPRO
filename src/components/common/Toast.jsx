import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(() => {});

/** Renders the single app-wide toast (styled by `.toast` in global.css). */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ message: '', type: 'success', show: false });
  const timer = useRef();

  const showToast = useCallback((message, type = 'success') => {
    clearTimeout(timer.current);
    setToast({ message, type, show: true });
    timer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className={`toast ${toast.type}${toast.show ? ' show' : ''}`} role="status" aria-live="polite">
        <i className={`fas ${toast.type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}`}></i>
        <span className="toast-message">{toast.message}</span>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
