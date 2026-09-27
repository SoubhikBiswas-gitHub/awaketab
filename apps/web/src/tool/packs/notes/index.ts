import type { Editor } from '@tiptap/core';
import { hasFeature, type IToolCtx } from '../../ctx.js';
import { dateLong, dayDiff, hm } from '../../format.js';
import { t } from '../../i18n.js';
import { openDialog } from '../../ui/dialog.js';
import { moreCss } from '../../ui/more-css.js';
import { toast } from '../../ui/toast.js';
import { liveSession } from '../../ui/view.js';
import { canEdit, type INote, type INotesData, listNotes, loadNotes, newNote, noteName, saveNotes } from './data.js';
import { insertSpoken, makeEditor, newItem, newLine, runTool, type TTool, toolOn } from './editor.js';
import href from './notes.css?url';
import { countWords, toMarkdown, toText } from './text.js';
import { createVoice, speechLang, type TVoiceState, voiceSupported } from './voice.js';

const SAVE_MS = 600;
const SHIFT_MS = 60_000;
const SHIFTS = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
] as const;

let css: Promise<void> | undefined;
function sheet(): Promise<void> {
  css ??= new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = link.onerror = () => {
      resolve();
    };
    document.head.append(link);
  });
  return css;
}

interface IPanel {
  open: (opener?: Element | null) => void;
}

let panel: IPanel | undefined;

export function openNotes(ctx: IToolCtx, opener?: Element | null): void {
  const d = document.querySelector<HTMLDialogElement>('[data-dialog="notes"]');
  if (!d) return;
  if (d.open) {
    d.querySelector<HTMLElement>('.at-notes-doc')?.focus();
    return;
  }
  void Promise.all([sheet(), moreCss()]).then(() => {
    panel ??= mount(ctx, d);
    panel.open(opener);
  });
}

function mount(ctx: IToolCtx, d: HTMLDialogElement): IPanel {
  const q = (sel: string) => d.querySelector<HTMLElement>(sel);
  const need = (sel: string): HTMLElement => {
    const n = q(sel);
    if (!n) throw new Error(`notes: ${sel}`);
    return n;
  };
  const html = document.documentElement;
  const lang = html.lang || 'en';
  const spaced = !/^(?:ja|zh)/u.test(lang);
  const pad = need('[data-notes-pad]');
  const host = need('[data-notes-editor]');
  const title = need('[data-notes-title]') as HTMLInputElement;
  const tools = [...d.querySelectorAll<HTMLButtonElement>('.at-notes-tools button')];
  const mic = need('[data-notes-mic]') as HTMLButtonElement;
  const listen = need('[data-notes-listen]');
  const interim = need('[data-notes-interim]');
  const consent = need('[data-notes-consent]');
  const ro = need('[data-notes-ro]');
  const pv = need('[data-notes-pv]');
  const proCard = need('[data-notes-pro]');
  const listBtn = need('[data-notes-all]') as HTMLButtonElement;
  const list = need('[data-notes-list]');
  const items = need('[data-notes-items]');
  const none = need('[data-notes-none]');
  const search = need('[data-notes-search]') as HTMLInputElement;
  const words = need('[data-notes-words]');
  const state = need('[data-notes-state]');
  const said = need('[data-notes-said]');
  const acts = need('[data-notes-acts]');
  const confirm = need('[data-notes-confirm]');
  const clearBtn = need('[data-notes-clear]') as HTMLButtonElement;
  const live = need('[data-notes-live]');
  const src = ctx.root.querySelector('.at-face-bold');
  const pillText = ctx.root.querySelector('[data-pill-text]');

  let data: INotesData = { v: 1, notes: [] };
  let cur: INote = newNote();
  let previewing = false;
  let timer = 0;
  let dirty = false;
  let failed = false;
  let heard = false;
  let lastInput = Date.now();
  let shift = 0;
  let loops: number[] = [];
  let undoTimer = 0;

  const unlocked = () => previewing || hasFeature(ctx, 'ambient.packs');
  const editable = () => canEdit(data, cur.id, unlocked());
  const stored = (n: INote) => data.notes.some((x) => x.id === n.id);

  const say = (text: string) => {
    said.textContent = '';
    requestAnimationFrame(() => {
      said.textContent = text;
    });
  };

  const ed: Editor = makeEditor(host, {
    placeholder: t('tool.notes.placeholder'),
    label: t('tool.notes.label'),
    check: (text) => t('tool.notes.check', { text: text.trim() || t('tool.notes.emptyItem') }),
    change: () => {
      lastInput = Date.now();
      if (!editable()) return;
      cur.doc = ed.getJSON();
      cur.updatedAt = Date.now();
      if (!stored(cur)) data.notes.push(cur);
      schedule();
      paintCount();
      paintTools();
    },
    select: () => {
      paintTools();
    },
  });

  // Saving: debounced while typing, at once on close, on hide and before the page goes away.
  let announced = false;
  const setState = (kind: 'saving' | 'saved' | 'fail' | '') => {
    state.dataset.kind = kind;
    if (kind === 'saving') state.textContent = t('tool.notes.saving');
    else if (kind === 'saved') state.textContent = t('tool.notes.savedAt', { time: hm(Date.now()) });
    else if (kind === 'fail') state.textContent = t('tool.notes.saveFail');
    else state.textContent = '';
  };
  const persist = async () => {
    window.clearTimeout(timer);
    if (!dirty) return;
    dirty = false;
    data.current = cur.id;
    try {
      await saveNotes(data);
      failed = false;
      setState('saved');
      // Heard once per opening; after that the visible line keeps the time without repeating itself.
      if (!announced) {
        announced = true;
        say(t('tool.notes.saved'));
      }
    } catch {
      failed = true;
      setState('fail');
      say(t('tool.notes.saveFail'));
    }
  };
  const schedule = () => {
    dirty = true;
    if (!failed) setState('saving');
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void persist(), SAVE_MS);
  };
  const flush = () => {
    if (cur.doc || cur.title) cur.doc = ed.getJSON();
    void persist();
  };

  const paintCount = () => {
    words.textContent = t('tool.notes.words', { n: countWords(ed.getText({ blockSeparator: '\n' }), lang) });
  };

  const paintTools = () => {
    const off = !editable();
    for (const b of tools) {
      const cmd = b.dataset.cmd as TTool | undefined;
      if (cmd) b.setAttribute('aria-pressed', String(!off && toolOn(ed, cmd)));
      b.setAttribute('aria-disabled', String(off));
    }
  };

  // The awake screen never sells: the Pro link hides while a session is live (DECISIONS.md, previews).
  const paintPro = () => {
    const see = need('[data-notes-see]');
    see.hidden = !!liveSession(ctx.store.get());
  };

  const whenLabel = (ms: number) =>
    dayDiff(ms) === 0 ? hm(ms) : `${dateLong(ms, new Date(ms).getFullYear() !== new Date().getFullYear())} · ${hm(ms)}`;

  const paintList = () => {
    const open = unlocked();
    const rows = listNotes(data.notes, search.value);
    items.replaceChildren(
      ...rows.map((n) => {
        const li = document.createElement('li');
        li.className = 'at-notes-item';
        li.dataset.id = n.id;
        const pick = document.createElement('button');
        pick.type = 'button';
        pick.className = 'at-notes-pick';
        pick.setAttribute('aria-current', String(n.id === cur.id));
        const name = document.createElement('span');
        name.className = 'at-notes-name';
        name.textContent = noteName(n) || t('tool.notes.untitled');
        const meta = document.createElement('span');
        meta.className = 'at-notes-when';
        meta.textContent = t('tool.notes.edited', { when: whenLabel(n.updatedAt) });
        pick.append(name, meta);
        if (!canEdit(data, n.id, open)) {
          const tag = document.createElement('span');
          tag.className = 'at-tag';
          tag.textContent = t('tool.notes.readonlyTag');
          pick.append(tag);
        }
        pick.addEventListener('click', () => {
          choose(n);
          showList(false);
          ed.commands.focus('end');
        });
        li.append(pick);
        if (open) {
          const pin = document.createElement('button');
          pin.type = 'button';
          pin.className = 'at-icon-button at-notes-pin';
          pin.setAttribute('aria-pressed', String(!!n.pinned));
          pin.setAttribute(
            'aria-label',
            t(n.pinned ? 'tool.notes.unpin' : 'tool.notes.pin', { name: noteName(n) || t('tool.notes.untitled') }),
          );
          pin.innerHTML =
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3.5h6l-1 5.5 3.5 3.5h-11L10 9zM12 12.5v8"/></svg>';
          pin.addEventListener('click', () => {
            if (n.pinned) delete n.pinned;
            else n.pinned = true;
            dirty = true;
            void persist();
            paintList();
            d.querySelector<HTMLElement>(`[data-id="${CSS.escape(n.id)}"] .at-notes-pin`)?.focus();
          });
          li.append(pin);
        }
        return li;
      }),
    );
    none.hidden = rows.length > 0;
  };

  const showList = (on: boolean) => {
    list.hidden = !on;
    pad.hidden = on;
    listBtn.setAttribute('aria-expanded', String(on));
    if (on) {
      paintList();
      search.focus();
    }
  };

  const render = () => {
    const open = unlocked();
    const pro = hasFeature(ctx, 'ambient.packs');
    const many = data.notes.length > 1;
    listBtn.hidden = !open && !many;
    need('[data-notes-count]').textContent = String(data.notes.length || 1);
    need('[data-notes-pro-tag]').hidden = pro;
    pv.hidden = !previewing;
    title.hidden = !open && !many && !cur.title;
    title.readOnly = !editable();
    if (document.activeElement !== title) title.value = cur.title;
    const can = editable();
    ro.hidden = can;
    ed.setEditable(can, false);
    mic.hidden = !voiceSupported();
    need('[data-notes-novoice]').hidden = voiceSupported();
    clearBtn.textContent = t(many ? 'tool.notes.delete' : 'tool.notes.clear');
    if (!can) voice.stop();
    paintTools();
    paintCount();
    paintPro();
    if (!list.hidden) paintList();
  };

  const choose = (n: INote) => {
    flush();
    voice.stop();
    cur = n;
    ed.commands.setContent(n.doc ?? '', { emitUpdate: false });
    render();
  };

  const add = () => {
    flush();
    const n = newNote();
    data.notes.push(n);
    dirty = true;
    void persist();
    choose(n);
    showList(false);
    title.hidden = false;
    title.focus();
  };

  // Voice: interim words shown softly under the text, final words at the cursor, three spoken commands.
  let voiceWasOn = false;
  const voiceLine = (s: TVoiceState) => {
    listen.dataset.kind = s;
    listen.hidden = s === 'idle';
    const text = s === 'idle' ? '' : t(`tool.notes.voice.${s}`);
    need('[data-notes-listen-text]').textContent = text;
    mic.setAttribute('aria-pressed', String(s === 'listening'));
    mic.setAttribute('aria-label', t(s === 'listening' ? 'tool.notes.voice.stop' : 'tool.notes.voice.start'));
    mic.toggleAttribute('data-on', s === 'listening');
    if (text) say(text);
    else if (voiceWasOn) say(t('tool.notes.voice.stopped'));
    voiceWasOn = s === 'listening';
  };
  const voice = createVoice({
    lang: speechLang(lang),
    commands: {
      line: t('tool.notes.voice.cmdLine'),
      item: t('tool.notes.voice.cmdItem'),
      stop: t('tool.notes.voice.cmdStop'),
    },
    text: (w) => {
      if (editable()) insertSpoken(ed, w, spaced);
    },
    line: () => {
      if (editable()) newLine(ed);
    },
    item: () => {
      if (editable()) newItem(ed);
    },
    interim: (w) => {
      interim.textContent = w;
      interim.toggleAttribute('data-on', !!w);
    },
    heard: (on) => {
      if (on === heard) return;
      heard = on;
      mic.toggleAttribute('data-heard', on);
    },
    state: voiceLine,
  });

  const startVoice = () => {
    if (!editable()) return;
    if (!data.voiceOk) {
      consent.hidden = false;
      q('[data-notes-consent-ok]')?.focus();
      return;
    }
    ed.commands.focus();
    voice.start();
  };

  mic.addEventListener('click', () => {
    if (voice.on()) voice.stop();
    else startVoice();
  });
  q('[data-notes-consent-ok]')?.addEventListener('click', () => {
    data.voiceOk = true;
    dirty = true;
    void persist();
    consent.hidden = true;
    startVoice();
  });
  q('[data-notes-consent-no]')?.addEventListener('click', () => {
    consent.hidden = true;
    mic.focus();
  });

  // Toolbar: one tab stop, arrows move between the buttons (ARIA toolbar pattern).
  const bar = need('.at-notes-tools');
  const mod = /Mac|iPhone|iPad/u.test(navigator.userAgent) ? '⌘' : 'Ctrl';
  for (const b of tools) {
    const keys = b.dataset.keys;
    if (keys) b.title = `${b.getAttribute('aria-label') ?? ''} · ${mod}+${keys}`;
  }
  bar.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('button[data-cmd]');
    if (!b || b.getAttribute('aria-disabled') === 'true') return;
    runTool(ed, b.dataset.cmd as TTool);
    paintTools();
  });
  bar.addEventListener('keydown', (e) => {
    const shown = tools.filter((b) => !b.hidden);
    const i = shown.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const step = (e.key === 'ArrowRight') === (getComputedStyle(bar).direction !== 'rtl') ? 1 : -1;
      next = (i + step + shown.length) % shown.length;
    } else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = shown.length - 1;
    if (next < 0) return;
    e.preventDefault();
    for (const b of shown) b.tabIndex = -1;
    const to = shown[next];
    if (to) {
      to.tabIndex = 0;
      to.focus();
    }
  });

  title.addEventListener('input', () => {
    if (!editable()) return;
    cur.title = title.value.slice(0, 120);
    cur.updatedAt = Date.now();
    if (!stored(cur)) data.notes.push(cur);
    schedule();
  });
  title.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      ed.commands.focus('start');
    }
  });

  listBtn.addEventListener('click', () => {
    showList(list.hidden);
  });
  search.addEventListener('input', paintList);
  need('[data-notes-new]').addEventListener('click', () => {
    if (unlocked()) {
      add();
      return;
    }
    proCard.hidden = !proCard.hidden;
    if (!proCard.hidden) {
      paintPro();
      q('[data-notes-try]')?.focus();
    }
  });
  q('[data-notes-try]')?.addEventListener('click', () => {
    void import('../themes/preview.js').then((m) => {
      m.startPreview(ctx, {
        kind: 'notes',
        id: 'notes',
        label: t('tool.notes.proName'),
        back: t('tool.notes.proBack'),
        said: t('tool.notes.proSaid'),
        apply: () => {
          previewing = true;
        },
        revert: () => {
          flush();
          previewing = false;
          render();
        },
      });
      proCard.hidden = true;
      add();
    });
  });
  q('[data-notes-pro-close]')?.addEventListener('click', () => {
    proCard.hidden = true;
    need('[data-notes-new]').focus();
  });
  q('[data-notes-see]')?.addEventListener('click', () => {
    const sheet = document.querySelector<HTMLDialogElement>('[data-dialog="pro"]');
    ctx.track('pro_view', { from: 'notes' });
    if (sheet) openDialog(sheet);
  });

  // Copy and export work on read-only notes too.
  const docOf = () => ed.getJSON();
  const fileName = (ext: string) => {
    const slug = (noteName(cur) || 'note')
      .toLocaleLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-|-$/gu, '')
      .slice(0, 40);
    const day = new Date().toISOString().slice(0, 10);
    return `awaketab-${slug || 'note'}-${day}.${ext}`;
  };
  const withTitle = (body: string, md: boolean) =>
    cur.title.trim() ? `${md ? '# ' : ''}${cur.title.trim()}\n\n${body}` : body;
  q('[data-notes-copy]')?.addEventListener('click', () => {
    void navigator.clipboard.writeText(withTitle(toText(docOf()), false)).then(
      () => {
        toast(ctx.store, { kind: 'success', id: 'notes', text: t('tool.notes.copied') });
      },
      () => {
        toast(ctx.store, { kind: 'error', id: 'notes', text: t('tool.notes.copyFail') });
      },
    );
  });
  for (const b of d.querySelectorAll<HTMLButtonElement>('[data-notes-export]')) {
    b.addEventListener('click', () => {
      const md = b.dataset.notesExport === 'md';
      const body = withTitle(md ? toMarkdown(docOf()) : toText(docOf()), md);
      const url = URL.createObjectURL(new Blob([`${body}\n`], { type: md ? 'text/markdown' : 'text/plain' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName(md ? 'md' : 'txt');
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    });
  }

  const ask = (on: boolean, focus = true) => {
    acts.hidden = on;
    confirm.hidden = !on;
    if (on) {
      const many = data.notes.length > 1;
      need('[data-notes-confirm-q]').textContent = t(many ? 'tool.notes.deleteQ' : 'tool.notes.clearQ');
      need('[data-notes-confirm-yes]').textContent = t(many ? 'tool.notes.delete' : 'tool.notes.clear');
      q('[data-notes-confirm-no]')?.focus();
    } else if (focus) clearBtn.focus();
  };
  clearBtn.addEventListener('click', () => {
    if (editable() || data.notes.length > 1) ask(true);
  });
  q('[data-notes-confirm-no]')?.addEventListener('click', () => {
    ask(false);
  });
  q('[data-notes-confirm-yes]')?.addEventListener('click', () => {
    voice.stop();
    if (data.notes.length > 1) {
      data.notes = data.notes.filter((n) => n.id !== cur.id);
      dirty = true;
      const next = listNotes(data.notes)[0] ?? newNote();
      cur = next;
      ed.commands.setContent(next.doc ?? '', { emitUpdate: false });
      void persist();
      render();
      acts.hidden = false;
      confirm.hidden = true;
      say(t('tool.notes.deleted'));
      ed.commands.focus('end');
      return;
    }
    ed.chain().focus().clearContent(true).run();
    acts.hidden = false;
    confirm.hidden = true;
    const undo = need('[data-notes-undo]') as HTMLButtonElement;
    undo.hidden = false;
    say(t('tool.notes.cleared'));
    window.clearTimeout(undoTimer);
    undoTimer = window.setTimeout(() => {
      undo.hidden = true;
    }, 10_000);
  });
  q('[data-notes-undo]')?.addEventListener('click', (e) => {
    ed.chain().focus().undo().run();
    (e.currentTarget as HTMLElement).hidden = true;
  });

  // The pill sits under the sheet on desktop, so its words and the time ride along here (hidden from readers,
  // who hear the real pill).
  const mirror = () => {
    const a = src?.querySelector('[data-t="a"]')?.textContent ?? '';
    const b = src?.querySelector('[data-t="b"]')?.textContent ?? '';
    const pill = pillText?.textContent ?? '';
    const running = !!liveSession(ctx.store.get());
    live.textContent = running && a ? `${pill} · ${a}${b}` : pill;
  };

  // Burn-in: while the sheet sits untouched for a minute, the page of text moves by a pixel, instantly.
  const nudge = () => {
    if (Date.now() - lastInput < SHIFT_MS) return;
    shift = (shift + 1) % SHIFTS.length;
    const [x, y] = SHIFTS[shift] ?? [0, 0];
    pad.style.translate = `${String(x)}px ${String(y)}px`;
  };
  d.addEventListener('pointerdown', () => {
    lastInput = Date.now();
    pad.style.translate = '';
  });

  // Esc stops dictation first; the next Esc closes the sheet.
  let swallow = false;
  d.addEventListener(
    'keydown',
    (e) => {
      lastInput = Date.now();
      pad.style.translate = '';
      if (e.key !== 'Escape' || (!voice.on() && confirm.hidden)) return;
      e.preventDefault();
      e.stopPropagation();
      // The dialog's own cancel for this same key press is refused, then the next Esc closes as usual.
      swallow = true;
      setTimeout(() => {
        swallow = false;
      });
      if (voice.on()) voice.stop();
      else ask(false);
    },
    true,
  );
  d.addEventListener('cancel', (e) => {
    if (swallow) e.preventDefault();
  });

  d.addEventListener('close', () => {
    voice.stop();
    flush();
    for (const l of loops) window.clearInterval(l);
    loops = [];
    pad.style.translate = '';
    consent.hidden = true;
  });
  const hide = () => {
    if (document.visibilityState === 'hidden') flush();
    else if (d.open && !dirty) void refresh();
  };
  document.addEventListener('visibilitychange', hide);
  window.addEventListener('pagehide', flush);

  // Another tab may have written since: take the stored copy when nothing here is waiting to be saved.
  const refresh = async () => {
    try {
      const fresh = await loadNotes();
      if (dirty) return;
      data = fresh;
      const again = data.notes.find((n) => n.id === cur.id);
      if (again && again.updatedAt !== cur.updatedAt) {
        cur = again;
        ed.commands.setContent(again.doc ?? '', { emitUpdate: false });
      } else if (again) cur = again;
    } catch {
      failed = true;
      setState('fail');
    }
    render();
  };

  const load = async () => {
    try {
      data = await loadNotes();
    } catch {
      failed = true;
      setState('fail');
    }
    const first = data.notes.find((n) => n.id === data.current) ?? listNotes(data.notes)[0];
    cur = first ?? newNote();
    ed.commands.setContent(cur.doc ?? '', { emitUpdate: false });
  };
  let ready: Promise<void> | undefined;

  return {
    open: (opener) => {
      ready = ready ? refresh() : load();
      void ready.then(() => {
        announced = false;
        const kept = stored(cur);
        if (!failed) {
          state.dataset.kind = kept ? 'saved' : '';
          state.textContent = kept ? t('tool.notes.here') : '';
        }
        previewing = previewing && html.dataset.preview === 'notes';
        render();
        showList(false);
        proCard.hidden = true;
        ask(false, false);
        mirror();
        loops = [window.setInterval(mirror, 1000), window.setInterval(nudge, SHIFT_MS)];
        lastInput = Date.now();
        openDialog(d, opener ?? document.activeElement);
        // Keyboards land in the text; touch screens keep the keyboard closed until the page is tapped.
        if (matchMedia('(hover: hover) and (pointer: fine)').matches)
          requestAnimationFrame(() => {
            if (d.open) ed.commands.focus('end');
          });
      });
    },
  };
}
