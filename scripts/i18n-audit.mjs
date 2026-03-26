import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');
const REPORT_FILE = path.join(ROOT, 'i18n-audit-report.txt');
const strictMode = process.argv.includes('--strict');

const IGNORE_DIRS = new Set(['i18n', 'test', '__tests__', 'types']);
const SCAN_EXTENSIONS = new Set(['.tsx', '.ts']);

const ATTRIBUTE_RE = /\b(?:placeholder|title|aria-label|label|alt)\s*=\s*"([^"{][^"]*)"/g;
const JSX_TEXT_RE = />\s*([A-Za-z\u0600-\u06FF][^<>{\n]{1,})\s*</g;
const DIRECT_STRING_RE = /\b(?:showToast|confirm|alert)\(\s*(["'`])([^\1]*?[A-Za-z\u0600-\u06FF][^\1]*?)\1/g;

const ALLOW_PATTERNS = [
  /^(D17|Flouci|IBAN|SEO|React JS|Python)$/i,
  /^\s*[A-Z]{2,5}(\/[A-Z]{2,5})?\s*$/,
  /^\s*\d+[\d\s.,:%+-]*\s*$/,
  /^\s*[\W_]+\s*$/,
];

const isAllowedText = (text) => {
  const cleaned = text.trim();
  if (!cleaned) return true;
  return ALLOW_PATTERNS.some((pattern) => pattern.test(cleaned));
};

const toLine = (content, index) => content.slice(0, index).split('\n').length;

const walkFiles = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      files.push(...walkFiles(fullPath));
      continue;
    }

    const ext = path.extname(entry.name);
    if (SCAN_EXTENSIONS.has(ext)) {
      files.push(fullPath);
    }
  }

  return files;
};

const findings = [];

for (const filePath of walkFiles(SRC_DIR)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const extension = path.extname(filePath);

  const checks = [[DIRECT_STRING_RE, 'direct-string']];
  if (extension === '.tsx') {
    checks.push([ATTRIBUTE_RE, 'attribute']);
    checks.push([JSX_TEXT_RE, 'jsx-text']);
  }

  for (const [regex, category] of checks) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const rawText = (category === 'direct-string' ? match[2] : match[1])?.trim();
      if (!rawText || isAllowedText(rawText)) continue;

      // Skip probable translation keys and templated i18n placeholders.
      if (/^[a-z0-9_.-]+$/i.test(rawText) || rawText.includes('{{')) continue;
      if (/^[)\]}:;.,!@#%^&*+=\\-]+$/.test(rawText)) continue;

      findings.push({
        file: path.relative(ROOT, filePath).replaceAll('\\', '/'),
        line: toLine(content, match.index),
        category,
        text: rawText.slice(0, 120),
      });
    }
  }
}

const lines = [
  '# i18n audit report',
  `mode: ${strictMode ? 'strict' : 'report-only'}`,
  `findings: ${findings.length}`,
  '',
  ...findings.map((item) => `${item.file}:${item.line} [${item.category}] ${item.text}`),
];

fs.writeFileSync(REPORT_FILE, `${lines.join('\n')}\n`, 'utf8');

if (findings.length === 0) {
  console.log('i18n-audit: clean (no likely untranslated UI strings found)');
  process.exit(0);
}

console.log(`i18n-audit: found ${findings.length} likely untranslated UI strings`);
console.log(`i18n-audit: report written to ${path.relative(ROOT, REPORT_FILE)}`);

if (strictMode) {
  process.exit(1);
}
