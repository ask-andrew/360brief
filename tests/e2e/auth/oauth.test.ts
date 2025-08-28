import { test, expect } from '@playwright/test';
import { clearAuthSession, isAuthenticated } from './utils/test-utils';

// Skip OAuth tests in CI environment since they require manual interaction
const testWithSkip = process.env.CI ? test.skip : test;

test.describe('OAuth Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthSession(page);
  });

  testWithSkip('should redirect to Google OAuth consent screen', async ({ page }) => {
    await page.goto('/login');
    
    // Click the Google OAuth button
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', { name: /continue with google/i }).click()
    ]);
    
    // Wait for the popup to load
    await popup.waitForLoadState('domcontentloaded');
    
    // Check if we're on the Google OAuth consent screen
    const url = popup.url();
    expect(url).toMatch(/^https:\/\/accounts\.google\.com/);
    expect(url).toContain('client_id=');
    expect(url).toContain('redirect_uri=');
    expect(url).toContain('response_type=code');
    expect(url).toContain('scope=');
    
    // Close the popup
    await popup.close();
  });

  test('should handle OAuth callback errors', async ({ page }) => {
    // Try to access OAuth callback with error parameters
    await page.goto('/auth/callback?error=access_denied&error_description=User%20denied%20access');
    
    // Should be redirected to login page with error message
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/access denied/i)).toBeVisible();
    
    // Verify we're not authenticated
    const isAuthed = await isAuthenticated(page);
    expect(isAuthed).toBe(false);
    
    // Try to access OAuth callback with invalid parameters
    await page.goto('/auth/callback?code=invalid_code');
    
    // Should be redirected to login page with error message
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/authentication failed/i)).toBeVisible();
    
    // Verify we're still not authenticated
    const stillAuthed = await isAuthenticated(page);
    expect(stillAuthed).toBe(false);
  });
});
