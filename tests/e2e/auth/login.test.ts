import { test, expect } from '@playwright/test';
import { clearAuthSession, loginTestUser } from './utils/test-utils';

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'testpassword123',
};

test.describe('Login Page', () => {
  // Clear auth session before each test
  test.beforeEach(async ({ page }) => {
    await clearAuthSession(page);
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    // Check if the login form is visible
    await expect(page.getByRole('heading', { name: /sign in to your account/i })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    
    // Check if the Google OAuth button is visible
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
  });

  test('should show validation errors', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Check for validation errors
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.getByLabel('Email').fill('invalid@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Check for error message (handles both possible Supabase error messages)
    await expect(
      page.getByText(/(invalid login credentials|invalid email or password)/i)
    ).toBeVisible();
  });

  test('should navigate to sign up page', async ({ page }) => {
    // Click on sign up link
    await page.getByRole('link', { name: /create an account/i }).click();
    
    // Check if we're on the sign up page
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();
  });
  
  test('should allow login with valid credentials', async ({ page }) => {
    await loginTestUser(page, TEST_USER.email, TEST_USER.password);
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
