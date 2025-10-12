/**
 * BBZCloud Mobile - Injection Scripts
 * 
 * JavaScript and CSS injection scripts for specific apps that need modifications
 * 
 * @version 6.0.0 - Aggressive viewport manipulation for keyboard handling
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
 * 3. Direct viewport and container manipulation for keyboard space
 * 4. Visual feedback for debugging
 * 
 * Note: Navigation bar padding is handled by enabledSafeBottomMargin: true in BrowserService
 */
export const GLOBAL_INJECTION: InjectionScript = {
  css: `
    /* GLOBAL KEYBOARD FIX v6.0 - Aggressive Viewport Manipulation */
    
    /* Critical: Override all height constraints when keyboard is visible */
    html {
      scroll-behavior: smooth !important;
      height: 100% !important;
      position: relative !important;
    }
    
    body {
      position: relative !important;
      transition: all 0.2s ease-out !important;
      overflow-y: auto !important;
    }
    
    /* When keyboard is visible, force containers to fit */
    body.bbz-keyboard-visible {
      /* This class is added via JavaScript when keyboard appears */
    }
    
    /* Force all fixed/absolute containers to respect the keyboard */
    body.bbz-keyboard-visible * {
      /* Remove problematic fixed positioning during keyboard */
      position: static !important;
    }
    
    /* Except for truly essential fixed elements */
    body.bbz-keyboard-visible header,
    body.bbz-keyboard-visible [role="banner"],
    body.bbz-keyboard-visible nav:first-of-type {
      position: sticky !important;
      top: 0 !important;
    }
    
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
    
    /* Prevent zoom on input focus on mobile (16px minimum prevents iOS zoom) */
    @media screen and (max-width: 768px) {
      input, textarea, select {
        font-size: 16px !important;
      }
    }
    
    /* Visual debugging indicator */
    body.bbz-keyboard-visible::before {
      content: '⌨️ KEYBOARD ACTIVE' !important;
      position: fixed !important;
      top: 0 !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      background: rgba(255, 0, 0, 0.8) !important;
      color: white !important;
      padding: 4px 12px !important;
      font-size: 12px !important;
      font-weight: bold !important;
      z-index: 999999 !important;
      border-radius: 0 0 8px 8px !important;
      pointer-events: none !important;
    }
  `,
  js: `
    // GLOBAL KEYBOARD FIX v6.0 - Aggressive Viewport Manipulation
    (function() {
      'use strict';
      console.log('[BBZCloud] 🎹 Keyboard handler v6.0 - Aggressive viewport manipulation');
      
      // Configuration
      const CONFIG = {
        KEYBOARD_MIN_HEIGHT: 150,    // Minimum height change to consider as keyboard
        SCROLL_OFFSET: 100,          // Pixels from bottom to keep input visible
        SCALE_THRESHOLD: 0.3,        // Maximum scale reduction (30%)
      };
      
      let isKeyboardVisible = false;
      let keyboardHeight = 0;
      let focusedInput = null;
      let originalStyles = new Map(); // Store original styles for restoration
      let pageWrapper = null; // Main page container
      
      // Debug helper
      function debugLog(message, data) {
        if (data) {
          console.log('[BBZCloud] 🎹', message, data);
        } else {
          console.log('[BBZCloud] 🎹', message);
        }
      }
      
      // 1. Ensure proper viewport configuration
      function setupViewport() {
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
          viewport = document.createElement('meta');
          viewport.name = 'viewport';
          document.head.appendChild(viewport);
          debugLog('Created new viewport meta tag');
        }
        const oldContent = viewport.content;
        // Optimal viewport settings for mobile web apps
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover';
        debugLog('Viewport configured', { old: oldContent, new: viewport.content });
      }
      
      // 2. Aggressive keyboard detection and page manipulation
      function setupKeyboardDetection() {
        const hasVisualViewport = typeof window.visualViewport !== 'undefined';
        debugLog('Keyboard detection method', { 
          hasVisualViewport, 
          windowHeight: window.innerHeight,
          visualHeight: hasVisualViewport ? window.visualViewport.height : 'N/A'
        });
        
        // Find or create page wrapper
        pageWrapper = document.body.firstElementChild || document.body;
        debugLog('Page wrapper identified', { 
          tag: pageWrapper.tagName,
          id: pageWrapper.id,
          className: pageWrapper.className
        });
        
        if (hasVisualViewport) {
          debugLog('✅ Using visualViewport API (precise)');
          
          window.visualViewport.addEventListener('resize', () => {
            const viewportHeight = window.visualViewport.height;
            const windowHeight = window.innerHeight;
            const heightDiff = windowHeight - viewportHeight;
            
            debugLog('visualViewport resize', {
              windowHeight,
              viewportHeight,
              heightDiff,
              threshold: CONFIG.KEYBOARD_MIN_HEIGHT
            });
            
            if (heightDiff > CONFIG.KEYBOARD_MIN_HEIGHT) {
              // Keyboard is visible
              if (!isKeyboardVisible) {
                isKeyboardVisible = true;
                keyboardHeight = heightDiff;
                applyKeyboardSpace();
              }
            } else {
              // Keyboard is hidden
              if (isKeyboardVisible) {
                isKeyboardVisible = false;
                keyboardHeight = 0;
                restoreOriginalLayout();
              }
            }
          });
        } else {
          debugLog('⚠️ Using window.resize fallback');
          
          let lastHeight = window.innerHeight;
          window.addEventListener('resize', () => {
            const currentHeight = window.innerHeight;
            const heightDiff = lastHeight - currentHeight;
            
            if (heightDiff > CONFIG.KEYBOARD_MIN_HEIGHT && !isKeyboardVisible) {
              isKeyboardVisible = true;
              keyboardHeight = heightDiff;
              applyKeyboardSpace();
            } else if (heightDiff < -100 && isKeyboardVisible) {
              isKeyboardVisible = false;
              keyboardHeight = 0;
              restoreOriginalLayout();
              lastHeight = currentHeight;
            }
          });
        }
      }
      
      // 3. Apply aggressive layout changes to make room for keyboard
      function applyKeyboardSpace() {
        document.body.classList.add('bbz-keyboard-visible');
        
        debugLog('🚨 KEYBOARD SHOWN - Applying aggressive layout changes', {
          keyboardHeight,
          windowHeight: window.innerHeight,
          visualHeight: window.visualViewport ? window.visualViewport.height : 'N/A'
        });
        
        // Method 1: Set explicit height on html and body
        if (!originalStyles.has('html')) {
          originalStyles.set('html', {
            height: document.documentElement.style.height,
            overflow: document.documentElement.style.overflow
          });
        }
        if (!originalStyles.has('body')) {
          originalStyles.set('body', {
            height: document.body.style.height,
            paddingBottom: document.body.style.paddingBottom,
            overflow: document.body.style.overflow
          });
        }
        
        const availableHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight - keyboardHeight;
        
        document.documentElement.style.height = availableHeight + 'px';
        document.documentElement.style.overflow = 'hidden';
        document.body.style.height = availableHeight + 'px';
        document.body.style.overflow = 'auto';
        
        debugLog('✅ Set fixed heights', {
          htmlHeight: document.documentElement.style.height,
          bodyHeight: document.body.style.height,
          availableHeight
        });
        
        // Method 2: Add bottom padding as fallback
        document.body.style.paddingBottom = (keyboardHeight + CONFIG.SCROLL_OFFSET) + 'px';
        
        // Scroll focused input if exists
        if (focusedInput) {
          debugLog('Scrolling focused input into view');
          setTimeout(() => scrollInputIntoView(focusedInput), 200);
        }
      }
      
      // 4. Restore original layout when keyboard hides
      function restoreOriginalLayout() {
        document.body.classList.remove('bbz-keyboard-visible');
        
        debugLog('🔄 KEYBOARD HIDDEN - Restoring original layout');
        
        // Restore HTML styles
        if (originalStyles.has('html')) {
          const htmlStyles = originalStyles.get('html');
          document.documentElement.style.height = htmlStyles.height;
          document.documentElement.style.overflow = htmlStyles.overflow;
        }
        
        // Restore body styles
        if (originalStyles.has('body')) {
          const bodyStyles = originalStyles.get('body');
          document.body.style.height = bodyStyles.height;
          document.body.style.paddingBottom = bodyStyles.paddingBottom;
          document.body.style.overflow = bodyStyles.overflow;
        }
        
        debugLog('✅ Original layout restored');
      }
      
      // 5. Enhanced scroll for focused inputs
      function scrollInputIntoView(input, immediate = false) {
        if (!input) {
          debugLog('⚠️ scrollInputIntoView called without input');
          return;
        }
        
        try {
          const rect = input.getBoundingClientRect();
          const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
          const inputBottom = rect.bottom;
          const inputTop = rect.top;
          const visibleBottom = viewportHeight - 100; // 100px safe zone
          
          // Check if input is near bottom of page (might need extra help)
          const pageHeight = Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
          );
          const inputPagePosition = window.pageYOffset + rect.top;
          const isNearBottom = (inputPagePosition / pageHeight) > 0.8; // Last 20% of page
          
          debugLog('Input position check', {
            immediate,
            inputTag: input.tagName,
            inputType: input.type,
            inputTop,
            inputBottom,
            viewportHeight,
            visibleBottom,
            pageHeight,
            inputPagePosition,
            isNearBottom,
            currentBodyHeight: document.body.style.height,
            needsScroll: inputBottom > visibleBottom || inputTop < 100
          });
          
          if (isNearBottom) {
            debugLog('🎯 Input is near BOTTOM of page - Dynamic padding should help');
          }
          
          debugLog('🔄 Scrolling input into view - Multiple methods');
          
          // Method 1: scrollIntoView
          try {
            input.scrollIntoView({
              behavior: immediate ? 'auto' : 'smooth',
              block: 'center',
              inline: 'nearest'
            });
            debugLog('✅ Method 1: scrollIntoView executed');
          } catch (e) {
            debugLog('❌ Method 1 failed:', e.message);
          }
          
          // Method 2: Focus the input (triggers native scroll on some browsers)
          setTimeout(() => {
            try {
              if (document.activeElement !== input) {
                input.focus();
                debugLog('✅ Method 2: Re-focused input');
              }
            } catch (e) {
              debugLog('❌ Method 2 failed:', e.message);
            }
          }, 50);
          
          // Method 3: Manual scroll with window.scrollTo
          setTimeout(() => {
            try {
              const newRect = input.getBoundingClientRect();
              const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
              const targetY = scrollTop + newRect.top - (viewportHeight * 0.3);
              
              debugLog('📊 Method 3: Manual scroll', { 
                currentScrollTop: scrollTop,
                targetY,
                inputTop: newRect.top 
              });
              
              window.scrollTo({
                top: Math.max(0, targetY),
                behavior: immediate ? 'auto' : 'smooth'
              });
              debugLog('✅ Method 3: scrollTo executed');
            } catch (e) {
              debugLog('❌ Method 3 failed:', e.message);
            }
          }, 150);
          
          // Method 4: Scroll parent containers
          setTimeout(() => {
            try {
              let parent = input.parentElement;
              let scrolled = false;
              
              while (parent && parent !== document.body && !scrolled) {
                const parentStyle = window.getComputedStyle(parent);
                const hasScroll = parentStyle.overflowY === 'scroll' || 
                                  parentStyle.overflowY === 'auto' ||
                                  parent.scrollHeight > parent.clientHeight;
                
                if (hasScroll) {
                  const parentRect = parent.getBoundingClientRect();
                  const inputRect = input.getBoundingClientRect();
                  
                  if (inputRect.bottom > parentRect.bottom || inputRect.top < parentRect.top) {
                    parent.scrollTop = input.offsetTop - parent.offsetTop - (parent.clientHeight / 3);
                    debugLog('✅ Method 4: Scrolled parent container', {
                      parent: parent.tagName,
                      scrollTop: parent.scrollTop
                    });
                    scrolled = true;
                  }
                }
                parent = parent.parentElement;
              }
              
              if (!scrolled) {
                debugLog('⚠️ Method 4: No scrollable parent found');
              }
            } catch (e) {
              debugLog('❌ Method 4 failed:', e.message);
            }
          }, 200);
          
          // Method 5: Force scroll with scrollBy
          setTimeout(() => {
            try {
              const finalRect = input.getBoundingClientRect();
              const finalViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
              
              if (finalRect.bottom > finalViewportHeight - 100 || finalRect.top < 100) {
                const scrollAmount = finalRect.bottom - (finalViewportHeight * 0.7);
                debugLog('📊 Method 5: Final adjustment', { scrollAmount });
                
                window.scrollBy({
                  top: scrollAmount,
                  behavior: 'smooth'
                });
                debugLog('✅ Method 5: scrollBy executed');
              }
            } catch (e) {
              debugLog('❌ Method 5 failed:', e.message);
            }
          }, 300);
          
        } catch (error) {
          debugLog('❌ Error in scrollInputIntoView', error.message);
        }
      }
      
      // 6. Setup input focus handlers
      function setupInputHandlers() {
        debugLog('Setting up AGGRESSIVE input focus handlers');
        
        // Use event delegation for better performance
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
            focusedInput = target;
            debugLog('🎯 Input FOCUSED - AGGRESSIVE MODE', {
              tag: target.tagName,
              type: target.type,
              id: target.id,
              className: target.className,
              contentEditable: target.isContentEditable
            });
            
            // Immediate scroll (RIGHT NOW)
            scrollInputIntoView(target, true);
            
            // Second attempt at 100ms
            setTimeout(() => {
              if (focusedInput === target) {
                debugLog('2nd scroll attempt (100ms)');
                scrollInputIntoView(target, true);
              }
            }, 100);
            
            // Third attempt at 300ms (keyboard should be visible)
            setTimeout(() => {
              if (focusedInput === target) {
                debugLog('3rd scroll attempt (300ms - keyboard visible)');
                scrollInputIntoView(target, false);
              }
            }, 300);
            
            // Fourth attempt at 500ms (final)
            setTimeout(() => {
              if (focusedInput === target) {
                debugLog('4th scroll attempt (500ms - final)');
                scrollInputIntoView(target, false);
              }
            }, 500);
            
            // Fourth final attempt at 600ms (after padding is applied)
            setTimeout(() => {
              if (focusedInput === target) {
                debugLog('4th scroll attempt (600ms - after padding applied)');
                scrollInputIntoView(target, false);
              }
            }, 600);
            
          } else {
            debugLog('Focus on non-input element', {
              tag: target ? target.tagName : 'null',
              type: target ? target.type : 'null'
            });
          }
        }, true);
        
        // Also listen for click events on inputs
        document.addEventListener('click', (e) => {
          const target = e.target;
          const isInputElement = target && (
            (target.tagName === 'INPUT' && !['hidden', 'submit', 'button', 'checkbox', 'radio', 'file', 'image'].includes(target.type)) ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable ||
            target.getAttribute('role') === 'textbox'
          );
          
          if (isInputElement) {
            debugLog('🖱️ Input CLICKED - triggering scroll');
            setTimeout(() => {
              scrollInputIntoView(target, true);
            }, 50);
            setTimeout(() => {
              scrollInputIntoView(target, false);
            }, 350);
          }
        }, true);
        
        document.addEventListener('focusout', (e) => {
          if (focusedInput) {
            debugLog('🎯 Input BLURRED', {
              tag: focusedInput.tagName,
              type: focusedInput.type
            });
          }
          focusedInput = null;
        }, true);
        
        debugLog('✅ AGGRESSIVE input handlers registered');
      }
      
      // 7. Handle orientation changes
      function setupOrientationHandler() {
        window.addEventListener('orientationchange', () => {
          debugLog('🔄 Orientation changed');
          
          // Reset keyboard state
          setTimeout(() => {
            isKeyboardVisible = false;
            keyboardHeight = 0;
            document.body.classList.remove('bbz-keyboard-visible');
            lastViewportHeight = window.innerHeight;
            
            debugLog('Orientation state reset', {
              newHeight: window.innerHeight
            });
            
            // Re-scroll focused input if exists
            if (focusedInput) {
              debugLog('Re-scrolling focused input after orientation');
              setTimeout(() => scrollInputIntoView(focusedInput), 500);
            }
          }, 500);
        });
        
        debugLog('✅ Orientation handler registered');
      }
      
      // 8. Initialize
      function initialize() {
        debugLog('🚀 Initializing keyboard handler v6.0...');
        debugLog('Environment', {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          readyState: document.readyState,
          windowHeight: window.innerHeight,
          visualViewport: typeof window.visualViewport !== 'undefined',
          supportsDVH: CSS.supports('height', '100dvh')
        });
        
        try {
          setupViewport();
          setupKeyboardDetection();
          setupInputHandlers();
          setupOrientationHandler();
          
          debugLog('✅ Keyboard handler v6.0 initialized successfully');
          debugLog('Features enabled', {
            aggressiveViewportManipulation: true,
            fixedHeightConstraints: true,
            visualDebugIndicator: true,
            multiMethodScrolling: true
          });
          
          // Test with a sample input if any exists
          setTimeout(() => {
            const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea');
            debugLog('Found inputs on page', { count: inputs.length });
            if (inputs.length > 0) {
              debugLog('Sample inputs', Array.from(inputs).slice(0, 3).map(i => ({
                tag: i.tagName,
                type: i.type,
                id: i.id
              })));
            }
          }, 1000);
        } catch (error) {
          debugLog('❌ Initialization error', error.message);
        }
      }
      
      // Run after DOM is ready
      if (document.readyState === 'loading') {
        debugLog('Waiting for DOMContentLoaded...');
        document.addEventListener('DOMContentLoaded', initialize);
      } else {
        debugLog('DOM already loaded, initializing immediately');
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
