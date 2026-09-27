import type { JSONContent } from '@tiptap/core';
import { createStore, get, set, type UseStore } from 'idb-keyval';
import { plainText } from './text.js';

// docs/08 §2.1a: IndexedDB database `awaketab`, store `notes`, one record under this key. Nothing leaves the device.
const NOTES_KEY = 'at.v1.notes';

export interface INote {
  id: string;
  title: string;
  doc: JSONContent | null;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}

export interface INotesData {
  v: 1;
  notes: INote[];
  current?: string;
  voiceOk?: boolean;
}

let db: UseStore | undefined;
const store = () => (db ??= createStore('awaketab', 'notes'));

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const num = (x: unknown, d: number) => (typeof x === 'number' && Number.isFinite(x) ? x : d);

// Reads whatever is stored defensively: a damaged record never throws, and unknown fields are dropped.
export function parseNotes(raw: unknown): INotesData {
  const out: INotesData = { v: 1, notes: [] };
  if (!isObj(raw) || !Array.isArray(raw.notes)) return out;
  const seen = new Set<string>();
  for (const n of raw.notes as unknown[]) {
    if (!isObj(n) || typeof n.id !== 'string' || !n.id || seen.has(n.id)) continue;
    seen.add(n.id);
    const updatedAt = num(n.updatedAt, 0);
    out.notes.push({
      id: n.id,
      title: typeof n.title === 'string' ? n.title.slice(0, 120) : '',
      doc: isObj(n.doc) && n.doc.type === 'doc' ? n.doc : null,
      createdAt: num(n.createdAt, updatedAt),
      updatedAt,
      ...(n.pinned === true ? { pinned: true } : {}),
    });
  }
  if (typeof raw.current === 'string') out.current = raw.current;
  if (raw.voiceOk === true) out.voiceOk = true;
  return out;
}

export async function loadNotes(): Promise<INotesData> {
  return parseNotes(await get(NOTES_KEY, store()));
}

export function saveNotes(data: INotesData): Promise<void> {
  return set(NOTES_KEY, data, store());
}

export function newNote(now = Date.now()): INote {
  const id =
    typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${now.toString(36)}${Math.random().toString(36)}`;
  return { id, title: '', doc: null, createdAt: now, updatedAt: now };
}

// Free keeps one note: the first one written. Pro, or a running preview, edits all of them; the rest stay readable.
export function canEdit(data: INotesData, id: string, unlocked: boolean): boolean {
  const first = data.notes[0];
  return unlocked || !first || first.id === id;
}

export function noteName(n: INote): string {
  return n.title.trim() || (n.doc ? plainText(n.doc).trim().split('\n')[0]?.slice(0, 80) : '') || '';
}

// Pinned first, then the most recently changed; a query matches the title or any text in the note.
export function listNotes(notes: INote[], query = ''): INote[] {
  const q = query.trim().toLocaleLowerCase();
  const hit = (n: INote) =>
    !q || n.title.toLocaleLowerCase().includes(q) || (n.doc ? plainText(n.doc).toLocaleLowerCase().includes(q) : false);
  return notes.filter(hit).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.updatedAt - a.updatedAt);
}
