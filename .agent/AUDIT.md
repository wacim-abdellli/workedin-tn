# Known Issues & Publish Blockers (June 2026 Audit)

## CRITICAL — Must fix before publish

### 1. `public/test-admin.html` deploys to production
- Exposes admin query patterns and table structure to anyone
- **Fix:** Delete the file or add to `.vercelignore`

### 2. Domain mismatch
- `sitemap.xml` + `robots.txt` → `khedmetna.tn`
- All other configs → `workedin.tn`
- **Fix:** Align all files to the final production domain

### 3. Service role key in `.env.local` uses `VITE_` prefix
- `VITE_SUPABASE_SERVICE_ROLE_KEY` would be exposed in browser bundle if Vite builds with it
- **Fix:** Remove `VITE_` prefix. This key should NEVER be in frontend env vars. Rotate if ever committed.

### 4. `user-scalable=no` in viewport (index.html line 14)
- Blocks zoom for low-vision users. Fails WCAG 2.1 SC 1.4.4.
- **Fix:** Remove `maximum-scale=1.0, user-scalable=no`

---

## HIGH — Should fix for quality

### 5. `scratch/` directory (32 debug scripts)
- Not in `.gitignore`, clutters repo
- **Fix:** `git rm -r --cached scratch/` then add to `.gitignore`

### 6. `AUDIT.md` has duplicated content
- Same text appears twice (lines 1-55 = lines 56-120)
- **Fix:** Remove the duplicate section

### 7. `src/components/ui/LoadingStates.example.tsx`
- Demo/example file with `console.log` — should not ship
- **Fix:** Delete or move to `docs/`

---

## MEDIUM — Tech debt (fix when touching)

### 8. God components (high regression risk)
| File | Lines | Risk |
|------|-------|------|
| `src/pages/Messages.tsx` | 5,410 | Extremely high |
| `src/pages/ContractWorkspacePage.tsx` | ~2,000 | High |

- Partial extraction exists in `src/pages/messages/` but main file still dominates.
- When editing: make MINIMAL changes, test extensively.

### 9. `: any` type usage (30+ files)
Key offenders:
- `src/pages/Wallet.tsx`
- `src/pages/JobBoard.tsx`
- `src/pages/JobDetail.tsx`
- `src/services/jobs.ts`
- `src/pages/admin/PaymentsTab.tsx`
- `src/components/settings/ProfileSettings.tsx`

### 10. Circular chunk dependency
- `form-vendor → react-vendor → form-vendor` in Vite build
- Do NOT add cross-imports between these vendor groups
- Future fix: merge `form-vendor` into `react-vendor` in `vite.config.ts`

---

## Security notes (confirmed good)
- DOMPurify sanitization on all HTML rendering
- HMAC-SHA256 webhook verification with constant-time comparison
- RLS on all tables with SECURITY DEFINER admin function
- PKCE auth flow
- Upload policy with blocked extensions + rate limiting
- CSP headers (HSTS, X-Frame-Options DENY, nosniff)
- Zero `@ts-ignore` in entire codebase
- Service role key never imported in frontend source

## Security concerns (not blocking but monitor)
- `unsafe-inline` in CSP script-src (needed for Vite, but weakens XSS protection)
- `isLocalDevOrigin()` in secure-upload allows any localhost — verify not reachable in prod
- Console logging in edge functions may log sensitive request data

---

## Publish checklist (ordered)
- [ ] Delete `public/test-admin.html`
- [ ] Fix domain in `sitemap.xml` and `robots.txt`
- [ ] Remove `VITE_` prefix from service role key in `.env.local`
- [ ] Remove `user-scalable=no` from `index.html` viewport
- [ ] Fix `AUDIT.md` duplication
- [ ] Add `scratch/` to `.gitignore`
- [ ] Add `start_url: "/"` to `manifest.json`
- [ ] Remove console.logs from admin tabs
- [ ] Resolve circular chunk dependency
