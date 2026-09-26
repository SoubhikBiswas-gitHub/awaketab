import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'wxt';
import { polarDefines } from '../web/scripts/polar-server.mjs';
import { awaketabExtension, localeMessages } from './scripts/i18n.mjs';

const TEST_BUILD = process.env.AT_EXT_TEST === '1';
const here = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

// FR-EXT-05 / docs/19 B7: the minimum version comes from the one support data file.
const matrix = JSON.parse(readFileSync(here('../web/src/data/support-matrix.json'), 'utf8')) as {
  extension: { minimumChromeVersion: string };
};

export default defineConfig({
  manifestVersion: 3,
  // Explicit imports only: every module says where `browser`/`defineBackground` come from.
  imports: false,
  // The Playwright suite builds into its own folder so it never overwrites the release build.
  outDir: process.env.AT_EXT_OUT ?? (TEST_BUILD ? '.output-test' : '.output'),
  manifest: {
    name: '__MSG_ext_name__',
    short_name: 'AwakeTab',
    description: '__MSG_ext_description__',
    default_locale: 'en',
    version: '1.0.0',
    minimum_chrome_version: matrix.extension.minimumChromeVersion,
    // docs/10 §2, FR-EXT-03: no host permissions by default; per-site access is requested only for Pro
    // auto-start rules, one site at a time.
    permissions: ['power', 'storage', 'alarms'],
    optional_permissions: ['notifications'],
    host_permissions: [],
    optional_host_permissions: ['https://*/*'],
    action: {
      default_popup: 'popup.html',
      default_title: 'AwakeTab',
      default_icon: { 16: 'icon-16.png', 32: 'icon-32.png' },
    },
    options_page: 'options.html',
    background: {
      service_worker: 'background.js',
      type: 'module',
    },
    commands: {
      toggle: {
        suggested_key: { default: 'Alt+Shift+A' },
        description: '__MSG_ext_command_toggle__',
      },
    },
    icons: {
      16: 'icon-16.png',
      32: 'icon-32.png',
      48: 'icon-48.png',
      128: 'icon-128.png',
    },
  },
  vite: () => ({
    plugins: [awaketabExtension()],
    // PUBLIC_POLAR_SERVER=production (set by `pnpm -F extension zip`) drops the dev licence key (LAUNCH-AUDIT N-03).
    define: { __AT_TEST__: JSON.stringify(TEST_BUILD), ...polarDefines() },
    resolve: {
      // Build from source like the unit tests do: the extension never depends on a stale package dist.
      alias: {
        '@awaketab/core': here('../../packages/core/src/index.ts'),
        '@awaketab/wake': here('../../packages/wake/src/index.ts'),
      },
    },
    build: {
      // Extension pages load from disk; the modulepreload polyfill is dead weight there.
      modulePreload: { polyfill: false },
    },
  }),
  hooks: {
    'build:manifestGenerated': (_wxt, manifest) => {
      const background = manifest.background as { type?: string } | undefined;
      if (background) background.type = 'module';
      delete manifest.options_ui;
    },
    'build:publicAssets': (_wxt, files) => {
      for (const file of localeMessages()) files.push(file);
    },
  },
});
