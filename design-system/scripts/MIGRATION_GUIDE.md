# Color System Migration Guide

This guide provides step-by-step instructions for migrating from hardcoded Tailwind colors to design system tokens.

## Quick Start

```bash
# 1. Scan for issues
node design-system/scripts/migrate-colors.js --dry-run
node design-system/scripts/audit-tokens.js

# 2. Review reports
cat migration-report.md
cat token-audit-report.md

# 3. Apply fixes (start with one directory)
node design-system/scripts/migrate-colors.js --apply --path src/pages/admin

# 4. Test and verify
npm run dev
# Test the migrated pages in browser
```

## Understanding the Reports

### Migration Report Structure

```markdown
# Color Migration Report

## Summary
- Total Files Scanned: 56
- Files with Issues: 49
- Total Issues Found: 1635
- Auto-fixable: 1339          ← Can be fixed automatically
- Manual Review Required: 296  ← Need human review

## Issues by File

### src\pages\AdminDashboard.tsx

1. **Line 67:59** - ✅ Auto-fixable
   - Current: `text-gray-900`
   - Suggested: `text-[var(--color-text-primary)]`
   - Context: `<div className="text-gray-900">...</div>`

2. **Line 100:20** - ⚠️ Manual review
   - Current: `bg-slate-950`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `<div className="bg-slate-950">...</div>`
```

### Token Audit Report Structure

```markdown
# Token Audit Report

## Summary
- Inconsistent Naming: 346    ← Non-standard token names
- Deprecated Tokens: 0         ← Old tokens to replace
- Undefined Tokens: 16         ← Not in design system

## Inconsistent Naming

### `--workspace-primary` → `--color-brand-primary`
- Category: brand
- Occurrences: 25
- Files affected:
  - src\pages\AdminDashboard.tsx (lines: 10, 25, 40)
```

## Common Migration Patterns

### Pattern 1: Text Colors

**Before:**
```tsx
<h1 className="text-gray-900 dark:text-gray-100">Title</h1>
<p className="text-gray-600 dark:text-gray-400">Description</p>
<span className="text-gray-500">Muted text</span>
```

**After:**
```tsx
<h1 className="text-[var(--color-text-primary)]">Title</h1>
<p className="text-[var(--color-text-secondary)]">Description</p>
<span className="text-[var(--color-text-muted)]">Muted text</span>
```

**Benefits:**
- Automatic light/dark mode support
- Consistent text hierarchy
- Single source of truth

### Pattern 2: Background Colors

**Before:**
```tsx
<div className="bg-gray-50 dark:bg-gray-900">
  <div className="bg-white dark:bg-gray-800">
    <div className="bg-gray-100 dark:bg-gray-700">
```

**After:**
```tsx
<div className="bg-[var(--color-bg-base)]">
  <div className="bg-[var(--color-bg-elevated)]">
    <div className="bg-[var(--color-bg-subtle)]">
```

**Benefits:**
- Semantic meaning (base, elevated, subtle)
- Automatic theme switching
- Consistent elevation system

### Pattern 3: Status Colors

**Before:**
```tsx
<span className="text-red-600">Error</span>
<span className="text-green-600">Success</span>
<span className="text-amber-600">Warning</span>
<span className="text-blue-600">Info</span>
```

**After:**
```tsx
<span className="text-[var(--color-status-error)]">Error</span>
<span className="text-[var(--color-status-success)]">Success</span>
<span className="text-[var(--color-status-warning)]">Warning</span>
<span className="text-[var(--color-status-info)]">Info</span>
```

**Benefits:**
- Consistent status colors across app
- Easy to update globally
- Accessible contrast ratios

### Pattern 4: Brand Colors

**Before:**
```tsx
<button className="bg-primary-600 hover:bg-primary-700 text-white">
  Click me
</button>
```

**After:**
```tsx
<button className="bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)] text-white">
  Click me
</button>
```

**Benefits:**
- Rebrand without code changes
- Consistent brand colors
- Hover states built-in

### Pattern 5: Border Colors

**Before:**
```tsx
<div className="border border-gray-200 dark:border-gray-700">
  <div className="border-t border-gray-100 dark:border-gray-800">
```

**After:**
```tsx
<div className="border border-[var(--color-border-default)]">
  <div className="border-t border-[var(--color-border-subtle)]">
```

**Benefits:**
- Consistent border hierarchy
- Automatic theme support
- Semantic naming

## Manual Review Cases

Some colors require manual review because they don't have a direct mapping:

### Case 1: Slate/Zinc Colors

**Issue:**
```tsx
<div className="bg-slate-950">  // No direct mapping
```

**Solution:**
Determine the semantic purpose:
- If it's a base background → `bg-[var(--color-bg-base)]`
- If it's elevated → `bg-[var(--color-bg-elevated)]`
- If it's a custom dark shade → Consider adding to design system

### Case 2: Opacity Variants

**Issue:**
```tsx
<div className="bg-primary-500/20">  // Opacity not in mapping
```

**Solution:**
```tsx
<div className="bg-[var(--color-brand-primary)] opacity-20">
// Or use the subtle variant if available
<div className="bg-[var(--color-brand-primary-subtle)]">
```

### Case 3: Gradient Colors

**Issue:**
```tsx
<div className="bg-gradient-to-r from-purple-600 to-blue-600">
```

**Solution:**
```tsx
<div className="bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-secondary)]">
```

### Case 4: Context-Specific Colors

**Issue:**
```tsx
<div className="text-purple-600">  // Used for a specific feature
```

**Solution:**
- If it's a one-off → Keep as is, document why
- If it's reused → Add to design system as a semantic token
- If it's status-related → Use existing status token

## Step-by-Step Migration Process

### Phase 1: Preparation (Day 1)

1. **Run initial scans:**
   ```bash
   node design-system/scripts/migrate-colors.js > migration-report.md
   node design-system/scripts/audit-tokens.js > token-audit-report.md
   ```

2. **Review reports:**
   - Identify high-priority pages
   - Count auto-fixable vs manual issues
   - Estimate effort required

3. **Create migration branch:**
   ```bash
   git checkout -b feature/design-system-migration
   ```

### Phase 2: High-Priority Pages (Days 2-3)

Migrate authentication and dashboard pages first:

```bash
# Auth pages
node design-system/scripts/migrate-colors.js --apply --path src/pages/Login.tsx
node design-system/scripts/migrate-colors.js --apply --path src/pages/Signup.tsx
node design-system/scripts/migrate-colors.js --apply --path src/pages/ForgotPassword.tsx

# Test auth flow
npm run dev
# Manually test login, signup, password reset
```

```bash
# Dashboard pages
node design-system/scripts/migrate-colors.js --apply --path src/pages/ClientDashboard.tsx
node design-system/scripts/migrate-colors.js --apply --path src/pages/FreelancerDashboard.tsx
node design-system/scripts/migrate-colors.js --apply --path src/pages/AdminDashboard.tsx

# Test dashboards
# Verify stats, widgets, navigation
```

### Phase 3: Core Features (Days 4-6)

```bash
# Job-related pages
node design-system/scripts/migrate-colors.js --apply --path src/pages/JobBoard.tsx
node design-system/scripts/migrate-colors.js --apply --path src/pages/JobDetail.tsx
node design-system/scripts/migrate-colors.js --apply --path src/pages/JobPost.tsx

# Profile pages
node design-system/scripts/migrate-colors.js --apply --path src/pages/FreelancerProfile.tsx
node design-system/scripts/migrate-colors.js --apply --path src/pages/ClientOnboarding.tsx
```

### Phase 4: Remaining Pages (Days 7-8)

```bash
# Admin pages
node design-system/scripts/migrate-colors.js --apply --path src/pages/admin/

# Utility pages
node design-system/scripts/migrate-colors.js --apply --path src/pages/Settings.tsx
node design-system/scripts/migrate-colors.js --apply --path src/pages/Messages.tsx
```

### Phase 5: Components (Days 9-10)

```bash
# Migrate shared components
node design-system/scripts/migrate-colors.js --apply --path src/components/
```

### Phase 6: Manual Review (Days 11-12)

1. **Review manual cases:**
   - Open `migration-report.md`
   - Search for "MANUAL_REVIEW_NEEDED"
   - Update each case based on context

2. **Fix inconsistent tokens:**
   - Open `token-audit-report.md`
   - Replace inconsistent token names
   - Example: `var(--workspace-primary)` → `var(--color-brand-primary)`

### Phase 7: Testing (Days 13-14)

1. **Visual testing:**
   - Test all migrated pages in light mode
   - Test all migrated pages in dark mode
   - Verify responsive behavior

2. **Automated testing:**
   ```bash
   npm run test
   npm run lint
   ```

3. **Accessibility testing:**
   - Check color contrast ratios
   - Test with screen readers
   - Verify keyboard navigation

### Phase 8: Verification (Day 15)

```bash
# Re-run scans to verify improvements
node design-system/scripts/migrate-colors.js
node design-system/scripts/audit-tokens.js

# Should show significant reduction in issues
```

## Testing Checklist

After migration, verify:

- [ ] Light mode displays correctly
- [ ] Dark mode displays correctly
- [ ] Theme toggle works smoothly
- [ ] No visual regressions
- [ ] Text is readable (contrast)
- [ ] Buttons have correct colors
- [ ] Status indicators are clear
- [ ] Borders are visible
- [ ] Hover states work
- [ ] Focus states are visible
- [ ] Responsive design intact
- [ ] No console errors
- [ ] Build succeeds
- [ ] Tests pass

## Common Issues and Solutions

### Issue: Colors look different after migration

**Cause:** Token values might differ from hardcoded colors

**Solution:**
1. Check token definitions in `design-system/tokens/colors.json`
2. Verify the mapping is correct
3. If intentional, document the change
4. If not, adjust token values

### Issue: Dark mode not working

**Cause:** Missing dark mode token values

**Solution:**
1. Check `colors.json` has both light and dark values
2. Verify `.dark` class is applied to root element
3. Check CSS variable definitions in output

### Issue: Build errors after migration

**Cause:** Syntax errors in class names

**Solution:**
1. Ensure proper escaping: `text-[var(--color-text-primary)]`
2. Check for typos in token names
3. Verify Tailwind config includes arbitrary values

### Issue: Some colors still hardcoded

**Cause:** Not all patterns detected by script

**Solution:**
1. Search codebase for remaining patterns:
   ```bash
   grep -r "text-gray-" src/
   grep -r "bg-primary-" src/
   ```
2. Update manually or extend script patterns

## Rollback Plan

If issues arise:

```bash
# Rollback to previous commit
git reset --hard HEAD~1

# Or revert specific files
git checkout HEAD~1 -- src/pages/problematic-page.tsx

# Or create a revert commit
git revert <commit-hash>
```

## Success Metrics

Track these metrics to measure migration success:

- **Before Migration:**
  - Hardcoded colors: ~1635
  - Inconsistent tokens: ~346
  - Files with issues: ~49

- **After Migration:**
  - Hardcoded colors: <50 (only justified cases)
  - Inconsistent tokens: 0
  - Files with issues: <5

- **Quality Improvements:**
  - Consistent theme switching
  - Reduced CSS duplication
  - Easier maintenance
  - Better accessibility

## Next Steps

After completing the migration:

1. **Update documentation:**
   - Document any custom tokens added
   - Update component guidelines
   - Create before/after examples

2. **Team training:**
   - Share design system documentation
   - Demonstrate token usage
   - Establish code review guidelines

3. **Prevent regression:**
   - Add linting rules for hardcoded colors
   - Include token audit in CI/CD
   - Create PR templates with checklist

4. **Continuous improvement:**
   - Gather feedback from team
   - Refine token naming if needed
   - Add new tokens as needed

## Resources

- [Design System Documentation](../README.md)
- [Token Reference](../output/tokens.json)
- [Color System Guide](../tokens/colors.json)
- [Migration Tools README](./README.md)
