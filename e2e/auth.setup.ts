import { test as setup, expect } from '@playwright/test';
import { TEST_USERS, login } from './fixtures/auth';

const freelancerAuthFile = 'e2e/.auth/freelancer.json';
const clientAuthFile = 'e2e/.auth/client.json';
const AUTHENTICATED_PATH_RE = /^(?:\/|\/dashboard(?:\/.*)?|\/onboarding(?:\/.*)?|\/freelancer(?:\/.*)?|\/client(?:\/.*)?)$/;

setup('authenticate as freelancer', async ({ page }) => {
  try {
    await login(page, TEST_USERS.freelancer.email, TEST_USERS.freelancer.password);
  } catch (error) {
    console.log('Initial login failed, waiting for page to load and retrying...');
    await page.waitForTimeout(2000);
    await page.reload();
    await login(page, TEST_USERS.freelancer.email, TEST_USERS.freelancer.password);
  }
  
  await expect.poll(() => new URL(page.url()).pathname, { timeout: 15000 }).toMatch(AUTHENTICATED_PATH_RE);
  
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
  
  await expect.poll(() => new URL(page.url()).pathname, { timeout: 15000 }).toMatch(AUTHENTICATED_PATH_RE);
  
  // Wait for navigation to complete
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
    // Network idle timeout is acceptable
  });
  
  // Save signed-in state
  await page.context().storageState({ path: clientAuthFile });
});
