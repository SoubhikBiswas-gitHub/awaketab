// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { buildVersion, versionDefines } from './build-version.mjs';

const DAY = new Date('2026-09-28T21:30:00Z');

describe('build version', () => {
  it('pairs the build date with the deployed commit', () => {
    expect(buildVersion({ CF_PAGES_COMMIT_SHA: '1234567890abcdef' }, DAY)).toEqual({
      date: '2026.09.28',
      commit: '1234567',
    });
  });

  it('hands the bundles one JSON define', () => {
    const { __AT_VERSION__ } = versionDefines({ CF_PAGES_COMMIT_SHA: 'abcdef1234' }, DAY);
    expect(JSON.parse(__AT_VERSION__)).toEqual({ date: '2026.09.28', commit: 'abcdef1' });
  });
});
