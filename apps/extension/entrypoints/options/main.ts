import 'virtual:at-tokens.css';
import '../../src/styles/base.css';
import './options.css';
import { hasFeature, STORAGE_KEYS, type ILicenseRecord, type ILicenseState, type ISettings, type TFeatureGate } from '@awaketab/core';
import { browser } from 'wxt/browser';
import { LOCALE_META } from '../../../web/src/i18n/locales';
import type { IExtApi } from '../../src/api';
import { LOCALES } from '../../src/i18n';
import { activate, deactivate, deviceLabel, LICENSE_ERROR_KEYS, licenseState, NO_LICENSE } from '../../src/license';
import { applyTheme, loadPage, translateTree } from '../../src/page';
import {
  AUTOSTART_SITES_MAX,
  EXT_KEYS,
  isExtPreset,
  isHHMM,
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

/** Options page (docs/10 §6): every section, Pro sections gated with an honest link to /pro. */

const WEEK = [1, 2, 3, 4, 5, 6, 0] as const;

function q<T extends Element = HTMLElement>(root: ParentNode, selector: string, type?: new () => T): T {
  const el = root.querySelector(selector);
  const expected = type ?? (HTMLElement as unknown as new () => T);
  if (!(el instanceof expected)) throw new Error(`options: missing ${selector}`);
  return el;
}

function field(data: FormData, name: string, fallback = ''): string {
  const value = data.get(name);
  return typeof value === 'string' ? value : fallback;
}

async function boot(): Promise<void> {
  const api = browser as unknown as IExtApi;
  const root = q(document, '[data-root]');
  const ctx = await loadPage(api);
  const { t } = ctx;
  const htmlLang = document.documentElement.lang || 'en';

  // Language list: native names from the web's locale table, not translated strings.
  const localeSelect = q(root, '[data-locales]', HTMLSelectElement);
  for (const locale of LOCALES) {
    const option = document.createElement('option');
    option.value = locale;
    option.textContent = LOCALE_META[locale].label;
    option.lang = LOCALE_META[locale].htmlLang;
    localeSelect.append(option);
  }
  const weekday = new Intl.DateTimeFormat(htmlLang, { weekday: 'short' });
  const dayName = (day: number) => weekday.format(new Date(2023, 0, 1 + day)); // 2023-01-01 was a Sunday
  const daysRow = q(root, '[data-days]');
  for (const day of WEEK) {
    const label = document.createElement('label');
    label.className = 'op-day';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = 'day';
    input.value = String(day);
    input.checked = day >= 1 && day <= 5;
    const span = document.createElement('span');
    span.textContent = dayName(day);
    label.append(input, span);
    daysRow.append(label);
  }
  translateTree(root, t);
  document.title = t('ext.options.title');

  let local = await api.storage.local.get(null);
  let settings: ISettings = readSettings(local[STORAGE_KEYS.settings]);
  let ext: IExtSettings = readExt(local[EXT_KEYS.ext]);
  let record = (local[STORAGE_KEYS.license] as ILicenseRecord | undefined) ?? null;
  let license: ILicenseState = await licenseState(record);

  const telemetry = createTelemetry({
    enabled: () => settings.telemetry,
    locale: () => ctx.locale,
    version: api.runtime.getManifest().version,
    path: '/ext/options',
  });

  async function deviceId(): Promise<string> {
    const stored = (await api.storage.local.get(EXT_KEYS.device))[EXT_KEYS.device] as { id?: string } | undefined;
    if (stored?.id) return stored.id;
    const id = crypto.randomUUID();
    await api.storage.local.set({ [EXT_KEYS.device]: { v: 1, id } });
    return id;
  }

  const saved = q(root, '[data-saved]');
  let savedTimer: ReturnType<typeof setTimeout> | null = null;
  const flashSaved = () => {
    saved.textContent = t('ext.options.saved');
    if (savedTimer) clearTimeout(savedTimer);
    savedTimer = setTimeout(() => {
      saved.textContent = '';
    }, 2000);
  };

  async function patchSettings(patch: Partial<ISettings>): Promise<void> {
    const current = readSettings((await api.storage.local.get(STORAGE_KEYS.settings))[STORAGE_KEYS.settings]);
    settings = { ...current, ...patch };
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
  const selectEl = (name: string) => q(root, `select[name="${name}"]`, HTMLSelectElement);

  function fillSettings(): void {
    for (const radio of root.querySelectorAll<HTMLInputElement>('input[name="level"]')) radio.checked = radio.value === ext.level;
    for (const radio of root.querySelectorAll<HTMLInputElement>('input[name="endBehaviour"]')) {
      radio.checked = radio.value === settings.endBehaviour;
    }
    selectEl('defaultPreset').value = isExtPreset(settings.defaultPreset) ? settings.defaultPreset : 'pinf';
    inputEl('notifications').checked = settings.notifications;
    selectEl('sound').value = settings.sound.id === 'none' ? 'none' : 'chime';
    selectEl('theme').value = settings.theme;
    localeSelect.value = settings.locale ?? '';
    inputEl('keyboardShortcuts').checked = settings.keyboardShortcuts;
    inputEl('telemetry').checked = settings.telemetry;
    inputEl('browserStart').checked = ext.autostart.browserStart;
  }

  // ── Defaults, end behaviour, look, keyboard, privacy ──────────────────────────────────────────
  for (const radio of root.querySelectorAll<HTMLInputElement>('input[name="level"]')) {
    radio.addEventListener('change', () => {
      if (radio.checked && isLevel(radio.value)) void patchExt({ level: radio.value });
    });
  }
  for (const radio of root.querySelectorAll<HTMLInputElement>('input[name="endBehaviour"]')) {
    radio.addEventListener('change', () => {
      if (radio.checked) void patchSettings({ endBehaviour: radio.value === 'stop' ? 'stop' : 'prompt_extend' });
    });
  }
  selectEl('defaultPreset').addEventListener('change', (event) => {
    const value = (event.target as HTMLSelectElement).value;
    if (isExtPreset(value)) void patchSettings({ defaultPreset: value });
  });
  const notifyBlocked = q(root, '[data-notify-blocked]');
  inputEl('notifications').addEventListener('change', (event) => {
    const box = event.target as HTMLInputElement;
    if (!box.checked) {
      void patchSettings({ notifications: false });
      return;
    }
    // Requested inside the click, as Chrome requires; the optional permission is never asked for elsewhere.
    void api.permissions.request({ permissions: ['notifications'] }).then(
      (granted) => {
        box.checked = granted;
        notifyBlocked.hidden = granted;
        void patchSettings({ notifications: granted });
      },
      () => {
        box.checked = false;
        notifyBlocked.hidden = false;
      },
    );
  });
  selectEl('sound').addEventListener('change', (event) => {
    const value = (event.target as HTMLSelectElement).value === 'none' ? 'none' : 'chime';
    void patchSettings({ sound: { ...settings.sound, id: value } });
  });
  selectEl('theme').addEventListener('change', (event) => {
    const value = (event.target as HTMLSelectElement).value;
    const theme = value === 'light' || value === 'dark' || value === 'oled' ? value : 'auto';
    void patchSettings({ theme }).then(() => {
      applyTheme(settings);
    });
  });
  localeSelect.addEventListener('change', () => {
    const value = localeSelect.value;
    void patchSettings({ locale: (LOCALES as readonly string[]).includes(value) ? value : null }).then(() => {
      location.reload();
    });
  });
  inputEl('keyboardShortcuts').addEventListener('change', (event) => {
    void patchSettings({ keyboardShortcuts: (event.target as HTMLInputElement).checked });
  });
  inputEl('telemetry').addEventListener('change', (event) => {
    void patchSettings({ telemetry: (event.target as HTMLInputElement).checked });
  });

  const shortcut = q(root, '[data-shortcut]');
  void api.commands.getAll().then((commands) => {
    const key = commands.find((command) => command.name === 'toggle')?.shortcut;
    shortcut.textContent = key ? t('ext.options.shortcut.current', { shortcut: key }) : t('ext.options.shortcut.none');
  });
  q(root, '[data-shortcut-change]', HTMLButtonElement).addEventListener('click', () => {
    void api.tabs.create({ url: 'chrome://extensions/shortcuts' });
  });
  q(root, '[data-version]').textContent = t('ext.about.version', { version: api.runtime.getManifest().version });

  // ── Pro gating ────────────────────────────────────────────────────────────────────────────────
  function renderGates(): void {
    for (const section of root.querySelectorAll<HTMLElement>('[data-gated]')) {
      const allowed = hasFeature(license, section.dataset.gated as TFeatureGate);
      q(section, '[data-locked]').hidden = allowed;
      section.dataset.locked = allowed ? '0' : '1';
      for (const control of section.querySelectorAll<HTMLInputElement | HTMLButtonElement | HTMLSelectElement>('input, button, select')) {
        control.disabled = !allowed;
      }
    }
  }

  // ── Schedules ─────────────────────────────────────────────────────────────────────────────────
  const scheduleList = q(root, '[data-schedules]', HTMLUListElement);
  const scheduleForm = q(root, '[data-schedule-form]', HTMLFormElement);
  const scheduleError = q(root, '[data-schedule-error]');

  function scheduleSummary(schedule: ISchedule): string {
    const days = WEEK.filter((d) => schedule.days.includes(d)).map(dayName).join(', ');
    return `${days} · ${schedule.start}–${schedule.end} · ${t(schedule.level === 'system' ? 'ext.level.system' : 'ext.level.display')}`;
  }

  function removeButton(item: string, onRemove: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pp-btn pp-ghost';
    button.textContent = t('ext.remove');
    button.setAttribute('aria-label', t('ext.remove.label', { item }));
    button.addEventListener('click', onRemove);
    return button;
  }

  function renderSchedules(): void {
    scheduleList.replaceChildren(
      ...ext.schedules.map((schedule) => {
        const li = document.createElement('li');
        const text = document.createElement('span');
        const summary = scheduleSummary(schedule);
        text.textContent = summary;
        li.append(
          text,
          removeButton(summary, () => {
            void patchExt({ schedules: ext.schedules.filter((s) => s.id !== schedule.id) }).then(render);
          }),
        );
        return li;
      }),
    );
    q(root, '[data-schedules-empty]').hidden = ext.schedules.length > 0;
  }

  scheduleForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(scheduleForm);
    const days = data.getAll('day').map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
    const start = field(data, 'start');
    const end = field(data, 'end');
    const level = field(data, 'level', 'display');
    const fail = (key: string) => {
      scheduleError.textContent = t(key);
      scheduleError.hidden = false;
    };
    if (!days.length) {
      fail('ext.schedules.error.days');
      return;
    }
    if (!isHHMM(start) || !isHHMM(end) || start === end) {
      fail('ext.schedules.error.same');
      return;
    }
    scheduleError.hidden = true;
    if (ext.schedules.length >= SCHEDULES_MAX) return;
    const schedule: ISchedule = { id: crypto.randomUUID(), days: [...days].sort(), start, end, level: isLevel(level) ? level : 'display' };
    void patchExt({ schedules: [...ext.schedules, schedule] }).then(render);
  });

  // ── Auto-start ────────────────────────────────────────────────────────────────────────────────
  const siteList = q(root, '[data-sites]', HTMLUListElement);
  const siteForm = q(root, '[data-site-form]', HTMLFormElement);
  const siteError = q(root, '[data-site-error]');

  inputEl('browserStart').addEventListener('change', (event) => {
    void patchExt({ autostart: { ...ext.autostart, browserStart: (event.target as HTMLInputElement).checked } });
  });

  function renderSites(): void {
    siteList.replaceChildren(
      ...ext.autostart.sites.map((site) => {
        const li = document.createElement('li');
        const text = document.createElement('span');
        const label = site.durationMin ? t(`tool.preset.p${String(site.durationMin)}`) : t('ext.autostart.duration.open');
        text.textContent = `${site.host} · ${label}`;
        li.append(
          text,
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

  siteForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(siteForm);
    const host = normalizeHost(field(data, 'host'));
    const minutes = Number(data.get('duration'));
    const fail = (key: string) => {
      siteError.textContent = t(key);
      siteError.hidden = false;
    };
    if (!host) {
      fail('ext.autostart.error.host');
      return;
    }
    if (ext.autostart.sites.length >= AUTOSTART_SITES_MAX) return;
    siteError.hidden = true;
    // Must run inside the submit gesture: Chrome shows a prompt naming exactly this one site.
    void api.permissions.request({ origins: [originPattern(host)] }).then(
      (granted) => {
        if (!granted) {
          fail('ext.autostart.error.denied');
          return;
        }
        const sites = [...ext.autostart.sites.filter((s) => s.host !== host), { host, durationMin: minutes > 0 ? minutes : null }];
        siteForm.reset();
        void patchExt({ autostart: { ...ext.autostart, sites } }).then(render);
      },
      () => {
        fail('ext.autostart.error.denied');
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
    q(root, '[data-license-plan]').textContent = active ? `${t('pro.title')} · ${record?.deviceLabel ?? ''}` : '';
  }

  licenseForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const key = field(new FormData(licenseForm), 'key').trim();
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
      licenseStatus.textContent = ok ? '' : t('ext.license.removeFailed');
      render();
    })();
  });

  function render(): void {
    fillSettings();
    renderSchedules();
    renderSites();
    renderLicense();
    renderGates();
  }

  api.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (!(STORAGE_KEYS.license in changes) && !(EXT_KEYS.ext in changes) && !(STORAGE_KEYS.settings in changes)) return;
    void (async () => {
      local = await api.storage.local.get(null);
      settings = readSettings(local[STORAGE_KEYS.settings]);
      ext = readExt(local[EXT_KEYS.ext]);
      record = (local[STORAGE_KEYS.license] as ILicenseRecord | undefined) ?? null;
      license = await licenseState(record);
      render();
    })();
  });

  render();
  root.hidden = false;
  document.documentElement.dataset.ready = String(Math.round(performance.now()));
}

void boot();
