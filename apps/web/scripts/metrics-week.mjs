#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const stamp = process.env.METRICS_MONTH ?? new Date().toISOString().slice(0, 7);
const dest = path.join(ROOT, 'docs/metrics', `${stamp}.md`);
await mkdir(path.dirname(dest), { recursive: true });
const sql = await readFile(path.join(ROOT, 'docs/metrics/queries.sql'), 'utf8');
const token = process.env.CF_AE_TOKEN;
const account = process.env.CF_ACCOUNT_ID;
let live = 'Not queried (set CF_AE_TOKEN and CF_ACCOUNT_ID to run Analytics Engine SQL).';
if (token && account) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/analytics_engine/sql`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'text/plain' },
    body: sql.split(';')[0] ?? '',
  });
  live = res.ok ? await res.text() : `AE request failed: ${res.status}`;
}
await writeFile(
  dest,
  `# Metrics ${stamp}\n\n${live}\n\nQueries: \`docs/metrics/queries.sql\`.\n\n- Autostart success:\n- Awake-hours:\n- Pro funnel:\n- Content pageviews:\n`,
);
