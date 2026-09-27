import { DEFAULT_SNIPPET, loaderSnippet, type ISnippetOptions } from '../tool/embed/snippet';
import {
  EMBED_LOCALES,
  EMBED_MODES,
  EMBED_PRESETS,
  EMBED_SIZES,
  EMBED_THEMES,
  pick,
  reservedHeight,
} from '../tool/embed/protocol';

export interface ISnippetPart {
  text: string;
  name?: string;
  value?: string;
}

export function snippetParts(tag: string): ISnippetPart[] {
  const m = /^(<script async src="[^"]*")((?: [\w-]+="[^"]*")*)(><\/script>)$/u.exec(tag);
  if (!m) return [{ text: tag }];
  const attrs = [...(m[2] ?? '').matchAll(/ ([\w-]+)=("[^"]*")/gu)].map((a) => ({
    text: ' ',
    name: a[1] ?? '',
    value: a[2] ?? '',
  }));
  return [{ text: m[1] ?? '' }, ...attrs, { text: m[3] ?? '' }];
}

const text = (value: FormDataEntryValue | null): string => (typeof value === 'string' ? value : '');

export function readSnippetForm(data: FormData): ISnippetOptions {
  const lang = text(data.get('lang'));
  return {
    mode: pick(EMBED_MODES, data.get('mode'), DEFAULT_SNIPPET.mode),
    theme: pick(EMBED_THEMES, data.get('theme'), DEFAULT_SNIPPET.theme),
    size: pick(EMBED_SIZES, data.get('size'), DEFAULT_SNIPPET.size),
    preset: pick(EMBED_PRESETS, data.get('preset'), DEFAULT_SNIPPET.preset),
    lang: (EMBED_LOCALES as readonly string[]).includes(lang) ? (lang as ISnippetOptions['lang']) : null,
    until: null,
  };
}

export function boxLabel(opts: Pick<ISnippetOptions, 'size' | 'mode'>, width: number): string {
  const height = reservedHeight(opts, width);
  return opts.size === 'compact' ? `320 × ${String(height)}` : `100% × ${String(height)}`;
}

export function bindEmbedPage(root: HTMLElement, win: Window = window): void {
  const doc = win.document;
  const form = root.querySelector<HTMLFormElement>('[data-snippet-form]');
  const out = root.querySelector<HTMLElement>('[data-snippet]');
  const status = root.querySelector<HTMLElement>('[data-snippet-status]');
  const copy = root.querySelector<HTMLButtonElement>('[data-snippet-copy]');
  const demo = root.querySelector<HTMLElement>('[data-embed-demo]');
  const box = root.querySelector<HTMLElement>('[data-embed-box]');
  if (!form || !out) return;

  // One loader tag at a time: an async script removed before it runs still runs (and would then append its iframe
  // to <body>), so a newer tag waits until the one in flight has loaded.
  let loading = false;
  let queued: ISnippetOptions | null = null;
  function settle() {
    loading = false;
    const next = queued;
    queued = null;
    if (next) mount(next);
  }
  function watch(script: HTMLScriptElement) {
    loading = true;
    script.addEventListener('load', settle, { once: true });
    script.addEventListener('error', settle, { once: true });
  }
  function mount(opts: ISnippetOptions) {
    if (!demo) return;
    if (loading) {
      queued = opts;
      return;
    }
    const script = doc.createElement('script');
    script.async = true;
    script.src = '/embed.js';
    script.dataset.mode = opts.mode;
    script.dataset.theme = opts.theme;
    script.dataset.size = opts.size;
    script.dataset.lang = opts.lang ?? 'en';
    if (opts.preset !== 'pinf') script.dataset.preset = opts.preset;
    demo.dataset.size = opts.size;
    watch(script);
    demo.replaceChildren(script);
  }
  // The build-time tag may still be loading when the builder is first used.
  const initial = demo?.querySelector('script');
  if (initial) watch(initial);

  let mounted = '';
  const render = () => {
    const opts = readSnippetForm(new FormData(form));
    const tag = loaderSnippet(opts);
    out.replaceChildren(
      ...snippetParts(tag).map((p) => {
        if (!p.name) return doc.createTextNode(p.text);
        const attr = doc.createElement('span');
        attr.className = 'at-snip-attr';
        const name = doc.createElement('span');
        name.dataset.tok = 'k';
        name.textContent = p.name;
        const value = doc.createElement('span');
        value.dataset.tok = 's';
        value.textContent = p.value ?? '';
        attr.append(p.text, name, '=', value);
        return attr;
      }),
    );
    if (status) status.textContent = '';
    copy?.removeAttribute('data-copied');
    for (const note of root.querySelectorAll<HTMLElement>('[data-mode-note]'))
      note.hidden = note.dataset.modeNote !== opts.mode;
    if (box) box.textContent = boxLabel(opts, demo?.clientWidth ?? 0);
    // Remount the live widget when what it shows changes (the page's own origin serves /embed.js).
    const key = `${opts.mode}|${opts.theme}|${opts.size}|${opts.lang ?? 'en'}|${opts.preset}`;
    if (mounted && key !== mounted) mount(opts);
    mounted = key;
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
  });
  render();

  let reset = 0;
  copy?.addEventListener('click', () => {
    void win.navigator.clipboard.writeText(out.textContent).then(() => {
      if (status) status.textContent = status.dataset.copied ?? '';
      copy.setAttribute('data-copied', '');
      win.clearTimeout(reset);
      reset = win.setTimeout(() => {
        if (status) status.textContent = '';
        copy.removeAttribute('data-copied');
      }, 2000);
    });
  });
}
