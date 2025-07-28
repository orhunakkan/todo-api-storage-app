/**
 * Global Setup for Integration Tests
 * Prepares test database and environment
 */

const path = require('path');
const { setupTestDatabase } = require('../../backend/scripts/setup-test-db');

module.exports = async () => {
  console.log('🔧 Setting up integration test environment...');

  // Load environment variables from backend/.env
  require('dotenv').config({ path: path.resolve(__dirname, '../../backend/.env') });

  try {
    // Ensure test database is properly configured
    if (!process.env.TEST_DB_NAME) {
      process.env.TEST_DB_NAME = 'todo_test';
    }

    // Set up the test database with fresh tables
    await setupTestDatabase();
    console.log('✅ Test database setup completed');

    console.log('✅ Integration test environment ready');
  } catch (error) {
    console.error('❌ Failed to setup integration test environment:', error);
    throw error;
  }
};
