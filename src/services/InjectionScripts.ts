/**
 * BBZCloud Mobile - Injection Scripts
 * 
 * JavaScript and CSS injection scripts for specific apps that need modifications
 * 
 * @version 1.0.0
 */

export interface InjectionScript {
  // JavaScript code to inject
  js?: string;
  // CSS code to inject
  css?: string;
  // Delay before injection (ms)
  delay?: number;
  // Description of what this injection does
  description: string;
}

/**
 * schul.cloud - Production scroll fix
 * 
 * Problem: Channel list and chat windows are not scrollable by finger touch
 * Solution: Targeted CSS fixes for overflow:hidden containers
 */
export const SCHULCLOUD_INJECTION: InjectionScript = {
  css: `
    /* TARGETED CSS FIX - Production version */
    /* Fix overflow:hidden on scrollable containers */
    
    /* schul.cloud specific containers that need scrolling */
    [class*="outer-scroller"],
    [class*="navigation-item-wrapper"],
    [class*="channel-list"],
    [class*="chat-list"],
    [class*="conversation-list"],
    [class*="message-list"],
    [class*="sidebar"],
    div[class*="List"],
    div[class*="Sidebar"],
    div[class*="scroller"] {
      overflow-y: auto !important;
      overflow-x: hidden !important;
      -webkit-overflow-scrolling: touch !important;
      overscroll-behavior: contain !important;
      touch-action: pan-y !important;
    }
    
    /* Ensure parent containers allow scrolling */
    [class*="wrapper"][class*="ng-tns"] {
      overflow-y: auto !important;
    }
  `,
  js: `
    // Production scroll fix - minimal JavaScript
    (function() {
      console.log('[BBZCloud] schul.cloud scroll fix active');
      
      // Apply minimal fixes to ensure scrolling works
      function applyScrollFixes() {
        const scrollableSelectors = [
          '[class*="outer-scroller"]',
          '[class*="navigation-item-wrapper"]',
          '[class*="scroller"]'
        ];
        
        scrollableSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            // Only apply if element has content to scroll
            if (element.scrollHeight > element.clientHeight) {
              element.style.webkitOverflowScrolling = 'touch';
              
              // Fix touch-action if it's blocking scroll
              const touchAction = window.getComputedStyle(element).touchAction;
              if (touchAction === 'none') {
                element.style.touchAction = 'pan-y';
              }
            }
          });
        });
      }
      
      // Apply fixes on load and when new content is added
      setTimeout(applyScrollFixes, 1000);
      setInterval(applyScrollFixes, 5000);
      
      // Watch for DOM changes
      const observer = new MutationObserver(function(mutations) {
        let shouldReapply = false;
        mutations.forEach(function(mutation) {
          if (mutation.addedNodes.length > 0) {
            shouldReapply = true;
          }
        });
        if (shouldReapply) {
          setTimeout(applyScrollFixes, 500);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      console.log('[BBZCloud] Scroll fix initialized');
    })();
  `,
  delay: 1500,
  description: 'Production scroll fix for touch scrolling'
};

/**
 * Office 365 - Comprehensive Desktop Spoofing
 * 
 * Problem: Office 365 detects mobile device and redirects to App Store
 * Solution: Comprehensive spoofing to appear as Chrome on Windows 10 Desktop
 */
export const OFFICE_INJECTION: InjectionScript = {
  js: `
    // Comprehensive Desktop Browser Spoofing for Office 365
    (function() {
      console.log('[BBZCloud] Office 365 comprehensive desktop spoofing active');
      
      // Desktop User Agent (Chrome 120 on Windows 10)
      const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      
      // Override navigator properties to appear as desktop Chrome
      Object.defineProperty(navigator, 'userAgent', {
        get: function() { return desktopUA; },
        configurable: true
      });
      
      Object.defineProperty(navigator, 'appVersion', {
        get: function() { return '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'; },
        configurable: true
      });
      
      Object.defineProperty(navigator, 'platform', {
        get: function() { return 'Win32'; },
        configurable: true
      });
      
      Object.defineProperty(navigator, 'vendor', {
        get: function() { return 'Google Inc.'; },
        configurable: true
      });
      
      Object.defineProperty(navigator, 'maxTouchPoints', {
        get: function() { return 0; },
        configurable: true
      });
      
      // Spoof mobile-specific properties
      if (navigator.userAgentData) {
        Object.defineProperty(navigator, 'userAgentData', {
          get: function() {
            return {
              brands: [
                { brand: 'Not_A Brand', version: '8' },
                { brand: 'Chromium', version: '120' },
                { brand: 'Google Chrome', version: '120' }
              ],
              mobile: false,
              platform: 'Windows'
            };
          },
          configurable: true
        });
      }
      
      // Override screen properties to desktop resolution
      Object.defineProperty(window.screen, 'width', {
        get: function() { return 1920; },
        configurable: true
      });
      
      Object.defineProperty(window.screen, 'height', {
        get: function() { return 1080; },
        configurable: true
      });
      
      Object.defineProperty(window.screen, 'availWidth', {
        get: function() { return 1920; },
        configurable: true
      });
      
      Object.defineProperty(window.screen, 'availHeight', {
        get: function() { return 1040; },
        configurable: true
      });
      
      // Override window.orientation (mobile only)
      if ('orientation' in window) {
        delete window.orientation;
      }
      
      // Override matchMedia for mobile detection
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = function(query) {
        const result = originalMatchMedia.call(window, query);
        // Override mobile/touch queries
        if (query.includes('hover: none') || query.includes('pointer: coarse')) {
          return {
            matches: false,
            media: query,
            onchange: null,
            addListener: function() {},
            removeListener: function() {},
            addEventListener: function() {},
            removeEventListener: function() {},
            dispatchEvent: function() { return true; }
          };
        }
        return result;
      };
      
      // Remove touch event support indicators
      if ('ontouchstart' in window) {
        Object.defineProperty(window, 'ontouchstart', {
          get: function() { return undefined; },
          configurable: true
        });
      }
      
      if ('ontouchend' in window) {
        Object.defineProperty(window, 'ontouchend', {
          get: function() { return undefined; },
          configurable: true
        });
      }
      
      // Intercept and block App Store redirects
      const originalOpen = window.open;
      window.open = function(url, ...args) {
        if (url && (url.includes('apps.apple.com') || url.includes('play.google.com') || url.includes('itunes.apple'))) {
          console.log('[BBZCloud] Blocked App Store redirect:', url);
          return null;
        }
        return originalOpen.call(window, url, ...args);
      };
      
      // Block location changes to app stores
      const originalLocationDescriptor = Object.getOwnPropertyDescriptor(window, 'location');
      const originalLocationHref = Object.getOwnPropertyDescriptor(window.location, 'href');
      
      Object.defineProperty(window.location, 'href', {
        set: function(value) {
          if (value && (value.includes('apps.apple.com') || value.includes('play.google.com') || value.includes('itunes.apple'))) {
            console.log('[BBZCloud] Blocked location.href change to App Store:', value);
            return;
          }
          originalLocationHref.set.call(window.location, value);
        },
        get: originalLocationHref.get,
        configurable: true
      });
      
      // Intercept location.replace
      const originalReplace = window.location.replace;
      window.location.replace = function(url) {
        if (url && (url.includes('apps.apple.com') || url.includes('play.google.com') || url.includes('itunes.apple'))) {
          console.log('[BBZCloud] Blocked location.replace to App Store:', url);
          return;
        }
        return originalReplace.call(window.location, url);
      };
      
      // Intercept location.assign
      const originalAssign = window.location.assign;
      window.location.assign = function(url) {
        if (url && (url.includes('apps.apple.com') || url.includes('play.google.com') || url.includes('itunes.apple'))) {
          console.log('[BBZCloud] Blocked location.assign to App Store:', url);
          return;
        }
        return originalAssign.call(window.location, url);
      };
      
      // Intercept clicks on App Store links
      document.addEventListener('click', function(e) {
        const target = e.target.closest('a');
        if (target && target.href) {
          if (target.href.includes('apps.apple.com') || 
              target.href.includes('play.google.com') || 
              target.href.includes('itunes.apple')) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            console.log('[BBZCloud] Blocked App Store link click:', target.href);
            return false;
          }
        }
      }, true);
      
      // Monitor for dynamic redirects
      let redirectAttempts = 0;
      const originalSetTimeout = window.setTimeout;
      window.setTimeout = function(callback, delay, ...args) {
        const wrappedCallback = function() {
          try {
            callback.apply(this, arguments);
          } catch (e) {
            // If callback tries to redirect, catch it
            if (e.message && (e.message.includes('apple') || e.message.includes('play.google'))) {
              console.log('[BBZCloud] Blocked setTimeout redirect attempt');
              redirectAttempts++;
              return;
            }
            throw e;
          }
        };
        return originalSetTimeout.call(window, wrappedCallback, delay, ...args);
      };
      
      console.log('[BBZCloud] Office 365 comprehensive desktop spoofing initialized');
      console.log('[BBZCloud] Spoofed as: Chrome 120 on Windows 10 (1920x1080)');
    })();
  `,
  delay: 100,
  description: 'Comprehensive desktop browser spoofing for Office 365'
};

/**
 * WebUntis - Auto-close warning and banner messages
 * 
 * Problem: 
 * 1. Initial warning with "Im Browser öffnen" link that needs to be clicked
 * 2. After login, banner overlay with X button (top right) that needs to be closed
 * 
 * Solution: Automatically detect and close these elements
 */
export const WEBUNTIS_INJECTION: InjectionScript = {
  js: `
    // Auto-close WebUntis dialogs and banners
    (function() {
      console.log('[BBZCloud] Initializing WebUntis auto-close');
      
      let attemptCount = 0;
      const maxAttempts = 30; // Try for 15 seconds (30 * 500ms)
      
      function closeElements() {
        attemptCount++;
        let foundAndClicked = false;
        
        // Step 1: Look for "Im Browser öffnen" link (initial warning)
        const links = document.querySelectorAll('a, button');
        for (const link of links) {
          if (link.textContent && link.textContent.includes('Im Browser öffnen') && link.offsetParent !== null) {
            console.log('[BBZCloud] Clicking "Im Browser öffnen" link');
            link.click();
            foundAndClicked = true;
            break;
          }
        }
        
        // Step 2: Look for X button on banner overlay (after login)
        // Try multiple selectors for the close button
        const closeSelectors = [
          // Look for buttons/elements in top right
          '[class*="banner"] [class*="close"]',
          '[class*="overlay"] [class*="close"]',
          '[class*="notification"] [class*="close"]',
          // Generic close buttons
          'button[aria-label*="close" i]',
          'button[aria-label*="schließen" i]',
          'button[title*="close" i]',
          'button[title*="schließen" i]',
          // X buttons (common patterns)
          'button:has(svg[class*="close"])',
          'button:has([class*="close"])',
          // Position-based (top right)
          '[style*="position: absolute"][style*="right"][style*="top"] button',
          '[style*="position: fixed"][style*="right"][style*="top"] button'
        ];
        
        for (const selector of closeSelectors) {
          try {
            const buttons = document.querySelectorAll(selector);
            for (const button of buttons) {
              if (button && button.offsetParent !== null) {
                // Check if it's likely a close button (has X or close icon)
                const hasCloseIcon = 
                  button.textContent.includes('×') || 
                  button.textContent.includes('✕') ||
                  button.innerHTML.includes('close') ||
                  button.className.includes('close');
                
                if (hasCloseIcon) {
                  console.log('[BBZCloud] Clicking close button on overlay:', selector);
                  button.click();
                  foundAndClicked = true;
                  break;
                }
              }
            }
            if (foundAndClicked) break;
          } catch (e) {
            // Some selectors might not be valid, skip them
            continue;
          }
        }
        
        // Continue checking if we haven't exceeded max attempts
        if (attemptCount < maxAttempts) {
          setTimeout(closeElements, 500);
        } else {
          console.log('[BBZCloud] WebUntis auto-close completed. Attempts:', attemptCount);
        }
      }
      
      // Start attempting to close elements
      setTimeout(closeElements, 500);
      
      // Set up MutationObserver for dynamically appearing elements
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) { // ELEMENT_NODE
              // Check if added node contains "Im Browser öffnen" or close buttons
              const text = node.textContent || '';
              if (text.includes('Im Browser öffnen') || 
                  node.querySelector && (
                    node.querySelector('[class*="banner"]') ||
                    node.querySelector('[class*="overlay"]') ||
                    node.querySelector('[class*="notification"]')
                  )) {
                console.log('[BBZCloud] New element detected, attempting to close');
                setTimeout(closeElements, 300);
              }
            }
          });
        });
      });
      
      // Start observing
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      console.log('[BBZCloud] WebUntis auto-close initialized');
    })();
  `,
  delay: 1000,
  description: 'Auto-click "Im Browser öffnen" and close banner overlay'
};

/**
 * Get injection script for a specific app
 */
export function getInjectionScript(appId: string): InjectionScript | null {
  switch (appId) {
    case 'schulcloud':
      return SCHULCLOUD_INJECTION;
    case 'office':
      return OFFICE_INJECTION;
    case 'webuntis':
      return WEBUNTIS_INJECTION;
    default:
      return null;
  }
}
