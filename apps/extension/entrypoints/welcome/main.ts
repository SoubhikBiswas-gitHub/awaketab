import 'virtual:at-tokens.css';
import '../../src/styles/base.css';
import './welcome.css';
import { STORAGE_KEYS } from '@awaketab/core';
import { browser } from 'wxt/browser';
import type { IExtApi } from '../../src/api';
import { keyCaps } from '../../src/format';
import { applyTheme, loadPage, q, translateTree } from '../../src/page';
import { readSettings } from '../../src/settings';

async function boot(): Promise<void> {
  const api = browser as unknown as IExtApi;
  const root = q(document, '[data-root]');
  const ctx = await loadPage(api);
  const { t, time } = ctx;
  const version = api.runtime.getManifest().version;
  translateTree(root, t);
  document.title = t('ext.welcome.title');

  q(root, '[data-installed]').textContent = t('ext.welcome.kicker', { version });
  const steps = [...root.querySelectorAll<HTMLElement>('[data-pin-steps] li')];
  const storeName = t('ext.name');
  q(root, '[data-step2]').textContent = t('ext.welcome.step2', { name: storeName });
  q(root, '[data-store-name]').textContent = storeName;
  const sixPm = 18 * 60;
  q(root, '[data-art-until]').textContent = t('tool.timer.until', { wall: time.wall(sixPm) });
  q(root, '[data-art-how1]').textContent = t('ext.welcome.how1.body', { time: time.wall(sixPm) });
  q(root, '[data-notify-body]').textContent = t('end.notify.body', { label: t('tool.preset.p60') });

  // Pin demo: a pressed state that says what pinning does, and can be shown again.
  const pin = q(root, '[data-pin]', HTMLButtonElement);
  const pinButton = q(root, '[data-pin-button]', HTMLButtonElement);
  const figure = q(root, '[data-pin-figure]');
  let pinned = false;
  const renderPin = () => {
    if (pinned) figure.dataset.pinnedState = '';
    else delete figure.dataset.pinnedState;
    q(root, '[data-pin-steps]').toggleAttribute('data-pinned-state', pinned);
    for (const [i, step] of steps.entries()) q(step, '.wl-step').textContent = pinned ? '✓' : String(i + 1);
    pin.setAttribute('aria-pressed', String(pinned));
    pin.setAttribute('aria-label', t(pinned ? 'ext.welcome.unpinAria' : 'ext.welcome.pinAria', { name: storeName }));
    q(root, '[data-pinned]').hidden = !pinned;
    q(root, '[data-slot]').hidden = pinned;
    q(root, '[data-pin-caption]').textContent = t(pinned ? 'ext.welcome.pinnedCaption' : 'ext.welcome.pinCaption');
    pinButton.textContent = t(pinned ? 'ext.welcome.showAgain' : 'ext.welcome.pinIt');
    q(root, '[data-puzzle]').toggleAttribute('data-ping', !pinned);
  };
  const flip = () => {
    pinned = !pinned;
    renderPin();
  };
  pin.addEventListener('click', flip);
  pinButton.addEventListener('click', flip);
  renderPin();

  // Theme switch: the same setting as Options → Theme (auto follows the system live).
  for (const radio of root.querySelectorAll<HTMLInputElement>('input[name="theme"]')) {
    radio.checked = radio.value === (ctx.settings.theme === 'oled' ? 'dark' : ctx.settings.theme);
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      const theme = radio.value === 'light' || radio.value === 'dark' ? radio.value : 'auto';
      void (async () => {
        const current = readSettings((await api.storage.local.get(STORAGE_KEYS.settings))[STORAGE_KEYS.settings]);
        const settings = { ...current, theme } as typeof current;
        await api.storage.local.set({ [STORAGE_KEYS.settings]: settings });
        applyTheme(settings);
      })();
    });
  }

  // Shortcut: whatever Chrome has bound (Alt+Shift+A by default; the user may have changed it).
  const commands = await api.commands.getAll().catch(() => []);
  const shortcut = commands.find((command) => command.name === 'toggle')?.shortcut || 'Alt+Shift+A';
  const caps = q(root, '[data-keycaps]');
  keyCaps(shortcut).forEach((cap, i, all) => {
    const kbd = document.createElement('kbd');
    kbd.className = 'at-kbd';
    kbd.textContent = cap;
    caps.append(kbd);
    // The board spells the chord with "+" between caps, macOS glyph shortcuts (⌥⇧A) included.
    if (i < all.length - 1) caps.append('+');
  });
  q(root, '[data-key-title]').textContent = t('ext.welcome.key.title', { shortcut });
  q(root, '[data-shortcut-change]', HTMLButtonElement).addEventListener('click', () => {
    void api.tabs.create({ url: 'chrome://extensions/shortcuts' });
  });

  root.hidden = false;
  document.documentElement.dataset.ready = String(Math.round(performance.now()));
}

void boot();
