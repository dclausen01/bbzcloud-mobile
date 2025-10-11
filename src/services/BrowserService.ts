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
        
        // Detect if navigation bar is present (Android)
        function getNavigationBarHeight() {
          // Check if we're on Android with navigation bar
          const isAndroid = /Android/i.test(navigator.userAgent);
          if (!isAndroid) return 0;
          
          // Calculate the difference between screen height and available viewport
          const screenHeight = window.screen.height;
          const viewportHeight = window.innerHeight;
          const heightDiff = screenHeight - viewportHeight;
          
          // If difference is significant (more than 24px for status bar), we likely have a navbar
          // Typical navbar height is 48-96px depending on device
          if (heightDiff > 60) {
            const navBarHeight = heightDiff - 24; // Subtract status bar height
            console.log('[BBZCloud] Navigation bar detected, height:', navBarHeight);
            return navBarHeight;
          }
          
          return 0;
        }
        
        // Apply safe area padding for navigation bar
        function applySafeAreaPadding() {
          const navBarHeight = getNavigationBarHeight();
          
          if (navBarHeight > 0) {
            console.log('[BBZCloud] Applying safe area padding:', navBarHeight + 'px');
            
            // Create or update CSS for safe area
            let style = document.getElementById('bbzcloud-safe-area');
            if (!style) {
              style = document.createElement('style');
              style.id = 'bbzcloud-safe-area';
              document.head.appendChild(style);
            }
            
            // Add padding to body and html to prevent content overlap
            style.textContent = \`
              /* BBZCloud Safe Area for Navigation Bar */
              html {
                padding-bottom: \${navBarHeight}px !important;
                box-sizing: border-box !important;
              }
              
              body {
                padding-bottom: \${navBarHeight}px !important;
                box-sizing: border-box !important;
                min-height: calc(100vh - \${navBarHeight}px) !important;
              }
              
              /* Ensure fixed bottom elements are above nav bar */
              [style*="position: fixed"][style*="bottom"],
              .fixed-bottom,
              .bottom-bar,
              .bottom-navigation {
                bottom: \${navBarHeight}px !important;
              }
              
              /* Handle sticky footers */
              footer,
              [role="contentinfo"] {
                padding-bottom: \${navBarHeight}px !important;
              }
            \`;
            
            console.log('[BBZCloud] Safe area padding applied');
          } else {
            console.log('[BBZCloud] No navigation bar detected, no padding needed');
          }
        }
        
        // Apply immediately
        applySafeAreaPadding();
        
        // Reapply on orientation change
        window.addEventListener('orientationchange', function() {
          setTimeout(applySafeAreaPadding, 300);
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
      return `https://play.google.com/store/apps/details?