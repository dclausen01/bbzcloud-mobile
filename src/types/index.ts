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
  isFavorite?: boolean;
  order?: number;
}

export interface AppVisibility {
  id?: number;
  appId: string;
  userId: number;
  isVisible: boolean;
}

export interface Favorite {
  id?: number;
  appId: string;
  orderIndex: number;
  createdAt?: Date;
}

// ============================================================================
// BROWSER TYPES
// ============================================================================

export interface BrowserSession {
  appId: string;
  url: string;
  title?: string;
  isActive: boolean;
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
  favoriteApps: string[];
  hapticFeedback: boolean;
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
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  toggleAppVisibility: (appId: string) => Promise<void>;
  toggleFavorite: (appId: string) => Promise<void>;
  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
  loadSettings: () => Promise<void>;
  isLoading: boolean;
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

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface AppEvent {
  type: string;
  data?: Record<string, unknown>;
  timestamp: Date;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncResult<T> = Promise<ApiResponse<T>>;
