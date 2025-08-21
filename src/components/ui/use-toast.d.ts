import * as React from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export interface ToastContextType {
  toasts: Toast[];
  toast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

export declare function useToast(): ToastContextType;

export declare function ToastProvider({ children }: { children: React.ReactNode }): JSX.Element;
