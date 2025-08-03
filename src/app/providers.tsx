'use client';

import { UserProvider as Auth0UserProvider } from '@auth0/nextjs-auth0/client';
import { ReactNode } from 'react';
import { UserPreferencesProvider } from '../context/UserPreferencesContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Auth0UserProvider>
      <UserPreferencesProvider>
        {children}
      </UserPreferencesProvider>
    </Auth0UserProvider>
  );
}
