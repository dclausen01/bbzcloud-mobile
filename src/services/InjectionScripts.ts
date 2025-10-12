/**
 * BBZCloud Mobile - Injection Scripts
 * 
 * @version 7.6.0 - Production version with adjustResize
 */

export interface InjectionScript {
  js?: string;
  css?: string;
  delay?: number;
  description: string;
}

/**
 * GLOBAL INJECTION - v7.6 Production
 * 
 * Works with adjustResize in AndroidManifest.xml
 * This triggers visualViewport resize events properly
 */
export const GLOBAL_INJECTION: InjectionScript = {
  css: `
    /* GLOBAL KEYBOARD FIX v7.6 */
    
    html {
      scroll-behavior: smooth !important;
    }
    
    body {
      transition: padding-bottom 0.2s ease-out !important;
    }
    
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
      scroll-margin-bottom: 200px !important;
      scroll-margin-top: 100px !important;
    }
    
    @media screen and (max-width: 768px) {
      input, textarea, select {
        font-size: 16px !important;
      }
    }
  `,
  js: `
    // GLOBAL KEYBOARD FIX v7.6 - Production
    (function() {
      'use strict';
      
      const CONFIG = {
        KEYBOARD_THRESHOLD: 150,
        SCROLL_DELAYS: [200, 500, 800],
      };
      
      let baselineDiff = 0;
      let currentKeyboardHeight = 0;
      let originalPaddingBottom = '';
      let focusedInput = null;
      let isInitialized = false;
      
      function getHeightDiff() {
        if (typeof window.visualViewport === 'undefined') return 0;
        return window.innerHeight - window.visualViewport.height;
      }
      
      function measureBaseline() {
        const diff = getHeightDiff();
        // Fix negative baseline (rounding errors)
        baselineDiff = Math.max(0, diff);
        
        originalPaddingBottom = window.getComputedStyle(document.body).paddingBottom;
        if (originalPaddingBottom === '0px') originalPaddingBottom = '';
        isInitialized = true;
      }
      
      function applyKeyboardPadding(totalDiff) {
        const keyboardHeight = Math.max(0, totalDiff - baselineDiff);
        
        // Ignore small changes
        if (Math.abs(currentKeyboardHeight - keyboardHeight) < 20) return;
        
        currentKeyboardHeight = keyboardHeight;
        document.body.style.paddingBottom = keyboardHeight + 'px';
      }
      
      function removeKeyboardPadding() {
        if (currentKeyboardHeight === 0) return;
        
        currentKeyboardHeight = 0;
        document.body.style.paddingBottom = originalPaddingBottom;
      }
      
      function checkKeyboardState() {
        if (!isInitialized) return;
        
        const totalDiff = getHeightDiff();
        const keyboardHeight = totalDiff - baselineDiff;
        
        if (keyboardHeight > CONFIG.KEYBOARD_THRESHOLD) {
          applyKeyboardPadding(totalDiff);
        } else if (Math.abs(totalDiff - baselineDiff) < 50) {
          removeKeyboardPadding();
        }
      }
      
      function scrollInputIntoView(input) {
        if (!input) return;
        
        CONFIG.SCROLL_DELAYS.forEach(delay => {
          setTimeout(() => {
            if (focusedInput === input) {
              try {
                input.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                  inline: 'nearest'
                });
              } catch (e) {}
            }
          }, delay);
        });
      }
      
      function initialize() {
        // Viewport
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
          viewport = document.createElement('meta');
          viewport.name = 'viewport';
          document.head.appendChild(viewport);
        }
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
        
        // Measure baseline
        setTimeout(measureBaseline, 100);
        
        // Check visualViewport
        if (typeof window.visualViewport === 'undefined') {
          // Fallback for old browsers
          let lastHeight = window.innerHeight;
          window.addEventListener('resize', () => {
            const currentHeight = window.innerHeight;
            const heightDiff = lastHeight - currentHeight;
            
            if (heightDiff > CONFIG.KEYBOARD_THRESHOLD) {
              document.body.style.paddingBottom = heightDiff + 'px';
            } else if (currentHeight > lastHeight) {
              document.body.style.paddingBottom = originalPaddingBottom;
              lastHeight = currentHeight;
            }
          });
          return;
        }
        
        // Resize listener - THIS NOW WORKS with adjustResize!
        window.visualViewport.addEventListener('resize', checkKeyboardState);
        
        // Input focus
        document.addEventListener('focusin', (e) => {
          const target = e.target;
          const isInputElement = target && (
            (target.tagName === 'INPUT' && !['hidden', 'submit', 'button', 'checkbox', 'radio', 'file', 'image'].includes(target.type)) ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable ||
            target.getAttribute('role') === 'textbox'
          );
          
          if (isInputElement) {
            focusedInput = target;
            scrollInputIntoView(target);
            
            // Additional checks in case resize event is delayed
            [100, 300, 500, 700, 1000].forEach(delay => {
              setTimeout(checkKeyboardState, delay);
            });
          }
        }, true);
        
        document.addEventListener('focusout', () => {
          focusedInput = null;
          setTimeout(checkKeyboardState, 300);
        }, true);
        
        // Orientation
        window.addEventListener('orientationchange', () => {
          setTimeout(() => {
            document.body.style.paddingBottom = '';
            currentKeyboardHeight = 0;
            setTimeout(measureBaseline, 500);
          }, 300);
        });
      }
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
      } else {
        initialize();
      }
    })();
  `,
  delay: 500,
  description: 'Global keyboard handling v7.6 with adjustResize'
};

/**
 * schul.cloud - Production scroll fix
 */
export const SCHULCLOUD_INJECTION: InjectionScript = {
  css: `
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
    
    [class*="wrapper"][class*="ng-tns"] {
      overflow-y: auto !important;
    }
  `,
  js: `
    (function() {
      function applyScrollFixes() {
        const scrollableSelectors = [
          '[class*="outer-scroller"]',
          '[class*="navigation-item-wrapper"]',
          '[class*="scroller"]'
        ];
        
        scrollableSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            if (element.scrollHeight > element.clientHeight) {
              element.style.webkitOverflowScrolling = 'touch';
              const touchAction = window.getComputedStyle(element).touchAction;
              if (touchAction === 'none') {
                element.style.touchAction = 'pan-y';
              }
            }
          });
        });
      }
      
      setTimeout(applyScrollFixes, 1000);
      setInterval(applyScrollFixes, 5000);
      
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
    })();
  `,
  delay: 1500,
  description: 'Production scroll fix'
};

/**
 * WebUntis - Auto-close dialogs
 */
export const WEBUNTIS_INJECTION: InjectionScript = {
  js: `
    (function() {
      let attemptCount = 0;
      const maxAttempts = 30;
      
      function closeElements() {
        attemptCount++;
        let foundAndClicked = false;
        
        const links = document.querySelectorAll('a, button');
        for (const link of links) {
          if (link.textContent && link.textContent.includes('Im Browser öffnen') && link.offsetParent !== null) {
            link.click();
            foundAndClicked = true;
            break;
          }
        }
        
        const closeSelectors = [
          '[class*="banner"] [class*="close"]',
          '[class*="overlay"] [class*="close"]',
          '[class*="notification"] [class*="close"]',
          'button[aria-label*="close" i]',
          'button[aria-label*="schließen" i]',
          'button[title*="close" i]',
          'button[title*="schließen" i]',
          'button:has(svg[class*="close"])',
          'button:has([class*="close"])',
          '[style*="position: absolute"][style*="right"][style*="top"] button',
          '[style*="position: fixed"][style*="right"][style*="top"] button'
        ];
        
        for (const selector of closeSelectors) {
          try {
            const buttons = document.querySelectorAll(selector);
            for (const button of buttons) {
              if (button && button.offsetParent !== null) {
                const hasCloseIcon = 
                  button.textContent.includes('×') || 
                  button.textContent.includes('✕') ||
                  button.innerHTML.includes('close') ||
                  button.className.includes('close');
                
                if (hasCloseIcon) {
                  button.click();
                  foundAndClicked = true;
                  break;
                }
              }
            }
            if (foundAndClicked) break;
          } catch (e) {
            continue;
          }
        }
        
        if (attemptCount < maxAttempts) {
          setTimeout(closeElements, 500);
        }
      }
      
      setTimeout(closeElements, 500);
      
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) {
              const text = node.textContent || '';
              if (text.includes('Im Browser öffnen') || 
                  node.querySelector && (
                    node.querySelector('[class*="banner"]') ||
                    node.querySelector('[class*="overlay"]') ||
                    node.querySelector('[class*="notification"]')
                  )) {
                setTimeout(closeElements, 300);
              }
            }
          });
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    })();
  `,
  delay: 1000,
  description: 'Auto-click dialogs'
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
