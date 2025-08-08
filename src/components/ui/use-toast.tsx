import * as React from 'react';
import ReactDOM from 'react-dom';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

const ToastContainer: React.FC<{ toasts: ToastMessage[] }> = ({ toasts }) => {
  const getToastClasses = (type: ToastType): string => {
    const baseClasses = 'border-l-4 p-4 rounded shadow-lg max-w-sm';
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-100 border-green-500 text-green-800`;
      case 'error':
        return `${baseClasses} bg-red-100 border-red-500 text-red-800`;
      case 'info':
      default:
        return `${baseClasses} bg-blue-100 border-blue-500 text-blue-800`;
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={getToastClasses(toast.type)}
        >
          <p className="font-medium">{toast.message}</p>
        </div>
      ))}
    </div>,
    document.body
  );
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const showToast = React.useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  const contextValue = React.useMemo(() => ({
    showToast
  }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
