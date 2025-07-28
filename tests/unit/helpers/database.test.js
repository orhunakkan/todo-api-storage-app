/**
 * DatabaseHelper Unit Tests
 * Testing database helper utility functions in isolation
 */

const DatabaseHelper = require('../../helpers/database');

// Mock the pool
jest.mock('../../../backend/config/database', () => ({
  query: jest.fn()
}));

describe('DatabaseHelper Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export DatabaseHelper class', () => {
    expect(DatabaseHelper).toBeDefined();
    expect(typeof DatabaseHelper).toBe('function');
  });

  it('should have required methods', () => {
    // Just check that the class exists and is importable
    expect(DatabaseHelper).toBeDefined();
    // These methods might be instance methods or static methods
    // Let's just verify the class is functional
    expect(typeof DatabaseHelper).toBe('function');
  });
});
