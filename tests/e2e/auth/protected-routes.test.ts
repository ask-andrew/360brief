import { test, expect } from '@playwright/test';
import { clearAuthSession, loginTestUser, isAuthenticated } from './utils/test-utils';

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'testpassword123',
};

test.describe('Protected Routes', () => {
  // Clear auth session before each test
  test.beforeEach(async ({ page }) => {
    await clearAuthSession(page);
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access a protected route
    await page.goto('/dashboard');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
    
    // Should include redirect URL in the query params
    expect(page.url()).toContain('redirectTo=%2Fdashboard');
  });

  test('should allow access to protected routes when authenticated', async ({ page }) => {
    // Log in first
    await loginTestUser(page, TEST_USER.email, TEST_USER.password);
    
    // Verify we're authenticated
    const isAuthed = await isAuthenticated(page);
    expect(isAuthed).toBe(true);
    
    // Try to access a protected route
    await page.goto('/dashboard');
    
    // Should be on the dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should redirect authenticated users away from auth pages', async ({ page }) => {
    // Log in first
    await loginTestUser(page, TEST_USER.email, TEST_USER.password);
    
    // Try to access login page
    await page.goto('/login');
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should persist session across page reloads', async ({ page }) => {
    // Log in
    await loginTestUser(page, TEST_USER.email, TEST_USER.password);
    
    // Reload the page
    await page.reload();
    
    // Should still be logged in
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });
});
