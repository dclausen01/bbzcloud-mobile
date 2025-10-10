/**
 * BBZCloud Mobile - Authentication Context
 * 
 * Manages user authentication, credentials, and role-based access
 * 
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { USER_ROLES } from '../utils/constants';
import CredentialService from '../services/CredentialService';
import DatabaseService from '../services/DatabaseService';
import type { AuthContextType, User, UserCredentials, UserRole, AuthError } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [credentials, setCredentials] = useState<UserCredentials>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Initialize authentication state on mount
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);

        // Initialize database
        await DatabaseService.initialize();

        // Load credentials
        await loadCredentials();

        // Load user profile if email exists
        const email = await CredentialService.getUserEmail();
        if (email) {
          const userProfile = await DatabaseService.getUserProfile(email);
          if (userProfile) {
            setUser(userProfile);
            setIsAuthenticated(true);
          } else {
            // Determine role from email domain
            const role = determineUserRole(email);
            const newUser: User = { email, role };
            
            // Save user profile
            const result = await DatabaseService.saveUserProfile(newUser);
            if (result.success && result.data) {
              setUser({ ...newUser, id: result.data });
              setIsAuthenticated(true);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Determine user role based on email domain
   */
  const determineUserRole = (email: string): UserRole => {
    if (email.endsWith('@bbz-rd-eck.de')) {
      return USER_ROLES.TEACHER as UserRole;
    } else if (email.endsWith('@sus.bbz-rd-eck.de')) {
      return USER_ROLES.STUDENT as UserRole;
    }
    // Default to student for other domains
    return USER_ROLES.STUDENT as UserRole;
  };

  /**
   * Login user with email and optional password
   */
  const login = async (email: string, password?: string): Promise<void> => {
    try {
      setIsLoading(true);

      // Validate email
      if (!email || !email.includes('@')) {
        const authError: AuthError = {
          name: 'AuthError',
          message: 'Ungültige E-Mail-Adresse',
          code: 'INVALID_EMAIL'
        };
        throw authError;
      }

      // Save email credential
      const emailResult = await CredentialService.saveCredential('email', email);
      if (!emailResult.success) {
        const authError: AuthError = {
          name: 'AuthError',
          message: 'Fehler beim Speichern der E-Mail',
          code: 'STORAGE_ERROR',
          originalError: new Error(emailResult.error)
        };
        throw authError;
      }
      
      // Save password if provided
      if (password) {
        const passwordResult = await CredentialService.saveCredential('password', password);
        if (!passwordResult.success) {
          const authError: AuthError = {
            name: 'AuthError',
            message: 'Fehler beim Speichern des Passworts',
            code: 'STORAGE_ERROR',
            originalError: new Error(passwordResult.error)
          };
          throw authError;
        }
      }

      // Determine user role
      const role = determineUserRole(email);

      // Create or update user profile
      const newUser: User = { email, role };
      const result = await DatabaseService.saveUserProfile(newUser);

      if (!result.success) {
        const authError: AuthError = {
          name: 'AuthError',
          message: 'Fehler beim Speichern des Benutzerprofils',
          code: 'DB_ERROR',
          originalError: new Error(result.error)
        };
        throw authError;
      }

      if (result.data) {
        setUser({ ...newUser, id: result.data });
        setIsAuthenticated(true);

        // Reload credentials
        await loadCredentials();
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Re-throw AuthError as-is, wrap others
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      } else {
        const authError: AuthError = {
          name: 'AuthError',
          message: 'Anmeldung fehlgeschlagen',
          code: 'UNKNOWN_ERROR',
          originalError: error instanceof Error ? error : new Error(String(error))
        };
        throw authError;
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout user and clear all data
   */
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Clear all credentials
      const result = await CredentialService.clearAllCredentials();
      if (!result.success) {
        console.warn('Failed to clear credentials:', result.error);
        // Continue logout even if clearing fails
      }

      // Reset state
      setUser(null);
      setCredentials({});
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      
      // Still reset state even if error occurs
      setUser(null);
      setCredentials({});
      setIsAuthenticated(false);
      
      const authError: AuthError = {
        name: 'AuthError',
        message: 'Fehler beim Abmelden',
        code: 'UNKNOWN_ERROR',
        originalError: error instanceof Error ? error : new Error(String(error))
      };
      throw authError;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save user email only (simplified - passwords managed by native password managers)
   */
  const saveCredentials = async (newCredentials: UserCredentials): Promise<void> => {
    try {
      // Only save email for role detection
      if (newCredentials.email) {
        await CredentialService.saveCredential('email', newCredentials.email);
      }
      
      // Reload credentials to update state
      await loadCredentials();
    } catch (error) {
      console.error('Error saving credentials:', error);
      throw error;
    }
  };

  /**
   * Load credentials from secure storage
   */
  const loadCredentials = async (): Promise<void> => {
    try {
      const result = await CredentialService.loadCredentials();
      if (result.success && result.data) {
        setCredentials(result.data);
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  };

  /**
   * Update user role
   */
  const updateUserRole = async (role: UserRole): Promise<void> => {
    try {
      if (!user) {
        const authError: AuthError = {
          name: 'AuthError',
          message: 'Kein Benutzer angemeldet',
          code: 'UNKNOWN_ERROR'
        };
        throw authError;
      }

      const updatedUser = { ...user, role };
      const result = await DatabaseService.saveUserProfile(updatedUser);

      if (!result.success) {
        const authError: AuthError = {
          name: 'AuthError',
          message: 'Fehler beim Aktualisieren der Benutzerrolle',
          code: 'DB_ERROR',
          originalError: new Error(result.error)
        };
        throw authError;
      }

      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating user role:', error);
      
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      } else {
        const authError: AuthError = {
          name: 'AuthError',
          message: 'Fehler beim Aktualisieren der Rolle',
          code: 'UNKNOWN_ERROR',
          originalError: error instanceof Error ? error : new Error(String(error))
        };
        throw authError;
      }
    }
  };

  const value: AuthContextType = {
    user,
    credentials,
    isAuthenticated,
    isLoading,
    login,
    logout,
    saveCredentials,
    loadCredentials,
    updateUserRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use authentication context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
