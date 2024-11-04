import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CustomApp = {
  id: string;
  title: string;
  url: string;
  favicon?: string;
};

type CustomAppsContextType = {
  apps: CustomApp[];
  addApp: (title: string, url: string) => Promise<void>;
  deleteApp: (id: string) => Promise<void>;
};

const CustomAppsContext = createContext<CustomAppsContextType | undefined>(undefined);

export const CustomAppsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apps, setApps] = useState<CustomApp[]>([]);

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      const storedApps = await AsyncStorage.getItem('customApps');
      if (storedApps) {
        setApps(JSON.parse(storedApps));
      }
    } catch (error) {
      console.error('Error loading apps:', error);
    }
  };

  const saveApps = async (newApps: CustomApp[]) => {
    try {
      await AsyncStorage.setItem('customApps', JSON.stringify(newApps));
    } catch (error) {
      console.error('Error saving apps:', error);
    }
  };

  const addApp = async (title: string, url: string) => {
    try {
      const newApp: CustomApp = {
        id: Date.now().toString(),
        title,
        url,
        favicon: `${new URL(url).origin}/favicon.ico`
      };
      const newApps = [...apps, newApp];
      setApps(newApps);
      await saveApps(newApps);
    } catch (error) {
      console.error('Error adding app:', error);
      throw error;
    }
  };

  const deleteApp = async (id: string) => {
    try {
      const newApps = apps.filter(app => app.id !== id);
      setApps(newApps);
      await saveApps(newApps);
    } catch (error) {
      console.error('Error deleting app:', error);
      throw error;
    }
  };

  return (
    <CustomAppsContext.Provider value={{ apps, addApp, deleteApp }}>
      {children}
    </CustomAppsContext.Provider>
  );
};

export const useCustomApps = () => {
  const context = useContext(CustomAppsContext);
  if (context === undefined) {
    throw new Error('useCustomApps must be used within a CustomAppsProvider');
  }
  return context;
};
