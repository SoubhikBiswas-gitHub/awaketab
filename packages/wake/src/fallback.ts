import { MP4_DATA_URL } from './assets/blank.mp4.b64.js';
import { WEBM_DATA_URL } from './assets/blank.webm.b64.js';

export interface IFallbackHandle {
  el: HTMLVideoElement;
  play(): Promise<void>;
  pause(): void;
  nudge(): void;
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
  const webm = sources.webm ?? WEBM_DATA_URL;
  const mp4 = sources.mp4 ?? MP4_DATA_URL;
  for (const [type, src] of [
    ['video/webm', webm],
    ['video/mp4', mp4],
  ] as const) {
    const s = doc.createElement('source');
    s.type = type;
    s.src = src;
    v.appendChild(s);
  }
  doc.body.appendChild(v);
  let nudgeTimer: ReturnType<typeof setInterval> | null = null;

  const play = () => {
    v.muted = true;
    return v.play();
  };

  return {
    el: v,
    play,
    pause() {
      v.pause();
    },
    nudge() {
      if (v.paused || v.ended || v.readyState < 2) {
        v.currentTime = 0;
        void play();
      }
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
