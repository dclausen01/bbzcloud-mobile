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
    favoriteApps: [],
    hapticFeedback: true,
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
   * Load all settings from storage
   */
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);

      // Load theme from preferences
      const themeResult = await Preferences.get({ key: STORAGE_KEYS.THEME });
      const theme = (themeResult.value as 'light' | 'dark' | 'system') || 'system';

      // Load haptic feedback preference
      const hapticResult = await Preferences.get({ key: 'haptic_feedback' });
      const hapticFeedback = hapticResult.value !== 'false';

      // Initialize available apps
      const availableApps = await getAvailableApps();

      setSettings(prev => ({
        ...prev,
        theme,
        hapticFeedback,
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
   * Load user-specific settings (app visibility, favorites)
   */
  const loadUserSpecificSettings = async () => {
    if (!user?.id) return;

    try {
      // Load app visibility
      const visibility = await DatabaseService.getAppVisibility(user.id);

      // Load favorites
      const favoritesResult = await DatabaseService.getFavorites();
      const favoriteApps = favoritesResult.success && favoritesResult.data
        ? favoritesResult.data.map(f => f.appId)
        : [];

      setSettings(prev => ({
        ...prev,
        appVisibility: visibility,
        favoriteApps
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

    // Load favorites status and visibility for each app
    const appsWithStatus = await Promise.all(
      filteredApps.map(async app => {
        const isFavorite = await DatabaseService.isFavorite(app.id);
        const visibility = settings.appVisibility[app.id] ?? true;

        return {
          ...app,
          isFavorite,
          isVisible: visibility
        };
      })
    );

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

      // Update haptic feedback if provided
      if (newSettings.hapticFeedback !== undefined) {
        await Preferences.set({
          key: 'haptic_feedback',
          value: String(newSettings.hapticFeedback)
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
   * Toggle favorite status for an app
   */
  const toggleFavorite = async (appId: string): Promise<void> => {
    try {
      const isFavorite = settings.favoriteApps.includes(appId);

      if (isFavorite) {
        await DatabaseService.removeFavorite(appId);
        setSettings(prev => ({
          ...prev,
          favoriteApps: prev.favoriteApps.filter(id => id !== appId)
        }));
      } else {
        await DatabaseService.addFavorite(appId);
        setSettings(prev => ({
          ...prev,
          favoriteApps: [...prev.favoriteApps, appId]
        }));
      }

      // Reload available apps to reflect changes
      const availableApps = await getAvailableApps();
      setSettings(prev => ({ ...prev, availableApps }));
    } catch (error) {
      console.error('Error toggling favorite:', error);
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
    toggleFavorite,
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
