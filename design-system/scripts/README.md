> Legacy note: historical migration-tool documentation. Not canonical.
> The current enforced token gate is `npm run tokens:compliance`; see `scripts/README.md` and `audit/DESIGN_TOKEN_COMPLIANCE_POLICY.md`.

# Design System Migration Tools

This directory contains automated tools for migrating the codebase to use the design system tokens.

## Tools Overview

### 1. Color Migration Script (`migrate-colors.js`)

Scans the codebase for hardcoded Tailwind color classes and generates a migration report with suggested replacements using design tokens.

**Features:**
- Detects hardcoded Tailwind color classes (text-*, bg-*, border-*)
- Maps colors to semantic design tokens
- Generates detailed migration report
- Supports dry-run and automated replacement modes
- Tracks auto-fixable vs manual review issues

**Usage:**

```bash
# Dry run (default) - generates report without making changes
node design-system/scripts/migrate-colors.js

# Dry run on specific path
node design-system/scripts/migrate-colors.js --path src/components

# Apply automated fixes
node design-system/scripts/migrate-colors.js --apply

# Custom output file
node design-system/scripts/migrate-colors.js --output my-report.md
```

**Options:**
- `--dry-run` - Generate report without applying changes (default)
- `--apply` - Apply automated replacements to files
- `--path <path>` - Specific path to scan (default: `src/`)
- `--output <file>` - Output file for report (default: `migration-report.md`)

**Example Output:**

```
🔍 Scanning for hardcoded colors...

Mode: DRY RUN
Path: src/pages

Found 56 files to scan

📄 src\pages\AdminDashboard.tsx: 7 issue(s)
📄 src\pages\AuthCallback.tsx: 16 issue(s)
...

Summary:
  Total files scanned: 56
  Files with issues: 49
  Total issues: 1635
  Auto-fixable: 1339
  Manual review: 296

✨ Done!
```

**Color Mappings:**

The script maps hardcoded colors to semantic tokens:

| Hardcoded Class | Design Token |
|----------------|--------------|
| `text-gray-900` | `text-[var(--color-text-primary)]` |
| `text-gray-500` | `text-[var(--color-text-muted)]` |
| `bg-gray-50` | `bg-[var(--color-bg-base)]` |
| `bg-primary-600` | `bg-[var(--color-brand-primary)]` |
| `text-red-500` | `text-[var(--color-status-error)]` |
| `bg-green-500` | `bg-[var(--color-status-success)]` |
| `text-amber-600` | `text-[var(--color-status-warning)]` |
| `border-gray-200` | `border-[var(--color-border-default)]` |

See the script source for the complete mapping table.

### 2. Token Audit Tool (`audit-tokens.js`)

Scans the codebase for inconsistent CSS variable naming, deprecated tokens, and undefined tokens.

**Features:**
- Detects inconsistent CSS variable naming patterns
- Identifies deprecated tokens
- Finds undefined tokens (not in design system)
- Generates usage statistics
- Provides actionable recommendations

**Usage:**

```bash
# Run audit on default path (src/)
node design-system/scripts/audit-tokens.js

# Audit specific path
node design-system/scripts/audit-tokens.js --path src/components

# Custom output file
node design-system/scripts/audit-tokens.js --output my-audit.md

# Custom tokens file
node design-system/scripts/audit-tokens.js --tokens path/to/tokens.json
```

**Options:**
- `--path <path>` - Specific path to scan (default: `src/`)
- `--output <file>` - Output file for report (default: `token-audit-report.md`)
- `--tokens <file>` - Path to tokens file (default: `design-system/output/tokens.json`)

**Example Output:**

```
🔍 Auditing token usage...

Path: src/pages

✅ Loaded 270 defined tokens

Found 56 files to scan

📄 src\pages\AdminDashboard.tsx: 6 issue(s)
📄 src\pages\ClientDashboard.tsx: 29 issue(s)
...

Summary:
  Total files scanned: 56
  Files with issues: 20
  Inconsistent naming: 346
  Deprecated tokens: 0
  Undefined tokens: 16
  Correct usage: 34

✨ Done!
```

**Detected Issues:**

1. **Inconsistent Naming** - Tokens that don't follow the standard naming convention:
   - `--workspace-primary` → `--color-brand-primary`
   - `--text-primary` → `--color-text-primary`
   - `--page-bg` → `--color-bg-base`
   - `--border` → `--color-border-default`

2. **Deprecated Tokens** - Tokens that should no longer be used:
   - `--dark-950` → Use semantic tokens instead

3. **Undefined Tokens** - CSS variables not defined in the design system

## Migration Workflow

### Step 1: Run Initial Audit

```bash
# Audit the entire codebase
node design-system/scripts/audit-tokens.js

# Scan for hardcoded colors
node design-system/scripts/migrate-colors.js
```

Review the generated reports to understand the scope of changes needed.

### Step 2: Prioritize Changes

Based on the reports:
1. Start with high-traffic pages (dashboards, authentication)
2. Focus on auto-fixable issues first
3. Plan manual reviews for complex cases

### Step 3: Apply Automated Fixes

```bash
# Apply color migrations to specific directories
node design-system/scripts/migrate-colors.js --apply --path src/pages/admin
node design-system/scripts/migrate-colors.js --apply --path src/components
```

### Step 4: Manual Review

For issues marked as "MANUAL_REVIEW_NEEDED":
1. Review the context in the report
2. Determine the appropriate semantic token
3. Update manually or extend the mapping table

### Step 5: Verify Changes

```bash
# Re-run audits to verify improvements
node design-system/scripts/audit-tokens.js
node design-system/scripts/migrate-colors.js
```

### Step 6: Test

- Run visual regression tests
- Test light/dark mode switching
- Verify responsive behavior
- Check accessibility (contrast ratios)

## Extending the Tools

### Adding New Color Mappings

Edit `migrate-colors.js` and add entries to the `COLOR_MAPPINGS` object:

```javascript
const COLOR_MAPPINGS = {
  // Add your mapping
  'text-custom-color': 'text-[var(--color-custom-token)]',
  // ...
};
```

### Adding Inconsistent Pattern Detection

Edit `audit-tokens.js` and add entries to the `INCONSISTENT_PATTERNS` array:

```javascript
const INCONSISTENT_PATTERNS = [
  {
    pattern: /var\(--your-token\)/g,
    name: '--your-token',
    suggested: '--color-your-standard-token',
    category: 'your-category',
  },
  // ...
];
```

### Adding Deprecated Tokens

Edit `audit-tokens.js` and add entries to the `DEPRECATED_TOKENS` array:

```javascript
const DEPRECATED_TOKENS = [
  {
    name: '--old-token',
    replacement: '--new-token',
    reason: 'Explanation of why it was deprecated',
  },
  // ...
];
```

## Report Format

Both tools generate Markdown reports with:
- Summary statistics
- Detailed issue listings
- File paths and line numbers
- Current vs suggested values
- Context snippets
- Actionable recommendations

Reports can be:
- Committed to version control for tracking
- Shared with team members
- Used in code review processes
- Referenced in migration documentation

## Best Practices

1. **Always run dry-run first** - Review the report before applying changes
2. **Work incrementally** - Migrate one directory or page at a time
3. **Test thoroughly** - Verify visual appearance after each migration
4. **Commit frequently** - Make small, focused commits for easy rollback
5. **Update mappings** - Add new mappings as you discover patterns
6. **Document decisions** - Note why certain manual changes were made

## Troubleshooting

### "No files found"
- Check that the `--path` points to an existing directory
- Verify file extensions match (`.tsx`, `.ts`, `.jsx`, `.js`, `.css`, `.scss`)

### "Token not found in mapping"
- Add the token to the appropriate mapping table
- Or mark it for manual review in the report

### "Permission denied"
- Ensure you have write permissions when using `--apply`
- Run with appropriate permissions or in a different directory

## Integration with CI/CD

You can integrate these tools into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Audit Design Tokens
  run: |
    node design-system/scripts/audit-tokens.js
    node design-system/scripts/migrate-colors.js
    
- name: Check for issues
  run: |
    # Fail if there are new inconsistencies
    # (customize based on your requirements)
```

## Support

For issues or questions:
1. Check the generated reports for detailed information
2. Review the source code comments
3. Consult the design system documentation
4. Reach out to the design system team
