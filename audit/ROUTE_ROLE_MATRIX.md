# Route, Role, and State Scenario Matrix (P0-3)

This document maps all frontend routes in the `khedma-tn` application to their required authentication states, active workspace roles, onboarding progress, and account statuses. It serves as the source of truth for the application's routing security and UX flow.

## 1. State Definitions

The application relies on several distinct state dimensions to determine access:

*   **Auth State:** `Guest` (unauthenticated) vs. `Authenticated`.
*   **Active Workspace:** A user can act as a `client` or `freelancer`. Admin is a separate privilege flag (`is_admin: true`).
*   **Onboarding State:** `Incomplete` (requires setup) vs. `Complete` (ready to use platform).
*   **Account Status:** `Active` vs. `Suspended` vs. `Archived`.
*   **Admin Status:** `true` (has admin privileges) vs. `false`.

---

## 2. Route Matrix

| Route Path | Auth Required | Allowed Roles / Workspaces | Onboarding Status | Allowed Account Status | Redirection / Rejection Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` (Home) | No | Any | Any | Any | Renders normally for all. |
| `/login`, `/signup` | No | Guest Only | N/A | N/A | Redirects to `/dashboard` if already authenticated. |
| `/jobs` (Board) | No | Any | Any | Any | Publicly viewable. Actions inside require auth. |
| `/jobs/:jobId` | No | Any | Any | Any | Publicly viewable. Application/Hiring requires auth. |
| `/freelancer/:id` | No | Any | Any | Any | Publicly viewable profile. |
| `/client/:id` | No | Any | Any | Any | Publicly viewable profile. |
| `/dashboard` | Yes | Any | Complete | Active | Redirects to `/freelancer/dashboard` or `/client/dashboard`. |
| `/onboarding/freelancer` | Yes | Freelancer | Incomplete | Active | Redirects to `/freelancer/dashboard` if already complete. |
| `/onboarding/client` | Yes | Client | Incomplete | Active | Redirects to `/client/dashboard` if already complete. |
| `/freelancer/*` | Yes | Freelancer | Complete | Active | Redirects to `/onboarding/freelancer` if incomplete. Redirects to `/dashboard` if active workspace is Client. |
| `/client/*` | Yes | Client | Complete | Active | Redirects to `/onboarding/client` if incomplete. Redirects to `/dashboard` if active workspace is Freelancer. |
| `/jobs/new` | Yes | Client | Complete | Active | Redirects to `/onboarding/client` if incomplete. Redirects to `/dashboard` if active workspace is Freelancer. |
| `/messages` | Yes | Any | Complete | Active | Blocked if Suspended/Archived. Blocked if Onboarding incomplete. |
| `/contracts/*` | Yes | Any | Complete | Active | Blocked if Suspended/Archived. Blocked if Onboarding incomplete. |
| `/wallet` | Yes | Any | Complete | Active | Blocked if Suspended/Archived. Blocked if Onboarding incomplete. |
| `/admin/*` | Yes | Admin (`is_admin: true`) | Any | Active | Renders 403 Access Denied if `is_admin` is false. |

---

## 3. Edge Case Handling & Redirect Loops

### Suspended / Archived Accounts
*   **Trigger:** User account status changes to `suspended` or `archived`.
*   **Behavior:** The `<AccountStatusGate>` intercepts navigation on all protected routes.
*   **Result:** Renders a hard-stop "Account Suspended/Archived" UI. No further routing or data fetching is permitted until the status is resolved by an Admin.

### Stale Workspace State
*   **Trigger:** A user manually alters their URL from `/client/dashboard` to `/freelancer/dashboard` while their active workspace in the database/session is `client`.
*   **Behavior:** The `<WorkspaceRoute>` component detects the mismatch between the requested route's required workspace and the user's current active workspace.
*   **Result:** Redirects the user back to the base `/dashboard`, which re-evaluates their active workspace and routes them to their correct home (e.g., back to `/client/dashboard`).

### Onboarding Interruption
*   **Trigger:** A user signs up but closes the tab before completing the multi-step onboarding wizard. They return later and try to go straight to `/messages`.
*   **Behavior:** The `<ProtectedRoute>` evaluates `isWorkspaceReady`. Since it is false, it forces a redirect.
*   **Result:** The user is trapped in `/onboarding/freelancer` (or client equivalent) until the required profile fields are satisfied.

## 4. Required Automated Integration Tests
To ensure the matrix is enforced, the following test suites must pass:
1.  `test-unauthenticated-access`: Guests attempting to hit `/dashboard` bounce to `/login`.
2.  `test-workspace-boundary`: Client attempting to hit `/freelancer/earnings` bounces to `/dashboard`.
3.  `test-onboarding-trap`: Incomplete user attempting to hit `/jobs/new` bounces to `/onboarding/client`.
4.  `test-admin-boundary`: Freelancer attempting to hit `/admin` receives a 403 rendering.
5.  `test-suspension-lockout`: Suspended user attempting to hit `/dashboard` sees the suspension screen instead of the dashboard.
