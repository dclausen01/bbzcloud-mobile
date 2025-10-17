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
 * GLOBAL INJECTION - v8.0 Production
 * 
 * Uses native adjustResize in AndroidManifest.xml
 * Only contains download interception - keyboard handling is now native
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
    // DOWNLOAD INTERCEPTION v1.0
    (function() {
      'use strict';
      
      console.log('[BBZCloud] Download interception initialized');
      
      /**
       * Extract filename from various sources
       */
      function extractFilename(url, link) {
        // Try to get from download attribute
        if (link && link.hasAttribute('download')) {
          const downloadAttr = link.getAttribute('download');
          if (downloadAttr && downloadAttr.trim()) {
            return downloadAttr.trim();
          }
        }
        
        // Try to extract from URL
        try {
          const urlObj = new URL(url, window.location.href);
          const pathname = urlObj.pathname;
          const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
          if (filename && filename.length > 2) {
            return decodeURIComponent(filename);
          }
        } catch (e) {
          console.warn('[BBZCloud] Failed to parse download URL:', e);
        }
        
        return null;
      }
      
      /**
       * Get authentication headers from cookies/localStorage
       */
      function getAuthHeaders() {
        const headers = {};
        
        // Try to get common auth tokens
        try {
          // Bearer token from localStorage
          const token = localStorage.getItem('token') || 
                       localStorage.getItem('authToken') ||
                       localStorage.getItem('access_token');
          if (token) {
            headers['Authorization'] = 'Bearer ' + token;
          }
          
          // CSRF token from meta tag
          const csrfMeta = document.querySelector('meta[name="csrf-token"]');
          if (csrfMeta) {
            headers['X-CSRF-Token'] = csrfMeta.getAttribute('content');
          }
        } catch (e) {
          console.warn('[BBZCloud] Failed to extract auth headers:', e);
        }
        
        return headers;
      }
      
      /**
       * Check if URL is a download link
       */
      function isDownloadUrl(url) {
        if (!url) return false;
        
        const urlLower = url.toLowerCase();
        
        // Simple string matching - much more reliable than regex in injected code
        const patterns = [
          'download',
          'attachment',
          'export',
          // Moodle patterns
          '/mod/resource/view.php',
          '/mod/folder/view.php',
          '/pluginfile.php',
          // Nextcloud patterns
          '/index.php/s/',
          '/index.php/f/',
          '/files/'
        ];
        
        return patterns.some(pattern => urlLower.includes(pattern.toLowerCase()));
      }
      
      /**
       * Check if element or URL indicates a download
       */
      function isDownloadLink(element) {
        if (!element) return false;
        
        // Check for download attribute
        if (element.hasAttribute('download')) return true;
        
        // Check href
        const href = element.getAttribute('href');
        if (href && isDownloadUrl(href)) return true;
        
        // Check text content
        const text = element.textContent || '';
        const downloadKeywords = ['download', 'herunterladen', 'export', 'exportieren'];
        if (downloadKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
          return true;
        }
        
        // Check file extensions
        const fileExtensions = [
          '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
          '.zip', '.rar', '.tar', '.gz', '.7z',
          '.jpg', '.jpeg', '.png', '.gif', '.svg',
          '.mp3', '.mp4', '.avi', '.mov',
          '.txt', '.csv', '.json', '.xml'
        ];
        
        if (href && fileExtensions.some(ext => href.toLowerCase().includes(ext))) {
          return true;
        }
        
        return false;
      }
      
      /**
       * Handle download request
       */
      function handleDownload(url, filename, headers) {
        console.log('[BBZCloud] Intercepting download:', url);
        
        // Send download request to native app
        if (window.mobileApp && window.mobileApp.postMessage) {
          window.mobileApp.postMessage({
            detail: {
              type: 'download',
              url: url,
              filename: filename,
              headers: headers
            }
          });
        } else {
          console.error('[BBZCloud] mobileApp.postMessage not available');
        }
      }
      
      /**
       * Click event listener for download links
       */
      document.addEventListener('click', function(event) {
        console.log('[BBZCloud] Click detected on:', event.target);
        
        // Try to find a link (works for traditional links)
        const link = event.target.closest('a');
        
        if (link) {
          const href = link.getAttribute('href');
          console.log('[BBZCloud] Link href:', href);
          
          if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
            // Check if this is a download link
            const isDownload = isDownloadLink(link);
            console.log('[BBZCloud] Is download link?', isDownload);
            
            if (isDownload) {
              console.log('[BBZCloud] Preventing default and intercepting download');
              event.preventDefault();
              event.stopPropagation();
              event.stopImmediatePropagation();
              
              // Get absolute URL
              const absoluteUrl = new URL(href, window.location.href).href;
              
              // Extract filename
              const filename = extractFilename(absoluteUrl, link);
              
              // Get auth headers
              const headers = getAuthHeaders();
              
              // Handle download
              handleDownload(absoluteUrl, filename, headers);
              
              return false;
            }
          }
        }
        
        // For SPAs like schul.cloud: Check if clicked element is a file/download item
        // Look for elements with file indicators
        const clickedElement = event.target;
        const fileElement = clickedElement.closest('[class*="file"], [class*="attachment"], [class*="download"], [data-type="file"]');
        
        if (fileElement) {
          console.log('[BBZCloud] Potential file element clicked:', fileElement);
          
          // Try to find download info from the element
          const fileInfo = extractFileInfoFromElement(fileElement);
          
          if (fileInfo && fileInfo.url) {
            console.log('[BBZCloud] File info extracted:', fileInfo);
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            
            handleDownload(fileInfo.url, fileInfo.filename, getAuthHeaders());
            return false;
          }
        }
        
        console.log('[BBZCloud] No download action needed');
      }, { capture: true, passive: false });
      
      /**
       * Extract file information from SPA elements (like schul.cloud)
       */
      function extractFileInfoFromElement(element) {
        console.log('[BBZCloud] Extracting file info from element:', element);
        
        // Try to find URL from various attributes
        let url = element.getAttribute('href') ||
                 element.getAttribute('data-url') ||
                 element.getAttribute('data-file-url') ||
                 element.getAttribute('data-download-url') ||
                 element.getAttribute('data-attachment-url');
        
        // Try to find URL in onclick or ng-click attributes
        const onclick = element.getAttribute('onclick') || element.getAttribute('ng-click');
        if (!url && onclick) {
          const urlMatch = onclick.match(/https?:[\/]{2}[^\\s'"]+/);
          if (urlMatch) {
            url = urlMatch[0];
          }
        }
        
        // Look for download buttons in the vicinity
        if (!url) {
          const downloadButton = element.querySelector('[class*="download"], button[title*="download"], button[aria-label*="download"]');
          if (downloadButton) {
            url = downloadButton.getAttribute('href') ||
                 downloadButton.getAttribute('data-url') ||
                 downloadButton.getAttribute('data-download-url');
          }
        }
        
        // Try to find filename from text content or attributes
        let filename = element.getAttribute('data-filename') ||
                      element.getAttribute('title') ||
                      element.getAttribute('aria-label') ||
                      element.textContent?.trim();
        
        // Look for filename in child elements
        if (!filename || filename.length > 100) {
          const filenameElement = element.querySelector('[class*="filename"], [class*="name"], .title, [class*="file-name"]');
          if (filenameElement) {
            filename = filenameElement.textContent?.trim();
          }
        }
        
        // Look for filename in parent elements
        if (!filename || filename.length > 100) {
          const parentFilename = element.closest('[class*="file"]')?.querySelector('[class*="filename"], [class*="name"], .title');
          if (parentFilename) {
            filename = parentFilename.textContent?.trim();
          }
        }
        
        // If still no URL, try to find any link in the element or its parents
        if (!url) {
          const linkElement = element.querySelector('a[href]') || element.closest('a[href]');
          if (linkElement) {
            url = linkElement.getAttribute('href');
          }
        }
        
        console.log('[BBZCloud] Extracted info:', { url, filename });
        
        if (url) {
          return { url, filename };
        }
        
        return null;
      }
      
      /**
       * Intercept form submissions that might be downloads
       */
      document.addEventListener('submit', function(event) {
        const form = event.target;
        if (!form) return;
        
        const action = form.getAttribute('action');
        if (action && isDownloadUrl(action)) {
          console.log('[BBZCloud] Download form detected, intercepting POST download');
          
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          
          // Extract form data
          const formData = new FormData(form);
          const formDataObj = {};
          formData.forEach((value, key) => {
            formDataObj[key] = value;
          });
          
          // Get absolute URL
          const absoluteUrl = new URL(action, window.location.href).href;
          
          // Get filename from form if available
          const filenameInput = form.querySelector('input[name="filename"]');
          const filename = filenameInput ? filenameInput.value : null;
          
          // Get auth headers
          const headers = getAuthHeaders();
          
          // Send POST download request to native
          handlePostDownload(absoluteUrl, formDataObj, filename, headers);
          
          return false;
        }
      }, true);
      
      /**
       * Handle POST download request
       */
      function handlePostDownload(url, formData, filename, headers) {
        console.log('[BBZCloud] Intercepting POST download:', url);
        
        // Send download request to native app with POST data
        if (window.mobileApp && window.mobileApp.postMessage) {
          window.mobileApp.postMessage({
            detail: {
              type: 'download',
              method: 'POST',
              url: url,
              filename: filename,
              headers: headers,
              formData: formData
            }
          });
        } else {
          console.error('[BBZCloud] mobileApp.postMessage not available');
        }
      }
      
      /**
       * Enhanced download button detection for SPAs
       */
      function enhanceDownloadDetection() {
        // Look for download buttons that might be added dynamically
        const observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
              if (node.nodeType === 1) {
                // Check for download buttons
                const downloadButtons = node.querySelectorAll ? 
                  node.querySelectorAll('button[title*="download"], button[aria-label*="download"], [class*="download"]') : [];
                
                downloadButtons.forEach(button => {
                  if (!button.hasAttribute('data-bbzcloud-enhanced')) {
                    button.setAttribute('data-bbzcloud-enhanced', 'true');
                    button.addEventListener('click', function(e) {
                      console.log('[BBZCloud] Enhanced download button clicked:', button);
                      
                      // Try to find the file container
                      const fileContainer = button.closest('[class*="file"], [class*="attachment"]');
                      if (fileContainer) {
                        const fileInfo = extractFileInfoFromElement(fileContainer);
                        if (fileInfo && fileInfo.url) {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDownload(fileInfo.url, fileInfo.filename, getAuthHeaders());
                          return false;
                        }
                      }
                      
                      // If no URL found, try to trigger the original download and intercept the network request
                      console.log('[BBZCloud] No direct URL found, monitoring network requests...');
                    });
                  }
                });
              }
            });
          });
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
      
      /**
       * Network request interception (fallback)
       */
      function setupNetworkInterception() {
        // Override XMLHttpRequest to catch download requests
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
          this._bbzcloud_method = method;
          this._bbzcloud_url = url;
          return originalXHROpen.apply(this, [method, url, ...args]);
        };
        
        XMLHttpRequest.prototype.send = function(data) {
          const xhr = this;
          
          // Check if this looks like a download request
          if (xhr._bbzcloud_url && isDownloadUrl(xhr._bbzcloud_url)) {
            console.log('[BBZCloud] Intercepted XHR download request:', xhr._bbzcloud_url);
            
            // Listen for the response
            const originalOnReadyStateChange = xhr.onreadystatechange;
            xhr.onreadystatechange = function() {
              if (xhr.readyState === 4 && xhr.status === 200) {
                // Try to get filename from Content-Disposition header
                const contentDisposition = xhr.getResponseHeader('Content-Disposition');
                let filename = null;
                
                if (contentDisposition) {
                  const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                  if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                  }
                }
                
                // Create blob URL and trigger download
                const blob = new Blob([xhr.response], { type: xhr.getResponseHeader('Content-Type') || 'application/octet-stream' });
                const blobUrl = URL.createObjectURL(blob);
                
                handleDownload(xhr._bbzcloud_url, filename, getAuthHeaders());
                
                // Clean up
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
              }
              
              if (originalOnReadyStateChange) {
                originalOnReadyStateChange.apply(this, arguments);
              }
            };
          }
          
          return originalXHRSend.apply(this, data);
        };
        
        // Override fetch to catch download requests
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
          if (typeof url === 'string' && isDownloadUrl(url)) {
            console.log('[BBZCloud] Intercepted fetch download request:', url);
            
            return originalFetch.apply(this, arguments).then(response => {
              if (response.ok) {
                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = null;
                
                if (contentDisposition) {
                  const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                  if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                  }
                }
                
                handleDownload(url, filename, getAuthHeaders());
              }
              
              return response;
            });
          }
          
          return originalFetch.apply(this, arguments);
        };
      }
      
      // Initialize enhanced detection
      setTimeout(enhanceDownloadDetection, 1000);
      setTimeout(setupNetworkInterception, 1500);
      
      console.log('[BBZCloud] Download interception ready');
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
