import { test, expect } from './fixtures/auth';

test.describe('Routing Matrix (P0-3)', () => {

  test.describe('1. Unauthenticated Access', () => {
    test('test-unauthenticated-access: Guests attempting to hit /dashboard bounce to /login', async ({ browser }) => {
      const context = await browser.newContext({ storageState: undefined });
      const page = await context.newPage();
      
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
      
      await context.close();
    });
  });

  test.describe('2. Workspace Boundary', () => {
    test('test-workspace-boundary: Client attempting to hit /freelancer/earnings bounces to /client/dashboard', async ({ authenticatedClient }) => {
      await authenticatedClient.goto('/freelancer/earnings');
      
      // WorkspaceRoute redirects to active workspace dashboard
      await expect(authenticatedClient).toHaveURL(/\/client\/dashboard/);
    });
  });

  test.describe('3. Onboarding Trap', () => {
    test('test-onboarding-trap: Incomplete user attempting to hit /jobs/new bounces to /onboarding', async ({ authenticatedClient }) => {
      // Intercept profile fetch and modify onboarding status
      await authenticatedClient.route('**/rest/v1/profiles*', async route => {
        if (route.request().method() !== 'GET') {
          await route.continue();
          return;
        }
        
        // Create a mocked profile for the client
        const url = new URL(route.request().url());
        const idMatch = url.searchParams.get('id');
        const id = idMatch ? idMatch.replace('eq.', '') : 'mock-id';
        
        const mockProfile = {
          id: id,
          email: 'client-test@khedma.tn',
          full_name: 'Client Test',
          user_type: 'client',
          account_status: 'active',
          onboarding_completed: false,
          client_onboarding_completed: false,
          freelancer_onboarding_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([mockProfile])
        });
      });

      await authenticatedClient.goto('/jobs/new');
      
      // Should trap user in onboarding
      await expect(authenticatedClient).toHaveURL(/\/onboarding\/client/);
    });
  });

  test.describe('4. Admin Boundary', () => {
    test('test-admin-boundary: Freelancer attempting to hit /admin receives a 403 rendering', async ({ authenticatedFreelancer }) => {
      await authenticatedFreelancer.goto('/admin');
      
      // Should stay on /admin but show Access Denied UI (Lock icon, "Access Denied" text)
      await expect(authenticatedFreelancer).toHaveURL(/\/admin/);
      await expect(authenticatedFreelancer.locator('text=/Access Denied|Accès refusé/i')).toBeVisible();
    });
  });

  test.describe('5. Suspension Lockout', () => {
    test('test-suspension-lockout: Suspended user attempting to hit /dashboard sees the suspension screen', async ({ authenticatedFreelancer }) => {
      // Intercept profile fetch and modify account status
      await authenticatedFreelancer.route('**/rest/v1/profiles*', async route => {
        if (route.request().method() !== 'GET') {
          await route.continue();
          return;
        }

        const url = new URL(route.request().url());
        const idMatch = url.searchParams.get('id');
        const id = idMatch ? idMatch.replace('eq.', '') : 'mock-id';
        
        const mockProfile = {
          id: id,
          email: 'freelancer-test@khedma.tn',
          full_name: 'Freelancer Test',
          user_type: 'freelancer',
          account_status: 'suspended',
          onboarding_completed: true,
          client_onboarding_completed: false,
          freelancer_onboarding_completed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([mockProfile])
        });
      });

      await authenticatedFreelancer.goto('/dashboard');
      
      // Should show AccountStatusGate component
      await expect(authenticatedFreelancer.locator('text=/Account suspended|Compte suspendu/i')).toBeVisible();
    });
  });

});