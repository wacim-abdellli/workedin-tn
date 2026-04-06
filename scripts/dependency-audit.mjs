import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const SEVERITY_ORDER = ['info', 'low', 'moderate', 'high', 'critical'];

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

function shouldFail(summary, threshold) {
  const thresholdIndex = SEVERITY_ORDER.indexOf(threshold);
  if (thresholdIndex === -1) {
    throw new Error(`Unsupported severity threshold: ${threshold}`);
  }

  return SEVERITY_ORDER.slice(thresholdIndex).some((severity) => Number(summary[severity] || 0) > 0);
}

async function runNpmAudit() {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

  return await new Promise((resolve, reject) => {
    const child = spawn(npmCommand, ['audit', '--json'], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
      shell: process.platform === 'win32',
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

async function writeReport(outputPath, report) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const failOn = args['fail-on'] || 'high';
  const outputPath = args.output || 'artifacts/dependency-audit/report.json';

  const result = await runNpmAudit();
  let payload;

  try {
    payload = JSON.parse(result.stdout || '{}');
  } catch (error) {
    const report = {
      generatedAt: new Date().toISOString(),
      passed: false,
      failOn,
      error: 'Failed to parse npm audit JSON output.',
      commandExitCode: result.code,
      stderr: result.stderr,
      rawStdout: result.stdout,
    };

    await writeReport(outputPath, report);
    throw error;
  }

  const summary = payload?.metadata?.vulnerabilities || {
    info: 0,
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0,
    total: 0,
  };
  const passed = !shouldFail(summary, failOn);

  const report = {
    generatedAt: new Date().toISOString(),
    passed,
    failOn,
    commandExitCode: result.code,
    summary,
    vulnerabilities: payload?.vulnerabilities || {},
    stderr: result.stderr,
  };

  await writeReport(outputPath, report);

  console.log(`Dependency audit report written to ${outputPath}`);
  console.log(`Severity summary: ${JSON.stringify(summary)}`);
  console.log(`Fail threshold: ${failOn}`);

  if (!passed) {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  const args = parseArgs(process.argv.slice(2));
  const outputPath = args.output || 'artifacts/dependency-audit/report.json';
  const report = {
    generatedAt: new Date().toISOString(),
    passed: false,
    failOn: args['fail-on'] || 'high',
    error: error instanceof Error ? error.message : String(error),
  };

  await writeReport(outputPath, report);
  console.error(error instanceof Error ? error.message : error);
  console.error(`Dependency audit report written to ${outputPath}`);
  process.exitCode = 1;
});
