import { execFileSync } from 'node:child_process';

// The version people see (footer, Settings): the build date plus the commit /api/health reports at run time.
// Cloudflare Pages sets CF_PAGES_COMMIT_SHA for builds and Functions alike; local builds ask git.
export function buildVersion(env = process.env, now = new Date()) {
  let sha = env.CF_PAGES_COMMIT_SHA?.trim() ?? '';
  if (!sha) {
    try {
      sha = execFileSync('git', ['rev-parse', 'HEAD'], { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim();
    } catch {
      sha = '';
    }
  }
  return { date: now.toISOString().slice(0, 10).replaceAll('-', '.'), commit: sha.slice(0, 7) || 'dev' };
}

export function versionDefines(env = process.env, now = new Date()) {
  return { __AT_VERSION__: JSON.stringify(buildVersion(env, now)) };
}
