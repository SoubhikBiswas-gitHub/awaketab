import { DEFAULT_SETTINGS, type ISettings } from '@awaketab/core';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { fillSettings, openSettings, readSettings } from '../../src/tool/ui/settings.js';
import en from '../../src/i18n/en.json';
import { dialogSettled, makeCtx } from './ctx-helper.js';
import type * as TLooks from '../../src/tool/packs/themes/looks.js';

// Sheets wait for tool-more.css (ui/dialog.ts) and the themes pack for its sheets; happy-dom never loads them.
vi.mock('../../src/tool/ui/more-css.js', () => ({ moreCss: async () => undefined }));
vi.mock('../../src/tool/packs/themes/looks.js', async (load) => ({
  ...(await load<typeof TLooks>()),
  themesCss: async () => undefined,
  uiCss: async () => undefined,
}));

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
      <fieldset>
        <label><input type="radio" name="theme" value="auto" checked /> Auto</label>
        <label><input type="radio" name="theme" value="light" /> Light</label>
        <label><input type="radio" name="theme" value="dark" /> Dark</label>
        <label><input type="radio" name="theme" value="oled" /> OLED</label>
      </fieldset>
      <div data-looks hidden><div data-appearance></div></div>
      <fieldset>${['ring', 'bold', 'horizon', 'tide'].map((v) => `<label><input type="radio" name="face" value="${v}" ${v === 'ring' ? 'checked' : ''} /></label>`).join('')}</fieldset>
      <select name="sound">${['chime', 'bell', 'soft', 'digital', 'birds', 'none'].map((v) => `<option value="${v}" ${v === 'chime' ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <input type="range" name="soundVolume" min="0" max="100" step="5" value="60" />
      <label data-vibrate-row hidden><input type="checkbox" name="vibrate" checked /> Vibrate</label>
      <label><input type="checkbox" name="tick" /> Tick</label>
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

describe('end sound, vibrate and tick', () => {
  it('round-trips every end sound, its volume and both switches', () => {
    const f = form();
    for (const id of ['chime', 'bell', 'soft', 'digital', 'birds', 'none'] as const) {
      const s: ISettings = { ...STORED, sound: { id, volume: 0.45 }, vibrate: false, tick: true };
      fillSettings(f, s);
      expect(readSettings(f, s), id).toEqual(s);
    }
  });

  it('keeps a stored sound the list does not offer only while nothing is picked', () => {
    const f = form();
    (f.elements.namedItem('sound') as HTMLSelectElement).selectedIndex = -1;
    const cur: ISettings = { ...STORED, sound: { id: 'custom:x', volume: 0.5 } };
    expect(readSettings(f, cur).sound.id).toBe('custom:x');
  });
});

describe('readSettings guards', () => {
  it('leaves the lamp to the Appearance gallery (the stored hex is kept)', () => {
    const f = form();
    fillSettings(f, STORED);
    expect(readSettings(f, { ...STORED, accent: '#B1452F' }).accent).toBe('#B1452F');
  });

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

  it('falls back to the stored theme when none is picked, and never touches the ambient mode or message', () => {
    const f = form();
    fillSettings(f, STORED);
    const theme = [...f.querySelectorAll<HTMLInputElement>('input[name="theme"]')];
    for (const r of theme) r.checked = false;
    const next = readSettings(f, STORED);
    expect(next.theme).toBe('oled');
    expect(next.ambient.mode).toBe('clock');
    expect(next.ambient.message).toBe('Back at 3');
  });
});

describe('openSettings', () => {
  afterEach(() => {
    for (const k of ['theme', 'accent', 'palette', 'pattern', 'preview', 'motion'])
      document.documentElement.removeAttribute(`data-${k}`);
  });

  it('opens on the stored values and a change keeps them (no default overwrite)', async () => {
    const { ctx, root, store, storage } = makeCtx({
      html: SETTINGS_HTML,
      settings: STORED,
    });
    openSettings(ctx, undefined, 'look');
    await dialogSettled();
    const dialog = root.querySelector<HTMLDialogElement>('[data-dialog="settings"]') as HTMLDialogElement;
    // The sheet waits (briefly) for the themes pack's Appearance gallery.
    await vi.waitFor(() => {
      expect(dialog.open).toBe(true);
    });
    const f = dialog.querySelector('form') as HTMLFormElement;
    expect(dialog.open).toBe(true);
    expect((f.elements.namedItem('theme') as RadioNodeList).value).toBe('oled');

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
    expect(document.documentElement.dataset.accent).toBe('violet');

    // The Appearance gallery (themes pack): without a licence a Pro lamp previews for five minutes, is never stored,
    // and keeps running when the sheet closes; a free lamp is stored at once.
    await vi.waitFor(() => {
      expect(root.querySelector('[data-appearance] input[name="lk-accent"][value="mint"]')).not.toBeNull();
    });
    const pick = (kind: string, id: string) => {
      const r = root.querySelector<HTMLInputElement>(`[data-appearance] input[name="lk-${kind}"][value="${id}"]`);
      if (!r) throw new Error(`${kind} ${id}`);
      r.checked = true;
      r.dispatchEvent(new Event('change', { bubbles: true }));
    };
    expect(root.querySelector<HTMLInputElement>('input[name="lk-accent"][value="violet"]')?.checked).toBe(true);
    pick('accent', 'mint');
    await vi.waitFor(() => {
      expect(document.documentElement.dataset.accent).toBe('mint');
    });
    expect(document.documentElement.dataset.preview).toBe('accent');
    expect(storage.settings().accent).toBe('#5A47CF');
    pick('palette', 'midnight');
    await vi.waitFor(() => {
      expect(document.documentElement.dataset.palette).toBe('midnight');
    });
    // One preview at a time: the Pro lamp went back when the colour theme started its own.
    expect(document.documentElement.dataset.accent).toBe('violet');
    expect(storage.settings().palette).toBe('clear-night');
    pick('accent', 'amber');
    await vi.waitFor(() => {
      expect(storage.settings().accent).toBe('#A34F00');
    });
    expect(document.documentElement.dataset.palette).toBe('midnight');
    pick('palette', 'paper');
    await vi.waitFor(() => {
      expect(storage.settings().palette).toBe('paper');
    });
    expect(document.documentElement.hasAttribute('data-preview')).toBe(false);

    // The clock face is a setting too (docs/08 §2.1).
    const bold = f.querySelector<HTMLInputElement>('input[name="face"][value="bold"]') as HTMLInputElement;
    bold.checked = true;
    bold.dispatchEvent(new Event('change', { bubbles: true }));
    expect(storage.settings().face).toBe('bold');

    dialog.querySelector<HTMLButtonElement>('[data-dialog-close]')?.click();
    expect(dialog.open).toBe(false);
    expect(document.documentElement.dataset.accent).toBe('amber');
    expect(document.documentElement.dataset.palette).toBe('paper');
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
    expect(root.querySelector<HTMLElement>('[data-looks]')?.hidden).toBe(true);

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
