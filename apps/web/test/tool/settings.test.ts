import { DEFAULT_SETTINGS, type ISettings } from '@awaketab/core';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fillSettings, openSettings, readSettings } from '../../src/tool/ui/settings.js';
import { makeCtx } from './ctx-helper.js';

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

const ACCENTS = ['#087B87', '#5A47CF', '#167A50', '#255FBD'];
const MODES = ['standard', 'clock', 'focus', 'minimal', 'night', 'message', 'cook'];

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
      <fieldset class="at-accents">
        ${ACCENTS.map((hex) => `<label><input type="radio" name="accent" value="${hex}" ${hex === '#087B87' ? 'checked' : ''} /></label>`).join('')}
        <p data-pack-gate></p>
      </fieldset>
      <select name="defaultPreset">
        ${['p15', 'p30', 'p45', 'p60', 'p120', 'p240', 'pinf'].map((p) => `<option value="${p}">${p}</option>`).join('')}
      </select>
      <select name="sound"><option value="chime">Chime</option><option value="none">None</option></select>
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
        <select name="ambientMode">${MODES.map((m) => `<option value="${m}">${m}</option>`).join('')}</select>
        <input name="ambientMessage" maxlength="80" autocomplete="off" />
        <p data-message-gate></p>
        <label><input type="checkbox" name="showSeconds" /> Seconds</label>
        <select name="clock24h"><option value="auto">Auto</option><option value="24">24 h</option><option value="12">12 h</option></select>
      </fieldset>
      <label><input type="checkbox" name="telemetry" checked /> Telemetry</label>
      <label><input type="checkbox" name="keyboardShortcuts" checked /> Shortcuts</label>
      <label><input type="checkbox" name="keyboardHints" checked /> Hints</label>
      <button type="button" data-settings-close>Close</button>
      <button type="button" data-settings-reset>Reset</button>
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
  defaultPreset: 'p60',
  sound: { id: 'none', volume: 0.3 },
  notifications: true,
  endBehaviour: 'stop',
  battery: { autoStop: true, threshold: 22, chargingReminder: false },
  ambient: { ...DEFAULT_SETTINGS.ambient, mode: 'clock', message: 'Back at 3', showSeconds: true, clock24h: false },
  telemetry: false,
  keyboardShortcuts: false,
  keyboardHints: false,
};

const ALL = { packs: true, message: true };
const NONE = { packs: false, message: false };

describe('fillSettings → readSettings', () => {
  it('round-trips every stored value (regression: opening Settings reset theme to the form default)', () => {
    const f = form();
    fillSettings(f, STORED);
    expect(readSettings(f, STORED, ALL)).toEqual(STORED);
  });

  it('round-trips the defaults', () => {
    const f = form();
    fillSettings(f, STORED);
    fillSettings(f, DEFAULT_SETTINGS);
    expect(readSettings(f, DEFAULT_SETTINGS, ALL)).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps the other stored values when a single field changes', () => {
    const f = form();
    fillSettings(f, STORED);
    input(f, 'keyboardHints').checked = true;
    expect(readSettings(f, STORED, NONE)).toEqual({ ...STORED, keyboardHints: true });
  });

  it('maps clock24h auto/24/12 to null/true/false', () => {
    const f = form();
    for (const clock24h of [null, true, false]) {
      const s = { ...STORED, ambient: { ...STORED.ambient, clock24h } };
      fillSettings(f, s);
      expect(readSettings(f, s, ALL).ambient.clock24h).toBe(clock24h);
    }
  });
});

describe('readSettings gates', () => {
  it('refuses a pack accent without ambient.packs', () => {
    const f = form();
    const cur = { ...STORED, accent: '#087B87' };
    fillSettings(f, { ...cur, accent: '#167A50' });
    expect(readSettings(f, cur, NONE).accent).toBe('#087B87');
    expect(readSettings(f, cur, { packs: true, message: false }).accent).toBe('#167A50');
    // A free lamp is always accepted.
    fillSettings(f, { ...cur, accent: '#5A47CF' });
    expect(readSettings(f, cur, NONE).accent).toBe('#5A47CF');
  });

  it('migrates a legacy palette hex to its lamp when the form is filled (docs/08 §2.1)', () => {
    const f = form();
    for (const [legacy, lamp] of [
      ['#B86E00', '#087B87'],
      ['#4f46e5', '#5A47CF'],
      ['#0F766E', '#167A50'],
      ['#BE123C', '#255FBD'],
      ['#123456', '#087B87'],
    ] as const) {
      const cur = { ...STORED, accent: legacy };
      fillSettings(f, cur);
      expect(readSettings(f, cur, ALL).accent, legacy).toBe(lamp);
    }
  });

  it('ignores the ambient message without ambient.message and sanitises it with it', () => {
    const f = form();
    const cur = { ...STORED, ambient: { ...STORED.ambient, message: 'Saved' } };
    fillSettings(f, cur);
    input(f, 'ambientMessage').value = '  Back‮   soon\u0007  ';
    expect(readSettings(f, cur, NONE).ambient.message).toBe('Saved');
    expect(readSettings(f, cur, { packs: false, message: true }).ambient.message).toBe('Back soon');
    input(f, 'ambientMessage').value = 'x'.repeat(200);
    expect(readSettings(f, cur, ALL).ambient.message).toHaveLength(80);
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
      expect(readSettings(f, STORED, ALL).battery.threshold, raw).toBe(expected);
    }
  });

  it('a disabled notifications switch (API unavailable) keeps the stored value', () => {
    const f = form();
    fillSettings(f, STORED);
    input(f, 'notifications').disabled = true;
    expect(readSettings(f, STORED, ALL).notifications).toBe(true);
    expect(readSettings(f, { ...STORED, notifications: false }, ALL).notifications).toBe(false);
    input(f, 'notifications').disabled = false;
    input(f, 'notifications').checked = false;
    expect(readSettings(f, STORED, ALL).notifications).toBe(false);
  });

  it('falls back to the stored value for an unknown theme or mode', () => {
    const f = form();
    fillSettings(f, STORED);
    const theme = [...f.querySelectorAll<HTMLInputElement>('input[name="theme"]')];
    for (const r of theme) r.checked = false;
    const mode = f.elements.namedItem('ambientMode') as HTMLSelectElement;
    mode.innerHTML += '<option value="disco">disco</option>';
    mode.value = 'disco';
    const next = readSettings(f, STORED, ALL);
    expect(next.theme).toBe('oled');
    expect(next.ambient.mode).toBe('clock');
  });
});

describe('openSettings', () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.accent;
  });

  it('opens on the stored values and a change keeps them (no default overwrite)', () => {
    const { ctx, root, store, storage } = makeCtx({ html: SETTINGS_HTML, settings: STORED });
    openSettings(ctx);
    const dialog = root.querySelector<HTMLDialogElement>('[data-dialog="settings"]') as HTMLDialogElement;
    const f = dialog.querySelector('form') as HTMLFormElement;
    expect(dialog.open).toBe(true);
    expect(store.get().ui.dialog).toBe('settings');
    expect((f.elements.namedItem('theme') as RadioNodeList).value).toBe('oled');

    // happy-dom has no Notification API: the switch is disabled with the "unavailable" note.
    expect(input(f, 'notifications').disabled).toBe(true);
    expect(root.querySelector<HTMLElement>('[data-notifications-note]')?.hidden).toBe(false);

    const hints = input(f, 'keyboardHints');
    hints.checked = true;
    hints.dispatchEvent(new Event('change', { bubbles: true }));
    expect(storage.settings()).toEqual({ ...STORED, keyboardHints: true });
    expect(store.get().settings.theme).toBe('oled');
    expect(document.documentElement.dataset.theme).toBe('oled');
    expect(document.documentElement.dataset.accent).toBe('violet');

    // Pack lamps are disabled and the gates are shown without a licence.
    const mint = f.querySelector<HTMLInputElement>('input[name="accent"][value="#167A50"]');
    expect(mint?.disabled).toBe(true);
    expect(root.querySelector<HTMLElement>('[data-pack-gate]')?.hidden).toBe(false);
    expect(input(f, 'ambientMessage').disabled).toBe(true);

    dialog.querySelector<HTMLButtonElement>('[data-settings-close]')?.click();
    expect(dialog.open).toBe(false);
    expect(store.get().ui.dialog).toBeNull();
  });
});
