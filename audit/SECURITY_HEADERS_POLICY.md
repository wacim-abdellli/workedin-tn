# Security Headers Policy

This document is the P0-4 source of truth for response-header enforcement on `khedma-tn` deployments.

## Scope

- Primary deployment target: Vercel edge responses configured in `vercel.json`
- Local parity for verification: Vite preview middleware in `vite.config.ts`
- Verification coverage paths:
  - `/`
  - `/login`
  - `/api/live`

Preview CI verifies the SPA response path (`/` and `/login`). The deployed-environment workflow verifies the same HTML paths plus `/api/live` so API responses are included in the release evidence.

## Required Headers

| Header | Required value / rule | Why it matters |
| --- | --- | --- |
| `Content-Security-Policy` | Must enforce `default-src 'self'`, locked `frame-ancestors`, `base-uri`, `form-action`, `object-src`, and explicit third-party allowlists for Supabase, PostHog, and Sentry | Prevents XSS, clickjacking, and accidental third-party sprawl |
| `Strict-Transport-Security` | `max-age` of at least `31536000` plus `includeSubDomains; preload` | Forces HTTPS on repeat visits and strengthens downgrade resistance |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `X-Frame-Options` | `DENY` | Hard clickjacking protection for browsers that still honor it |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Reduces sensitive referrer leakage |
| `Permissions-Policy` | `camera=(), microphone=(self), geolocation=()` | Denies unused powerful features and limits microphone access to first-party flows |

## Enforcement Points

1. `vercel.json`
   - Canonical deployment header policy for all routes, including `/api/*`
2. `vite.config.ts`
   - Preview server mirrors production header behavior for CI verification
   - Dev server keeps a compatible CSP for HMR while preserving the non-CSP hardening headers

## Verification Command

```bash
npm run headers:verify -- --base-url https://khedma-tn.vercel.app --label production --output artifacts/security-headers/production.json
```

Optional flags:

- `--paths /,/login,/api/live`
- `--wait-ms 30000`

## Release Evidence

- CI uploads `artifacts/security-headers/ci-preview.json` after preview verification.
- The GitHub Actions workflow `Verify Security Headers` can be run against staging or production and uploads a per-environment artifact.
- A release is not ready if any required header is missing or weakened on any verified endpoint.
