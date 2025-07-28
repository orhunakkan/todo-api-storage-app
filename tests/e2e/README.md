# E2E Tests with Playwright

This directory is prepared for end-to-end testing using Playwright.

## Setup Instructions

### 1. Install Playwright
```bash
npm install --save-dev @playwright/test
npx playwright install
```

### 2. Environment Configuration
Create a `.env.e2e` file:
```env
E2E_BASE_URL=http://localhost:3000
E2E_API_URL=http://localhost:5000
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!
```

### 3. Running E2E Tests
```bash
# Run all e2e tests
npm run test:e2e

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# Generate test report
npm run test:e2e:report
```

## Test Structure

```
tests/e2e/
├── fixtures/          # Test data and utilities
├── pages/             # Page Object Models
├── specs/             # Test specifications
└── utils/             # Helper functions
```

## Example Test Scenarios

- User authentication flow (login/logout)
- Todo creation and management
- Category management
- User profile updates
- Dashboard interactions
- Responsive design testing
- Cross-browser compatibility

## Best Practices

1. **Page Object Model**: Use POM pattern for maintainable tests
2. **Data Independence**: Each test should create its own test data
3. **Cleanup**: Clean up test data after each test
4. **Assertions**: Use meaningful assertions with good error messages
5. **Timeouts**: Set appropriate timeouts for async operations

## CI/CD Integration

These tests are designed to run in CI/CD pipelines with proper environment setup and database seeding.
