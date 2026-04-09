import fs from 'node:fs/promises';
import path from 'node:path';
import { test } from '@playwright/test';
import type { Browser, Page } from '@playwright/test';

const OUT_DIR = path.resolve('.tmp', 'ui-audit-run');

const PUBLIC_PAGES = [
  { route: '/', slug: 'home' },
  { route: '/how-it-works', slug: 'how-it-works' },
  { route: '/for-clients', slug: 'for-clients' },
  { route: '/jobs', slug: 'jobs' },
  { route: '/find-freelancers', slug: 'find-freelancers' },
  { route: '/faq', slug: 'faq' },
  { route: '/login', slug: 'login' },
  { route: '/signup', slug: 'signup' },
];

const CLIENT_PAGES = [
  { route: '/client/dashboard', slug: 'client-dashboard' },
  { route: '/wallet', slug: 'wallet' },
  { route: '/settings', slug: 'settings' },
  { route: '/messages', slug: 'messages-client' },
  { route: '/contracts', slug: 'contracts-client' },
  { route: '/notifications', slug: 'notifications-client' },
];

const FREELANCER_PAGES = [
  { route: '/freelancer/dashboard', slug: 'freelancer-dashboard' },
  { route: '/messages', slug: 'messages-freelancer' },
  { route: '/contracts', slug: 'contracts-freelancer' },
  { route: '/notifications', slug: 'notifications-freelancer' },
  { route: '/freelancer/earnings', slug: 'freelancer-earnings' },
];

const STORAGE_STATE_BY_PROJECT: Record<string, string | undefined> = {
  'chromium-client': 'e2e/.auth/client.json',
  'chromium-freelancer': 'e2e/.auth/freelancer.json',
};

type Variant = 'desktop-light' | 'desktop-dark' | 'desktop-rtl' | 'mobile-light';

const VARIANTS: Variant[] = [
  'desktop-light',
  'desktop-dark',
  'desktop-rtl',
  'mobile-light',
];

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

function viewportFor(variant: Variant) {
  if (variant === 'mobile-light') {
    return { width: 375, height: 812 };
  }
  return { width: 1280, height: 900 };
}

async function openAuditPage(browser: Browser, projectName: string, variant: Variant) {
  const context = await browser.newContext({
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    storageState: STORAGE_STATE_BY_PROJECT[projectName],
    viewport: viewportFor(variant),
    locale: 'en-US',
    colorScheme: 'light',
  });
  const page = await context.newPage();
  const consoleMessages: Array<{ type: string; text: string }> = [];
  const pageErrors: Array<{ name: string; message: string }> = [];
  const failedRequests: Array<{ url: string; method: string; failure: string }> = [];

  page.on('console', (msg) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });
  page.on('pageerror', (error) => {
    pageErrors.push({ name: error.name, message: error.message });
  });
  page.on('requestfailed', (request) => {
    failedRequests.push({
      url: request.url(),
      method: request.method(),
      failure: request.failure()?.errorText || 'unknown',
    });
  });

  return { context, page, consoleMessages, pageErrors, failedRequests };
}

async function clickThemeToggle(page: Page) {
  const toggle = page.getByRole('button', { name: /toggle/i }).first();
  if (await toggle.count()) {
    await toggle.click().catch(() => {});
  }
}

async function switchToArabic(page: Page) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const currentDir = await page.evaluate(() => document.documentElement.dir || getComputedStyle(document.documentElement).direction);
    if (currentDir === 'rtl') return true;
    const languageButton = page.locator('button:has-text("EN"), button:has-text("FR"), button:has-text("AR")').first();
    if (!(await languageButton.count())) return false;
    await languageButton.click().catch(() => {});
    await page.waitForTimeout(800);
  }
  const finalDir = await page.evaluate(() => document.documentElement.dir || getComputedStyle(document.documentElement).direction);
  return finalDir === 'rtl';
}

async function captureVariant(browser: Browser, projectName: string, pageDef: { route: string; slug: string }, variant: Variant) {
  const { context, page, consoleMessages, pageErrors, failedRequests } = await openAuditPage(browser, projectName, variant);
  try {
    await page.goto(pageDef.route, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    if (variant === 'desktop-dark') {
      await clickThemeToggle(page);
      await page.waitForTimeout(1200);
    }

    if (variant === 'desktop-rtl') {
      await switchToArabic(page);
      await page.waitForTimeout(1200);
    }

    const info = await page.evaluate(() => ({
      url: window.location.href,
      title: document.title,
      dir: document.documentElement.dir || getComputedStyle(document.documentElement).direction,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      bodyText: document.body?.innerText?.slice(0, 5000) || '',
    }));

    const targetDir = path.join(OUT_DIR, projectName, pageDef.slug);
    await ensureDir(targetDir);
    await page.screenshot({
      path: path.join(targetDir, `${variant}.png`),
      fullPage: true,
    });
    await fs.writeFile(
      path.join(targetDir, `${variant}.json`),
      JSON.stringify({ ...info, consoleMessages, pageErrors, failedRequests }, null, 2),
      'utf8',
    );
  } finally {
    await context.close();
  }
}

async function captureWalletModal(browser: Browser, projectName: string) {
  const { context, page, consoleMessages, pageErrors, failedRequests } = await openAuditPage(browser, projectName, 'desktop-light');
  try {
    await page.goto('/wallet', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const openers = [
      page.getByRole('button', { name: /deposit/i }).first(),
      page.getByRole('button', { name: /add funds/i }).first(),
      page.locator('button:has-text("Deposit")').first(),
    ];

    for (const opener of openers) {
      if (await opener.count()) {
        if (await opener.isVisible().catch(() => false)) {
          await opener.click().catch(() => {});
          break;
        }
      }
    }

    await page.waitForTimeout(1200);
    const info = await page.evaluate(() => ({
      url: window.location.href,
      title: document.title,
      dir: document.documentElement.dir || getComputedStyle(document.documentElement).direction,
      bodyText: document.body?.innerText?.slice(0, 5000) || '',
    }));

    const targetDir = path.join(OUT_DIR, projectName, 'wallet-modal');
    await ensureDir(targetDir);
    await page.screenshot({ path: path.join(targetDir, 'desktop-light.png'), fullPage: true });
    await fs.writeFile(
      path.join(targetDir, 'desktop-light.json'),
      JSON.stringify({ ...info, consoleMessages, pageErrors, failedRequests }, null, 2),
      'utf8',
    );
  } finally {
    await context.close();
  }
}

test.describe.configure({ mode: 'serial' });

test('public page audit captures', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-public', 'Public capture only runs in chromium-public');
  test.setTimeout(15 * 60 * 1000);
  for (const pageDef of PUBLIC_PAGES) {
    for (const variant of VARIANTS) {
      await captureVariant(browser, testInfo.project.name, pageDef, variant);
    }
  }
});

test('client page audit captures', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-client', 'Client capture only runs in chromium-client');
  test.setTimeout(15 * 60 * 1000);
  for (const pageDef of CLIENT_PAGES) {
    for (const variant of VARIANTS) {
      await captureVariant(browser, testInfo.project.name, pageDef, variant);
    }
  }
  await captureWalletModal(browser, testInfo.project.name);
});

test('freelancer page audit captures', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-freelancer', 'Freelancer capture only runs in chromium-freelancer');
  test.setTimeout(15 * 60 * 1000);
  for (const pageDef of FREELANCER_PAGES) {
    for (const variant of VARIANTS) {
      await captureVariant(browser, testInfo.project.name, pageDef, variant);
    }
  }
});
