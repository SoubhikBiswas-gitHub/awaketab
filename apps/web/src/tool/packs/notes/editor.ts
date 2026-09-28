import { Editor, Extension } from '@tiptap/core';
import Blockquote from '@tiptap/extension-blockquote';
import Bold from '@tiptap/extension-bold';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import Heading from '@tiptap/extension-heading';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Italic from '@tiptap/extension-italic';
import { BulletList } from '@tiptap/extension-list/bullet-list';
import { ListItem } from '@tiptap/extension-list/item';
import { ListKeymap } from '@tiptap/extension-list/keymap';
import { OrderedList } from '@tiptap/extension-list/ordered-list';
import { TaskItem } from '@tiptap/extension-list/task-item';
import { TaskList } from '@tiptap/extension-list/task-list';
import Paragraph from '@tiptap/extension-paragraph';
import Strike from '@tiptap/extension-strike';
import Text from '@tiptap/extension-text';
import { Placeholder } from '@tiptap/extensions/placeholder';
import { UndoRedo } from '@tiptap/extensions/undo-redo';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export type TTool = 'h' | 'b' | 'i' | 's' | 'ul' | 'ol' | 'task';
export type TBlock = 'h' | 'task' | 'ul' | 'ol' | 'quote' | 'hr';

interface ISlashHooks {
  open: (query: string, at: () => { left: number; top: number; bottom: number }) => void;
  close: () => void;
  key: (e: KeyboardEvent) => boolean;
}

interface IEditorHooks {
  placeholder: (empty: boolean) => string;
  label: string;
  check: (text: string) => string;
  change: () => void;
  select: () => void;
  slash: ISlashHooks;
}

const soft = new PluginKey<string>('at-interim');

// Dictation's interim words, drawn softly at the cursor and never part of the document.
const Interim = Extension.create({
  name: 'atInterim',
  addProseMirrorPlugins() {
    return [
      new Plugin<string>({
        key: soft,
        state: {
          init: () => '',
          apply: (tr, v) => (tr.getMeta(soft) as string | undefined) ?? v,
        },
        props: {
          decorations(state) {
            const text = soft.getState(state);
            if (!text) return null;
            const el = document.createElement('span');
            el.className = 'at-notes-interim';
            el.setAttribute('aria-hidden', 'true');
            el.textContent = text;
            return DecorationSet.create(state.doc, [
              Decoration.widget(state.selection.head, el, { side: 1, key: text }),
            ]);
          },
        },
      }),
    ];
  },
});

export function showInterim(ed: Editor, text: string): void {
  if ((soft.getState(ed.state) ?? '') === text) return;
  ed.view.dispatch(ed.state.tr.setMeta(soft, text).setMeta('addToHistory', false));
}

// The "/" menu: a slash at the start of a line or after a space opens it, the word after it filters,
// Esc or leaving the text shuts it until that slash is gone. Small enough that no popup library ships.
interface ISlash {
  on: boolean;
  from: number;
  query: string;
  shut: number;
}
const slashKey = new PluginKey<ISlash>('at-slash');
const SLASH = /(?:^|\s)\/([^\s/]{0,24})$/u;

const Slash = (h: ISlashHooks) =>
  Extension.create({
    name: 'atSlash',
    addProseMirrorPlugins() {
      const editor = this.editor;
      const shut = (s: ISlash | undefined) => {
        if (s?.on) editor.view.dispatch(editor.state.tr.setMeta(slashKey, s.from));
      };
      return [
        new Plugin<ISlash>({
          key: slashKey,
          state: {
            init: () => ({ on: false, from: 0, query: '', shut: -1 }),
            apply(tr, prev, _old, next) {
              const meta = tr.getMeta(slashKey) as number | undefined;
              let closed = meta ?? (prev.shut < 0 || !tr.docChanged ? prev.shut : tr.mapping.map(prev.shut));
              const off = { on: false, from: 0, query: '', shut: closed };
              const sel = next.selection;
              if (!sel.empty || !editor.isEditable) return off;
              const $f = sel.$from;
              const before = $f.parent.textBetween(0, $f.parentOffset, undefined, '\ufffc');
              const m = SLASH.exec(before);
              if (!m) return { ...off, shut: -1 };
              const from = $f.start() + before.length - m[0].length + (m[0].startsWith('/') ? 0 : 1);
              if (from === closed) return off;
              closed = -1;
              return { on: true, from, query: m[1] ?? '', shut: closed };
            },
          },
          view: () => ({
            update: (view, prevState) => {
              const s = slashKey.getState(view.state);
              const p = slashKey.getState(prevState);
              if (s?.on) {
                if (!p?.on || p.query !== s.query || p.from !== s.from) h.open(s.query, () => view.coordsAtPos(s.from));
              } else if (p?.on) h.close();
            },
            destroy: () => {
              h.close();
            },
          }),
          props: {
            handleKeyDown: (view, e) => {
              const s = slashKey.getState(view.state);
              if (!s?.on) return false;
              if (e.key === 'Escape') {
                shut(s);
                return true;
              }
              return h.key(e);
            },
            handleDOMEvents: {
              blur: (view) => {
                shut(slashKey.getState(view.state));
                return false;
              },
            },
          },
        }),
      ];
    },
  });

export function slashExit(ed: Editor): void {
  const s = slashKey.getState(ed.state);
  if (s?.on) ed.view.dispatch(ed.state.tr.setMeta(slashKey, s.from));
}

// The typed "/word" goes, and the chosen block takes its place.
export function slashRun(ed: Editor, b: TBlock): void {
  const s = slashKey.getState(ed.state);
  if (!s?.on) return;
  const c = ed.chain().focus().deleteRange({ from: s.from, to: ed.state.selection.from });
  if (b === 'h') c.toggleHeading({ level: 2 });
  else if (b === 'task') c.toggleTaskList();
  else if (b === 'ul') c.toggleBulletList();
  else if (b === 'ol') c.toggleOrderedList();
  else if (b === 'quote') c.toggleBlockquote();
  else c.setHorizontalRule();
  c.run();
}

// StarterKit's own extensions, taken one by one so links and code blocks (unused here) never ship.
// Each brings its Markdown-style input rule: # heading, - or * list, 1. list, [ ] checklist, > quote, --- divider.
export function makeEditor(el: HTMLElement, h: IEditorHooks): Editor {
  return new Editor({
    element: el,
    injectCSS: false,
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Strike,
      Heading.configure({ levels: [1, 2, 3] }),
      Blockquote,
      HardBreak,
      HorizontalRule,
      BulletList,
      OrderedList,
      ListItem,
      ListKeymap,
      TaskList,
      TaskItem.configure({ nested: true, a11y: { checkboxLabel: (node) => h.check(node.textContent) } }),
      UndoRedo,
      // The whole invitation on an empty page; later, only the empty line holding the cursor hints at "/".
      Placeholder.configure({ placeholder: ({ editor }) => h.placeholder(editor.isEmpty) }),
      Interim,
      Slash(h.slash),
    ],
    editorProps: {
      attributes: {
        class: 'at-notes-doc',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': h.label,
        spellcheck: 'true',
      },
    },
    onUpdate: h.change,
    onSelectionUpdate: h.select,
  });
}

export function runTool(ed: Editor, tool: TTool): void {
  const c = ed.chain().focus();
  if (tool === 'h') c.toggleHeading({ level: 2 }).run();
  else if (tool === 'b') c.toggleBold().run();
  else if (tool === 'i') c.toggleItalic().run();
  else if (tool === 's') c.toggleStrike().run();
  else if (tool === 'ul') c.toggleBulletList().run();
  else if (tool === 'ol') c.toggleOrderedList().run();
  else c.toggleTaskList().run();
}

const ACTIVE: Record<TTool, string> = {
  h: 'heading',
  b: 'bold',
  i: 'italic',
  s: 'strike',
  ul: 'bulletList',
  ol: 'orderedList',
  task: 'taskList',
};

export function toolOn(ed: Editor, tool: TTool): boolean {
  return ed.isActive(ACTIVE[tool]);
}

// Dictated words go in at the cursor with one space before them where the text needs it (not in Chinese or
// Japanese), and a capital at the start of a line or a sentence.
export function insertSpoken(ed: Editor, words: string, spaced: boolean): void {
  let text = words.trim();
  if (!text) return;
  const { $from } = ed.state.selection;
  const before = $from.parent.textBetween(0, $from.parentOffset, '\n', ' ');
  const start = !before.trim() || /[.!?]\s*$/u.test(before);
  if (start) text = text.charAt(0).toLocaleUpperCase() + text.slice(1);
  if (spaced && before && !/\s$/u.test(before) && !/^[,.;:!?]/u.test(text)) text = ` ${text}`;
  ed.chain().focus().insertContent(text).run();
}

export function newLine(ed: Editor): void {
  ed.chain().focus().enter().run();
}

export function newItem(ed: Editor): void {
  if (ed.isActive('taskItem')) {
    ed.chain().focus().enter().run();
    return;
  }
  const empty = !ed.state.selection.$from.parent.textContent.trim();
  if (empty) ed.chain().focus().toggleTaskList().run();
  else ed.chain().focus().enter().toggleTaskList().run();
}
