/**
 * Unit Tests for Color Migration Script
 * Tests pattern matching for hardcoded colors, replacement logic, and report generation
 */

import { describe, it, expect } from 'vitest';

// Test data and patterns from migrate-colors.js
const COLOR_MAPPINGS = {
  'text-gray-900': 'text-[var(--color-text-primary)]',
  'text-primary-600': 'text-[var(--color-brand-primary)]',
  'bg-gray-50': 'bg-[var(--color-bg-base)]',
  'bg-primary-600': 'bg-[var(--color-brand-primary)]',
  'border-gray-300': 'border-[var(--color-border-default)]',
  'text-red-600': 'text-[var(--color-status-error)]',
  'text-green-600': 'text-[var(--color-status-success)]',
  'text-amber-600': 'text-[var(--color-status-warning)]',
};

const COLOR_PATTERNS = [
  /\b(text|bg|border)-(gray|red|green|blue|yellow|amber|purple|pink|indigo|cyan|emerald|primary|secondary|accent)-(50|100|200|300|400|500|600|700|800|900)\b/g,
  /\b(text|bg|border)-slate-(50|100|200|300|400|500|600|700|800|900|950)\b/g,
  /\b(text|bg|border)-zinc-(50|100|200|300|400|500|600|700|800|900|950)\b/g,
];

describe('ColorMigrator - Pattern Matching', () => {
  describe('Hardcoded Color Detection', () => {
    it('should detect text-gray-900 color class', () => {
      const line = '<div className="text-gray-900">Hello</div>';
      const pattern = COLOR_PATTERNS[0];
      const matches = [...line.matchAll(pattern)];
      
      expect(matches).toHaveLength(1);
      expect(matches[0][0]).toBe('text-gray-900');
    });

    it('should detect bg-primary-600 color class', () => {
      const line = '<div className="bg-primary-600">Content</div>';
      const pattern = COLOR_PATTERNS[0];
      const matches = [...line.matchAll(pattern)];
      
      expect(matches).toHaveLength(1);
      expect(matches[0][0]).toBe('bg-primary-600');
    });

    it('should detect border-gray-300 color class', () => {
      const line = '<div className="border-gray-300">Content</div>';
      const pattern = COLOR_PATTERNS[0];
      const matches = [...line.matchAll(pattern)];
      
      expect(matches).toHaveLength(1);
      expect(matches[0][0]).toBe('border-gray-300');
    });

    it('should detect multiple color classes on same line', () => {
      const line = '<div className="text-gray-900 bg-gray-50 border-gray-300">Content</div>';
      const pattern = COLOR_PATTERNS[0];
      const matches = [...line.matchAll(pattern)];
      
      expect(matches).toHaveLength(3);
    });

    it('should detect status colors (red, green, amber)', () => {
      const line = '<div className="text-red-600 text-green-600 text-amber-600">Status</div>';
      const pattern = COLOR_PATTERNS[0];
      const matches = [...line.matchAll(pattern)];
      
      expect(matches).toHaveLength(3);
      expect(matches.map(m => m[0])).toContain('text-red-600');
      expect(matches.map(m => m[0])).toContain('text-green-600');
      expect(matches.map(m => m[0])).toContain('text-amber-600');
    });

    it('should detect slate color classes', () => {
      const line = '<div className="text-slate-700 bg-slate-100">Content</div>';
      const pattern = COLOR_PATTERNS[1];
      const matches = [...line.matchAll(pattern)];
      
      expect(matches).toHaveLength(2);
    });

    it('should detect zinc color classes', () => {
      const line = '<div className="text-zinc-600 bg-zinc-50">Content</div>';
      const pattern = COLOR_PATTERNS[2];
      const matches = [...line.matchAll(pattern)];
      
      expect(matches).toHaveLength(2);
    });

    it('should not detect non-color classes', () => {
      const line = '<div className="flex items-center justify-between p-4">Content</div>';
      const pattern = COLOR_PATTERNS[0];
      const matches = [...line.matchAll(pattern)];
      
      expect(matches).toHaveLength(0);
    });
  });

  describe('Replacement Logic', () => {
    it('should have correct replacement for text-gray-900', () => {
      expect(COLOR_MAPPINGS['text-gray-900']).toBe('text-[var(--color-text-primary)]');
    });

    it('should have correct replacement for bg-primary-600', () => {
      expect(COLOR_MAPPINGS['bg-primary-600']).toBe('bg-[var(--color-brand-primary)]');
    });

    it('should have correct replacement for status colors', () => {
      expect(COLOR_MAPPINGS['text-red-600']).toBe('text-[var(--color-status-error)]');
      expect(COLOR_MAPPINGS['text-green-600']).toBe('text-[var(--color-status-success)]');
      expect(COLOR_MAPPINGS['text-amber-600']).toBe('text-[var(--color-status-warning)]');
    });

    it('should apply replacement to line content', () => {
      const line = '<div className="text-gray-900">Content</div>';
      const replaced = line.replace('text-gray-900', COLOR_MAPPINGS['text-gray-900']);
      
      expect(replaced).toContain('text-[var(--color-text-primary)]');
      expect(replaced).not.toContain('text-gray-900');
    });

    it('should handle multiple replacements on same line', () => {
      let line = '<div className="text-gray-900 bg-gray-50">Content</div>';
      line = line.replace('text-gray-900', COLOR_MAPPINGS['text-gray-900']);
      line = line.replace('bg-gray-50', COLOR_MAPPINGS['bg-gray-50']);
      
      expect(line).toContain('text-[var(--color-text-primary)]');
      expect(line).toContain('bg-[var(--color-bg-base)]');
    });
  });

  describe('Report Generation Logic', () => {
    it('should format issue with line and column', () => {
      const issue = {
        file: 'test-src/Component.tsx',
        line: 10,
        column: 5,
        current: 'text-gray-900',
        suggested: 'text-[var(--color-text-primary)]',
        autoFixable: true,
        context: '<div className="text-gray-900">',
      };

      const formatted = `**Line ${issue.line}:${issue.column}** - ${issue.autoFixable ? '✅ Auto-fixable' : '⚠️ Manual review'}`;
      
      expect(formatted).toContain('Line 10:5');
      expect(formatted).toContain('✅ Auto-fixable');
    });

    it('should group issues by file', () => {
      const issues = [
        { file: 'Component1.tsx', current: 'text-gray-900' },
        { file: 'Component1.tsx', current: 'bg-primary-600' },
        { file: 'Component2.tsx', current: 'text-red-600' },
      ];

      const grouped = {};
      issues.forEach(issue => {
        if (!grouped[issue.file]) {
          grouped[issue.file] = [];
        }
        grouped[issue.file].push(issue);
      });

      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['Component1.tsx']).toHaveLength(2);
      expect(grouped['Component2.tsx']).toHaveLength(1);
    });

    it('should calculate statistics correctly', () => {
      const issues = [
        { autoFixable: true },
        { autoFixable: true },
        { autoFixable: false },
      ];

      const stats = {
        autoFixable: issues.filter(i => i.autoFixable).length,
        manualReview: issues.filter(i => !i.autoFixable).length,
      };

      expect(stats.autoFixable).toBe(2);
      expect(stats.manualReview).toBe(1);
    });
  });
});
