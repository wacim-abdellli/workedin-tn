import { test, expect } from './fixtures/auth';

const MIN_WITHDRAWAL_AMOUNT = 20; // From src/types/payment.ts

/** Check if withdraw button is enabled on the wallet page. */
async function isWithdrawEnabled(page: import('@playwright/test').Page): Promise<boolean> {
  await page.goto('/wallet');
  await page.waitForSelector('text=/wallet|محفظة/i', { timeout: 10000 });
  const withdrawButton = page.locator('button:has-text("Withdraw"), button:has-text("سحب"), button:has-text("Retirer")').first();
  return !(await withdrawButton.isDisabled().catch(() => true));
}

test.describe('Wallet Flow (Freelancer)', () => {
  test.use({ storageState: 'e2e/.auth/freelancer.json' });

  test('wallet page loads and shows balance', async ({ page }) => {
    await page.goto('/wallet');

    await expect(page.locator('h1, h2')).toContainText(/wallet|محفظة|portefeuille/i, { timeout: 10000 });

    const balanceElement = page.locator('text=/balance|رصيد|solde/i').first();
    await expect(balanceElement).toBeVisible();

    const balanceAmount = page.locator('text=/د\\.ت|TND|\\d+/').first();
    await expect(balanceAmount).toBeVisible();

    const transactionsSection = page.locator('text=/transaction|معاملة|opération/i');
    await expect(transactionsSection.first()).toBeVisible({ timeout: 5000 });
  });

  test('withdrawal modal opens and validates minimum amount', async ({ page }) => {
    const enabled = await isWithdrawEnabled(page);
    test.skip(!enabled, 'Withdraw button is disabled (insufficient balance)');

    const withdrawButton = page.locator('button:has-text("Withdraw"), button:has-text("سحب"), button:has-text("Retirer")').first();
    await withdrawButton.click();

    await expect(page.locator('text=/withdraw|سحب|retrait/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[name="amount"], input[type="number"]')).toBeVisible();
    await expect(page.locator(`text=/${MIN_WITHDRAWAL_AMOUNT}/`)).toBeVisible();
  });

  test('form prevents submission below MIN_WITHDRAWAL_AMOUNT', async ({ page }) => {
    const enabled = await isWithdrawEnabled(page);
    test.skip(!enabled, 'Withdraw button is disabled (insufficient balance)');

    const withdrawButton = page.locator('button:has-text("Withdraw"), button:has-text("سحب")').first();
    await withdrawButton.click();

    await page.waitForSelector('input[name="amount"], input[type="number"]', { timeout: 5000 });

    const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    await amountInput.fill('10');

    const submitButton = page.locator('button[type="submit"]:has-text("Withdraw"), button[type="submit"]:has-text("سحب")').first();
    await submitButton.click();

    await expect(page.locator(`text=/minimum|الحد.*الأدنى|${MIN_WITHDRAWAL_AMOUNT}/i`)).toBeVisible({ timeout: 3000 });
    await expect(amountInput).toBeVisible();
  });

  test('withdrawal form validates maximum amount', async ({ page }) => {
    const enabled = await isWithdrawEnabled(page);
    test.skip(!enabled, 'Withdraw button is disabled (insufficient balance)');

    const withdrawButton = page.locator('button:has-text("Withdraw"), button:has-text("سحب")').first();
    await withdrawButton.click();
    await page.waitForSelector('input[name="amount"]', { timeout: 5000 });

    const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    await amountInput.fill('999999');

    const submitButton = page.locator('button[type="submit"]:has-text("Withdraw"), button[type="submit"]:has-text("سحب")').first();
    await submitButton.click();

    await expect(page.locator('text=/exceed|balance|رصيد|maximum/i')).toBeVisible({ timeout: 3000 });
  });

  test('withdrawal method selection works', async ({ page }) => {
    const enabled = await isWithdrawEnabled(page);
    test.skip(!enabled, 'Withdraw button is disabled (insufficient balance)');

    const withdrawButton = page.locator('button:has-text("Withdraw"), button:has-text("سحب")').first();
    await withdrawButton.click();
    await page.waitForSelector('input[name="amount"]', { timeout: 5000 });

    const methodSelect = page.locator('select[name="method"], select[name="withdrawal_method"]');
    const methodRadio = page.locator('input[type="radio"][name*="method"]');

    if (await methodSelect.isVisible()) {
      await methodSelect.selectOption({ index: 0 });
      expect(await methodSelect.inputValue()).toBeTruthy();
    } else if (await methodRadio.first().isVisible()) {
      await methodRadio.first().check();
      expect(await methodRadio.first().isChecked()).toBeTruthy();
    }
  });

  test('transaction history is displayed', async ({ page }) => {
    await page.goto('/wallet');
    await page.waitForSelector('text=/wallet|محفظة/i', { timeout: 10000 });

    const transactionsHeading = page.locator('text=/transaction.*history|سجل.*المعاملات|historique/i');
    await expect(transactionsHeading.first()).toBeVisible({ timeout: 5000 });

    const hasTransactions = await page.locator('text=/amount|مبلغ|montant/i').isVisible().catch(() => false);
    const hasEmptyState = await page.locator('text=/no.*transaction|لا.*توجد.*معاملات|aucune.*transaction/i').isVisible().catch(() => false);

    expect(hasTransactions || hasEmptyState).toBeTruthy();
  });

  test('withdrawal button is disabled when balance is below minimum', async ({ page }) => {
    await page.goto('/wallet');
    await page.waitForSelector('text=/balance|رصيد/i', { timeout: 10000 });

    const balanceText = await page.locator('text=/\\d+\\.?\\d*/').first().textContent();
    const balance = parseFloat(balanceText?.replace(/[^\d.]/g, '') || '0');

    const withdrawButton = page.locator('button:has-text("Withdraw"), button:has-text("سحب")').first();

    if (balance < MIN_WITHDRAWAL_AMOUNT) {
      await expect(withdrawButton).toBeDisabled();
    } else {
      await expect(withdrawButton).toBeEnabled();
    }
  });

  test('wallet stats cards are displayed', async ({ page }) => {
    await page.goto('/wallet');

    await expect(page.locator('text=/balance|رصيد/i').first()).toBeVisible({ timeout: 10000 });

    const statsCards = page.locator('text=/earning|pending|available|أرباح|معلق|متاح/i');
    const statsCount = await statsCards.count();

    expect(statsCount).toBeGreaterThan(0);
  });

  test('withdrawal modal can be closed', async ({ page }) => {
    const enabled = await isWithdrawEnabled(page);
    test.skip(!enabled, 'Withdraw button is disabled (insufficient balance)');

    const withdrawButton = page.locator('button:has-text("Withdraw"), button:has-text("سحب")').first();
    await withdrawButton.click();

    await page.waitForSelector('input[name="amount"]', { timeout: 5000 });

    const closeButton = page.locator('button:has-text("Cancel"), button:has-text("إلغاء"), button[aria-label*="close"]').first();
    await closeButton.click();

    await expect(page.locator('input[name="amount"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('currency formatting is correct', async ({ page }) => {
    await page.goto('/wallet');
    await page.waitForSelector('text=/balance|رصيد/i', { timeout: 10000 });

    const currencySymbol = page.locator('text=/د\\.ت|TND/');
    await expect(currencySymbol.first()).toBeVisible();

    const amountPattern = page.locator('text=/\\d+\\.\\d{2,3}/');
    const hasFormattedAmount = await amountPattern.first().isVisible().catch(() => false);

    expect(hasFormattedAmount).toBeTruthy();
  });
});
