// pnpm kv:reencrypt — see lib/cli.ts for usage and docs/14-devops.md §10 for the rotation runbook.
import { runReencrypt } from './lib/cli.ts';
import { nodeDeps } from './lib/node-deps.ts';

process.exitCode = await runReencrypt(process.argv.slice(2), nodeDeps());
