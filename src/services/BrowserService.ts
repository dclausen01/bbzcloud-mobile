/**
 * BBZCloud Mobile - Browser Service
 * 
 * Handles opening web apps in InAppBrowser with JavaScript injection support
 * Uses @capgo/inappbrowser for enhanced capabilities
 * 
 * @version 2.0.0
 */

import { InAppBrowser } from '@capgo/inappbrowser';
import type { PluginListenerHandle } from '@capacitor/core';
import { BROWSER_CONFIG, NAVIGATION_APPS } from '../utils/constants';
import type { AppConfig } from '../utils/constants';
import { isSmartphone, isIOS, isAndroid, canOpenNativeApps } from '../utils/deviceUtils';
import type { BrowserOptions, ApiResponse, NativeAppResult } from '../types';
import DatabaseService from './DatabaseService';
import { getInjectionScript, type InjectionScript } from './InjectionScripts';

class BrowserService {
  private currentAppId: string | null = null;
  private currentUrl: string | null = null;
  private pageLoadedListener: PluginListenerHandle | null = null;

  /**
   * Open a URL in the InAppBrowser with optional JavaScript injection
   */
  async openUrl(url: string, appId?: string, options?: Partial<BrowserOptions>): Promise<ApiResponse> {
    try {
      // Store current app info
      if (appId) {
        this.currentAppId = appId;
        this.currentUrl = url;

        // Add to browser history
        await DatabaseService.addToHistory(appId, url);
      }

      // Check if this app needs JavaScript injection
      const injectionScript = appId ? getInjectionScript(appId) ?? undefined : undefined;
      
      // Always use openWebView for consistent experience
      if (appId) {
        await this.openWebViewWithInjection(url, appId, options, injectionScript);
      } else {
        // Fallback for URLs without appId
        await InAppBrowser.open({
          url,
        });
      }

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
   * Open WebView with JavaScript injection support
   */
  private async openWebViewWithInjection(
    url: string,
    appId: string,
    options?: Partial<BrowserOptions>,
    injectionScript?: InjectionScript
  ): Promise<void> {
    // Remove any existing page loaded listener
    if (this.pageLoadedListener) {
      await InAppBrowser.removeAllListeners();
      this.pageLoadedListener = null;
    }

    // Set up page loaded listener for injection
    if (injectionScript) {
      this.pageLoadedListener = await InAppBrowser.addListener('browserPageLoaded', async () => {
        console.log('[BrowserService] Page loaded, injecting scripts for', appId);
        
        try {
          // Wait for the specified delay
          if (injectionScript.delay) {
            await new Promise(resolve => setTimeout(resolve, injectionScript.delay));
          }

          // Inject CSS if provided
          if (injectionScript.css) {
            console.log('[BrowserService] Injecting CSS');
            const cssCode = `
              (function() {
                var style = document.createElement('style');
                style.textContent = ${JSON.stringify(injectionScript.css)};
                document.head.appendChild(style);
              })();
            `;
            await InAppBrowser.executeScript({ code: cssCode });
          }

          // Inject JavaScript if provided
          if (injectionScript.js) {
            console.log('[BrowserService] Injecting JavaScript');
            await InAppBrowser.executeScript({ code: injectionScript.js });
          }

          console.log('[BrowserService] Injection completed for', appId);
        } catch (error) {
          console.error('[BrowserService] Error injecting scripts:', error);
        }
      });
    }

    // Open the WebView
    await InAppBrowser.openWebView({
      url,
      title: options?.showTitle !== false ? 'BBZCloud' : '',
      toolbarColor: options?.toolbarColor || BROWSER_CONFIG.TOOLBAR_COLOR,
      isPresentAfterPageLoad: true, // Show after page loads
      showReloadButton: true,
      closeModal: false, // Don't show confirm on close
      visibleTitle: options?.showTitle !== false,
      showArrow: false, // Use X instead of arrow
      enableViewportScale: true,
      // @ts-expect-error - ToolBarType enum issue with plugin types
      toolbarType: 'activity', // Simple toolbar with close and share
      isPullToRefreshEnabled: true, // Enable pull-to-refresh gesture
    });
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
        await InAppBrowser.open({ url: scheme });
        
        // Add to history
        await DatabaseService.addToHistory(appConfig.id, scheme);
        
        // If we get here, the app opened successfully
        return { success: true };
      } catch (error) {
        // If InAppBrowser.open throws an error, the app is not installed
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
      await InAppBrowser.close();
      
      // Remove listeners
      if (this.pageLoadedListener) {
        await InAppBrowser.removeAllListeners();
        this.pageLoadedListener = null;
      }
      
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
    InAppBrowser.addListener('closeEvent', callback);
  }

  /**
   * Listen for browser page loaded event
   */
  addBrowserPageLoadedListener(callback: () => void): void {
    InAppBrowser.addListener('browserPageLoaded', callback);
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    InAppBrowser.removeAllListeners();
    this.pageLoadedListener = null;
  }

  /**
   * Open URL in external browser (system default)
   */
  async openExternal(url: string): Promise<ApiResponse> {
    try {
      // Use _system target to open in external browser
      await InAppBrowser.open({ url });

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
