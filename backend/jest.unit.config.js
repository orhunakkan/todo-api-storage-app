/**
 * Jest Configuration for Unit Tests
 * Isolated, fast tests for individual functions and modules
 */

const path = require('path');

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Display name for this configuration
  displayName: 'Unit Tests',

  // Set root directory to parent so we can access tests
  rootDir: path.resolve(__dirname, '..'),

  // Test file patterns - only unit tests
  testMatch: ['<rootDir>/tests/unit/**/*.test.js', '<rootDir>/tests/unit/**/*.spec.js'],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Coverage configuration for unit tests
  collectCoverage: false, // Disabled temporarily to speed up tests
  coverageDirectory: '<rootDir>/backend/coverage/unit',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    '<rootDir>/backend/routes/**/*.js',
    '<rootDir>/backend/middleware/**/*.js',
    '<rootDir>/backend/config/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/tests/**',
    '!<rootDir>/backend/server.js',
  ],

  // Higher coverage thresholds for unit tests
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Faster timeout for unit tests
  testTimeout: 5000,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Module mocking for isolation
  resetMocks: true,

  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/backend/$1',
  },
};
