/**
 * Auth Middleware Unit Tests
 * Testing authentication middleware in isolation
 */

// Mock dependencies first
jest.mock('jsonwebtoken');
jest.mock('../../../backend/config/database', () => ({
  query: jest.fn(),
}));

const { authenticateToken } = require('../../../backend/middleware/auth');
const jwt = require('jsonwebtoken');

describe('Auth Middleware Unit Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      headers: {},
      user: null,
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('authenticateToken', () => {
    it('should return 401 when no token is provided', () => {
      // Arrange
      mockReq.headers['authorization'] = undefined;

      // Act
      authenticateToken(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header is malformed', () => {
      // Arrange
      mockReq.headers['authorization'] = 'InvalidToken';

      // Act
      authenticateToken(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access token required' });
    });

    it('should return 403 when token is invalid', () => {
      // Arrange
      mockReq.headers['authorization'] = 'Bearer invalid.token.here';
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(new Error('Invalid token'), null);
      });

      // Act
      authenticateToken(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    });

    it('should authenticate successfully with valid token', async () => {
      // Arrange
      const mockUser = { id: 1, username: 'testuser', email: 'test@test.com' };
      const mockPool = require('../../../backend/config/database');

      mockReq.headers['authorization'] = 'Bearer valid.token.here';
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { userId: 1 });
      });
      mockPool.query.mockResolvedValue({ rows: [mockUser] });

      // Act
      await new Promise(resolve => {
        mockNext.mockImplementation(resolve);
        authenticateToken(mockReq, mockRes, mockNext);
      });

      // Assert
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const mockPool = require('../../../backend/config/database');

      mockReq.headers['authorization'] = 'Bearer valid.token.here';
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { userId: 1 });
      });
      mockPool.query.mockRejectedValue(new Error('Database error'));

      // Act
      await new Promise(resolve => {
        mockRes.status.mockImplementation(() => {
          resolve();
          return mockRes;
        });
        authenticateToken(mockReq, mockRes, mockNext);
      });

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication error' });
    });
  });
});
