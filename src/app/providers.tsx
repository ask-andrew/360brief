'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/providers/AuthProvider';

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
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </NextThemesProvider>
  );
}
