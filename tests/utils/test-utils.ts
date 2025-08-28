import { Page, expect } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ 
  path: path.resolve(process.cwd(), '..', '.env.test'),
  override: true 
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase environment variables for testing');
}

/**
 * Get a Supabase client for testing
 */
export function getTestSupabaseClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase URL and key must be defined');
  }
  
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

/**
 * Utility function to log in a test user
 */
export async function loginTestUser(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  // Clear any existing session
  await page.context().clearCookies();
  
  // Navigate to login
  await page.goto('/login');
  
  // Fill in credentials
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  
  // Submit and wait for navigation
  const navigationPromise = page.waitForURL('**/dashboard');
  await page.getByRole('button', { name: /sign in/i }).click();
  await navigationPromise;
  
  // Verify we're on the dashboard
  await expect(page).toHaveURL(/\/dashboard/);
}

/**
 * Mock API responses during tests
 */
export function mockApiResponse(
  page: Page,
  url: string | RegExp,
  status: number,
  body: any
) {
  return page.route(url, route => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

/**
 * Wait for a specific network request to complete
 */
export async function waitForRequest(
  page: Page, 
  url: string | RegExp
): Promise<import('@playwright/test').Request> {
  return page.waitForRequest(request => {
    return request.url().includes(url as string) || 
           (url instanceof RegExp && url.test(request.url()));
  });
}

/**
 * Clear Supabase auth session for testing
 */
export async function clearAuthSession(page: Page): Promise<void> {
  // Clear cookies to remove any existing session
  await page.context().clearCookies();
  
  // Also clear any local storage that might contain auth state
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

/**
 * Get the current Supabase session from the browser
 */
export async function getSupabaseSession(page: Page): Promise<any> {
  return page.evaluate(async () => {
    // @ts-ignore - Supabase is available in the browser
    const { data: { session } } = await window.supabase.auth.getSession();
    return session;
  });
}

/**
 * Check if user is authenticated in the browser
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const session = await getSupabaseSession(page);
  return !!session?.user;
}
