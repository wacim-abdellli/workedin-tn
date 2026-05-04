#!/usr/bin/env node

/**
 * Find ALL hardcoded English strings in page files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAGES_DIR = path.join(__dirname, '../src/pages');

const PAGE_FILES = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.tsx'));

const results = [];

// Patterns to detect hardcoded strings
const patterns = [
  // JSX text content: >Text<
  />\s*([A-Z][A-Za-z\s]{3,50})\s*</g,
  // String literals in JSX: "Text" or 'Text'
  /["']([A-Z][A-Za-z\s]{3,50})["']/g,
];

PAGE_FILES.forEach(filename => {
  const filePath = path.join(PAGES_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const lines = content.split('\n');
  const fileIssues = [];
  
  lines.forEach((line, index) => {
    // Skip lines that already use tx() or t.
    if (line.includes('tx(') || line.includes('t.')) return;
    // Skip imports and comments
    if (line.trim().startsWith('import ') || line.trim().startsWith('//') || line.trim().startsWith('*')) return;
    
    patterns.forEach(pattern => {
      const matches = [...line.matchAll(pattern)];
      matches.forEach(match => {
        const text = match[1].trim();
        // Filter out common false positives
        if (text.length < 4) return;
        if (/^(div|span|button|input|select|option|label|form|table|tr|td|th|thead|tbody|tfoot|ul|ol|li|nav|header|footer|section|article|aside|main|figure|figcaption|img|svg|path|circle|rect|line|polygon|polyline|ellipse|g|defs|use|symbol|marker|clipPath|mask|pattern|linearGradient|radialGradient|stop|animate|animateTransform|animateMotion|set|mpath|text|tspan|textPath|a|style|script|link|meta|title|base|head|body|html|DOCTYPE)$/i.test(text)) return;
        if (/^(className|style|onClick|onChange|onSubmit|onFocus|onBlur|type|id|name|value|placeholder|aria|data|ref|key)$/i.test(text)) return;
        if (/^(true|false|null|undefined|const|let|var|function|return|if|else|switch|case|break|continue|for|while|do|try|catch|finally|throw|new|this|super|extends|implements|interface|class|enum|namespace|module|export|import|from|as|default|async|await|yield|typeof|instanceof|in|of|delete|void)$/i.test(text)) return;
        
        fileIssues.push({
          line: index + 1,
          text: text,
          context: line.trim().substring(0, 100)
        });
      });
    });
  });
  
  if (fileIssues.length > 0) {
    results.push({
      file: filename,
      issues: fileIssues.slice(0, 10) // Limit to first 10 per file
    });
  }
});

console.log('\n🔍 Hardcoded Strings Found:\n');
console.log(`Total files with issues: ${results.length}\n`);

results.forEach(({ file, issues }) => {
  console.log(`\n📄 ${file}`);
  issues.forEach(({ line, text, context }) => {
    console.log(`   Line ${line}: "${text}"`);
    console.log(`   Context: ${context}`);
  });
});

// Save to file
const report = results.map(({ file, issues }) => {
  return `## ${file}\n\n` + issues.map(({ line, text, context }) => {
    return `- Line ${line}: \`${text}\`\n  \`\`\`\n  ${context}\n  \`\`\``;
  }).join('\n\n');
}).join('\n\n');

fs.writeFileSync(
  path.join(__dirname, '../HARDCODED_STRINGS_REPORT.md'),
  `# Hardcoded Strings Report\n\n${report}`
);

console.log('\n\n📄 Full report saved to: HARDCODED_STRINGS_REPORT.md');
