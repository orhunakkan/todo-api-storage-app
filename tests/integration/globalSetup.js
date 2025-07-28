/**
 * Global Setup for Integration Tests
 * Prepares test database and environment
 */

const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

module.exports = async () => {
  console.log('🔧 Setting up integration test environment...');
  
  try {
    // Ensure test database is properly configured
    if (!process.env.TEST_DB_NAME) {
      throw new Error('TEST_DB_NAME environment variable is required');
    }

    // Run database setup script if available
    try {
      await execAsync('npm run db:setup', { cwd: process.cwd() });
      console.log('✅ Database setup completed');
    } catch (error) {
      console.log('⚠️ Database setup script not available or failed, continuing...');
    }

    console.log('✅ Integration test environment ready');
  } catch (error) {
    console.error('❌ Failed to setup integration test environment:', error);
    throw error;
  }
};
