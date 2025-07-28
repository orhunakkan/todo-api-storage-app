/**
 * Authentication Routes Integration Tests
 */

const request = require('supertest');
const express = require('express');
const authRoutes = require('../../backend/routes/auth');
const DatabaseHelper = require('../helpers/database');
const fixtures = require('../fixtures/data');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  return app;
};

describe('Authentication Routes Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    await DatabaseHelper.cleanup();
  });

  afterAll(async () => {
    await DatabaseHelper.cleanup();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const userData = fixtures.users.valid;

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('username', userData.username);
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).toHaveProperty('first_name', userData.first_name);
      expect(response.body.user).toHaveProperty('last_name', userData.last_name);
      expect(response.body.user).not.toHaveProperty('password');

      // Verify user was created in database
      const dbUser = await DatabaseHelper.getUserById(response.body.user.id);
      expect(dbUser).toBeDefined();
      expect(dbUser.username).toBe(userData.username);
    });

    it('should return 400 for missing required fields', async () => {
      // Arrange
      const userData = fixtures.users.invalid.missingUsername;

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('required');
    });

    it('should return 400 for invalid email format', async () => {
      // Arrange
      const userData = fixtures.users.invalid.invalidEmail;

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.toLowerCase()).toContain('email');
    });

    it('should return 409 for duplicate username', async () => {
      // Arrange
      const userData = fixtures.users.valid;
      
      // Create user first
      await DatabaseHelper.createTestUser(userData);

      // Act - Try to register same user again
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Assert
      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.toLowerCase()).toContain('exists');
    });

    it('should return 409 for duplicate email', async () => {
      // Arrange
      const userData1 = fixtures.users.valid;
      const userData2 = { ...userData1, username: 'differentuser' };
      
      // Create user first
      await DatabaseHelper.createTestUser(userData1);

      // Act - Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData2);

      // Assert
      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.toLowerCase()).toContain('exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user for login tests
      await DatabaseHelper.createTestUser(fixtures.users.valid);
    });

    it('should login with valid credentials', async () => {
      // Arrange
      const loginData = fixtures.auth.validLogin;

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('username', loginData.username);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 401 for invalid password', async () => {
      // Arrange
      const loginData = fixtures.auth.invalidLogin.wrongPassword;

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.toLowerCase()).toContain('credentials');
    });

    it('should return 401 for non-existent user', async () => {
      // Arrange
      const loginData = fixtures.auth.invalidLogin.nonexistentUser;

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.toLowerCase()).toContain('credentials');
    });

    it('should return 400 for missing credentials', async () => {
      // Arrange
      const loginData = fixtures.auth.invalidLogin.missingCredentials;

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('required');
    });
  });

  describe('GET /api/auth/me', () => {
    let userToken;

    beforeEach(async () => {
      // Create test user and get token
      const { token } = await DatabaseHelper.createTestUser(fixtures.users.valid);
      userToken = token;
    });

    it('should return user profile with valid token', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('username', fixtures.users.valid.username);
      expect(response.body.user).toHaveProperty('email', fixtures.users.valid.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/me');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('token');
    });

    it('should return 401 with invalid token', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.toLowerCase()).toContain('invalid');
    });
  });
});
