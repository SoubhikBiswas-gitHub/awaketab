// Real-world wiring for the KV ops CLIs: process env, the file system and the Cloudflare REST client.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { ICliDeps } from './cli.ts';
import { CloudflareKv } from './cloudflare.ts';

export function nodeDeps(): ICliDeps {
  const env = process.env;
  return {
    env,
    openStore: (namespaceId) =>
      new CloudflareKv({
        accountId: env.CLOUDFLARE_ACCOUNT_ID?.trim() ?? '',
        apiToken: env.CLOUDFLARE_API_TOKEN?.trim() ?? '',
        namespaceId,
      }),
    readFile: async (file) => new Uint8Array(await readFile(file)),
    writeFile: async (file, bytes) => {
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, bytes, { mode: 0o600 });
    },
    out: (line) => {
      process.stdout.write(`${line}\n`);
    },
    err: (line) => {
      process.stderr.write(`${line}\n`);
    },
  };
}
