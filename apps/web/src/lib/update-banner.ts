import href from '../styles/update-banner.css?url';

// Pages other than the tool: the worker that controls this site may be waiting to be replaced by a newer one.
// Nothing runs a session here, so Reload is safe; the tool asks on its own (src/tool/pwa.ts) and never reloads a run.
function show(reg: ServiceWorkerRegistration): void {
  const tpl = document.querySelector<HTMLTemplateElement>('#at-update');
  if (!tpl || document.querySelector('.at-upd')) return;
  const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href });
  link.onload = () => {
    const box = tpl.content.firstElementChild?.cloneNode(true);
    if (!(box instanceof HTMLElement)) return;
    box.querySelector('[data-update-reload]')?.addEventListener('click', () => {
      let once = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (once) return;
        once = true;
        location.reload();
      });
      if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
      else location.reload();
    });
    box.querySelector('[data-update-close]')?.addEventListener('click', () => {
      box.remove();
    });
    document.body.append(box);
  };
  document.head.append(link);
}

export function watchSiteUpdates(): void {
  // A page with the tool on it (an article) asks through the tool's own toast, which waits for the session to end.
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller || document.querySelector('.at-island'))
    return;
  void navigator.serviceWorker.getRegistration().then((reg) => {
    if (!reg) return;
    const check = () => {
      if (reg.waiting && reg.active) show(reg);
    };
    reg.addEventListener('updatefound', () => {
      reg.installing?.addEventListener('statechange', check);
    });
    check();
  });
}
