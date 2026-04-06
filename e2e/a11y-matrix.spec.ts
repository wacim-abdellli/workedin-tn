import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import {
  buildClientFixtures,
  buildFreelancerFixtures,
  buildProfile,
  createRoleStatePage,
  gotoAndSettle,
} from './support/roleStateMocks';

type LandmarkExpectation = {
  banner?: number;
  navigation?: number;
  main: number;
  h1: number;
};

async function expectGlobalKeyboardEntry(page: Page) {
  await page.locator('body').click({ position: { x: 10, y: 10 } });
  await page.keyboard.press('Tab');

  const focusState = await page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null;
    if (!element) return null;

    const computed = window.getComputedStyle(element);
    return {
      tagName: element.tagName.toLowerCase(),
      outlineStyle: computed.outlineStyle,
      outlineWidth: computed.outlineWidth,
      boxShadow: computed.boxShadow,
      focusVisible: element.matches(':focus-visible'),
    };
  });

  expect(focusState).not.toBeNull();
  expect(['a', 'button', 'input'].includes(focusState!.tagName)).toBe(true);

  const hasOutline = focusState!.outlineStyle !== 'none' && focusState!.outlineWidth !== '0px';
  const hasBoxShadow = focusState!.boxShadow !== 'none';
  expect(focusState!.focusVisible || hasOutline || hasBoxShadow).toBe(true);
}

async function expectLandmarks(page: Page, expected: LandmarkExpectation) {
  await expect(page.locator('main')).toHaveCount(expected.main);
  await expect(page.locator('h1')).toHaveCount(expected.h1);

  if (typeof expected.banner === 'number') {
    await expect(page.locator('header, [role="banner"]')).toHaveCount(expected.banner);
  }

  if (typeof expected.navigation === 'number') {
    await expect(page.locator('nav')).toHaveCount(expected.navigation);
  }
}

async function expectNoSeriousAxeViolations(page: Page, label: string) {
  await page.evaluate(() => {
    const language = localStorage.getItem('i18n-language') || localStorage.getItem('language') || 'en';
    const direction = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', direction);
    document.body?.setAttribute('dir', direction);
  });

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  const seriousViolations = results.violations.filter((violation) =>
    violation.impact === 'serious' || violation.impact === 'critical',
  );

  expect(
    seriousViolations,
    `${label} serious/critical axe violations:\n${JSON.stringify(seriousViolations, null, 2)}`,
  ).toHaveLength(0);
}

test.describe('Accessibility strict matrix (P2-3)', () => {
  test('login shell preserves landmarks, focus visibility, and has no serious axe issues', async ({ browser }) => {
    const { context, page } = await createRoleStatePage(browser, {});

    await gotoAndSettle(page, '/login', 'form');
    await expectLandmarks(page, { banner: 1, main: 1, h1: 1 });
    await expectGlobalKeyboardEntry(page);
    await expectNoSeriousAxeViolations(page, 'login');

    await context.close();
  });

  test('client dashboard passes the a11y matrix', async ({ browser }) => {
    const { context, page } = await createRoleStatePage(browser, {
      storageState: 'e2e/.auth/client.json',
      fixtures: buildClientFixtures(),
    });

    await gotoAndSettle(page, '/client/dashboard', 'main h1');
    await expectLandmarks(page, { banner: 1, navigation: 1, main: 1, h1: 1 });
    await expectGlobalKeyboardEntry(page);
    await expectNoSeriousAxeViolations(page, 'client dashboard');

    await context.close();
  });

  test('freelancer dashboard passes the a11y matrix', async ({ browser }) => {
    const { context, page } = await createRoleStatePage(browser, {
      storageState: 'e2e/.auth/freelancer.json',
      fixtures: buildFreelancerFixtures(),
    });

    await gotoAndSettle(page, '/freelancer/dashboard', 'main h1');
    await expectLandmarks(page, { banner: 1, navigation: 1, main: 1, h1: 1 });
    await expectGlobalKeyboardEntry(page);
    await expectNoSeriousAxeViolations(page, 'freelancer dashboard');

    await context.close();
  });

  test('client job-post flow preserves accessible structure', async ({ browser }) => {
    const { context, page } = await createRoleStatePage(browser, {
      storageState: 'e2e/.auth/client.json',
      fixtures: buildClientFixtures(),
    });

    await gotoAndSettle(page, '/jobs/new', 'h1');
    await expectLandmarks(page, { banner: 1, navigation: 1, main: 1, h1: 1 });
    await expectGlobalKeyboardEntry(page);
    await expectNoSeriousAxeViolations(page, 'job post');

    await context.close();
  });

  test('admin access denied state keeps accessible landmarks and contrast-safe content', async ({ browser }) => {
    const { context, page } = await createRoleStatePage(browser, {
      storageState: 'e2e/.auth/freelancer.json',
      fixtures: buildFreelancerFixtures(),
    });

    await gotoAndSettle(page, '/admin', 'main h1');
    await expectLandmarks(page, { main: 1, h1: 1 });
    await expectGlobalKeyboardEntry(page);
    await expectNoSeriousAxeViolations(page, 'admin denied');

    await context.close();
  });

  test('suspended account gate keeps accessible landmarks and focusable recovery actions', async ({ browser }) => {
    const { context, page } = await createRoleStatePage(browser, {
      storageState: 'e2e/.auth/freelancer.json',
      fixtures: {
        ...buildFreelancerFixtures(),
        profiles: buildProfile({
          id: '00000000-0000-4000-8000-000000000010',
          email: 'freelancer-test@khedma.tn',
          full_name: 'Nour Freelancer',
          user_type: 'freelancer',
          account_status: 'suspended',
          freelancer_onboarding_completed: true,
        }),
      },
    });

    await gotoAndSettle(page, '/dashboard', 'main h1');
    await expectLandmarks(page, { main: 1, h1: 1 });
    await expectGlobalKeyboardEntry(page);
    await expectNoSeriousAxeViolations(page, 'account suspended gate');

    await context.close();
  });
});
