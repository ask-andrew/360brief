"use client";

import { useToast } from './use-toast';

export function Toaster() {
  const { toasts, dismissToast } = useToast();
  
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(({ id, title, description, variant, action }) => (
        <div
          key={id}
          className={`p-4 rounded-md min-w-[300px] max-w-sm ${
            variant === 'destructive' 
              ? 'bg-red-100 text-red-800' 
              : 'bg-gray-900 text-white'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{title}</div>
              {description && (
                <div className="text-sm opacity-90 mt-1">{description}</div>
              )}
            </div>
            <button
              onClick={() => dismissToast(id)}
              className="opacity-70 hover:opacity-100 ml-4"
              aria-label="Dismiss toast"
            >
              ✕
            </button>
          </div>
          {action && (
            <div className="mt-3">
              <button
                onClick={() => {
                  action.onClick();
                  dismissToast(id);
                }}
                className="text-sm font-medium underline hover:opacity-80"
              >
                {action.label}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Toaster;
