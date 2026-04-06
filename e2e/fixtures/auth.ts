import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const AUTHENTICATED_PATH_RE = /^(?:\/|\/dashboard(?:\/.*)?|\/onboarding(?:\/.*)?|\/freelancer(?:\/.*)?|\/client(?:\/.*)?)$/;

// Test user credentials
export const TEST_USERS = {
  freelancer: {
    email: 'freelancer-test@khedma.tn',
    password: 'TestPassword123!',
    userType: 'freelancer' as const,
  },
  client: {
    email: 'client-test@khedma.tn',
    password: 'TestPassword123!',
    userType: 'client' as const,
  },
};

// Helper to sign up a new user
export async function signUp(page: Page, email: string, password: string, userType: 'freelancer' | 'client') {
  await page.goto('/signup');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect after signup
  await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 10000 });
}

// Helper to log in
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  
  // Wait for login form with extended timeout
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Authenticated users now commonly land on home first, then navigate deeper as needed.
  await page.waitForURL((url) => AUTHENTICATED_PATH_RE.test(url.pathname), { timeout: 15000 });
}

// Helper to log out
export async function logout(page: Page) {
  // Click user menu/avatar
  await page.click('[aria-label*="menu"], [data-testid="user-menu"]').catch(() => {
    // Fallback: look for logout button directly
  });
  
  // Click logout button
  await page.click('text=/تسجيل الخروج|Logout|Se déconnecter/i');
  
  // Wait for redirect to home or login
  await page.waitForURL(/\/(login|$)/, { timeout: 5000 });
}

// Extended test with authenticated contexts
type AuthFixtures = {
  authenticatedFreelancer: Page;
  authenticatedClient: Page;
};

// Playwright fixtures - eslint-disable is needed because ESLint's React plugin
// misidentifies Playwright's 'use()' function as a React hook
/* eslint-disable react-hooks/rules-of-hooks */
export const test = base.extend<AuthFixtures>({
  authenticatedFreelancer: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/freelancer.json' });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
  
  authenticatedClient: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/client.json' });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});
/* eslint-enable react-hooks/rules-of-hooks */

export { expect };
