/**
 * Jest Configuration for Integration Tests
 * Database-dependent tests for API endpoints
 */

const path = require('path');

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Display name for this configuration
  displayName: 'Integration Tests',

  // Set root directory to parent so we can access tests
  rootDir: path.resolve(__dirname, '..'),

  // Test file patterns - only integration tests
  testMatch: [
    '<rootDir>/tests/integration/**/*.test.js',
    '<rootDir>/tests/integration/**/*.spec.js'
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/integration/globalSetup.js',
  globalTeardown: '<rootDir>/tests/integration/globalTeardown.js',

  // Longer timeout for database operations
  testTimeout: 15000,

  // Coverage configuration for integration tests
  collectCoverage: false, // Disabled temporarily to speed up tests
  coverageDirectory: '<rootDir>/backend/coverage/integration',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Module mocking for integration tests
  resetMocks: false, // Don't reset mocks for integration tests

  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest'
  },

  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/backend/$1'
  },

  // Force sequential test execution to avoid database conflicts
  maxWorkers: 1,
  runInBand: true
};
