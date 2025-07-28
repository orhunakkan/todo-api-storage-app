/**
 * Database Test Helpers
 * Utilities for managing test database operations
 */

// Create a test-specific database pool
const { Pool } = require('pg');
const path = require('path');

// Load environment variables from backend/.env for tests
require('dotenv').config({ path: path.resolve(__dirname, '../../backend/.env') });

// Use test database configuration
const testPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.TEST_DB_NAME || 'todo_test',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '4284',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

class DatabaseHelper {
  /**
   * Clean all test data from database
   */
  static async cleanup() {
    const client = await testPool.connect();
    try {
      // Set a shorter lock timeout to fail fast on deadlocks
      await client.query('SET lock_timeout = 5000'); // 5 seconds

      await client.query('BEGIN');

      // Delete in correct order to respect foreign key constraints
      // Use small delays to reduce lock contention
      await client.query('DELETE FROM todos');
      await new Promise(resolve => setTimeout(resolve, 10));

      await client.query('DELETE FROM categories');
      await new Promise(resolve => setTimeout(resolve, 10));

      await client.query('DELETE FROM users');

      // Note: Removed sequence resets to avoid deadlocks in concurrent test execution
      // Auto-increment IDs will continue from where they left off, which is fine for tests

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      // Log the error for debugging but don't throw to avoid masking other issues
      console.warn('Database cleanup error:', error.message);

      // If it's a deadlock, wait a moment and try once more
      if (error.message.includes('deadlock')) {
        console.log('Retrying cleanup after deadlock...');
        await new Promise(resolve => setTimeout(resolve, 200));
        try {
          await client.query('BEGIN');
          await client.query('DELETE FROM todos');
          await new Promise(resolve => setTimeout(resolve, 50));
          await client.query('DELETE FROM categories');
          await new Promise(resolve => setTimeout(resolve, 50));
          await client.query('DELETE FROM users');
          await client.query('COMMIT');
        } catch (retryError) {
          await client.query('ROLLBACK');
          console.warn('Cleanup retry failed:', retryError.message);
        }
      }
    } finally {
      client.release();
    }
  }

  /**
   * Create a test user and return user data with token
   */
  static async createTestUser(userData = global.testUser) {
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');

    const client = await testPool.connect();
    try {
      // Create unique username and email for each test to avoid conflicts
      const uniqueId = Math.random().toString(36).substr(2, 9);
      const testUserData = {
        ...userData,
        username: `${userData.username}_${uniqueId}`,
        email: `${uniqueId}_${userData.email}`,
      };

      // Hash password
      const hashedPassword = await bcrypt.hash(testUserData.password, 10);

      // Insert user
      const result = await client.query(
        `INSERT INTO users (username, email, password, first_name, last_name)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, username, email, first_name, last_name, created_at`,
        [testUserData.username, testUserData.email, hashedPassword, testUserData.first_name, testUserData.last_name]
      );

      const user = result.rows[0];

      // Generate token
      const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });

      return { user, token };
    } finally {
      client.release();
    }
  }

  /**
   * Create a test category for a user
   */
  static async createTestCategory(userId, categoryData = global.testCategory) {
    const client = await testPool.connect();
    try {
      const result = await client.query(
        `INSERT INTO categories (name, description, color, user_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, description, color, user_id, created_at`,
        [categoryData.name, categoryData.description, categoryData.color, userId]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Create a test todo for a user
   */
  static async createTestTodo(userId, categoryId = null, todoData = global.testTodo) {
    const client = await testPool.connect();
    try {
      const result = await client.query(
        `INSERT INTO todos (title, description, priority, due_date, user_id, category_id, completed)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, title, description, priority, due_date, completed, user_id, category_id, created_at, updated_at`,
        [todoData.title, todoData.description, todoData.priority, todoData.due_date, userId, categoryId, todoData.completed || false]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId) {
    const client = await testPool.connect();
    try {
      const result = await client.query('SELECT id, username, email, first_name, last_name, created_at FROM users WHERE id = $1', [userId]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(categoryId) {
    const client = await testPool.connect();
    try {
      const result = await client.query('SELECT * FROM categories WHERE id = $1', [categoryId]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Get todo by ID
   */
  static async getTodoById(todoId) {
    const client = await testPool.connect();
    try {
      const result = await client.query('SELECT * FROM todos WHERE id = $1', [todoId]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Get todos by user ID
   */
  static async getTodosByUserId(userId) {
    const client = await testPool.connect();
    try {
      const result = await client.query('SELECT * FROM todos WHERE user_id = $1', [userId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Update todo status
   */
  static async updateTodoStatus(todoId, completed) {
    const client = await testPool.connect();
    try {
      const result = await client.query('UPDATE todos SET completed = $1 WHERE id = $2 RETURNING *', [completed, todoId]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Create test todo with specific date
   */
  static async createTestTodoWithDate(userId, categoryId, todoData, date) {
    const client = await testPool.connect();
    try {
      const result = await client.query(
        `INSERT INTO todos (title, description, priority, due_date, user_id, category_id, created_at, completed)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, title, description, priority, due_date, completed, user_id, category_id, created_at, updated_at`,
        [
          todoData.title,
          todoData.description || '',
          todoData.priority || 'medium',
          todoData.due_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          userId,
          categoryId,
          date || new Date(),
          todoData.completed || false,
        ]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Get a todo by ID
   */
  static async getTodoById(todoId) {
    const client = await testPool.connect();
    try {
      const result = await client.query('SELECT * FROM todos WHERE id = $1', [todoId]);

      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Close database connections
   */
  static async closeConnections() {
    await testPool.end();
  }
}

module.exports = DatabaseHelper;
