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
 * 2. Android navigation bar collision - adds safe padding at bottom
 */
export const GLOBAL_INJECTION: InjectionScript = {
  css: `
    /* GLOBAL KEYBOARD FIX - Optimized Version */
    /* Note: Bottom margin is handled by enabledSafeBottomMargin in BrowserService */
    
    /* Ensure all form inputs scroll into view when focused */
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
    
    /* Prevent zoom on input focus (optional - can be removed if zoom is desired) */
    @media screen and (max-width: 768px) {
      input, textarea, select {
        font-size: 16px !important; /* Prevents iOS zoom */
      }
    }
  `,
  js: `
    // GLOBAL KEYBOARD FIX - Optimized Version
    (function() {
      'use strict';
      console.log('[BBZCloud] Initializing keyboard fixes v2.0');
      
      // Configuration
      const CONFIG = {
        KEYBOARD_THRESHOLD: 0.75,     // More sensitive detection
        SCROLL_DELAY: 200,             // Reduced delay for faster response
        KEYBOARD_ESTIMATE: 0.45,       // Better keyboard height estimate
        DEBOUNCE_DELAY: 150,           // Debounce for resize events
      };
      
      let lastHeight = window.innerHeight;
      let resizeTimeout = null;
      let isKeyboardVisible = false;
      
      // 1. Ensure proper viewport configuration
      function setupViewport() {
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
          viewport = document.createElement('meta');
          viewport.name = 'viewport';
          document.head.appendChild(viewport);
        }
        // Allow user scaling for accessibility, but prevent auto-zoom on input
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover';
      }
      
      // 2. Smart scroll for focused inputs
      function scrollInputIntoView(input) {
        const rect = input.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const keyboardHeight = viewportHeight * CONFIG.KEYBOARD_ESTIMATE;
        const visibleArea = viewportHeight - keyboardHeight;
        
        // Check if input is in keyboard area
        if (rect.bottom > visibleArea - 50 || rect.top < 50) {
          // Calculate optimal scroll position
          const elementMiddle = rect.top + (rect.height / 2);
          const targetPosition = visibleArea / 2;
          const scrollAmount = elementMiddle - targetPosition;
          
          // Scroll to position
          window.scrollBy({
            top: scrollAmount,
            behavior: 'smooth'
          });
        }
      }
      
      // 3. Enhanced input focus handler
      function handleInputFocus() {
        const inputSelectors = 
          'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), ' +
          'textarea, select, [contenteditable="true"], [role="textbox"]';
        
        const inputs = document.querySelectorAll(inputSelectors);
        
        inputs.forEach(input => {
          // Skip if already has listener
          if (input.dataset.bbzFocusListener) return;
          input.dataset.bbzFocusListener = 'true';
          
          input.addEventListener('focus', function() {
            setTimeout(() => {
              if (isKeyboardVisible || document.activeElement === this) {
                scrollInputIntoView(this);
              }
            }, CONFIG.SCROLL_DELAY);
          }, { passive: true });
        });
      }
      
      // 4. Debounced keyboard detection
      function detectKeyboard() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          const currentHeight = window.innerHeight;
          const heightDiff = Math.abs(currentHeight - lastHeight);
          
          // Only react to significant height changes (keyboard show/hide)
          if (heightDiff > 100) {
            if (currentHeight < lastHeight * CONFIG.KEYBOARD_THRESHOLD) {
              // Keyboard appeared
              if (!isKeyboardVisible) {
                isKeyboardVisible = true;
                document.body.classList.add('bbz-keyboard-visible');
                console.log('[BBZCloud] Keyboard: visible');
                
                // Scroll focused element into view
                const focused = document.activeElement;
                if (focused && focused.matches('input, textarea, select, [contenteditable="true"]')) {
                  setTimeout(() => scrollInputIntoView(focused), CONFIG.SCROLL_DELAY);
                }
              }
            } else {
              // Keyboard hidden
              if (isKeyboardVisible) {
                isKeyboardVisible = false;
                document.body.classList.remove('bbz-keyboard-visible');
                console.log('[BBZCloud] Keyboard: hidden');
              }
            }
            lastHeight = currentHeight;
          }
        }, CONFIG.DEBOUNCE_DELAY);
      }
      
      // 5. Initialize on load
      function initialize() {
        setupViewport();
        handleInputFocus();
        
        // Listen for resize events
        window.addEventListener('resize', detectKeyboard, { passive: true });
        window.addEventListener('orientationchange', () => {
          setTimeout(() => {
            lastHeight = window.innerHeight;
            isKeyboardVisible = false;
          }, 500);
        }, { passive: true });
        
        // Watch for dynamically added inputs
        const observer = new MutationObserver((mutations) => {
          let hasNewInputs = false;
          for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
              for (const node of mutation.addedNodes) {
                if (node.nodeType === 1 && 
                    (node.matches('input, textarea, select, [contenteditable="true"]') ||
                     node.querySelector && node.querySelector('input, textarea, select, [contenteditable="true"]'))) {
                  hasNewInputs = true;
                  break;
                }
              }
            }
            if (hasNewInputs) break;
          }
          
          if (hasNewInputs) {
            setTimeout(handleInputFocus, 300);
          }
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        console.log('[BBZCloud] Keyboard fixes initialized');
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
