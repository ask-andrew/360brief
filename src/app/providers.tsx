'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { ToastProvider } from '@/components/ui/use-toast';
import { AuthProvider as StoreAuthProvider } from '@/providers/AuthProvider';
import { AuthProvider as ContextAuthProvider } from '@/contexts/AuthContext';
import { QueryProvider } from '@/providers/QueryProvider';

interface ProvidersProps {
  children: React.ReactNode;
  theme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

export function Providers({ 
  children, 
  theme = 'system',
  enableSystem = true,
  disableTransitionOnChange = true
}: ProvidersProps) {
  return (
    <NextThemesProvider 
      attribute="class"
      defaultTheme={theme}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
    >
      <ToastProvider>
        <QueryProvider>
          <ContextAuthProvider>
            <StoreAuthProvider>
              {children}
              <Toaster />
            </StoreAuthProvider>
          </ContextAuthProvider>
        </QueryProvider>
      </ToastProvider>
    </NextThemesProvider>
  );
}
