# Coverage Workflow

## Goal
Systematically raise test coverage across the codebase. Each session picks a file, expands its tests, commits, and moves on.

## Process (per file)

### 1. Pick a target
- Look at `coverage/coverage-final.json` or run `npx vitest run --coverage`
- Prioritize files with the most **uncovered statements** (biggest gap × biggest file)
- Pure logic hooks > UI components (easier to mock, higher impact)
- 0% files > partially-covered files (more bang per test)

### 2. Read the source
- Read the entire target file + its existing test file (if any)
- Identify uncovered lines/branches from the coverage report
- For hooks: trace all return values, conditional branches, error paths
- For components: identify loading/empty/error/data states, edge cases, user interactions

### 3. Write tests
- **Component tests** go in `src/pages/__tests__/` or `src/pages/admin/__tests__/`
- **Hook/service tests** go in `src/hooks/__tests__/` or `src/services/__tests__/`
- **Integration tests** (testing through real react-query) get a separate `*.integration.test.tsx` file to avoid `vi.mock` conflicts with existing mocked tests
- Use `vi.hoisted` for shared mock data when cross-block access is needed

### 4. Mocking conventions
- **`@tanstack/react-query`**: Mock `useQuery`/`useMutation` for unit tests. Integration tests use real `QueryClient` + `QueryClientProvider`.
- **`@/lib/supabase`**: For real-query tests, mock `supabase.from()` with a chainable builder pattern. Each `from(table)` call creates a new builder with an `isHeadQuery` flag so `then()` resolves correctly for both count queries (`{ count }`) and data queries (`{ data }`).
- **`@/lib/supabaseWithRetry`**: Mock to call the function directly: `vi.fn((fn) => fn())`.
- **`@/i18n`**: Mock `useTranslation` returning `{ language: 'en', dir: 'ltr', t: {}, tx: (...) => fallback ?? _k }`.
- **`useWorkspaceStore`**: Use `useWorkspaceStore.setState({ activeWorkspace: 'freelancer' })` directly — no module mocking needed.

### 5. Verify
- Run `npx vitest run` — all tests must pass
- Run `npx tsc --noEmit` — zero type errors
- Check coverage with `npx vitest run --coverage`

### 6. Commit & push
- `git add` only the changed test files + source files
- Commit message format: `{File}: {from}%→{to}% ({brief description})`
- Push to `main`
- Update `.agent/PROGRESS.md` with new coverage numbers, commit hash, and remaining gaps

## Current Targets (by uncovered statement count)

| Uncovered | File | Current % |
|-----------|------|-----------|
| 1,122 | `pages/Messages.tsx` | 43% |
| 755 | `pages/messages/useContractLifecycle.ts` | 0% |
| 457 | `pages/messages/useMessageThread.ts` | 0% |
| 446 | `pages/messages/useConversations.ts` | 0% |
| 382 | `pages/JobPost.tsx` | 0% |
| ~30 | `pages/Wallet.tsx` | 71% |
| ~10 | `pages/admin/ReportsTab.tsx` | 90% |

## Key Infrastructure Files
- `.agent/PROGRESS.md` — session tracker, commit history, build status
- `.agent/WORKFLOW.md` — this file
- `coverage/coverage-final.json` — raw coverage data for analysis
- `coverage/_report.py` — script: `python coverage/_report.py` to list lowest-coverage files
