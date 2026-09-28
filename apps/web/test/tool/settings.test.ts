import { DEFAULT_SETTINGS, type ISettings } from '@awaketab/core';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { fillSettings, openSettings, readSettings } from '../../src/tool/ui/settings.js';
import en from '../../src/i18n/en.json';
import { dialogSettled, makeCtx } from './ctx-helper.js';

// Sheets wait for tool-more.css (ui/dialog.ts); happy-dom never loads it.
vi.mock('../../src/tool/ui/more-css.js', () => ({ moreCss: async () => undefined }));

// happy-dom's RadioNodeList has a `value` getter only; browsers also have the setter fillSettings relies on
// (check the first radio whose value matches, else change nothing — HTML §4.10.21.3).
const radioValue = Object.getOwnPropertyDescriptor(RadioNodeList.prototype, 'value');
beforeAll(() => {
  Object.defineProperty(RadioNodeList.prototype, 'value', {
    configurable: true,
    get: radioValue?.get,
    set(this: RadioNodeList, v: string) {
      for (let i = 0; i < this.length; i += 1) {
        const node = this.item(i);
        if (node instanceof HTMLInputElement && node.value === v) {
          node.checked = true;
          return;
        }
      }
    },
  });
});
afterAll(() => {
  if (radioValue) Object.defineProperty(RadioNodeList.prototype, 'value', radioValue);
});

// Mirrors the settings form in src/components/ToolPanel.astro (names, types, defaults and checked states).
const SETTINGS_HTML = `
  <dialog data-dialog="settings">
    <form class="at-fields">
      <button type="button" data-act="customize" data-tab="look">Looks and sounds</button>
      <span data-sg-snd></span><span data-sg-snd-now></span>
      <button type="button" data-act="customize" data-tab="sound">Change in Customize</button>
      <label><input type="checkbox" name="notifications" /> Notify</label>
      <p data-notifications-note hidden></p>
      <fieldset>
        <label><input type="radio" name="endBehaviour" value="prompt_extend" checked /> Ask</label>
        <label><input type="radio" name="endBehaviour" value="stop" /> Stop</label>
      </fieldset>
      <div data-battery-fields>
        <label><input type="checkbox" name="batteryAuto" /> Auto stop</label>
        <label><span data-battery-label></span><input type="range" name="batteryThreshold" min="5" max="30" value="15" /></label>
      </div>
      <p data-battery-unavailable hidden></p>
      <fieldset>
        <label><input type="checkbox" name="showSeconds" /> Seconds</label>
        <select name="clock24h"><option value="auto">Auto</option><option value="24">24 h</option><option value="12">12 h</option></select>
      </fieldset>
      <label><input type="checkbox" name="telemetry" checked /> Telemetry</label>
      <label><input type="checkbox" name="keyboardShortcuts" checked /> Shortcuts</label>
      <label><input type="checkbox" name="keyboardHints" checked /> Hints</label>
      <label><input type="checkbox" name="reduceMotion" /> Reduce motion</label>
      <details data-sg="timer"><summary>Timer <span data-sg-end></span></summary></details>
      <span data-t="nowShows"></span>
      <details data-sg="device"><summary>Device</summary></details>
      <button type="button" data-dialog-close>Close</button>
      <details class="at-sg-reset">
        <summary data-settings-reset>Reset</summary>
        <button type="button" data-reset="yes">Reset settings</button>
        <button type="button" data-reset="no">Keep them</button>
      </details>
      <p data-reset-done></p>
    </form>
  </dialog>`;

function form(): HTMLFormElement {
  document.body.innerHTML = SETTINGS_HTML;
  return document.querySelector('form') as HTMLFormElement;
}

const input = (f: HTMLFormElement, name: string) => f.elements.namedItem(name) as HTMLInputElement;

const STORED: ISettings = {
  ...DEFAULT_SETTINGS,
  theme: 'oled',
  accent: '#5A47CF',
  face: 'horizon',
  defaultPreset: 'p60',
  sound: { id: 'none', volume: 0.3 },
  notifications: true,
  endBehaviour: 'stop',
  battery: { autoStop: true, threshold: 22, chargingReminder: false },
  ambient: {
    ...DEFAULT_SETTINGS.ambient,
    mode: 'clock',
    message: 'Back at 3',
    showSeconds: true,
    clock24h: false,
  },
  telemetry: false,
  keyboardShortcuts: false,
  keyboardHints: false,
  reduceMotion: 'on',
};

describe('fillSettings → readSettings', () => {
  it('round-trips every stored value (regression: opening Settings reset theme to the form default)', () => {
    const f = form();
    fillSettings(f, STORED);
    expect(readSettings(f, STORED)).toEqual(STORED);
  });

  it('round-trips the defaults', () => {
    const f = form();
    fillSettings(f, STORED);
    fillSettings(f, DEFAULT_SETTINGS);
    expect(readSettings(f, DEFAULT_SETTINGS)).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps the other stored values when a single field changes', () => {
    const f = form();
    fillSettings(f, STORED);
    input(f, 'keyboardHints').checked = true;
    expect(readSettings(f, STORED)).toEqual({
      ...STORED,
      keyboardHints: true,
    });
  });

  it('maps clock24h auto/24/12 to null/true/false', () => {
    const f = form();
    for (const clock24h of [null, true, false]) {
      const s = { ...STORED, ambient: { ...STORED.ambient, clock24h } };
      fillSettings(f, s);
      expect(readSettings(f, s).ambient.clock24h).toBe(clock24h);
    }
  });
});

describe('taste lives in Customize', () => {
  it('never touches the theme, face, lamp, sounds, vibration or tick-tock', () => {
    const f = form();
    const cur: ISettings = { ...STORED, sound: { id: 'bell', volume: 0.45 }, vibrate: false, tick: true };
    fillSettings(f, cur);
    const next = readSettings(f, cur);
    for (const k of ['theme', 'face', 'accent', 'palette', 'pattern', 'sound', 'vibrate', 'tick'] as const)
      expect(next[k], k).toEqual(cur[k]);
  });
});

describe('readSettings guards', () => {
  it('clamps the battery threshold to 5–30 %', () => {
    const f = form();
    const field = input(f, 'batteryThreshold');
    // Exercise readSettings' own clamp, not the range input's sanitising.
    field.type = 'number';
    field.removeAttribute('min');
    field.removeAttribute('max');
    for (const [raw, expected] of [
      ['2', 5],
      ['99', 30],
      ['17.4', 17],
      ['', STORED.battery.threshold],
      ['abc', STORED.battery.threshold],
    ] as const) {
      field.value = raw;
      expect(readSettings(f, STORED).battery.threshold, raw).toBe(expected);
    }
  });

  it('a disabled notifications switch (API unavailable) keeps the stored value', () => {
    const f = form();
    fillSettings(f, STORED);
    input(f, 'notifications').disabled = true;
    expect(readSettings(f, STORED).notifications).toBe(true);
    expect(readSettings(f, { ...STORED, notifications: false }).notifications).toBe(false);
    input(f, 'notifications').disabled = false;
    input(f, 'notifications').checked = false;
    expect(readSettings(f, STORED).notifications).toBe(false);
  });

  it('never touches the ambient mode or message', () => {
    const f = form();
    fillSettings(f, STORED);
    const next = readSettings(f, STORED);
    expect(next.ambient.mode).toBe('clock');
    expect(next.ambient.message).toBe('Back at 3');
  });
});

describe('openSettings', () => {
  afterEach(() => {
    for (const k of ['theme', 'motion']) document.documentElement.removeAttribute(`data-${k}`);
  });

  it('opens on the stored values and a change keeps them (no default overwrite)', async () => {
    const { ctx, root, store, storage } = makeCtx({
      html: SETTINGS_HTML,
      settings: STORED,
    });
    openSettings(ctx);
    await dialogSettled();
    const dialog = root.querySelector<HTMLDialogElement>('[data-dialog="settings"]') as HTMLDialogElement;
    await vi.waitFor(() => {
      expect(dialog.open).toBe(true);
    });
    const f = dialog.querySelector('form') as HTMLFormElement;

    // happy-dom has no Notification API: the switch is disabled and its help line says why.
    expect(input(f, 'notifications').disabled).toBe(true);
    expect(root.querySelector<HTMLElement>('[data-notifications-note]')?.textContent).toBe(
      en['settings.notifications.unavailable'],
    );

    const hints = input(f, 'keyboardHints');
    hints.checked = true;
    hints.dispatchEvent(new Event('change', { bubbles: true }));
    expect(storage.settings()).toEqual({ ...STORED, keyboardHints: true });
    expect(document.documentElement.dataset.motion).toBe('reduce');
    expect(store.get().settings.theme).toBe('oled');
    expect(document.documentElement.dataset.theme).toBe('oled');

    // Timer names the end sound it plays and sends its picking to Customize → Sound.
    await vi.waitFor(() => {
      expect(root.querySelector('[data-sg-snd]')?.textContent).toBe(en['settings.sum.silent']);
    });
    const bell = { ...STORED, sound: { id: 'bell' as const, volume: 0.45 } };
    store.set({ settings: bell });
    expect(root.querySelector('[data-sg-snd-now]')?.textContent).toBe('Bell at 45%');

    dialog.querySelector<HTMLButtonElement>('[data-dialog-close]')?.click();
    expect(dialog.open).toBe(false);
  });

  it('opens the group it is asked for, and Reset asks inline before it resets', async () => {
    const { ctx, root, store, storage } = makeCtx({ html: SETTINGS_HTML, settings: STORED });
    openSettings(ctx, undefined, 'device');
    const dialog = root.querySelector<HTMLDialogElement>('[data-dialog="settings"]') as HTMLDialogElement;
    await vi.waitFor(() => {
      expect(dialog.open).toBe(true);
    });
    const open = (g: string) => root.querySelector<HTMLDetailsElement>(`[data-sg="${g}"]`)?.open;
    expect(open('device')).toBe(true);
    expect(open('timer')).toBe(false);

    // Timer leads with the consequence of the chosen length (1 h here); Clock's "Now shows" has the full date.
    const end = () => root.querySelector('[data-sg-end]')?.textContent ?? '';
    await vi.waitFor(() => {
      expect(end()).toMatch(/^Ends (tomorrow )?at \d{1,2}:\d{2}\s[AP]M · $/u);
    });
    expect(root.querySelector('[data-t="nowShows"]')?.textContent).toMatch(
      /^Now shows [A-Z][a-z]+day, \d{1,2} [A-Z][a-z]+ \d{4} · \d{1,2}:\d{2}:\d{2}\s[AP]M$/u,
    );
    store.set({ selectedPreset: 'pinf' });
    expect(end()).toBe('Until you stop · ');

    const box = root.querySelector<HTMLDetailsElement>('.at-sg-reset') as HTMLDetailsElement;
    box.open = true;
    root.querySelector<HTMLButtonElement>('[data-reset="no"]')?.click();
    expect(box.open).toBe(false);
    expect(storage.settings()).toEqual(STORED);
    box.open = true;
    root.querySelector<HTMLButtonElement>('[data-reset="yes"]')?.click();
    expect(box.open).toBe(false);
    expect(storage.settings()).toEqual(DEFAULT_SETTINGS);
    expect(root.querySelector('[data-reset-done]')?.textContent).toBe(en['settings.reset.done']);
    expect(document.documentElement.hasAttribute('data-motion')).toBe(false);
  });
});
