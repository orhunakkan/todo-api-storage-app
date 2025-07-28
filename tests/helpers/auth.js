/**
 * Authentication Test Helpers
 * Utilities for handling authentication in tests
 */

const jwt = require('jsonwebtoken');

class AuthHelper {
  /**
   * Generate JWT token for testing
   */
  static generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
  }

  /**
   * Create authorization header
   */
  static createAuthHeader(token) {
    return { Authorization: `Bearer ${token}` };
  }

  /**
   * Extract user ID from token
   */
  static extractUserIdFromToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded.userId;
    } catch (error) {
      return null;
    }
  }

  /**
   * Mock user for testing
   */
  static mockUser(overrides = {}) {
    return {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      ...overrides
    };
  }

  /**
   * Mock request with authenticated user
   */
  static mockAuthenticatedRequest(user = null) {
    const mockUser = user || this.mockUser();
    return {
      user: mockUser,
      headers: {},
      body: {},
      params: {},
      query: {}
    };
  }

  /**
   * Mock response object
   */
  static mockResponse() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
  }

  /**
   * Mock next function
   */
  static mockNext() {
    return jest.fn();
  }
}

module.exports = AuthHelper;
