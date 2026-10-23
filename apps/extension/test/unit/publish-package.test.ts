// @vitest-environment node
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { nextVersion, parseArgs, publishPackage, type IReleaseOptions } from '../../scripts/publish-package.mts';
import { sha256, zipDirectory } from '../../scripts/zip.mjs';

const temporary: string[] = [];
afterEach(async () => {
  await Promise.all(temporary.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function fixture() {
  const workspace = await mkdtemp(path.join(tmpdir(), 'awaketab-release-test-'));
  temporary.push(workspace);
  const root = path.join(workspace, 'apps/extension');
  const output = path.join(workspace, 'desktop');
  await mkdir(root, { recursive: true });
  await mkdir(output);
  const original = '{ "name": "extension", "version": "1.2.3", "private": true }\n';
  await writeFile(path.join(root, 'package.json'), original);
  const calls: { args: string[]; env: NodeJS.ProcessEnv }[] = [];
  const run: NonNullable<IReleaseOptions['run']> = async (_command, args, options) => {
    expect(options.cwd).toBe(workspace);
    calls.push({ args, env: options.env });
    if (args.at(-1) !== 'zip') return;
    const { version } = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')) as { version: string };
    const build = path.join(root, '.output/chrome-mv3');
    await mkdir(path.join(build, '_locales/en'), { recursive: true });
    await writeFile(
      path.join(build, 'manifest.json'),
      JSON.stringify({ manifest_version: 3, name: '__MSG_ext_name__', version }),
    );
    await writeFile(
      path.join(build, '_locales/en/messages.json'),
      JSON.stringify({ ext_name: { message: 'AwakeTab: Keep Screen Awake' } }),
    );
    await writeFile(path.join(build, 'background.js'), 'console.log("AwakeTab");');
    await writeFile(path.join(root, `.output/awaketab-chrome-${version}.zip`), await zipDirectory(build));
  };
  return { workspace, root, output, original, calls, run };
}

describe('extension release packaging', () => {
  it('computes Chrome-compatible versions and rejects malformed or overflowing versions', () => {
    expect(nextVersion('1.2.3', 'patch')).toBe('1.2.4');
    expect(nextVersion('1.2.3', 'minor')).toBe('1.3.0');
    expect(nextVersion('1.2.3', 'major')).toBe('2.0.0');
    expect(nextVersion('1.2.3', 'current')).toBe('1.2.3');
    expect(() => nextVersion('1.2.3-beta', 'patch')).toThrow();
    expect(() => nextVersion('1.2.65535', 'patch')).toThrow();
    expect(() => nextVersion('65536.0.0', 'current')).toThrow();
    expect(() => nextVersion('0.0.0', 'current')).toThrow();
  });

  it('requires explicit noninteractive choices and refuses ambiguous arguments', () => {
    expect(parseArgs(['--current', '--output-dir', '/tmp/release'])).toEqual({
      kind: 'current',
      outputDirectory: '/tmp/release',
    });
    expect(parseArgs(['minor'])).toEqual({ kind: 'minor', outputDirectory: undefined });
    expect(() => parseArgs(['patch', 'minor'])).toThrow();
    expect(() => parseArgs(['--current', 'patch'])).toThrow();
    expect(() => parseArgs(['--output-dir'])).toThrow();
  });

  it('validates before installing, synchronizes the version and pins free production settings', async () => {
    const f = await fixture();
    const result = await publishPackage({
      rootDirectory: f.root,
      outputDirectory: f.output,
      kind: 'minor',
      run: f.run,
    });
    expect(result.version).toBe('1.3.0');
    const metadata = JSON.parse(await readFile(path.join(f.root, 'package.json'), 'utf8')) as { version: string };
    expect(metadata.version).toBe('1.3.0');
    const bytes = await readFile(result.archivePath);
    expect(result.sha256).toBe(sha256(bytes));
    expect(f.calls.map((call) => call.args.at(-1))).toEqual([
      'typecheck',
      'packages/wake/test',
      'test:e2e:ext',
      'zip',
      'zip:check',
    ]);
    for (const call of f.calls) expect(call.env.AT_ALLOW_MISSING_PRODUCTION_KEY).toBeUndefined();
    expect(f.calls.at(-1)?.env).toMatchObject({
      PUBLIC_POLAR_SERVER: 'production',
      PUBLIC_PAYMENTS_ENABLED: '0',
      AT_EXT_TEST: '0',
    });
    expect(await readdir(f.output)).toEqual(['AwakeTab-v1.3.0.zip']);
    await expect(readFile(path.join(f.root, '.publish-package.lock'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('packages the first unpublished version without rewriting metadata', async () => {
    const f = await fixture();
    await publishPackage({ rootDirectory: f.root, outputDirectory: f.output, kind: 'current', run: f.run });
    expect(await readFile(path.join(f.root, 'package.json'), 'utf8')).toBe(f.original);
  });

  it('restores exact metadata and removes staging when a validation fails', async () => {
    const f = await fixture();
    await expect(
      publishPackage({
        rootDirectory: f.root,
        outputDirectory: f.output,
        kind: 'patch',
        run: () => Promise.reject(new Error('failed check')),
      }),
    ).rejects.toThrow('failed check');
    expect(await readFile(path.join(f.root, 'package.json'), 'utf8')).toBe(f.original);
    expect(await readdir(f.output)).toEqual([]);
    await expect(readFile(path.join(f.root, '.publish-package.lock'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('preserves an existing ZIP and does not begin validation or change the version', async () => {
    const f = await fixture();
    const archive = path.join(f.output, 'AwakeTab-v1.2.4.zip');
    await writeFile(archive, 'existing release');
    await expect(
      publishPackage({ rootDirectory: f.root, outputDirectory: f.output, kind: 'patch', run: f.run }),
    ).rejects.toThrow('already exists');
    expect(f.calls).toEqual([]);
    expect(await readFile(archive, 'utf8')).toBe('existing release');
    expect(await readFile(path.join(f.root, 'package.json'), 'utf8')).toBe(f.original);
  });

  it('rejects an archive that differs from the validated build and restores the version', async () => {
    const f = await fixture();
    await expect(
      publishPackage({
        rootDirectory: f.root,
        outputDirectory: f.output,
        kind: 'patch',
        run: async (command, args, options) => {
          await f.run(command, args, options);
          if (args.at(-1) === 'zip:check')
            await writeFile(path.join(f.root, '.output/chrome-mv3/background.js'), 'changed');
        },
      }),
    ).rejects.toThrow('byte for byte');
    expect(await readFile(path.join(f.root, 'package.json'), 'utf8')).toBe(f.original);
    expect(await readdir(f.output)).toEqual([]);
  });

  it('cancels without publishing and keeps concurrent metadata edits', async () => {
    const f = await fixture();
    const controller = new AbortController();
    await expect(
      publishPackage({
        rootDirectory: f.root,
        outputDirectory: f.output,
        kind: 'patch',
        signal: controller.signal,
        run: () => {
          controller.abort();
          return Promise.resolve();
        },
      }),
    ).rejects.toThrow('cancelled');
    expect(await readFile(path.join(f.root, 'package.json'), 'utf8')).toBe(f.original);
    await expect(
      publishPackage({
        rootDirectory: f.root,
        outputDirectory: f.output,
        kind: 'patch',
        run: async () => {
          await writeFile(path.join(f.root, 'package.json'), 'concurrent edit');
          throw new Error('failed');
        },
      }),
    ).rejects.toThrow('changed concurrently');
    expect(await readFile(path.join(f.root, 'package.json'), 'utf8')).toBe('concurrent edit');
    expect(await readdir(f.output)).toEqual([]);
  });

  it('respects another packaging lock without deleting it', async () => {
    const f = await fixture();
    await writeFile(path.join(f.root, '.publish-package.lock'), 'active run');
    await expect(
      publishPackage({ rootDirectory: f.root, outputDirectory: f.output, kind: 'patch', run: f.run }),
    ).rejects.toThrow('Another package run');
    expect(await readFile(path.join(f.root, '.publish-package.lock'), 'utf8')).toBe('active run');
    expect(await readFile(path.join(f.root, 'package.json'), 'utf8')).toBe(f.original);
  });
});
