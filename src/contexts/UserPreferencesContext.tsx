import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface UserPreferencesContextType {
  showExampleData: boolean;
  setShowExampleData: (show: boolean) => void;
  isFirstVisit: boolean;
  completeOnboarding: () => void;
}

const defaultContext: UserPreferencesContextType = {
  showExampleData: true, // Start with example data by default
  setShowExampleData: () => {},
  isFirstVisit: true,
  completeOnboarding: () => {},
};

const UserPreferencesContext = createContext<UserPreferencesContextType>(defaultContext);

export const UserPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [showExampleData, setShowExampleDataState] = useState<boolean>(true);
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedShowExampleData = localStorage.getItem('showExampleData');
    if (savedShowExampleData !== null) {
      setShowExampleDataState(savedShowExampleData === 'true');
    }

    const savedIsFirstVisit = localStorage.getItem('isFirstVisit');
    if (savedIsFirstVisit !== null) {
      setIsFirstVisit(savedIsFirstVisit === 'true');
    }
  }, []);

  const setShowExampleData = (show: boolean) => {
    setShowExampleDataState(show);
    localStorage.setItem('showExampleData', show.toString());
  };

  const completeOnboarding = () => {
    setIsFirstVisit(false);
    localStorage.setItem('isFirstVisit', 'false');  
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        showExampleData,
        setShowExampleData,
        isFirstVisit,
        completeOnboarding,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};
