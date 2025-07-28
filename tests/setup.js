/**
 * Test Setup
 * Global test configuration and utilities
 */

const path = require('path');

// Load environment variables from backend/.env
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_NAME = process.env.TEST_DB_NAME || 'todo_test';
process.env.DB_USER = process.env.DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || '4284';

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test utilities
global.testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'TestPassword123!',
  first_name: 'Test',
  last_name: 'User'
};

global.testCategory = {
  name: 'Test Category',
  description: 'Test category description',
  color: '#3B82F6'
};

global.testTodo = {
  title: 'Test Todo',
  description: 'Test todo description',
  priority: 'medium',
  due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
};

// Mock console methods in test environment (optional)
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}
