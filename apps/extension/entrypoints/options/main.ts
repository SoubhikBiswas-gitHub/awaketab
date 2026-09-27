import 'virtual:at-tokens.css';
import '../../src/styles/base.css';
import './options.css';
import {
  hasFeature,
  STORAGE_KEYS,
  type ILicenseRecord,
  type ILicenseState,
  type ISettings,
  type TFeatureGate,
} from '@awaketab/core';
import { browser } from 'wxt/browser';
import { LOCALE_META } from '../../../web/src/i18n/locales';
import type { IExtApi } from '../../src/api';
import { keyCaps } from '../../src/format';
import { LOCALES, resolveLocale } from '../../src/i18n';
import { activate, deactivate, deviceLabel, LICENSE_ERROR_KEYS, licenseState, NO_LICENSE } from '../../src/license';
import { applyTheme, loadPage, q, switchLocale, translateTree } from '../../src/page';
import { minutesOf } from '../../src/schedules';
import {
  AUTOSTART_SITES_MAX,
  EXT_KEYS,
  isExtPreset,
  isLevel,
  normalizeHost,
  originPattern,
  readExt,
  readSettings,
  SCHEDULES_MAX,
  type IExtSettings,
  type ISchedule,
} from '../../src/settings';
import { createTelemetry } from '../../src/telemetry';

const WEEK = [1, 2, 3, 4, 5, 6, 0] as const;
const HOURS = [0, 6, 12, 18, 24] as const;

function hhmm(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

async function boot(): Promise<void> {
  const api = browser as unknown as IExtApi;
  const root = q(document, '[data-root]');
  const ctx = await loadPage(api);
  const version = api.runtime.getManifest().version;

  let local = await api.storage.local.get(null);
  let settings: ISettings = readSettings(local[STORAGE_KEYS.settings]);
  let ext: IExtSettings = readExt(local[EXT_KEYS.ext]);
  let record = (local[STORAGE_KEYS.license] as ILicenseRecord | undefined) ?? null;
  let license: ILicenseState = await licenseState(record);
  const draft = { days: [1, 2, 3, 4, 5] as number[], start: 9 * 60, end: 18 * 60, error: '' };
  let shortcut = '';

  const telemetry = createTelemetry({
    enabled: () => settings.telemetry,
    locale: () => ctx.locale,
    version,
    path: '/ext/options',
  });

  async function deviceId(): Promise<string> {
    const stored = (await api.storage.local.get(EXT_KEYS.device))[EXT_KEYS.device] as { id?: string } | undefined;
    if (stored?.id) return stored.id;
    const id = crypto.randomUUID();
    await api.storage.local.set({ [EXT_KEYS.device]: { v: 1, id } });
    return id;
  }

  // ── Saved pill ────────────────────────────────────────────────────────────────────────────────
  const saved = q(root, '[data-saved]');
  let savedTimer: ReturnType<typeof setTimeout> | null = null;
  const flashSaved = () => {
    saved.textContent = ctx.t('ext.options.saved');
    saved.dataset.on = '';
    if (savedTimer) clearTimeout(savedTimer);
    savedTimer = setTimeout(() => {
      delete saved.dataset.on;
      savedTimer = setTimeout(() => {
        saved.textContent = '';
      }, 600);
    }, 2200);
  };

  async function patchSettings(patch: Partial<ISettings>): Promise<void> {
    const current = readSettings((await api.storage.local.get(STORAGE_KEYS.settings))[STORAGE_KEYS.settings]);
    settings = { ...current, ...patch };
    ctx.settings = settings;
    await api.storage.local.set({ [STORAGE_KEYS.settings]: settings });
    flashSaved();
  }

  async function patchExt(patch: Partial<IExtSettings>): Promise<void> {
    const current = readExt((await api.storage.local.get(EXT_KEYS.ext))[EXT_KEYS.ext]);
    ext = { ...current, ...patch };
    await api.storage.local.set({ [EXT_KEYS.ext]: ext });
    flashSaved();
  }

  const inputEl = (name: string) => q(root, `input[name="${name}"]`, HTMLInputElement);
  const radios = (name: string) => [...root.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${name}"]`)];
  const checkRadio = (name: string, value: string) => {
    for (const radio of radios(name)) radio.checked = radio.value === value;
  };
  const onRadio = (name: string, fn: (value: string) => void) => {
    for (const radio of radios(name)) {
      radio.addEventListener('change', () => {
        if (radio.checked) fn(radio.value);
      });
    }
  };

  // ── Language row: radio rows, stored in settings.locale; the page switches in place ─────────────
  const langList = q(root, '[data-lang-list]');
  const langToggle = q(root, '[data-lang-toggle]', HTMLButtonElement);
  const langRows = [
    { value: '', lang: '', name: '' },
    ...LOCALES.map((locale) => ({
      value: locale,
      lang: LOCALE_META[locale].htmlLang,
      name: LOCALE_META[locale].label,
    })),
  ];
  for (const row of langRows) {
    const label = document.createElement('label');
    label.className = 'op-lang-row';
    if (row.lang) label.lang = row.lang;
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'locale';
    input.value = row.value;
    input.className = 'at-sr';
    const mark = document.createElement('span');
    mark.className = 'op-lang-mark';
    mark.setAttribute('aria-hidden', 'true');
    const name = document.createElement('span');
    name.className = 'op-lang-name';
    name.textContent = row.name;
    if (!row.value) name.dataset.langAuto = '';
    const note = document.createElement('span');
    note.className = 'op-lang-note';
    note.dataset.langNote = row.value;
    label.append(input, mark, name, note);
    langList.append(label);
  }
  const setLangOpen = (open: boolean) => {
    langToggle.setAttribute('aria-expanded', String(open));
    langList.hidden = !open;
  };
  langToggle.addEventListener('click', () => {
    const open = langList.hidden;
    setLangOpen(open);
    if (open) langList.querySelector<HTMLInputElement>('input:checked')?.focus();
  });
  q(root, '[data-lang]').addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !langList.hidden) {
      event.preventDefault();
      setLangOpen(false);
      langToggle.focus();
    }
  });
  onRadio('locale', (value) => {
    const locale = (LOCALES as readonly string[]).includes(value) ? value : null;
    void patchSettings({ locale }).then(async () => {
      await switchLocale(ctx, locale);
      translateTree(root, ctx.t);
      render();
    });
  });

  function renderLanguage(): void {
    const { t } = ctx;
    const current = settings.locale ?? '';
    const browserLocale = resolveLocale(null, api.i18n?.getUILanguage() ?? navigator.language);
    const browserName = LOCALE_META[browserLocale].label;
    checkRadio('locale', current);
    for (const label of langList.querySelectorAll<HTMLElement>('.op-lang-row')) {
      const value = label.querySelector('input')?.value ?? '';
      const on = value === current;
      const autoName = label.querySelector<HTMLElement>('[data-lang-auto]');
      if (autoName) {
        autoName.textContent = t('ext.options.locale.auto');
        autoName.lang = ctx.lang;
      }
      const note = q(label, '.op-lang-note');
      note.lang = ctx.lang;
      const reviewed = value === '' || LOCALE_META[value as keyof typeof LOCALE_META].reviewed;
      note.textContent = on
        ? value === ''
          ? t('ext.options.locale.currentAuto', { name: browserName })
          : t('ext.options.locale.current')
        : value === ''
          ? browserName
          : reviewed
            ? ''
            : t('ext.options.locale.review');
    }
    q(root, '[data-lang-now]').textContent =
      current === ''
        ? t('ext.options.locale.autoNow', { name: browserName })
        : LOCALE_META[current as keyof typeof LOCALE_META].label;
  }

  // ── Defaults, end behaviour, look, keyboard, privacy ──────────────────────────────────────────
  onRadio('level', (value) => {
    if (isLevel(value)) void patchExt({ level: value });
  });
  onRadio('defaultPreset', (value) => {
    if (isExtPreset(value)) void patchSettings({ defaultPreset: value });
  });
  onRadio('endBehaviour', (value) => {
    void patchSettings({ endBehaviour: value === 'stop' ? 'stop' : 'prompt_extend' }).then(render);
  });
  onRadio('theme', (value) => {
    const theme = value === 'light' || value === 'dark' || value === 'oled' ? value : 'auto';
    void patchSettings({ theme }).then(() => {
      applyTheme(settings);
      render();
    });
  });
  const notifyBlocked = q(root, '[data-notify-blocked]');
  inputEl('notifications').addEventListener('change', (event) => {
    const box = event.target as HTMLInputElement;
    if (!box.checked) {
      void patchSettings({ notifications: false }).then(render);
      return;
    }
    // Requested inside the click, as Chrome requires; the optional permission is never asked for elsewhere.
    void api.permissions.request({ permissions: ['notifications'] }).then(
      (granted) => {
        box.checked = granted;
        notifyBlocked.hidden = granted;
        void patchSettings({ notifications: granted }).then(render);
      },
      () => {
        box.checked = false;
        notifyBlocked.hidden = false;
      },
    );
  });
  q(root, 'select[name="sound"]', HTMLSelectElement).addEventListener('change', (event) => {
    const value = (event.target as HTMLSelectElement).value === 'none' ? 'none' : 'chime';
    void patchSettings({ sound: { ...settings.sound, id: value } });
  });
  inputEl('keyboardShortcuts').addEventListener('change', (event) => {
    void patchSettings({ keyboardShortcuts: (event.target as HTMLInputElement).checked });
  });
  inputEl('telemetry').addEventListener('change', (event) => {
    void patchSettings({ telemetry: (event.target as HTMLInputElement).checked });
  });

  const shortcutEl = q(root, '[data-shortcut]');
  function renderShortcut(): void {
    const { t } = ctx;
    if (!shortcut) {
      shortcutEl.textContent = t('ext.options.shortcut.none');
      return;
    }
    const label = document.createElement('strong');
    label.textContent = t('ext.options.shortcut.label');
    const caps = document.createElement('span');
    caps.className = 'at-kbds';
    caps.setAttribute('aria-hidden', 'true');
    for (const cap of keyCaps(shortcut)) {
      const kbd = document.createElement('kbd');
      kbd.className = 'at-kbd';
      kbd.textContent = cap;
      caps.append(kbd);
    }
    const sr = document.createElement('span');
    sr.className = 'at-sr';
    sr.textContent = shortcut;
    shortcutEl.replaceChildren(label, caps, sr);
  }
  void api.commands.getAll().then((commands) => {
    shortcut = commands.find((command) => command.name === 'toggle')?.shortcut ?? '';
    renderShortcut();
  });
  q(root, '[data-shortcut-change]', HTMLButtonElement).addEventListener('click', () => {
    void api.tabs.create({ url: 'chrome://extensions/shortcuts' });
  });

  // ── Pro gating ────────────────────────────────────────────────────────────────────────────────
  function renderGates(): void {
    for (const section of root.querySelectorAll<HTMLElement>('[data-gated]')) {
      const allowed = hasFeature(license, section.dataset.gated as TFeatureGate);
      const note = section.querySelector<HTMLElement>('[data-locked]');
      if (note) note.hidden = allowed;
      section.dataset.locked = allowed ? '0' : '1';
      for (const control of section.querySelectorAll<HTMLInputElement | HTMLButtonElement | HTMLSelectElement>(
        'input, button, select',
      )) {
        control.disabled = !allowed;
      }
    }
  }

  // ── Schedules ─────────────────────────────────────────────────────────────────────────────────
  const scheduleList = q(root, '[data-schedules]', HTMLUListElement);
  const scheduleForm = q(root, '[data-schedule-form]', HTMLFormElement);
  const scheduleError = q(root, '[data-schedule-error]');
  const scheduleNote = q(root, '[data-schedule-note]');
  const daysRow = q(root, '[data-days]');
  const weekDays = q(root, '[data-week-days]');
  const axis = q(root, '[data-axis]');

  const dayFmt = (style: 'short' | 'long' | 'narrow') => new Intl.DateTimeFormat(ctx.lang, { weekday: style });
  const dayName = (day: number, style: 'short' | 'long' | 'narrow' = 'short') =>
    dayFmt(style).format(new Date(2023, 0, 1 + day)); // 2023-01-01 was a Sunday

  for (const day of WEEK) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'op-day';
    button.dataset.day = String(day);
    button.addEventListener('click', () => {
      draft.days = draft.days.includes(day) ? draft.days.filter((d) => d !== day) : [...draft.days, day];
      draft.error = '';
      renderDraft();
    });
    daysRow.append(button);
  }
  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-step]')) {
    button.addEventListener('click', () => {
      const key = button.dataset.step === 'end' ? 'end' : 'start';
      draft[key] = (((draft[key] + Number(button.dataset.delta)) % 1440) + 1440) % 1440;
      draft.error = '';
      renderDraft();
    });
  }

  function dayList(days: number[]): string {
    const { t } = ctx;
    const order = WEEK.filter((d) => days.includes(d));
    if (order.length === 7) return t('ext.days.every');
    const idx = order.map((d) => WEEK.indexOf(d));
    const contiguous = idx.length > 2 && idx.every((v, i) => i === 0 || v === (idx[i - 1] ?? -2) + 1);
    if (contiguous) return t('ext.days.range', { from: dayName(order[0] ?? 1), to: dayName(order.at(-1) ?? 5) });
    return order.map((d) => dayName(d)).join(', ');
  }

  const rangeOf = (start: number, end: number): string => ctx.time.range(start, end);

  const levelName = (level: string) => ctx.t(level === 'system' ? 'ext.level.system' : 'ext.level.display');

  function removeButton(label: string, onRemove: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'at-btn op-remove';
    button.textContent = ctx.t('ext.remove');
    button.setAttribute('aria-label', ctx.t('ext.remove.label', { item: label }));
    button.addEventListener('click', onRemove);
    return button;
  }

  function span(className: string, text: string): HTMLSpanElement {
    const el = document.createElement('span');
    el.className = className;
    el.textContent = text;
    return el;
  }

  function renderSchedules(): void {
    scheduleList.replaceChildren(
      ...ext.schedules.map((schedule) => {
        const li = document.createElement('li');
        li.className = 'at-in';
        const days = dayList(schedule.days);
        const range = rangeOf(minutesOf(schedule.start), minutesOf(schedule.end));
        const tag = span('op-li-tag', '');
        const swatch = span(`op-sw ${schedule.level === 'system' ? 'op-sw-system' : 'op-sw-screen'}`, '');
        tag.append(swatch, levelName(schedule.level));
        li.append(
          span('op-li-main', days),
          span('op-li-sub', range),
          tag,
          removeButton(`${days} ${range}`, () => {
            void patchExt({ schedules: ext.schedules.filter((s) => s.id !== schedule.id) }).then(render);
          }),
        );
        return li;
      }),
    );
    q(root, '[data-schedules-empty]').hidden = ext.schedules.length > 0;
    renderWeek();
  }

  function blocksOf(
    start: number,
    end: number,
    days: number[],
  ): Array<{ day: number; a: number; b: number; first: boolean }> {
    const out: Array<{ day: number; a: number; b: number; first: boolean }> = [];
    for (const d of days) {
      if (end > start) out.push({ day: d, a: start, b: end, first: true });
      else {
        out.push({ day: d, a: start, b: 1440, first: true });
        if (end > 0) out.push({ day: (d + 1) % 7, a: 0, b: end, first: false });
      }
    }
    return out;
  }

  function renderWeek(): void {
    const { t, time } = ctx;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const pct = (m: number) => `${((m / 1440) * 100).toFixed(3)}%`;
    const locked = !hasFeature(license, 'ext.schedules');
    const all: Array<{
      day: number;
      a: number;
      b: number;
      first: boolean;
      level: string;
      kind: 'block' | 'draft';
      label: string;
    }> = [];
    for (const s of ext.schedules) {
      const label = rangeOf(minutesOf(s.start), minutesOf(s.end));
      for (const blk of blocksOf(minutesOf(s.start), minutesOf(s.end), s.days))
        all.push({ ...blk, level: s.level, kind: 'block', label });
    }
    if (!locked && draft.days.length && draft.start !== draft.end) {
      const level = radios('scheduleLevel').find((r) => r.checked)?.value ?? 'display';
      const label = rangeOf(draft.start, draft.end);
      for (const blk of blocksOf(draft.start, draft.end, draft.days)) all.push({ ...blk, level, kind: 'draft', label });
    }
    axis.replaceChildren(
      ...HOURS.map((h, i) => {
        const label = span('', time.hour(h));
        label.style.insetInlineStart = pct(h * 60);
        label.style.transform = i === 0 ? 'none' : i === HOURS.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)';
        return label;
      }),
    );
    weekDays.replaceChildren(
      ...WEEK.map((day) => {
        const row = document.createElement('div');
        row.className = 'op-week-row';
        const name = span('op-day-name', dayName(day));
        const today = day === now.getDay();
        if (today) name.dataset.today = '';
        const track = document.createElement('div');
        track.className = 'op-track';
        const ofDay = all.filter((b) => b.day === day);
        const saved = ofDay.filter((b) => b.kind === 'block');
        // The draft sits under saved windows and drops its label where it overlaps one, so a saved label stays readable.
        for (const blk of [...ofDay.filter((b) => b.kind === 'draft'), ...saved]) {
          const el = document.createElement('div');
          el.className = 'op-blk';
          el.dataset.kind = blk.kind;
          el.dataset.level = blk.level;
          el.style.insetInlineStart = pct(blk.a);
          el.style.inlineSize = pct(blk.b - blk.a);
          const covered = blk.kind === 'draft' && saved.some((s) => s.a < blk.b && blk.a < s.b);
          if (blk.first && blk.b - blk.a >= 300 && !covered) el.textContent = blk.label;
          track.append(el);
        }
        if (today) {
          const marker = document.createElement('div');
          marker.className = 'op-now';
          marker.style.insetInlineStart = pct(nowMin);
          track.append(marker);
        }
        row.append(name, track);
        return row;
      }),
    );
    q(root, '[data-legend-now]').textContent = t('ext.schedules.legend.now', { time: time.wall(nowMin) });
    q(root, '[data-week]').setAttribute(
      'aria-label',
      ext.schedules.length
        ? t('ext.schedules.preview', {
            list: ext.schedules
              .map((s) => `${dayList(s.days)}, ${rangeOf(minutesOf(s.start), minutesOf(s.end))}, ${levelName(s.level)}`)
              .join('; '),
          })
        : t('ext.schedules.previewEmpty'),
    );
  }

  function renderDraft(): void {
    const { t, time } = ctx;
    for (const button of daysRow.querySelectorAll<HTMLButtonElement>('[data-day]')) {
      const day = Number(button.dataset.day);
      button.textContent = dayName(day, 'narrow');
      button.setAttribute('aria-label', dayName(day, 'long'));
      button.setAttribute('aria-pressed', String(draft.days.includes(day)));
    }
    for (const key of ['start', 'end'] as const) {
      q(root, `[data-step-value="${key}"]`).textContent = time.wall(draft[key]);
    }
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-step]')) {
      const label = t(button.dataset.step === 'end' ? 'ext.schedules.to' : 'ext.schedules.from');
      button.setAttribute(
        'aria-label',
        t(Number(button.dataset.delta) < 0 ? 'ext.schedules.earlier' : 'ext.schedules.later', { label }),
      );
    }
    scheduleError.textContent = draft.error ? t(draft.error) : '';
    scheduleError.hidden = !draft.error;
    scheduleNote.textContent = t('ext.schedules.nextDay');
    scheduleNote.hidden = !(draft.end < draft.start) || Boolean(draft.error);
    renderWeek();
  }
  onRadio('scheduleLevel', () => {
    renderWeek();
  });

  scheduleForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!draft.days.length) draft.error = 'ext.schedules.error.days';
    else if (draft.start === draft.end) draft.error = 'ext.schedules.error.same';
    else draft.error = '';
    if (draft.error || ext.schedules.length >= SCHEDULES_MAX) {
      renderDraft();
      return;
    }
    const level = radios('scheduleLevel').find((r) => r.checked)?.value ?? 'display';
    const schedule: ISchedule = {
      id: crypto.randomUUID(),
      days: [...draft.days].sort(),
      start: hhmm(draft.start),
      end: hhmm(draft.end),
      level: isLevel(level) ? level : 'display',
    };
    // The draft's days clear so the same window is not added twice by accident; the times stay.
    draft.days = [];
    void patchExt({ schedules: [...ext.schedules, schedule] }).then(render);
  });

  // ── Auto-start ────────────────────────────────────────────────────────────────────────────────
  const siteList = q(root, '[data-sites]', HTMLUListElement);
  const siteForm = q(root, '[data-site-form]', HTMLFormElement);
  const siteError = q(root, '[data-site-error]');
  const hostInput = inputEl('host');

  inputEl('browserStart').addEventListener('change', (event) => {
    void patchExt({ autostart: { ...ext.autostart, browserStart: (event.target as HTMLInputElement).checked } });
  });

  function renderSites(): void {
    const { t } = ctx;
    siteList.replaceChildren(
      ...ext.autostart.sites.map((site) => {
        const li = document.createElement('li');
        li.className = 'at-in';
        const label = site.durationMin
          ? t(`tool.preset.p${String(site.durationMin)}`)
          : t('ext.autostart.duration.open');
        li.append(
          span('op-li-host', site.host),
          span('op-li-sub-small', label),
          removeButton(site.host, () => {
            const sites = ext.autostart.sites.filter((s) => s.host !== site.host);
            // Give the site permission back to Chrome: nothing is kept that no rule needs.
            void api.permissions.remove({ origins: [originPattern(site.host)] }).catch(() => false);
            void patchExt({ autostart: { ...ext.autostart, sites } }).then(render);
          }),
        );
        return li;
      }),
    );
    q(root, '[data-sites-empty]').hidden = ext.autostart.sites.length > 0;
  }

  const failSite = (key: string) => {
    siteError.textContent = ctx.t(key);
    siteError.hidden = false;
    hostInput.setAttribute('aria-invalid', 'true');
  };
  hostInput.addEventListener('input', () => {
    siteError.hidden = true;
    hostInput.removeAttribute('aria-invalid');
  });
  siteForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(siteForm);
    const host = normalizeHost(hostInput.value);
    const minutes = Number(data.get('duration'));
    if (!host) {
      failSite('ext.autostart.error.host');
      return;
    }
    if (ext.autostart.sites.length >= AUTOSTART_SITES_MAX) return;
    siteError.hidden = true;
    hostInput.removeAttribute('aria-invalid');
    // Must run inside the submit gesture: Chrome shows a prompt naming exactly this one site.
    void api.permissions.request({ origins: [originPattern(host)] }).then(
      (granted) => {
        if (!granted) {
          failSite('ext.autostart.error.denied');
          return;
        }
        const sites = [
          ...ext.autostart.sites.filter((s) => s.host !== host),
          { host, durationMin: minutes > 0 ? minutes : null },
        ];
        siteForm.reset();
        void patchExt({ autostart: { ...ext.autostart, sites } }).then(render);
      },
      () => {
        failSite('ext.autostart.error.denied');
      },
    );
  });

  // ── Licence ───────────────────────────────────────────────────────────────────────────────────
  const licenseForm = q(root, '[data-license-form]', HTMLFormElement);
  const licenseError = q(root, '[data-license-error]');
  const licenseStatus = q(root, '[data-license-status]');
  const licenseSubmit = q(root, '[data-license-submit]', HTMLButtonElement);

  function renderLicense(): void {
    const active = license.valid && record !== null;
    q(root, '[data-license-active]').hidden = !active;
    licenseForm.hidden = active;
    q(root, '[data-license-plan]').textContent = active ? `${ctx.t('pro.title')} · ${record?.deviceLabel ?? ''}` : '';
  }

  licenseForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const { t } = ctx;
    const key = inputEl('key').value.trim();
    const keyInput = inputEl('key');
    const fail = (code: string) => {
      licenseError.textContent = t(LICENSE_ERROR_KEYS[code] ?? 'license.error.invalid');
      licenseError.hidden = false;
      licenseError.dataset.code = code;
      keyInput.setAttribute('aria-invalid', 'true');
      licenseStatus.textContent = '';
    };
    if (key.length < 20) {
      fail('invalid_key');
      return;
    }
    licenseSubmit.disabled = true;
    licenseStatus.textContent = t('ext.license.working');
    void (async () => {
      const result = await activate(key, { id: await deviceId(), label: deviceLabel(navigator.userAgent) });
      licenseSubmit.disabled = false;
      if (!result.ok) {
        fail(result.error);
        return;
      }
      licenseError.hidden = true;
      keyInput.removeAttribute('aria-invalid');
      licenseForm.reset();
      // chrome.storage.local only — never sync (docs/10 §6).
      await api.storage.local.set({ [STORAGE_KEYS.license]: result.record });
      record = result.record;
      license = await licenseState(record);
      licenseStatus.textContent = t('pro.activated');
      telemetry.track('pro_activated', { plan: result.record.plan });
      render();
    })();
  });

  q(root, '[data-license-remove]', HTMLButtonElement).addEventListener('click', () => {
    const current = record;
    if (!current) return;
    void (async () => {
      const ok = await deactivate(current);
      await api.storage.local.remove(STORAGE_KEYS.license);
      record = null;
      license = NO_LICENSE;
      licenseStatus.textContent = ok ? '' : ctx.t('ext.license.removeFailed');
      render();
    })();
  });

  // ── Side nav: sliding indicator follows the section in view (and the clicked link) ────────────────
  const navLinks = [...root.querySelectorAll<HTMLAnchorElement>('[data-nav-link]')];
  const setActive = (id: string) => {
    const index = Math.max(
      0,
      navLinks.findIndex((a) => a.dataset.navLink === id),
    );
    q(root, '[data-nav-ind]').style.setProperty('--i', String(index));
    for (const [i, a] of navLinks.entries()) a.setAttribute('aria-current', String(i === index));
  };
  const sections = navLinks
    .map((a) => document.getElementById(a.dataset.navLink ?? ''))
    .filter((s): s is HTMLElement => s !== null);
  const spy = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setActive(visible.target.id);
    },
    { rootMargin: '0px 0px -65% 0px' },
  );
  for (const section of sections) spy.observe(section);
  for (const a of navLinks) {
    a.addEventListener('click', () => {
      setActive(a.dataset.navLink ?? 'defaults');
    });
  }
  setActive(location.hash.slice(1) || 'defaults');

  // ── Render ────────────────────────────────────────────────────────────────────────────────────
  function render(): void {
    const { t } = ctx;
    document.title = t('ext.options.title');
    checkRadio('level', ext.level);
    checkRadio('defaultPreset', isExtPreset(settings.defaultPreset) ? settings.defaultPreset : 'pinf');
    checkRadio('endBehaviour', settings.endBehaviour);
    checkRadio('theme', settings.theme);
    q(root, '[data-end-help]').textContent = t(
      settings.endBehaviour === 'stop' ? 'ext.options.end.stopHelp' : 'ext.options.end.askHelp',
    );
    q(root, '[data-theme-help]').textContent = t(`ext.options.theme.${settings.theme}`);
    q(root, '[data-schedules-intro]').textContent = t('ext.schedules.intro', {
      range: ctx.time.range(9 * 60, 18 * 60),
    });
    inputEl('notifications').checked = settings.notifications;
    const soundHelp = q(root, '[data-sound-help]');
    if (settings.notifications) delete soundHelp.dataset.warn;
    else soundHelp.dataset.warn = '';
    q(root, 'select[name="sound"]', HTMLSelectElement).value = settings.sound.id === 'none' ? 'none' : 'chime';
    inputEl('keyboardShortcuts').checked = settings.keyboardShortcuts;
    inputEl('telemetry').checked = settings.telemetry;
    inputEl('browserStart').checked = ext.autostart.browserStart;
    q(root, '[data-version]').textContent = t('ext.about.version', { version });
    renderLanguage();
    renderShortcut();
    renderSchedules();
    renderSites();
    renderLicense();
    renderGates();
    renderDraft();
  }

  api.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (!(STORAGE_KEYS.license in changes) && !(EXT_KEYS.ext in changes) && !(STORAGE_KEYS.settings in changes)) return;
    void (async () => {
      local = await api.storage.local.get(null);
      settings = readSettings(local[STORAGE_KEYS.settings]);
      ctx.settings = settings;
      ext = readExt(local[EXT_KEYS.ext]);
      record = (local[STORAGE_KEYS.license] as ILicenseRecord | undefined) ?? null;
      license = await licenseState(record);
      render();
    })();
  });

  translateTree(root, ctx.t);
  render();
  root.hidden = false;
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  document.documentElement.dataset.ready = String(Math.round(performance.now()));
}

void boot();
