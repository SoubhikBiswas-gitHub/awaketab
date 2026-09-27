// The store images draw their text with the repo's own font files (apps/web/public/fonts). Those are variable
// WOFF2, which satori cannot read, so this module unpacks WOFF2 to a TrueType font (the W3C WOFF2 format,
// glyf and hmtx transforms included) and pins the weight axis with HarfBuzz's subsetter, the one satori
// already depends on. Output bytes depend only on the input file and the weight.
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { brotliDecompressSync } from 'node:zlib';

// prettier-ignore
const KNOWN_TAGS = [
  'cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ',
  'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS',
  'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc',
  'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop',
  'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill',
];

interface ITableEntry {
  tag: string;
  origLength: number;
  transformed: boolean;
  length: number;
  data?: Uint8Array;
}

class Reader {
  pos = 0;
  constructor(readonly buf: Uint8Array) {}
  private get view(): DataView {
    return new DataView(this.buf.buffer, this.buf.byteOffset, this.buf.byteLength);
  }
  u8(): number {
    return this.buf[this.pos++] ?? 0;
  }
  u16(): number {
    const v = this.view.getUint16(this.pos);
    this.pos += 2;
    return v;
  }
  i16(): number {
    const v = this.view.getInt16(this.pos);
    this.pos += 2;
    return v;
  }
  u32(): number {
    const v = this.view.getUint32(this.pos);
    this.pos += 4;
    return v;
  }
  base128(): number {
    let value = 0;
    for (let i = 0; i < 5; i++) {
      const b = this.u8();
      value = value * 128 + (b & 0x7f);
      if (!(b & 0x80)) return value;
    }
    throw new Error('woff2: bad UIntBase128');
  }
  u255(): number {
    const code = this.u8();
    if (code === 253) return this.u16();
    if (code === 255) return this.u8() + 253;
    if (code === 254) return this.u8() + 506;
    return code;
  }
  bytes(n: number): Uint8Array {
    const out = this.buf.subarray(this.pos, this.pos + n);
    this.pos += n;
    return out;
  }
}

class Writer {
  private parts: number[] = [];
  get length(): number {
    return this.parts.length;
  }
  u8(v: number): void {
    this.parts.push(v & 0xff);
  }
  u16(v: number): void {
    this.parts.push((v >> 8) & 0xff, v & 0xff);
  }
  u32(v: number): void {
    this.parts.push((v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff);
  }
  bytes(b: Uint8Array): void {
    for (const v of b) this.parts.push(v);
  }
  pad4(): void {
    while (this.parts.length % 4) this.parts.push(0);
  }
  done(): Uint8Array {
    return Uint8Array.from(this.parts);
  }
}

const withSign = (flag: number, value: number): number => (flag & 1 ? value : -value);

// One point of a simple glyph from its flag byte and 1 to 4 data bytes (WOFF2 §5.2, triplet encoding).
function triplet(flag: number, d: Reader): [number, number] {
  if (flag < 10) return [0, withSign(flag, ((flag & 14) << 7) + d.u8())];
  if (flag < 20) return [withSign(flag, (((flag - 10) & 14) << 7) + d.u8()), 0];
  if (flag < 84) {
    const b0 = flag - 20;
    const b1 = d.u8();
    return [withSign(flag, 1 + (b0 & 0x30) + (b1 >> 4)), withSign(flag >> 1, 1 + ((b0 & 0x0c) << 2) + (b1 & 0x0f))];
  }
  if (flag < 120) {
    const b0 = flag - 84;
    const x = d.u8();
    const y = d.u8();
    return [withSign(flag, 1 + (Math.floor(b0 / 12) << 8) + x), withSign(flag >> 1, 1 + (((b0 % 12) >> 2) << 8) + y)];
  }
  if (flag < 124) {
    const a = d.u8();
    const b = d.u8();
    const c = d.u8();
    return [withSign(flag, (a << 4) + (b >> 4)), withSign(flag >> 1, ((b & 0x0f) << 8) + c)];
  }
  const a = d.u16();
  const b = d.u16();
  return [withSign(flag, a), withSign(flag >> 1, b)];
}

// Rebuilds glyf and loca (long offsets) from the transformed glyf stream (WOFF2 §5.1).
function rebuildGlyf(data: Uint8Array): { glyf: Uint8Array; loca: Uint8Array; xMins: number[] } {
  const head = new Reader(data);
  head.u16();
  head.u16();
  const numGlyphs = head.u16();
  head.u16();
  const sizes = Array.from({ length: 7 }, () => head.u32());
  const streams: Reader[] = [];
  let offset = head.pos;
  for (const size of sizes) {
    streams.push(new Reader(data.subarray(offset, offset + size)));
    offset += size;
  }
  const [nContour, nPoints, flags, glyphs, composite, bboxStream, instructions] = streams as [
    Reader,
    Reader,
    Reader,
    Reader,
    Reader,
    Reader,
    Reader,
  ];
  const bitmapLength = 4 * Math.floor((numGlyphs + 31) / 32);
  const bboxBitmap = bboxStream.bytes(bitmapLength);
  const hasBbox = (i: number) => ((bboxBitmap[i >> 3] ?? 0) & (0x80 >> (i & 7))) !== 0;

  const glyf = new Writer();
  const offsets: number[] = [];
  const xMins: number[] = [];
  for (let i = 0; i < numGlyphs; i++) {
    offsets.push(glyf.length);
    const contours = nContour.i16();
    if (contours === 0) {
      xMins.push(0);
      continue;
    }
    if (contours === -1) {
      const start = composite.pos;
      let more = true;
      let instr = false;
      while (more) {
        const f = composite.u16();
        composite.u16();
        composite.pos += f & 0x0001 ? 4 : 2;
        if (f & 0x0008) composite.pos += 2;
        else if (f & 0x0040) composite.pos += 4;
        else if (f & 0x0080) composite.pos += 8;
        if (f & 0x0100) instr = true;
        more = (f & 0x0020) !== 0;
      }
      const components = composite.buf.subarray(start, composite.pos);
      const box = [bboxStream.i16(), bboxStream.i16(), bboxStream.i16(), bboxStream.i16()];
      xMins.push(box[0] ?? 0);
      glyf.u16(0xffff);
      for (const v of box) glyf.u16(v);
      glyf.bytes(components);
      if (instr) {
        const n = glyphs.u255();
        glyf.u16(n);
        glyf.bytes(instructions.bytes(n));
      }
      glyf.pad4();
      continue;
    }
    const ends: number[] = [];
    let total = 0;
    for (let c = 0; c < contours; c++) {
      total += nPoints.u255();
      ends.push(total - 1);
    }
    const xs: number[] = [];
    const ys: number[] = [];
    const on: boolean[] = [];
    let x = 0;
    let y = 0;
    for (let p = 0; p < total; p++) {
      const f = flags.u8();
      const [dx, dy] = triplet(f & 0x7f, glyphs);
      x += dx;
      y += dy;
      xs.push(x);
      ys.push(y);
      on.push(!(f & 0x80));
    }
    const instrLength = glyphs.u255();
    const box = hasBbox(i)
      ? [bboxStream.i16(), bboxStream.i16(), bboxStream.i16(), bboxStream.i16()]
      : [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    xMins.push(box[0] ?? 0);
    glyf.u16(contours);
    for (const v of box) glyf.u16(v);
    for (const e of ends) glyf.u16(e);
    glyf.u16(instrLength);
    glyf.bytes(instructions.bytes(instrLength));
    for (const o of on) glyf.u8(o ? 1 : 0);
    let px = 0;
    for (const v of xs) {
      glyf.u16(v - px);
      px = v;
    }
    let py = 0;
    for (const v of ys) {
      glyf.u16(v - py);
      py = v;
    }
    glyf.pad4();
  }
  offsets.push(glyf.length);
  const loca = new Writer();
  for (const o of offsets) loca.u32(o);
  return { glyf: glyf.done(), loca: loca.done(), xMins };
}

function rebuildHmtx(data: Uint8Array, numGlyphs: number, numHMetrics: number, xMins: number[]): Uint8Array {
  const r = new Reader(data);
  const flags = r.u8();
  const advances = Array.from({ length: numHMetrics }, () => r.u16());
  const lsbs = Array.from({ length: numHMetrics }, (_, i) => (flags & 1 ? (xMins[i] ?? 0) : r.i16()));
  const rest = Array.from({ length: numGlyphs - numHMetrics }, (_, i) =>
    flags & 2 ? (xMins[numHMetrics + i] ?? 0) : r.i16(),
  );
  const w = new Writer();
  advances.forEach((a, i) => {
    w.u16(a);
    w.u16(lsbs[i] ?? 0);
  });
  for (const l of rest) w.u16(l);
  return w.done();
}

function checksum(b: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < b.length; i += 4)
    sum = (sum + (((b[i] ?? 0) << 24) | ((b[i + 1] ?? 0) << 16) | ((b[i + 2] ?? 0) << 8) | (b[i + 3] ?? 0))) >>> 0;
  return sum;
}

export function woff2ToTtf(woff2: Uint8Array): Uint8Array {
  const r = new Reader(woff2);
  if (r.u32() !== 0x774f4632) throw new Error('woff2: bad signature');
  const flavor = r.u32();
  r.u32();
  const numTables = r.u16();
  r.u16();
  r.u32();
  const compressedSize = r.u32();
  r.pos = 48;
  const tables: ITableEntry[] = [];
  for (let i = 0; i < numTables; i++) {
    const flags = r.u8();
    const tag = (flags & 0x3f) === 0x3f ? String.fromCharCode(...r.bytes(4)) : (KNOWN_TAGS[flags & 0x3f] ?? '????');
    const version = flags >> 6;
    const origLength = r.base128();
    const glyfLike = tag === 'glyf' || tag === 'loca';
    const transformed = glyfLike ? version === 0 : version !== 0;
    const length = transformed ? r.base128() : origLength;
    tables.push({ tag, origLength, transformed, length });
  }
  const stream = brotliDecompressSync(r.bytes(compressedSize));
  let at = 0;
  for (const t of tables) {
    t.data = stream.subarray(at, at + t.length);
    at += t.length;
  }
  const get = (tag: string) => tables.find((t) => t.tag === tag);
  const glyfEntry = get('glyf');
  let xMins: number[] = [];
  if (glyfEntry?.transformed && glyfEntry.data) {
    const rebuilt = rebuildGlyf(glyfEntry.data);
    glyfEntry.data = rebuilt.glyf;
    xMins = rebuilt.xMins;
    const loca = get('loca');
    if (loca) loca.data = rebuilt.loca;
    const head = get('head');
    if (head?.data) {
      head.data = Uint8Array.from(head.data);
      head.data[50] = 0;
      head.data[51] = 1;
    }
  }
  const hmtx = get('hmtx');
  if (hmtx?.transformed && hmtx.data) {
    const maxp = new Reader(get('maxp')?.data ?? new Uint8Array(6));
    maxp.pos = 4;
    const hhea = new Reader(get('hhea')?.data ?? new Uint8Array(36));
    hhea.pos = 34;
    hmtx.data = rebuildHmtx(hmtx.data, maxp.u16(), hhea.u16(), xMins);
  }

  const sorted = [...tables].sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));
  const out = new Writer();
  const entrySelector = Math.floor(Math.log2(sorted.length));
  out.u32(flavor);
  out.u16(sorted.length);
  out.u16(16 * 2 ** entrySelector);
  out.u16(entrySelector);
  out.u16(sorted.length * 16 - 16 * 2 ** entrySelector);
  let offset = 12 + 16 * sorted.length;
  const bodies = new Writer();
  for (const t of sorted) {
    const data = t.data ?? new Uint8Array();
    out.bytes(Uint8Array.from(t.tag, (c) => c.charCodeAt(0)));
    out.u32(checksum(data));
    out.u32(offset);
    out.u32(data.length);
    bodies.bytes(data);
    bodies.pad4();
    offset = 12 + 16 * sorted.length + bodies.length;
  }
  out.bytes(bodies.done());
  return out.done();
}

interface IHbSubset {
  _initialize(): void;
  memory: WebAssembly.Memory;
  malloc(n: number): number;
  free(p: number): void;
  hb_blob_create(data: number, length: number, mode: number, user: number, destroy: number): number;
  hb_blob_destroy(blob: number): void;
  hb_blob_get_data(blob: number, length: number): number;
  hb_blob_get_length(blob: number): number;
  hb_face_create(blob: number, index: number): number;
  hb_face_destroy(face: number): void;
  hb_face_reference_blob(face: number): number;
  hb_subset_input_create_or_fail(): number;
  hb_subset_input_keep_everything(input: number): void;
  hb_subset_input_pin_axis_location(input: number, face: number, tag: number, value: number): number;
  hb_subset_input_destroy(input: number): void;
  hb_subset_or_fail(face: number, input: number): number;
}

let subsetter: Promise<IHbSubset> | null = null;

function loadSubsetter(satoriEntry: string): Promise<IHbSubset> {
  subsetter ??= (async () => {
    const wasm = await readFile(createRequire(satoriEntry).resolve('harfbuzzjs/hb-subset.wasm'));
    const { instance } = await WebAssembly.instantiate(wasm, {});
    const hb = instance.exports as unknown as IHbSubset;
    hb._initialize();
    return hb;
  })();
  return subsetter;
}

const tagOf = (tag: string): number =>
  ((tag.charCodeAt(0) << 24) | (tag.charCodeAt(1) << 16) | (tag.charCodeAt(2) << 8) | tag.charCodeAt(3)) >>> 0;

// A static TrueType instance of a variable font at one weight.
export async function staticInstance(ttf: Uint8Array, weight: number, satoriEntry: string): Promise<ArrayBuffer> {
  const hb = await loadSubsetter(satoriEntry);
  const ptr = hb.malloc(ttf.byteLength);
  new Uint8Array(hb.memory.buffer).set(ttf, ptr);
  const blob = hb.hb_blob_create(ptr, ttf.byteLength, 2, 0, 0);
  const face = hb.hb_face_create(blob, 0);
  hb.hb_blob_destroy(blob);
  const input = hb.hb_subset_input_create_or_fail();
  hb.hb_subset_input_keep_everything(input);
  if (!hb.hb_subset_input_pin_axis_location(input, face, tagOf('wght'), weight))
    throw new Error(`font: cannot pin wght ${String(weight)}`);
  const subset = hb.hb_subset_or_fail(face, input);
  hb.hb_subset_input_destroy(input);
  if (!subset) throw new Error('font: HarfBuzz could not instance the font');
  const result = hb.hb_face_reference_blob(subset);
  const at = hb.hb_blob_get_data(result, 0);
  const length = hb.hb_blob_get_length(result);
  const bytes = new Uint8Array(hb.memory.buffer).slice(at, at + length);
  hb.hb_blob_destroy(result);
  hb.hb_face_destroy(subset);
  hb.hb_face_destroy(face);
  hb.free(ptr);
  return bytes.buffer;
}
