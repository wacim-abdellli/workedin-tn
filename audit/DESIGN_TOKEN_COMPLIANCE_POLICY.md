# Design Token Compliance Policy

This document is the P2-1 source of truth for design-token enforcement in `khedma-tn`.

## Gate

- Command: `npm run tokens:compliance`
- Enforcement scope: changed lines only
- Failure rule: any newly added hardcoded color utility or legacy token reference fails CI

## What is blocked

- Legacy CSS variables such as:
  - `var(--workspace-primary)`
  - `var(--text-primary)`
  - `var(--page-bg)`
  - primitive dark tokens like `var(--dark-950)`
- Hardcoded Tailwind color utilities such as:
  - `text-gray-900`
  - `bg-primary-600`
  - `border-gray-300`
  - similar `red|green|blue|amber|slate|zinc|dark` color classes

## Why changed-lines only

The repository still contains legacy styling debt. P2-1 prevents new violations from landing in CI without forcing a risky repo-wide rewrite in a single step.

## Artifact

- Output: `artifacts/design-token-compliance/report.json`
- CI uploads the report even on failure so violations remain auditable

## Local usage

```bash
# check staged changes before commit
npm run tokens:compliance -- --staged

# check a commit range explicitly
npm run tokens:compliance -- --from HEAD~1 --to HEAD
```
