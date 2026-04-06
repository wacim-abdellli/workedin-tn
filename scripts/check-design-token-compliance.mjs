import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const LEGACY_TOKEN_RULES = [
  { pattern: /var\(--workspace-primary\)/g, suggestion: 'Use `var(--color-brand-primary)`.' },
  { pattern: /var\(--workspace-primary-hover\)/g, suggestion: 'Use `var(--color-brand-primary-hover)`.' },
  { pattern: /var\(--workspace-primary-mid\)/g, suggestion: 'Use `var(--color-brand-primary-mid)`.' },
  { pattern: /var\(--workspace-primary-light\)/g, suggestion: 'Use `var(--color-brand-primary-light)`.' },
  { pattern: /var\(--workspace-accent\)/g, suggestion: 'Use `var(--color-brand-accent)`.' },
  { pattern: /var\(--text-primary\)/g, suggestion: 'Use `var(--color-text-primary)`.' },
  { pattern: /var\(--text-secondary\)/g, suggestion: 'Use `var(--color-text-secondary)`.' },
  { pattern: /var\(--text-muted\)/g, suggestion: 'Use `var(--color-text-muted)`.' },
  { pattern: /var\(--page-bg\)/g, suggestion: 'Use `var(--color-bg-base)`.' },
  { pattern: /var\(--dash-bg\)/g, suggestion: 'Use `var(--color-bg-base)`.' },
  { pattern: /var\(--surface-bg\)/g, suggestion: 'Use `var(--color-bg-elevated)`.' },
  { pattern: /var\(--card-bg\)/g, suggestion: 'Use `var(--color-bg-elevated)`.' },
  { pattern: /var\(--border\)/g, suggestion: 'Use `var(--color-border-default)`.' },
  { pattern: /var\(--dash-border\)/g, suggestion: 'Use `var(--color-border-default)`.' },
  { pattern: /var\(--brand-accent\)/g, suggestion: 'Use `var(--color-brand-accent)`.' },
  { pattern: /var\(--background\)/g, suggestion: 'Use `var(--color-bg-base)`.' },
  { pattern: /var\(--stat-pill-bg\)/g, suggestion: 'Use `var(--color-bg-subtle)`.' },
  { pattern: /var\(--stat-pill-border\)/g, suggestion: 'Use `var(--color-border-subtle)`.' },
  { pattern: /var\(--dash-raised\)/g, suggestion: 'Use `var(--color-bg-elevated)`.' },
  { pattern: /var\(--dark-(950|800|600)\)/g, suggestion: 'Use semantic design tokens instead of primitive dark tokens.' },
];

const HARDCODED_COLOR_RE = /\b(?:text|bg|border)-(?:gray|red|green|blue|yellow|amber|purple|pink|indigo|cyan|emerald|primary|secondary|accent|slate|zinc|dark)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/g;

const COLOR_SUGGESTIONS = new Map([
  ['text-gray-900', 'Use `text-[var(--color-text-primary)]`.'],
  ['text-gray-800', 'Use `text-[var(--color-text-primary)]`.'],
  ['text-gray-700', 'Use `text-[var(--color-text-secondary)]`.'],
  ['text-gray-600', 'Use `text-[var(--color-text-secondary)]`.'],
  ['text-gray-500', 'Use `text-[var(--color-text-muted)]`.'],
  ['text-gray-400', 'Use `text-[var(--color-text-muted)]`.'],
  ['bg-gray-50', 'Use `bg-[var(--color-bg-base)]`.'],
  ['bg-gray-100', 'Use `bg-[var(--color-bg-subtle)]`.'],
  ['bg-gray-200', 'Use `bg-[var(--color-bg-muted)]`.'],
  ['bg-gray-800', 'Use `bg-[var(--color-bg-elevated)]`.'],
  ['border-gray-100', 'Use `border-[var(--color-border-subtle)]`.'],
  ['border-gray-200', 'Use `border-[var(--color-border-default)]`.'],
  ['border-gray-300', 'Use `border-[var(--color-border-default)]`.'],
  ['text-primary-600', 'Use `text-[var(--color-brand-primary)]`.'],
  ['text-primary-700', 'Use `text-[var(--color-brand-primary-hover)]`.'],
  ['bg-primary-50', 'Use `bg-[var(--color-brand-primary-subtle)]`.'],
  ['bg-primary-600', 'Use `bg-[var(--color-brand-primary)]`.'],
  ['bg-primary-700', 'Use `bg-[var(--color-brand-primary-hover)]`.'],
  ['border-primary-500', 'Use `border-[var(--color-brand-primary)]`.'],
  ['text-red-500', 'Use `text-[var(--color-status-error)]`.'],
  ['text-red-600', 'Use `text-[var(--color-status-error)]`.'],
  ['bg-red-50', 'Use `bg-[var(--color-status-error-subtle)]`.'],
  ['bg-red-500', 'Use `bg-[var(--color-status-error)]`.'],
  ['border-red-500', 'Use `border-[var(--color-status-error)]`.'],
  ['text-green-500', 'Use `text-[var(--color-status-success)]`.'],
  ['text-green-600', 'Use `text-[var(--color-status-success)]`.'],
  ['bg-green-100', 'Use `bg-[var(--color-status-success-subtle)]`.'],
  ['bg-green-500', 'Use `bg-[var(--color-status-success)]`.'],
  ['border-green-500', 'Use `border-[var(--color-status-success)]`.'],
  ['text-amber-500', 'Use `text-[var(--color-status-warning)]`.'],
  ['text-amber-600', 'Use `text-[var(--color-status-warning)]`.'],
  ['bg-amber-50', 'Use `bg-[var(--color-status-warning-subtle)]`.'],
  ['bg-amber-500', 'Use `bg-[var(--color-status-warning)]`.'],
  ['border-amber-500', 'Use `border-[var(--color-status-warning)]`.'],
  ['text-blue-600', 'Use `text-[var(--color-status-info)]`.'],
  ['bg-blue-50', 'Use `bg-[var(--color-status-info-subtle)]`.'],
  ['bg-blue-500', 'Use `bg-[var(--color-status-info)]`.'],
]);

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith('--')) continue;

    const key = current.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith('--')) {
      args[key] = 'true';
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

function isAllZeroSha(value) {
  return typeof value === 'string' && /^0+$/.test(value);
}

function shouldScanFile(filePath) {
  if (!filePath.startsWith('src/')) return false;
  if (!/\.(tsx?|jsx?|css|scss)$/.test(filePath)) return false;
  if (filePath.includes('/__tests__/')) return false;
  if (/\.(test|spec)\.(tsx?|jsx?)$/.test(filePath)) return false;
  if (filePath.startsWith('src/test/')) return false;
  return true;
}

function collectViolationsFromLine(line) {
  const findings = [];

  for (const rule of LEGACY_TOKEN_RULES) {
    rule.pattern.lastIndex = 0;
    let match;
    while ((match = rule.pattern.exec(line)) !== null) {
      findings.push({
        type: 'legacy-token',
        match: match[0],
        suggestion: rule.suggestion,
      });
    }
  }

  HARDCODED_COLOR_RE.lastIndex = 0;
  let colorMatch;
  while ((colorMatch = HARDCODED_COLOR_RE.exec(line)) !== null) {
    const colorClass = colorMatch[0];
    findings.push({
      type: 'hardcoded-color',
      match: colorClass,
      suggestion: COLOR_SUGGESTIONS.get(colorClass) || 'Replace with the closest semantic design token utility.',
    });
  }

  return findings;
}

function parseChangedLines(diffText) {
  const results = [];
  const lines = diffText.split(/\r?\n/);
  let currentFile = null;
  let currentLine = 0;

  for (const line of lines) {
    if (line.startsWith('+++ b/')) {
      currentFile = line.slice(6);
      continue;
    }

    if (line.startsWith('@@')) {
      const match = /\+(\d+)(?:,(\d+))?/.exec(line);
      if (!match) continue;
      currentLine = Number(match[1]);
      continue;
    }

    if (!currentFile || !shouldScanFile(currentFile)) {
      continue;
    }

    if (line.startsWith('+') && !line.startsWith('+++')) {
      const content = line.slice(1);
      const violations = collectViolationsFromLine(content);
      for (const violation of violations) {
        results.push({
          file: currentFile,
          line: currentLine,
          content,
          ...violation,
        });
      }
      currentLine += 1;
      continue;
    }

    if (line.startsWith('-') && !line.startsWith('---')) {
      continue;
    }

    if (line.startsWith(' ')) {
      currentLine += 1;
    }
  }

  return results;
}

async function getDefaultRange() {
  try {
    const { stdout } = await execFileAsync('git', ['diff', '--cached', '--name-only', '--', 'src']);
    if (stdout.trim()) {
      return { mode: 'staged' };
    }
  } catch {
    // Ignore and fall back to commit range.
  }

  return { from: 'HEAD~1', to: 'HEAD' };
}

async function buildGitDiffCommand(args) {
  if (args.staged === 'true') {
    return ['diff', '--cached', '--unified=0', '--no-color', '--', 'src'];
  }

  if (args.from || args.to) {
    const from = args.from && !isAllZeroSha(args.from) ? args.from : 'HEAD~1';
    const to = args.to && !isAllZeroSha(args.to) ? args.to : 'HEAD';
    return ['diff', '--unified=0', '--no-color', from, to, '--', 'src'];
  }

  const fallback = await getDefaultRange();
  if (fallback.mode === 'staged') {
    return ['diff', '--cached', '--unified=0', '--no-color', '--', 'src'];
  }

  return ['diff', '--unified=0', '--no-color', fallback.from, fallback.to, '--', 'src'];
}

async function writeReport(outputPath, report) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outputPath = args.output || 'artifacts/design-token-compliance/report.json';
  const gitArgs = await buildGitDiffCommand(args);
  const { stdout } = await execFileAsync('git', gitArgs, { cwd: process.cwd() });
  const violations = parseChangedLines(stdout);

  const report = {
    generatedAt: new Date().toISOString(),
    mode: args.staged === 'true' ? 'staged' : 'diff',
    gitArgs,
    violationCount: violations.length,
    violations,
  };

  await writeReport(outputPath, report);

  if (violations.length === 0) {
    console.log(`Design token compliance report written to ${outputPath}`);
    console.log('Design token compliance check passed.');
    return;
  }

  console.error(`Design token compliance report written to ${outputPath}`);
  console.error(`Found ${violations.length} design token compliance violation(s):`);
  for (const violation of violations.slice(0, 20)) {
    console.error(`- ${violation.file}:${violation.line} [${violation.type}] ${violation.match}`);
    console.error(`  ${violation.suggestion}`);
  }
  if (violations.length > 20) {
    console.error(`- ... ${violations.length - 20} more violation(s) in report`);
  }

  process.exitCode = 1;
}

main().catch(async (error) => {
  const args = parseArgs(process.argv.slice(2));
  const outputPath = args.output || 'artifacts/design-token-compliance/report.json';
  const report = {
    generatedAt: new Date().toISOString(),
    violationCount: 0,
    error: error instanceof Error ? error.message : String(error),
  };

  await writeReport(outputPath, report);
  console.error(error instanceof Error ? error.message : error);
  console.error(`Design token compliance report written to ${outputPath}`);
  process.exitCode = 1;
});

export { collectViolationsFromLine, parseChangedLines, shouldScanFile };
