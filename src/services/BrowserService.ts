/**
 * BBZCloud Mobile - Browser Service
 * 
 * Handles opening web apps in InAppBrowser with JavaScript injection support
 * Uses @capgo/inappbrowser for enhanced capabilities
 * 
 * @version 3.0.0 - Simplified architecture using WebView APIs only
 */

import { InAppBrowser } from '@capgo/inappbrowser';
import type { PluginListenerHandle } from '@capacitor/core';
import { BROWSER_CONFIG, NAVIGATION_APPS } from '../utils/constants';
import type { AppConfig } from '../utils/constants';
import { isSmartphone, isIOS, isAndroid, canOpenNativeApps } from '../utils/deviceUtils';
import type { BrowserOptions, ApiResponse, NativeAppResult } from '../types';
import DatabaseService from './DatabaseService';
import { getInjectionScript, GLOBAL_INJECTION, type InjectionScript } from './InjectionScripts';
import DownloadService from './DownloadService';

class BrowserService {
  private currentAppId: string | null = null;
  private currentUrl: string | null = null;
  private pageLoadedListener: PluginListenerHandle | null = null;
  private downloadListener: PluginListenerHandle | null = null;

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
   * Initialize download listener
   */
  private async initializeDownloadListener(): Promise<void> {
    // Remove existing listener if any
    if (this.downloadListener) {
      this.downloadListener.remove();
      this.downloadListener = null;
    }

    // Set up download message listener
    this.downloadListener = await InAppBrowser.addListener('messageFromWebview', async (event) => {
      console.log('[BrowserService] Message received from WebView:', event);
      
      if (event.detail && event.detail.type === 'download') {
        console.log('[BrowserService] Download request received:', event.detail);
        
        try {
          // Validate download request
          if (!event.detail.url) {
            console.error('[BrowserService] Download request missing URL');
            return;
          }

          // Process download with progress tracking
          const result = await DownloadService.downloadFile(
            {
              url: event.detail.url,
              filename: event.detail.filename,
              headers: event.detail.headers,
              mimeType: event.detail.mimeType,
              method: event.detail.method,
              formData: event.detail.formData,
            },
            {
              showInNotification: true, // Show progress in notification
            },
            (progress) => {
              // Log progress for debugging
              console.log(`[BrowserService] Download progress: ${progress.percentage}%`);
            }
          );

          console.log('[BrowserService] Download result:', result);
        } catch (error) {
          console.error('[BrowserService] Error processing download:', error);
        }
      } else {
        console.log('[BrowserService] Non-download message received:', event.detail);
      }
    });

    console.log('[BrowserService] Download listener initialized');
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
    // Cleanup existing listeners to prevent memory leaks
    if (this.pageLoadedListener) {
      this.pageLoadedListener.remove();
      this.pageLoadedListener = null;
    }

    // Initialize download listener
    await this.initializeDownloadListener();

    // Set up page loaded listener for injection
    this.pageLoadedListener = await InAppBrowser.addListener('browserPageLoaded', async () => {
      console.log('[BrowserService] Page loaded, injecting scripts for', appId);

      try {
        // Wait for global delay
        if (GLOBAL_INJECTION.delay) {
          await new Promise(resolve => setTimeout(resolve, GLOBAL_INJECTION.delay));
        }

        // STEP 1: Inject GLOBAL CSS
        if (GLOBAL_INJECTION.css) {
          const globalCssCode = `
            (function() {
              var style = document.createElement('style');
              style.textContent = ${JSON.stringify(GLOBAL_INJECTION.css)};
              document.head.appendChild(style);
              console.log('[BBZCloud] Global CSS injected');
            })();
          `;
          await InAppBrowser.executeScript({ code: globalCssCode });
        }

        // STEP 2: Inject GLOBAL JavaScript (includes keyboard handling)
        if (GLOBAL_INJECTION.js) {
          await InAppBrowser.executeScript({ code: GLOBAL_INJECTION.js });
          console.log('[BBZCloud] Global JavaScript injected');
        }

        // STEP 3: Inject app-specific scripts if provided
        if (injectionScript) {
          console.log('[BrowserService] Injecting app-specific scripts for', appId);

          // Wait for app-specific delay
          if (injectionScript.delay) {
            await new Promise(resolve => setTimeout(resolve, injectionScript.delay));
          }

          // Inject app-specific CSS
          if (injectionScript.css) {
            const appCssCode = `
              (function() {
                var style = document.createElement('style');
                style.textContent = ${JSON.stringify(injectionScript.css)};
                document.head.appendChild(style);
                console.log('[BBZCloud] App-specific CSS injected for ${appId}');
              })();
            `;
            await InAppBrowser.executeScript({ code: appCssCode });
          }

          // Inject app-specific JavaScript
          if (injectionScript.js) {
            await InAppBrowser.executeScript({ code: injectionScript.js });
          }
        }

        console.log('[BrowserService] All injections completed for', appId);
      } catch (error) {
        console.error('[BrowserService] Error injecting scripts:', error);
      }
    });

    // Open the WebView with optimal settings
    await InAppBrowser.openWebView({
      url,
      title: options?.showTitle !== false ? 'BBZCloud' : '',
      toolbarColor: options?.toolbarColor || BROWSER_CONFIG.TOOLBAR_COLOR,
      isPresentAfterPageLoad: true,
      showReloadButton: true,
      closeModal: false,
      visibleTitle: options?.showTitle !== false,
      showArrow: false,
      enableViewportScale: true,
      // @ts-expect-error - ToolBarType enum issue with plugin types
      toolbarType: 'navigation', // Navigation toolbar with back/forward buttons
      isPullToRefreshEnabled: true, // Pull-to-refresh already enabled!
      enabledSafeBottomMargin: true, // Handles navigation bar padding (20px)
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
      if (!canOpenNativeApps()) {
        return { success: true, opened: 'browser' };
      }

      if (!appConfig.nativeApp?.hasNativeApp) {
        return { success: true, opened: 'browser' };
      }

      if (!isSmartphone()) {
        return { success: true, opened: 'browser' };
      }

      if (!preferNative) {
        return { success: true, opened: 'browser' };
      }

      const nativeResult = await this.tryOpenNativeApp(appConfig);

      if (nativeResult.success) {
        return { success: true, opened: 'native' };
      }

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

      if (isIOS()) {
        scheme = appConfig.nativeApp.iosScheme;
      } else if (isAndroid()) {
        scheme = appConfig.nativeApp.androidScheme;
      }

      if (!scheme) {
        return { success: false, error: 'No scheme for platform' };
      }

      try {
        await InAppBrowser.open({ url: scheme });
        await DatabaseService.addToHistory(appConfig.id, scheme);
        return { success: true };
      } catch (error) {
        console.log('Native app failed to open:', error);
        return { success: false, error: 'App not installed' };
      }

    } catch (error) {
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

      // Clean up listeners
      if (this.pageLoadedListener) {
        this.pageLoadedListener.remove();
        this.pageLoadedListener = null;
      }

      if (this.downloadListener) {
        this.downloadListener.remove();
        this.downloadListener = null;
      }

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
    if (this.pageLoadedListener) {
      this.pageLoadedListener.remove();
      this.pageLoadedListener = null;
    }
    
    if (this.downloadListener) {
      this.downloadListener.remove();
      this.downloadListener = null;
    }
  }

  /**
   * Open URL in external browser (system default)
   */
  async openExternal(url: string): Promise<ApiResponse> {
    try {
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
