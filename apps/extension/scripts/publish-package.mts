import { spawn, type ChildProcess } from 'node:child_process';
import { link, lstat, mkdir, mkdtemp, open, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as wait } from 'node:timers/promises';
import { sha256, zipDirectory } from './zip.mjs';

export type TReleaseKind = 'current' | 'patch' | 'minor' | 'major';
interface IPackageDocument {
  version: string;
  [key: string]: unknown;
}
interface ICommandOptions {
  cwd: string;
  env: NodeJS.ProcessEnv;
  signal?: AbortSignal | undefined;
}
type TRun = (command: string, args: string[], options: ICommandOptions) => Promise<void>;
export interface IReleaseOptions {
  rootDirectory: string;
  kind: TReleaseKind;
  outputDirectory?: string | undefined;
  signal?: AbortSignal | undefined;
  run?: TRun;
}

export function nextVersion(version: string, kind: TReleaseKind): string {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u.test(version))
    throw new Error('Use a three-part extension version such as 1.0.0.');
  const parts = version.split('.').map(Number);
  if (parts.some((part) => part > 65535)) throw new Error('Version components must be at most 65535.');
  if (parts.every((part) => part === 0)) throw new Error('Chrome requires a nonzero extension version.');
  if (kind !== 'current') {
    const index = { major: 0, minor: 1, patch: 2 }[kind];
    parts[index] = (parts[index] ?? 0) + 1;
    for (let i = index + 1; i < parts.length; i += 1) parts[i] = 0;
  }
  if (parts.some((part) => part > 65535)) throw new Error('The selected version exceeds Chrome limits.');
  return parts.join('.');
}

function cancelled(signal?: AbortSignal): void {
  if (signal?.aborted) throw new Error('Packaging cancelled.');
}

function codeIs(error: unknown, code: string): boolean {
  return error instanceof Error && 'code' in error && error.code === code;
}

// Wait for subprocess termination before restoring version metadata.
async function stopGroup(child: ChildProcess): Promise<void> {
  const pid = child.pid;
  if (!pid) return;
  if (process.platform === 'win32') {
    child.kill('SIGTERM');
    return;
  }
  const exists = () => {
    try {
      process.kill(-pid, 0);
      return true;
    } catch (error) {
      if (codeIs(error, 'ESRCH')) return false;
      throw error;
    }
  };
  try {
    process.kill(-pid, 'SIGTERM');
  } catch (error) {
    if (codeIs(error, 'ESRCH')) return;
    throw error;
  }
  const deadline = Date.now() + 1000;
  while (exists() && Date.now() < deadline) await wait(25);
  if (exists()) {
    try {
      process.kill(-pid, 'SIGKILL');
    } catch (error) {
      if (!codeIs(error, 'ESRCH')) throw error;
    }
    await wait(100);
  }
}

export const runCommand: TRun = (command, args, options) => {
  cancelled(options.signal);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: 'inherit',
      detached: process.platform !== 'win32',
    });
    let stopping: Promise<void> | undefined;
    const stop = () => {
      stopping ??= stopGroup(child);
      void stopping.catch(() => undefined);
    };
    options.signal?.addEventListener('abort', stop, { once: true });
    if (options.signal?.aborted) stop();
    const clean = () => {
      options.signal?.removeEventListener('abort', stop);
    };
    child.once('error', (error) => {
      clean();
      reject(error);
    });
    child.once('close', (code) => {
      clean();
      if (options.signal?.aborted) {
        void (stopping ?? Promise.resolve()).then(() => {
          reject(new Error('Packaging cancelled.'));
        }, reject);
      } else if (code !== 0) reject(new Error(`${command} ${args.join(' ')} failed (exit ${String(code)}).`));
      else resolve();
    });
  });
};

export async function publishPackage(options: IReleaseOptions) {
  const root = path.resolve(options.rootDirectory);
  const workspace = path.resolve(root, '../..');
  const output = path.resolve(options.outputDirectory ?? path.join(homedir(), 'Desktop'));
  const packagePath = path.join(root, 'package.json');
  const lockPath = path.join(root, '.publish-package.lock');
  const run = options.run ?? runCommand;
  let lock;
  let staging: string | undefined;
  let original: Buffer | undefined;
  let written: Buffer | undefined;
  let installed = false;
  try {
    cancelled(options.signal);
    try {
      lock = await open(lockPath, 'wx');
    } catch (error) {
      if (codeIs(error, 'EEXIST'))
        throw new Error(
          'Another package run holds .publish-package.lock. Wait for it to finish; inspect metadata before removing a stale lock.',
          { cause: error },
        );
      throw error;
    }
    original = await readFile(packagePath);
    const document = JSON.parse(original.toString('utf8')) as IPackageDocument;
    const previousVersion = document.version;
    const version = nextVersion(previousVersion, options.kind);
    const archivePath = path.join(output, `AwakeTab-v${version}.zip`);
    await mkdir(output, { recursive: true });
    try {
      await lstat(archivePath);
      throw new Error(`Archive already exists: ${archivePath}. Nothing was overwritten.`);
    } catch (error) {
      if (!codeIs(error, 'ENOENT')) throw error;
    }
    staging = await mkdtemp(path.join(output, '.awaketab-package-'));
    cancelled(options.signal);
    if (version !== previousVersion) {
      document.version = version;
      written = Buffer.from(`${JSON.stringify(document, null, 2)}\n`);
      await writeFile(packagePath, written);
    }
    const base: NodeJS.ProcessEnv = {
      ...process.env,
      AT_EXT_OUT: undefined,
      AT_EXT_SKIP_BUILD: undefined,
      AT_ALLOW_MISSING_PRODUCTION_KEY: undefined,
      PUBLIC_PAYMENTS_ENABLED: '0',
    };
    const testEnv = { ...base, PUBLIC_POLAR_SERVER: 'sandbox', AT_EXT_TEST: '0' };
    const productionEnv = { ...base, PUBLIC_POLAR_SERVER: 'production', AT_EXT_TEST: '0' };
    const commands = [
      { args: ['-F', 'extension', 'typecheck'], env: testEnv },
      {
        args: [
          'exec',
          'vitest',
          'run',
          '--config',
          'vitest.config.ts',
          'apps/extension/test',
          'packages/core/test',
          'packages/wake/test',
        ],
        env: testEnv,
      },
      { args: ['test:e2e:ext'], env: testEnv },
      { args: ['-F', 'extension', 'zip'], env: productionEnv },
      { args: ['-F', 'extension', 'zip:check'], env: productionEnv },
    ];
    for (const { args, env } of commands) {
      cancelled(options.signal);
      await run('pnpm', args, { cwd: workspace, env, signal: options.signal });
    }
    cancelled(options.signal);
    const build = path.join(root, '.output/chrome-mv3');
    const manifest = JSON.parse(await readFile(path.join(build, 'manifest.json'), 'utf8')) as {
      version: string;
      manifest_version: number;
      name: string;
    };
    const messages = JSON.parse(await readFile(path.join(build, '_locales/en/messages.json'), 'utf8')) as {
      ext_name?: { message: string };
    };
    if (
      manifest.version !== version ||
      manifest.manifest_version !== 3 ||
      manifest.name !== '__MSG_ext_name__' ||
      messages.ext_name?.message !== 'AwakeTab: Keep Screen Awake'
    )
      throw new Error('The built manifest does not match this AwakeTab release.');
    const bytes = await readFile(path.join(root, `.output/awaketab-chrome-${version}.zip`));
    if (!bytes.equals(await zipDirectory(build)))
      throw new Error('The ZIP does not match the production build byte for byte.');
    const temporary = path.join(staging, `AwakeTab-v${version}.zip`);
    await writeFile(temporary, bytes);
    cancelled(options.signal);
    await link(temporary, archivePath);
    installed = true;
    return { version, previousVersion, archivePath, bytes: bytes.length, sha256: sha256(bytes) };
  } catch (error) {
    if (written && original && !installed) {
      const current = await readFile(packagePath);
      if (!current.equals(written))
        throw new AggregateError(
          [error],
          'Packaging failed and package.json changed concurrently. It was preserved; inspect it before retrying.',
          { cause: error },
        );
      await writeFile(packagePath, original);
    }
    throw error;
  } finally {
    if (staging)
      await rm(staging, { recursive: true, force: true }).catch(() => {
        console.error(`Temporary archive cleanup needed: ${String(staging)}`);
      });
    if (lock) {
      await lock.close();
      await unlink(lockPath).catch(() => {
        console.error(`Packaging lock cleanup needed: ${lockPath}`);
      });
    }
  }
}

export function parseArgs(args: string[]): { kind?: TReleaseKind | undefined; outputDirectory?: string | undefined } {
  let kind: TReleaseKind | undefined;
  let outputDirectory: string | undefined;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--current' && !kind) kind = 'current';
    else if ((arg === 'patch' || arg === 'minor' || arg === 'major') && !kind) kind = arg;
    else if (arg === '--output-dir' && !outputDirectory && args[i + 1] && !args[i + 1]?.startsWith('--'))
      outputDirectory = args[++i];
    else throw new Error('Usage: pnpm -F extension publish:package [patch|minor|major|--current] [--output-dir PATH]');
  }
  return { kind, outputDirectory };
}

async function main(): Promise<void> {
  const controller = new AbortController();
  const stop = () => {
    controller.abort();
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  try {
    const rootDirectory = fileURLToPath(new URL('..', import.meta.url));
    const parsed = parseArgs(process.argv.slice(2));
    if (!parsed.kind) {
      if (!process.stdin.isTTY || !process.stdout.isTTY)
        throw new Error(
          'Choose patch, minor or major explicitly outside an interactive terminal. Use --current only for an unpublished version.',
        );
      const { version } = JSON.parse(
        await readFile(path.join(rootDirectory, 'package.json'), 'utf8'),
      ) as IPackageDocument;
      const readline = createInterface({ input: process.stdin, output: process.stdout });
      try {
        const answer = (
          await readline.question(
            `Current version ${version}. Choose [1] patch, [2] minor, [3] major (Enter cancels): `,
            { signal: controller.signal },
          )
        ).trim();
        if (!answer || answer === 'q') {
          console.log('Cancelled. Version unchanged.');
          return;
        }
        const kind = (
          { '1': 'patch', '2': 'minor', '3': 'major', patch: 'patch', minor: 'minor', major: 'major' } as Record<
            string,
            TReleaseKind
          >
        )[answer];
        if (!kind) throw new Error('Choose patch, minor or major.');
        parsed.kind = kind;
      } finally {
        readline.close();
      }
    }
    const result = await publishPackage({ rootDirectory, ...parsed, kind: parsed.kind, signal: controller.signal });
    console.log(
      `AwakeTab ${result.version} ready\n${result.archivePath}\n${String(result.bytes)} bytes\nSHA-256 ${result.sha256}\nPurchases disabled. Local package only; no store upload, Git commit, push, tag or npm publication performed.`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Packaging failed.');
    process.exitCode = controller.signal.aborted ? 130 : 1;
  } finally {
    process.off('SIGINT', stop);
    process.off('SIGTERM', stop);
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) void main();
