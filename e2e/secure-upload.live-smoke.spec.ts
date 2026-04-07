import { test, expect } from '@playwright/test';

test.describe('Secure Upload Live Smoke', () => {
  test.use({ storageState: 'e2e/.auth/client.json' });

  test('client job-post attachment upload hits live secure-upload successfully', async ({ page }) => {
    await page.goto('/jobs/new');

    const jobTitle = `Live Upload Smoke ${Date.now()}`;

    await page.fill('input[name="title"]', jobTitle);

    await page.click('button:has-text("اختر التصنيف"), button:has-text("Select category")');
    await page.click('button:has-text("Development"), button:has-text("Développement"), button:has-text("التطوير")');

    await page.click('button:has-text("اختر التخصص الفرعي"), button:has-text("Select subcategory")');
    await page.locator('button').filter({ hasText: /web development|تطوير الويب|développement web|frontend|front-end/i }).first().click();

    await page.fill(
      'textarea[name="description"]',
      'This is a live secure upload smoke test job description with enough detail to pass validation and trigger the real attachment upload path.'
    );

    const skillChip = page.locator('button').filter({ hasText: /web development|react|تطوير الويب/i }).first();
    if (await skillChip.isVisible()) {
      await skillChip.click();
    }

    await page.locator('input[type="file"]').setInputFiles({
      name: 'live-secure-upload-smoke.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('live secure upload smoke'),
    });

    await expect(page.locator('text=/live-secure-upload-smoke\\.txt/i')).toBeVisible({ timeout: 5000 });

    await page.click('button:has-text("Next"), button:has-text("التالي")');

    await page.fill('input[name="budget_min"]', '100');
    await page.fill('input[name="budget_max"]', '200');
    await page.selectOption('select[name="duration"]', { index: 1 }).catch(async () => {
      await page.click('text=/أسبوع|week|semaine/i');
    });

    const deadlineInput = page.locator('input[name="deadline"]');
    if (await deadlineInput.isVisible()) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 7);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      await deadlineInput.fill(`${yyyy}-${mm}-${dd}`);
    }

    await page.click('button:has-text("Next"), button:has-text("التالي")');
    await page.click('button:has-text("Next"), button:has-text("التالي")');

    const uploadResponsePromise = page.waitForResponse((response) => {
      return response.url().includes('/functions/v1/secure-upload') && response.request().method() === 'POST';
    });

    await page.click('button[type="submit"], button:has-text("Publish job"), button:has-text("Publish"), button:has-text("نشر")');

    const uploadResponse = await uploadResponsePromise;
    expect(uploadResponse.status()).toBe(200);

    const uploadPayload = await uploadResponse.json();
    expect(uploadPayload.bucket).toBe('attachments');
    expect(String(uploadPayload.path)).toContain('/');
    expect(String(uploadPayload.path)).toMatch(/^[0-9a-f-]+\/.+\.txt$/i);
  });
});
