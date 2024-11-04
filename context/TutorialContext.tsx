import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TutorialContextType = {
  showTutorial: boolean;
  setShowTutorial: (show: boolean) => Promise<void>;
  currentStep: number;
  setCurrentStep: (step: number) => Promise<void>;
  showTutorialNextTime: boolean;
  setShowTutorialNextTime: (show: boolean) => void;
};

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showTutorialNextTime, setShowTutorialNextTime] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    checkFirstTime();
  }, []);

  const checkFirstTime = async () => {
    if (isInitialized) return;
    
    try {
      const hasSeenTutorial = await AsyncStorage.getItem('hasSeenTutorial');
      const shouldShowNextTime = await AsyncStorage.getItem('showTutorialNextTime');
      
      // Only show tutorial on first app launch
      if (hasSeenTutorial === null) {
        setShowTutorial(true);
      }

      setShowTutorialNextTime(shouldShowNextTime !== 'false');
      setIsInitialized(true);
    } catch (error) {
      console.error('Error checking tutorial status:', error);
    }
  };

  const handleSetShowTutorial = async (show: boolean) => {
    setShowTutorial(show);
    if (show) {
      // When manually showing tutorial, reset the storage state
      await AsyncStorage.removeItem('hasSeenTutorial');
    }
  };

  const handleSetCurrentStep = async (step: number) => {
    setCurrentStep(step);
  };

  const handleSetShowTutorialNextTime = async (show: boolean) => {
    setShowTutorialNextTime(show);
    await AsyncStorage.setItem('showTutorialNextTime', show.toString());
  };

  return (
    <TutorialContext.Provider
      value={{
        showTutorial,
        setShowTutorial: handleSetShowTutorial,
        currentStep,
        setCurrentStep: handleSetCurrentStep,
        showTutorialNextTime,
        setShowTutorialNextTime: handleSetShowTutorialNextTime,
      }}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};
