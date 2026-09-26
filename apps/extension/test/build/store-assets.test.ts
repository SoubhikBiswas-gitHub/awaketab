// @vitest-environment node
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderAll, SHOTS } from '../../scripts/store-assets.mts';

describe('store listing images (docs/10 §9)', () => {
  it('regenerates the committed screenshots and promo tile byte for byte', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'at-store-'));
    try {
      const files = await renderAll(dir);
      expect(Object.keys(files)).toHaveLength(SHOTS.length + 1);
      for (const [file, bytes] of Object.entries(files)) {
        const committed = await readFile(path.resolve('apps/extension/store/images', file));
        expect(Buffer.from(bytes).equals(committed), file).toBe(true);
        const width = Buffer.from(bytes).readUInt32BE(16);
        const height = Buffer.from(bytes).readUInt32BE(20);
        expect([width, height]).toEqual(file.startsWith('promo') ? [440, 280] : [1280, 800]);
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
