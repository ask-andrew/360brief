'use client';

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserPreferences = {
  showExampleData: boolean;
  // Add more preferences as needed
};

type UserPreferencesContextType = {
  preferences: UserPreferences;
  toggleExampleData: (show: boolean) => void;
  isUsingExampleData: boolean;
};

const defaultPreferences: UserPreferences = {
  showExampleData: true, // Default to showing example data for new users
};

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem('userPreferences');
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
    } catch (error) {
      console.error('Failed to load user preferences', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (!isInitialized) return;
    
    try {
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save user preferences', error);
    }
  }, [preferences, isInitialized]);

  const toggleExampleData = (show: boolean) => {
    setPreferences(prev => ({
      ...prev,
      showExampleData: show,
    }));
  };

  // Check if we should show example data
  // This would be enhanced to check if the user has connected accounts
  const isUsingExampleData = preferences.showExampleData; // && !hasConnectedAccounts;

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        toggleExampleData,
        isUsingExampleData,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
}
