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
import type { AuthContextType, User, UserCredentials, UserRole } from '../types';

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

      // Save email credential
      await CredentialService.saveCredential('email', email);
      
      // Save password if provided
      if (password) {
        await CredentialService.saveCredential('password', password);
      }

      // Determine user role
      const role = determineUserRole(email);

      // Create or update user profile
      const newUser: User = { email, role };
      const result = await DatabaseService.saveUserProfile(newUser);

      if (result.success && result.data) {
        setUser({ ...newUser, id: result.data });
        setIsAuthenticated(true);

        // Reload credentials
        await loadCredentials();
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
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
      await CredentialService.clearAllCredentials();

      // Reset state
      setUser(null);
      setCredentials({});
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save user credentials
   */
  const saveCredentials = async (newCredentials: UserCredentials): Promise<void> => {
    try {
      await CredentialService.saveCredentials(newCredentials);
      
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
      if (!user) return;

      const updatedUser = { ...user, role };
      const result = await DatabaseService.saveUserProfile(updatedUser);

      if (result.success) {
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
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
