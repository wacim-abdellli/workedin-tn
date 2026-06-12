# Agent Rules — Safety & Conventions

## NEVER DO (will break production or leak data)

1. Put secrets in `VITE_*` vars — Vite exposes them to the browser bundle.
2. Use raw `dangerouslySetInnerHTML` — all HTML must go through `SanitizedHtml` component.
3. Add `eval()`, `Function()`, or `unsafe-eval` to production code.
4. Modify contract state machine terminal states (completed/cancelled/disputed must have no outgoing transitions).
5. Bypass payment verification in production. Mock flows are DEV-only (`import.meta.env.DEV`).
6. Trust client-side admin checks alone — DB uses `public.is_admin()` SECURITY DEFINER.
7. Commit `.env.local`, `.env*.local`, or any file with real keys.
8. Disable or weaken RLS without explicit user approval.
9. Expose `is_admin`, `is_super_admin`, `account_status` in public API responses.
10. Add raw `console.log` — use `logger` from `src/lib/logger.ts` (silent in prod).

## TypeScript
- Zero `any` (use `unknown` + narrowing). Zero `@ts-ignore`.
- Explicit return types on exported functions.
- React 19 APIs only.

## Styling (RTL-first)
- NO raw colors. Use CSS vars: `var(--color-text-primary)`, `var(--color-brand-primary)`, etc.
- Logical properties ONLY:
  - `ms-`/`me-` not `ml-`/`mr-`
  - `ps-`/`pe-` not `pl-`/`pr-`
  - `start-`/`end-` not `left-`/`right-`
- Dark mode required (`.dark` class).

## i18n
- Never hardcode user-facing strings. Use `useTranslation()` → `t('key')`.
- Arabic primary, French secondary, English tertiary.
- Run `npm run i18n:audit:strict` after any text changes.

## State management
- **Zustand** = client state (workspace, UI flags)
- **React Query** = server state (Supabase data). Never duplicate in Zustand.
- **Context** = only auth, theme, workspace, notifications.

## File uploads
- Default: `uploadFileWithMetadata()` → calls `secure-upload` edge function.
- Exception: contract deliveries use direct `supabase.storage.from('contract-files').upload()` with `submissions/` prefix (ad-blocker bypass).
- Validation rules: `src/lib/uploadPolicy.ts` (blocked: exe, sh, bat, js, php, etc.)

## Workflow
1. Trace imports downward (Page → Service → Lib → DB). Never reverse.
2. Max 3 new file reads per sub-task. Reuse what you've already read.
3. Minimal changes only. Don't refactor surroundings. Don't add features.
4. If uncertain after 1 step — STOP and ask the user.
5. Update `PROJECT_MAP.md` when creating/deleting files or changing routes/schema.
6. Never break existing tests. If a test fails, your change is wrong unless proven otherwise.
