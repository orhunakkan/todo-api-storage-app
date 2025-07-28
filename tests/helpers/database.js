/**
 * Database Test Helpers
 * Utilities for managing test database operations
 */

const pool = require('../../backend/config/database');

class DatabaseHelper {
  /**
   * Clean all test data from database
   */
  static async cleanup() {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete in correct order to respect foreign key constraints
      await client.query('DELETE FROM todos');
      await client.query('DELETE FROM categories WHERE user_id IS NOT NULL');
      await client.query('DELETE FROM users WHERE email LIKE \'%test%\' OR username LIKE \'%test%\'');
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
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
    
    const client = await pool.connect();
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Insert user
      const result = await client.query(
        `INSERT INTO users (username, email, password, first_name, last_name)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, username, email, first_name, last_name, created_at`,
        [userData.username, userData.email, hashedPassword, userData.first_name, userData.last_name]
      );
      
      const user = result.rows[0];
      
      // Generate token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      return { user, token };
    } finally {
      client.release();
    }
  }

  /**
   * Create a test category for a user
   */
  static async createTestCategory(userId, categoryData = global.testCategory) {
    const client = await pool.connect();
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
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO todos (title, description, priority, due_date, user_id, category_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, title, description, priority, due_date, completed, user_id, category_id, created_at, updated_at`,
        [todoData.title, todoData.description, todoData.priority, todoData.due_date, userId, categoryId]
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
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, username, email, first_name, last_name, created_at FROM users WHERE id = $1',
        [userId]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(categoryId) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM categories WHERE id = $1',
        [categoryId]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Get todo by ID
   */
  static async getTodoById(todoId) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM todos WHERE id = $1',
        [todoId]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }
}

module.exports = DatabaseHelper;
