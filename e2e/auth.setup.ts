import { test as setup, expect } from '@playwright/test';
import { TEST_USERS, login } from './fixtures/auth';

const freelancerAuthFile = 'e2e/.auth/freelancer.json';
const clientAuthFile = 'e2e/.auth/client.json';

setup('authenticate as freelancer', async ({ page }) => {
  try {
    await login(page, TEST_USERS.freelancer.email, TEST_USERS.freelancer.password);
  } catch (error) {
    console.log('Initial login failed, waiting for page to load and retrying...');
    await page.waitForTimeout(2000);
    await page.reload();
    await login(page, TEST_USERS.freelancer.email, TEST_USERS.freelancer.password);
  }
  
  // Verify we're logged in with extended timeout
  await expect(page).toHaveURL(/\/(dashboard|freelancer|onboarding)/, { timeout: 15000 });
  
  // Wait for navigation to complete
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
    // Network idle timeout is acceptable
  });
  
  // Save signed-in state
  await page.context().storageState({ path: freelancerAuthFile });
});

setup('authenticate as client', async ({ page }) => {
  try {
    await login(page, TEST_USERS.client.email, TEST_USERS.client.password);
  } catch (error) {
    console.log('Initial login failed, waiting for page to load and retrying...');
    await page.waitForTimeout(2000);
    await page.reload();
    await login(page, TEST_USERS.client.email, TEST_USERS.client.password);
  }
  
  // Verify we're logged in with extended timeout
  await expect(page).toHaveURL(/\/(dashboard|client|onboarding)/, { timeout: 15000 });
  
  // Wait for navigation to complete
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
    // Network idle timeout is acceptable
  });
  
  // Save signed-in state
  await page.context().storageState({ path: clientAuthFile });
});
