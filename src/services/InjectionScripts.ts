/**
 * BBZCloud Mobile - Injection Scripts
 * 
 * JavaScript and CSS injection scripts for specific apps that need modifications
 * 
 * @version 7.0.0 - Minimal solution for keyboard handling
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
 * GLOBAL INJECTION - Applied to ALL web apps
 * 
 * Fixes:
 * 1. Keyboard handling - ensures input fields are not covered by keyboard
 * 2. Uses visualViewport API for precise keyboard detection
 * 3. Simple padding-based solution without height manipulation
 * 4. Smooth scrolling with single delayed attempt
 * 
 * Note: Navigation bar padding is handled by enabledSafeBottomMargin: true in BrowserService
 */
export const GLOBAL_INJECTION: InjectionScript = {
  css: `
    /* GLOBAL KEYBOARD FIX v7.0 - Minimal Solution */
    
    html {
      scroll-behavior: smooth !important;
    }
    
    body {
      transition: padding-bottom 0.2s ease-out !important;
    }
    
    /* Ensure all form inputs can scroll into view with adequate margin */
    input[type="text"],
    input[type="email"],
    input[type="password"],
    input[type="search"],
    input[type="tel"],
    input[type="url"],
    input[type="number"],
    input[type="date"],
    input[type="time"],
    input[type="datetime-local"],
    textarea,
    select,
    [contenteditable="true"],
    [role="textbox"] {
      scroll-margin-bottom: 150px !important;
      scroll-margin-top: 100px !important;
    }
    
    /* Prevent zoom on input focus on mobile (16px minimum prevents iOS zoom) */
    @media screen and (max-width: 768px) {
      input, textarea, select {
        font-size: 16px !important;
      }
    }
  `,
  js: `
    // GLOBAL KEYBOARD FIX v7.0 - Minimal Solution
    (function() {
      'use strict';
      console.log('[BBZCloud] 🎹 Keyboard handler v7.0 - Minimal solution');
      
      // Configuration
      const CONFIG = {
        KEYBOARD_MIN_HEIGHT: 150,    // Minimum height change to consider as keyboard
        SCROLL_DELAY: 300,           // Single delay for smooth scrolling
      };
      
      let currentKeyboardHeight = 0;
      let originalPaddingBottom = '';
      
      // 1. Ensure proper viewport configuration
      function setupViewport() {
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
          viewport = document.createElement('meta');
          viewport.name = 'viewport';
          document.head.appendChild(viewport);
        }
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
        console.log('[BBZCloud] 🎹 Viewport configured');
      }
      
      // 2. Simple keyboard detection with padding adjustment
      function setupKeyboardDetection() {
        const hasVisualViewport = typeof window.visualViewport !== 'undefined';
        console.log('[BBZCloud] 🎹 Detection method:', hasVisualViewport ? 'visualViewport (precise)' : 'window.resize (fallback)');
        
        // Store original padding
        originalPaddingBottom = window.getComputedStyle(document.body).paddingBottom;
        
        // Check initial state (fixes Problem 1: works immediately on load)
        function checkKeyboardState() {
          let keyboardHeight = 0;
          
          if (hasVisualViewport) {
            keyboardHeight = window.innerHeight - window.visualViewport.height;
          }
          
          if (keyboardHeight > CONFIG.KEYBOARD_MIN_HEIGHT) {
            applyKeyboardPadding(keyboardHeight);
          } else {
            removeKeyboardPadding();
          }
        }
        
        // Initial check
        checkKeyboardState();
        
        if (hasVisualViewport) {
          window.visualViewport.addEventListener('resize', checkKeyboardState);
        } else {
          // Fallback for browsers without visualViewport
          let lastHeight = window.innerHeight;
          window.addEventListener('resize', () => {
            const currentHeight = window.innerHeight;
            const heightDiff = lastHeight - currentHeight;
            
            if (heightDiff > CONFIG.KEYBOARD_MIN_HEIGHT) {
              applyKeyboardPadding(heightDiff);
            } else if (currentHeight > lastHeight) {
              removeKeyboardPadding();
              lastHeight = currentHeight;
            }
          });
        }
        
        console.log('[BBZCloud] 🎹 Keyboard detection active');
      }
      
      // 3. Apply bottom padding (fixes Problem 2: no double reduction)
      function applyKeyboardPadding(keyboardHeight) {
        if (currentKeyboardHeight === keyboardHeight) return; // Already applied
        
        currentKeyboardHeight = keyboardHeight;
        document.body.style.paddingBottom = keyboardHeight + 'px';
        
        console.log('[BBZCloud] 🎹 Keyboard visible - padding applied:', keyboardHeight + 'px');
      }
      
      // 4. Remove padding when keyboard hides (fixes Problem 2: clean restoration)
      function removeKeyboardPadding() {
        if (currentKeyboardHeight === 0) return; // Already removed
        
        currentKeyboardHeight = 0;
        document.body.style.paddingBottom = originalPaddingBottom;
        
        console.log('[BBZCloud] 🎹 Keyboard hidden - padding removed');
      }
      
      // 5. Single smooth scroll for focused inputs (fixes ruckelndes Scrolling)
      function setupInputHandlers() {
        let scrollTimeout = null;
        
        document.addEventListener('focusin', (e) => {
          const target = e.target;
          
          // Check if target is an input element
          const isInputElement = target && (
            (target.tagName === 'INPUT' && !['hidden', 'submit', 'button', 'checkbox', 'radio', 'file', 'image'].includes(target.type)) ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable ||
            target.getAttribute('role') === 'textbox'
          );
          
          if (isInputElement) {
            console.log('[BBZCloud] 🎹 Input focused:', target.tagName, target.type || 'N/A');
            
            // Clear any pending scroll
            if (scrollTimeout) {
              clearTimeout(scrollTimeout);
            }
            
            // Single delayed scroll after keyboard animation
            scrollTimeout = setTimeout(() => {
              try {
                target.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                  inline: 'nearest'
                });
                console.log('[BBZCloud] 🎹 Input scrolled into view');
              } catch (error) {
                console.log('[BBZCloud] 🎹 Scroll error (non-critical):', error.message);
              }
            }, CONFIG.SCROLL_DELAY);
          }
        }, true);
        
        console.log('[BBZCloud] 🎹 Input handlers registered');
      }
      
      // 6. Handle orientation changes
      function setupOrientationHandler() {
        window.addEventListener('orientationchange', () => {
          console.log('[BBZCloud] 🎹 Orientation changed - resetting');
          
          // Reset state after orientation change
          setTimeout(() => {
            currentKeyboardHeight = 0;
            document.body.style.paddingBottom = originalPaddingBottom;
            
            // Re-check keyboard state
            if (typeof window.visualViewport !== 'undefined') {
              const keyboardHeight = window.innerHeight - window.visualViewport.height;
              if (keyboardHeight > CONFIG.KEYBOARD_MIN_HEIGHT) {
                applyKeyboardPadding(keyboardHeight);
              }
            }
          }, 500);
        });
        
        console.log('[BBZCloud] 🎹 Orientation handler registered');
      }
      
      // 7. Initialize
      function initialize() {
        console.log('[BBZCloud] 🎹 Initializing keyboard handler v7.0...');
        console.log('[BBZCloud] 🎹 Environment:', {
          platform: navigator.platform,
          windowHeight: window.innerHeight,
          visualViewport: typeof window.visualViewport !== 'undefined'
        });
        
        try {
          setupViewport();
          setupKeyboardDetection();
          setupInputHandlers();
          setupOrientationHandler();
          
          console.log('[BBZCloud] 🎹 Keyboard handler v7.0 initialized successfully');
        } catch (error) {
          console.log('[BBZCloud] 🎹 Initialization error:', error.message);
        }
      }
      
      // Run after DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
      } else {
        initialize();
      }
    })();
  `,
  delay: 500,
  description: 'Global keyboard handling and navigation bar padding for all apps'
};

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
    case 'webuntis':
      return WEBUNTIS_INJECTION;
    default:
      return null;
  }
}
