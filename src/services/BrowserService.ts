/**
 * BBZCloud Mobile - Browser Service
 * 
 * Handles opening web apps in InAppBrowser using Capacitor Browser plugin
 * 
 * @version 1.0.0
 */

import { Browser } from '@capacitor/browser';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { BROWSER_CONFIG, UI_CONFIG, NAVIGATION_APPS } from '../utils/constants';
import type { AppConfig } from '../utils/constants';
import { isSmartphone, isIOS, isAndroid, canOpenNativeApps } from '../utils/deviceUtils';
import type { BrowserOptions, ApiResponse, NativeAppResult } from '../types';
import DatabaseService from './DatabaseService';

class BrowserService {
  private currentAppId: string | null = null;
  private currentUrl: string | null = null;

  /**
   * Open a URL in the InAppBrowser
   */
  async openUrl(url: string, appId?: string, options?: Partial<BrowserOptions>): Promise<ApiResponse> {
    try {
      // Provide haptic feedback if enabled
      if (UI_CONFIG.HAPTIC_FEEDBACK) {
        await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {
          // Haptics might not be available, ignore error
        });
      }

      // Store current app info
      if (appId) {
        this.currentAppId = appId;
        this.currentUrl = url;

        // Add to browser history
        await DatabaseService.addToHistory(appId, url);
      }

      // Open browser with options
      await Browser.open({
        url,
        toolbarColor: options?.toolbarColor || BROWSER_CONFIG.TOOLBAR_COLOR,
        presentationStyle: options?.presentationStyle || BROWSER_CONFIG.PRESENTATION_STYLE,
        ...options
      });

      return { success: true };
    } catch (error) {
      console.error('Error opening URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open URL'
      };
    }
  }

  /**
   * Open an app in the browser
   */
  async openApp(appId: string, url: string, color?: string): Promise<ApiResponse> {
    return await this.openUrl(url, appId, {
      toolbarColor: color || BROWSER_CONFIG.TOOLBAR_COLOR,
      showTitle: BROWSER_CONFIG.SHOW_TITLE,
      enableShare: BROWSER_CONFIG.ENABLE_SHARE,
      enableReaderMode: BROWSER_CONFIG.ENABLE_READER_MODE
    });
  }

  /**
   * Try to open native app, fallback to browser
   */
  async openAppWithNativeSupport(
    appConfig: AppConfig,
    preferNative: boolean
  ): Promise<NativeAppResult> {
    try {
      // Check if device supports native apps
      if (!canOpenNativeApps()) {
        return { success: true, opened: 'browser' };
      }

      // Check if app has native support
      if (!appConfig.nativeApp?.hasNativeApp) {
        return { success: true, opened: 'browser' };
      }

      // On tablets, always use browser
      if (!isSmartphone()) {
        return { success: true, opened: 'browser' };
      }

      // If user doesn't prefer native, use browser
      if (!preferNative) {
        return { success: true, opened: 'browser' };
      }

      // Try to open native app
      const nativeResult = await this.tryOpenNativeApp(appConfig);
      
      if (nativeResult.success) {
        return { success: true, opened: 'native' };
      }

      // Native app failed or not installed - will show install prompt
      return { success: false, opened: 'none', error: 'not_installed' };

    } catch (error) {
      console.error('Error in openAppWithNativeSupport:', error);
      return { 
        success: false, 
        opened: 'none',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Try to open a native app using custom URL scheme
   */
  private async tryOpenNativeApp(appConfig: AppConfig): Promise<ApiResponse> {
    try {
      if (!appConfig.nativeApp) {
        return { success: false, error: 'No native app config' };
      }

      let scheme: string | undefined;

      // Get the appropriate URL scheme for the platform
      if (isIOS()) {
        scheme = appConfig.nativeApp.iosScheme;
      } else if (isAndroid()) {
        scheme = appConfig.nativeApp.androidScheme;
      }

      if (!scheme) {
        return { success: false, error: 'No scheme for platform' };
      }

      try {
        // Try to open the native app
        await Browser.open({ url: scheme });
        
        // Add to history
        await DatabaseService.addToHistory(appConfig.id, scheme);
        
        // If we get here, the app opened successfully
        return { success: true };
      } catch (error) {
        // If Browser.open throws an error, the app is not installed
        console.log('Native app failed to open:', error);
        return { success: false, error: 'App not installed' };
      }

    } catch (error) {
      // General error
      console.log('Native app error:', error);
      return { success: false, error: 'App not installed' };
    }
  }

  /**
   * Get App Store URL for installing native app
   */
  getAppStoreUrl(appConfig: AppConfig): string | null {
    if (!appConfig.nativeApp) {
      return null;
    }

    if (isIOS() && appConfig.nativeApp.iosAppStoreId) {
      return `https://apps.apple.com/app/id${appConfig.nativeApp.iosAppStoreId}`;
    }

    if (isAndroid() && appConfig.nativeApp.androidPackage) {
      return `https://play.google.com/store/apps/details?id=${appConfig.nativeApp.androidPackage}`;
    }

    return null;
  }

  /**
   * Check if an app has native support
   */
  hasNativeSupport(appId: string): boolean {
    const appConfig = NAVIGATION_APPS[appId];
    return !!appConfig?.nativeApp?.hasNativeApp;
  }

  /**
   * Get default native preference for an app
   */
  getDefaultNativePreference(appId: string): boolean {
    const appConfig = NAVIGATION_APPS[appId];
    return appConfig?.nativeApp?.preferNativeOnSmartphone ?? false;
  }

  /**
   * Close the current browser session
   */
  async close(): Promise<ApiResponse> {
    try {
      await Browser.close();
      
      // Clear current session info
      this.currentAppId = null;
      this.currentUrl = null;

      return { success: true };
    } catch (error) {
      console.error('Error closing browser:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to close browser'
      };
    }
  }

  /**
   * Get the currently open app ID
   */
  getCurrentAppId(): string | null {
    return this.currentAppId;
  }

  /**
   * Get the currently open URL
   */
  getCurrentUrl(): string | null {
    return this.currentUrl;
  }

  /**
   * Check if a browser session is active
   */
  isActive(): boolean {
    return this.currentAppId !== null;
  }

  /**
   * Listen for browser finished event
   */
  addBrowserFinishedListener(callback: () => void): void {
    Browser.addListener('browserFinished', callback);
  }

  /**
   * Listen for browser page loaded event
   */
  addBrowserPageLoadedListener(callback: () => void): void {
    Browser.addListener('browserPageLoaded', callback);
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    Browser.removeAllListeners();
  }

  /**
   * Open URL in external browser (system default)
   */
  async openExternal(url: string): Promise<ApiResponse> {
    try {
      if (UI_CONFIG.HAPTIC_FEEDBACK) {
        await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      }

      await Browser.open({
        url,
        presentationStyle: 'fullscreen'
      });

      return { success: true };
    } catch (error) {
      console.error('Error opening external browser:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open external browser'
      };
    }
  }

  /**
   * Get browser history for an app
   */
  async getAppHistory(appId: string, limit?: number): Promise<ApiResponse> {
    try {
      const result = await DatabaseService.getHistory(appId, limit);
      return result;
    } catch (error) {
      console.error('Error getting app history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get history'
      };
    }
  }

  /**
   * Clear browser history for an app or all apps
   */
  async clearHistory(appId?: string): Promise<ApiResponse> {
    try {
      const result = await DatabaseService.clearHistory(appId);
      return result;
    } catch (error) {
      console.error('Error clearing history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear history'
      };
    }
  }
}

// Export a singleton instance
export default new BrowserService();
