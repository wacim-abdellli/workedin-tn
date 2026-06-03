import fs from 'node:fs';
import path from 'node:path';

const DIST_ASSETS = path.resolve(process.cwd(), 'dist', 'assets');

if (!fs.existsSync(DIST_ASSETS)) {
  console.error('Bundle budget check failed: dist/assets directory not found. Run a production build first.');
  process.exit(1);
}

const bytesToKb = (bytes) => bytes / 1024;

const budgets = {
  entryMaxKb: 750,
  // Security-driven dependency upgrades shifted the main chunk slightly; keep the cap tight but allow a small buffer.
  maxChunkKb: 385,
  totalJsKb: 2800,
};

const budgetExemptChunkPatterns = [
  /^charts-vendor-.*\.js$/i,
  /^sentry-vendor-.*\.js$/i,
  /^analytics-vendor-.*\.js$/i,
  /^router-vendor-.*\.js$/i,
  /^radix-vendor-.*\.js$/i,
];

const isBudgetExempt = (name) => budgetExemptChunkPatterns.some((pattern) => pattern.test(name));

const files = fs.readdirSync(DIST_ASSETS)
  .filter((name) => name.endsWith('.js'))
  .map((name) => {
    const fullPath = path.join(DIST_ASSETS, name);
    const size = fs.statSync(fullPath).size;
    return { name, size, kb: bytesToKb(size) };
  })
  .sort((a, b) => b.size - a.size);

const entry = files.find((file) => /^index-.*\.js$/i.test(file.name));
const budgetedFiles = files.filter((file) => !isBudgetExempt(file.name));
const totalJsKb = budgetedFiles.reduce((sum, file) => sum + file.kb, 0);

const violations = [];

if (!entry) {
  violations.push('Could not find entry chunk (index-*.js).');
} else if (entry.kb > budgets.entryMaxKb) {
  violations.push(`Entry chunk ${entry.name} is ${entry.kb.toFixed(1)}KB (budget ${budgets.entryMaxKb}KB).`);
}

// The entry chunk has its own entryMaxKb budget — exclude it from the per-chunk check.
const oversizedChunks = budgetedFiles.filter(
  (file) => file.kb > budgets.maxChunkKb && !/^index-.*\.js$/i.test(file.name)
);

if (oversizedChunks.length > 0) {
  violations.push(
    `Oversized chunks (> ${budgets.maxChunkKb}KB): ${oversizedChunks
      .map((file) => `${file.name} (${file.kb.toFixed(1)}KB)`)
      .join(', ')}`
  );
}

if (totalJsKb > budgets.totalJsKb) {
  violations.push(`Total JS size is ${totalJsKb.toFixed(1)}KB (budget ${budgets.totalJsKb}KB).`);
}

console.log('Bundle summary (top 8 JS chunks):');
files.slice(0, 8).forEach((file) => {
  console.log(`- ${file.name}: ${file.kb.toFixed(1)}KB`);
});
const exemptFiles = files.filter((file) => isBudgetExempt(file.name));
if (exemptFiles.length > 0) {
  console.log(`Budget-exempt JS: ${exemptFiles.map((file) => `${file.name} (${file.kb.toFixed(1)}KB)`).join(', ')}`);
}
console.log(`Total JS: ${totalJsKb.toFixed(1)}KB`);
if (entry) {
  console.log(`Entry: ${entry.name} (${entry.kb.toFixed(1)}KB)`);
}

if (violations.length > 0) {
  console.error('\nBundle budget violations:');
  violations.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

console.log('\nBundle budget check passed.');
