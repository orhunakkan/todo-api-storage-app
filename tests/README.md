# Testing Guide

This document provides comprehensive information about the testing setup and practices for the Todo API Storage Application.

## Overview

The project implements a robust 3-tier testing strategy:

- **Unit Tests** - Fast, isolated tests for individual functions and modules
- **Integration Tests** - Tests that verify interactions between multiple components
- **E2E Tests** - End-to-end tests using Playwright (structure prepared, implementation pending)

## Test Structure

```
tests/
├── unit/                   # Unit tests (Jest)
│   ├── config/            # Configuration tests
│   ├── middleware/        # Middleware tests
│   ├── routes/           # Route handler tests (isolated)
│   └── helpers/          # Utility function tests
├── integration/           # Integration tests (Jest + Supertest)
│   ├── auth.test.js      # Authentication workflow tests
│   ├── todos.test.js     # Todo management tests
│   ├── stats.test.js     # Statistics calculation tests
│   ├── globalSetup.js    # Integration test setup
│   └── globalTeardown.js # Integration test cleanup
├── e2e/                  # E2E tests (Playwright - prepared)
│   ├── fixtures/         # Test data for E2E
│   ├── pages/           # Page Object Models
│   ├── specs/           # Test specifications
│   └── utils/           # E2E helper functions
├── fixtures/             # Shared test data
├── helpers/              # Test utilities and helpers
└── setup.js             # Global test configuration
```

## Quick Start

### Running Tests

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests in watch mode
npm run test:watch
npm run test:watch:unit
npm run test:watch:integration

# Run with coverage
npm run test:coverage
npm run test:coverage:unit
npm run test:coverage:integration

# Debug tests
npm run test:debug

# CI mode (no watch, full coverage)
npm run test:ci
```

### From Root Directory

```bash
# Run all backend tests from root
npm run test:all

# Run specific test types from root
npm run test:unit
npm run test:integration
npm run test:coverage
```

## Test Configuration

### Jest Configurations

1. **jest.config.js** - Main configuration running all test types
2. **jest.unit.config.js** - Optimized for fast unit tests
3. **jest.integration.config.js** - Configured for database integration tests

### Coverage Thresholds

- **Unit Tests**: 80% coverage (branches, functions, lines, statements)
- **Integration Tests**: 70% coverage
- **Overall**: 75% coverage

## Unit Tests

Unit tests focus on testing individual functions and modules in isolation.

### Characteristics:
- **Fast** - Typically < 5 seconds timeout
- **Isolated** - Heavy use of mocks and stubs
- **Focused** - Test single responsibility
- **High Coverage** - 80% threshold

### Example Unit Test:

```javascript
describe('DatabaseHelper Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate required fields correctly', () => {
    // Arrange
    const data = { name: 'Test' };
    const required = ['name', 'email'];

    // Act & Assert
    expect(() => {
      DatabaseHelper.validateRequiredFields(data, required);
    }).toThrow('Missing required fields: email');
  });
});
```

### Unit Test Best Practices:

1. **AAA Pattern** - Arrange, Act, Assert
2. **Mock External Dependencies** - Database, APIs, file system
3. **Test Edge Cases** - Null values, empty arrays, invalid inputs
4. **Clear Test Names** - Describe what is being tested
5. **Single Assertion Focus** - One concept per test

## Integration Tests

Integration tests verify that multiple components work together correctly.

### Characteristics:
- **Realistic** - Uses real database connections
- **Comprehensive** - Tests complete workflows
- **Slower** - 15-second timeout for DB operations
- **End-to-end workflows** - Complete user scenarios

### Example Integration Test:

```javascript
describe('Todos Routes Integration Tests', () => {
  beforeEach(async () => {
    await DatabaseHelper.cleanup();
    const { user, token } = await DatabaseHelper.createTestUser();
    testUser = user;
    authToken = token;
  });

  it('should create a new todo successfully', async () => {
    const response = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${authToken}`)
      .send(todoData);

    expect(response.status).toBe(201);
    expect(response.body.todo).toHaveProperty('id');
  });
});
```

### Integration Test Best Practices:

1. **Database Cleanup** - Clean state before each test
2. **Real Data Flow** - Test actual API endpoints
3. **Authentication** - Test with real JWT tokens
4. **Error Scenarios** - Test validation, authorization failures
5. **Data Persistence** - Verify changes in database

## Test Data Management

### Fixtures

Centralized test data in `tests/fixtures/data.js`:

```javascript
module.exports = {
  users: {
    valid: {
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPassword123!'
    },
    invalid: {
      missingEmail: { username: 'test' }
    }
  },
  todos: {
    valid: {
      title: 'Test Todo',
      description: 'Test description'
    }
  }
};
```

### Database Helpers

Utility functions for test database operations:

```javascript
// Create test user with token
const { user, token } = await DatabaseHelper.createTestUser();

// Create test todo
const todo = await DatabaseHelper.createTestTodo(userId, categoryId, todoData);

// Cleanup all test data
await DatabaseHelper.cleanup();
```

## Environment Setup

### Test Environment Variables

```env
NODE_ENV=test
JWT_SECRET=test-jwt-secret-key-for-testing-only
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_NAME=todo_test
TEST_DB_USER=postgres
TEST_DB_PASSWORD=password
```

### Database Setup

1. **Create Test Database**:
   ```sql
   CREATE DATABASE todo_test;
   ```

2. **Run Migrations**:
   ```bash
   npm run db:setup
   ```

3. **Verify Setup**:
   ```bash
   npm run db:verify
   ```

## E2E Testing (Playwright)

### Structure Prepared

The E2E testing structure is ready for Playwright implementation:

```
tests/e2e/
├── playwright.config.js   # Playwright configuration
├── fixtures/             # E2E test data
├── pages/               # Page Object Models
├── specs/               # Test specifications
└── utils/               # E2E utilities
```

### To Implement E2E Tests:

1. **Install Playwright**:
   ```bash
   npm install --save-dev @playwright/test
   npx playwright install
   ```

2. **Add Scripts to package.json**:
   ```json
   {
     "test:e2e": "playwright test",
     "test:e2e:headed": "playwright test --headed",
     "test:e2e:debug": "playwright test --debug"
   }
   ```

3. **Create Page Objects and Specs**

## CI/CD Integration

### GitHub Actions Example:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: todo_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run unit tests
        run: npm run test:unit
        
      - name: Run integration tests
        run: npm run test:integration
        env:
          TEST_DB_HOST: localhost
          TEST_DB_USER: postgres
          TEST_DB_PASSWORD: postgres
          
      - name: Upload coverage
        uses: codecov/codecov-action@v1
```

## Debugging Tests

### VSCode Debug Configuration:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Command Line Debugging:

```bash
# Debug specific test
npm run test:debug -- --testNamePattern="should create todo"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Performance Guidelines

### Unit Tests:
- Should complete in < 5 seconds
- Mock all external dependencies
- Use `jest.spyOn()` for monitoring calls

### Integration Tests:
- Allow up to 15 seconds for database operations
- Clean database state between tests
- Use transactions when possible for faster cleanup

### Coverage Goals:
- Unit tests: 80%+ coverage
- Integration tests: 70%+ coverage
- Critical paths: 100% coverage

## Common Testing Patterns

### 1. Testing Async Functions:

```javascript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### 2. Testing Error Conditions:

```javascript
it('should throw error for invalid input', async () => {
  await expect(functionThatThrows()).rejects.toThrow('Invalid input');
});
```

### 3. Testing with Timeouts:

```javascript
it('should complete within timeout', async () => {
  const start = Date.now();
  await someOperation();
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(1000);
}, 5000);
```

### 4. Testing Database Transactions:

```javascript
it('should rollback on error', async () => {
  await expect(operationThatFails()).rejects.toThrow();
  const count = await DatabaseHelper.getRecordCount();
  expect(count).toBe(0); // Should be rolled back
});
```

## Troubleshooting

### Common Issues:

1. **Database Connection Errors**:
   - Verify test database exists
   - Check environment variables
   - Ensure database is running

2. **Jest Memory Issues**:
   - Add `--maxWorkers=4` flag
   - Use `--runInBand` for debugging

3. **Async Test Timeouts**:
   - Increase `testTimeout` in Jest config
   - Check for unresolved promises

4. **Mock Issues**:
   - Clear mocks between tests
   - Use `jest.restoreAllMocks()` in `afterEach`

### Performance Optimization:

1. **Faster Test Runs**:
   - Use `--onlyChanged` flag
   - Parallel test execution
   - Selective test patterns

2. **Memory Management**:
   - Proper cleanup in `afterEach`
   - Avoid global state
   - Close database connections

This comprehensive testing setup ensures high code quality, catches regressions early, and provides confidence in deployments.
