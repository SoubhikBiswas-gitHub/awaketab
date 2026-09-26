// `pnpm kv:reencrypt` (apps/web/scripts/kv) re-implements the `keyEnc` format for Node. This keeps the two
// byte-compatible: whatever the functions write, the script opens, and whatever the script writes after a
// LICENSE_KEY_ENC_KEY rotation, /api/license/deactivate can decrypt.
import { describe, expect, it } from 'vitest';

import { encryptKeyEnc, tryDecryptKeyEnc } from '../../scripts/kv/lib/crypto';
import { decryptUtf8, encryptUtf8 } from './license';
import { devVars } from '../../test/functions/harness';

describe('keyEnc interop between the functions and the KV ops scripts', () => {
  const devKey = devVars().LICENSE_KEY_ENC_KEY ?? '';
  const rotated = btoa(String.fromCharCode(...new Uint8Array(32).fill(42)));
  const raw = 'AWAKE-TEST-KEY-0001';

  it('the script opens what the functions wrote', async () => {
    expect(await tryDecryptKeyEnc(await encryptUtf8(raw, devKey), devKey)).toBe(raw);
  });

  it('the functions open what the script re-encrypted with the new key', async () => {
    const reencrypted = await encryptKeyEnc(raw, rotated);
    expect(await decryptUtf8(reencrypted, rotated)).toBe(raw);
    await expect(decryptUtf8(reencrypted, devKey)).rejects.toThrow();
  });
});
