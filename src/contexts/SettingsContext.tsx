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
import type { SettingsContextType, SettingsState, App, AppSettings, CustomApp } from '../types';

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

  const [customApps, setCustomApps] = useState<CustomApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load custom apps from database
   */
  const loadCustomApps = useCallback(async (): Promise<void> => {
    try {
      const result = await DatabaseService.getCustomApps(user?.id);
      if (result.success && result.data) {
        setCustomApps(result.data);
      }
    } catch (error) {
      console.error('Error loading custom apps:', error);
    }
  }, [user?.id]);

  /**
   * Initialize settings on mount
   */
  useEffect(() => {
    loadSettings();
  }, []);

  /**
   * Load custom apps when user changes
   */
  useEffect(() => {
    if (user) {
      loadCustomApps();
    }
  }, [user, loadCustomApps]);

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

  /**
   * Add a new custom app
   */
  const addCustomApp = async (app: Omit<CustomApp, 'id' | 'orderIndex' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    try {
      const newApp = {
        id: `custom_${Date.now()}`,
        ...app,
        userId: user?.id,
        orderIndex: customApps.length,
      };

      const result = await DatabaseService.saveCustomApp(newApp);
      if (result.success) {
        await loadCustomApps();
      } else {
        throw new Error(result.error || 'Failed to add custom app');
      }
    } catch (error) {
      console.error('Error adding custom app:', error);
      throw error;
    }
  };

  /**
   * Update an existing custom app
   */
  const updateCustomApp = async (
    id: string,
    app: Omit<CustomApp, 'id' | 'orderIndex' | 'createdAt' | 'updatedAt'>
  ): Promise<void> => {
    try {
      const result = await DatabaseService.updateCustomApp(id, app);
      if (result.success) {
        await loadCustomApps();
      } else {
        throw new Error(result.error || 'Failed to update custom app');
      }
    } catch (error) {
      console.error('Error updating custom app:', error);
      throw error;
    }
  };

  /**
   * Delete a custom app
   */
  const deleteCustomApp = async (id: string): Promise<void> => {
    try {
      const result = await DatabaseService.deleteCustomApp(id);
      if (result.success) {
        await loadCustomApps();
      } else {
        throw new Error(result.error || 'Failed to delete custom app');
      }
    } catch (error) {
      console.error('Error deleting custom app:', error);
      throw error;
    }
  };

  const value: SettingsContextType = {
    settings,
    customApps,
    updateSettings,
    toggleAppVisibility,
    setTheme,
    loadSettings,
    loadCustomApps,
    addCustomApp,
    updateCustomApp,
    deleteCustomApp,
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
