/**
 * BBZCloud Mobile - Settings Context
 * 
 * Manages application settings, app visibility, favorites, and theme
 * 
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';
import { NAVIGATION_APPS, STUDENT_ALLOWED_APPS, STORAGE_KEYS } from '../utils/constants';
import DatabaseService from '../services/DatabaseService';
import { useAuth } from './AuthContext';
import type { SettingsContextType, SettingsState, App, AppSettings } from '../types';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const { user } = useAuth();
  
  const [settings, setSettings] = useState<SettingsState>({
    theme: 'system',
    appVisibility: {},
    isLoading: true,
    user: null,
    availableApps: []
  });

  const [isLoading, setIsLoading] = useState(true);

  /**
   * Initialize settings on mount
   */
  useEffect(() => {
    loadSettings();
  }, []);

  /**
   * Update settings when user changes
   */
  useEffect(() => {
    if (user) {
      setSettings(prev => ({ ...prev, user }));
      loadUserSpecificSettings();
    }
  }, [user]);

  /**
   * Apply theme to document when it changes
   */
  useEffect(() => {
    const applyTheme = () => {
      const { theme } = settings;
      const htmlElement = document.documentElement;
      
      if (theme === 'dark') {
        htmlElement.classList.add('ion-palette-dark');
        document.body.classList.add('dark');
      } else if (theme === 'light') {
        htmlElement.classList.remove('ion-palette-dark');
        document.body.classList.remove('dark');
      } else {
        // System theme - check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          htmlElement.classList.add('ion-palette-dark');
          document.body.classList.add('dark');
        } else {
          htmlElement.classList.remove('ion-palette-dark');
          document.body.classList.remove('dark');
        }
      }
    };

    applyTheme();

    // Listen for system theme changes if using system theme
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  /**
   * Load all settings from storage
   */
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);

      // Load theme from preferences
      const themeResult = await Preferences.get({ key: STORAGE_KEYS.THEME });
      const theme = (themeResult.value as 'light' | 'dark' | 'system') || 'system';

      // Initialize available apps
      const availableApps = await getAvailableApps();

      setSettings(prev => ({
        ...prev,
        theme,
        availableApps,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load user-specific settings (app visibility)
   */
  const loadUserSpecificSettings = async () => {
    if (!user?.id) return;

    try {
      // Load app visibility
      const visibility = await DatabaseService.getAppVisibility(user.id);

      setSettings(prev => ({
        ...prev,
        appVisibility: visibility
      }));
    } catch (error) {
      console.error('Error loading user-specific settings:', error);
    }
  };

  /**
   * Get available apps based on user role
   */
  const getAvailableApps = async (): Promise<App[]> => {
    const allApps = Object.values(NAVIGATION_APPS);

    // If not authenticated, return all apps
    if (!user) {
      return allApps;
    }

    // Filter apps based on user role
    const filteredApps = allApps.filter(app => {
      // If app is teacher-only and user is not a teacher, exclude it
      if (app.teacherOnly && user.role !== 'teacher') {
        return false;
      }

      // For students, only show allowed apps
      if (user.role === 'student') {
        return STUDENT_ALLOWED_APPS.includes(app.id);
      }

      return true;
    });

    // Load visibility for each app
    const appsWithStatus = filteredApps.map(app => {
      const visibility = settings.appVisibility[app.id] ?? true;

      return {
        ...app,
        isVisible: visibility
      };
    });

    return appsWithStatus;
  };

  /**
   * Update general settings
   */
  const updateSettings = async (newSettings: Partial<AppSettings>): Promise<void> => {
    try {
      // Update theme if provided
      if (newSettings.theme) {
        await Preferences.set({
          key: STORAGE_KEYS.THEME,
          value: newSettings.theme
        });
      }

      // Update state
      setSettings(prev => ({
        ...prev,
        ...newSettings
      }));
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  /**
   * Toggle app visibility
   */
  const toggleAppVisibility = async (appId: string): Promise<void> => {
    if (!user?.id) return;

    try {
      const currentVisibility = settings.appVisibility[appId] ?? true;
      const newVisibility = !currentVisibility;

      await DatabaseService.setAppVisibility(user.id, appId, newVisibility);

      setSettings(prev => ({
        ...prev,
        appVisibility: {
          ...prev.appVisibility,
          [appId]: newVisibility
        }
      }));

      // Reload available apps to reflect changes
      const availableApps = await getAvailableApps();
      setSettings(prev => ({ ...prev, availableApps }));
    } catch (error) {
      console.error('Error toggling app visibility:', error);
      throw error;
    }
  };

  /**
   * Set theme
   */
  const setTheme = async (theme: 'light' | 'dark' | 'system'): Promise<void> => {
    try {
      await Preferences.set({
        key: STORAGE_KEYS.THEME,
        value: theme
      });

      setSettings(prev => ({ ...prev, theme }));
    } catch (error) {
      console.error('Error setting theme:', error);
      throw error;
    }
  };

  const value: SettingsContextType = {
    settings,
    updateSettings,
    toggleAppVisibility,
    setTheme,
    loadSettings,
    isLoading
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

/**
 * Hook to use settings context
 */
export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
