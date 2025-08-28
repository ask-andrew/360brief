# End-to-End Testing with Playwright

This guide explains how to set up and run end-to-end tests for the 360Brief application using Playwright.

## Prerequisites

1. Node.js v16 or later
2. npm or yarn
3. Chrome, Firefox, and WebKit browsers (installed automatically by Playwright)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

3. Create a `.env.test` file with test environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   TEST_USER_EMAIL=test@example.com
   TEST_USER_PASSWORD=password123
   ```

## Running Tests

Run all tests:
```bash
npx playwright test
```

Run tests in UI mode (interactive):
```bash
npx playwright test --ui
```

Run a specific test file:
```bash
npx playwright test tests/login.page.test.ts
```

Run tests in debug mode:
```bash
npx playwright test --debug
```

## Test Structure

- `tests/` - All test files
  - `utils/` - Test utilities and helpers
  - `auth.flow.test.ts` - Authentication flow tests
  - `login.page.test.ts` - Login page tests
  - `protected-routes.test.ts` - Protected route tests
  - `oauth.flow.test.ts` - OAuth flow tests

## Writing Tests

1. Use `test.describe` to group related tests
2. Use `test` to define individual test cases
3. Use `expect` for assertions
4. Use page object model for complex pages

Example test:
```typescript
test('should display login form', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
});
```

## Best Practices

1. Keep tests independent and isolated
2. Use test IDs for reliable element selection
3. Mock external services when possible
4. Use environment variables for test data
5. Run tests in parallel when possible

## Debugging

To debug a test:

1. Run tests with `--debug` flag
2. Use `page.pause()` in your test code
3. Use Playwright Inspector for step-by-step debugging

## CI/CD Integration

Add this to your CI/CD pipeline:

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run tests
  run: npx playwright test
```
