import { KIOSK_MODES, kioskMsg, kioskUrl, type IKioskUrlOptions } from '../tool/embed/snippet';

const THEMES = ['auto', 'light', 'dark', 'oled'] as const;
const PRESETS = ['pinf', 'p15', 'p30', 'p45', 'p60', 'p120', 'p240'] as const;
const SECONDS: Record<IKioskUrlOptions['preset'], number> = {
  pinf: 0,
  p15: 900,
  p30: 1800,
  p45: 2700,
  p60: 3600,
  p120: 7200,
  p240: 14400,
};
const TOKEN_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u;

const text = (value: FormDataEntryValue | null): string => (typeof value === 'string' ? value : '');
const pick = <T extends string>(list: readonly T[], value: FormDataEntryValue | null, fallback: T): T =>
  typeof value === 'string' && (list as readonly string[]).includes(value) ? (value as T) : fallback;

export function readKioskForm(data: FormData): IKioskUrlOptions {
  return {
    mode: pick(KIOSK_MODES, data.get('mode'), 'message'),
    theme: pick(THEMES, data.get('theme'), 'dark'),
    preset: pick(PRESETS, data.get('preset'), 'pinf'),
    autostart: data.get('autostart') !== null,
    msg: text(data.get('msg')),
    logo: text(data.get('logo')),
    token: text(data.get('token')),
  };
}

export interface IUrlPart {
  text: string;
  kind: 'muted' | 'key' | 'value' | 'hash';
}

export function urlParts(url: string): IUrlPart[] {
  const hashAt = url.indexOf('#');
  const main = hashAt < 0 ? url : url.slice(0, hashAt);
  const hash = hashAt < 0 ? '' : url.slice(hashAt);
  const q = main.indexOf('?');
  const parts: IUrlPart[] = [{ text: q < 0 ? main : main.slice(0, q + 1), kind: 'muted' }];
  if (q >= 0) {
    main
      .slice(q + 1)
      .split('&')
      .forEach((pair, i) => {
        const eq = pair.indexOf('=');
        if (i) parts.push({ text: '&', kind: 'muted' });
        parts.push({ text: pair.slice(0, eq + 1), kind: 'key' });
        parts.push({ text: pair.slice(eq + 1), kind: 'value' });
      });
  }
  if (hash) parts.push({ text: hash, kind: 'hash' });
  return parts;
}

export function httpsLogo(raw: string): boolean {
  try {
    const url = new URL(raw.trim());
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

export interface IKioskHints {
  msg: string;
  logo: string;
  logoWarn: boolean;
  token: string;
  tokenWarn: boolean;
  licensed: boolean;
  showLogo: boolean;
  note: string;
}

export function kioskHints(o: IKioskUrlOptions): IKioskHints {
  const token = o.token.trim();
  const tokenValid = TOKEN_RE.test(token);
  const logoRaw = o.logo.trim() !== '';
  const logoOk = httpsLogo(o.logo);
  return {
    msg:
      o.mode === 'message'
        ? 'Without a Kiosk licence or Pro the screen shows the message for a 60 s preview; either one keeps it on.'
        : 'Only shown in Message mode, so it is left out of the link.',
    logo: !logoRaw
      ? 'An https image, shown above the timer and on the ambient screen.'
      : !logoOk
        ? 'Needs an https address, so it is left out of the link.'
        : tokenValid
          ? 'Added to the link and shown on the screen.'
          : 'Added to the link. It shows only with a Kiosk licence token.',
    logoWarn: logoRaw && !logoOk,
    token: !token
      ? 'Paste the token from your Kiosk licence. It fills itself in if you activated one here.'
      : tokenValid
        ? 'Added after #lic=, which browsers never send to a server.'
        : 'This does not look like a licence token, so it is left out of the link.',
    tokenWarn: token !== '' && !tokenValid,
    licensed: tokenValid,
    showLogo: tokenValid && logoOk,
    note: tokenValid
      ? logoOk
        ? 'Licensed: your logo, no AwakeTab wordmark.'
        : 'Licensed: no AwakeTab wordmark.'
      : 'Free: shows the AwakeTab wordmark.',
  };
}

const pad2 = (n: number) => String(n).padStart(2, '0');

export function clockParts(sec: number): [string, string] {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h ? [`${String(h)}:${pad2(m)}`, `:${pad2(s)}`] : [pad2(m), `:${pad2(s)}`];
}

const hm = (ms: number) => new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export interface IKioskTimer {
  big: [string, string];
  kicker: string;
  metaA: string;
  metaB: string;
  progress: number;
}

export function kioskTimer(
  preset: IKioskUrlOptions['preset'],
  autostart: boolean,
  startedAt: number,
  now: number,
): IKioskTimer {
  const total = SECONDS[preset];
  const elapsed = autostart ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
  if (total === 0) {
    return autostart
      ? { big: clockParts(elapsed), kicker: 'Awake for', metaA: 'since', metaB: hm(startedAt), progress: 1 }
      : { big: ['∞', ''], kicker: 'Keeps awake', metaA: 'until you stop', metaB: '', progress: 1 };
  }
  const left = Math.max(0, total - elapsed);
  return {
    big: clockParts(left),
    kicker: autostart ? 'Time left' : 'Keeps awake for',
    metaA: autostart ? 'until' : 'ends at',
    metaB: hm(autostart ? startedAt + total * 1000 : now + total * 1000),
    progress: left / total,
  };
}

const LABEL: Record<string, string> = {
  message: 'Message',
  clock: 'Clock',
  minimal: 'Minimal',
  standard: 'Standard',
  night: 'Night',
  auto: 'Auto',
  light: 'Light',
  dark: 'Dark',
  oled: 'OLED black',
};

export function bindKiosk(root: HTMLElement, win: Window = window): void {
  const doc = win.document;
  const form = root.querySelector<HTMLFormElement>('[data-kiosk-form]');
  const out = root.querySelector<HTMLElement>('[data-kiosk-url]');
  const status = root.querySelector<HTMLElement>('[data-kiosk-status]');
  const copyBtn = root.querySelector<HTMLButtonElement>('[data-kiosk-copy]');
  const screen = root.querySelector<HTMLElement>('[data-kiosk-screen]');
  const setText = (sel: string, value: string) => {
    for (const el of root.querySelectorAll<HTMLElement>(sel)) el.textContent = value;
  };
  if (!form || !out || !screen) return;
  const tokenInput = form.querySelector<HTMLInputElement>('input[name="token"]');

  // Prefill from a Kiosk licence activated in this browser (at.v1.license, docs/08). Read-only.
  try {
    const lic = JSON.parse(win.localStorage.getItem('at.v1.license') ?? 'null') as {
      plan?: string;
      token?: string;
    } | null;
    if (tokenInput && lic?.token && (lic.plan === 'biz_kiosk_site' || lic.plan === 'biz_kiosk_5'))
      tokenInput.value = lic.token;
  } catch {
    // storage unavailable: leave the field empty
  }

  let startedAt = Date.now();
  let last = '';
  const tick = () => {
    const o = readKioskForm(new FormData(form));
    const now = Date.now();
    const time = hm(now);
    setText('[data-k-time]', time);
    setText('[data-k-clock]', time.slice(0, -3));
    setText('[data-k-ampm]', time.slice(-2));
    setText(
      '[data-k-date]',
      `${new Date(now).toLocaleDateString('en-GB', { weekday: 'long' })}, ${new Date(now).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    );
    const tm = kioskTimer(o.preset, o.autostart, startedAt, now);
    setText('[data-k-big]', tm.big[0]);
    setText('[data-k-sec]', tm.big[1]);
    setText('[data-k-kicker]', tm.kicker);
    setText('[data-k-meta-a]', tm.metaA);
    setText('[data-k-meta-b]', tm.metaB);
    screen.style.setProperty('--at-kp-p', String(tm.progress));
    screen.toggleAttribute('data-long', tm.big[0].length > 3);
  };

  const render = (reason?: string) => {
    const o = readKioskForm(new FormData(form));
    const url = kioskUrl(o, win.location.origin);
    const key = `${o.autostart ? '1' : '0'}${o.preset}`;
    if (reason && key !== last) startedAt = Date.now();
    last = key;
    out.replaceChildren(
      ...urlParts(url).map((p) => {
        const span = doc.createElement('span');
        span.dataset.part = p.kind;
        span.textContent = p.text;
        return span;
      }),
    );
    if (status) status.textContent = '';
    copyBtn?.removeAttribute('data-copied');
    const h = kioskHints(o);
    setText('[data-k-hint="msg"]', h.msg);
    setText('[data-k-hint="logo"]', h.logo);
    setText('[data-k-hint="token"]', h.token);
    root.querySelector('[data-k-hint="logo"]')?.toggleAttribute('data-warn', h.logoWarn);
    root.querySelector('[data-k-hint="token"]')?.toggleAttribute('data-warn', h.tokenWarn);
    const msg = kioskMsg(o.msg) || 'Your message';
    const len = Array.from(msg).length;
    setText('[data-k-msg]', msg);
    setText('[data-k-count]', String(Array.from(o.msg).length));
    screen.dataset.mode = o.mode;
    screen.dataset.ktheme = o.theme;
    screen.dataset.msgSize = len <= 24 ? 'l' : len <= 48 ? 'm' : 's';
    screen.toggleAttribute('data-on', o.autostart);
    screen.toggleAttribute('data-licensed', h.licensed);
    screen.toggleAttribute('data-logo', h.showLogo);
    setText('[data-k-pill]', o.autostart ? 'Screen awake' : 'Ready');
    screen.querySelector('[data-k-pillwrap]')?.setAttribute('data-lock', o.autostart ? 'held' : 'idle');
    setText('[data-k-caption]', `Preview · ${LABEL[o.mode] ?? ''} · ${LABEL[o.theme] ?? ''}`);
    setText('[data-k-note]', h.note);
    tick();
  };

  form.addEventListener('input', () => {
    render('input');
  });
  form.addEventListener('change', () => {
    render('change');
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
  });
  render();
  let timer = win.setInterval(tick, 1000);
  doc.addEventListener('visibilitychange', () => {
    win.clearInterval(timer);
    if (doc.visibilityState === 'visible') timer = win.setInterval(tick, 1000);
  });

  let reset = 0;
  copyBtn?.addEventListener('click', () => {
    void win.navigator.clipboard.writeText(out.textContent).then(() => {
      if (status) status.textContent = status.dataset.copied ?? 'Link copied';
      copyBtn.setAttribute('data-copied', '');
      win.clearTimeout(reset);
      reset = win.setTimeout(() => {
        if (status) status.textContent = '';
        copyBtn.removeAttribute('data-copied');
      }, 2000);
    });
  });
}
