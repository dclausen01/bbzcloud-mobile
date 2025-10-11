/**
 * BBZCloud Mobile - Injection Scripts
 * 
 * JavaScript and CSS injection scripts for specific apps that need modifications
 * 
 * @version 2.0.0
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
 * 
 * Note: Navigation bar padding is handled by enabledSafeBottomMargin: true in BrowserService
 */
export const GLOBAL_INJECTION: InjectionScript = {
  css: `
    /* GLOBAL KEYBOARD FIX - WebView API Based */
    
    /* Ensure all form inputs can scroll into view with padding */
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
    
    /* Smooth scroll behavior for better UX */
    html {
      scroll-behavior: smooth !important;
    }
    
    /* Prevent zoom on input focus on mobile (16px minimum prevents iOS zoom) */
    @media screen and (max-width: 768px) {
      input, textarea, select {
        font-size: 16px !important;
      }
    }
    
    /* Visual indicator when keyboard is visible (optional) */
    body.bbz-keyboard-visible {
      /* Can be used by websites to adjust their layout */
    }
  `,
  js: `
    // GLOBAL KEYBOARD FIX - WebView API Based (No Native Bridge Required)
    (function() {
      'use strict';
      console.log('[BBZCloud] Keyboard handler v4.0 - WebView API based');
      
      // Configuration
      const CONFIG = {
        SCROLL_DELAY: 300,           // Delay before scrolling input (wait for keyboard)
        DEBOUNCE_DELAY: 100,         // Debounce for resize events
        KEYBOARD_MIN_HEIGHT: 150,    // Minimum height change to consider as keyboard
      };
      
      let isKeyboardVisible = false;
      let keyboardHeight = 0;
      let focusedInput = null;
      
      // 1. Ensure proper viewport configuration
      function setupViewport() {
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
          viewport = document.createElement('meta');
          viewport.name = 'viewport';
          document.head.appendChild(viewport);
        }
        // Optimal viewport settings for mobile web apps
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover';
      }
      
      // 2. Precise keyboard detection using visualViewport API
      function setupKeyboardDetection() {
        if (window.visualViewport) {
          console.log('[BBZCloud] Using visualViewport API for keyboard detection');
          
          // visualViewport provides precise measurements
          window.visualViewport.addEventListener('resize', () => {
            const viewportHeight = window.visualViewport.height;
            const windowHeight = window.innerHeight;
            const heightDiff = windowHeight - viewportHeight;
            
            if (heightDiff > CONFIG.KEYBOARD_MIN_HEIGHT) {
              // Keyboard is visible
              if (!isKeyboardVisible) {
                isKeyboardVisible = true;
                keyboardHeight = heightDiff;
                document.body.classList.add('bbz-keyboard-visible');
                console.log('[BBZCloud] Keyboard shown, height:', keyboardHeight);
                
                // Scroll focused input if exists
                if (focusedInput) {
                  scrollInputIntoView(focusedInput);
                }
              }
            } else {
              // Keyboard is hidden
              if (isKeyboardVisible) {
                isKeyboardVisible = false;
                keyboardHeight = 0;
                document.body.classList.remove('bbz-keyboard-visible');
                console.log('[BBZCloud] Keyboard hidden');
              }
            }
          });
        } else {
          console.log('[BBZCloud] Using window.resize fallback for keyboard detection');
          
          // Fallback: Use window.resize (less precise)
          let lastHeight = window.innerHeight;
          let resizeTimeout;
          
          window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
              const currentHeight = window.innerHeight;
              const heightDiff = lastHeight - currentHeight;
              
              if (heightDiff > CONFIG.KEYBOARD_MIN_HEIGHT) {
                // Keyboard appeared
                if (!isKeyboardVisible) {
                  isKeyboardVisible = true;
                  keyboardHeight = heightDiff;
                  document.body.classList.add('bbz-keyboard-visible');
                  console.log('[BBZCloud] Keyboard shown (fallback), estimated height:', keyboardHeight);
                  
                  if (focusedInput) {
                    scrollInputIntoView(focusedInput);
                  }
                }
              } else if (heightDiff < -100) {
                // Keyboard disappeared
                if (isKeyboardVisible) {
                  isKeyboardVisible = false;
                  keyboardHeight = 0;
                  document.body.classList.remove('bbz-keyboard-visible');
                  console.log('[BBZCloud] Keyboard hidden (fallback)');
                  lastHeight = currentHeight;
                }
              }
            }, CONFIG.DEBOUNCE_DELAY);
          });
        }
      }
      
      // 3. Smart scroll for focused inputs
      function scrollInputIntoView(input) {
        if (!input) return;
        
        try {
          const rect = input.getBoundingClientRect();
          const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
          
          // Check if input is covered by keyboard or out of view
          const inputBottom = rect.bottom;
          const visibleBottom = viewportHeight - 20; // 20px padding
          
          if (inputBottom > visibleBottom || rect.top < 80) {
            console.log('[BBZCloud] Scrolling input into view');
            
            // Method 1: scrollIntoView (most reliable)
            input.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });
            
            // Method 2: Manual scroll calculation (backup)
            setTimeout(() => {
              const newRect = input.getBoundingClientRect();
              if (newRect.bottom > visibleBottom) {
                const scrollAmount = newRect.bottom - visibleBottom + 50;
                window.scrollBy({
                  top: scrollAmount,
                  behavior: 'smooth'
                });
              }
            }, 150);
          }
        } catch (error) {
          console.error('[BBZCloud] Error scrolling input:', error);
        }
      }
      
      // 4. Setup input focus handlers
      function setupInputHandlers() {
        // Use event delegation for better performance
        document.addEventListener('focusin', (e) => {
          const target = e.target;
          
          // Check if target is an input element
          if (target && (
            target.tagName === 'INPUT' && !['hidden', 'submit', 'button'].includes(target.type) ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable ||
            target.getAttribute('role') === 'textbox'
          )) {
            focusedInput = target;
            console.log('[BBZCloud] Input focused:', target.tagName);
            
            // Wait for keyboard to appear, then scroll
            setTimeout(() => {
              if (focusedInput === target) {
                scrollInputIntoView(target);
              }
            }, CONFIG.SCROLL_DELAY);
          }
        }, true);
        
        document.addEventListener('focusout', () => {
          focusedInput = null;
        }, true);
      }
      
      // 5. Handle orientation changes
      function setupOrientationHandler() {
        window.addEventListener('orientationchange', () => {
          console.log('[BBZCloud] Orientation changed');
          
          // Reset keyboard state
          setTimeout(() => {
            isKeyboardVisible = false;
            keyboardHeight = 0;
            document.body.classList.remove('bbz-keyboard-visible');
            
            // Re-scroll focused input if exists
            if (focusedInput) {
              setTimeout(() => scrollInputIntoView(focusedInput), 500);
            }
          }, 500);
        });
      }
      
      // 6. Initialize
      function initialize() {
        console.log('[BBZCloud] Initializing keyboard handler...');
        
        setupViewport();
        setupKeyboardDetection();
        setupInputHandlers();
        setupOrientationHandler();
        
        console.log('[BBZCloud] Keyboard handler initialized');
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
