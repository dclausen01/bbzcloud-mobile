/**
 * BBZCloud Mobile - TypeScript Type Definitions
 * 
 * Central type definitions for the mobile application
 * 
 * @version 1.0.0
 */

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id?: number;
  email: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserCredentials {
  email?: string;
  password?: string;
  bbbPassword?: string;
  webuntisEmail?: string;
  webuntisPassword?: string;
}

// ============================================================================
// APP TYPES
// ============================================================================

export interface App {
  id: string;
  title: string;
  url: string;
  icon: string;
  color: string;
  description?: string;
  requiresAuth?: boolean;
  teacherOnly?: boolean;
  isVisible?: boolean;
  isLoading?: boolean;
  order?: number;
  isCustom?: boolean;
}

export interface CustomApp {
  id: string;
  title: string;
  url: string;
  color: string;
  icon: string;
  userId?: number;
  orderIndex: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AppVisibility {
  id?: number;
  appId: string;
  userId: number;
  isVisible: boolean;
}

// ============================================================================
// BROWSER TYPES
// ============================================================================

export interface BrowserSession {
  appId: string;
  url: string;
  title?: string;
  isActive: boolean;
  thumbnail?: string;
  lastAccessed?: Date;
}

export interface LoadedApp {
  appId: string;
  url: string;
  title: string;
  color: string;
  icon: string;
  isActive: boolean;
  webViewId: string;
  lastAccessed: Date;
  memoryUsage?: number;
}

export interface BrowserHistory {
  id?: number;
  appId: string;
  url: string;
  title?: string;
  visitedAt?: Date;
}

export interface BrowserOptions {
  url: string;
  toolbarColor?: string;
  presentationStyle?: 'fullscreen' | 'popover';
  showTitle?: boolean;
  enableShare?: boolean;
  enableReaderMode?: boolean;
}

// ============================================================================
// SETTINGS TYPES
// ============================================================================

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  appVisibility: Record<string, boolean>;
}

export interface SettingsState extends AppSettings {
  isLoading: boolean;
  user: User | null;
  availableApps: App[];
}

// ============================================================================
// DATABASE TYPES
// ============================================================================

export interface DBSettings {
  id?: number;
  key: string;
  value: string;
  updatedAt?: Date;
}

export interface DatabaseResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export interface SettingsContextType {
  settings: SettingsState;
  customApps: CustomApp[];
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  toggleAppVisibility: (appId: string) => Promise<void>;
  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
  loadSettings: () => Promise<void>;
  loadCustomApps: () => Promise<void>;
  addCustomApp: (app: Omit<CustomApp, 'id' | 'orderIndex' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCustomApp: (id: string, app: Omit<CustomApp, 'id' | 'orderIndex' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteCustomApp: (id: string) => Promise<void>;
  isLoading: boolean;
}

export interface AppSwitcherContextType {
  loadedApps: LoadedApp[];
  activeAppId: string | null;
  isDrawerOpen: boolean;
  maxLoadedApps: number;
  openApp: (app: App) => Promise<void>;
  switchToApp: (appId: string) => void;
  closeApp: (appId: string) => void;
  closeAllApps: () => void;
  toggleDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
  getMemoryUsage: () => number;
}

export interface AuthContextType {
  user: User | null;
  credentials: UserCredentials;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  saveCredentials: (credentials: UserCredentials) => Promise<void>;
  loadCredentials: () => Promise<void>;
  updateUserRole: (role: UserRole) => Promise<void>;
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

export interface AppCardProps {
  app: App;
  onPress: (app: App) => void;
  onLongPress?: (app: App) => void;
  isLoading?: boolean;
}

export interface AppGridProps {
  apps: App[];
  onAppPress: (app: App) => void;
  searchQuery?: string;
  showFavoritesOnly?: boolean;
}

export interface WelcomeModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export interface SettingsPanelProps {
  onClose: () => void;
}

export interface AppInstallModalProps {
  isOpen: boolean;
  app: App;
  onInstall: () => void;
  onOpenInBrowser: () => void;
  onDismiss: () => void;
  onDontShowAgain: () => void;
}

export interface CustomAppsModalProps {
  isOpen: boolean;
  customApps: CustomApp[];
  onDismiss: () => void;
  onAppPress: (app: App) => void;
  onAddNew: () => void;
  onEdit: (app: CustomApp) => void;
  onDelete: (appId: string) => void;
}

export interface CustomAppFormModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  onSave: (app: Omit<CustomApp, 'id' | 'orderIndex' | 'createdAt' | 'updatedAt'>) => void;
  editApp?: CustomApp;
}

// ============================================================================
// NATIVE APP TYPES
// ============================================================================

export interface AppLaunchPreference {
  appId: string;
  preferNative: boolean;
  dontShowInstallPrompt?: boolean;
}

export interface NativeAppResult {
  success: boolean;
  opened: 'native' | 'browser' | 'none';
  error?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================================
// STORAGE TYPES
// ============================================================================

export interface StorageService {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface SecureStorageService {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type ErrorHandler = (error: AppError) => void;

// Auth-specific error codes
export type AuthErrorCode = 
  | 'INVALID_EMAIL' 
  | 'DB_ERROR' 
  | 'NETWORK_ERROR' 
  | 'STORAGE_ERROR'
  | 'UNKNOWN_ERROR';

export class AuthError extends Error {
  code: AuthErrorCode;
  originalError?: Error;

  constructor(code: AuthErrorCode, message: string, originalError?: Error) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.originalError = originalError;
  }
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface AppEvent {
  type: string;
  data?: Record<string, unknown>;
  timestamp: Date;
}

// ============================================================================
// TODO TYPES
// ============================================================================

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: string;
  folder: string;
}

export interface TodoState {
  todos: Todo[];
  folders: string[];
  selectedFolder: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncResult<T> = Promise<ApiResponse<T>>;
