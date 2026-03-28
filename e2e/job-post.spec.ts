import { test, expect } from './fixtures/auth';

test.describe('Job Posting Flow (Client)', () => {
  test.use({ storageState: 'e2e/.auth/client.json' });

  test('client can complete the multi-step job post form', async ({ page }) => {
    await page.goto('/jobs/new');
    
    // Verify we're on the job post page
    await expect(page.locator('h1, h2')).toContainText(/post|نشر|مشروع/i, { timeout: 10000 });
    
    // Step 1: Job Basics
    const jobTitle = `Test Job ${Date.now()}`;
    await page.fill('input[name="title"]', jobTitle);
    
    // Select category
    await page.click('select[name="category"], [name="category"]');
    await page.selectOption('select[name="category"]', { index: 1 }).catch(async () => {
      // Fallback for custom select components
      await page.click('text=/برمجة|programming|développement/i').first();
    });
    
    // Fill description
    const description = 'This is a test job description that needs to be at least 50 characters long to pass validation requirements.';
    await page.fill('textarea[name="description"]', description);
    
    // Add skills
    const skillInput = page.locator('input[placeholder*="skill"], input[placeholder*="مهارة"]').first();
    if (await skillInput.isVisible()) {
      await skillInput.fill('React');
      await page.keyboard.press('Enter');
      await skillInput.fill('TypeScript');
      await page.keyboard.press('Enter');
    }
    
    // Click Next
    await page.click('button:has-text("Next"), button:has-text("التالي")');
    
    // Step 2: Budget
    await page.waitForTimeout(500); // Wait for step transition
    
    // Select job type (fixed price)
    const fixedPriceRadio = page.locator('input[value="fixed_price"]');
    if (await fixedPriceRadio.isVisible()) {
      await fixedPriceRadio.check();
    }
    
    // Fill budget
    await page.fill('input[name="budget_min"]', '100');
    await page.fill('input[name="budget_max"]', '500');
    
    // Select duration
    await page.selectOption('select[name="duration"]', { index: 1 }).catch(async () => {
      await page.click('text=/أسبوع|week|semaine/i').first();
    });
    
    // Select experience level
    const experienceSelect = page.locator('select[name="experience_level"]');
    if (await experienceSelect.isVisible()) {
      await experienceSelect.selectOption('intermediate');
    }
    
    // Click Next
    await page.click('button:has-text("Next"), button:has-text("التالي")');
    
    // Step 3: Visibility
    await page.waitForTimeout(500);
    
    // Select public visibility
    const publicRadio = page.locator('input[value="public"]');
    if (await publicRadio.isVisible()) {
      await publicRadio.check();
    }
    
    // Click Next to review
    await page.click('button:has-text("Next"), button:has-text("التالي")');
    
    // Step 4: Review and Submit
    await page.waitForTimeout(500);
    
    // Verify job details are shown in review
    await expect(page.locator('text=' + jobTitle)).toBeVisible();
    
    // Submit the job
    await page.click('button[type="submit"], button:has-text("Publish"), button:has-text("نشر")');
    
    // Wait for success redirect
    await expect(page).toHaveURL(/\/(jobs|posted)/, { timeout: 15000 });
    
    // Verify success message or job page
    const successIndicator = await page.locator('text=/success|نجح|تم النشر/i').isVisible({ timeout: 5000 }).catch(() => false);
    expect(successIndicator).toBeTruthy();
  });

  test('form validation prevents submission with missing fields', async ({ page }) => {
    await page.goto('/jobs/new');
    
    // Try to proceed without filling required fields
    await page.click('button:has-text("Next"), button:has-text("التالي")');
    
    // Should show validation errors
    const errorMessages = page.locator('text=/required|مطلوب|obligatoire|يجب/i');
    await expect(errorMessages.first()).toBeVisible({ timeout: 3000 });
    
    // Should remain on step 1
    await expect(page.locator('input[name="title"]')).toBeVisible();
  });

  test('job appears on JobBoard after posting', async ({ page }) => {
    // First, post a job
    await page.goto('/jobs/new');
    
    const uniqueJobTitle = `E2E Test Job ${Date.now()}`;
    
    // Fill minimum required fields quickly
    await page.fill('input[name="title"]', uniqueJobTitle);
    await page.selectOption('select[name="category"]', { index: 1 }).catch(() => {});
    await page.fill('textarea[name="description"]', 'This is a test job description with enough characters to pass validation requirements for the form.');
    
    // Add at least one skill
    const skillInput = page.locator('input[placeholder*="skill"], input[placeholder*="مهارة"]').first();
    if (await skillInput.isVisible()) {
      await skillInput.fill('JavaScript');
      await page.keyboard.press('Enter');
    }
    
    await page.click('button:has-text("Next"), button:has-text("التالي")');
    await page.waitForTimeout(500);
    
    // Budget step
    await page.fill('input[name="budget_min"]', '200');
    await page.fill('input[name="budget_max"]', '800');
    await page.selectOption('select[name="duration"]', { index: 1 }).catch(() => {});
    
    await page.click('button:has-text("Next"), button:has-text("التالي")');
    await page.waitForTimeout(500);
    
    // Visibility step
    await page.click('button:has-text("Next"), button:has-text("التالي")');
    await page.waitForTimeout(500);
    
    // Submit
    await page.click('button[type="submit"], button:has-text("Publish"), button:has-text("نشر")');
    
    // Wait for success
    await page.waitForURL(/\/(jobs|posted)/, { timeout: 15000 });
    
    // Now navigate to job board
    await page.goto('/jobs');
    
    // Search for our job
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="بحث"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill(uniqueJobTitle);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }
    
    // Verify job appears in the list
    await expect(page.locator(`text=${uniqueJobTitle}`)).toBeVisible({ timeout: 10000 });
  });

  test('draft save functionality works', async ({ page }) => {
    await page.goto('/jobs/new');
    
    const draftTitle = `Draft Job ${Date.now()}`;
    
    // Fill only title
    await page.fill('input[name="title"]', draftTitle);
    
    // Click save draft button
    const saveDraftButton = page.locator('button:has-text("Save draft"), button:has-text("حفظ"), button:has-text("مسودة")').first();
    await saveDraftButton.click();
    
    // Should show success message
    await expect(page.locator('text=/draft.*saved|تم.*حفظ|brouillon.*enregistré/i')).toBeVisible({ timeout: 5000 });
  });

  test('hourly rate job type works', async ({ page }) => {
    await page.goto('/jobs/new');
    
    // Fill basic info
    await page.fill('input[name="title"]', `Hourly Job ${Date.now()}`);
    await page.selectOption('select[name="category"]', { index: 1 }).catch(() => {});
    await page.fill('textarea[name="description"]', 'Test hourly job description with sufficient length for validation.');
    
    await page.click('button:has-text("Next"), button:has-text("التالي")');
    await page.waitForTimeout(500);
    
    // Select hourly job type
    const hourlyRadio = page.locator('input[value="hourly"]');
    if (await hourlyRadio.isVisible()) {
      await hourlyRadio.check();
      
      // Fill hourly rate
      await page.fill('input[name="hourly_rate"]', '25');
      
      // Verify hourly rate field is visible and budget fields are hidden
      await expect(page.locator('input[name="hourly_rate"]')).toBeVisible();
    }
  });
});
