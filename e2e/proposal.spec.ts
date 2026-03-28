import { test, expect } from './fixtures/auth';

test.describe('Proposal Submission Flow (Freelancer)', () => {
  test.use({ storageState: 'e2e/.auth/freelancer.json' });

  test('freelancer can view a job and submit a proposal', async ({ page }) => {
    // Navigate to job board
    await page.goto('/jobs');
    
    // Wait for jobs to load
    await page.waitForSelector('text=/job|مشروع|projet/i', { timeout: 10000 });
    
    // Click on the first available job
    const firstJobCard = page.locator('article, [data-testid="job-card"], .job-card, a[href*="/jobs/"]').first();
    await firstJobCard.click();
    
    // Wait for job detail page
    await expect(page).toHaveURL(/\/jobs\/[^/]+$/, { timeout: 10000 });
    
    // Verify job details are visible
    await expect(page.locator('h1, h2')).toBeVisible();
    
    // Click "Submit Proposal" or "Apply" button
    const applyButton = page.locator('button:has-text("Apply"), button:has-text("Submit"), button:has-text("تقديم"), button:has-text("عرض")').first();
    await applyButton.click();
    
    // Wait for proposal modal to open
    await expect(page.locator('text=/proposal|عرض|proposition/i')).toBeVisible({ timeout: 5000 });
    
    // Fill proposal form
    const bidAmount = '350';
    await page.fill('input[name="bid_amount"]', bidAmount);
    
    // Select delivery time
    const deliverySelect = page.locator('select[name="delivery_days"]');
    if (await deliverySelect.isVisible()) {
      await deliverySelect.selectOption('7');
    }
    
    // Fill cover letter (minimum 100 characters)
    const coverLetter = 'I am very interested in this project. I have extensive experience in the required skills and can deliver high-quality work within the specified timeframe. I look forward to working with you.';
    await page.fill('textarea[name="cover_letter"]', coverLetter);
    
    // Submit proposal
    await page.click('button[type="submit"]:has-text("Submit"), button[type="submit"]:has-text("إرسال")');
    
    // Wait for success message
    await expect(page.locator('text=/success|نجح|تم.*إرسال/i')).toBeVisible({ timeout: 10000 });
    
    // Modal should close
    await expect(page.locator('textarea[name="cover_letter"]')).not.toBeVisible({ timeout: 5000 });
  });

  test('proposal form validation works', async ({ page }) => {
    await page.goto('/jobs');
    
    // Click on first job
    await page.locator('article, [data-testid="job-card"], a[href*="/jobs/"]').first().click();
    await page.waitForURL(/\/jobs\/[^/]+$/);
    
    // Open proposal modal
    await page.click('button:has-text("Apply"), button:has-text("تقديم")');
    await page.waitForSelector('textarea[name="cover_letter"]', { timeout: 5000 });
    
    // Try to submit without filling required fields
    await page.click('button[type="submit"]:has-text("Submit"), button[type="submit"]:has-text("إرسال")');
    
    // Should show validation errors
    const errorMessage = page.locator('text=/required|مطلوب|100.*حرف|minimum/i');
    await expect(errorMessage.first()).toBeVisible({ timeout: 3000 });
  });

  test('duplicate proposal is prevented', async ({ page }) => {
    // Navigate to jobs
    await page.goto('/jobs');
    await page.waitForSelector('article, [data-testid="job-card"]', { timeout: 10000 });
    
    // Find a job we haven't applied to yet, or use the first one
    const jobCard = page.locator('article, [data-testid="job-card"], a[href*="/jobs/"]').first();
    await jobCard.click();
    await page.waitForURL(/\/jobs\/[^/]+$/);
    
    // Check if we've already applied
    const alreadyApplied = await page.locator('text=/already.*applied|تم.*التقديم|déjà.*postulé/i').isVisible().catch(() => false);
    
    if (alreadyApplied) {
      // If already applied, verify the apply button is disabled or shows different text
      const applyButton = page.locator('button:has-text("Applied"), button:has-text("تم التقديم")');
      await expect(applyButton).toBeVisible();
    } else {
      // Submit first proposal
      await page.click('button:has-text("Apply"), button:has-text("تقديم")');
      await page.fill('input[name="bid_amount"]', '300');
      await page.fill('textarea[name="cover_letter"]', 'This is my first proposal for this job. I have the required skills and experience to complete this project successfully.');
      await page.click('button[type="submit"]:has-text("Submit"), button[type="submit"]:has-text("إرسال")');
      
      // Wait for success
      await page.waitForTimeout(2000);
      
      // Try to apply again - button should be disabled or show "Applied"
      const applyButtonAfter = page.locator('button:has-text("Apply"), button:has-text("تقديم")');
      const isDisabled = await applyButtonAfter.isDisabled().catch(() => true);
      const showsApplied = await page.locator('text=/applied|تم.*التقديم/i').isVisible().catch(() => false);
      
      expect(isDisabled || showsApplied).toBeTruthy();
    }
  });

  test('proposal appears in MyProposals', async ({ page }) => {
    // First, submit a proposal
    await page.goto('/jobs');
    await page.waitForSelector('article, [data-testid="job-card"]', { timeout: 10000 });
    
    const jobCard = page.locator('article, [data-testid="job-card"], a[href*="/jobs/"]').first();
    
    // Get job title for verification
    const jobTitle = await jobCard.locator('h2, h3, [data-testid="job-title"]').first().textContent();
    
    await jobCard.click();
    await page.waitForURL(/\/jobs\/[^/]+$/);
    
    // Check if already applied
    const alreadyApplied = await page.locator('text=/already.*applied|تم.*التقديم/i').isVisible().catch(() => false);
    
    if (!alreadyApplied) {
      // Submit proposal
      await page.click('button:has-text("Apply"), button:has-text("تقديم")');
      await page.fill('input[name="bid_amount"]', '400');
      await page.fill('textarea[name="cover_letter"]', 'I am submitting this proposal to test the MyProposals page functionality. I have relevant experience.');
      await page.click('button[type="submit"]:has-text("Submit"), button[type="submit"]:has-text("إرسال")');
      await page.waitForTimeout(2000);
    }
    
    // Navigate to My Proposals page
    await page.goto('/my-proposals');
    
    // Wait for proposals to load
    await page.waitForSelector('text=/proposal|عرض|proposition/i', { timeout: 10000 });
    
    // Verify the proposal appears in the list
    if (jobTitle) {
      const proposalCard = page.locator(`text=${jobTitle}`);
      await expect(proposalCard).toBeVisible({ timeout: 5000 });
    }
    
    // Verify proposal status is shown
    await expect(page.locator('text=/pending|قيد.*المراجعة|en.*attente/i')).toBeVisible();
  });

  test('platform fee calculation is displayed', async ({ page }) => {
    await page.goto('/jobs');
    await page.locator('article, [data-testid="job-card"], a[href*="/jobs/"]').first().click();
    await page.waitForURL(/\/jobs\/[^/]+$/);
    
    // Open proposal modal
    await page.click('button:has-text("Apply"), button:has-text("تقديم")');
    await page.waitForSelector('input[name="bid_amount"]', { timeout: 5000 });
    
    // Enter bid amount
    await page.fill('input[name="bid_amount"]', '1000');
    
    // Wait for calculation to update
    await page.waitForTimeout(500);
    
    // Verify platform fee is shown (10% = 100)
    await expect(page.locator('text=/100|10%|رسوم.*المنصة|platform.*fee/i')).toBeVisible();
    
    // Verify net amount is shown (900)
    await expect(page.locator('text=/900|ستحصل|you.*receive/i')).toBeVisible();
  });

  test('file attachment works in proposal', async ({ page }) => {
    await page.goto('/jobs');
    await page.locator('article, [data-testid="job-card"], a[href*="/jobs/"]').first().click();
    await page.waitForURL(/\/jobs\/[^/]+$/);
    
    // Open proposal modal
    await page.click('button:has-text("Apply"), button:has-text("تقديم")');
    await page.waitForSelector('input[name="bid_amount"]', { timeout: 5000 });
    
    // Look for file upload button
    const uploadButton = page.locator('button:has-text("Upload"), button:has-text("رفع"), input[type="file"]');
    
    if (await uploadButton.first().isVisible()) {
      // Create a test file
      const fileInput = page.locator('input[type="file"]');
      
      // Set files (this simulates file selection)
      await fileInput.setInputFiles({
        name: 'test-portfolio.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('This is a test PDF file content'),
      });
      
      // Verify file is added
      await expect(page.locator('text=/test-portfolio.pdf/i')).toBeVisible({ timeout: 3000 });
    }
  });
});
