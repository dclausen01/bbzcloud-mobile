/**
 * BBZCloud Mobile - Browser Service
 * 
 * Handles opening web apps in InAppBrowser using Capacitor Browser plugin
 * 
 * @version 1.0.0
 */

import { Browser } from '@capacitor/browser';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { BROWSER_CONFIG, UI_CONFIG } from '../utils/constants';
import type { BrowserOptions, ApiResponse } from '../types';
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
