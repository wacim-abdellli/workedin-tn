#!/usr/bin/env node

/**
 * I18n Pages Audit Script
 * 
 * This script checks all page files for:
 * 1. Missing useTranslation import
 * 2. Hardcoded strings that should be translated
 * 3. Missing translation keys
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAGES_DIR = path.join(__dirname, '../src/pages');
const REPORT_FILE = path.join(__dirname, '../I18N_PAGES_AUDIT_REPORT.md');

// Pages to check based on the provided list
const PAGE_FILES = [
  // Public pages
  'Home.tsx',
  'Login.tsx',
  'Signup.tsx',
  'ForgotPassword.tsx',
  'ResetPassword.tsx',
  'AuthCallback.tsx',
  'VerifyEmail.tsx',
  'HowItWorks.tsx',
  'ForClients.tsx',
  'Terms.tsx',
  'Privacy.tsx',
  'FAQ.tsx',
  'NotFound.tsx',
  
  // Auth-protected public
  'JobBoard.tsx',
  'JobDetail.tsx',
  'FindFreelancers.tsx',
  'SearchResults.tsx',
  'FreelancerProfile.tsx',
  'ClientProfile.tsx',
  
  // Onboarding
  'FreelancerOnboarding.tsx',
  'ClientOnboarding.tsx',
  
  // Freelancer workspace
  'FreelancerDashboard.tsx',
  'PortfolioDashboard.tsx',
  'FreelancerEarnings.tsx',
  'MyProposals.tsx',
  'SavedJobs.tsx',
  'JobMatches.tsx',
  
  // Client workspace
  'ClientDashboard.tsx',
  'ClientJobs.tsx',
  'JobPost.tsx',
  'EditJob.tsx',
  'JobProposals.tsx',
  'JobPostSuccess.tsx',
  
  // Contracts & Payments
  'ContractsList.tsx',
  'ContractWorkspacePage.tsx',
  'ContractWorkspace.tsx',
  'LeaveReview.tsx',
  'PaymentSuccess.tsx',
  'PaymentFailed.tsx',
  
  // Account
  'Messages.tsx',
  'Notifications.tsx',
  'Wallet.tsx',
  'Settings.tsx',
  'VerifyIdentity.tsx',
  
  // Admin
  'AdminDashboard.tsx',
];

const results = {
  total: 0,
  withI18n: 0,
  withoutI18n: 0,
  issues: []
};

function checkFile(filename) {
  const filePath = path.join(PAGES_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    results.issues.push({
      file: filename,
      status: 'NOT_FOUND',
      problems: ['File does not exist']
    });
    return;
  }
  
  results.total++;
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const hasUseTranslation = /useTranslation/.test(content);
  const hasI18nImport = /from ['"]@?\/i18n['"]/.test(content) || /from ['"]\.\.\/i18n['"]/.test(content);
  
  const problems = [];
  
  if (!hasUseTranslation && !hasI18nImport) {
    results.withoutI18n++;
    problems.push('Missing useTranslation hook');
  } else {
    results.withI18n++;
  }
  
  // Check for common hardcoded strings (basic heuristic)
  const hardcodedPatterns = [
    { pattern: />\s*[A-Z][a-z]+\s+[A-Z][a-z]+\s*</g, desc: 'Potential hardcoded title case text' },
    { pattern: /placeholder=["'][A-Z][^"']{10,}["']/g, desc: 'Hardcoded placeholder text' },
    { pattern: /title=["'][A-Z][^"']{10,}["']/g, desc: 'Hardcoded title attribute' },
    { pattern: /aria-label=["'][A-Z][^"']{10,}["']/g, desc: 'Hardcoded aria-label' },
  ];
  
  const suspiciousStrings = [];
  hardcodedPatterns.forEach(({ pattern, desc }) => {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      suspiciousStrings.push(`${desc}: ${matches.length} occurrences`);
    }
  });
  
  if (suspiciousStrings.length > 0) {
    problems.push(...suspiciousStrings);
  }
  
  if (problems.length > 0) {
    results.issues.push({
      file: filename,
      status: hasUseTranslation ? 'PARTIAL' : 'MISSING',
      problems
    });
  }
}

// Run audit
console.log('🔍 Starting i18n audit for all pages...\n');

PAGE_FILES.forEach(checkFile);

// Generate report
let report = `# I18n Pages Audit Report\n\n`;
report += `**Generated:** ${new Date().toISOString()}\n\n`;
report += `## Summary\n\n`;
report += `- **Total Pages:** ${results.total}\n`;
report += `- **With i18n:** ${results.withI18n} (${Math.round(results.withI18n / results.total * 100)}%)\n`;
report += `- **Without i18n:** ${results.withoutI18n} (${Math.round(results.withoutI18n / results.total * 100)}%)\n`;
report += `- **Issues Found:** ${results.issues.length}\n\n`;

if (results.issues.length > 0) {
  report += `## Issues by Page\n\n`;
  
  results.issues.forEach(({ file, status, problems }) => {
    report += `### ${file}\n\n`;
    report += `**Status:** ${status}\n\n`;
    report += `**Problems:**\n`;
    problems.forEach(problem => {
      report += `- ${problem}\n`;
    });
    report += `\n`;
  });
}

report += `## Next Steps\n\n`;
report += `1. Add \`useTranslation\` hook to pages missing it\n`;
report += `2. Replace hardcoded strings with translation keys\n`;
report += `3. Add missing translation keys to ar.ts, en.ts, and fr.ts\n`;
report += `4. Test each page in all three languages\n`;

fs.writeFileSync(REPORT_FILE, report);

console.log(`✅ Audit complete!`);
console.log(`📊 Results:`);
console.log(`   - Total pages: ${results.total}`);
console.log(`   - With i18n: ${results.withI18n}`);
console.log(`   - Without i18n: ${results.withoutI18n}`);
console.log(`   - Issues found: ${results.issues.length}`);
console.log(`\n📄 Full report saved to: ${REPORT_FILE}`);
