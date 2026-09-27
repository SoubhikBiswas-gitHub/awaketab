import { WEBM_DATA_URL } from './assets/blank.webm.b64.js';

export interface IFallbackHandle {
  el: HTMLVideoElement;
  play(): Promise<void>;
  pause(): void;
  remove(): void;
  startNudge(ms: number): void;
  stopNudge(): void;
}

export function createFallbackVideo(doc: Document, sources: { webm?: string; mp4?: string } = {}): IFallbackHandle {
  const v = doc.createElement('video');
  v.muted = true;
  v.loop = true;
  v.playsInline = true;
  v.autoplay = false;
  v.preload = 'auto';
  v.setAttribute('muted', '');
  v.setAttribute('playsinline', '');
  v.setAttribute('webkit-playsinline', '');
  v.setAttribute('aria-hidden', 'true');
  v.setAttribute('hidden', '');
  v.title = 'AwakeTab keeps the screen awake';
  v.disablePictureInPicture = true;
  v.style.cssText =
    'position:fixed;inset-inline-start:0;inset-block-end:0;inline-size:1px;block-size:1px;opacity:0.01;pointer-events:none';
  // The MP4 is opt-in (`@awaketab/wake/video`) so the default build stays inside its size budget.
  let last: HTMLSourceElement | null = null;
  for (const [type, src] of [
    ['video/webm', sources.webm ?? WEBM_DATA_URL],
    ['video/mp4', sources.mp4],
  ] as const) {
    if (!src) continue;
    last = doc.createElement('source');
    last.type = type;
    last.src = src;
    v.appendChild(last);
  }
  doc.body.appendChild(v);
  let nudgeTimer: ReturnType<typeof setInterval> | null = null;

  const play = () => {
    v.muted = true;
    return new Promise<void>((resolve, reject) => {
      // play() never settles once every <source> has failed, so the last source's error rejects it instead.
      if (last)
        last.onerror = () => {
          reject(new Error('no source'));
        };
      v.play().then(resolve, reject);
    });
  };

  return {
    el: v,
    play,
    pause() {
      v.pause();
    },
    startNudge(ms: number) {
      if (nudgeTimer) return;
      nudgeTimer = setInterval(() => {
        if (v.paused || v.ended || v.readyState < 2) {
          v.currentTime = 0;
          void play().catch(() => undefined);
        }
      }, ms);
    },
    stopNudge() {
      if (nudgeTimer) {
        clearInterval(nudgeTimer);
        nudgeTimer = null;
      }
    },
    remove() {
      if (nudgeTimer) {
        clearInterval(nudgeTimer);
        nudgeTimer = null;
      }
      v.pause();
      v.remove();
    },
  };
}
