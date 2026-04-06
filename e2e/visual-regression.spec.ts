import { expect, test } from '@playwright/test';
import type { Browser, Page, Route } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const FIXED_NOW = '2026-04-06T09:00:00.000Z';
const DESKTOP_VIEWPORT = { width: 1440, height: 900 };

type JsonRecord = Record<string, unknown>;
type TableFixture = JsonRecord | JsonRecord[] | null;
type TableFixtures = Record<string, TableFixture>;

const screenshotOptions = {
  animations: 'disabled' as const,
  caret: 'hide' as const,
  scale: 'css' as const,
  maxDiffPixelRatio: 0.01,
};

function buildProfile(overrides: Partial<JsonRecord>): JsonRecord {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'visual-user@khedma.tn',
    full_name: 'Visual User',
    user_type: 'freelancer',
    avatar_url: null,
    bio: 'A stable visual baseline profile for dashboard and route screenshots.',
    cin_verified: true,
    account_status: 'active',
    onboarding_completed: true,
    freelancer_onboarding_completed: true,
    client_onboarding_completed: false,
    created_at: FIXED_NOW,
    updated_at: FIXED_NOW,
    ...overrides,
  };
}

function buildFreelancerFixtures(): TableFixtures {
  return {
    profiles: buildProfile({
      id: '00000000-0000-4000-8000-000000000010',
      email: 'freelancer-test@khedma.tn',
      full_name: 'Nour Freelancer',
      user_type: 'freelancer',
      freelancer_onboarding_completed: true,
      client_onboarding_completed: false,
      avatar_url: null,
    }),
    freelancer_profiles: {
      id: '00000000-0000-4000-8000-000000000010',
      title: 'Product Designer',
      profile_views: 124,
      connects_balance: 18,
      skills: [{ name: 'UX Design' }, { name: 'Figma' }, { name: 'Product Strategy' }],
    },
    wallets: {
      user_id: '00000000-0000-4000-8000-000000000010',
      balance: 4200,
      pending_balance: 800,
      total_earned: 18500,
    },
    notifications: [
      {
        id: 'notif-f-1',
        title: 'New milestone waiting',
        body: 'A milestone is ready for delivery.',
        type: 'project',
        is_read: false,
        created_at: '2026-04-05T08:30:00.000Z',
      },
      {
        id: 'notif-f-2',
        title: 'Client replied',
        body: 'Your client left feedback on the draft.',
        type: 'message',
        is_read: false,
        created_at: '2026-04-04T07:00:00.000Z',
      },
    ],
    proposals: [
      {
        id: 'proposal-f-1',
        status: 'pending',
        bid_amount: 900,
        created_at: '2026-04-03T09:00:00.000Z',
        job: {
          id: 'job-f-1',
          title: 'Refine a multi-step checkout flow',
          category: 'Design',
          status: 'open',
        },
      },
      {
        id: 'proposal-f-2',
        status: 'pending',
        bid_amount: 650,
        created_at: '2026-04-02T09:00:00.000Z',
        job: {
          id: 'job-f-2',
          title: 'Build landing page motion system',
          category: 'Frontend',
          status: 'open',
        },
      },
    ],
    contracts: [
      {
        id: 'contract-f-1',
        title: 'Checkout redesign',
        status: 'active',
        total_amount: 2600,
        created_at: '2026-03-25T09:00:00.000Z',
        client: {
          id: 'client-visual-1',
          full_name: 'Amal Client',
          avatar_url: null,
        },
      },
      {
        id: 'contract-f-2',
        title: 'Mobile growth sprint',
        status: 'active',
        total_amount: 3400,
        created_at: '2026-03-20T09:00:00.000Z',
        client: {
          id: 'client-visual-2',
          full_name: 'Nadia Startup',
          avatar_url: null,
        },
      },
    ],
    milestones: [
      {
        id: 'mile-f-1',
        description: 'Deliver wireframes',
        due_date: '2026-04-08T09:00:00.000Z',
        amount: 800,
        status: 'pending',
        contract_id: 'contract-f-1',
      },
      {
        id: 'mile-f-2',
        description: 'Prototype interactions',
        due_date: '2026-04-12T09:00:00.000Z',
        amount: 1200,
        status: 'pending',
        contract_id: 'contract-f-2',
      },
    ],
    transactions: [
      { id: 'txn-f-1', amount: 2400, created_at: '2026-02-15T09:00:00.000Z', type: 'escrow_release', status: 'completed' },
      { id: 'txn-f-2', amount: 3200, created_at: '2026-03-15T09:00:00.000Z', type: 'escrow_release', status: 'completed' },
    ],
    jobs: [
      { id: 'match-1', title: 'Redesign onboarding handoff', category: 'Design', budget_min: 600, budget_max: 1200, visibility: 'public', status: 'open', created_at: '2026-04-01T09:00:00.000Z' },
      { id: 'match-2', title: 'Improve dashboard empty states', category: 'Frontend', budget_min: 500, budget_max: 900, visibility: 'public', status: 'open', created_at: '2026-03-30T09:00:00.000Z' },
      { id: 'match-3', title: 'Optimize design token docs', category: 'Documentation', budget_min: 300, budget_max: 500, visibility: 'public', status: 'open', created_at: '2026-03-28T09:00:00.000Z' },
    ],
  };
}

function buildClientFixtures(): TableFixtures {
  return {
    profiles: buildProfile({
      id: '00000000-0000-4000-8000-000000000020',
      email: 'client-test@khedma.tn',
      full_name: 'Amal Client',
      user_type: 'client',
      freelancer_onboarding_completed: false,
      client_onboarding_completed: true,
      avatar_url: null,
    }),
    wallets: {
      user_id: '00000000-0000-4000-8000-000000000020',
      total_withdrawn: 9300,
    },
    notifications: [
      {
        id: 'notif-c-1',
        title: 'Proposal received',
        body: 'A freelancer submitted a new proposal.',
        type: 'proposal',
        is_read: false,
        created_at: '2026-04-05T08:30:00.000Z',
      },
      {
        id: 'notif-c-2',
        title: 'Contract milestone ready',
        body: 'Review the milestone and release payment when ready.',
        type: 'project',
        is_read: false,
        created_at: '2026-04-04T10:00:00.000Z',
      },
    ],
    jobs: [
      {
        id: 'job-c-1',
        title: 'Launch conversion-focused homepage',
        budget_min: 1500,
        budget_max: 2500,
        status: 'open',
        proposals_count: 6,
        created_at: '2026-04-01T09:00:00.000Z',
        contracts: [],
      },
      {
        id: 'job-c-2',
        title: 'Refresh customer dashboard states',
        budget_min: 900,
        budget_max: 1400,
        status: 'in_progress',
        proposals_count: 3,
        created_at: '2026-03-28T09:00:00.000Z',
        contracts: [
          {
            id: 'contract-c-1',
            status: 'active',
            freelancer: { full_name: 'Nour Freelancer' },
          },
        ],
      },
    ],
    contracts: [
      {
        id: 'contract-c-1',
        title: 'Dashboard state refresh',
        status: 'active',
        total_amount: 1800,
        created_at: '2026-03-28T09:00:00.000Z',
        freelancer: {
          id: 'freelancer-visual-1',
          full_name: 'Nour Freelancer',
          avatar_url: null,
        },
      },
    ],
    proposals: [
      {
        id: 'proposal-c-1',
        job_id: 'job-c-1',
        bid_amount: 1600,
        created_at: '2026-04-04T09:00:00.000Z',
        status: 'pending',
        job: {
          title: 'Launch conversion-focused homepage',
          client_id: '00000000-0000-4000-8000-000000000020',
        },
        freelancer: {
          full_name: 'Nour Freelancer',
          avatar_url: null,
        },
      },
      {
        id: 'proposal-c-2',
        job_id: 'job-c-1',
        bid_amount: 1450,
        created_at: '2026-04-03T09:00:00.000Z',
        status: 'pending',
        job: {
          title: 'Launch conversion-focused homepage',
          client_id: '00000000-0000-4000-8000-000000000020',
        },
        freelancer: {
          full_name: 'Studio Atlas',
          avatar_url: null,
        },
      },
    ],
  };
}

function rowsFromFixture(fixture: TableFixture): JsonRecord[] {
  if (fixture == null) return [];
  return Array.isArray(fixture) ? fixture : [fixture];
}

async function fulfillSupabaseRead(route: Route, fixture: TableFixture) {
  const rows = rowsFromFixture(fixture);
  const count = rows.length;
  const headers = {
    'access-control-allow-origin': '*',
    'content-type': 'application/json; charset=utf-8',
    'content-range': count > 0 ? `0-${Math.max(count - 1, 0)}/${count}` : '*/0',
  };

  if (route.request().method() === 'HEAD') {
    await route.fulfill({ status: 200, headers, body: '' });
    return;
  }

  const acceptHeader = route.request().headers()['accept'] || '';
  const wantsObject = acceptHeader.includes('application/vnd.pgrst.object+json');
  const body = wantsObject
    ? JSON.stringify(Array.isArray(fixture) ? fixture[0] ?? null : fixture)
    : JSON.stringify(Array.isArray(fixture) ? fixture : fixture == null ? [] : [fixture]);

  await route.fulfill({ status: 200, headers, body });
}

async function installSupabaseReadMocks(page: Page, fixtures: TableFixtures) {
  await page.route('**/rest/v1/**', async (route) => {
    const method = route.request().method();
    if (method !== 'GET' && method !== 'HEAD') {
      await route.continue();
      return;
    }

    const url = new URL(route.request().url());
    const table = url.pathname.split('/').pop() || '';
    await fulfillSupabaseRead(route, fixtures[table] ?? []);
  });
}

async function installThirdPartyGuards(page: Page) {
  await page.route('https://*.sentry.io/**', async (route) => {
    await route.fulfill({ status: 204, body: '' });
  });
  await page.route('https://*.posthog.com/**', async (route) => {
    await route.fulfill({ status: 204, body: '' });
  });
}

async function createVisualPage(browser: Browser, options: { storageState?: string; fixtures?: TableFixtures }) {
  const context = await browser.newContext({
    storageState: options.storageState,
    viewport: DESKTOP_VIEWPORT,
    colorScheme: 'light',
  });

  await context.addInitScript(({ fixedNow }) => {
    localStorage.setItem('i18n-language', 'en');
    localStorage.setItem('language', 'en');

    const fixedTimestamp = new Date(fixedNow).valueOf();
    const RealDate = Date;

    class MockDate extends RealDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(fixedTimestamp);
        } else {
          super(args[0]);
        }
      }

      static now() {
        return fixedTimestamp;
      }
    }

    MockDate.parse = RealDate.parse;
    MockDate.UTC = RealDate.UTC;
    Object.defineProperty(window, 'Date', {
      value: MockDate,
      configurable: true,
      writable: true,
    });
  }, { fixedNow: FIXED_NOW });

  const page = await context.newPage();
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  await installThirdPartyGuards(page);

  if (options.fixtures) {
    await installSupabaseReadMocks(page, options.fixtures);
  }

  return { context, page };
}

async function gotoAndSettle(page: Page, routePath: string, readySelector: string) {
  await page.goto(new URL(routePath, BASE_URL).toString(), { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  await expect(page.locator(readySelector)).toBeVisible();
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
    `,
  });
  await page.waitForTimeout(120);
}

test.describe('Visual regression core flows (P2-2)', () => {
  test('public login shell remains visually stable', async ({ browser }) => {
    const { context, page } = await createVisualPage(browser, {});

    await gotoAndSettle(page, '/login', 'form');
    await expect(page).toHaveScreenshot('login-shell.png', screenshotOptions);

    await context.close();
  });

  test('client job-post flow keeps its baseline layout', async ({ browser }) => {
    const { context, page } = await createVisualPage(browser, {
      storageState: 'e2e/.auth/client.json',
      fixtures: {
        ...buildClientFixtures(),
      },
    });

    await gotoAndSettle(page, '/jobs/new', 'h1');
    await expect(page).toHaveScreenshot('client-job-post-shell.png', screenshotOptions);

    await context.close();
  });

  test('client dashboard empty-state summary stays stable', async ({ browser }) => {
    const { context, page } = await createVisualPage(browser, {
      storageState: 'e2e/.auth/client.json',
      fixtures: buildClientFixtures(),
    });

    await gotoAndSettle(page, '/client/dashboard', 'main h1');
    await expect(page).toHaveScreenshot('client-dashboard.png', screenshotOptions);

    await context.close();
  });

  test('freelancer dashboard summary stays stable', async ({ browser }) => {
    const { context, page } = await createVisualPage(browser, {
      storageState: 'e2e/.auth/freelancer.json',
      fixtures: buildFreelancerFixtures(),
    });

    await gotoAndSettle(page, '/freelancer/dashboard', 'main h1');
    await expect(page).toHaveScreenshot('freelancer-dashboard.png', screenshotOptions);

    await context.close();
  });

  test('non-admin access denied state stays stable', async ({ browser }) => {
    const { context, page } = await createVisualPage(browser, {
      storageState: 'e2e/.auth/freelancer.json',
      fixtures: buildFreelancerFixtures(),
    });

    await gotoAndSettle(page, '/admin', 'text=Access Denied');
    await expect(page).toHaveScreenshot('admin-access-denied.png', screenshotOptions);

    await context.close();
  });

  test('suspended-account gate stays stable', async ({ browser }) => {
    const suspendedProfile = buildProfile({
      id: '00000000-0000-4000-8000-000000000010',
      email: 'freelancer-test@khedma.tn',
      full_name: 'Nour Freelancer',
      user_type: 'freelancer',
      account_status: 'suspended',
      freelancer_onboarding_completed: true,
    });

    const { context, page } = await createVisualPage(browser, {
      storageState: 'e2e/.auth/freelancer.json',
      fixtures: {
        ...buildFreelancerFixtures(),
        profiles: suspendedProfile,
      },
    });

    await gotoAndSettle(page, '/dashboard', 'text=Account suspended');
    await expect(page).toHaveScreenshot('account-suspended-gate.png', screenshotOptions);

    await context.close();
  });
});
