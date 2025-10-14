/**
 * BBZCloud Mobile - App Switcher Context
 * 
 * Manages multiple loaded apps with memory management and navigation
 * 
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { App, LoadedApp, AppSwitcherContextType } from '../types';
import BrowserService from '../services/BrowserService';
import { isPlatform } from '@ionic/react';

const AppSwitcherContext = createContext<AppSwitcherContextType | undefined>(undefined);

export const useAppSwitcher = (): AppSwitcherContextType => {
  const context = useContext(AppSwitcherContext);
  if (!context) {
    throw new Error('useAppSwitcher must be used within an AppSwitcherProvider');
  }
  return context;
};

interface AppSwitcherProviderProps {
  children: React.ReactNode;
}

export const AppSwitcherProvider: React.FC<AppSwitcherProviderProps> = ({ children }) => {
  const [loadedApps, setLoadedApps] = useState<LoadedApp[]>([]);
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Max loaded apps based on platform (memory considerations)
  const MAX_LOADED_APPS = isPlatform('tablet') ? 8 : 5;

  /**
   * Generate unique webview ID for an app
   */
  const generateWebViewId = useCallback((appId: string): string => {
    return `webview_${appId}_${Date.now()}`;
  }, []);

  /**
   * Get memory usage estimate (simplified for now)
   */
  const getMemoryUsage = useCallback((): number => {
    // Each app uses approximately 50-100MB
    const avgMemoryPerApp = 75;
    return loadedApps.length * avgMemoryPerApp;
  }, [loadedApps.length]);

  /**
   * Check if we need to unload apps for memory management
   */
  const shouldUnloadApps = useCallback((): boolean => {
    return loadedApps.length >= MAX_LOADED_APPS;
  }, [loadedApps.length, MAX_LOADED_APPS]);

  /**
   * Unload least recently used app
   */
  const unloadLRUApp = useCallback((): void => {
    if (loadedApps.length === 0) return;

    // Find least recently accessed app that's not currently active
    const sortedApps = [...loadedApps]
      .filter(app => !app.isActive)
      .sort((a, b) => a.lastAccessed.getTime() - b.lastAccessed.getTime());

    if (sortedApps.length > 0) {
      const appToUnload = sortedApps[0];
      console.log(`[AppSwitcher] Unloading LRU app: ${appToUnload.title}`);
      
      setLoadedApps(prev => prev.filter(app => app.appId !== appToUnload.appId));
      
      // Close the webview if needed
      if (BrowserService.getCurrentAppId() === appToUnload.appId) {
        BrowserService.close();
      }
    }
  }, [loadedApps]);

  /**
   * Open a new app or switch to existing loaded app
   */
  const openApp = useCallback(async (app: App): Promise<void> => {
    try {
      // Check if this app should use iframe
      if (BrowserService.shouldUseIframe(app.id)) {
        console.log(`[AppSwitcher] Opening ${app.title} in iframe`);
        
        // Navigate to AppViewer page with app details
        const state = {
          url: app.url,
          appName: app.title,
          toolbarColor: app.color
        };
        
        // Use window.location for navigation (works without router context)
        window.history.pushState(state, '', '/app-viewer');
        
        // Dispatch popstate event to trigger router update
        window.dispatchEvent(new PopStateEvent('popstate', { state }));
        
        return;
      }

      // Check if app is already loaded
      const existingApp = loadedApps.find(loaded => loaded.appId === app.id);

      if (existingApp) {
        // App already loaded - just switch to it
        switchToApp(app.id);
        return;
      }

      // Check memory constraints
      if (shouldUnloadApps()) {
        unloadLRUApp();
      }

      // Create new loaded app entry
      const newLoadedApp: LoadedApp = {
        appId: app.id,
        url: app.url,
        title: app.title,
        color: app.color,
        icon: app.icon,
        isActive: true,
        webViewId: generateWebViewId(app.id),
        lastAccessed: new Date(),
        memoryUsage: 75 // Estimated MB
      };

      // Deactivate all other apps
      setLoadedApps(prev => [
        ...prev.map(a => ({ ...a, isActive: false })),
        newLoadedApp
      ]);

      setActiveAppId(app.id);

      // Open in BrowserService
      await BrowserService.openApp(app.id, app.url, app.color);

      console.log(`[AppSwitcher] Opened new app: ${app.title}`);
    } catch (error) {
      console.error('[AppSwitcher] Error opening app:', error);
      throw error;
    }
  }, [loadedApps, shouldUnloadApps, unloadLRUApp, generateWebViewId]);

  /**
   * Switch to an already loaded app
   */
  const switchToApp = useCallback((appId: string): void => {
    const app = loadedApps.find(a => a.appId === appId);
    
    if (!app) {
      console.warn(`[AppSwitcher] App ${appId} not found in loaded apps`);
      return;
    }

    // Update active states and last accessed time
    setLoadedApps(prev => prev.map(a => ({
      ...a,
      isActive: a.appId === appId,
      lastAccessed: a.appId === appId ? new Date() : a.lastAccessed
    })));

    setActiveAppId(appId);
    
    // Close drawer after switching
    setIsDrawerOpen(false);

    console.log(`[AppSwitcher] Switched to app: ${app.title}`);

    // Note: In a full implementation, you would need to bring the webview to front
    // For now, we'll open it again in BrowserService
    BrowserService.openApp(appId, app.url, app.color);
  }, [loadedApps]);

  /**
   * Close a specific app
   */
  const closeApp = useCallback((appId: string): void => {
    const app = loadedApps.find(a => a.appId === appId);
    
    if (!app) return;

    console.log(`[AppSwitcher] Closing app: ${app.title}`);

    // Remove from loaded apps
    setLoadedApps(prev => prev.filter(a => a.appId !== appId));

    // If closing the active app
    if (app.isActive) {
      // Close the browser
      BrowserService.close();
      
      // Switch to another app if available
      const remainingApps = loadedApps.filter(a => a.appId !== appId);
      if (remainingApps.length > 0) {
        const nextApp = remainingApps[remainingApps.length - 1];
        switchToApp(nextApp.appId);
      } else {
        setActiveAppId(null);
      }
    }
  }, [loadedApps, switchToApp]);

  /**
   * Close all loaded apps
   */
  const closeAllApps = useCallback((): void => {
    console.log('[AppSwitcher] Closing all apps');
    
    setLoadedApps([]);
    setActiveAppId(null);
    
    // Close browser
    BrowserService.close();
  }, []);

  /**
   * Toggle drawer open/closed
   */
  const toggleDrawer = useCallback((): void => {
    setIsDrawerOpen(prev => !prev);
  }, []);

  /**
   * Set drawer open state
   */
  const setDrawerOpen = useCallback((open: boolean): void => {
    setIsDrawerOpen(open);
  }, []);

  /**
   * Listen for browser close events
   */
  useEffect(() => {
    const handleBrowserClose = () => {
      // When browser closes, mark active app as inactive
      if (activeAppId) {
        console.log('[AppSwitcher] Browser closed');
        setLoadedApps(prev => prev.map(app => ({
          ...app,
          isActive: false
        })));
        setActiveAppId(null);
      }
    };

    BrowserService.addBrowserFinishedListener(handleBrowserClose);

    return () => {
      BrowserService.removeAllListeners();
    };
  }, [activeAppId]);

  /**
   * Log memory usage for debugging
   */
  useEffect(() => {
    if (loadedApps.length > 0) {
      const memUsage = getMemoryUsage();
      console.log(`[AppSwitcher] Memory usage estimate: ${memUsage}MB for ${loadedApps.length} apps`);
    }
  }, [loadedApps.length, getMemoryUsage]);

  const value: AppSwitcherContextType = {
    loadedApps,
    activeAppId,
    isDrawerOpen,
    maxLoadedApps: MAX_LOADED_APPS,
    openApp,
    switchToApp,
    closeApp,
    closeAllApps,
    toggleDrawer,
    setDrawerOpen,
    getMemoryUsage
  };

  return (
    <AppSwitcherContext.Provider value={value}>
      {children}
    </AppSwitcherContext.Provider>
  );
};
