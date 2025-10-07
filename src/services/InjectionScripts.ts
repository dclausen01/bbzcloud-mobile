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
 * schul.cloud - Fix touch scrolling for channel and chat windows
 * 
 * Problem: Channel list and chat windows on the left side are not scrollable by finger touch, only by mouse
 * Solution: Add CSS to enable touch scrolling with -webkit-overflow-scrolling
 */
export const SCHULCLOUD_INJECTION: InjectionScript = {
  css: `
    /* Enable touch scrolling for schul.cloud channel and chat windows */
    .channel-list,
    .chat-list,
    .sidebar,
    .conversation-list,
    [class*="channel"],
    [class*="sidebar"],
    [class*="conversation"] {
      overflow-y: auto !important;
      -webkit-overflow-scrolling: touch !important;
      overscroll-behavior: contain !important;
    }
    
    /* Ensure scrollable containers have proper touch handling */
    .scrollable,
    [data-scrollable="true"] {
      overflow-y: auto !important;
      -webkit-overflow-scrolling: touch !important;
      overscroll-behavior: contain !important;
    }
  `,
  js: `
    // Additional JavaScript to ensure touch scrolling works
    (function() {
      console.log('[BBZCloud] Initializing schul.cloud touch scroll fix');
      
      // Function to enable touch scrolling on elements
      function enableTouchScroll(element) {
        if (!element) return;
        
        element.style.overflowY = 'auto';
        element.style.webkitOverflowScrolling = 'touch';
        element.style.overscrollBehavior = 'contain';
      }
      
      // Apply to common selectors
      const selectors = [
        '.channel-list',
        '.chat-list',
        '.sidebar',
        '.conversation-list',
        '[class*="channel"]',
        '[class*="sidebar"]',
        '[class*="conversation"]',
        '.scrollable',
        '[data-scrollable="true"]'
      ];
      
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(enableTouchScroll);
      });
      
      // Use MutationObserver to handle dynamically added elements
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) { // ELEMENT_NODE
              selectors.forEach(selector => {
                if (node.matches && node.matches(selector)) {
                  enableTouchScroll(node);
                }
                node.querySelectorAll && node.querySelectorAll(selector).forEach(enableTouchScroll);
              });
            }
          });
        });
      });
      
      // Start observing
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      console.log('[BBZCloud] schul.cloud touch scroll fix applied');
    })();
  `,
  delay: 1000,
  description: 'Enable touch scrolling for channel and chat windows'
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
