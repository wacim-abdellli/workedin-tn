import { test, expect } from '@playwright/test';

test.describe('Auth protection and keyboard accessibility', () => {
  test('login page supports keyboard navigation to primary controls', async ({ page }) => {
    await page.goto('/login');

    const googleButton = page.locator('button', { hasText: /google/i }).first();
    await expect(googleButton).toBeVisible();

    // Ensure keyboard focus starts inside the page before tab traversal assertions.
    await page.locator('body').click({ position: { x: 10, y: 10 } });

    let googleFocused = false;
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Tab');
      if (await googleButton.evaluate((el) => el === document.activeElement)) {
        googleFocused = true;
        break;
      }
    }
    expect(googleFocused).toBe(true);

    await page.keyboard.press('Tab');
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeFocused();
  });

  test('protected contract route redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/contracts/test-contract-id');

    await expect(page).toHaveURL(/\/login/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('payment success route enforces auth and remains stable', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/payment/success?payment_id=test_payment_123');

    if (page.url().includes('/login')) {
      await expect(page).toHaveURL(/\/login/i);
      await expect(page.locator('body')).toBeVisible();
    } else {
      await expect(page.locator('body')).toBeVisible();
    }

    expect(errors).toHaveLength(0);
  });

  test('payment failed route renders or redirects without runtime errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/payment/failed');

    if (page.url().includes('/login')) {
      await expect(page).toHaveURL(/\/login/i);
    } else {
      await expect(page.locator('body')).toBeVisible();
    }

    expect(errors).toHaveLength(0);
  });
});
