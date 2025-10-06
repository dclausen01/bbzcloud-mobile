/**
 * BBZCloud Mobile - Database Service
 * 
 * Handles all SQLite database operations using Capacitor SQLite plugin
 * 
 * @version 1.0.0
 */

import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { APP_CONFIG, DATABASE_SCHEMA } from '../utils/constants';
import type { DatabaseResult, User, Favorite, BrowserHistory, DBSettings } from '../types';

class DatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private isInitialized = false;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  /**
   * Initialize the database connection and create tables
   */
  async initialize(): Promise<DatabaseResult> {
    try {
      if (this.isInitialized) {
        return { success: true };
      }

      // Create or open the database
      this.db = await this.sqlite.createConnection(
        APP_CONFIG.DATABASE_NAME,
        false, // encrypted
        'no-encryption',
        APP_CONFIG.DATABASE_VERSION,
        false // readonly
      );

      await this.db.open();

      // Create tables
      await this.createTables();

      this.isInitialized = true;
      console.log('Database initialized successfully');

      return { success: true };
    } catch (error) {
      console.error('Database initialization error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }

  /**
   * Create all necessary database tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Create all tables from schema
      await this.db.execute(DATABASE_SCHEMA.SETTINGS);
      await this.db.execute(DATABASE_SCHEMA.USER_PROFILE);
      await this.db.execute(DATABASE_SCHEMA.APP_VISIBILITY);
      await this.db.execute(DATABASE_SCHEMA.BROWSER_HISTORY);
      await this.db.execute(DATABASE_SCHEMA.FAVORITES);

      console.log('All tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    try {
      if (this.db) {
        await this.db.close();
        this.db = null;
        this.isInitialized = false;
      }
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }

  // ============================================================================
  // SETTINGS OPERATIONS
  // ============================================================================

  /**
   * Get a setting value by key
   */
  async getSetting(key: string): Promise<string | null> {
    try {
      if (!this.db) await this.initialize();
      
      const result = await this.db!.query(
        'SELECT value FROM settings WHERE key = ?',
        [key]
      );

      if (result.values && result.values.length > 0) {
        return result.values[0].value;
      }

      return null;
    } catch (error) {
      console.error('Error getting setting:', error);
      return null;
    }
  }

  /**
   * Save or update a setting
   */
  async saveSetting(key: string, value: string): Promise<DatabaseResult> {
    try {
      if (!this.db) await this.initialize();

      await this.db!.run(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`,
        [key, value, value]
      );

      return { success: true };
    } catch (error) {
      console.error('Error saving setting:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all settings
   */
  async getAllSettings(): Promise<DatabaseResult<DBSettings[]>> {
    try {
      if (!this.db) await this.initialize();

      const result = await this.db!.query('SELECT * FROM settings');

      return {
        success: true,
        data: result.values || []
      };
    } catch (error) {
      console.error('Error getting all settings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ============================================================================
  // USER PROFILE OPERATIONS
  // ============================================================================

  /**
   * Get user profile by email
   */
  async getUserProfile(email: string): Promise<User | null> {
    try {
      if (!this.db) await this.initialize();

      const result = await this.db!.query(
        'SELECT * FROM user_profile WHERE email = ?',
        [email]
      );

      if (result.values && result.values.length > 0) {
        const user = result.values[0];
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          createdAt: new Date(user.created_at),
          updatedAt: new Date(user.updated_at)
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Save or update user profile
   */
  async saveUserProfile(user: User): Promise<DatabaseResult<number>> {
    try {
      if (!this.db) await this.initialize();

      const result = await this.db!.run(
        `INSERT INTO user_profile (email, role) VALUES (?, ?)
         ON CONFLICT(email) DO UPDATE SET role = ?, updated_at = CURRENT_TIMESTAMP
         RETURNING id`,
        [user.email, user.role, user.role]
      );

      return {
        success: true,
        data: result.changes?.lastId || 0
      };
    } catch (error) {
      console.error('Error saving user profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ============================================================================
  // APP VISIBILITY OPERATIONS
  // ============================================================================

  /**
   * Get app visibility settings for a user
   */
  async getAppVisibility(userId: number): Promise<Record<string, boolean>> {
    try {
      if (!this.db) await this.initialize();

      const result = await this.db!.query(
        'SELECT app_id, is_visible FROM app_visibility WHERE user_id = ?',
        [userId]
      );

      const visibility: Record<string, boolean> = {};
      
      if (result.values) {
        for (const row of result.values) {
          visibility[row.app_id] = row.is_visible === 1;
        }
      }

      return visibility;
    } catch (error) {
      console.error('Error getting app visibility:', error);
      return {};
    }
  }

  /**
   * Set app visibility for a user
   */
  async setAppVisibility(
    userId: number,
    appId: string,
    isVisible: boolean
  ): Promise<DatabaseResult> {
    try {
      if (!this.db) await this.initialize();

      await this.db!.run(
        `INSERT INTO app_visibility (app_id, user_id, is_visible) VALUES (?, ?, ?)
         ON CONFLICT(app_id, user_id) DO UPDATE SET is_visible = ?`,
        [appId, userId, isVisible ? 1 : 0, isVisible ? 1 : 0]
      );

      return { success: true };
    } catch (error) {
      console.error('Error setting app visibility:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ============================================================================
  // FAVORITES OPERATIONS
  // ============================================================================

  /**
   * Get all favorite apps
   */
  async getFavorites(): Promise<DatabaseResult<Favorite[]>> {
    try {
      if (!this.db) await this.initialize();

      const result = await this.db!.query(
        'SELECT * FROM favorites ORDER BY order_index ASC'
      );

      const favorites: Favorite[] = [];
      
      if (result.values) {
        for (const row of result.values) {
          favorites.push({
            id: row.id,
            appId: row.app_id,
            orderIndex: row.order_index,
            createdAt: new Date(row.created_at)
          });
        }
      }

      return { success: true, data: favorites };
    } catch (error) {
      console.error('Error getting favorites:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Add an app to favorites
   */
  async addFavorite(appId: string): Promise<DatabaseResult> {
    try {
      if (!this.db) await this.initialize();

      // Get the current max order index
      const maxResult = await this.db!.query(
        'SELECT MAX(order_index) as max_order FROM favorites'
      );
      
      const maxOrder = maxResult.values?.[0]?.max_order || 0;

      await this.db!.run(
        'INSERT INTO favorites (app_id, order_index) VALUES (?, ?)',
        [appId, maxOrder + 1]
      );

      return { success: true };
    } catch (error) {
      console.error('Error adding favorite:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Remove an app from favorites
   */
  async removeFavorite(appId: string): Promise<DatabaseResult> {
    try {
      if (!this.db) await this.initialize();

      await this.db!.run(
        'DELETE FROM favorites WHERE app_id = ?',
        [appId]
      );

      return { success: true };
    } catch (error) {
      console.error('Error removing favorite:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if an app is a favorite
   */
  async isFavorite(appId: string): Promise<boolean> {
    try {
      if (!this.db) await this.initialize();

      const result = await this.db!.query(
        'SELECT COUNT(*) as count FROM favorites WHERE app_id = ?',
        [appId]
      );

      return result.values?.[0]?.count > 0;
    } catch (error) {
      console.error('Error checking favorite:', error);
      return false;
    }
  }

  // ============================================================================
  // BROWSER HISTORY OPERATIONS
  // ============================================================================

  /**
   * Add entry to browser history
   */
  async addToHistory(appId: string, url: string, title?: string): Promise<DatabaseResult> {
    try {
      if (!this.db) await this.initialize();

      await this.db!.run(
        'INSERT INTO browser_history (app_id, url, title) VALUES (?, ?, ?)',
        [appId, url, title || '']
      );

      return { success: true };
    } catch (error) {
      console.error('Error adding to history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get browser history for an app
   */
  async getHistory(appId: string, limit: number = 50): Promise<DatabaseResult<BrowserHistory[]>> {
    try {
      if (!this.db) await this.initialize();

      const result = await this.db!.query(
        'SELECT * FROM browser_history WHERE app_id = ? ORDER BY visited_at DESC LIMIT ?',
        [appId, limit]
      );

      const history: BrowserHistory[] = [];
      
      if (result.values) {
        for (const row of result.values) {
          history.push({
            id: row.id,
            appId: row.app_id,
            url: row.url,
            title: row.title,
            visitedAt: new Date(row.visited_at)
          });
        }
      }

      return { success: true, data: history };
    } catch (error) {
      console.error('Error getting history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clear browser history
   */
  async clearHistory(appId?: string): Promise<DatabaseResult> {
    try {
      if (!this.db) await this.initialize();

      if (appId) {
        await this.db!.run('DELETE FROM browser_history WHERE app_id = ?', [appId]);
      } else {
        await this.db!.run('DELETE FROM browser_history');
      }

      return { success: true };
    } catch (error) {
      console.error('Error clearing history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export a singleton instance
export default new DatabaseService();
