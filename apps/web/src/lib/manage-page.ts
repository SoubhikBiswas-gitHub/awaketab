import { deactivateDevice, fetchActivations } from './license';

type TRow = { label: string; at: number; devHash: string };

// Rows are cloned from a <template data-device-row> that manage.astro renders with shadcn
// primitives at build time, so no class strings live in client code (docs/03 ADR-013).
function rowPrototype(root: HTMLElement): HTMLElement {
  const proto = root.querySelector<HTMLTemplateElement>('template[data-device-row]')?.content.querySelector('tr');
  if (proto) return proto.cloneNode(true) as HTMLElement;
  // Fallback when the page ships no template: a bare row carrying the same hooks.
  const tr = document.createElement('tr');
  const label = document.createElement('td');
  label.dataset.deviceLabel = '';
  const atCell = document.createElement('td');
  const at = document.createElement('time');
  at.dataset.deviceAt = '';
  atCell.append(at);
  const actions = document.createElement('td');
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.dataset.deviceRemove = '';
  btn.textContent = root.querySelector('[data-deactivate-label]')?.textContent ?? 'Remove';
  actions.append(btn);
  tr.append(label, atCell, actions);
  return tr;
}

export function bootManagePage(root: HTMLElement): void {
  const list = root.querySelector('[data-devices]');
  const wrap = root.querySelector<HTMLElement>('[data-devices-wrap]');
  const empty = root.querySelector<HTMLElement>('[data-manage-empty]');
  if (!list) return;
  const raw = localStorage.getItem('at.v1.license');
  if (!raw) {
    if (empty) empty.hidden = false;
    return;
  }
  let token = '';
  try {
    token = (JSON.parse(raw) as { token?: string }).token ?? '';
  } catch {
    if (empty) empty.hidden = false;
    return;
  }

  const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

  const paint = (rows: TRow[]) => {
    list.replaceChildren();
    if (wrap) wrap.hidden = rows.length === 0;
    rows.forEach((row, index) => {
      const tr = rowPrototype(root);
      const label = tr.querySelector<HTMLElement>('[data-device-label]');
      const at = tr.querySelector<HTMLElement>('[data-device-at]');
      const btn = tr.querySelector<HTMLButtonElement>('[data-device-remove]');
      const labelId = `at-device-${String(index)}`;
      if (label) {
        label.id = labelId;
        label.textContent = row.label;
      }
      if (at && Number.isFinite(row.at)) {
        at.textContent = dateFmt.format(row.at);
        at.setAttribute('datetime', new Date(row.at).toISOString());
      }
      if (btn) {
        // Distinguishes the identical "Remove" buttons for screen readers without a new i18n key.
        btn.setAttribute('aria-describedby', labelId);
        btn.addEventListener('click', () => {
          btn.disabled = true;
          void deactivateDevice(token, row.devHash).then((res) => {
            if (res.activations) paint(res.activations);
            else btn.disabled = false;
          });
        });
      }
      list.append(tr);
    });
  };

  void fetchActivations(token).then((data) => {
    if (data.revoked) {
      localStorage.removeItem('at.v1.license');
      if (empty) empty.hidden = false;
      return;
    }
    paint(data.activations);
  });
}
