import type { JSONContent } from '@tiptap/core';
import { describe, expect, it } from 'vitest';
import { canEdit, listNotes, newNote, noteName, parseNotes } from '../../src/tool/packs/notes/data.js';
import { countWords, plainText, toMarkdown, toText } from '../../src/tool/packs/notes/text.js';
import { speechLang } from '../../src/tool/packs/notes/voice.js';

const p = (...content: JSONContent[]): JSONContent => ({ type: 'paragraph', content });
const txt = (text: string, ...marks: string[]): JSONContent => ({
  type: 'text',
  text,
  ...(marks.length ? { marks: marks.map((type) => ({ type })) } : {}),
});

const doc: JSONContent = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [txt('Groceries')] },
    p(txt('Buy '), txt('fresh', 'bold'), txt(' ', 'bold'), txt('basil', 'bold', 'italic'), txt(' today')),
    {
      type: 'taskList',
      content: [
        { type: 'taskItem', attrs: { checked: true }, content: [p(txt('Milk'))] },
        { type: 'taskItem', attrs: { checked: false }, content: [p(txt('Bread'))] },
      ],
    },
    {
      type: 'orderedList',
      attrs: { start: 1 },
      content: [
        { type: 'listItem', content: [p(txt('Preheat'))] },
        {
          type: 'listItem',
          content: [
            p(txt('Bake')),
            { type: 'bulletList', content: [{ type: 'listItem', content: [p(txt('40 min'))] }] },
          ],
        },
      ],
    },
    { type: 'blockquote', content: [p(txt('Keep it simple'))] },
    p(txt('5*3 = 15')),
  ],
};

describe('notes text export', () => {
  it('writes Markdown with headings, marks, checklists and nested lists', () => {
    expect(toMarkdown(doc)).toBe(
      [
        '## Groceries',
        '',
        'Buy **fresh _basil_** today',
        '',
        '- [x] Milk',
        '- [ ] Bread',
        '',
        '1. Preheat',
        '2. Bake',
        '   - 40 min',
        '',
        '> Keep it simple',
        '',
        '5\\*3 = 15',
      ].join('\n'),
    );
  });

  it('writes plain text that keeps list and checklist marks', () => {
    expect(toText(doc)).toContain('[x] Milk\n[ ] Bread');
    expect(toText(doc)).toContain('Buy fresh basil today');
    expect(toText(doc)).not.toContain('**');
  });

  it('counts words, CJK included', () => {
    expect(plainText(doc).split('\n')).toContain('Buy fresh basil today');
    expect(countWords('Buy fresh basil today', 'en')).toBe(4);
    expect(countWords('', 'en')).toBe(0);
    expect(countWords('今日は晴れです', 'ja')).toBeGreaterThan(1);
  });
});

describe('notes storage record', () => {
  it('reads a damaged record without throwing and drops what it cannot trust', () => {
    expect(parseNotes(null)).toEqual({ v: 1, notes: [] });
    const got = parseNotes({
      v: 1,
      notes: [
        { id: 'a', title: 'One', doc: { type: 'doc', content: [] }, updatedAt: 5, createdAt: 1, pinned: true },
        { id: 'a', title: 'duplicate' },
        { title: 'no id' },
        { id: 'b', doc: '<p>html</p>', updatedAt: 'soon' },
      ],
      current: 'b',
      voiceOk: true,
    });
    expect(got.notes.map((n) => n.id)).toEqual(['a', 'b']);
    expect(got.notes[1]).toMatchObject({ title: '', doc: null, updatedAt: 0 });
    expect(got.current).toBe('b');
    expect(got.voiceOk).toBe(true);
  });

  it('keeps the first note editable for free and every note with Pro or a preview', () => {
    const a = { ...newNote(1), id: 'a' };
    const b = { ...newNote(2), id: 'b' };
    const data = { v: 1 as const, notes: [a, b] };
    expect(canEdit(data, 'a', false)).toBe(true);
    expect(canEdit(data, 'b', false)).toBe(false);
    expect(canEdit(data, 'b', true)).toBe(true);
    expect(canEdit({ v: 1, notes: [] }, 'fresh', false)).toBe(true);
  });

  it('lists pinned notes first, then the newest, and searches titles and text', () => {
    const old = { ...newNote(1), id: 'old', title: 'Recipe', pinned: true };
    const fresh = { ...newNote(9), id: 'fresh', doc: { type: 'doc', content: [p(txt('Call the plumber'))] } };
    const mid = { ...newNote(5), id: 'mid' };
    expect(listNotes([mid, fresh, old]).map((n) => n.id)).toEqual(['old', 'fresh', 'mid']);
    expect(listNotes([mid, fresh, old], 'plumb').map((n) => n.id)).toEqual(['fresh']);
    expect(noteName(fresh)).toBe('Call the plumber');
  });
});

describe('dictation language', () => {
  it('follows the page language and keeps the browser region when it matches', () => {
    expect(speechLang('en', 'en-GB')).toBe('en-GB');
    expect(speechLang('de', 'en-US')).toBe('de-DE');
    expect(speechLang('pt-br', 'pt-PT')).toBe('pt-BR');
    expect(speechLang('ja', 'ja')).toBe('ja');
  });
});
