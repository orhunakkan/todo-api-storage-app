/**
 * Global Teardown for Integration Tests
 * Cleans up test database and environment
 */

const DatabaseHelper = require('../helpers/database');

module.exports = async () => {
  console.log('🧹 Cleaning up integration test environment...');
  
  try {
    // Clean up test database
    await DatabaseHelper.cleanup();
    console.log('✅ Test database cleaned up');
    
    // Close any remaining database connections
    if (DatabaseHelper.closeConnections) {
      await DatabaseHelper.closeConnections();
      console.log('✅ Database connections closed');
    }

    console.log('✅ Integration test cleanup completed');
  } catch (error) {
    console.error('❌ Failed to cleanup integration test environment:', error);
    // Don't throw to avoid masking test failures
  }
};
