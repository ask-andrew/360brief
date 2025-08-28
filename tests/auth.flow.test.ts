import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Test configuration
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';
const TEST_NAME = 'Test User';

// Skip OAuth tests in CI since they require manual interaction
const SKIP_OAUTH = process.env.CI === 'true' || process.env.SKIP_OAUTH === 'true';

test.describe('Authentication Flow', () => {
  let supabase: ReturnType<typeof createClient>;
  
  test.beforeEach(async ({ page }) => {
    // Initialize Supabase client
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Clean up any existing test user
    // First get the auth user ID
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
      console.error('Error listing users:', userError);
      return;
    }
    
    // Find and delete the test user
    const testUser = users.find(user => user.email === TEST_EMAIL);
    if (testUser) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(testUser.id);
      if (deleteError) {
        console.error('Error deleting user:', deleteError);
      }
    }
    
    // Start each test from the home page
    await page.goto(BASE_URL);
  });
  
  test('should redirect unauthenticated user to login page', async ({ page }) => {
    // Try to access a protected route
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Should be redirected to login page
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /sign in to your account/i })).toBeVisible();
  });
  
  test('should allow user to sign up with email and password', async ({ page }) => {
    // Navigate to sign up
    await page.goto(`${BASE_URL}/login`);
    await page.getByRole('button', { name: /create an account/i }).click();
    
    // Fill out the sign up form
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByLabel(/full name/i).fill(TEST_NAME);
    
    // Submit the form
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Should be redirected to dashboard after successful sign up
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    
    // Verify user is authenticated
    const session = await page.evaluate(() => window.localStorage.getItem('supabase.auth.token'));
    expect(session).toBeTruthy();
  });
  
  test('should allow user to sign in with email and password', async ({ page }) => {
    // First create a test user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      options: {
        data: {
          name: TEST_NAME,
        },
      },
    });
    
    expect(signUpError).toBeNull();
    
    // Navigate to login
    await page.goto(`${BASE_URL}/login`);
    
    // Fill out the login form
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    
    // Submit the form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should be redirected to dashboard after successful login
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });
  
  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Fill out the login form with invalid credentials
    await page.getByLabel(/email/i).fill('nonexistent@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    
    // Submit the form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show error message
    await expect(page.getByText(/invalid login credentials/i)).toBeVisible();
  });
  
  test('should allow user to sign out', async ({ page }) => {
    // First sign in
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Click sign out
    await page.getByRole('button', { name: /sign out/i }).click();
    
    // Should be redirected to login page
    await expect(page).toHaveURL(/\/login/);
    
    // Verify session is cleared
    const session = await page.evaluate(() => window.localStorage.getItem('supabase.auth.token'));
    expect(session).toBeFalsy();
  });
  
  test('should allow user to sign in with Google', async ({ page }) => {
    test.skip(SKIP_OAUTH, 'Skipping OAuth test in CI environment');
    
    await page.goto(`${BASE_URL}/login`);
    
    // Mock the OAuth flow for testing
    await page.route('**/auth/v1/authorize*', async route => {
      // In a real test, you would handle the OAuth flow here
      // For now, we'll just redirect to the callback URL with a mock code
      const url = new URL(route.request().url());
      const redirectTo = url.searchParams.get('redirect_to');
      if (redirectTo) {
        const callbackUrl = new URL(redirectTo);
        callbackUrl.searchParams.set('code', 'mock_auth_code');
        await page.goto(callbackUrl.toString());
      }
      await route.fulfill({ status: 200 });
    });
    
    // Click Google sign in button
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', { name: /continue with google/i }).click()
    ]);
    
    // In a real test, you would handle the OAuth flow in the popup
    await popup.close();
    
    // After successful OAuth, should be redirected to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Verify user is authenticated
    const session = await page.evaluate(() => window.localStorage.getItem('supabase.auth.token'));
    expect(session).toBeTruthy();
  });
  
  test('should persist session across page reloads', async ({ page }) => {
    // First sign in
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Reload the page
    await page.reload();
    
    // Should still be on dashboard with user authenticated
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });
  
  test('should redirect authenticated user away from auth pages', async ({ page }) => {
    // First sign in
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Try to access login page again
    await page.goto(`${BASE_URL}/login`);
    
    // Should be redirected back to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
