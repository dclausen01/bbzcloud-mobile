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
 * GLOBAL INJECTION - v9.0 Simplified Native-First Approach
 * 
 * Uses native Android download listener as primary method
 * JavaScript only as fallback for SPA downloads
 * Keyboard handling is now native via adjustResize
 */
export const GLOBAL_INJECTION: InjectionScript = {
  css: `
    /* Basic input styling for mobile */
    @media screen and (max-width: 768px) {
      input, textarea, select {
        font-size: 16px !important;
      }
    }
  `,
  js: `
    // SIMPLIFIED DOWNLOAD INTERCEPTION v2.0
    (function() {
      'use strict';
      
      console.log('[BBZCloud] Simplified download interception initialized');
      console.log('[BBZCloud] Native download listener should handle most downloads');
      
      /**
       * Minimal fallback download interception for SPA downloads
       * Only activates when native listener fails
       */
      function handleFallbackDownload(url, filename) {
        console.log('[BBZCloud] Fallback download interception:', url);
        
        // Send download request to native app
        if (window.mobileApp && window.mobileApp.postMessage) {
          window.mobileApp.postMessage({
            detail: {
              type: 'download',
              url: url,
              filename: filename,
              source: 'javascript-fallback'
            }
          });
        } else {
          console.error('[BBZCloud] mobileApp.postMessage not available for fallback');
        }
      }
      
      /**
       * Simple click detection for obvious download links
       * Only handles clear cases - let native listener do the heavy lifting
       */
      document.addEventListener('click', function(event) {
        // Quick check for obvious download links
        const link = event.target.closest('a');
        
        if (link && link.href) {
          const href = link.href;
          
          // Only handle very clear download cases
          if (link.hasAttribute('download') || 
              href.includes('download') ||
              href.match(/\\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar)$/i)) {
            
            console.log('[BBZCloud] Clear download link detected, using fallback');
            event.preventDefault();
            
            // Extract filename
            const filename = link.getAttribute('download') || 
                           href.split('/').pop().split('?')[0] || 
                           'download';
            
            handleFallbackDownload(href, filename);
            return false;
          }
        }
        
        // For schul.cloud and similar SPAs - minimal detection
        const fileElement = event.target.closest('[class*="file"], [class*="attachment"]');
        if (fileElement) {
          // Look for obvious download buttons within the file element
          const downloadButton = fileElement.querySelector('button[title*="download"], [class*="download"]');
          if (downloadButton) {
            console.log('[BBZCloud] SPA download button detected, using fallback');
            event.preventDefault();
            
            // Try to get filename from nearby text
            const filenameElement = fileElement.querySelector('[class*="filename"], [class*="name"]');
            const filename = filenameElement ? filenameElement.textContent.trim() : 'download';
            
            handleFallbackDownload('spa-download', filename);
            return false;
          }
        }
      });
      
      console.log('[BBZCloud] Fallback download interception ready');
    })();
  `,
  delay: 1000,
  description: 'Simplified download interception v2.0 - native-first approach'
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
