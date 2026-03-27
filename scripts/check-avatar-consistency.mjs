import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');

const EXCLUDED_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  'coverage',
  '__tests__',
  'test',
]);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (EXCLUDED_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }

    if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) continue;
    files.push(fullPath);
  }

  return files;
}

function lineNumberAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

function relative(p) {
  return path.relative(ROOT, p).replaceAll('\\', '/');
}

function checkFreelancerProfilesClientWrites(filePath, content, findings) {
  const fromRegex = /from\(\s*['"]freelancer_profiles['"]\s*\)/g;
  let match;

  while ((match = fromRegex.exec(content)) !== null) {
    const start = match.index;
    const semicolonIndex = content.indexOf(';', start);
    const statementEnd = semicolonIndex === -1 ? Math.min(content.length, start + 800) : semicolonIndex + 1;
    const snippet = content.slice(start, statementEnd);

    const writeMatch = /\.(upsert|insert|update)\s*\(/.exec(snippet);
    if (!writeMatch) continue;

    const writePos = start + writeMatch.index;
    const writeSnippet = snippet.slice(writeMatch.index);

    if (/avatar_url\s*:/.test(writeSnippet)) {
      findings.push({
        file: relative(filePath),
        line: lineNumberAt(content, writePos),
        reason: 'Direct avatar_url write detected in freelancer_profiles write payload',
      });
    }

    if (/\.\.\.\s*(data|payload|input|values)\b/.test(writeSnippet)) {
      findings.push({
        file: relative(filePath),
        line: lineNumberAt(content, writePos),
        reason: 'Unsafe spread payload in freelancer_profiles write payload (use sanitized safeData)',
      });
    }
  }
}

function checkFreelancerProfilesRestWrites(filePath, content, findings) {
  const endpointRegex = /\/rest\/v1\/freelancer_profiles/g;
  let match;

  while ((match = endpointRegex.exec(content)) !== null) {
    const start = Math.max(0, match.index - 250);
    const end = Math.min(content.length, match.index + 1400);
    const snippet = content.slice(start, end);

    const isWrite = /method\s*:\s*['"](POST|PATCH|PUT)['"]/i.test(snippet);
    if (!isWrite) continue;

    if (/avatar_url\s*:/.test(snippet)) {
      findings.push({
        file: relative(filePath),
        line: lineNumberAt(content, match.index),
        reason: 'Direct avatar_url write detected in freelancer_profiles REST write body',
      });
    }
  }
}

async function main() {
  const files = await walk(SRC_DIR);
  const findings = [];

  for (const filePath of files) {
    const content = await fs.readFile(filePath, 'utf8');
    checkFreelancerProfilesClientWrites(filePath, content, findings);
    checkFreelancerProfilesRestWrites(filePath, content, findings);
  }

  if (findings.length > 0) {
    console.error('avatar-audit: FAILED');
    for (const finding of findings) {
      console.error(`- ${finding.file}:${finding.line} -> ${finding.reason}`);
    }
    process.exit(1);
  }

  console.log('avatar-audit: clean (no unsafe freelancer avatar writes found)');
}

main().catch((error) => {
  console.error('avatar-audit: execution failed');
  console.error(error);
  process.exit(1);
});
