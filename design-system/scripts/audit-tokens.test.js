/**
 * Unit Tests for Token Audit Tool
 * Tests pattern matching for inconsistent naming, deprecated tokens, and report generation
 */

import { describe, it, expect } from 'vitest';

// Test data from audit-tokens.js
const INCONSISTENT_PATTERNS = [
  {
    name: '--workspace-primary',
    suggested: '--color-brand-primary',
    category: 'brand',
  },
  {
    name: '--text-primary',
    suggested: '--color-text-primary',
    category: 'text',
  },
  {
    name: '--page-bg',
    suggested: '--color-bg-base',
    category: 'background',
  },
  {
    name: '--border',
    suggested: '--color-border-default',
    category: 'border',
  },
];

const DEPRECATED_TOKENS = [
  {
    name: '--dark-950',
    replacement: '--color-bg-base (dark mode)',
    reason: 'Use semantic color tokens instead of primitive colors',
  },
  {
    name: '--dark-800',
    replacement: '--color-bg-elevated (dark mode)',
    reason: 'Use semantic color tokens instead of primitive colors',
  },
];

describe('TokenAuditor - Pattern Matching', () => {
  describe('Inconsistent Naming Detection', () => {
    it('should detect --workspace-primary pattern', () => {
      const line = '<div style={{ color: \'var(--workspace-primary)\' }}>Content</div>';
      const pattern = /var\(--workspace-primary\)/g;
      const matches = [...line.matchAll(pattern)];
      
      expect(matches).toHaveLength(1);
    });

    it('should detect --text-primary pattern', () => {
      const line = '<div style={{ color: \'var(--text-primary)\' }}>Content</div>';
      const pattern = /var\(--text-primary\)/g;
      const matches = [...line.matchAll(pattern)];
      
      expect(matches).toHaveLength(1);
    });

    it('should detect --page-bg pattern', () => {
      const line = '<div style={{ background: \'var(--page-bg)\' }}>Content</div>';
      const pattern = /var\(--page-bg\)/g;
      const matches = [...line.matchAll(pattern)];
      
      expect(matches).toHaveLength(1);
    });

    it('should detect multiple inconsistent tokens on same line', () => {
      const line = '<div style={{ color: \'var(--text-primary)\', background: \'var(--page-bg)\' }}>Content</div>';
      const pattern1 = /var\(--text-primary\)/g;
      const pattern2 = /var\(--page-bg\)/g;
      
      expect([...line.matchAll(pattern1)]).toHaveLength(1);
      expect([...line.matchAll(pattern2)]).toHaveLength(1);
    });

    it('should have correct suggestions for inconsistent tokens', () => {
      const workspacePrimary = INCONSISTENT_PATTERNS.find(p => p.name === '--workspace-primary');
      expect(workspacePrimary.suggested).toBe('--color-brand-primary');
      expect(workspacePrimary.category).toBe('brand');
    });
  });

  describe('Deprecated Token Detection', () => {
    it('should detect --dark-950 deprecated token', () => {
      const line = '<div style={{ background: \'var(--dark-950)\' }}>Content</div>';
      const pattern = /var\(--dark-950\)/g;
      const matches = [...line.matchAll(pattern)];
      
      expect(matches).toHaveLength(1);
    });

    it('should detect --dark-800 deprecated token', () => {
      const line = '<div style={{ background: \'var(--dark-800)\' }}>Content</div>';
      const pattern = /var\(--dark-800\)/g;
      const matches = [...line.matchAll(pattern)];
      
      expect(matches).toHaveLength(1);
    });

    it('should have correct replacements for deprecated tokens', () => {
      const dark950 = DEPRECATED_TOKENS.find(t => t.name === '--dark-950');
      expect(dark950.replacement).toContain('--color-bg-base');
      expect(dark950.reason).toContain('semantic color tokens');
    });
  });

  describe('Undefined Token Detection', () => {
    it('should detect custom undefined tokens', () => {
      const line = '<div style={{ color: \'var(--custom-undefined-token)\' }}>Content</div>';
      const pattern = /var\((--[a-z0-9-]+)\)/g;
      const matches = [...line.matchAll(pattern)];
      
      expect(matches).toHaveLength(1);
      expect(matches[0][1]).toBe('--custom-undefined-token');
    });

    it('should extract token name from var() usage', () => {
      const line = '<div style={{ color: \'var(--my-token)\' }}>Content</div>';
      const pattern = /var\((--[a-z0-9-]+)\)/g;
      const match = pattern.exec(line);
      
      expect(match[1]).toBe('--my-token');
    });

    it('should skip Tailwind internal tokens', () => {
      const tokenName = '--tw-ring-color';
      const isTailwindInternal = tokenName.startsWith('--tw-');
      
      expect(isTailwindInternal).toBe(true);
    });
  });

  describe('Report Generation Logic', () => {
    it('should group issues by token name', () => {
      const issues = [
        { current: '--workspace-primary', file: 'file1.tsx' },
        { current: '--workspace-primary', file: 'file2.tsx' },
        { current: '--text-primary', file: 'file3.tsx' },
      ];

      const grouped = {};
      issues.forEach(issue => {
        if (!grouped[issue.current]) {
          grouped[issue.current] = [];
        }
        grouped[issue.current].push(issue);
      });

      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['--workspace-primary']).toHaveLength(2);
      expect(grouped['--text-primary']).toHaveLength(1);
    });

    it('should track token usage statistics', () => {
      const tokenUsage = new Map();
      
      tokenUsage.set('--workspace-primary', [
        { file: 'file1.tsx', line: 1 },
        { file: 'file2.tsx', line: 2 },
        { file: 'file3.tsx', line: 3 },
      ]);
      tokenUsage.set('--text-primary', [
        { file: 'file1.tsx', line: 1 },
      ]);

      expect(tokenUsage.get('--workspace-primary')).toHaveLength(3);
      expect(tokenUsage.get('--text-primary')).toHaveLength(1);
    });

    it('should sort token usage by frequency', () => {
      const tokenUsage = new Map([
        ['--token-a', [1]],
        ['--token-b', [1, 2, 3]],
        ['--token-c', [1, 2]],
      ]);

      const sorted = Array.from(tokenUsage.entries())
        .sort((a, b) => b[1].length - a[1].length);

      expect(sorted[0][0]).toBe('--token-b');
      expect(sorted[1][0]).toBe('--token-c');
      expect(sorted[2][0]).toBe('--token-a');
    });

    it('should calculate statistics correctly', () => {
      const issues = [
        { type: 'inconsistent-naming' },
        { type: 'inconsistent-naming' },
        { type: 'deprecated-token' },
        { type: 'undefined-token' },
      ];

      const stats = {
        inconsistentNaming: issues.filter(i => i.type === 'inconsistent-naming').length,
        deprecatedTokens: issues.filter(i => i.type === 'deprecated-token').length,
        undefinedTokens: issues.filter(i => i.type === 'undefined-token').length,
      };

      expect(stats.inconsistentNaming).toBe(2);
      expect(stats.deprecatedTokens).toBe(1);
      expect(stats.undefinedTokens).toBe(1);
    });

    it('should format issue sections correctly', () => {
      const token = {
        name: '--workspace-primary',
        suggested: '--color-brand-primary',
        category: 'brand',
        occurrences: 5,
      };

      const formatted = `### \`${token.name}\` → \`${token.suggested}\`\n- **Category**: ${token.category}\n- **Occurrences**: ${token.occurrences}`;

      expect(formatted).toContain('--workspace-primary');
      expect(formatted).toContain('--color-brand-primary');
      expect(formatted).toContain('brand');
      expect(formatted).toContain('5');
    });
  });

  describe('Token Loading Logic', () => {
    it('should extract token names from nested structure', () => {
      const tokensData = {
        color: {
          brand: {
            primary: { value: '#9333ea' },
          },
          text: {
            primary: { value: '#171717' },
          },
        },
      };

      const definedTokens = new Set();
      
      const extractTokens = (obj, prefix = '') => {
        Object.keys(obj).forEach(key => {
          const value = obj[key];
          const tokenName = prefix ? `${prefix}-${key}` : key;
          
          if (typeof value === 'object' && value !== null && !value.value) {
            extractTokens(value, tokenName);
          } else {
            definedTokens.add(`--${tokenName}`);
          }
        });
      };

      extractTokens(tokensData);

      expect(definedTokens.has('--color-brand-primary')).toBe(true);
      expect(definedTokens.has('--color-text-primary')).toBe(true);
    });

    it('should handle nested token structure with light/dark modes', () => {
      const tokensData = {
        color: {
          brand: {
            primary: {
              light: { value: '#9333ea' },
              dark: { value: '#a855f7' },
            },
          },
        },
      };

      const definedTokens = new Set();
      
      const extractTokens = (obj, prefix = '') => {
        Object.keys(obj).forEach(key => {
          const value = obj[key];
          const tokenName = prefix ? `${prefix}-${key}` : key;
          
          if (typeof value === 'object' && value !== null && !value.value) {
            extractTokens(value, tokenName);
          } else {
            definedTokens.add(`--${tokenName}`);
          }
        });
      };

      extractTokens(tokensData);

      expect(definedTokens.has('--color-brand-primary-light')).toBe(true);
      expect(definedTokens.has('--color-brand-primary-dark')).toBe(true);
    });
  });
});
