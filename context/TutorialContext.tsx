import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TutorialContextType = {
  showTutorial: boolean;
  setShowTutorial: (show: boolean) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
};

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showTutorial, setShowTutorial] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    checkFirstTime();
  }, []);

  const checkFirstTime = async () => {
    try {
      const hasSeenTutorial = await AsyncStorage.getItem('hasSeenTutorial');
      if (hasSeenTutorial === null) {
        setShowTutorial(true);
      } else {
        setShowTutorial(false);
      }
    } catch (error) {
      console.error('Error checking tutorial status:', error);
    }
  };

  return (
    <TutorialContext.Provider
      value={{
        showTutorial,
        setShowTutorial,
        currentStep,
        setCurrentStep,
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
