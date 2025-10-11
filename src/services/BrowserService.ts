/**
 * BBZCloud Mobile - Browser Service (Optimized for Keyboard)
 * 
 * Handles opening web apps in InAppBrowser with JavaScript injection support
 * Uses @capgo/inappbrowser for enhanced capabilities
 * 
 * @version 2.1.0 - Enhanced keyboard handling
 */

import { InAppBrowser } from '@capgo/inappbrowser';
import type { PluginListenerHandle } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { BROWSER_CONFIG, NAVIGATION_APPS } from '../utils/constants';
import type { AppConfig } from '../utils/constants';
import { isSmartphone, isIOS, isAndroid, canOpenNativeApps } from '../utils/deviceUtils';
import type { BrowserOptions, ApiResponse, NativeAppResult } from '../types';
import DatabaseService from './DatabaseService';
import { getInjectionScript, GLOBAL_INJECTION, type InjectionScript } from './InjectionScripts';

class BrowserService {
  private currentAppId: string | null = null;
  private currentUrl: string | null = null;
  private pageLoadedListener: PluginListenerHandle | null = null;
  private keyboardShowListener: PluginListenerHandle | null = null;
  private keyboardHideListener: PluginListenerHandle | null = null;
  private isKeyboardBridgeActive: boolean = false;

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
   * Setup keyboard event bridge for InAppBrowser
   * This forwards keyboard events from MainActivity to the WebView
   */
  private async setupKeyboardBridge(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Always cleanup existing listeners first to prevent duplicates
    if (this.isKeyboardBridgeActive) {
      await this.cleanupKeyboardBridge();
    }

    console.log('[BrowserService] Setting up keyboard bridge');

    try {
      // Listen for keyboard show events in MainActivity
      this.keyboardShowListener = await Keyboard.addListener('keyboardWillShow', async (info) => {
        console.log('[BrowserService] Keyboard will show, height:', info.keyboardHeight);

        // Send keyboard info to InAppBrowser WebView
        try {
          await InAppBrowser.postMessage({
            detail: {
              type: 'keyboardShow',
              keyboardHeight: info.keyboardHeight,
              timestamp: Date.now()
            }
          });
        } catch (error) {
          console.error('[BrowserService] Error sending keyboard show event:', error);
        }
      });

      // Listen for keyboard hide events in MainActivity
      this.keyboardHideListener = await Keyboard.addListener('keyboardWillHide', async () => {
        console.log('[BrowserService] Keyboard will hide');

        // Notify WebView that keyboard is hiding
        try {
          await InAppBrowser.postMessage({
            detail: {
              type: 'keyboardHide',
              timestamp: Date.now()
            }
          });
        } catch (error) {
          console.error('[BrowserService] Error sending keyboard hide event:', error);
        }
      });

      this.isKeyboardBridgeActive = true;
      console.log('[BrowserService] Keyboard bridge active');
    } catch (error) {
      console.error('[BrowserService] Error setting up keyboard bridge:', error);
    }
  }

  /**
   * Cleanup keyboard event bridge
   */
  private async cleanupKeyboardBridge(): Promise<void> {
    if (this.keyboardShowListener) {
      await this.keyboardShowListener.remove();
      this.keyboardShowListener = null;
    }
    if (this.keyboardHideListener) {
      await this.keyboardHideListener.remove();
      this.keyboardHideListener = null;
    }
    this.isKeyboardBridgeActive = false;
    console.log('[BrowserService] Keyboard bridge cleaned up');
  }

  /**
   * Detect Android navigation bar height
   * This helps us add appropriate padding to avoid content overlap
   */
  private getNavigationBarDetectionScript(): string {
    return `
      (function() {
        console.log('[BBZCloud] Navigation bar detection started');
        
        let navBarHeight = 0;
        let isKeyboardVisible = false;
        let initialViewportHeight = window.innerHeight;
        
        // Detect if navigation bar is present (Android)
        function detectNavigationBar() {
          // Check if we're on Android with navigation bar
          const isAndroid = /Android/i.test(navigator.userAgent);
          if (!isAndroid) {
            console.log('[BBZCloud] Not Android, no navbar');
            return 0;
          }
          
          // Method 1: Use CSS env() variables if available (most reliable)
          const safeAreaInsetBottom = parseInt(getComputedStyle(document.documentElement)
            .getPropertyValue('env(safe-area-inset-bottom)')) || 0;
          
          if (safeAreaInsetBottom > 0) {
            console.log('[BBZCloud] Safe area inset bottom (env):', safeAreaInsetBottom);
            return safeAreaInsetBottom;
          }
          
          // Method 2: Check visualViewport if available (more accurate)
          if (window.visualViewport) {
            const visualHeight = window.visualViewport.height;
            const windowHeight = window.innerHeight;
            const diff = windowHeight - visualHeight;
            
            // If there's a small difference, it's likely the navbar
            if (diff > 20 && diff < 120) {
              console.log('[BBZCloud] Navigation bar from visualViewport:', diff);
              return diff;
            }
          }
          
          // Method 3: Conservative fallback - only detect typical navbar heights
          // Only when keyboard is definitely not visible
          if (!isKeyboardVisible) {
            const currentHeight = window.innerHeight;
            const heightDiff = initialViewportHeight - currentHeight;
            
            // Navbar is typically 48-96px on most devices
            // If we detect something in this range AND viewport hasn't changed much, it's navbar
            if (Math.abs(heightDiff) < 50) { // Viewport stable
              const screenHeight = window.screen.height;
              const viewportHeight = window.innerHeight;
              const statusBarHeight = 24; // Typical status bar
              
              const totalDiff = screenHeight - viewportHeight - statusBarHeight;
              
              // STRICT: Only accept navbar heights between 48-96px
              if (totalDiff >= 48 && totalDiff <= 96) {
                console.log('[BBZCloud] Navigation bar detected (conservative):', totalDiff);
                return totalDiff;
              }
            }
          }
          
          console.log('[BBZCloud] No navbar detected');
          return 0;
        }
        
        // Apply safe area padding for navigation bar ONLY (not keyboard)
        function applySafeAreaPadding() {
          // Only detect navbar when keyboard is NOT visible
          if (!isKeyboardVisible) {
            navBarHeight = detectNavigationBar();
          }
          
          // Apply padding only if:
          // 1. Navbar exists (height > 0)
          // 2. Keyboard is NOT visible
          // 3. Height is reasonable (48-96px)
          const shouldApplyPadding = navBarHeight > 0 && 
                                     navBarHeight >= 48 && 
                                     navBarHeight <= 96 && 
                                     !isKeyboardVisible;
          
          if (shouldApplyPadding) {
            console.log('[BBZCloud] Applying navbar padding:', navBarHeight + 'px');
            updatePadding(navBarHeight);
          } else {
            console.log('[BBZCloud] No padding needed (navbar:', navBarHeight, 'keyboard:', isKeyboardVisible + ')');
            updatePadding(0);
          }
        }
        
        // Update the actual padding
        function updatePadding(padding) {
          let style = document.getElementById('bbzcloud-safe-area');
          if (!style) {
            style = document.createElement('style');
            style.id = 'bbzcloud-safe-area';
            document.head.appendChild(style);
          }
          
          if (padding > 0) {
            style.textContent = \`
              /* BBZCloud Safe Area for Navigation Bar */
              body {
                padding-bottom: \${padding}px !important;
                box-sizing: border-box !important;
              }
              
              /* Ensure fixed bottom elements are above nav bar */
              [style*="position: fixed"][style*="bottom: 0"],
              [style*="position:fixed"][style*="bottom:0"],
              .fixed-bottom,
              .bottom-bar,
              .bottom-navigation {
                bottom: \${padding}px !important;
              }
            \`;
          } else {
            // Remove padding
            style.textContent = '';
          }
        }
        
        // Listen for viewport changes
        let resizeTimeout;
        let lastHeight = window.innerHeight;
        
        window.addEventListener('resize', function() {
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            const currentHeight = window.innerHeight;
            const heightChange = lastHeight - currentHeight;
            
            console.log('[BBZCloud] Resize detected. Height change:', heightChange, 'px');
            
            // Large reduction = keyboard appeared (>150px change)
            if (heightChange > 150) {
              isKeyboardVisible = true;
              console.log('[BBZCloud] Keyboard appeared');
              applySafeAreaPadding();
            } 
            // Large increase = keyboard disappeared (>100px change)
            else if (heightChange < -100) {
              isKeyboardVisible = false;
              console.log('[BBZCloud] Keyboard disappeared');
              // Reset initial height when keyboard closes
              initialViewportHeight = currentHeight;
              applySafeAreaPadding();
            }
            // Small change = just rotation or minor adjustment
            else if (Math.abs(heightChange) < 50) {
              console.log('[BBZCloud] Minor viewport change, recalculating navbar');
              initialViewportHeight = currentHeight;
              applySafeAreaPadding();
            }
            
            lastHeight = currentHeight;
          }, 150);
        });
        
        // Listen for keyboard events from native bridge
        window.addEventListener('message', function(event) {
          try {
            const data = event.data;
            if (!data || !data.type) return;
            
            if (data.type === 'keyboardShow') {
              isKeyboardVisible = true;
              console.log('[BBZCloud] Keyboard show event from native');
              applySafeAreaPadding();
            } else if (data.type === 'keyboardHide') {
              isKeyboardVisible = false;
              console.log('[BBZCloud] Keyboard hide event from native');
              // Reset viewport height when keyboard hides
              setTimeout(() => {
                initialViewportHeight = window.innerHeight;
                applySafeAreaPadding();
              }, 200);
            }
          } catch (error) {
            console.error('[BBZCloud] Error handling message:', error);
          }
        });
        
        // Apply immediately on load (with delay to let page settle)
        setTimeout(() => {
          initialViewportHeight = window.innerHeight;
          applySafeAreaPadding();
        }, 500);
        
        // Reapply on orientation change
        window.addEventListener('orientationchange', function() {
          setTimeout(() => {
            isKeyboardVisible = false; // Reset keyboard state
            initialViewportHeight = window.innerHeight;
            applySafeAreaPadding();
          }, 500);
        });
        
        console.log('[BBZCloud] Navigation bar detection completed');
      })();
    `;
  }

  /**
   * Get enhanced keyboard injection script
   * This script helps the WebView handle keyboard events better
   */
  private getKeyboardInjectionScript(): string {
    return `
      (function() {
        console.log('[BBZCloud] Keyboard handler injection started');
        
        // Track active input element
        let activeInput = null;
        let keyboardHeight = 0;
        let originalViewportHeight = window.innerHeight;
        
        // Listen for focus on input elements
        document.addEventListener('focusin', function(e) {
          const target = e.target;
          if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
            activeInput = target;
            console.log('[BBZCloud] Input focused:', target.tagName);
            
            // Small delay to ensure keyboard is visible
            setTimeout(() => {
              if (activeInput) {
                scrollInputIntoView(activeInput);
              }
            }, 300);
          }
        }, true);
        
        // Listen for blur on input elements
        document.addEventListener('focusout', function(e) {
          console.log('[BBZCloud] Input blurred');
          activeInput = null;
        }, true);
        
        // Listen for keyboard messages from native app
        window.addEventListener('message', function(event) {
          try {
            const data = event.data;
            if (!data || !data.type) return;
            
            if (data.type === 'keyboardShow') {
              console.log('[BBZCloud] Keyboard show event received, height:', data.keyboardHeight);
              keyboardHeight = data.keyboardHeight || 0;
              
              // Scroll active input into view
              if (activeInput) {
                setTimeout(() => {
                  scrollInputIntoView(activeInput);
                }, 100);
              }
            } else if (data.type === 'keyboardHide') {
              console.log('[BBZCloud] Keyboard hide event received');
              keyboardHeight = 0;
            }
          } catch (error) {
            console.error('[BBZCloud] Error handling keyboard message:', error);
          }
        });
        
        // Function to scroll input into view
        function scrollInputIntoView(element) {
          if (!element) return;
          
          try {
            const rect = element.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const elementBottom = rect.bottom;
            
            // Check if element is hidden by keyboard
            if (keyboardHeight > 0 && elementBottom > (viewportHeight - keyboardHeight - 20)) {
              console.log('[BBZCloud] Input hidden by keyboard, scrolling...');
              
              // Scroll element into view with some padding
              element.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
              
              // Alternative: Scroll by calculating offset
              const scrollOffset = elementBottom - (viewportHeight - keyboardHeight - 20);
              if (scrollOffset > 0) {
                window.scrollBy({
                  top: scrollOffset + 50, // Extra padding
                  behavior: 'smooth'
                });
              }
            }
          } catch (error) {
            console.error('[BBZCloud] Error scrolling input:', error);
          }
        }
        
        // Handle window resize (when keyboard shows/hides)
        let resizeTimeout;
        window.addEventListener('resize', function() {
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            const newHeight = window.innerHeight;
            const heightDiff = originalViewportHeight - newHeight;
            
            // If viewport shrunk significantly, keyboard is likely shown
            if (heightDiff > 100 && activeInput) {
              console.log('[BBZCloud] Viewport resized (keyboard?), scrolling input');
              scrollInputIntoView(activeInput);
            } else if (heightDiff < 50) {
              // Viewport restored, keyboard likely hidden
              originalViewportHeight = newHeight;
            }
          }, 150);
        });
        
        console.log('[BBZCloud] Keyboard handler injection completed');
      })();
    `;
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
    // CRITICAL: Cleanup all existing listeners first to prevent memory leaks
    await this.cleanupKeyboardBridge();
    if (this.pageLoadedListener) {
      await InAppBrowser.removeAllListeners();
      this.pageLoadedListener = null;
    }

    // Setup keyboard bridge to forward events to WebView
    await this.setupKeyboardBridge();

    // ALWAYS set up page loaded listener for global + app-specific injection
    this.pageLoadedListener = await InAppBrowser.addListener('browserPageLoaded', async () => {
      console.log('[BrowserService] Page loaded, injecting scripts for', appId);

      try {
        // STEP 1: Inject NAVIGATION BAR DETECTION first (for Android navbar)
        console.log('[BrowserService] Injecting navigation bar detection');
        const navBarScript = this.getNavigationBarDetectionScript();
        await InAppBrowser.executeScript({ code: navBarScript });

        // Small delay to let navigation bar detection complete
        await new Promise(resolve => setTimeout(resolve, 100));

        // STEP 2: Inject KEYBOARD HANDLER (critical for input fields)
        console.log('[BrowserService] Injecting keyboard handler');
        const keyboardScript = this.getKeyboardInjectionScript();
        await InAppBrowser.executeScript({ code: keyboardScript });

        // STEP 3: Inject GLOBAL scripts
        console.log('[BrowserService] Injecting GLOBAL scripts');

        // Wait for global delay
        if (GLOBAL_INJECTION.delay) {
          await new Promise(resolve => setTimeout(resolve, GLOBAL_INJECTION.delay));
        }

        // Inject GLOBAL CSS
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

        // Inject GLOBAL JavaScript
        if (GLOBAL_INJECTION.js) {
          await InAppBrowser.executeScript({ code: GLOBAL_INJECTION.js });
        }

        // STEP 4: Inject app-specific scripts if provided
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

    // Open the WebView with optimized keyboard settings
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
      toolbarType: 'activity',
      isPullToRefreshEnabled: true,
      enabledSafeBottomMargin: true, // Safe margin for navigation
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

      if (this.pageLoadedListener) {
        await InAppBrowser.removeAllListeners();
        this.pageLoadedListener = null;
      }

      await this.cleanupKeyboardBridge();

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