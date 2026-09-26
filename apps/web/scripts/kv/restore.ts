// pnpm kv:restore — see lib/cli.ts for usage and docs/14-devops.md §11 for the runbook.
import { runRestore } from './lib/cli.ts';
import { nodeDeps } from './lib/node-deps.ts';

process.exitCode = await runRestore(process.argv.slice(2), nodeDeps());
