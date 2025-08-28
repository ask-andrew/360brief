import { Page } from '@playwright/test';

export async function clearAuthSession(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

export async function loginTestUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

export async function isAuthenticated(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return !!window.localStorage.getItem('sb-access-token');
  });
}
