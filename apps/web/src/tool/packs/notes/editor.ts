import { Editor } from '@tiptap/core';
import Blockquote from '@tiptap/extension-blockquote';
import Bold from '@tiptap/extension-bold';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import Heading from '@tiptap/extension-heading';
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

export type TTool = 'h' | 'b' | 'i' | 'ul' | 'ol' | 'task';

interface IEditorHooks {
  placeholder: string;
  label: string;
  check: (text: string) => string;
  change: () => void;
  select: () => void;
}

// StarterKit's own extensions, taken one by one so links, code blocks and rules (unused here) never ship.
// Each brings its Markdown-style input rule: # heading, - or * list, 1. list, [ ] checklist, > quote, **bold**, _italic_.
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
      BulletList,
      OrderedList,
      ListItem,
      ListKeymap,
      TaskList,
      TaskItem.configure({ nested: true, a11y: { checkboxLabel: (node) => h.check(node.textContent) } }),
      UndoRedo,
      Placeholder.configure({ placeholder: h.placeholder }),
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
  else if (tool === 'ul') c.toggleBulletList().run();
  else if (tool === 'ol') c.toggleOrderedList().run();
  else c.toggleTaskList().run();
}

const ACTIVE: Record<TTool, string> = {
  h: 'heading',
  b: 'bold',
  i: 'italic',
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
