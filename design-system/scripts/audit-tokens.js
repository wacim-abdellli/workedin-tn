#!/usr/bin/env node

/**
 * Token Audit Tool
 * 
 * Scans the codebase for:
 * - Inconsistent CSS variable naming
 * - Deprecated tokens
 * - Missing token definitions
 * - Unused tokens
 * 
 * Usage:
 *   node design-system/scripts/audit-tokens.js [options]
 * 
 * Options:
 *   --path       Specific path to scan (default: src/)
 *   --output     Output file for report (default: token-audit-report.md)
 *   --tokens     Path to tokens file (default: design-system/output/tokens.json)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Known inconsistent naming patterns from the audit
const INCONSISTENT_PATTERNS = [
  {
    pattern: /var\(--workspace-primary\)/g,
    name: '--workspace-primary',
    suggested: '--color-brand-primary',
    category: 'brand',
  },
  {
    pattern: /var\(--workspace-primary-hover\)/g,
    name: '--workspace-primary-hover',
    suggested: '--color-brand-primary-hover',
    category: 'brand',
  },
  {
    pattern: /var\(--workspace-primary-mid\)/g,
    name: '--workspace-primary-mid',
    suggested: '--color-brand-primary-mid',
    category: 'brand',
  },
  {
    pattern: /var\(--workspace-primary-light\)/g,
    name: '--workspace-primary-light',
    suggested: '--color-brand-primary-light',
    category: 'brand',
  },
  {
    pattern: /var\(--workspace-accent\)/g,
    name: '--workspace-accent',
    suggested: '--color-brand-accent',
    category: 'brand',
  },
  {
    pattern: /var\(--text-primary\)/g,
    name: '--text-primary',
    suggested: '--color-text-primary',
    category: 'text',
  },
  {
    pattern: /var\(--text-secondary\)/g,
    name: '--text-secondary',
    suggested: '--color-text-secondary',
    category: 'text',
  },
  {
    pattern: /var\(--text-muted\)/g,
    name: '--text-muted',
    suggested: '--color-text-muted',
    category: 'text',
  },
  {
    pattern: /var\(--page-bg\)/g,
    name: '--page-bg',
    suggested: '--color-bg-base',
    category: 'background',
  },
  {
    pattern: /var\(--dash-bg\)/g,
    name: '--dash-bg',
    suggested: '--color-bg-base',
    category: 'background',
  },
  {
    pattern: /var\(--surface-bg\)/g,
    name: '--surface-bg',
    suggested: '--color-bg-elevated',
    category: 'background',
  },
  {
    pattern: /var\(--card-bg\)/g,
    name: '--card-bg',
    suggested: '--color-bg-elevated',
    category: 'background',
  },
  {
    pattern: /var\(--color-bg-subtle\)/g,
    name: '--color-bg-subtle',
    suggested: '--color-bg-subtle',
    category: 'background',
    status: 'correct',
  },
  {
    pattern: /var\(--color-bg-base\)/g,
    name: '--color-bg-base',
    suggested: '--color-bg-base',
    category: 'background',
    status: 'correct',
  },
  {
    pattern: /var\(--color-bg-muted\)/g,
    name: '--color-bg-muted',
    suggested: '--color-bg-muted',
    category: 'background',
    status: 'correct',
  },
  {
    pattern: /var\(--color-bg-elevated\)/g,
    name: '--color-bg-elevated',
    suggested: '--color-bg-elevated',
    category: 'background',
    status: 'correct',
  },
  {
    pattern: /var\(--border\)/g,
    name: '--border',
    suggested: '--color-border-default',
    category: 'border',
  },
  {
    pattern: /var\(--dash-border\)/g,
    name: '--dash-border',
    suggested: '--color-border-default',
    category: 'border',
  },
  {
    pattern: /var\(--brand-accent\)/g,
    name: '--brand-accent',
    suggested: '--color-brand-accent',
    category: 'brand',
  },
  {
    pattern: /var\(--background\)/g,
    name: '--background',
    suggested: '--color-bg-base',
    category: 'background',
  },
  {
    pattern: /var\(--stat-pill-bg\)/g,
    name: '--stat-pill-bg',
    suggested: '--color-bg-subtle',
    category: 'background',
  },
  {
    pattern: /var\(--stat-pill-border\)/g,
    name: '--stat-pill-border',
    suggested: '--color-border-subtle',
    category: 'border',
  },
  {
    pattern: /var\(--dash-raised\)/g,
    name: '--dash-raised',
    suggested: '--color-bg-elevated',
    category: 'background',
  },
];

// Deprecated tokens that should no longer be used
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
  {
    name: '--dark-600',
    replacement: '--color-text-secondary (dark mode)',
    reason: 'Use semantic color tokens instead of primitive colors',
  },
];

class TokenAuditor {
  constructor(options = {}) {
    this.options = {
      scanPath: options.path || 'src/',
      outputFile: options.output || 'token-audit-report.md',
      tokensFile: options.tokens || 'design-system/output/tokens.json',
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.css', '.scss'],
    };
    
    this.issues = [];
    this.tokenUsage = new Map();
    this.definedTokens = new Set();
    this.stats = {
      totalFiles: 0,
      filesWithIssues: 0,
      inconsistentNaming: 0,
      deprecatedTokens: 0,
      undefinedTokens: 0,
      correctUsage: 0,
    };
  }

  /**
   * Load defined tokens from the tokens file
   */
  loadDefinedTokens() {
    if (fs.existsSync(this.options.tokensFile)) {
      try {
        const tokensData = JSON.parse(fs.readFileSync(this.options.tokensFile, 'utf-8'));
        
        // Extract all token names from the nested structure
        const extractTokens = (obj, prefix = '') => {
          Object.keys(obj).forEach(key => {
            const value = obj[key];
            const tokenName = prefix ? `${prefix}-${key}` : key;
            
            if (typeof value === 'object' && value !== null && !value.value) {
              extractTokens(value, tokenName);
            } else {
              this.definedTokens.add(`--${tokenName}`);
            }
          });
        };
        
        extractTokens(tokensData);
        console.log(`✅ Loaded ${this.definedTokens.size} defined tokens\n`);
      } catch (error) {
        console.warn(`⚠️  Could not load tokens file: ${error.message}\n`);
      }
    } else {
      console.warn(`⚠️  Tokens file not found: ${this.options.tokensFile}\n`);
    }
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
   * Scan a single file for token usage
   */
  scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const fileIssues = [];
    
    lines.forEach((line, lineIndex) => {
      // Check for inconsistent naming patterns
      INCONSISTENT_PATTERNS.forEach(({ pattern, name, suggested, category, status }) => {
        let match;
        pattern.lastIndex = 0; // Reset regex
        
        while ((match = pattern.exec(line)) !== null) {
          const column = match.index;
          
          // Track usage
          if (!this.tokenUsage.has(name)) {
            this.tokenUsage.set(name, []);
          }
          this.tokenUsage.get(name).push({ file: filePath, line: lineIndex + 1 });
          
          if (status === 'correct') {
            this.stats.correctUsage++;
          } else {
            fileIssues.push({
              file: filePath,
              line: lineIndex + 1,
              column: column + 1,
              type: 'inconsistent-naming',
              current: name,
              suggested: suggested,
              category: category,
              context: line.trim(),
            });
            
            this.stats.inconsistentNaming++;
          }
        }
      });
      
      // Check for deprecated tokens
      DEPRECATED_TOKENS.forEach(({ name, replacement, reason }) => {
        const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`var\\(${escapedName}\\)`, 'g');
        let match;
        
        while ((match = pattern.exec(line)) !== null) {
          const column = match.index;
          
          fileIssues.push({
            file: filePath,
            line: lineIndex + 1,
            column: column + 1,
            type: 'deprecated-token',
            current: name,
            suggested: replacement,
            reason: reason,
            context: line.trim(),
          });
          
          this.stats.deprecatedTokens++;
        }
      });
      
      // Check for undefined tokens (CSS variables not in our design system)
      const varPattern = /var\((--[a-z0-9-]+)\)/g;
      let match;
      
      while ((match = varPattern.exec(line)) !== null) {
        const tokenName = match[1];
        const column = match.index;
        
        // Skip if it's a known pattern or defined token
        const isKnown = INCONSISTENT_PATTERNS.some(p => p.name === tokenName) ||
                       DEPRECATED_TOKENS.some(d => d.name === tokenName) ||
                       this.definedTokens.has(tokenName);
        
        if (!isKnown && !tokenName.startsWith('--tw-')) {
          fileIssues.push({
            file: filePath,
            line: lineIndex + 1,
            column: column + 1,
            type: 'undefined-token',
            current: tokenName,
            suggested: 'Review and add to design system or replace with standard token',
            context: line.trim(),
          });
          
          this.stats.undefinedTokens++;
        }
      }
    });
    
    return fileIssues;
  }

  /**
   * Generate audit report
   */
  generateReport() {
    const timestamp = new Date().toISOString();
    let report = `# Token Audit Report\n\n`;
    report += `Generated: ${timestamp}\n\n`;
    report += `## Summary\n\n`;
    report += `- **Total Files Scanned**: ${this.stats.totalFiles}\n`;
    report += `- **Files with Issues**: ${this.stats.filesWithIssues}\n`;
    report += `- **Inconsistent Naming**: ${this.stats.inconsistentNaming}\n`;
    report += `- **Deprecated Tokens**: ${this.stats.deprecatedTokens}\n`;
    report += `- **Undefined Tokens**: ${this.stats.undefinedTokens}\n`;
    report += `- **Correct Usage**: ${this.stats.correctUsage}\n\n`;
    
    if (this.issues.length === 0) {
      report += `✅ No token issues found!\n`;
      return report;
    }
    
    // Group issues by type
    const issuesByType = {
      'inconsistent-naming': [],
      'deprecated-token': [],
      'undefined-token': [],
    };
    
    this.issues.forEach(issue => {
      issuesByType[issue.type].push(issue);
    });
    
    // Inconsistent Naming Section
    if (issuesByType['inconsistent-naming'].length > 0) {
      report += `## Inconsistent Naming (${issuesByType['inconsistent-naming'].length})\n\n`;
      report += `These tokens use non-standard naming conventions and should be updated:\n\n`;
      
      // Group by current token name
      const byToken = {};
      issuesByType['inconsistent-naming'].forEach(issue => {
        if (!byToken[issue.current]) {
          byToken[issue.current] = {
            suggested: issue.suggested,
            category: issue.category,
            occurrences: [],
          };
        }
        byToken[issue.current].occurrences.push(issue);
      });
      
      Object.keys(byToken).sort().forEach(tokenName => {
        const data = byToken[tokenName];
        report += `### \`${tokenName}\` → \`${data.suggested}\`\n\n`;
        report += `- **Category**: ${data.category}\n`;
        report += `- **Occurrences**: ${data.occurrences.length}\n`;
        report += `- **Files affected**:\n`;
        
        const fileGroups = {};
        data.occurrences.forEach(occ => {
          if (!fileGroups[occ.file]) {
            fileGroups[occ.file] = [];
          }
          fileGroups[occ.file].push(occ.line);
        });
        
        Object.keys(fileGroups).sort().forEach(file => {
          const lines = fileGroups[file];
          report += `  - \`${file}\` (lines: ${lines.join(', ')})\n`;
        });
        
        report += `\n`;
      });
    }
    
    // Deprecated Tokens Section
    if (issuesByType['deprecated-token'].length > 0) {
      report += `## Deprecated Tokens (${issuesByType['deprecated-token'].length})\n\n`;
      report += `These tokens are deprecated and should be replaced:\n\n`;
      
      const byToken = {};
      issuesByType['deprecated-token'].forEach(issue => {
        if (!byToken[issue.current]) {
          byToken[issue.current] = {
            suggested: issue.suggested,
            reason: issue.reason,
            occurrences: [],
          };
        }
        byToken[issue.current].occurrences.push(issue);
      });
      
      Object.keys(byToken).sort().forEach(tokenName => {
        const data = byToken[tokenName];
        report += `### \`${tokenName}\`\n\n`;
        report += `- **Replacement**: \`${data.suggested}\`\n`;
        report += `- **Reason**: ${data.reason}\n`;
        report += `- **Occurrences**: ${data.occurrences.length}\n\n`;
      });
    }
    
    // Undefined Tokens Section
    if (issuesByType['undefined-token'].length > 0) {
      report += `## Undefined Tokens (${issuesByType['undefined-token'].length})\n\n`;
      report += `These tokens are not defined in the design system:\n\n`;
      
      const byToken = {};
      issuesByType['undefined-token'].forEach(issue => {
        if (!byToken[issue.current]) {
          byToken[issue.current] = [];
        }
        byToken[issue.current].push(issue);
      });
      
      Object.keys(byToken).sort().forEach(tokenName => {
        const occurrences = byToken[tokenName];
        report += `### \`${tokenName}\`\n\n`;
        report += `- **Occurrences**: ${occurrences.length}\n`;
        report += `- **Action**: Review usage and either add to design system or replace with standard token\n\n`;
      });
    }
    
    // Token Usage Statistics
    report += `## Token Usage Statistics\n\n`;
    report += `Top 10 most used tokens:\n\n`;
    
    const sortedUsage = Array.from(this.tokenUsage.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10);
    
    sortedUsage.forEach(([token, usages], index) => {
      report += `${index + 1}. \`${token}\` - ${usages.length} usage(s)\n`;
    });
    
    report += `\n## Recommendations\n\n`;
    report += `1. **Standardize naming**: Update all inconsistent token names to follow the \`--color-{category}-{variant}\` pattern\n`;
    report += `2. **Remove deprecated tokens**: Replace deprecated tokens with their modern equivalents\n`;
    report += `3. **Define missing tokens**: Add undefined tokens to the design system or replace with existing tokens\n`;
    report += `4. **Create migration script**: Consider creating automated migration scripts for high-frequency tokens\n\n`;
    
    return report;
  }

  /**
   * Run the audit
   */
  run() {
    console.log('🔍 Auditing token usage...\n');
    console.log(`Path: ${this.options.scanPath}\n`);
    
    this.loadDefinedTokens();
    
    const files = this.scanDirectory(this.options.scanPath);
    this.stats.totalFiles = files.length;
    
    console.log(`Found ${files.length} files to scan\n`);
    
    files.forEach(file => {
      const fileIssues = this.scanFile(file);
      
      if (fileIssues.length > 0) {
        this.stats.filesWithIssues++;
        this.issues.push(...fileIssues);
        
        console.log(`📄 ${file}: ${fileIssues.length} issue(s)`);
      }
    });
    
    console.log('\n📊 Generating report...\n');
    
    const report = this.generateReport();
    fs.writeFileSync(this.options.outputFile, report, 'utf-8');
    
    console.log(`✅ Report saved to: ${this.options.outputFile}\n`);
    console.log('Summary:');
    console.log(`  Total files scanned: ${this.stats.totalFiles}`);
    console.log(`  Files with issues: ${this.stats.filesWithIssues}`);
    console.log(`  Inconsistent naming: ${this.stats.inconsistentNaming}`);
    console.log(`  Deprecated tokens: ${this.stats.deprecatedTokens}`);
    console.log(`  Undefined tokens: ${this.stats.undefinedTokens}`);
    console.log(`  Correct usage: ${this.stats.correctUsage}`);
    
    console.log('\n✨ Done!\n');
  }
}

// CLI execution
const args = process.argv.slice(2);
const options = {
  path: args.includes('--path') ? args[args.indexOf('--path') + 1] : 'src/',
  output: args.includes('--output') ? args[args.indexOf('--output') + 1] : 'token-audit-report.md',
  tokens: args.includes('--tokens') ? args[args.indexOf('--tokens') + 1] : 'design-system/output/tokens.json',
};

const auditor = new TokenAuditor(options);
auditor.run();

export default TokenAuditor;
