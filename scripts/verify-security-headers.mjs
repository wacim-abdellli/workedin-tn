import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_PATHS = ['/', '/login', '/api/live'];
const DEFAULT_OUTPUT = 'artifacts/security-headers/report.json';
const DEFAULT_WAIT_MS = 30_000;
const MIN_HSTS_MAX_AGE = 31_536_000;
const REQUIRED_REFERRER_POLICY = 'strict-origin-when-cross-origin';
const REQUIRED_PERMISSIONS_POLICY = {
  camera: '()',
  microphone: '(self)',
  geolocation: '()',
};
const REQUIRED_CSP = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", 'https://*.supabase.co', 'https://app.posthog.com', 'https://*.sentry.io'],
  'worker-src': ["'self'", 'blob:'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
  'connect-src': ["'self'", 'https://*.supabase.co', 'https://app.posthog.com', 'https://*.sentry.io', 'wss://*.supabase.co'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'media-src': ["'self'", 'blob:'],
  'object-src': ["'none'"],
  'upgrade-insecure-requests': [],
};

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

function normalizeHeaderValue(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function parseDirectiveMap(cspValue) {
  const directives = new Map();

  for (const rawDirective of cspValue.split(';')) {
    const directive = rawDirective.trim();
    if (!directive) continue;

    const [name, ...values] = directive.split(/\s+/);
    directives.set(name, values);
  }

  return directives;
}

function parsePermissionsPolicy(value) {
  const policy = new Map();

  for (const rawEntry of value.split(',')) {
    const entry = rawEntry.trim();
    if (!entry) continue;

    const separatorIndex = entry.indexOf('=');
    if (separatorIndex === -1) continue;

    const name = entry.slice(0, separatorIndex).trim();
    const policyValue = entry.slice(separatorIndex + 1).trim();
    policy.set(name, policyValue);
  }

  return policy;
}

function buildCheck(name, passed, expected, actual, details) {
  return { name, passed, expected, actual, details };
}

function verifyHsts(value) {
  const normalizedValue = normalizeHeaderValue(value);
  if (!normalizedValue) {
    return buildCheck(
      'strict-transport-security',
      false,
      `max-age>=${MIN_HSTS_MAX_AGE}; includeSubDomains; preload`,
      '(missing)',
    );
  }

  const directives = normalizedValue.split(';').map((entry) => entry.trim()).filter(Boolean);
  const maxAgeDirective = directives.find((entry) => entry.toLowerCase().startsWith('max-age='));
  const maxAge = maxAgeDirective ? Number(maxAgeDirective.split('=')[1]) : Number.NaN;
  const hasIncludeSubdomains = directives.some((entry) => entry === 'includeSubDomains');
  const hasPreload = directives.some((entry) => entry === 'preload');
  const passed = Number.isFinite(maxAge) && maxAge >= MIN_HSTS_MAX_AGE && hasIncludeSubdomains && hasPreload;

  return buildCheck(
    'strict-transport-security',
    passed,
    `max-age>=${MIN_HSTS_MAX_AGE}; includeSubDomains; preload`,
    normalizedValue,
  );
}

function verifyHeaders(headers) {
  const checks = [];
  const csp = normalizeHeaderValue(headers.get('content-security-policy') || '');
  const hsts = normalizeHeaderValue(headers.get('strict-transport-security') || '');
  const nosniff = normalizeHeaderValue(headers.get('x-content-type-options') || '');
  const frameOptions = normalizeHeaderValue(headers.get('x-frame-options') || '');
  const referrerPolicy = normalizeHeaderValue(headers.get('referrer-policy') || '');
  const permissionsPolicy = normalizeHeaderValue(headers.get('permissions-policy') || '');

  checks.push(verifyHsts(hsts));
  checks.push(buildCheck('x-content-type-options', nosniff.toLowerCase() === 'nosniff', 'nosniff', nosniff || '(missing)'));
  checks.push(buildCheck('x-frame-options', frameOptions.toUpperCase() === 'DENY', 'DENY', frameOptions || '(missing)'));
  checks.push(buildCheck('referrer-policy', referrerPolicy === REQUIRED_REFERRER_POLICY, REQUIRED_REFERRER_POLICY, referrerPolicy || '(missing)'));

  const permissionDirectives = parsePermissionsPolicy(permissionsPolicy);
  for (const [directiveName, expectedValue] of Object.entries(REQUIRED_PERMISSIONS_POLICY)) {
    const actualValue = permissionDirectives.get(directiveName) || '(missing)';
    checks.push(buildCheck(`permissions-policy:${directiveName}`, actualValue === expectedValue, expectedValue, actualValue));
  }

  const cspDirectives = parseDirectiveMap(csp);
  for (const [directiveName, expectedTokens] of Object.entries(REQUIRED_CSP)) {
    const actualTokens = cspDirectives.get(directiveName);
    const actualValue = actualTokens ? actualTokens.join(' ') : '(missing)';

    if (!actualTokens) {
      checks.push(buildCheck(`content-security-policy:${directiveName}`, false, expectedTokens.join(' '), actualValue));
      continue;
    }

    if (expectedTokens.length === 0) {
      checks.push(buildCheck(`content-security-policy:${directiveName}`, true, '(present)', actualValue || '(present)'));
      continue;
    }

    for (const expectedToken of expectedTokens) {
      checks.push(
        buildCheck(
          `content-security-policy:${directiveName}:${expectedToken}`,
          actualTokens.includes(expectedToken),
          expectedToken,
          actualValue,
        ),
      );
    }
  }

  return checks;
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, waitMs) {
  const deadline = Date.now() + waitMs;
  let lastError = null;

  while (Date.now() <= deadline) {
    try {
      return await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          Accept: 'text/html,application/json',
          'Cache-Control': 'no-cache',
        },
      });
    } catch (error) {
      lastError = error;
      await sleep(1_000);
    }
  }

  throw lastError ?? new Error(`Timed out waiting for ${url}`);
}

function buildUrl(baseUrl, routePath) {
  return new URL(routePath, `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}`).toString();
}

function summarizeChecks(checks) {
  return checks.every((check) => check.passed);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseUrl = args['base-url'] || process.env.HEADER_AUDIT_BASE_URL;

  if (!baseUrl) {
    throw new Error('Missing required --base-url argument or HEADER_AUDIT_BASE_URL environment variable.');
  }

  const outputPath = args.output || process.env.HEADER_AUDIT_OUTPUT || DEFAULT_OUTPUT;
  const label = args.label || process.env.HEADER_AUDIT_LABEL || 'default';
  const waitMs = Number(args['wait-ms'] || process.env.HEADER_AUDIT_WAIT_MS || DEFAULT_WAIT_MS);
  const paths = (args.paths || process.env.HEADER_AUDIT_PATHS || DEFAULT_PATHS.join(','))
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const results = [];

  for (const routePath of paths) {
    const url = buildUrl(baseUrl, routePath);
    const response = await fetchWithRetry(url, waitMs);
    const headerChecks = verifyHeaders(response.headers);
    const statusCheck = buildCheck('status', response.status === 200, '200', String(response.status));
    const checks = [statusCheck, ...headerChecks];

    results.push({
      path: routePath,
      url,
      status: response.status,
      ok: summarizeChecks(checks),
      checks,
      responseHeaders: Object.fromEntries(response.headers.entries()),
    });
  }

  const overallPass = results.every((result) => result.ok);
  const report = {
    generatedAt: new Date().toISOString(),
    label,
    baseUrl,
    overallPass,
    results,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  for (const result of results) {
    console.log(`${result.ok ? 'PASS' : 'FAIL'} ${result.path} -> ${result.status}`);
    for (const check of result.checks.filter((item) => !item.passed)) {
      console.log(`  - ${check.name}: expected ${check.expected}, got ${check.actual}`);
    }
  }

  console.log(`Header verification report written to ${outputPath}`);

  if (!overallPass) {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  const args = parseArgs(process.argv.slice(2));
  const outputPath = args.output || process.env.HEADER_AUDIT_OUTPUT || DEFAULT_OUTPUT;
  const failureReport = {
    generatedAt: new Date().toISOString(),
    label: args.label || process.env.HEADER_AUDIT_LABEL || 'default',
    baseUrl: args['base-url'] || process.env.HEADER_AUDIT_BASE_URL || null,
    overallPass: false,
    error: error instanceof Error ? error.message : String(error),
    results: [],
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(failureReport, null, 2)}\n`, 'utf8');

  console.error(error instanceof Error ? error.message : error);
  console.error(`Header verification report written to ${outputPath}`);
  process.exitCode = 1;
});
