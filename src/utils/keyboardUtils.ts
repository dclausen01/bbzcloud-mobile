/**
 * BBZCloud Mobile - Keyboard Utilities
 * 
 * Utilities for handling keyboard interactions on native platforms
 * 
 * @version 1.0.0
 */

import { Keyboard, KeyboardStyle, KeyboardResize } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

/**
 * Hide keyboard if running on native platform
 */
export const hideKeyboard = async (): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    await Keyboard.hide();
  }
};

/**
 * Show keyboard if running on native platform
 */
export const showKeyboard = async (): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    await Keyboard.show();
  }
};

/**
 * Setup keyboard event listeners
 */
export const setupKeyboardListeners = (): void => {
  if (!Capacitor.isNativePlatform()) return;

  Keyboard.addListener('keyboardWillShow', (info) => {
    console.log('Keyboard will show, height:', info.keyboardHeight);
    document.body.classList.add('keyboard-open');
  });

  Keyboard.addListener('keyboardWillHide', () => {
    console.log('Keyboard will hide');
    document.body.classList.remove('keyboard-open');
  });

  Keyboard.addListener('keyboardDidShow', (info) => {
    console.log('Keyboard shown, height:', info.keyboardHeight);
  });

  Keyboard.addListener('keyboardDidHide', () => {
    console.log('Keyboard hidden');
  });
};

/**
 * Remove keyboard listeners
 */
export const removeKeyboardListeners = async (): Promise<void> => {
  await Keyboard.removeAllListeners();
};

/**
 * Set keyboard accessibility and appearance
 */
export const setKeyboardStyle = async (isDarkMode: boolean): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;

  await Keyboard.setStyle({
    style: isDarkMode ? KeyboardStyle.Dark : KeyboardStyle.Light
  });
};

/**
 * Set whether the keyboard should resize the webview
 */
export const setKeyboardResize = async (mode: KeyboardResize): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;

  await Keyboard.setResizeMode({ mode });
};

/**
 * Check if keyboard is currently visible
 */
export const isKeyboardVisible = (): boolean => {
  return document.body.classList.contains('keyboard-open');
};
