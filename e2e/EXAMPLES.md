# E2E Test Examples & Common Scenarios

## 🎯 Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run specific test file
```bash
npx playwright test e2e/auth.spec.ts
npx playwright test e2e/job-post.spec.ts
npx playwright test e2e/proposal.spec.ts
npx playwright test e2e/wallet.spec.ts
```

### Run specific test by name
```bash
npx playwright test -g "user can log in"
npx playwright test -g "job appears on JobBoard"
```

### Run tests in specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
npx playwright test --headed
```

### Run tests in UI mode (interactive)
```bash
npm run test:e2e:ui
npx playwright test --ui
```

### Run tests in debug mode
```bash
npm run test:e2e:debug
npx playwright test --debug
```

## 🔍 Debugging

### Debug specific test
```bash
npx playwright test e2e/auth.spec.ts --debug
```

### Debug test by name
```bash
npx playwright test -g "user can log in" --debug
```

### View test report
```bash
npm run test:e2e:report
npx playwright show-report
```

### View trace for failed test
```bash
npx playwright show-trace test-results/auth-spec-user-can-log-in/trace.zip
```

### Run with verbose logging
```bash
DEBUG=pw:api npx playwright test
```

## 📊 Reporting

### Generate HTML report
```bash
npx playwright test --reporter=html
```

### Generate JSON report
```bash
npx playwright test --reporter=json
```

### Generate multiple reports
```bash
npx playwright test --reporter=html,json
```

### Open last report
```bash
npx playwright show-report
```

## 🎨 Filtering Tests

### Run only auth tests
```bash
npx playwright test e2e/auth.spec.ts
```

### Run only freelancer tests
```bash
npx playwright test e2e/proposal.spec.ts e2e/wallet.spec.ts
```

### Run only client tests
```bash
npx playwright test e2e/job-post.spec.ts
```

### Skip specific test
```bash
# In test file, use test.skip()
test.skip('test to skip', async ({ page }) => {
  // This test will be skipped
});
```

### Run only specific test
```bash
# In test file, use test.only()
test.only('only this test', async ({ page }) => {
  // Only this test will run
});
```

## 🔧 Configuration

### Change base URL
```bash
E2E_BASE_URL=http://localhost:3000 npx playwright test
```

### Change timeout
```bash
# In test file
test.setTimeout(60000); // 60 seconds
```

### Change retries
```bash
npx playwright test --retries=3
```

### Change workers (parallel execution)
```bash
npx playwright test --workers=4
```

## 🧪 Test Development

### Create new test file
```bash
# Create file: e2e/my-feature.spec.ts
```

```typescript
import { test, expect } from './fixtures/auth';

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/my-feature');
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

### Use authenticated context
```typescript
test.describe('Protected Feature', () => {
  test.use({ storageState: 'e2e/.auth/freelancer.json' });
  
  test('freelancer can access', async ({ page }) => {
    await page.goto('/freelancer/dashboard');
    // Test authenticated functionality
  });
});
```

### Create test data
```typescript
import { createJobData } from './fixtures/test-data';

test('create job', async ({ page }) => {
  const jobData = createJobData({
    title: 'Custom Job Title',
    budgetMin: 200,
  });
  
  // Use jobData in test
});
```

## 📸 Screenshots & Videos

### Take screenshot in test
```typescript
test('my test', async ({ page }) => {
  await page.goto('/');
  await page.screenshot({ path: 'screenshot.png' });
});
```

### Record video
```typescript
// In playwright.config.ts
use: {
  video: 'on', // or 'retain-on-failure'
}
```

### Full page screenshot
```typescript
await page.screenshot({ 
  path: 'screenshot.png',
  fullPage: true 
});
```

## 🌐 Network

### Wait for API response
```typescript
test('wait for API', async ({ page }) => {
  const responsePromise = page.waitForResponse(
    response => response.url().includes('/api/jobs') && response.status() === 200
  );
  
  await page.click('button');
  const response = await responsePromise;
  
  expect(response.ok()).toBeTruthy();
});
```

### Mock API response
```typescript
test('mock API', async ({ page }) => {
  await page.route('**/api/jobs', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ jobs: [] }),
    });
  });
  
  await page.goto('/jobs');
});
```

### Intercept network requests
```typescript
test('intercept requests', async ({ page }) => {
  page.on('request', request => {
    console.log('Request:', request.url());
  });
  
  page.on('response', response => {
    console.log('Response:', response.url(), response.status());
  });
  
  await page.goto('/');
});
```

## 🎭 Multiple Contexts

### Test with multiple users
```typescript
test('two users interact', async ({ browser }) => {
  // Freelancer context
  const freelancerContext = await browser.newContext({
    storageState: 'e2e/.auth/freelancer.json'
  });
  const freelancerPage = await freelancerContext.newPage();
  
  // Client context
  const clientContext = await browser.newContext({
    storageState: 'e2e/.auth/client.json'
  });
  const clientPage = await clientContext.newPage();
  
  // Both users interact
  await freelancerPage.goto('/jobs');
  await clientPage.goto('/jobs/new');
  
  // Cleanup
  await freelancerContext.close();
  await clientContext.close();
});
```

## 📱 Mobile Testing

### Test mobile viewport
```typescript
import { devices } from '@playwright/test';

test.use({
  ...devices['iPhone 13'],
});

test('mobile test', async ({ page }) => {
  await page.goto('/');
  // Test mobile-specific behavior
});
```

### Test tablet viewport
```typescript
test.use({
  ...devices['iPad Pro'],
});
```

## ♿ Accessibility Testing

### Check for accessibility violations
```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('accessibility', async ({ page }) => {
  await page.goto('/');
  await injectAxe(page);
  await checkA11y(page);
});
```

## 🔄 Retry Logic

### Retry specific action
```typescript
test('retry action', async ({ page }) => {
  await page.goto('/');
  
  // Retry clicking until element is visible
  await expect(async () => {
    await page.click('button');
    await expect(page.locator('.result')).toBeVisible();
  }).toPass({ timeout: 10000 });
});
```

## 🧹 Cleanup

### Clear auth state
```bash
rm -rf e2e/.auth
```

### Clear test results
```bash
rm -rf test-results
rm -rf playwright-report
```

### Clear all generated files
```bash
rm -rf e2e/.auth test-results playwright-report
```

## 📦 CI/CD Examples

### Run in CI mode
```bash
CI=true npm run test:e2e
```

### Generate CI-friendly report
```bash
npx playwright test --reporter=github
```

### Upload artifacts in GitHub Actions
```yaml
- name: Upload test results
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

## 🎓 Learning Examples

### Simple test
```typescript
test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Khedma/);
});
```

### Form submission test
```typescript
test('submit form', async ({ page }) => {
  await page.goto('/contact');
  await page.fill('input[name="name"]', 'John Doe');
  await page.fill('input[name="email"]', 'john@example.com');
  await page.click('button[type="submit"]');
  await expect(page.locator('.success')).toBeVisible();
});
```

### Navigation test
```typescript
test('navigate between pages', async ({ page }) => {
  await page.goto('/');
  await page.click('a[href="/about"]');
  await expect(page).toHaveURL(/\/about/);
  await expect(page.locator('h1')).toContainText('About');
});
```

### Conditional test
```typescript
test('conditional logic', async ({ page }) => {
  await page.goto('/dashboard');
  
  const hasNotifications = await page.locator('.notification').isVisible();
  
  if (hasNotifications) {
    await page.click('.notification');
    await expect(page.locator('.notification-detail')).toBeVisible();
  }
});
```

## 🚀 Advanced Examples

### Test with file upload
```typescript
test('upload file', async ({ page }) => {
  await page.goto('/upload');
  
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('path/to/file.pdf');
  
  await page.click('button:has-text("Upload")');
  await expect(page.locator('.upload-success')).toBeVisible();
});
```

### Test with drag and drop
```typescript
test('drag and drop', async ({ page }) => {
  await page.goto('/kanban');
  
  const source = page.locator('.task-1');
  const target = page.locator('.column-done');
  
  await source.dragTo(target);
  
  await expect(target.locator('.task-1')).toBeVisible();
});
```

### Test with keyboard shortcuts
```typescript
test('keyboard shortcuts', async ({ page }) => {
  await page.goto('/editor');
  
  // Ctrl+S to save
  await page.keyboard.press('Control+S');
  
  await expect(page.locator('.saved-indicator')).toBeVisible();
});
```

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
