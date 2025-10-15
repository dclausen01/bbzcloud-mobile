/**
 * BBZCloud Mobile - Database Service
 * 
 * Handles all SQLite database operations using Capacitor SQLite plugin
 * 
 * @version 1.0.0
 */

import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { APP_CONFIG, DATABASE_SCHEMA } from '../utils/constants';
import type { DatabaseResult, User, BrowserHistory, DBSettings, CustomApp } from '../types';

class DatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private initPromise: Promise<DatabaseResult> | null = null;
  private settingsCache: Map<string, { value: string; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  /**
   * Initialize the database connection and create tables
   * Uses promise caching to prevent race conditions
   */
  async initialize(): Promise<DatabaseResult> {
    // Return existing initialization promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    // Create and cache the initialization promise
    this.initPromise = this._initializeDatabase();
    return this.initPromise;
  }

  /**
   * Internal initialization method
   */
  private async _initializeDatabase(): Promise<DatabaseResult> {
    try {
      // Check if already initialized
      if (this.db) {
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

      console.log('Database initialized successfully');

      return { success: true };
    } catch (error) {
      console.error('Database initialization error:', error);
      // Reset init promise on error so it can be retried
      this.initPromise = null;
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
      await this.db.execute(DATABASE_SCHEMA.CUSTOM_APPS);
      await this.db.execute(DATABASE_SCHEMA.APP_ORDER);

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
        this.initPromise = null;
        this.settingsCache.clear();
      }
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }

  // ============================================================================
  // SETTINGS OPERATIONS
  // ============================================================================

  /**
   * Get a setting value by key with caching
   */
  async getSetting(key: string): Promise<string | null> {
    try {
      // Check cache first
      const cached = this.settingsCache.get(key);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.value;
      }

      if (!this.db) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          throw new Error('Database initialization failed');
        }
      }

      if (!this.db) {
        throw new Error('Database not initialized');
      }
      
      const result = await this.db.query(
        'SELECT value FROM settings WHERE key = ?',
        [key]
      );

      if (result.values && result.values.length > 0) {
        const value = result.values[0].value;
        // Update cache
        this.settingsCache.set(key, { value, timestamp: Date.now() });
        return value;
      }

      return null;
    } catch (error) {
      console.error('Error getting setting:', error);
      return null;
    }
  }

  /**
   * Save or update a setting with validation
   */
  async saveSetting(key: string, value: string): Promise<DatabaseResult> {
    try {
      // Validate input
      if (!key || key.length > 255) {
        return { success: false, error: 'Invalid key: must be 1-255 characters' };
      }
      if (value.length > 10000) {
        return { success: false, error: 'Value too large: maximum 10000 characters' };
      }

      if (!this.db) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult;
        }
      }

      if (!this.db) {
        return { success: false, error: 'Database not initialized' };
      }

      await this.db.run(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`,
        [key, value, value]
      );

      // Invalidate cache for this key
      this.settingsCache.delete(key);

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
      if (!this.db) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return { success: false, error: 'Database initialization failed' };
        }
      }

      if (!this.db) {
        return { success: false, error: 'Database not initialized' };
      }

      const result = await this.db.query('SELECT * FROM settings');

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
      if (!this.db) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          throw new Error('Database initialization failed');
        }
      }

      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const result = await this.db.query(
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
      if (!this.db) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return { success: false, error: 'Database initialization failed' };
        }
      }

      if (!this.db) {
        return { success: false, error: 'Database not initialized' };
      }

      // Insert or update user profile
      await this.db.run(
        `INSERT INTO user_profile (email, role) VALUES (?, ?)
         ON CONFLICT(email) DO UPDATE SET role = ?, updated_at = CURRENT_TIMESTAMP`,
        [user.email, user.role, user.role]
      );

      // Get the user ID
      const result = await this.db.query(
        'SELECT id FROM user_profile WHERE email = ?',
        [user.email]
      );

      const userId = result.values && result.values.length > 0 ? result.values[0].id : 0;

      return {
        success: true,
        data: userId
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
      if (!this.db) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          throw new Error('Database initialization failed');
        }
      }

      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const result = await this.db.query(
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
      if (!this.db) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult;
        }
      }

      if (!this.db) {
        return { success: false, error: 'Database not initialized' };
      }

      await this.db.run(
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
  // BROWSER HISTORY OPERATIONS
  // ============================================================================

  /**
   * Add entry to browser history
   */
  async addToHistory(appId: string, url: string, title?: string): Promise<DatabaseResult> {
    try {
      if (!this.db) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult;
        }
      }

      if (!this.db) {
        return { success: false, error: 'Database not initialized' };
      }

      await this.db.run(
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
      if (!this.db) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return { success: false, error: 'Database initialization failed' };
        }
      }

      if (!this.db) {
        return { success: false, error: 'Database not initialized' };
      }

      const result = await this.db.query(
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
      if (!this.db) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult;
        }
      }

      if (!this.db) {
        return { success: false, error: 'Database not initialized' };
      }

      if (appId) {
        await this.db.run('DELETE FROM browser_history WHERE app_id = ?', [appId]);
      } else {
        await this.db.run('DELETE FROM browser_history');
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

  // ============================================================================
  // CUSTOM APPS OPERATIONS
  // ============================================================================

  /**
   * Get all custom apps for a user (or all if no userId provided)
   */
  async getCustomApps(userId?: number): Promise<DatabaseResult<CustomApp[]>> {
    try {
      if (!this.db) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return { success: false, error: 'Database initialization failed' };
        }
      }

      if (!this.db) {
        return { success: false, error: 'Database not initialized' };
      }

      const query = userId
        ? 'SELECT * FROM custom_apps WHERE user_id = ? OR user_id IS NULL ORDER BY order_index, title'
        : 'SELECT * FROM custom_apps ORDER BY order_index, title';
      
      const params = userId ? [userId] : [];
      const result = await this.db.query(query, params);

      const customApps: CustomApp[] = (result.values || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        title: row.title as string,
        url: row.url as string,
        color: row.color as string,
        icon: (row.icon as string) || 'apps',
        userId: row.user_id as number | undefined,
        orderIndex: (row.order_index as number) || 0,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string)
      }));

      return { success: true, data: customApps };
    } catch (error) {
      console.error('Error getting custom apps:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Save a new custom app
   */
  async saveCustomApp(app: {
    id: string;
    title: string;
    url: string;
    color: string;
    icon: string;
    userId?: number;
    orderIndex: number;
  }): Promise<DatabaseResult> {
    try {
      if (!this.db) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult;
        }
      }

      if (!this.db) {
        return { success: false, error: 'Database not initialized' };
      }

      await this.db.run(
        `INSERT INTO custom_apps (id, title, url, color, icon, user_id, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [app.id, app.title, app.url, app.color, app.icon, app.userId || null, app.orderIndex]
      );

      return { success: true };
    } catch (error) {
      console.error('Error saving custom app:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update an existing custom app
   */
  async updateCustomApp(id: string, updates: {
    title?: string;
    url?: string;
    color?: string;
    icon?: string;
    orderIndex?: number;
  }): Promise<DatabaseResult> {
    try {
      if (!this.db) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult;
        }
      }

      if (!this.db) {
        return { success: false, error: 'Database not initialized' };
      }

      const fields: string[] = [];
      const values: (string | number)[] = [];

      if (updates.title !== undefined) {
        fields.push('title = ?');
        values.push(updates.title);
      }
      if (updates.url !== undefined) {
        fields.push('url = ?');
        values.push(updates.url);
      }
      if (updates.color !== undefined) {
        fields.push('color = ?');
        values.push(updates.color);
      }
      if (updates.icon !== undefined) {
        fields.push('icon = ?');
        values.push(updates.icon);
      }
      if (updates.orderIndex !== undefined) {
        fields.push('order_index = ?');
        values.push(updates.orderIndex);
      }

      if (fields.length === 0) {
        return { success: true }; // Nothing to update
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      await this.db.run(
        `UPDATE custom_apps SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      return { success: true };
    } catch (error) {
      console.error('Error updating custom app:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete a custom app
   */
  async deleteCustomApp(id: string): Promise<DatabaseResult> {
    try {
      if (!this.db) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult;
        }
      }

      if (!this.db) {
        return { success: false, error: 'Database not initialized' };
      }

      await this.db.run('DELETE FROM custom_apps WHERE id = ?', [id]);

      return { success: true };
    } catch (error) {
      console.error('Error deleting custom app:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ============================================================================
  // APP ORDER OPERATIONS
  // ============================================================================

  /**
   * Get app order for a user
   */
  async getAppOrder(userId: number): Promise<Record<string, number>> {
    try {
      if (!this.db) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          throw new Error('Database initialization failed');
        }
      }

      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const result = await this.db.query(
        'SELECT app_id, order_index FROM app_order WHERE user_id = ?',
        [userId]
      );

      const order: Record<string, number> = {};
      
      if (result.values) {
        for (const row of result.values) {
          order[row.app_id] = row.order_index;
        }
      }

      return order;
    } catch (error) {
      console.error('Error getting app order:', error);
      return {};
    }
  }

  /**
   * Set app order for a user
   */
  async setAppOrder(
    userId: number,
    appId: string,
    orderIndex: number
  ): Promise<DatabaseResult> {
    try {
      if (!this.db) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult;
        }
      }

      if (!this.db) {
        return { success: false, error: 'Database not initialized' };
      }

      await this.db.run(
        `INSERT INTO app_order (app_id, user_id, order_index) VALUES (?, ?, ?)
         ON CONFLICT(app_id, user_id) DO UPDATE SET order_index = ?`,
        [appId, userId, orderIndex, orderIndex]
      );

      return { success: true };
    } catch (error) {
      console.error('Error setting app order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Save multiple app orders in a single transaction
   */
  async saveAppOrders(
    userId: number,
    orders: Array<{ appId: string; orderIndex: number }>
  ): Promise<DatabaseResult> {
    try {
      if (!this.db) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult;
        }
      }

      if (!this.db) {
        return { success: false, error: 'Database not initialized' };
      }

      // Begin transaction
      await this.db.execute('BEGIN TRANSACTION');

      try {
        for (const order of orders) {
          await this.db.run(
            `INSERT INTO app_order (app_id, user_id, order_index) VALUES (?, ?, ?)
             ON CONFLICT(app_id, user_id) DO UPDATE SET order_index = ?`,
            [order.appId, userId, order.orderIndex, order.orderIndex]
          );
        }

        await this.db.execute('COMMIT');
        return { success: true };
      } catch (error) {
        await this.db.execute('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error saving app orders:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export a singleton instance
export default new DatabaseService();
