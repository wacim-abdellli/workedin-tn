import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

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

function sanitizeLabel(value) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '-');
}

async function writeTextFile(filePath, content) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, 'utf8');
}

async function runStep({ name, description, command, args, env, logPath }) {
  const startedAt = Date.now();

  return await new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on('close', async (code) => {
      const durationMs = Date.now() - startedAt;
      const passed = code === 0;
      const log = [
        `# ${name}`,
        `description: ${description}`,
        `command: ${command} ${args.join(' ')}`,
        `exitCode: ${String(code ?? 1)}`,
        `durationMs: ${String(durationMs)}`,
        '',
        '## stdout',
        stdout.trimEnd(),
        '',
        '## stderr',
        stderr.trimEnd(),
        '',
      ].join('\n');

      await writeTextFile(logPath, `${log}\n`);

      resolve({
        name,
        description,
        command: `${command} ${args.join(' ')}`,
        passed,
        exitCode: code ?? 1,
        durationMs,
        logPath,
      });
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseUrl = args['base-url'] || process.env.RELEASE_BASE_URL;

  if (!baseUrl) {
    throw new Error('Missing required --base-url argument or RELEASE_BASE_URL environment variable.');
  }

  const label = sanitizeLabel(args.label || process.env.RELEASE_LABEL || 'release-candidate');
  const outputPath = args.output || process.env.RELEASE_CONTROL_OUTPUT || 'artifacts/release-control/report.json';
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const logsDir = path.join(path.dirname(outputPath), 'logs');
  const headerOutput = `artifacts/security-headers/${label}.json`;

  const steps = [
    {
      name: 'strict-audit',
      description: 'Runs the full strict quality pipeline',
      command: npmCommand,
      args: ['run', 'audit:strict'],
    },
    {
      name: 'dependency-audit',
      description: 'Verifies dependency vulnerability threshold',
      command: npmCommand,
      args: ['run', 'deps:audit'],
    },
    {
      name: 'visual-regression',
      description: 'Verifies critical visual baselines',
      command: npmCommand,
      args: ['run', 'test:e2e:visual'],
    },
    {
      name: 'security-headers',
      description: 'Verifies deployed response headers',
      command: npmCommand,
      args: ['run', 'headers:verify', '--', '--base-url', baseUrl, '--label', label, '--output', headerOutput],
    },
  ];

  const results = [];
  for (const step of steps) {
    const logPath = path.join(logsDir, `${step.name}.log`);
    results.push(await runStep({ ...step, logPath }));
  }

  const overallPass = results.every((result) => result.passed);
  const report = {
    generatedAt: new Date().toISOString(),
    label,
    baseUrl,
    overallPass,
    steps: results,
    signOffRoles: ['engineering owner', 'qa owner', 'security owner'],
    checklistSource: 'RELEASE_POLICY.md',
  };

  await writeTextFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`Release control report written to ${outputPath}`);

  if (!overallPass) {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  const args = parseArgs(process.argv.slice(2));
  const outputPath = args.output || process.env.RELEASE_CONTROL_OUTPUT || 'artifacts/release-control/report.json';
  const report = {
    generatedAt: new Date().toISOString(),
    overallPass: false,
    error: error instanceof Error ? error.message : String(error),
  };

  await writeTextFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.error(error instanceof Error ? error.message : error);
  console.error(`Release control report written to ${outputPath}`);
  process.exitCode = 1;
});
