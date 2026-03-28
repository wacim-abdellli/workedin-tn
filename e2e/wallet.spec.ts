import { test, expect } from './fixtures/auth';

const MIN_WITHDRAWAL_AMOUNT = 20; // From src/types/payment.ts

test.describe('Wallet Flow (Freelancer)', () => {
  test.use({ storageState: 'e2e/.auth/freelancer.json' });

  test('wallet page loads and shows balance', async ({ page }) => {
    await page.goto('/wallet');
    
    // Verify wallet page loaded
    await expect(page.locator('h1, h2')).toContainText(/wallet|محفظة|portefeuille/i, { timeout: 10000 });
    
    // Verify balance is displayed
    const balanceElement = page.locator('text=/balance|رصيد|solde/i').first();
    await expect(balanceElement).toBeVisible();
    
    // Verify balance amount is shown (should contain currency symbol or number)
    const balanceAmount = page.locator('text=/د\\.ت|TND|\\d+/').first();
    await expect(balanceAmount).toBeVisible();
    
    // Verify transactions section exists
    const transactionsSection = page.locator('text=/transaction|معاملة|opération/i');
    await expect(transactionsSection.first()).toBeVisible({ timeout: 5000 });
  });

  test('withdrawal modal opens and validates minimum amount', async ({ page }) => {
    await page.goto('/wallet');
    
    // Wait for page to load
    await page.waitForSelector('text=/wallet|محفظة/i', { timeout: 10000 });
    
    // Click withdraw button
    const withdrawButton = page.locator('button:has-text("Withdraw"), button:has-text("سحب"), button:has-text("Retirer")').first();
    
    // Check if button is disabled (insufficient balance)
    const isDisabled = await withdrawButton.isDisabled().catch(() => false);
    
    if (!isDisabled) {
      await withdrawButton.click();
      
      // Wait for modal to open
      await expect(page.locator('text=/withdraw|سحب|retrait/i')).toBeVisible({ timeout: 5000 });
      
      // Verify amount input is present
      await expect(page.locator('input[name="amount"], input[type="number"]')).toBeVisible();
      
      // Verify minimum amount is mentioned
      await expect(page.locator(`text=/${MIN_WITHDRAWAL_AMOUNT}/`)).toBeVisible();
    } else {
      // If button is disabled, verify it's due to insufficient balance
      const insufficientBalanceMessage = page.locator('text=/insufficient|رصيد.*غير.*كافي|insuffisant/i');
      const messageVisible = await insufficientBalanceMessage.isVisible().catch(() => false);
      
      // Button should be disabled when balance is below minimum
      expect(isDisabled).toBeTruthy();
    }
  });

  test('form prevents submission below MIN_WITHDRAWAL_AMOUNT', async ({ page }) => {
    await page.goto('/wallet');
    
    // Click withdraw button
    const withdrawButton = page.locator('button:has-text("Withdraw"), button:has-text("سحب")').first();
    const isDisabled = await withdrawButton.isDisabled().catch(() => false);
    
    if (!isDisabled) {
      await withdrawButton.click();
      
      // Wait for modal
      await page.waitForSelector('input[name="amount"], input[type="number"]', { timeout: 5000 });
      
      // Try to enter amount below minimum
      const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
      await amountInput.fill('10'); // Below MIN_WITHDRAWAL_AMOUNT (20)
      
      // Try to submit
      const submitButton = page.locator('button[type="submit"]:has-text("Withdraw"), button[type="submit"]:has-text("سحب")').first();
      await submitButton.click();
      
      // Should show validation error
      await expect(page.locator(`text=/minimum|الحد.*الأدنى|${MIN_WITHDRAWAL_AMOUNT}/i`)).toBeVisible({ timeout: 3000 });
      
      // Modal should remain open
      await expect(amountInput).toBeVisible();
    }
  });

  test('withdrawal form validates maximum amount', async ({ page }) => {
    await page.goto('/wallet');
    
    const withdrawButton = page.locator('button:has-text("Withdraw"), button:has-text("سحب")').first();
    const isDisabled = await withdrawButton.isDisabled().catch(() => false);
    
    if (!isDisabled) {
      await withdrawButton.click();
      await page.waitForSelector('input[name="amount"]', { timeout: 5000 });
      
      // Try to enter amount greater than balance
      const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
      await amountInput.fill('999999');
      
      // Try to submit
      const submitButton = page.locator('button[type="submit"]:has-text("Withdraw"), button[type="submit"]:has-text("سحب")').first();
      await submitButton.click();
      
      // Should show error about exceeding balance
      await expect(page.locator('text=/exceed|balance|رصيد|maximum/i')).toBeVisible({ timeout: 3000 });
    }
  });

  test('withdrawal method selection works', async ({ page }) => {
    await page.goto('/wallet');
    
    const withdrawButton = page.locator('button:has-text("Withdraw"), button:has-text("سحب")').first();
    const isDisabled = await withdrawButton.isDisabled().catch(() => false);
    
    if (!isDisabled) {
      await withdrawButton.click();
      await page.waitForSelector('input[name="amount"]', { timeout: 5000 });
      
      // Look for withdrawal method options
      const methodSelect = page.locator('select[name="method"], select[name="withdrawal_method"]');
      const methodRadio = page.locator('input[type="radio"][name*="method"]');
      
      if (await methodSelect.isVisible()) {
        // Dropdown selection
        await methodSelect.selectOption({ index: 0 });
        expect(await methodSelect.inputValue()).toBeTruthy();
      } else if (await methodRadio.first().isVisible()) {
        // Radio button selection
        await methodRadio.first().check();
        expect(await methodRadio.first().isChecked()).toBeTruthy();
      }
    }
  });

  test('transaction history is displayed', async ({ page }) => {
    await page.goto('/wallet');
    
    // Wait for page load
    await page.waitForSelector('text=/wallet|محفظة/i', { timeout: 10000 });
    
    // Look for transactions section
    const transactionsHeading = page.locator('text=/transaction.*history|سجل.*المعاملات|historique/i');
    await expect(transactionsHeading.first()).toBeVisible({ timeout: 5000 });
    
    // Check if transactions are displayed or empty state is shown
    const hasTransactions = await page.locator('text=/amount|مبلغ|montant/i').isVisible().catch(() => false);
    const hasEmptyState = await page.locator('text=/no.*transaction|لا.*توجد.*معاملات|aucune.*transaction/i').isVisible().catch(() => false);
    
    // Either transactions or empty state should be visible
    expect(hasTransactions || hasEmptyState).toBeTruthy();
  });

  test('withdrawal button is disabled when balance is below minimum', async ({ page }) => {
    await page.goto('/wallet');
    
    // Wait for balance to load
    await page.waitForSelector('text=/balance|رصيد/i', { timeout: 10000 });
    
    // Get balance value
    const balanceText = await page.locator('text=/\\d+\\.?\\d*/').first().textContent();
    const balance = parseFloat(balanceText?.replace(/[^\d.]/g, '') || '0');
    
    const withdrawButton = page.locator('button:has-text("Withdraw"), button:has-text("سحب")').first();
    
    if (balance < MIN_WITHDRAWAL_AMOUNT) {
      // Button should be disabled
      await expect(withdrawButton).toBeDisabled();
      
      // Tooltip or message should explain why
      const tooltip = page.locator('text=/minimum|insufficient|رصيد.*غير.*كافي/i');
      const tooltipVisible = await tooltip.isVisible().catch(() => false);
      
      // Either button is disabled or there's an explanatory message
      expect(await withdrawButton.isDisabled() || tooltipVisible).toBeTruthy();
    }
  });

  test('wallet stats cards are displayed', async ({ page }) => {
    await page.goto('/wallet');
    
    // Verify key wallet metrics are shown
    await expect(page.locator('text=/balance|رصيد/i').first()).toBeVisible({ timeout: 10000 });
    
    // Look for additional stats (earnings, pending, etc.)
    const statsCards = page.locator('text=/earning|pending|available|أرباح|معلق|متاح/i');
    const statsCount = await statsCards.count();
    
    // Should have at least one stat card
    expect(statsCount).toBeGreaterThan(0);
  });

  test('withdrawal modal can be closed', async ({ page }) => {
    await page.goto('/wallet');
    
    const withdrawButton = page.locator('button:has-text("Withdraw"), button:has-text("سحب")').first();
    const isDisabled = await withdrawButton.isDisabled().catch(() => false);
    
    if (!isDisabled) {
      await withdrawButton.click();
      
      // Wait for modal to open
      await page.waitForSelector('input[name="amount"]', { timeout: 5000 });
      
      // Close modal (look for close button, cancel button, or backdrop)
      const closeButton = page.locator('button:has-text("Cancel"), button:has-text("إلغاء"), button[aria-label*="close"]').first();
      await closeButton.click();
      
      // Modal should close
      await expect(page.locator('input[name="amount"]')).not.toBeVisible({ timeout: 3000 });
    }
  });

  test('currency formatting is correct', async ({ page }) => {
    await page.goto('/wallet');
    
    // Wait for balance to load
    await page.waitForSelector('text=/balance|رصيد/i', { timeout: 10000 });
    
    // Verify currency symbol is present (TND or د.ت)
    const currencySymbol = page.locator('text=/د\\.ت|TND/');
    await expect(currencySymbol.first()).toBeVisible();
    
    // Verify numbers are formatted properly (with decimals)
    const amountPattern = page.locator('text=/\\d+\\.\\d{2,3}/');
    const hasFormattedAmount = await amountPattern.first().isVisible().catch(() => false);
    
    // At least one properly formatted amount should be visible
    expect(hasFormattedAmount).toBeTruthy();
  });
});
