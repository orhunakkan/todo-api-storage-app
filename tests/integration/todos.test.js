/**
 * Todos Routes Integration Tests
 * Testing complete todo management workflows
 */

const request = require('supertest');
const express = require('express');
const todoRoutes = require('../../backend/routes/todos');
const categoryRoutes = require('../../backend/routes/categories');
const DatabaseHelper = require('../helpers/database');
const fixtures = require('../fixtures/data');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/todos', todoRoutes);
  app.use('/api/categories', categoryRoutes);
  return app;
};

describe('Todos Routes Integration Tests', () => {
  let app;
  let testUser;
  let authToken;
  let testCategory;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    await DatabaseHelper.cleanup();
    
    // Create test user and get token
    const { user, token } = await DatabaseHelper.createTestUser(fixtures.users.valid);
    testUser = user;
    authToken = token;
    
    // Create test category
    testCategory = await DatabaseHelper.createTestCategory(testUser.id, fixtures.categories.valid);
  });

  afterAll(async () => {
    await DatabaseHelper.cleanup();
  });

  describe('POST /api/todos', () => {
    it('should create a new todo successfully', async () => {
      // Arrange
      const todoData = {
        title: 'Test Todo',
        description: 'Test todo description',
        priority: 'medium',
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        category_id: testCategory.id
      };

      // Act
      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(todoData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Todo created successfully');
      expect(response.body).toHaveProperty('todo');
      expect(response.body.todo).toHaveProperty('id');
      expect(response.body.todo).toHaveProperty('title', todoData.title);
      expect(response.body.todo).toHaveProperty('description', todoData.description);
      expect(response.body.todo).toHaveProperty('priority', todoData.priority);
      expect(response.body.todo).toHaveProperty('completed', false);
      expect(response.body.todo).toHaveProperty('user_id', testUser.id);
      expect(response.body.todo).toHaveProperty('category_id', testCategory.id);

      // Verify todo was created in database
      const dbTodo = await DatabaseHelper.getTodoById(response.body.todo.id);
      expect(dbTodo).toBeDefined();
      expect(dbTodo.title).toBe(todoData.title);
    });

    it('should create todo without category', async () => {
      // Arrange
      const todoData = {
        title: 'Uncategorized Todo',
        description: 'Todo without category',
        priority: 'low'
      };

      // Act
      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(todoData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.todo).toHaveProperty('category_id', null);
    });

    it('should return 400 for missing required fields', async () => {
      // Arrange
      const invalidTodoData = {
        description: 'Missing title'
      };

      // Act
      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTodoData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('required');
    });

    it('should return 401 without authentication', async () => {
      // Arrange
      const todoData = fixtures.todos.valid;

      // Act
      const response = await request(app)
        .post('/api/todos')
        .send(todoData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid category', async () => {
      // Arrange
      const todoData = {
        ...fixtures.todos.valid,
        category_id: 99999 // Non-existent category
      };

      // Act
      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(todoData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.toLowerCase()).toContain('category');
    });
  });

  describe('GET /api/todos', () => {
    beforeEach(async () => {
      // Create multiple test todos
      const todos = fixtures.todos.multiple;
      for (const todoData of todos) {
        await DatabaseHelper.createTestTodo(
          testUser.id,
          Math.random() > 0.5 ? testCategory.id : null,
          todoData
        );
      }
    });

    it('should return paginated todos list', async () => {
      // Act
      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 2 });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('todos');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.todos).toHaveLength(2);
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 2);
      expect(response.body.pagination).toHaveProperty('totalCount');
      expect(response.body.pagination).toHaveProperty('totalPages');
    });

    it('should filter todos by completion status', async () => {
      // Arrange - Mark one todo as completed
      const todos = await DatabaseHelper.getTodosByUserId(testUser.id);
      if (todos.length > 0) {
        await DatabaseHelper.updateTodoStatus(todos[0].id, true);
      }

      // Act - Get only incomplete todos
      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ completed: 'false' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.todos).toBeDefined();
      response.body.todos.forEach(todo => {
        expect(todo.completed).toBe(false);
      });
    });

    it('should filter todos by category', async () => {
      // Act
      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ category_id: testCategory.id });

      // Assert
      expect(response.status).toBe(200);
      response.body.todos.forEach(todo => {
        expect(todo.category_id).toBe(testCategory.id);
      });
    });

    it('should search todos by title and description', async () => {
      // Act
      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'Task' });

      // Assert
      expect(response.status).toBe(200);
      response.body.todos.forEach(todo => {
        const searchText = `${todo.title} ${todo.description}`.toLowerCase();
        expect(searchText).toContain('task');
      });
    });

    it('should return only user\'s todos', async () => {
      // Arrange - Create another user and their todos
      const { user: otherUser, token: otherToken } = await DatabaseHelper.createTestUser({
        ...fixtures.users.valid,
        username: 'otheruser',
        email: 'other@example.com'
      });
      
      await DatabaseHelper.createTestTodo(otherUser.id, null, {
        title: 'Other User Todo',
        description: 'Should not appear in first user\'s list'
      });

      // Act
      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      response.body.todos.forEach(todo => {
        expect(todo.user_id).toBe(testUser.id);
      });
    });
  });

  describe('PUT /api/todos/:id', () => {
    let testTodo;

    beforeEach(async () => {
      testTodo = await DatabaseHelper.createTestTodo(
        testUser.id,
        testCategory.id,
        fixtures.todos.valid
      );
    });

    it('should update todo successfully', async () => {
      // Arrange
      const updateData = {
        title: 'Updated Todo Title',
        description: 'Updated description',
        priority: 'high',
        completed: true
      };

      // Act
      const response = await request(app)
        .put(`/api/todos/${testTodo.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Todo updated successfully');
      expect(response.body.todo).toHaveProperty('title', updateData.title);
      expect(response.body.todo).toHaveProperty('description', updateData.description);
      expect(response.body.todo).toHaveProperty('priority', updateData.priority);
      expect(response.body.todo).toHaveProperty('completed', updateData.completed);

      // Verify update in database
      const updatedTodo = await DatabaseHelper.getTodoById(testTodo.id);
      expect(updatedTodo.title).toBe(updateData.title);
      expect(updatedTodo.completed).toBe(updateData.completed);
    });

    it('should return 404 for non-existent todo', async () => {
      // Act
      const response = await request(app)
        .put('/api/todos/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Title' });

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Todo not found');
    });

    it('should return 403 when updating other user\'s todo', async () => {
      // Arrange - Create another user and their todo
      const { user: otherUser } = await DatabaseHelper.createTestUser({
        ...fixtures.users.valid,
        username: 'otheruser',
        email: 'other@example.com'
      });
      
      const otherUserTodo = await DatabaseHelper.createTestTodo(
        otherUser.id,
        null,
        fixtures.todos.valid
      );

      // Act
      const response = await request(app)
        .put(`/api/todos/${otherUserTodo.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Trying to update other user\'s todo' });

      // Assert
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/todos/:id', () => {
    let testTodo;

    beforeEach(async () => {
      testTodo = await DatabaseHelper.createTestTodo(
        testUser.id,
        testCategory.id,
        fixtures.todos.valid
      );
    });

    it('should delete todo successfully', async () => {
      // Act
      const response = await request(app)
        .delete(`/api/todos/${testTodo.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Todo deleted successfully');

      // Verify deletion in database
      const deletedTodo = await DatabaseHelper.getTodoById(testTodo.id);
      expect(deletedTodo).toBeNull();
    });

    it('should return 404 for non-existent todo', async () => {
      // Act
      const response = await request(app)
        .delete('/api/todos/99999')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Todo not found');
    });

    it('should return 403 when deleting other user\'s todo', async () => {
      // Arrange - Create another user and their todo
      const { user: otherUser } = await DatabaseHelper.createTestUser({
        ...fixtures.users.valid,
        username: 'otheruser',
        email: 'other@example.com'
      });
      
      const otherUserTodo = await DatabaseHelper.createTestTodo(
        otherUser.id,
        null,
        fixtures.todos.valid
      );

      // Act
      const response = await request(app)
        .delete(`/api/todos/${otherUserTodo.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });
});
