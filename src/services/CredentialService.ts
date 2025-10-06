/**
 * BBZCloud Mobile - Credential Service
 * 
 * Handles secure storage and retrieval of user credentials
 * using Capacitor Secure Storage plugin
 * 
 * @version 1.0.0
 */

import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { STORAGE_KEYS } from '../utils/constants';
import type { UserCredentials, ApiResponse } from '../types';

class CredentialService {
  private storagePrefix = 'bbzcloud_';

  /**
   * Get prefixed storage key
   */
  private getKey(key: string): string {
    return `${this.storagePrefix}${key}`;
  }

  /**
   * Save a single credential securely
   */
  async saveCredential(key: string, value: string): Promise<ApiResponse> {
    try {
      // Try Capacitor Secure Storage first (for real devices)
      try {
        await SecureStorage.set(this.getKey(key), value);
      } catch {
        // Fallback to localStorage for browser/dev mode
        console.warn('Secure Storage not available, using localStorage fallback');
        localStorage.setItem(this.getKey(key), value);
      }
      return { success: true };
    } catch (error) {
      console.error('Error saving credential:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save credential'
      };
    }
  }

  /**
   * Get a single credential securely
   */
  async getCredential(key: string): Promise<string | null> {
    try {
      // Try Capacitor Secure Storage first (for real devices)
      try {
        const value = await SecureStorage.get(this.getKey(key));
        return value ? String(value) : null;
      } catch {
        // Fallback to localStorage for browser/dev mode
        console.warn('Secure Storage not available, using localStorage fallback');
        return localStorage.getItem(this.getKey(key));
      }
    } catch (error) {
      // Key not found is not an error, just return null
      if (error instanceof Error && error.message.includes('not found')) {
        return null;
      }
      console.error('Error getting credential:', error);
      return null;
    }
  }

  /**
   * Remove a single credential
   */
  async removeCredential(key: string): Promise<ApiResponse> {
    try {
      // Try Capacitor Secure Storage first (for real devices)
      try {
        await SecureStorage.remove(this.getKey(key));
      } catch {
        // Fallback to localStorage for browser/dev mode
        console.warn('Secure Storage not available, using localStorage fallback');
        localStorage.removeItem(this.getKey(key));
      }
      return { success: true };
    } catch (error) {
      console.error('Error removing credential:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove credential'
      };
    }
  }

  /**
   * Save all user credentials
   */
  async saveCredentials(credentials: UserCredentials): Promise<ApiResponse> {
    try {
      const promises: Promise<ApiResponse>[] = [];

      if (credentials.email !== undefined) {
        promises.push(this.saveCredential(STORAGE_KEYS.CREDENTIAL_EMAIL, credentials.email));
      }

      if (credentials.password !== undefined) {
        promises.push(this.saveCredential(STORAGE_KEYS.CREDENTIAL_PASSWORD, credentials.password));
      }

      if (credentials.bbbPassword !== undefined) {
        promises.push(this.saveCredential(STORAGE_KEYS.CREDENTIAL_BBB_PASSWORD, credentials.bbbPassword));
      }

      if (credentials.webuntisEmail !== undefined) {
        promises.push(this.saveCredential(STORAGE_KEYS.CREDENTIAL_WEBUNTIS_EMAIL, credentials.webuntisEmail));
      }

      if (credentials.webuntisPassword !== undefined) {
        promises.push(this.saveCredential(STORAGE_KEYS.CREDENTIAL_WEBUNTIS_PASSWORD, credentials.webuntisPassword));
      }

      await Promise.all(promises);
      return { success: true, message: 'All credentials saved successfully' };
    } catch (error) {
      console.error('Error saving credentials:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save credentials'
      };
    }
  }

  /**
   * Load all user credentials
   */
  async loadCredentials(): Promise<ApiResponse<UserCredentials>> {
    try {
      const [email, password, bbbPassword, webuntisEmail, webuntisPassword] = await Promise.all([
        this.getCredential(STORAGE_KEYS.CREDENTIAL_EMAIL),
        this.getCredential(STORAGE_KEYS.CREDENTIAL_PASSWORD),
        this.getCredential(STORAGE_KEYS.CREDENTIAL_BBB_PASSWORD),
        this.getCredential(STORAGE_KEYS.CREDENTIAL_WEBUNTIS_EMAIL),
        this.getCredential(STORAGE_KEYS.CREDENTIAL_WEBUNTIS_PASSWORD)
      ]);

      const credentials: UserCredentials = {
        email: email || undefined,
        password: password || undefined,
        bbbPassword: bbbPassword || undefined,
        webuntisEmail: webuntisEmail || undefined,
        webuntisPassword: webuntisPassword || undefined
      };

      return {
        success: true,
        data: credentials
      };
    } catch (error) {
      console.error('Error loading credentials:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load credentials'
      };
    }
  }

  /**
   * Check if user email exists (indicates if user has set up account)
   */
  async hasUserEmail(): Promise<boolean> {
    try {
      const email = await this.getCredential(STORAGE_KEYS.CREDENTIAL_EMAIL);
      return !!email;
    } catch (error) {
      console.error('Error checking user email:', error);
      return false;
    }
  }

  /**
   * Get user email
   */
  async getUserEmail(): Promise<string | null> {
    return await this.getCredential(STORAGE_KEYS.CREDENTIAL_EMAIL);
  }

  /**
   * Clear all credentials (logout)
   */
  async clearAllCredentials(): Promise<ApiResponse> {
    try {
      await Promise.all([
        this.removeCredential(STORAGE_KEYS.CREDENTIAL_EMAIL),
        this.removeCredential(STORAGE_KEYS.CREDENTIAL_PASSWORD),
        this.removeCredential(STORAGE_KEYS.CREDENTIAL_BBB_PASSWORD),
        this.removeCredential(STORAGE_KEYS.CREDENTIAL_WEBUNTIS_EMAIL),
        this.removeCredential(STORAGE_KEYS.CREDENTIAL_WEBUNTIS_PASSWORD)
      ]);

      return { success: true, message: 'All credentials cleared' };
    } catch (error) {
      console.error('Error clearing credentials:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear credentials'
      };
    }
  }

  /**
   * Get credential for a specific service
   * Useful for auto-filling login forms
   */
  async getServiceCredentials(service: 'bbb' | 'webuntis'): Promise<ApiResponse<{ email?: string; password?: string }>> {
    try {
      let email: string | null = null;
      let password: string | null = null;

      if (service === 'bbb') {
        email = await this.getCredential(STORAGE_KEYS.CREDENTIAL_EMAIL);
        password = await this.getCredential(STORAGE_KEYS.CREDENTIAL_BBB_PASSWORD);
      } else if (service === 'webuntis') {
        email = await this.getCredential(STORAGE_KEYS.CREDENTIAL_WEBUNTIS_EMAIL);
        password = await this.getCredential(STORAGE_KEYS.CREDENTIAL_WEBUNTIS_PASSWORD);
      }

      return {
        success: true,
        data: {
          email: email || undefined,
          password: password || undefined
        }
      };
    } catch (error) {
      console.error('Error getting service credentials:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get service credentials'
      };
    }
  }

  /**
   * Update only specific credentials without affecting others
   */
  async updateCredential(key: keyof UserCredentials, value: string): Promise<ApiResponse> {
    try {
      let storageKey: string;

      switch (key) {
        case 'email':
          storageKey = STORAGE_KEYS.CREDENTIAL_EMAIL;
          break;
        case 'password':
          storageKey = STORAGE_KEYS.CREDENTIAL_PASSWORD;
          break;
        case 'bbbPassword':
          storageKey = STORAGE_KEYS.CREDENTIAL_BBB_PASSWORD;
          break;
        case 'webuntisEmail':
          storageKey = STORAGE_KEYS.CREDENTIAL_WEBUNTIS_EMAIL;
          break;
        case 'webuntisPassword':
          storageKey = STORAGE_KEYS.CREDENTIAL_WEBUNTIS_PASSWORD;
          break;
        default:
          return { success: false, error: 'Invalid credential key' };
      }

      return await this.saveCredential(storageKey, value);
    } catch (error) {
      console.error('Error updating credential:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update credential'
      };
    }
  }

  /**
   * Check if all required credentials are available
   */
  async hasRequiredCredentials(): Promise<boolean> {
    try {
      const email = await this.getCredential(STORAGE_KEYS.CREDENTIAL_EMAIL);
      // Only email is required, other credentials are optional
      return !!email;
    } catch (error) {
      console.error('Error checking required credentials:', error);
      return false;
    }
  }

  /**
   * Get credential status (which credentials are saved)
   */
  async getCredentialStatus(): Promise<ApiResponse<Record<string, boolean>>> {
    try {
      const [email, password, bbbPassword, webuntisEmail, webuntisPassword] = await Promise.all([
        this.getCredential(STORAGE_KEYS.CREDENTIAL_EMAIL),
        this.getCredential(STORAGE_KEYS.CREDENTIAL_PASSWORD),
        this.getCredential(STORAGE_KEYS.CREDENTIAL_BBB_PASSWORD),
        this.getCredential(STORAGE_KEYS.CREDENTIAL_WEBUNTIS_EMAIL),
        this.getCredential(STORAGE_KEYS.CREDENTIAL_WEBUNTIS_PASSWORD)
      ]);

      return {
        success: true,
        data: {
          hasEmail: !!email,
          hasPassword: !!password,
          hasBbbPassword: !!bbbPassword,
          hasWebuntisEmail: !!webuntisEmail,
          hasWebuntisPassword: !!webuntisPassword
        }
      };
    } catch (error) {
      console.error('Error getting credential status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get credential status'
      };
    }
  }
}

// Export a singleton instance
export default new CredentialService();
