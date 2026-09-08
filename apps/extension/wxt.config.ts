import { defineConfig } from 'wxt';

export default defineConfig({
  manifestVersion: 3,
  manifest: {
    name: 'AwakeTab for Chrome',
    short_name: 'AwakeTab',
    description:
      'Keep your screen (or your whole computer) awake from a click — with an honest status you can trust.',
    version: '1.0.0',
    minimum_chrome_version: '116',
    permissions: ['power', 'storage', 'alarms'],
    optional_permissions: ['notifications'],
    host_permissions: [],
    optional_host_permissions: ['https://*/*'],
    action: {
      default_popup: 'popup.html',
      default_title: 'AwakeTab',
    },
    options_page: 'options.html',
    background: {
      service_worker: 'background.js',
      type: 'module',
    },
    commands: {
      toggle: {
        suggested_key: { default: 'Alt+Shift+A' },
        description: 'Toggle keep-awake',
      },
    },
    icons: {
      16: 'icon-16.png',
      32: 'icon-32.png',
      48: 'icon-48.png',
      128: 'icon-128.png',
    },
  },
  hooks: {
    'build:manifestGenerated': (_wxt, manifest) => {
      if (manifest.background !== undefined) {
        manifest.background.type = 'module';
      }
      delete manifest.options_ui;
    },
  },
});
