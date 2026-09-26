// pnpm kv:backup — see lib/cli.ts for usage and docs/14-devops.md §11 for the runbook.
import { runBackup } from './lib/cli.ts';
import { nodeDeps } from './lib/node-deps.ts';

process.exitCode = await runBackup(process.argv.slice(2), nodeDeps());
