import { test as setup, expect } from '@playwright/test';
import { TEST_USERS, login } from './fixtures/auth';

const freelancerAuthFile = 'e2e/.auth/freelancer.json';
const clientAuthFile = 'e2e/.auth/client.json';

setup('authenticate as freelancer', async ({ page }) => {
  await login(page, TEST_USERS.freelancer.email, TEST_USERS.freelancer.password);
  
  // Verify we're logged in
  await expect(page).toHaveURL(/\/(dashboard|freelancer)/, { timeout: 10000 });
  
  // Save signed-in state
  await page.context().storageState({ path: freelancerAuthFile });
});

setup('authenticate as client', async ({ page }) => {
  await login(page, TEST_USERS.client.email, TEST_USERS.client.password);
  
  // Verify we're logged in
  await expect(page).toHaveURL(/\/(dashboard|client)/, { timeout: 10000 });
  
  // Save signed-in state
  await page.context().storageState({ path: clientAuthFile });
});
