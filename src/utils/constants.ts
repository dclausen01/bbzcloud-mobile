/**
 * BBZCloud Mobile - Application Constants
 * 
 * This file contains all the configuration constants for the mobile application.
 * Adapted from the desktop version for mobile use with Capacitor.
 * 
 * @version 1.0.0
 */

// ============================================================================
// APPLICATION CONFIGURATION
// ============================================================================

export const APP_CONFIG = {
  APP_NAME: 'BBZCloud Mobile',
  APP_VERSION: '1.0.0',
  STORAGE_PREFIX: 'bbzcloud_',
  DATABASE_NAME: 'bbzcloud.db',
  DATABASE_VERSION: 1,
};

// ============================================================================
// WEB APPLICATION URLS
// ============================================================================

// Helper function to get environment variable or fallback
const getEnvUrl = (key: string, fallback: string): string => {
  return import.meta.env[key] || fallback;
};

export const URLS = {
  // Organization website
  BBZ_WEBSITE: getEnvUrl('VITE_BBZ_WEBSITE', 'https://www.bbz-rd-eck.de'),
  
  // Educational platforms
  SCHULCLOUD: getEnvUrl('VITE_SCHULCLOUD', 'https://app.schul.cloud'),
  MOODLE: getEnvUrl('VITE_MOODLE', 'https://portal.bbz-rd-eck.com'),
  
  // Communication tools
  BBB: getEnvUrl('VITE_BBB', 'https://bbb.bbz-rd-eck.de/b/signin'),
  OUTLOOK: getEnvUrl('VITE_OUTLOOK', 'https://exchange.bbz-rd-eck.de/owa/#path=/mail'),
  
  // Productivity applications
  CRYPTPAD: getEnvUrl('VITE_CRYPTPAD', 'https://cryptpad.fr/drive'),
  TASKCARDS: getEnvUrl('VITE_TASKCARDS', 'https://bbzrdeck.taskcards.app'),
  
  // Administrative tools
  WEBUNTIS: getEnvUrl('VITE_WEBUNTIS', 'https://neilo.webuntis.com/WebUntis/?school=bbz-rd-eck#/basic/login'),
  FOBIZZ: getEnvUrl('VITE_FOBIZZ', 'https://tools.fobizz.com/'),
  WIKI: getEnvUrl('VITE_WIKI', 'https://wiki.bbz-rd-eck.com'),
  ANTRAEGE: getEnvUrl('VITE_ANTRAEGE', 'https://dms.bbz-rd-eck.de/'),
};

// ============================================================================
// NAVIGATION APPS CONFIGURATION
// ============================================================================

export interface NativeAppConfig {
  hasNativeApp: boolean;
  preferNativeOnSmartphone: boolean;
  iosScheme?: string;
  androidScheme?: string;
  androidPackage?: string;
  iosAppStoreId?: string;
}

export interface AppConfig {
  id: string;
  title: string;
  url: string;
  icon: string;
  color: string;
  description?: string;
  requiresAuth?: boolean;
  teacherOnly?: boolean;
  nativeApp?: NativeAppConfig;
}

export const NAVIGATION_APPS: Record<string, AppConfig> = {
  schulcloud: {
    id: 'schulcloud',
    title: 'schul.cloud',
    url: URLS.SCHULCLOUD,
    icon: 'cloud',
    color: '#FFA500',
    description: 'Chat & Dateiablage',
    requiresAuth: true,
    // Always open in browser - no native app support
  },
  moodle: {
    id: 'moodle',
    title: 'Moodle',
    url: URLS.MOODLE,
    icon: 'book',
    color: '#F98012',
    description: 'Lernmanagementsystem',
    requiresAuth: true,
    nativeApp: {
      hasNativeApp: true,
      preferNativeOnSmartphone: false,
      iosScheme: 'moodlemobile://',
      androidScheme: 'moodlemobile://',
      androidPackage: 'com.moodle.moodlemobile',
      iosAppStoreId: '633359593',
    },
  },
  bbb: {
    id: 'bbb',
    title: 'BigBlueButton',
    url: URLS.BBB,
    icon: 'videocam',
    color: '#0D3B66',
    description: 'Videokonferenzen',
    requiresAuth: true,
  },
  outlook: {
    id: 'outlook',
    title: 'Outlook',
    url: URLS.OUTLOOK,
    icon: 'mail',
    color: '#0078D4',
    description: 'E-Mail-Client',
    requiresAuth: true,
    teacherOnly: true,
  },
  cryptpad: {
    id: 'cryptpad',
    title: 'CryptPad',
    url: URLS.CRYPTPAD,
    icon: 'lock-closed',
    color: '#4591C4',
    description: 'Verschlüsselte Dokumente',
  },
  taskcards: {
    id: 'taskcards',
    title: 'TaskCards',
    url: URLS.TASKCARDS,
    icon: 'albums',
    color: '#FF6B6B',
    description: 'Digitale Aufgabenkarten',
    requiresAuth: true,
  },
  webuntis: {
    id: 'webuntis',
    title: 'WebUntis',
    url: URLS.WEBUNTIS,
    icon: 'calendar',
    color: '#FF8800',
    description: 'Stundenplan',
    requiresAuth: true,
    // Always open in browser - no native app support
  },
  fobizz: {
    id: 'fobizz',
    title: 'Fobizz Tools',
    url: URLS.FOBIZZ,
    icon: 'construct',
    color: '#A71930',
    description: 'Bildungstools',
    teacherOnly: true,
  },
  wiki: {
    id: 'wiki',
    title: 'Intranet',
    url: URLS.WIKI,
    icon: 'library',
    color: '#2D5F2E',
    description: 'Interne Dokumentation',
  },
  antraege: {
    id: 'antraege',
    title: 'Anträge',
    url: URLS.ANTRAEGE,
    icon: 'document',
    color: '#5A5A5A',
    description: 'Dokumentenmanagementsystem',
    teacherOnly: true,
  },
};

// Apps that students can access
export const STUDENT_ALLOWED_APPS = [
  'schulcloud',
  'moodle',
  'cryptpad',
  'webuntis',
  'wiki',
];

// ============================================================================
// USER INTERFACE MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  // Network-related errors
  CONNECTION_FAILED: 'Die Verbindung ist fehlgeschlagen',
  SERVER_NOT_FOUND: 'Der Server konnte nicht gefunden werden',
  NO_INTERNET: 'Keine Internetverbindung',
  TIMEOUT: 'Die Anfrage hat zu lange gedauert',
  
  // Authentication errors
  CREDENTIALS_NOT_FOUND: 'Bitte richten Sie zuerst Ihre Anmeldedaten ein',
  LOGIN_FAILED: 'Anmeldung fehlgeschlagen',
  SESSION_EXPIRED: 'Ihre Sitzung ist abgelaufen',
  
  // Application errors
  DATABASE_ERROR: 'Datenbankfehler aufgetreten',
  STORAGE_ERROR: 'Speicherfehler aufgetreten',
  GENERIC_ERROR: 'Ein Fehler ist aufgetreten',
  
  // Browser errors
  BROWSER_OPEN_FAILED: 'Browser konnte nicht geöffnet werden',
  URL_INVALID: 'Ungültige URL',
};

export const SUCCESS_MESSAGES = {
  SETTINGS_SAVED: 'Einstellungen gespeichert',
  CREDENTIALS_SAVED: 'Anmeldedaten gesichert',
  LOGOUT_SUCCESS: 'Erfolgreich abgemeldet',
  DATA_SYNCED: 'Daten synchronisiert',
};

export const INFO_MESSAGES = {
  LOADING: 'Laden...',
  SAVING: 'Speichern...',
  CONNECTING: 'Verbinden...',
  WELCOME: 'Willkommen bei BBZCloud',
  FIRST_TIME_SETUP: 'Richten Sie Ihr Konto ein',
};

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  // User data
  USER_EMAIL: 'user_email',
  USER_ROLE: 'user_role',
  IS_FIRST_LAUNCH: 'is_first_launch',
  
  // Settings
  THEME: 'theme',
  APP_VISIBILITY: 'app_visibility',
  FAVORITE_APPS: 'favorite_apps',
  
  // Secure credentials
  CREDENTIAL_EMAIL: 'email',
  CREDENTIAL_PASSWORD: 'password',
  CREDENTIAL_BBB_PASSWORD: 'bbbPassword',
  CREDENTIAL_WEBUNTIS_EMAIL: 'webuntisEmail',
  CREDENTIAL_WEBUNTIS_PASSWORD: 'webuntisPassword',
};

// ============================================================================
// BROWSER CONFIGURATION
// ============================================================================

export const BROWSER_CONFIG = {
  PRESENTATION_STYLE: 'popover' as const,
  TOOLBAR_COLOR: '#3880ff',
  SHOW_TITLE: true,
  ENABLE_SHARE: true,
  ENABLE_READER_MODE: false,
};

// ============================================================================
// UI CONFIGURATION
// ============================================================================

export const UI_CONFIG = {
  TOAST_DURATION: 3000,
  LOADING_TIMEOUT: 30000,
  HAPTIC_FEEDBACK: true,
  ANIMATION_DURATION: 300,
};

// ============================================================================
// THEME CONFIGURATION
// ============================================================================

export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

// ============================================================================
// USER ROLES
// ============================================================================

export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
};

// ============================================================================
// DATABASE SCHEMA
// ============================================================================

export const DATABASE_SCHEMA = {
  SETTINGS: `
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  USER_PROFILE: `
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  APP_VISIBILITY: `
    CREATE TABLE IF NOT EXISTS app_visibility (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      is_visible INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES user_profile(id)
    )
  `,
  BROWSER_HISTORY: `
    CREATE TABLE IF NOT EXISTS browser_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id TEXT NOT NULL,
      url TEXT NOT NULL,
      title TEXT,
      visited_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
};
