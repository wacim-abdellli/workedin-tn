#!/usr/bin/env node

/**
 * Color Migration Script
 * 
 * Scans the codebase for hardcoded Tailwind color classes and generates
 * a migration report with suggested replacements using design tokens.
 * 
 * Usage:
 *   node design-system/scripts/migrate-colors.js [options]
 * 
 * Options:
 *   --dry-run    Generate report without applying changes (default)
 *   --apply      Apply automated replacements
 *   --path       Specific path to scan (default: src/)
 *   --output     Output file for report (default: migration-report.md)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color mapping from hardcoded Tailwind to design tokens
const COLOR_MAPPINGS = {
  // Text colors
  'text-gray-900': 'text-[var(--color-text-primary)]',
  'text-gray-800': 'text-[var(--color-text-primary)]',
  'text-gray-700': 'text-[var(--color-text-secondary)]',
  'text-gray-600': 'text-[var(--color-text-secondary)]',
  'text-gray-500': 'text-[var(--color-text-muted)]',
  'text-gray-400': 'text-[var(--color-text-muted)]',
  'text-gray-300': 'text-[var(--color-text-disabled)]',
  'text-gray-200': 'text-[var(--color-text-disabled)]',
  'text-gray-100': 'text-[var(--color-text-primary)]', // dark mode
  
  'text-primary-600': 'text-[var(--color-brand-primary)]',
  'text-primary-700': 'text-[var(--color-brand-primary-hover)]',
  'text-primary-500': 'text-[var(--color-brand-primary)]',
  'text-primary-400': 'text-[var(--color-brand-primary)]', // dark mode
  'text-primary-300': 'text-[var(--color-brand-primary)]', // dark mode
  'text-primary-200': 'text-[var(--color-brand-primary)]', // dark mode
  
  'text-red-600': 'text-[var(--color-status-error)]',
  'text-red-500': 'text-[var(--color-status-error)]',
  'text-red-400': 'text-[var(--color-status-error)]', // dark mode
  'text-red-700': 'text-[var(--color-status-error-hover)]',
  'text-red-900': 'text-[var(--color-status-error-hover)]',
  'text-red-300': 'text-[var(--color-status-error)]', // dark mode
  
  'text-green-600': 'text-[var(--color-status-success)]',
  'text-green-500': 'text-[var(--color-status-success)]',
  'text-green-400': 'text-[var(--color-status-success)]', // dark mode
  'text-green-700': 'text-[var(--color-status-success-hover)]',
  
  'text-amber-600': 'text-[var(--color-status-warning)]',
  'text-amber-500': 'text-[var(--color-status-warning)]',
  'text-amber-400': 'text-[var(--color-status-warning)]', // dark mode
  'text-amber-800': 'text-[var(--color-status-warning-hover)]',
  
  'text-yellow-600': 'text-[var(--color-status-warning)]',
  'text-yellow-500': 'text-[var(--color-status-warning)]',
  'text-yellow-800': 'text-[var(--color-status-warning-hover)]',
  
  'text-blue-600': 'text-[var(--color-status-info)]',
  'text-blue-700': 'text-[var(--color-status-info-hover)]',
  'text-blue-300': 'text-[var(--color-status-info)]', // dark mode
  
  // Background colors
  'bg-gray-50': 'bg-[var(--color-bg-base)]',
  'bg-gray-100': 'bg-[var(--color-bg-subtle)]',
  'bg-gray-200': 'bg-[var(--color-bg-muted)]',
  'bg-gray-700': 'bg-[var(--color-bg-muted)]', // dark mode
  'bg-gray-800': 'bg-[var(--color-bg-elevated)]',
  'bg-gray-900': 'bg-[var(--color-bg-base)]', // dark mode
  
  'bg-primary-50': 'bg-[var(--color-brand-primary-subtle)]',
  'bg-primary-100': 'bg-[var(--color-brand-primary-subtle)]',
  'bg-primary-500': 'bg-[var(--color-brand-primary)]',
  'bg-primary-600': 'bg-[var(--color-brand-primary)]',
  'bg-primary-700': 'bg-[var(--color-brand-primary-hover)]',
  'bg-primary-900': 'bg-[var(--color-brand-primary-subtle)]', // dark mode
  
  'bg-red-50': 'bg-[var(--color-status-error-subtle)]',
  'bg-red-100': 'bg-[var(--color-status-error-subtle)]',
  'bg-red-500': 'bg-[var(--color-status-error)]',
  'bg-red-600': 'bg-[var(--color-status-error)]',
  'bg-red-700': 'bg-[var(--color-status-error-hover)]',
  'bg-red-900': 'bg-[var(--color-status-error-subtle)]', // dark mode
  
  'bg-green-100': 'bg-[var(--color-status-success-subtle)]',
  'bg-green-500': 'bg-[var(--color-status-success)]',
  'bg-green-600': 'bg-[var(--color-status-success)]',
  'bg-green-700': 'bg-[var(--color-status-success-hover)]',
  'bg-green-900': 'bg-[var(--color-status-success-subtle)]', // dark mode
  
  'bg-amber-50': 'bg-[var(--color-status-warning-subtle)]',
  'bg-amber-500': 'bg-[var(--color-status-warning)]',
  'bg-amber-600': 'bg-[var(--color-status-warning)]',
  'bg-amber-700': 'bg-[var(--color-status-warning-hover)]',
  'bg-amber-900': 'bg-[var(--color-status-warning-subtle)]', // dark mode
  
  'bg-yellow-50': 'bg-[var(--color-status-warning-subtle)]',
  
  'bg-blue-50': 'bg-[var(--color-status-info-subtle)]',
  'bg-blue-500': 'bg-[var(--color-status-info)]',
  
  // Border colors
  'border-gray-100': 'border-[var(--color-border-subtle)]',
  'border-gray-200': 'border-[var(--color-border-default)]',
  'border-gray-300': 'border-[var(--color-border-default)]',
  'border-gray-700': 'border-[var(--color-border-default)]', // dark mode
  'border-gray-800': 'border-[var(--color-border-strong)]',
  
  'border-primary-500': 'border-[var(--color-brand-primary)]',
  'border-primary-600': 'border-[var(--color-brand-primary)]',
  'border-primary-400': 'border-[var(--color-brand-primary)]',
  
  'border-red-200': 'border-[var(--color-status-error-subtle)]',
  'border-red-500': 'border-[var(--color-status-error)]',
  
  'border-green-200': 'border-[var(--color-status-success-subtle)]',
  'border-green-500': 'border-[var(--color-status-success)]',
  
  'border-amber-200': 'border-[var(--color-status-warning-subtle)]',
  'border-amber-500': 'border-[var(--color-status-warning)]',
};

// Patterns to detect hardcoded colors
const COLOR_PATTERNS = [
  // Standard Tailwind color classes
  /\b(text|bg|border)-(gray|red|green|blue|yellow|amber|purple|pink|indigo|cyan|emerald|primary|secondary|accent)-(50|100|200|300|400|500|600|700|800|900)\b/g,
  // Slate colors
  /\b(text|bg|border)-slate-(50|100|200|300|400|500|600|700|800|900|950)\b/g,
  // Zinc colors
  /\b(text|bg|border)-zinc-(50|100|200|300|400|500|600|700|800|900|950)\b/g,
  // Dark colors
  /\b(text|bg|border)-dark-(50|100|200|300|400|500|600|700|800|900|950)\b/g,
];

class ColorMigrator {
  constructor(options = {}) {
    this.options = {
      dryRun: options.dryRun !== false,
      scanPath: options.path || 'src/',
      outputFile: options.output || 'migration-report.md',
      extensions: ['.tsx', '.ts', '.jsx', '.js'],
    };
    
    this.issues = [];
    this.stats = {
      totalFiles: 0,
      filesWithIssues: 0,
      totalIssues: 0,
      autoFixable: 0,
      manualReview: 0,
    };
  }

  /**
   * Scan a directory recursively for files
   */
  scanDirectory(dir) {
    const files = [];
    
    if (!fs.existsSync(dir)) {
      console.error(`Directory not found: ${dir}`);
      return files;
    }
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip node_modules and hidden directories
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue;
      }
      
      if (entry.isDirectory()) {
        files.push(...this.scanDirectory(fullPath));
      } else if (this.options.extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  /**
   * Scan a single file for hardcoded colors
   */
  scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const fileIssues = [];
    
    lines.forEach((line, lineIndex) => {
      COLOR_PATTERNS.forEach(pattern => {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const colorClass = match[0];
          const column = match.index;
          
          // Check if we have a mapping for this color
          const suggested = COLOR_MAPPINGS[colorClass];
          const autoFixable = !!suggested;
          
          fileIssues.push({
            file: filePath,
            line: lineIndex + 1,
            column: column + 1,
            current: colorClass,
            suggested: suggested || 'MANUAL_REVIEW_NEEDED',
            autoFixable,
            context: line.trim(),
          });
          
          if (autoFixable) {
            this.stats.autoFixable++;
          } else {
            this.stats.manualReview++;
          }
        }
      });
    });
    
    return fileIssues;
  }

  /**
   * Apply automated replacements to a file
   */
  applyReplacements(filePath, issues) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    
    // Sort issues by line and column in reverse order to avoid offset issues
    const sortedIssues = issues
      .filter(issue => issue.autoFixable)
      .sort((a, b) => {
        if (a.line !== b.line) return b.line - a.line;
        return b.column - a.column;
      });
    
    const lines = content.split('\n');
    
    sortedIssues.forEach(issue => {
      const lineIndex = issue.line - 1;
      const line = lines[lineIndex];
      
      if (line.includes(issue.current)) {
        lines[lineIndex] = line.replace(issue.current, issue.suggested);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    }
    
    return modified;
  }

  /**
   * Generate migration report
   */
  generateReport() {
    const timestamp = new Date().toISOString();
    let report = `# Color Migration Report\n\n`;
    report += `Generated: ${timestamp}\n\n`;
    report += `## Summary\n\n`;
    report += `- **Total Files Scanned**: ${this.stats.totalFiles}\n`;
    report += `- **Files with Issues**: ${this.stats.filesWithIssues}\n`;
    report += `- **Total Issues Found**: ${this.stats.totalIssues}\n`;
    report += `- **Auto-fixable**: ${this.stats.autoFixable}\n`;
    report += `- **Manual Review Required**: ${this.stats.manualReview}\n\n`;
    
    if (this.issues.length === 0) {
      report += `✅ No hardcoded colors found!\n`;
      return report;
    }
    
    // Group issues by file
    const issuesByFile = {};
    this.issues.forEach(issue => {
      if (!issuesByFile[issue.file]) {
        issuesByFile[issue.file] = [];
      }
      issuesByFile[issue.file].push(issue);
    });
    
    report += `## Issues by File\n\n`;
    
    Object.keys(issuesByFile).sort().forEach(file => {
      const fileIssues = issuesByFile[file];
      report += `### ${file}\n\n`;
      report += `Found ${fileIssues.length} issue(s):\n\n`;
      
      fileIssues.forEach((issue, index) => {
        const status = issue.autoFixable ? '✅ Auto-fixable' : '⚠️ Manual review';
        report += `${index + 1}. **Line ${issue.line}:${issue.column}** - ${status}\n`;
        report += `   - Current: \`${issue.current}\`\n`;
        report += `   - Suggested: \`${issue.suggested}\`\n`;
        report += `   - Context: \`${issue.context}\`\n\n`;
      });
    });
    
    report += `## Migration Guide\n\n`;
    report += `### Auto-fixable Issues\n\n`;
    report += `Run the following command to automatically fix ${this.stats.autoFixable} issues:\n\n`;
    report += `\`\`\`bash\n`;
    report += `node design-system/scripts/migrate-colors.js --apply\n`;
    report += `\`\`\`\n\n`;
    
    if (this.stats.manualReview > 0) {
      report += `### Manual Review Required\n\n`;
      report += `${this.stats.manualReview} issues require manual review. These are typically:\n\n`;
      report += `- Colors not yet mapped in the design system\n`;
      report += `- Context-specific colors that need designer input\n`;
      report += `- Complex color combinations\n\n`;
      report += `Please review the issues above and update them manually.\n\n`;
    }
    
    return report;
  }

  /**
   * Run the migration
   */
  run() {
    console.log('🔍 Scanning for hardcoded colors...\n');
    console.log(`Mode: ${this.options.dryRun ? 'DRY RUN' : 'APPLY CHANGES'}`);
    console.log(`Path: ${this.options.scanPath}\n`);
    
    const files = this.scanDirectory(this.options.scanPath);
    this.stats.totalFiles = files.length;
    
    console.log(`Found ${files.length} files to scan\n`);
    
    let filesModified = 0;
    
    files.forEach(file => {
      const fileIssues = this.scanFile(file);
      
      if (fileIssues.length > 0) {
        this.stats.filesWithIssues++;
        this.stats.totalIssues += fileIssues.length;
        this.issues.push(...fileIssues);
        
        console.log(`📄 ${file}: ${fileIssues.length} issue(s)`);
        
        if (!this.options.dryRun) {
          const modified = this.applyReplacements(file, fileIssues);
          if (modified) {
            filesModified++;
            console.log(`   ✅ Applied ${fileIssues.filter(i => i.autoFixable).length} fix(es)`);
          }
        }
      }
    });
    
    console.log('\n📊 Generating report...\n');
    
    const report = this.generateReport();
    fs.writeFileSync(this.options.outputFile, report, 'utf-8');
    
    console.log(`✅ Report saved to: ${this.options.outputFile}\n`);
    console.log('Summary:');
    console.log(`  Total files scanned: ${this.stats.totalFiles}`);
    console.log(`  Files with issues: ${this.stats.filesWithIssues}`);
    console.log(`  Total issues: ${this.stats.totalIssues}`);
    console.log(`  Auto-fixable: ${this.stats.autoFixable}`);
    console.log(`  Manual review: ${this.stats.manualReview}`);
    
    if (!this.options.dryRun) {
      console.log(`  Files modified: ${filesModified}`);
    }
    
    console.log('\n✨ Done!\n');
  }
}

// CLI execution
const args = process.argv.slice(2);
const options = {
  dryRun: !args.includes('--apply'),
  path: args.includes('--path') ? args[args.indexOf('--path') + 1] : 'src/',
  output: args.includes('--output') ? args[args.indexOf('--output') + 1] : 'migration-report.md',
};

const migrator = new ColorMigrator(options);
migrator.run();

export default ColorMigrator;
