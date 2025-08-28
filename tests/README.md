# Testing Guide

This document provides an overview of the testing setup and how to run tests in the 360Brief application.

## Test Structure

- `e2e/`: End-to-end tests that test the application as a whole
  - `auth/`: Authentication-related tests (login, signup, OAuth)
  - *(more test categories will be added here as the application grows)*
- `integration/`: Integration tests for testing component interactions
- `unit/`: Unit tests for individual components and utilities
- `fixtures/`: Test data and fixtures
- `utils/`: Shared test utilities and helpers

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables by creating a `.env.test` file in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   TEST_USER_EMAIL=test@example.com
   TEST_USER_PASSWORD=testpassword123
   ```

### Available Test Scripts

- `npm test`: Run all tests with type checking
- `npm run test:ui`: Open the Playwright UI for interactive test running
- `npm run test:unit`: Run only unit tests
- `npm run test:integration`: Run only integration tests
- `npm run test:e2e`: Run only end-to-end tests
- `npm run test:setup`: Set up test user in the database
- `npm run test:ci`: Run tests in CI mode (with retries and parallel workers)
- `npm run test:update-snapshots`: Update test snapshots
- `npm run test:debug`: Run tests in debug mode
- `npm run test:report`: Open the test HTML report

### Running Specific Tests

To run a specific test file:

```bash
npx playwright test tests/e2e/auth/login.test.ts
```

To run tests with a specific tag:

```bash
npx playwright test --grep @smoke
```

## Writing Tests

### Best Practices

1. **Test Isolation**: Each test should be independent and not rely on the state from other tests.
2. **Use Fixtures**: For test data that's used across multiple tests.
3. **Page Objects**: Consider using the Page Object Model for complex UI interactions.
4. **Test IDs**: Use `data-testid` attributes to target elements in tests.
5. **Mock External Services**: Use `page.route()` to mock API responses when needed.

### Example Test

```typescript
import { test, expect } from '@playwright/test';
import { loginTestUser } from '../utils/test-utils';

test.describe('Login Page', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });
});
```

## CI/CD Integration

Tests are automatically run in CI on every push and pull request. The CI pipeline will:

1. Install dependencies
2. Run type checking
3. Run all tests
4. Generate test reports

## Debugging Tests

1. **Debug Mode**: Run tests in debug mode with `npm run test:debug`
2. **Playwright Inspector**: Use the Playwright Inspector to step through tests
3. **Screenshots/Videos**: Check the `test-results` directory for screenshots and videos of failed tests
4. **Console Logs**: Check the test output for any error messages or console logs

## Test Coverage

To generate a test coverage report:

```bash
npx playwright show-coverage
```

## Known Issues

- OAuth tests are skipped in CI since they require manual interaction
- Some tests may be flaky due to timing issues - consider adding retries

## Contributing

When adding new features, please add corresponding tests. Follow these guidelines:

1. Write tests for all new functionality
2. Ensure all tests pass before opening a PR
3. Update this README if you add new test scripts or make significant changes to the test structure
