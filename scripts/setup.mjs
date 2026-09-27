#!/usr/bin/env node
// One-command local setup for macOS, Linux and Windows. Uses only Node built-ins, so it runs before pnpm exists.
// Usage: node scripts/setup.mjs [--with-browsers] [--dry-run]   (or: pnpm run setup)
import { spawnSync } from 'node:child_process';
import { constants, copyFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARGS = new Set(process.argv.slice(2));
const DRY_RUN = ARGS.has('--dry-run');
const WITH_BROWSERS = ARGS.has('--with-browsers');
const IS_WINDOWS = process.platform === 'win32';

// Corepack asks before downloading pnpm the first time; a setup script should not stop at a hidden prompt.
const CHILD_ENV = { ...process.env, COREPACK_ENABLE_DOWNLOAD_PROMPT: '0' };

const log = (message = '') => {
  console.log(message);
};
const step = (message) => {
  log(`\n> ${message}`);
};
const fail = (lines) => {
  console.error(`\n${lines.join('\n')}\n`);
  process.exit(1);
};

function readText(file) {
  try {
    return readFileSync(path.join(ROOT, file), 'utf8');
  } catch {
    return null;
  }
}

function requiredNodeMajor() {
  const nvmrc = readText('.nvmrc')?.trim().replace(/^v/u, '');
  const fromNvmrc = nvmrc ? Number.parseInt(nvmrc, 10) : Number.NaN;
  if (Number.isInteger(fromNvmrc)) return fromNvmrc;
  const engines = JSON.parse(readText('package.json') ?? '{}').engines?.node ?? '';
  const fromEngines = /(\d+)/u.exec(engines);
  return fromEngines ? Number(fromEngines[1]) : 22;
}

function requiredPnpmVersion() {
  const manager = JSON.parse(readText('package.json') ?? '{}').packageManager ?? '';
  return /^pnpm@(\d+\.\d+\.\d+)/u.exec(manager)?.[1] ?? '9.15.9';
}

// On Windows pnpm and corepack are .cmd shims, which Node 22 only starts through a shell. The arguments passed here
// are fixed words without spaces or quotes, so running them through cmd.exe is safe.
function run(command, args, { capture = false } = {}) {
  return spawnSync(command, args, {
    cwd: ROOT,
    env: CHILD_ENV,
    shell: IS_WINDOWS,
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    encoding: 'utf8',
  });
}

function runOrPrint(command, args) {
  const line = [command, ...args].join(' ');
  if (DRY_RUN) {
    log(`  (dry run) would run: ${line}`);
    return true;
  }
  log(`  $ ${line}`);
  const result = run(command, args);
  return !result.error && result.status === 0;
}

function versionOf(command) {
  const result = run(command, ['--version'], { capture: true });
  if (result.error || result.status !== 0) return null;
  return result.stdout.trim().split(/\s+/u).pop() ?? null;
}

function checkNode() {
  const need = requiredNodeMajor();
  const have = Number.parseInt(process.versions.node, 10);
  step(`Node.js ${String(need)}`);
  if (have === need) {
    log(`  ok: Node.js ${process.versions.node}`);
    return;
  }
  fail([
    `This repository needs Node.js ${String(need)}, but this is Node.js ${process.versions.node}.`,
    'Switch with one of these, then run the setup again:',
    `  nvm:  nvm install ${String(need)} && nvm use ${String(need)}`,
    `  fnm:  fnm use ${String(need)} --install-if-missing`,
    `  or download Node.js ${String(need)} from https://nodejs.org`,
  ]);
}

function ensurePnpm() {
  const need = requiredPnpmVersion();
  step(`pnpm ${need}`);
  if (versionOf('pnpm') === need) {
    log(`  ok: pnpm ${need}`);
    return;
  }
  if (!versionOf('corepack')) {
    fail([
      'Corepack was not found. It ships with Node.js 22, so this Node.js install may be trimmed.',
      'Install it, or install pnpm directly, then run the setup again:',
      '  npm install --global corepack',
      `  npm install --global pnpm@${need}`,
    ]);
  }
  const enabled = runOrPrint('corepack', ['enable']);
  if (!enabled) {
    fail([
      '`corepack enable` could not write the pnpm shims next to Node.js (usually a permissions error).',
      IS_WINDOWS
        ? 'Open a terminal with "Run as administrator", run `corepack enable` once, then run the setup again.'
        : 'Run `sudo corepack enable` once, or use a Node.js from nvm or fnm (no admin rights needed), then run the setup again.',
      `Alternative: npm install --global pnpm@${need}`,
    ]);
  }
  if (!runOrPrint('corepack', ['prepare', `pnpm@${need}`, '--activate'])) {
    fail([`Corepack could not download pnpm ${need}. Check your network or proxy, then run the setup again.`]);
  }
  if (DRY_RUN) return;
  const now = versionOf('pnpm');
  if (now !== need) {
    fail([
      `pnpm reports ${now ?? 'nothing'} instead of ${need}.`,
      'Open a new terminal so the new pnpm is on your PATH, then run the setup again.',
    ]);
  }
  log(`  ok: pnpm ${need}`);
}

function install() {
  step('Install dependencies');
  if (!runOrPrint('pnpm', ['install'])) fail(['`pnpm install` failed. The output above says why.']);
}

function copyDevVars() {
  const from = path.join(ROOT, 'apps', 'web', '.dev.vars.example');
  const to = path.join(ROOT, 'apps', 'web', '.dev.vars');
  const shown = path.relative(ROOT, to);
  step(`Local secrets file ${shown}`);
  if (existsSync(to)) {
    log(`  kept: ${shown} already exists and was not changed`);
    return;
  }
  if (!existsSync(from)) {
    log(`  skipped: ${path.relative(ROOT, from)} is missing`);
    return;
  }
  if (DRY_RUN) {
    log(`  (dry run) would copy ${path.relative(ROOT, from)} to ${shown}`);
    return;
  }
  // COPYFILE_EXCL makes the copy fail rather than overwrite a file created in the meantime.
  copyFileSync(from, to, constants.COPYFILE_EXCL);
  log(`  created: ${shown} from the example (sandbox-only dummy values)`);
}

function installBrowsers() {
  step('Playwright Chromium (for pnpm test:e2e)');
  if (!WITH_BROWSERS) {
    log('  skipped: add --with-browsers to install it');
    return;
  }
  if (!runOrPrint('pnpm', ['exec', 'playwright', 'install', 'chromium'])) {
    fail([
      'Playwright could not install Chromium.',
      process.platform === 'linux'
        ? 'On Linux the browser may also need system libraries: pnpm exec playwright install --with-deps chromium'
        : 'Check your network or proxy, then run: pnpm exec playwright install chromium',
    ]);
  }
}

if (ARGS.has('--help') || ARGS.has('-h')) {
  log('Usage: node scripts/setup.mjs [--with-browsers] [--dry-run]');
  log('  --with-browsers  also install Playwright Chromium for the end-to-end tests');
  log('  --dry-run        print the commands instead of running them');
  process.exit(0);
}

log(`AwakeTab setup${DRY_RUN ? ' (dry run)' : ''}`);
checkNode();
ensurePnpm();
install();
copyDevVars();
installBrowsers();

log('\nDone. Next:');
log('  pnpm dev          start the site at http://localhost:4321');
log('  pnpm test         unit and Pages Functions tests');
log('  pnpm build        build every package and the site');
log(`  pnpm test:e2e     end-to-end tests${WITH_BROWSERS ? '' : ' (run the setup with --with-browsers first)'}`);
