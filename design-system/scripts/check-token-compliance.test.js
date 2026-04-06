import { describe, expect, it } from 'vitest';

import {
  collectViolationsFromLine,
  parseChangedLines,
  shouldScanFile,
} from '../../scripts/check-design-token-compliance.mjs';

describe('design token compliance gate', () => {
  it('detects legacy CSS variable usage on added lines', () => {
    const violations = collectViolationsFromLine("const color = 'var(--workspace-primary)';");

    expect(violations).toEqual([
      expect.objectContaining({
        type: 'legacy-token',
        match: 'var(--workspace-primary)',
      }),
    ]);
  });

  it('detects hardcoded Tailwind color utilities on added lines', () => {
    const violations = collectViolationsFromLine('className="bg-primary-600 text-gray-900"');

    expect(violations).toEqual([
      expect.objectContaining({ type: 'hardcoded-color', match: 'bg-primary-600' }),
      expect.objectContaining({ type: 'hardcoded-color', match: 'text-gray-900' }),
    ]);
  });

  it('parses git diffs and ignores removed lines and test files', () => {
    const diff = [
      'diff --git a/src/components/Button.tsx b/src/components/Button.tsx',
      '+++ b/src/components/Button.tsx',
      '@@ -10,0 +11,2 @@',
      '+const color = "var(--text-primary)";',
      '+const classes = "bg-primary-600";',
      'diff --git a/src/components/Button.test.tsx b/src/components/Button.test.tsx',
      '+++ b/src/components/Button.test.tsx',
      '@@ -1,0 +1,1 @@',
      '+const snapshot = "text-gray-900";',
      '',
    ].join('\n');

    const violations = parseChangedLines(diff);

    expect(violations).toHaveLength(2);
    expect(violations[0]).toMatchObject({
      file: 'src/components/Button.tsx',
      line: 11,
      type: 'legacy-token',
    });
    expect(violations[1]).toMatchObject({
      file: 'src/components/Button.tsx',
      line: 12,
      type: 'hardcoded-color',
    });
  });

  it('scans only production style-bearing source files', () => {
    expect(shouldScanFile('src/components/Button.tsx')).toBe(true);
    expect(shouldScanFile('src/components/Button.test.tsx')).toBe(false);
    expect(shouldScanFile('src/test/utils.tsx')).toBe(false);
    expect(shouldScanFile('e2e/auth.spec.ts')).toBe(false);
  });
});
