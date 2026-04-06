# Release Policy

This document is the P3-2 source of truth for release readiness, mandatory sign-off roles, and the single release-control command.

## Final Rule

If any mandatory item is unchecked, release is **NO-GO**.

## Mandatory Sign-Off Roles

- Engineering owner
  - Confirms `npm run release:control` passed.
  - Confirms migrations, deploy steps, and rollback path are ready.
- QA owner
  - Confirms critical journeys, route scenarios, accessibility, and visual baselines are accepted.
- Security owner
  - Confirms dependency audit, header verification, DB policy evidence, and upload/sanitization controls remain acceptable.

Release approval is incomplete until all three roles sign off.

## Mandatory Checklist

### Technical Gate

- [ ] Strict quality pipeline fully green
- [ ] No blocking lint/type/test/build failures
- [ ] No critical security vulnerabilities in dependencies
- [ ] Security headers verified on deployed endpoints
- [ ] DB policies validated by matrix + negative tests
- [ ] Route scenario matrix fully passing
- [ ] Auth/account status/workspace guard behaviors verified
- [ ] Upload/input sanitization and validation proven
- [ ] Error capture and recovery paths validated
- [ ] 404/500/fallback behavior validated

### Product Scenario Gate

- [ ] Guest cannot access protected resources
- [ ] Freelancer/client/admin role separations enforced
- [ ] Onboarding gate works for all role/state combinations
- [ ] Suspended/archived account behavior is correct
- [ ] Payment success/failure callbacks behave correctly
- [ ] Messaging/contracts ownership protections verified
- [ ] Critical journeys complete without flow breaks

### UX / A11y Gate

- [ ] Critical pages pass a11y checks
- [ ] Color contrast and focus states pass minimum thresholds
- [ ] Responsive behavior validated on key breakpoints
- [ ] Design token compliance enforced in CI
- [ ] Visual regression baseline accepted for critical pages

### Governance & Evidence Gate

- [ ] Audit evidence pack updated and versioned
- [ ] Risk register updated with open/closed findings
- [ ] Release sign-off by engineering + QA + security owner
- [ ] Rollback plan validated
- [ ] Post-release monitoring dashboard ready

## Release Control Command

```bash
npm run release:control -- --base-url https://<release-candidate-url> --label rc-2026-04-07
```

This command is mandatory before audience-facing release. It validates:

1. strict quality pipeline
2. dependency vulnerability gate
3. visual regression gate
4. deployed security headers

It writes a machine-readable report to:

- `artifacts/release-control/report.json`

Related evidence is also produced in:

- `artifacts/dependency-audit/`
- `artifacts/security-headers/`
- `playwright-report/`
- `test-results/`

## Release Record

Use the GitHub issue template `Release Checklist` to record:

- target environment / base URL
- checklist completion
- evidence links
- engineering sign-off
- QA sign-off
- security sign-off
