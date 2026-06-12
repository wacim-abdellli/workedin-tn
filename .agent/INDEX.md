# WorkedIn TN — Agent Context (.agent/)

> Give this file to the agent at session start. It costs ~40 lines.
> Then point it to the sub-file matching its task.

## What is this project?
Tunisian freelance marketplace. React 19 + Vite + Supabase + Tailwind.
Arabic (RTL) primary, French secondary, English tertiary.
Domain: workedin.tn | Deployed on Vercel.

## Which file to read next?

| Your task involves... | Read this file |
|---|---|
| Any code change (always read) | `.agent/RULES.md` |
| Understanding structure, routes, DB, flows | `.agent/ARCHITECTURE.md` |
| Bugs, known issues, what's broken, publish prep | `.agent/AUDIT.md` |

## Minimum validation before declaring done:
```bash
npx tsc --noEmit && npm run test:run && npm run i18n:audit
```

## Risk escalation:
- LOW (UI-only): just run tsc
- MEDIUM (services/hooks): tsc + test:run
- HIGH (auth/payments/contracts): tsc + test:run + test:e2e + ask user
- CRITICAL (edge functions/migrations/secrets): full audit:strict + user approval
