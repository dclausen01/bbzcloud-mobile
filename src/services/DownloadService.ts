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
}

export interface DownloadProgress {
  filename: string;
  loaded: number;
  total: number;
  percentage: number;
}

class DownloadService {
  private activeDownloads: Map<string, AbortController> = new Map();

  /**
   * Download a file from URL and save to device
   */
  async downloadFile(request: DownloadRequest): Promise<ApiResponse> {
    const filename = request.filename || this.extractFilenameFromUrl(request.url);
    
    try {
      console.log('[DownloadService] Starting download:', filename);

      // Create abort controller for this download
      const abortController = new AbortController();
      this.activeDownloads.set(filename, abortController);

      // Perform download with fetch in native context
      const response = await fetch(request.url, {
        method: 'GET',
        headers: request.headers || {},
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      // Get file content as blob
      const blob = await response.blob();
      
      // Convert blob to base64 for Filesystem API
      const base64Data = await this.blobToBase64(blob);

      // Save file to device
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true,
      });

      console.log('[DownloadService] File saved:', result.uri);

      // Clean up
      this.activeDownloads.delete(filename);

      // Show success notification
      await this.showDownloadNotification(filename, true);

      // Show success dialog
      await Dialog.alert({
        title: 'Download erfolgreich',
        message: `Die Datei "${filename}" wurde heruntergeladen und im Ordner "Dokumente" gespeichert.`,
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
   * Delete a downloaded file
   */
  async deleteFile(filename: string): Promise<ApiResponse> {
    try {
      await Filesystem.deleteFile({
        path: filename,
        directory: Directory.Documents,
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
  async getFileInfo(filename: string): Promise<ApiResponse> {
    try {
      const result = await Filesystem.stat({
        path: filename,
        directory: Directory.Documents,
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
}

// Export a singleton instance
export default new DownloadService();
