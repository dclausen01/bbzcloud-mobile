import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TutorialContextType = {
  showTutorial: boolean;
  setShowTutorial: (show: boolean) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  showTutorialNextTime: boolean;
  setShowTutorialNextTime: (show: boolean) => void;
};

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showTutorial, setShowTutorial] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [showTutorialNextTime, setShowTutorialNextTime] = useState(true);

  useEffect(() => {
    checkFirstTime();
  }, []);

  const checkFirstTime = async () => {
    try {
      const hasSeenTutorial = await AsyncStorage.getItem('hasSeenTutorial');
      const shouldShowNextTime = await AsyncStorage.getItem('showTutorialNextTime');
      
      if (hasSeenTutorial === null || shouldShowNextTime === 'true') {
        setShowTutorial(true);
      } else {
        setShowTutorial(false);
      }

      // Set the checkbox state based on stored preference
      setShowTutorialNextTime(shouldShowNextTime !== 'false');
    } catch (error) {
      console.error('Error checking tutorial status:', error);
    }
  };

  // Wrap the setShowTutorial function to handle AsyncStorage
  const handleSetShowTutorial = async (show: boolean) => {
    setShowTutorial(show);
    if (show) {
      // When manually showing tutorial, reset the storage state
      await AsyncStorage.removeItem('hasSeenTutorial');
      await AsyncStorage.setItem('showTutorialNextTime', 'true');
      setShowTutorialNextTime(true);
    }
  };

  // Wrap the setCurrentStep function to ensure tutorial is shown
  const handleSetCurrentStep = (step: number) => {
    setCurrentStep(step);
    if (step === 0) {
      handleSetShowTutorial(true);
    }
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
