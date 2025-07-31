import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should load the dashboard page', async ({ page }) => {
    // Mock the auth state to simulate an authenticated user
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // Verify the dashboard loads with the expected content
    await expect(page).toHaveTitle(/360Brief/);
    
    // Check for key dashboard elements
    const dashboardHeading = page.getByRole('heading', { name: /dashboard/i, level: 1 });
    await expect(dashboardHeading).toBeVisible();
    
    // Check for stat cards
    await expect(page.getByText(/unread emails/i)).toBeVisible();
    await expect(page.getByText(/upcoming meetings/i)).toBeVisible();
    await expect(page.getByText(/action items/i)).toBeVisible();
    
    // Check for main content sections
    await expect(page.getByRole('heading', { name: /recent emails/i, level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: /upcoming meetings/i, level: 2 })).toBeVisible();
  });

  test('should show login page for unauthenticated users', async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
    
    // Navigate to dashboard
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    
    // Should be redirected to login
    await expect(page).toHaveURL(/\/api\/auth\/login/);
  });
});
