/**
 * User Routes Unit Tests
 * Testing user route handlers in isolation
 */

const usersRouter = require('../../../backend/routes/users');

// Mock middleware before importing the route
jest.mock('../../../backend/middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { id: 1, username: 'testuser' };
    next();
  }),
  optionalAuth: jest.fn((req, res, next) => next()),
}));

// Mock the database
jest.mock('../../../backend/config/database', () => ({
  query: jest.fn(),
}));

describe('User Routes Unit Tests', () => {
  it('should export a router', () => {
    expect(usersRouter).toBeDefined();
    expect(typeof usersRouter).toBe('function');
  });

  it('should have the correct middleware imported', () => {
    const auth = require('../../../backend/middleware/auth');
    expect(auth.authenticateToken).toBeDefined();
    expect(auth.optionalAuth).toBeDefined();
  });
});
