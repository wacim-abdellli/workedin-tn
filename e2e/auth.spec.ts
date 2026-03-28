import { test, expect } from '@playwright/test';
import { TEST_USERS, logout } from './fixtures/auth';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test('user can sign up with email', async ({ page }) => {
    await page.goto('/signup');
    
    // Verify signup page loaded
    await expect(page.locator('h2, h1')).toContainText(/sign up|إنشاء حساب|créer un compte/i);
    
    // Generate unique email for this test run
    const uniqueEmail = `test-${Date.now()}@khedma.tn`;
    const password = 'TestPassword123!';
    
    // Fill signup form
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to onboarding or dashboard
    await expect(page).toHaveURL(/\/(onboarding|dashboard)/, { timeout: 15000 });
    
    // Verify user is authenticated (check for user menu or profile link)
    const isAuthenticated = await page.locator('[aria-label*="menu"], [data-testid="user-menu"], text=/profile|الملف الشخصي/i').isVisible({ timeout: 5000 }).catch(() => false);
    expect(isAuthenticated).toBeTruthy();
  });

  test('user can log in with email and password', async ({ page }) => {
    await page.goto('/login');
    
    // Verify login page loaded
    await expect(page.locator('h2, h1')).toContainText(/login|تسجيل الدخول|connexion/i);
    
    // Fill login form
    await page.fill('input[type="email"]', TEST_USERS.freelancer.email);
    await page.fill('input[type="password"]', TEST_USERS.freelancer.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect after successful login
    await expect(page).toHaveURL(/\/(dashboard|freelancer)/, { timeout: 15000 });
    
    // Verify authenticated state
    const isAuthenticated = await page.locator('[aria-label*="menu"], [data-testid="user-menu"]').isVisible({ timeout: 5000 }).catch(() => false);
    expect(isAuthenticated).toBeTruthy();
  });

  test('login fails with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=/invalid.*credentials|بيانات.*غير.*صحيحة|identifiants.*invalides/i')).toBeVisible({ timeout: 5000 });
    
    // Should remain on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('protected route redirects to login when unauthenticated', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    
    // Verify login page is shown
    await expect(page.locator('h2, h1')).toContainText(/login|تسجيل الدخول|connexion/i);
  });

  test('user can log out', async ({ page }) => {
    // First log in
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USERS.client.email);
    await page.fill('input[type="password"]', TEST_USERS.client.password);
    await page.click('button[type="submit"]');
    
    // Wait for successful login
    await expect(page).toHaveURL(/\/(dashboard|client)/, { timeout: 15000 });
    
    // Now log out
    await logout(page);
    
    // Verify we're logged out (redirected to home or login)
    await expect(page).toHaveURL(/\/(login|$)/);
    
    // Try to access protected route - should redirect to login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('password visibility toggle works', async ({ page }) => {
    await page.goto('/login');
    
    const passwordInput = page.locator('input[type="password"]').first();
    const toggleButton = page.locator('button[aria-label*="password"], button:has-text("show"), button:has-text("hide")').first();
    
    // Initially should be password type
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle
    await toggleButton.click();
    
    // Should change to text type
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click again to hide
    await toggleButton.click();
    
    // Should be password again
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('forgot password link is present', async ({ page }) => {
    await page.goto('/login');
    
    // Check for forgot password link
    const forgotPasswordLink = page.locator('a[href*="forgot-password"], text=/forgot.*password|نسيت.*كلمة.*المرور/i');
    await expect(forgotPasswordLink).toBeVisible();
    
    // Click and verify navigation
    await forgotPasswordLink.click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });
});
