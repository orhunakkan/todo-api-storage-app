/**
 * Statistics API Integration Tests
 * Testing statistics calculation and aggregation
 */

const request = require('supertest');
const express = require('express');
const statsRoutes = require('../../backend/routes/stats');
const DatabaseHelper = require('../helpers/database');
const fixtures = require('../fixtures/data');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/stats', statsRoutes);
  return app;
};

describe('Statistics Routes Integration Tests', () => {
  let app;
  let testUser;
  let authToken;
  let testCategories;
  let testTodos;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    await DatabaseHelper.cleanup();
    
    // Create test user and get token
    const { user, token } = await DatabaseHelper.createTestUser(fixtures.users.valid);
    testUser = user;
    authToken = token;
    
    // Create test categories
    testCategories = [];
    for (const categoryData of fixtures.categories.multiple) {
      const category = await DatabaseHelper.createTestCategory(testUser.id, categoryData);
      testCategories.push(category);
    }
    
    // Create test todos with various states
    testTodos = [];
    const todoConfigs = [
      { ...fixtures.todos.multiple[0], completed: true, priority: 'high', category_id: testCategories[0].id },
      { ...fixtures.todos.multiple[1], completed: false, priority: 'medium', category_id: testCategories[0].id },
      { ...fixtures.todos.multiple[2], completed: true, priority: 'low', category_id: testCategories[1].id },
      { title: 'Uncategorized Todo', description: 'No category', completed: false, priority: 'medium' }
    ];
    
    for (const todoConfig of todoConfigs) {
      const todo = await DatabaseHelper.createTestTodo(
        testUser.id,
        todoConfig.category_id || null,
        todoConfig
      );
      testTodos.push(todo);
    }
  });

  afterAll(async () => {
    await DatabaseHelper.cleanup();
  });

  describe('GET /api/stats/overview', () => {
    it('should return comprehensive statistics overview', async () => {
      // Act
      const response = await request(app)
        .get('/api/stats/overview')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('stats');
      
      const stats = response.body.stats;
      
      // Check basic counts
      expect(stats).toHaveProperty('total_todos', 4);
      expect(stats).toHaveProperty('completed_todos', 2);
      expect(stats).toHaveProperty('pending_todos', 2);
      expect(stats).toHaveProperty('total_categories', 2);
      
      // Check completion rate
      expect(stats).toHaveProperty('completion_rate', 0.5);
      
      // Check priority breakdown
      expect(stats).toHaveProperty('priority_breakdown');
      expect(stats.priority_breakdown).toHaveProperty('high', 1);
      expect(stats.priority_breakdown).toHaveProperty('medium', 2);
      expect(stats.priority_breakdown).toHaveProperty('low', 1);
      
      // Check category breakdown
      expect(stats).toHaveProperty('category_breakdown');
      expect(Array.isArray(stats.category_breakdown)).toBe(true);
      expect(stats.category_breakdown).toHaveLength(4); // 3 categories + uncategorized
    });

    it('should return zero stats for user with no data', async () => {
      // Arrange - Create a new user with no todos
      const { token: newUserToken } = await DatabaseHelper.createTestUser({
        ...fixtures.users.valid,
        username: 'newuser',
        email: 'newuser@example.com'
      });

      // Act
      const response = await request(app)
        .get('/api/stats/overview')
        .set('Authorization', `Bearer ${newUserToken}`);

      // Assert
      expect(response.status).toBe(200);
      const stats = response.body.stats;
      expect(stats.total_todos).toBe(0);
      expect(stats.completed_todos).toBe(0);
      expect(stats.pending_todos).toBe(0);
      expect(stats.completion_rate).toBe(0);
    });

    it('should return 401 without authentication', async () => {
      // Act
      const response = await request(app)
        .get('/api/stats/overview');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/stats/trends', () => {
    beforeEach(async () => {
      // Create todos with specific creation dates for trend analysis
      const dates = [
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        new Date() // Today
      ];
      
      for (let i = 0; i < dates.length; i++) {
        await DatabaseHelper.createTestTodoWithDate(
          testUser.id,
          null,
          {
            title: `Trend Todo ${i + 1}`,
            description: `Todo created on ${dates[i].toDateString()}`,
            completed: i % 2 === 0 // Alternate completed status
          },
          dates[i]
        );
      }
    });

    it('should return daily trends for the past week', async () => {
      // Act
      const response = await request(app)
        .get('/api/stats/trends')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ period: '7d', granularity: 'daily' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('trends');
      
      const trends = response.body.trends;
      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBeLessThanOrEqual(7);
      
      // Each trend point should have required properties
      trends.forEach(point => {
        expect(point).toHaveProperty('date');
        expect(point).toHaveProperty('created_count');
        expect(point).toHaveProperty('completed_count');
        expect(typeof point.created_count).toBe('number');
        expect(typeof point.completed_count).toBe('number');
      });
    });

    it('should return weekly trends for the past month', async () => {
      // Act
      const response = await request(app)
        .get('/api/stats/trends')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ period: '30d', granularity: 'weekly' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('trends');
      
      const trends = response.body.trends;
      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBeLessThanOrEqual(5); // ~4-5 weeks in a month
    });

    it('should handle invalid period parameter', async () => {
      // Act
      const response = await request(app)
        .get('/api/stats/trends')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ period: 'invalid' });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/stats/productivity', () => {
    it('should return productivity metrics', async () => {
      // Act
      const response = await request(app)
        .get('/api/stats/productivity')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('productivity');
      
      const productivity = response.body.productivity;
      
      // Check average completion time
      expect(productivity).toHaveProperty('avg_completion_time_hours');
      expect(typeof productivity.avg_completion_time_hours).toBe('number');
      
      // Check productivity score
      expect(productivity).toHaveProperty('productivity_score');
      expect(productivity.productivity_score).toBeGreaterThanOrEqual(0);
      expect(productivity.productivity_score).toBeLessThanOrEqual(100);
      
      // Check best performing category
      expect(productivity).toHaveProperty('best_category');
      
      // Check streak information
      expect(productivity).toHaveProperty('current_streak_days');
      expect(productivity).toHaveProperty('longest_streak_days');
    });

    it('should calculate productivity score correctly', async () => {
      // Arrange - Create specific scenario with known completion rate
      await DatabaseHelper.cleanup();
      
      const { user, token } = await DatabaseHelper.createTestUser(fixtures.users.valid);
      
      // Create 10 todos, complete 8 of them (80% completion rate)
      for (let i = 0; i < 10; i++) {
        await DatabaseHelper.createTestTodo(
          user.id,
          null,
          {
            title: `Productivity Todo ${i + 1}`,
            description: 'For productivity calculation',
            completed: i < 8 // First 8 are completed
          }
        );
      }

      // Act
      const response = await request(app)
        .get('/api/stats/productivity')
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(200);
      const productivity = response.body.productivity;
      expect(productivity.productivity_score).toBeGreaterThan(70); // Should be high with 80% completion
    });
  });

  describe('GET /api/stats/categories', () => {
    it('should return detailed category statistics', async () => {
      // Act
      const response = await request(app)
        .get('/api/stats/categories')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('categories');
      
      const categories = response.body.categories;
      expect(Array.isArray(categories)).toBe(true);
      
      // Should include uncategorized items
      const uncategorized = categories.find(cat => cat.name === 'Uncategorized');
      expect(uncategorized).toBeDefined();
      expect(uncategorized.total_todos).toBe(1);
      
      // Check category with todos
      const categoryWithTodos = categories.find(cat => cat.id === testCategories[0].id);
      expect(categoryWithTodos).toBeDefined();
      expect(categoryWithTodos.total_todos).toBe(2);
      expect(categoryWithTodos.completed_todos).toBe(1);
      expect(categoryWithTodos.completion_rate).toBe(0.5);
    });

    it('should include empty categories', async () => {
      // Arrange - Create a category with no todos
      const emptyCategory = await DatabaseHelper.createTestCategory(testUser.id, {
        name: 'Empty Category',
        description: 'No todos here',
        color: '#999999'
      });

      // Act
      const response = await request(app)
        .get('/api/stats/categories')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      const categories = response.body.categories;
      
      const empty = categories.find(cat => cat.id === emptyCategory.id);
      expect(empty).toBeDefined();
      expect(empty.total_todos).toBe(0);
      expect(empty.completed_todos).toBe(0);
      expect(empty.completion_rate).toBe(0);
    });
  });
});
