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
