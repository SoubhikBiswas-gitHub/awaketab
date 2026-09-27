import { Filter } from 'tone/build/esm/component/filter/Filter.js';
import { Panner } from 'tone/build/esm/component/channel/Panner.js';
import 'tone/build/esm/core/clock/Transport.js';
import { Context } from 'tone/build/esm/core/context/Context.js';
import 'tone/build/esm/core/context/Destination.js';
import { Gain } from 'tone/build/esm/core/context/Gain.js';
import { getContext, setContext } from 'tone/build/esm/core/Global.js';
import { Reverb } from 'tone/build/esm/effect/Reverb.js';
import { Vibrato } from 'tone/build/esm/effect/Vibrato.js';
import { Loop } from 'tone/build/esm/event/Loop.js';
import { FMSynth } from 'tone/build/esm/instrument/FMSynth.js';
import { MembraneSynth } from 'tone/build/esm/instrument/MembraneSynth.js';
import { NoiseSynth } from 'tone/build/esm/instrument/NoiseSynth.js';
import { PolySynth } from 'tone/build/esm/instrument/PolySynth.js';
import { Synth } from 'tone/build/esm/instrument/Synth.js';
import { Noise } from 'tone/build/esm/source/Noise.js';
import { LFO } from 'tone/build/esm/source/oscillator/LFO.js';
import type { TChimeId, TGen } from './catalog.js';

interface IDisposable {
  dispose: () => unknown;
}

type TBuild = (out: Gain, d: IDisposable[]) => void;

const FADE_IN_S = 1.6;
const FADE_OUT_S = 2;
const LAYER_S = 1.2;

let tone: Context | null = null;
let bus: Gain | null = null;
let sink: HTMLAudioElement | null = null;
const layers = new Map<TGen, { out: Gain; d: IDisposable[] }>();
let ticker: IDisposable[] | null = null;
// Bumped by every change, so a fade-out that finishes after a new start leaves the new sound alone.
let gen = 0;

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)] as T;
// Slider positions feel even when the gain follows a square curve.
const amp = (v: number) => Math.min(1, Math.max(0, v)) ** 2;

function keep<T extends IDisposable>(d: IDisposable[], node: T): T {
  d.push(node);
  return node;
}

function free(d: IDisposable[]): void {
  for (const n of d.splice(0)) n.dispose();
}

// The tool's AudioContext was created in a user gesture, so Tone reuses it instead of opening a locked one. A timer
// clock keeps Tone off blob workers, which the site's CSP refuses.
export function init(raw: AudioContext, media: boolean): void {
  if (tone) return;
  tone = new Context({ context: raw as unknown as Context['rawContext'], clockSource: 'timeout', lookAhead: 0.2 });
  setContext(tone);
  tone.transport.bpm.value = 72;
  bus = new Gain(0);
  // Chrome and Firefox show media keys and the lock-screen card only for a playing media element.
  if (media && 'createMediaStreamDestination' in raw) {
    const dest = raw.createMediaStreamDestination();
    bus.connect(dest);
    sink = new Audio();
    sink.srcObject = dest.stream;
  } else bus.toDestination();
}

function running(): boolean {
  return tone?.state === 'running';
}

export async function resume(): Promise<boolean> {
  if (!tone) return false;
  if (tone.state !== 'running') await Promise.race([tone.resume(), new Promise((r) => setTimeout(r, 400))]);
  return running();
}

function transport(): void {
  const tr = getContext().transport;
  if (tr.state !== 'started') tr.start();
}

function noise(out: Gain, d: IDisposable[], type: 'brown' | 'pink' | 'white', level: number, lo: number, hi = 0) {
  const lp = keep(d, new Filter({ frequency: lo, type: 'lowpass', rolloff: -12 }));
  const g = keep(d, new Gain(level));
  const n = keep(d, new Noise(type));
  if (hi) n.chain(keep(d, new Filter({ frequency: hi, type: 'highpass' })), lp, g, out);
  else n.chain(lp, g, out);
  n.start();
  return lp;
}

// Short bursts of filtered noise at random places in the stereo field: raindrops, embers, vinyl dust.
function specks(
  out: Gain,
  d: IDisposable[],
  o: {
    every: number;
    chance: number;
    decay: number;
    lo: number;
    hi: number;
    gain: number;
    type?: 'bandpass' | 'highpass';
  },
) {
  const f = keep(d, new Filter({ type: o.type ?? 'bandpass', frequency: o.lo, Q: 1.1 }));
  const pan = keep(d, new Panner(0));
  const g = keep(d, new Gain(o.gain));
  const s = keep(
    d,
    new NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: o.decay, sustain: 0 } }),
  );
  s.chain(f, pan, g, out);
  const loop = keep(
    d,
    new Loop((time) => {
      f.frequency.setValueAtTime(rnd(o.lo, o.hi), time);
      pan.pan.setValueAtTime(rnd(-0.8, 0.8), time);
      s.triggerAttackRelease(o.decay, time, rnd(0.2, 1));
    }, o.every),
  );
  loop.probability = o.chance;
  loop.humanize = o.every / 2;
  loop.start(getContext().transport.seconds + 0.05);
}

function drift(d: IDisposable[], param: Filter['frequency'], hz: number, min: number, max: number) {
  keep(d, new LFO({ frequency: hz, min, max, phase: rnd(0, 360) }))
    .connect(param)
    .start();
}

function lofi(out: Gain, d: IDisposable[]): void {
  const room = keep(d, new Reverb({ decay: 2.8, wet: 0.3 }));
  room.connect(out);
  const warm = keep(d, new Filter({ frequency: 1500, type: 'lowpass', rolloff: -24 }));
  warm.connect(room);
  const keys = keep(
    d,
    new PolySynth(Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.35, decay: 0.9, sustain: 0.45, release: 2.4 },
      volume: -17,
    }),
  );
  // Tape wow: the chords sway a few cents, slowly.
  keys.chain(keep(d, new Vibrato({ frequency: 0.23, depth: 0.04 })), warm);
  const bell = keep(
    d,
    new Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.02, decay: 0.7, sustain: 0.05, release: 1.4 } }),
  );
  bell.volume.value = -21;
  bell.connect(warm);
  const kick = keep(
    d,
    new MembraneSynth({ pitchDecay: 0.05, octaves: 4, envelope: { attack: 0.001, decay: 0.4, sustain: 0 } }),
  );
  kick.volume.value = -13;
  kick.chain(keep(d, new Filter({ frequency: 900, type: 'lowpass' })), out);
  const snare = keep(
    d,
    new NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.002, decay: 0.18, sustain: 0 } }),
  );
  snare.volume.value = -25;
  snare.chain(keep(d, new Filter({ frequency: 1700, type: 'bandpass', Q: 0.7 })), room);
  const hat = keep(
    d,
    new NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.03, sustain: 0 } }),
  );
  hat.volume.value = -35;
  hat.chain(keep(d, new Filter({ frequency: 7000, type: 'highpass' })), out);
  noise(out, d, 'pink', 0.03, 3600, 900);
  specks(out, d, { every: 0.05, chance: 0.1, decay: 0.004, lo: 2500, hi: 6000, gain: 0.35, type: 'highpass' });

  // Dm9 · G13 · Cmaj9 · Am11, one bar each, with a lazy strum.
  const PROG = [
    ['D3', 'F3', 'A3', 'C4', 'E4'],
    ['G2', 'F3', 'B3', 'E4'],
    ['C3', 'E3', 'G3', 'B3', 'D4'],
    ['A2', 'G3', 'C4', 'D4'],
  ];
  const MELODY = ['C5', 'D5', 'E5', 'G5', 'A5'];
  const tr = getContext().transport;
  const beat = tr.toSeconds('4n');
  let n = 0;
  const loop = keep(
    d,
    new Loop((time) => {
      const b = n % 4;
      if (b === 0)
        (PROG[Math.floor(n / 4) % PROG.length] ?? []).forEach((note, i) => {
          keys.triggerAttackRelease(note, beat * 3.6, time + i * 0.035, 0.5);
        });
      if (b === 0 || b === 2) kick.triggerAttackRelease('C1', beat / 2, b === 2 ? time + beat / 2 : time, 0.8);
      if (b === 1 || b === 3) snare.triggerAttackRelease(beat / 2, time, 0.6);
      hat.triggerAttackRelease(0.03, time, 0.5);
      hat.triggerAttackRelease(0.03, time + beat * 0.58, 0.3);
      if (Math.random() < 0.3)
        bell.triggerAttackRelease(pick(MELODY), beat, time + (Math.random() < 0.5 ? 0 : beat / 2), rnd(0.2, 0.45));
      n += 1;
    }, '4n'),
  );
  loop.start(tr.nextSubdivision('4n'));
}

const BUILD: Record<TGen, TBuild> = {
  brown: (out, d) => noise(out, d, 'brown', 1, 1100),
  pink: (out, d) => noise(out, d, 'pink', 0.55, 6000),
  white: (out, d) => noise(out, d, 'white', 0.28, 8000),
  rain: (out, d) => {
    drift(d, noise(out, d, 'pink', 0.5, 5200, 320).frequency, 0.07, 3600, 6400);
    noise(out, d, 'brown', 0.3, 240);
    specks(out, d, { every: 0.045, chance: 0.35, decay: 0.035, lo: 1800, hi: 5200, gain: 0.5 });
  },
  cafe: (out, d) => {
    noise(out, d, 'brown', 0.3, 180);
    const murmur = keep(d, new Filter({ frequency: 480, type: 'bandpass', Q: 0.7 }));
    const chatter = keep(d, new Filter({ frequency: 1100, type: 'bandpass', Q: 1.4 }));
    const n = keep(d, new Noise('pink'));
    n.fan(murmur, chatter);
    murmur.chain(keep(d, new Gain(0.9)), out);
    chatter.chain(keep(d, new Gain(0.22)), out);
    n.start();
    drift(d, murmur.frequency, 0.13, 320, 720);
    drift(d, chatter.frequency, 0.21, 800, 1500);
    const room = keep(d, new Reverb({ decay: 1.6, wet: 0.4 }));
    const pan = keep(d, new Panner(0));
    const cup = keep(
      d,
      new Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 } }),
    );
    cup.chain(pan, room, out);
    const loop = keep(
      d,
      new Loop((time) => {
        pan.pan.setValueAtTime(rnd(-0.7, 0.7), time);
        const f = rnd(2200, 3600);
        cup.triggerAttackRelease(f, 0.12, time, rnd(0.04, 0.14));
        if (Math.random() < 0.4) cup.triggerAttackRelease(f * 1.07, 0.1, time + 0.09, rnd(0.03, 0.1));
      }, 0.5),
    );
    loop.probability = 0.07;
    loop.start(getContext().transport.seconds + 1);
  },
  fire: (out, d) => {
    const flicker = keep(d, new Gain(0.8));
    flicker.connect(out);
    drift(d, noise(flicker, d, 'brown', 1, 480).frequency, 0.4, 380, 620);
    keep(d, new LFO({ frequency: 0.6, min: 0.55, max: 1 }))
      .connect(flicker.gain)
      .start();
    noise(out, d, 'pink', 0.04, 9000, 3000);
    specks(out, d, { every: 0.06, chance: 0.18, decay: 0.012, lo: 1800, hi: 4200, gain: 0.55, type: 'highpass' });
    specks(out, d, { every: 0.4, chance: 0.12, decay: 0.05, lo: 600, hi: 1200, gain: 0.6 });
  },
  lofi,
};

export function levels(want: Partial<Record<TGen, number>>, volume: number): void {
  if (!tone || !bus) return;
  gen += 1;
  for (const [id, layer] of layers) {
    if (want[id]) continue;
    layers.delete(id);
    layer.out.gain.rampTo(0, LAYER_S);
    setTimeout(
      () => {
        free(layer.d);
      },
      LAYER_S * 1000 + 200,
    );
  }
  for (const [id, level] of Object.entries(want) as Array<[TGen, number]>) {
    let layer = layers.get(id);
    if (!layer) {
      const d: IDisposable[] = [];
      layer = { out: keep(d, new Gain(0)).connect(bus), d };
      layers.set(id, layer);
      BUILD[id](layer.out, d);
      transport();
    }
    layer.out.gain.rampTo(amp(level), LAYER_S);
  }
  bus.gain.rampTo(amp(volume), FADE_IN_S);
  void sink?.play().catch(() => {
    // No media element after all: play straight to the speakers.
    bus?.disconnect();
    bus?.toDestination();
    sink = null;
  });
}

export function fadeOut(quick = false): Promise<void> {
  const s = quick ? 0.25 : FADE_OUT_S;
  const mine = ++gen;
  bus?.gain.rampTo(0, s);
  return new Promise((resolve) => {
    setTimeout(
      () => {
        resolve();
        if (mine !== gen) return;
        for (const layer of layers.values()) free(layer.d);
        layers.clear();
        sink?.pause();
      },
      s * 1000 + 100,
    );
  });
}

export function volume(v: number): void {
  if (layers.size) bus?.gain.rampTo(amp(v), 0.15);
}

// End sounds, each under 2.5 s, straight to the speakers so they are heard even while focus sound is paused.
export function chime(id: TChimeId, vol: number): void {
  if (!tone) return;
  const d: IDisposable[] = [];
  const t = tone.now() + 0.05;
  const out = keep(d, new Gain(amp(vol) * 0.9)).toDestination();
  const room = keep(d, new Reverb({ decay: 2, wet: 0.25 }));
  room.connect(out);
  if (id === 'bell') {
    const b = keep(
      d,
      new PolySynth(FMSynth, {
        harmonicity: 3.01,
        modulationIndex: 12,
        envelope: { attack: 0.002, decay: 1.8, sustain: 0, release: 0.3 },
        modulationEnvelope: { attack: 0.002, decay: 0.8, sustain: 0, release: 0.2 },
        volume: -9,
      }),
    );
    b.connect(room);
    b.triggerAttackRelease('E5', 1.6, t, 0.7);
    b.triggerAttackRelease('B5', 1.4, t + 0.42, 0.5);
  } else if (id === 'soft') {
    const s = keep(
      d,
      new PolySynth(Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.22, decay: 1.2, sustain: 0, release: 0.7 },
        volume: -8,
      }),
    );
    s.connect(room);
    ['G4', 'D5', 'B4', 'F#5'].forEach((note, i) => {
      s.triggerAttackRelease(note, 1.1, t + i * 0.12, 0.6);
    });
  } else if (id === 'digital') {
    const s = keep(
      d,
      new Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.003, decay: 0.1, sustain: 0, release: 0.05 },
      }),
    );
    s.volume.value = -8;
    s.chain(keep(d, new Filter({ frequency: 3500, type: 'lowpass' })), out);
    [0, 0.13, 0.5, 0.63].forEach((at, i) => {
      s.triggerAttackRelease(i % 2 ? 'E6' : 'A5', 0.08, t + at, 0.7);
    });
  } else {
    // Two birds calling back and forth: quick sine chirps that sweep up, then down.
    const calls: Array<[number, number, number, number]> = [
      [0, 2600, 3900, -0.4],
      [0.14, 2700, 4000, -0.4],
      [0.28, 2800, 4100, -0.4],
      [0.75, 4200, 3000, 0.45],
      [0.92, 4300, 3100, 0.45],
      [1.3, 3200, 3600, -0.3],
      [1.38, 3250, 3650, -0.3],
      [1.46, 3300, 3700, -0.3],
      [1.54, 3350, 3750, -0.3],
    ];
    for (const [at, f0, f1, p] of calls) {
      const pan = keep(d, new Panner(p));
      const s = keep(
        d,
        new Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.006, decay: 0.07, sustain: 0, release: 0.03 },
        }),
      );
      s.volume.value = -12;
      s.chain(pan, room);
      s.triggerAttackRelease(f0, 0.07, t + at, 0.7);
      s.frequency.exponentialRampToValueAtTime(f1, t + at + 0.07);
    }
  }
  setTimeout(() => {
    free(d);
  }, 3400);
}

// A soft wooden tick-tock on the second, quiet under everything else.
export function tick(on: boolean, vol: number): void {
  if (!tone) return;
  if (!on) {
    if (ticker) free(ticker);
    ticker = null;
    return;
  }
  if (ticker) return;
  const d: IDisposable[] = [];
  const g = keep(d, new Gain(amp(vol) * 0.35)).toDestination();
  const s = keep(
    d,
    new MembraneSynth({ pitchDecay: 0.008, octaves: 2, envelope: { attack: 0.001, decay: 0.045, sustain: 0 } }),
  );
  s.chain(keep(d, new Filter({ frequency: 600, type: 'highpass' })), g);
  let tock = false;
  const tr = getContext().transport;
  keep(
    d,
    new Loop((time) => {
      s.triggerAttackRelease(tock ? 'D5' : 'G5', 0.03, time, 0.6);
      tock = !tock;
    }, 1),
  ).start(tr.seconds + (1000 - (Date.now() % 1000)) / 1000);
  transport();
  ticker = d;
}
