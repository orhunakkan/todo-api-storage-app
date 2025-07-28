/**
 * Jest Configuration for All Tests
 * Main configuration that runs all test types
 */

module.exports = {
  // Projects configuration for multi-project setup
  projects: [
    '<rootDir>/jest.unit.config.js',
    '<rootDir>/jest.integration.config.js'
  ],

  // Overall coverage configuration
  coverageDirectory: 'coverage/all',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Overall coverage thresholds
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },

  // Verbose output
  verbose: true
};
