import { test, expect } from '@playwright/test';
import { loginTestUser, isAuthenticated } from '../../utils/test-utils';

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'testpassword123',
};

test.describe('Authentication Smoke Test', () => {
  test('should be able to load the login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Login/);
    await expect(page.getByRole('heading', { name: /sign in to your account/i })).toBeVisible();
  });

  test('should be able to log in with test credentials', async ({ page }) => {
    // Log in using our test utility
    await loginTestUser(page, TEST_USER.email, TEST_USER.password);
    
    // Verify we're on the dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Verify authentication state
    const isAuthed = await isAuthenticated(page);
    expect(isAuthed).toBe(true);
  });

  test('should be able to log out', async ({ page }) => {
    // First log in
    await loginTestUser(page, TEST_USER.email, TEST_USER.password);
    
    // Click the logout button (adjust selector as needed)
    await page.getByRole('button', { name: /sign out/i }).click();
    
    // Should be redirected to login page
    await expect(page).toHaveURL(/\/login/);
    
    // Verify we're logged out
    const isAuthed = await isAuthenticated(page);
    expect(isAuthed).toBe(false);
  });
});
