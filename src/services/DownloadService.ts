/**
 * BBZCloud Mobile - Download Service
 * 
 * Handles file downloads from web apps opened in InAppBrowser
 * Downloads are performed in native context and saved to device storage
 * 
 * @version 1.0.0
 */

import { Filesystem, Directory } from '@capacitor/filesystem';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Dialog } from '@capacitor/dialog';
import type { ApiResponse } from '../types';

export interface DownloadRequest {
  url: string;
  filename?: string;
  headers?: Record<string, string>;
  mimeType?: string;
  method?: 'GET' | 'POST';
  formData?: Record<string, string | number | boolean>;
}

export interface DownloadProgress {
  filename: string;
  loaded: number;
  total: number;
  percentage: number;
}

export interface DownloadOptions {
  showInNotification?: boolean; // Show progress in notification
  directory?: Directory; // Allow custom directory
}

class DownloadService {
  private activeDownloads: Map<string, AbortController> = new Map();

  /**
   * Download a file from URL and save to device
   */
  async downloadFile(
    request: DownloadRequest, 
    options?: DownloadOptions,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<ApiResponse> {
    let filename = request.filename || this.extractFilenameFromUrl(request.url);
    let targetDirectory = options?.directory;
    
    try {
      console.log('[DownloadService] Starting download from URL:', request.url);
      console.log('[DownloadService] Initial filename:', filename);
      console.log('[DownloadService] Target directory option:', targetDirectory);

      // Show directory selection dialog if needed
      if (!targetDirectory) {
        const selectedDir = await this.showDirectorySelectionDialog();
        if (!selectedDir) {
          // User cancelled
          return { success: false, error: 'Download vom Benutzer abgebrochen' };
        }
        targetDirectory = selectedDir;
      }

      console.log('[DownloadService] Final target directory:', targetDirectory);

      // Create abort controller for this download
      const abortController = new AbortController();
      this.activeDownloads.set(filename, abortController);

      // Prepare fetch options
      const fetchOptions: RequestInit = {
        method: request.method || 'GET',
        headers: request.headers || {},
        signal: abortController.signal,
      };

      // Add body for POST requests
      if (request.method === 'POST' && request.formData) {
        // Convert formData object to URLSearchParams for application/x-www-form-urlencoded
        const formBody = new URLSearchParams();
        Object.keys(request.formData).forEach(key => {
          formBody.append(key, String(request.formData![key]));
        });
        
        fetchOptions.body = formBody;
        
        // Set content type if not already set
        if (!fetchOptions.headers) {
          fetchOptions.headers = {};
        }
        if (!(fetchOptions.headers as Record<string, string>)['Content-Type']) {
          (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        
        console.log('[DownloadService] POST request with form data:', Object.keys(request.formData));
      }

      // Perform download with fetch in native context
      // fetch automatically follows redirects
      console.log('[DownloadService] Starting fetch request to:', request.url);
      console.log('[DownloadService] Fetch options:', {
        method: fetchOptions.method,
        headers: fetchOptions.headers,
        hasBody: !!fetchOptions.body
      });

      const response = await fetch(request.url, fetchOptions);

      console.log('[DownloadService] Fetch response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url
      });

      if (!response.ok) {
        throw new Error(`Download fehlgeschlagen: ${response.status} ${response.statusText}`);
      }

      // Validate final URL after redirects
      const finalUrl = response.url;
      if (finalUrl !== request.url) {
        console.log('[DownloadService] URL redirected from', request.url, 'to', finalUrl);
        
        // Check if redirect is to a login page or error page
        if (this.isInvalidRedirect(finalUrl)) {
          throw new Error('Download wurde zu einer ungültigen Seite weitergeleitet. Möglicherweise ist eine Anmeldung erforderlich.');
        }
      }

      // Try to extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          let extractedFilename = filenameMatch[1].replace(/['"]/g, '');
          // Handle UTF-8 encoded filenames (filename*=UTF-8''...)
          if (extractedFilename.includes('UTF-8')) {
            const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;\n]*)/);
            if (utf8Match && utf8Match[1]) {
              extractedFilename = decodeURIComponent(utf8Match[1]);
            }
          }
          filename = extractedFilename;
          console.log('[DownloadService] Filename from Content-Disposition:', filename);
        }
      }

      // Fallback: Try to get filename from final URL after redirects
      if (!filename || filename === 'view.php' || filename.includes('?')) {
        filename = this.extractFilenameFromUrl(finalUrl);
        console.log('[DownloadService] Filename from final URL:', filename);
      }

      // Get content length for progress tracking
      const contentLength = parseInt(response.headers.get('Content-Length') || '0', 10);
      console.log('[DownloadService] Content-Length:', contentLength);

      // Download with progress tracking
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      // Read data in chunks and track progress
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        receivedLength += value.length;
        
        // Calculate and report progress
        const percentage = contentLength > 0 
          ? Math.round((receivedLength / contentLength) * 100)
          : -1; // Unknown size
        
        const progress: DownloadProgress = {
          filename,
          loaded: receivedLength,
          total: contentLength,
          percentage,
        };
        
        // Call progress callback if provided
        if (onProgress) {
          onProgress(progress);
        }
        
        // Update notification if enabled
        if (options?.showInNotification && percentage >= 0) {
          await this.updateDownloadNotification(filename, percentage);
        }
        
        console.log(`[DownloadService] Progress: ${percentage}% (${receivedLength}/${contentLength})`);
      }

      // Concatenate chunks into single Uint8Array
      const allChunks = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        allChunks.set(chunk, position);
        position += chunk.length;
      }

      // Create blob from downloaded data
      const blob = new Blob([allChunks]);
      
      // Validate that we have actual file content (not HTML error page)
      if (blob.type.includes('text/html') && blob.size < 10000) {
        throw new Error('Der Link führt zu einer HTML-Seite, nicht zu einer Datei. Bitte versuchen Sie es mit einem direkten Download-Link.');
      }
      
      // Convert blob to base64 for Filesystem API
      const base64Data = await this.blobToBase64(blob);

      // Save file to device
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: targetDirectory,
        recursive: true,
      });

      console.log('[DownloadService] File saved:', result.uri);

      // Clean up
      this.activeDownloads.delete(filename);

      // Show success notification
      await this.showDownloadNotification(filename, true);

      // Show success dialog with directory info
      const directoryName = this.getDirectoryDisplayName(targetDirectory);
      await Dialog.alert({
        title: 'Download erfolgreich',
        message: `Die Datei "${filename}" wurde heruntergeladen und im Ordner "${directoryName}" gespeichert.`,
      });

      return {
        success: true,
        data: {
          filename,
          uri: result.uri,
        },
      };
    } catch (error) {
      console.error('[DownloadService] Download failed:', error);

      // Clean up
      this.activeDownloads.delete(filename);

      // Show error notification
      await this.showDownloadNotification(filename, false);

      // Show error dialog
      await Dialog.alert({
        title: 'Download fehlgeschlagen',
        message: `Die Datei "${filename}" konnte nicht heruntergeladen werden.\n\nFehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed',
      };
    }
  }

  /**
   * Cancel an active download
   */
  async cancelDownload(filename: string): Promise<ApiResponse> {
    const controller = this.activeDownloads.get(filename);
    
    if (!controller) {
      return {
        success: false,
        error: 'Download not found',
      };
    }

    controller.abort();
    this.activeDownloads.delete(filename);

    return { success: true };
  }

  /**
   * Get list of active downloads
   */
  getActiveDownloads(): string[] {
    return Array.from(this.activeDownloads.keys());
  }

  /**
   * Check if a download is active
   */
  isDownloadActive(filename: string): boolean {
    return this.activeDownloads.has(filename);
  }

  /**
   * Extract filename from URL
   */
  private extractFilenameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
      
      // If no filename or too generic, create one with timestamp
      if (!filename || filename.length < 3) {
        const timestamp = new Date().getTime();
        return `download_${timestamp}`;
      }

      // Decode URI component to handle special characters
      return decodeURIComponent(filename);
    } catch (error) {
      console.warn('[DownloadService] Failed to extract filename from URL:', error);
      const timestamp = new Date().getTime();
      return `download_${timestamp}`;
    }
  }

  /**
   * Convert Blob to Base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Remove data URL prefix (e.g., "data:image/png;base64,")
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read blob'));
      };
      
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Update download progress notification
   */
  private async updateDownloadNotification(filename: string, percentage: number): Promise<void> {
    try {
      const permission = await LocalNotifications.requestPermissions();
      
      if (permission.display !== 'granted') {
        return;
      }

      // Use a consistent ID for the same download to update the same notification
      const notificationId = this.getNotificationId(filename);

      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Download läuft',
            body: `"${filename}" - ${percentage}%`,
            id: notificationId,
            schedule: { at: new Date(Date.now() + 100) },
            ongoing: true, // Keep notification visible during download
          },
        ],
      });
    } catch (error) {
      console.warn('[DownloadService] Failed to update notification:', error);
    }
  }

  /**
   * Show download notification
   */
  private async showDownloadNotification(filename: string, success: boolean): Promise<void> {
    try {
      // Request permission first (if not already granted)
      const permission = await LocalNotifications.requestPermissions();
      
      if (permission.display !== 'granted') {
        console.warn('[DownloadService] Notification permission not granted');
        return;
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title: success ? 'Download abgeschlossen' : 'Download fehlgeschlagen',
            body: success
              ? `"${filename}" wurde erfolgreich heruntergeladen.`
              : `"${filename}" konnte nicht heruntergeladen werden.`,
            id: Math.floor(Math.random() * 1000000),
            schedule: { at: new Date(Date.now() + 100) },
          },
        ],
      });
    } catch (error) {
      console.warn('[DownloadService] Failed to show notification:', error);
    }
  }

  /**
   * List downloaded files
   */
  async listDownloadedFiles(): Promise<ApiResponse> {
    try {
      const result = await Filesystem.readdir({
        path: '',
        directory: Directory.Documents,
      });

      return {
        success: true,
        data: result.files,
      };
    } catch (error) {
      console.error('[DownloadService] Failed to list files:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list files',
      };
    }
  }

  /**
   * Show directory selection dialog
   */
  private async showDirectorySelectionDialog(): Promise<Directory | null> {
    try {
      console.log('[DownloadService] Showing directory selection dialog');
      
      const result = await Dialog.confirm({
        title: 'Speicherort wählen',
        message: 'Wo möchten Sie die Datei speichern?',
        okButtonTitle: 'Dokumente',
        cancelButtonTitle: 'Abbrechen',
      });

      console.log('[DownloadService] Dialog result:', result);

      // If user cancelled (result.value is false), return null
      if (!result.value) {
        console.log('[DownloadService] User cancelled directory selection');
        return null;
      }

      // User confirmed, use Documents directory
      console.log('[DownloadService] User selected Documents directory');
      return Directory.Documents;
    } catch (error) {
      console.error('[DownloadService] Error showing directory dialog:', error);
      return null;
    }
  }

  /**
   * Get display name for directory
   */
  private getDirectoryDisplayName(directory: Directory): string {
    switch (directory) {
      case Directory.Documents:
        return 'Dokumente';
      case Directory.Data:
        return 'App-Daten';
      case Directory.Cache:
        return 'Cache';
      case Directory.External:
        return 'Externer Speicher';
      case Directory.ExternalStorage:
        return 'Externer Speicher';
      default:
        return 'Unbekannt';
    }
  }

  /**
   * Get consistent notification ID for a filename
   */
  private getNotificationId(filename: string): number {
    // Create a simple hash of the filename to get a consistent ID
    let hash = 0;
    for (let i = 0; i < filename.length; i++) {
      const char = filename.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Check if redirected URL is invalid (login page, error page, etc.)
   */
  private isInvalidRedirect(url: string): boolean {
    const urlLower = url.toLowerCase();
    
    // Check for common login/error indicators
    const invalidPatterns = [
      '/login',
      '/signin',
      '/auth',
      '/error',
      '/404',
      '/403',
      '/401',
      'denied',
    ];
    
    return invalidPatterns.some(pattern => urlLower.includes(pattern));
  }

  /**
   * Delete a downloaded file
   */
  async deleteFile(filename: string, directory: Directory = Directory.Documents): Promise<ApiResponse> {
    try {
      await Filesystem.deleteFile({
        path: filename,
        directory,
      });

      return { success: true };
    } catch (error) {
      console.error('[DownloadService] Failed to delete file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete file',
      };
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(filename: string, directory: Directory = Directory.Documents): Promise<ApiResponse> {
    try {
      const result = await Filesystem.stat({
        path: filename,
        directory,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('[DownloadService] Failed to get file info:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get file info',
      };
    }
  }

  /**
   * Test download functionality with a sample file
   */
  async testDownload(): Promise<ApiResponse> {
    try {
      console.log('[DownloadService] Testing download functionality...');
      
      // Test with a small public file
      const testUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      const testFilename = 'test_download.pdf';
      
      const result = await this.downloadFile(
        {
          url: testUrl,
          filename: testFilename,
        },
        {
          showInNotification: true,
        },
        (progress) => {
          console.log(`[DownloadService] Test download progress: ${progress.percentage}%`);
        }
      );

      console.log('[DownloadService] Test download result:', result);
      return result;
    } catch (error) {
      console.error('[DownloadService] Test download failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Test download failed',
      };
    }
  }

  /**
   * Debug method to check download setup
   */
  async debugDownloadSetup(): Promise<void> {
    console.log('[DownloadService] === Download Setup Debug ===');
    
    try {
      // Check filesystem permissions
      console.log('[DownloadService] Checking filesystem access...');
      const testResult = await Filesystem.writeFile({
        path: 'debug_test.txt',
        data: 'test',
        directory: Directory.Documents,
        recursive: true,
      });
      console.log('[DownloadService] Filesystem write test:', testResult);
      
      // Clean up test file
      await Filesystem.deleteFile({
        path: 'debug_test.txt',
        directory: Directory.Documents,
      });
      console.log('[DownloadService] Test file cleaned up');
      
      // Check notification permissions
      const notificationPermission = await LocalNotifications.requestPermissions();
      console.log('[DownloadService] Notification permission:', notificationPermission);
      
      // Check dialog functionality
      console.log('[DownloadService] Dialog functionality available');
      
      console.log('[DownloadService] === Debug Complete ===');
    } catch (error) {
      console.error('[DownloadService] Debug failed:', error);
    }
  }
}

// Export a singleton instance
export default new DownloadService();
