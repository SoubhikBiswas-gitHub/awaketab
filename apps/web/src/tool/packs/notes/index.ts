import type { Editor, JSONContent } from '@tiptap/core';
import { closeHistory } from '@tiptap/pm/history';
import { hasFeature, type IToolCtx } from '../../ctx.js';
import { hm } from '../../format.js';
import { t } from '../../i18n.js';
import { openDialog } from '../../ui/dialog.js';
import { moreCss } from '../../ui/more-css.js';
import { toast } from '../../ui/toast.js';
import { liveSession } from '../../ui/view.js';
import { canEdit, type INote, type INotesData, listNotes, loadNotes, newNote, noteName, saveNotes } from './data.js';
import {
  insertSpoken,
  makeEditor,
  newItem,
  newLine,
  runTool,
  showInterim,
  slashExit,
  slashRun,
  type TBlock,
  type TTool,
  toolOn,
} from './editor.js';
import href from './notes.css?url';
import { countWords, dayLabel, toMarkdown, toText } from './text.js';
import { createVoice, speechLang, type TVoiceState, voiceSupported } from './voice.js';

const SAVE_MS = 600;
const SHIFT_MS = 60_000;
const UNDO_MS = 10_000;
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
  open: (opener?: Element | null, take?: () => string) => Promise<void>;
}

let panel: IPanel | undefined;

// `take` hands over the keys pressed while the pack loaded, typed in as the drawer opens.
export async function openNotes(ctx: IToolCtx, opener?: Element | null, take?: () => string): Promise<void> {
  const d = document.querySelector<HTMLDialogElement>('[data-dialog="notes"]');
  if (!d) return;
  if (d.open) {
    d.querySelector<HTMLElement>('.at-notes-doc')?.focus();
    return;
  }
  await Promise.all([sheet(), moreCss()]);
  panel ??= mount(ctx, d);
  await panel.open(opener, take);
}

function mount(ctx: IToolCtx, d: HTMLDialogElement): IPanel {
  const q = (sel: string) => d.querySelector<HTMLElement>(sel);
  const all = <T extends HTMLElement = HTMLElement>(sel: string) => [...d.querySelectorAll<T>(sel)];
  const need = (sel: string): HTMLElement => {
    const n = q(sel);
    if (!n) throw new Error(`notes: ${sel}`);
    return n;
  };
  const html = document.documentElement;
  const lang = html.lang || 'en';
  const spaced = !/^(?:ja|zh)/u.test(lang);
  const fine = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
  const wide = matchMedia('(width >= 1024px)');
  const still = () =>
    matchMedia('(prefers-reduced-motion: reduce)').matches || ctx.store.get().settings.reduceMotion === 'on';
  const pad = need('[data-notes-pad]');
  const host = need('[data-notes-editor]');
  const panes = need('[data-notes-panes]');
  const main = need('[data-notes-main]');
  const bubble = need('[data-notes-bubble]');
  const tools = all<HTMLButtonElement>('.at-notes-bubble button');
  const slash = need('[data-notes-slash]');
  const opts = all('[data-block]');
  const mic = need('[data-notes-mic]') as HTMLButtonElement;
  const listen = need('[data-notes-listen]');
  const novoice = need('[data-notes-novoice]');
  const consent = need('[data-notes-consent]');
  const ro = need('[data-notes-ro]');
  const pv = need('[data-notes-pv]');
  const fail = need('[data-notes-fail]');
  const proCard = need('[data-notes-pro]');
  const listBtn = need('[data-notes-all]') as HTMLButtonElement;
  const list = need('[data-notes-list]');
  const items = need('[data-notes-items]');
  const none = need('[data-notes-none]');
  const search = need('[data-notes-search]') as HTMLInputElement;
  const name = need('[data-notes-name]');
  const state = need('[data-notes-state]');
  const meta = need('[data-notes-meta]');
  const said = need('[data-notes-said]');
  const confirm = need('[data-notes-confirm]');
  const undone = need('[data-notes-undone]');
  const start = need('[data-notes-start]');
  const more = need('[data-notes-more]') as HTMLButtonElement;
  const pop = need('[data-notes-menu]');
  const pinBtn = need('[data-notes-pin]') as HTMLButtonElement;
  const live = need('[data-notes-live]');
  const pinIcon = (q('template[data-notes-pin-icon]') as HTMLTemplateElement | null)?.innerHTML ?? '';
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
  let undo: (() => void) | undefined;

  const unlocked = () => previewing || hasFeature(ctx, 'ambient.packs');
  const editable = () => canEdit(data, cur.id, unlocked());
  const stored = (n: INote) => data.notes.some((x) => x.id === n.id);
  const hasList = () => unlocked() || data.notes.length > 1;

  const say = (text: string) => {
    said.textContent = '';
    requestAnimationFrame(() => {
      said.textContent = text;
    });
  };

  // Floating menus sit in the sheet (the page behind is inert), placed from the caret's screen box and kept
  // inside the sheet: below the caret for "/", above the selection for formatting (below it on touch screens,
  // where the phone's own copy menu sits above).
  const place = (el: HTMLElement, x: number, top: number, bottom: number, below: boolean) => {
    const box = d.getBoundingClientRect();
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const gap = 8;
    const room = box.bottom - (d.querySelector('.at-dialog-footer')?.getBoundingClientRect().height ?? 0);
    let y = below ? bottom + gap : top - h - gap;
    if (below && y + h > room) y = top - h - gap;
    if (!below && y < box.top + gap) y = bottom + gap;
    const left = Math.min(Math.max(x, box.left + gap), box.right - w - gap);
    el.style.left = `${String(Math.round(left - box.left - d.clientLeft))}px`;
    el.style.top = `${String(Math.round(Math.max(y, box.top + gap) - box.top - d.clientTop))}px`;
  };

  // "/" block menu: the editor's plugin tracks the query; this paints the options and runs the chosen one.
  let shown: TBlock[] = [];
  let active = 0;
  let caret: (() => { left: number; top: number; bottom: number }) | undefined;
  const paintSlash = () => {
    for (const o of opts) {
      const on = shown.includes(o.dataset.block as TBlock);
      o.hidden = !on;
      o.setAttribute('aria-selected', String(on && o.dataset.block === shown[active]));
    }
    need('[data-notes-slash-none]').hidden = shown.length > 0;
    const sel = opts.find((o) => o.dataset.block === shown[active]);
    if (sel) {
      ed.view.dom.setAttribute('aria-activedescendant', sel.id);
      sel.scrollIntoView({ block: 'nearest' });
    } else ed.view.dom.removeAttribute('aria-activedescendant');
  };
  const placeSlash = () => {
    if (slash.hidden || !caret) return;
    const c = caret();
    place(slash, c.left, c.top, c.bottom, true);
  };
  const slashHooks = {
    open: (query: string, at: () => { left: number; top: number; bottom: number }) => {
      const needle = query.trim().toLocaleLowerCase();
      const was = slash.hidden ? undefined : shown[active];
      shown = opts
        .filter((o) => !needle || `${o.dataset.k ?? ''} ${o.textContent}`.toLocaleLowerCase().includes(needle))
        .map((o) => o.dataset.block as TBlock);
      active = Math.max(0, was ? shown.indexOf(was) : 0);
      caret = at;
      slash.hidden = false;
      ed.view.dom.setAttribute('aria-controls', 'at-notes-slash-list');
      ed.view.dom.setAttribute('aria-expanded', 'true');
      paintSlash();
      placeSlash();
    },
    close: () => {
      slash.hidden = true;
      caret = undefined;
      for (const a of ['aria-activedescendant', 'aria-controls', 'aria-expanded']) ed.view.dom.removeAttribute(a);
    },
    key: (e: KeyboardEvent) => {
      const n = shown.length;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (n) active = (active + (e.key === 'ArrowDown' ? 1 : -1) + n) % n;
        paintSlash();
        return true;
      }
      const b = shown[active];
      if ((e.key === 'Enter' || e.key === 'Tab') && b) {
        slashRun(ed, b);
        return true;
      }
      return false;
    },
  };
  slash.addEventListener('mousedown', (e) => {
    e.preventDefault();
  });
  slash.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-block]')?.dataset.block as TBlock | undefined;
    if (b) slashRun(ed, b);
  });

  const ed: Editor = makeEditor(host, {
    placeholder: (empty) => t(empty ? 'tool.notes.placeholder' : 'tool.notes.slashHint'),
    label: t('tool.notes.label'),
    check: (text) => t('tool.notes.check', { text: text.trim() || t('tool.notes.emptyItem') }),
    slash: slashHooks,
    change: () => {
      lastInput = Date.now();
      if (!editable()) return;
      cur.doc = ed.getJSON();
      cur.updatedAt = Date.now();
      if (!stored(cur)) data.notes.push(cur);
      schedule();
      paintNote();
      paintTools();
      if (!list.hidden) paintList();
    },
    select: () => {
      paintTools();
      placeBubble();
    },
  });

  // The selection menu shows for a text selection while the text (or the menu itself) has focus.
  const touch = matchMedia('(pointer: coarse)');
  const placeBubble = () => {
    const { state, view } = ed;
    const { from, to, empty } = state.selection;
    const on =
      !empty &&
      editable() &&
      (view.hasFocus() || bubble.contains(document.activeElement)) &&
      !!state.doc.textBetween(from, to, ' ').trim();
    if (!on) {
      bubble.hidden = true;
      return;
    }
    bubble.hidden = false;
    const a = view.coordsAtPos(from);
    const b = view.coordsAtPos(to);
    const one = Math.abs(a.top - b.top) < 4;
    const x = one ? (a.left + b.right) / 2 - bubble.offsetWidth / 2 : a.left;
    place(bubble, x, Math.min(a.top, b.top), Math.max(a.bottom, b.bottom), touch.matches);
  };
  ed.on('focus', placeBubble);
  ed.on('blur', () => {
    setTimeout(placeBubble);
  });
  for (const el of [main, panes]) {
    el.addEventListener(
      'scroll',
      () => {
        placeSlash();
        if (!bubble.hidden) placeBubble();
      },
      { passive: true },
    );
  }

  // Saving: debounced while typing, at once on close, on hide and before the page goes away.
  let announced = false;
  const setState = (kind: 'saving' | 'saved' | 'fail' | '') => {
    state.dataset.kind = kind;
    fail.hidden = kind !== 'fail';
    if (kind === 'saving') state.textContent = t('tool.notes.saving');
    else if (kind === 'saved') state.textContent = t('tool.notes.saved');
    else if (kind === 'fail') state.textContent = t('tool.notes.notSaved');
    else state.textContent = '';
    state.title = kind === 'saved' ? t('tool.notes.savedAt', { time: hm(Date.now()) }) : '';
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
      // Heard once per opening; after that the visible dot keeps quiet.
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

  const whenLabel = (ms: number) => `${dayLabel(ms, Date.now(), lang)} · ${hm(ms)}`;

  const paintNote = () => {
    const n = noteName(cur);
    name.textContent = n || t('tool.notes.fresh');
    name.toggleAttribute('data-empty', !n);
    start.hidden = !editable() || !ed.isEmpty;
    const w = t('tool.notes.words', { n: countWords(ed.getText({ blockSeparator: '\n' }), lang) });
    meta.textContent = stored(cur) ? `${w} · ${t('tool.notes.edited', { when: whenLabel(cur.updatedAt) })}` : w;
  };

  const paintTools = () => {
    const off = !editable();
    for (const b of tools) {
      const cmd = b.dataset.cmd as TTool | undefined;
      if (cmd) b.setAttribute('aria-pressed', String(!off && toolOn(ed, cmd)));
    }
  };

  // The awake screen never sells: the Pro link hides while a session is live (DECISIONS.md, previews).
  const paintPro = () => {
    need('[data-notes-see]').hidden = !!liveSession(ctx.store.get());
  };

  const paintList = () => {
    const open = unlocked();
    const rows = listNotes(data.notes, search.value);
    items.replaceChildren(
      ...rows.map((n) => {
        const label = noteName(n) || t('tool.notes.untitled');
        const li = document.createElement('li');
        li.className = 'at-notes-item';
        li.dataset.id = n.id;
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'at-notes-pick';
        row.setAttribute('aria-current', String(n.id === cur.id));
        const nm = document.createElement('span');
        nm.className = 'at-notes-iname';
        nm.textContent = label;
        const when = document.createElement('span');
        when.className = 'at-notes-when';
        when.textContent = whenLabel(n.updatedAt);
        row.append(nm, when);
        if (!canEdit(data, n.id, open)) {
          const tag = document.createElement('span');
          tag.className = 'at-tag';
          tag.textContent = t('tool.notes.readonlyTag');
          row.append(tag);
        }
        row.addEventListener('click', () => {
          choose(n);
          if (!wide.matches) showList(false);
          if (fine()) ed.commands.focus('end');
        });
        li.append(row);
        if (open || n.pinned) {
          const pin = document.createElement('button');
          pin.type = 'button';
          pin.className = 'at-icon-button at-notes-pin';
          pin.setAttribute('aria-pressed', String(!!n.pinned));
          pin.setAttribute('aria-label', t(n.pinned ? 'tool.notes.unpin' : 'tool.notes.pin', { name: label }));
          pin.innerHTML = pinIcon;
          pin.disabled = !open;
          pin.addEventListener('click', () => {
            togglePin(n);
            d.querySelector<HTMLElement>(`[data-id="${CSS.escape(n.id)}"] .at-notes-pin`)?.focus();
          });
          li.append(pin);
        }
        return li;
      }),
    );
    none.hidden = rows.length > 0;
  };

  const togglePin = (n: INote) => {
    if (n.pinned) delete n.pinned;
    else n.pinned = true;
    if (!stored(n)) data.notes.push(n);
    dirty = true;
    void persist();
    paintList();
    pinBtn.setAttribute('aria-checked', String(!!cur.pinned));
  };

  // Phones and tablets swipe between the list and the page (scroll snap); from 1024 px the list is a column.
  let listOpen = false;
  const showList = (on: boolean, focus = false, jump = false) => {
    listOpen = on && hasList();
    listBtn.setAttribute('aria-expanded', String(listOpen));
    list.inert = !listOpen;
    if (wide.matches) {
      d.toggleAttribute('data-list', listOpen);
      main.inert = false;
    } else {
      d.removeAttribute('data-list');
      main.inert = listOpen;
      // The list is the first pane; scroll positions run negative on RTL pages.
      const end = (panes.scrollWidth - panes.clientWidth) * (getComputedStyle(d).direction === 'rtl' ? -1 : 1);
      panes.scrollTo({ left: listOpen ? 0 : end, behavior: jump || still() ? 'instant' : 'smooth' });
    }
    if (listOpen) {
      paintList();
      if (focus) (fine() ? search : list.querySelector<HTMLElement>('[aria-current="true"]'))?.focus();
    }
  };
  // The pane out of view is inert, so Tab and screen readers stay on the one in front.
  const seen = new IntersectionObserver(
    (entries) => {
      if (wide.matches || !d.open) return;
      for (const e of entries) (e.target as HTMLElement).inert = e.intersectionRatio < 0.5;
      listOpen = !list.inert && !list.hidden;
      listBtn.setAttribute('aria-expanded', String(listOpen));
    },
    { root: panes, threshold: [0, 0.5, 1] },
  );
  seen.observe(list);
  seen.observe(main);
  wide.addEventListener('change', () => {
    list.inert = main.inert = false;
    showList(listOpen);
  });

  const render = () => {
    const open = unlocked();
    const pro = hasFeature(ctx, 'ambient.packs');
    const withList = hasList();
    d.toggleAttribute('data-unlocked', open);
    list.hidden = !withList;
    listBtn.hidden = !withList;
    need('[data-notes-count]').textContent = String(data.notes.length || 1);
    pv.hidden = !previewing || pro;
    const can = editable();
    ro.hidden = can;
    ed.setEditable(can, false);
    mic.toggleAttribute('data-off', !voiceSupported());
    pinBtn.setAttribute('aria-checked', String(!!cur.pinned));
    need('[data-notes-clear-label]').textContent = t(
      data.notes.length > 1 ? 'tool.notes.delete' : 'tool.notes.clearNote',
    );
    if (!can) voice.stop();
    paintTools();
    paintNote();
    paintPro();
    if (withList) paintList();
    else showList(false);
  };

  // Older notes kept their title in a field; the title is now the first line, so it moves into the text.
  const adopt = (n: INote) => {
    const title = n.title.trim();
    if (!title || !canEdit(data, n.id, unlocked())) return;
    const head: JSONContent = { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: title }] };
    n.doc = { type: 'doc', content: [head, ...(n.doc?.content ?? [])] };
    n.title = '';
    dirty = true;
  };

  const choose = (n: INote) => {
    flush();
    voice.stop();
    adopt(n);
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
    if (!wide.matches) showList(false);
    ed.commands.focus('start');
  };

  const offerPro = () => {
    if (!wide.matches) showList(false);
    proCard.hidden = false;
    paintPro();
    q('[data-notes-try]')?.focus();
  };

  // Voice: interim words drawn softly at the cursor, final words typed in, three spoken commands.
  let voiceWasOn = false;
  const voiceLine = (s: TVoiceState) => {
    listen.dataset.kind = s;
    listen.hidden = s === 'idle';
    const text = s === 'idle' ? '' : t(`tool.notes.voice.${s}`);
    need('[data-notes-listen-text]').textContent = text;
    // The visible word changes (Dictate, Stop), so the name changes with it instead of a pressed state.
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
      showInterim(ed, '');
      if (editable()) insertSpoken(ed, w, spaced);
    },
    line: () => {
      if (editable()) newLine(ed);
    },
    item: () => {
      if (editable()) newItem(ed);
    },
    interim: (w) => {
      showInterim(ed, w.trim() ? `${spaced ? ' ' : ''}${w.trim()}` : '');
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
    if (!voiceSupported()) {
      novoice.hidden = !novoice.hidden;
      return;
    }
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

  // Selection menu: one tab stop, arrows move between the buttons (ARIA toolbar pattern); Alt+F10 reaches it.
  const mod = /Mac|iPhone|iPad/u.test(navigator.userAgent) ? '⌘' : 'Ctrl';
  for (const b of tools) {
    const keys = b.dataset.keys;
    if (keys) b.title = `${b.getAttribute('aria-label') ?? ''} · ${mod}+${keys}`;
  }
  bubble.addEventListener('mousedown', (e) => {
    e.preventDefault();
  });
  bubble.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('button[data-cmd]');
    if (!b || !editable()) return;
    runTool(ed, b.dataset.cmd as TTool);
    paintTools();
  });
  const roving = (box: HTMLElement[], e: KeyboardEvent, vertical: boolean) => {
    const i = box.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    const fwd = vertical ? 'ArrowDown' : 'ArrowRight';
    const back = vertical ? 'ArrowUp' : 'ArrowLeft';
    const rtl = !vertical && getComputedStyle(d).direction === 'rtl';
    let next = -1;
    if (e.key === fwd || e.key === back) next = (i + ((e.key === fwd) !== rtl ? 1 : -1) + box.length) % box.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = box.length - 1;
    if (next < 0) return;
    e.preventDefault();
    for (const b of box) b.tabIndex = -1;
    const to = box[next];
    if (to) {
      to.tabIndex = 0;
      to.focus();
    }
  };
  bubble.addEventListener('keydown', (e) => {
    roving(tools, e, false);
  });
  bubble.addEventListener('focusout', () => {
    setTimeout(placeBubble);
  });
  host.addEventListener('keydown', (e) => {
    if (e.altKey && e.key === 'F10' && !bubble.hidden) {
      e.preventDefault();
      (tools.find((b) => b.tabIndex === 0) ?? tools[0])?.focus();
    }
  });

  // A tick draws itself and the line settles, only when it was ticked here, never when a note loads.
  host.addEventListener('change', (e) => {
    const box = e.target as HTMLInputElement;
    if (box.type !== 'checkbox' || !box.checked) return;
    const li = box.closest('li');
    li?.classList.add('at-nt-tick');
    setTimeout(() => li?.classList.remove('at-nt-tick'), 900);
  });

  // Starters put a small template in the empty page, with the cursor on its first empty line.
  for (const b of all<HTMLButtonElement>('[data-notes-tpl]')) {
    b.addEventListener('click', () => {
      const tpl = q(`template[data-notes-tpl-html="${b.dataset.notesTpl ?? ''}"]`) as HTMLTemplateElement | null;
      if (!tpl || !editable()) return;
      ed.commands.setContent(tpl.innerHTML);
      let at = -1;
      ed.state.doc.descendants((n, p) => {
        if (at < 0 && n.isTextblock && !n.content.size) at = p + 1;
        return at < 0;
      });
      ed.chain()
        .focus(at < 0 ? 'end' : at)
        .run();
    });
  }

  // The ⋯ menu: arrows move, Esc and Tab close it, focus returns to the button.
  const menuItems = () => all<HTMLButtonElement>('.at-notes-menu [role^="menuitem"]').filter((b) => b.offsetParent);
  const openMenu = () => {
    paintNote();
    pop.hidden = false;
    more.setAttribute('aria-expanded', 'true');
    const first = menuItems()[0];
    for (const b of menuItems()) b.tabIndex = -1;
    if (first) {
      first.tabIndex = 0;
      first.focus();
    }
  };
  const closeMenu = (back = true) => {
    if (pop.hidden) return;
    pop.hidden = true;
    more.setAttribute('aria-expanded', 'false');
    if (back) more.focus();
  };
  more.addEventListener('click', () => {
    if (pop.hidden) openMenu();
    else closeMenu();
  });
  pop.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      closeMenu();
    } else roving(menuItems(), e, true);
  });
  // Runs after the item's own action, which may already have moved focus somewhere useful.
  pop.addEventListener('click', (e) => {
    if (!(e.target as Element).closest('[role^="menuitem"]')) return;
    closeMenu(false);
    const at = document.activeElement;
    if (!at || at === document.body || pop.contains(at)) more.focus();
  });
  d.addEventListener('pointerdown', (e) => {
    const el = e.target as Element;
    if (!pop.hidden && !pop.contains(el) && !more.contains(el)) closeMenu(false);
  });

  listBtn.addEventListener('click', () => {
    showList(!listOpen, true);
  });
  search.addEventListener('input', paintList);
  for (const b of all('[data-notes-new]'))
    b.addEventListener('click', () => {
      if (unlocked()) add();
      else offerPro();
    });
  pinBtn.addEventListener('click', () => {
    togglePin(cur);
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
      if (wide.matches) showList(true);
    });
  });
  q('[data-notes-pro-close]')?.addEventListener('click', () => {
    proCard.hidden = true;
    more.focus();
  });
  q('[data-notes-see]')?.addEventListener('click', () => {
    const pro = document.querySelector<HTMLDialogElement>('[data-dialog="pro"]');
    ctx.track('pro_view', { from: 'notes' });
    if (pro) openDialog(pro);
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
  for (const b of all('[data-notes-copy]'))
    b.addEventListener('click', () => {
      void navigator.clipboard.writeText(withTitle(toText(docOf()), false)).then(
        () => {
          toast(ctx.store, { kind: 'success', id: 'notes', text: t('tool.notes.copied') });
        },
        () => {
          toast(ctx.store, { kind: 'error', id: 'notes', text: t('tool.notes.copyFail') });
        },
      );
    });
  for (const b of all('[data-notes-export]')) {
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

  // Clear and Delete ask inline first, then offer Undo for ten seconds.
  const ask = (on: boolean, focus = true) => {
    confirm.hidden = !on;
    if (on) {
      const many = data.notes.length > 1;
      need('[data-notes-confirm-q]').textContent = t(many ? 'tool.notes.deleteQ' : 'tool.notes.clearQ');
      need('[data-notes-confirm-yes]').textContent = t(many ? 'tool.notes.delete' : 'tool.notes.clear');
      q('[data-notes-confirm-no]')?.focus();
    } else if (focus) more.focus();
  };
  const offerUndo = (text: string, fn?: () => void) => {
    undo = fn;
    undone.hidden = !fn;
    need('[data-notes-undone-text]').textContent = text;
    window.clearTimeout(undoTimer);
    if (fn)
      undoTimer = window.setTimeout(() => {
        undone.hidden = true;
        undo = undefined;
      }, UNDO_MS);
  };
  need('[data-notes-clear]').addEventListener('click', () => {
    if (editable() || data.notes.length > 1) ask(true);
  });
  q('[data-notes-confirm-no]')?.addEventListener('click', () => {
    ask(false);
  });
  q('[data-notes-confirm-yes]')?.addEventListener('click', () => {
    voice.stop();
    confirm.hidden = true;
    if (data.notes.length > 1) {
      const gone = cur;
      const at = data.notes.indexOf(gone);
      data.notes = data.notes.filter((n) => n.id !== gone.id);
      dirty = true;
      cur = listNotes(data.notes)[0] ?? newNote();
      ed.commands.setContent(cur.doc ?? '', { emitUpdate: false });
      void persist();
      render();
      say(t('tool.notes.deleted'));
      offerUndo(t('tool.notes.deleted'), () => {
        data.notes.splice(Math.max(0, at), 0, gone);
        dirty = true;
        choose(gone);
      });
      ed.commands.focus('end');
      return;
    }
    // Its own history step, or Undo would also take back the typing just before it.
    ed.chain()
      .focus()
      .command(({ tr }) => {
        closeHistory(tr);
        return true;
      })
      .clearContent(true)
      .run();
    say(t('tool.notes.cleared'));
    offerUndo(t('tool.notes.clearedShort'), () => {
      ed.chain().focus().undo().run();
    });
  });
  need('[data-notes-undo]').addEventListener('click', () => {
    const fn = undo;
    offerUndo('');
    fn?.();
  });

  // The pill sits under the sheet, so its words and the time ride along in the dock (hidden from readers,
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
  // A tap on the page below the text lands in the text.
  pad.addEventListener('click', (e) => {
    if (e.target === pad && editable()) ed.commands.focus('end');
  });

  // Esc peels one layer at a time: the ⋯ menu, the "/" menu, the selection menu, dictation, a question.
  let swallow = false;
  d.addEventListener(
    'keydown',
    (e) => {
      lastInput = Date.now();
      pad.style.translate = '';
      if (e.key !== 'Escape') return;
      const inBubble = bubble.contains(document.activeElement);
      const layered = !pop.hidden || !slash.hidden || inBubble || voice.on() || !confirm.hidden || !consent.hidden;
      if (!layered) return;
      e.preventDefault();
      e.stopPropagation();
      // The dialog's own cancel for this same key press is refused, then the next Esc closes as usual.
      swallow = true;
      setTimeout(() => {
        swallow = false;
      });
      if (!pop.hidden) closeMenu();
      else if (!slash.hidden) slashExit(ed);
      else if (inBubble) ed.commands.focus();
      else if (voice.on()) voice.stop();
      else if (!consent.hidden) {
        consent.hidden = true;
        mic.focus();
      } else ask(false);
    },
    true,
  );
  d.addEventListener('cancel', (e) => {
    if (swallow) e.preventDefault();
  });

  d.addEventListener('close', () => {
    voice.stop();
    showInterim(ed, '');
    flush();
    for (const l of loops) window.clearInterval(l);
    loops = [];
    pad.style.translate = '';
    consent.hidden = true;
    novoice.hidden = true;
    list.inert = main.inert = false;
    closeMenu(false);
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
    adopt(cur);
    ed.commands.setContent(cur.doc ?? '', { emitUpdate: false });
  };
  let ready: Promise<void> | undefined;

  return {
    open: (opener, take) => {
      ready = ready ? refresh() : load();
      return ready.then(() => {
        announced = false;
        d.toggleAttribute('data-still', still());
        if (!failed) setState(stored(cur) ? 'saved' : '');
        previewing = previewing && html.dataset.preview === 'notes';
        render();
        proCard.hidden = true;
        offerUndo('');
        ask(false, false);
        mirror();
        loops = [window.setInterval(mirror, 1000), window.setInterval(nudge, SHIFT_MS)];
        lastInput = Date.now();
        openDialog(d, opener ?? document.activeElement);
        if (dirty) void persist();
        return new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            showList(wide.matches && unlocked(), false, true);
            const typed = take?.() ?? '';
            // Keyboards land in the text; touch screens keep the keyboard closed until the page is tapped.
            if (d.open && (typed || fine())) {
              ed.chain()
                .focus('end')
                .command(({ tr }) => {
                  if (typed && ed.isEditable) tr.insertText(typed);
                  return true;
                })
                .run();
              // Focus now, not a frame later, so the next key already lands in the text.
              ed.view.focus();
            }
            resolve();
          });
        });
      });
    },
  };
}
