// @vitest-environment node
import { mkdtemp, mkdir, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { checkReproducible } from '../../scripts/reproducible.mjs';
import { zipDirectory } from '../../scripts/zip.mjs';

function unzip(buf: Buffer): Map<string, Buffer> {
  const out = new Map<string, Buffer>();
  let i = 0;
  while (buf.readUInt32LE(i) === 0x04034b50) {
    const method = buf.readUInt16LE(i + 8);
    const size = buf.readUInt32LE(i + 18);
    const nameLen = buf.readUInt16LE(i + 26);
    const extra = buf.readUInt16LE(i + 28);
    const name = buf.subarray(i + 30, i + 30 + nameLen).toString('utf8');
    const body = buf.subarray(i + 30 + nameLen + extra, i + 30 + nameLen + extra + size);
    out.set(name, method === 8 ? inflateRawSync(body) : Buffer.from(body));
    i += 30 + nameLen + extra + size;
  }
  return out;
}

describe('reproducible store zip', () => {
  it('produces identical bytes for identical files regardless of mtimes and creation order', async () => {
    const a = await mkdtemp(path.join(tmpdir(), 'at-zip-a-'));
    const b = await mkdtemp(path.join(tmpdir(), 'at-zip-b-'));
    try {
      await mkdir(path.join(a, 'chunks'));
      await mkdir(path.join(b, 'chunks'));
      await writeFile(path.join(a, 'manifest.json'), '{"a":1}');
      await writeFile(path.join(a, 'chunks/x.js'), 'console.log(1);'.repeat(50));
      await writeFile(path.join(b, 'chunks/x.js'), 'console.log(1);'.repeat(50));
      await writeFile(path.join(b, 'manifest.json'), '{"a":1}');
      await utimes(path.join(b, 'manifest.json'), new Date(2001, 1, 1), new Date(2001, 1, 1));
      const za = await zipDirectory(a);
      const zb = await zipDirectory(b);
      expect(za.equals(zb)).toBe(true);
      const files = unzip(za);
      expect([...files.keys()]).toEqual(['chunks/x.js', 'manifest.json']);
      expect(files.get('manifest.json')?.toString()).toBe('{"a":1}');
    } finally {
      await rm(a, { recursive: true, force: true });
      await rm(b, { recursive: true, force: true });
    }
  });

  it('builds the extension twice from the same sources and gets the same zip hash', async () => {
    const result = await checkReproducible();
    expect(result.first).toBe(result.second);
    expect(result.same).toBe(true);
    expect(result.bytes).toBeGreaterThan(10_000);
  }, 180_000);
});
