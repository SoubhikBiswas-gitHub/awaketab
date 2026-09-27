import { deactivateDevice, fetchActivations } from './license';
import { applyLaunch, fill, longDate } from './pro-common';

type TRow = { label: string; at: number; devHash: string };
type TRecord = { token?: string; plan?: string; exp?: number; deviceId?: string };
export type TManageState = 'loading' | 'list' | 'empty' | 'grace' | 'lapsed' | 'offline';

const DAY_S = 86_400;
const LICENSE_KEY = 'at.v1.license';

/**
 * Yearly licences only (docs/08 §2.4): the token `exp` is the period end + 7 days of grace. Inside those 7 days
 * the renewal did not go through (grace); after `exp` Pro has ended on these devices (lapsed). Lifetime and kiosk
 * tokens roll forward on every check, so they never show either state.
 */
export function lapseState(plan: string | undefined, expSec: number | undefined, now = Date.now()): 'grace' | 'lapsed' | null {
  if (plan !== 'pro_yearly' || typeof expSec !== 'number' || !Number.isFinite(expSec)) return null;
  if (now >= expSec * 1000) return 'lapsed';
  if (now >= (expSec - 7 * DAY_S) * 1000) return 'grace';
  return null;
}

/** Which icon a device row gets, from its label ("AwakeTab for Chrome · macOS", "Safari · iPadOS", …). */
export function deviceIcon(label: string): 'ext' | 'tablet' | 'phone' | 'laptop' {
  if (/AwakeTab for Chrome/iu.test(label)) return 'ext';
  if (/iPad|tablet/iu.test(label)) return 'tablet';
  if (/iOS|iPhone|Android/iu.test(label)) return 'phone';
  return 'laptop';
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function rowPrototype(root: HTMLElement): HTMLElement {
  const proto = root.querySelector<HTMLTemplateElement>('template[data-device-row]')?.content.querySelector<HTMLElement>('[role="row"]');
  if (proto) return proto.cloneNode(true) as HTMLElement;
  // Fallback when the page ships no template: a bare row carrying the same hooks.
  const row = document.createElement('div');
  row.setAttribute('role', 'row');
  const label = document.createElement('span');
  label.dataset.deviceLabel = '';
  const at = document.createElement('time');
  at.dataset.deviceAt = '';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.dataset.deviceRemove = '';
  btn.textContent = root.querySelector('[data-deactivate-label]')?.textContent ?? 'Remove';
  for (const child of [label, at, btn]) {
    const cell = document.createElement('div');
    cell.setAttribute('role', 'cell');
    cell.append(child);
    row.append(cell);
  }
  return row;
}

/**
 * `/pro/manage` (docs/09 §2.6; boards ProManage and Sys prolapsed). Lists the licence's activations with a
 * 5-slot meter, marks this browser's row, confirms a removal inline, and shows the renewal-grace or lapsed
 * panel for a yearly licence past its period end. Removing this browser clears its stored licence.
 */
export function bootManagePage(root: HTMLElement, now = Date.now()): void {
  const list = root.querySelector('[data-devices]');
  const wrap = root.querySelector<HTMLElement>('[data-devices-wrap]');
  const empty = root.querySelector<HTMLElement>('[data-manage-empty]');
  const offline = root.querySelector<HTMLElement>('[data-manage-offline]');
  if (!list) return;
  applyLaunch(root, now);

  const setState = (state: TManageState) => {
    root.dataset.state = state;
    if (empty) empty.hidden = state !== 'empty';
    if (offline) offline.hidden = state !== 'offline';
    if ((state === 'empty' || state === 'offline') && wrap) wrap.hidden = true;
  };

  const raw = localStorage.getItem(LICENSE_KEY);
  if (!raw) {
    setState('empty');
    return;
  }
  let record: TRecord = {};
  try {
    record = JSON.parse(raw) as TRecord;
  } catch {
    setState('empty');
    return;
  }
  const token = record.token ?? '';
  if (!token) {
    setState('empty');
    return;
  }

  const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const hereHash = record.deviceId ? sha256Hex(record.deviceId).catch(() => '') : Promise.resolve('');
  let lapse: 'grace' | 'lapsed' | null = null;

  const paintMeter = (count: number) => {
    const label = root.querySelector<HTMLElement>('[data-meter-label]');
    const left = root.querySelector<HTMLElement>('[data-meter-left]');
    const bar = root.querySelector<HTMLElement>('[data-meter-bar]');
    if (label) label.textContent = fill(label.dataset.tpl ?? '{n}', { n: count });
    if (left) {
      const free = Math.max(0, 5 - count);
      left.textContent = free === 0 ? (left.dataset.none ?? '') : free === 1 ? (left.dataset.one ?? '') : fill(left.dataset.tpl ?? '{n}', { n: free });
    }
    if (bar) {
      bar.setAttribute('aria-valuenow', String(Math.min(5, count)));
      [...bar.children].forEach((slot, i) => slot.toggleAttribute('data-on', i < count));
    }
  };

  const paintLapse = (state: 'grace' | 'lapsed', expSec: number) => {
    const end = (expSec - 7 * DAY_S) * 1000;
    const vars = { date: longDate(expSec * 1000), due: longDate(end), ended: longDate(end) };
    for (const node of root.querySelectorAll<HTMLElement>('[data-lapse-fill]')) node.textContent = fill(node.dataset.tpl ?? '', vars);
    root.dataset.lapse = state;
  };

  const confirmHere = root.querySelector('[data-confirm-here]')?.textContent ?? '';
  const confirmOther = root.querySelector<HTMLElement>('[data-confirm-other]')?.dataset.tpl ?? '{label}';
  const confirmAria = root.querySelector<HTMLElement>('[data-confirm-other]')?.dataset.aria ?? '{label}';

  const paint = async (rows: TRow[]) => {
    const here = await hereHash;
    list.replaceChildren();
    if (wrap) wrap.hidden = rows.length === 0;
    if (rows.length === 0 && !lapse) {
      setState('empty');
      return;
    }
    setState(lapse ?? 'list');
    paintMeter(rows.length);
    rows.forEach((row, index) => {
      const tr = rowPrototype(root);
      const isHere = here !== '' && row.devHash === here;
      const label = tr.querySelector<HTMLElement>('[data-device-label]');
      const at = tr.querySelector<HTMLElement>('[data-device-at]');
      const btn = tr.querySelector<HTMLButtonElement>('[data-device-remove]');
      const confirm = tr.querySelector<HTMLElement>('[data-device-confirm]');
      const labelId = `at-device-${String(index)}`;
      tr.dataset.icon = deviceIcon(row.label);
      if (index === rows.length - 1) tr.dataset.last = '';
      if (label) {
        label.id = labelId;
        label.textContent = row.label;
      }
      const hereTag = tr.querySelector<HTMLElement>('[data-device-here]');
      if (hereTag) hereTag.hidden = !isHere;
      const offTag = tr.querySelector<HTMLElement>('[data-device-off]');
      if (offTag) offTag.hidden = lapse !== 'lapsed';
      if (at && Number.isFinite(row.at)) {
        at.textContent = dateFmt.format(row.at);
        at.setAttribute('datetime', new Date(row.at).toISOString());
      }
      if (!btn) {
        list.append(tr);
        return;
      }
      // Distinguishes the identical "Remove" buttons for screen readers without a new i18n key.
      btn.setAttribute('aria-describedby', labelId);
      const remove = () => {
        btn.disabled = true;
        for (const b of tr.querySelectorAll<HTMLButtonElement>('button')) b.disabled = true;
        void deactivateDevice(token, row.devHash).then((res) => {
          if (res.activations) {
            if (isHere) {
              // This browser is no longer an activation: its stored licence is dead (manage-page, board note).
              localStorage.removeItem(LICENSE_KEY);
              list.replaceChildren();
              if (wrap) wrap.hidden = true;
              setState('empty');
              return;
            }
            void paint(res.activations);
          } else {
            for (const b of tr.querySelectorAll<HTMLButtonElement>('button')) b.disabled = false;
          }
        }, () => {
          // Network failure: nothing was removed, so the row stays usable.
          for (const b of tr.querySelectorAll<HTMLButtonElement>('button')) b.disabled = false;
        });
      };
      if (!confirm) {
        btn.addEventListener('click', remove);
        list.append(tr);
        return;
      }
      const text = confirm.querySelector<HTMLElement>('[data-confirm-text]');
      if (text) text.textContent = isHere ? confirmHere : fill(confirmOther, { label: row.label });
      confirm.setAttribute('aria-label', fill(confirmAria, { label: row.label }));
      const keepBtn = confirm.querySelector<HTMLButtonElement>('[data-keep]');
      const yesBtn = confirm.querySelector<HTMLButtonElement>('[data-confirm-remove]');
      btn.addEventListener('click', () => {
        tr.dataset.confirming = '';
        confirm.hidden = false;
        keepBtn?.focus();
      });
      keepBtn?.addEventListener('click', () => {
        delete tr.dataset.confirming;
        confirm.hidden = true;
        btn.focus();
      });
      yesBtn?.addEventListener('click', remove);
      list.append(tr);
    });
  };

  const load = () => {
    setState('loading');
    void fetchActivations(token).then(
      (data) => {
        if (data.revoked) {
          localStorage.removeItem(LICENSE_KEY);
          setState('empty');
          return;
        }
        // The validate answer carries the fresh plan and exp (docs/09 §2.5); fall back to the stored record.
        const fresh = data as { plan?: string; exp?: number };
        const expSec = typeof fresh.exp === 'number' ? fresh.exp : record.exp;
        lapse = lapseState(fresh.plan ?? record.plan, expSec, now);
        if (lapse && typeof expSec === 'number') paintLapse(lapse, expSec);
        void paint(Array.isArray(data.activations) ? data.activations : []);
      },
      // Offline or the API is down: say so with a retry, never an empty list that looks like "no devices".
      () => {
        setState('offline');
      },
    );
  };
  root.querySelector('[data-manage-retry]')?.addEventListener('click', load);
  load();
}
