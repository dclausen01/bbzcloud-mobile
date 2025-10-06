/**
 * BBZCloud Mobile - Device Utilities
 * 
 * Helper functions for device detection and platform-specific logic
 * 
 * @version 1.0.0
 */

import { Capacitor } from '@capacitor/core';

/**
 * Check if running on a mobile device (not browser)
 */
export const isMobile = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Get the current platform
 */
export const getPlatform = (): 'ios' | 'android' | 'web' => {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
};

/**
 * Check if running on iOS
 */
export const isIOS = (): boolean => {
  return getPlatform() === 'ios';
};

/**
 * Check if running on Android
 */
export const isAndroid = (): boolean => {
  return getPlatform() === 'android';
};

/**
 * Check if running in web browser
 */
export const isWeb = (): boolean => {
  return getPlatform() === 'web';
};

/**
 * Detect if device is a smartphone (vs tablet)
 * Based on screen width: < 768px = smartphone
 */
export const isSmartphone = (): boolean => {
  if (isWeb()) {
    // In browser, check window size
    return window.innerWidth < 768;
  }
  
  // On native platforms, check screen dimensions
  const width = window.screen.width;
  const height = window.screen.height;
  const minDimension = Math.min(width, height);
  
  // Consider devices with smallest dimension < 768px as smartphones
  return minDimension < 768;
};

/**
 * Detect if device is a tablet
 */
export const isTablet = (): boolean => {
  return isMobile() && !isSmartphone();
};

/**
 * Get device type as string
 */
export const getDeviceType = (): 'smartphone' | 'tablet' | 'desktop' => {
  if (isWeb()) {
    return isSmartphone() ? 'smartphone' : 'desktop';
  }
  
  return isSmartphone() ? 'smartphone' : 'tablet';
};

/**
 * Check if app can open native apps (not in browser)
 */
export const canOpenNativeApps = (): boolean => {
  return isMobile();
};

/**
 * Get user agent string
 */
export const getUserAgent = (): string => {
  return navigator.userAgent;
};

/**
 * Detect if device is in landscape mode
 */
export const isLandscape = (): boolean => {
  return window.innerWidth > window.innerHeight;
};

/**
 * Detect if device is in portrait mode
 */
export const isPortrait = (): boolean => {
  return !isLandscape();
};

/**
 * Get screen dimensions
 */
export const getScreenDimensions = () => {
  return {
    width: window.screen.width,
    height: window.screen.height,
    availWidth: window.screen.availWidth,
    availHeight: window.screen.availHeight,
  };
};

/**
 * Check if device supports native app schemes
 * (Only on iOS and Android, not in browser)
 */
export const supportsAppSchemes = (): boolean => {
  return isIOS() || isAndroid();
};
